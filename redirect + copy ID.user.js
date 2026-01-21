// ==UserScript==
// @name         Redirect & Auto Copy ID
// @namespace    
// @version      1.8
// @description  Sửa lỗi không copy được ID vào Clipboard
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

        // 1. Tách mã truyện (ID) từ URL
        try {
            const urlObj = new URL(decodedUrl);
            const pathSegments = urlObj.pathname.split('/').filter(s => s.length > 0);
            storyId = pathSegments[pathSegments.length - 1];
        } catch (e) {
            console.error("Lỗi bóc tách ID", e);
        }

        // 2. Chờ DOM sẵn sàng để thực hiện copy và hiển thị
        document.addEventListener('DOMContentLoaded', () => {
            if (storyId) {
                // Thực hiện copy ngay khi DOM sẵn sàng
                GM_setClipboard(storyId, "{ type: 'text', mimetype: 'text/plain' }");
                
                // Hiển thị thông báo
                showToast(storyId);

                // 3. Chuyển hướng sau một khoảng trễ để đảm bảo lệnh copy đã hoàn tất
                setTimeout(() => {
                    window.location.replace(decodedUrl);
                }, 1000); // Tăng lên 1s để chắc chắn hơn
            } else {
                // Nếu không có ID, chuyển hướng ngay lập tức
                window.location.replace(decodedUrl);
            }
        });
    }

    function showToast(id) {
        const toast = document.createElement('div');
toast.innerHTML = `
            <div style="display: flex; align-items: center; gap: 10px;">
                <div style="background: #fff; color: #2ecc71; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold;">✓</div>
                <div>Đã copy ID: <b>${id}</b></div>
            </div>
        `;        
        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px', // Đưa lên phía trên cho hiện đại
            left: '50%',
            transform: 'translateX(-50%) translateY(0)',
            backgroundColor: 'rgba(46, 204, 113, 0.95)',
            color: '#fff',
            padding: '10px 20px',
            borderRadius: '50px', 
            fontSize: '14px',
            fontFamily: 'Segoe UI, Roboto, sans-serif',
            zIndex: '1000000',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            backdropFilter: 'blur(5px)', 
            transition: 'all 0.3s ease',
            whiteSpace: 'nowrap'
        });
toast.style.opacity = '0';
        toast.style.top = '10px';
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.top = '20px';
        }, 10);
    }
})();
