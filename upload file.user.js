// ==UserScript==
// @name         Upload File (mở rộng)
// @namespace    http://tampermonkey.net/
// @version      4.0
// @author       Minty
// @description  upload chapter
// @match        *://*/nhung-file*
// @match        *://*/*chinh-sua*
// @match        */truyen/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js
// @grant        GM_xmlhttpRequest
// @connect      dichngay.com
// @downloadURL  https://github.com/miinty0/draft/raw/refs/heads/main/uploadfile.user.js
// @updateURL    https://github.com/miinty0/draft/raw/refs/heads/main/uploadfile.user.js
// ==/UserScript==

!function(){"use strict";if(window.location.pathname.includes("nhung-file")||window.location.pathname.includes("chinh-sua")){let i=!0,t=[],n,o,l,a,r,p=null,c=[];var CoverTabBtn;const we=new WeakMap;let x=!0,u=!0,nameSource="fileName";let m="UTF-8",s=[],d=null,h="upload",g,y,f,b,v,w=!1,C=!1;const ke=56;var e=.05*window.innerWidth,e=window.innerWidth-ke-e;function ue(){r=(p?(a=p.querySelector('input[name="numFile"][type="number"]'),p):(a=document.querySelector('input[name="numFile"][type="number"]'),document)).querySelector('input[name="autoNumber"][type="checkbox"]'),a&&r||(a=null,r=null)}function me(){const l=Array.from(document.querySelectorAll(".volume-info-wrapper")),a=p?p.getAttribute("data-volume-id"):null;let r=-1,s=(V.innerHTML='<option value="-1" disabled selected>-- Chọn quyển để thêm chương --</option>',-1),d=[];if(l.forEach((e,t)=>{let n=e.querySelector('input[name="nameCn"]');var o,i;n=n||e.querySelector('input[name="name"]'),!e.querySelector('input[name="numFile"][type="number"]')||!e.querySelector('input[name="autoNumber"][type="checkbox"]')||!n&&1<l.length&&t===l.length-1||(o=n&&""!==n.value.trim()?n.value.trim():"Quyển "+(t+1),e.setAttribute("data-volume-id","volume-"+t),i=n&&""!==n.value.trim(),d.push({wrapper:e,name:o,isNamed:i,originalIndex:t}),n&&!we.has(n)&&(n.addEventListener("input",Te),we.set(n,Te)))}),0===d.length)N.style.display="none",p=null;else{N.style.display="block";var e=d.filter(e=>e.isNamed||"true"===e.wrapper.querySelector(".volume-wrapper")?.getAttribute("data-append"));if(0===e.length)p=null,V.value="-1";else{c=[];let l=-1;e.forEach((e,t)=>{var{wrapper:e,name:n}=e,o=(c.push(e),e.querySelector(".volume-wrapper"));let i=n;o&&"true"===o.getAttribute("data-append")&&(i+=" (Bổ sung)",s=t),-1===l&&(l=t);n=document.createElement("option");n.value=String(t),n.textContent=t+1+". "+i,V.appendChild(n),a===e.getAttribute("data-volume-id")&&(r=t)}),-1!==r?(V.value=String(r),p=c[r]):(e=-1!==s?s:-1!==l?l:0,c[e]?(V.value=String(e),p=c[e]):(p=c[0]||null,V.value=p?"0":"-1"))}ue()}}const Te=function(t,n){let o;return function(...e){clearTimeout(o),o=setTimeout(()=>{t.apply(this,e)},n)}}(me,200),U=(document.createElement("div"));U.style.cssText=`
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
        `,e.appendChild(W),document.createElement("div"));q.style.cssText="display: none; justify-content: space-between; align-items: center; margin: 0 -16px 0 -16px; padding: 16px 16px 12px 16px; border-bottom: 2px solid #e5e1da; width: calc(100% + 32px); position: sticky; top: 0; background: #ffffff; z-index: 10; border-radius: 12px 12px 0 0;";var $=document.createElement("div"),A=($.style.cssText="display: flex; align-items: center; gap: 10px;",document.createElement("div")),A=(A.innerHTML=`
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
        `,$.appendChild(A),document.createElement("div"));A.textContent="Wiki Tools",A.style.cssText="color: #374151; font-size: 18px; font-weight: 600;",$.appendChild(A);const j=document.createElement("button"),Ee=(j.innerHTML=`
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#374151" stroke-width="2">
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
        `,j.onmouseover=()=>{j.style.background="#e5e1da"},j.onmouseout=()=>{j.style.background="transparent"},q.appendChild($),q.appendChild(j),e.appendChild(q),document.createElement("div"));Ee.style.cssText="display: none; margin: 0 -16px 0 -16px; padding: 0 16px 10px 16px; border-bottom: 2px solid #e5e1da; width: calc(100% + 32px); position: sticky; top: 50px; background: #ffffff; z-index: 9;";A=document.createElement("div");A.style.cssText="display: flex; gap: 0; width: 100%;";const O=document.createElement("button"),D=(O.textContent="Upload",O.style.cssText=`
    flex: 1 1 25%;
    max-width: 25%;
    padding: 10px 0;
    background: transparent;
    border: none;
    border-bottom: 3px solid #399F49;
    color: #399F49;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`,document.createElement("button")),TransTabBtn=(D.textContent="Chia",D.style.cssText=`
    flex: 1 1 25%;
    max-width: 25%;
    padding: 10px 0;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    color: #374151;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`,document.createElement("button")),Se=(TransTabBtn.textContent="Giới thiệu",TransTabBtn.style.cssText=`
    flex: 1 1 25%;
    max-width: 25%;
    padding: 10px 0;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    color: #374151;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`,(CoverTabBtn=document.createElement("button"),CoverTabBtn.textContent="Ảnh bìa",CoverTabBtn.style.cssText="flex: 1 1 25%; max-width: 25%; padding: 10px 0; background: transparent; border: none; border-bottom: 3px solid transparent; color: #374151; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;",A.appendChild(O),A.appendChild(D),A.appendChild(TransTabBtn),A.appendChild(CoverTabBtn),Ee.appendChild(A)),e.appendChild(Ee),document.createElement("div")),P=(Se.style.cssText="overflow-y: auto; overflow-x: hidden; flex: 1; min-height: 0; padding-bottom: 12px;",e.appendChild(Se),document.createElement("div")),N=(P.style.cssText="display: none; width: 100%; padding-bottom: 10px; box-sizing: border-box;",document.createElement("div"));N.style.cssText="margin-bottom: 8px; display: none; padding: 0 4px;";$=document.createElement("div");$.textContent="Chọn Quyển Upload:",$.style.cssText="color: #374151; font-size: 13px; margin-bottom: 6px; font-weight: 600;",N.appendChild($);const V=document.createElement("select");V.style.cssText=`
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            appearance: auto !important;
            -webkit-appearance: auto !important;
            width: 100%;
            padding: 6px;
            border: 1px solid #d6cfc4;
            border-radius: 6px;
            font-size: 14px;
            color: #374151;
            box-sizing: border-box;
            background-color: #ffffff;
            min-height: 38px;
            z-index: 10001;
        `,V.onchange=e=>{var e=parseInt(e.target.value),e=c[e],t=(p=e,ue(),e.querySelector(".volume-wrapper"));!(!t||"true"!==t.getAttribute("data-append"))&&(t=e.querySelector('.btn-add-volume[data-action="appendLastVolume"]'),e=e.querySelector(".append-last-volume"),t)&&e&&e.classList.contains("hide")&&t.click()},N.appendChild(V),P.appendChild(N);$=document.createElement("input");$.type="file",$.id="autoUploadFileInput",$.multiple=!0,$.accept=".txt,.zip",$.style.display="none",P.appendChild($);const Y=document.createElement("label");Y.setAttribute("for","autoUploadFileInput"),Y.style.cssText=`
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            background: #1C75E1;
            color: #ffffff;
            padding: 9px;
            border-radius: 8px;
            cursor: pointer;
            text-align: center;
            margin-bottom: 0;
            font-size: 14px;
            font-weight: 600;
            transition: all 0.2s;
            border: none;
            box-shadow: 0 2px 8px rgba(26,86,161,0.4);
        `;e=document.createElement("span"),A=(e.innerHTML=`
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
                <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
                <polyline points="13 2 13 9 20 9"/>
            </svg>
        `,Y.appendChild(e),document.createElement("span"));A.textContent="Chọn file",A.style.color="white",Y.appendChild(A),Y.onmouseover=()=>{Y.style.background="#153f7a",Y.style.borderColor="#153f7a",Y.style.transform="translateY(-1px)",Y.style.boxShadow="0 4px 12px rgba(26,86,161,0.5)"},Y.onmouseout=()=>{Y.style.background="#1C75E1",Y.style.borderColor="none",Y.style.transform="translateY(0)",Y.style.boxShadow="0 2px 8px rgba(26,86,161,0.4)"},P.appendChild(Y);(function(){var w=document.createElement("div");w.style.cssText="margin-top:6px;margin-bottom:8px;";var lb=document.createElement("div");lb.textContent="Tên chương lấy từ:";lb.style.cssText="font-size:12px;color:#374151;font-weight:600;margin-bottom:6px;";w.appendChild(lb);var row=document.createElement("div");row.style.cssText="display:flex;gap:6px;";var btns={};[{val:"firstLine",label:"📄 Dòng đầu file"},{val:"fileName",label:"📝 Tên file"}].forEach(function(opt){var btn=document.createElement("button");btn.type="button";btn.textContent=opt.label;btn.dataset.val=opt.val;var active=opt.val==="fileName";btn.style.cssText="flex:1;padding:8px 10px;font-size:12px;font-weight:600;border-radius:8px;cursor:pointer;transition:all 0.18s;border:2px solid "+(active?"#7952b3":"#d6cfc4")+";background:"+(active?"#7952b3":"#ffffff")+";color:"+(active?"#ffffff":"#374151")+";box-shadow:"+(active?"0 2px 6px rgba(121,82,179,0.28)":"none")+";";btn.addEventListener("click",function(){nameSource=opt.val;Object.keys(btns).forEach(function(k){var b=btns[k],on=k===opt.val;b.style.background=on?"#7952b3":"#ffffff";b.style.color=on?"#ffffff":"#374151";b.style.borderColor=on?"#7952b3":"#d6cfc4";b.style.boxShadow=on?"0 2px 6px rgba(121,82,179,0.28)":"none";b.style.transform=on?"translateY(-1px)":"translateY(0)";});});btn.addEventListener("mouseenter",function(){if(nameSource!==opt.val)btn.style.background="#f3f0f8";});btn.addEventListener("mouseleave",function(){if(nameSource!==opt.val)btn.style.background="#ffffff";});btns[opt.val]=btn;row.appendChild(btn);});w.appendChild(row);P.appendChild(w);})();const K=document.createElement("div"),ze=(K.style.cssText="color: #374151; font-size: 13px; margin-top: 6px; margin-bottom: 6px; display: none; padding-left: 4px;",P.appendChild(K),document.createElement("div"));ze.style.cssText="display: none; max-height: 150px; overflow-y: auto; background: #f8f9fa; border: 1px solid #d6cfc4; border-radius: 4px; padding: 8px; margin-bottom: 6px; font-size: 12px;",P.appendChild(ze);// Helper: extract txt files from zip
// Parse ZIP thuần túy không dùng JSZip (JSZip.entry.async bị block trong Tampermonkey sandbox)
async function _decompressDeflate(compressedBytes){
    const ds=new DecompressionStream("deflate-raw");
    const writer=ds.writable.getWriter();
    const reader=ds.readable.getReader();
    writer.write(compressedBytes);
    writer.close();
    const chunks=[];
    while(true){
        const {done,value}=await reader.read();
        if(done)break;
        chunks.push(value);
    }
    const total=chunks.reduce((s,c)=>s+c.byteLength,0);
    const out=new Uint8Array(total);
    let off=0;
    for(const c of chunks){out.set(c,off);off+=c.byteLength;}
    return out;
}
async function _extractTxtFromZip(zipFile){
    const arrayBuffer=await new Promise((resolve,reject)=>{
        const fr=new FileReader();
        fr.onload=()=>resolve(fr.result);
        fr.onerror=()=>reject(fr.error||new Error("FileReader error"));
        fr.readAsArrayBuffer(zipFile);
    });
    const buf=new Uint8Array(arrayBuffer);
    const view=new DataView(arrayBuffer);
    const files=[];
    let i=0;
    while(i<buf.length-4){
        // Local file header signature = 0x04034b50
        if(view.getUint32(i,true)!==0x04034b50){i++;continue;}
        const compression=view.getUint16(i+8,true);
        const compressedSize=view.getUint32(i+18,true);
        const fileNameLen=view.getUint16(i+26,true);
        const extraLen=view.getUint16(i+28,true);
        const fileNameBytes=buf.slice(i+30,i+30+fileNameLen);
        const fileName=new TextDecoder("utf-8").decode(fileNameBytes);
        const dataStart=i+30+fileNameLen+extraLen;
        const compressedData=buf.slice(dataStart,dataStart+compressedSize);
        i=dataStart+compressedSize;
        // Filter
        if(fileName.includes("__MACOSX")||fileName.includes(".DS_Store"))continue;
        const baseName=fileName.split("/").pop();
        if(!baseName||!baseName.match(/\.txt$/i))continue;
        let rawBytes;
        if(compression===0){
            rawBytes=compressedData;
        }else if(compression===8){
            rawBytes=await _decompressDeflate(compressedData);
        }else{
            continue; // compression method không hỗ trợ
        }
        const blob=new Blob([rawBytes],{type:"text/plain"});
        files.push(new File([blob],baseName,{type:"text/plain"}));
    }
    files.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:"base"}));
    return files;
}
// Helper: extract chapter title from filename (strip leading digits/underscores)
function _chapterTitleFromFile(f){
    return f.name.replace(/\.txt$/i,"").replace(/^\d+[_\-\s]*/,"").trim();
}
$.addEventListener("change",async e=>{
    const rawFiles=Array.from(e.target.files);
    // Separate zip vs txt
    const zipFiles=rawFiles.filter(f=>f.name.match(/\.zip$/i));
    let txtFiles=rawFiles.filter(f=>f.name.match(/\.txt$/i));
    if(zipFiles.length>0){
        K.textContent="⏳ Đang giải nén ZIP...";
        K.style.cssText="color:#856404;font-size:13px;margin-top:6px;margin-bottom:6px;display:block;font-weight:600;padding-left:4px;";
        try{
            // Khởi động TẤT CẢ FileReader song song NGAY LẬP TỨC (không await trước)
            // để tránh SecurityError do user activation timeout
            const zipPromises=zipFiles.map(zf=>_extractTxtFromZip(zf));
            const results=await Promise.all(zipPromises);
            results.forEach(extracted=>{txtFiles=txtFiles.concat(extracted);});
        }catch(err){
            K.textContent="❌ Lỗi giải nén ZIP: "+err.message;
            K.style.cssText="color:#dc3545;font-size:13px;margin-top:6px;margin-bottom:6px;display:block;font-weight:600;padding-left:4px;";
            return;
        }
        // Sort all txt files by name
        txtFiles.sort((a,b)=>a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:"base"}));
    }
    t=txtFiles;
    ue();
    const count=t.length;
    if(0<count){
        K.textContent=`Đã chọn ${count} file${zipFiles.length>0?" (từ ZIP)":""}`;
        K.style.cssText="color:#155724;font-size:13px;margin-top:6px;margin-bottom:6px;display:block;font-weight:600;padding-left:4px;";
        // Build range UI
        _buildRangeUI(t);
    }else{
        K.textContent="";
        K.style.cssText="color:#374151;font-size:13px;margin-top:6px;margin-bottom:6px;display:none;padding-left:4px;";
        _buildRangeUI([]);
    }
    ze.style.display="none";
});
// ── Range load UI ─────────────────────────────────────────────────────
const rangeContainer=document.createElement("div");
rangeContainer.style.cssText="display:none;margin-bottom:8px;padding:8px;background:#f0f4ff;border:1.5px solid #c3d4f8;border-radius:8px;box-sizing:border-box;";
const rangeLbl=document.createElement("div");
rangeLbl.style.cssText="font-size:12px;font-weight:700;color:#1e3a8a;margin-bottom:6px;display:flex;align-items:center;gap:5px;";
rangeLbl.innerHTML=`<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 6h16M4 12h10M4 18h7"/></svg> Load theo range chương`;
rangeContainer.appendChild(rangeLbl);
const rangeRow1=document.createElement("div");
rangeRow1.style.cssText="display:flex;align-items:center;gap:6px;margin-bottom:5px;";
const rangeFromLbl=document.createElement("span");
rangeFromLbl.textContent="Từ:";
rangeFromLbl.style.cssText="font-size:12px;color:#374151;font-weight:600;white-space:nowrap;min-width:24px;";
const rangeFromInput=document.createElement("input");
rangeFromInput.type="text";
rangeFromInput.placeholder="Tên chương đầu (VD: 第420章 掉河里了)";
rangeFromInput.style.cssText="flex:1;padding:6px 8px;font-size:12px;border:1.5px solid #c3d4f8;border-radius:6px;outline:none;box-sizing:border-box;";
rangeFromInput.addEventListener("focus",()=>{rangeFromInput.style.borderColor="#1C75E1";});
rangeFromInput.addEventListener("blur",()=>{rangeFromInput.style.borderColor="#c3d4f8";});
rangeRow1.appendChild(rangeFromLbl);
rangeRow1.appendChild(rangeFromInput);
rangeContainer.appendChild(rangeRow1);
const rangeRow2=document.createElement("div");
rangeRow2.style.cssText="display:flex;align-items:center;gap:6px;margin-bottom:6px;";
const rangeToLbl=document.createElement("span");
rangeToLbl.textContent="Đến:";
rangeToLbl.style.cssText="font-size:12px;color:#374151;font-weight:600;white-space:nowrap;min-width:24px;";
const rangeToInput=document.createElement("input");
rangeToInput.type="text";
rangeToInput.placeholder="Tên chương cuối (VD: 第422章 骗牛妞去打针)";
rangeToInput.style.cssText="flex:1;padding:6px 8px;font-size:12px;border:1.5px solid #c3d4f8;border-radius:6px;outline:none;box-sizing:border-box;";
rangeToInput.addEventListener("focus",()=>{rangeToInput.style.borderColor="#1C75E1";});
rangeToInput.addEventListener("blur",()=>{rangeToInput.style.borderColor="#c3d4f8";});
rangeRow2.appendChild(rangeToLbl);
rangeRow2.appendChild(rangeToInput);
rangeContainer.appendChild(rangeRow2);
const rangeApplyBtn=document.createElement("button");
rangeApplyBtn.style.cssText="width:100%;padding:7px;background:#1e3a8a;color:#fff;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;transition:all 0.18s;";
rangeApplyBtn.textContent="✂️ Lọc theo range";
rangeApplyBtn.onmouseover=()=>{rangeApplyBtn.style.background="#1e40af";};
rangeApplyBtn.onmouseout=()=>{rangeApplyBtn.style.background="#1e3a8a";};
const rangeStatus=document.createElement("div");
rangeStatus.style.cssText="font-size:11px;margin-top:5px;display:none;padding:4px 6px;border-radius:4px;";
rangeContainer.appendChild(rangeApplyBtn);
rangeContainer.appendChild(rangeStatus);
P.appendChild(rangeContainer);
let _allLoadedFiles=[];
function _buildRangeUI(files){
    _allLoadedFiles=files;
    if(files.length===0){rangeContainer.style.display="none";return;}
    rangeContainer.style.display="block";
    rangeFromInput.value="";rangeToInput.value="";
    rangeStatus.style.display="none";
}
function _normalizeTitle(s){return s.trim().replace(/\s+/g," ");}
rangeApplyBtn.onclick=()=>{
    const fromRaw=rangeFromInput.value.trim();
    const toRaw=rangeToInput.value.trim();
    if(!fromRaw&&!toRaw){
        // Reset: use all files
        t=_allLoadedFiles.slice();
        K.textContent=`Đã chọn ${t.length} file (tất cả)`;
        K.style.cssText="color:#155724;font-size:13px;margin-top:6px;margin-bottom:6px;display:block;font-weight:600;padding-left:4px;";
        rangeStatus.textContent="Đã reset về toàn bộ file.";
        rangeStatus.style.cssText="font-size:11px;margin-top:5px;display:block;padding:4px 6px;border-radius:4px;background:#d4edda;color:#155724;";
        return;
    }
    // Match by title: strip ONLY leading digits (0001_, 0002- etc.) from filename
    function titleOf(f){return _normalizeTitle(f.name.replace(/\.txt$/i,"").replace(/^\d+[_\-\s]*/,""));}
    const fromN=_normalizeTitle(fromRaw);
    const toN=_normalizeTitle(toRaw);
    // Find indices — exact match only
    let startIdx=-1,endIdx=-1;
    _allLoadedFiles.forEach((f,i)=>{
        const title=titleOf(f);
        if(fromN&&startIdx===-1&&title===fromN)startIdx=i;
        if(toN&&title===toN)endIdx=i;
    });
    if(fromN&&startIdx===-1){
        rangeStatus.textContent=`❌ Không tìm thấy chương đầu: "${fromRaw}"`;
        rangeStatus.style.cssText="font-size:11px;margin-top:5px;display:block;padding:4px 6px;border-radius:4px;background:#f8d7da;color:#721c24;";
        return;
    }
    if(toN&&endIdx===-1){
        rangeStatus.textContent=`❌ Không tìm thấy chương cuối: "${toRaw}"`;
        rangeStatus.style.cssText="font-size:11px;margin-top:5px;display:block;padding:4px 6px;border-radius:4px;background:#f8d7da;color:#721c24;";
        return;
    }
    if(startIdx===-1)startIdx=0;
    if(endIdx===-1)endIdx=_allLoadedFiles.length-1;
    if(startIdx>endIdx){
        rangeStatus.textContent=`❌ Chương đầu (vị trí ${startIdx+1}) phải trước chương cuối (vị trí ${endIdx+1}).`;
        rangeStatus.style.cssText="font-size:11px;margin-top:5px;display:block;padding:4px 6px;border-radius:4px;background:#f8d7da;color:#721c24;";
        return;
    }
    t=_allLoadedFiles.slice(startIdx,endIdx+1);
    K.textContent=`Đã chọn ${t.length} file (từ "${titleOf(_allLoadedFiles[startIdx])}" đến "${titleOf(_allLoadedFiles[endIdx])}")`;
    K.style.cssText="color:#155724;font-size:13px;margin-top:6px;margin-bottom:6px;display:block;font-weight:600;padding-left:4px;";
    rangeStatus.textContent=`✅ Đã lọc: ${t.length} chương (vị trí ${startIdx+1}–${endIdx+1} trong ${_allLoadedFiles.length} file).`;
    rangeStatus.style.cssText="font-size:11px;margin-top:5px;display:block;padding:4px 6px;border-radius:4px;background:#d4edda;color:#155724;";
    ue();
};g=document.createElement("input");g.type="hidden";g.value="[VIP]";P.appendChild(g);let uploadQueue=[];const queueContainer=document.createElement("div");queueContainer.style.cssText="margin-bottom:8px;display:none;";const queueTitle=document.createElement("div");queueTitle.style.cssText="color:#374151;font-size:13px;font-weight:600;margin-bottom:6px;padding:0 4px;";queueTitle.textContent="📋 Hàng chờ upload:";queueContainer.appendChild(queueTitle);const queueList=document.createElement("div");queueList.style.cssText="display:flex;flex-direction:column;gap:4px;max-height:160px;overflow-y:auto;border:1px solid #d6cfc4;border-radius:6px;padding:6px;background:#fafaf8;";queueContainer.appendChild(queueList);P.appendChild(queueContainer);function renderQueue(){queueList.innerHTML="";if(uploadQueue.length===0){queueContainer.style.display="none";return;}queueContainer.style.display="block";uploadQueue.forEach((item,idx)=>{const row=document.createElement("div");row.style.cssText="display:flex;align-items:center;justify-content:space-between;padding:4px 6px;background:#fff;border:1px solid #e5e1da;border-radius:4px;font-size:12px;";const info=document.createElement("span");info.style.cssText="color:#374151;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;";info.textContent=`${idx+1}. ${item.volumeName} — ${item.files.length} file`;info.title=`${item.volumeName}: `+item.files.map(f=>f.name).join(", ");const del=document.createElement("button");del.textContent="✕";del.style.cssText="background:none;border:none;color:#dc3545;cursor:pointer;font-size:13px;padding:0 4px;margin-left:4px;";del.title="Xóa khỏi hàng chờ";del.onclick=()=>{uploadQueue.splice(idx,1);renderQueue();};row.appendChild(info);row.appendChild(del);queueList.appendChild(row);});}const actionRow=document.createElement("div");actionRow.style.cssText="display: flex; gap: 8px; margin-bottom: 8px; width: 100%;";P.appendChild(actionRow);const addToQueueBtn=document.createElement("button");addToQueueBtn.style.cssText=`
    background:#F36F0A;color:white;border:none;padding:9px 8px;border-radius:8px;
    cursor:pointer;flex:1;margin:0;font-weight:600;font-size:12px;transition:all 0.2s;
    box-shadow:0 2px 8px rgba(217,119,6,0.45);display:flex;align-items:center;
    justify-content:center;gap:5px;white-space:nowrap;
`;addToQueueBtn.innerHTML=`<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg><span>Thêm hàng chờ</span>`;addToQueueBtn.title="Thêm quyển hiện tại + file đã chọn vào hàng chờ, rồi chọn quyển khác tiếp tục";addToQueueBtn.onmouseover=()=>{addToQueueBtn.style.background="#d45e00";addToQueueBtn.style.transform="translateY(-1px)"};addToQueueBtn.onmouseout=()=>{addToQueueBtn.style.background="#F36F0A";addToQueueBtn.style.transform="translateY(0)"};addToQueueBtn.onclick=()=>{if(0===t.length){alert("Vui lòng chọn file TXT trước.");return;}if(!p||"-1"===V.value){alert("Vui lòng chọn một Quyển hợp lệ.");return;}const selIdx=parseInt(V.value);const volName=(()=>{const opt=V.options[V.selectedIndex];return opt?opt.textContent:"Quyển "+(selIdx+1);})();const existing=uploadQueue.findIndex(q=>q.volumeWrapper===p);if(existing!==-1){if(!confirm(`Quyển "${volName}" đã có trong hàng chờ. Bạn có muốn ghi đè không?`))return;uploadQueue.splice(existing,1);}uploadQueue.push({volumeWrapper:p,files:[...t],volumeName:volName});renderQueue();t=[];K.textContent=`✔ Đã thêm "${volName}" vào hàng chờ`;K.style.cssText="color:#5a32a3;font-size:13px;margin-top:6px;margin-bottom:6px;display:block;font-weight:600;padding:8px;background:#ede9f8;border-radius:4px;";ze.style.display="none";setTimeout(()=>{K.style.display="none";},4000);};actionRow.appendChild(addToQueueBtn);const G=document.createElement("button");G.style.cssText=`
            background: #399F49;
            color: white;
            border: none;
            padding: 9px 8px;
            border-radius: 8px;
            cursor: pointer;
            flex: 1;
            margin: 0;
            font-weight: 600;
            font-size: 12px;
            transition: all 0.2s;
            box-shadow: 0 2px 8px rgba(48,97,55,0.45), 0 4px 8px rgba(0,0,0,0.1);
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 5px;
            white-space: nowrap;
        `;e=document.createElement("span");e.innerHTML=`
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 15v4c0 1.1.9 2 2 2h14a2 2 0 002-2v-4M17 8l-5-5-5 5M12 3v12"/>
            </svg>
        `,e.style.verticalAlign="middle",G.appendChild(e);const Ae=document.createElement("span"),J=(Ae.textContent="Bắt đầu upload",G.appendChild(Ae),G.onmouseover=()=>{G.style.background="#1f4025",G.style.transform="translateY(-2px)",G.style.boxShadow="0 4px 12px rgba(48,97,55,0.5), 0 6px 12px rgba(0,0,0,0.15)"},G.onmouseout=()=>{G.style.background="#399F49",G.style.transform="translateY(0)",G.style.boxShadow="0 2px 8px rgba(48,97,55,0.45), 0 4px 8px rgba(0,0,0,0.1)"},actionRow.appendChild(G),document.createElement("button")),Z=(J.style.cssText=`
            background: #A11A1A;
            color: white;
            border: none;
            padding: 9px 12px;
            border-radius: 8px;
            cursor: pointer;
            flex: 1;
            margin: 0;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.2s;
            box-shadow: 0 2px 8px rgba(161,26,26,0.45), 0 4px 8px rgba(0,0,0,0.1);
            display: none;
            align-items: center;
            justify-content: center;
            gap: 8px;
        `,J.innerHTML=`
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="4" y="4" width="16" height="16" rx="2"/>
            </svg>
            <span>Dừng upload</span>
        `,J.onmouseover=()=>{J.style.background="#6e1111",J.style.transform="translateY(-2px)",J.style.boxShadow="0 4px 12px rgba(161,26,26,0.5), 0 6px 12px rgba(0,0,0,0.15)"},J.onmouseout=()=>{J.style.background="#A11A1A",J.style.transform="translateY(0)",J.style.boxShadow="0 2px 8px rgba(161,26,26,0.45), 0 4px 8px rgba(0,0,0,0.1)"},J.onclick=()=>{E=!1,T=!1,J.style.display="none",G.style.display="flex",Z.style.display="none";const e=document.createElement("div");e.style.cssText="margin-top:6px; margin-bottom:6px; font-size:14px; background:#fff3cd; color:#856404; border:1px solid #ffeeba; padding:10px 12px; border-radius:8px; font-weight:600; text-align:center;",e.textContent=`⛔ Đã dừng. Đã xử lý ${z}/${I} file.`,P.insertBefore(e,Z),setTimeout(()=>e.remove(),5e3)},actionRow.appendChild(J),document.createElement("div")),He=(Z.style.cssText=`
            margin-top: 8px;
            font-size: 13px;
            color: #374151;
            background: #ffffff;
            border-radius: 8px;
            border: 1px solid #d6cfc4;
            display: none;
            padding: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            transition: all 0.3s ease;
        `,P.appendChild(Z),document.createElement("div"));Z.appendChild(He);A=document.createElement("div");A.style.cssText="height: 8px; background: #e9ecef; border-radius: 4px; margin-top: 8px; overflow: hidden;",Z.appendChild(A);const Fe=document.createElement("div"),Q=(Fe.style.cssText="height: 100%; width: 0%; background: #399F49; transition: width 0.3s ease; border-radius: 4px;",A.appendChild(Fe),document.createElement("div")),ee=(Q.style.cssText=`
            margin-top: 6px;
            margin-bottom: 6px;
            font-size: 14px;
            background: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
            padding: 8px 10px;
            border-radius: 8px;
            font-weight: 600;
            display: none;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            text-align: center;
        `,P.appendChild(Q),document.createElement("div")),te=(ee.style.cssText=`
            font-size: 13px;
            color: #374151;
            max-height: 200px;
            overflow-y: auto;
            padding: 8px;
            background: #ffffff;
            border-radius: 8px;
            border: 1px solid #d6cfc4;
            display: none;
            line-height: 1.6;
            box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
        `,P.appendChild(ee),Se.appendChild(P),document.createElement("div"));te.style.cssText="display: none; width: 100%; padding-bottom: 10px;";Se.appendChild(te);

