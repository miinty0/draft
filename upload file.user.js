// ==UserScript==
// @name         Upload File
// @namespace    http://tampermonkey.net/
// @version      2.2.1
// @author       giaays
// @description  Minor change for personal preference
// @match        *://*/nhung-file*
// @match        *://*/*chinh-sua*
// @match        */truyen/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @grant        none
// ==/UserScript==

!function(){"use strict";if(window.location.pathname.includes("nhung-file")||window.location.pathname.includes("chinh-sua")){console.log("[Wiki Tool] Script started! URL:",window.location.pathname);let i=!0,t=[],n="none",o="none",l="none",a,r,p=null,c=[];const we=new WeakMap;let x=!0,u=!0;const Ce="WIKI_UPLOAD_SETTINGS_V2";let m="UTF-8",s=[],d=null,h="upload",g,y,f,b,v,w=!1,C=!1;const ke=56;var e=.05*window.innerWidth,e=window.innerWidth-ke-e;function ue(){r=(p?(a=p.querySelector('input[name="numFile"][type="number"]'),p):(a=document.querySelector('input[name="numFile"][type="number"]'),document)).querySelector('input[name="autoNumber"][type="checkbox"]'),a&&r||(a=null,r=null)}function me(){const l=Array.from(document.querySelectorAll(".volume-info-wrapper")),a=p?p.getAttribute("data-volume-id"):null;let r=-1,s=(V.innerHTML='<option value="-1" disabled selected>-- Chọn quyển để thêm chương --</option>',-1),d=[];if(l.forEach((e,t)=>{let n=e.querySelector('input[name="nameCn"]');var o,i;n=n||e.querySelector('input[name="name"]'),!e.querySelector('input[name="numFile"][type="number"]')||!e.querySelector('input[name="autoNumber"][type="checkbox"]')||!n&&1<l.length&&t===l.length-1||(o=n&&""!==n.value.trim()?n.value.trim():"Quyển "+(t+1),e.setAttribute("data-volume-id","volume-"+t),i=n&&""!==n.value.trim(),d.push({wrapper:e,name:o,isNamed:i,originalIndex:t}),n&&!we.has(n)&&(n.addEventListener("input",Te),we.set(n,Te)))}),0===d.length)N.style.display="none",p=null;else{N.style.display="block";var e=d.filter(e=>e.isNamed||"true"===e.wrapper.querySelector(".volume-wrapper")?.getAttribute("data-append"));if(0===e.length)p=null,V.value="-1";else{c=[];let l=-1;e.forEach((e,t)=>{var{wrapper:e,name:n}=e,o=(c.push(e),e.querySelector(".volume-wrapper"));let i=n;o&&"true"===o.getAttribute("data-append")&&(i+=" (Bổ sung)",s=t),-1===l&&(l=t);n=document.createElement("option");n.value=String(t),n.textContent=t+1+". "+i,V.appendChild(n),a===e.getAttribute("data-volume-id")&&(r=t)}),-1!==r?(V.value=String(r),p=c[r]):(e=-1!==s?s:-1!==l?l:0,c[e]?(V.value=String(e),p=c[e]):(p=c[0]||null,V.value=p?"0":"-1"))}ue()}}console.log("[Wiki Tool] Functions defined");const Te=function(t,n){let o;return function(...e){clearTimeout(o),o=setTimeout(()=>{t.apply(this,e)},n)}}(me,200),U=(console.log("[Wiki Tool] debouncedRebuild created"),document.createElement("div"));U.style.cssText=`
            position: fixed;
            top: 100px;
            right: auto;
            left: ${e}px;
            background: #2c3e50;
            padding: 0;
            border-radius: 50%;
            z-index: 10000;
            box-shadow: 0 4px 6px rgba(0,0,0,0.07), 0 10px 20px rgba(0,0,0,0.1);
            width: 56px;
            height: 56px;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            border: none;
            transition: all 0.3s ease;
            cursor: move;
            display: flex;
            align-items: center;
            justify-content: center;
        `;e=document.createElement("div");e.style.cssText="width: 100%; height: 100%; position: relative;",U.appendChild(e);const W=document.createElement("button"),q=(W.innerHTML=`
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
        `,W.style.cssText=`
            background: transparent;
            border: none;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            padding: 0;
            margin: 0;
        `,e.appendChild(W),document.createElement("div"));q.style.cssText="display: none; justify-content: space-between; align-items: center; margin: 0 -24px 0 -24px; padding: 24px 24px 16px 24px; border-bottom: 2px solid #e5e1da; width: calc(100% + 48px); position: sticky; top: 0; background: #ffffff; z-index: 10; border-radius: 12px 12px 0 0;";var $=document.createElement("div"),A=($.style.cssText="display: flex; align-items: center; gap: 10px;",document.createElement("div")),A=(A.innerHTML=`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#495057" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
        `,$.appendChild(A),document.createElement("div"));A.textContent="Wiki Tools",A.style.cssText="color: #212529; font-size: 18px; font-weight: 600;",$.appendChild(A);const j=document.createElement("button"),Ee=(j.innerHTML=`
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#495057" stroke-width="2">
                <polyline points="18 15 12 9 6 15"></polyline>
            </svg>
        `,j.style.cssText=`
            background: transparent;
            border: none;
            width: 32px;
            height: 32px;
            border-radius: 6px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
            padding: 0;
            margin: 0;
            flex-shrink: 0;
        `,j.onmouseover=()=>{j.style.background="#e5e1da"},j.onmouseout=()=>{j.style.background="transparent"},q.appendChild($),q.appendChild(j),e.appendChild(q),document.createElement("div"));Ee.style.cssText="display: none; margin: 0 -24px 0 -24px; padding: 0 24px 16px 24px; border-bottom: 2px solid #e5e1da; width: calc(100% + 48px); position: sticky; top: 66px; background: #ffffff; z-index: 9;";A=document.createElement("div");A.style.cssText="display: flex; gap: 0; width: 100%;";const O=document.createElement("button"),D=(O.textContent="Upload",O.style.cssText=`
    flex: 1 1 50%;
    max-width: 50%;
    padding: 10px 16px;
    background: transparent;
    border: none;
    border-bottom: 3px solid #28a745;
    color: #28a745;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
`,document.createElement("button")),Se=(D.textContent="Chia Chương",D.style.cssText=`
    flex: 1 1 50%;
    max-width: 50%;
    padding: 10px 16px;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    color: #6c757d;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
`,A.appendChild(O),A.appendChild(D),Ee.appendChild(A),e.appendChild(Ee),document.createElement("div")),P=(Se.style.cssText="overflow-y: auto; overflow-x: hidden; flex: 1; min-height: 0; padding-bottom: 20px;",e.appendChild(Se),document.createElement("div")),N=(P.style.cssText="display: none; width: 100%; padding-bottom: 16px;",document.createElement("div"));N.style.cssText="margin-bottom: 12px; display: none; padding: 0 4px;";$=document.createElement("div");$.textContent="Chọn Quyển Upload:",$.style.cssText="color: #495057; font-size: 13px; margin-bottom: 6px; font-weight: 600;",N.appendChild($);const V=document.createElement("select");V.style.cssText=`
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            appearance: auto !important;
            -webkit-appearance: auto !important;
            width: 100%;
            padding: 8px;
            border: 1px solid #d6cfc4;
            border-radius: 6px;
            font-size: 14px;
            color: #333;
            box-sizing: border-box;
            background-color: #ffffff;
            min-height: 38px;
            z-index: 10001;
        `,V.onchange=e=>{var e=parseInt(e.target.value),e=c[e],t=(p=e,ue(),e.querySelector(".volume-wrapper"));!(!t||"true"!==t.getAttribute("data-append"))&&(t=e.querySelector('.btn-add-volume[data-action="appendLastVolume"]'),e=e.querySelector(".append-last-volume"),t)&&e&&e.classList.contains("hide")&&t.click()},N.appendChild(V),P.appendChild(N);A=document.createElement("div"),e=(A.style.cssText="margin-bottom: 12px; display: block; padding: 0 4px;",document.createElement("div"));e.textContent="Chọn Bảng Mã File:",e.style.cssText="color: #495057; font-size: 13px; margin-bottom: 6px; font-weight: 600;",A.appendChild(e);const Me=document.createElement("select");Me.style.cssText=`
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
    appearance: auto !important;
    -webkit-appearance: auto !important;
    width: 100%;
    padding: 8px;
    border: 1px solid #d6cfc4;
    border-radius: 6px;
    font-size: 14px;
    color: #333;
    box-sizing: border-box;
    background-color: #ffffff;
    min-height: 38px;
    z-index: 10001;
`;[{value:"UTF-8",label:"UTF-8 (Mặc định)"},{value:"UTF-16LE",label:"UTF-16 LE"},{value:"UTF-16BE",label:"UTF-16 BE"},{value:"Shift_JIS",label:"Shift JIS (日本語)"},{value:"GBK",label:"GBK (简体中文)"},{value:"Big5",label:"Big5 (繁體中文)"},{value:"Windows-1252",label:"Windows-1252"},{value:"ISO-8859-1",label:"ISO-8859-1"}].forEach(e=>{var t=document.createElement("option");t.value=e.value,t.textContent=e.label,Me.appendChild(t)}),Me.onchange=e=>{m=e.target.value,console.log("Đã chọn encoding:",m)},A.appendChild(Me),P.appendChild(A);$=document.createElement("input");$.type="file",$.id="autoUploadFileInput",$.multiple=!0,$.accept=".txt",$.style.display="none",P.appendChild($);const Y=document.createElement("label");Y.setAttribute("for","autoUploadFileInput"),Y.style.cssText=`
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: #ffffff;
            color: #495057;
            padding: 12px;
            border-radius: 8px;
            cursor: pointer;
            text-align: center;
            margin-bottom: 0;
            font-size: 14px;
            font-weight: 500;
            transition: all 0.2s;
            border: 1px solid #d6cfc4;
            box-shadow: 0 2px 4px rgba(0,0,0,0.05);
        `;e=document.createElement("span"),A=(e.innerHTML=`
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                <polyline points="13 2 13 9 20 9"/>
            </svg>
        `,Y.appendChild(e),document.createElement("span"));A.textContent="Chọn file",Y.appendChild(A),Y.onmouseover=()=>{Y.style.background="#fafaf8",Y.style.borderColor="#b8ad9f",Y.style.transform="translateY(-1px)",Y.style.boxShadow="0 4px 8px rgba(0,0,0,0.1)"},Y.onmouseout=()=>{Y.style.background="#ffffff",Y.style.borderColor="#d6cfc4",Y.style.transform="translateY(0)",Y.style.boxShadow="0 2px 4px rgba(0,0,0,0.05)"},P.appendChild(Y);const K=document.createElement("div"),ze=(K.style.cssText="color: #6c757d; font-size: 13px; margin-top: 6px; margin-bottom: 10px; display: none; padding-left: 4px;",P.appendChild(K),document.createElement("div"));ze.style.cssText="display: none; max-height: 150px; overflow-y: auto; background: #f8f9fa; border: 1px solid #d6cfc4; border-radius: 4px; padding: 8px; margin-bottom: 10px; font-size: 12px;",P.appendChild(ze);let k=!($.onchange=e=>{e=(t=Array.from(e.target.files)).length;ue(),0<e?(a&&(a.value=e,a.dispatchEvent(new Event("input",{bubbles:!0})),a.dispatchEvent(new Event("change",{bubbles:!0}))),(()=>{const el=document.querySelector('input[name="descCn"]');el&&(el.value=e,el.dispatchEvent(new Event("input",{bubbles:!0})),el.dispatchEvent(new Event("change",{bubbles:!0})))})(),r&&r.checked&&(r.checked=!1,r.dispatchEvent(new Event("change",{bubbles:!0}))),K.textContent=`Đã chọn ${e} file`,K.style.cssText=`
                    color: #155724;
                    font-size: 13px;
                    margin-top: 6px;
                    margin-bottom: 10px;
                    display: block;
                    font-weight: 600;
                    padding-left: 4px;
                `):(K.textContent="",K.style.cssText="color: #6c757d; font-size: 13px; margin-top: 6px; margin-bottom: 10px; display: none; padding-left: 4px;"),ze.style.display="none"});const X=document.createElement("div"),_=(X.style.cssText="color: #495057; font-size: 14px; font-weight: 600; margin-top: 12px; margin-bottom: 10px; cursor: pointer; padding: 10px 12px; background: #e5e1da; border-radius: 8px; transition: background 0.2s; display: flex; align-items: center; justify-content: space-between;",X.innerHTML=`
            <div style="display: flex; align-items: center; gap: 8px;">

            <svg id="settingsGearIcon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#495057" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"></path>
            </svg>

                <span>Cài đặt</span>
            </div>

            <svg id="settingsChevronIcon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#495057" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s ease; transform: rotate(0deg);">
                <polyline points="6 9 12 15 18 9"></polyline>
            </svg>

        `,X.onmouseover=()=>{X.style.background="#d6cfc4"},X.onmouseout=()=>{k||(X.style.background="#e5e1da")},P.appendChild(X),document.createElement("div")),Le=(_.style.cssText=`
            padding-top: 0;
            border-top: 1px solid #d6cfc4;
            margin-bottom: 8px;
            width: 100%;
            box-sizing: border-box;
            display: none;
        `,P.appendChild(_),e=>{k=e;e=document.getElementById("settingsChevronIcon");k?(n=Z.style.display,o=Q.style.display,l=ee.style.display,_.style.display="block",X.style.background="#d6cfc4",e&&(e.style.transform="rotate(180deg)"),G.style.display="none",J.style.display="none",Z.style.display="none",Q.style.display="none",ee.style.display="none"):(G.style.display="flex",J.style.display=T?"flex":"none",Z.style.display=n,Q.style.display=o,ee.style.display=l,_.style.display="none",X.style.background="#e5e1da",e&&(e.style.transform="rotate(0deg)"))});X.onclick=()=>Le(!k);const Be=()=>{var e={filterWords:g.value.trim(),dashFilter:x,duplicateFilter:u};try{localStorage.setItem(Ce,JSON.stringify(e))}catch(e){console.error("Lỗi khi lưu cài đặt:",e)}};e=(e,t,n,o=null)=>{let i=e;const l=document.createElement("div");l.style.cssText=`
                padding: 10px 12px;
                background: #ffffff;
                border-radius: 6px;
                border: 1px solid #d6cfc4;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: flex-start;
                gap: 5px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.05);
                transition: all 0.2s;
                box-sizing: border-box;
            `,l.onmouseover=()=>{l.style.boxShadow="0 2px 6px rgba(0,0,0,0.08)",l.style.borderColor="#b8ad9f"},l.onmouseout=()=>{l.style.boxShadow="0 1px 3px rgba(0,0,0,0.05)",l.style.borderColor="#d6cfc4"};e=document.createElement("div");e.style.cssText="display: flex; align-items: center; gap: 10px; width: 100%;";const a=document.createElement("div"),r=(a.style.cssText=`
                width: 18px;
                height: 18px;
                border: 2px solid ${i?"#28a745":"#d6cfc4"};
                border-radius: 4px;
                background: ${i?"#28a745":"#ffffff"};
                flex-shrink: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.2s ease-out;
                box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            `,document.createElement("div"));r.innerHTML=`
                <svg width="14" height="14" viewBox="0 0 16 16" fill="white" stroke="white" stroke-width="1">
                    <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"></path>
                </svg>
            `,r.style.cssText=`
                opacity: ${i?"1":"0"};
                transform: scale(${i?"1":"0.5"});
                transition: opacity 0.2s ease-out, transform 0.2s ease-out;
                display: flex;
                align-items: center;
                justify-content: center;
            `,a.appendChild(r);var s=document.createElement("span");s.textContent=t,s.style.cssText="color: #495057; font-size: 14px; flex: 1;",e.appendChild(a),e.appendChild(s),l.appendChild(e),o&&((t=document.createElement("div")).textContent=o,t.style.cssText="color: #6c757d; font-size: 11px; margin-top: 2px; padding-left: 28px; line-height: 1.3;",l.appendChild(t));const d=e=>{e?(a.style.background="#28a745",a.style.borderColor="#28a745",r.style.opacity="1",r.style.transform="scale(1)"):(a.style.background="#ffffff",a.style.borderColor="#d6cfc4",r.style.opacity="0",r.style.transform="scale(0.5)")};return l.onclick=()=>{i=!i,d(i),n(i),Be()},{wrapper:l,isChecked:()=>i,setState:e=>{i=e,d(i),n(i)}}};const Ie=e(!0,"Xóa mô tả sau dấu (-)",e=>{x=e}),$e=(Ie.wrapper.style.marginTop="10px",Ie.wrapper.style.marginBottom="8px",_.appendChild(Ie.wrapper),e(!0,"Xóa tên chương lặp",e=>{u=e},"(Ví dụ: 第1章 第1章 thành 第1章)"));$e.wrapper.style.marginTop="0px",$e.wrapper.style.marginBottom="10px",_.appendChild($e.wrapper);A=document.createElement("div"),$=(A.textContent="Xóa Từ/Cụm từ thừa trong tên chương (cách nhau bằng dấu phẩy):",A.style.cssText="color: #495057; font-size: 13px; margin-bottom: 6px; padding-left: 4px; margin-top: 5px;",_.appendChild(A),(g=document.createElement("input")).type="text",g.placeholder="Ví dụ: [VIP], C1",g.id="chapterFilterInput",g.style.cssText=`
            width: 100%;
            padding: 10px;
            margin-bottom: 4px;
            border: 1px solid #d6cfc4;
            border-radius: 6px;
            font-size: 14px;
            color: #495057;
            box-sizing: border-box;
            background-color: #ffffff;
        `,g.value="[VIP]",_.appendChild(g),document.createElement("div"));$.textContent="(Có phân biệt chữ hoa/thường)",$.style.cssText="color: #6c757d; font-size: 11px; margin-bottom: 10px; padding-left: 5px;",_.appendChild($),g.oninput=Be;const G=document.createElement("button");G.style.cssText=`
            background: #28a745;
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(40,167,69,0.3), 0 4px 8px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
        `;e=document.createElement("span");e.innerHTML=`
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
        `,e.style.verticalAlign="middle",G.appendChild(e);const Ae=document.createElement("span"),J=(Ae.textContent="Bắt đầu upload",G.appendChild(Ae),G.onmouseover=()=>{G.style.background="#218838",G.style.transform="translateY(-2px)",G.style.boxShadow="0 4px 8px rgba(40,167,69,0.4), 0 6px 12px rgba(0,0,0,0.15)"},G.onmouseout=()=>{G.style.background="#28a745",G.style.transform="translateY(0)",G.style.boxShadow="0 2px 4px rgba(40,167,69,0.3), 0 4px 8px rgba(0,0,0,0.1)"},P.appendChild(G),document.createElement("button")),Z=(J.style.cssText=`
            background: #dc3545;
            color: white;
            border: none;
            padding: 12px 16px;
            border-radius: 8px;
            cursor: pointer;
            width: 100%;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
            box-shadow: 0 2px 4px rgba(220,53,69,0.3), 0 4px 8px rgba(0,0,0,0.1);
            display: none;
            align-items: center;
            justify-content: center;
            gap: 8px;
            margin-top: 8px;
        `,J.innerHTML=`
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2"/>
            </svg>
            <span>Dừng upload</span>
        `,J.onmouseover=()=>{J.style.background="#c82333",J.style.transform="translateY(-2px)",J.style.boxShadow="0 4px 8px rgba(220,53,69,0.4), 0 6px 12px rgba(0,0,0,0.15)"},J.onmouseout=()=>{J.style.background="#dc3545",J.style.transform="translateY(0)",J.style.boxShadow="0 2px 4px rgba(220,53,69,0.3), 0 4px 8px rgba(0,0,0,0.1)"},J.onclick=()=>{E=!1,T=!1,J.style.display="none",Ae.textContent="Bắt đầu upload",G.style.background="#28a745",G.style.boxShadow="0 2px 4px rgba(40,167,69,0.3), 0 4px 8px rgba(0,0,0,0.1)",Z.style.display="none";const e=document.createElement("div");e.style.cssText="margin-top:10px; margin-bottom:10px; font-size:14px; background:#fff3cd; color:#856404; border:1px solid #ffeeba; padding:10px 12px; border-radius:8px; font-weight:600; text-align:center;",e.textContent=`⛔ Đã dừng. Đã xử lý ${z}/${I} file.`,P.insertBefore(e,Z),setTimeout(()=>e.remove(),5e3)},P.appendChild(J),document.createElement("div")),He=(Z.style.cssText=`
            margin-top: 12px;
            font-size: 13px;
            color: #495057;
            background: #ffffff;
            border-radius: 8px;
            border: 1px solid #d6cfc4;
            display: none;
            padding: 12px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
        `,P.appendChild(Z),document.createElement("div"));Z.appendChild(He);A=document.createElement("div");A.style.cssText="height: 8px; background: #e9ecef; border-radius: 4px; margin-top: 8px; overflow: hidden;",Z.appendChild(A);const Fe=document.createElement("div"),Q=(Fe.style.cssText="height: 100%; width: 0%; background: #28a745; transition: width 0.3s ease; border-radius: 4px;",A.appendChild(Fe),document.createElement("div")),ee=(Q.style.cssText=`
            margin-top: 10px;
            margin-bottom: 10px;
            font-size: 14px;
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            padding: 10px 12px;
            border-radius: 8px;
            font-weight: 600;
            display: none;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            text-align: center;
        `,P.appendChild(Q),document.createElement("div")),te=(ee.style.cssText=`
            font-size: 13px;
            color: #495057;
            max-height: 200px;
            overflow-y: auto;
            padding: 12px;
            background: #ffffff;
            border-radius: 8px;
            border: 1px solid #d6cfc4;
            display: none;
            line-height: 1.6;
            box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
        `,P.appendChild(ee),Se.appendChild(P),document.createElement("div"));te.style.cssText="display: none; width: 100%; padding-bottom: 16px;";$=document.createElement("div"),e=($.style.cssText="margin-top: 12px; margin-bottom: 12px;",document.createElement("input")),A=(e.type="file",e.id="splitFileInput",e.accept=".txt",e.style.display="none",document.createElement("label"));A.setAttribute("for","splitFileInput"),A.style.cssText=`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #ffffff;
    color: #495057;
    padding: 12px;
    border-radius: 8px;
    cursor: pointer;
    text-align: center;
    font-size: 14px;
    font-weight: 500;
    transition: all 0.2s;
    border: 1px solid #d6cfc4;
    box-shadow: 0 2px 4px rgba(0,0,0,0.05);
`,A.innerHTML=`
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
        <polyline points="13 2 13 9 20 9"/>
    </svg>
    <span>Chọn file</span>
`,$.appendChild(e),$.appendChild(A),te.appendChild($);const Re=document.createElement("div");Re.style.cssText="color: #6c757d; font-size: 13px; margin-bottom: 12px; display: none; padding: 0 4px;",te.appendChild(Re);A=document.createElement("div"),$=(A.style.cssText="margin-bottom: 12px; padding: 0 4px;",document.createElement("div"));$.textContent="Chọn Rule Chia:",$.style.cssText="color: #495057; font-size: 13px; margin-bottom: 6px; font-weight: 600;",A.appendChild($);const ne=document.createElement("select"),oe=(ne.style.cssText=`
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            appearance: auto !important;
            -webkit-appearance: auto !important;
            width: 100%;
            padding: 8px;
            border: 1px solid #d6cfc4;
            border-radius: 6px;
            font-size: 14px;
            color: #333;
            background-color: #ffffff;
            min-height: 38px;
        `,ne.innerHTML=`
    <option value="blankLines">Rule 1: Theo số dòng trắng</option>
    <option value="regex1">Rule 2: Chương/Hồi (第.*章)</option>
    <option value="novelDownloader">Rule 3: Novel Downloader (======)</option>
`,A.appendChild(ne),te.appendChild(A),document.createElement("div"));oe.style.cssText="margin-bottom: 12px; padding: 0 4px; display: block;";$=document.createElement("div");$.textContent="Số dòng trắng giữa các chương:",$.style.cssText="color: #495057; font-size: 13px; margin-bottom: 6px; font-weight: 600;",oe.appendChild($);const ie=document.createElement("input");ie.type="number",ie.min="1",ie.value="1",ie.style.cssText=`
    width: 100%;
    padding: 8px;
    border: 1px solid #d6cfc4;
    border-radius: 6px;
    font-size: 14px;
`,oe.appendChild(ie),te.appendChild(oe);A=document.createElement("div"),$=(A.style.cssText="margin-bottom: 6px; padding: 0 4px;",document.createElement("div"));$.textContent="Số file bắt đầu:",$.style.cssText="color: #495057; font-size: 13px; margin-bottom: 6px; font-weight: 600;",A.appendChild($);const le=document.createElement("input");le.type="number",le.min="0",le.value="0",le.style.cssText=`
    width: 100%;
    padding: 8px;
    border: 1px solid #d6cfc4;
    border-radius: 6px;
    font-size: 14px;
`,A.appendChild(le),te.appendChild(A);$=document.createElement("div"),A=($.style.cssText="margin-bottom: 12px; padding: 0 4px;",document.createElement("div"));A.textContent="Bảng mã file:",A.style.cssText="color: #495057; font-size: 13px; margin-bottom: 6px; font-weight: 600;",$.appendChild(A);const Ue=document.createElement("select"),ae=(Ue.style.cssText=`
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            appearance: auto !important;
            -webkit-appearance: auto !important;
            width: 100%;
            padding: 8px;
            border: 1px solid #d6cfc4;
            border-radius: 6px;
            font-size: 14px;
            color: #333;
            background-color: #ffffff;
            min-height: 38px;
        `,Ue.innerHTML=`
    <option value="UTF-8">UTF-8 (Mặc định)</option>
    <option value="UTF-16LE">UTF-16 LE</option>
    <option value="UTF-16BE">UTF-16 BE</option>
    <option value="GBK">GBK (简体中文)</option>
    <option value="Big5">Big5 (繁體中文)</option>
    <option value="Shift_JIS">Shift JIS (日本語)</option>
`,$.appendChild(Ue),te.appendChild($),document.createElement("button")),re=(ae.innerHTML=`
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
                <circle cx="6" cy="6" r="3"></circle>
                <circle cx="6" cy="18" r="3"></circle>
                <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
            </svg>
            Chia Chương
        `,ae.style.cssText=`
    width: 100%;
    padding: 12px;
    background: #007bff;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 12px;
`,ae.onmouseover=()=>{ae.style.background="#0056b3"},ae.onmouseout=()=>{ae.style.background="#007bff"},te.appendChild(ae),document.createElement("div"));re.style.cssText="display: none;",te.appendChild(re);A=document.createElement("div"),$=(A.style.cssText="padding: 12px 4px 8px 4px; border-top: 2px solid #e5e1da; margin-top: 12px;",document.createElement("div"));$.style.cssText="color: #495057; font-size: 13px; font-weight: 600; margin-bottom: 8px;",$.textContent="Kết quả:",A.appendChild($);const We=document.createElement("div");We.style.cssText="color: #6c757d; font-size: 12px; margin-bottom: 8px;",A.appendChild(We);$=document.createElement("div");$.style.cssText="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;";const se=document.createElement("input");se.type="checkbox",se.id="selectAllCheckbox",se.checked=!0,se.style.cssText="width: 16px; height: 16px; cursor: pointer; accent-color: #007bff;";var H=document.createElement("label"),H=(H.setAttribute("for","selectAllCheckbox"),H.textContent="Chọn tất cả",H.style.cssText="font-size: 13px; font-weight: 600; color: #495057; cursor: pointer; user-select: none;",$.appendChild(se),$.appendChild(H),A.appendChild($),document.createElement("div")),$=(H.style.cssText="display: flex; gap: 12px; margin-bottom: 8px; align-items: center;",document.createElement("div")),he=($.style.cssText="display: flex; flex-direction: column; gap: 8px; flex: 1;",document.createElement("div")),F=(he.style.cssText="display: flex; align-items: center; gap: 8px;",document.createElement("span"));F.textContent="Từ:",F.style.cssText="color: #495057; font-weight: 500; font-size: 13px; width: 40px;";const qe=document.createElement("input");qe.type="number",qe.min="0",qe.placeholder="0",qe.style.cssText="flex: 1; padding: 8px; border: 1px solid #d6cfc4; border-radius: 4px; font-size: 13px; height: 36px; box-sizing: border-box;",he.appendChild(F),he.appendChild(qe);var F=document.createElement("div"),R=(F.style.cssText="display: flex; align-items: center; gap: 8px;",document.createElement("span"));R.textContent="Đến:",R.style.cssText="color: #495057; font-weight: 500; font-size: 13px; width: 40px;";const je=document.createElement("input"),de=(je.type="number",je.min="0",je.placeholder="Cuối",je.style.cssText="flex: 1; padding: 8px; border: 1px solid #d6cfc4; border-radius: 4px; font-size: 13px; height: 36px; box-sizing: border-box;",F.appendChild(R),F.appendChild(je),$.appendChild(he),$.appendChild(F),document.createElement("button")),pe=(de.textContent="Áp dụng",de.style.cssText="padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; font-size: 13px; cursor: pointer; transition: all 0.2s; height: 82px; min-width: 80px;",de.onmouseover=()=>{de.style.background="#0056b3"},de.onmouseout=()=>{de.style.background="#007bff"},H.appendChild($),H.appendChild(de),A.appendChild(H),re.appendChild(A),document.createElement("div")),Oe=(pe.style.cssText=`
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #d6cfc4;
            border-radius: 6px;
            padding: 8px;
            background: #fafaf8;
            margin-bottom: 12px;
        `,re.appendChild(pe),document.createElement("div"));Oe.style.cssText="color: #495057; font-size: 13px; font-weight: 600; margin-bottom: 12px; padding: 0 4px;",re.appendChild(Oe);R=document.createElement("div");R.style.cssText="display: flex; gap: 8px; margin-bottom: 12px;";const ce=document.createElement("button"),xe=(ce.innerHTML="Tải ZIP",ce.style.cssText=`
    flex: 1;
    padding: 12px;
    background: #17a2b8;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
`,ce.onmouseover=()=>{ce.style.background="#138496"},ce.onmouseout=()=>{ce.style.background="#17a2b8"},document.createElement("button"));function ge(){var e=pe.querySelectorAll('input[type="checkbox"]'),t=Array.from(e).filter(e=>e.checked).length;Oe.textContent=`Đã chọn: ${t}/${e.length} chương`}function ye(){var e=pe.querySelectorAll('input[type="checkbox"]:checked');return Array.from(e).map(e=>{e=parseInt(e.dataset.chapterIndex);return s[e]})}xe.innerHTML="Upload",xe.style.cssText=`
    flex: 1;
    padding: 12px;
    background: #28a745;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
`,xe.onmouseover=()=>{xe.style.background="#218838"},xe.onmouseout=()=>{xe.style.background="#28a745"},R.appendChild(ce),R.appendChild(xe),re.appendChild(R),Se.appendChild(te),ne.onchange=()=>{"blankLines"===ne.value?oe.style.display="block":oe.style.display="none"},O.onclick=()=>{h="upload",O.style.borderBottomColor="#28a745",O.style.color="#28a745",D.style.borderBottomColor="transparent",D.style.color="#6c757d",P.style.display="block",te.style.display="none"},D.onclick=()=>{h="split",D.style.borderBottomColor="#007bff",D.style.color="#007bff",O.style.borderBottomColor="transparent",O.style.color="#6c757d",te.style.display="block",P.style.display="none"},e.onchange=e=>{(d=e.target.files[0])&&(Re.textContent="📄 "+d.name,Re.style.display="block",re.style.display="none")},document.body.appendChild(U),ae.onclick=async()=>{if(d){ae.disabled=!0,ae.textContent="⏳ Đang chia...";try{var t,n=await new Promise((t,e)=>{var n=new FileReader;n.onload=e=>t(e.target.result),n.onerror=e,n.readAsText(d,Ue.value)}),o=ne.value,i=parseInt(le.value)||0;let e=[];"regex1"===o?e=await async function(t,n){for(var e,o,i,l=/^\s*(?:番外|第\s{0,4}[\d〇零一二两三四五六七八九十百千万壹贰叁肆伍陆柒捌玖拾佰仟]+\s{0,4}[章节回]).*$/gm,a=[],r=[];null!==(e=l.exec(t));)r.push({index:e.index,title:e[0].trim()});0<r.length&&0<r[0].index&&0<(o=t.substring(0,r[0].index).trim()).length&&(i=o.split("\n")[0].trim()||"Giới thiệu",a.push({number:n,title:i,content:o}));var s=0<r.length&&0<r[0].index&&0<t.substring(0,r[0].index).trim().length?1:0;for(let e=0;e<r.length;e++){var d=r[e].index,p=e<r.length-1?r[e+1].index:t.length,d=t.substring(d,p).trim(),p=d.split("\n")[0].trim();a.push({number:n+s+e,title:p,content:d})}return a}(n,i):"blankLines"===o?(t=parseInt(ie.value)||2,e=await async function(e,t,n){var o=[],i=e.split("\n");let l=[],a=0,r=n;for(let e=0;e<i.length;e++){var s,d,p=i[e];""===p.trim()?a++:(a>=t&&l.length>t&&(0<(s=l.join("\n").trim()).length&&(d=s.split("\n")[0].trim()||"Chương "+r,o.push({number:r,title:d,content:s}),r++),l=[]),a=0),l.push(p)}return 0<l.length&&0<(e=l.join("\n").trim()).length&&(n=e.split("\n")[0].trim()||"Chương "+r,o.push({number:r,title:n,content:e})),o}(n,t,i)):"novelDownloader"===o&&(e=await async function(e,t){var n=[],o=e.split(/\n={5,}\n/g);for(let e=0;e<o.length;e++){var i,l=o[e].trim();0!==l.length&&(i=l.split("\n")[0].trim()||"Chương "+(t+e),n.push({number:t+e,title:i,content:l}))}return n}(n,i)),0===e.length?alert("Không tìm thấy chương nào! Vui lòng kiểm tra lại rule."):(s=e,We.textContent=`Tổng: ${e.length} chương`,pe.innerHTML="",e.forEach((e,t)=>{var n=document.createElement("div");n.style.cssText="display: flex; align-items: center; gap: 8px; padding: 6px; border-bottom: 1px solid #e5e1da;";const o=document.createElement("input");o.type="checkbox",o.checked=!0,o.dataset.chapterIndex=t,o.style.cssText="cursor: pointer; accent-color: #007bff;";var t=document.createElement("label"),i=40<e.title.length?e.title.substring(0,40)+"...":e.title;t.textContent=e.number+". "+i,t.style.cssText="flex: 1; font-size: 13px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;",t.title=e.number+". "+e.title,t.onclick=()=>{o.checked=!o.checked,ge()},n.appendChild(o),n.appendChild(t),pe.appendChild(n)}),re.style.display="block",(()=>{const firstCb=pe.querySelector('input[type="checkbox"]');firstCb&&(firstCb.checked=!1)})(),ge())}catch(e){alert("Lỗi khi chia chương: "+e.message),console.error(e)}finally{ae.disabled=!1,ae.innerHTML=`
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
                        <circle cx="6" cy="6" r="3"></circle>
                        <circle cx="6" cy="18" r="3"></circle>
                        <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                        <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                        <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
                    </svg>
                    Chia Chương
                `}}else alert("Vui lòng chọn file gốc!")},se.onchange=()=>{const t=se.checked;pe.querySelectorAll('input[type="checkbox"]').forEach(e=>e.checked=t),ge()},de.onclick=()=>{const n=parseInt(qe.value)||0,o=parseInt(je.value)||s.length-1;pe.querySelectorAll('input[type="checkbox"]').forEach((e,t)=>{t=s[t].number;e.checked=t>=n&&t<=o}),ge()},ce.onclick=async()=>{var e=ye();if(0===e.length)alert("Vui lòng chọn ít nhất 1 chương!");else try{ce.disabled=!0,ce.textContent="⏳ Đang nén...";const l=new JSZip;e.forEach(e=>{var t=String(e.number).padStart(5,"0")+".txt";l.file(t,e.content)});var t=await l.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}}),n=d?d.name.replace(/\.txt$/i,"_chapters.zip"):"chapters.zip",o=URL.createObjectURL(t),i=document.createElement("a");i.href=o,i.download=n,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(o),ce.disabled=!1,ce.textContent="Tải ZIP"}catch(e){console.error("Lỗi khi tạo ZIP:",e),alert("Lỗi khi tạo file ZIP: "+e.message),ce.disabled=!1,ce.textContent="Tải ZIP"}},xe.onclick=()=>{var e=ye();0===e.length?alert("Vui lòng chọn ít nhất 1 chương!"):(t=e.map(e=>{var t=new Blob([e.content],{type:"text/plain"});return new File([t],e.number+".txt",{type:"text/plain"})}),O.click(),ue(),a&&(a.value=t.length,a.dispatchEvent(new Event("input",{bubbles:!0})),a.dispatchEvent(new Event("change",{bubbles:!0}))),(()=>{const el=document.querySelector('input[name="descCn"]');el&&(el.value=t.length,el.dispatchEvent(new Event("input",{bubbles:!0})),el.dispatchEvent(new Event("change",{bubbles:!0})))})(),r&&r.checked&&(r.checked=!1,r.dispatchEvent(new Event("change",{bubbles:!0}))),K.textContent=`Đã chọn ${t.length} file từ Chia Chương`,K.style.cssText=`
        color: #155724;
        font-size: 13px;
        margin-top: 6px;
        margin-bottom: 10px;
        display: block;
        font-weight: 600;
        padding-left: 4px;
        background: #d4edda;
        padding: 8px;
        border-radius: 4px;
    `,ze.innerHTML="<strong>Danh sách chương:</strong><br>"+e.map((e,t)=>t+1+". "+e.title).join("<br>"),ze.style.display="block")},console.log("[Wiki Tool] Control panel added to body"),console.log("[Wiki Tool] minimizeBtn display:",W.style.display),console.log("[Wiki Tool] controlPanel position:",U.style.left,U.style.top),console.log("[Wiki Tool] isMinimized:",i),U.addEventListener("mousedown",e=>{var t;!i&&(e.target.closest("input")||e.target.closest("label")||e.target.closest("button")||e.target.closest("select")||e.target.closest("#chapterFilterInput")||e.target.closest(".checkbox-wrapper"))||(w=!0,C=!1,y=e.clientX,f=e.clientY,t=U.getBoundingClientRect(),b=t.left,v=t.top,U.style.cursor="grabbing",U.style.transition="none",e.preventDefault())}),document.addEventListener("mousemove",e=>{var t,n,o;w&&(o=e.clientX-y,e=e.clientY-f,(5<Math.abs(o)||5<Math.abs(e))&&(C=!0),o=b+o,e=v+e,n=U.getBoundingClientRect(),t=window.innerWidth-n.width-20,n=window.innerHeight-n.height-20,o=Math.max(20,Math.min(o,t)),e=Math.max(20,Math.min(e,n)),U.style.left=o+"px",U.style.top=e+"px",U.style.right="auto")}),document.addEventListener("mouseup",()=>{w&&(w=!1,U.style.cursor="move",U.style.transition="all 0.3s ease")}),window.addEventListener("resize",()=>{var e,t,n,o;i&&!C?(t=.05*window.innerWidth,t=window.innerWidth-ke-t,U.style.left=t+"px"):i||(n=(t=U.getBoundingClientRect()).left,o=t.top,e=window.innerWidth-t.width-20,t=window.innerHeight-t.height-20,n=Math.max(20,Math.min(n,e)),o=Math.max(20,Math.min(o,t)),U.style.left=n+"px",U.style.top=o+"px",U.style.right="auto")});const De=()=>{if(!w)if(i&&C)C=!1;else{i=!i;var e,t=U.getBoundingClientRect();let n=t.left,o=t.top;U.style.transition="none",i?(t=t.width,q.style.display="none",Ee.style.display="none",P.style.display="none",te.style.display="none",U.style.display="flex",U.style.flexDirection="row",U.style.minWidth="56px",U.style.maxWidth="56px",U.style.padding="0",U.style.background="#2c3e50",U.style.borderRadius="50%",U.style.width="56px",U.style.height="56px",U.style.border="none",W.style.display="flex",t=t-ke,n+=t,t=window.innerWidth-56-20,e=window.innerHeight-56-20,n=Math.max(20,Math.min(n,t)),o=Math.max(20,Math.min(o,e)),U.style.left=n+"px",U.style.top=o+"px",U.style.right="auto",setTimeout(()=>{U.style.transition="all 0.3s ease"},50)):(t=n,U.style.display="flex",U.style.flexDirection="column",U.style.minWidth="340px",U.style.maxWidth="340px",U.style.padding="24px",U.style.background="#ffffff",U.style.borderRadius="12px",U.style.width="auto",U.style.height="auto",U.style.display="flex",U.style.flexDirection="column",U.style.border="1px solid rgba(0,0,0,0.08)",W.style.display="none",q.style.display="flex",Ee.style.display="flex","upload"===h?(P.style.display="block",te.style.display="none"):(P.style.display="none",te.style.display="block"),n=t-284,setTimeout(()=>{var e=U.getBoundingClientRect(),t=window.innerWidth-e.width-20,e=window.innerHeight-e.height-20,t=(n=Math.max(20,Math.min(n,t)),o=Math.max(20,Math.min(o,e)),U.style.left=n+"px",U.style.top=o+"px",U.style.right="auto",parseInt(U.style.top)),e=window.innerHeight-t-40,t=Math.max(300,Math.min(e,600));U.style.maxHeight=t+"px",Se.style.maxHeight=t-140+"px",U.style.transition="all 0.3s ease"},10)),C=C&&!1}};W.onclick=e=>{e.stopPropagation(),De()};let T=!(j.onclick=e=>{e.stopPropagation(),De()}),E=!1,S,M=[],z=0,L=0,B=0,I=0;function fe(e){var t=0<I?Math.floor(e/I*100):0;He.textContent=`Đang xử lý: ${e}/${I} file (${t}%)`,Fe.style.width=t+"%"}function be(e=!1){ee.style.display="block",e?(Z.style.display="none",Q.textContent="✅ Xử lý Hoàn tất.",Q.style.display="block",Ae.textContent="Bắt đầu upload",G.style.background="#28a745",G.style.boxShadow="0 2px 4px rgba(40,167,69,0.3), 0 4px 8px rgba(0,0,0,0.1)",T=!1,J.style.display="none",setTimeout(()=>{Q.style.display="none"},5e3),(()=>{const btn=document.getElementById("lblGetBtn");btn&&btn.scrollIntoView({behavior:"smooth",block:"center"})})()):(Z.style.display="block",Q.style.display="none",J.style.display="flex")}async function ve(){if(0!==M.length&&E){var{form:e,file:n,index:o}=M.shift();let t="";var d,i=n.name;try{t=(d=n,await new Promise(s=>{var e=new FileReader;e.onload=e=>{let t=e.target.result;var n;let o="";for(n of(t=65279===t.charCodeAt(0)?t.substring(1):t).split("\n")){var i=n.trim();if(0<i.length){o=i;break}}if(0===o.length)s(d.name.replace(/\.txt$/i,""));else{var e=o.indexOf("||"),e=(o=(o=-1!==e?o.substring(e+2).trim():o).replace(/\s+/g," ").trim()).match(/(第\s*[一二三四五六七八九十百千万\d]+\s*章)/i),l=o.match(/(chapter\s*\d+|part\s*\d+|c\s*\d+)/i),e=(e&&l&&(e=l[0],l=new RegExp(e.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&"),"i"),o=o.replace(l,"").trim()),g.value.trim().split(",").map(e=>e.trim()).filter(e=>0<e.length));if(0<e.length){let t=o;e.forEach(e=>{e=e.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&"),e=new RegExp(`\\s*${e}\\s*`,"g");t=t.replace(e," ").trim()}),o=t.replace(/\s+/g," ").trim()}if(x&&-1!==(l=o.indexOf(" - "))&&(o=o.substring(0,l).trim()),u){var a=[];for(const r of(o=o.replace(/(第\s*\S+?\s*章)\s+(第\s*\S+?\s*章)/g,"$1")).split(/\s+/).filter(e=>0<e.length))0!==a.length&&a[a.length-1]===r||a.push(r);o=a.join(" ")}s(o)}},e.readAsText(d,m)}))}catch(e){t=i.replace(/\.txt$/i,""),console.error(`[Wiki Upload ERROR] Lỗi khi đọc file ${i}:`,e)}fe(++z);var l=e.fileInput,e=e.nameInput;try{var a=new DataTransfer,r=(a.items.add(n),l.files=a.files,l.dispatchEvent(new Event("change",{bubbles:!0})),l.dispatchEvent(new Event("input",{bubbles:!0})),e.value=t,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),await new Promise(e=>setTimeout(e,50)),L++,document.createElement("div"));r.style.cssText="color: #495057;",r.innerHTML=`
                    <span style="color: #28a745; font-weight: 700; margin-right: 5px;">✔</span>
                    ${t}
                `,ee.firstChild?ee.insertBefore(r,ee.firstChild):ee.appendChild(r)}catch(e){B++,console.error(`[Wiki Upload CRITICAL ERROR] File ${o} (${i}): `+e.message,e);n=document.createElement("div");n.style.cssText="color: #721c24;",n.innerHTML=`
                    <span style="color: #dc3545; font-weight: 700; margin-right: 5px;">✘</span>
                    Lỗi xử lý file: ${i}
                `,ee.firstChild?ee.insertBefore(n,ee.firstChild):ee.appendChild(ee)}"none"===ee.style.display&&(ee.style.display="block"),ee.scrollTop=ee.scrollHeight,setTimeout(ve,50)}else be(!(E=!1))}G.onclick=()=>{if(!T)if(S=p?Array.from(p.querySelectorAll(".chapter-info-wrapper")).map(e=>{var t=e.querySelector('input[name="name"][type="text"]'),n=e.querySelector('input[type="file"][name="file"]');return t&&n&&null!==e.offsetParent?{nameInput:t,fileInput:n}:null}).filter(e=>null!==e):[],0===t.length)alert("Vui lòng chọn file TXT để upload.");else if(p&&"-1"!==V.value)if(0===S.length)alert("Không tìm thấy ô nhập liệu chương trong Quyển đã chọn. Vui lòng đảm bảo Quyển này đã được bật chức năng Thêm chương hoặc Bổ sung.");else{if(t.length>S.length)if(!confirm(`Bạn đã chọn ${t.length} file nhưng chỉ có ${S.length} ô nhập liệu chương. Chỉ có ${S.length} file đầu tiên được xử lý. Bạn có muốn tiếp tục không?`))return;Le(!1),T=!0,E=!0,L=0,B=0,z=0,I=Math.min(t.length,S.length),M=[],ee.innerHTML="";for(let e=ee.scrollTop=0;e<I;e++)M.push({form:S[e],file:t[e],index:e+1});Ae.textContent="Đang xử lý...",G.style.background="#007bff",G.style.boxShadow="0 2px 4px rgba(0,123,255,0.3), 0 4px 8px rgba(0,0,0,0.1)",be(),fe(0),ve()}else alert("Vui lòng chọn một Quyển hợp lệ để upload chương.")},(()=>{var e=localStorage.getItem(Ce);if(e)try{var t=JSON.parse(e);void 0!==t.dashFilter&&Ie.setState(t.dashFilter),void 0!==t.duplicateFilter&&$e.setState(t.duplicateFilter),void 0!==t.filterWords&&(g.value=t.filterWords)}catch(e){console.error("Lỗi khi đọc cài đặt từ localStorage:",e)}})(),he=document.body,new MutationObserver((e,t)=>{let n=!1;for(const o of e)if("childList"===o.type){if(Array.from(o.addedNodes).some(e=>1===e.nodeType&&(e.matches(".volume-info-wrapper")||e.querySelector(".volume-info-wrapper")))){n=!0;break}if(Array.from(o.removedNodes).some(e=>1===e.nodeType&&(e.matches(".volume-info-wrapper")||e.querySelector(".volume-info-wrapper")))){n=!0;break}}n&&(window.rebuildTimer&&clearTimeout(window.rebuildTimer),window.rebuildTimer=setTimeout(me,100))}).observe(he,{childList:!0,subtree:!0}),setTimeout(me,500)}function a(){var e=document.getElementById("listName");if(e){e=e.querySelectorAll("li");if(0===e.length)alert("Danh sách name trống!");else{let t="";e.forEach(e=>{e=e.textContent.trim();e&&(t+=e+"\n")});var n,o,e=function(){var e=window.location.pathname.split("/");let t=e[e.length-1]||e[e.length-2];return(!(t=t.split("#")[0].split("?")[0])||t.length<3)&&(e=document.querySelector("h1, .title, .story-title"),t=(e?e.textContent:document.title.split("-")[0]).trim()),(t=t.replace(/[<>:"/\\|?*]/g,"_"))||"truyen"}();n=t,e=`name2_${e}.txt`,n=new Blob([n],{type:"text/plain;charset=utf-8"}),(o=document.createElement("a")).href=URL.createObjectURL(n),o.download=e,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(o.href)}}else alert("Không tìm thấy danh sách name!")}function t(){if(!document.getElementById("btn-tai-name")&&document.getElementById("listName")){var e=Array.from(document.querySelectorAll("button, .btn, a")).find(e=>"Name"===e.textContent.trim());if(e){var t=document.createElement("div");t.style.cssText="display: block; margin-top: 10px;";const l=document.createElement("button");l.id="btn-tai-name",l.innerHTML=`
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span style="vertical-align: middle;">Tải Name</span>
            `,l.style.cssText=`
                margin: 0;
                padding: 10px 20px;
                background: linear-gradient(145deg, #2c2c2c, #1a1a1a);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3),
                            0 1px 3px rgba(0, 0, 0, 0.15),
                            inset 0 1px 0 rgba(255, 255, 255, 0.1);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                transform: translateY(0);
                position: relative;
                overflow: hidden;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                vertical-align: middle;
            `,l.addEventListener("click",e=>{e.preventDefault(),e.stopPropagation();const t=document.createElement("span");var n=l.getBoundingClientRect(),o=Math.max(n.width,n.height),i=e.clientX-n.left-o/2,e=e.clientY-n.top-o/2;t.style.cssText=`
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.6);
                    width: ${o}px;
                    height: ${o}px;
                    left: ${i}px;
                    top: ${e}px;
                    animation: ripple 0.6s ease-out;
                    pointer-events: none;
                `,l.appendChild(t),setTimeout(()=>t.remove(),600),a()}),l.addEventListener("mouseenter",()=>{l.style.background="linear-gradient(145deg, #3a3a3a, #2c2c2c)",l.style.boxShadow=`
                    0 4px 8px rgba(0, 0, 0, 0.4),
                    0 2px 4px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.15)
                `,l.style.transform="translateY(-2px)"}),l.addEventListener("mouseleave",()=>{l.style.background="linear-gradient(145deg, #2c2c2c, #1a1a1a)",l.style.boxShadow=`
                    0 3px 6px rgba(0, 0, 0, 0.3),
                    0 1px 3px rgba(0, 0, 0, 0.15),
                    inset 0 1px 0 rgba(255, 255, 255, 0.1)
                `,l.style.transform="translateY(0)"}),l.addEventListener("mousedown",()=>{l.style.transform="translateY(0) scale(0.96)",l.style.boxShadow=`
                    0 1px 3px rgba(0, 0, 0, 0.3),
                    0 1px 2px rgba(0, 0, 0, 0.15),
                    inset 0 1px 0 rgba(255, 255, 255, 0.08)
                `}),l.addEventListener("mouseup",()=>{l.style.transform="translateY(-2px) scale(1)"}),document.getElementById("ripple-animation")||((n=document.createElement("style")).id="ripple-animation",n.textContent=`
                    @keyframes ripple {
                        0% { transform: scale(0); opacity: 1; }
                        100% { transform: scale(2); opacity: 0; }
                    }
                `,document.head.appendChild(n)),t.appendChild(l);var n=window.innerWidth<=768,o=e.parentElement;n?(n=Array.from(document.querySelectorAll("button, .btn, a")).find(e=>"Đọc"===e.textContent.trim()||"Doc"===e.textContent.trim()))&&n.parentElement?(n.parentElement.insertBefore(t,n),t.style.display="inline-block",t.style.marginRight="8px",t.style.marginTop="0"):o&&o.parentElement.insertBefore(t,o.nextSibling):o?o.parentElement.insertBefore(t,o.nextSibling):e.after(t)}}}function n(){setTimeout(()=>{t()},1e3)}window.location.pathname.includes("truyen")&&("loading"===document.readyState?document.addEventListener("DOMContentLoaded",n):n(),new MutationObserver(()=>{document.getElementById("listName")&&!document.getElementById("btn-tai-name")&&t()}).observe(document.body,{childList:!0,subtree:!0}))}();
