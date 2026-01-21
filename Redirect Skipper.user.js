// ==UserScript==
// @name         Redirect Skipper
// @namespace    
// @version      1.1
// @description  Tự động bỏ qua trang trung gian
// @author       minty
// @match        *://*/redirect?*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    // Lấy tham số 'u' từ URL
    const urlParams = new URLSearchParams(window.location.search);
    const targetUrl = urlParams.get('u');

    if (targetUrl) {
        // Chuyển hướng ngay lập tức sang trang đích
        // Sử dụng replace để không bị kẹt khi nhấn nút quay lại (Back)
        window.location.replace(decodeURIComponent(targetUrl));
    }
})();
