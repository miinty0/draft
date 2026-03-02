// ==UserScript==
// @name         Hỗ trợ up 🍅
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Cuộn ngang, tải ảnh bìa, đánh dấu & quản lý list
// @author       Minty
// @match        https://fanqienovel.com/*
// @match        *://*/truyen/*
// @match        *://*/redirect*
// @match        *://*/page/*
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      byteimg.com
// @connect      wp.com
// @run-at       document-start
// @downloadURL  https://github.com/miinty0/draft/raw/refs/heads/main/H%E1%BB%97%20tr%E1%BB%A3%20up%20%F0%9F%8D%85.user.js
// @updateURL    https://github.com/miinty0/draft/raw/refs/heads/main/H%E1%BB%97%20tr%E1%BB%A3%20up%20%F0%9F%8D%85.user.js
// ==/UserScript==

(function () {
    'use strict';
// DOMAIN GUARDS
    const isFanqie = location.hostname === 'fanqienovel.com';
    const isRedirectPage = location.pathname.includes('/redirect');
    const isTruyenPage = location.pathname.includes('/truyen');
    if (!isFanqie && !isRedirectPage && !isTruyenPage) return;

// CONFIG
    const DEFAULTS = {
        horizontalScroll : true,// Cuộn ngang khi thu nhỏ cửa sổ
        autoRedirect     : true,// Tự redirect & copy ID truyện  
        hdDownloader     : true,// Nút tải ảnh bìa HD              
        readingTracker   : true,// Đánh dấu & quản lý truyện đã đọc
    };

    const CONFIG = Object.assign({}, DEFAULTS);
    for (const key of Object.keys(DEFAULTS)) {
        const saved = GM_getValue('cfg_' + key, null);
        if (saved !== null) CONFIG[key] = saved;
    }
    function saveCfg(key, val) {
        CONFIG[key] = val;
        GM_setValue('cfg_' + key, val);
    }

// SHARED UTILITIES
    const $ = (s, p = document) => p.querySelector(s);
    const mk = (tag, css, props) => {
        const el = Object.assign(document.createElement(tag), props);
        if (css) el.style.cssText = css;
        return el;
    };
    const run = (fn) => document.readyState === 'loading'
        ? document.addEventListener('DOMContentLoaded', fn)
        : fn();

    const redirectToast = (msg) => {
        const t = mk('div', 'position:fixed;top:30px;left:50%;transform:translateX(-50%);background:#000;color:#2ecc71;padding:12px 24px;border-radius:8px;z-index:1000000;font-weight:600;', { innerHTML: `<b>✓</b> ${msg}` });
        document.body.append(t);
        setTimeout(() => t.remove(), 2500);
    };

    let toastContainer = null;
    function getToastContainer() {
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'fq-toast-container';
            document.body.appendChild(toastContainer);
        }
        return toastContainer;
    }
    function toast(message, type = 'info', duration = 3000) {
        const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
        const el = document.createElement('div');
        el.className = `fq-toast fq-toast-${type}`;
        el.innerHTML = `<span class="fq-toast-icon">${icons[type] ?? 'ℹ'}</span><span>${message}</span>`;
        getToastContainer().appendChild(el);
        requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));
        setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, duration);
    }


// SECTION 1 — HORIZONTAL SCROLL
    if (isFanqie && CONFIG.horizontalScroll) {
        const scrollStyle = document.createElement('style');
        scrollStyle.id = 'fq-scroll-style';
        scrollStyle.textContent = `
            html { overflow-x: auto !important; }
            body { overflow-x: auto !important; min-width: 0 !important; }
            #root, #app, [class*="layout"], [class*="Layout"],
            [class*="wrapper"], [class*="Wrapper"],
            [class*="container"], [class*="Container"] {
                min-width: 0 !important;
                overflow-x: visible !important;
            }
        `;
        document.addEventListener('DOMContentLoaded', () => document.head.appendChild(scrollStyle));

        function fixOverflow() {
            document.querySelectorAll('*').forEach(el => {
                const computed = window.getComputedStyle(el);
                if (computed.overflowX === 'hidden' && computed.position !== 'fixed')
                    el.style.setProperty('overflow-x', 'visible', 'important');
            });
            document.documentElement.style.setProperty('overflow-x', 'auto', 'important');
            document.body.style.setProperty('overflow-x', 'auto', 'important');
        }
        window.addEventListener('resize', fixOverflow);
        const scrollObserver = new MutationObserver(fixOverflow);
        document.addEventListener('DOMContentLoaded', () => {
            fixOverflow();
            scrollObserver.observe(document.body, { childList: true, subtree: true });
        });
    }


