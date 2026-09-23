// ==UserScript==
// @name        Convert trang
// @namespace   https://miinty0.github.io
// @version     3
// @updateURL   https://github.com/miinty0/draft/raw/refs/heads/main/D%E1%BB%8Bch%20convert%20trang.user.js
// @downloadURL https://github.com/miinty0/draft/raw/refs/heads/main/D%E1%BB%8Bch%20convert%20trang.user.js
// @description Convert trên mọi trang; hỗ trợ nội dung động, cache, Việt/Hán Việt và khôi phục bản gốc.
// @author      Minty
// @match       http://*/*
// @match       https://*/*
// @exclude     https://dichngay.com*
// @connect     dichngay.com
// @grant       GM_xmlhttpRequest
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand

// @noframes
// @run-at document-idle
// ==/UserScript==
(function() {
	'use strict';
	const VERSION = '1.0.1';
	const API_URL = 'https://dichngay.com/translate/text';
	const CACHE_KEY = 'dn_page_translator_cache_v1';
	const SETTINGS_KEY = 'dn_page_translator_settings_v1';
	const MAX_CACHE_ITEMS = 50000;
	const MAX_BATCH_ITEMS = 50;
	const MAX_BATCH_CHARS = 50000;
	const MAX_CONCURRENT = 3;
	const REQUEST_TIMEOUT_MS = 30000;
	const MAX_RETRIES = 2;
	const DYNAMIC_DEBOUNCE_MS = 650;
	const HAN_RE = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
	const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'SELECT', 'IFRAME', 'CANVAS']);
	const ATTRIBUTE_NAMES = ['title', 'placeholder', 'aria-label', 'alt'];
	const originalText = new WeakMap();
	const knownTextNodes = new Set();
	const originalAttrs = new WeakMap();
	const knownAttrElements = new Set();
	const pendingRoots = new Set();
	const activeRequests = new Set();
	let settings = loadSettings();
	let cache = loadCache();
	let cacheDirty = false;
	let cacheSaveTimer = null;
	let observer = null;
	let dynamicTimer = null;
	let runGeneration = 0;
	let translating = false;
	let translatedMode = null;
	let panelOpen = false;
	let stats = freshStats();
	let ui = null;

	function freshStats() {
		return {
			found: 0,
			done: 0,
			cached: 0,
			failed: 0,
			requests: 0
		};
	}

	function loadSettings() {
		const fallback = {
			mode: 'vi',
			observeDynamic: true
		};
		try {
			const value = GM_getValue(SETTINGS_KEY, fallback);
			return value && typeof value === 'object' ? {
				...fallback,
				...value
			} : fallback;
		}
		catch (_) {
			return fallback;
		}
	}

	function saveSettings() {
		GM_setValue(SETTINGS_KEY, settings);
	}

	function loadCache() {
		try {
			const raw = GM_getValue(CACHE_KEY, {});
			return raw && typeof raw === 'object' ? new Map(Object.entries(raw)) : new Map();
		}
		catch (_) {
			return new Map();
		}
	}

	function scheduleCacheSave() {
		cacheDirty = true;
		clearTimeout(cacheSaveTimer);
		cacheSaveTimer = setTimeout(saveCache, 1200);
	}

	function saveCache() {
		clearTimeout(cacheSaveTimer);
		cacheSaveTimer = null;
		if(!cacheDirty) return;
		while(cache.size > MAX_CACHE_ITEMS) cache.delete(cache.keys().next().value);
		GM_setValue(CACHE_KEY, Object.fromEntries(cache));
		cacheDirty = false;
	}

	function cacheKey(mode, source) {
		return `${mode}\u0000${source}`;
	}

	function getCached(mode, source) {
		const key = cacheKey(mode, source);
		if(!cache.has(key)) return null;
		const value = cache.get(key);
		cache.delete(key);
		cache.set(key, value);
		return value;
	}

	function putCached(mode, source, translated) {
		const key = cacheKey(mode, source);
		cache.delete(key);
		cache.set(key, translated);
		scheduleCacheSave();
	}

	function isOurUi(node) {
		const element = node?.nodeType === Node.ELEMENT_NODE ? node : node?.parentElement;
		return Boolean(element?.closest?.('#dn-page-translator-host'));
	}

	function shouldSkipElement(element) {
		if(!element || element.nodeType !== Node.ELEMENT_NODE) return true;
		if(isOurUi(element)) return true;
		if(SKIP_TAGS.has(element.tagName)) return true;
		if(element.closest('script,style,noscript,code,pre,textarea,input,select,iframe,canvas')) return true;
		if(element.closest('[contenteditable="true"], [contenteditable=""]')) return true;
		return false;
	}

	function splitWhitespace(value) {
		const match = String(value).match(/^(\s*)([\s\S]*?)(\s*)$/);
		return {
			prefix: match?.[1] || '',
			core: match?.[2] || '',
			suffix: match?.[3] || ''
		};
	}

	function currentTextSource(node) {
		const record = originalText.get(node);
		if(!record) return node.data;
		if(node.data === record.translated) return record.original;
		if(node.data !== record.original) {
			record.original = node.data;
			record.translated = null;
		}
		return record.original;
	}

	function collectTextTargets(root, grouped) {
		if(!root) return;
		if(root.nodeType === Node.TEXT_NODE) {
			addTextTarget(root, grouped);
			return;
		}
		if(root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE) return;
		const owner = root.nodeType === Node.DOCUMENT_NODE ? root.documentElement : root;
		if(!owner || (owner.nodeType === Node.ELEMENT_NODE && shouldSkipElement(owner))) return;
		const walker = document.createTreeWalker(owner, NodeFilter.SHOW_TEXT, {
			acceptNode(node) {
				return shouldSkipElement(node.parentElement) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT;
			},
		});
		let node;
		while((node = walker.nextNode())) addTextTarget(node, grouped);
	}

	function addTextTarget(node, grouped) {
		if(!node?.isConnected || shouldSkipElement(node.parentElement)) return;
		const source = currentTextSource(node);
		const parts = splitWhitespace(source);
		if(!parts.core || !HAN_RE.test(parts.core)) return;
		const target = {
			type: 'text',
			node,
			source: parts.core,
			prefix: parts.prefix,
			suffix: parts.suffix
		};
		if(!grouped.has(parts.core)) grouped.set(parts.core, []);
		grouped.get(parts.core).push(target);
	}

	function collectAttributeTargets(root, grouped) {
		if(!root || (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE && root.nodeType !== Node.DOCUMENT_FRAGMENT_NODE)) return;
		const owner = root.nodeType === Node.DOCUMENT_NODE ? root.documentElement : root;
		if(!owner) return;
		const elements = [];
		if(owner.nodeType === Node.ELEMENT_NODE) elements.push(owner);
		if(owner.querySelectorAll) elements.push(...owner.querySelectorAll(ATTRIBUTE_NAMES.map(name => `[${name}]`).join(',')));
		for(const element of elements) {
			if(shouldSkipElement(element)) continue;
			let records = originalAttrs.get(element);
			for(const name of ATTRIBUTE_NAMES) {
				if(!element.hasAttribute(name)) continue;
				const current = element.getAttribute(name) || '';
				const old = records?.get(name);
				let source = current;
				if(old) {
					if(current === old.translated) source = old.original;
					else if(current !== old.original) {
						old.original = current;
						old.translated = null;
						source = current;
					}
					else source = old.original;
				}
				if(!source || !HAN_RE.test(source)) continue;
				const target = {
					type: 'attr',
					element,
					name,
					source
				};
				if(!grouped.has(source)) grouped.set(source, []);
				grouped.get(source).push(target);
			}
		}
	}

	function collectTargets(roots) {
		const grouped = new Map();
		for(const root of roots) {
			collectTextTargets(root, grouped);
			collectAttributeTargets(root, grouped);
		}
		return grouped;
	}

	function applyTranslation(target, translated) {
		if(target.type === 'text') {
			if(!target.node.isConnected) return;
			let record = originalText.get(target.node);
			if(!record) {
				record = {
					original: target.node.data,
					translated: null
				};
				originalText.set(target.node, record);
				knownTextNodes.add(target.node);
			}
			const output = target.prefix + translated + target.suffix;
			record.translated = output;
			target.node.data = output;
			return;
		}
		if(!target.element.isConnected) return;
		let records = originalAttrs.get(target.element);
		if(!records) {
			records = new Map();
			originalAttrs.set(target.element, records);
			knownAttrElements.add(target.element);
		}
		let record = records.get(target.name);
		if(!record) {
			record = {
				original: target.element.getAttribute(target.name) || '',
				translated: null
			};
			records.set(target.name, record);
		}
		record.translated = translated;
		target.element.setAttribute(target.name, translated);
	}

	function restoreOriginal() {
		stopTranslation(false);
		pauseObserver(() => {
			for(const node of [...knownTextNodes]) {
				const record = originalText.get(node);
				if(!node.isConnected) {
					knownTextNodes.delete(node);
					continue;
				}
				if(record && node.data === record.translated) node.data = record.original;
				if(record) record.translated = null;
			}
			for(const element of [...knownAttrElements]) {
				const records = originalAttrs.get(element);
				if(!element.isConnected) {
					knownAttrElements.delete(element);
					continue;
				}
				if(!records) continue;
				for(const [name, record] of records) {
					if(element.getAttribute(name) === record.translated) element.setAttribute(name, record.original);
					record.translated = null;
				}
			}
		});
		translatedMode = null;
		translating = false;
		setStatus('Đã hiện lại bản gốc.', 'ok');
		updateUi();
	}

	function pauseObserver(task) {
		observer?.disconnect();
		try {
			task();
		}
		finally {
			if(settings.observeDynamic) startObserver();
		}
	}

	function parseApiResponse(responseText, status) {
		if(status < 200 || status >= 300) throw new Error(`HTTP ${status || 0}`);
		let payload;
		try {
			payload = JSON.parse(responseText);
		}
		catch (_) {
			throw new Error('trả về JSON không hợp lệ');
		}
		if(Number(payload?.err) !== 0) {
			throw new Error(payload?.message || payload?.msg || `err=${payload?.err}`);
		}
		const output = payload?.data?.content;
		if(typeof output !== 'string') throw new Error('không trả về data.content');
		return output;
	}

	function gmApiRequest(body, tracker, nativeError) {
		return new Promise((resolve, reject) => {
			let request;
			const finish = () => activeRequests.delete(tracker);
			request = GM_xmlhttpRequest({
				method: 'POST',
				url: API_URL,
				headers: {
					Accept: 'application/json',
					'Content-Type': 'text/plain;charset=UTF-8',
				},
				data: body,
				timeout: REQUEST_TIMEOUT_MS,
				onload(response) {
					try {
						resolve(parseApiResponse(response.responseText, response.status));
					}
					catch (error) {
						reject(error);
					}
					finally {
						finish();
					}
				},
				onerror(response) {
					finish();
					const detail = [
						response?.status ? `HTTP ${response.status}` : '',
						response?.statusText || '',
						response?.error || '',
					].filter(Boolean).join(' · ');
					reject(new Error(`Không kết nối được qua fetch lẫn GM request${detail ? ` (${detail})` : ''}. Fetch: ${nativeError?.message || nativeError}`));
				},
				ontimeout() {
					finish();
					reject(new Error(`timeout sau ${REQUEST_TIMEOUT_MS / 1000}s`));
				},
				onabort() {
					finish();
					reject(new Error('Đã dừng request'));
				},
			});
			tracker.gmRequest = request;
		});
	}

	function apiRequest(content, mode) {
		const body = JSON.stringify({
			content,
			tl: mode
		});
		const controller = new AbortController();
		const tracker = {
			aborted: false,
			gmRequest: null,
			abort() {
				this.aborted = true;
				controller.abort();
				this.gmRequest?.abort?.();
			},
		};
		activeRequests.add(tracker);
		const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
		return fetch(API_URL, {
			method: 'POST',
			mode: 'cors',
			credentials: 'omit',
			cache: 'no-store',
			headers: {
				'Content-Type': 'text/plain;charset=UTF-8'
			},
			body,
			signal: controller.signal,
		}).then(async response => {
				clearTimeout(timeoutId);
				try {
					const text = await response.text();
					return parseApiResponse(text, response.status);
				}
				finally {
					activeRequests.delete(tracker);
				}
			},
			error => {
				clearTimeout(timeoutId);
				if(tracker.aborted) {
					activeRequests.delete(tracker);
					throw new Error('Đã dừng request ');
				}
				return gmApiRequest(body, tracker, error);
			});
	}
	async function apiRequestWithRetry(content, mode, generation) {
		let lastError;
		for(let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
			if(generation !== runGeneration) throw new Error('Đã dừng');
			try {
				stats.requests++;
				updateUi();
				return await apiRequest(content, mode);
			}
			catch (error) {
				lastError = error;
				if(generation !== runGeneration || attempt === MAX_RETRIES) break;
				await new Promise(resolve => setTimeout(resolve, 700 * (attempt + 1)));
			}
		}
		throw lastError;
	}

	function buildBatches(entries) {
		const batches = [];
		let current = [];
		let size = 0;
		for(const entry of entries) {
			const addition = entry.source.length + 34;
			if(current.length && (current.length >= MAX_BATCH_ITEMS || size + addition > MAX_BATCH_CHARS)) {
				batches.push(current);
				current = [];
				size = 0;
			}
			current.push(entry);
			size += addition;
		}
		if(current.length) batches.push(current);
		return batches;
	}

	function batchPayload(batch) {
		const token = `___DNSEP_${Math.random().toString(36).slice(2, 10)}___`;
		return {
			token,
			content: batch.map(item => item.source).join(`\n${token}\n`)
		};
	}

	function splitBatchResult(output, token, expected) {
		const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
		const parts = output.split(new RegExp(`\\s*${escaped}\\s*`));
		return parts.length === expected ? parts : null;
	}
	async function translateOne(entry, mode, generation) {
		const output = await apiRequestWithRetry(entry.source, mode, generation);
		putCached(mode, entry.source, output);
		return output;
	}
	async function translateBatch(batch, mode, generation) {
		if(batch.length === 1) return [await translateOne(batch[0], mode, generation)];
		const packed = batchPayload(batch);
		const output = await apiRequestWithRetry(packed.content, mode, generation);
		const parts = splitBatchResult(output, packed.token, batch.length);
		if(parts) {
			parts.forEach((part, index) => putCached(mode, batch[index].source, part));
			return parts;
		}
		console.warn('[Convert] Dấu tách batch bị thay đổi; chuyển sang từng đoạn.');
		const results = [];
		for(const entry of batch) results.push(await translateOne(entry, mode, generation));
		return results;
	}
	async function runPool(items, worker, generation) {
		let cursor = 0;
		const runners = Array.from({
			length: Math.min(MAX_CONCURRENT, items.length)
		}, async () => {
			while(cursor < items.length && generation === runGeneration) {
				const index = cursor++;
				await worker(items[index], index);
			}
		});
		await Promise.all(runners);
	}
	async function translateRoots(roots, options = {}) {
		const mode = options.mode || settings.mode;
		const isPrimaryRun = options.primary !== false;
		const generation = isPrimaryRun ? ++runGeneration : runGeneration;
		if(isPrimaryRun) {
			for(const request of activeRequests) request.abort?.();
			activeRequests.clear();
			stats = freshStats();
			translating = true;
			translatedMode = mode;
			setStatus(`Đang quét trang · ${modeLabel(mode)}…`, 'busy');
		}
		const grouped = collectTargets(roots);
		stats.found += grouped.size;
		const unresolved = [];
		pauseObserver(() => {
			for(const [source, targets] of grouped) {
				const cached = getCached(mode, source);
				if(cached !== null) {
					for(const target of targets) applyTranslation(target, cached);
					stats.cached++;
					stats.done++;
				}
				else {
					unresolved.push({
						source,
						targets
					});
				}
			}
		});
		updateUi();
		if(generation !== runGeneration) return;
		const batches = buildBatches(unresolved);
		await runPool(batches, async batch => {
			if(generation !== runGeneration) return;
			try {
				const outputs = await translateBatch(batch, mode, generation);
				if(generation !== runGeneration) return;
				pauseObserver(() => {
					batch.forEach((entry, index) => {
						for(const target of entry.targets) applyTranslation(target, outputs[index]);
						stats.done++;
					});
				});
			}
			catch (error) {
				if(generation === runGeneration) {
					stats.failed += batch.length;
					console.warn('[Convert]', error);
				}
			}
			updateUi();
		}, generation);
		if(generation !== runGeneration) return;
		saveCache();
		if(isPrimaryRun) translating = false;
		const suffix = stats.failed ? ` · ${stats.failed} lỗi` : '';
		setStatus(`Xong ${stats.done}/${stats.found} đoạn${suffix}.`, stats.failed ? 'warn' : 'ok');
		updateUi();
		if(pendingRoots.size > 0 && settings.observeDynamic) {
			clearTimeout(dynamicTimer);
			dynamicTimer = setTimeout(flushDynamicRoots, DYNAMIC_DEBOUNCE_MS);
		}
	}

	function stopTranslation(showMessage = true) {
		runGeneration++;
		for(const request of activeRequests) request.abort?.();
		activeRequests.clear();
		translating = false;
		if(showMessage) setStatus('Đã dừng.', 'warn');
		updateUi();
	}

	function queueDynamicRoot(root) {
		if(!translatedMode || !settings.observeDynamic || isOurUi(root)) return;
		pendingRoots.add(root.nodeType === Node.TEXT_NODE ? root.parentElement : root);
		clearTimeout(dynamicTimer);
		dynamicTimer = setTimeout(flushDynamicRoots, DYNAMIC_DEBOUNCE_MS);
	}
	async function flushDynamicRoots() {
		clearTimeout(dynamicTimer);
		dynamicTimer = null;
		if(!translatedMode || translating || pendingRoots.size === 0) return;
		const roots = [...pendingRoots].filter(Boolean);
		pendingRoots.clear();
		try {
			await translateRoots(roots, {
				mode: translatedMode,
				primary: false
			});
		}
		catch (error) {
			console.warn('[Convert] Lỗi nội dung động:', error);
		}
	}

	function startObserver() {
		observer?.disconnect();
		if(!settings.observeDynamic || !document.body) return;
		observer = observer || new MutationObserver(mutations => {
			for(const mutation of mutations) {
				if(mutation.type === 'characterData') {
					if(!isOurUi(mutation.target)) queueDynamicRoot(mutation.target);
					continue;
				}
				for(const node of mutation.addedNodes) queueDynamicRoot(node);
				if(mutation.type === 'attributes') queueDynamicRoot(mutation.target);
			}
		});
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true,
			attributeFilter: ATTRIBUTE_NAMES,
		});
	}

	function modeLabel(mode = settings.mode) {
		return mode === 'hv' ? 'Hán Việt' : 'Việt';
	}

	function setStatus(message, type = '') {
		if(!ui) return;
		ui.status.textContent = message;
		ui.status.dataset.type = type;
	}

	function updateUi() {
		if(!ui) return;
		ui.mode.value = settings.mode;
		ui.observe.checked = settings.observeDynamic;
		ui.translate.disabled = translating;
		ui.stop.disabled = !translating && activeRequests.size === 0;
		ui.restore.disabled = !translatedMode;
		ui.progress.textContent = stats.found ? `${stats.done}/${stats.found} · cache ${stats.cached} · request ${stats.requests}${stats.failed ? ` · lỗi ${stats.failed}` : ''}` : 'Chưa quét trang';
		ui.badge.textContent = translatedMode ? (translatedMode === 'hv' ? 'HV' : 'VI') : 'Cv.';
		ui.badge.dataset.active = translatedMode ? '1' : '0';
	}

	function createUi() {
		const host = document.createElement('div');
		host.id = 'dn-page-translator-host';
		host.style.cssText = 'all:initial;position:fixed;right:18px;bottom:18px;z-index:2147483647;font-family:system-ui,-apple-system,Segoe UI,sans-serif;';
		const shadow = host.attachShadow({
			mode: 'open'
		});
		shadow.innerHTML = `
 <style>
 *{box-sizing:border-box}button,select,input{font:inherit}
 .badge{width:46px;height:46px;border:0;border-radius:50%;background:#20242c;color:#fff;box-shadow:0 6px 22px #0005;cursor:pointer;font-weight:800;font-size:16px}
 .badge[data-active="1"]{background:#1677ff}
 .panel{display:none;position:absolute;right:0;bottom:56px;width:290px;padding:14px;border:1px solid #ffffff25;border-radius:14px;background:#171a20;color:#eef2f7;box-shadow:0 12px 36px #0008;font-size:13px;line-height:1.4}
 .panel.open{display:block}.title{display:flex;justify-content:space-between;align-items:center;margin-bottom:11px;font-weight:750;font-size:14px}.ver{color:#8d96a5;font-size:10px}
 .row{display:flex;gap:8px;align-items:center;margin:8px 0}.row label{color:#bfc7d4;min-width:75px}
 select{flex:1;border:1px solid #394150;border-radius:8px;background:#242933;color:#fff;padding:7px}
 .check{display:flex;gap:8px;align-items:center;color:#cbd3df;margin:10px 0}.check input{accent-color:#1677ff}
 .actions{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:11px}
 button.action{border:1px solid #3a4352;border-radius:8px;background:#252b35;color:#fff;padding:8px 7px;cursor:pointer}
 button.action.primary{background:#1677ff;border-color:#1677ff}button.action:disabled{opacity:.45;cursor:default}
 .status{margin-top:10px;padding:8px;border-radius:8px;background:#222831;color:#cdd5e1;min-height:34px}.status[data-type="ok"]{color:#8ee6aa}.status[data-type="warn"]{color:#ffd27c}.status[data-type="busy"]{color:#8fc2ff}
 .progress{margin-top:7px;color:#8d96a5;font-size:11px}.note{margin-top:9px;color:#7f8998;font-size:10px}
 </style>
 <button class="badge" title="Convert">Cv.</button>
 <section class="panel">
 <div class="title"><span>Convert</span><span class="ver">v${VERSION}</span></div>
 <div class="row"><label>Kiểu </label><select><option value="vi">Việt</option><option value="hv">Hán Việt</option></select></div>
 <label class="check"><input type="checkbox"> Tự động cho nội dung mới</label>
 <div class="actions">
 <button class="action primary" data-action="translate">Convert</button>
 <button class="action" data-action="stop">Dừng</button>
 <button class="action" data-action="restore">Bản gốc</button>
 <button class="action" data-action="clear">Xóa cache</button>
 </div>
 <div class="status">Sẵn sàng.</div>
 <div class="progress">Chưa quét trang</div>
 </section>`;
		document.documentElement.appendChild(host);
		ui = {
			host,
			badge: shadow.querySelector('.badge'),
			panel: shadow.querySelector('.panel'),
			mode: shadow.querySelector('select'),
			observe: shadow.querySelector('input[type="checkbox"]'),
			translate: shadow.querySelector('[data-action="translate"]'),
			stop: shadow.querySelector('[data-action="stop"]'),
			restore: shadow.querySelector('[data-action="restore"]'),
			clear: shadow.querySelector('[data-action="clear"]'),
			status: shadow.querySelector('.status'),
			progress: shadow.querySelector('.progress'),
		};
		ui.badge.addEventListener('click', () => {
			panelOpen = !panelOpen;
			ui.panel.classList.toggle('open', panelOpen);
		});
		ui.mode.addEventListener('change', () => {
			settings.mode = ui.mode.value;
			saveSettings();
		});
		ui.observe.addEventListener('change', () => {
			settings.observeDynamic = ui.observe.checked;
			saveSettings();
			if(settings.observeDynamic) startObserver();
			else observer?.disconnect();
		});
		ui.translate.addEventListener('click', () => translateRoots([document], {
			mode: settings.mode,
			primary: true
		}));
		ui.stop.addEventListener('click', () => stopTranslation());
		ui.restore.addEventListener('click', restoreOriginal);
		ui.clear.addEventListener('click', () => {
			cache.clear();
			cacheDirty = true;
			saveCache();
			setStatus('Đã xóa cache.', 'ok');
			updateUi();
		});
		updateUi();
	}

	function registerMenus() {
		if(typeof GM_registerMenuCommand !== 'function') return;
		GM_registerMenuCommand('Convert → Việt', () => {
			settings.mode = 'vi';
			saveSettings();
			translateRoots([document], {
				mode: 'vi',
				primary: true
			});
		});
		GM_registerMenuCommand('Convert → Hán Việt', () => {
			settings.mode = 'hv';
			saveSettings();
			translateRoots([document], {
				mode: 'hv',
				primary: true
			});
		});
		GM_registerMenuCommand('Hiện lại bản gốc', restoreOriginal);
		GM_registerMenuCommand('Dừng ', () => stopTranslation());
	}
	createUi();
	registerMenus();
	if(settings.observeDynamic) startObserver();
	console.info(`[Convert] v${VERSION} sẵn sàng · ${location.hostname}`);
})();