// ── Giới thiệu / Dịch Tab ─────────────────────────────────────────────
const TransTabContainer = document.createElement("div");
TransTabContainer.style.cssText = "display:none;width:100%;padding-bottom:10px;box-sizing:border-box;";

// ── Ảnh bìa Tab ──────────────────────────────────────────────────────────────
const CoverTabContainer = (function(){
    const wrap = document.createElement("div");
    wrap.style.cssText = "display:none;width:100%;padding-bottom:10px;";

    const lbl = document.createElement("div");
    lbl.className = "wt-section-label";
    lbl.textContent = "Ảnh bìa";
    wrap.appendChild(lbl);

    // File input (ẩn)
    const coverInput = document.createElement("input");
    coverInput.type = "file";
    coverInput.id = "coverImageInput";
    coverInput.accept = "image/jpeg,image/jpg";
    coverInput.style.display = "none";
    wrap.appendChild(coverInput);

    // Label chọn file
    const coverLabel = document.createElement("label");
    coverLabel.setAttribute("for", "coverImageInput");
    coverLabel.style.cssText = `display:flex;align-items:center;justify-content:center;gap:8px;
        background:#1C75E1;color:#fff;padding:9px;border-radius:8px;cursor:pointer;
        font-size:14px;font-weight:600;transition:all 0.2s;margin-bottom:8px;
        box-shadow:0 2px 8px rgba(26,86,161,0.4);`;
    coverLabel.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span>Chọn ảnh JPG</span>`;
    coverLabel.onmouseover=()=>{coverLabel.style.background="#153f7a";};
    coverLabel.onmouseout=()=>{coverLabel.style.background="#1C75E1";};
    wrap.appendChild(coverLabel);

    // Chọn thư mục lưu (File System Access API)
    const coverDirRow = document.createElement("div");
    coverDirRow.style.cssText = "display:flex;align-items:center;gap:6px;margin-bottom:8px;";
    const coverDirBtn = document.createElement("button");
    coverDirBtn.style.cssText = `display:flex;align-items:center;gap:6px;background:#f3f4f6;
        color:#374151;border:1.5px solid #e5e1da;padding:7px 10px;border-radius:8px;
        cursor:pointer;font-size:12px;font-weight:600;transition:all 0.2s;white-space:nowrap;flex-shrink:0;`;
    coverDirBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg> Chọn thư mục lưu`;
    coverDirBtn.onmouseover=()=>{coverDirBtn.style.background="#e5e7eb";};
    coverDirBtn.onmouseout=()=>{coverDirBtn.style.background="#f3f4f6";};
    const coverDirLabel = document.createElement("span");
    coverDirLabel.style.cssText = "font-size:11px;color:#6b7280;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;";
    coverDirLabel.textContent = "Chưa chọn thư mục";
    // ── IndexedDB helpers để lưu/khôi phục FileSystemDirectoryHandle ──
    const _DB_NAME = "WikiToolsDB";
    const _DB_STORE = "handles";
    const _DB_KEY   = "coverDirHandle";
    function _openDB(){
        return new Promise((res, rej) => {
            const req = indexedDB.open(_DB_NAME, 1);
            req.onupgradeneeded = e => e.target.result.createObjectStore(_DB_STORE);
            req.onsuccess = e => res(e.target.result);
            req.onerror   = e => rej(e.target.error);
        });
    }
    async function _saveHandle(handle){
        try{
            const db = await _openDB();
            const tx = db.transaction(_DB_STORE, "readwrite");
            tx.objectStore(_DB_STORE).put(handle, _DB_KEY);
            await new Promise((res,rej)=>{tx.oncomplete=res;tx.onerror=rej;});
        } catch(e){ console.warn("Không thể lưu handle vào IndexedDB", e); }
    }
    async function _loadHandle(){
        try{
            const db = await _openDB();
            return await new Promise((res,rej)=>{
                const req = db.transaction(_DB_STORE,"readonly").objectStore(_DB_STORE).get(_DB_KEY);
                req.onsuccess = e => res(e.target.result || null);
                req.onerror   = e => rej(e.target.error);
            });
        } catch(e){ return null; }
    }
    async function _applyHandle(dirHandle){
        if(!dirHandle) return;
        // Kiểm tra / xin lại permission nếu cần
        let perm = await dirHandle.queryPermission({mode:"readwrite"});
        if(perm !== "granted"){
            perm = await dirHandle.requestPermission({mode:"readwrite"});
        }
        if(perm === "granted"){
            window._coverDirHandle = dirHandle;
            coverDirLabel.textContent = "📁 " + dirHandle.name;
            coverDirLabel.style.color = "#399F49";
            coverDirLabel.style.fontWeight = "600";
        }
    }
    // Khôi phục handle ngay khi tab Ảnh bìa được khởi tạo
    _loadHandle().then(_applyHandle);

    coverDirBtn.onclick = async function(){
        try{
            if(!window.showDirectoryPicker){ alert("Trình duyệt không hỗ trợ. Dùng Chrome/Edge mới nhất."); return; }
            const dirHandle = await window.showDirectoryPicker({mode:"readwrite",startIn:"downloads"});
            window._coverDirHandle = dirHandle;
            coverDirLabel.textContent = "📁 " + dirHandle.name;
            coverDirLabel.style.color = "#399F49";
            coverDirLabel.style.fontWeight = "600";
            await _saveHandle(dirHandle);
        } catch(e){ if(e.name!=="AbortError") console.error(e); }
    };
    coverDirRow.appendChild(coverDirBtn);
    coverDirRow.appendChild(coverDirLabel);
    wrap.appendChild(coverDirRow);

    // Preview + status
    const coverStatus = document.createElement("div");
    coverStatus.style.cssText = "font-size:12px;color:#374151;margin-bottom:6px;display:none;";
    wrap.appendChild(coverStatus);

    const coverPreview = document.createElement("img");
    coverPreview.style.cssText = "display:none;width:100%;border-radius:8px;margin-bottom:8px;border:1px solid #e5e1da;";
    wrap.appendChild(coverPreview);

    // Nút nén & lưu
    const coverCompressBtn = document.createElement("button");
    coverCompressBtn.textContent = "🗜️ Nén & Lưu ảnh";
    coverCompressBtn.style.cssText = `width:100%;padding:9px;border:none;border-radius:8px;
        background:#399F49;color:#fff;font-size:13px;font-weight:600;cursor:pointer;
        box-shadow:0 2px 8px rgba(48,97,55,0.4);display:none;margin-bottom:6px;transition:all 0.2s;`;
    coverCompressBtn.onmouseover=()=>{coverCompressBtn.style.background="#1f4025";};
    coverCompressBtn.onmouseout=()=>{coverCompressBtn.style.background="#399F49";};
    wrap.appendChild(coverCompressBtn);

    // Log compress
    const coverLog = document.createElement("div");
    coverLog.style.cssText = "font-size:11px;color:#6b7280;background:#f9fafb;border:1px solid #e5e1da;border-radius:6px;padding:6px 8px;display:none;max-height:120px;overflow-y:auto;";
    wrap.appendChild(coverLog);

    let _origFile = null;
    let _compressedBlob = null;
    let _compressedName = "";

    function formatSize(bytes){
        if(bytes >= 1024*1024) return (bytes/1024/1024).toFixed(2)+" MB";
        return (bytes/1024).toFixed(1)+" KB";
    }

    coverInput.onchange = function(){
        const file = coverInput.files[0];
        if(!file) return;
        _origFile = file;
        _compressedBlob = null;
        const origKB = formatSize(file.size);
        coverStatus.style.display = "block";
        coverStatus.innerHTML = `<strong>File gốc:</strong> ${file.name} — ${origKB}`;
        // Show preview
        const reader = new FileReader();
        reader.onload = e => {
            coverPreview.src = e.target.result;
            coverPreview.style.display = "block";
        };
        reader.readAsDataURL(file);
        coverCompressBtn.style.display = "block";
        coverLog.style.display = "none";
        coverLog.innerHTML = "";
    };

    async function compressImage(file, quality){
        return new Promise((resolve) => {
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                canvas.toBlob(blob => resolve(blob), "image/jpeg", quality);
            };
            img.src = url;
        });
    }

    coverCompressBtn.onclick = async function(){
        if(!_origFile){ alert("Chưa chọn ảnh!"); return; }
        const TARGET = 500 * 1024; // 500KB
        coverCompressBtn.disabled = true;
        coverCompressBtn.textContent = "⏳ Đang nén...";
        coverLog.style.display = "block";
        coverLog.innerHTML = "";

        let found = null;
        let foundQuality = 0;

        for(let q = 99; q >= 1; q--){
            const quality = q / 100;
            const blob = await compressImage(_origFile, quality);
            const logLine = document.createElement("div");
            logLine.textContent = `${q}%: ${formatSize(blob.size)}`;
            if(blob.size < TARGET){
                logLine.style.color = "#399F49";
                logLine.style.fontWeight = "700";
                coverLog.appendChild(logLine);
                found = blob;
                foundQuality = q;
                break;
            } else {
                logLine.style.color = "#6b7280";
                coverLog.appendChild(logLine);
            }
            coverLog.scrollTop = coverLog.scrollHeight;
            await new Promise(r => setTimeout(r, 10));
        }

        if(!found){
            const logLine = document.createElement("div");
            logLine.style.color = "#dc3545";
            logLine.textContent = "⚠️ Không thể nén xuống dưới 500KB. Đã lấy chất lượng tốt nhất.";
            coverLog.appendChild(logLine);
            found = await compressImage(_origFile, 0.01);
            foundQuality = 1;
        }

        _compressedBlob = found;
        const baseName = _origFile.name.replace(/\.[^.]+$/, "");
        _compressedName = baseName + "_compressed.jpg";

        // Update preview
        const newUrl = URL.createObjectURL(found);
        coverPreview.src = newUrl;
        coverStatus.innerHTML = `<strong>File gốc:</strong> ${_origFile.name} — ${formatSize(_origFile.size)}<br>
            <strong style="color:#399F49">✔ Đã nén:</strong> ${_compressedName} — ${formatSize(found.size)} (chất lượng ${foundQuality}%)`;

        // Save file – prefer File System Access API (saves to chosen folder)
        let saved = false;
        if(window._coverDirHandle){
            try{
                const fileHandle = await window._coverDirHandle.getFileHandle(_compressedName, {create:true});
                const writable = await fileHandle.createWritable();
                await writable.write(found);
                await writable.close();
                saved = true;
            } catch(e){ console.warn("FSA save failed, fallback to download", e); }
        }
        if(!saved){
            const a = document.createElement("a");
            a.href = newUrl;
            a.download = _compressedName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }

        coverCompressBtn.disabled = false;
        coverCompressBtn.textContent = "🗜️ Nén & Lưu ảnh";
    };

    return wrap;
})();
Se.appendChild(CoverTabContainer);