// SECTION 2 — AUTO-REDIRECT & COPY ID
    if (CONFIG.autoRedirect && (isRedirectPage || isTruyenPage || isFanqie)) {
        const url = window.location.href;
        if (isRedirectPage) {
            const target = decodeURIComponent(new URLSearchParams(window.location.search).get('u') || '');
            if (target) {
                const storyId = target.match(/page\/(\d+)/)?.[1];
                run(() => {
                    if (storyId) {
                        GM_setClipboard(storyId, 'text');
                        redirectToast(`Đã sao chép ID: ${storyId}`);
                        setTimeout(() => location.replace(target), 800);
                    } else {
                        location.replace(target);
                    }
                });
            }
        } else {
            run(() => {
                document.querySelectorAll('a[href*="/redirect?u="]').forEach(l => {
                    l.target = '_blank';
                    l.style.cursor = 'alias';
                });
            });
        }
    }

// SECTION 3 — COVER IMAGE DOWNLOADER
    if (isFanqie && CONFIG.hdDownloader && location.pathname.startsWith('/page/')) {
        const hdWait = setInterval(() => {
            const box = $('.info-count');
            if (box && !$('#fq-download-wrap')) { clearInterval(hdWait); initHD(box); }
        }, 500);
    }

    function initHD(parent) {
        Object.assign(parent.style, { display: 'flex', gap: '12px', alignItems: 'center' });
        const wrap = mk('div', '', { id: 'fq-download-wrap' });
        const btn = mk('button', 'padding:5px 14px;background:#000;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px;font-weight:700;', {
            innerHTML: 'TẢI HD',
            onmouseover: () => btn.style.background = '#ff4d4f',
            onmouseout:  () => btn.style.background = '#000'
        });
        const logBox = mk('div', 'position:fixed;top:50%;right:20px;transform:translateY(-50%);width:240px;background:#0d0d0d;color:#00ff41;padding:15px;border-radius:12px;display:none;z-index:10000;font-family:monospace;font-size:10px;');
        const logContent = mk('div', 'max-height:180px;overflow-y:auto;');
        logBox.append(
            mk('div', 'text-align:right;cursor:pointer;color:#555;', { innerText: 'ĐÓNG ✕', onclick: () => logBox.style.display = 'none' }),
            logContent
        );
        document.body.append(logBox);
        parent.append(wrap);
        wrap.append(btn);

        const log = (msg) => {
            logBox.style.display = 'block';
            logContent.append(mk('div', '', { innerHTML: `<span style="opacity:0.3">#</span> ${msg}` }));
            logContent.scrollTop = logContent.scrollHeight;
        };

        btn.onclick = async () => {
            const imgEl   = $('.book-cover-img');
            const titleEl = $('.info-name h1');
            const match   = imgEl?.src.match(/novel-pic\/(.*?)~/);
            if (!match) return log('LỖI: KO LẤY ĐƯỢC ẢNH');
            btn.disabled = true; btn.style.opacity = '0.5';
            logContent.innerHTML = ''; log('ĐANG KẾT NỐI...');
            const name = (titleEl?.innerText || 'cover').replace(/[\\/:*?"<>|]/g, '_') + '.jpg';
            const id   = match[1];
            const urls = [
                `https://i0.wp.com/p6-novel.byteimg.com/origin/novel-pic/${id}`,
                `https://p6-novel.byteimg.com/origin/novel-pic/${id}`,
                `https://p3-novel-sign.byteimg.com/novel-pic/${id}`
            ];
            const dl = (idx) => {
                if (idx >= urls.length) { log('THẤT BẠI'); btn.disabled = false; return; }
                log(`THỬ MÁY CHỦ ${idx + 1}...`);
                GM_xmlhttpRequest({
                    method: 'GET', url: urls[idx], responseType: 'blob', timeout: 10000,
                    onload: async (res) => {
                        if (res.status === 200 && res.response.size > 2000) {
                            const blob = res.response, size = blob.size / 1024;
                            log(`XONG: ${Math.round(size)}KB`);
                            if (size <= 500) hdSave(blob, name, btn, logBox, log);
                            else             hdCompress(blob, name, btn, logBox, log);
                        } else dl(idx + 1);
                    }
                });
            };
            dl(0);
        };
    }

    function hdSave(blob, name, btn, box, log) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob); a.download = name; a.click();
        log('<span style="color:#fff">HOÀN TẤT!</span>');
        btn.disabled = false; btn.style.opacity = '1';
        setTimeout(() => box.style.display = 'none', 8000);
    }

    async function hdCompress(blob, name, btn, box, log) {
        log('ẢNH LỚN. ĐANG NÉN...');
        const img = new Image(); img.src = URL.createObjectURL(blob);
        img.onload = async () => {
            const cvs = document.createElement('canvas'), ctx = cvs.getContext('2d');
            cvs.width = img.width; cvs.height = img.height; ctx.drawImage(img, 0, 0);
            let q = 0.95, cropped = false, res;
            while (true) {
                res = await new Promise(r => cvs.toBlob(r, 'image/jpeg', q));
                log(`NÉN: ${Math.round(res.size / 1024)}KB`);
                if (res.size / 1024 <= 500 || q < 0.1) break;
                if (q > 0.5) q -= 0.1;
                else if (!cropped) {
                    cropped = true;
                    let w = cvs.width, h = cvs.height, ratio = 5 / 7;
                    let dw = w / h > ratio ? h * ratio : w, dh = w / h > ratio ? h : w / ratio;
                    cvs.width = dw; cvs.height = dh;
                    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh, 0, 0, dw, dh);
                    q = 0.8;
                } else q -= 0.1;
            }
            hdSave(res, name, btn, box, log);
        };
    }

