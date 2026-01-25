// ==UserScript==
// @name         Tool Manager 
// @namespace    http://tampermonkey.net/
// @version      10.2
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
    const PAGE_SIZE = 50; 
    const MAX_Z_INDEX = 2147483647;
    if (!IS_LIST_PAGE && !IS_DETAIL_PAGE) return;
    // --- BỎ DẤU ---
    function removeAccents(str) {
        if (!str) return "";
        return str.normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/đ/g, 'd').replace(/Đ/g, 'D')
                  .toLowerCase();
    }
    // ---  LẤY ID TRUYỆN ---
    function getStoryId(url) {
        if (!url) return null;
        try {
            const cleanUrl = url.split(/[?#]/)[0];
            const parts = cleanUrl.split('/').filter(p => p.length > 0);
            const slug = parts[parts.length - 1];
            const slugParts = slug.split('-');
            return slugParts[slugParts.length - 1];
        } catch (e) {
            return url; 
        }
    }
    // --- CSS ---
    const commonStyles = `
        :root {
            --wd-font: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            --wd-bg: rgba(255, 255, 255, 0.95);
            --wd-text: #2c3e50;
            --wd-accent: #27ae60;
            --wd-accent-hover: #219150;
            --wd-danger: #ff4757;
            --wd-danger-hover: #ff6b81;
            --wd-border: rgba(0,0,0,0.08);
            --wd-item-bg: #fff;
            --wd-input-bg: #f1f2f6;
            --wd-shadow: 0 8px 30px rgba(0,0,0,0.12);
            --wd-item-shadow: 0 2px 8px rgba(0,0,0,0.04);
            --wd-header-bg: #fff;
            --wd-text-sub: #a4b0be;
            --wd-scroll: #ced6e0;
            color-scheme: light;
        }
        [data-wd-theme="dark"] {
            --wd-bg: rgba(33, 33, 33, 0.95);
            --wd-text: #dfe4ea;
            --wd-accent: #2ed573;
            --wd-accent-hover: #7bed9f;
            --wd-danger: #ff4757;
            --wd-danger-hover: #ff6b81;
            --wd-border: rgba(255,255,255,0.1);
            --wd-item-bg: #2f3542;
            --wd-input-bg: #57606f;
            --wd-shadow: 0 8px 30px rgba(0,0,0,0.5);
            --wd-item-shadow: 0 4px 12px rgba(0,0,0,0.2);
            --wd-header-bg: #2f3542;
            --wd-text-sub: #a4b0be;
            --wd-scroll: #747d8c;
            color-scheme: dark;
        }
        [data-wd-theme="dark"] ::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
        /* Toast */
        #wd-toast {
            visibility: hidden; min-width: 200px;
            background-color: rgba(47, 53, 66, 0.95);
            backdrop-filter: blur(5px);
            color: #fff; text-align: center; border-radius: 50px;
            padding: 10px 24px; position: fixed; z-index: ${MAX_Z_INDEX};
            left: 50%; bottom: 30px; transform: translateX(-50%) translateY(20px);
            font-family: var(--wd-font); font-size: 13px; font-weight: 500;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            opacity: 0; transition: all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        }
        #wd-toast.show { visibility: visible; transform: translateX(-50%) translateY(0); opacity: 1; }
        /* Detail Panel */
        #wd-chapter-panel {
            position: fixed; top: 100px; left: 20px; z-index: ${MAX_Z_INDEX};
            background: var(--wd-bg); color: var(--wd-text);
            border-left: 4px solid var(--wd-accent);
            padding: 10px 18px; border-radius: 0 12px 12px 0;
            box-shadow: var(--wd-shadow);
            font-family: var(--wd-font); font-size: 13px; font-weight: 600;
            display: flex; align-items: center; gap: 8px;
            transition: transform 0.2s; cursor: default;
            backdrop-filter: blur(10px);
        }
        #wd-chapter-panel:hover { transform: translateX(5px); }
        #wd-chapter-panel span.num { color: var(--wd-danger); font-size: 16px; font-weight: 700; }
    `;
    const styleEl = document.createElement("style");
    styleEl.innerText = commonStyles;
    document.head.appendChild(styleEl);
    // --- HELPER FUNCTIONS ---
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
        let s = str.toString().toLowerCase().trim();
        if (s.includes('k')) return Math.round(parseFloat(s.replace(',', '.')) * 1000);
        if (s.includes('m')) return Math.round(parseFloat(s.replace(',', '.')) * 1000000);
        return parseInt(s.replace(/\./g, '').replace(/,/g, '').replace(/\D/g, '')) || 0;
    }
    function parseDateToTimestamp(dateStr) {
        if (!dateStr) return 0;
        const parts = dateStr.trim().split('-');
        if (parts.length === 3) return new Date(parts[2], parts[1] - 1, parts[0]).getTime();
        return 0;
    }
    // --- MODULE 1: DETAIL PAGE ---
    if (IS_DETAIL_PAGE) setTimeout(initDetailLogic, 1000);
    function initDetailLogic() {
        handleDetailPage();
        const targetNode = document.querySelector('.volume-list');
        if (targetNode) {
            new MutationObserver(() => {
                if (window.wdUpdateTimeout) clearTimeout(window.wdUpdateTimeout);
                window.wdUpdateTimeout = setTimeout(handleDetailPage, 200);
            }).observe(targetNode, { attributes: false, childList: true, subtree: true });
        }
    }
    async function handleDetailPage() {
        const data = await scrapeDetailData();
        if (!data) return;
        if (data.realChapterCount !== null) {
            showChapterCountPanel(data.realChapterCount, true);
            data.chapter = data.realChapterCount;
            const cacheInfo = findInCache(data.link);
            if (cacheInfo.found) {
                updateCacheEntry(cacheInfo.key, cacheInfo.index, data, cacheInfo.list);
            }
        } else {
            showChapterCountPanel(null, false);
        }
        const cacheInfo = findInCache(data.link);
        if (!cacheInfo.found) renderAddButton(data);
    }
    function calculateRealChapters() {
        const paginationContainer = document.querySelector('.volume-list .pagination');
        const validChapterLinks = document.querySelectorAll('.volume-list .chapter-name a[href]');
        const realCountOnPage = Array.from(validChapterLinks).filter(a => {
            const href = a.getAttribute('href');
            return href && href.trim() !== '' && href !== '#';
        }).length;
        if (!paginationContainer || paginationContainer.querySelectorAll('li').length <= 1) return realCountOnPage;
        const pageLinks = paginationContainer.querySelectorAll('li a');
        let maxPage = 1;
        pageLinks.forEach(a => {
            const num = parseInt(a.textContent);
            if (!isNaN(num) && num > maxPage) maxPage = num;
        });
        const activeLi = paginationContainer.querySelector('li.active');
        const activePage = activeLi ? parseInt(activeLi.textContent) : 1;
        if (activePage === maxPage) return ((maxPage - 1) * PAGE_SIZE) + realCountOnPage;
        return null;
    }
    function showChapterCountPanel(count, isExact) {
        let panel = document.getElementById('wd-chapter-panel');
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'wd-chapter-panel';
            document.body.appendChild(panel);
        }
        if (isExact) {
            panel.innerHTML = `📖 Tổng: <span class="num">${count.toLocaleString()}</span> chương`;
            panel.style.borderLeftColor = 'var(--wd-accent)';
            panel.onclick = null;
            panel.style.cursor = 'default';
        } else {
            panel.innerHTML = `👉 Bấm sang trang cuối!`;
            panel.style.borderLeftColor = '#f39c12';
            panel.style.cursor = 'pointer';
            panel.onclick = () => {
                const pagination = document.querySelector('.volume-list .pagination');
                if(pagination) pagination.scrollIntoView({behavior: "smooth"});
            };
        }
    }
    async function scrapeDetailData() {
        try {
            const response = await fetch(window.location.href);
            const text = await response.text();
            const doc = new DOMParser().parseFromString(text, 'text/html');
            const coverInfo = doc.querySelector('.cover-info');
            if (!coverInfo) return null;
            const title = coverInfo.querySelector('h2').textContent.trim();
            const stats = coverInfo.querySelectorAll('span[data-ready="abbrNum"]');
            let author = "", status = "", updateDate = "", thanks = 0;
            coverInfo.querySelectorAll('div > p').forEach(p => {
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
                timestamp: parseDateToTimestamp(updateDate),
                realChapterCount: calculateRealChapters()
            };
        } catch (e) { return null; }
    }
    // --- tìm ID trùng trong cache ---
    function findInCache(currentLink) {
        const currentId = getStoryId(currentLink);
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(CACHE_PREFIX)) {
                const raw = localStorage.getItem(key);
                if (raw) {
                    const list = JSON.parse(raw);
                    const idx = list.findIndex(b => getStoryId(b.link) === currentId);
                    if (idx !== -1) return { found: true, key: key, index: idx, list: list };
                }
            }
        }
        return { found: false };
    }
    function updateCacheEntry(key, index, newData, currentList) {
        const oldItem = currentList[index];
        const finalChapter = newData.realChapterCount !== null ? newData.realChapterCount : oldItem.chapter;
        // Ghi đè toàn bộ thông tin mới 
        currentList[index] = { ...oldItem, ...newData, chapter: finalChapter };
        delete currentList[index].realChapterCount;
        localStorage.setItem(key, JSON.stringify(currentList));
        showToast("💾 Đã cập nhật thông tin!"); 
    }
    function renderAddButton(data) {
        document.querySelectorAll('.wd-add-btn-unique').forEach(b => b.remove());
        const btn = document.createElement('button');
        btn.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        `;
        btn.className = "wd-add-btn-unique";
        Object.assign(btn.style, {
            position: 'fixed', bottom: '30px', right: '30px',
            background: 'var(--wd-accent)', color: '#fff', width: '56px', height: '56px',
            borderRadius: '50%', border: 'none', cursor: 'pointer',
            zIndex: MAX_Z_INDEX, boxShadow: '0 4px 15px rgba(39, 174, 96, 0.4)', transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
        });
        btn.onmouseover = () => btn.style.transform = "scale(1.1) rotate(90deg)";
        btn.onmouseout = () => btn.style.transform = "scale(1) rotate(0deg)";
        btn.onclick = function() {
            let firstKey = null;
            for (let i = 0; i < localStorage.length; i++) {
                if (localStorage.key(i).startsWith(CACHE_PREFIX)) { firstKey = localStorage.key(i); break; }
            }
            if (firstKey) {
                const list = JSON.parse(localStorage.getItem(firstKey));
                const chap = data.realChapterCount !== null ? data.realChapterCount : -1;
                list.unshift({ ...data, chapter: chap });
                localStorage.setItem(firstKey, JSON.stringify(list));
                showToast(`✅ Đã thêm truyện`);
                btn.style.opacity = '0';
                setTimeout(()=> btn.style.display = 'none', 300);
            } else { showToast("⚠️ Không tìm thấy list."); }
        };
        document.body.appendChild(btn);
    }
    // --- MODULE 2: LIST PAGE ---
    if (IS_LIST_PAGE) initListPage();
    function initListPage() {
        const USER_ID = PATH.split('/')[2];
        const STORAGE_KEY = `${CACHE_PREFIX}${USER_ID}`;
        const panelStyles = `
            #wd-panel {
                position: fixed; top: 10vh; right: 20px; width: 320px;
                background: var(--wd-bg); color: var(--wd-text);
                border-radius: 16px; z-index: ${MAX_Z_INDEX};
                font-family: var(--wd-font); font-size: 13px;
                display: flex; flex-direction: column;
                max-height: 85vh; transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
                overflow: hidden; border: 1px solid var(--wd-border);
                box-shadow: var(--wd-shadow);
                backdrop-filter: blur(10px);
            }
            #wd-panel.wd-minimized {
                width: auto !important; height: 50px !important; min-width: 160px;
                border-radius: 25px; top: auto !important; bottom: 30px; right: 30px;
                cursor: pointer; background: var(--wd-accent) !important;
                padding: 0 20px; display: flex; align-items: center; justify-content: center;
                border: 2px solid rgba(255,255,255,0.2);
                box-shadow: 0 4px 15px rgba(39, 174, 96, 0.5);
            }
            #wd-panel.wd-minimized > * { display: none !important; }
            #wd-panel.wd-minimized::after {
                content: "🗃️ Tool Manager"; color: #fff; font-weight: 700; font-size: 14px;
                white-space: nowrap; letter-spacing: 0.5px;
            }
            #wd-panel.wd-minimized:hover { transform: translateY(-5px); }
            #wd-header {
                padding: 12px 16px; background: transparent; border-bottom: 1px solid var(--wd-border);
                display: flex; justify-content: space-between; align-items: center; user-select: none; flex-shrink: 0;
            }
            .wd-title-text { font-weight: 800; font-size: 14px; color: var(--wd-accent); letter-spacing: 0.5px; }
            .wd-actions { display: flex; gap: 8px; }
            .wd-icon-btn {
                background: transparent; border: none; cursor: pointer; font-size: 16px;
                width: 28px; height: 28px; border-radius: 6px; color: var(--wd-text-sub); transition: 0.2s;
                display: flex; align-items: center; justify-content: center;
            }
            .wd-icon-btn:hover { background: rgba(0,0,0,0.05); color: var(--wd-text); }
            .wd-icon-btn.danger:hover { color: var(--wd-danger); background: rgba(231, 76, 60, 0.1); }
            #wd-body {
                padding: 12px; overflow-y: auto; overflow-x: hidden; flex-grow: 1;
                scrollbar-width: thin; scrollbar-color: var(--wd-scroll) transparent;
            }
            #wd-body::-webkit-scrollbar { width: 5px; }
            #wd-body::-webkit-scrollbar-thumb { background: var(--wd-scroll); border-radius: 10px; }
            .wd-input, .wd-select {
                width: 100%; border: 1px solid transparent; background: var(--wd-input-bg); color: var(--wd-text);
                padding: 8px 12px; border-radius: 8px; font-size: 12px; outline: none; transition: 0.2s;
                height: 36px; margin-bottom: 0; box-sizing: border-box;
            }
            .wd-input:focus, .wd-select:focus { background: var(--wd-bg); border-color: var(--wd-accent); box-shadow: 0 0 0 3px rgba(39, 174, 96, 0.1); }
            .wd-row { display: flex; gap: 8px; margin-bottom: 10px; }
            .wd-col { flex: 1; }
            .wd-btn {
                width: 100%; padding: 8px 0; border: none; border-radius: 8px;
                font-weight: 700; color: #fff; cursor: pointer; font-size: 11px; text-transform: uppercase;
                background: var(--wd-accent); transition: 0.2s; letter-spacing: 0.5px;
            }
            .wd-btn:hover { background: var(--wd-accent-hover); box-shadow: 0 4px 10px rgba(39, 174, 96, 0.3); transform: translateY(-1px); }
            .wd-btn:active { transform: translateY(1px); }
            .wd-btn:disabled { opacity: 0.6; cursor: not-allowed; box-shadow: none; transform: none; }
            .wd-btn.danger { background: var(--wd-danger); }
            .wd-btn.danger:hover { background: var(--wd-danger-hover); box-shadow: 0 4px 10px rgba(231, 76, 60, 0.3); }
            #wd-result-list { margin-top: 10px; }
            .wd-list-item {
                background: var(--wd-item-bg); padding: 12px; margin-bottom: 8px;
                border-radius: 10px; box-shadow: var(--wd-item-shadow);
                transition: all 0.2s; border: 1px solid var(--wd-border);
                position: relative; overflow: hidden;
            }
            .wd-list-item:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.08); border-color: rgba(39, 174, 96, 0.3); }
            .wd-item-title {
                display: block; font-weight: 700; font-size: 13px; color: var(--wd-text);
                text-decoration: none; margin-bottom: 6px;
                white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 25px;
            }
            .wd-item-title:hover { color: var(--wd-accent); }
            .wd-item-meta { font-size: 11px; color: var(--wd-text-sub); margin-bottom: 8px; display: flex; justify-content: space-between; align-items: center;}
            .wd-badges { display: flex; gap: 4px; flex-wrap: wrap; }
            .wd-badge {
                padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 600;
                background: var(--wd-input-bg); color: var(--wd-text-sub);
                display: flex; align-items: center; gap: 3px;
            }
            .wd-badge.highlight { color: var(--wd-accent); background: rgba(39, 174, 96, 0.08); }
            .wd-delete-item {
                position: absolute;
                top: 8px; right: 8px;
                width: 26px; height: 26px;
                border-radius: 50%;
                display: flex; align-items: center; justify-content: center;
                background: transparent;
                color: var(--wd-text-sub);
                font-size: 14px;
                border: none;
                cursor: pointer;
                z-index: 10;
                transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
                opacity: 0;
            }
            .wd-list-item:hover .wd-delete-item {opacity: 0.5;}
            .wd-delete-item:hover {background: var(--wd-danger);color: white;}
        `;
        const pStyle = document.createElement("style");
        pStyle.innerText = panelStyles;
        document.head.appendChild(pStyle);
        const panelHTML = `
            <div id="wd-header">
                <span class="wd-title-text">🗃️ TOOL MANAGER</span>
                <div class="wd-actions">
                    <button id="wd-theme-toggle" class="wd-icon-btn" title="Giao diện">☀️</button>
                    <button id="wd-minimize-btn" class="wd-icon-btn" title="Thu nhỏ">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                    </button>
                </div>
            </div>
            <div id="wd-body">
                <div class="wd-row">
                    <button id="wd-sync-btn" class="wd-btn" style="flex-grow:1;">🔄 ĐỒNG BỘ</button>
                    <button id="wd-clear-all-btn" class="wd-btn danger" style="width: 44px;" title="Xoá sạch">🗑️</button>
                </div>
                <div id="wd-status-msg" style="text-align:center;font-size:11px;color:var(--wd-text-sub);margin-bottom:8px;font-style:italic;">Sẵn sàng.</div>
                <input type="text" id="wd-search" class="wd-input" placeholder="🔍 Tìm tên truyện..." >
                <div class="wd-row">
                    <div class="wd-col">
                        <select id="wd-filter-status" class="wd-select browser-default">
                            <option value="all">Tất cả</option>
                            <option value="Còn tiếp">Còn tiếp</option>
                            <option value="Hoàn thành">Hoàn thành</option>
                            <option value="Tạm ngưng">Tạm ngưng</option>
                            <option value="Chưa xác minh">Chưa xác minh</option>
                        </select>
                    </div>
                    <div class="wd-col">
                        <select id="wd-sort" class="wd-select browser-default">
                            <option value="newest">📅 Mới nhất</option>
                            <option value="oldest">📅 Cũ nhất</option> 
							<option value="view">👀 Lượt xem</option>
                            <option value="rating">⭐ Đánh giá</option>
                            <option value="comment">💬 Bình luận</option>
                            <option value="thanks">🩷 Cảm ơn</option>
                        </select>
                    </div>
                </div>
                <div class="wd-row" style="margin-bottom:0;">
                    <input type="date" id="wd-date-from" class="wd-input" style="margin:0" title="Từ ngày">
                    <input type="date" id="wd-date-to" class="wd-input" style="margin:0" title="Đến ngày">
                </div>
                <div id="wd-result-list"></div>
            </div>
        `;
        const panel = document.createElement('div');
        panel.id = 'wd-panel';
        panel.innerHTML = panelHTML;
        document.body.appendChild(panel);
        const themeBtn = document.getElementById('wd-theme-toggle');
        const minBtn = document.getElementById('wd-minimize-btn');
        const clearAllBtn = document.getElementById('wd-clear-all-btn');
        clearAllBtn.onclick = () => {
            if(confirm("❗CẢNH BÁO❗\nBạn có chắc chắn muốn xoá toàn bộ dữ liệu đã lưu không? Hành động này không thể hoàn tác.")) {
                localStorage.removeItem(STORAGE_KEY);
                renderList();
                showToast("🗑️ Đã xoá toàn bộ dữ liệu.");
            }
        };
        let currentTheme = localStorage.getItem(THEME_KEY) === 'dark';
        function applyTheme(isDark) {
            if (isDark) { panel.setAttribute('data-wd-theme', 'dark'); themeBtn.textContent = '🌙'; }
            else { panel.removeAttribute('data-wd-theme'); themeBtn.textContent = '☀️'; }
        }
        applyTheme(currentTheme);
        themeBtn.onclick = () => {
            currentTheme = !currentTheme;
            localStorage.setItem(THEME_KEY, currentTheme ? 'dark' : 'light');
            applyTheme(currentTheme);
        };
        minBtn.onclick = (e) => { e.stopPropagation(); panel.classList.add('wd-minimized'); };
        panel.onclick = (e) => { if (panel.classList.contains('wd-minimized')) panel.classList.remove('wd-minimized'); };
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
            btn.disabled = true; btn.innerText = "⏳...";
            let allBooks = [];
            let page = 1; let hasNext = true; let start = 0; const limit = 10;
            const baseUrl = `${window.location.origin}/user/${USER_ID}/works`;
            const oldCacheRaw = localStorage.getItem(STORAGE_KEY);
            let oldCacheMap = {};
            if(oldCacheRaw) {
                JSON.parse(oldCacheRaw).forEach(b => {
                    const id = getStoryId(b.link);
                    if(id) oldCacheMap[id] = b;
                });
            }
            while (hasNext) {
                statusMsg.innerText = `Đang tải trang ${page}... (Đã lấy ${allBooks.length} truyện)`;
                try {
                    const response = await fetch(`${baseUrl}?start=${start}`);
                    const text = await response.text();
                    const doc = new DOMParser().parseFromString(text, 'text/html');
                    const bookEls = doc.querySelectorAll('.book-info');
                    if (bookEls.length === 0) { hasNext = false; break; }
                    bookEls.forEach(el => {
                        const newBook = extractListBookData(el);
                        if (newBook) {
                            const id = getStoryId(newBook.link);
                            if (id && oldCacheMap[id]) {
                                newBook.thanks = oldCacheMap[id].thanks || 0;
                                if(oldCacheMap[id].chapter > 0) newBook.chapter = oldCacheMap[id].chapter;
                            }
                            allBooks.push(newBook);
                        }
                    });
                    if (bookEls.length < limit) hasNext = false; else { start += limit; page++; }
                    await new Promise(r => setTimeout(r, 300));
                } catch (err) { hasNext = false; }
            }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(allBooks));
            statusMsg.innerText = `✅ Hoàn tất: ${allBooks.length} truyện.`;
            btn.disabled = false; btn.innerText = "🔄 ĐỒNG BỘ";
            renderList();
        }
        function renderList() {
            const listContainer = document.getElementById('wd-result-list');
            listContainer.innerHTML = '';
            const rawData = localStorage.getItem(STORAGE_KEY);
            if (!rawData) { listContainer.innerHTML = '<div style="text-align:center;padding:20px;color:var(--wd-text-sub);font-size:12px;">Chưa có dữ liệu. Bấm "Đồng bộ" để lấy truyện.</div>'; return; }
            let books = JSON.parse(rawData);
            const sName = removeAccents(document.getElementById('wd-search').value);
            const sStatus = document.getElementById('wd-filter-status').value;
            const dateFrom = parseDateToTimestamp(document.getElementById('wd-date-from').value.split('-').reverse().join('-'));
            const dateTo = parseDateToTimestamp(document.getElementById('wd-date-to').value.split('-').reverse().join('-'));
            books = books.filter(b => {
                const matchName = removeAccents(b.title).includes(sName);
                const matchStatus = sStatus === 'all' || b.status === sStatus;
                let matchDate = true;
                if (document.getElementById('wd-date-from').value && b.timestamp < dateFrom) matchDate = false;
                if (document.getElementById('wd-date-to').value && b.timestamp > dateTo) matchDate = false;
                return matchName && matchStatus && matchDate;
            });
            const sortType = document.getElementById('wd-sort').value;
            // --- SORT LOGIC ---
            books.sort((a, b) => {
                if (sortType === 'oldest') {
                    return (a.timestamp || 0) - (b.timestamp || 0);
                }
                const getVal = (item, key) => (key === 'newest' ? item.timestamp : item[key] || 0);
                return getVal(b, sortType) - getVal(a, sortType);
            });
            const statusMsg = document.getElementById('wd-status-msg');
            if(!statusMsg.innerText.includes("...")) statusMsg.innerText = `Hiển thị: ${books.length} truyện`;
            books.forEach(b => {
                const chapterDisplay = (b.chapter === -1 || b.chapter === 0) ? "N/A" : `${b.chapter.toLocaleString()} chương`;
                const div = document.createElement('div');
                div.className = 'wd-list-item';
                div.innerHTML = `
                    <button class="wd-delete-item" title="Xoá truyện này">
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    <a href="${b.link}" target="_blank" class="wd-item-title">${b.title}</a>
                    <div class="wd-item-meta">
                        <span>${b.status} • ${chapterDisplay}</span>
                        <span>${b.updateDate}</span>
                    </div>
                    <div class="wd-badges">
                        <span class="wd-badge highlight">👀 ${b.view > 1000 ? (b.view/1000).toFixed(1)+'k' : b.view}</span>
                        <span class="wd-badge highlight">⭐ ${b.rating}</span>
                        <span class="wd-badge highlight">💬 ${b.comment}</span>
                        ${b.thanks ? `<span class="wd-badge highlight">🩷 ${b.thanks}</span>` : ''}
                    </div>
                `;
                const delBtn = div.querySelector('.wd-delete-item');
                delBtn.onclick = (e) => {
                    e.stopPropagation();
                    if(confirm(`Xoá "${b.title}" khỏi danh sách?`)) {
                        const currentList = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
                        const delId = getStoryId(b.link);
                        const newList = currentList.filter(item => getStoryId(item.link) !== delId);
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
                        renderList();
                        showToast('Đã xoá 1 truyện.');
                    }
                };
                listContainer.appendChild(div);
            });
        }
        document.getElementById('wd-sync-btn').addEventListener('click', syncData);
        ['wd-search', 'wd-filter-status', 'wd-date-from', 'wd-date-to', 'wd-sort'].forEach(id => {
            document.getElementById(id).addEventListener(id === 'wd-search' ? 'input' : 'change', renderList);
        });
        window.addEventListener('storage', (e) => {
            if (e.key === STORAGE_KEY) {
                renderList();
            }
        });
        if (localStorage.getItem(STORAGE_KEY)) renderList();
    }
})();
