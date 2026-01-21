// ==UserScript==
// @name         Redirect & Auto Copy ID
// @namespace    
// @version      1.3
// @description  Redirect và tự động copy mã truyện vào Clipboard
// @author       Minty
// @match        *://*/redirect?*
// @grant        GM_setClipboard
// @run-at       document-start
// @updateURL    https://raw.githubusercontent.com/miinty0/draft/main/redirect%20+%20copy%20ID.user.js
// @downloadURL    https://raw.githubusercontent.com/miinty0/draft/main/redirect%20+%20copy%20ID.user.js

// ==/UserScript==

(function() {
    'use strict';

    const urlParams = new URLSearchParams(window.location.search);
    const targetUrlEncoded = urlParams.get('u');

    if (targetUrlEncoded) {
        const decodedUrl = decodeURIComponent(targetUrlEncoded);
        let storyId = "";

        // 1. Tách mã truyện (ID)
        try {
            const urlObj = new URL(decodedUrl);
            const pathSegments = urlObj.pathname.split('/').filter(s => s.length > 0);
            storyId = pathSegments[pathSegments.length - 1];

            if (storyId) {
                GM_setClipboard(storyId);
            }
        } catch (e) {
            console.error("Lỗi bóc tách ID", e);
        }

        // 2. Chờ DOM sẵn sàng để hiển thị thông báo
        document.addEventListener('DOMContentLoaded', () => {
            if (storyId) {
                showToast(storyId);
            }

            // 3. Chuyển hướng sau một khoảng trễ ngắn (800ms) để người dùng kịp đọc thông báo
            setTimeout(() => {
                window.location.replace(decodedUrl);
            }, 800);
        });
    }

    // Hàm tạo và hiển thị thông báo giữa màn hình
    function showToast(id) {
        const toast = document.createElement('div');
        toast.innerHTML = `Đã copy ID: <b style="color: #ffeb3b;">${id}</b>`;
        
        // CSS cho thông báo
        Object.assign(toast.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            color: '#fff',
            padding: '20px 40px',
            borderRadius: '10px',
            fontSize: '20px',
            fontFamily: 'sans-serif',
            zIndex: '99999',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            textAlign: 'center',
            minWidth: '300px'
        });

        document.body.appendChild(toast);
    }
})();
