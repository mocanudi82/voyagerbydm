/* DM kit · core v1 — helpers shared by all personal apps */
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
/* toast + sheet */
let _tt;function toast(m){const e=$('#toast');e.textContent=m;e.style.display='block';clearTimeout(_tt);_tt=setTimeout(()=>e.style.display='none',2800)}
let sheetCb=null;
function openSheet(title,html,cb,o={}){sheetCb=cb;$('#sheet').innerHTML=`<h2>${title}</h2>${html}${cb?`<div class="row" style="margin-top:8px"><button class="btn o sp" data-act="closeSheet">${o.cancel||'Cancel'}</button><button class="btn sp" data-act="sheetOk">${o.ok||'Save'}</button></div>`:`<button class="btn o b" data-act="closeSheet">${o.close||'Close'}</button>`}`;$('#sheetbg').classList.add('on')}
function closeSheet(){$('#sheetbg').classList.remove('on');sheetCb=null}
function vals(){const v={};$$('#sheet [data-f]').forEach(e=>{v[e.dataset.f]=e.type==='checkbox'?e.checked:e.value});return v}
function F(id,label,val,o={}){val=val??'';const t=o.type||'text';
 if(t==='select')return`<label class="f"><b>${label}</b><select data-f="${id}">${o.opts.map(x=>{const[v,l]=Array.isArray(x)?x:[x,x];return`<option value="${esc(v)}" ${v==val?'selected':''}>${esc(l)}</option>`}).join('')}</select></label>`;
 if(t==='area')return`<label class="f"><b>${label}</b><textarea data-f="${id}" placeholder="${esc(o.ph||'')}" rows="${o.rows||3}">${esc(val)}</textarea></label>`;
 if(t==='check')return`<label class="f row"><input type="checkbox" data-f="${id}" ${val?'checked':''}><span>${label}</span></label>`;
 return`<label class="f"><b>${label}</b><input data-f="${id}" type="${t}" value="${esc(val)}" placeholder="${esc(o.ph||'')}" ${o.list?`list="${o.list}"`:''} ${o.step?`step="${o.step}"`:''} ${o.up?'style="text-transform:uppercase"':''}></label>`}
function confirmSheet(text,fn,o={}){openSheet(o.title||'Please confirm',`<div style="margin-bottom:12px">${esc(text)}</div>`,()=>{fn()},{ok:o.ok||'Confirm'})}
/* components (return HTML) */
const dmPill=(cls,t)=>`<span class="pill ${cls||''}">${t}</span>`;
const dmStat=(n,l)=>`<div class="stat"><b>${n}</b><span>${l}</span></div>`;
const dmBar=p=>`<div class="bar"><i style="width:${Math.max(0,Math.min(100,p))}%"></i></div>`;
const dmSeg=(items,cur,act)=>`<div class="seg">${items.map(([k,l])=>`<button class="${k===cur?'on':''}" data-act="${act}" data-k="${k}">${l}</button>`).join('')}</div>`;
const dmChips=(items,cur,act)=>`<div class="chips">${items.map(([k,l])=>`<div class="chip ${k===cur?'on':''}" data-act="${act}" data-k="${k}">${l}</div>`).join('')}</div>`;
const dmAcc=(title,inner,open,alt)=>`<details class="acc ${alt?'alt':''}" ${open?'open':''}><summary>${title}</summary><div>${inner}</div></details>`;
function dmHeader({title,sub='',back=false,by=false,date=true,badge=0,big=false}){const n=new Date(),L=document.documentElement.lang||'en-GB';const dt=n.toLocaleDateString(L,{weekday:'short'}).toUpperCase()+', '+n.getDate()+' '+n.toLocaleDateString(L,{month:'short'}).toUpperCase();const sz=big?'':(String(title).length>16?' xs':' s');
 return`${back?'<button class="hb bk" data-act="back">‹</button>':''}<div class="tt"><h1 class="disco${sz}">${esc(title)}${by?'<span class="by">by DM</span>':''}</h1>${sub?`<div class="sub">${esc(sub)}</div>`:''}</div><div class="hr"><button class="hb" data-act="alerts">🔔${badge?`<span class="cnt">${badge}</span>`:''}</button>${date?`<div class="dt">${dt}</div>`:''}</div>`}
