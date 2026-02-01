// ==UserScript==
// @name         Tool Manager
// @namespace    http://tampermonkey.net/
// @version      17.2
// @description  Quản lý truyện
// @author       Minty
// @match        https://*.net/user/*/works*
// @match        https://*.net/truyen/*
// @updateURL    https://github.com/miinty0/draft/raw/refs/heads/main/Tool%20Manager.user.js
// @downloadURL  https://github.com/miinty0/draft/raw/refs/heads/main/Tool%20Manager.user.js
// @grant        none
// ==/UserScript==
(function() {
    'use strict';
    // --- CONFIG & CONSTANTS ---
    const PATH = window.location.pathname;
    const IS_LIST_PAGE = PATH.includes('/user/') && PATH.includes('/works');
    const IS_DETAIL_PAGE = /^\/truyen\/[^/]+$/.test(PATH);
    const DB_NAME = 'TruyenManagerDB';
    const DB_VERSION = 1;
    const STORE_NAME = 'stories';
    const THEME_KEY = 'wd_theme_mode';
    const MAX_Z_INDEX = 999999;
    const SYNC_CHANNEL_NAME = 'wd_manager_sync_channel';
    let GLOBAL_CACHE = [];
    // VIRTUAL SCROLLING CONFIG
    const VIRTUAL_SCROLL = { ITEM_HEIGHT: 90, VISIBLE_ITEMS: 30, BUFFER_ITEMS: 10 };
    let virtualScrollState = { scrollTop: 0, filteredData: [], startIndex: 0, endIndex: 30 };
    let scrollRAF = null;
    let searchDebounceTimer = null;
    const SEARCH_DEBOUNCE_DELAY = 300;
    // --- UTILS ---
    const removeAccents = s => s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase() : "";
    const getStoryId = url => { try { return url.split(/[?#]/)[0].split('/').filter(p => p).pop().split('-').pop(); } catch (e) { return url; } };
    const parseNumber = s => { if (!s) return 0; s = s.toString().toLowerCase().trim(); return s.includes('k') ? Math.round(parseFloat(s) * 1e3) : s.includes('m') ? Math.round(parseFloat(s) * 1e6) : parseInt(s.replace(/\D/g, '')) || 0; };
    const parseDateToTimestamp = d => { const p = d?.trim().split('-'); return p?.length === 3 ? new Date(p[2], p[1] - 1, p[0]).getTime() : 0; };
    const syncChannel = new BroadcastChannel(SYNC_CHANNEL_NAME);
    // --- DB HELPER ---
    const db = {
        open: () => new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        }),
        getAll: () => new Promise(async (resolve) => {
            const d = await db.open();
            const tx = d.transaction(STORE_NAME, 'readonly');
            const req = tx.objectStore(STORE_NAME).getAll();
            req.onsuccess = () => resolve(req.result || []);
            req.onerror = () => resolve([]);
        }),
        putBulk: (items) => new Promise(async (resolve) => {
            const d = await db.open();
            const tx = d.transaction(STORE_NAME, 'readwrite');
            const store = tx.objectStore(STORE_NAME);
            items.forEach(item => store.put(item));
            tx.oncomplete = () => resolve();
        }),
        delete: (id) => new Promise(async (resolve) => {
            const d = await db.open();
            const tx = d.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).delete(id);
            tx.oncomplete = () => resolve();
        }),
        clearAll: () => new Promise(async (resolve) => {
            const d = await db.open();
            const tx = d.transaction(STORE_NAME, 'readwrite');
            tx.objectStore(STORE_NAME).clear();
            tx.oncomplete = () => resolve();
        })
    };
    // --- AUDIO ---
    let audioCtx, osc, gainNode;
    async function activateKeepAlive() {
        try {
            if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            if (audioCtx.state === 'suspended') await audioCtx.resume();
            if (!osc) {
                osc = audioCtx.createOscillator();
                gainNode = audioCtx.createGain();
                gainNode.gain.value = 0.005; osc.frequency.value = 20;
                osc.connect(gainNode); gainNode.connect(audioCtx.destination);
                osc.start();
            }
            return true;
        } catch (e) { console.error(e); return false; }
    }
    function stopKeepAlive() {
        try { if (osc) { osc.stop(); osc = null; } if (gainNode) { gainNode.disconnect(); gainNode = null; } if (audioCtx) audioCtx.suspend(); } catch (e) { }
    }
    // --- UI STYLES ---
    const styleEl = document.createElement("style");
    styleEl.innerText = `:root{ --wd-font:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; --wd-bg:rgba(255,255,255,0.95); --wd-text:#2c3e50; --wd-accent:#27ae60; --wd-accent-hover:#219150; --wd-danger:#ff4757; --wd-danger-hover:#ff6b81; --wd-border:rgba(0,0,0,0.08); --wd-item-bg:#fff; --wd-input-bg:#f1f2f6; --wd-shadow:0 8px 30px rgba(0,0,0,0.12); --wd-item-shadow:0 2px 8px rgba(0,0,0,0.04); --wd-header-bg:#fff;--wd-text-sub:#a4b0be; --wd-scroll:#ced6e0;color-scheme:light} [data-wd-theme="dark"]{ --wd-bg:rgba(33,33,33,0.95); --wd-text:#dfe4ea; --wd-accent:#2ed573; --wd-accent-hover:#7bed9f; --wd-danger:#ff4757; --wd-danger-hover:#ff6b81; --wd-border:rgba(255,255,255,0.1); --wd-item-bg:#2f3542; --wd-input-bg:#57606f; --wd-shadow:0 8px 30px rgba(0,0,0,0.5); --wd-item-shadow:0 4px 12px rgba(0,0,0,0.2); --wd-header-bg:#2f3542; --wd-text-sub:#a4b0be; --wd-scroll:#747d8c;color-scheme:dark} [data-wd-theme="dark"] ::-webkit-calendar-picker-indicator{filter:invert(1);cursor:pointer}#wd-toast{visibility:hidden;min-width:200px;background-color:rgba(47,53,66,0.95);backdrop-filter:blur(5px);color:#fff;text-align:center;border-radius:50px;padding:10px 24px;position:fixed;z-index:${MAX_Z_INDEX};left:50%;bottom:30px;transform:translateX(-50%) translateY(20px);font-family:var(--wd-font);font-size:13px;font-weight:500;box-shadow:0 10px 30px rgba(0,0,0,0.2);opacity:0;transition:all 0.3s}#wd-toast.show{visibility:visible;transform:translateX(-50%) translateY(0);opacity:1} #wd-chapter-panel{position:fixed;top:100px;left:20px;z-index:${MAX_Z_INDEX};background:var(--wd-bg);color:var(--wd-text);border-left:4px solid var(--wd-accent);padding:10px 18px;border-radius:0 12px 12px 0;box-shadow:var(--wd-shadow);font-family:var(--wd-font);font-size:13px;font-weight:600;display:flex;align-items:center;gap:8px;transition:all 0.3s;cursor:default;backdrop-filter:blur(10px);max-width:300px;overflow:hidden}#wd-chapter-panel:hover{transform:translateX(5px)} #wd-chapter-panel span.num{color:var(--wd-danger);font-size:16px;font-weight:700} #wd-chapter-panel .wd-close{cursor:pointer;margin-left:8px;opacity:0.4;font-size:10px;padding:4px} #wd-chapter-panel .wd-close:hover{opacity:1;background:rgba(0,0,0,0.1);border-radius:50%} #wd-chapter-panel.wd-collapsed{width:40px;height:40px;padding:0;justify-content:center;border-radius:50%;background:var(--wd-bg);border:2px solid var(--wd-accent);cursor:pointer} #wd-chapter-panel.wd-collapsed .wd-content,#wd-chapter-panel.wd-collapsed .wd-close{display:none!important;} #wd-chapter-panel.wd-collapsed::after{content:"🗃️";font-size:20px;} .wd-load-more{width:100%;padding:10px;background:transparent;border:1px dashed var(--wd-border);color:var(--wd-text-sub);cursor:pointer;font-size:12px;border-radius:8px;transition:0.2s} .wd-load-more:hover{background:rgba(0,0,0,0.05);color:var(--wd-accent);border-color:var(--wd-accent)} .wd-io-btn{font-size:10px;padding:4px 8px;border:1px solid var(--wd-border);background:var(--wd-input-bg);color:var(--wd-text);border-radius:6px;cursor:pointer;transition:0.2s} .wd-io-btn:hover{border-color:var(--wd-accent);color:var(--wd-accent)} `;
    document.head.appendChild(styleEl);
    const toast = document.createElement('div'); toast.id = 'wd-toast'; document.body.appendChild(toast);
    const showToast = msg => { toast.textContent = msg; toast.className = "show"; setTimeout(() => toast.classList.remove("show"), 2000); };
    if (!IS_LIST_PAGE && !IS_DETAIL_PAGE) return;
    // --- DETAIL PAGE LOGIC ---
    if (IS_DETAIL_PAGE) {
        setTimeout(initDetailLogic, 1000);
        function initDetailLogic() {
            handleDetailPage();
            const n = document.querySelector('.volume-list');
            if (n) new MutationObserver(() => {
                clearTimeout(window.wdUT);
                window.wdUT = setTimeout(handleDetailPage, 500);
            }).observe(n, { attributes: false, childList: true, subtree: true });
        }
        async function handleDetailPage() {
            const data = await scrapeDetailData(); if (!data) return;
            showChapterCountPanel(data.realChapterCount || null, data.realChapterCount !== null);
            if (data.realChapterCount !== null) {
                const exists = await checkInDB(data.link);
                if (exists) {
                    await db.putBulk([{ ...exists, ...data, chapter: data.realChapterCount }]);
                    showToast("💾 Đã cập nhật!");
                    syncChannel.postMessage({ type: 'REFRESH' });
                }
            }
            const check = await checkInDB(data.link);
            if (!check) renderAddButton(data);
        }
        async function checkInDB(link) {
            const id = getStoryId(link);
            const d = await db.open();
            return new Promise(resolve => {
                const req = d.transaction(STORE_NAME).objectStore(STORE_NAME).get(id);
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => resolve(null);
            });
        }
        function calculateRealChapters() {
            const pg = document.querySelector('.volume-list .pagination');
            const valid = [...document.querySelectorAll('.volume-list .chapter-name a')]
            .filter(a => a.hasAttribute('href') && a.getAttribute('href').trim() !== '' && a.getAttribute('href') !== '#!').length;
            if (!pg || pg.querySelectorAll('li').length <= 1) return valid;
            const max = Math.max(...[...pg.querySelectorAll('li a')].map(a => parseInt(a.textContent) || 0), 1);
            const act = parseInt(pg.querySelector('li.active')?.textContent) || 1;
            return act === max ? ((max - 1) * 501) + valid : null;
        }
        function showChapterCountPanel(count, isExact) {
            let p = document.getElementById('wd-chapter-panel') || Object.assign(document.createElement('div'), { id: 'wd-chapter-panel' });
            if (!p.parentNode) document.body.appendChild(p);
            const infoHtml = isExact ? `📖 Tổng: <span class="num">${count.toLocaleString()}</span> chương` : `👉 Bấm sang trang cuối!`;
            p.innerHTML = `<span class="wd-content" style="display:flex;align-items:center;gap:5px">${infoHtml}</span><span class="wd-close" title="Thu gọn">✖</span>`;
            p.style.borderLeftColor = isExact ? 'var(--wd-accent)' : '#f39c12';
            const closeBtn = p.querySelector('.wd-close');
            const content = p.querySelector('.wd-content');
            if (content) content.onclick = () => { if (!isExact) document.querySelector('.volume-list .pagination')?.scrollIntoView({ behavior: "smooth" }); };
            if (closeBtn) closeBtn.onclick = (e) => { e.stopPropagation(); p.classList.add('wd-collapsed'); p.title = "Click để xem số chương"; };
            p.onclick = () => { if (p.classList.contains('wd-collapsed')) { p.classList.remove('wd-collapsed'); p.title = ""; } };
        }
        async function scrapeDetailData() {
            try {
                const doc = new DOMParser().parseFromString(await (await fetch(location.href)).text(), 'text/html'), ci = doc.querySelector('.cover-info');
                if (!ci) return null;
                const stats = ci.querySelectorAll('span[data-ready="abbrNum"]'), txts = [...ci.querySelectorAll('div > p')];
                const getTxt = k => txts.find(p => p.textContent.includes(k))?.querySelector('a')?.textContent.trim() || "";
                return {
                    id: getStoryId(location.pathname),
                    title: ci.querySelector('h2').textContent.trim(), author: getTxt("Tác giả:"), status: getTxt("Tình trạng:"),
                    updateDate: txts.find(p => p.textContent.includes("đổi mới:"))?.querySelector('span')?.textContent.trim() || "",
                    thanks: parseNumber(txts.find(p => p.textContent.includes("Cảm ơn:"))?.querySelector('span')?.textContent),
                    link: location.pathname, view: parseNumber(stats[0]?.textContent), rating: parseNumber(stats[1]?.textContent),
                    comment: parseNumber(stats[2]?.textContent), timestamp: parseDateToTimestamp(txts.find(p => p.textContent.includes("đổi mới:"))?.querySelector('span')?.textContent.trim()),
                    realChapterCount: calculateRealChapters()
                };
            } catch (e) { return null; }
        }
        function renderAddButton(data) {
            document.querySelectorAll('.wd-add-btn-unique').forEach(b => b.remove());
            const btn = Object.assign(document.createElement('button'), { className: "wd-add-btn-unique", innerHTML: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>` });
            Object.assign(btn.style, { position: 'fixed', bottom: '30px', right: '30px', background: 'var(--wd-accent)', color: '#fff', width: '56px', height: '56px', borderRadius: '50%', border: 'none', cursor: 'pointer', zIndex: MAX_Z_INDEX, boxShadow: '0 4px 15px rgba(39, 174, 96, 0.4)', transition: 'all 0.3s', display: 'flex', alignItems: 'center', justifyContent: 'center' });
            btn.onmouseover = () => btn.style.transform = "scale(1.1) rotate(90deg)"; btn.onmouseout = () => btn.style.transform = "scale(1) rotate(0deg)";
            btn.onclick = async () => {
                await db.putBulk([{ ...data, chapter: data.realChapterCount ?? -1 }]);
                showToast(`✅ Đã thêm`);
                syncChannel.postMessage({ type: 'REFRESH' });
                btn.style.opacity = '0';
                setTimeout(() => btn.style.display = 'none', 300);
            };
            document.body.appendChild(btn);
        }
    }
    // --- LIST PAGE LOGIC ---
    if (IS_LIST_PAGE) {
        const USER_ID = PATH.split('/')[2];
        syncChannel.onmessage = async (e) => {
            if (e.data && e.data.type === 'REFRESH') {
                GLOBAL_CACHE = await db.getAll();
                renderList();
            }
        };
        const pStyle = document.createElement("style");
        pStyle.innerText = `#wd-panel{position:fixed;top:10vh;right:20px;width:320px;background:var(--wd-bg);color:var(--wd-text);border-radius:16px;z-index:${MAX_Z_INDEX};font-family:var(--wd-font);font-size:13px;display:flex;flex-direction:column;max-height:85vh;transition:all 0.4s cubic-bezier(0.25,0.8,0.25,1);border:1px solid var(--wd-border);box-shadow:var(--wd-shadow);backdrop-filter:blur(10px)}#wd-panel.wd-minimized{width:auto!important;height:50px!important;min-width:160px;border-radius:25px;top:auto!important;bottom:30px;right:30px;cursor:pointer;background:var(--wd-accent)!important;padding:0 20px;display:flex;align-items:center;justify-content:center;border:2px solid rgba(255,255,255,0.2);box-shadow:0 4px 15px rgba(39,174,96,0.5)}#wd-panel.wd-minimized > *{display:none!important}#wd-panel.wd-minimized::after{content:"🗃️ Tool Manager";color:#fff;font-weight:700;font-size:14px;white-space:nowrap;letter-spacing:0.5px}#wd-panel.wd-minimized:hover{transform:translateY(-5px)}#wd-header{padding:12px 16px;background:transparent;border-bottom:1px solid var(--wd-border);display:flex;justify-content:space-between;align-items:center;user-select:none;flex-shrink:0}.wd-title-text{font-weight:800;font-size:14px;color:var(--wd-accent);letter-spacing:0.5px}.wd-actions{display:flex;gap:8px}.wd-icon-btn{background:transparent;border:none;cursor:pointer;font-size:16px;width:28px;height:28px;border-radius:6px;color:var(--wd-text-sub);transition:0.2s;display:flex;align-items:center;justify-content:center}.wd-icon-btn:hover{background:rgba(0,0,0,0.05);color:var(--wd-text)}.wd-icon-btn.danger:hover{color:var(--wd-danger);background:rgba(231,76,60,0.1)}#wd-body{padding:12px;overflow-y:auto;overflow-x:hidden;flex-grow:1;scrollbar-width:thin;scrollbar-color:var(--wd-scroll) transparent;scroll-behavior:smooth;will-change:scroll-position}#wd-body::-webkit-scrollbar{width:5px}#wd-body::-webkit-scrollbar-thumb{background:var(--wd-scroll);border-radius:10px}.wd-input,.wd-select{width:100%;border:1px solid transparent;background:var(--wd-input-bg);color:var(--wd-text);padding:8px 12px;border-radius:8px;font-size:12px;outline:none;transition:0.2s;height:36px;margin-bottom:0;box-sizing:border-box}.wd-input:focus,.wd-select:focus{background:var(--wd-bg);border-color:var(--wd-accent);box-shadow:0 0 0 3px rgba(39,174,96,0.1)}.wd-row{display:flex;gap:8px;margin-bottom:10px}.wd-col{flex:1}.wd-btn{width:100%;padding:8px 0;border:none;border-radius:8px;font-weight:700;color:#fff;cursor:pointer;font-size:11px;text-transform:uppercase;background:var(--wd-accent);transition:0.2s;letter-spacing:0.5px}.wd-btn:hover{background:var(--wd-accent-hover);box-shadow:0 4px 10px rgba(39,174,96,0.3);transform:translateY(-1px)}.wd-btn:active{transform:translateY(1px)}.wd-btn:disabled{opacity:0.6;cursor:not-allowed;box-shadow:none;transform:none}.wd-btn.danger{background:var(--wd-danger)}.wd-btn.danger:hover{background:var(--wd-danger-hover);box-shadow:0 4px 10px rgba(231,76,60,0.3)}#wd-result-list{margin-top:10px;position:relative}#wd-virtual-container{position:relative;will-change:transform}.wd-list-item{background:var(--wd-item-bg);padding:10px;margin-bottom:5px;border-radius:10px;box-shadow:var(--wd-item-shadow);transition:transform 0.15s ease-out,box-shadow 0.15s ease-out,border-color 0.15s ease-out;border:1px solid var(--wd-border);position:absolute;overflow:hidden;will-change:transform;contain:layout style paint}.wd-list-item:hover{transform:translateY(-2px);box-shadow:0 5px 15px rgba(0,0,0,0.08);border-color:rgba(39,174,96,0.3)}.wd-item-title{display:block;font-weight:700;font-size:13px;color:var(--wd-text);text-decoration:none;margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding-right:25px}.wd-item-title:hover{color:var(--wd-accent)}.wd-item-meta{font-size:11px;color:var(--wd-text-sub);margin-bottom:6px;display:flex;justify-content:space-between;align-items:center}.wd-badges{display:flex;gap:4px;flex-wrap:wrap}.wd-badge{padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600;background:var(--wd-input-bg);color:var(--wd-text-sub);display:flex;align-items:center;gap:3px}.wd-badge.highlight{color:var(--wd-accent);background:rgba(39,174,96,0.08)}.wd-delete-item{position:absolute;top:8px;right:8px;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:transparent;color:var(--wd-text-sub);font-size:14px;border:none;cursor:pointer;z-index:10;transition:all 0.2s;opacity:0}.wd-list-item:hover .wd-delete-item{opacity:0.5}.wd-delete-item:hover{background:var(--wd-danger);color:white;opacity:1!important}`;
        document.head.appendChild(pStyle);
        const panel = document.createElement('div'); panel.id = 'wd-panel';
        panel.innerHTML = `<div id="wd-header"><span class="wd-title-text">🗃️ TOOL MANAGER</span><div class="wd-actions"><button id="wd-theme-toggle" class="wd-icon-btn" title="Giao diện">☀️</button><button id="wd-minimize-btn" class="wd-icon-btn" title="Thu nhỏ"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="5" y1="12" x2="19" y2="12"></line></svg></button></div></div><div id="wd-body"><div class="wd-row"><button id="wd-sync-btn" class="wd-btn" style="flex-grow:1;">🔄 ĐỒNG BỘ</button><button id="wd-clear-all-btn" class="wd-btn danger" style="width: 44px;" title="Xoá sạch">🗑️</button></div><div class="wd-row"><button id="wd-export-btn" class="wd-io-btn" style="flex:1">📤 XUẤT</button><button id="wd-import-btn" class="wd-io-btn" style="flex:1">📥 NHẬP</button><button id="wd-help-btn" class="wd-io-btn" style="width:30px;padding:0" title="Hướng dẫn sửa file">❓</button></div><div id="wd-status-msg" style="text-align:center;font-size:11px;color:var(--wd-text-sub);margin-bottom:8px;font-style:italic;">Sẵn sàng.</div><input type="text" id="wd-search" class="wd-input" placeholder="🔍 Tìm tên truyện..."><div class="wd-row"><div class="wd-col"><select id="wd-filter-status" class="wd-select browser-default"><option value="all">Tất cả</option><option value="Còn tiếp">Còn tiếp</option><option value="Hoàn thành">Hoàn thành</option><option value="Tạm ngưng">Tạm ngưng</option><option value="Chưa xác minh">Chưa xác minh</option></select></div><div class="wd-col"><select id="wd-sort" class="wd-select browser-default"><option value="newest">🆕 Mới nhất</option><option value="oldest">🦖 Cũ nhất</option><option value="view">👀 Lượt xem</option><option value="rating">⭐ Đánh giá</option><option value="comment">💬 Bình luận</option><option value="thanks">🩷 Cảm ơn</option></select></div></div><div class="wd-row" style="margin-bottom:0;"><input type="date" id="wd-date-from" class="wd-input" style="margin:0" title="Từ ngày"><input type="date" id="wd-date-to" class="wd-input" style="margin:0" title="Đến ngày"></div><div id="wd-result-list"></div></div>`;
        document.body.appendChild(panel);
        // --- HELP BUTTON ---
        document.getElementById('wd-help-btn').onclick = () => {
            alert(`⚠️ Chỉ chấp nhận file TXT hoặc JSON. Nếu đã đúng file, kiểm tra xem đã đủ các dấu "{},: chưa? Dòng cuối cùng có dấu nào dư ngoài dấu ngoặc nhọn không? `);
        };
        // --- EXPORT / IMPORT LOGIC ---
        const exportBtn = document.getElementById('wd-export-btn');
        const importBtn = document.getElementById('wd-import-btn');
        // --- EXPORT FUNCTION ---
        exportBtn.onclick = async () => {
            const items = await db.getAll();
            if (items.length === 0) return showToast("⚠️ Không có dữ liệu để xuất");
            const jsonString = JSON.stringify(items, null, 4);
            const blob = new Blob([jsonString], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const now = new Date();
            const yy = now.getFullYear().toString().slice(-2);
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const hh = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            a.download = `${yy}${mm}${dd}-${hh}${min}${ss} Saved Works.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            showToast("📤 Đã xuất danh sách");
        };
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.txt,.json';
        fileInput.style.display = 'none';
        document.body.appendChild(fileInput);
        importBtn.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async (ev) => {
                try {
                    const data = JSON.parse(ev.target.result);
                    if (Array.isArray(data)) {
                        await db.putBulk(data);
                        GLOBAL_CACHE = await db.getAll();
                        renderList();
                        showToast(`📥 Đã nhập ${data.length} truyện`);
                        syncChannel.postMessage({ type: 'REFRESH' });
                    } else {
                        showToast("❌ File lỗi: Không đúng format");
                    }
                } catch (err) {
                    console.error(err);
                    showToast("❌ Lỗi cú pháp: kiểm tra dấu phẩy");
                }
                fileInput.value = '';
            };
            reader.readAsText(file);
        };
        // --- INIT LIST ---
        async function initList() {
            GLOBAL_CACHE = await db.getAll();
            renderList();
        }
        let currentTheme = localStorage.getItem(THEME_KEY) === 'dark';
        const applyTheme = isDark => { panel.setAttribute('data-wd-theme', isDark ? 'dark' : ''); document.getElementById('wd-theme-toggle').textContent = isDark ? '🌙' : '☀️'; };
        applyTheme(currentTheme);
        document.getElementById('wd-theme-toggle').onclick = () => { currentTheme = !currentTheme; localStorage.setItem(THEME_KEY, currentTheme ? 'dark' : 'light'); applyTheme(currentTheme); };
        document.getElementById('wd-minimize-btn').onclick = e => { e.stopPropagation(); panel.classList.add('wd-minimized'); };
        panel.onclick = () => panel.classList.contains('wd-minimized') && panel.classList.remove('wd-minimized');
        panel.querySelectorAll('.wd-input, .wd-select, .wd-btn, .wd-io-btn').forEach(el => { el.addEventListener('click', function(e) { e.stopPropagation(); }); });
        document.getElementById('wd-clear-all-btn').onclick = async () => {
            if (confirm("❗CẢNH BÁO❗\nXoá toàn bộ dữ liệu?")) {
                await db.clearAll();
                GLOBAL_CACHE = [];
                renderList();
                showToast("🗑️ Đã xoá sạch.");
                syncChannel.postMessage({ type: 'REFRESH' });
            }
        };
        function extractListBookData(el) {
            try {
                const tEl = el.querySelector('.book-name .book-title'), aEls = el.querySelectorAll('.book-name .book-author a'), sEls = el.querySelectorAll('.book-stats-box .book-stats span[data-ready="abbrNum"]'), ex = el.querySelector('.book-info-extra')?.textContent || "";
                const link = tEl?.getAttribute('href') || "#";
                return {
                    id: getStoryId(link),
                    title: tEl?.textContent.trim() || "No Title", link: link, author: aEls[0]?.textContent.trim() || "",
                    status: aEls[1]?.textContent.trim() || "Unknown", view: parseNumber(sEls[0]?.textContent), rating: parseNumber(sEls[1]?.textContent),
                    comment: parseNumber(sEls[2]?.textContent), chapter: parseInt(ex.match(/(\d+)\s+chương/)?.[1] || 0),
                    updateDate: ex.match(/(\d{2}-\d{2}-\d{4})/)?.[1] || "", timestamp: parseDateToTimestamp(ex.match(/(\d{2}-\d{2}-\d{4})/)?.[1] || ""), thanks: 0
                };
            } catch (e) { return null; }
        }
        async function syncData() {
            const btn = document.getElementById('wd-sync-btn'), msg = document.getElementById('wd-status-msg');
            const audioOK = await activateKeepAlive();
            btn.disabled = true;
            let buffer = [];
            const base = `${location.origin}/user/${USER_ID}/works`;
            msg.innerText = "Đang đếm số trang...";
            try {
                const resFirst = await fetch(`${base}?start=0`);
                const htmlFirst = await resFirst.text();
                const docFirst = new DOMParser().parseFromString(htmlFirst, 'text/html');
                let maxStart = 0;
                const lastPageLink = docFirst.querySelector('.pagination li a .fa-angle-double-right');
                if (lastPageLink && lastPageLink.parentNode) {
                    const href = lastPageLink.parentNode.getAttribute('href');
                    const match = href.match(/start=(\d+)/);
                    if (match) maxStart = parseInt(match[1]);
                } else {
                    const links = [...docFirst.querySelectorAll('.pagination li a')];
                    const starts = links.map(a => {
                        const h = a.getAttribute('href');
                        const m = h ? h.match(/start=(\d+)/) : null;
                        return m ? parseInt(m[1]) : 0;
                    });
                    if (starts.length > 0) maxStart = Math.max(...starts);
                }
                console.log("Max Start found:", maxStart);
                let currentStart = 0;
                let totalProcessed = 0;
                const processDoc = (doc) => {
                    const els = doc.querySelectorAll('.book-info');
                    els.forEach(el => {
                        const b = extractListBookData(el);
                        if (b) { buffer.push(b); }
                    });
                    return els.length;
                };
                processDoc(docFirst);
                totalProcessed += 10;
                for (currentStart = 10; currentStart <= maxStart; currentStart += 10) {
                    msg.innerHTML = `${audioOK ? '🔊 ' : ''}Đang tải: ${currentStart} truyện`;
                    btn.innerText = `⏳ ${(currentStart / maxStart * 100).toFixed(0)}%`;
                    const res = await fetch(`${base}?start=${currentStart}`);
                    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
                    processDoc(doc);
                    if (buffer.length >= 50 || currentStart === maxStart) {
                        await db.putBulk(buffer);
                        buffer = [];
                    }
                    await new Promise(r => setTimeout(r, 800));
                }
                if (buffer.length > 0) await db.putBulk(buffer);
            } catch (e) {
                console.error(e);
                showToast("❌ Có lỗi khi đồng bộ!");
            }
            GLOBAL_CACHE = await db.getAll();
            msg.innerText = `✅ Xong: ${GLOBAL_CACHE.length} truyện.`;
            btn.disabled = false; btn.innerText = "🔄 ĐỒNG BỘ";
            stopKeepAlive();
            renderList();
            syncChannel.postMessage({ type: 'REFRESH' });
        }
        function createItemElement(book) {
            const d = document.createElement('div');
            d.className = 'wd-list-item';
            d.innerHTML = `
                <button class="wd-delete-item" title="Xoá">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                </button>
                <a href="${book.link}" target="_blank" class="wd-item-title">${book.title}</a>
                <div class="wd-item-meta">
                    <span>${book.status} • ${(book.chapter <= 0) ? "N/A" : book.chapter.toLocaleString() + " chương"}</span>
                    <span>${book.updateDate}</span>
                </div>
                <div class="wd-badges">
                    <span class="wd-badge highlight">👀 ${book.view > 1000 ? (book.view / 1000).toFixed(1) + 'k' : book.view}</span>
                    <span class="wd-badge highlight">⭐ ${book.rating}</span>
                    <span class="wd-badge highlight">💬 ${book.comment}</span>
                    ${book.thanks ? `<span class="wd-badge highlight">🩷 ${book.thanks}</span>` : ''}
                </div>
            `;
            d.querySelector('.wd-delete-item').onclick = async (e) => {
                e.stopPropagation();
                if (confirm(`Xoá "${book.title}"?`)) {
                    await db.delete(book.id);
                    GLOBAL_CACHE = GLOBAL_CACHE.filter(x => x.id !== book.id);
                    renderList();
                    showToast('Đã xoá.');
                    syncChannel.postMessage({ type: 'REFRESH' });
                }
            };
            d.querySelector('.wd-item-title').onclick = (e) => e.stopPropagation();
            d._bookId = book.id;
            return d;
        }
        function updateVirtualItems() {
            if (scrollRAF) return;
            scrollRAF = requestAnimationFrame(() => {
                const container = document.getElementById('wd-virtual-container');
                if (!container) {
                    scrollRAF = null;
                    return;
                }
                const body = document.getElementById('wd-body');
                const scrollTop = body ? body.scrollTop : 0;
                const startIndex = Math.max(0, Math.floor(scrollTop / VIRTUAL_SCROLL.ITEM_HEIGHT) - VIRTUAL_SCROLL.BUFFER_ITEMS);
                const endIndex = Math.min(
                    virtualScrollState.filteredData.length,
                    startIndex + VIRTUAL_SCROLL.VISIBLE_ITEMS + (VIRTUAL_SCROLL.BUFFER_ITEMS * 2)
                );
                if (startIndex === virtualScrollState.startIndex && endIndex === virtualScrollState.endIndex) {
                    scrollRAF = null;
                    return;
                }
                virtualScrollState.startIndex = startIndex;
                virtualScrollState.endIndex = endIndex;
                virtualScrollState.scrollTop = scrollTop;
                const visibleData = virtualScrollState.filteredData.slice(startIndex, endIndex);
                const existingItems = container.querySelectorAll('.wd-list-item');
                const itemsToReuse = [];
                const itemsToRemove = [];
                existingItems.forEach(item => {
                    const bookId = item._bookId;
                    const isVisible = visibleData.some(b => b.id === bookId);
                    if (isVisible) {
                        itemsToReuse.push(item);
                    } else {
                        itemsToRemove.push(item);
                    }
                });
                visibleData.forEach((book, idx) => {
                    const globalIndex = startIndex + idx;
                    let itemDiv = itemsToReuse.find(el => el._bookId === book.id);
                    if (!itemDiv) {
                        itemDiv = itemsToRemove.pop() || createItemElement(book);
                        if (itemDiv._bookId !== book.id) {
                            const newDiv = createItemElement(book);
                            itemDiv.innerHTML = newDiv.innerHTML;
                            itemDiv._bookId = book.id;
                            const deleteBtn = itemDiv.querySelector('.wd-delete-item');
                            const titleLink = itemDiv.querySelector('.wd-item-title');
                            deleteBtn.onclick = newDiv.querySelector('.wd-delete-item').onclick;
                            titleLink.onclick = newDiv.querySelector('.wd-item-title').onclick;
                        }
                        if (!itemDiv.parentNode) {
                            container.appendChild(itemDiv);
                        }
                    }
                    const translateY = globalIndex * VIRTUAL_SCROLL.ITEM_HEIGHT;
                    itemDiv.style.transform = `translateY(${translateY}px)`;
                    itemDiv.style.top = '0';
                    itemDiv.style.width = 'calc(100% - 10px)';
                });
                itemsToRemove.forEach(item => item.remove());
                scrollRAF = null;
            });
        }
        function renderList() {
            const list = document.getElementById('wd-result-list');
            list.innerHTML = '';
            let bks = [...GLOBAL_CACHE];
            if (bks.length === 0) {
                list.innerHTML = '<div style="text-align:center;padding:20px;color:var(--wd-text-sub);font-size:12px;">Chưa có dữ liệu.</div>';
                return;
            }
            const sTxt = removeAccents(document.getElementById('wd-search').value);
            const sSt = document.getElementById('wd-filter-status').value;
            const dF = parseDateToTimestamp(document.getElementById('wd-date-from').value.split('-').reverse().join('-'));
            const dT = parseDateToTimestamp(document.getElementById('wd-date-to').value.split('-').reverse().join('-'));
            bks = bks.filter(b =>
                             removeAccents(b.title).includes(sTxt) &&
                             (sSt === 'all' || b.status === sSt) &&
                             (!dF || b.timestamp >= dF) &&
                             (!dT || b.timestamp <= dT)
                            );
            const sort = document.getElementById('wd-sort').value;
            bks.sort((a, b) =>
                     sort === 'oldest' ? (a.timestamp || 0) - (b.timestamp || 0) :
                     (sort === 'newest' ? b.timestamp : b[sort] || 0) - (sort === 'newest' ? a.timestamp : a[sort] || 0)
                    );
            virtualScrollState.filteredData = bks;
            virtualScrollState.startIndex = -1;
            virtualScrollState.endIndex = -1;
            const container = document.createElement('div');
            container.id = 'wd-virtual-container';
            container.style.height = `${bks.length * VIRTUAL_SCROLL.ITEM_HEIGHT}px`;
            container.style.position = 'relative';
            list.appendChild(container);
            const body = document.getElementById('wd-body');
            if (body) {
                body.scrollTop = 0;
                body.removeEventListener('scroll', updateVirtualItems);
                body.addEventListener('scroll', updateVirtualItems, { passive: true });
                virtualScrollState.scrollTop = 0;
            }
            requestAnimationFrame(() => {
                updateVirtualItems();
            });
            const msg = document.getElementById('wd-status-msg');
            if (msg && !msg.innerText.includes("...")) {
                msg.innerText = `Hiển thị: ${bks.length} truyện`;
            }
        }
        function debouncedRenderList() {
            if (searchDebounceTimer) {
                clearTimeout(searchDebounceTimer);
            }
            searchDebounceTimer = setTimeout(() => {
                renderList();
            }, SEARCH_DEBOUNCE_DELAY);
        }
        document.getElementById('wd-sync-btn').addEventListener('click', syncData);
        document.getElementById('wd-search').addEventListener('input', debouncedRenderList);
        ['wd-filter-status', 'wd-date-from', 'wd-date-to', 'wd-sort'].forEach(id => {
            document.getElementById(id).addEventListener('change', renderList);
        });
        initList();
    }
})();
