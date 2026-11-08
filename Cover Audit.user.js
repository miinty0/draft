// ==UserScript==
// @name         Cover Audit
// @namespace    https://github.com/miinty0/draft
// @updateURL    https://raw.githubusercontent.com/miinty0/draft/main/Cover%20Audit.user.js
// @downloadURL  https://raw.githubusercontent.com/miinty0/draft/main/Cover%20Audit.user.js
// @version      2.1.2
// @description  Kiểm tra bìa 
// @match        https://wikicv.org/user/*/works*
// @grant        none
// @run-at       document-idle
// ==/UserScript==
(async () => {
'use strict';
const match=location.pathname.match(/^\/user\/([^/]+)\/works\/?$/);if(!match)return;
const user=match[1],root=location.origin+'/user/'+user+'/works',scope=location.host+':'+user;
const DB_NAME='CoverAuditDB',DB_VERSION=1,legacy='wiki_cover_audit_v1_'+location.host+'_'+user;
const openDB=()=>new Promise((resolve,reject)=>{
 const r=indexedDB.open(DB_NAME,DB_VERSION);
 r.onupgradeneeded=()=>{const d=r.result;for(const name of ['meta','books','results','pages'])if(!d.objectStoreNames.contains(name))d.createObjectStore(name);};
 r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);
});
let idb;try{idb=await openDB();}catch(e){alert('Không mở được IndexedDB cho Cover Audit: '+e.message);return;}
const entry=id=>scope+':'+id;
const operation=(store,mode,cb)=>new Promise((resolve,reject)=>{
 const tx=idb.transaction(store,mode),obj=tx.objectStore(store);let out;
 tx.oncomplete=()=>resolve(out);tx.onerror=()=>reject(tx.error);
 cb(obj,value=>out=value);
});
const get=(store,id)=>operation(store,'readonly',(s,done)=>{const r=s.get(entry(id));r.onsuccess=()=>done(r.result);});
const put=(store,id,value)=>operation(store,'readwrite',(s)=>s.put(value,entry(id)));
const getScoped=store=>operation(store,'readonly',(s,done)=>{
 const r=s.getAll(IDBKeyRange.bound(scope+':',scope+':\uffff'));r.onsuccess=()=>done(r.result||[]);
});
const putPage=(start,books)=>new Promise((resolve,reject)=>{
 const t=idb.transaction(['pages','books'],'readwrite');
 t.objectStore('pages').put({start,state:'ok',count:books.length},entry(start));
 for(const b of books)t.objectStore('books').put(b,entry(b.id));
 t.oncomplete=resolve;t.onerror=()=>reject(t.error);
});
const empty=()=>({next:0,max:null,complete:false,failedPages:[],phase:'idle',concurrency:3,coverConcurrency:4,minBatch:1,delayMin:500,delayMax:2500,scanMode:'incremental',headMarker:[],incremental:null,worksTotal:null,progress:null,fullPageSuccess:[],fullStartedAt:null,scanPending:false,updated:null});
let meta={...empty(),...(await get('meta','state')||{})};
// Independent device-local preferences survive checkpoint/data resets.
const savedPreferences=await get('meta','preferences');
if(Number.isFinite(Number(savedPreferences?.maxPages)))meta.concurrency=Math.min(100,Math.max(1,Number(savedPreferences.maxPages)));
meta.delayMin=500;meta.delayMax=2500;
const saveMeta=()=>{meta.updated=new Date().toISOString();return put('meta','state',meta);};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
let active=false,pause=false,bookCache=[],resultCache=[];
const panel=document.createElement('aside');
panel.id='cover-audit';
panel.innerHTML='<button id="wa-launcher" type="button" title="Kiểm tra bìa Wiki" aria-label="Mở bảng kiểm tra bìa"><span class="wa-icon" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"> <path d="M20.8284 20.8284C20.0791 21.5797 19.0611 22.0014 18 22L6 22C3.7909 22 2 20.2091 2 18L2 6C1.9986 4.9389 2.4203 3.9209 3.1716 3.1716L20.8284 20.8284ZM7.9497 3.7071C7.7622 3.5196 7.6569 3.2652 7.6569 3C7.6569 2.4477 8.1046 2 8.6569 2L18 2C20.2091 2 22 3.7909 22 6L22 15.3431C22 15.8954 21.5523 16.3431 21 16.3431C20.7348 16.3431 20.4804 16.2378 20.2929 16.0503Z" fill="#ffffff" fill-opacity="0.4" fill-rule="evenodd" clip-rule="evenodd" stroke="none"/> <path d="M20.1213 20.1213C19.5785 20.6642 18.8285 21 18 21L6 21C4.3431 21 3 19.6569 3 18L3 6C3 5.1716 3.3358 4.4216 3.8787 3.8787M3 18L7.9393 13.0607C8.5251 12.4749 9.4749 12.4749 10.0607 13.0607L12.0801 15.0801C12.6079 15.6079 13.4436 15.6673 14.0408 15.2194L14.7143 14.7143M2 2L22 22" fill="none"/> </svg></span><span id="wa-badge" hidden></span></button><section id="wa-window" hidden><div class="hd"><strong>Kiểm tra bìa Wiki</strong><div class="wa-header-actions"><button id="wa-toggle-utilities" type="button" aria-controls="wa-utilities" aria-expanded="true" title="Thu gọn công cụ" aria-label="Thu gọn công cụ">▾</button><button id="wa-close" type="button" title="Thu gọn" aria-label="Đóng panel">×</button></div></div><div class="body"><div class="wa-live"><span id="wa-live-dot" class="wa-live-dot"></span><strong id="wa-live-state">Idle</strong><span id="wa-live-time">—</span><span id="wa-live-pending">0 request</span></div><div id="wa-utilities"><p id="wa-status" aria-live="polite">Sẵn sàng, chưa quét.</p><p id="wa-count"></p><div id="wa-combined"><div class="wa-progress-head"><b>Tiến độ /works &amp; bìa</b><span id="wa-progress-pct">0%</span></div><div id="wa-combined-track" role="progressbar" aria-label="Tiến độ tải trang và kiểm tra bìa" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div id="wa-combined-pages"></div><div id="wa-combined-covers"></div></div><div class="wa-combined-labels"><span><i class="wa-legend-page"></i> Trang <b id="wa-pages-count">0 / ?</b></span><span><i class="wa-legend-cover"></i> Bìa <b id="wa-progress-value">0 / ?</b></span></div><div id="wa-pages-note">Chưa quét</div></div><div class="wa-pace"><label>Max bìa/lượt <input id="wa-cover-workers" type="number" min="1" max="12" value="4"></label><label>Trang tối đa/lượt <input id="wa-parallel" type="number" min="1" max="100" value="3"></label></div><div class="wa-mode-setting"><strong class="wa-mode-heading">Chế độ quét</strong><div class="wa-modes" role="group" aria-label="Chế độ quét"><button type="button" class="wa-mode-btn" data-mode="incremental" aria-pressed="true"><span class="wa-mode-name">Quét tiếp</span><small>Chỉ truyện mới</small></button><button type="button" class="wa-mode-btn" data-mode="full" aria-pressed="false"><span class="wa-mode-name">Quét hết</span><small>Toàn bộ /works</small></button></div></div><p id="wa-marker" title="Mốc 30 Wiki ID mới nhất"></p><div class="buttons"><button id="wa-start">Bắt đầu quét</button><button id="wa-pause">Tạm dừng</button><button id="wa-retry-pages">Retry trang lỗi</button><button id="wa-retry">Quét lại ảnh lỗi</button><button id="wa-reset">Xóa dữ liệu quét</button></div></div><label class="wa-filter-row">Lọc <select id="wa-filter"><option value="bad">Thiếu bìa</option><option value="unknown">Chưa xác minh</option><option value="all">Tất cả</option></select></label><div id="wa-list"></div></div></section>';
const css=document.createElement('style');
css.textContent=`
#cover-audit{position:fixed;left:16px;top:16px;width:54px;height:54px;z-index:2147483000;font:13px/1.5 Arial,sans-serif;color:#254348;pointer-events:none}
#cover-audit *{box-sizing:border-box}
#cover-audit [hidden]{display:none!important}
#wa-launcher{position:absolute;inset:0;width:54px;height:54px;display:flex;align-items:center;justify-content:center;isolation:isolate;overflow:visible;background:linear-gradient(135deg,#65bac1 0%,#516D73 24%,#516D73 68%,#478c96 89%,#35e0d4 100%);color:#fff;border:1px solid rgba(255,255,255,.65);border-radius:50%;box-shadow:0 4px 20px rgba(81,109,115,.45),0 2px 9px rgba(22,95,104,.22),inset 0 1px 2px rgba(255,255,255,.38);cursor:grab;touch-action:none;user-select:none;pointer-events:auto;padding:0;transition:box-shadow .2s ease,filter .2s ease}
#wa-launcher:active{cursor:grabbing}
#wa-launcher:hover{filter:brightness(1.09);box-shadow:0 6px 28px rgba(81,109,115,.56),0 3px 12px rgba(53,224,212,.26),inset 0 1px 2px rgba(255,255,255,.5)}
#wa-launcher::before{content:"";position:absolute;inset:-5px;z-index:-1;border-radius:50%;background:conic-gradient(from 45deg,rgba(81,109,115,.35),rgba(53,224,212,.28),rgba(18,110,117,.28),rgba(255,255,255,.12),rgba(81,109,115,.35));filter:blur(9px);opacity:.85;pointer-events:none}
#wa-launcher::after{content:"";position:absolute;inset:2px;border-radius:50%;background:linear-gradient(140deg,rgba(255,255,255,.23),transparent 43%,rgba(22,105,112,.14));pointer-events:none}
#wa-launcher .wa-icon{position:relative;z-index:1;width:30px;height:30px;display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 1px 2px rgba(19,78,84,.35));pointer-events:none}#wa-launcher .wa-icon svg{display:block!important;width:30px!important;height:30px!important;stroke:#fff!important;fill:none!important;overflow:visible!important}#wa-launcher .wa-icon svg path[fill="#ffffff"]{fill:#fff!important}#wa-launcher .wa-icon svg path[fill="none"]{fill:none!important}
#wa-launcher:focus-visible{outline:3px solid #8C1620;outline-offset:3px}
#wa-badge{position:absolute;right:-6px;top:-5px;min-width:21px;height:21px;padding:1px 4px;border-radius:999px;background:#8C1620;color:#fff;border:2px solid #fff;font:bold 10px/15px Arial,sans-serif;pointer-events:none}
#wa-window{position:fixed;width:min(440px,calc(100vw - 16px));max-height:min(86vh,700px);overflow:auto;background:linear-gradient(155deg,rgba(255,255,255,.98),rgba(244,248,248,.97));border:1px solid #516D73;border-radius:12px;box-shadow:0 12px 40px rgba(19,78,84,.2),0 3px 16px rgba(81,109,115,.16);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);pointer-events:auto;color:#254348}
#wa-window .hd{background:linear-gradient(120deg,#516D73 0%,#516D73 75%,#39daca 100%);color:white;display:flex;justify-content:space-between;align-items:center;gap:5px;padding:6px 10px}
#wa-window .body{padding:7px 10px}
#wa-window .buttons{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:4px!important;margin:8px 0!important}
#wa-window .wa-pace{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;margin:5px 0}
#wa-window .wa-pace label{font-size:10px!important;line-height:1.2!important;color:#516D73}
#wa-window .wa-pace input{display:block!important;width:100%!important;height:25px!important;box-sizing:border-box!important;margin:2px 0!important;padding:2px 5px!important;background:#fff!important;border:1px solid #516D73!important}
#wa-window #wa-filter{display:inline-block!important;visibility:visible!important;opacity:1!important;position:static!important;pointer-events:auto!important;width:auto!important;height:auto!important;min-height:32px!important;margin:3px 0!important;padding:4px 28px 4px 8px!important;appearance:auto!important;-webkit-appearance:menulist!important;background-color:#fff!important;color:#254348!important;border:1px solid #516D73!important;border-radius:6px!important;float:none!important}
#cover-audit #wa-window .wa-mode-setting{margin:3px 0 2px!important}
#cover-audit #wa-window .wa-mode-heading{display:none!important}
#cover-audit #wa-window .wa-modes{display:grid!important;grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;gap:3px!important;align-items:stretch!important;width:100%!important}
#cover-audit #wa-window button.wa-mode-btn{display:flex!important;flex-direction:column!important;align-items:center!important;justify-content:center!important;gap:3px!important;position:relative!important;min-height:27px!important;height:auto!important;width:100%!important;margin:0!important;padding:3px 6px!important;border-radius:6px!important;border:2px solid #9aafb1!important;background:#f3f8f8!important;background-image:none!important;color:#516D73!important;box-shadow:none!important;text-align:center!important;text-transform:none!important;font-family:Arial,sans-serif!important;font-size:11px!important;font-weight:700!important;line-height:1.2!important;letter-spacing:normal!important;opacity:1!important;visibility:visible!important;float:none!important;cursor:pointer!important;transition:background-color .15s,border-color .15s,box-shadow .15s!important}
#cover-audit #wa-window button.wa-mode-btn .wa-mode-name{display:block!important;color:inherit!important;font-size:11px!important;font-weight:700!important;line-height:1.2!important}
#cover-audit #wa-window button.wa-mode-btn small{display:none!important}
#cover-audit #wa-window button.wa-mode-btn[aria-pressed="true"]{background:#516D73!important;background-image:linear-gradient(125deg,#516D73 0%,#516D73 79%,#439ca0 100%)!important;border-color:#35e0d4!important;color:#fff!important;box-shadow:0 0 0 2px rgba(53,224,212,.19),0 4px 13px rgba(81,109,115,.25)!important}
#cover-audit #wa-window button.wa-mode-btn[aria-pressed="true"]::after{content:"✓";position:absolute;top:3px;right:8px;font-size:13px;font-weight:800;color:#d8fff8}
#cover-audit #wa-window button.wa-mode-btn:not([aria-pressed="true"]):hover{background:#dfeeee!important;border-color:#516D73!important}
#cover-audit #wa-window button.wa-mode-btn:focus-visible{outline:3px solid #35e0d4!important;outline-offset:2px!important}
#cover-audit #wa-window button.wa-mode-btn:disabled{cursor:not-allowed!important;opacity:.7!important}
#wa-marker{font-size:11px;color:#516D73;margin:3px 0 4px}
#wa-combined{margin:4px 0 7px;padding:6px 8px;background:rgba(81,109,115,.06);border:1px solid rgba(81,109,115,.18);border-radius:8px}
.wa-progress-head,.wa-combined-labels{display:flex;justify-content:space-between;gap:6px;align-items:center;font-size:11px}
.wa-progress-head{margin-bottom:5px}
#wa-combined-track{height:12px;background:rgba(81,109,115,.16);position:relative;overflow:hidden;border-radius:20px}
#wa-combined-pages,#wa-combined-covers{position:absolute;left:0;top:0;height:100%;width:0%;transition:width .2s ease}
#wa-combined-pages{background:#516D73;z-index:1}
#wa-combined-covers{background:#35E0D4;z-index:2}
.wa-combined-labels{margin:5px 0 2px;color:#516D73}
.wa-combined-labels span{white-space:nowrap}
.wa-combined-labels i{display:inline-block;width:7px;height:7px;border-radius:2px;margin-right:3px}
.wa-legend-page{background:#516D73}.wa-legend-cover{background:#35E0D4}
#wa-pages-note{font-size:10px;color:#516D73;line-height:1.2}
.wa-live{display:flex;gap:5px;align-items:center;font-size:11px;padding:2px 0;color:#516D73}
.wa-live-dot{width:8px;height:8px;border-radius:50%;background:#aab5b6;flex:none}
.wa-live-dot.running{background:#35cfae;box-shadow:0 0 0 2px rgba(53,207,174,.18)}
.wa-live-dot.paused{background:#bd8d4c}.wa-live-dot.error{background:#8C1620}
#wa-live-time{margin-left:auto;font-variant-numeric:tabular-nums}
#wa-live-pending{font-variant-numeric:tabular-nums}
#wa-status{display:block!important;white-space:normal;overflow-wrap:anywhere;color:#516D73!important;font-size:11px;margin:3px 0!important;max-height:32px;overflow:hidden}
#wa-count{font-size:11px;margin:3px 0!important}
#wa-list{margin-top:4px!important;max-height:26vh!important;overflow:auto}
#wa-list .item{padding:4px 0!important;font-size:11px!important}
#wa-window .buttons button{display:flex!important;align-items:center!important;justify-content:center!important;white-space:normal!important;text-align:center!important;padding:5px 3px!important;font-size:10px!important;font-weight:650!important;line-height:1.12!important;min-height:34px!important;height:auto!important;border-radius:6px!important;border:1px solid #516D73!important;box-shadow:0 2px 5px rgba(81,109,115,.12)!important}
#cover-audit #wa-window #wa-start{grid-column:1/-1!important;min-height:43px!important;color:#fff!important;background:#516D73!important;background-image:linear-gradient(120deg,#516D73,#478c96)!important;border-color:#516D73!important;font-size:14px!important}
#cover-audit #wa-window #wa-start:hover{background:#3c5f65!important}
#cover-audit #wa-window #wa-pause{background:#fff5e6!important;color:#745423!important;border-color:#b18a52!important}
#cover-audit #wa-window #wa-retry-pages{background:#ecfafa!important;color:#37646c!important;border-color:#7baab1!important}
#cover-audit #wa-window #wa-retry{background:#ecfafa!important;color:#37646c!important;border-color:#7baab1!important}
#cover-audit #wa-window #wa-reset{background:#fff1f1!important;color:#8C1620!important;border-color:#c68e94!important}
#cover-audit #wa-window .buttons button:disabled{opacity:.5!important;cursor:not-allowed!important}
#wa-window #wa-filter{min-height:25px!important;font-size:11px!important}
#wa-window button,#wa-window input,#wa-window select{font:inherit;border:1px solid #516D73;border-radius:6px;padding:5px 7px;background:#f4f7f7;color:#254348}
#wa-window button{cursor:pointer}
#wa-window button:hover{background:#e7eeee}
#wa-window button:disabled{opacity:.5;cursor:not-allowed}
#wa-window #wa-close{border:1px solid #ffffff88;color:white;background:transparent;font-size:20px;line-height:1;padding:1px 7px}
#wa-list{margin-top:8px;max-height:30vh;overflow:auto}
#wa-list .item{border-top:1px solid #d7dddd;padding:7px 0;overflow-wrap:anywhere}
#wa-list .item small{display:block;color:#516D73}
#wa-window a{color:#8C1620}
#cover-audit #wa-window #wa-list .item small a{color:#1675C5!important;text-decoration:underline!important;text-underline-offset:2px!important}
#cover-audit #wa-window #wa-list .item small a:hover{color:#0B5394!important}
#wa-status{color:#516D73;margin:0 0 8px}

#cover-audit #wa-window .wa-header-actions{display:flex!important;align-items:center!important;gap:5px!important}
#cover-audit #wa-window #wa-toggle-utilities{display:flex!important;align-items:center!important;justify-content:center!important;border:1px solid #ffffff99!important;background:transparent!important;color:#fff!important;border-radius:6px!important;font-size:19px!important;line-height:1!important;width:28px!important;height:26px!important;min-width:28px!important;padding:0!important;cursor:pointer!important}
#cover-audit #wa-window #wa-toggle-utilities:hover{background:#ffffff22!important}
#cover-audit #wa-window #wa-utilities[hidden]{display:none!important}
#cover-audit #wa-window .wa-filter-row{display:flex!important;align-items:center!important;gap:8px!important;margin:6px 0 3px!important;font-size:12px!important;color:#516D73!important}
#cover-audit #wa-window .wa-filter-row select{flex:1!important}
#cover-audit #wa-window .hd{flex:none!important;min-height:34px!important}
#cover-audit #wa-window.wa-utilities-collapsed{height:min(86vh,700px)!important;max-height:min(86vh,700px)!important;display:flex!important;flex-direction:column!important;overflow:hidden!important}
#cover-audit #wa-window.wa-utilities-collapsed>.hd{flex:0 0 auto!important}
#cover-audit #wa-window.wa-utilities-collapsed>.body{display:flex!important;flex:1 1 auto!important;min-height:0!important;overflow:hidden!important;flex-direction:column!important}
#cover-audit #wa-window.wa-utilities-collapsed .wa-live{flex:0 0 auto!important}
#cover-audit #wa-window.wa-utilities-collapsed .wa-filter-row{flex:0 0 auto!important}
#cover-audit #wa-window.wa-utilities-collapsed #wa-list{display:block!important;flex:1 1 auto!important;max-height:none!important;min-height:0!important;overflow-y:auto!important;overflow-x:hidden!important}
#cover-audit #wa-window:not(.wa-utilities-collapsed){height:auto!important;display:block!important;overflow-y:auto!important}
#cover-audit #wa-window .item small{display:block!important;overflow-wrap:anywhere!important;line-height:1.4!important;margin-top:2px!important}
`;
document.head.append(css);document.body.append(panel);
const el=id=>document.getElementById('wa-'+id);
let currentStatus='Sẵn sàng, chưa quét.';
const status=s=>{currentStatus=String(s);const node=el('status');if(node)node.textContent=currentStatus;updateLive();};
let activeRequests=0,runStartedAt=0,lastActivityAt=0,activityTimer=null,runError=false;
function updateLive(){
 const state=active?(pause?'Đang tạm dừng':runError?'Lỗi':'Đang chạy'):(pause?'Đã tạm dừng':'Không chạy');
 el('live-state').textContent=state;
 el('live-dot').className='wa-live-dot'+(active?(runError?' error':pause?' paused':' running'):pause?' paused':'');
 el('live-pending').textContent=activeRequests+' request';
 el('live-time').textContent=runStartedAt&&active?Math.floor((Date.now()-runStartedAt)/1000)+'s':'—';
}
function beginActivity(){
 runStartedAt=Date.now();lastActivityAt=runStartedAt;runError=false;
 if(activityTimer)clearInterval(activityTimer);
 activityTimer=setInterval(()=>{if(active)updateLive();else{clearInterval(activityTimer);activityTimer=null;}},1000);
 updateLive();
}

const launcher=el('launcher'),windowPanel=el('window');
let utilitiesExpanded=true;
function setUtilitiesExpanded(expanded){
 utilitiesExpanded=!!expanded;
 el('utilities').hidden=!utilitiesExpanded;
 el('toggle-utilities').setAttribute('aria-expanded',String(utilitiesExpanded));
 el('toggle-utilities').textContent=utilitiesExpanded?'▾':'▸';
 el('toggle-utilities').setAttribute('title',utilitiesExpanded?'Thu gọn công cụ':'Mở công cụ');
 el('toggle-utilities').setAttribute('aria-label',utilitiesExpanded?'Thu gọn công cụ':'Mở công cụ');
 windowPanel.classList.toggle('wa-utilities-collapsed',!utilitiesExpanded);
 if(!windowPanel.hidden)requestAnimationFrame(placePanel);
}
el('toggle-utilities').onclick=()=>setUtilitiesExpanded(!utilitiesExpanded);
const ICON_SIZE=54,MARGIN=10;
const clamp=(v,lo,hi)=>Math.max(lo,Math.min(v,hi));
let position={x:Number(meta.ui?.x),y:Number(meta.ui?.y)};
if(!Number.isFinite(position.x))position.x=16;
if(!Number.isFinite(position.y))position.y=16;
let suppressClick=false;
function placePanel(){
 const x=clamp(position.x,0,Math.max(0,innerWidth-ICON_SIZE));
 const y=clamp(position.y,0,Math.max(0,innerHeight-ICON_SIZE));
 position={x,y};panel.style.left=x+'px';panel.style.top=y+'px';
 const w=Math.min(440,innerWidth-16);
 const left=x+ICON_SIZE+MARGIN+w<=innerWidth-10?x+ICON_SIZE+MARGIN:x-MARGIN-w>=10?x-MARGIN-w:clamp(x,10,innerWidth-w-10);
 const h=windowPanel.classList.contains('wa-utilities-collapsed')?Math.min(innerHeight*.86,700):Math.min(windowPanel.scrollHeight||500,innerHeight*.86,700);
 windowPanel.style.left=left+'px';
 windowPanel.style.top=clamp(y,10,Math.max(10,innerHeight-h-10))+'px';
}
function setOpen(open){windowPanel.hidden=!open;launcher.setAttribute('aria-expanded',String(open));if(open)requestAnimationFrame(placePanel);}
launcher.addEventListener('click',e=>{if(suppressClick){suppressClick=false;e.preventDefault();return;}setOpen(windowPanel.hidden);});
el('close').onclick=()=>setOpen(false);
let drag=null;
launcher.addEventListener('pointerdown',e=>{
 if(e.button!==0||drag)return;
 drag={id:e.pointerId,startX:e.clientX,startY:e.clientY,x:position.x,y:position.y,moved:false};
 launcher.setPointerCapture(e.pointerId);
});
launcher.addEventListener('pointermove',e=>{
 if(!drag||drag.id!==e.pointerId)return;
 const dx=e.clientX-drag.startX,dy=e.clientY-drag.startY;
 if(Math.hypot(dx,dy)>5)drag.moved=true;
 if(!drag.moved)return;
 position={x:clamp(drag.x+dx,0,Math.max(0,innerWidth-ICON_SIZE)),y:clamp(drag.y+dy,0,Math.max(0,innerHeight-ICON_SIZE))};
 placePanel();
});
function endDrag(e){
 if(!drag||drag.id!==e.pointerId)return;
 const moved=drag.moved;drag=null;
 if(launcher.hasPointerCapture(e.pointerId))launcher.releasePointerCapture(e.pointerId);
 if(moved){suppressClick=true;meta.ui={...meta.ui,...position};saveMeta().catch(console.error);}
}
launcher.addEventListener('pointerup',endDrag);
launcher.addEventListener('pointercancel',endDrag);
window.addEventListener('resize',()=>{placePanel();if(meta.ui){meta.ui={...meta.ui,...position};saveMeta().catch(console.error);}});
placePanel();
setOpen(false);
setUtilitiesExpanded(true);
const modeButtons=[...panel.querySelectorAll('.wa-mode-btn')];
const selectedMode=()=>meta.scanMode==='full'?'full':'incremental';
function syncModeButtons(){
 for(const button of modeButtons){
  const selected=button.dataset.mode===selectedMode();
  button.setAttribute('aria-pressed',String(selected));
 }
}
modeButtons.forEach(button=>button.addEventListener('click',async()=>{
 if(active)return;
 meta.scanMode=button.dataset.mode;
 syncModeButtons();
 await saveMeta();render();
}));
syncModeButtons();
const updateButtons=()=>{
 el('start').disabled=active;el('retry').disabled=active;el('retry-pages').disabled=active;el('reset').disabled=active;for(const id of ['cover-workers','parallel'])el(id).disabled=active;
 modeButtons.forEach(x=>x.disabled=active);
};

function renderProgress(){
 const inc=meta.scanMode==='incremental'?meta.incremental:null;
 const totalPages=Number.isFinite(meta.worksTotal)&&meta.worksTotal>=0?Math.ceil(meta.worksTotal/10):null;
 const loaded=inc?(inc.successfulPages?.length??Math.max(0,Math.floor((inc.commitNext||0)/10)-(inc.failedPages?.length||0))):(meta.fullPageSuccess?.length??Math.max(0,Math.floor((meta.next||0)/10)-(meta.failedPages?.length||0)));
 const pages=Math.min(loaded,totalPages??loaded);
 const pagePct=totalPages===null?0:totalPages===0?100:Math.min(100,100*pages/totalPages);
 const p=meta.progress||{},totalBooks=Number.isFinite(meta.worksTotal)&&meta.worksTotal>=0?meta.worksTotal:null;
 const previousCount=resultCache.length;
 const currentFull=meta.fullStartedAt?resultCache.filter(r=>r.checked&&r.checked>=meta.fullStartedAt).length:0;
 const checked=(active&&meta.scanMode==='full')?Math.max(currentFull,p.liveDone||0)+(p.done||0):Math.max(previousCount,(p.initialKnown||0)+(p.liveNew||0));
 const covers=Math.min(checked,totalBooks??checked);
 const coverPct=totalBooks===null?0:totalBooks===0?100:Math.min(100,100*covers/totalBooks);
 el('combined-pages').style.width=pagePct+'%';
 el('combined-covers').style.width=coverPct+'%';
 el('pages-count').textContent=pages.toLocaleString('en-US')+'/'+(totalPages===null?'?':totalPages.toLocaleString('en-US'));
 el('progress-value').textContent=covers.toLocaleString('en-US')+'/'+(totalBooks===null?'?':totalBooks.toLocaleString('en-US'));
 el('progress-pct').textContent=Math.round(coverPct)+'% bìa';
 el('combined-track').setAttribute('aria-valuenow',String(Math.round(coverPct)));
 const errors=inc?.failedPages?.length??meta.failedPages.length;
 el('pages-note').textContent=(errors?'Đang retry '+errors+' trang lỗi':'Trang lỗi: 0')+(inc?.hit?' · Đã gặp mốc 30 ID':'');
}
function render(){
 syncModeButtons();
 const bad=resultCache.filter(x=>x.state==='bad').length,unknown=resultCache.filter(x=>x.state==='unknown').length;
 const badge=el('badge');badge.hidden=bad===0;badge.textContent=bad>99?'99+':String(bad);
 el('count').textContent='Đã kiểm: '+resultCache.length+' · Thiếu bìa: '+bad+' · Chưa rõ: '+unknown+' · Trang lỗi: '+meta.failedPages.length+(meta.max===null?'':' · Tổng trang: '+(meta.max/10+1));
 const marker=Array.isArray(meta.headMarker)?meta.headMarker:[];
 const inc=meta.incremental;
 el('marker').textContent='Mốc 30 ID: '+marker.length+'/30'+(inc?.status==='active'?' · Quét tiếp đang dở (trang '+(inc.next/10+1)+')':'')+(meta.scanMode==='incremental'&&!marker.length?' · Chưa có mốc, cần Quét hết một lần':'');
 el('start').textContent=(meta.scanPending||meta.fullInProgress||meta.incremental?.status==='active'||meta.incremental?.status==='crawled')?'Tiếp tục quét':meta.scanMode==='full'?'Quét hết bìa':'Quét tiếp bìa';
 renderProgress();
 const filter=el('filter').value;
 const rows=resultCache.filter(x=>filter==='all'||x.state===filter).slice(0,400);
 el('list').innerHTML=rows.map(x=>{
  const name='<a target="_blank" rel="noopener" href="'+esc(x.edit)+'">'+esc(x.name)+'</a>';
  let detail;
  if(x.state==='good'){
   let url=x.cover||'';
   if(url){try{const parsed=new URL(url,location.origin);if(!parsed.searchParams.has('o'))parsed.searchParams.set('o','1');url=parsed.href;}catch(_){}}
   detail=url?'Đã có bìa: <a target="_blank" rel="noopener" href="'+esc(url)+'">'+esc(url)+'</a>':'Đã có bìa';
  }else if(x.state==='bad'&&([404,410].includes(Number(x.http))||x.reason==='Ảnh không tồn tại'||x.reason==='Thiếu URL ảnh')){
   detail='Bìa đang thiếu';
  }else{
   detail='Lỗi kiểm tra bìa: '+esc(x.reason||('HTTP '+(x.http??'không xác định')));
  }
  return '<div class="item">'+name+'<small>'+detail+'</small></div>';
 }).join('')||'<small>Không có kết quả phù hợp.</small>';
 updateButtons();
}
async function refresh(){[bookCache,resultCache]=await Promise.all([getScoped('books'),getScoped('results')]);render();}
el('filter').onchange=render;
function loadPacing(){
 el('cover-workers').value=meta.coverConcurrency||4;
 el('parallel').value=meta.concurrency||3;
 
}
async function savePacing(){
 meta.coverConcurrency=Math.min(12,Math.max(1,Number(el('cover-workers').value)||4));
 meta.concurrency=Math.min(100,Math.max(1,Number(el('parallel').value)||3));
 meta.minBatch=1;
 meta.delayMin=500;meta.delayMax=2500;
 loadPacing();await Promise.all([saveMeta(),put('meta','preferences',{maxPages:meta.concurrency})]);
}
loadPacing();
for(const id of ['cover-workers','parallel']){const field=el(id);if(field)field.addEventListener('change',savePacing);}
const randomInt=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const nextBatchSize=()=>randomInt(1,Math.min(100,Math.max(1,meta.concurrency||3)));
async function restBetweenBatches(mult=1){
 const ms=Math.round(randomInt(500,2500)*mult);
 if(ms)await sleepInterruptible(ms);
}
async function req(url,method='GET'){
 const ctrl=new AbortController(),timer=setTimeout(()=>ctrl.abort(),20000);
 activeRequests++;lastActivityAt=Date.now();updateLive();
 try{return await fetch(url,{method,credentials:'include',cache:'no-store',signal:ctrl.signal,redirect:'follow'});}
 finally{activeRequests=Math.max(0,activeRequests-1);lastActivityAt=Date.now();updateLive();clearTimeout(timer);}
}
async function readPage(start){
 const r=await req(root+'?start='+start);if(!r.ok)throw Error('HTTP '+r.status);
 const doc=new DOMParser().parseFromString(await r.text(),'text/html');
 if(!doc.querySelector('.book-list'))throw Error('Không có .book-list (đăng nhập/captcha/HTML thay đổi)');
 const books=[...doc.querySelectorAll('.book-list .book-info')].map(card=>{
  const a=card.querySelector('a.book-title'),id=card.querySelector('input[name="bookId"]')?.value,
        src=card.querySelector('.book-cover img')?.getAttribute('src');
  if(!a||!id)return null;
  const link=new URL(a.getAttribute('href'),location.origin).href;
  const editNode=doc.querySelector('#ddOption'+CSS.escape(id)+' a[href*="chinh-sua"]');
  const edit=editNode?new URL(editNode.getAttribute('href'),location.origin).href:link.replace(/\/$/,'')+'/chinh-sua';
  return {id,name:a.textContent.trim(),link,edit,cover:src?new URL(src,location.origin).href:''};
 }).filter(Boolean);
 const nums=[...doc.querySelectorAll('.pagination a[href*="start="]')].map(a=>Number(new URL(a.getAttribute('href'),location.origin).searchParams.get('start'))).filter(Number.isFinite);
 return {books,last:nums.length?Math.max(...nums):0};
}
// Retry always reads the current cover from the actual edit form.
// Never reuse the cover URL stored during the previous /works crawl.
async function readCurrentEditCover(book){
 const edit=book.edit||book.link.replace(/\/$/,'')+'/chinh-sua';
 const target=new URL(edit,location.origin);
 if(target.origin!==location.origin || !/\/chinh-sua\/?$/.test(target.pathname))throw Error('Link chỉnh sửa không hợp lệ');
 const response=await req(target.href,'GET');
 if(!response.ok)throw Error('Trang chỉnh sửa HTTP '+response.status);
 const doc=new DOMParser().parseFromString(await response.text(),'text/html');
 const image=doc.querySelector('#imgCover');
 if(!image)throw Error('Trang chỉnh sửa không có #imgCover (đăng nhập hoặc giao diện thay đổi)');
 const raw=image.getAttribute('src')?.trim()||'';
 if(!raw) return {...book,edit:target.href,cover:''};
 const cover=new URL(raw,target.href);
 if(!['http:','https:'].includes(cover.protocol))throw Error('URL #imgCover không được hỗ trợ');
 return {...book,edit:target.href,cover:cover.href};
}
async function recheckFromEdit(book){
 try{
  const current=await readCurrentEditCover(book);
  const result=await check(current);
  result.reason=(current.cover!==book.cover?'Đã cập nhật URL từ trang chỉnh sửa. ':'')+result.reason;
  result.source='edit';
  await put('books',book.id,current);
  return result;
 }catch(error){
  return {...book,state:'unknown',http:null,reason:'Không xác minh được #imgCover: '+(error.name==='AbortError'?'Timeout':error.message),checked:new Date().toISOString(),source:'edit'};
 }
}
async function updateWorksTotal(){
 try{
  const first=await readPage(0);
  const last=first.last===0?first:await readPage(first.last);
  if(first.last>0&&!last.books.length)throw Error('Trang cuối không có truyện');
  meta.worksTotal=first.last+last.books.length;
 }catch(e){
  meta.worksTotal=null;
  status('Chưa xác định được tổng truyện /works: '+e.message);
 }
 await saveMeta();renderProgress();
}
async function check(b){
 const out={...b,state:'unknown',http:null,reason:'',checked:new Date().toISOString()};
 if(!b.cover||b.cover.includes('/static/img/default-cover')){out.state='bad';out.reason='Thiếu URL ảnh';return out;}
 try{
  let r=await req(b.cover,'HEAD'),ct=r.headers.get('content-type')||'';
  if([405,501].includes(r.status)||(r.ok&&!ct.toLowerCase().startsWith('image/'))){r=await req(b.cover,'GET');ct=r.headers.get('content-type')||'';}
  out.http=r.status;
  if([404,410].includes(r.status)){out.state='bad';out.reason='Ảnh không tồn tại';return out;}
  if(r.ok&&ct.toLowerCase().startsWith('image/')){out.state='good';out.reason=ct;return out;}
  out.reason='HTTP '+r.status+', Content-Type '+ct;return out;
 }catch(e){out.reason=e.name==='AbortError'?'Timeout':e.message;return out;}
}
let coverQueue=[],coverQueued=new Set(),coverWorkers=new Set(),coverInFlight=new Set(),coverCompleted=new Set(),coverRunMode=null;
function coverLimit(){return Math.min(12,Math.max(1,Number(meta.coverConcurrency)||4));}
function queueCover(book,force=false){
 if(!coverRunMode||pause||!book?.id||coverQueued.has(book.id)||coverInFlight.has(book.id)||coverCompleted.has(book.id))return;
 coverQueued.add(book.id);coverQueue.push({book,force});startCoverWorkers();
}
function startCoverWorkers(){
 while(!pause&&coverQueue.length&&coverWorkers.size<coverLimit()){
  const job=coverQueue.shift();coverQueued.delete(job.book.id);coverInFlight.add(job.book.id);
  const worker=(async()=>{
   const {book,force}=job;
   try{
    const previous=await get('results',book.id);
    const doneFull=previous?.checked&&meta.fullStartedAt&&previous.checked>=meta.fullStartedAt;
    if((!force&&previous?.cover===book.cover)||(force&&doneFull)){
     coverCompleted.add(book.id);return;
    }
    const result=await check(book);
    await put('results',book.id,result);
    coverCompleted.add(book.id);
    const p=meta.progress||{};
    p.liveDone=(p.liveDone||0)+1;
    if(!previous)p.liveNew=(p.liveNew||0)+1;
    if(p.liveDone%10===0){await saveMeta();await refresh();}
    else renderProgress();
   }catch(e){console.warn('[Cover Audit] Bìa kiểm tra thất bại',book.id,e);}
   finally{coverInFlight.delete(book.id);}
  })();
  coverWorkers.add(worker);
  worker.finally(()=>{coverWorkers.delete(worker);if(!pause)startCoverWorkers();});
 }
}
async function drainCoverQueue(){
 while(coverWorkers.size||coverQueue.length){
  if(pause){coverQueue=[];coverQueued.clear();}
  if(!pause)startCoverWorkers();
  if(coverWorkers.size)await Promise.race([...coverWorkers]);
  else break;
 }
 await saveMeta();await refresh();
}
async function beginCoverPipeline(mode){
 coverRunMode=mode;coverQueue=[];coverQueued.clear();coverCompleted.clear();coverInFlight.clear();
 await refresh();
 meta.progress={phase:'collect',liveDone:0,liveNew:0,initialKnown:new Set(resultCache.map(r=>r.id)).size,done:0,total:0,pendingNew:0};
 if(mode==='full'&&!meta.fullStartedAt)meta.fullStartedAt=new Date().toISOString();
 await saveMeta();renderProgress();
}
async function restoreExistingFullPageCheckpoint(){
 if((meta.fullPageSuccess||[]).length||meta.next<=0)return;
 const pages=await getScoped('pages');
 const failed=new Set(meta.failedPages||[]);
 meta.fullPageSuccess=[...new Set(pages
  .filter(p=>p.state==='ok'&&Number.isFinite(p.start)&&p.start<meta.next&&!failed.has(p.start))
  .map(p=>p.start))].sort((a,b)=>a-b);
 await saveMeta();renderProgress();
}
async function enqueuePreviouslyCollectedFullPages(){
 const pages=await getScoped('pages');
 const successful=new Set(meta.fullPageSuccess||[]);
 for(const page of pages){
  if(!successful.has(page.start)||!Array.isArray(page.books))continue;
  for(const book of page.books)queueCover(book,true);
 }
}
async function collectBatch(starts,retry=false){
 const responses=await Promise.all(starts.map(async start=>{
  try{return {start,data:await readPage(start)};}catch(e){return {start,error:e.message};}
 }));
 for(const r of responses){
  if(r.error){
   if(!meta.failedPages.includes(r.start))meta.failedPages.push(r.start);
   (meta.pageErrors||={})[r.start]=r.error;
  }else{
   await putPage(r.start,r.data.books);
   (meta.fullPageSuccess||=[]);if(!meta.fullPageSuccess.includes(r.start))meta.fullPageSuccess.push(r.start);
   for(const book of r.data.books)queueCover(book,coverRunMode==='full');
   meta.failedPages=meta.failedPages.filter(x=>x!==r.start);
   if(meta.pageErrors)delete meta.pageErrors[r.start];
   if(meta.max===null)meta.max=r.data.last;
   if(r.data.last>meta.max)meta.max=r.data.last;
  }
 }
 if(!retry)meta.next=Math.max(meta.next,...starts.map(x=>x+10));
 await saveMeta();renderProgress();
}
async function retryFullPages(){
 let round=0;
 while(!pause&&meta.failedPages.length){
  round++;
  const pending=[...new Set(meta.failedPages)].sort((a,b)=>a-b);
  for(let i=0;i<pending.length&&!pause;){
   const n=Math.min(nextBatchSize(),pending.length-i),chunk=pending.slice(i,i+n);i+=n;
   await collectBatch(chunk,true);
   status('Retry trang lỗi · Vòng '+round+' · '+i+'/'+pending.length+' · Còn '+meta.failedPages.length);
   if(i<pending.length)await restBetweenBatches(Math.min(6,1+round*.35));
  }
  // Endless cycles are explicitly requested, but apply backoff so prolonged
  // server outages do not hammer WikiCV. Tạm dừng always exits the loop.
  if(meta.failedPages.length&&!pause){
   const wait=Math.min(60000,Math.max(4000,3000*2**Math.min(5,round-1)));
   status('Còn '+meta.failedPages.length+' trang lỗi · Nghỉ '+Math.ceil(wait/1000)+'s rồi retry vòng '+(round+1));
   await sleepInterruptible(wait);
  }
 }
 return meta.failedPages.length===0;
}
async function sleepInterruptible(ms){
 const until=Date.now()+ms;
 while(!pause&&Date.now()<until)await sleep(Math.min(500,until-Date.now()));
}
async function crawl(){
 if(meta.max===null){
  status('Đang xác định tổng số trang…');await collectBatch([0],true);
  if(meta.max===null){status('Trang đầu lỗi; giữ checkpoint để thử lại.');return;}
 }
 while(!pause&&meta.next<=meta.max){
  const n=Math.min(nextBatchSize(),Math.floor((meta.max-meta.next)/10)+1);
  const starts=Array.from({length:n},(_,i)=>meta.next+i*10);
  await collectBatch(starts);
  status('Trang '+(starts[0]/10+1)+'–'+(starts.at(-1)/10+1)+' / '+(meta.max/10+1)+' · Lỗi chờ '+meta.failedPages.length);
  if(!pause&&meta.next<=meta.max)await restBetweenBatches();
 }
 if(pause)return;
 await retryFullPages();
 meta.complete=meta.next>meta.max&&meta.failedPages.length===0;await saveMeta();
 if(meta.failedPages.length)status('Còn '+meta.failedPages.length+' trang lỗi; đang giữ checkpoint.');
}
async function captureHeadMarker(){
 const starts=[0,10,20],replies=await Promise.all(starts.map(async start=>{
  try{return {start,data:await readPage(start)};}catch(e){return {start,error:e.message};}
 }));
 const failed=replies.filter(x=>x.error);
 if(failed.length)throw Error('Không thể lưu mốc mới; lỗi tải trang '+failed.map(x=>x.start/10+1).join(', '));
 const ids=replies.sort((a,b)=>a.start-b.start).flatMap(x=>x.data.books.map(b=>b.id));
 if(!ids.length)throw Error('Không thể lưu mốc: trang đầu không có truyện');
 return [...new Set(ids)].slice(0,30);
}
async function crawlIncremental(){
 const boundary=new Set(meta.headMarker||[]);
 if(!boundary.size)throw Error('Chưa có mốc 30 Wiki ID. Chọn Quét hết một lần để thiết lập mốc trước.');
 let inc=meta.incremental;
 if(!inc||inc.status!=='active'){
  inc={status:'active',runId:Date.now().toString(36),next:0,commitNext:0,max:null,hit:false,stopAt:null,candidateStopAt:null,failedPages:[],newCount:0,boundary:[...boundary]};
  meta.incremental=inc;await saveMeta();
 }
 const stableBoundary=new Set(inc.boundary||[]);
 const batchSize=Math.max(1,Math.min(100,meta.concurrency||3));
 const pageKey=start=>'incremental:'+inc.runId+':'+start;
 async function advance(){
  while(!inc.hit){
   const page=await get('pages',pageKey(inc.commitNext));
   if(!page)break;
   const start=inc.commitNext,books=page.books||[];
   const matchIndex=books.findIndex(book=>stableBoundary.has(book.id));
   const fresh=matchIndex>=0?books.slice(0,matchIndex):books;
   for(const book of fresh){
    await put('books',book.id,book);
    inc.newCount++;
    queueCover(book,false);
   }
   inc.commitNext+=10;
   if(matchIndex>=0||books.length<10||(inc.max!==null&&start>=inc.max)){
    inc.hit=true;inc.stopAt=start;break;
   }
  }
 }
 async function oneBatch(starts,retry=false){
  const responses=await Promise.all(starts.map(async start=>{
   try{return {start,data:await readPage(start)};}catch(e){return {start,error:e.message};}
  }));
  for(const response of responses){
   if(response.error){
    if(!inc.failedPages.includes(response.start))inc.failedPages.push(response.start);
    continue;
   }
   inc.max=Math.max(inc.max??0,response.data.last);
   (inc.successfulPages||=[]);if(!inc.successfulPages.includes(response.start))inc.successfulPages.push(response.start);
   const books=response.data.books;
   await put('pages',pageKey(response.start),{start:response.start,books});
   inc.failedPages=inc.failedPages.filter(x=>x!==response.start);
   if(books.some(b=>stableBoundary.has(b.id))||books.length<10){
    inc.candidateStopAt=inc.candidateStopAt===null?response.start:Math.min(inc.candidateStopAt,response.start);
   }
  }
  if(!retry)inc.next=Math.max(inc.next,...starts.map(x=>x+10));
  await advance();
  await saveMeta();renderProgress();
 }
 while(!pause&&!inc.hit&&inc.candidateStopAt===null){
  const starts=Array.from({length:nextBatchSize()},(_,i)=>inc.next+i*10)
   .filter(start=>inc.max===null||start<=inc.max);
  if(!starts.length)break;
  await oneBatch(starts);
  status('Quét tiếp: trang '+(starts[0]/10+1)+'–'+(starts.at(-1)/10+1)+' · Đã nhận '+inc.newCount+' truyện mới · Lỗi '+inc.failedPages.length);
  if(inc.max===null)break;
  if(!pause&&!inc.hit&&inc.candidateStopAt===null)await restBetweenBatches();
 }
 if(pause)return false;
 // Infinite retry of only the pages needed to establish the old ID boundary.
 // Cover workers keep draining successful pages concurrently.
 let round=0;
 while(!pause&&!inc.hit&&inc.failedPages.length){
  round++;
  const retry=[...new Set(inc.failedPages)].filter(x=>inc.candidateStopAt===null||x<=inc.candidateStopAt).sort((a,b)=>a-b);
  if(!retry.length)break;
  for(let i=0;i<retry.length&&!pause&&!inc.hit;){
   const size=Math.min(nextBatchSize(),retry.length-i);
   const part=retry.slice(i,i+size);i+=size;
   await oneBatch(part,true);
   status('Quét tiếp · Retry vòng '+round+' · '+i+'/'+retry.length+' · Còn '+inc.failedPages.length);
   if(i<retry.length&&!inc.hit)await restBetweenBatches(Math.min(6,1+round*.35));
  }
  if(!inc.hit&&!pause&&inc.failedPages.length){
   const wait=Math.min(60000,Math.max(4000,3000*2**Math.min(5,round-1)));
   status('Retry '+inc.failedPages.length+' trang lỗi · Nghỉ '+Math.ceil(wait/1000)+'s');
   await sleepInterruptible(wait);
  }
 }
 if(pause)return false;
 if(inc.hit){
  inc.failedPages=inc.failedPages.filter(x=>x<=inc.stopAt);
 }
 if(inc.failedPages.length){
  status('Còn '+inc.failedPages.length+' trang chưa tải được; giữ mốc cũ để quét tiếp.');
  await saveMeta();
  return false;
 }
 if(!inc.hit){
  status('Chưa xác nhận được mốc dừng; giữ checkpoint để tiếp tục.');
  return false;
 }
 inc.status='crawled';await saveMeta();
 return true;
}
async function scanCovers(onlyFailed=false,forceAll=false){
 await refresh();
 const previous=new Map(resultCache.map(x=>[x.id,x]));
 const books=bookCache.filter(b=>{
  const old=previous.get(b.id);
  return onlyFailed ? !!old&&old.state!=='good'
   :forceAll ? !(old?.checked&&meta.fullStartedAt&&old.checked>=meta.fullStartedAt)
   :!old||old.cover!==b.cover;
 });
 const deferred=[];
 let next=0,done=0;
 meta.progress={...meta.progress,phase:'covers',done:0,total:books.length,pendingNew:0};
 await saveMeta();renderProgress();
 async function worker(){
  while(!pause){
   const index=next++;
   if(index>=books.length)return;
   const book=books[index];
   const result=onlyFailed?await recheckFromEdit(book):await check(book);
   await put('results',book.id,result);
   if(!previous.has(book.id))meta.progress.pendingNew++;
   meta.progress.done++;
   if(result.state==='unknown')deferred.push(book);
   done++;
   status((onlyFailed?'Kiểm tra lại bìa ':'Kiểm tra bìa ')+done+'/'+books.length+' · '+coverLimit()+' luồng HEAD · Chưa rõ '+deferred.length);
   if(done%10===0){await saveMeta();await refresh();}
   else renderProgress();
  }
 }
 await Promise.all(Array.from({length:Math.min(coverLimit(),books.length)},()=>worker()));
 await refresh();
 if(pause)return;
 for(let i=0;i<deferred.length&&!pause;){
  const group=deferred.slice(i,i+coverLimit());i+=group.length;
  await sleep(1100);
  await Promise.all(group.map(async book=>{
   const result=onlyFailed?await recheckFromEdit(book):await check(book);
   await put('results',book.id,result);
  }));
  status('Thử lại bìa chưa xác minh '+i+'/'+deferred.length);
  await refresh();
 }
 meta.progress={phase:'done',done:meta.progress.done,total:meta.progress.total,pendingNew:0};
 await saveMeta();await refresh();
}
async function run(retry=false){
 if(active)return;
 active=true;pause=false;if(!retry)meta.scanPending=true;beginActivity();updateButtons();
 meta.progress={phase:retry?'retry':'collect',done:0,total:0,pendingNew:0};await saveMeta();renderProgress();
 try{
  if(!retry)await updateWorksTotal();
  if(retry){
   await scanCovers(true);
   if(!pause)status('Đã kiểm tra lại các ảnh lỗi.');
  }else if(selectedMode()==='incremental'){
   await beginCoverPipeline('incremental');
   const ready=meta.incremental?.status==='crawled'||await crawlIncremental();
   await drainCoverQueue();
   if(ready&&!pause){
    await scanCovers(false);
    if(!pause){
     const newMarker=await captureHeadMarker();
     meta.headMarker=newMarker;
     meta.incremental=null;meta.scanPending=false;
     await saveMeta();
     status('Quét tiếp hoàn tất. Đã lưu mốc '+newMarker.length+' ID mới nhất.');
    }
   }
  }else{
   if(meta.fullInProgress!==true){
    meta.next=0;meta.max=null;meta.complete=false;meta.failedPages=[];meta.fullPageSuccess=[];meta.fullStartedAt=new Date().toISOString();
    meta.fullInProgress=true;meta.incremental=null;await saveMeta();
   }
   await restoreExistingFullPageCheckpoint();
   await beginCoverPipeline('full');
   await enqueuePreviouslyCollectedFullPages();
   await crawl();
   await drainCoverQueue();
   if(!pause&&meta.complete){
    await scanCovers(false,true);
    if(!pause){
     const newMarker=await captureHeadMarker();
     meta.headMarker=newMarker;
     meta.fullInProgress=false;meta.fullStartedAt=null;meta.scanPending=false;
     await saveMeta();
     status('Quét hết hoàn tất. Đã lưu mốc '+newMarker.length+' Wiki ID.');
    }
   }
  }
  if(pause)status('Đã tạm dừng; giữ nguyên mốc cũ và checkpoint.');
 }catch(e){runError=true;status('Lỗi: '+e.message);}
 finally{coverRunMode=null;coverQueue=[];coverQueued.clear();active=false;meta.phase='idle';await saveMeta();await refresh();updateLive();}
}
el('start').onclick=()=>run(false);
el('retry').onclick=()=>run(true);
el('retry-pages').onclick=async()=>{
 if(active)return;
 active=true;pause=false;beginActivity();updateButtons();
 try{
  if(meta.incremental?.failedPages?.length){
   await beginCoverPipeline('incremental');
   const ready=await crawlIncremental();
   await drainCoverQueue();
   if(ready&&!pause){
    await scanCovers(false);
    if(!pause){
     const newMarker=await captureHeadMarker();
     meta.headMarker=newMarker;meta.incremental=null;meta.scanPending=false;
     await saveMeta();status('Retry xong trang lỗi và tự kiểm bìa. Mốc 30 ID đã cập nhật.');
    }
   }
  }else if(meta.failedPages.length){
   await beginCoverPipeline('full');
   await enqueuePreviouslyCollectedFullPages();
   await retryFullPages();
   await drainCoverQueue();
   meta.complete=meta.max!==null&&meta.next>meta.max&&meta.failedPages.length===0;
   await saveMeta();
   if(!pause&&meta.complete){
    await scanCovers(false,meta.fullInProgress===true);
    if(!pause&&meta.fullInProgress){
     const newMarker=await captureHeadMarker();
     meta.headMarker=newMarker;meta.fullInProgress=false;meta.fullStartedAt=null;meta.scanPending=false;
     await saveMeta();
    }
    if(!pause)status('Retry trang lỗi xong và tự động kiểm bìa hoàn tất.');
   }
  }else status('Không còn trang lỗi cần retry.');
  if(pause)status('Đã tạm dừng; checkpoint và tiến độ bìa được giữ lại.');
 }catch(e){runError=true;status('Lỗi retry trang: '+e.message);}
 finally{
  await drainCoverQueue();
  coverRunMode=null;coverQueue=[];coverQueued.clear();
  active=false;await saveMeta();await refresh();updateLive();
 }
};
el('pause').onclick=()=>{if(!active)return;pause=true;meta.scanPending=true;status('Đang tạm dừng sau nhóm request hiện tại…');el('start').textContent='Tiếp tục quét';saveMeta().catch(console.error);updateLive();};
el('reset').onclick=async()=>{
 if(!confirm('Xóa toàn bộ checkpoint và kết quả của tài khoản '+user+'?'))return;
 for(const store of ['books','results','pages']){
  await operation(store,'readwrite',(s)=>{const cur=s.openCursor(IDBKeyRange.bound(scope+':',scope+':\uffff'));cur.onsuccess=()=>{const c=cur.result;if(c){c.delete();c.continue();}};});
 }
 const currentUi=meta.ui,currentMax=meta.concurrency,currentWorkers=meta.coverConcurrency;
 meta=empty();meta.ui=currentUi;meta.concurrency=currentMax;meta.coverConcurrency=currentWorkers;
 loadPacing();await Promise.all([saveMeta(),put('meta','preferences',{maxPages:currentMax})]);status('Đã xóa dữ liệu, có thể quét mới.');await refresh();
};

try{
 const raw=localStorage.getItem(legacy);
 if(raw&&!await get('meta','migrated')){
  const old=JSON.parse(raw);
  for(const book of Object.values(old.books||{})){
   if(!book.edit)book.edit=book.link.replace(/\/$/,'')+'/chinh-sua';
   await put('books',book.id,book);
  }
  for(const result of Object.values(old.results||{})){
   if(!result.edit)result.edit=result.link.replace(/\/$/,'')+'/chinh-sua';
   await put('results',result.id,result);
  }
  await put('meta','migrated',true);
  localStorage.removeItem(legacy);
  status('Đã chuyển dữ liệu cũ sang IndexedDB');
 }
}catch(e){status('Không thể chuyển dữ liệu cũ: '+e.message);}
await refresh();updateLive();
})();