// SECTION 4 — LIST TRACKER (IndexedDB)
    const SVGs = {
        bookmarkUnread: `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`,
        bookmarkRead:   `<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path></svg>`,
        badgeCheck:     `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>`
    };
    if (isFanqie) {
        const mainStyle = document.createElement('style');
        mainStyle.innerHTML = `
            .fanqie-read-badge { margin-left:6px; vertical-align:middle; display:inline-flex; cursor:help; }
            .fanqie-read-badge svg { width:16px; height:16px; fill:#FF6F61; }
            .info-name-modern { display:flex !important; align-items:center; gap:12px; flex-wrap:wrap; }
            .fanqie-mark-btn {
                background-color:transparent; color:#94a3b8; border:1px solid #cbd5e1;
                width:20px; height:20px; border-radius:50%; cursor:pointer;
                transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
                display:inline-flex; align-items:center; justify-content:center;
                padding:0; outline:none; flex-shrink:0;
            }
            .fanqie-mark-btn:hover { border-color:#FF6F61; color:#FF6F61; transform:scale(1.05); }
            .fanqie-mark-btn.is-read {
                background-color:#FF6F61; border-color:#FF6F61; color:#ffffff;
                box-shadow:0 4px 10px rgba(255,111,97,0.35);
            }
            .fanqie-mark-btn.is-read:hover { background-color:#FF574A; border-color:#FF574A; transform:scale(1.05); }

            #fq-fab-row {
                position:fixed; bottom:20px; left:20px;
                display:flex; gap:8px; z-index:99999;
            }
            .fq-fab {
                background:#FF6F61; color:#fff; border:none;
                padding:8px 14px; border-radius:20px; cursor:pointer;
                font-size:13px; box-shadow:0 4px 10px rgba(255,111,97,0.3);
                font-weight:bold; transition:background 0.2s, transform 0.2s;
                white-space:nowrap;
            }
            .fq-fab:hover { background:#FF574A; transform:translateY(-2px); }
            .fq-fab.fq-fab-settings { background:#334155; }
            .fq-fab.fq-fab-settings:hover { background:#1e293b; }

            .fq-panel {
                display:none; position:fixed; bottom:60px; left:20px;
                background:#fff; border:1px solid #e2e8f0; padding:15px;
                border-radius:12px; box-shadow:0 10px 25px rgba(0,0,0,0.1);
                z-index:99999; width:280px; font-family:sans-serif; color:#333;
            }
            .fq-panel-header {
                display:flex; justify-content:space-between;
                font-weight:bold; font-size:13px; margin-bottom:10px;
            }
            .fq-panel-close { cursor:pointer; color:#ef4444; padding:0 5px; }

            #fq-manager-panel textarea {
                width:100%; height:70px; margin-top:5px; padding:8px;
                box-sizing:border-box; border:1px solid #cbd5e1;
                border-radius:6px; outline:none; font-size:12px; resize:none;
            }
            #fq-manager-panel textarea:focus { border-color:#FF6F61; }
            .fq-panel-btns { margin-top:10px; display:flex; gap:8px; }
            .fq-panel-btns button {
                flex:1; padding:8px; cursor:pointer; border:none;
                border-radius:6px; font-weight:bold; font-size:11px;
                color:#fff; transition:opacity 0.2s;
            }
            .fq-panel-btns button:hover { opacity:0.8; }
            .fq-btn-save { background:#10b981; }
            .fq-btn-copy { background:#3b82f6; }
            .fq-btn-clear { background:#ef4444; }

            .fq-setting-row {
                display:flex; align-items:center; justify-content:space-between;
                padding:8px 0; border-bottom:1px solid #f1f5f9; font-size:13px;
            }
            .fq-setting-row:last-of-type { border-bottom:none; }
            .fq-setting-label { color:#334155; }
            .fq-setting-desc { font-size:10px; color:#94a3b8; margin-top:2px; }
            .fq-toggle { position:relative; width:36px; height:20px; flex-shrink:0; }
            .fq-toggle input { opacity:0; width:0; height:0; }
            .fq-toggle-slider {
                position:absolute; inset:0; background:#cbd5e1;
                border-radius:20px; cursor:pointer; transition:background 0.2s;
            }
            .fq-toggle-slider:before {
                content:''; position:absolute;
                width:14px; height:14px; left:3px; top:3px;
                background:#fff; border-radius:50%; transition:transform 0.2s;
            }
            .fq-toggle input:checked + .fq-toggle-slider { background:#FF6F61; }
            .fq-toggle input:checked + .fq-toggle-slider:before { transform:translateX(16px); }
            .fq-settings-note {
                margin-top:10px; font-size:10px; color:#94a3b8;
                background:#f8fafc; padding:6px 8px; border-radius:6px;
            }

            #fq-toast-container {
                position:fixed; bottom:80px; left:50%; transform:translateX(-50%);
                z-index:999999; display:flex; flex-direction:column-reverse;
                align-items:center; gap:8px; pointer-events:none;
            }
            .fq-toast {
                background:#1e293b; color:#f8fafc; padding:10px 18px;
                border-radius:999px; font-size:13px; font-family:sans-serif;
                box-shadow:0 6px 20px rgba(0,0,0,0.2); display:flex;
                align-items:center; gap:8px; white-space:nowrap;
                opacity:0; transform:translateY(10px);
                transition:opacity 0.25s ease, transform 0.25s ease; pointer-events:none;
            }
            .fq-toast.show { opacity:1; transform:translateY(0); }
            .fq-toast.fq-toast-success .fq-toast-icon { color:#4ade80; }
            .fq-toast.fq-toast-error   .fq-toast-icon { color:#f87171; }
            .fq-toast.fq-toast-info    .fq-toast-icon { color:#60a5fa; }
            .fq-toast.fq-toast-warning .fq-toast-icon { color:#fbbf24; }
            .fq-toast-icon { font-size:15px; flex-shrink:0; }
        `;
        document.head.appendChild(mainStyle);
    }

