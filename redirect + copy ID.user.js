// ==UserScript==
// @name         Autoredirect + Hỗ trợ 🍅
// @namespace    http://tampermonkey.net/
// @version      4.9
// @description  
// @author       Minty
// @match        *://*/*
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @connect      byteimg.com
// @connect      wp.com
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const currentUrl = window.location.href;

    // --- 1. ĐIỀU HƯỚNG & SAO CHÉP ID ---
    if (currentUrl.includes('/redirect?')) {
        const urlParams = new URLSearchParams(window.location.search);
        const targetUrlEncoded = urlParams.get('u');
        if (targetUrlEncoded) {
            const decodedUrl = decodeURIComponent(targetUrlEncoded);
            if (decodedUrl.includes('fanqienovel.com')) {
                let storyId = decodedUrl.match(/page\/(\d+)/)?.[1];
                const handleRedirect = () => {
                    if (storyId) {
                        GM_setClipboard(storyId, "text");
                        hienToast(`Đã sao chép ID: ${storyId}`);
                        setTimeout(() => window.location.replace(decodedUrl), 800);
                    } else window.location.replace(decodedUrl);
                };
                if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', handleRedirect);
                else handleRedirect();
            } else window.location.replace(decodedUrl);
        }
        return;
    }

    // --- 2. LOGIC TẢI ẢNH ---
    if (currentUrl.includes('fanqienovel.com/page/')) {
        const checkCount = setInterval(() => {
            const countBox = document.querySelector('.info-count');
            if (countBox && !document.getElementById('fq-download-wrap')) {
                clearInterval(checkCount);
                initFlatUI(countBox);
            }
        }, 500);
    }

    function initFlatUI(parent) {
        const SIZE_LIMIT_KB = 500;
        const TARGET_RATIO = 5 / 7;

        parent.style.display = 'flex';
        parent.style.alignItems = 'center';
        parent.style.gap = '12px';

        const wrapper = document.createElement('div');
        wrapper.id = 'fq-download-wrap';

        const btn = document.createElement('button');
        btn.innerHTML = `<span style="display:flex;align-items:center;gap:5px;">
            <svg width="12" height="12" fill="currentColor" viewBox="0 0 16 16"><path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/><path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/></svg>
            TẢI HD
        </span>`;
        btn.style = `padding: 5px 14px; background: #000; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-size: 11px; font-weight: 700; transition: 0.2s;`;

        const logBox = document.createElement('div');
        logBox.style = `
            position: fixed; top: 50%; right: 20px; transform: translateY(-50%);
            width: 240px; background: #0d0d0d; color: #00ff41;
            padding: 15px; border-radius: 12px; display: none; z-index: 100000;
            box-shadow: 0 20px 50px rgba(0,0,0,0.7); border: 1px solid #222;
            font-family: 'JetBrains Mono', monospace; font-size: 10px;
        `;

        const closeBtn = document.createElement('div');
        closeBtn.innerText = 'ĐÓNG ✕';
        closeBtn.style = 'text-align:right; font-size:10px; color:#555; cursor:pointer; margin-bottom:8px; font-family:sans-serif; font-weight:bold;';
        closeBtn.onclick = () => { logBox.style.display = 'none'; };

        const logContent = document.createElement('div');
        logContent.style = 'max-height: 180px; overflow-y: auto; line-height: 1.6;';

        logBox.appendChild(closeBtn);
        logBox.appendChild(logContent);
        document.body.appendChild(logBox);

        btn.onmouseover = () => { btn.style.background = '#ff4d4f'; };
        btn.onmouseout = () => { btn.style.background = '#000'; };

        wrapper.appendChild(btn);
        parent.appendChild(wrapper);

        const ghiLog = (msg) => {
            logBox.style.display = 'block';
            const line = document.createElement('div');
            line.innerHTML = `<span style="opacity:0.3; margin-right:4px;">#</span> ${msg}`;
            logContent.appendChild(line);
            logContent.scrollTop = logContent.scrollHeight;
        };

        btn.onclick = async () => {
            const imgEl = document.querySelector('.book-cover-img');
            const titleEl = document.querySelector('.info-name h1');
            if (!imgEl) return ghiLog('LỖI: KO THẤY ẢNH');
            const match = imgEl.src.match(/novel-pic\/(.*?)~/);
            if (!match) return ghiLog('LỖI: KO LẤY ĐƯỢC ID');

            btn.disabled = true; btn.style.opacity = '0.5';
            logContent.innerHTML = '';
            ghiLog('ĐANG KẾT NỐI...');

            const imgId = match[1];
            const name = (titleEl ? titleEl.innerText : 'cover').replace(/[\\/:*?"<>|]/g, '_').trim() + '.jpg';
            const urls = [
                `https://i0.wp.com/p6-novel.byteimg.com/origin/novel-pic/${imgId}`,
                `https://p6-novel.byteimg.com/origin/novel-pic/${imgId}`,
                `https://p3-novel-sign.byteimg.com/novel-pic/${imgId}`
            ];

            startProcessing(urls, 0, name, btn, ghiLog, SIZE_LIMIT_KB, TARGET_RATIO, logBox);
        };
    }

    function startProcessing(urls, idx, name, btn, log, limit, ratio, logBox) {
        if (idx >= urls.length) {
            log('THẤT BẠI: LỖI MÁY CHỦ');
            btn.disabled = false; btn.style.opacity = '1'; return;
        }
        log(`THỬ MÁY CHỦ ${idx + 1}...`);
        GM_xmlhttpRequest({
            method: "GET", url: urls[idx], responseType: "blob", timeout: 10000,
            onload: (res) => {
                if (res.status === 200 && res.response.size > 2000) {
                    const blob = res.response;
                    const kbSize = blob.size / 1024;
                    log(`ĐÃ TẢI XONG: ${Math.round(kbSize)}KB`);
                    if (kbSize <= limit) {
                        log('<span style="color:#fff">SIZE ẢNH ĐẠT YÊU CẦU!</span>');
                        taiAnhTrucTiep(blob, name);
                        log('<span style="color:#fff">HOÀN TẤT: ĐÃ LƯU BÌA!</span>');
                        btn.disabled = false; btn.style.opacity = '1';
                        setTimeout(() => { logBox.style.display = 'none'; }, 8000);
                    } else {
                        log('ẢNH QUÁ LỚN. BẮT ĐẦU NÉN...');
                        xuLyNenAnh(blob, name, btn, log, limit, ratio, logBox);
                    }
                } else {
                    log(`MÁY CHỦ ${idx+1} LỖI.`);
                    startProcessing(urls, idx+1, name, btn, log, limit, ratio, logBox);
                }
            }
        });
    }

    function taiAnhTrucTiep(blob, name) {
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = name;
        a.click();
    }
    async function xuLyNenAnh(blob, name, btn, log, limit, ratio, logBox) {
        const originalSize = blob.size;
        const img = new Image();
        img.src = URL.createObjectURL(blob);
        img.onload = async () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width; canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            let q = 0.95, isCropped = false, result;
            while (true) {
                result = await new Promise(r => canvas.toBlob(r, 'image/jpeg', q));
                let red = Math.round((1 - (result.size / originalSize)) * 100);
                log(`NÉN: -${red}% | ${Math.round(result.size/1024)}KB`);
                if (result.size / 1024 <= limit) break;
                if (q > 0.5) q -= 0.1;
                else if (!isCropped) {
                    log('CẮT 5:7 GIẢM SIZE...');
                    isCropped = true;
                    let w = img.width, h = img.height, dw, dh, ox = 0, oy = 0;
                    if (w/h > ratio) { dw = h * ratio; dh = h; ox = (w - dw)/2; }
                    else { dw = w; dh = w / ratio; oy = (h - dh)/2; }
                    canvas.width = dw; canvas.height = dh;
                    ctx.drawImage(img, ox, oy, dw, dh, 0, 0, dw, dh); q = 0.8;
                } else if (q > 0.1) q -= 0.1;
                else { canvas.width *= 0.9; canvas.height *= 0.9; ctx.drawImage(img, 0, 0, canvas.width, canvas.height); }
            }
            taiAnhTrucTiep(result, name);
            log('<span style="color:#fff">HOÀN TẤT: ĐÃ LƯU BÌA!</span>');
            btn.disabled = false; btn.style.opacity = '1';
            setTimeout(() => { logBox.style.display = 'none'; }, 8000);
        };
    }

    function hienToast(msg) {
        const t = document.createElement('div');
        t.innerHTML = `<b>✓</b> ${msg}`;
        Object.assign(t.style, {
            position: 'fixed', top: '30px', left: '50%', transform: 'translateX(-50%)',
            background: '#000', color: '#2ecc71', padding: '12px 24px',
            borderRadius: '8px', fontSize: '13px', zIndex: '1000000',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)', fontWeight: '600'
        });
        document.body.appendChild(t);
        setTimeout(() => t.remove(), 2500);
    }
})();
