// ==UserScript==
// @name         Dịch convert trang
// @author       QuocBao (stripped and made it fabulous by Minty)
// @namespace    http://tampermonkey.net/
// @version      1.5.0
// @description  Dịch trang
// @match        *://*/*
// @grant        GM_registerMenuCommand
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      dichngay.com
// ==/UserScript==
(function () {
    'use strict';
    /* ================== CONFIG ================== */
    const DEFAULT_CONFIG = {
        serverUrl: 'https://dichngay.com/translate/text',
        targetLang: 'vi',
        delayMs: 400,
        retryCount: 3,
        maxCharsPerRequest: 4500,
        activeNameSet: 'Mặc định',
        nameSets: { 'Mặc định': {} },
    };
    function loadConfig() {
        const c = GM_getValue('tm_mini_config');
        if (!c) {
            GM_setValue('tm_mini_config', DEFAULT_CONFIG);
            return JSON.parse(JSON.stringify(DEFAULT_CONFIG));
        }
        const merged = { ...DEFAULT_CONFIG, ...c };
        merged.nameSets = { ...DEFAULT_CONFIG.nameSets, ...(c.nameSets || {}) };
        if (!merged.activeNameSet || !merged.nameSets[merged.activeNameSet]) {
            merged.activeNameSet = Object.keys(merged.nameSets)[0] || 'Mặc định';
        }
        return merged;
    }
    function saveConfig(cfg) {
        GM_setValue('tm_mini_config', cfg);
    }
    let config = loadConfig();
    /* ================== STATE ================== */
    let translationCache = {};
    let isTranslating = false;
    let isTranslated = false;
    let originalScrollPosition = 0;
    let liveItemsMap = [];
    /* ================== UTILITIES ================== */
    const sleep = ms => new Promise(r => setTimeout(r, ms));
    function escapeHtml(s) {
        return String(s || '')
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }
    function capitalizeFirstLetter(s) {
        if (typeof s !== 'string' || !s) return s;
        return s.replace(/(^|[\.?!])(\s*["'"'(\[]*)(\p{L})/gu, (match, p1, p2, p3) => {
            return p1 + p2 + p3.toUpperCase();
        });
    }
    /* ================== UI ================== */
    let btnPos = { right: 18, bottom: 18 };
    function injectCSS() {
        if (document.getElementById('tm-mini-styles')) return;
        const css = `
            @keyframes tm-pop-in {
                0%   { opacity: 0; transform: scale(0.7) translateY(6px); }
                70%  { transform: scale(1.06) translateY(-1px); }
                100% { opacity: 1; transform: scale(1) translateY(0); }
            }
            #tm-float-btn {
                --tm-glow: rgba(74, 222, 128, 0.45);
                position: fixed;
                display: flex; align-items: center; gap: 6px;
                padding: 0 14px 0 10px;
                height: 36px;
                border-radius: 999px;
                background: rgba(15, 15, 20, 0.82);
                backdrop-filter: blur(14px) saturate(160%);
                -webkit-backdrop-filter: blur(14px) saturate(160%);
                border: 1px solid rgba(255,255,255,0.10);
                box-shadow:
                    0 2px 12px rgba(0,0,0,0.35),
                    inset 0 1px 0 rgba(255,255,255,0.08);
                color: #e8e8e8;
                font-family: system-ui, -apple-system, sans-serif;
                font-size: 11.5px;
                font-weight: 600;
                letter-spacing: 0.03em;
                cursor: grab;
                user-select: none;
                -webkit-user-select: none;
                z-index: 2147483640;
                animation: tm-pop-in 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards;
                transition:
                    background   0.2s ease,
                    box-shadow   0.2s ease,
                    border-color 0.2s ease;
                white-space: nowrap;
                overflow: hidden;
            }
            #tm-float-btn.tm-translate {
                --tm-glow: rgba(74, 222, 128, 0.45);
                border-color: rgba(74, 222, 128, 0.22);
            }
            #tm-float-btn.tm-translate .tm-btn-dot {
                background: #4ade80;
                box-shadow: 0 0 6px 1px rgba(74,222,128,0.7);
            }
            #tm-float-btn.tm-restore {
                --tm-glow: rgba(251, 191, 36, 0.4);
                border-color: rgba(251, 191, 36, 0.22);
            }
            #tm-float-btn.tm-restore .tm-btn-dot {
                background: #fbbf24;
                box-shadow: 0 0 6px 1px rgba(251,191,36,0.7);
            }
            #tm-float-btn:not(.tm-dragging):hover {
                background: rgba(25, 25, 32, 0.92);
                box-shadow:
                    0 4px 20px rgba(0,0,0,0.45),
                    inset 0 1px 0 rgba(255,255,255,0.12);
            }
            #tm-float-btn.tm-dragging {
                cursor: grabbing;
                background: rgba(25, 25, 32, 0.96);
                box-shadow: 0 8px 28px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
                transform: scale(1.04);
            }
            .tm-btn-dot {
                width: 7px; height: 7px;
                border-radius: 50%;
                flex-shrink: 0;
                transition: background 0.2s, box-shadow 0.2s;
            }
            .tm-btn-icon {
                display: flex; align-items: center; justify-content: center;
                width: 15px; height: 15px;
                flex-shrink: 0;
                opacity: 0.88;
            }
            .tm-btn-label {
                line-height: 1;
                opacity: 0.88;
                animation: tm-spin-icon 0.22s ease forwards;
            }
            #tm-loading {
                position: fixed; top: 14px; left: 50%; transform: translateX(-50%);
                display: flex; align-items: center; gap: 9px;
                background: rgba(15,15,20,0.88);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                color: #e8e8e8;
                padding: 8px 16px 8px 12px;
                border-radius: 999px;
                border: 1px solid rgba(255,255,255,0.09);
                z-index: 2147483647;
                font-size: 12.5px;
                font-weight: 500;
                letter-spacing: 0.02em;
                box-shadow: 0 4px 20px rgba(0,0,0,0.3);
                font-family: system-ui, -apple-system, sans-serif;
                animation: tm-pop-in 0.25s ease forwards;
            }
            #tm-loading::before {
                content: '';
                width: 7px; height: 7px;
                border-radius: 50%;
                background: #4ade80;
                box-shadow: 0 0 6px rgba(74,222,128,0.8);
                flex-shrink: 0;
            }
        `;
        const el = document.createElement('style');
        el.id = 'tm-mini-styles';
        el.textContent = css;
        document.head.appendChild(el);
    }
    function injectButtonFix() {
        if (document.getElementById('tm-btn-fix')) return;
        const css = `
            a, button, [role="button"] {
                max-width: none !important;
                overflow: visible !important;
                white-space: normal !important;
                text-overflow: clip !important;
            }
        `;
        const el = document.createElement('style');
        el.id = 'tm-btn-fix';
        el.textContent = css;
        document.head.appendChild(el);
    }
    function removeButtonFix() {
        document.getElementById('tm-btn-fix')?.remove();
    }
    function showLoading(msg) {
        removeElementById('tm-loading');
        const div = document.createElement('div');
        div.id = 'tm-loading';
        div.textContent = msg;
        document.body.appendChild(div);
    }
    function removeLoading() { removeElementById('tm-loading'); }
    function removeElementById(id) { document.getElementById(id)?.remove(); }
    const ICON_TRANSLATE = `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v2h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>`;
    const ICON_RESTORE   = `<svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor"><path d="M12 5V1L7 6l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6H4c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z"/></svg>`;
    function ensureFloatBtn() {
        if (document.getElementById('tm-float-btn')) return;
        const btn = document.createElement('div');
        btn.id = 'tm-float-btn';
        applyBtnPosition(btn);
        document.body.appendChild(btn);
        makeDraggable(btn);
    }
    function applyBtnPosition(btn) {
        btn.style.right  = btnPos.right  + 'px';
        btn.style.bottom = btnPos.bottom + 'px';
        btn.style.left   = '';
        btn.style.top    = '';
    }
    function updateFloatingButtons() {
        ensureFloatBtn();
        const btn = document.getElementById('tm-float-btn');
        if (!btn) return;
        if (!isTranslated) {
            btn.className = 'tm-translate';
            btn.title     = 'Dịch trang này';
            btn.innerHTML = `
                <span class="tm-btn-dot"></span>
                <span class="tm-btn-icon">${ICON_TRANSLATE}</span>
                <span class="tm-btn-label">Dịch</span>`;
            btn._action   = startTranslateAction;
        } else {
            btn.className = 'tm-restore';
            btn.title     = 'Quay về trang gốc';
            btn.innerHTML = `
                <span class="tm-btn-dot"></span>
                <span class="tm-btn-icon">${ICON_RESTORE}</span>
                <span class="tm-btn-label">Gốc</span>`;
            btn._action   = restoreOriginalPage;
        }
    }
    function makeDraggable(btn) {
        let dragging = false;
        let dragMoved = false;
        let startX, startY, startRight, startBottom;
        btn.addEventListener('pointerdown', e => {
            if (e.button !== 0) return;
            e.preventDefault();
            btn.setPointerCapture(e.pointerId);
            dragging  = true;
            dragMoved = false;
            startX = e.clientX;
            startY = e.clientY;
            startRight  = btnPos.right;
            startBottom = btnPos.bottom;
            btn.classList.add('tm-dragging');
        });
        btn.addEventListener('pointermove', e => {
            if (!dragging) return;
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
            const newRight  = Math.max(0, Math.min(window.innerWidth  - 48, startRight  - dx));
            const newBottom = Math.max(0, Math.min(window.innerHeight - 48, startBottom - dy));
            btnPos.right  = newRight;
            btnPos.bottom = newBottom;
            applyBtnPosition(btn);
        });
        btn.addEventListener('pointerup', e => {
            if (!dragging) return;
            dragging = false;
            btn.classList.remove('tm-dragging');
            if (!dragMoved && typeof btn._action === 'function') {
                btn._action();
            }
        });
        btn.addEventListener('pointercancel', () => {
            dragging = false;
            btn.classList.remove('tm-dragging');
        });
    }
    /* ================== RESTORE (live DOM write-back) ================== */
    function restoreOriginalPage() {
        if (!liveItemsMap.length) return;
        for (const item of liveItemsMap) {
            try {
                if (item.type === 'text') {
                    if (item.node && item.node.parentNode) {
                        item.node.nodeValue = item.originalValue;
                    }
                } else if (item.type === 'attribute') {
                    if (item.element && item.element.isConnected) {
                        item.element.setAttribute(item.attribute, item.originalValue);
                    }
                }
            } catch (e) { /* node may have been removed by site JS */ }
        }
        liveItemsMap = [];
        isTranslated = false;
        removeButtonFix();
        setTimeout(() => window.scrollTo(0, originalScrollPosition), 0);
        updateFloatingButtons();
    }
    /* ================== NAME SET ================== */
    function buildNameSetReplacer(nameSet) {
        const keys = Object.keys(nameSet).sort((a, b) => b.length - a.length);
        return function (text, placeholderMap) {
            let out = text;
            for (const k of keys) {
                if (!k || !out.includes(k)) continue;
                const id = `__TM_NAME_${Object.keys(placeholderMap).length}__`;
                placeholderMap[id] = { orig: k, viet: nameSet[k] };
                out = out.split(k).join(id);
            }
            return out;
        };
    }
    function restoreNames(text, placeholderMap) {
        if (!text || !placeholderMap) return text;
        let result = text;
        for (const placeholder in placeholderMap) {
            const regex = new RegExp(placeholder.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), 'g');
            result = result.replace(regex, placeholderMap[placeholder].viet);
        }
        result = result
            .replace(/\s+([,.;:!?\)\]>'"'»。，、？！：；）》])/g, '$1')
            .replace(/\s+/g, ' ');
        return result.trim();
    }
    /* ================== TRANSLATION ================== */
    const SPECIAL_RE = /([^a-zA-Z0-9\u4e00-\u9fa5\s\u3000-\u303f\uff00-\uffef。，、？！：；""''（）《》]+)/g;
    function tokenizeString(str) {
        if (!str) return [];
        const parts = str.split(SPECIAL_RE);
        const tokens = [];
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (!part) continue;
            if (i % 2 === 1) {
                tokens.push({ type: 'special', value: part });
            } else {
                if (tokens.length > 0 && tokens[tokens.length - 1].type === 'text') {
                    tokens[tokens.length - 1].value += part;
                } else {
                    tokens.push({ type: 'text', value: part });
                }
            }
        }
        return tokens;
    }
    function reassembleTranslatedString(tokens, translatedTexts) {
        let result = '';
        let idx = 0;
        for (const token of tokens) {
            if (token.type === 'text') {
                if (!token.value || !token.value.trim()) { result += token.value || ''; continue; }
                result += idx < translatedTexts.length ? translatedTexts[idx++] : token.value;
            } else {
                result += token.value;
            }
        }
        return result;
    }
    function splitIntoBatches(arr, maxChars) {
        const batches = []; let cur = [], curLen = 0;
        for (const s of arr) {
            const sLen = s?.length || 0;
            if (curLen + sLen + cur.length > maxChars && cur.length > 0) {
                batches.push(cur); cur = [s]; curLen = sLen;
            } else {
                cur.push(s); curLen += sLen;
            }
        }
        if (cur.length) batches.push(cur);
        return batches;
    }
    function postTranslate(contentArray) {
        return new Promise((resolve, reject) => {
            const payload = { content: JSON.stringify(contentArray), tl: config.targetLang };
            GM_xmlhttpRequest({
                method: 'POST',
                url: config.serverUrl,
                headers: { 'Content-Type': 'application/json', 'referer': 'https://dichngay.com/' },
                data: JSON.stringify(payload),
                onload(res) {
                    if (res.status >= 200 && res.status < 300) {
                        try {
                            const json = JSON.parse(res.responseText);
                            const content = json?.data?.content ?? json?.translatedText;
                            if (typeof content !== 'string') throw new Error('Invalid response');
                            const sanitized = content
                                .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
                                .replace(/\\(?!["\\\/bfnrtu])/g, '\\\\');
                            resolve(JSON.parse(sanitized));
                        } catch (e) { reject(new Error('Parse error: ' + e.message)); }
                    } else {
                        reject(new Error('HTTP ' + res.status));
                    }
                },
                onerror(err) { reject(err); }
            });
        });
    }
    async function requestTranslation(contentArray) {
        const retries = Math.max(0, parseInt(config.retryCount, 10) || 0);
        let lastError;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try { return await postTranslate(contentArray); }
            catch (err) {
                lastError = err;
                if (attempt < retries) await sleep(config.delayMs || 400);
            }
        }
        throw lastError || new Error('Translation failed');
    }
    /* ================== LIVE DOM COLLECTION ================== */
    function collectLiveItems() {
        const items = [];
        const seenNodes = new WeakSet();
        const skipTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'PRE', 'CODE', 'TEXTAREA', 'INPUT', 'SELECT', 'SVG']);
        const ignoreIds = ['tm-float-btn', 'tm-loading', 'tm-mini-styles', 'tm-btn-fix', 'tm-mini-settings'];
        const hasMeaningful = /[a-zA-Z\u4e00-\u9fa5\d]/;
        function isIgnored(element) {
            let cur = element;
            while (cur) {
                if (!cur || cur.nodeType !== 1) break;
                if (cur.id && ignoreIds.some(id => cur.id.startsWith(id))) return true;
                if (cur.isContentEditable) return true;
                if (skipTags.has(cur.nodeName)) return true;
                cur = cur.parentElement;
            }
            return false;
        }
        function traverse(node) {
            if (!node || seenNodes.has(node)) return;
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (isIgnored(node)) return;
                for (const attr of ['title', 'placeholder', 'alt', 'aria-label']) {
                    const text = node.getAttribute(attr)?.trim();
                    if (text && hasMeaningful.test(text)) {
                        items.push({ type: 'attribute', element: node, attribute: attr, originalValue: text });
                    }
                }
                seenNodes.add(node);
                for (const child of Array.from(node.childNodes)) traverse(child);
            } else if (node.nodeType === Node.TEXT_NODE) {
                const text = node.nodeValue.trim();
                if (text.length > 0 && hasMeaningful.test(text) && !isIgnored(node.parentElement)) {
                    items.push({ type: 'text', node, originalValue: text });
                    seenNodes.add(node);
                }
            }
        }
        traverse(document.body);
        return items;
    }
    /* ================== APPLY TO LIVE DOM ================== */
    function sanitizeAttributeValue(str) {
        return String(str || '').replace(/<[^>]*>/g, '');
    }
    function applyToLiveDOM(items) {
        for (const item of items) {
            if (!item.translatedValue) continue;
            const finalText = capitalizeFirstLetter(item.translatedValue);
            try {
                if (item.type === 'text') {
                    if (item.node && item.node.parentNode) {
                        item.node.nodeValue = finalText;
                    }
                } else if (item.type === 'attribute') {
                    if (item.element && item.element.isConnected) {
                        item.element.setAttribute(item.attribute, sanitizeAttributeValue(finalText));
                    }
                }
            } catch (e) { /* node removed by site */ }
        }
    }
    /* ================== MAIN TRANSLATE ACTION ================== */
    async function startTranslateAction() {
        if (isTranslating) return;
        isTranslating = true;
        try {
            originalScrollPosition = window.scrollY || 0;
            config = loadConfig();
            showLoading('Đang thu thập nội dung...');
            const items = collectLiveItems();
            if (items.length === 0) throw new Error('Không tìm thấy nội dung để dịch.');
            const nameSet = config.nameSets[config.activeNameSet] || {};
            const nameReplacer = buildNameSetReplacer(nameSet);
            const placeholderMap = {};
            const textsToSend = [];
            for (const item of items) {
                const orig = item.originalValue;
                if (translationCache[orig]) {
                    item.translatedValue = translationCache[orig];
                    item.sendCount = 0;
                    continue;
                }
                item.tokens = tokenizeString(orig);
                let count = 0;
                for (const token of item.tokens) {
                    if (token.type === 'text' && token.value.trim()) {
                        textsToSend.push(nameReplacer(token.value, placeholderMap));
                        count++;
                    }
                }
                item.sendCount = count;
            }
            const batches = splitIntoBatches(textsToSend, config.maxCharsPerRequest);
            let allTranslated = [];
            for (let b = 0; b < batches.length; b++) {
                showLoading(`Đang dịch... (${b + 1}/${batches.length} gói)`);
                const result = await requestTranslation(batches[b]);
                allTranslated.push(...(result || []));
                if (b < batches.length - 1) await sleep(config.delayMs);
            }
            let translationIdx = 0;
            for (const item of items) {
                if (item.translatedValue) continue;
                const numTokens = item.sendCount || 0;
                const parts = allTranslated.slice(translationIdx, translationIdx + numTokens);
                const reassembled = reassembleTranslatedString(item.tokens || [], parts);
                item.translatedValue = restoreNames(reassembled, placeholderMap);
                translationIdx += numTokens;
                if (item.originalValue && item.translatedValue) {
                    translationCache[item.originalValue] = item.translatedValue;
                }
            }
            showLoading('Đang áp dụng bản dịch...');
            applyToLiveDOM(items);
            liveItemsMap = items;
            isTranslated = true;
            injectButtonFix();
        } catch (err) {
            console.error('[TM-Mini] Error:', err);
            alert('Đã xảy ra lỗi: ' + err.message);
        } finally {
            removeLoading();
            isTranslating = false;
            updateFloatingButtons();
        }
    }
    /* ================== SETTINGS UI ================== */
    function openSettingsUI() {
        if (document.getElementById('tm-mini-settings')) return;
        const wrapper = document.createElement('div');
        wrapper.id = 'tm-mini-settings';
        wrapper.style.cssText = `
            position: fixed; inset: 0; z-index: 2147483646;
            display: flex; align-items: center; justify-content: center;
            background: rgba(0,0,0,0.5); font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        `;
        const setName = config.activeNameSet;
        const ns = config.nameSets[setName] || {};
        const pairsText = Object.entries(ns).map(([k, v]) => `${k}=${v}`).join('\n');
        wrapper.innerHTML = `
            <div style="background:#fff; border-radius:10px; padding:24px; width:480px; max-width:95vw; max-height:85vh; overflow-y:auto; box-shadow:0 8px 24px rgba(0,0,0,0.2);">
                <h2 style="margin:0 0 16px;">Cài đặt TM Translate</h2>
                <label style="font-weight:600; display:block; margin-bottom:4px;">URL Server</label>
                <input id="tm-s-url" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; margin-bottom:12px;"
                    value="${escapeHtml(config.serverUrl)}" />
                <label style="font-weight:600; display:block; margin-bottom:4px;">Delay giữa các request (ms)</label>
                <input id="tm-s-delay" type="number" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; margin-bottom:12px;"
                    value="${config.delayMs}" />
                <label style="font-weight:600; display:block; margin-bottom:4px;">Số ký tự tối đa / request</label>
                <input id="tm-s-max" type="number" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; margin-bottom:12px;"
                    value="${config.maxCharsPerRequest}" />
                <label style="font-weight:600; display:block; margin-bottom:4px;">Số lần retry khi lỗi</label>
                <input id="tm-s-retry" type="number" style="width:100%; padding:8px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; margin-bottom:16px;"
                    value="${config.retryCount}" />
                <hr style="border:none; border-top:1px solid #eee; margin:0 0 16px;">
                <label style="font-weight:600; display:block; margin-bottom:4px;">Bộ tên "${escapeHtml(setName)}" (mỗi dòng: Trung=Việt)</label>
                <textarea id="tm-s-pairs" style="width:100%; height:160px; padding:8px; border:1px solid #ddd; border-radius:6px; box-sizing:border-box; font-family:monospace; resize:vertical; margin-bottom:16px;"
                    placeholder="Ví dụ:\n贺川=Hạ Xuyên\n崔然=Thôi Nhiên">${escapeHtml(pairsText)}</textarea>
                <div style="display:flex; justify-content:flex-end; gap:8px;">
                    <button id="tm-s-cancel" style="padding:8px 16px; border:1px solid #ccc; border-radius:6px; background:#f7f7f7; cursor:pointer;">Hủy</button>
                    <button id="tm-s-save" style="padding:8px 16px; border:none; border-radius:6px; background:#007bff; color:#fff; cursor:pointer;">Lưu</button>
                </div>
            </div>
        `;
        document.body.appendChild(wrapper);
        wrapper.querySelector('#tm-s-cancel').addEventListener('click', () => wrapper.remove());
        wrapper.addEventListener('click', e => { if (e.target === wrapper) wrapper.remove(); });
        wrapper.querySelector('#tm-s-save').addEventListener('click', () => {
            config.serverUrl = wrapper.querySelector('#tm-s-url').value.trim() || config.serverUrl;
            config.delayMs = parseInt(wrapper.querySelector('#tm-s-delay').value, 10) || 400;
            config.maxCharsPerRequest = parseInt(wrapper.querySelector('#tm-s-max').value, 10) || 4500;
            config.retryCount = Math.max(0, parseInt(wrapper.querySelector('#tm-s-retry').value, 10) || 0);
            const lines = wrapper.querySelector('#tm-s-pairs').value.trim().split(/\r?\n/).filter(Boolean);
            const newNs = {};
            lines.forEach(line => {
                const parts = line.split('=');
                if (parts.length >= 2) {
                    const k = parts[0].trim();
                    const v = parts.slice(1).join('=').trim();
                    if (k && v) newNs[k] = v;
                }
            });
            config.nameSets[config.activeNameSet] = newNs;
            saveConfig(config);
            wrapper.remove();
            alert('Đã lưu cài đặt!');
        });
    }
    /* ================== INIT ================== */
    GM_registerMenuCommand('Dịch trang này', startTranslateAction);
    GM_registerMenuCommand('Cài đặt', openSettingsUI);
    injectCSS();
    updateFloatingButtons();
    console.log('[TM-Translate Minimal v1.5] Loaded.');
})();