Se.appendChild(TransTabContainer);

// ── helper: inject shared <style> once ──────────────────────────────
if (!document.getElementById("wt-trans-style")) {
    const _sty = document.createElement("style");
    _sty.id = "wt-trans-style";
    _sty.textContent = `
        .wt-section-label {
            display: flex; align-items: center; gap: 6px;
            font-size: 11px; font-weight: 700; letter-spacing: .06em;
            text-transform: uppercase; color: #9ca3af;
            margin: 10px 0 6px;
        }
        .wt-section-label::before {
            content: ""; flex: 0 0 3px; height: 12px;
            border-radius: 2px; background: currentColor;
        }
        .wt-input {
            width: 100%; padding: 7px 10px; font-size: 13px;
            border: 1.5px solid #e5e1da; border-radius: 8px;
            box-sizing: border-box; outline: none; transition: border-color .15s;
            background: #fff; color: #1f2937;
        }
        .wt-input:focus { border-color: #1C75E1; }
        .wt-input[readonly] { background: #f3f4f6; color: #6b7280; cursor: default; }
        .wt-textarea {
            width: 100%; max-width: 100%; padding: 8px 10px; font-size: 12.5px; line-height: 1.55;
            border: 1.5px solid #e5e1da; border-radius: 8px;
            box-sizing: border-box; resize: vertical; outline: none;
            transition: border-color .15s; background: #fff; color: #1f2937;
        }
        .wt-textarea:focus { border-color: #1C75E1; }
        .wt-btn {
            display: inline-flex; align-items: center; justify-content: center;
            gap: 6px; padding: 8px 12px; font-size: 13px; font-weight: 600;
            border: none; border-radius: 8px; cursor: pointer;
            transition: all .18s; white-space: nowrap;
        }
        .wt-btn:active { transform: scale(.97); }
        .wt-row { display: flex; gap: 7px; }
        .wt-card {
            background: #f9fafb; border: 1.5px solid #e5e1da;
            border-radius: 10px; padding: 10px 11px; margin-bottom: 8px;
            overflow: visible; box-sizing: border-box;
        }
        @keyframes wt-spin { to { transform: rotate(360deg); } }
        .wt-spin { animation: wt-spin .7s linear infinite; display:inline-block; }
    `;
    document.head.appendChild(_sty);
}

