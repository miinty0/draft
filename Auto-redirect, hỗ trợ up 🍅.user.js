// ==UserScript==
// @name         Auto-redict, hỗ trợ up 🍅
// @namespace    http://tampermonkey.net/
// @version      5.1
// @description  Mở tab mới, copy ID truyện, tải ảnh nhanh, nén ảnh xuống 500KB.
// @author       Minty
// @match        *://*/truyen/*
// @match        *://*/redirect*
// @match        *://*/page/*
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @connect      byteimg.com
// @connect      wp.com
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';
    const $ = (s, p = document) => p.querySelector(s);
    const mk = (tag, css, props) => {
        const el = Object.assign(document.createElement(tag), props);
        if (css) el.style.cssText = css;
        return el;
    };
    const toast = (msg) => {
        const t = mk('div', 'position:fixed;top:30px;left:50%;transform:translateX(-50%);background:#000;color:#2ecc71;padding:12px 24px;border-radius:8px;z-index:1000000;font-weight:600;', { innerHTML: `<b>✓</b> ${msg}` });
        document.body.append(t);
        setTimeout(() => t.remove(), 2500);
    };
    const run = (fn) => document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', fn) : fn();
    const url = window.location.href;
    if (url.includes('/redirect?')) {
        const target = decodeURIComponent(new URLSearchParams(window.location.search).get('u') || '');
        if (!target) return;
        const storyId = target.match(/page\/(\d+)/)?.[1];
        run(() => {
            if (storyId) {
                GM_setClipboard(storyId, "text");
                toast(`Đã sao chép ID: ${storyId}`);
                setTimeout(() => location.replace(target), 800);
            } else location.replace(target);
        });
        return;
    }
    run(() => document.querySelectorAll('a[href*="/redirect?u="]').forEach(l => { l.target = '_blank'; l.style.cursor = 'alias'; }));
    if (url.includes('fanqienovel.com/page/')) {
        const wait = setInterval(() => {
            const box = $('.info-count');
            if (box && !$('#fq-download-wrap')) { clearInterval(wait); initHD(box); }
        }, 500);
    }
    function initHD(parent) {
        Object.assign(parent.style, { display: 'flex', gap: '12px', alignItems: 'center' });
        const wrap = mk('div', '', { id: 'fq-download-wrap' });
        const btn = mk('button', 'padding:5px 14px;background:#000;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:11px;font-weight:700;', {
            innerHTML: 'TẢI HD',
            onmouseover: () => btn.style.background = '#ff4d4f',
            onmouseout: () => btn.style.background = '#000'
        });
        const logBox = mk('div', 'position:fixed;top:50%;right:20px;transform:translateY(-50%);width:240px;background:#0d0d0d;color:#00ff41;padding:15px;border-radius:12px;display:none;z-index:10000;font-family:monospace;font-size:10px;');
        const logContent = mk('div', 'max-height:180px;overflow-y:auto;');
        logBox.append(mk('div', 'text-align:right;cursor:pointer;color:#555;', { innerText: 'ĐÓNG ✕', onclick: () => logBox.style.display = 'none' }), logContent);
        document.body.append(logBox);
        parent.append(wrap); wrap.append(btn);
        const log = (msg) => {
            logBox.style.display = 'block';
            logContent.append(mk('div', '', { innerHTML: `<span style="opacity:0.3">#</span> ${msg}` }));
            logContent.scrollTop = logContent.scrollHeight;
        };

        btn.onclick = async () => {
            const imgEl = $('.book-cover-img'), titleEl = $('.info-name h1');
            const match = imgEl?.src.match(/novel-pic\/(.*?)~/);
            if (!match) return log('LỖI: KO LẤY ĐƯỢC ẢNH');
            btn.disabled = true; btn.style.opacity = '0.5';
            logContent.innerHTML = ''; log('ĐANG KẾT NỐI...');
            const name = (titleEl?.innerText || 'cover').replace(/[\\/:*?"<>|]/g, '_') + '.jpg';
            const id = match[1], urls = [`https://i0.wp.com/p6-novel.byteimg.com/origin/novel-pic/${id}`, `https://p6-novel.byteimg.com/origin/novel-pic/${id}`, `https://p3-novel-sign.byteimg.com/novel-pic/${id}`];
            const dl = (idx) => {
                if (idx >= urls.length) { log('THẤT BẠI'); btn.disabled = false; return; }
                log(`THỬ MÁY CHỦ ${idx + 1}...`);
                GM_xmlhttpRequest({
                    method: "GET", url: urls[idx], responseType: "blob", timeout: 10000,
                    onload: async (res) => {
                        if (res.status === 200 && res.response.size > 2000) {
                            const blob = res.response, size = blob.size / 1024;
                            log(`XONG: ${Math.round(size)}KB`);
                            if (size <= 500) save(blob, name, btn, logBox, log);
                            else compress(blob, name, btn, logBox, log);
                        } else dl(idx + 1);
                    }
                });
            };
            dl(0);
        };
    }
    function save(blob, name, btn, box, log) {
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; a.click();
        log('<span style="color:#fff">HOÀN TẤT!</span>');
        btn.disabled = false; btn.style.opacity = '1';
        setTimeout(() => box.style.display = 'none', 8000);
    }
    async function compress(blob, name, btn, box, log) {
        log('ẢNH LỚN. ĐANG NÉN...');
        const img = new Image(); img.src = URL.createObjectURL(blob);
        img.onload = async () => {
            const cvs = document.createElement('canvas'), ctx = cvs.getContext('2d');
            cvs.width = img.width; cvs.height = img.height; ctx.drawImage(img, 0, 0);
            let q = 0.95, cropped = false, res;
            while (true) {
                res = await new Promise(r => cvs.toBlob(r, 'image/jpeg', q));
                log(`NÉN: ${Math.round(res.size/1024)}KB`);
                if (res.size / 1024 <= 500 || q < 0.1) break;
                if (q > 0.5) q -= 0.1;
                else if (!cropped) {
                    cropped = true; let w = cvs.width, h = cvs.height, ratio = 5/7;
                    let dw = w/h > ratio ? h*ratio : w, dh = w/h > ratio ? h : w/ratio;
                    cvs.width = dw; cvs.height = dh;
                    ctx.drawImage(img, (w-dw)/2, (h-dh)/2, dw, dh, 0, 0, dw, dh); q = 0.8;
                } else q -= 0.1;
            }
            save(res, name, btn, box, log);
        };
    }
})();