// --- IndexedDB ---
    const DB_NAME = 'fanqie_tracker', DB_VERSION = 1, STORE_NAME = 'read_books';
    let dbPromise = null;
    function openDB() {
        if (dbPromise) return dbPromise;
        dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME))
                    db.createObjectStore(STORE_NAME, { keyPath: 'bookId' });
            };
            req.onsuccess = e => resolve(e.target.result);
            req.onerror   = e => reject(e.target.error);
        });
        return dbPromise;
    }
    async function getAllIds() {
        const db = await openDB();
        return new Promise((res, rej) => {
            const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getAllKeys();
            req.onsuccess = () => res(req.result);
            req.onerror   = () => rej(req.error);
        });
    }
    async function hasId(bookId) {
        const db = await openDB();
        return new Promise((res, rej) => {
            const req = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).getKey(bookId);
            req.onsuccess = () => res(req.result !== undefined);
            req.onerror   = () => rej(req.error);
        });
    }
    async function addId(bookId) {
        const db = await openDB();
        return new Promise((res, rej) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).put({ bookId, addedAt: Date.now() });
            tx.oncomplete = () => res();
            tx.onerror    = () => rej(tx.error);
        });
    }
    async function removeId(bookId) {
        const db = await openDB();
        return new Promise((res, rej) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(bookId);
            tx.oncomplete = () => res();
            tx.onerror    = () => rej(tx.error);
        });
    }
    async function clearAll() {
        const db = await openDB();
        return new Promise((res, rej) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).clear();
            tx.oncomplete = () => res();
            tx.onerror    = () => rej(tx.error);
        });
    }
    async function addBulk(ids) {
        const db = await openDB();
        return new Promise((res, rej) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            ids.forEach(bookId => store.put({ bookId, addedAt: Date.now() }));
            tx.oncomplete = () => res(ids.length);
            tx.onerror    = () => rej(tx.error);
        });
    }