// ── Globals for new panel (shared with translateTextAPI & autoFill) ────
let _panelCnText = "";
let _panelViText = "";
let _panelHvText = "";
let _panelWebCn  = "";
let _panelWebVi  = "";

// ── Helper: capitalize first letter of each sentence ────────────────
function _capSentences(txt){
    // Capitalize first letter after sentence-ending punctuation, newlines, and start of string
    let r = txt.replace(/(^\s*|[.!?…»\n]+\s*)([a-zàáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỷỹ])/gmu,
        (m,p1,p2)=>p1+p2.toUpperCase());
    // Capitalize first letter that follows closing CJK bracket 】 (e.g. 【 mau xuyên 】 hư nữ → 【 Mau xuyên 】 Hư nữ)
    r = r.replace(/(】\s*)([a-zàáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỷỹ])/gmu,
        (m,p1,p2)=>p1+p2.toUpperCase());
    return r;
}
function _capInsideBrackets(txt){
    // Capitalize first letter inside 【...】 brackets
    return txt.replace(/(【\s*)([a-zàáâãèéêìíòóôõùúýăđơưạảấầẩẫậắằẳẵặẹẻẽếềểễệỉịọỏốồổỗộớờởỡợụủứừửữựỳỷỹ])/gmu,
        (m,p1,p2)=>p1+p2.toUpperCase());
}
function _capFull(txt){ return _capInsideBrackets(_capSentences(txt)); }

// ── Mini sidebar in TransTab: just Web title row + "Mở panel" button ─
(function(){
    // Web title row
    const _webCard = document.createElement("div");
    _webCard.className = "wt-card";
    _webCard.style.marginTop = "6px";
    const _webLabel = document.createElement("div");
    _webLabel.className = "wt-section-label";
    _webLabel.textContent = "Tên trang Web";
    _webCard.appendChild(_webLabel);
    const _webRow = document.createElement("div");
    _webRow.className = "wt-row";
    _webRow.style.cssText = "align-items:center;gap:6px;";
    const webTitleCnInput = document.createElement("input");
    webTitleCnInput.id = "webTitleCnInput";
    webTitleCnInput.className = "wt-input";
    webTitleCnInput.placeholder = "Tên gốc (tiếng Trung)";
    webTitleCnInput.style.flex = "1";
    webTitleCnInput.oninput = () => { _panelWebCn = webTitleCnInput.value.trim(); };
    const _webArrow = document.createElement("span");
    _webArrow.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2.5"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`;
    _webArrow.style.flexShrink = "0";
    const webTitleViInput = document.createElement("input");
    webTitleViInput.id = "webTitleViInput";
    webTitleViInput.className = "wt-input";
    webTitleViInput.placeholder = "Bản dịch...";
    webTitleViInput.style.flex = "1";
    webTitleViInput.readOnly = true;
    _webRow.appendChild(webTitleCnInput);
    _webRow.appendChild(_webArrow);
    _webRow.appendChild(webTitleViInput);
    _webCard.appendChild(_webRow);
    TransTabContainer.appendChild(_webCard);

    // Hidden file input for TXT (reused by panel)
    const transFileInput = document.createElement("input");
    transFileInput.type = "file";
    transFileInput.accept = ".txt";
    transFileInput.style.display = "none";
    transFileInput.id = "transFileInput";
    TransTabContainer.appendChild(transFileInput);

    // "Tải TXT & Mở Panel" button
    const _openCard = document.createElement("div");
    _openCard.className = "wt-card";
    _openCard.style.marginTop = "0";
    const _openLabel = document.createElement("label");
    _openLabel.setAttribute("for","transFileInput");
    _openLabel.className = "wt-btn";
    _openLabel.style.cssText = "width:100%;background:#7c3aed;color:#fff;padding:9px;font-size:13px;box-shadow:0 2px 8px rgba(124,58,237,.35);cursor:pointer;margin-bottom:8px;";
    _openLabel.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/></svg> Tải TXT → Mở Panel`;
    _openLabel.onmouseover = () => { _openLabel.style.background = "#5b21b6"; };
    _openLabel.onmouseout  = () => { _openLabel.style.background = "#7c3aed"; };
    _openCard.appendChild(_openLabel);

    // Manual open button (if already have text)
    const _manualOpenBtn = document.createElement("button");
    _manualOpenBtn.className = "wt-btn";
    _manualOpenBtn.style.cssText = "width:100%;background:#f3f4f6;color:#374151;border:1.5px solid #e5e1da;padding:8px;font-size:12px;";
    _manualOpenBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg> Mở Panel (không tải file)`;
    _manualOpenBtn.onmouseover = () => { _manualOpenBtn.style.background = "#e5e7eb"; };
    _manualOpenBtn.onmouseout  = () => { _manualOpenBtn.style.background = "#f3f4f6"; };
    _manualOpenBtn.onclick = () => { window._openTransPanel(); };
    _openCard.appendChild(_manualOpenBtn);
    TransTabContainer.appendChild(_openCard);

    // On file load → open panel with content
    transFileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            _panelCnText = ev.target.result;
            window._openTransPanel(_panelCnText);
        };
        reader.readAsText(file, "UTF-8");
        e.target.value = '';
    };

    // Store refs for translate API use
    window._getWebTitleCnInput = () => webTitleCnInput;
    window._getWebTitleViInput = () => webTitleViInput;
})();

// ── Translation API ──────────────────────────────────────────────────
const translateTextAPI = (text, tl = "vi") => {
    return new Promise((resolve, reject) => {
        if (!text || !text.trim()) return resolve("");
        GM_xmlhttpRequest({
            method: "POST",
            url: "https://dichngay.com/translate/text",
            headers: {
                "Content-Type": "application/json",
                "Referer": "https://dichngay.com/",
                "X-Requested-With": "XMLHttpRequest",
            },
            data: JSON.stringify({ content: text.trim(), tl }),
            withCredentials: true,
            onload: (response) => {
                try {
                    if (response.status >= 400) return reject(new Error("HTTP " + response.status));
                    const data = JSON.parse(response.responseText);
                    resolve(data?.data?.content || "");
                } catch (e) { reject(e); }
            },
            onerror: (err) => reject(new Error("Không kết nối được dichngay.com")),
            ontimeout: () => reject(new Error("Timeout"))
        });
    });
};

