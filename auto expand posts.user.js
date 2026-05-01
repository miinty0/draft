// ==UserScript==
// @name         Auto Expand Reviews & Posts
// @namespace    https://github.com/miinty0/draft
// @version      1.4
// @description  Tự động expand hết các review trên Wiki và posts trên forum
// @author       Miinty
// @match        https://wikicv.net/review*
// @match        https://forum.dichtienghoa.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    // Hàm expand cho Wiki
    function expandWikiCVReviews() {
        // Tìm tất cả nút "Xem thêm"
        const readmoreButtons = document.querySelectorAll('[data-readmore-toggle]');

        console.log(`[Wiki] Tìm thấy ${readmoreButtons.length} nút "Xem thêm"`);

        readmoreButtons.forEach(button => {
            const targetId = button.getAttribute('data-readmore-toggle');
            const contentBox = document.getElementById(targetId);

            if (contentBox) {
                // Xóa giới hạn chiều cao
                contentBox.style.maxHeight = 'none';
                contentBox.style.height = 'auto';
                contentBox.setAttribute('aria-expanded', 'true');

                // Ẩn nút "Xem thêm"
                button.style.display = 'none';
            }
        });
    }

    // Hàm expand cho Forum
    function expandForumPosts() {
        const posts = document.querySelectorAll('[component="post/content"]');

        let expandedCount = 0;

        posts.forEach(post => {
            // Kiểm tra nếu post bị cắt (scrollHeight > offsetHeight)
            if (post.scrollHeight > post.offsetHeight) {
                // Dùng !important để override CSS của trang (đặc biệt cho mobile mode)
                post.style.setProperty('max-height', 'none', 'important');
                post.style.setProperty('height', 'auto', 'important');
                post.style.setProperty('overflow', 'visible', 'important');
                expandedCount++;
            }
        });

        console.log(`[Forum] Đã expand ${expandedCount}/${posts.length} posts`);
    }

    // Hàm chính
    function autoExpand() {
        const hostname = window.location.hostname;
        const pathname = window.location.pathname;

        console.log(`[Auto Expand] Checking page: ${pathname}`);

        if (hostname === 'wikicv.net') {
            expandWikiCVReviews();
        } else if (hostname === 'forum.dichtienghoa.com') {
            expandForumPosts();
        }
    }

    // Debounce để tránh chạy quá nhiều lần
    let debounceTimer;
    function debouncedAutoExpand() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(autoExpand, 200);
    }

    autoExpand();
    setTimeout(autoExpand, 1000);
    const observer = new MutationObserver((mutations) => {
        const hasNewContent = mutations.some(mutation => {
            return Array.from(mutation.addedNodes).some(node => {
                if (node.nodeType === 1) { 
                    return node.matches && (
                        node.matches('[component="post/content"]') ||
                        node.matches('[data-readmore-toggle]') ||
                        node.querySelector('[component="post/content"]') ||
                        node.querySelector('[data-readmore-toggle]')
                    );
                }
                return false;
            });
        });

        if (hasNewContent) {
            console.log('[Auto Expand] Phát hiện nội dung mới, đang expand...');
            debouncedAutoExpand();
        }
    });

    // Bắt đầu theo dõi
    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    // Theo dõi khi người dùng scroll (một số trang lazy load khi scroll)
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (Math.abs(scrollTop - lastScrollTop) > 500) {
            debouncedAutoExpand();
            lastScrollTop = scrollTop;
        }
    }, { passive: true });

    // Theo dõi khi tab được focus lại (snap window, switch tab)
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log('[Auto Expand] Tab được focus lại, đang kiểm tra...');
            setTimeout(autoExpand, 300);
        }
    });

    // Theo dõi khi window được focus lại
    window.addEventListener('focus', () => {
        console.log('[Auto Expand] Window được focus lại, đang kiểm tra...');
        setTimeout(autoExpand, 300);
    });

    // Theo dõi history API (khi trang chuyển URL không reload)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
        originalPushState.apply(this, arguments);
        console.log('[Auto Expand] URL changed via pushState:', location.pathname);
        setTimeout(autoExpand, 500);
        setTimeout(autoExpand, 1500); 
    };

    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        console.log('[Auto Expand] URL changed via replaceState:', location.pathname);
        setTimeout(autoExpand, 500);
        setTimeout(autoExpand, 1500);
    };

    window.addEventListener('popstate', () => {
        console.log('[Auto Expand] URL changed via popstate:', location.pathname);
        setTimeout(autoExpand, 500);
        setTimeout(autoExpand, 1500);
    });

    // Theo dõi URL change bằng cách poll
    let lastUrl = location.href;
    setInterval(() => {
        if (location.href !== lastUrl) {
            console.log('[Auto Expand] URL changed (detected by polling):', location.pathname);
            lastUrl = location.href;
            setTimeout(autoExpand, 500);
            setTimeout(autoExpand, 1500);
        }
    }, 1000);

    console.log('[Auto Expand] Userscript đã khởi động!');
})();
