// ==UserScript==
// @name         Redirect & Auto Copy ID
// @namespace    
// @version      1.2
// @description  Redirect và tự động copy mã truyện vào Clipboard
// @author       Minty
// @match        *://*/redirect?*
// @grant        GM_setClipboard
// @run-at       document-start
// @updateURL    https://github.com/miinty0/draft/raw/refs/heads/main/redirect%20+%20copy%20ID.user.js
// @downloadURL    https://github.com/miinty0/draft/raw/refs/heads/main/redirect%20+%20copy%20ID.user.js
// ==/UserScript==

(function() {
    'use strict';

    const urlParams = new URLSearchParams(window.location.search);
    const targetUrlEncoded = urlParams.get('u');

    if (targetUrlEncoded) {
        // 1. Giải mã URL
        const decodedUrl = decodeURIComponent(targetUrlEncoded);

        // 2. Tách mã truyện (ID)
        // Logic: Lấy phần cuối cùng của đường dẫn, loại bỏ các tham số query sau dấu ?
        try {
            const urlObj = new URL(decodedUrl);
            const pathSegments = urlObj.pathname.split('/').filter(s => s.length > 0);
            const storyId = pathSegments[pathSegments.length - 1];

            if (storyId) {
                // 3. Copy mã truyện vào Clipboard
                GM_setClipboard(storyId);
                console.log("Đã copy mã truyện: " + storyId);
            }
        } catch (e) {
            console.error("Không thể tách mã truyện", e);
        }

        // 4. Chuyển hướng
        window.location.replace(decodedUrl);
    }
})();