// ── Main 3-column panel ──────────────────────────────────────────────
(function(){
    // Inject styles — reuse shared wt-* classes, only add layout-specific overrides
    if (!document.getElementById("wt-panel3-style")) {
        const sty = document.createElement("style");
        sty.id = "wt-panel3-style";
        sty.textContent = `
            #wt-p3-overlay {
                position:fixed;top:0;left:0;right:0;bottom:0;
                background:rgba(0,0,0,0.45);z-index:99999;
                display:none;align-items:center;justify-content:center;
            }
            #wt-p3-overlay.active { display:flex; }
            #wt-p3-panel {
                background:#fff;border-radius:12px;
                width:min(1200px,98vw);height:min(92vh,860px);
                display:flex;flex-direction:column;
                box-shadow:0 24px 64px rgba(0,0,0,0.28);
                overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;
            }
            #wt-p3-header {
                display:flex;align-items:center;justify-content:space-between;
                padding:12px 18px 11px;border-bottom:2px solid #e5e1da;
                background:#ffffff;flex-shrink:0;gap:10px;
            }
            #wt-p3-header h3 {
                margin:0;font-size:16px;font-weight:700;color:#374151;white-space:nowrap;
            }
            #wt-p3-header-actions { display:flex;align-items:center;gap:7px;flex:1;justify-content:flex-end; }
            #wt-p3-body {
                display:grid;grid-template-columns:1fr 1fr 1fr;
                flex:1;overflow:hidden;
            }
            .wt-p3-col {
                display:flex;flex-direction:column;padding:12px 14px 11px;
                overflow:hidden;min-height:0;
                border-right:2px solid #e5e1da;
            }
            .wt-p3-col:last-child { border-right:none; }
            .wt-p3-col-header {
                display:flex;align-items:center;justify-content:space-between;
                margin-bottom:7px;flex-shrink:0;
            }
            .wt-p3-textarea {
                flex:1;width:100%;padding:9px 11px;font-size:13px;line-height:1.65;
                border:1.5px solid #e5e1da;border-radius:8px;
                box-sizing:border-box;resize:none;outline:none;
                transition:border-color .15s;background:#fff;color:#1f2937;
                font-family:inherit;min-height:0;display:block;
            }
            .wt-p3-textarea:focus { border-color:#1C75E1; }
            .wt-p3-textarea.wt-p3-readonly { background:#f9fafb;color:#374151; }
            .wt-p3-fr-row { display:flex;gap:4px;align-items:center;margin-bottom:5px; }
            .wt-p3-tabs {
                display:flex;border:1.5px solid #e5e1da;border-radius:8px;
                overflow:hidden;flex-shrink:0;margin-bottom:7px;
            }
            .wt-p3-tabs button {
                flex:1;padding:6px 8px;font-size:12px;font-weight:700;
                border:none;cursor:pointer;transition:all .15s;
            }
            #wt-p3-close {
                background:transparent;border:none;cursor:pointer;
                color:#6b7280;font-size:20px;padding:4px 9px;border-radius:6px;
                transition:background .15s;flex-shrink:0;line-height:1;font-weight:400;
            }
            #wt-p3-close:hover { background:#f3f4f6;color:#374151; }
            .wt-p3-web-row {
                display:flex;align-items:center;gap:6px;
                padding:6px 9px;background:#f9fafb;border:1.5px solid #e5e1da;
                border-radius:8px;margin-bottom:7px;flex-shrink:0;
            }
        `;
        document.head.appendChild(sty);
    }

    // ── Overlay & Panel shell ────────────────────────────────────────
    const overlay = document.createElement("div");
    overlay.id = "wt-p3-overlay";
    overlay.onclick = e => { if (e.target === overlay) overlay.classList.remove("active"); };

    const panel = document.createElement("div");
    panel.id = "wt-p3-panel";
    overlay.appendChild(panel);

    // ── Header ───────────────────────────────────────────────────────
    const hdr = document.createElement("div");
    hdr.id = "wt-p3-header";
    hdr.innerHTML = `<h3>📝 Giới thiệu – Dịch & Điền Form</h3>`;

    // Translate button in header
    const hdrDichBtn = document.createElement("button");
    hdrDichBtn.id = "wt-p3-dich-btn";
    hdrDichBtn.className = "wt-btn";
    hdrDichBtn.style.cssText = "background:#1C75E1;color:#fff;box-shadow:0 2px 8px rgba(26,86,161,.35);padding:9px 14px;font-size:13px;";
    hdrDichBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20"/></svg> Dịch`;

    // Fill form button in header
    const hdrFillBtn = document.createElement("button");
    hdrFillBtn.id = "wt-p3-fill-btn";
    hdrFillBtn.className = "wt-btn";
    hdrFillBtn.style.cssText = "background:#FF9800;color:#fff;box-shadow:0 2px 8px rgba(255,152,0,.35);padding:9px 14px;font-size:13px;";
    hdrFillBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg> Tự động điền Form`;

    const hdrActions = document.createElement("div");
    hdrActions.id = "wt-p3-header-actions";
    hdrActions.appendChild(hdrDichBtn);
    hdrActions.appendChild(hdrFillBtn);

    const closeBtn = document.createElement("button");
    closeBtn.id = "wt-p3-close";
    closeBtn.innerHTML = "✕";
    closeBtn.onclick = () => overlay.classList.remove("active");

    hdr.appendChild(hdrActions);
    hdr.appendChild(closeBtn);
    panel.appendChild(hdr);

    // ── Body ─────────────────────────────────────────────────────────
    const body = document.createElement("div");
    body.id = "wt-p3-body";
    panel.appendChild(body);

    // ════════════════════════════════════════════════════════════════
    // COL 1 – Văn bản tiếng Trung (editable) + Web title row
    // ════════════════════════════════════════════════════════════════
    const col1 = document.createElement("div");
    col1.className = "wt-p3-col";

    const col1Hdr = document.createElement("div");
    col1Hdr.className = "wt-p3-col-header";
    const col1Title = document.createElement("div");
    col1Title.className = "wt-section-label";
    col1Title.textContent = "Văn bản tiếng Trung";
    col1Hdr.appendChild(col1Title);

    // Clear button
    const col1ClearBtn = document.createElement("button");
    col1ClearBtn.className = "wt-btn";
    col1ClearBtn.style.cssText = "background:#fee2e2;color:#dc2626;padding:5px 9px;font-size:11px;";
    col1ClearBtn.textContent = "Xóa";
    col1ClearBtn.onmouseover = () => { col1ClearBtn.style.background = "#fca5a5"; };
    col1ClearBtn.onmouseout  = () => { col1ClearBtn.style.background = "#fee2e2"; };
    col1Hdr.appendChild(col1ClearBtn);
    col1.appendChild(col1Hdr);

    // Web title mini-row inside col1
    const col1WebRow = document.createElement("div");
    col1WebRow.className = "wt-p3-web-row";
    const col1WebLabel = document.createElement("div");
    col1WebLabel.style.cssText = "font-size:11px;font-weight:700;color:#6b7280;white-space:nowrap;flex-shrink:0;";
    col1WebLabel.textContent = "Tên web:";
    const col1WebCnInput = document.createElement("input");
    col1WebCnInput.className = "wt-input";
    col1WebCnInput.placeholder = "Tên tiếng Trung từ web…";
    col1WebCnInput.title = "Tên mới lấy từ web (tiếng Trung)";
    const col1WebSep = document.createElement("span");
    col1WebSep.textContent = "/";
    col1WebSep.style.cssText = "color:#9ca3af;font-weight:700;font-size:14px;flex-shrink:0;";
    const col1WebViInput = document.createElement("input");
    col1WebViInput.className = "wt-input";
    col1WebViInput.placeholder = "Bản dịch (tự động)…";
    col1WebViInput.readOnly = true;
    col1WebViInput.style.background = "#f0f4ff";
    col1WebViInput.title = "Công thức: Tên mới (web) / Tên cũ (file) — luôn viết hoa đầu";
    col1WebRow.appendChild(col1WebLabel);
    col1WebRow.appendChild(col1WebCnInput);
    col1WebRow.appendChild(col1WebSep);
    col1WebRow.appendChild(col1WebViInput);
    col1.appendChild(col1WebRow);

    const col1Hint = document.createElement("div");
    col1Hint.style.cssText = "font-size:11px;color:#9ca3af;margin-bottom:6px;flex-shrink:0;line-height:1.4;";
    col1Hint.textContent = "Công thức tên: Tên mới (web) / Tên cũ (file) — ghi hoa đầu câu tự động";
    col1.appendChild(col1Hint);

    const col1Ta = document.createElement("textarea");
    col1Ta.className = "wt-p3-textarea";
    col1Ta.placeholder = "Dán văn bản tiếng Trung vào đây hoặc tải file TXT…";
    col1.appendChild(col1Ta);

    col1ClearBtn.onclick = () => { col1Ta.value = ""; col1Ta.focus(); };
    col1Ta.oninput = () => { _panelCnText = col1Ta.value; };
    col1WebCnInput.oninput = () => { _panelWebCn = col1WebCnInput.value.trim(); };

    body.appendChild(col1);

    // ════════════════════════════════════════════════════════════════
    // COL 2 – Kết quả dịch (Việt / Hán Việt) readonly, editable after
    // ════════════════════════════════════════════════════════════════
    const col2 = document.createElement("div");
    col2.className = "wt-p3-col";

    const col2Hdr = document.createElement("div");
    col2Hdr.className = "wt-p3-col-header";
    const col2Title = document.createElement("div");
    col2Title.className = "wt-section-label";
    col2Title.textContent = "Bản dịch";
    col2Hdr.appendChild(col2Title);
    col2.appendChild(col2Hdr);

    // Tabs Vi / HV
    const col2Tabs = document.createElement("div");
    col2Tabs.className = "wt-p3-tabs";
    const tabVi = document.createElement("button");
    tabVi.textContent = "🇻🇳 Tiếng Việt";
    tabVi.style.cssText = "background:#1C75E1;color:#fff;";
    const tabHv = document.createElement("button");
    tabHv.textContent = "📖 Hán Việt";
    tabHv.style.cssText = "background:#f3f4f6;color:#6b7280;border-left:1.5px solid #e5e1da;";
    col2Tabs.appendChild(tabVi);
    col2Tabs.appendChild(tabHv);
    col2.appendChild(col2Tabs);

    // Vi textarea
    const col2TaVi = document.createElement("textarea");
    col2TaVi.className = "wt-p3-textarea wt-p3-readonly";
    col2TaVi.placeholder = "Kết quả tiếng Việt…";
    col2TaVi.oninput = () => { _panelViText = col2TaVi.value; };
    col2.appendChild(col2TaVi);

    // HV textarea
    const col2TaHv = document.createElement("textarea");
    col2TaHv.className = "wt-p3-textarea wt-p3-readonly";
    col2TaHv.placeholder = "Kết quả Hán Việt…";
    col2TaHv.style.display = "none";
    col2TaHv.oninput = () => { _panelHvText = col2TaHv.value; };
    col2.appendChild(col2TaHv);

    // Copy buttons row
    const col2BtnRow = document.createElement("div");
    col2BtnRow.style.cssText = "display:flex;gap:6px;margin-top:8px;flex-shrink:0;";
    const col2CopyBtn = document.createElement("button");
    col2CopyBtn.className = "wt-btn";
    col2CopyBtn.style.cssText = "flex:1;background:#f3f4f6;color:#374151;border:1.5px solid #e5e1da;";
    col2CopyBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg> Copy`;
    col2CopyBtn.onmouseover = () => { col2CopyBtn.style.background = "#e5e7eb"; };
    col2CopyBtn.onmouseout  = () => { col2CopyBtn.style.background = "#f3f4f6"; };
    col2CopyBtn.onclick = () => {
        const txt = col2TaVi.style.display !== "none" ? col2TaVi.value : col2TaHv.value;
        if (!txt) return;
        navigator.clipboard.writeText(txt);
        const orig = col2CopyBtn.innerHTML;
        col2CopyBtn.innerHTML = "✅ Đã copy!";
        col2CopyBtn.style.color = "#16a34a";
        setTimeout(() => { col2CopyBtn.innerHTML = orig; col2CopyBtn.style.color = "#374151"; }, 2000);
    };
    col2BtnRow.appendChild(col2CopyBtn);
    col2.appendChild(col2BtnRow);

    // Tab switch
    tabVi.onclick = () => {
        col2TaVi.style.display = "block"; col2TaHv.style.display = "none";
        tabVi.style.background = "#1C75E1"; tabVi.style.color = "#fff";
        tabHv.style.background = "#f3f4f6"; tabHv.style.color = "#6b7280";
    };
    tabHv.onclick = () => {
        col2TaHv.style.display = "block"; col2TaVi.style.display = "none";
        tabHv.style.background = "#7c3aed"; tabHv.style.color = "#fff";
        tabVi.style.background = "#f3f4f6"; tabVi.style.color = "#6b7280";
    };

    body.appendChild(col2);

    // ════════════════════════════════════════════════════════════════
    // COL 3 – Tìm & Thay thế + nút điền form
    // ════════════════════════════════════════════════════════════════
    const col3 = document.createElement("div");
    col3.className = "wt-p3-col";
    col3.style.overflow = "hidden";

    const col3Hdr = document.createElement("div");
    col3Hdr.className = "wt-p3-col-header";
    const col3Title = document.createElement("div");
    col3Title.className = "wt-section-label";
    col3Title.textContent = "Tìm & Thay thế (Việt)";
    col3Hdr.appendChild(col3Title);

    const col3AddBtn = document.createElement("button");
    col3AddBtn.className = "wt-btn";
    col3AddBtn.style.cssText = "background:#f3f4f6;color:#374151;border:1.5px solid #e5e1da;padding:5px 9px;font-size:11px;";
    col3AddBtn.innerHTML = `<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Thêm`;
    col3AddBtn.onmouseover = () => { col3AddBtn.style.background = "#e5e7eb"; };
    col3AddBtn.onmouseout  = () => { col3AddBtn.style.background = "#f3f4f6"; };
    col3Hdr.appendChild(col3AddBtn);
    col3.appendChild(col3Hdr);

    const col3Hint = document.createElement("div");
    col3Hint.style.cssText = "font-size:11px;color:#9ca3af;margin-bottom:6px;flex-shrink:0;";
    col3Hint.textContent = "Tìm & thay cụm từ trong bản Tiếng Việt. Aa = viết hoa mỗi từ.";
    col3.appendChild(col3Hint);

    // Pairs container (scrollable)
    const col3Pairs = document.createElement("div");
    col3Pairs.style.cssText = "display:flex;flex-direction:column;gap:5px;flex:1;overflow-y:auto;min-height:0;margin-bottom:8px;padding-right:2px;";
    col3.appendChild(col3Pairs);

    function _createFrPair3() {
        const row = document.createElement("div");
        row.className = "wt-p3-fr-row";

        const inFind = document.createElement("input");
        inFind.className = "wt-input";
        inFind.placeholder = "Tìm…";
        inFind.style.cssText = "flex:1;padding:6px 8px;font-size:12.5px;min-width:0;";

        const inRep = document.createElement("input");
        inRep.className = "wt-input";
        inRep.placeholder = "Thay bằng…";
        inRep.style.cssText = "flex:1;padding:6px 8px;font-size:12.5px;min-width:0;";

        const btnAa = document.createElement("button");
        btnAa.className = "wt-btn";
        btnAa.title = "Capitalize từng từ trong ô Thay bằng";
        btnAa.style.cssText = "padding:5px 7px;font-size:11px;font-weight:800;background:#7c3aed;color:#fff;border-radius:6px;flex-shrink:0;";
        btnAa.textContent = "Aa";
        btnAa.onmouseover = () => { btnAa.style.background = "#5b21b6"; };
        btnAa.onmouseout  = () => { btnAa.style.background = "#7c3aed"; };
        btnAa.onclick = () => {
            inRep.value = inRep.value.replace(/\S+/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
        };

        const btnDel = document.createElement("button");
        btnDel.className = "wt-btn";
        btnDel.title = "Xóa hàng này";
        btnDel.style.cssText = "padding:5px 7px;font-size:12px;background:#fee2e2;color:#dc2626;border-radius:6px;flex-shrink:0;";
        btnDel.textContent = "✕";
        btnDel.onmouseover = () => { btnDel.style.background = "#fca5a5"; };
        btnDel.onmouseout  = () => { btnDel.style.background = "#fee2e2"; };
        btnDel.onclick = () => row.remove();

        row.appendChild(inFind);
        row.appendChild(inRep);
        row.appendChild(btnAa);
        row.appendChild(btnDel);
        col3Pairs.appendChild(row);
        return { row, inFind, inRep };
    }

    // Default pairs
    _createFrPair3();
    _createFrPair3();
    col3AddBtn.onclick = () => { _createFrPair3(); col3Pairs.scrollTop = col3Pairs.scrollHeight; };

    // Replace all button
    const col3ReplaceBtn = document.createElement("button");
    col3ReplaceBtn.className = "wt-btn";
    col3ReplaceBtn.style.cssText = "width:100%;background:#059669;color:#fff;font-size:13px;padding:9px;box-shadow:0 2px 8px rgba(5,150,105,.3);margin-bottom:8px;flex-shrink:0;";
    col3ReplaceBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg> Thay thế tất cả`;
    col3ReplaceBtn.onmouseover = () => { col3ReplaceBtn.style.background = "#047857"; };
    col3ReplaceBtn.onmouseout  = () => { col3ReplaceBtn.style.background = "#059669"; };
    col3ReplaceBtn.onclick = () => {
        const target = col2TaVi.style.display !== "none" ? col2TaVi : col2TaHv;
        if (!target.value) return;
        let txt = target.value;
        let count = 0;
        col3Pairs.querySelectorAll(".wt-p3-fr-row").forEach(row => {
            const ins = row.querySelectorAll("input");
            if (ins.length < 2 || !ins[0].value) return;
            const esc = ins[0].value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const re = new RegExp(esc, "gi");
            const before = txt;
            txt = txt.replace(re, ins[1].value);
            if (txt !== before) count++;
        });
        target.value = txt;
        if (target === col2TaVi) _panelViText = txt;
        else _panelHvText = txt;
        const orig = col3ReplaceBtn.innerHTML;
        col3ReplaceBtn.innerHTML = `✅ Đã thay ${count} cặp!`;
        col3ReplaceBtn.style.background = "#16a34a";
        setTimeout(() => { col3ReplaceBtn.innerHTML = orig; col3ReplaceBtn.style.background = "#059669"; }, 2200);
    };
    col3.appendChild(col3ReplaceBtn);

    // Divider
    const col3Div = document.createElement("div");
    col3Div.style.cssText = "height:1px;background:#e5e1da;margin:0 0 8px;flex-shrink:0;";
    col3.appendChild(col3Div);

    // Fill status
    const col3FillStatus = document.createElement("div");
    col3FillStatus.style.cssText = "display:none;margin-bottom:8px;font-size:12px;padding:6px 9px;border-radius:6px;font-weight:600;flex-shrink:0;";
    col3.appendChild(col3FillStatus);

    body.appendChild(col3);

    document.body.appendChild(overlay);

    // ── Open panel function ───────────────────────────────────────────
    window._openTransPanel = function(cnText) {
        if (cnText !== undefined) {
            col1Ta.value = cnText;
            _panelCnText = cnText;
        }
        // Sync web title inputs from sidebar
        const wcn = window._getWebTitleCnInput ? window._getWebTitleCnInput().value : "";
        const wvi = window._getWebTitleViInput ? window._getWebTitleViInput().value : "";
        col1WebCnInput.value = wcn;
        col1WebViInput.value = wvi;
        _panelWebCn = wcn; _panelWebVi = wvi;
        overlay.classList.add("active");
        col1Ta.focus();
    };

    // Keep web vi in sync when sidebar web vi updates
    const _syncWebVi = () => {
        const wvi = window._getWebTitleViInput ? window._getWebTitleViInput().value : "";
        col1WebViInput.value = wvi;
        _panelWebVi = wvi;
    };
    // Poll for web vi updates while panel is open
    overlay.addEventListener("animationstart", _syncWebVi);

    // ── Translate (header button) ────────────────────────────────────
    hdrDichBtn.onclick = async () => {
        const cnText = col1Ta.value.trim();
        const webCn  = col1WebCnInput.value.trim();
        if (!cnText && !webCn) { alert("Vui lòng nhập văn bản tiếng Trung hoặc tên web!"); return; }

        hdrDichBtn.innerHTML = `<span class="wt-spin"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 12a9 9 0 11-6.22-8.56"/></svg></span> Đang dịch…`;
        hdrDichBtn.style.background = "#6c757d";
        hdrDichBtn.disabled = true;

        try {
            const [resVi, resHv, resWebVi] = await Promise.all([
                translateTextAPI(cnText, "vi"),
                translateTextAPI(cnText, "hv"),
                translateTextAPI(webCn, "vi")
            ]);

            if (cnText) {
                const cappedVi = _capFull(resVi);
                col2TaVi.value = cappedVi;
                col2TaHv.value = resHv;
                _panelViText = cappedVi;
                _panelHvText = resHv;
            }

            if (webCn && resWebVi) {
                const cappedWebVi = _capFull(resWebVi.trim());
                col1WebViInput.value = cappedWebVi;
                _panelWebVi = cappedWebVi;
                // Also update sidebar
                const sideVi = window._getWebTitleViInput ? window._getWebTitleViInput() : null;
                if (sideVi) sideVi.value = cappedWebVi;
            }
        } catch (err) {
            alert("Lỗi dịch: " + (err?.message || String(err)));
        } finally {
            hdrDichBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 010 20M12 2a15 15 0 000 20"/></svg> Dịch`;
            hdrDichBtn.style.background = "#1C75E1";
            hdrDichBtn.disabled = false;
        }
    };

    // ── Auto Fill Form (header button) ──────────────────────────────
    hdrFillBtn.onclick = () => {
        const cnText  = col1Ta.value;
        const viText  = col2TaVi.value;
        const webCn   = col1WebCnInput.value.trim();
        const webVi   = col1WebViInput.value.trim();

        if (!cnText || !viText) {
            alert("Cần có văn bản gốc và bản dịch để tự động điền!");
            return;
        }

        // Parse từ văn bản GỐC (cnText) — dùng marker tiếng Việt vì thực tế file dùng vậy
        const titleCnMatch  = cnText.match(/Tên (?:sách|truyện)[：:]\s*(.*)/i);
        const authorCnMatch = cnText.match(/(?:作者|Tác giả)[：:]\s*(.*)/i);
        const tagCnMatch    = cnText.match(/Nhãn[：:]\s*(.*)/i);

        // Parse từ bản DỊCH (viText)
        const titleViMatch  = viText.match(/Tên (?:sách|truyện)[：:]\s*(.*)/i);
        const authorViMatch = viText.match(/Tác giả[：:]\s*(.*)/i);
        const categoryMatch = viText.match(/Phân loại[：:]\s*(.*)/i);
        const tagMatch      = viText.match(/Nhãn[：:]\s*(.*)/i);
        const summaryMatch  = viText.match(/(?:Tóm tắt|Giới thiệu)[：:]\s*([\s\S]*)/i);
        const summary = summaryMatch ? summaryMatch[1].trim() : "";

        // txtTitleVi: webVi / tên từ bản dịch
        const rawFileTitleVi = titleViMatch ? titleViMatch[1].trim() : "";
        let finalTitleVi = "";
        if (webVi && rawFileTitleVi) {
            finalTitleVi = webVi + " / " + rawFileTitleVi;
        } else if (webVi) {
            finalTitleVi = webVi;
        } else {
            finalTitleVi = rawFileTitleVi;
        }
        finalTitleVi = _capFull(finalTitleVi);

        // txtTitleCn: webCn / tên từ văn bản gốc
        const rawFileTitleCn = titleCnMatch ? titleCnMatch[1].trim() : "";
        let finalTitleCn = "";
        if (webCn && rawFileTitleCn) {
            finalTitleCn = webCn;  // chỉ dùng webCn, không ghép vì CN không cần /
        } else if (webCn) {
            finalTitleCn = webCn;
        } else {
            finalTitleCn = rawFileTitleCn;
        }

        // txtAuthorCn: lấy từ văn bản gốc (giữ nguyên ký tự gốc)
        const finalAuthorCn = authorCnMatch ? authorCnMatch[1].trim() : "";

        // txtDescVi: Nhãn (VI) + Tóm tắt (VI) — không có Phân loại nếu không có
        let descParts = [];
        if (categoryMatch) descParts.push("Phân loại: " + categoryMatch[1].trim());
        if (tagMatch)      descParts.push("Nhãn: " + tagMatch[1].trim());
        if (summary)       { if (descParts.length) descParts.push(""); descParts.push("Tóm tắt:\n" + summary); }
        const finalDesc = descParts.join("\n");

        const fire = (el, val) => { if (!el || !val) return false; el.value = val; el.dispatchEvent(new Event("input", {bubbles:true})); el.dispatchEvent(new Event("change", {bubbles:true})); return true; };
        const inputTitleVi  = document.getElementById("txtTitleVi");
        const inputTitleCn  = document.getElementById("txtTitleCn");
        const inputAuthorCn = document.getElementById("txtAuthorCn");
        const inputDescVi   = document.getElementById("txtDescVi");

        const ok = [
            fire(inputTitleVi, finalTitleVi),
            fire(inputTitleCn, finalTitleCn),
            finalAuthorCn && fire(inputAuthorCn, finalAuthorCn),
            finalDesc && fire(inputDescVi, finalDesc)
        ].some(Boolean);

        if (inputDescVi && finalDesc) {
            inputDescVi.style.height = "auto";
            inputDescVi.style.height = inputDescVi.scrollHeight + "px";
        }

        if (ok) {
            col3FillStatus.textContent = "✅ Đã điền xong!";
            col3FillStatus.style.cssText = "display:block;margin-bottom:8px;font-size:12px;padding:6px 9px;border-radius:6px;font-weight:600;background:#d1fae5;color:#065f46;border:1px solid #a7f3d0;flex-shrink:0;";
            hdrFillBtn.style.background = "#28a745";
            hdrFillBtn.innerHTML = `✅ Đã điền!`;
            setTimeout(() => {
                col3FillStatus.style.display = "none";
                hdrFillBtn.style.background = "#FF9800";
                hdrFillBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="13" y2="17"/></svg> Tự động điền Form`;
            }, 2500);
            const _lblBtn = document.getElementById("lblGetBtn");
            if (_lblBtn) _lblBtn.scrollIntoView({ behavior:"smooth", block:"center" });
        } else {
            alert("Không tìm thấy các ô input trên web để điền!");
        }
    };

    // col1WebCnInput: on change, translate web title automatically on blur
    col1WebCnInput.addEventListener("blur", async () => {
        const v = col1WebCnInput.value.trim();
        if (!v) return;
        try {
            const r = await translateTextAPI(v, "vi");
            if (r) {
                const capped = r.trim().replace(/^(.)/, c => c.toUpperCase());
                col1WebViInput.value = capped;
                _panelWebVi = capped;
                const sideVi = window._getWebTitleViInput ? window._getWebTitleViInput() : null;
                if (sideVi) sideVi.value = capped;
            }
        } catch(e) {}
    });

})();



$=document.createElement("div"),e=($.style.cssText="margin-top: 8px; margin-bottom: 8px;",document.createElement("input")),A=(e.type="file",e.id="splitFileInput",e.accept=".txt",e.style.display="none",document.createElement("label"));A.setAttribute("for","splitFileInput"),A.style.cssText=`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    background: #1C75E1;
    color: #ffffff;
    padding: 9px;
    border-radius: 8px;
    cursor: pointer;
    text-align: center;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s;
    border: none;
    box-shadow: 0 2px 8px rgba(26,86,161,0.4);
`,A.innerHTML=`
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
        <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
        <polyline points="13 2 13 9 20 9"/>
    </svg>
    <span style="color:white">Chọn file</span>
`,$.appendChild(e),$.appendChild(A),te.appendChild($);const Re=document.createElement("div");Re.style.cssText="color: #374151; font-size: 13px; margin-bottom: 8px; display: none; padding: 0 4px;",te.appendChild(Re);A=document.createElement("div"),$=(A.style.cssText="margin-bottom: 8px; padding: 0 4px;",document.createElement("div"));$.textContent="Chọn Rule Chia:",$.style.cssText="color: #374151; font-size: 13px; margin-bottom: 6px; font-weight: 600;",A.appendChild($);const ne=document.createElement("select"),oe=(ne.style.cssText=`
            display: block !important;
            visibility: visible !important;
            opacity: 1 !important;
            appearance: auto !important;
            -webkit-appearance: auto !important;
            width: 100%;
            padding: 6px;
            border: 1px solid #d6cfc4;
            border-radius: 6px;
            font-size: 14px;
            color: #374151;
            background-color: #ffffff;
            min-height: 38px;
        `,ne.innerHTML=`
    <option value="blankLines">Rule 1: Theo số dòng trắng</option>
    <option value="regex1">Rule 2: Chương/Hồi (第.*章)</option>
    <option value="novelDownloader">Rule 3: Novel Downloader (======)</option>
`,A.appendChild(ne),te.appendChild(A),document.createElement("div"));oe.style.cssText="margin-bottom: 0; padding: 0 4px; display: block;";$=document.createElement("div");$.textContent="Số dòng trắng giữa các chương:",$.style.cssText="color: #374151; font-size: 13px; margin-bottom: 6px; font-weight: 600;",oe.appendChild($);const ie=document.createElement("input");ie.type="number",ie.min="1",ie.value="1",ie.style.cssText=`
    width: 100%;
    padding: 6px;
    border: 1px solid #d6cfc4;
    border-radius: 6px;
    font-size: 14px;
    margin-bottom: 0;
    display: block;
`,oe.appendChild(ie),te.appendChild(oe);A=document.createElement("div"),$=(A.style.cssText="margin-bottom: 8px; padding: 0 4px;",document.createElement("div"));$.textContent="Số file bắt đầu:",$.style.cssText="color: #374151; font-size: 13px; margin-bottom: 6px; font-weight: 600;",A.appendChild($);const le=document.createElement("input");le.type="number",le.min="0",le.value="0",le.style.cssText=`
    width: 100%;
    padding: 6px;
    border: 1px solid #d6cfc4;
    border-radius: 6px;
    font-size: 14px;
    margin-bottom: 0;
`,A.appendChild(le),te.appendChild(A);const Ue="UTF-8";const ae=document.createElement("button"),re=(ae.innerHTML=`
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
                <circle cx="6" cy="6" r="3"></circle>
                <circle cx="6" cy="18" r="3"></circle>
                <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
            </svg>
            Chia
        `,ae.style.cssText=`
    width: 100%;
    padding: 9px;
    background: #DC1DB6;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: 8px;
    box-shadow: 0 2px 8px rgba(160,26,133,0.45);
`,ae.onmouseover=()=>{ae.style.background="#70126e"},ae.onmouseout=()=>{ae.style.background="#DC1DB6"},te.appendChild(ae),document.createElement("div"));re.style.cssText="display: none;",te.appendChild(re);A=document.createElement("div"),$=(A.style.cssText="padding: 0 4px; margin-top: 6px;",document.createElement("div"));$.style.cssText="color: #374151; font-size: 13px; font-weight: 600; margin-bottom: 4px;",$.textContent="Kết quả:",A.appendChild($);const We=document.createElement("div");We.style.cssText="color: #374151; font-size: 12px; margin-bottom: 4px;",A.appendChild(We);$=document.createElement("div");$.style.cssText="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;";const se=document.createElement("input");se.type="checkbox",se.id="selectAllCheckbox",se.checked=!0,se.style.cssText="width: 16px; height: 16px; cursor: pointer; accent-color: #007bff;";var H=document.createElement("label"),H=(H.setAttribute("for","selectAllCheckbox"),H.textContent="Chọn tất cả",H.style.cssText="font-size: 13px; font-weight: 600; color: #374151; cursor: pointer; user-select: none;",$.appendChild(se),$.appendChild(H),A.appendChild($),document.createElement("div")),$=(H.style.cssText="display: flex; flex-direction: row; gap: 6px; margin-bottom: 6px; align-items: center;",document.createElement("div")),he=($.style.cssText="display: flex; flex-direction: row; gap: 6px; flex: 1; align-items: center; min-width: 0;",document.createElement("div")),F=(he.style.cssText="display: flex; align-items: center; gap: 4px; flex: 1;",document.createElement("span"));F.textContent="Từ:",F.style.cssText="color: #374151; font-weight: 500; font-size: 13px; width: 28px; flex-shrink: 0;";const qe=document.createElement("input");qe.type="number",qe.min="0",qe.placeholder="0",qe.style.cssText="flex: 1; padding: 6px; border: 1px solid #d6cfc4; border-radius: 6px; font-size: 13px; height: 32px; box-sizing: border-box;",he.appendChild(F),he.appendChild(qe);var F=document.createElement("div"),R=(F.style.cssText="display: flex; align-items: center; gap: 4px; flex: 1;",document.createElement("span"));R.textContent="Đến:",R.style.cssText="color: #374151; font-weight: 500; font-size: 13px; width: 28px; flex-shrink: 0;";const je=document.createElement("input"),de=(je.type="number",je.min="0",je.placeholder="Cuối",je.style.cssText="flex: 1; padding: 6px; border: 1px solid #d6cfc4; border-radius: 6px; font-size: 13px; height: 32px; box-sizing: border-box;",F.appendChild(R),F.appendChild(je),$.appendChild(he),$.appendChild(F),document.createElement("button")),pe=(de.textContent="Áp dụng",de.style.cssText="padding: 6px 10px; background: #61462F; color: white; border: none; border-radius: 6px; font-size: 13px; cursor: pointer; transition: all 0.2s; white-space: nowrap; flex-shrink: 0; box-shadow: 0 2px 8px rgba(97,70,47,0.4); font-weight: 600;",de.onmouseover=()=>{de.style.background="#3e2c1c"},de.onmouseout=()=>{de.style.background="#61462F"},H.appendChild($),H.appendChild(de),A.appendChild(H),re.appendChild(A),document.createElement("div")),Oe=(pe.style.cssText=`
            max-height: 200px;
            overflow-y: auto;
            border: 1px solid #d6cfc4;
            border-radius: 6px;
            padding: 6px;
            background: #fafaf8;
            margin-bottom: 6px;
        `,re.appendChild(pe),document.createElement("div"));Oe.style.cssText="color: #374151; font-size: 12px; font-weight: 600; margin-bottom: 4px; padding: 0 4px;",re.appendChild(Oe);R=document.createElement("div");R.style.cssText="display: flex; gap: 8px; margin-bottom: 6px;";const ce=document.createElement("button"),xe=(ce.innerHTML="Tải ZIP",ce.style.cssText=`
    flex: 1;
    padding: 9px;
    background: #61462F;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(97,70,47,0.45);
`,ce.onmouseover=()=>{ce.style.background="#3e2c1c"},ce.onmouseout=()=>{ce.style.background="#61462F"},document.createElement("button"));function ge(){var e=pe.querySelectorAll('input[type="checkbox"]'),t=Array.from(e).filter(e=>e.checked).length;Oe.textContent=`Đã chọn: ${t}/${e.length} chương`}function ye(){var e=pe.querySelectorAll('input[type="checkbox"]:checked');return Array.from(e).map(e=>{e=parseInt(e.dataset.chapterIndex);return s[e]})}xe.innerHTML="Upload",xe.style.cssText=`
    flex: 1;
    padding: 9px;
    background: #399F49;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 2px 8px rgba(48,97,55,0.45);
`,xe.onmouseover=()=>{xe.style.background="#1f4025"},xe.onmouseout=()=>{xe.style.background="#399F49"},R.appendChild(ce),R.appendChild(xe),re.appendChild(R),O.onclick=()=>{h="upload",O.style.borderBottomColor="#399F49",O.style.color="#399F49",D.style.borderBottomColor="transparent",D.style.color="#374151",TransTabBtn.style.borderBottomColor="transparent",TransTabBtn.style.color="#374151",CoverTabBtn.style.borderBottomColor="transparent",CoverTabBtn.style.color="#374151",P.style.display="block",te.style.display="none",TransTabContainer.style.display="none",CoverTabContainer.style.display="none"},D.onclick=()=>{h="split",D.style.borderBottomColor="#DC1DB6",D.style.color="#DC1DB6",O.style.borderBottomColor="transparent",O.style.color="#374151",TransTabBtn.style.borderBottomColor="transparent",TransTabBtn.style.color="#374151",CoverTabBtn.style.borderBottomColor="transparent",CoverTabBtn.style.color="#374151",te.style.display="block",P.style.display="none",TransTabContainer.style.display="none",CoverTabContainer.style.display="none"},TransTabBtn.onclick=()=>{h="translate",TransTabBtn.style.borderBottomColor="#1C75E1",TransTabBtn.style.color="#1C75E1",O.style.borderBottomColor="transparent",O.style.color="#374151",D.style.borderBottomColor="transparent",D.style.color="#374151",CoverTabBtn.style.borderBottomColor="transparent",CoverTabBtn.style.color="#374151",TransTabContainer.style.display="block",P.style.display="none",te.style.display="none",CoverTabContainer.style.display="none"},e.onchange=e=>{(d=e.target.files[0])&&(Re.textContent="📄 "+d.name,Re.style.display="block",re.style.display="none")},document.body.appendChild(U),ae.onclick=async()=>{if(d){ae.disabled=!0,ae.textContent="⏳ Đang chia...";try{var t,n=await new Promise((t,e)=>{var n=new FileReader;n.onload=e=>t(e.target.result),n.onerror=e,n.readAsText(d,Ue)}),o=ne.value,i=parseInt(le.value)||0;let e=[];"regex1"===o?e=await async function(t,n){for(var e,o,i,l=/^\s*(?:番外|第\s{0,4}[\d〇零一二两三四五六七八九十百千万壹贰叁肆伍陆柒捌玖拾佰仟]+\s{0,4}[章节回]).*$/gm,a=[],r=[];null!==(e=l.exec(t));)r.push({index:e.index,title:e[0].trim()});0<r.length&&0<r[0].index&&0<(o=t.substring(0,r[0].index).trim()).length&&(i=o.split("\n")[0].trim()||"Giới thiệu",a.push({number:n,title:i,content:o}));var s=0<r.length&&0<r[0].index&&0<t.substring(0,r[0].index).trim().length?1:0;for(let e=0;e<r.length;e++){var d=r[e].index,p=e<r.length-1?r[e+1].index:t.length,d=t.substring(d,p).trim(),p=d.split("\n")[0].trim();a.push({number:n+s+e,title:p,content:d})}return a}(n,i):"blankLines"===o?(t=parseInt(ie.value)||2,e=await async function(e,t,n){var o=[],i=e.split("\n");let l=[],a=0,r=n;for(let e=0;e<i.length;e++){var s,d,p=i[e];""===p.trim()?a++:(a>=t&&l.length>t&&(0<(s=l.join("\n").trim()).length&&(d=s.split("\n")[0].trim()||"Chương "+r,o.push({number:r,title:d,content:s}),r++),l=[]),a=0),l.push(p)}return 0<l.length&&0<(e=l.join("\n").trim()).length&&(n=e.split("\n")[0].trim()||"Chương "+r,o.push({number:r,title:n,content:e})),o}(n,t,i)):"novelDownloader"===o&&(e=await async function(e,t){var n=[],o=e.split(/\n={5,}\n/g);for(let e=0;e<o.length;e++){var i,l=o[e].trim();0!==l.length&&(i=l.split("\n")[0].trim()||"Chương "+(t+e),n.push({number:t+e,title:i,content:l}))}return n}(n,i)),0===e.length?alert("Không tìm thấy chương nào! Vui lòng kiểm tra lại rule."):(s=e,We.textContent=`Tổng: ${e.length} chương`,pe.innerHTML="",e.forEach((e,t)=>{var n=document.createElement("div");n.style.cssText="display: flex; align-items: center; gap: 8px; padding: 6px; border-bottom: 1px solid #e5e1da;";const o=document.createElement("input");o.type="checkbox",o.checked=!0,o.dataset.chapterIndex=t,o.style.cssText="cursor: pointer; accent-color: #007bff;";var t=document.createElement("label"),i=40<e.title.length?e.title.substring(0,40)+"...":e.title;t.textContent=e.number+". "+i,t.style.cssText="flex: 1; font-size: 13px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;",t.title=e.number+". "+e.title,t.onclick=()=>{o.checked=!o.checked,ge()},n.appendChild(o),n.appendChild(t),pe.appendChild(n)}),re.style.display="block",(()=>{const firstCb=pe.querySelector('input[type="checkbox"]');firstCb&&(firstCb.checked=!1)})(),ge())}catch(e){alert("Lỗi khi chia chương: "+e.message),console.error(e)}finally{ae.disabled=!1,ae.innerHTML=`
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 6px;">
                        <circle cx="6" cy="6" r="3"></circle>
                        <circle cx="6" cy="18" r="3"></circle>
                        <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                        <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                        <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
                    </svg>
                    Chia
                `}}else alert("Vui lòng chọn file gốc!")},se.onchange=()=>{const t=se.checked;pe.querySelectorAll('input[type="checkbox"]').forEach(e=>e.checked=t),ge()},de.onclick=()=>{const n=parseInt(qe.value)||0,o=parseInt(je.value)||s.length-1;pe.querySelectorAll('input[type="checkbox"]').forEach((e,t)=>{t=s[t].number;e.checked=t>=n&&t<=o}),ge()},ce.onclick=async()=>{var e=ye();if(0===e.length)alert("Vui lòng chọn ít nhất 1 chương!");else try{ce.disabled=!0,ce.textContent="⏳ Đang nén...";const l=new JSZip;e.forEach(e=>{var t=String(e.number).padStart(5,"0")+".txt";l.file(t,e.content)});var t=await l.generateAsync({type:"blob",compression:"DEFLATE",compressionOptions:{level:6}}),n=d?d.name.replace(/\.txt$/i,"_chapters.zip"):"chapters.zip",o=URL.createObjectURL(t),i=document.createElement("a");i.href=o,i.download=n,document.body.appendChild(i),i.click(),document.body.removeChild(i),URL.revokeObjectURL(o),ce.disabled=!1,ce.textContent="Tải ZIP"}catch(e){console.error("Lỗi khi tạo ZIP:",e),alert("Lỗi khi tạo file ZIP: "+e.message),ce.disabled=!1,ce.textContent="Tải ZIP"}},xe.onclick=()=>{var e=ye();0===e.length?alert("Vui lòng chọn ít nhất 1 chương!"):(t=e.map(e=>{var t=new Blob([e.content],{type:"text/plain"});return new File([t],e.number+".txt",{type:"text/plain"})}),O.click(),ue(),a&&(a.value=t.length,a.dispatchEvent(new Event("input",{bubbles:!0})),a.dispatchEvent(new Event("change",{bubbles:!0}))),(()=>{const el=document.querySelector('input[name="descCn"]');el&&(el.value=t.length,el.dispatchEvent(new Event("input",{bubbles:!0})),el.dispatchEvent(new Event("change",{bubbles:!0})))})(),r&&r.checked&&(r.checked=!1,r.dispatchEvent(new Event("change",{bubbles:!0}))),K.textContent=`Đã chọn ${t.length} file từ Chia Chương`,K.style.cssText=`
        color: #155724;
        font-size: 13px;
        margin-top: 6px;
        margin-bottom: 6px;
        display: block;
        font-weight: 600;
        padding-left: 4px;
        background: #d4edda;
        padding: 8px;
        border-radius: 4px;
    `,ze.innerHTML="<strong>Danh sách chương:</strong><br>"+e.map((e,t)=>t+1+". "+e.title).join("<br>"),ze.style.display="block")},U.addEventListener("mousedown",e=>{var t;!i&&(e.target.closest("input")||e.target.closest("textarea")||e.target.closest("label")||e.target.closest("button")||e.target.closest("select")||e.target.closest("#chapterFilterInput")||e.target.closest(".checkbox-wrapper"))||(w=!0,C=!1,y=e.clientX,f=e.clientY,t=U.getBoundingClientRect(),b=t.left,v=t.top,U.style.cursor="grabbing",U.style.transition="none",e.preventDefault())}),document.addEventListener("mousemove",e=>{var t,n,o;w&&(o=e.clientX-y,e=e.clientY-f,(5<Math.abs(o)||5<Math.abs(e))&&(C=!0),o=b+o,e=v+e,n=U.getBoundingClientRect(),t=window.innerWidth-n.width-20,n=window.innerHeight-n.height-20,o=Math.max(20,Math.min(o,t)),e=Math.max(20,Math.min(e,n)),U.style.left=o+"px",U.style.top=e+"px",U.style.right="auto")}),document.addEventListener("mouseup",()=>{w&&(w=!1,U.style.cursor="move",U.style.transition="all 0.3s ease")}),window.addEventListener("resize",()=>{var e,t,n,o;i&&!C?(t=.05*window.innerWidth,t=window.innerWidth-ke-t,U.style.left=t+"px"):i||(n=(t=U.getBoundingClientRect()).left,o=t.top,e=window.innerWidth-t.width-20,t=window.innerHeight-t.height-20,n=Math.max(20,Math.min(n,e)),o=Math.max(20,Math.min(o,t)),U.style.left=n+"px",U.style.top=o+"px",U.style.right="auto")});const De=()=>{if(!w)if(i&&C)C=!1;else{i=!i;var e,t=U.getBoundingClientRect();let n=t.left,o=t.top;U.style.transition="none",i?(t=t.width,q.style.display="none",Ee.style.display="none",P.style.display="none",te.style.display="none",TransTabContainer.style.display="none",CoverTabContainer.style.display="none",U.style.display="flex",U.style.flexDirection="row",U.style.minWidth="56px",U.style.maxWidth="56px",U.style.padding="0",U.style.background="#2c3e50",U.style.borderRadius="50%",U.style.width="56px",U.style.height="56px",U.style.border="none",W.style.display="flex",t=t-ke,n+=t,t=window.innerWidth-56-20,e=window.innerHeight-56-20,n=Math.max(20,Math.min(n,t)),o=Math.max(20,Math.min(o,e)),U.style.left=n+"px",U.style.top=o+"px",U.style.right="auto",setTimeout(()=>{U.style.transition="all 0.3s ease"},50)):(t=n,U.style.display="flex",U.style.flexDirection="column",U.style.minWidth="340px",U.style.maxWidth="340px",U.style.padding="16px",U.style.background="#ffffff",U.style.borderRadius="12px",U.style.width="auto",U.style.height="auto",U.style.border="1px solid rgba(0,0,0,0.08)",W.style.display="none",q.style.display="flex",Ee.style.display="flex",Z.style.display="none",Q.style.display="none",J.style.display="none","upload"===h?(P.style.display="block",te.style.display="none",TransTabContainer.style.display="none",CoverTabContainer.style.display="none"):"split"===h?(P.style.display="none",te.style.display="block",TransTabContainer.style.display="none",CoverTabContainer.style.display="none"):"cover"===h?(P.style.display="none",te.style.display="none",TransTabContainer.style.display="none",CoverTabContainer.style.display="block"):(P.style.display="none",te.style.display="none",TransTabContainer.style.display="block",CoverTabContainer.style.display="none"),n=t-284,setTimeout(()=>{var e=U.getBoundingClientRect(),t=window.innerWidth-e.width-20,e=window.innerHeight-e.height-20,t=(n=Math.max(20,Math.min(n,t)),o=Math.max(20,Math.min(o,e)),U.style.left=n+"px",U.style.top=o+"px",U.style.right="auto",parseInt(U.style.top)),e=window.innerHeight-t-40,t=Math.max(300,Math.min(e,600));U.style.maxHeight=t+"px",Se.style.maxHeight=t-110+"px",U.style.transition="all 0.3s ease"},10)),C=false}};W.onclick=e=>{e.stopPropagation(),De()};let T=!(j.onclick=e=>{e.stopPropagation(),De()}),E=!1,S,M=[],z=0,L=0,B=0,I=0;function fe(e){var t=0<I?Math.floor(e/I*100):0;He.textContent=`Đang xử lý: ${e}/${I} file (${t}%)`,Fe.style.width=t+"%"}function be(e=!1){ee.style.display="block",e?(Z.style.display="none",Q.textContent="✅ Xử lý Hoàn tất.",Q.style.display="block",G.style.display="flex",T=!1,J.style.display="none",setTimeout(()=>{Q.style.display="none"},5e3),(()=>{const btn=document.getElementById("lblGetBtn");btn&&btn.scrollIntoView({behavior:"smooth",block:"center"})})(),setTimeout(()=>{if(typeof window._applyDuSuffix==="function")window._applyDuSuffix();},800)):(Z.style.display="block",Q.style.display="none",J.style.display="flex")}async function ve(){if(0!==M.length&&E){var{form:e,file:n,index:o}=M.shift();let t="";var d,i=n.name;try{t=(nameSource==="fileName"?(function(){var fn=n.name.replace(/\.txt$/i,"");fn=fn.replace(/^\d+[_\-\s]+/,"").trim();return fn||n.name.replace(/\.txt$/i,"");})():await(d=n,new Promise(s=>{var e=new FileReader;e.onload=e=>{let t=e.target.result;var n;let o="";for(n of(t=65279===t.charCodeAt(0)?t.substring(1):t).split("\n")){var i=n.trim();if(0<i.length){o=i;break}}if(0===o.length)s(d.name.replace(/\.txt$/i,""));else{var e=o.indexOf("||"),e=(o=(o=-1!==e?o.substring(e+2).trim():o).replace(/\s+/g," ").trim()).match(/(第\s*[一二三四五六七八九十百千万\d]+\s*章)/i),l=o.match(/(chapter\s*\d+|part\s*\d+|c\s*\d+)/i),e=(e&&l&&(e=l[0],l=new RegExp(e.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&"),"i"),o=o.replace(l,"").trim()),g.value.trim().split(",").map(e=>e.trim()).filter(e=>0<e.length));if(0<e.length){let t=o;e.forEach(e=>{e=e.replace(/[-\/\\^$*+?.()|[\]{}]/g,"\\$&"),e=new RegExp(`\\s*${e}\\s*`,"g");t=t.replace(e," ").trim()}),o=t.replace(/\s+/g," ").trim()}if(x&&-1!==(l=o.indexOf(" - "))&&(o=o.substring(0,l).trim()),u){var a=[];for(const r of(o=o.replace(/(第\s*\S+?\s*章)\s+(第\s*\S+?\s*章)/g,"$1")).split(/\s+/).filter(e=>0<e.length))0!==a.length&&a[a.length-1]===r||a.push(r);o=a.join(" ")}s(o)}},e.readAsText(d,m)})))}catch(e){t=i.replace(/\.txt$/i,""),console.error(`[Wiki Upload ERROR] Lỗi khi đọc file ${i}:`,e)}fe(++z);var l=e.fileInput,e=e.nameInput;try{var a=new DataTransfer,r=(a.items.add(n),l.files=a.files,l.dispatchEvent(new Event("change",{bubbles:!0})),l.dispatchEvent(new Event("input",{bubbles:!0})),e.value=t,e.dispatchEvent(new Event("input",{bubbles:!0})),e.dispatchEvent(new Event("change",{bubbles:!0})),await new Promise(e=>setTimeout(e,50)),L++,document.createElement("div"));r.style.cssText="color: #374151;",r.innerHTML=`
                    <span style="color: #399F49; font-weight: 700; margin-right: 5px;">✔</span>
                    ${t}
                `,ee.firstChild?ee.insertBefore(r,ee.firstChild):ee.appendChild(r)}catch(e){B++,console.error(`[Wiki Upload CRITICAL ERROR] File ${o} (${i}): `+e.message,e);n=document.createElement("div");n.style.cssText="color: #721c24;",n.innerHTML=`
                    <span style="color: #dc3545; font-weight: 700; margin-right: 5px;">✘</span>
                    Lỗi xử lý file: ${i}
                `,ee.firstChild?ee.insertBefore(n,ee.firstChild):ee.appendChild(ee)}"none"===ee.style.display&&(ee.style.display="block"),ee.scrollTop=ee.scrollHeight,setTimeout(ve,50)}else be(!(E=!1))}G.onclick=async()=>{if(T)return;let jobs=[];if(uploadQueue.length>0){jobs=[...uploadQueue];if(t.length>0&&p&&"-1"!==V.value){const selIdx=parseInt(V.value);const volName=(()=>{const opt=V.options[V.selectedIndex];return opt?opt.textContent:"Quyển "+(selIdx+1);})();jobs.push({volumeWrapper:p,files:[...t],volumeName:volName});}}else{if(0===t.length){alert("Vui lòng chọn file TXT để upload.");return;}if(!p||"-1"===V.value){alert("Vui lòng chọn một Quyển hợp lệ để upload chương.");return;}jobs=[{volumeWrapper:p,files:[...t],volumeName:""}];}if(jobs.length===0){alert("Không có gì để upload.");return;}T=!0;E=!0;L=0;B=0;z=0;M=[];ee.innerHTML="";for(const job of jobs){p=job.volumeWrapper;ue();a&&(a.value=job.files.length,a.dispatchEvent(new Event("input",{bubbles:!0})),a.dispatchEvent(new Event("change",{bubbles:!0})));(()=>{const el=document.querySelector('input[name="descCn"]');el&&(el.value=job.files.length,el.dispatchEvent(new Event("input",{bubbles:!0})),el.dispatchEvent(new Event("change",{bubbles:!0})))})();r&&r.checked&&(r.checked=!1,r.dispatchEvent(new Event("change",{bubbles:!0})));await new Promise(res=>setTimeout(res,400));S=p?Array.from(p.querySelectorAll(".chapter-info-wrapper")).map(e=>{var t=e.querySelector('input[name="name"][type="text"]'),n=e.querySelector('input[type="file"][name="file"]');return t&&n&&null!==e.offsetParent?{nameInput:t,fileInput:n}:null}).filter(e=>null!==e):[];if(0===S.length){alert(`Không tìm thấy ô nhập liệu chương trong quyển "${job.volumeName||"đã chọn"}". Bỏ qua.`);continue;}if(job.files.length>S.length)if(!confirm(`Quyển "${job.volumeName||"đã chọn"}": chọn ${job.files.length} file nhưng chỉ có ${S.length} ô. Chỉ xử lý ${S.length} file đầu. Tiếp tục?`)){T=!1;E=!1;return;}const cnt=Math.min(job.files.length,S.length);for(let e=0;e<cnt;e++)M.push({form:S[e],file:job.files[e],index:M.length+1});}if(0===M.length){T=!1;E=!1;alert("Không tìm thấy ô nhập liệu chương nào.");return;}I=M.length;uploadQueue=[];renderQueue();G.style.display="none";J.style.display="flex";be();fe(0);ve();},(()=>{})(),he=document.body,new MutationObserver((e,t)=>{let n=!1;for(const o of e)if("childList"===o.type){if(Array.from(o.addedNodes).some(e=>1===e.nodeType&&(e.matches(".volume-info-wrapper")||e.querySelector(".volume-info-wrapper")))){n=!0;break}if(Array.from(o.removedNodes).some(e=>1===e.nodeType&&(e.matches(".volume-info-wrapper")||e.querySelector(".volume-info-wrapper")))){n=!0;break}}n&&(window.rebuildTimer&&clearTimeout(window.rebuildTimer),window.rebuildTimer=setTimeout(me,100))}).observe(he,{childList:!0,subtree:!0}),setTimeout(me,500);// CoverTabBtn click
CoverTabBtn.onclick=()=>{
    h="cover";
    [O,D,TransTabBtn,CoverTabBtn].forEach(b=>{b.style.borderBottomColor="transparent";b.style.color="#374151";});
    CoverTabBtn.style.borderBottomColor="#e67e22";CoverTabBtn.style.color="#e67e22";
    P.style.display="none";te.style.display="none";TransTabContainer.style.display="none";CoverTabContainer.style.display="block";
    _resetTransBg();
};
const _origTransClick=TransTabBtn.onclick;TransTabBtn.onclick=()=>{if(_origTransClick)_origTransClick();TransTabBtn.style.background="linear-gradient(to bottom,#f0f7ff 0%,transparent 100%)";TransTabBtn.style.opacity="1";};const _resetTransBg=()=>{TransTabBtn.style.background="transparent";};O.addEventListener("click",_resetTransBg);D.addEventListener("click",_resetTransBg);if(window.location.pathname.includes("nhung-file")){function autoFillMucLuc(){document.querySelectorAll('.volume-info input[name="nameCn"]').forEach(el=>{if(el&&""===el.value.trim()){el.value="Mục lục";el.dispatchEvent(new Event("input",{bubbles:!0}));el.dispatchEvent(new Event("change",{bubbles:!0}))}})}setTimeout(autoFillMucLuc,800);new MutationObserver(()=>{autoFillMucLuc()}).observe(document.body,{childList:!0,subtree:!0});

// "(đủ N chương)" – tự động thêm vào chương cuối của quyển đầu tiên khi đủ số lượng chương
(function(){
    const CHAPTER_COUNT = 30;
    function getFirstVolumeChapterInputs(){
        const vols = Array.from(document.querySelectorAll(".volume-info-wrapper"));
        if(vols.length === 0) return [];
        const firstVol = vols[0];
        return Array.from(firstVol.querySelectorAll(".chapter-info-wrapper"))
            .map(e => e.querySelector('input[name="name"][type="text"]'))
            .filter(Boolean);
    }
    function applyDuSuffix(){
        const inputs = getFirstVolumeChapterInputs();
        if(inputs.length !== CHAPTER_COUNT) return;
        const lastInput = inputs[CHAPTER_COUNT - 1];
        if(!lastInput) return;
        const curVal = lastInput.value.trim();
        const suffix = " (đủ " + CHAPTER_COUNT + " chương)";
        if(curVal.endsWith(suffix)) return; // already added
        if(curVal === "") return; // not filled yet
        // Remove any previous "(đủ X chương)" pattern
        const cleaned = curVal.replace(/\s*\(đủ \d+ chương\)$/g, "").trim();
        lastInput.value = cleaned + suffix;
        lastInput.dispatchEvent(new Event("input",{bubbles:true}));
        lastInput.dispatchEvent(new Event("change",{bubbles:true}));
    }
    // Expose for external call (e.g. after upload complete)
    window._applyDuSuffix = applyDuSuffix;
    // Hook into upload complete – observe name inputs in first volume
    const _observedInputs = new WeakSet();
    function observeFirstVolume(){
        const inputs = getFirstVolumeChapterInputs();
        inputs.forEach(inp => {
            if(_observedInputs.has(inp)) return;
            _observedInputs.add(inp);
            inp.addEventListener("change", applyDuSuffix);
            inp.addEventListener("input", applyDuSuffix);
        });
        // Also run immediately in case inputs already have values
        applyDuSuffix();
    }
    setTimeout(observeFirstVolume, 1000);
    // Watch for value changes via MutationObserver on attributes too
    new MutationObserver(()=>{ observeFirstVolume(); applyDuSuffix(); }).observe(document.body,{childList:true,subtree:true});
})();
}}function a(){var e=document.getElementById("listName");if(e){e=e.querySelectorAll("li");if(0===e.length)alert("Danh sách name trống!");else{let t="";e.forEach(e=>{e=e.textContent.trim();e&&(t+=e+"\n")});var n,o,e=function(){var e=window.location.pathname.split("/");let t=e[e.length-1]||e[e.length-2];return(!(t=t.split("#")[0].split("?")[0])||t.length<3)&&(e=document.querySelector("h1, .title, .story-title"),t=(e?e.textContent:document.title.split("-")[0]).trim()),(t=t.replace(/[<>:"/\\|?*]/g,"_"))||"truyen"}();n=t,e=`name2_${e}.txt`,n=new Blob([n],{type:"text/plain;charset=utf-8"}),(o=document.createElement("a")).href=URL.createObjectURL(n),o.download=e,document.body.appendChild(o),o.click(),document.body.removeChild(o),URL.revokeObjectURL(o.href)}}else alert("Không tìm thấy danh sách name!")}function t(){if(!document.getElementById("btn-tai-name")&&document.getElementById("listName")){var e=Array.from(document.querySelectorAll("button, .btn, a")).find(e=>"Name"===e.textContent.trim());if(e){var t=document.createElement("div");t.style.cssText="display: block; margin-top: 6px;";const l=document.createElement("button");l.id="btn-tai-name",l.innerHTML=`
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle; margin-right: 6px;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span style="vertical-align: middle;">Tải Name</span>
            `,l.style.cssText=`
                margin: 0;
                padding: 10px 20px;
                background: #612F44;
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                box-shadow: 0 3px 8px rgba(97,47,68,0.4),
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
                `,l.appendChild(t),setTimeout(()=>t.remove(),600),a()}),l.addEventListener("mouseenter",()=>{l.style.background="#7a3a55",l.style.boxShadow=`
                    0 4px 8px rgba(0, 0, 0, 0.4),
                    0 2px 4px rgba(0, 0, 0, 0.2),
                    inset 0 1px 0 rgba(255, 255, 255, 0.15)
                `,l.style.transform="translateY(-2px)"}),l.addEventListener("mouseleave",()=>{l.style.background="#612F44",l.style.boxShadow=`
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
