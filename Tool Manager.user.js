// ==UserScript==
// @name         Tool Manager
// @namespace    http://tampermonkey.net/
// @version      8.3
// @description  Quản lý truyện
// @author       Minty
// @match        https://*.net/user/*/works*
// @match        https://*.net/truyen/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // --- CẤU HÌNH ---
    const PATH = window.location.pathname;
    const IS_LIST_PAGE = PATH.includes('/user/') && PATH.includes('/works');
    const IS_DETAIL_PAGE = /^\/truyen\/[^/]+$/.test(PATH);
    const CACHE_PREFIX = 'cache_';
    const THEME_KEY = 'wd_theme_mode';

    if (!IS_LIST_PAGE && !IS_DETAIL_PAGE) return;

    // --- STYLE & UTILS ---
    const commonStyles = `
        :root {
            --wd-bg: #f9f9f9; --wd-text: #333; --wd-header-bg: #2e7d32;
            --wd-border: #ccc; --wd-item-bg: #fff; --wd-input-bg: #fff;
            --wd-input-text: #000; --wd-shadow: rgba(0,0,0,0.1);
            --wd-scroll-track: #e0e0e0; --wd-scroll-thumb: #888;
        }
        [data-wd-theme="dark"] {
            --wd-bg: #222; --wd-text: #ddd; --wd-header-bg: #1b5e20;
            --wd-border: #444; --wd-item-bg: #333; --wd-input-bg: #444;
            --wd-input-text: #fff; --wd-shadow: rgba(0,0,0,0.5);
            --wd-scroll-track: #2c2c2c; --wd-scroll-thumb: #555;
        }
        #wd-panel * { box-sizing: border-box; }

        .wd-btn { cursor: pointer; border: none; border-radius: 4px; font-weight: bold; color: #fff; transition: 0.2s; }
        .wd-btn:hover { opacity: 0.9; }
        .wd-btn:disabled { background: #777 !important; cursor: not-allowed; }
        #wd-toast {
            visibility: hidden; min-width: 250px; background-color: #333; color: #fff; text-align: center;
            border-radius: 4px; padding: 16px; position: fixed; z-index: 9999999; left: 50%; bottom: 30px;
            transform: translateX(-50%); font-size: 14px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);
        }
        #wd-toast.show { visibility: visible; animation: fadein 0.5s, fadeout 0.5s 2.5s; }
        @keyframes fadein { from {bottom: 0; opacity: 0;} to {bottom: 30px; opacity: 1;} }
        @keyframes fadeout { from {bottom: 30px; opacity: 1;} to {bottom: 0; opacity: 0;} }
    `;
    const styleEl = document.createElement("style");
    styleEl.innerText = commonStyles;
    document.head.appendChild(styleEl);

    const toast = document.createElement('div');
    toast.id = 'wd-toast';
    document.body.appendChild(toast);

    function showToast(msg) {
        toast.textContent = msg;
        toast.className = "show";
        setTimeout(() => { toast.className = toast.className.replace("show", ""); }, 3000);
    }

    function parseNumber(str) {
        if (!str) return 0;
        return parseInt(str.replace(/\./g, '').replace(/,/g, '').replace(/\D/g, '')) || 0;
    }

    function parseDateToTimestamp(dateStr) {
        if (!dateStr) return 0;
        const parts = dateStr.trim().split('-');
        if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
        return 0;
    }

    // --- MODULE 1: DETAIL PAGE ---
    if (IS_DETAIL_PAGE) {
        setTimeout(handleDetailPage, 500);
    }

    function handleDetailPage() {
        const data = scrapeDetailData();
        if (!data) return;
        const cacheInfo = findInCache(data.link);
        if (cacheInfo.found) {
            updateCacheEntry(cacheInfo.key, cacheInfo.index, data, cacheInfo.list);
            showToast(`✅ Đã cập nhật: "${data.title}"`);
        } else {
            renderAddButton(data);
        }
    }

    function scrapeDetailData() {
        const coverInfo = document.querySelector('.cover-info');
        if (!coverInfo) return null;
        try {
            const title = coverInfo.querySelector('h2').textContent.trim();
            const stats = coverInfo.querySelectorAll('span[data-ready="abbrNum"]');
            let author = "", status = "", updateDate = "", thanks = 0;
            const pTags = coverInfo.querySelectorAll('div > p');
            pTags.forEach(p => {
                const txt = p.textContent;
                if (txt.includes("Tác giả:")) author = p.querySelector('a') ? p.querySelector('a').textContent.trim() : "";
                if (txt.includes("Tình trạng:")) status = p.querySelector('a') ? p.querySelector('a').textContent.trim() : "";
                if (txt.includes("Thời gian đổi mới:")) {
                    const span = p.querySelector('span');
                    if(span) updateDate = span.textContent.trim();
                }
                if (txt.includes("Cảm ơn:")) {
                    const span = p.querySelector('span');
                    if(span) thanks = parseNumber(span.textContent);
                }
            });
            return {
                title, author, status, updateDate, thanks,
                link: window.location.pathname,
                view: stats[0] ? parseNumber(stats[0].textContent) : 0,
                rating: stats[1] ? parseNumber(stats[1].textContent) : 0,
                comment: stats[2] ? parseNumber(stats[2].textContent) : 0,
                timestamp: parseDateToTimestamp(updateDate)
            };
        } catch (e) { console.error(e); return null; }
    }

    function findInCache(currentLink) {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(CACHE_PREFIX)) {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const list = JSON.parse(raw);
                    const idx = list.findIndex(b => b.link === currentLink);
                    if (idx !== -1) return { found: true, key: key, index: idx, list: list };
                }
            }
        }
        return { found: false };
    }

    function updateCacheEntry(key, index, newData, currentList) {
        const oldItem = currentList[index];
        currentList[index] = { ...oldItem, ...newData };
        localStorage.setItem(key, JSON.stringify(currentList));
    }

    function renderAddButton(data) {
        const btn = document.createElement('button');
        btn.innerText = "➕ Thêm Cache";
        btn.className = "wd-btn";
        Object.assign(btn.style, {
            position: 'fixed', bottom: '20px', right: '20px',
            background: '#4CAF50', padding: '8px 12px', fontSize: '13px',
            zIndex: '999999', boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
        });
        btn.onclick = function() {
            let firstKey = null;
            for (let i = 0; i < localStorage.length; i++) {
                if (localStorage.key(i).startsWith(CACHE_PREFIX)) { firstKey = localStorage.key(i); break; }
            }
            if (firstKey) {
                const list = JSON.parse(localStorage.getItem(firstKey));
                list.unshift({ ...data, chapter: -1 });
                localStorage.setItem(firstKey, JSON.stringify(list));
                showToast(`🆕 Đã thêm: "${data.title}"`);
                btn.style.display = 'none';
            } else { showToast("⚠️ Không tìm thấy Cache nào."); }
        };
        document.body.appendChild(btn);
    }

    // --- MODULE 2: LIST PAGE (PANEL) ---
    if (IS_LIST_PAGE) {
        initListPage();
    }

    function initListPage() {
        const USER_ID = PATH.split('/')[2];
        const STORAGE_KEY = `${CACHE_PREFIX}${USER_ID}`;

        // CSS
        const panelStyles = `
            #wd-panel {
                position: fixed; top: 50px; right: 10px; width: 320px;
                background: var(--wd-bg); color: var(--wd-text);
                border: 1px solid var(--wd-border); box-shadow: 0 4px 15px var(--wd-shadow);
                z-index: 9999; font-family: sans-serif; font-size: 13px;
                border-radius: 8px; display: flex; flex-direction: column; max-height: 85vh;
                transition: background 0.3s, color 0.3s; overflow: hidden;
            }
            #wd-header {
                padding: 8px 10px; background: var(--wd-header-bg); color: #fff; cursor: move;
                font-weight: bold; display: flex; justify-content: space-between; align-items: center;
                font-size: 12px; flex-shrink: 0;
            }
            #wd-body {
                padding: 8px; overflow-y: auto; overflow-x: hidden; flex-grow: 1; display: block;
                scrollbar-width: thin; scrollbar-color: var(--wd-scroll-thumb) var(--wd-scroll-track);
            }
            #wd-body::-webkit-scrollbar { width: 6px; }
            #wd-body::-webkit-scrollbar-track { background: var(--wd-scroll-track); }
            #wd-body::-webkit-scrollbar-thumb { background: var(--wd-scroll-thumb); border-radius: 3px; }
            .wd-section-title {
                font-weight: bold; color: #4CAF50; margin-bottom: 4px; margin-top: 6px;
                display:block; font-size: 11px; text-transform: uppercase;
            }
            .wd-input, select.wd-select, input[type="date"].wd-date {
                display: block !important; visibility: visible !important; opacity: 1 !important;
                padding: 4px !important; border: 1px solid var(--wd-border) !important; border-radius: 4px !important;
                width: 100% !important; margin-bottom: 5px !important;
                background-color: var(--wd-input-bg) !important; color: var(--wd-input-text) !important;
                height: 28px !important; font-size: 12px !important; box-sizing: border-box !important;
            }
            #wd-sort { background-color: var(--wd-input-bg) !important; font-weight: bold; }
            .wd-row { display: flex; gap: 5px; align-items: center; width: 100%; }
            .wd-col { flex: 1; min-width: 0; }
            .wd-list-item {
                background: var(--wd-item-bg); border: 1px solid var(--wd-border);
                padding: 8px; margin-bottom: 6px; border-radius: 4px;
                box-shadow: 0 1px 2px var(--wd-shadow); overflow: hidden;
            }
            .wd-item-title {
                font-weight: bold; color: var(--wd-text); font-size: 13px; text-decoration: none;
                display: block; margin-bottom: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .wd-item-info { font-size: 10px; color: #888; margin-bottom: 4px; }
            .wd-badges { display: flex; gap: 3px; flex-wrap: wrap;}
            .wd-badge { padding: 2px 4px; border-radius: 3px; font-size: 10px; color: #fff; font-weight: bold; }
            .bg-view { background-color: #0288D1; } .bg-rate { background-color: #F57C00; }
            .bg-comment { background-color: #7B1FA2; } .bg-thanks { background-color: #E91E63; }
            .wd-minimized #wd-body { display: none; }
            .wd-minimized { width: auto !important; height: auto !important; }
            .wd-actions { display: flex; align-items: center; gap: 10px; }
            #wd-theme-toggle { cursor: pointer; background: none; border: none; font-size: 14px; padding: 0; line-height: 1; }
        `;
        const pStyle = document.createElement("style");
        pStyle.innerText = panelStyles;
        document.head.appendChild(pStyle);

        // HTML
        const panelHTML = `
            <div id="wd-header">
                <span>List của (${USER_ID})</span>
                <div class="wd-actions">
                    <button id="wd-theme-toggle" title="Sáng/Tối">☀️</button>
                    <button id="wd-toggle-btn" style="background:none;border:none;color:#fff;cursor:pointer;font-size:14px;">➖</button>
                </div>
            </div>
            <div id="wd-body">
                <button id="wd-sync-btn" class="wd-btn" style="background: #1976D2; width:100%; padding:6px; font-size: 12px;">🔄 ĐỒNG BỘ</button>
                <div id="wd-status-msg" style="text-align:center; font-size:11px; color:#888; margin: 4px 0;">Chưa có dữ liệu.</div>
                <hr style="border:0; border-top:1px solid var(--wd-border); margin: 5px 0;">
                <input type="text" id="wd-search" class="wd-input" placeholder="🔍 Tên truyện...">
                <select id="wd-filter-status" class="wd-select browser-default">
                    <option value="all">-- Trạng thái --</option>
                    <option value="Còn tiếp">Còn tiếp</option>
                    <option value="Hoàn thành">Hoàn thành</option>
                    <option value="Tạm ngưng">Tạm ngưng</option>
                </select>
                <div class="wd-row">
                    <div class="wd-col"><input type="date" id="wd-date-from" class="wd-date browser-default" title="Từ ngày"></div>
                    <div class="wd-col"><input type="date" id="wd-date-to" class="wd-date browser-default" title="Đến ngày"></div>
                </div>
                <div class="wd-row" style="margin-top: 5px;">
                     <div class="wd-col">
                        <select id="wd-sort" class="wd-select browser-default">
                            <option value="newest">📅 Cập nhật</option>
                            <option value="view">👁️ View</option>
                            <option value="rating">⭐ Rating</option>
                            <option value="comment">💬 Comment</option>
                            <option value="thanks">🩷 Cảm ơn</option>
                        </select>
                     </div>
                </div>
                <hr style="border:0; border-top:1px solid var(--wd-border); margin: 8px 0;">
                <div id="wd-result-list"></div>
            </div>
        `;
        const panel = document.createElement('div');
        panel.id = 'wd-panel';
        panel.innerHTML = panelHTML;
        document.body.appendChild(panel);

        // --- THEME LOGIC ---
        const themeBtn = document.getElementById('wd-theme-toggle');
        function applyTheme(isDark) {
            if (isDark) { panel.setAttribute('data-wd-theme', 'dark'); themeBtn.textContent = '🌙'; }
            else { panel.removeAttribute('data-wd-theme'); themeBtn.textContent = '☀️'; }
        }
        let currentTheme = localStorage.getItem(THEME_KEY) === 'dark';
        applyTheme(currentTheme);
        themeBtn.addEventListener('click', () => {
            currentTheme = !currentTheme;
            localStorage.setItem(THEME_KEY, currentTheme ? 'dark' : 'light');
            applyTheme(currentTheme);
        });

        // --- DRAG LOGIC ---
        const header = document.getElementById('wd-header');
        let isDragging = false, offsetX, offsetY;
        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            isDragging = true; offsetX = e.clientX - panel.offsetLeft; offsetY = e.clientY - panel.offsetTop;
            header.style.cursor = 'grabbing';
        });
        document.addEventListener('mousemove', (e) => {
            if (isDragging) { panel.style.left = `${e.clientX - offsetX}px`; panel.style.top = `${e.clientY - offsetY}px`; }
        });
        document.addEventListener('mouseup', () => { isDragging = false; header.style.cursor = 'move'; });
        document.getElementById('wd-toggle-btn').addEventListener('click', () => panel.classList.toggle('wd-minimized'));

        // --- REAL-TIME LISTENER ---
        window.addEventListener('storage', (e) => {
            if (e.key === STORAGE_KEY) {
                renderList();
                header.style.backgroundColor = '#43a047';
                setTimeout(() => {
                    const isDark = panel.getAttribute('data-wd-theme') === 'dark';
                    header.style.backgroundColor = isDark ? '#1b5e20' : '#2e7d32';
                }, 500);
            }
        });

        function extractListBookData(el) {
            try {
                const titleEl = el.querySelector('.book-name .book-title');
                const authorEls = el.querySelectorAll('.book-name .book-author a');
                const statsEls = el.querySelectorAll('.book-stats-box .book-stats span[data-ready="abbrNum"]');
                const extraInfo = el.querySelector('.book-info-extra');
                let updateDateStr = "", chapterCountStr = "0";
                if (extraInfo) {
                    const text = extraInfo.textContent;
                    const dateMatch = text.match(/(\d{2}-\d{2}-\d{4})/);
                    if (dateMatch) updateDateStr = dateMatch[1];
                    const chapMatch = text.match(/(\d+)\s+chương/);
                    if (chapMatch) chapterCountStr = chapMatch[1];
                }
                return {
                    title: titleEl ? titleEl.textContent.trim() : "No Title",
                    link: titleEl ? titleEl.getAttribute('href') : "#",
                    author: authorEls[0] ? authorEls[0].textContent.trim() : "",
                    status: authorEls[1] ? authorEls[1].textContent.trim() : "Unknown",
                    view: statsEls[0] ? parseNumber(statsEls[0].textContent) : 0,
                    rating: statsEls[1] ? parseNumber(statsEls[1].textContent) : 0,
                    comment: statsEls[2] ? parseNumber(statsEls[2].textContent) : 0,
                    chapter: parseInt(chapterCountStr),
                    updateDate: updateDateStr,
                    timestamp: parseDateToTimestamp(updateDateStr),
                    thanks: 0
                };
            } catch (e) { return null; }
        }

        async function syncData() {
            const btn = document.getElementById('wd-sync-btn');
            const statusMsg = document.getElementById('wd-status-msg');
            btn.disabled = true;
            let allBooks = [];
            let page = 1; let hasNext = true; let start = 0; const limit = 10;
            const baseUrl = `${window.location.origin}/user/${USER_ID}/works`;
            statusMsg.innerText = "⏳ ...";
            const oldCacheRaw = localStorage.getItem(STORAGE_KEY);
            let oldCacheMap = {};
            if(oldCacheRaw) {
                const oldList = JSON.parse(oldCacheRaw);
                oldList.forEach(b => oldCacheMap[b.link] = b);
            }
            while (hasNext) {
                statusMsg.innerText = `P:${page} (${allBooks.length})`;
                try {
                    const response = await fetch(`${baseUrl}?start=${start}`);
                    const text = await response.text();
                    const doc = new DOMParser().parseFromString(text, 'text/html');
                    const bookEls = doc.querySelectorAll('.book-info');
                    if (bookEls.length === 0) { hasNext = false; break; }
                    bookEls.forEach(el => {
                        const newBook = extractListBookData(el);
                        if (newBook) {
                            if (oldCacheMap[newBook.link]) newBook.thanks = oldCacheMap[newBook.link].thanks || 0;
                            allBooks.push(newBook);
                        }
                    });
                    if (bookEls.length < limit) hasNext = false; else { start += limit; page++; }
                    await new Promise(r => setTimeout(r, 300));
                } catch (err) { hasNext = false; }
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allBooks));
            statusMsg.innerText = `✅ ${allBooks.length} truyện.`;
            btn.disabled = false;
            renderList();
        }

        function renderList() {
            const listContainer = document.getElementById('wd-result-list');
            listContainer.innerHTML = '';
            const rawData = localStorage.getItem(STORAGE_KEY);
            if (!rawData) { listContainer.innerHTML = '<div style="text-align:center;color:#999">Vui lòng bấm Đồng bộ.</div>'; return; }
            let books = JSON.parse(rawData);
            const sName = document.getElementById('wd-search').value.toLowerCase();
            const sStatus = document.getElementById('wd-filter-status').value;
            const dateFrom = parseDateToTimestamp(document.getElementById('wd-date-from').value.split('-').reverse().join('-'));
            const dateTo = parseDateToTimestamp(document.getElementById('wd-date-to').value.split('-').reverse().join('-'));
            books = books.filter(b => {
                const matchName = b.title.toLowerCase().includes(sName);
                const matchStatus = sStatus === 'all' || b.status === sStatus;
                let matchDate = true;
                if (document.getElementById('wd-date-from').value && b.timestamp < dateFrom) matchDate = false;
                if (document.getElementById('wd-date-to').value && b.timestamp > dateTo) matchDate = false;
                return matchName && matchStatus && matchDate;
            });
            const sortType = document.getElementById('wd-sort').value;
            books.sort((a, b) => {
                const chapA = a.chapter === -1 ? 0 : a.chapter;
                const chapB = b.chapter === -1 ? 0 : b.chapter;
                if (sortType === 'view') return b.view - a.view;
                if (sortType === 'rating') return b.rating - a.rating;
                if (sortType === 'comment') return b.comment - a.comment;
                if (sortType === 'thanks') return (b.thanks || 0) - (a.thanks || 0);
                if (sortType === 'newest') return b.timestamp - a.timestamp;
                return 0;
            });
            const statusMsg = document.getElementById('wd-status-msg');
            if(!statusMsg.innerText.includes("...")) statusMsg.innerText = `Hiển thị: ${books.length}`;
            books.forEach(b => {
                const chapterDisplay = (b.chapter === -1) ? "-" : `${b.chapter}c`;
                const div = document.createElement('div');
                div.className = 'wd-list-item';
                div.innerHTML = `
                    <a href="${b.link}" target="_blank" class="wd-item-title">${b.title}</a>
                    <div class="wd-item-info">${b.status} • ${chapterDisplay} • ${b.updateDate}</div>
                    <div class="wd-badges">
                        <span class="wd-badge bg-view">👁 ${b.view.toLocaleString()}</span>
                        <span class="wd-badge bg-rate">★ ${b.rating}</span>
                        <span class="wd-badge bg-comment">🗩 ${b.comment}</span>
                        ${b.thanks ? `<span class="wd-badge bg-thanks">♥ ${b.thanks}</span>` : ''}
                    </div>
                `;
                listContainer.appendChild(div);
            });
        }

        document.getElementById('wd-sync-btn').addEventListener('click', syncData);
        document.getElementById('wd-search').addEventListener('input', renderList);
        document.getElementById('wd-filter-status').addEventListener('change', renderList);
        document.getElementById('wd-date-from').addEventListener('change', renderList);
        document.getElementById('wd-date-to').addEventListener('change', renderList);
        document.getElementById('wd-sort').addEventListener('change', renderList);

        if (localStorage.getItem(STORAGE_KEY)) renderList();
    }
})();
