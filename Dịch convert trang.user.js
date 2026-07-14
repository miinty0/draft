// ==UserScript==
// @name         Dịch convert trang
// @author       QuocBao (stripped by Minty)
// @namespace    http://tampermonkey.net/
// @version      2
// @description  Dịch trang
// @match        *://*/*
// @updateURL    https://github.com/miinty0/draft/raw/refs/heads/main/D%E1%BB%8Bch%20convert%20trang.user.js
// @downloadURL  https://github.com/miinty0/draft/raw/refs/heads/main/D%E1%BB%8Bch%20convert%20trang.user.js
// @exclude      /^https:\/\/[^/]*wiki[^/]*
// @grant        GM_xmlhttpRequest
// @grant        GM_registerMenuCommand
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        unsafeWindow
// @connect      dichngay.com
// ==/UserScript==

(function () {
    'use strict';

    /* ===================== CONFIG ===================== */
    const DICHNGAY_URL = 'https://dichngay.com/translate/text';
    const TARGET_LANG = 'vi';
    const MAX_CHARS_PER_BATCH = 3000;
    const DELAY_MS = 300;

    /* ===================== STATE ===================== */
    let originalTexts = null; // [{ node, original }]
    let isTranslating = false;
    let autoTranslate = GM_getValue('autoTranslate', false); // persist across full reloads

    /* ===================== FORCE SELECTION ===================== */
    GM_addStyle('*, :after, :before { -webkit-user-select: text !important; -moz-user-select: text !important; -ms-user-select: text !important; user-select: text !important; cursor: auto !important; }');

    /* ===================== OVERRIDE TRUNCATION (applied after translate) ===================== */
    function overrideTruncation() {
        const style = document.createElement('style');
        style.id = 'tm-no-truncate';
        style.textContent = `* { text-overflow: clip !important; }`;
        (document.head || document.documentElement).appendChild(style);
    }

    function removeTruncationOverride() {
        const el = document.getElementById('tm-no-truncate');
        if (el) el.remove();
    }

    /* ===================== FLOATING BUTTONS ===================== */
    function createButton(label, color, bottom, onClick) {
        const btn = document.createElement('div');
        btn.textContent = label;
        btn.style.cssText = `
            position: fixed; right: 18px; bottom: ${bottom}px;
            background: ${color}; color: #fff; font-size: 13px; font-weight: bold;
            padding: 10px 14px; border-radius: 24px; cursor: pointer;
            z-index: 2147483647; box-shadow: 0 4px 12px rgba(0,0,0,0.25);
            transition: opacity .2s; user-select: none;
        `;
        btn.addEventListener('mouseenter', () => btn.style.opacity = '0.85');
        btn.addEventListener('mouseleave', () => btn.style.opacity = '1');
        btn.addEventListener('click', onClick);
        document.body.appendChild(btn);
        return btn;
    }

    let translateBtn = null;
    let restoreBtn = null;

    function showTranslateButton() {
        removeRestoreButton();
        if (translateBtn) return;
        translateBtn = createButton('Dịch', '#28a745', 20, startTranslate);
    }

    function showRestoreButton() {
        removeTranslateButton();
        if (restoreBtn) return;
        restoreBtn = createButton('Gốc', '#ffc107', 20, restorePage);
    }

    function removeTranslateButton() {
        if (translateBtn) { translateBtn.remove(); translateBtn = null; }
    }

    function removeRestoreButton() {
        if (restoreBtn) { restoreBtn.remove(); restoreBtn = null; }
    }

    /* ===================== FANQIE DECODE ===================== */
    const fontMapFanqieLibrary = { 'E4B0': '0', 'E54F': '1', 'E4E7': '2', 'E504': '3', 'E49E': '4', 'E4F6': '5', 'E556': '6', 'E53C': '7', 'E47A': '8', 'E474': '9', 'E40D': 'a', 'E51C': 'b', 'E487': 'c', 'E436': 'd', 'E51A': 'e', 'E43B': 'f', 'E485': 'g', 'E4BA': 'h', 'E478': 'i', 'E445': 'j', 'E52F': 'k', 'E49A': 'l', 'E425': 'm', 'E4DB': 'n', 'E40B': 'o', 'E3FF': 'p', 'E488': 'q', 'E47B': 'r', 'E407': 's', 'E558': 't', 'E46B': 'u', 'E543': 'v', 'E417': 'w', 'E48F': 'x', 'E3E9': 'y', 'E52A': 'z', 'E428': 'A', 'E4C1': 'B', 'E481': 'C', 'E43E': 'D', 'E44A': 'E', 'E4D3': 'F', 'E43C': 'G', 'E4CB': 'H', 'E4E8': 'I', 'E410': 'J', 'E429': 'K', 'E4E6': 'L', 'E557': 'M', 'E51D': 'N', 'E3FC': 'O', 'E455': 'P', 'E470': 'Q', 'E4B2': 'R', 'E44E': 'S', 'E435': 'T', 'E41B': 'U', 'E4B4': 'V', 'E4EE': 'W', 'E4BB': 'X', 'E467': 'Y', 'E4B9': 'Z', 'E3F3': '的', 'E526': '一', 'E456': '是', 'E517': '了', 'E40E': '我', 'E511': '不', 'E41C': '人', 'E53F': '在', 'E54D': '他', 'E4C0': '有', 'E473': '这', 'E4FB': '个', 'E54A': '上', 'E453': '们', 'E528': '来', 'E44F': '到', 'E42B': '时', 'E440': '大', 'E480': '地', 'E4C2': '为', 'E53D': '子', 'E42C': '中', 'E489': '你', 'E47C': '说', 'E4A5': '生', 'E42A': '国', 'E4C5': '年', 'E548': '着', 'E443': '就', 'E553': '那', 'E47F': '和', 'E420': '要', 'E406': '她', 'E4C8': '出', 'E3FE': '也', 'E41F': '得', 'E4A8': '里', 'E534': '后', 'E4C4': '自', 'E4DF': '以', 'E51F': '会', 'E4E2': '家', 'E502': '可', 'E438': '下', 'E551': '而', 'E539': '过', 'E54C': '天', 'E44D': '去', 'E498': '能', 'E52C': '对', 'E431': '小', 'E45B': '多', 'E4A4': '然', 'E501': '于', 'E46C': '心', 'E4D5': '学', 'E42E': '么', 'E541': '之', 'E500': '都', 'E4FE': '好', 'E52E': '看', 'E448': '起', 'E45E': '发', 'E49B': '当', 'E427': '没', 'E545': '成', 'E464': '只', 'E41D': '如', 'E459': '事', 'E458': '把', 'E4D6': '还', 'E4FF': '用', 'E4F9': '第', 'E48C': '样', 'E450': '道', 'E54B': '想', 'E465': '作', 'E4B5': '种', 'E4FC': '开', 'E524': '美', 'E48D': '总', 'E512': '从', 'E457': '无', 'E40A': '情', 'E52D': '己', 'E441': '面', 'E404': '最', 'E50B': '女', 'E4DC': '但', 'E3EB': '现', 'E466': '前', 'E51B': '些', 'E4CF': '所', 'E503': '同', 'E508': '日', 'E49D': '手', 'E43F': '又', 'E559': '行', 'E4D8': '意', 'E4B6': '动', 'E4CD': '方', 'E4C3': '期', 'E44C': '它', 'E493': '头', 'E469': '经', 'E52B': '长', 'E521': '儿', 'E4AA': '回', 'E4F8': '位', 'E4D7': '分', 'E3F6': '爱', 'E3FD': '老', 'E531': '因', 'E4F4': '很', 'E446': '给', 'E49C': '名', 'E409': '法', 'E439': '间', 'E422': '斯', 'E3F5': '知', 'E53A': '世', 'E510': '什', 'E523': '两', 'E505': '次', 'E48A': '使', 'E4EB': '身', 'E4D1': '者', 'E525': '被', 'E4BF': '高', 'E41A': '已', 'E4B3': '亲', 'E4DA': '其', 'E546': '进', 'E515': '此', 'E3EE': '话', 'E400': '常', 'E50A': '与', 'E461': '活', 'E4CC': '正', 'E4CE': '感', 'E4F5': '见', 'E4D0': '明', 'E433': '问', 'E4A2': '力', 'E3FB': '理', 'E468': '尔', 'E4B1': '点', 'E550': '文', 'E403': '几', 'E542': '定', 'E4A9': '本', 'E527': '公', 'E4BD': '特', 'E4BC': '做', 'E460': '外', 'E463': '孩', 'E532': '相', 'E45A': '西', 'E475': '果', 'E42D': '走', 'E408': '将', 'E3F0': '月', 'E3EA': '十', 'E449': '实', 'E432': '向', 'E4A1': '声', 'E43A': '车', 'E472': '全', 'E509': '信', 'E49F': '重', 'E519': '三', 'E514': '机', 'E4FA': '工', 'E3F1': '物', 'E53B': '气', 'E413': '每', 'E50E': '并', 'E554': '别', 'E4AB': '真', 'E536': '打', 'E412': '太', 'E45F': '新', 'E4DD': '比', 'E520': '才', 'E3ED': '便', 'E51E': '夫', 'E4EF': '再', 'E540': '书', 'E50F': '部', 'E3F2': '水', 'E486': '像', 'E522': '眼', 'E46F': '等', 'E3E8': '体', 'E3EF': '却', 'E454': '加', 'E424': '电', 'E405': '主', 'E45C': '界', 'E423': '门', 'E418': '利', 'E4F2': '海', 'E415': '受', 'E4ED': '听', 'E3F9': '表', 'E555': '德', 'E421': '少', 'E401': '克', 'E4A6': '代', 'E411': '员', 'E530': '许', 'E4D2': '稜', 'E47E': '先', 'E430': '口', 'E4E0': '由', 'E4E1': '死', 'E476': '安', 'E444': '写', 'E490': '性', 'E4C6': '马', 'E40C': '光', 'E4F3': '白', 'E513': '或', 'E4D4': '住', 'E55B': '难', 'E414': '望', 'E416': '教', 'E4B8': '命', 'E499': '花', 'E537': '结', 'E496': '乐', 'E533': '色', 'E4D9': '更', 'E544': '拉', 'E549': '东', 'E437': '神', 'E518': '记', 'E491': '处', 'E4E3': '让', 'E479': '母', 'E46E': '父', 'E495': '应', 'E4F7': '直', 'E4A0': '字', 'E484': '场', 'E402': '平', 'E4EC': '报', 'E4A3': '友', 'E497': '关', 'E3F4': '放', 'E4CA': '至', 'E482': '张', 'E4C7': '认', 'E4C9': '接', 'E46D': '告', 'E4AC': '入', 'E50C': '笑', 'E4A7': '内', 'E4B7': '英', 'E419': '军', 'E55A': '候', 'E471': '民', 'E4FD': '岁', 'E535': '往', 'E42F': '何', 'E43D': '度', 'E4F1': '山', 'E4DE': '觉', 'E552': '路', 'E547': '带', 'E3F7': '万', 'E426': '男', 'E4BE': '边', 'E3FA': '风', 'E462': '解', 'E4EA': '叫', 'E47D': '任', 'E4E9': '金', 'E3EC': '快', 'E4F0': '原', 'E452': '吃', 'E54E': '妈', 'E41E': '变', 'E447': '通', 'E4AD': '师', 'E529': '立', 'E4AE': '象', 'E451': '数', 'E506': '四', 'E4E4': '失', 'E50D': '满', 'E483': '战', 'E442': '远', 'E538': '格', 'E4E5': '士', 'E492': '音', 'E434': '轻', 'E48E': '目', 'E53E': '条', 'E40F': '呢' };
    const fontMapFanqieSearch = { 'E436': '0', 'E420': '1', 'E516': '2', 'E40D': '3', 'E3F3': '4', 'E553': '5', 'E4A2': '6', 'E4AA': '7', 'E53D': '8', 'E42F': '9', 'E4F6': 'a', 'E4FC': 'b', 'E477': 'c', 'E454': 'd', 'E532': 'e', 'E4A7': 'f', 'E426': 'g', 'E407': 'h', 'E4E9': 'i', 'E482': 'j', 'E554': 'k', 'E46B': 'l', 'E492': 'm', 'E54C': 'n', 'E4EE': 'o', 'E51A': 'p', 'E4D6': 'q', 'E523': 'r', 'E3E9': 's', 'E555': 't', 'E427': 'u', 'E46A': 'v', 'E408': 'w', 'E4B2': 'x', 'E4A1': 'y', 'E47E': 'z', 'E46C': 'A', 'E3F1': 'B', 'E4FE': 'C', 'E4E2': 'D', 'E4A3': 'E', 'E4DE': 'F', 'E415': 'G', 'E533': 'H', 'E4EF': 'I', 'E48C': 'J', 'E419': 'K', 'E45C': 'L', 'E42C': 'M', 'E423': 'N', 'E469': 'O', 'E455': 'P', 'E550': 'Q', 'E497': 'R', 'E462': 'S', 'E522': 'T', 'E3F4': 'U', 'E49D': 'V', 'E4B4': 'W', 'E4CA': 'X', 'E481': 'Y', 'E429': 'Z', 'E456': '的', 'E4B5': '一', 'E474': '是', 'E488': '了', 'E4D5': '我', 'E520': '不', 'E4D2': '人', 'E3ED': '在', 'E3EE': '他', 'E557': '有', 'E546': '这', 'E4DB': '个', 'E4A6': '上', 'E3F8': '们', 'E461': '来', 'E4B3': '到', 'E4E8': '时', 'E513': '大', 'E552': '地', 'E4C8': '为', 'E47F': '子', 'E40C': '中', 'E514': '你', 'E425': '说', 'E4B7': '生', 'E467': '国', 'E40A': '年', 'E507': '着', 'E47A': '就', 'E491': '那', 'E517': '和', 'E412': '要', 'E509': '她', 'E510': '出', 'E4DF': '也', 'E478': '得', 'E465': '里', 'E4C3': '后', 'E46F': '自', 'E4C5': '以', 'E558': '会', 'E4E6': '家', 'E496': '可', 'E54E': '下', 'E4C2': '而', 'E480': '过', 'E531': '天', 'E4F4': '去', 'E3EF': '能', 'E4DA': '对', 'E4C1': '小', 'E404': '多', 'E4F2': '然', 'E40F': '于', 'E46D': '心', 'E4D0': '学', 'E485': '么', 'E4CF': '之', 'E548': '都', 'E475': '好', 'E50F': '看', 'E542': '起', 'E4E7': '发', 'E4ED': '当', 'E48F': '没', 'E4B6': '成', 'E51D': '只', 'E49E': '如', 'E540': '事', 'E53B': '把', 'E4E4': '还', 'E54A': '用', 'E44E': '第', 'E51B': '样', 'E44D': '道', 'E4AD': '想', 'E3EB': '作', 'E479': '种', 'E4BC': '开', 'E42B': '美', 'E527': '总', 'E52F': '从', 'E470': '无', 'E4F9': '情', 'E41E': '己', 'E416': '面', 'E51F': '最', 'E451': '女', 'E4BA': '但', 'E49A': '现', 'E466': '前', 'E468': '些', 'E486': '所', 'E414': '同', 'E4C0': '日', 'E545': '手', 'E54F': '又', 'E42D': '行', 'E47B': '意', 'E400': '动', 'E418': '方', 'E428': '期', 'E448': '它', 'E53F': '头', 'E499': '经', 'E4AB': '长', 'E45B': '儿', 'E45F': '回', 'E4CE': '位', 'E417': '分', 'E528': '爱', 'E4F7': '老', 'E4E5': '因', 'E4A5': '很', 'E42E': '给', 'E489': '名', 'E54B': '法', 'E444': '间', 'E498': '斯', 'E52C': '知', 'E422': '世', 'E41A': '什', 'E432': '两', 'E409': '次', 'E44C': '使', 'E529': '身', 'E3FF': '者', 'E4DC': '被', 'E3FB': '高', 'E450': '已', 'E4F8': '亲', 'E401': '其', 'E521': '进', 'E43B': '此', 'E4AE': '话', 'E442': '常', 'E519': '与', 'E3FE': '活', 'E3F7': '正', 'E50D': '感', 'E446': '见', 'E49C': '明', 'E45E': '问', 'E503': '力', 'E500': '理', 'E3FD': '尔', 'E543': '点', 'E430': '文', 'E4C7': '几', 'E443': '定', 'E41D': '本', 'E4F5': '公', 'E40E': '特', 'E524': '做', 'E42A': '外', 'E447': '孩', 'E511': '相', 'E4A9': '西', 'E559': '果', 'E49F': '走', 'E431': '将', 'E4A8': '月', 'E410': '十', 'E50B': '实', 'E439': '向', 'E3FA': '声', 'E494': '车', 'E3FC': '全', 'E4B8': '信', 'E4D9': '重', 'E4C6': '三', 'E4B1': '机', 'E50A': '工', 'E506': '物', 'E441': '气', 'E493': '每', 'E3F0': '并', 'E4DD': '别', 'E544': '真', 'E440': '打', 'E4FB': '太', 'E51C': '新', 'E4F0': '比', 'E3F6': '才', 'E51E': '便', 'E4AC': '夫', 'E41B': '再', 'E4E0': '书', 'E490': '部', 'E44F': '水', 'E43A': '像', 'E48E': '眼', 'E421': '等', 'E4FA': '体', 'E476': '却', 'E52E': '加', 'E4FF': '电', 'E402': '主', 'E549': '界', 'E49B': '门', 'E55A': '利', 'E4B0': '海', 'E48B': '受', 'E535': '听', 'E483': '表', 'E4EC': '德', 'E43E': '少', 'E3F5': '克', 'E473': '代', 'E4CC': '员', 'E433': '许', 'E4E1': '稜', 'E47C': '先', 'E3EC': '口', 'E537': '由', 'E4CB': '死', 'E43D': '安', 'E4E3': '写', 'E459': '性', 'E4BF': '马', 'E472': '光', 'E43C': '白', 'E4EA': '或', 'E4EB': '住', 'E547': '难', 'E405': '望', 'E41C': '教', 'E4A0': '命', 'E445': '花', 'E41F': '结', 'E4D7': '乐', 'E50C': '色', 'E504': '更', 'E505': '拉', 'E4BE': '东', 'E460': '神', 'E50E': '记', 'E54D': '处', 'E53A': '让', 'E526': '母', 'E4BB': '父', 'E438': '应', 'E449': '直', 'E3F9': '字', 'E536': '场', 'E46E': '平', 'E403': '报', 'E435': '友', 'E458': '关', 'E406': '放', 'E541': '至', 'E434': '张', 'E4C9': '认', 'E487': '接', 'E551': '告', 'E411': '入', 'E4B9': '笑', 'E4BD': '内', 'E437': '英', 'E471': '军', 'E515': '候', 'E55B': '民', 'E556': '岁', 'E52D': '往', 'E43F': '何', 'E495': '度', 'E452': '山', 'E4F1': '觉', 'E512': '路', 'E4C4': '带', 'E4FD': '万', 'E413': '男', 'E539': '边', 'E44A': '风', 'E453': '解', 'E45A': '叫', 'E53C': '任', 'E48A': '金', 'E538': '快', 'E508': '原', 'E4F3': '吃', 'E45D': '妈', 'E4AF': '变', 'E457': '通', 'E52A': '师', 'E47D': '立', 'E4D8': '象', 'E44B': '数', 'E464': '四', 'E502': '失', 'E48D': '满', 'E4A4': '战', 'E4D1': '远', 'E525': '格', 'E3F2': '士', 'E4D3': '音', 'E52B': '轻', 'E4CD': '目', 'E53E': '条', 'E4D4': '呢' };

    function decodeFanqieGeneralText(text, pageID) {
        if (!text) return text;
        const fontMap = pageID === 'search' ? fontMapFanqieSearch : fontMapFanqieLibrary;
        let result = '';
        for (let i = 0; i < text.length; i++) {
            const hexCode = text.charCodeAt(i).toString(16).toUpperCase();
            result += fontMap[hexCode] || text[i];
        }
        return result;
    }

    function decodeFanqieReaderText(text) {
        const CODE_ST = 58344, CODE_ED = 58715;
        const CHARSET = ['D', '在', '主', '特', '家', '军', '然', '表', '场', '4', '要', '只', 'v', '和', '?', '6', '别', '还', 'g', '现', '儿', '岁', '?', '?', '此', '象', '月', '3', '出', '战', '工', '相', 'o', '男', '首', '失', '世', 'F', '都', '平', '文', '什', 'V', 'O', '将', '真', 'T', '那', '当', '?', '会', '立', '些', 'u', '是', '十', '张', '学', '气', '大', '爱', '两', '命', '全', '后', '东', '性', '通', '被', '1', '它', '乐', '接', '而', '感', '车', '山', '公', '了', '常', '以', '何', '可', '话', '先', 'p', 'i', '叫', '轻', 'M', '士', 'w', '着', '变', '尔', '快', 'l', '个', '说', '少', '色', '里', '安', '花', '远', '7', '难', '师', '放', 't', '报', '认', '面', '道', 'S', '?', '克', '地', '度', 'I', '好', '机', 'U', '民', '写', '把', '万', '同', '水', '新', '没', '书', '电', '吃', '像', '斯', '5', '为', 'y', '白', '几', '日', '教', '看', '但', '第', '加', '候', '作', '上', '拉', '住', '有', '法', 'r', '事', '应', '位', '利', '你', '声', '身', '国', '问', '马', '女', '他', 'Y', '比', '父', 'x', 'A', 'H', 'N', 's', 'X', '边', '美', '对', '所', '金', '活', '回', '意', '到', 'z', '从', 'j', '知', '又', '内', '因', '点', 'Q', '三', '定', '8', 'R', 'b', '正', '或', '夫', '向', '德', '听', '更', '?', '得', '告', '并', '本', 'q', '过', '记', 'L', '让', '打', 'f', '人', '就', '者', '去', '原', '满', '体', '做', '经', 'K', '走', '如', '孩', 'c', 'G', '给', '使', '物', '?', '最', '笑', '部', '?', '员', '等', '受', 'k', '行', '一', '条', '果', '动', '光', '门', '头', '见', '往', '自', '解', '成', '处', '天', '能', '于', '名', '其', '发', '总', '母', '的', '死', '手', '入', '路', '进', '心', '来', 'h', '时', '力', '多', '开', '己', '许', 'd', '至', '由', '很', '界', 'n', '小', '与', 'Z', '想', '代', '么', '分', '生', '口', '再', '妈', '望', '次', '西', '风', '种', '带', 'J', '?', '实', '情', '才', '这', '?', 'E', '我', '神', '格', '长', '觉', '间', '年', '眼', '无', '不', '亲', '关', '结', '0', '友', '信', '下', '却', '重', '己', '老', '2', '音', '字', 'm', '呢', '明', '之', '前', '高', 'P', 'B', '目', '太', 'e', '9', '起', '稜', '她', '也', 'W', '用', '方', '子', '英', '每', '理', '便', '西', '数', '期', '中', 'C', '外', '样', 'a', '海', '们', '任'];
        let out = '';
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i);
            out += (CODE_ST <= code && code <= CODE_ED) ? (CHARSET[code - CODE_ST] || text[i]) : text[i];
        }
        return out;
    }

    function decodeFanqie(text) {
        if (!window.location.hostname.includes('fanqienovel.com')) return text;
        if (window.location.pathname.startsWith('/search/')) return decodeFanqieGeneralText(text, 'search');
        if (window.location.pathname.startsWith('/library')) return decodeFanqieGeneralText(text, 'library');
        return decodeFanqieReaderText(text);
    }

    /* ===================== TEXT COLLECTION ===================== */
    const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'PRE', 'CODE', 'TEXTAREA', 'INPUT', 'SVG', 'CANVAS', 'MATH']);

    function collectTextNodes(root) {
        const items = [];
        const seen = new WeakSet();

        function traverse(node) {
            if (!node || seen.has(node)) return;
            if (node.nodeType === Node.ELEMENT_NODE) {
                if (SKIP_TAGS.has(node.nodeName)) return;
                if (node.isContentEditable) return;
                // Skip elements explicitly marked as no-translate
                if (node.classList && (node.classList.contains('notranslate') || node.classList.contains('no-translate'))) return;
                if (node.dataset && node.dataset.notranslate !== undefined) return;
                if (node.classList && (node.classList.contains('book-abstract') || node.classList.contains('btn-abstract'))) return;
                seen.add(node);
                for (const child of Array.from(node.childNodes)) traverse(child);
            } else if (node.nodeType === Node.TEXT_NODE) {
                const text = node.nodeValue.trim();
                // Skip whitespace-only, newline-only, or very short non-meaningful nodes
                if (text.length > 0 && !/^[\s]+$/.test(text)) {
                    items.push({ node, original: text });
                    seen.add(node);
                }
            }
        }

        traverse(root);
        return items;
    }

    /* ===================== TRANSLATION API ===================== */
    function postTranslate(texts) {
        return new Promise((resolve, reject) => {
            const payload = { content: JSON.stringify(texts), tl: TARGET_LANG };
            GM_xmlhttpRequest({
                method: 'POST',
                url: DICHNGAY_URL,
                headers: { 'Content-Type': 'application/json', 'referer': 'https://dichngay.com/' },
                data: JSON.stringify(payload),
                onload(res) {
                    if (res.status >= 200 && res.status < 300) {
                        try {
                            const json = JSON.parse(res.responseText);
                            const raw = json?.data?.content ?? json?.translatedText;
                            if (typeof raw !== 'string') throw new Error('Bad response');
                            const cleaned = raw
                                .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
                                .replace(/\\(?!["\\\/bfnrtu])/g, '\\\\');
                            try {
                                resolve(JSON.parse(cleaned));
                            } catch (e) {
                                // Fallback: try to extract strings manually
                                const matches = cleaned.match(/"((?:[^"\\]|\\.)*)"/g);
                                if (matches) {
                                    resolve(matches.map(m => m.slice(1, -1).replace(/\\"/g, '"')));
                                } else {
                                    reject(new Error('Failed to parse response: ' + e.message));
                                }
                            }
                        } catch (e) { reject(e); }
                    } else {
                        reject(new Error('HTTP ' + res.status));
                    }
                },
                onerror: reject
            });
        });
    }

    function splitBatches(texts, maxChars) {
        const batches = [];
        let cur = [], curLen = 0;
        for (const t of texts) {
            const len = t.length;
            if (curLen + len > maxChars && cur.length > 0) {
                batches.push(cur);
                cur = [t];
                curLen = len;
            } else {
                cur.push(t);
                curLen += len;
            }
        }
        if (cur.length) batches.push(cur);
        return batches;
    }

    const sleep = ms => new Promise(r => setTimeout(r, ms));

    /* ===================== TRANSLATE PAGE ===================== */
    async function startTranslate() {
        if (isTranslating) return;
        isTranslating = true;
        removeTranslateButton();

        try {
            const items = collectTextNodes(document.body);
            if (items.length === 0) { alert('Không tìm thấy nội dung để dịch.'); return; }
            originalTexts = items.map(it => ({ node: it.node, original: it.original }));
            const decoded = items.map(it => {
                const d = decodeFanqie(it.original);
                return d.replace(/[]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
            });
            const batches = splitBatches(decoded, MAX_CHARS_PER_BATCH);

            const allTranslated = [];
            for (let i = 0; i < batches.length; i++) {
                const result = await postTranslate(batches[i]);
                allTranslated.push(...result);
                if (i < batches.length - 1) await sleep(DELAY_MS);
            }
            if (allTranslated.length !== items.length) {
                console.warn(`[tm-minimal] Count mismatch: ${items.length} nodes vs ${allTranslated.length} translations`);
            }
            for (let i = 0; i < items.length; i++) {
                const translated = allTranslated[i];
                // Only replace if we got a meaningful non-whitespace translation
                if (translated && typeof translated === 'string' && translated.trim() && !/^[\s]+$/.test(translated)) {
                    // Sanitize: remove stray newlines that break inline layout
                    const clean = translated.replace(/[\r\n\t]+/g, ' ').replace(/  +/g, ' ').trim();
                    items[i].node.nodeValue = clean;
                }
            }

            showRestoreButton();
            overrideTruncation();
        } catch (e) {
            console.error('[tm-minimal] Lỗi dịch:', e);
            alert('Lỗi dịch: ' + e.message);
            showTranslateButton();
        } finally {
            isTranslating = false;
        }
    }

    /* ===================== RESTORE ===================== */
    function restorePage() {
        if (!originalTexts) {
            alert('Không có bản sao trang gốc. Vui lòng tải lại trang.');
            return;
        }
        for (const { node, original } of originalTexts) {
            node.nodeValue = original;
        }
        originalTexts = null;
        removeTruncationOverride();
        showTranslateButton();
    }

    /* ===================== AUTO TRANSLATE — TAMPERMONKEY MENU ===================== */
    function registerMenuCommands() {
        GM_registerMenuCommand(
            autoTranslate ? '🔄 Auto-dịch: BẬT — Click để TẮT' : '🔄 Auto-dịch: TẮT — Click để BẬT',
            () => {
            autoTranslate = !autoTranslate;
            GM_setValue('autoTranslate', autoTranslate);
            if (autoTranslate && !originalTexts && !isTranslating) {
                startTranslate();
            }
                alert(`Auto-dịch đã ${autoTranslate ? 'BẬT' : 'TẮT'}. Tải lại trang để cập nhật menu.`);
            }
        );
    }

    /* ===================== SPA NAVIGATION DETECTION ===================== */
    let lastUrl = location.href;

    // Hook pushState / replaceState for SPA navigation
    function hookHistory(method) {
        const original = history[method];
        history[method] = function (...args) {
            const result = original.apply(this, args);
            window.dispatchEvent(new Event('tm:urlchange'));
            return result;
        };
    }
    hookHistory('pushState');
    hookHistory('replaceState');

    // Also catch popstate (back/forward buttons)
    window.addEventListener('popstate', () => window.dispatchEvent(new Event('tm:urlchange')));

    window.addEventListener('tm:urlchange', () => {
        if (location.href === lastUrl) return;
        lastUrl = location.href;
        onPageChange();
    });

    function onPageChange() {
        // Reset state for the new page
        originalTexts = null;
        removeRestoreButton();
        isTranslating = false;

        if (autoTranslate) {
            // Wait a bit for the new page's DOM to settle before translating
            setTimeout(() => {
                if (!isTranslating) startTranslate();
            }, 600);
        } else {
            showTranslateButton();
        }
    }

    // MutationObserver fallback: catch SPAs that don't use pushState
    // (watches for significant DOM changes indicating a page swap)
    let debounceTimer = null;
    const bodyObserver = new MutationObserver(() => {
        if (location.href !== lastUrl) {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                lastUrl = location.href;
                onPageChange();
            }, 300);
        }
    });
    bodyObserver.observe(document.documentElement, { childList: true, subtree: false });

    /* ===================== EXPOSE API FOR EXTERNAL USE ===================== */
    // index.html can call window.tmTranslate(text) to translate via GM_xmlhttpRequest (bypasses CORS)
    unsafeWindow.tmTranslate = async function(text) {
        const batches = splitBatches([text], MAX_CHARS_PER_BATCH);
        const results = [];
        for (let i = 0; i < batches.length; i++) {
            const res = await postTranslate(batches[i]);
            results.push(...res);
            if (i < batches.length - 1) await sleep(DELAY_MS);
        }
        return results.join('');
    };

    /* ===================== INIT ===================== */
    showTranslateButton();
    registerMenuCommands();

    if (autoTranslate) {
        startTranslate();
    }

    console.log('[tm-minimal] Loaded. Auto-translate:', autoTranslate);

})();
