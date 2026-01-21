// ==UserScript==
// @name         Redirect & Auto Copy ID (Fixed)
// @namespace    
// @version      1.6
// @description  Sửa lỗi không copy được ID vào Clipboard
// @author       Minty
// @match        *://*/redirect?*
// @grant        GM_setClipboard
// @run-at       document-start
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
        toast.innerHTML = `Đã copy ID: <b style="color: #ffeb3b;">${id}</b><br><small style="font-size: 12px;">Đang chuyển hướng...</small>`;
        
        Object.assign(toast.style, {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            backgroundColor: 'rgba(0, 0, 0, 0.9)',
            color: '#fff',
            padding: '20px 40px',
            borderRadius: '12px',
            fontSize: '20px',
            fontFamily: 'sans-serif',
            zIndex: '999999',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            textAlign: 'center',
            minWidth: '300px'
        });

        document.body.appendChild(toast);
    }
})();
