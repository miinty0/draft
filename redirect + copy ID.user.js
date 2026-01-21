// ==UserScript==
// @name         Redirect + Copy ID 
// @namespace    
// @version      1.5
// @description  Lưu ID và thực hiện copy sau khi chuyển hướng thành công
// @author       Minty
// @match        *://*/redirect?*
// @match        *://page/* 
// @grant        GM_setClipboard
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // KIỂM TRA 1: Nếu đang ở trang redirect
    if (window.location.href.includes('/redirect?')) {
        const urlParams = new URLSearchParams(window.location.search);
        const targetUrlEncoded = urlParams.get('u');

        if (targetUrlEncoded) {
            const decodedUrl = decodeURIComponent(targetUrlEncoded);
            try {
                const urlObj = new URL(decodedUrl);
                const pathSegments = urlObj.pathname.split('/').filter(s => s.length > 0);
                const storyId = pathSegments[pathSegments.length - 1];

                if (storyId) {
                    // Lưu ID vào bộ nhớ tạm của Tampermonkey
                    GM_setValue("pending_copy_id", storyId);
                }
            } catch (e) {
                console.error("Lỗi bóc tách ID", e);
            }
            // Chuyển hướng ngay lập tức (không cần chờ)
            window.location.replace(decodedUrl);
        }
    } 
    
    // KIỂM TRA 2: Nếu đang ở trang đích (sau khi redirect)
    else {
        const pendingId = GM_getValue("pending_copy_id");
        if (pendingId) {
            // Đợi trang web tải xong một chút rồi copy
            window.addEventListener('load', () => {
                GM_setClipboard(pendingId);
                showToast(pendingId);
                // Xóa ID sau khi đã copy để tránh copy lặp lại khi load lại trang
                GM_deleteValue("pending_copy_id");
            });
        }
    }

    function showToast(id) {
        const toast = document.createElement('div');
        toast.innerHTML = `Đã copy ID từ trang trước: <b style="color: #ffeb3b;">${id}</b>`;
        Object.assign(toast.style, {
            position: 'fixed', bottom: '20px', right: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.8)', color: '#fff',
            padding: '12px 24px', borderRadius: '8px', zIndex: '999999',
            fontFamily: 'sans-serif', boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
        });
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }
})();
