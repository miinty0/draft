// ==UserScript==
// @name         Script xin xoá nhúng lại bản khác
// @namespace    Miinty0
// @version      1.2
// @history      thêm field Link bản nhúng mới cho các đơn bị thiếu
// @description  Tạo và quản lý đơn xin xoá nhúng lại bản khác
// @updateURL   https://raw.githubusercontent.com/miinty0/draft/main/script%20xin%20xoá%20nhúng%20lại%20bản%20khác.user.js
// @downloadURL https://raw.githubusercontent.com/miinty0/draft/main/script%20xin%20xoá%20nhúng%20lại%20bản%20khác.user.js
// @match        https://wikicv.net/user/*
// @match        https://wikicv.net/truyen/*
// @exclude      https://wikicv.net/truyen/*/*
// @match        https://forum.dichtienghoa.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_getValue
// @grant        GM_setValue
// @connect      catbox.moe
// ==/UserScript==
(function () {
  'use strict';
  // AUTO-FILL DATA
const isWikicv = location.hostname === 'wikicv.net' && location.pathname.startsWith('/truyen/');
  let autoFill = { storyUrl: '', storyName: '', latestChapter: '', managers: '' };
  if (isWikicv) {
    autoFill.storyUrl = window.location.href;
    const titleEl = document.querySelector('.cover-info h2');
    autoFill.storyName = titleEl?.innerText?.trim() || '';
    const latestChapterEl = Array.from(document.querySelectorAll('.cover-info p'))
      .find(p => p.textContent.includes('Mới nhất:'))?.querySelector('a');
    autoFill.latestChapter = latestChapterEl?.innerText?.trim() || '';
    autoFill.managers = [...document.querySelectorAll('.book-manager')]
      .map(el => '@' + el.getAttribute('data-id'))
      .join(' ');
  }
  //  GM STORAGE
  function getsxxnl() {
    try {
      const raw = GM_getValue('sxxnl', null);
      if (!raw) return [];
      return JSON.parse(raw) || [];
    } catch { return []; }
  }
  function savesxxnl(list) {
    try {
      GM_setValue('sxxnl', JSON.stringify(list));
    } catch (e) { console.error('savesxxnl error:', e); }
  }
  (function migrateFromIndexedDB() {
    try {
      const existing = getsxxnl();
      if (existing.length > 0) return;
      const req = indexedDB.open('sxxnl_db', 1);
      req.onsuccess = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains('sxxnl')) { db.close(); return; }
        const tx = db.transaction('sxxnl', 'readonly');
        const getAll = tx.objectStore('sxxnl').getAll();
        getAll.onsuccess = () => {
          const items = getAll.result || [];
          if (items.length > 0) {
            savesxxnl(items);
            console.log('[sxxnl] Migrated', items.length, 'đơn từ IndexedDB → GM storage.');
          }
          db.close();
        };
      };
      req.onerror = () => {};
    } catch (e) { /* ignore */ }
  })();
  // HELPERS
  function removeAccents(str) {
    return (str || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }
  function formatDate(ts) {
    const d = new Date(ts);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  }
function validateDateField(val) {
  if (!val) return true;
  return /^(\d{1,4})([\/\-])(\d{1,2})\2(\d{1,4})$/.test(val.trim());
}
  function showNotification(msg) {
    const n = document.createElement('div');
    n.textContent = msg;
    Object.assign(n.style, {
      position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
      background: 'linear-gradient(135deg,#2563eb,#ec4899)', color: '#fff', padding: '10px 22px', borderRadius: '8px',
      zIndex: '999999999', fontSize: '15px', fontFamily: "'Segoe UI','Be Vietnam Pro',Arial,sans-serif",
      boxShadow: '0 4px 16px rgba(0,0,0,0.18)', transition: 'opacity 0.4s'
    });
    document.body.appendChild(n);
    setTimeout(() => { n.style.opacity = '0'; setTimeout(() => n.remove(), 400); }, 2000);
  }
  function insertAtCursor(textarea, text) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const val = textarea.value;
    textarea.value = val.slice(0, start) + text + val.slice(end);
    textarea.selectionStart = textarea.selectionEnd = start + text.length;
    textarea.dispatchEvent(new Event('input'));
  }
  // UPLOAD TO CATBOX
  function uploadToCatbox(file, callback) {
    const formData = new FormData();
    formData.append('reqtype', 'fileupload');
    if (typeof CATBOX_USERHASH !== 'undefined' && CATBOX_USERHASH) formData.append('userhash', CATBOX_USERHASH);
    formData.append('fileToUpload', file, file.name || 'image.png');
    GM_xmlhttpRequest({
      method: 'POST',
      url: 'https://catbox.moe/user/api.php',
      data: formData,
      onload: (res) => {
        const url = res.responseText?.trim();
        if (url && url.startsWith('https://')) callback(null, url);
        else callback('Upload thất bại: ' + (url || 'Không có phản hồi'));
      },
      onerror: () => callback('Lỗi mạng')
    });
  }
  function bindPasteImage(textarea) {
    textarea.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          const placeholder = '[Đang upload ảnh...]';
          insertAtCursor(textarea, placeholder);
          uploadToCatbox(file, (err, url) => {
            if (err) {
              textarea.value = textarea.value.replace(placeholder, '');
              showNotification('❌ Upload ảnh thất bại: ' + err);
            } else {
              textarea.value = textarea.value.replace(placeholder, `![ảnh](${url})`);
            }
          });
          break;
        }
      }
    });
  }
  // STYLES
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');
    #sxxnl-icon {
      position: fixed; top: 80px; right: 20px; width: 52px; height: 52px;
      background: linear-gradient(135deg, #2563eb 0%, #ec4899 100%);
      border-radius: 50%; z-index: 99999;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: 0 4px 20px rgba(37,99,235,0.45);
      user-select: none; transition: transform 0.2s, box-shadow 0.2s;
    }
    #sxxnl-icon:hover { transform: scale(1.08); box-shadow: 0 6px 28px rgba(37,99,235,0.55); }
    #sxxnl-icon:active { transform: scale(0.96); }
    #sxxnl-panel {
      position: fixed; width: 430px; max-height: 92vh;
      background: #f8f8f8; border-radius: 16px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.08);
      z-index: 99998; display: none; flex-direction: column; overflow: hidden;
      font-family: 'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif;
      color: #222;
    }
    #sxxnl-panel.open { display: flex; }
    .sxxnl-header {
      background: linear-gradient(135deg, #2563eb 0%, #ec4899 100%);
      color: #fff; padding: 10px;
      display: flex; align-items: center; gap: 10px; flex-shrink: 0;
    }
    .sxxnl-header-title {
      flex: 1; font-weight: 700; font-size: 14px;
    }
    .sxxnl-header-btn {
      background: rgba(255,255,255,0.18); border: none; color: #fff; cursor: pointer;
      font-size: 17px; line-height: 1; padding: 4px 8px; border-radius: 8px;
      transition: background 0.15s; font-weight: 600;
    }
    .sxxnl-header-btn:hover { background: rgba(255,255,255,0.32); }
    .sxxnl-tabs {
      display: flex; flex-shrink: 0;
      background: #fff;
      border-bottom: 1px solid #ebebeb;
    }
    .sxxnl-tab {
      flex: 1; padding: 8px 6px; background: none; border: none;
      cursor: pointer; font-size: 13px; color: #999; font-weight: 500;
      border-bottom: 2.5px solid transparent; margin-bottom: -1px;
      transition: color 0.15s, border-color 0.15s;
      font-family: 'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif;
    }
    .sxxnl-tab.active { color: #2563eb; border-bottom-color: #2563eb; font-weight: 700; }
    .sxxnl-tab:hover:not(.active) { color: #555; }
    .sxxnl-tab-content { overflow-y: auto; flex: 1; padding: 10px; background: #f8f8f8; }
    .sxxnl-subtabs {
      display: flex; gap: 6px; flex-wrap: nowrap; overflow-x: auto;
      margin-bottom: 10px; padding-bottom: 4px;
    }
    .sxxnl-subtabs::-webkit-scrollbar { height: 3px; }
    .sxxnl-subtabs::-webkit-scrollbar-track { background: transparent; }
    .sxxnl-subtabs::-webkit-scrollbar-thumb { background: #ddd; border-radius: 99px; }
    .sxxnl-subtab {
      padding: 5px 11px; border: 1.5px solid #e0e0e0; border-radius: 20px;
      background: #fff; cursor: pointer; font-size: 12.5px; color: #555;
      white-space: nowrap; font-family: 'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif;
      transition: all 0.15s; font-weight: 500;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .sxxnl-subtab:hover { border-color: #2563eb; color: #2563eb; }
    .sxxnl-subtab.active {
      background: #2563eb; color: #fff; border-color: #2563eb;
      box-shadow: 0 2px 8px rgba(37,99,235,0.3);
    }
    .sxxnl-field { margin-bottom: 8px; }
    .sxxnl-label {
      display: block; font-size: 13px; color: #555; margin-bottom: 5px; font-weight: 600;
    }
    .sxxnl-textarea {
      width: 100%; box-sizing: border-box; padding: 8px 10px;
      border: 1.5px solid #e0e0e0; border-radius: 10px; font-size: 13px;
      font-family: 'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif; resize: none;
      color: #222; transition: border-color 0.2s, box-shadow 0.2s;
      background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      height: 36px; overflow: hidden; white-space: nowrap;
    }
    .sxxnl-textarea:focus {
      outline: none; border-color: #2563eb;
      box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
    }
    .sxxnl-textarea.error { border-color: #e53935; box-shadow: 0 0 0 3px rgba(229,57,53,0.12); }
    .sxxnl-inline-row {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
    }
    .sxxnl-textarea-sm {
      width: 70px; padding: 8px 10px; border: 1.5px solid #e0e0e0;
      border-radius: 10px; font-size: 13px; font-family: inherit; color: #222;
      background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      transition: border-color 0.2s; resize: none; height: 36px;
    }
    .sxxnl-textarea-sm:focus { outline: none; border-color: #2563eb; }
    .sxxnl-inline-text { font-size: 13px; color: #666; font-weight: 500; }
    .sxxnl-radio-group { display: flex; flex-direction: column; gap: 10px; }
    .sxxnl-radio-option {
      display: flex; align-items: flex-start; gap: 10px; font-size: 13px; line-height: 1.6;
      padding: 8px 10px; background: #fff; border-radius: 10px;
      border: 1.5px solid #e0e0e0; cursor: pointer;
      transition: border-color 0.15s, background 0.15s;
    }
    .sxxnl-radio-option:has(input:checked) { border-color: #2563eb; background: #eff6ff; }
    .sxxnl-radio-option input[type=radio] { margin-top: 3px; flex-shrink: 0; accent-color: #2563eb; cursor: pointer; }
    .sxxnl-radio-option span { pointer-events: none; }
    .sxxnl-submit {
      background: linear-gradient(135deg, #2563eb 0%, #ec4899 100%);
      color: #fff; border: none; border-radius: 12px;
      padding: 10px 20px; font-size: 14px; font-weight: 700; cursor: pointer;
      margin-top: 8px; transition: all 0.2s; width: 100%;
      font-family: 'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif;
      box-shadow: 0 3px 10px rgba(37,99,235,0.3);
      letter-spacing: 0.02em;
    }
    .sxxnl-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(37,99,235,0.45); }
    .sxxnl-submit:active { transform: translateY(0); }
    .sxxnl-error-msg { font-size: 12.5px; color: #e53935; margin-top: 4px; font-weight: 500; }
    /* Tab 2 */
    .sxxnl-toolbar {
      display: flex; gap: 6px; flex-wrap: wrap; align-items: center;
      margin-bottom: 8px; padding: 4px 0;
    }
    .sxxnl-toolbar-btn {
      padding: 7px 12px; border: 1.5px solid #e0e0e0; border-radius: 8px;
      background: #fff; cursor: pointer; font-size: 12.5px; color: #444;
      font-family: inherit; transition: all 0.15s; font-weight: 500;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
    }
    .sxxnl-toolbar-btn:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
    .sxxnl-select {
      padding: 7px 10px; border: 1.5px solid #e0e0e0; border-radius: 8px;
      font-size: 12.5px; color: #444; background: #fff; font-family: inherit;
      box-shadow: 0 1px 3px rgba(0,0,0,0.06); cursor: pointer;
    }
    .sxxnl-select:focus { outline: none; border-color: #2563eb; }
    .sxxnl-search {
      padding: 7px 11px; border: 1.5px solid #e0e0e0; border-radius: 8px;
      font-size: 12.5px; font-family: inherit; color: #222; width: 120px;
      background: #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: border-color 0.2s;
    }
    .sxxnl-search:focus { outline: none; border-color: #2563eb; }
    .sxxnl-selected-count { font-size: 12.5px; color: #2563eb; margin-left: 4px; font-weight: 600; }
    .sxxnl-don-item {
      border: 1.5px solid #e8e8e8; border-radius: 12px; margin-bottom: 10px;
      background: #fff; overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      transition: box-shadow 0.2s, border-color 0.2s, background 0.2s;
    }
    .sxxnl-don-item:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.1); border-color: #d0d0d0; }
    .sxxnl-don-item.selected-card {
      border-color: #2563eb; background: #eff6ff;
      box-shadow: 0 0 0 2.5px rgba(37,99,235,0.18), 0 4px 16px rgba(37,99,235,0.10);
    }
    .sxxnl-don-header {
      display: flex; align-items: flex-start; gap: 8px; padding: 10px;
      cursor: pointer; user-select: none;
    }
    .sxxnl-don-header-left {
      flex: 0 0 50%; display: flex; align-items: center; gap: 6px;
    }
    .sxxnl-don-title {
      min-width: 0; font-size: 13px; font-weight: 700; color: #2563eb;
      text-decoration: none; cursor: pointer; word-break: break-word;
    }
    .sxxnl-don-title:hover { text-decoration: underline; }
    .sxxnl-don-header-right {
      flex: 0 0 50%; display: flex; flex-direction: column; align-items: center; gap: 4px;
    }
    .sxxnl-don-meta { font-size: 12px; color: #999; }
    .sxxnl-badge {
      font-size: 11.5px; padding: 3px 10px; border-radius: 20px; font-weight: 600;
      letter-spacing: 0.01em;
    }
    .sxxnl-badge.wait   { background: #fff1f2; color: #dc2626; border: 1px solid #fca5a5; }
    .sxxnl-badge.link { background: #fefce8; color: #ca8a04; border: 1px solid #fde047; }
    .sxxnl-badge.post   { background: #f0faf0; color: #16a34a; border: 1px solid #86efac; }
    .sxxnl-don-body {
      display: none; padding: 10px; border-top: 1px solid #f0f0f0;
      font-size: 13px; color: #333; white-space: pre-wrap; line-height: 1.75;
      background: #fafafa;
    }
    .sxxnl-don-body.open { display: block; }
    .sxxnl-don-body a { color: #2563eb; text-decoration: none; }
    .sxxnl-don-body a:hover { text-decoration: underline; }
    /* Scrollbar styling */
    .sxxnl-tab-content::-webkit-scrollbar { width: 5px; }
    .sxxnl-tab-content::-webkit-scrollbar-track { background: transparent; }
    .sxxnl-tab-content::-webkit-scrollbar-thumb { background: #ddd; border-radius: 99px; }
    /* Muc selector step */
    .sxxnl-step-muc { padding: 6px 0 0; }
    .sxxnl-step-title {
      font-size: 11.5px; font-weight: 700; color: #2563eb; text-transform: uppercase;
      letter-spacing: 0.06em; margin-bottom: 8px;
    }
    .sxxnl-muc-grid {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin-bottom: 10px;
    }
    .sxxnl-muc-card {
      border: 1.5px solid #e5e7eb; border-radius: 9px; padding: 7px 5px 6px;
      background: #fff; cursor: pointer; text-align: center;
      transition: all 0.15s;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .sxxnl-muc-card:hover { border-color: #2563eb; background: #eff6ff; }
    .sxxnl-muc-card.selected {
      border-color: #2563eb; background: #dbeafe;
      box-shadow: 0 0 0 2px rgba(37,99,235,0.2);
    }
    .sxxnl-muc-card-label {
      font-size: 15px; font-weight: 800; color: #2563eb; display: block; line-height: 1;
    }
    .sxxnl-muc-card-desc {
      font-size: 10px; color: #6b7280; margin-top: 3px; line-height: 1.3; display: block;
    }
    .sxxnl-muc-card--dq {
      grid-column: span 4; background: #eff6ff; border-color: #93c5fd;
    }
    .sxxnl-muc-card--dq .sxxnl-muc-card-label { font-size: 13px; }
    .sxxnl-muc-card--dq:hover { border-color: #2563eb; background: #dbeafe; }
    .sxxnl-muc-card--dq.selected { border-color: #2563eb; background: #dbeafe; }
    .sxxnl-muc-info-box {
      border: 1.5px solid #dbeafe; border-radius: 10px; padding: 10px 12px;
      background: #f0f9ff; font-size: 12px; color: #374151; line-height: 1.65;
      white-space: pre-wrap; margin-bottom: 8px; display: none;
    }
    .sxxnl-muc-info-box.show { display: block; }
    .sxxnl-muc-confirm {
      background: linear-gradient(135deg, #2563eb 0%, #ec4899 100%);
      color: #fff; border: none; border-radius: 9px;
      padding: 9px 0; font-size: 13px; font-weight: 700; cursor: pointer;
      width: 100%; font-family: inherit;
      box-shadow: 0 3px 10px rgba(37,99,235,0.3);
      transition: all 0.15s; display: none;
    }
    .sxxnl-muc-confirm.show { display: block; }
    .sxxnl-muc-confirm:hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(37,99,235,0.4); }
    .sxxnl-back-btn {
      background: none; border: none; color: #2563eb; cursor: pointer;
      font-size: 12px; font-weight: 600; padding: 0; margin-bottom: 8px;
      font-family: inherit; display: flex; align-items: center; gap: 4px;
    }
    .sxxnl-back-btn:hover { text-decoration: underline; }
    /* Edit modal */
    #sxxnl-edit-modal {
      position: fixed; inset: 0; z-index: 9999999;
      background: rgba(0,0,0,0.35); display: none; align-items: center; justify-content: center;
    }
    #sxxnl-edit-modal.open { display: flex; }
    .sxxnl-edit-box {
      background: #fff; border-radius: 16px; padding: 18px 18px 14px;
      width: 360px; max-width: 95vw; max-height: 85vh; overflow-y: auto;
      box-shadow: 0 12px 48px rgba(0,0,0,0.18);
      font-family: 'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif;
    }
    .sxxnl-edit-box h3 { font-size: 14px; font-weight: 700; margin: 0 0 10px; color: #2563eb; }
    .sxxnl-edit-row { margin-bottom: 10px; }
    .sxxnl-edit-row label { display: block; font-size: 12.5px; font-weight: 600; color: #555; margin-bottom: 4px; }
    .sxxnl-edit-row textarea {
      width: 100%; box-sizing: border-box; padding: 7px 10px;
      border: 1.5px solid #e0e0e0; border-radius: 9px; font-size: 13px;
      font-family: inherit; resize: none; height: 36px;
    }
    .sxxnl-edit-row textarea:focus { outline: none; border-color: #2563eb; }
    .sxxnl-edit-btns { display: flex; gap: 8px; margin-top: 12px; }
    .sxxnl-edit-save {
      flex: 1; background: linear-gradient(135deg,#2563eb,#ec4899); color: #fff;
      border: none; border-radius: 9px; padding: 9px; font-size: 13px; font-weight: 700;
      cursor: pointer; font-family: inherit;
    }
    .sxxnl-edit-cancel {
      padding: 9px 16px; border: 1.5px solid #e0e0e0; border-radius: 9px;
      background: #fff; font-size: 13px; cursor: pointer; font-family: inherit; color: #555;
    }
    .sxxnl-don-actions { display: flex; gap: 3px; flex-shrink: 0; }
    .sxxnl-don-action-btn {
      background: none; border: 1px solid #e0e0e0; border-radius: 5px;
      font-size: 13px; padding: 1px 4px; cursor: pointer; color: #888;
      font-family: inherit; transition: all 0.15s; line-height: 1;
      white-space: nowrap; overflow: hidden;
    }
    .sxxnl-don-action-btn:hover { border-color: #2563eb; background: #eff6ff; }
    .sxxnl-don-action-btn.undone:hover { border-color: #f59e0b; background: #fef9c3; }
    /* Info popover */
    #sxxnl-info-popover {
      position: fixed; z-index: 999999; background: #f8f8f8; border-radius: 16px;
      box-shadow: 0 12px 48px rgba(0,0,0,0.18); width: 390px; max-height: 60vh;
      display: none; flex-direction: column; overflow: hidden;
      font-family: 'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif;
    }
    #sxxnl-info-popover.open { display: flex; }
    .sxxnl-info-header {
      background: linear-gradient(135deg, #2563eb 0%, #ec4899 100%);
      color: #fff; padding: 10px;
      display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap;
    }
    .sxxnl-info-header > span { font-weight: 700; font-size: 15px; }
    .sxxnl-info-body { overflow-y: auto; padding: 10px; flex: 1; background: #fff; }
    .sxxnl-info-body::-webkit-scrollbar { width: 5px; }
    .sxxnl-info-body::-webkit-scrollbar-thumb { background: #ddd; border-radius: 99px; }
    .sxxnl-info-content { font-size: 13px; line-height: 1.8; color: #333; white-space: pre-wrap; }
    /* Info select in header */
    #sxxnl-info-select {
      color: #fff !important;
      background: rgba(255,255,255,0.15) !important;
      border: 1.5px solid rgba(255,255,255,0.35) !important;
      border-radius: 8px !important;
      padding: 5px 8px !important;
      font-size: 12.5px !important;
      font-family: inherit !important;
      cursor: pointer;
      max-width: 170px;
    }
    #sxxnl-info-select option { color: #222; background: #fff; }
    .sxxnl-info-divider {
      border: none;
      border-top: 2.5px solid #2563eb;
      margin: 14px 0;
      opacity: 0.35;
      border-radius: 2px;
    }
  `;
  document.head.appendChild(style);
  // ICON
  const icon = document.createElement('div');
  icon.id = 'sxxnl-icon';
  icon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" width="24" height="24"><path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/></svg>`;
  document.body.appendChild(icon);
  // DRAG
  let dragging = false, dragOffX = 0, dragOffY = 0, moved = false;
  let dragTarget = 'panel';
  function moveAll(newIconLeft, newIconTop) {
    const iw = icon.offsetWidth || 52, ih = icon.offsetHeight || 52;
    newIconLeft = Math.max(0, Math.min(window.innerWidth  - iw, newIconLeft));
    newIconTop  = Math.max(0, Math.min(window.innerHeight - ih, newIconTop));
    icon.style.right = 'auto';
    icon.style.left = newIconLeft + 'px';
    icon.style.top  = newIconTop  + 'px';
    if (panel.classList.contains('open')) {
      const pw = panel.offsetWidth || 430;
      let left = newIconLeft - pw - 10;
      if (left < 8) left = newIconLeft + iw + 10;
      if (left + pw > window.innerWidth - 8) left = Math.max(8, window.innerWidth - pw - 8);
      let top = newIconTop;
      const ph = panel.offsetHeight || 500;
      if (top + ph > window.innerHeight - 8) top = window.innerHeight - ph - 8;
      panel.style.left = left + 'px';
      panel.style.top  = Math.max(8, top) + 'px';
    }
  }
  function startDrag(e, target) {
    dragging = true; moved = false; dragTarget = target;
    const ir = icon.getBoundingClientRect();
    dragOffX = e.clientX - ir.left;
    dragOffY = e.clientY - ir.top;
    e.preventDefault();
  }
  icon.addEventListener('mousedown', (e) => startDrag(e, 'icon'));
  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - dragOffX - icon.getBoundingClientRect().left;
    const dy = e.clientY - dragOffY - icon.getBoundingClientRect().top;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    const ir = icon.getBoundingClientRect();
    moveAll(ir.left + dx, ir.top + dy);
  });
  document.addEventListener('mouseup', () => {
    if (dragTarget === 'icon' && dragging && !moved) togglePanel();
    dragging = false;
  });
  icon.addEventListener('touchstart', (e) => {
    const t = e.touches[0];
    startDrag({ clientX: t.clientX, clientY: t.clientY, preventDefault: () => e.preventDefault() }, 'icon');
  }, { passive: false });
  document.addEventListener('touchmove', (e) => {
    if (!dragging) return;
    const t = e.touches[0];
    const ir = icon.getBoundingClientRect();
    const dx = t.clientX - dragOffX - ir.left;
    const dy = t.clientY - dragOffY - ir.top;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true;
    moveAll(ir.left + dx, ir.top + dy);
    e.preventDefault();
  }, { passive: false });
  document.addEventListener('touchend', () => {
    if (dragTarget === 'icon' && dragging && !moved) togglePanel();
    dragging = false;
  });
  // PANEL
  const panel = document.createElement('div');
  panel.id = 'sxxnl-panel';
  panel.innerHTML = `
    <div class="sxxnl-header">
      <span class="sxxnl-header-title">Script xin xoá nhúng lại bản khác</span>
      <button class="sxxnl-header-btn" id="sxxnl-info-btn" title="Thông tin các mục">ℹ</button>
      <button class="sxxnl-header-btn" id="sxxnl-close-btn">×</button>
    </div>
    <div class="sxxnl-tabs">
      <button class="sxxnl-tab active" data-tab="1">Đơn xoá truyện</button>
      <button class="sxxnl-tab" data-tab="2">Đơn đã lưu</button>
    </div>
    <div class="sxxnl-tab-content" id="sxxnl-content-1"></div>
    <div class="sxxnl-tab-content" id="sxxnl-content-2" style="display:none"></div>
  `;
  document.body.appendChild(panel);
  // EDIT MODAL
  const editModal = document.createElement('div');
  editModal.id = 'sxxnl-edit-modal';
  editModal.innerHTML = `<div class="sxxnl-edit-box"></div>`;
  document.body.appendChild(editModal);
  let editingDonId = null;
  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) { editModal.classList.remove('open'); editingDonId = null; }
  });
  const FIELD_LABELS = {
    storyUrl:       'Truyện muốn xin xóa:',
    banNhungTrung:  'Bản nhúng trùng:',
    managers:       'Quản lý truyện:',
    muc:            'Xin xóa theo mục:',
    currentVersion: 'Bản nhúng đang có:',
    linkGoc:        'Link truyện gốc:',
    ngayCapNhat:    'Ngày truyện gốc cập nhật chương mới nhất:',
    soChuongGoc:    'Số chương của truyện gốc:',
    soRawNum:       'Số raw (con số):',
    soRawChapName:  'Số raw (tên chương):',
    giaiThich:      'Giải thích thêm:',
    linkBanNhung:   'Link bản nhúng mới:',
    choTaiRaw:      'Chỗ tải raw:',
  };
  function openEditModal(don) {
    editingDonId = don.id;
    let editFormType = don.type || '1602';
    const editBox = editModal.querySelector('.sxxnl-edit-box');
    function buildEditModalContent() {
      editBox.innerHTML = `<h3>✏️ Sửa đơn</h3>`;
      // Form-type tab bar
      const tabBar = document.createElement('div');
      tabBar.style.cssText = 'display:flex;gap:4px;flex-wrap:wrap;margin-bottom:10px;';
      const formTypes = [
{ id: '1601', label: '1601 - k' },
{ id: '1602', label: '1602 - i,l,m,p,r' },
{ id: '1603', label: '1603 - d,e,g' },
{ id: '1604', label: '1604 - o' },
{ id: '1605', label: '1605 - a,b,c,f,n' },
      ];
      formTypes.forEach(ft => {
        const btn = document.createElement('button');
        btn.textContent = ft.label;
        btn.style.cssText = `padding:4px 10px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;border:1.5px solid ${editFormType === ft.id ? '#2563eb' : '#e0e0e0'};background:${editFormType === ft.id ? '#dbeafe' : '#fff'};color:${editFormType === ft.id ? '#2563eb' : '#555'};transition:all 0.15s;`;
        btn.addEventListener('click', () => {
          editFormType = ft.id;
          buildEditModalContent();
        });
        tabBar.appendChild(btn);
      });
      editBox.appendChild(tabBar);
      // Fields for current form type
      const fieldsWrap = document.createElement('div');
      fieldsWrap.id = 'sxxnl-edit-fields';
      const f = don.fields || {};
      // Which fields to show per form type
      const FORM_FIELDS = {
        '1601': ['storyUrl','banNhungTrung','muc','currentVersion','giaiThich','linkBanNhung','choTaiRaw'],
        '1602': ['storyUrl','banNhungTrung','managers','muc','currentVersion','soRawNum','soRawChapName','giaiThich','linkBanNhung','choTaiRaw'],
        '1603': ['storyUrl','banNhungTrung','managers','muc','currentVersion','linkGoc','ngayCapNhat','soChuongGoc','soRawNum','soRawChapName','giaiThich','linkBanNhung','choTaiRaw'],
        '1604': ['storyUrl','banNhungTrung','muc','currentVersion','giaiThich','linkBanNhung','choTaiRaw'],
        '1605': ['storyUrl','banNhungTrung','muc','currentVersion','soRawNum','soRawChapName','giaiThich','linkBanNhung','choTaiRaw'],
      };
      const fieldKeys = FORM_FIELDS[editFormType] || Object.keys(FIELD_LABELS);
      fieldKeys.forEach(key => {
        const row = document.createElement('div');
        row.className = 'sxxnl-edit-row';
        const lbl = document.createElement('label');
        lbl.textContent = FIELD_LABELS[key] || key;
        const ta = document.createElement('textarea');
        ta.dataset.editField = key;
        ta.value = f[key] || '';
        row.appendChild(lbl);
        row.appendChild(ta);
        fieldsWrap.appendChild(row);
      });
      editBox.appendChild(fieldsWrap);
      // Buttons
      const btns = document.createElement('div');
      btns.className = 'sxxnl-edit-btns';
      const cancelBtn = document.createElement('button');
      cancelBtn.className = 'sxxnl-edit-cancel';
      cancelBtn.textContent = 'Huỷ';
      cancelBtn.addEventListener('click', () => { editModal.classList.remove('open'); editingDonId = null; });
      const saveBtn = document.createElement('button');
      saveBtn.className = 'sxxnl-edit-save';
      saveBtn.textContent = 'Lưu';
      saveBtn.addEventListener('click', async () => {
        if (!editingDonId) return;
        const updated = {};
        editBox.querySelectorAll('textarea[data-edit-field]').forEach(ta => {
          updated[ta.dataset.editField] = ta.value.trim();
        });
        const list = (getsxxnl()).map(d => {
          if (d.id !== editingDonId) return d;
          const fields = {};
          const fieldKeys2 = FORM_FIELDS[editFormType] || Object.keys(FIELD_LABELS);
          fieldKeys2.forEach(k => { if (updated[k]) fields[k] = updated[k]; });
          return { ...d, type: editFormType, fields };
        });
        savesxxnl(list);
        editModal.classList.remove('open'); editingDonId = null;
        showNotification('✓ Đã lưu!');
        renderTab2();
      });
      btns.appendChild(cancelBtn);
      btns.appendChild(saveBtn);
      editBox.appendChild(btns);
    }
    buildEditModalContent();
    editModal.classList.add('open');
  }
  function positionPanel() {
    const ir = icon.getBoundingClientRect();
    moveAll(ir.left, ir.top);
  }
  function togglePanel() {
    const open = panel.classList.toggle('open');
    if (open) positionPanel();
  }
  panel.querySelector('#sxxnl-close-btn').addEventListener('click', () => {
    panel.classList.remove('open');
  });
  const panelHeader = panel.querySelector('.sxxnl-header');
  panelHeader.style.cursor = 'grab';
  panelHeader.addEventListener('mousedown', (e) => {
    if (e.target.closest('button') || e.target.closest('select')) return;
    panelHeader.style.cursor = 'grabbing';
    const ir = icon.getBoundingClientRect();
    dragOffX = e.clientX - ir.left;
    dragOffY = e.clientY - ir.top;
    dragging = true; moved = false; dragTarget = 'panel';
    e.preventDefault();
  });
  document.addEventListener('mouseup', () => {
    panelHeader.style.cursor = 'grab';
  });
  // Tab switching
  let currentMainTab = '1';
  panel.querySelectorAll('.sxxnl-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      panel.querySelectorAll('.sxxnl-tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentMainTab = btn.dataset.tab;
      document.getElementById('sxxnl-content-1').style.display = currentMainTab === '1' ? '' : 'none';
      document.getElementById('sxxnl-content-2').style.display = currentMainTab === '2' ? '' : 'none';
      if (currentMainTab === '2') renderTab2();
    });
  });
  // TAB 1: FORM BUILDER
  const INFO_CONTENT = {
    'a': `**Bản nhúng đang có vi phạm, ví dụ: lỗi trình bày, sai tag... và chủ truyện không phải Trạm Rác.**\n\n*  Trường hợp hồ sơ của chủ truyện đã có mức phạt: titan sẽ xóa bản nhúng cũ để user nhúng lại bản mới.\n\n*  Trường hợp chủ truyện chưa có hồ sơ hoặc hồ sơ chưa có mức phạt: cần giữ lại chứng cứ để tính mức phạt nên titan sẽ không xóa bản nhúng cũ nhưng user vẫn được duyệt nhúng bản mới. Titan sẽ để lại lời nhắn trong hồ sơ để sau khi có mức phạt, truyện cũ bị xóa vĩnh viễn. Sau khi nhúng bản mới, user hãy dẫn link đơn xin xóa nhúng lại ở dưới văn án, để tránh bị cử báo vi phạm nhúng trùng.\n\n-User phải đảm bảo chính mình sẽ nhúng lại với số chương nhiều hơn hoặc bằng bản nhúng cũ và không bị lỗi.`,
    'b': `**Bản nhúng đang có vi phạm, ví dụ: lỗi trình bày, sai tag... và chủ truyện đang là Trạm Rác.**\n\n-User phải đảm bảo chính mình sẽ nhúng lại với số chương nhiều hơn hoặc bằng bản nhúng cũ và không bị lỗi.`,
    'c': `**Lịch sử cổng báo lỗi đã có người [báo lỗi raw tại các chương cụ thể / báo lỗi raw và chỉ ra các chương cụ thể], nhưng quá 14 ngày kể từ ngày báo tin, tất cả các chương đó vẫn chưa được sửa chữa thành chương HQ.**\n\n-User phải đảm bảo chính mình sẽ nhúng lại với số chương nhiều hơn hoặc bằng bản nhúng cũ và không bị lỗi.`,
    'd': `**Truyện gốc trong 3 tháng gần đây có ra chương mới + truyện gốc đang nhiều hơn bản nhúng 20 chương HQ trở lên + bản nhúng đang có dưới 100 chương HQ.**\n\n-User phải đảm bảo chính mình sẽ nhúng lại với số chương nhiều hơn số chương HQ của bản nhúng cũ [color=rgb(255,0,0)]ít nhất 10 chương[/color] và không bị lỗi.`,
    'e': `**Truyện gốc đã 3 tháng ngừng ra chương mới nhưng số chương HQ của bản nhúng vẫn chưa bằng với truyện gốc.**\n\n-User phải đảm bảo chính mình sẽ nhúng lại với số chương nhiều hơn số chương HQ của bản nhúng cũ và không bị lỗi.`,
    'f': `**Truyện gốc đã hoàn chính văn, và Lịch sử cổng báo lỗi đã có người gửi [link đủ chương HQ chính văn mà hệ thống nhúng được vào thời điểm ấy] hoặc [link tải raw miễn phí có đủ chương HQ chính văn], nhưng quá 14 ngày kể từ ngày báo tin, truyện chưa được đổi sang link đủ chương HQ chính văn, hoặc chưa được bổ sung đủ chương HQ chính văn.**\n\n-User phải đảm bảo chính mình sẽ nhúng lại với số chương nhiều hơn bản nhúng cũ, và ít nhất phải đủ chính văn, và không bị lỗi.`,
    'g': `**Đã 14 ngày kể từ ngày truyện gốc hoàn chính văn, nhưng bản nhúng vẫn chưa đủ chương HQ chính văn.**\n\n-User phải đảm bảo chính mình sẽ nhúng lại với số chương nhiều hơn hoặc bằng bản nhúng cũ, và ít nhất phải đủ chính văn, và không bị lỗi.`,
    'i': `**Bản nhúng không có vi phạm (lỗi trình bày, sai tag, nhúng trùng, gian lận raw...) + có lý do chính đáng cần thiết phải xóa và nhúng lại + chủ truyện và DQL đều đồng ý cho xóa để nhúng lại (đơn xin xóa phải kèm theo ảnh chụp tin nhắn thương lượng).**\n\n-User phải đảm bảo chính mình sẽ nhúng lại với số chương nhiều hơn hoặc bằng bản nhúng cũ và không bị lỗi.`,
    'k': `**Truyện Trạm Rác đáp ứng 2 điều kiện: [Không có DQL / Biên tập] + [Đang có lỗi raw tại chương cụ thể / user muốn nhúng lại với số raw nhiều hơn bản hiện hữu]**\n\n-User phải đảm bảo chính mình sẽ nhúng lại với số chương nhiều hơn và không bị lỗi, nếu bản nhúng cũ không bị lỗi raw.\n\n-User phải đảm bảo chính mình sẽ nhúng lại với số chương nhiều hơn hoặc bằng bản nhúng cũ và không bị lỗi, nếu bản nhúng cũ bị lỗi raw.`,
    'l': `**Bản nhúng đang bị khóa riêng tư + văn án không có dòng cảnh báo của Hệ thống: "Truyện có nội dung xúc phạm đến nước ta nên bị khóa. Xin đừng đọc nếu chưa có sự chuẩn bị về tâm lý."**\n\n-User phải đảm bảo chính mình sẽ nhúng lại với số chương [color=rgb(255,0,0)]nhiều hơn hoặc bằng số chương HQ của bản nhúng cũ[/color] và không bị lỗi. User phải đảm bảo sẽ không set Riêng tư cho truyện nhúng lại.`,
    'm': `**Xin xóa nhúng lại bản mới nhiều chương hơn.**\n\n-Truyện Wiki: User phải đảm bảo chính mình sẽ nhúng lại với số chương nhiều hơn bản nhúng cũ [color=rgb(255,0,0)]40 chương[/color] và không bị lỗi.`,
    'n': `**Nếu user đã xin làm DQL để sửa raw lỗi/up thêm raw mới (trong tin nhắn xin làm DQL có ghi rõ muốn sửa/thêm những bộ phận nào), nhưng bị chủ truyện từ chối, và quá 2 tuần kể từ ngày từ chối DQL, chủ truyện vẫn không tự sửa raw lỗi/up thêm raw mới những bộ phận mà user ghi trong tin nhắn, thì user có quyền xin xóa truyện để nhúng lại (đơn xin xóa phải kèm theo ảnh chụp tin nhắn xin làm DQL bị từ chối).**\n\n-Yêu cầu xóa truyện chỉ hợp lệ khi tin nhắn xin làm DQL có cấu trúc như sau: [color=rgb(255, 0, 0)]{Mình xin được làm DQL để} + {bổ sung/fix lỗi} + {chương... /từ chương... tới chương...}[/color]\n\n-User phải đảm bảo chính mình sẽ nhúng lại với số chương bao gồm [color=rgb(255, 0, 0)]số chương bản nhúng cũ + những bộ phận từng viết trong tin nhắn xin làm DQL[/color], và không bị lỗi.`,
    'o': `**Truyện mà chủ hiện tại đang bị khóa Nhúng + [Đang có lỗi raw tại chương cụ thể / user muốn nhúng lại với số raw nhiều hơn bản hiện hữu]**\n\n-Bản nhúng cũ không bị lỗi raw: User đảm bảo sẽ nhúng lại với số chương nhiều hơn bản nhúng cũ [color=rgb(255,0,0)]1 chương[/color] và không bị lỗi.\n\n-Bản nhúng cũ bị lỗi raw: User đảm bảo sẽ nhúng lại với số chương nhiều hơn hoặc bằng bản nhúng cũ và không bị lỗi.`,
    'r': `**Truyện đang để tag Chưa xác minh + "Thời gian đổi mới" đã cách đây 1 tháng + [Đang có lỗi raw tại chương cụ thể / User muốn nhúng lại với số raw nhiều hơn bản hiện hữu]**\n\n-Bản nhúng cũ không bị lỗi raw: User đảm bảo sẽ nhúng lại với số chương nhiều hơn bản nhúng cũ 1 chương và không bị lỗi.\n\n-Bản nhúng cũ bị lỗi raw: User đảm bảo sẽ nhúng lại với số chương nhiều hơn hoặc bằng bản nhúng cũ và không bị lỗi.`,
    'p': `**Truyện nhúng bằng file và đã ngừng up chương mới 3 tháng trở lên.**\n\n-User phải đảm bảo sẽ nhúng lại với số chương nhiều hơn số chương HQ của bản nhúng cũ ít nhất 10 chương và không bị lỗi.`,
  };
  const MUC_LIST = ['a','b','c','d','e','f','g','i','k','l','m','n','o','p','r'];
  const SUB_TABS = [
    { id: '1601', label: 'Đơn 1601: mục k' },
    { id: '1602', label: 'Đơn 1602: mục i,l,m,p,r' },
    { id: '1603', label: 'Đơn 1603: mục d,e,g' },
    { id: '1604', label: 'Đơn 1604: mục o' },
    { id: '1605', label: 'Đơn 1605: mục a,b,c,f,n' },
  ];
  let currentSubTab = '1601';
  let selectedMuc = null;
  const content1 = document.getElementById('sxxnl-content-1');
  const MUC_TO_DON = {
    'k': '1601',
    'i': '1602', 'l': '1602', 'm': '1602', 'p': '1602', 'r': '1602',
    'd': '1603', 'e': '1603', 'g': '1603',
    'o': '1604',
    'a': '1605', 'b': '1605', 'c': '1605', 'f': '1605', 'n': '1605',
  };
  const MUC_SHORT = {
    'a': 'Vi phạm, chủ ≠ Trạm Rác',
    'b': 'Vi phạm, chủ = Trạm Rác',
    'c': 'Báo lỗi raw > 14 ngày',
    'd': 'Gốc > 20c, raw < 100c',
    'e': 'Gốc ngừng, raw < gốc',
    'f': 'Gốc hoàn, báo lỗi raw > 14 ngày',
    'g': 'Gốc hoàn > 14 ngày',
    'i': 'Chủ truyện đồng ý xoá',
    'k': 'Truyện Trạm rác lỗi raw',
    'l': 'Bản bị khóa riêng tư',
    'm': 'Có >40c so với raw',
    'n': 'Bị từ chối DQL > 14 ngày',
    'o': 'Chủ bị khóa Nhúng',
    'p': 'File ngừng up > 3 tháng',
    'r': 'Tag chưa xác minh',
  };
  function buildTab1() {
    content1.innerHTML = '';
    if (!selectedMuc) {
      renderMucStep();
    } else {
      renderFormStep();
    }
  }
  function renderMucStep() {
    const wrap = document.createElement('div');
    wrap.className = 'sxxnl-step-muc';
    const title = document.createElement('div');
    title.className = 'sxxnl-step-title';
    title.textContent = 'Chọn mục xin xóa';
    wrap.appendChild(title);
    const grid = document.createElement('div');
    grid.className = 'sxxnl-muc-grid';
    let activeCard = null;
    const infoBox = document.createElement('div');
    infoBox.className = 'sxxnl-muc-info-box';
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'sxxnl-muc-confirm';
    confirmBtn.textContent = '➡️ Tiếp tục điền đơn';
    MUC_LIST.forEach(muc => {
      const card = document.createElement('div');
      card.className = 'sxxnl-muc-card';
      card.innerHTML = `<span class="sxxnl-muc-card-label">${muc.toUpperCase()}</span><span class="sxxnl-muc-card-desc">${MUC_SHORT[muc] || ''}</span>`;
      card.addEventListener('click', () => {
        if (activeCard) activeCard.classList.remove('selected');
        card.classList.add('selected');
        activeCard = card;
        infoBox.innerHTML = formatInfoHtml(INFO_CONTENT[muc] || '');
        infoBox.classList.add('show');
        confirmBtn.classList.add('show');
        confirmBtn.dataset.muc = muc;
      });
      grid.appendChild(card);
    });
    wrap.appendChild(grid);
    wrap.appendChild(infoBox);
    confirmBtn.addEventListener('click', () => {
      const muc = confirmBtn.dataset.muc;
      if (!muc) return;
      selectedMuc = muc;
      currentSubTab = MUC_TO_DON[muc] || '1602';
      renderFormStep();
    });
    wrap.appendChild(confirmBtn);
    content1.appendChild(wrap);
  }
  function renderFormStep() {
    content1.innerHTML = '';
    const backBtn = document.createElement('button');
    backBtn.className = 'sxxnl-back-btn';
    backBtn.innerHTML = '← Đổi mục';
    backBtn.addEventListener('click', () => {
      selectedMuc = null;
      content1.innerHTML = '';
      renderMucStep();
    });
    content1.appendChild(backBtn);
    if (selectedMuc) {
      const badge = document.createElement('div');
      badge.style.cssText = 'display:inline-flex;align-items:center;gap:6px;background:#dbeafe;border:1.5px solid #93c5fd;border-radius:8px;padding:4px 10px;margin-bottom:8px;font-size:12px;font-weight:700;color:#2563eb;';
      const badgeLabel = selectedMuc ? selectedMuc.toUpperCase() : '';
      const donLabel = SUB_TABS.find(s => s.id === currentSubTab)?.label || '';
      badge.textContent = `${badgeLabel} - ${donLabel}`;
      content1.appendChild(badge);
    }
    const form = buildForm(currentSubTab);
    content1.appendChild(form);
  }
  function makeTextarea(rows, placeholder, value, className) {
    const ta = document.createElement('textarea');
    ta.className = 'sxxnl-textarea' + (className ? ' ' + className : '');
    ta.rows = 1;
    ta.style.width = '100%';
    if (placeholder) ta.placeholder = placeholder;
    if (value) ta.value = value;
    return ta;
  }
  function makeField(label, ta) {
    const wrap = document.createElement('div');
    wrap.className = 'sxxnl-field';
    const lbl = document.createElement('label');
    lbl.className = 'sxxnl-label';
    lbl.textContent = label;
    wrap.appendChild(lbl);
    wrap.appendChild(ta);
    return wrap;
  }
  function makeInlineChapterField(label) {
    const wrap = document.createElement('div');
    wrap.className = 'sxxnl-field';
    const lbl = document.createElement('label');
    lbl.className = 'sxxnl-label';
    lbl.textContent = label;
    wrap.appendChild(lbl);
    const row = document.createElement('div');
    row.className = 'sxxnl-inline-row';
    const taNum = document.createElement('textarea');
    taNum.className = 'sxxnl-textarea-sm';
    taNum.rows = 1;
    taNum.dataset.fieldNum = '1';
    const span = document.createElement('span');
    span.className = 'sxxnl-inline-text';
    span.textContent = 'chương';
    const taName = document.createElement('textarea');
    taName.className = 'sxxnl-textarea';
    taName.style.flex = '1';
    taName.rows = 1;
    taName.placeholder = 'tên gốc chương nếu khác số';
    taName.dataset.fieldChapName = '1';
    row.append(taNum, span, taName);
    wrap.appendChild(row);
    return wrap;
  }
  function makeGiaiThich(bindPaste) {
    const ta = makeTextarea(1, 'Giải trình khác. Hỗ trợ paste ảnh lưu trong clipboard (Ctrl+V)');
    ta.dataset.fieldName = 'giaiThich';
    if (bindPaste) bindPasteImage(ta);
    return makeField('Giải thích thêm:', ta);
  }
  function makeChoTaiRaw() {
    const ta = makeTextarea(2);
    ta.dataset.fieldName = 'choTaiRaw';
    return makeField('Chỗ tải raw:', ta);
  }
  function makeLinkField() {
    const wrap = document.createElement('div');
    wrap.className = 'sxxnl-field';
    const lbl = document.createElement('label');
    lbl.className = 'sxxnl-label';
    lbl.textContent = 'Link bản nhúng mới:';
    const ta = document.createElement('textarea');
    ta.className = 'sxxnl-textarea';
    ta.rows = 1;
    ta.dataset.fieldName = 'linkBanNhung';
    const preview = document.createElement('a');
    preview.target = '_blank';
    preview.rel = 'noopener';
    preview.style.cssText = 'display:none;font-size:12px;color:#2563eb;word-break:break-all;margin-top:3px;';
    ta.addEventListener('input', () => {
      const v = ta.value.trim();
      if (v.startsWith('http')) { preview.href = v; preview.textContent = v; preview.style.display = 'block'; }
      else { preview.style.display = 'none'; }
    });
    wrap.appendChild(lbl);
    wrap.appendChild(ta);
    wrap.appendChild(preview);
    return wrap;
  }
  function buildForm(subTabId) {
    const container = document.createElement('div');
    const af = autoFill;
    const addField = (label, fieldName, value, rows) => {
      const ta = makeTextarea(1, '', value || '');
      ta.dataset.fieldName = fieldName;
      container.appendChild(makeField(label, ta));
      return ta;
    };
    if (subTabId === '1601') {
      addField('Truyện muốn xin xóa:', 'storyUrl', af.storyUrl);
      addField('Bản nhúng trùng:', 'banNhungTrung');
      addField('Xin xóa theo mục:', 'muc', selectedMuc ? selectedMuc : '');
      addField('Bản nhúng đang có:', 'currentVersion', af.latestChapter);
      container.appendChild(makeGiaiThich(true));
      container.appendChild(makeLinkField());
      addField('Chỗ tải raw:', 'choTaiRaw');
    }
    if (subTabId === '1602') {
      addField('Truyện muốn xin xóa:', 'storyUrl', af.storyUrl);
      addField('Bản nhúng trùng:', 'banNhungTrung');
      addField('Quản lý truyện:', 'managers', af.managers);
      addField('Xin xóa theo mục:', 'muc', selectedMuc ? selectedMuc : '');
      addField('Bản nhúng đang có:', 'currentVersion', af.latestChapter);
      container.appendChild(makeInlineChapterField('Số raw mà mình đang có để chuẩn bị nhúng lại:'));
      container.appendChild(makeGiaiThich(true));
      container.appendChild(makeLinkField());
      addField('Chỗ tải raw:', 'choTaiRaw');
    }
    if (subTabId === '1603') {
      addField('Truyện muốn xin xóa:', 'storyUrl', af.storyUrl);
      addField('Bản nhúng trùng:', 'banNhungTrung');
      addField('Quản lý truyện:', 'managers', af.managers);
      addField('Xin xóa theo mục:', 'muc', selectedMuc ? selectedMuc : '');
      addField('Bản nhúng đang có:', 'currentVersion', af.latestChapter);
      addField('Link truyện gốc:', 'linkGoc');
      const taDate = addField('Ngày truyện gốc cập nhật chương mới nhất:', 'ngayCapNhat');
      taDate.placeholder = 'dd/mm/yyyy';
      const wrapChuongGoc = document.createElement('div');
      wrapChuongGoc.className = 'sxxnl-field';
      const lblChuongGoc = document.createElement('label');
      lblChuongGoc.className = 'sxxnl-label';
      lblChuongGoc.textContent = 'Số chương của truyện gốc:';
      wrapChuongGoc.appendChild(lblChuongGoc);
      const rowChuongGoc = document.createElement('div');
      rowChuongGoc.className = 'sxxnl-inline-row';
      const taChuongGocNum = document.createElement('textarea');
      taChuongGocNum.className = 'sxxnl-textarea-sm';
      taChuongGocNum.rows = 1;
      taChuongGocNum.dataset.fieldName = 'soChuongGoc';
      const spanChuong = document.createElement('span');
      spanChuong.className = 'sxxnl-inline-text';
      spanChuong.textContent = 'chương';
      rowChuongGoc.append(taChuongGocNum, spanChuong);
      wrapChuongGoc.appendChild(rowChuongGoc);
      container.appendChild(wrapChuongGoc);
      container.appendChild(makeInlineChapterField('Số raw mà mình đang có để chuẩn bị nhúng lại:'));
      container.appendChild(makeGiaiThich(true));
      container.appendChild(makeLinkField());
      addField('Chỗ tải raw:', 'choTaiRaw');
    }
    if (subTabId === '1604') {
      addField('Truyện muốn xin xóa:', 'storyUrl', af.storyUrl);
      addField('Bản nhúng trùng:', 'banNhungTrung');
      addField('Xin xóa theo mục:', 'muc', selectedMuc ? selectedMuc : '');
      addField('Bản nhúng đang có:', 'currentVersion', af.latestChapter);
      const giaiThichWrap = document.createElement('div');
      giaiThichWrap.className = 'sxxnl-field';
      const giaiThichLbl = document.createElement('label');
      giaiThichLbl.className = 'sxxnl-label';
      giaiThichLbl.textContent = 'Giải thích thêm:';
      giaiThichWrap.appendChild(giaiThichLbl);
      const radioGroup = document.createElement('div');
      radioGroup.className = 'sxxnl-radio-group';
      radioGroup.dataset.fieldName = 'giaiThich1604';
      const options = [
        { value: 'A', labelHtml: 'Mình đảm bảo sẽ nhúng lại với số chương nhiều hơn bản nhúng cũ 1 chương và không bị lỗi', hasInline: false },
        { value: 'B', labelHtml: 'Bản nhúng cũ bị lỗi raw các chương', hasInline: true, inlineName: 'loi1604B', suffix: ', mình đảm bảo sẽ nhúng lại với số chương nhiều hơn hoặc bằng bản nhúng cũ và không bị lỗi.' },
        { value: 'C', labelHtml: '', hasInline: true, inlineName: 'loi1604C', suffix: ', mình đảm bảo sẽ nhúng lại với số chương nhiều hơn hoặc bằng bản nhúng cũ và không bị lỗi.' },
      ];
      options.forEach(opt => {
        const row = document.createElement('div');
        row.className = 'sxxnl-radio-option';
        const radio = document.createElement('input');
        radio.type = 'radio'; radio.name = 'giaiThich1604'; radio.value = opt.value;
        row.appendChild(radio);
        if (opt.hasInline) {
          if (opt.labelHtml) {
            const span0 = document.createElement('span');
            span0.textContent = opt.labelHtml + ' ';
            row.appendChild(span0);
          }
          const inlineTa = document.createElement('textarea');
          inlineTa.className = 'sxxnl-textarea-sm';
          inlineTa.rows = 1;
          inlineTa.style.width = '120px';
          inlineTa.dataset.fieldName = opt.inlineName;
          row.appendChild(inlineTa);
          if (opt.suffix) {
            const span2 = document.createElement('span');
            span2.textContent = opt.suffix;
            row.appendChild(span2);
          }
        } else {
          const span = document.createElement('span');
          span.textContent = opt.labelHtml;
          row.appendChild(span);
        }
        row.addEventListener('click', (e) => {
          if (e.target.tagName === 'TEXTAREA') return;
          radio.checked = true;
          radio.dispatchEvent(new Event('change', { bubbles: true }));
        });
        radioGroup.appendChild(row);
      });
      giaiThichWrap.appendChild(radioGroup);
      container.appendChild(giaiThichWrap);
      container.appendChild(makeLinkField());
      addField('Chỗ tải raw:', 'choTaiRaw');
    }
    if (subTabId === '1605') {
      addField('Truyện muốn xin xóa:', 'storyUrl', af.storyUrl);
      addField('Bản nhúng trùng:', 'banNhungTrung');
      addField('Xin xóa theo mục:', 'muc', selectedMuc ? selectedMuc : '');
      addField('Bản nhúng đang có:', 'currentVersion', af.latestChapter);
      container.appendChild(makeInlineChapterField('Số raw mà mình đang có để chuẩn bị nhúng lại:'));
      container.appendChild(makeGiaiThich(true));
      container.appendChild(makeLinkField());
      addField('Chỗ tải raw:', 'choTaiRaw');
    }
    const errHolder = document.createElement('div');
    errHolder.className = 'sxxnl-error-msg';
    errHolder.id = 'sxxnl-form-err';
    container.appendChild(errHolder);
    const submitBtn = document.createElement('button');
    submitBtn.className = 'sxxnl-submit';
    submitBtn.textContent = 'Submit';
    submitBtn.addEventListener('click', () => submitForm(container, subTabId));
    container.appendChild(submitBtn);
    return container;
  }
  async function submitForm(container, subTabId) {
    const errEl = container.querySelector('#sxxnl-form-err');
    errEl.textContent = '';
    container.querySelectorAll('.sxxnl-textarea').forEach(t => t.classList.remove('error'));
    const fields = {};
    container.querySelectorAll('[data-field-name]').forEach(el => {
      const name = el.dataset.fieldName;
      const val = el.value?.trim();
      if (val) fields[name] = val;
    });
    container.querySelectorAll('[data-field-num]').forEach(el => {
      fields['soRawNum'] = el.value.trim();
    });
    container.querySelectorAll('[data-field-chap-name]').forEach(el => {
      if (el.value.trim()) fields['soRawChapName'] = el.value.trim();
    });
    if (subTabId === '1604') {
      const checked = container.querySelector('input[name="giaiThich1604"]:checked');
      if (checked) {
        let giaiThich = '';
        if (checked.value === 'A') giaiThich = 'Mình đảm bảo sẽ nhúng lại với số chương nhiều hơn bản nhúng cũ 1 chương và không bị lỗi';
        if (checked.value === 'B') {
          const txt = fields['loi1604B'] || '';
          giaiThich = `Bản nhúng cũ bị lỗi raw các chương ${txt}, mình đảm bảo sẽ nhúng lại với số chương nhiều hơn hoặc bằng bản nhúng cũ và không bị lỗi.`;
        }
        if (checked.value === 'C') {
          const txt = fields['loi1604C'] || '';
          giaiThich = `${txt}, mình đảm bảo sẽ nhúng lại với số chương nhiều hơn hoặc bằng bản nhúng cũ và không bị lỗi.`;
        }
        if (giaiThich) fields['giaiThich'] = giaiThich;
      }
    }
    const requiredFields = ['storyUrl', 'currentVersion'];
    let hasError = false;
    requiredFields.forEach(fn => {
      if (!fields[fn]) {
        hasError = true;
        const el = container.querySelector(`[data-field-name="${fn}"]`);
        if (el) el.classList.add('error');
      }
    });
    if (fields['ngayCapNhat'] && !validateDateField(fields['ngayCapNhat'])) {
      hasError = true;
      const el = container.querySelector('[data-field-name="ngayCapNhat"]');
      if (el) el.classList.add('error');
      errEl.textContent = 'Ngày phải có định dạng dd/mm/yyyy hoặc dd-mm-yyyy';
    }
    ['soRawNum', 'soChuongGoc'].forEach(fn => {
      if (fields[fn] && !/^\d+$/.test(fields[fn])) {
        hasError = true;
        errEl.textContent = (errEl.textContent ? errEl.textContent + '; ' : '') + `"${fn}" chỉ được nhập số`;
      }
    });
    if (hasError) {
      if (!errEl.textContent) errEl.textContent = 'Vui lòng điền các trường bắt buộc.';
      return;
    }
    if (!fields['giaiThich']) delete fields['giaiThich'];
    let storyName = fields['storyUrl'] || '';
    try {
      const urlParts = storyName.split('/truyen/');
      if (urlParts.length > 1) storyName = urlParts[1].split('/')[0];
    } catch {}
    storyName = storyName || autoFill.storyName || fields['storyUrl'] || 'Không rõ';
    const don = {
      id: Date.now(),
      type: subTabId,
      storyName,
      storyUrl: fields['storyUrl'] || '',
      createdAt: Date.now(),
      status: 'wait',
      fields
    };
    const list = getsxxnl();
    list.push(don);
    savesxxnl(list);
    showNotification('✓ Đã nhập!');
    panel.querySelectorAll('.sxxnl-tab').forEach(b => b.classList.remove('active'));
    panel.querySelectorAll('.sxxnl-tab')[1].classList.add('active');
    currentMainTab = '2';
    document.getElementById('sxxnl-content-1').style.display = 'none';
    document.getElementById('sxxnl-content-2').style.display = '';
    renderTab2();
    selectedMuc = null;
    buildTab1();
  }
  buildTab1();
  // TAB 2: ĐƠN ĐÃ LƯU
  const TYPE_LABELS = {
    '1601': 'Đơn 1601: mục k',
    '1602': 'Đơn 1602',
    '1603': 'Đơn 1603',
    '1604': 'Đơn 1604: mục o',
    '1605': 'Đơn 1605',
  };
  const FILTER_OPTIONS = [
    { value: 'all',            label: 'Tất cả' },
    { value: '1604',           label: 'Mục O' },
    { value: '1601',           label: 'Mục K' },
    { value: '1602-1603-1605', label: 'Các mục còn lại' },
  ];
  const CAM_KET = {
    'all': 'Xin xóa truyện (đã hết hạn bảo hộ) để nhúng lại bản mới tốt hơn.',
    '1601': 'Xin xóa truyện Trạm Rác (không có DQL và biên tập) theo mục k. Mình cam kết sẽ nhúng lại trong vòng 7 ngày với số chương nhiều hơn hoặc bằng bản nhúng cũ và không bị lỗi.',
    '1602-1603-1605': 'Xin xóa truyện (đã hết hạn bảo hộ) để nhúng lại bản mới tốt hơn.',
    '1604': 'Xin xóa truyện mà chủ hiện tại đang bị khóa Nhúng theo mục o. Mình cam kết sẽ nhúng lại trong vòng 7 ngày.',
  };
  let tab2Filter = 'all';
  let tab2Sort = 'oldest';
  let tab2Search = '';
  let selectedIds = new Set();
  function matchFilter(don, filter) {
    if (filter === 'all') return true;
    if (filter === '1601') return don.type === '1601';
    if (filter === '1604') return don.type === '1604';
    if (filter === '1602-1603-1605') return ['1602','1603','1605'].includes(don.type);
    return true;
  }
  function matchSearch(don, q) {
    if (!q) return true;
    const norm = removeAccents(q);
    const haystack = removeAccents([don.storyName, don.storyUrl, ...Object.values(don.fields || {})].join(' '));
    return haystack.includes(norm);
  }
  function donToText(don) {
    const lines = [];
    const f = don.fields || {};
    if (f.storyUrl)       lines.push(`-Truyện muốn xin xóa: ${f.storyUrl}`);
    if (f.banNhungTrung)  lines.push(`-Bản nhúng trùng: ${f.banNhungTrung}`);
    if (f.managers)       lines.push(`-Quản lý truyện: ${f.managers}`);
    if (f.muc)            lines.push(`-Xin xóa theo mục: ${f.muc}`);
    if (f.currentVersion) lines.push(`-Bản nhúng đang có: ${f.currentVersion}`);
    if (f.linkGoc)        lines.push(`-Link truyện gốc: ${f.linkGoc}`);
    if (f.ngayCapNhat)    lines.push(`-Ngày truyện gốc cập nhật chương mới nhất: ${f.ngayCapNhat}`);
    if (f.soChuongGoc)    lines.push(`-Số chương của truyện gốc: ${f.soChuongGoc} chương`);
    if (f.soRawNum) {
      const chapName = f.soRawChapName ? ` (${f.soRawChapName})` : '';
      lines.push(`-Số raw mà mình đang có để chuẩn bị nhúng lại: ${f.soRawNum} chương${chapName}`);
    }
    if (f.giaiThich)      lines.push(`-Giải thích thêm: ${f.giaiThich}`);
    if (f.linkBanNhung)   lines.push(`-Link bản nhúng mới: ${f.linkBanNhung}`);
    if (f.choTaiRaw)      lines.push(`-Chỗ tải raw: ${f.choTaiRaw}`);
    return lines.join('\n');
  }
  function donToClipText(don) {
    const lines = [];
    const f = don.fields || {};
    if (f.storyUrl)       lines.push(`-Truyện muốn xin xóa: ${f.storyUrl}`);
    if (f.banNhungTrung)  lines.push(`-Bản nhúng trùng: ${f.banNhungTrung}`);
    if (f.managers)       lines.push(`-Quản lý truyện: ${f.managers}`);
    if (f.muc)            lines.push(`-Xin xóa theo mục: ${f.muc}`);
    if (f.currentVersion) lines.push(`-Bản nhúng đang có: ${f.currentVersion}`);
    if (f.linkGoc)        lines.push(`-Link truyện gốc: ${f.linkGoc}`);
    if (f.ngayCapNhat)    lines.push(`-Ngày truyện gốc cập nhật chương mới nhất: ${f.ngayCapNhat}`);
    if (f.soChuongGoc)    lines.push(`-Số chương của truyện gốc: ${f.soChuongGoc} chương`);
    if (f.soRawNum) {
      const chapName = f.soRawChapName ? ` (${f.soRawChapName})` : '';
      lines.push(`-Số raw mà mình đang có để chuẩn bị nhúng lại: ${f.soRawNum} chương${chapName}`);
    }
    if (f.giaiThich)      lines.push(`-Giải thích thêm: ${f.giaiThich}`);
    if (f.linkBanNhung)   lines.push(`-Link bản nhúng mới: ${f.linkBanNhung}`);
    return lines.join('\n');
  }
  function buildCopyText(dons, filter) {
    const texts = dons.map(d => donToClipText(d));
    const camKet = CAM_KET[filter] || '';
    if (dons.length === 1) {
      return camKet ? `${camKet}\n\n${texts[0]}` : texts[0];
    }
    const numbered = texts.map((t, i) => `${i + 1}/\n${t}`).join('\n\n');
    return camKet ? `${camKet}\n\n${numbered}` : numbered;
  }
  async function renderTab2() {
    const content2 = document.getElementById('sxxnl-content-2');
    content2.innerHTML = '';
    // Toolbar
    const toolbar = document.createElement('div');
    toolbar.className = 'sxxnl-toolbar';
    const cbAll = document.createElement('input');
    cbAll.type = 'checkbox';
    cbAll.title = 'Chọn tất cả';
    toolbar.appendChild(cbAll);
    // Filter dropdown
    const filterSel = document.createElement('select');
    filterSel.className = 'sxxnl-select';
    filterSel.style.cssText = 'display:inline-block!important;visibility:visible!important;opacity:1!important;max-width:140px;';
    FILTER_OPTIONS.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt.value; o.textContent = opt.label;
      if (opt.value === tab2Filter) o.selected = true;
      filterSel.appendChild(o);
    });
    filterSel.addEventListener('change', () => { tab2Filter = filterSel.value; selectedIds.clear(); renderTab2(); });
    toolbar.appendChild(filterSel);
    // Sort dropdown
    const sortSel = document.createElement('select');
    sortSel.className = 'sxxnl-select';
    sortSel.style.cssText = 'display:inline-block!important;visibility:visible!important;opacity:1!important;max-width:130px;';
    [['newest','Mới nhất'],['oldest','Cũ nhất']].forEach(([v,l]) => {
      const o = document.createElement('option');
      o.value = v; o.textContent = l;
      if (v === tab2Sort) o.selected = true;
      sortSel.appendChild(o);
    });
    sortSel.addEventListener('change', () => { tab2Sort = sortSel.value; renderTab2(); });
    toolbar.appendChild(sortSel);
    const btnCopy = document.createElement('button');
    btnCopy.className = 'sxxnl-toolbar-btn';
    btnCopy.textContent = '📋 Sao chép';
    btnCopy.addEventListener('click', async () => {
      const visible = getVisibleDons();
      const selected = visible.filter(d => selectedIds.has(d.id));
      if (!selected.length) { showNotification('Chưa chọn đơn nào!'); return; }
      const text = buildCopyText(selected, tab2Filter);
      navigator.clipboard.writeText(text).then(() => showNotification('✓ Đã sao chép!'));
    });
    toolbar.appendChild(btnCopy);
    const btnDone = document.createElement('button');
    btnDone.className = 'sxxnl-toolbar-btn';
    btnDone.textContent = '➡️ Đánh dấu tiếp';
    btnDone.title = 'Tăng trạng thái của đơn đã chọn lên 1 bậc (wait→link→post)';
    btnDone.addEventListener('click', async () => {
      if (!selectedIds.size) return;
      const STATUS_ORDER = ['wait','link','post'];
      const list = (getsxxnl()).map(d => {
        if (!selectedIds.has(d.id)) return d;
        const cur = STATUS_ORDER.includes(d.status) ? d.status : 'wait';
        const nextIdx = Math.min(STATUS_ORDER.indexOf(cur) + 1, STATUS_ORDER.length - 1);
        return { ...d, status: STATUS_ORDER[nextIdx] };
      });
      savesxxnl(list);
      selectedIds.clear();
      renderTab2();
    });
    toolbar.appendChild(btnDone);
    const btnDel = document.createElement('button');
    btnDel.className = 'sxxnl-toolbar-btn';
    btnDel.textContent = '🗑 Xoá đơn';
    btnDel.addEventListener('click', async () => {
      if (!selectedIds.size) return;
      if (!confirm(`Xoá ${selectedIds.size} đơn đã chọn?`)) return;
      const list = (getsxxnl()).filter(d => !selectedIds.has(d.id));
      savesxxnl(list);
      selectedIds.clear();
      renderTab2();
    });
    toolbar.appendChild(btnDel);
    content2.appendChild(toolbar);
    // Row 2: search + count
    const toolbar2 = document.createElement('div');
    toolbar2.className = 'sxxnl-toolbar';
    const searchInput = document.createElement('input');
    searchInput.className = 'sxxnl-search';
    searchInput.style.flex = '1';
    searchInput.placeholder = '🔍 Tìm kiếm...';
    searchInput.value = tab2Search;
    let searchDebounce = null;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchDebounce);
      searchDebounce = setTimeout(() => { tab2Search = searchInput.value; renderTab2(); }, 500);
    });
    toolbar2.appendChild(searchInput);
    const countSpan = document.createElement('span');
    countSpan.className = 'sxxnl-selected-count';
    countSpan.id = 'sxxnl-selected-count';
    toolbar2.appendChild(countSpan);
    content2.appendChild(toolbar2);
    const listWrap = document.createElement('div');
    const visible = getVisibleDons();
    countSpan.textContent = selectedIds.size > 0 ? `Đã chọn ${selectedIds.size} đơn` : '';
    if (!visible.length) {
      listWrap.innerHTML = '<div style="text-align:center;color:#546E7A;padding:20px;font-size:13px;">Không có đơn nào.</div>';
    }
    cbAll.addEventListener('change', () => {
      visible.forEach(d => { if (cbAll.checked) selectedIds.add(d.id); else selectedIds.delete(d.id); });
      renderTab2();
    });
    cbAll.checked = visible.length > 0 && visible.every(d => selectedIds.has(d.id));
    cbAll.indeterminate = selectedIds.size > 0 && !cbAll.checked;
    function syncCbAll() {
      const countEl = document.getElementById('sxxnl-selected-count');
      if (countEl) countEl.textContent = selectedIds.size > 0 ? `Đã chọn ${selectedIds.size} đơn` : '';
      cbAll.indeterminate = selectedIds.size > 0 && selectedIds.size < visible.length;
      cbAll.checked = visible.length > 0 && selectedIds.size === visible.length;
    }
    visible.forEach(don => {
      const item = document.createElement('div');
      item.className = 'sxxnl-don-item';
      const header = document.createElement('div');
      header.className = 'sxxnl-don-header';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = selectedIds.has(don.id);
      cb.addEventListener('change', () => {
        if (cb.checked) selectedIds.add(don.id); else selectedIds.delete(don.id);
        syncCbAll();
      });
      const body = document.createElement('div');
      body.className = 'sxxnl-don-body';
      const text = donToText(don);
      const htmlText = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>');
      body.innerHTML = htmlText;
      const title = document.createElement('span');
      title.className = 'sxxnl-don-title';
      title.textContent = don.storyName || don.storyUrl || '(Không tên)';
      title.addEventListener('click', (e) => { e.stopPropagation(); body.classList.toggle('open'); });
      const meta = document.createElement('span');
      meta.className = 'sxxnl-don-meta';
      meta.textContent = TYPE_LABELS[don.type] || don.type;
      const dateSpan = document.createElement('span');
      dateSpan.className = 'sxxnl-don-meta';
      dateSpan.textContent = formatDate(don.createdAt);
      const badge = document.createElement('span');
      const STATUS_ORDER = ['wait','link','post'];
      const STATUS_LABELS = { wait: 'wait', link: 'link', post: 'post' };
      const curStatus = STATUS_ORDER.includes(don.status) ? don.status : 'wait';
      badge.className = 'sxxnl-badge ' + curStatus;
      badge.textContent = STATUS_LABELS[curStatus];
      header.addEventListener('click', (e) => {
        if (e.target === cb || e.target === title || title.contains(e.target)) return;
        cb.checked = !cb.checked;
        if (cb.checked) { selectedIds.add(don.id); item.classList.add('selected-card'); }
        else { selectedIds.delete(don.id); item.classList.remove('selected-card'); }
        syncCbAll();
      });
      if (selectedIds.has(don.id)) item.classList.add('selected-card');
      const actions = document.createElement('div');
      actions.className = 'sxxnl-don-actions';
      const btnEdit = document.createElement('button');
      btnEdit.className = 'sxxnl-don-action-btn';
      btnEdit.textContent = '✏️';
      btnEdit.title = 'Sửa đơn';
      btnEdit.addEventListener('click', (e) => { e.stopPropagation(); openEditModal(don); });
      actions.appendChild(btnEdit);
      const nextIdx = Math.min(STATUS_ORDER.indexOf(curStatus) + 1, STATUS_ORDER.length - 1);
      const nextStatus = STATUS_ORDER[nextIdx];
      const btnNext = document.createElement('button');
      btnNext.className = 'sxxnl-don-action-btn';
      btnNext.textContent = '➡️';
      btnNext.title = curStatus === 'post' ? 'Đã ở trạng thái cuối' : `Đánh dấu: ${nextStatus}`;
      btnNext.disabled = curStatus === 'post';
      btnNext.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (curStatus === 'post') return;
        const list = (getsxxnl()).map(d => d.id === don.id ? { ...d, status: nextStatus } : d);
        savesxxnl(list);
        showNotification(`➡️ ${nextStatus}`);
        renderTab2();
      });
      actions.appendChild(btnNext);
      const prevIdx = Math.max(STATUS_ORDER.indexOf(curStatus) - 1, 0);
      const prevStatus = STATUS_ORDER[prevIdx];
      const btnPrev = document.createElement('button');
      btnPrev.className = 'sxxnl-don-action-btn undone';
      btnPrev.textContent = '🔙';
      btnPrev.title = curStatus === 'wait' ? 'Đã ở trạng thái đầu' : `Quay lại: ${prevStatus}`;
      btnPrev.disabled = curStatus === 'wait';
      btnPrev.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (curStatus === 'wait') return;
        const list = (getsxxnl()).map(d => d.id === don.id ? { ...d, status: prevStatus } : d);
        savesxxnl(list);
        showNotification(`🔙 ${prevStatus}`);
        renderTab2();
      });
      actions.appendChild(btnPrev);
      const headerLeft = document.createElement('div');
      headerLeft.className = 'sxxnl-don-header-left';
      headerLeft.append(cb, title);
      const headerRight = document.createElement('div');
      headerRight.className = 'sxxnl-don-header-right';
      headerRight.append(meta, badge, dateSpan, actions);
      header.append(headerLeft, headerRight);
      item.appendChild(header);
      item.appendChild(body);
      listWrap.appendChild(item);
    });
    content2.appendChild(listWrap);
  }
  function getVisibleDons() {
    let list = getsxxnl();
    list = list.filter(d => matchFilter(d, tab2Filter) && matchSearch(d, tab2Search));
    list.sort((a, b) => tab2Sort === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);
    return list;
  }
  // INFORMATION POPOVER
  const infoPopover = document.createElement('div');
  infoPopover.id = 'sxxnl-info-popover';
  const INFO_SELECT_OPTIONS = [
    { value: 'all', label: 'Tất cả' },
    { value: 'a',   label: 'Mục A - Vi phạm, chủ ≠ Trạm Rác' },
    { value: 'b',   label: 'Mục B - Vi phạm, chủ = Trạm Rác' },
    { value: 'c',   label: 'Mục C - Báo lỗi raw > 14 ngày' },
    { value: 'd',   label: 'Mục D - Gốc > 20c, raw < 100c' },
    { value: 'e',   label: 'Mục E - Gốc ngừng, raw < gốc' },
    { value: 'f',   label: 'Mục F - Gốc hoàn, báo lỗi > 14 ngày' },
    { value: 'g',   label: 'Mục G - Gốc hoàn > 14 ngày' },
    { value: 'i',   label: 'Mục I - Chủ truyện đồng ý xoá' },
    { value: 'k',   label: 'Mục K - Trạm rác lỗi raw' },
    { value: 'l',   label: 'Mục L - Bản bị khóa riêng tư' },
    { value: 'm',   label: 'Mục M - Có >40c so với raw' },
    { value: 'n',   label: 'Mục N - Bị từ chối DQL > 14 ngày' },
    { value: 'o',   label: 'Mục O - Chủ bị khóa Nhúng' },
    { value: 'p',   label: 'Mục P - File ngừng up > 3 tháng' },
    { value: 'r',   label: 'Mục R - Tag chưa xác minh' },
  ];
  infoPopover.innerHTML = `
    <div class="sxxnl-info-header">
      <span>Thông tin các mục</span>
      <select id="sxxnl-info-select">
        ${INFO_SELECT_OPTIONS.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
      </select>
      <button class="sxxnl-header-btn" id="sxxnl-info-close">×</button>
    </div>
    <div class="sxxnl-info-body">
      <div class="sxxnl-info-content" id="sxxnl-info-content"></div>
    </div>
  `;
  document.body.appendChild(infoPopover);
  function formatInfoHtml(text) {
    if (!text) return '';
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      .replace(/\[color=rgb\(255,\s*0,\s*0\)\](.*?)\[\/color\]/gs, '<span style="color:rgb(255,0,0)">$1</span>')
      .replace(/\n/g, '<br>');
  }
  function renderInfoContent(muc) {
    const el = document.getElementById('sxxnl-info-content');
    if (muc === 'all') {
      el.innerHTML = MUC_LIST.map((m, idx) => {
        const header = `<strong style="font-size:14px;color:#2563eb;">Mục ${m.toUpperCase()}</strong> <span style="font-size:11.5px;color:#6b7280;font-style:italic;">${MUC_SHORT[m] || ''}</span>`;
        const body = formatInfoHtml(INFO_CONTENT[m] || '');
        const divider = idx < MUC_LIST.length - 1
          ? '<hr class="sxxnl-info-divider">'
          : '';
        return `<div>${header}<br><br>${body}</div>${divider}`;
      }).join('');
    } else {
      const label = MUC_SHORT[muc] || '';
      el.innerHTML = `<strong style="font-size:14px;color:#2563eb;">Mục ${muc.toUpperCase()}</strong> <span style="font-size:11.5px;color:#6b7280;font-style:italic;">${label}</span><br><br>${formatInfoHtml(INFO_CONTENT[muc] || 'Không có thông tin.')}`;
    }
  }
  document.getElementById('sxxnl-info-select').addEventListener('change', (e) => {
    renderInfoContent(e.target.value);
  });
  document.getElementById('sxxnl-info-close').addEventListener('click', () => {
    infoPopover.classList.remove('open');
  });
  panel.querySelector('#sxxnl-info-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    const open = infoPopover.classList.toggle('open');
    if (open) {
      const sel = document.getElementById('sxxnl-info-select');
      if (sel) sel.value = 'all';
      renderInfoContent('all');
      const pr = panel.getBoundingClientRect();
      infoPopover.style.top = pr.top + 'px';
      infoPopover.style.left = (pr.right + 10) + 'px';
      const iw = 390;
      if (pr.right + 10 + iw > window.innerWidth) {
        infoPopover.style.left = (pr.left - iw - 10) + 'px';
      }
    }
  });
  document.addEventListener('click', (e) => {
    if (!infoPopover.contains(e.target) && e.target !== panel.querySelector('#sxxnl-info-btn')) {
      infoPopover.classList.remove('open');
    }
  });
})();