// --- BroadcastChannel sync ---
    const channel = new BroadcastChannel('fanqie_sync');
    channel.onmessage = (e) => {
        const { type, bookId } = e.data ?? {};
        if (type === 'toggle' || type === 'bulk' || type === 'clear') {
            if (CONFIG.readingTracker) markBooksInLibrary();
            if ((type === 'toggle' || type === 'clear') && CONFIG.readingTracker) refreshDetailButton(bookId);
        }
    };
    function broadcast(payload) { try { channel.postMessage(payload); } catch (_) {} }

// --- Core tracker logic ---
    function extractBookId(str) {
        if (!str) return null;
        const match = str.match(/\/page\/(\d{15,20})/);
        return match ? match[1] : null;
    }
    async function toggleReadBook(bookId) {
        const already = await hasId(bookId);
        if (already) await removeId(bookId); else await addId(bookId);
        broadcast({ type: 'toggle', bookId });
        return !already;
    }
    function refreshDetailButton() {
        const btn = document.querySelector('.fanqie-mark-btn');
        if (!btn) return;
        const currentId = extractBookId(window.location.href);
        if (!currentId) return;
        hasId(currentId).then(isRead => {
            btn.innerHTML = isRead ? SVGs.bookmarkRead : SVGs.bookmarkUnread;
            btn.title = isRead ? '✓ (Nhấn để bỏ đánh dấu)' : 'Đánh dấu';
            btn.classList.toggle('is-read', isRead);
        });
    }
    function handleDetailPage() {
        if (!isFanqie || !CONFIG.readingTracker) return;
        const bookId = extractBookId(window.location.href);
        if (!bookId) return;
        const infoDiv = document.querySelector('.info-name');
        if (!infoDiv || document.querySelector('.fanqie-mark-btn')) return;
        infoDiv.classList.add('info-name-modern');
        const btn = document.createElement('button');
        btn.className = 'fanqie-mark-btn';
        const updateButtonState = async () => {
            const isRead = await hasId(bookId);
            btn.innerHTML = isRead ? SVGs.bookmarkRead : SVGs.bookmarkUnread;
            btn.title = isRead ? '✓ (Nhấn để bỏ đánh dấu)' : 'Đánh dấu';
            btn.classList.toggle('is-read', isRead);
        };
        updateButtonState();
        btn.addEventListener('click', async () => {
            const nowRead = await toggleReadBook(bookId);
            await updateButtonState();
            await markBooksInLibrary();
            toast(nowRead ? 'Đã đánh dấu' : 'Đã bỏ đánh dấu', nowRead ? 'success' : 'info');
        });
        infoDiv.appendChild(btn);
    }
    async function markBooksInLibrary() {
        if (!isFanqie || !CONFIG.readingTracker) return;
        const readIds = new Set(await getAllIds());
        document.querySelectorAll('a[href*="/page/"]').forEach(link => {
            const bookId = extractBookId(link.getAttribute('href'));
            const isImageCover = link.querySelector('img')
                || link.classList.contains('muye-book-cover')
                || link.classList.contains('book-cover');
            if (isImageCover) return;
            const hasBadge = link.nextElementSibling?.classList.contains('fanqie-read-badge');
            if (bookId && readIds.has(bookId)) {
                if (!hasBadge) {
                    const badge = document.createElement('span');
                    badge.className = 'fanqie-read-badge';
                    badge.innerHTML = SVGs.badgeCheck;
                    badge.title = 'Truyện đã đánh dấu';
                    link.parentNode.insertBefore(badge, link.nextSibling);
                }
            } else if (bookId && hasBadge) {
                link.nextElementSibling.remove();
            }
        });
    }