function dmNav(tabs,cur){return tabs.map(([k,ic,l])=>`<button class="${k===cur?'on':''}" data-act="tab" data-t="${k}"><span>${ic}</span>${l}</button>`).join('')}
/* files */
const blobToDataUrl=b=>new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(b)});
const dataUrlToBlob=u=>fetch(u).then(r=>r.blob());
function dl(name,text,type){const b=new Blob([text],{type:type||'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},1500)}
async function copy(t){try{await navigator.clipboard.writeText(t);toast('Copied')}catch(e){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();try{document.execCommand('copy');toast('Copied')}catch(_){toast('Copy not available')}ta.remove()}}
/* IndexedDB: dmDB('app-name',['docs','wallet']) -> {put,get,del,all}(store,...) */
function dmDB(name,stores,ver=1){let p;const open=()=>p||(p=new Promise((res,rej)=>{const r=indexedDB.open(name,ver);r.onupgradeneeded=()=>stores.forEach(s=>{if(!r.result.objectStoreNames.contains(s))r.result.createObjectStore(s,{keyPath:'id'})});r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)}));
 const op=async(s,m,f)=>{const d=await open();return new Promise((res,rej)=>{const tx=d.transaction(s,m),r=f(tx.objectStore(s));tx.oncomplete=()=>res(r.result);tx.onerror=()=>rej(tx.error)})};
 return{put:(s,d)=>op(s,'readwrite',x=>x.put(d)),get:(s,id)=>op(s,'readonly',x=>x.get(id)),del:(s,id)=>op(s,'readwrite',x=>x.delete(id)),all:s=>op(s,'readonly',x=>x.getAll())}}
/* crypto: password-encrypted sections in backups (AES-GCM, PBKDF2) + passcode hash */
const b64=u=>{let s='';for(let i=0;i<u.length;i+=8192)s+=String.fromCharCode.apply(null,u.subarray(i,i+8192));return btoa(s)},unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function aesKey(pw,salt){const k=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveKey']);return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:200000,hash:'SHA-256'},k,{name:'AES-GCM',length:256},false,['encrypt','decrypt'])}
async function encText(text,pw){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const ct=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},await aesKey(pw,salt),new TextEncoder().encode(text)));return{alg:'AES-GCM/PBKDF2-SHA256',s:b64(salt),i:b64(iv),c:b64(ct)}}
async function decText(o,pw){return new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(o.i)},await aesKey(pw,unb64(o.s)),unb64(o.c)))}
async function hashPin(p,salt='dm'){const d=new TextEncoder().encode(salt+':'+p);if(window.crypto&&crypto.subtle){const h=await crypto.subtle.digest('SHA-256',d);return[...new Uint8Array(h)].map(b=>b.toString(16).padStart(2,'0')).join('')}let x=5381;for(const c of d)x=((x<<5)+x+c)>>>0;return'f'+x}
/* theme: 'auto' | 'light' | 'dark' */
function dmTheme(t){if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;else delete document.documentElement.dataset.theme}
/* language: text-node dictionary swap, no per-string markup needed */
function dmI18n(dict,active){if(!active)return;const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;const b=[];while(n=w.nextNode())b.push(n);b.forEach(x=>{const k=x.nodeValue.trim();if(k&&dict[k]!==undefined)x.nodeValue=x.nodeValue.replace(k,dict[k])})}
/* backup envelope shared by all apps: {app,v,at,data,files?,vault?} */
function dmEnvelope(app,data,extra={}){return JSON.stringify({app,v:1,at:new Date().toISOString(),data,...extra})}
function dmOpenEnvelope(txt,app){const o=JSON.parse(txt);if(o.app!==app)throw new Error('Not a '+app+' backup');return o}
/* PWA */
function dmPWA(){if('serviceWorker'in navigator&&location.protocol.startsWith('http'))addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}))}
/* shared event wiring: data-act buttons -> ACT table; sheet ok/close built in */
function dmWire(ACT){document.addEventListener('click',e=>{const t=e.target.closest('[data-act]');if(!t||t.tagName==='INPUT')return;const a=t.dataset.act;if(a==='closeSheet')return closeSheet();if(a==='sheetOk'){const cb=sheetCb;if(cb){Promise.resolve(cb(vals())).then(r=>{if(r!==false)closeSheet()})}return}if(ACT[a])ACT[a](t.dataset,t)});$('#sheetbg').addEventListener('click',e=>{if(e.target.id==='sheetbg')closeSheet()})}
