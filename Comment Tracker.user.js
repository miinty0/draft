// ==UserScript==
// @name         Comment Tracker
// @history      Group theo truyện với expand/collapse
// @namespace    Minty
// @version      3.5
// @description  Load, filter, and manage comment notifications
// @match        *://*/user/*/binh-luan*
// @grant        GM_getValue
// @grant        GM_setValue
// @run-at       document-idle
// @updateURL   https://raw.githubusercontent.com/miinty0/draft/main/Comment%20Tracker.user.js
// @downloadURL https://raw.githubusercontent.com/miinty0/draft/main/Comment%20Tracker.user.js
// ==/UserScript==
(function () {
  'use strict';
  //  STORAGE
  const STORE_KEY  = 'wct_comments';
  const MARK_KEY    = 'wct_mark_ids';
  const loadStore   = () => { try { return JSON.parse(GM_getValue(STORE_KEY,  '[]')); } catch { return []; } };
  const saveStore   = a  => GM_setValue(STORE_KEY,  JSON.stringify(a));
  const loadMarks = () => { try { return JSON.parse(GM_getValue(MARK_KEY, '[]')); } catch { return []; } };
  const saveMarks = a  => GM_setValue(MARK_KEY, JSON.stringify(a));
  //  SANITIZE
  // <img> có "thaonema" → [sticker], còn lại → [image]
  const BLOCK_TAGS = new Set(['p','div','blockquote','li','pre','h1','h2','h3','h4','h5','h6']);
  const ALLOWED_TAGS = new Set([    'b','strong','i','em','u','s','strike','del','ins','sup','sub','small','mark',
    'br','p','div','span',
    'blockquote','pre','code',
    'ul','ol','li',
    'a',
    'table','thead','tbody','tr','th','td',
    'h1','h2','h3','h4','h5','h6',
  ]);
  const ALLOWED_STYLE_PROPS = new Set([
    'font-weight','font-style','text-decoration','text-decoration-line',
    'text-align','color','background-color','background',
  ]);
  const ALLOWED_ATTRS = {
    'a':  ['href','title','rel','target'],
    '*':  ['class','style'],
  };
  const DANGEROUS_TAGS = new Set(['script','style','iframe','object','embed','form','input','button','select','textarea','link','meta','base','noscript']);
  function sanitizeStyle(styleStr) {
    if (!styleStr) return '';
    const kept = [];
    styleStr.split(';').forEach(part => {
      const [prop, ...rest] = part.split(':');
      if (!prop) return;
      const p = prop.trim().toLowerCase();
      if (ALLOWED_STYLE_PROPS.has(p)) {
        const val = rest.join(':').trim();
        if (!/url\s*\(|expression\s*\(/i.test(val)) {
          kept.push(`${p}:${val}`);
        }
      }
    });
    return kept.join(';');
  }
  function sanitizeMsgHtml(raw) {
    const tmp = document.createElement('div');
    tmp.innerHTML = raw;
    function walk(node) {
      const children = Array.from(node.childNodes);
      for (const child of children) {
        if (child.nodeType === Node.ELEMENT_NODE) {
          const tag = child.tagName.toLowerCase();
          if (DANGEROUS_TAGS.has(tag)) {
            child.remove();
            continue;
          }
          if (tag === 'img') {
            const src   = child.getAttribute('src')   || '';
            const title = child.getAttribute('title') || '';
            const alt   = child.getAttribute('alt')   || '';
            const isThaonema = /thaonema/i.test(src) || /thaonema/i.test(title) || /thaonema/i.test(alt);
            const placeholder = document.createTextNode(isThaonema ? '[sticker]' : '[image]');
            child.replaceWith(placeholder);
            continue;
          }
          if (!ALLOWED_TAGS.has(tag)) {
            const span = document.createElement('span');
            span.append(...child.childNodes);
            child.replaceWith(span);
            walk(span);
            continue;
          }
          const allowedForTag = (ALLOWED_ATTRS[tag] || []).concat(ALLOWED_ATTRS['*'] || []);
          Array.from(child.attributes).forEach(attr => {
            if (attr.name === 'style') {
              const cleaned = sanitizeStyle(attr.value);
              if (cleaned) child.setAttribute('style', cleaned);
              else child.removeAttribute('style');
            } else if (!allowedForTag.includes(attr.name)) {
              child.removeAttribute(attr.name);
            }
          });
          if (tag === 'a') {
            const href = child.getAttribute('href') || '';
            if (/^javascript:/i.test(href) || /^data:/i.test(href)) {
              child.removeAttribute('href');
            }
            child.setAttribute('target', '_blank');
            child.setAttribute('rel', 'noopener noreferrer');
          }
          walk(child);
        }
      }
    }
    walk(tmp);
    tmp.querySelectorAll([...BLOCK_TAGS].join(',')).forEach(el => {
      if (!el.textContent.trim() && !el.querySelector('br')) el.remove();
    });
    return tmp.innerHTML;
  }
  //  PARSE
  function parseArticles(doc) {
    return Array.from(doc.querySelectorAll('article.notification')).map(art => {
      const href     = art.querySelector('a.notification-content')?.getAttribute('href') ?? '';
      const msgEl  = art.querySelector('.notification-msg');
      const msgHtml = msgEl ? sanitizeMsgHtml(msgEl.innerHTML) : '';
      const msg     = msgEl ? msgEl.textContent.replace(/\s+/g, ' ').trim() : '';
      const interval = parseFloat(art.querySelector('time[data-interval]')?.getAttribute('data-interval') ?? 0);
      const ts       = Date.now() - interval * 1000;
      const isUnread = art.classList.contains('red');
      const headerSpans = art.querySelectorAll('.notification-header span');
      const user       = headerSpans.length >= 1 ? headerSpans[0].textContent.trim() : '';
      const storyTitle = headerSpans.length >= 2 ? headerSpans[1].textContent.trim() : '';
      // id = user + href + ts (làm tròn giây) → unique cho mọi trường hợp
      const tsRounded  = Math.round(ts / 1000);
      const idRaw      = user + '|' + href + '|' + tsRounded;
      const id         = idRaw.replace(/[^a-zA-Z0-9_|-]/g, '_');
      return { id, href, msg, msgHtml, ts, isUnread, user, storyTitle };
    });
  }
  function getTotalPages(doc) {
    // 1. icon »
    const lastBtn = doc.querySelector('ul.pagination a i.fa-angle-double-right, .pagination a i.fa-angle-double-right');
    if (lastBtn) {
      const href = lastBtn.closest('a')?.getAttribute('href') || '';
      const m = href.match(/[?&]start=(\d+)/);
      if (m) return Math.floor(parseInt(m[1], 10) / 10) + 1;
    }
    // 2. start=max
    let maxStart = 0;
    doc.querySelectorAll('ul.pagination a[href*="start="], .pagination a[href*="start="]').forEach(a => {
      const m = (a.getAttribute('href') || '').match(/[?&]start=(\d+)/);
      if (m) {
        const s = parseInt(m[1], 10);
        if (s > maxStart) maxStart = s;
      }
    });
    if (maxStart > 0) return Math.floor(maxStart / 10) + 1;
    // Fallback
    let max = 1;
    doc.querySelectorAll('ul.pagination li a, .pagination a').forEach(a => {
      const n = parseInt(a.textContent.trim(), 10);
      if (!isNaN(n) && n > max) max = n;
    });
    return max;
  }
  // Random delay
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const sleepRandom = (min, max) => sleep(min + Math.random() * (max - min));
  // Retry + exponential backoff
  async function loadPage(url, attempt = 0) {
    try {
      const res = await fetch(url, { credentials: 'same-origin' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      // Error page / captcha / redirect log in
      if (text.length < 500 || text.includes('đăng nhập') || text.includes('login')) {
        throw new Error('Trang trả về không hợp lệ (có thể bị chặn hoặc hết session)');
      }
      return new DOMParser().parseFromString(text, 'text/html');
    } catch (e) {
      if (attempt >= 3) throw e;
      const wait = 2000 * Math.pow(2, attempt);
      console.warn(`[WCT] Lỗi trang ${url}, thử lại sau ${wait}ms... (${e.message})`);
      await sleep(wait);
      return loadPage(url, attempt + 1);
    }
  }
  const baseUrl = () => location.href.split('?')[0];
  //  KEEP-ALIVE AUDIO
  let _audioCtx = null, _audioSrc = null;
  function startKeepAlive() {
    try {
    _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const sampleRate = _audioCtx.sampleRate;
      const buf = _audioCtx.createBuffer(1, sampleRate, sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < sampleRate; i++) {
        data[i] = Math.sin(2 * Math.PI * 440 * i / sampleRate);
      }
      _audioSrc = _audioCtx.createBufferSource();
      _audioSrc.buffer = buf;
      _audioSrc.loop = true;
      const gain = _audioCtx.createGain();
      gain.gain.value = 0.001;
      _audioSrc.connect(gain);
      gain.connect(_audioCtx.destination);
      _audioSrc.start();
    } catch (e) {
      console.warn('[WCT] Không thể khởi động keep-alive audio:', e.message);
    }
  }
  function stopKeepAlive() {
    try { _audioSrc?.stop(); } catch {}
    try { _audioCtx?.close(); } catch {}
    _audioSrc = null; _audioCtx = null;
  }
  async function loadComments(mode, param, onProgress, abortFlag = {}) {
    const marks    = loadMarks();
    const store    = loadStore();
    const newestMarkId = marks.length
      ? store.filter(c => marks.includes(c.id)).sort((a, b) => b.ts - a.ts)[0]?.id ?? marks[0]
      : null;
    const collected = [];
    let page = (mode === 'from_page') ? Math.max(1, Math.floor(param)) : 1;
    let totalPages = null, done = false;
    while (!done) {
      if (abortFlag.cancelled) break;
      onProgress?.(page, totalPages);
      const start = (page - 1) * 10;
      const url   = start === 0 ? baseUrl() : `${baseUrl()}?start=${start}`;
      const doc = await loadPage(url);
      if (totalPages === null) { totalPages = getTotalPages(doc); onProgress?.(page, totalPages); }
      const articles = parseArticles(doc);
      if (!articles.length) break;
      for (const a of articles) {
        if (mode === 'sync' && newestMarkId) {
          // So sánh đủ: user + chương (href) + thời gian (ts làm tròn giây) + nội dung
          // để dừng đúng khi gặp lại đúng comment đã mark, tránh nhầm comment khác
          const markedComment = store.find(c => c.id === newestMarkId);
          if (markedComment) {
            const sameUser  = a.user  === markedComment.user;
            const sameHref  = a.href  === markedComment.href;
            const sameTs    = Math.abs(a.ts - markedComment.ts) < 10000; // trong vòng 10 giây
            const sameMsg   = a.msg   === markedComment.msg;
            if (sameUser && sameHref && sameTs && sameMsg) { done = true; break; }
          } else if (a.id === newestMarkId) {
            // fallback cho comment cũ chưa có trường user
            done = true; break;
          }
        }
        if (mode === 'hours' && a.ts < Date.now() - param * 3_600_000) { done = true; break; }
        collected.push(a);
        if (mode === 'count' && collected.length >= param)             { done = true; break; }
      }
      if (!done) {
        if (page >= totalPages) break;
        page++;
        await sleepRandom(500, 1000);
      }
    }
    return collected;
  }
  function mergeComments(existing, fresh) {
    const map = new Map(existing.map(c => [c.id, c]));
    fresh.forEach(c => map.set(c.id, c));
    return [...map.values()].sort((a, b) => b.ts - a.ts);
  }
  //  UI STATE
  let sortOrder = 'desc', searchQ = '', groupMode = false;
  const collapsedGroups = new Set();
  //  STYLES
  function injectStyles() {
    if (document.getElementById('wct-styles')) return;
    const s = document.createElement('style');
    s.id = 'wct-styles';
    s.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;500;600&display=swap');
      /* === PANEL SHELL === */
      #wct-panel {
        all: initial !important;
        position: fixed !important;
        bottom: 24px !important; right: 24px !important;
        z-index: 2147483647 !important;
        width: 400px !important; max-height: 82vh !important;
        background: rgba(255,255,255,0.96) !important;
        backdrop-filter: blur(24px) saturate(160%) !important;
        -webkit-backdrop-filter: blur(24px) saturate(160%) !important;
        border: 1px solid rgba(0,0,0,0.10) !important;
        border-radius: 12px !important;
        box-shadow: 0 2px 4px rgba(0,0,0,.05), 0 8px 24px rgba(0,0,0,.12), 0 24px 48px rgba(0,0,0,.08) !important;
        font-family: 'Noto Sans','Segoe UI Variable','Segoe UI',system-ui,sans-serif !important;
        font-size: 13px !important;
        color: #201f1e !important;
        display: flex !important;
        flex-direction: column-reverse !important;
        overflow: hidden !important;
        pointer-events: auto !important;
        transition: max-height .25s cubic-bezier(.4,0,.2,1) !important;
        line-height: normal !important;
        box-sizing: border-box !important;
      }
      #wct-panel * {
        box-sizing: border-box !important;
        pointer-events: auto !important;
        font-family: 'Noto Sans','Segoe UI Variable','Segoe UI',system-ui,sans-serif !important;
        line-height: normal !important;
      }
      #wct-panel.wct-collapsed { max-height: 46px !important; }
      #wct-panel.wct-collapsed #wct-chevron { transform: rotate(180deg) !important; }
      /* === TITLEBAR === */
      #wct-panel #wct-titlebar {
        display: flex !important; align-items: center !important;
        justify-content: space-between !important;
        padding: 11px 14px 10px !important;
        border-bottom: 1px solid rgba(0,0,0,0.07) !important;
        cursor: move !important; user-select: none !important; flex-shrink: 0 !important;
        background: transparent !important;
      }
      #wct-panel #wct-titlebar-l {
        display: flex !important; align-items: center !important; gap: 8px !important;
      }
      #wct-panel #wct-title {
        font-weight: 600 !important; font-size: 13.5px !important; color: #201f1e !important;
        margin: 0 !important; padding: 0 !important;
      }
      #wct-panel #wct-collapse-btn {
        all: unset !important;
        display: flex !important; align-items: center !important; justify-content: center !important;
        cursor: pointer !important; padding: 4px 6px !important;
        border-radius: 6px !important; color: #8a8886 !important;
        pointer-events: auto !important;
        transition: background .12s;
      }
      #wct-panel #wct-collapse-btn:hover { background: rgba(0,0,0,.06) !important; color: #323130 !important; }
      #wct-panel #wct-chevron {
        display: block !important;
        transition: transform .25s cubic-bezier(.4,0,.2,1);
      }
      /* === INFO BTN + POPUP === */
      #wct-panel #wct-info-btn {
        all: unset !important;
        display: flex !important; align-items: center !important; justify-content: center !important;
        width: 22px !important; height: 22px !important;
        border-radius: 50% !important;
        border: 1.4px solid #C8C6C4 !important;
        color: #8a8886 !important; font-size: 11.5px !important; font-weight: 600 !important;
        cursor: pointer !important; flex-shrink: 0 !important;
        pointer-events: auto !important;
        transition: background .12s, border-color .12s, color .12s;
        line-height: 1 !important;
      }
      #wct-panel #wct-info-btn:hover {
        background: #EFF6FC !important; border-color: #0078D4 !important; color: #0078D4 !important;
      }
      #wct-panel #wct-info-popup {
        position: absolute !important;
        top: 46px !important; right: 14px !important;
        width: 320px !important;
        background: #ffffff !important;
        border: 1px solid rgba(0,0,0,0.12) !important;
        border-radius: 10px !important;
        box-shadow: 0 4px 16px rgba(0,0,0,.14), 0 1px 4px rgba(0,0,0,.08) !important;
        padding: 14px 16px !important;
        z-index: 10 !important;
        display: flex !important; flex-direction: column !important; gap: 10px !important;
      }
      #wct-panel #wct-info-popup.wct-hidden { display: none !important; }
      #wct-panel .wct-info-title {
        font-size: 12px !important; font-weight: 600 !important;
        color: #A19F9D !important; text-transform: uppercase !important;
        letter-spacing: .5px; margin-bottom: 2px;
      }
      #wct-panel .wct-info-row {
        display: flex !important; gap: 9px !important; align-items: flex-start !important;
      }
      #wct-panel .wct-info-badge {
        flex-shrink: 0 !important;
        display: inline-flex !important; align-items: center !important;
        padding: 1px 7px !important; border-radius: 10px !important;
        font-size: 10.5px !important; font-weight: 600 !important;
        background: #EFF6FC !important; color: #0078D4 !important;
        margin-top: 1px !important;
      }
      #wct-panel .wct-info-badge.mark {
        background: #FFFBEB !important; color: #92400E !important;
      }
      #wct-panel .wct-info-desc {
        font-size: 12px !important; color: #323130 !important; line-height: 1.55 !important;
      }
      #wct-panel .wct-info-sep {
        height: 1px !important; background: #EDEBE9 !important;
      }
      /* === BODY === */
      #wct-panel #wct-body {
        overflow-y: auto !important; overflow-x: hidden !important;
        padding: 12px 14px 16px !important;
        display: flex !important; flex-direction: column !important; gap: 10px !important;
        margin: 0 !important;
        flex: 1 !important; min-height: 0 !important;
      }
      #wct-panel #wct-body::-webkit-scrollbar { width: 5px !important; }
      #wct-panel #wct-body::-webkit-scrollbar-track { background: transparent !important; }
      #wct-panel #wct-body::-webkit-scrollbar-thumb { background: rgba(0,0,0,.13) !important; border-radius: 3px !important; }
      /* === ALERT === */
      #wct-panel #wct-alert {
        display: flex !important; align-items: flex-start !important; gap: 8px !important;
        background: #FFF0F0 !important; border: 1px solid #F5C6C6 !important;
        border-radius: 8px !important; padding: 8px 12px !important;
        font-size: 12.5px !important; color: #A4262C !important; line-height: 1.5 !important;
      }
      #wct-panel .wct-hidden { display: none !important; }
      #wct-panel .wct-btn.wct-hidden { display: none !important; }
      #wct-panel .wct-field.wct-hidden { display: none !important; }
      #wct-panel #wct-alert.wct-hidden { display: none !important; }
      /* === SETTINGS CARD === */
      #wct-panel .wct-card {
        background: #F8F8F8 !important; border: 1px solid #E8E8E8 !important;
        border-radius: 8px !important; padding: 10px 12px !important;
        display: flex !important; flex-direction: column !important; gap: 8px !important;
      }
      #wct-panel .wct-field {
        display: flex !important; align-items: center !important; gap: 10px !important;
      }
      #wct-panel .wct-flabel {
        font-size: 12.5px !important; color: #605e5c !important;
        min-width: 82px !important; flex-shrink: 0 !important;
        margin: 0 !important; padding: 0 !important;
      }
      /* SELECT */
      #wct-panel #wct-mode {
        display: block !important;
        flex: 1 !important;
        width: 100% !important;
        appearance: auto !important;
        -webkit-appearance: menulist !important;
        -moz-appearance: menulist !important;
        background-color: #ffffff !important;
        background-image: none !important;
        border: 1px solid #C8C6C4 !important;
        border-radius: 6px !important;
        padding: 5px 10px !important;
        margin: 0 !important;
        font-size: 13px !important;
        color: #201f1e !important;
        cursor: pointer !important;
        pointer-events: auto !important;
        position: static !important;
        z-index: auto !important;
        opacity: 1 !important;
        visibility: visible !important;
        height: auto !important;
        min-height: 0 !important;
        max-height: none !important;
        overflow: visible !important;
        clip: auto !important;
        clip-path: none !important;
        transform: none !important;
        filter: none !important;
      }
      #wct-panel #wct-mode:focus {
        outline: 2px solid #0078D4 !important; outline-offset: 1px !important;
      }
      #wct-panel #wct-mode option {
        background: #ffffff !important; color: #201f1e !important;
      }
      /* NUMBER INPUT */
      #wct-panel .wct-num {
        width: 80px !important;
        background: #ffffff !important;
        border: 1px solid #C8C6C4 !important;
        border-radius: 6px !important;
        padding: 5px 10px !important;
        font-size: 13px !important;
        color: #201f1e !important;
        pointer-events: auto !important;
        cursor: text !important;
        opacity: 1 !important;
        visibility: visible !important;
        margin: 0 !important;
      }
      #wct-panel .wct-num:focus {
        outline: 2px solid #0078D4 !important; outline-offset: 1px !important;
      }
      /* PROGRESS */
      #wct-panel #wct-prog {
        display: flex !important; flex-direction: column !important; gap: 5px !important;
      }
      #wct-panel .wct-prog-track {
        height: 3px !important; background: #EDEBE9 !important;
        border-radius: 2px !important; overflow: hidden !important;
      }
      #wct-panel #wct-prog-fill {
        height: 100% !important;
        background: linear-gradient(90deg,#0078D4,#50B4FF) !important;
        width: 0% !important; border-radius: 2px !important;
        transition: width .3s ease !important;
      }
      #wct-panel #wct-prog-text { font-size: 11.5px !important; color: #8a8886 !important; }
      /* BUTTONS */
      #wct-panel .wct-actions {
        display: flex !important; align-items: center !important; gap: 7px !important;
      }
      #wct-panel .wct-btn {
        all: unset !important;
        display: inline-flex !important; align-items: center !important; gap: 5px !important;
        padding: 6px 14px !important; border-radius: 6px !important;
        border: 1px solid transparent !important;
        font-size: 12.5px !important; font-weight: 500 !important;
        cursor: pointer !important; white-space: nowrap !important;
        pointer-events: auto !important;
        transition: background .12s, border-color .12s, box-shadow .12s !important;
        user-select: none !important;
      }
      #wct-panel .wct-btn:active { transform: scale(.98) !important; }
      #wct-panel .wct-btn:disabled { opacity: .5 !important; cursor: not-allowed !important; }
      #wct-panel .wct-btn.primary {
        background: #0078D4 !important; color: #ffffff !important;
        border-color: #0078D4 !important;
      }
      #wct-panel .wct-btn.primary:not(:disabled):hover {
        background: #106EBE !important; box-shadow: 0 2px 8px rgba(0,120,212,.3) !important;
      }
      #wct-panel .wct-btn.secondary {
        background: #ffffff !important; color: #323130 !important;
        border-color: #C8C6C4 !important;
      }
      #wct-panel .wct-btn.secondary:not(:disabled):hover { background: #F3F2F1 !important; }
      #wct-panel .wct-btn.icon-only {
        padding: 6px 8px !important; background: transparent !important;
        border-color: transparent !important; color: #8a8886 !important;
      }
      #wct-panel .wct-btn.icon-only:hover { background: rgba(0,0,0,.06) !important; color: #323130 !important; }
      /* DIVIDER */
      #wct-panel .wct-divider {
        height: 1px !important; background: #EDEBE9 !important; flex-shrink: 0 !important;
      }
      /* TOOLBAR */
      #wct-panel .wct-toolbar {
        display: flex !important; align-items: center !important; gap: 8px !important;
      }
      #wct-panel .wct-segs {
        display: flex !important; background: #F3F2F1 !important;
        border-radius: 7px !important; padding: 2px !important; gap: 1px !important;
      }
      #wct-panel .wct-seg {
        all: unset !important;
        display: inline-block !important;
        cursor: pointer !important; padding: 3px 11px !important;
        border-radius: 5px !important; font-size: 12px !important;
        color: #8a8886 !important; font-weight: 500 !important;
        pointer-events: auto !important; user-select: none !important;
        transition: background .12s, color .12s !important;
      }
      #wct-panel .wct-seg.active {
        background: #ffffff !important; color: #0078D4 !important;
        box-shadow: 0 1px 3px rgba(0,0,0,.1) !important;
      }
      #wct-panel .wct-search {
        flex: 1 !important; max-width: 150px !important;
        background: #ffffff !important; border: 1px solid #C8C6C4 !important;
        border-radius: 6px !important; padding: 4px 10px !important;
        font-size: 12.5px !important; color: #201f1e !important;
        margin-left: auto !important;
        pointer-events: auto !important; cursor: text !important;
      }
      #wct-panel .wct-search::placeholder { color: #C8C6C4 !important; }
      #wct-panel .wct-search:focus {
        outline: 2px solid #0078D4 !important; outline-offset: 1px !important;
      }
      /* STATS */
      #wct-panel .wct-stats { font-size: 11.5px !important; color: #A19F9D !important; }
      /* COMMENT LIST */
      #wct-panel #wct-list {
        display: flex !important; flex-direction: column !important; gap: 6px !important;
      }
      #wct-panel .wct-item {
        background: #ffffff !important; border: 1px solid #EDEBE9 !important;
        border-radius: 8px !important; padding: 10px 12px !important;
        transition: border-color .12s, box-shadow .12s !important;
      }
      #wct-panel .wct-item:hover {
        border-color: #C8C6C4 !important; box-shadow: 0 2px 8px rgba(0,0,0,.07) !important;
      }
      #wct-panel .wct-item.unread   { border-left: 3px solid #C50F1F !important; }
      #wct-panel .wct-item.marked { border-left: 3px solid #CA8A04 !important; }
      #wct-panel .wct-item-head {
        display: flex !important; align-items: center !important;
        gap: 6px !important; margin-bottom: 5px !important; flex-wrap: wrap !important;
      }
      #wct-panel .wct-item-time { font-size: 11px !important; color: #A19F9D !important; }
      #wct-panel .wct-pill {
        display: inline-flex !important; align-items: center !important; gap: 3px !important;
        font-size: 10.5px !important; font-weight: 600 !important;
        padding: 1px 7px !important; border-radius: 10px !important;
      }
      #wct-panel .wct-pill.unread   { background: #FFF0F0 !important; color: #A4262C !important; }
      #wct-panel .wct-pill.marked { background: #FFFBEB !important; color: #92400E !important; }
      #wct-panel .wct-item-msg {
        color: #323130 !important; line-height: 1.6 !important;
        margin-bottom: 6px !important; word-break: break-word !important;
        font-size: 13px !important;
      }
      #wct-panel .wct-goto {
        display: inline-flex !important; align-items: center !important; gap: 4px !important;
        font-size: 12px !important; color: #0078D4 !important; text-decoration: none !important;
        cursor: pointer !important; min-width: 0 !important; max-width: 65% !important;
        overflow: hidden !important;
      }
      #wct-panel .wct-goto-label { flex-shrink: 0 !important; }
      #wct-panel .wct-goto-title {
        overflow: hidden !important; text-overflow: ellipsis !important;
        white-space: nowrap !important; min-width: 0 !important;
      }
      #wct-panel .wct-goto:hover { color: #106EBE !important; text-decoration: underline !important; }
      #wct-panel .wct-item-foot {
        display: flex !important; align-items: center !important;
        justify-content: space-between !important; margin-top: 6px !important;
      }
      #wct-panel .wct-mark-btn {
        all: unset !important;
        display: inline-flex !important; align-items: center !important; gap: 3px !important;
        font-size: 11px !important; color: #A19F9D !important;
        cursor: pointer !important; padding: 2px 4px !important;
        border-radius: 4px !important;
        transition: background .12s, color .12s !important;
        pointer-events: auto !important;
      }
      #wct-panel .wct-mark-btn:hover { background: #FFFBEB !important; color: #92400E !important; }
      #wct-panel .wct-mark-btn.active { color: #CA8A04 !important; font-weight: 600 !important; }
      #wct-panel .wct-empty {
        text-align: center !important; padding: 24px 0 !important;
        color: #C8C6C4 !important; font-size: 13px !important;
      }
      /* MARK HINT BANNER */
      #wct-panel #wct-mark-hint {
        display: flex !important; align-items: flex-start !important; gap: 8px !important;
        background: #FFFBEB !important; border: 1px solid #FDE68A !important;
        border-radius: 8px !important; padding: 8px 12px !important;
        font-size: 12.5px !important; color: #92400E !important; line-height: 1.5 !important;
      }
      #wct-panel #wct-mark-hint.wct-hidden { display: none !important; }
      /* SCROLL TO MARK BUTTON */
      #wct-panel #wct-goto-mark-btn {
        all: unset !important;
        display: inline-flex !important; align-items: center !important; gap: 5px !important;
        padding: 4px 10px !important; border-radius: 6px !important;
        border: 1px solid #FDE68A !important;
        background: #FFFBEB !important; color: #92400E !important;
        font-size: 12px !important; font-weight: 500 !important;
        cursor: pointer !important; white-space: nowrap !important;
        pointer-events: auto !important;
        transition: background .12s, border-color .12s !important;
        flex-shrink: 0 !important;
      }
      #wct-panel #wct-goto-mark-btn:hover { background: #FEF3C7 !important; border-color: #F59E0B !important; }
      #wct-panel #wct-goto-mark-btn.wct-hidden { display: none !important; }
      /* HTML MSG */
      #wct-panel .wct-item-msg blockquote {
        margin: 4px 0 4px 8px !important; padding: 4px 10px !important;
        border-left: 3px solid #C8C6C4 !important;
        color: #605e5c !important; font-size: 12.5px !important;
        background: #F8F8F8 !important; border-radius: 0 4px 4px 0 !important;
      }
      #wct-panel .wct-item-msg pre,
      #wct-panel .wct-item-msg code {
        font-family: 'Consolas','Fira Code',monospace !important;
        font-size: 12px !important; background: #F3F2F1 !important;
        border-radius: 4px !important; padding: 1px 5px !important;
      }
      #wct-panel .wct-item-msg pre {
        padding: 6px 10px !important; overflow-x: auto !important;
        white-space: pre-wrap !important;
      }
      #wct-panel .wct-item-msg a {
        color: #0078D4 !important; text-decoration: underline !important;
      }

      /* === GROUP === */
      #wct-panel .wct-group { display: flex !important; flex-direction: column !important; gap: 4px !important; }
      #wct-panel .wct-group-header {
        all: unset !important;
        display: flex !important; align-items: center !important; gap: 6px !important;
        padding: 5px 8px !important; border-radius: 7px !important;
        background: #F3F2F1 !important; cursor: pointer !important;
        font-size: 12px !important; font-weight: 600 !important; color: #323130 !important;
        user-select: none !important; pointer-events: auto !important;
        border: 1px solid #E8E6E4 !important;
        transition: background .12s !important;
        box-sizing: border-box !important;
      }
      #wct-panel .wct-group-header:hover { background: #EDEBE9 !important; }
      #wct-panel .wct-group-header.active { background: #EFF6FC !important; border-color: #C7E0F4 !important; color: #0078D4 !important; }
      #wct-panel .wct-group-title {
        flex: 1 !important; min-width: 0 !important;
        overflow: hidden !important; text-overflow: ellipsis !important; white-space: nowrap !important;
      }
      #wct-panel .wct-group-count {
        flex-shrink: 0 !important; font-size: 11px !important; font-weight: 500 !important;
        color: #8a8886 !important; background: rgba(0,0,0,.06) !important;
        padding: 1px 6px !important; border-radius: 8px !important;
      }
      #wct-panel .wct-group-header.active .wct-group-count { color: #0078D4 !important; background: rgba(0,120,212,.1) !important; }
      #wct-panel .wct-group-chevron {
        flex-shrink: 0 !important; transition: transform .2s !important; color: #8a8886 !important;
      }
      #wct-panel .wct-group-header.active .wct-group-chevron { color: #0078D4 !important; }
      #wct-panel .wct-group-body {
        display: flex !important; flex-direction: column !important; gap: 5px !important;
        padding-left: 10px !important;
        border-left: 2px solid #E8E6E4 !important;
        margin-left: 4px !important;
      }
      #wct-panel .wct-group-body.wct-group-collapsed { display: none !important; }
      #wct-panel #wct-group-btn.active { color: #0078D4 !important; background: rgba(0,120,212,.08) !important; }
      @keyframes wct-spin { to { transform: rotate(360deg); } }
      #wct-panel .wct-spin { animation: wct-spin .8s linear infinite !important; display: inline-block !important; }
    `;
    document.head.appendChild(s);
  }
  //  BUILD PANEL
  function buildPanel() {
    injectStyles();
    const panel = document.createElement('div');
    panel.id = 'wct-panel';
    panel.innerHTML = `
      <div id="wct-titlebar">
        <div id="wct-titlebar-l">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1.5" y="2.5" width="13" height="9" rx="2" stroke="#0078D4" stroke-width="1.4" fill="none"/>
            <path d="M5 7.5h6M5 5.5h3.5" stroke="#0078D4" stroke-width="1.3" stroke-linecap="round"/>
            <path d="M4.5 11.5l1.2 2h4.6l1.2-2" stroke="#0078D4" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span id="wct-title">Comment Tracker</span>
        </div>
        <div style="display:flex!important;align-items:center!important;gap:6px!important;">
          <button id="wct-info-btn" title="Hướng dẫn">i</button>
          <button id="wct-collapse-btn" title="Thu gọn / Mở rộng">
            <svg id="wct-chevron" width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M2 6.5l3-3 3 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
      </div>
      <div id="wct-info-popup" class="wct-hidden">
        <div>
          <div class="wct-info-title">Các chế độ load</div>
        </div>
        <div class="wct-info-row">
          <span class="wct-info-badge">Tất cả</span>
          <span class="wct-info-desc">Lấy tất cả bình luận từ trang 1 đến hết. Sẽ mất vài phút.</span>
        </div>
        <div class="wct-info-row">
          <span class="wct-info-badge">Đồng bộ</span>
          <span class="wct-info-desc">Lấy tất cả bình luận cho đến khi gặp bình luận đánh dấu (Marked) - dùng sau khi đã "Xoá &amp; giữ mark" để cập nhật bình luận mới.</span>
        </div>
        <div class="wct-info-row">
          <span class="wct-info-badge">N mới nhất</span>
          <span class="wct-info-desc">VD lấy 100 bình luận mới nhất.</span>
        </div>
        <div class="wct-info-row">
          <span class="wct-info-badge">N giờ qua</span>
          <span class="wct-info-desc">VD lấy tất cả bình luận trong 24h qua.</span>
        </div>
        <div class="wct-info-row">
          <span class="wct-info-badge">Từ trang N</span>
          <span class="wct-info-desc">VD lấy tất cả bình luận từ trang 30 đến hết - hữu ích khi script bị chặn ngầm giữa chừng.</span>
        </div>
        <div class="wct-info-sep"></div>
        <div>
          <div class="wct-info-title">Mark là gì?</div>
        </div>
        <div class="wct-info-row">
          <span class="wct-info-badge mark">🔖 Mark</span>
          <span class="wct-info-desc">Đánh dấu một hoặc nhiều bình luận. Chế độ <b>Đồng bộ</b> sẽ dừng lại khi gặp Mark <b>mới nhất</b>, tránh load lại toàn bộ.</span>
        </div>
      </div>
      <div id="wct-body">
        <div id="wct-alert" class="wct-hidden">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0;margin-top:1px">
            <circle cx="7" cy="7" r="5.5" stroke="#A4262C" stroke-width="1.4"/>
            <path d="M7 4.5v3M7 9v.5" stroke="#A4262C" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
          <span id="wct-alert-text"></span>
        </div>
        <div id="wct-mark-hint" class="wct-hidden">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style="flex-shrink:0;margin-top:1px">
            <path d="M7 2a2 2 0 100 4 2 2 0 000-4z" stroke="#92400E" stroke-width="1.3"/>
            <path d="M7 6v6M4.5 9.5l2.5 2.5 2.5-2.5" stroke="#92400E" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span>Chưa có mark - hãy bấm <b>🔖 Mark</b> trên một bình luận để dùng chế độ <b>Đồng bộ</b>.</span>
        </div>
        <div class="wct-card">
          <div class="wct-field">
            <span class="wct-flabel">Chế độ</span>
            <select id="wct-mode">
              <option value="all">Tất cả</option>
              <option value="sync">Đồng bộ (tới mark mới nhất)</option>
              <option value="count">N bình luận mới nhất</option>
              <option value="hours">N giờ qua</option>
              <option value="from_page">Từ trang N đến cuối</option>

            </select>
          </div>
          <div class="wct-field" id="wct-param-row">
            <span class="wct-flabel" id="wct-param-label">Số lượng</span>
            <input id="wct-param" type="number" value="100" min="1" class="wct-num"/>
          </div>
          <div id="wct-prog" class="wct-hidden">
            <div class="wct-prog-track"><div id="wct-prog-fill"></div></div>
            <span id="wct-prog-text"></span>
          </div>
        </div>
        <div class="wct-actions">
          <button id="wct-load-btn" class="wct-btn primary">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M6 1v7.5M3.5 6l2.5 2.5L8.5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M1 10.5h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Load
          </button>
          <button id="wct-stop-btn" class="wct-btn secondary wct-hidden" title="Dừng load và lưu dữ liệu đang có">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <rect x="2.5" y="2.5" width="7" height="7" rx="1.2" fill="currentColor"/>
            </svg>
            Dừng
          </button>
          <button id="wct-clear-btn" class="wct-btn secondary">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 3h8M4.5 3V2h3v1M5 5v4.5M7 5v4.5M3 3l.5 6.5h5L9 3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Xoá &amp; giữ mark
          </button>
          <button id="wct-reset-btn" class="wct-btn icon-only" title="Reset toàn bộ dữ liệu">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2.5 7A4.5 4.5 0 107 2.5H5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              <path d="M3.5 2l2 2-2 2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <div class="wct-divider"></div>
        <div class="wct-toolbar">
          <div class="wct-segs">
            <button class="wct-seg active" data-order="desc">Mới nhất</button>
            <button class="wct-seg" data-order="asc">Cũ nhất</button>
          </div>
          <button id="wct-group-btn" class="wct-btn icon-only" title="Nhóm theo truyện">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2" width="12" height="2.5" rx="1" fill="currentColor" opacity=".4"/>
              <rect x="3" y="5.5" width="10" height="2" rx="1" fill="currentColor" opacity=".65"/>
              <rect x="3" y="8.5" width="10" height="2" rx="1" fill="currentColor" opacity=".65"/>
            </svg>
          </button>
          <button id="wct-goto-mark-btn" class="wct-hidden" title="Cuộn đến mark mới nhất">🔖</button>
          <input id="wct-search" type="text" placeholder="Tìm kiếm…" class="wct-search"/>
        </div>
        <div id="wct-stats" class="wct-stats"></div>
        <div id="wct-list"></div>
      </div>
    `;
    panel.classList.add('wct-collapsed');
    document.body.appendChild(panel);
    panel.querySelector('#wct-mode').value = loadMarks().length > 0 ? 'sync' : 'all';
    bindEvents(panel);
    renderList(loadStore());
    checkUnreadAlert();
    makeDraggable(panel, panel.querySelector('#wct-titlebar'));
  }
  //  RENDER
  function makeCommentEl(c, marks) {
    const isMark  = marks.includes(c.id);
    const div     = document.createElement('div');
    div.className = 'wct-item' + (c.isUnread ? ' unread' : '') + (isMark ? ' marked' : '');
    div.dataset.itemId = c.id;
    const fullUrl = c.href.startsWith('http') ? c.href : location.origin + c.href;
    const msgContent = c.msgHtml != null ? c.msgHtml : escHtml(c.msg);
    div.innerHTML = `
      <div class="wct-item-head">
        <span class="wct-item-time">${fmtTime(c.ts)}</span>
        ${c.isUnread ? '<span class="wct-pill unread">● Chưa đọc</span>' : ''}
        ${isMark    ? '<span class="wct-pill marked">🔖 Mark</span>' : ''}
      </div>
      <div class="wct-item-msg">${msgContent}</div>
      <div class="wct-item-foot">
        <a class="wct-goto" href="${escHtml(fullUrl)}" target="_blank" rel="noopener">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="flex-shrink:0!important">
            <path d="M4.5 2H2.5A1.5 1.5 0 001 3.5v6A1.5 1.5 0 002.5 11h6A1.5 1.5 0 0010 9.5V7.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            <path d="M6.5 1.5H10.5V5.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10.5 1.5L5.5 6.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <span class="wct-goto-label">Mở</span>${c.storyTitle ? ` - <span class="wct-goto-title">${escHtml(c.storyTitle)}</span>` : ''}
        </a>
        <button class="wct-mark-btn${isMark ? ' active' : ''}" data-id="${escHtml(c.id)}" title="${isMark ? 'Bỏ mark' : 'Đặt mark'}">
          🔖 ${isMark ? 'Bỏ mark' : 'Mark'}
        </button>
      </div>
    `;
    div.querySelector('.wct-mark-btn').addEventListener('click', () => {
      const cur    = loadMarks();
      const marked = cur.includes(c.id);
      saveMarks(marked ? cur.filter(id => id !== c.id) : [...cur, c.id]);
      renderList(loadStore());
    });
    return div;
  }
  function renderList(comments) {
    const list    = document.getElementById('wct-list');
    const stats   = document.getElementById('wct-stats');
    const marks   = loadMarks();
    if (!list) return;
    const hintEl = document.getElementById('wct-mark-hint');
    if (hintEl) hintEl.classList.toggle('wct-hidden', comments.length === 0 || marks.length > 0);
    const gotoBtn = document.getElementById('wct-goto-mark-btn');
    let items = [...comments];
    if (searchQ) {
      const q = searchQ.toLowerCase();
      items = items.filter(c => c.msg.toLowerCase().includes(q) || c.href.toLowerCase().includes(q) || (c.storyTitle||'').toLowerCase().includes(q));
    }
    // Sort flat list (desc = newest first; store is always desc by default)
    items.sort((a, b) => sortOrder === 'asc' ? a.ts - b.ts : b.ts - a.ts);
    const hasMarkInView = items.some(c => marks.includes(c.id));
    if (gotoBtn) gotoBtn.classList.toggle('wct-hidden', !hasMarkInView);
    if (stats) {
      const unread = comments.filter(c => c.isUnread).length;
      stats.textContent = `${comments.length} bình luận · ${unread} chưa đọc · ${marks.length} mark`;
    }
    list.innerHTML = '';
    if (!items.length) {
      list.innerHTML = '<div class="wct-empty">Không có bình luận nào</div>';
      return;
    }
    if (!groupMode) {
      for (const c of items) list.appendChild(makeCommentEl(c, marks));
      return;
    }
    // GROUP MODE
    const groupMap = new Map();
    for (const c of items) {
      const key = c.storyTitle || '(Không rõ truyện)';
      if (!groupMap.has(key)) groupMap.set(key, []);
      groupMap.get(key).push(c);
    }
    const groups = [...groupMap.entries()];
    const chevronSvg = `<svg class="wct-group-chevron" width="10" height="10" viewBox="0 0 10 10" fill="none">
      <path d="M2.5 4l2.5 2.5L7.5 4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;
    for (const [title, groupItems] of groups) {
      const hasUnread = groupItems.some(c => c.isUnread);
      const hasMark   = groupItems.some(c => marks.includes(c.id));
      const isCollapsed = collapsedGroups.has(title);
      const wrapper = document.createElement('div');
      wrapper.className = 'wct-group';
      const header = document.createElement('button');
      header.className = 'wct-group-header' + (isCollapsed ? '' : ' active');
      header.innerHTML = `
        ${chevronSvg}
        <span class="wct-group-title">${escHtml(title)}</span>
        ${hasUnread ? '<span class="wct-pill unread" style="font-size:10px!important;padding:1px 5px!important">● Chưa đọc</span>' : ''}
        ${hasMark   ? '<span class="wct-pill marked" style="font-size:10px!important;padding:1px 5px!important">🔖</span>' : ''}
        <span class="wct-group-count">${groupItems.length}</span>
      `;
      const chevEl = header.querySelector('.wct-group-chevron');
      if (isCollapsed) chevEl.style.setProperty('transform', 'rotate(-90deg)', 'important');
      const body = document.createElement('div');
      body.className = 'wct-group-body' + (isCollapsed ? ' wct-group-collapsed' : '');
      for (const c of groupItems) body.appendChild(makeCommentEl(c, marks));
      header.addEventListener('click', () => {
        const nowCollapsed = collapsedGroups.has(title);
        if (nowCollapsed) {
          collapsedGroups.delete(title);
          header.classList.add('active');
          body.classList.remove('wct-group-collapsed');
          chevEl.style.removeProperty('transform');
        } else {
          collapsedGroups.add(title);
          header.classList.remove('active');
          body.classList.add('wct-group-collapsed');
          chevEl.style.setProperty('transform', 'rotate(-90deg)', 'important');
        }
      });
      wrapper.appendChild(header);
      wrapper.appendChild(body);
      list.appendChild(wrapper);
    }
  }
  function checkUnreadAlert() {
    const el  = document.getElementById('wct-alert');
    const txt = document.getElementById('wct-alert-text');
    if (!el) return;
    const count = document.querySelectorAll('article.notification.red').length;
    const panel = document.getElementById('wct-panel');
    if (count > 0) {
      txt.textContent = `${count} bình luận mới chưa đọc - đồng bộ ngay`;
      el.classList.remove('wct-hidden');
      panel?.classList.remove('wct-collapsed');
    } else {
      el.classList.add('wct-hidden');
    }
    const hintEl = document.getElementById('wct-mark-hint');
    if (hintEl) hintEl.classList.toggle('wct-hidden', loadStore().length === 0 || loadMarks().length > 0);
  }
  //  EVENTS
  function bindEvents(panel) {
    panel.querySelector('#wct-collapse-btn').addEventListener('click', () => {
      panel.classList.toggle('wct-collapsed');
    });
    const infoBtn   = panel.querySelector('#wct-info-btn');
    const infoPopup = panel.querySelector('#wct-info-popup');
    infoBtn.addEventListener('click', e => {
      e.stopPropagation();
      infoPopup.classList.toggle('wct-hidden');
    });
    document.addEventListener('click', e => {
      if (!infoPopup.classList.contains('wct-hidden') && !infoPopup.contains(e.target) && e.target !== infoBtn) {
        infoPopup.classList.add('wct-hidden');
      }
    });
    // Mode select
    const modeEl     = panel.querySelector('#wct-mode');
    const paramRow   = panel.querySelector('#wct-param-row');
    const paramLabel = panel.querySelector('#wct-param-label');
    const paramInput = panel.querySelector('#wct-param');
    function syncParamRow() {
      const m = modeEl.value;
      if (m === 'count') {
        paramRow.classList.remove('wct-hidden');
        paramLabel.textContent = 'Số lượng';
        paramInput.placeholder = '100';
        if (!paramInput.dataset.lastCount) paramInput.dataset.lastCount = paramInput.value;
        paramInput.value = paramInput.dataset.lastCount || '100';
      } else if (m === 'hours') {
        paramRow.classList.remove('wct-hidden');
        paramLabel.textContent = 'Số giờ';
        paramInput.placeholder = '24';
        if (modeEl.dataset.prev === 'count') paramInput.dataset.lastCount = paramInput.value;
        if (modeEl.dataset.prev === 'from_page') paramInput.dataset.lastFrom = paramInput.value;
        paramInput.value = paramInput.dataset.lastHours || '24';
      } else if (m === 'from_page') {
        paramRow.classList.remove('wct-hidden');
        paramLabel.textContent = 'Từ trang';
        paramInput.placeholder = '1';
        if (modeEl.dataset.prev === 'count') paramInput.dataset.lastCount = paramInput.value;
        if (modeEl.dataset.prev === 'hours') paramInput.dataset.lastHours = paramInput.value;
        paramInput.value = paramInput.dataset.lastFrom || '1';
      } else {
        if (modeEl.dataset.prev === 'count') paramInput.dataset.lastCount = paramInput.value;
        if (modeEl.dataset.prev === 'hours') paramInput.dataset.lastHours = paramInput.value;
        if (modeEl.dataset.prev === 'from_page') paramInput.dataset.lastFrom = paramInput.value;
        paramRow.classList.add('wct-hidden');
      }
      modeEl.dataset.prev = m;
    }
    modeEl.addEventListener('change', syncParamRow);
    syncParamRow();
    // Load
    const loadBtn = panel.querySelector('#wct-load-btn');
    const progWrap = panel.querySelector('#wct-prog');
    const progFill = panel.querySelector('#wct-prog-fill');
    const progText = panel.querySelector('#wct-prog-text');
    const stopBtn = panel.querySelector('#wct-stop-btn');
    let _abortFlag = {};
    function resetLoadUI() {
      loadBtn.disabled  = false;
      loadBtn.innerHTML = `
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M6 1v7.5M3.5 6l2.5 2.5L8.5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          <path d="M1 10.5h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg> Load`;
      stopBtn.classList.add('wct-hidden');
      progWrap.classList.add('wct-hidden');
      progFill.style.setProperty('width', '0%', 'important');
      progText.textContent = '';
    }
    loadBtn.addEventListener('click', async () => {
      loadBtn.disabled  = true;
      loadBtn.innerHTML = `<span class="wct-spin">↻</span> Đang tải…`;
      progWrap.classList.add('wct-hidden');
      progFill.style.setProperty('width', '0%', 'important');
      progText.textContent = '';
      _abortFlag = {};
      const onBeforeUnload = e => { e.preventDefault(); e.returnValue = ''; };
      window.addEventListener('beforeunload', onBeforeUnload);
      startKeepAlive();
      const mode  = modeEl.value;
      const param = (mode === 'count' || mode === 'hours' || mode === 'from_page')
        ? (parseFloat(paramInput.value) || (mode === 'hours' ? 24 : mode === 'from_page' ? 1 : 100))
        : null;
      try {
        const fresh = await loadComments(mode, param, (pg, total) => {
          progWrap.classList.remove('wct-hidden');
          stopBtn.classList.remove('wct-hidden');
          progText.textContent = `Trang ${pg}${total ? ' / ' + total : ''} - đang tải…`;
          if (total) progFill.style.setProperty('width', Math.min(100, (pg / total) * 100) + '%', 'important');
        }, _abortFlag);
        const merged = mergeComments(loadStore(), fresh);
        saveStore(merged);
        renderList(merged);
        if (_abortFlag.cancelled) {
          progText.textContent = `Đã dừng - đã lưu ${fresh.length} bình luận.`;
          progWrap.classList.remove('wct-hidden');
        }
      } catch (e) {
        console.error('[WCT]', e);
        alert('Lỗi khi tải: ' + e.message);
      } finally {
        window.removeEventListener('beforeunload', onBeforeUnload);
        stopKeepAlive();
        loadBtn.disabled  = false;
        loadBtn.innerHTML = `
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M6 1v7.5M3.5 6l2.5 2.5L8.5 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M1 10.5h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg> Load`;
        stopBtn.classList.add('wct-hidden');
        if (!_abortFlag.cancelled) {
          progWrap.classList.add('wct-hidden');
          progFill.style.setProperty('width', '0%', 'important');
          progText.textContent = '';
        }
      }
    });
    stopBtn.addEventListener('click', () => {
      _abortFlag.cancelled = true;
      stopBtn.disabled = true;
      stopBtn.textContent = 'Đang dừng…';
    });
    // Clear & keep marks
    panel.querySelector('#wct-clear-btn').addEventListener('click', () => {
      const store = loadStore();
      if (!store.length) { alert('Chưa có bình luận nào.'); return; }
if (!confirm(`Xoá bình luận và giữ các mark hiện tại?`)) return;
      const marks  = loadMarks();
      const sorted = [...store].sort((a, b) => b.ts - a.ts);
      const kept = marks.length
        ? sorted.filter(c => marks.includes(c.id))
        : sorted.slice(0, 1);
      if (!marks.length) saveMarks(kept.map(c => c.id));
      saveStore(kept);
      renderList(kept);
      alert('✅ Đã xoá. Lần đồng bộ tiếp theo sẽ dừng khi gặp mark mới nhất.');
    });
    // Full reset
    panel.querySelector('#wct-reset-btn').addEventListener('click', () => {
      if (!confirm('Xoá TOÀN BỘ dữ liệu, kể cả mark?')) return;
      saveStore([]); saveMarks([]); renderList([]);
    });
    // Goto mark
    const gotoMarkBtn = panel.querySelector('#wct-goto-mark-btn');
    if (gotoMarkBtn) {
      gotoMarkBtn.addEventListener('click', () => {
        const marks = loadMarks();
        const store = loadStore();
        const markedComments = store
          .filter(c => marks.includes(c.id))
          .sort((a, b) => b.ts - a.ts);
        const targetMark = sortOrder === 'asc'
          ? markedComments[markedComments.length - 1]
          : markedComments[0];
        const newestMark = targetMark;
        if (!newestMark) return;
        const allItems = Array.from(panel.querySelectorAll('#wct-list [data-item-id]'));
        const target = allItems.find(el => el.dataset.itemId === newestMark.id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          target.style.setProperty('box-shadow', '0 0 0 2px #CA8A04', 'important');
          setTimeout(() => target.style.removeProperty('box-shadow'), 1200);
        }
      });
    }
    // Sort segments
    panel.querySelectorAll('.wct-seg').forEach(btn => {
      btn.addEventListener('click', () => {
        panel.querySelectorAll('.wct-seg').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        sortOrder = btn.dataset.order;
        renderList(loadStore());
      });
    });
    // Group toggle
    const groupBtn = panel.querySelector('#wct-group-btn');
    if (groupBtn) {
      groupBtn.addEventListener('click', () => {
        groupMode = !groupMode;
        groupBtn.classList.toggle('active', groupMode);
        groupBtn.title = groupMode ? 'Tắt nhóm theo truyện' : 'Nhóm theo truyện';
        renderList(loadStore());
      });
    }
    // Search
    panel.querySelector('#wct-search').addEventListener('input', e => {
      searchQ = e.target.value.trim();
      renderList(loadStore());
    });
  }
  //  DRAG
  function makeDraggable(el, handle) {
    let ox = 0, oy = 0, sx = 0, sy = 0;
    handle.addEventListener('mousedown', e => {
      if (e.target.closest('button')) return;
      e.preventDefault();
      const r = el.getBoundingClientRect();
      ox = r.left; oy = r.top; sx = e.clientX; sy = e.clientY;
      const mm = e2 => {
        el.style.cssText += `left:${ox + e2.clientX - sx}px !important;top:${oy + e2.clientY - sy}px !important;right:auto !important;bottom:auto !important;`;
      };
      const mu = () => { removeEventListener('mousemove', mm); removeEventListener('mouseup', mu); };
      addEventListener('mousemove', mm); addEventListener('mouseup', mu);
    });
  }
  //  UTILS
  const fmtTime = ts => new Date(ts).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
  const escHtml = s  => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  //  INIT
  buildPanel();
})();