// SECTION 5 — SETTINGS PANEL + MANAGER UI
    const FEATURE_LABELS = [
        { key: 'horizontalScroll', label: 'Cuộn ngang', desc: 'Cuộn ngang khi thu nhỏ cửa sổ' },
        { key: 'autoRedirect', label: 'Auto-redirect', desc: 'Tự chuyển trang & copy ID' },
        { key: 'hdDownloader', label: 'Tải ảnh bìa HD', desc: 'Nút tải ảnh bìa' },
        { key: 'readingTracker', label: 'Đánh dấu truyện', desc: 'Badge & quản lý danh sách' },
    ];

    function createUI() {
        if (!isFanqie || document.getElementById('fq-fab-row')) return;

        const fabRow = document.createElement('div');
        fabRow.id = 'fq-fab-row';

        const settingsBtn = document.createElement('button');
        settingsBtn.className = 'fq-fab fq-fab-settings';
        settingsBtn.innerHTML = '⚙ Cài đặt';

        const managerBtn = document.createElement('button');
        managerBtn.className = 'fq-fab';
        managerBtn.innerHTML = '📚 Quản lý ID';
        if (!CONFIG.readingTracker) managerBtn.style.display = 'none';

        fabRow.append(settingsBtn, managerBtn);
        document.body.appendChild(fabRow);

// Settings panel
        const settingsPanel = document.createElement('div');
        settingsPanel.id = 'fq-settings-panel';
        settingsPanel.className = 'fq-panel';
        settingsPanel.innerHTML = `
            <div class="fq-panel-header">
                <span>⚙ Cài đặt chức năng</span>
                <span class="fq-panel-close" id="fq-settings-close">✖</span>
            </div>
            ${FEATURE_LABELS.map(f => `
                <div class="fq-setting-row">
                    <div>
                        <div class="fq-setting-label">${f.label}</div>
                        <div class="fq-setting-desc">${f.desc}</div>
                    </div>
                    <label class="fq-toggle">
                        <input type="checkbox" data-key="${f.key}" ${CONFIG[f.key] ? 'checked' : ''}>
                        <span class="fq-toggle-slider"></span>
                    </label>
                </div>
            `).join('')}
            <div class="fq-settings-note">⚠ Một số thay đổi cần tải lại trang để có hiệu lực.</div>
        `;
        document.body.appendChild(settingsPanel);

        settingsBtn.onclick = () => {
            settingsPanel.style.display = settingsPanel.style.display === 'block' ? 'none' : 'block';
            managerPanel.style.display = 'none';
        };
        document.getElementById('fq-settings-close').onclick = () => { settingsPanel.style.display = 'none'; };

        settingsPanel.querySelectorAll('input[data-key]').forEach(input => {
            input.addEventListener('change', () => {
                const key = input.dataset.key;
                saveCfg(key, input.checked);
                if (key === 'readingTracker') {
                    managerBtn.style.display = input.checked ? '' : 'none';
                    if (!input.checked) managerPanel.style.display = 'none';
                }
                const label = FEATURE_LABELS.find(f => f.key === key)?.label;
                toast(`${input.checked ? '✓ Đã bật' : '✗ Đã tắt'}: ${label}`, input.checked ? 'success' : 'info');
            });
        });

// Manager panel
        const managerPanel = document.createElement('div');
        managerPanel.id = 'fq-manager-panel';
        managerPanel.className = 'fq-panel';
        managerPanel.innerHTML = `
            <div class="fq-panel-header">
                <span>Đã lưu: <span id="fq-count" style="color:#FF6F61;">0</span> truyện</span>
                <span class="fq-panel-close" id="fq-manager-close">✖</span>
            </div>
            <div style="font-size:11px;color:#64748b;">Dán link trang truyện hoặc nhập Book ID:</div>
            <textarea id="fq-textarea"></textarea>
            <div class="fq-panel-btns">
                <button class="fq-btn-save" id="fq-save">Lưu ID</button>
                <button class="fq-btn-copy" id="fq-copy">Copy hết</button>
                <button class="fq-btn-clear" id="fq-clear">Xóa sạch</button>
            </div>`;
        document.body.appendChild(managerPanel);

        const refreshCount = async () => {
            const ids = await getAllIds();
            const el = document.getElementById('fq-count');
            if (el) el.textContent = ids.length;
        };

        managerBtn.onclick = () => {
            managerPanel.style.display = managerPanel.style.display === 'block' ? 'none' : 'block';
            settingsPanel.style.display = 'none';
            if (managerPanel.style.display === 'block') refreshCount();
        };
        document.getElementById('fq-manager-close').onclick = () => { managerPanel.style.display = 'none'; };

        document.getElementById('fq-save').onclick = async () => {
            const input = document.getElementById('fq-textarea').value;
            const matches = [...new Set(input.match(/\d{15,20}/g) || [])];
            if (!matches.length) { toast('Không tìm thấy Book ID nào hợp lệ!', 'error'); return; }
            const existing = new Set(await getAllIds());
            const newOnes = matches.filter(id => !existing.has(id));
            if (!newOnes.length) { toast('Tất cả ID đã được lưu trước đó', 'warning'); return; }
            await addBulk(newOnes);
            document.getElementById('fq-textarea').value = '';
            await refreshCount();
            await markBooksInLibrary();
            broadcast({ type: 'bulk' });
            toast(`Đã thêm ${newOnes.length} truyện mới!`, 'success');
        };
        document.getElementById('fq-copy').onclick = async () => {
            const ids = await getAllIds();
            if (!ids.length) { toast('Danh sách trống!', 'warning'); return; }
            await navigator.clipboard.writeText(ids.join(', '));
            toast(`Đã copy ${ids.length} ID!`, 'success');
        };
        document.getElementById('fq-clear').onclick = async () => {
            if (!window.confirm('Xóa sạch lịch sử truyện đã đánh dấu?')) return;
            await clearAll();
            document.querySelectorAll('.fanqie-read-badge').forEach(el => el.remove());
            const detailBtn = document.querySelector('.fanqie-mark-btn');
            if (detailBtn) {
                detailBtn.classList.remove('is-read');
                detailBtn.innerHTML = SVGs.bookmarkUnread;
                detailBtn.title = 'Đánh dấu truyện';
            }
            await refreshCount();
            broadcast({ type: 'clear' });
            toast('Đã xóa toàn bộ lịch sử', 'info');
        };
    }
// INIT
    let debounceTimer = null;
    function debouncedInit() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            handleDetailPage();
            markBooksInLibrary();
        }, 300);
    }

    async function init() {
        if (isFanqie) {
            await openDB();
            handleDetailPage();
            markBooksInLibrary();
            createUI();
        }
    }

    if (isFanqie) {
        const trackerObserver = new MutationObserver(debouncedInit);
        run(() => {
            trackerObserver.observe(document.body, { childList: true, subtree: true });
            init();
        });
    }

})();
