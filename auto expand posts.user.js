// ==UserScript==
// @name         Auto Expand Reviews & Posts
// @namespace    https://github.com/miinty0/draft
// @version      1.6
// @description  Expand review/posts, hiện giờ hoạt động Wiki và mở link redirect trực tiếp ở tab mới
// @author       Miinty
// @include      /^https:\/\/([^.\/]+\.)*[^.\/]*wiki[^.\/]*\.[^\/]
// @match        https://forum.dichtienghoa.com/*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
    'use strict';

    const activityPath = /^\/user\/[^/]+\/hoat-dong\/?$/;
    const activityTimeSelector = '.notification-list article.notification time[data-interval]';
    const initialTimes = new Set(document.querySelectorAll(activityTimeSelector));
    const navigation = performance.getEntriesByType('navigation')[0];
    const initialResponseTime = performance.timeOrigin +
        (navigation?.responseStart || navigation?.responseEnd || performance.now());
    const dateFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Ho_Chi_Minh',
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hourCycle: 'h23'
    });

    function formatAbsoluteTime(date) {
        const fields = Object.fromEntries(
            dateFormatter.formatToParts(date).map(part => [part.type, part.value])
        );
        return `${fields.hour}:${fields.minute} ${fields.day}/${fields.month}/${fields.year}`;
    }

    function showWikiActivityTimes() {
        if (!activityPath.test(location.pathname)) return;

        document.querySelectorAll(activityTimeSelector).forEach(time => {
            if (time.dataset.absoluteTimeShown === '1') return;

            const seconds = Number(time.dataset.interval);
            if (!Number.isFinite(seconds) || seconds < 0) return;

            const referenceTime = initialTimes.has(time) ? initialResponseTime : Date.now();
            const date = new Date(referenceTime - seconds * 1000);
            if (Number.isNaN(date.getTime())) return;

            if (time.textContent.trim()) time.title = time.textContent.trim();
            time.removeAttribute('data-ready');
            time.textContent = formatAbsoluteTime(date);
            time.dateTime = date.toISOString();
            time.dataset.absoluteTimeShown = '1';
        });
    }

    function openDirectWikiRedirectLinks() {
        document.querySelectorAll('a[href*="/redirect"]').forEach(link => {
            const originalHref = link.getAttribute('href');
            if (!originalHref) return;

            let redirectUrl, destination;
            try {
                redirectUrl = new URL(originalHref, location.href);
                if (redirectUrl.origin !== location.origin || redirectUrl.pathname !== '/redirect') return;
                const target = redirectUrl.searchParams.get('u');
                if (!target) return;
                destination = new URL(target);
            } catch {
                return;
            }
            if (destination.protocol !== 'https:' && destination.protocol !== 'http:') return;

            link.href = destination.href;
            link.target = '_blank';
            link.rel = [...new Set([...link.rel.split(/\s+/).filter(Boolean), 'noopener', 'noreferrer'])].join(' ');
        });
    }

    function expandWikiReviews() {
        const readmoreButtons = document.querySelectorAll('[data-readmore-toggle]');
        console.log(`[Wiki] Tìm thấy ${readmoreButtons.length} nút "Xem thêm"`);
        readmoreButtons.forEach(button => {
            const contentBox = document.getElementById(button.getAttribute('data-readmore-toggle'));
            if (!contentBox) return;
            contentBox.style.maxHeight = 'none';
            contentBox.style.height = 'auto';
            contentBox.setAttribute('aria-expanded', 'true');
            button.style.display = 'none';
        });
    }

    function expandForumPosts() {
        const posts = document.querySelectorAll('[component="post/content"]');
        let expandedCount = 0;
        posts.forEach(post => {
            if (post.scrollHeight > post.offsetHeight) {
                post.style.setProperty('max-height', 'none', 'important');
                post.style.setProperty('height', 'auto', 'important');
                post.style.setProperty('overflow', 'visible', 'important');
                expandedCount++;
            }
        });
        console.log(`[Forum] Đã expand ${expandedCount}/${posts.length} posts`);
    }

    function autoExpand() {
        const hostname = location.hostname;
        console.log(`[Auto Expand] Checking page: ${location.pathname}`);
        if (hostname.includes('wiki')) {
            openDirectWikiRedirectLinks();
            if (activityPath.test(location.pathname)) showWikiActivityTimes();
            else if (/^\/review(?:\/|$)/.test(location.pathname)) expandWikiReviews();
        } else if (hostname === 'forum.dichtienghoa.com') {
            expandForumPosts();
        }
    }

    let debounceTimer;
    function debouncedAutoExpand() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(autoExpand, 200);
    }

    autoExpand();
    setTimeout(autoExpand, 1000);

    const observer = new MutationObserver(mutations => {
        const hasNewContent = mutations.some(mutation =>
            (mutation.type === 'attributes' && mutation.target.matches?.('a[href*="/redirect"]')) ||
            Array.from(mutation.addedNodes).some(node =>
                node.nodeType === 1 && (
                    node.matches?.('[component="post/content"], [data-readmore-toggle], a[href*="/redirect"], ' + activityTimeSelector) ||
                    node.querySelector?.('[component="post/content"], [data-readmore-toggle], a[href*="/redirect"], ' + activityTimeSelector)
                )
            )
        );
        if (hasNewContent) {
            console.log('[Auto Expand] Phát hiện nội dung mới, đang xử lý...');
            debouncedAutoExpand();
        }
    });
    observer.observe(document.body, {
        childList: true,
        attributes: true,
        attributeFilter: ['href'],
        subtree: true
    });

    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (Math.abs(scrollTop - lastScrollTop) > 500) {
            debouncedAutoExpand();
            lastScrollTop = scrollTop;
        }
    }, { passive: true });

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            console.log('[Auto Expand] Tab được focus lại, đang kiểm tra...');
            setTimeout(autoExpand, 300);
        }
    });
    window.addEventListener('focus', () => {
        console.log('[Auto Expand] Window được focus lại, đang kiểm tra...');
        setTimeout(autoExpand, 300);
    });

    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    history.pushState = function () {
        originalPushState.apply(this, arguments);
        console.log('[Auto Expand] URL changed via pushState:', location.pathname);
        setTimeout(autoExpand, 500);
        setTimeout(autoExpand, 1500);
    };
    history.replaceState = function () {
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
