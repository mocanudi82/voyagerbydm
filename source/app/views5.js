/* ===== v7: countdown, readiness, templates, day planner, quick expense, trip file, journal, auto offline, search, calendar day ===== */
const dIso=d=>isoLocal(d).slice(0,10);
const v7today=()=>dIso(new Date());
const addDays=(s,n)=>dIso(new Date(D(s).getTime()+n*864e5));
function tripDays(t){const r=tripRange(t),o=[];if(!r.start||!r.end||dayDiff(r.start,r.end)>90)return o;for(let d=r.start;d<=r.end;d=addDays(d,1))o.push(d);return o}
const nextTrip=()=>{const td=v7today();return S.trips.filter(t=>{const r=tripRange(t);return r.start&&r.start>td}).sort((a,b)=>tripRange(a).start.localeCompare(tripRange(b).start))[0]};

/* ---------- 2. readiness ---------- */
const RDY_MANUAL=[['ins','Travel insurance'],['visa','Visa / entry permit'],['cash','Cash and cards']];
function readiness(t){const r=tripRange(t),td=v7today(),L=[];const add=(k,ok,txt,o={})=>L.push({k,ok,txt,...o});
 add('dates',!!(r.start&&r.end),r.start&&r.end?'Dates set':'Add trip dates');
 const tr=t.items.filter(i=>['flight','rail','car'].includes(i.type));
 if(r.start&&r.end&&r.start!==r.end){const ret=tr.some(i=>(i.start||'').slice(0,10)>=addDays(r.end,-1));add('ret',!tr.length||ret,ret||!tr.length?(tr.length?'Return travel booked':'No transport added'):'No return travel on '+fdate(r.end,{day:'numeric',month:'short'}),{tip:1})}
 const nights=tripDays(t).slice(0,-1);if(nights.length){const stays=t.items.filter(i=>i.type==='hotel'&&i.start&&i.end);const miss=nights.filter(d=>!stays.some(s=>s.start.slice(0,10)<=d&&s.end.slice(0,10)>d));add('stay',!miss.length,miss.length?miss.length+(miss.length>1?' nights':' night')+' without a stay':'Stay booked for every night')}
 const pl=tripPeople(t);pl.forEach(p=>{const nm=pl.length>1?p.name+': ':'';if(!p.passport){add('pp'+p.id,false,nm+'passport expiry not entered',{k2:'me'});return}const need=r.end?addDays(r.end,183):v7today();const ok=p.passport>=need;add('pp'+p.id,ok,ok?nm+'passport valid past 6 months after return':nm+'passport expires '+fdate(p.passport,{day:'numeric',month:'short',year:'numeric'})+', under 6 months after return',{k2:'me'})});
 const soon=t.items.filter(i=>i.type==='flight'&&i.start&&dayDiff(td,i.start.slice(0,10))>=0&&dayDiff(td,i.start.slice(0,10))<=3&&!i.seat);if(soon.length)add('seat',false,'No seat entered for '+soon.map(itemTitle).join(', '));
 const p=t.pack||[],dn=p.filter(x=>x.done).length;add('pack',p.length>0&&dn/p.length>=.8,p.length?`Packing ${dn} of ${p.length}`:'Packing list not started');
 add('offline',!!t.offline,t.offline?'Maps saved offline':'Maps not saved offline');
 RDY_MANUAL.forEach(([k,l])=>add('m_'+k,!!(t.rdy&&t.rdy[k]),l,{manual:1}));
 return L}
function readyCard(t){const r=tripRange(t);if(r.end&&r.end<v7today())return'';const L=readiness(t),ok=L.filter(x=>x.ok).length;
 return`<div class="card"><div class="row"><h3 class="sp" style="margin:0">Ready to go</h3><span class="pill ${ok===L.length?'green':'amber'}">${ok} / ${L.length}</span></div><div class="bar" style="margin:10px 0 6px"><i style="width:${ok/L.length*100}%"></i></div>
 ${L.map(x=>`<div class="row" style="padding:7px 0;border-bottom:1px dashed var(--line);cursor:pointer" data-act="rdy" data-k="${x.k}"><span style="width:22px;font-size:17px">${x.ok?'✅':'⚠️'}</span><span class="sp ${x.ok?'mut':''}">${esc(x.txt)}</span></div>`).join('')}</div>`}

/* ---------- 1. countdown ---------- */
function countdownCard(){const t=nextTrip();if(!t)return'';const r=tripRange(t),dd=dayDiff(v7today(),r.start),L=readiness(t),ok=L.filter(x=>x.ok).length,miss=L.filter(x=>!x.ok&&!x.manual).slice(0,2);
 return`<div class="card" data-act="openTrip" data-id="${t.id}" style="cursor:pointer"><div class="row"><div style="text-align:center;min-width:74px"><div class="big" style="font-size:46px;text-shadow:2px 2px 0 #4fbbbc,4px 4px 0 #f39120">${dd}</div><div class="mut sm" style="letter-spacing:1.5px">${dd===1?'DAY':'DAYS'}</div></div>
 <div class="sp"><div class="mut sm">NEXT TRIP</div><div style="font-size:21px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;line-height:1.15">${esc(t.name)}</div><div class="mut sm">${fdate(r.start,{weekday:'short',day:'numeric',month:'short'})}${r.end?' → '+fdate(r.end,{day:'numeric',month:'short'}):''}</div></div></div>
 <div class="bar" style="margin:10px 0 6px"><i style="width:${ok/L.length*100}%"></i></div><div class="mut sm">Ready ${ok} / ${L.length}${miss.length?' · '+miss.map(x=>esc(x.txt)).join(' · '):''}</div></div>`}

/* ---------- 3. packing templates ---------- */
const myTpl=()=>S.packTpl||(S.packTpl={});
function tplChips(){const k=Object.keys(myTpl());return k.length?`<div class="chips" style="padding-bottom:6px">${k.map(n=>`<div class="chip" data-act="packTplMy" data-k="${esc(n)}">★ ${esc(n)}</div>`).join('')}</div>`:''}
function tplBtns(t){const p=t.pack||[];return`${p.length?'<button class="btn o s" data-act="tplSave">Save as list</button>':''}${S.trips.some(x=>x!==t&&(x.pack||[]).length)?'<button class="btn o s" data-act="packCopy">Copy from trip</button>':''}${Object.keys(myTpl()).length?'<button class="btn o s" data-act="tplDel">My lists</button>':''}`}

/* ---------- 4. day planner ---------- */
function placeSheet(p){const td=v7today();const opts=[];S.trips.filter(t=>{const r=tripRange(t);return r.start&&(r.end||r.start)>=td}).sort((a,b)=>tripRange(a).start.localeCompare(tripRange(b).start)).forEach(t=>tripDays(t).forEach((d,k)=>{if(d>=td||!tripRange(t).start)opts.push([t.id+'|'+d,`${t.name} · Day ${k+1} · ${fdate(d,{weekday:'short',day:'numeric',month:'short'})}`])}));
 if(!opts.length){toast('Add a trip with dates first');return}
 const pre=UI.tripId&&UI.tab==='trips'?opts.find(o=>o[0].startsWith(UI.tripId+'|')):opts[0];
 openSheet('Add to a trip day',`<div class="mut" style="margin-bottom:8px">${esc(p.name)}</div>`+F('slot','Day',(pre||opts[0])[0],{type:'select',opts:opts.slice(0,120)})+F('time','Time','10:00',{type:'time'})+F('dur','Duration (min)',90,{type:'number'}),v=>{const[tid,d]=v.slot.split('|'),t=trip(tid);if(!t)return false;const s=new Date(d+'T'+(v.time||'10:00')),e=new Date(s.getTime()+(+v.dur||90)*6e4);
  t.items.push({id:uid(),type:'activity',title:p.name,location:p.name,lat:p.lat,lon:p.lon,start:isoLocal(s),end:isoLocal(e)});save();render();toast('Added to '+t.name)})}
const stopText=i=>i.lat!=null&&i.lon!=null?i.lat+','+i.lon:(i.address||i.location||'');
const stopWaze=i=>i.lat!=null&&i.lon!=null?L.waze(i.lat,i.lon):L.wazeQ(stopText(i));
const stopEarth=i=>i.lat!=null&&i.lon!=null?L.earth(i.lat,i.lon):L.earthQ(stopText(i));
function dayRoute(its){const st=its.filter(i=>['activity','restaurant','hotel','note'].includes(i.type)&&stopText(i)).sort((a,b)=>(a.start||'').localeCompare(b.start||''));if(!st.length)return'';
 const now=isoLocal(new Date()),nx=st.find(i=>(i.start||'')>=now)||st[0];let km=0,mins=0,seg='',route='';
 if(st.length>1){for(let k=1;k<st.length;k++){const a=st[k-1],b=st[k];if(a.lat!=null&&b.lat!=null){const d=hav(a.lat,a.lon,b.lat,b.lon)*1.25;km+=d;const m=d>3?Math.round(d/30*60):Math.round(d/4.8*60);mins+=m;seg+=`<div class="mut sm" style="padding:3px 4px">${d>3?'🚗':'🚶'} ${esc(a.title||'Stop')} → ${esc(b.title||'Stop')} · ${d.toFixed(1)} km · ${m} min</div>`}}
  const u=`https://www.google.com/maps/dir/?api=1&origin=${enc(stopText(st[0]))}&destination=${enc(stopText(st[st.length-1]))}${st.length>2?'&waypoints='+enc(st.slice(1,-1).map(stopText).join('|')):''}&travelmode=${km>6?'driving':'walking'}`;route=A(u,'🗺️ Day route','btn o s')+(km?`<span class="mut sm">${km.toFixed(1)} km · about ${mins} min</span>`:'')}
 return`<div style="padding:6px 0 2px">${seg}<div class="row w" style="margin-top:4px">${route}${A(stopWaze(nx),'Waze · '+esc(nx.title||'next stop'),'btn o s')}${A(stopEarth(nx),'🌍 Earth','btn o s')}</div></div>`}
/* ---------- 5. quick expense ---------- */
function quickExp(){const t=trip(UI.tripId)||activeTrip();if(!t){toast('Open a trip first');return}UI.qeT=t.id;const cur=tripCur(t);
 openSheet('Quick expense',`<div class="g2"><label class="f"><b>Amount</b><input id="qa" type="number" inputmode="decimal" step="0.01" style="font-size:26px"></label><label class="f"><b>Currency</b><input id="qc" list="curl" value="${cur}" style="text-transform:uppercase"></label></div><datalist id="curl">${Object.keys(fxRates()).sort().map(c=>`<option value="${c}">`).join('')}</datalist><label class="f"><b>Note</b><input id="qn" type="text"></label><div class="g3">${ECATS.map(c=>`<button class="btn o" data-act="qeCat" data-k="${c[0]}">${c[1]} ${c[2]}</button>`).join('')}</div>`);setTimeout(()=>$('#qa')?.focus(),150)}
function quickSave(cat){const t=trip(UI.qeT);if(!t)return;const a=parseFloat($('#qa').value);if(!(a>0)){toast('Enter an amount');return}const c=($('#qc').value||'EUR').toUpperCase().trim();if(!fxRates()[c]){toast('No rate for '+c);return}const pl=tripPeople(t);
 exps(t).push({id:uid(),amt:a,cur:c,eur:Math.round(toEUR(a,c)*100)/100,cat,note:($('#qn').value||'').trim(),date:v7today(),by:'me',split:pl.length>1?pl.map(p=>p.id):[]});save();closeSheet();render();toast('Saved · '+a.toLocaleString(LOC())+' '+c)}
function quickBar(){const t=activeTrip();if(!t)return'';return`<div class="card"><div class="g3"><button class="btn o" data-act="quickExp" data-id="${t.id}">⚡ Expense</button><button class="btn o" data-act="jToday" data-id="${t.id}">📓 Journal</button><button class="btn o" data-act="search">🔍 Search</button></div></div>`}

/* ---------- 6. trip file ---------- */
function tripFileSheet(t){openSheet('Share trip file',`<div class="mut" style="margin-bottom:8px">${esc(t.name)}</div>`+F('refs','Booking references',true,{type:'check'})+F('pack','Packing list',true,{type:'check'})+F('jr','Journal text',false,{type:'check'}),async v=>{const o=JSON.parse(JSON.stringify({name:t.name,dest:t.dest,cc:t.cc,start:t.start,end:t.end,notes:t.notes,items:t.items,pack:v.pack?(t.pack||[]):[],journal:v.jr?(t.journal||{}):{}}));
  o.items.forEach(i=>{delete i.status;delete i.checkedIn;delete i.fare;if(!v.refs)delete i.conf});o.pack.forEach(x=>x.done=0);
  const txt=dmEnvelope('voyager-trip',o),name='voyager-trip-'+(t.name||'trip').replace(/[^\w]+/g,'-').toLowerCase()+'.json';
  try{const f=new File([txt],name,{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[f]})){await navigator.share({files:[f],title:t.name});return}}catch(e){if(e.name==='AbortError')return}
  dl(name,txt,'application/json');toast('Trip file saved')},{ok:'Share'})}
function importTripFile(txt){const o=dmOpenEnvelope(txt,'voyager-trip').data;const t={id:uid(),name:o.name||'Trip',dest:o.dest||'',cc:o.cc||'',start:o.start||'',end:o.end||'',notes:o.notes||'',docCount:0,items:(o.items||[]).map(i=>({...i,id:uid()})),pack:(o.pack||[]).map(x=>({...x,id:uid()})),journal:o.journal||{}};S.trips.push(t);save();UI.tab='trips';UI.tripId=t.id;UI.sub='plan';render();toast('Trip added')}
function shareExtra(t){return`<div class="card"><h3>Trip file</h3><div class="row w"><button class="btn s" data-act="tripFile">Share trip file</button><button class="btn o s" data-act="jPrint">PDF summary</button></div></div>`}

/* ---------- 7. journal ---------- */
async function jResize(file){try{const bm=await createImageBitmap(file),m=1280,k=Math.min(1,m/Math.max(bm.width,bm.height));const c=document.createElement('canvas');c.width=Math.round(bm.width*k);c.height=Math.round(bm.height*k);c.getContext('2d').drawImage(bm,0,0,c.width,c.height);return await new Promise(r=>c.toBlob(r,'image/jpeg',.8))}catch(e){return file}}
function viewJournal(t){const j=t.journal||(t.journal={}),days=tripDays(t);if(!days.length)return'<div class="empty">Set trip dates to start a journal</div>';const td=v7today();
 return`<div class="row w" style="margin-bottom:10px"><button class="btn o s" data-act="jPrint">PDF journal</button></div>`+days.map((d,k)=>`<div class="card" data-act="jEdit" data-d="${d}" style="cursor:pointer"><div class="row"><div class="sp"><div style="font:700 18px var(--fh);text-transform:uppercase;letter-spacing:.5px;text-shadow:1.5px 1.5px 0 #4fbbbc,3px 3px 0 #f39120">${fdate(d,{weekday:'short',day:'numeric',month:'short'})}</div><div class="mut sm">Day ${k+1}</div></div>${d===td?'<span class="pill amber">Today</span>':''}</div>
 ${j[d]?`<div style="margin-top:8px;white-space:pre-wrap">${esc(j[d])}</div>`:'<div class="mut" style="margin-top:8px">＋ Write</div>'}<div class="jph" data-d="${d}" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px"></div></div>`).join('')}
async function jLoad(){const t=trip(UI.tripId);if(!t||UI.sub!=='journal')return;let ph=[];try{ph=(await docsOf(t.id)).filter(d=>d.kind==='jphoto')}catch(e){}
 $$('.jph').forEach(h=>{ph.filter(p=>p.day===h.dataset.d).forEach(p=>{const im=document.createElement('img');im.className='thumb';im.dataset.act='jPhoto';im.dataset.id=p.id;im.src=URL.createObjectURL(p.blob);h.appendChild(im)})})}
function jEdit(d){const t=trip(UI.tripId);if(!t)return;const j=t.journal||(t.journal={});
 openSheet(fdate(d,{weekday:'short',day:'numeric',month:'short'}),F('txt','Notes',j[d]||'',{type:'area',rows:8})+`<label class="f"><b>Photos</b><input type="file" id="jfile" accept="image/*" multiple></label>`,async v=>{const x=(v.txt||'').trim();if(x)j[d]=x;else delete j[d];
  for(const f of ($('#jfile')?.files||[])){const b=await jResize(f);await docPut({id:'j'+uid(),tripId:t.id,kind:'jphoto',day:d,name:f.name,type:'image/jpeg',size:b.size,added:new Date().toISOString(),blob:b})}save();render()})}
async function jPhoto(id){const t=trip(UI.tripId);const d=(await docsOf(t.id)).find(x=>x.id===id);if(!d)return;const u=URL.createObjectURL(d.blob);openSheet('Photo',`<img src="${u}" style="width:100%;border-radius:14px;margin-bottom:10px"><button class="btn d b" data-act="jPhotoDel" data-id="${id}">Delete photo</button>`)}
async function jPrint(){const t=trip(UI.tripId);if(!t)return;const r=tripRange(t),ph=(await docsOf(t.id)).filter(d=>d.kind==='jphoto'),days=tripDays(t),j=t.journal||{};
 const pics={};for(const p of ph)(pics[p.day]=pics[p.day]||[]).push(await blobToDataUrl(p.blob));
 const body=days.map((d,k)=>{const its=t.items.filter(i=>(i.start||'').slice(0,10)===d).sort((a,b)=>(a.start||'').localeCompare(b.start||''));if(!j[d]&&!pics[d]&&!its.length)return'';
  return`<section><h2>${esc(fdate(d,{weekday:'long',day:'numeric',month:'long'}))} <small>Day ${k+1}</small></h2>${its.map(i=>`<div class="it">${TYPES[i.type][0]} ${esc(ftime(i.start))} ${esc(itemTitle(i))}</div>`).join('')}${j[d]?`<p>${esc(j[d])}</p>`:''}${(pics[d]||[]).map(u=>`<img src="${u}">`).join('')}</section>`}).join('');
 const html=`<!doctype html><meta charset="utf-8"><title>${esc(t.name)}</title><style>body{font:14px/1.5 Arial,sans-serif;color:#173a3c;margin:24px}h1{font-size:28px;margin:0 0 2px;text-transform:uppercase}h2{font-size:17px;margin:20px 0 6px;border-bottom:3px solid #4fbbbc;padding-bottom:3px;text-transform:uppercase}small{color:#5b7c7e;font-weight:400}p{white-space:pre-wrap}img{max-width:48%;margin:4px 4px 0 0;border-radius:6px}.it{color:#5b7c7e}section{break-inside:avoid-page}</style><h1>${esc(t.name)}</h1><div>${esc(t.dest||'')} · ${r.start?esc(fdate(r.start)):''}${r.end?' → '+esc(fdate(r.end)):''}</div>${body||'<p>Nothing written yet.</p>'}`;
 let f=$('#pf');if(f)f.remove();f=document.createElement('iframe');f.id='pf';f.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0';document.body.appendChild(f);f.onload=()=>{try{f.contentWindow.focus();f.contentWindow.print()}catch(e){toast('Printing is not available here')}};f.srcdoc=html}

/* ---------- 8. automatic offline ---------- */
async function wxFetch(t){const g=await ensureGeo(t);if(!g)return;try{const j=await(await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${g.lat}&longitude=${g.lon}&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=16`)).json();if(!j.daily)return;const days={};j.daily.time.forEach((d,k)=>days[d]=[j.daily.weather_code[k],j.daily.temperature_2m_max[k],j.daily.temperature_2m_min[k],j.daily.precipitation_probability_max[k]||0]);t.wx={at:new Date().toISOString(),days};if(j.timezone)t.tz=j.timezone;save()}catch(e){}}
let autoBusy=false;
async function autoOffline(){if(autoBusy||S.settings.autoOff==='0'||!navigator.onLine)return;autoBusy=true;try{const td=v7today();
 for(const t of S.trips.slice()){const r=tripRange(t);if(!r.start||!r.end||r.end<td||dayDiff(td,r.start)>30)continue;
  if(t.offTry!==td&&(!t.offline||Date.now()-new Date(t.offline.at)>14*864e5)&&window.caches){t.offTry=td;save();await offSave(t.id,true)}
  if(dayDiff(td,r.start)<=15&&(!t.wx||Date.now()-new Date(t.wx.at)>6*36e5))await wxFetch(t)}
 render()}catch(e){}finally{autoBusy=false}}

/* ---------- 9. search ---------- */
function searchSheet(){openSheet('Search',`<input id="qs" type="search" placeholder="Booking ref, place, note…" autocomplete="off" style="margin-bottom:10px"><div id="qres"></div>`);setTimeout(()=>$('#qs')?.focus(),150)}
function runSearch(q){const T=q.toLowerCase().split(/\s+/).filter(Boolean),out=[];const hit=s=>T.length&&T.every(w=>String(s||'').toLowerCase().includes(w));
 S.trips.forEach(t=>{if(hit([t.name,t.dest,t.notes].join(' ')))out.push(['🧳',t.name,t.dest||'',t.id,'plan']);
  t.items.forEach(i=>{if(hit([i.title,i.flightNo,i.airline,i.conf,i.location,i.address,i.notes,i.from,i.to,i.seat].join(' ')))out.push([TYPES[i.type][0],itemTitle(i),t.name+(i.start?' · '+fdt(i.start):'')+(i.conf?' · '+i.conf:''),t.id,'plan'])});
  exps(t).forEach(e=>{if(hit(e.note))out.push(['🧾',e.note,t.name+' · '+e.amt+' '+e.cur,t.id,'money'])});
  Object.entries(t.journal||{}).forEach(([d,x])=>{if(hit(x))out.push(['📓',x.slice(0,60),t.name+' · '+fdate(d,{day:'numeric',month:'short'}),t.id,'journal'])});
  (t.pack||[]).forEach(p=>{if(hit(p.t))out.push(['🎒',p.t,t.name,t.id,'pack'])})});
 S.gems.forEach(g=>{if(hit([g.name,g.note].join(' ')))out.push(['★',g.name,'Saved place','','gem'])});
 const h=out.slice(0,40).map(x=>`<div class="row" style="padding:9px 0;border-bottom:1px dashed var(--line);cursor:pointer" data-act="srchGo" data-t="${x[3]}" data-s="${x[4]}"><span style="font-size:20px;width:28px">${x[0]}</span><div class="sp"><div>${esc(x[1])}</div><div class="mut sm">${esc(x[2])}</div></div></div>`).join('');
 $('#qres').innerHTML=q.trim()?(h||'<div class="empty">No results</div>'):''}

/* ---------- 10. calendar day ---------- */
function calDay(d){const rows=[],tz=[];const home=Intl.DateTimeFormat().resolvedOptions().timeZone;
 S.trips.forEach(t=>{const r=tripRange(t);if(!r.start||d<r.start||d>r.end)return;
  t.items.forEach(i=>{const s=(i.start||'').slice(0,10),e=(i.end||i.start||'').slice(0,10);if(s===d)rows.push([i.start,`${TYPES[i.type][0]} ${ftime(i.start)?ftime(i.start)+" · ":""}${itemTitle(i)}`,t]);else if(i.type==='hotel'&&s<d&&e>d)rows.push(['0',`🏨 Staying · ${i.title||'Stay'}`,t]);else if(i.type==='hotel'&&e===d&&s<d)rows.push(['0',`🏨 Check-out · ${i.title||'Stay'}`,t])});
  let off=null;try{if(t.tz)off=tzOff(t.tz,D(d))-tzOff(home,D(d))}catch(e){}tz.push([t,off])});
 if(!tz.length){toast('No trip on this day');return}
 rows.sort((a,b)=>a[0].localeCompare(b[0]));
 openSheet(fdate(d,{weekday:'long',day:'numeric',month:'long'}),tz.map(([t,off])=>`<div class="row" style="padding:6px 0" data-act="calOpen" data-id="${t.id}"><b class="sp">${esc(t.name)}</b>${off!=null?`<span class="pill blue">${off===0?'Same time':(off>0?'+':'−')+Math.abs(off)+' h from here'}</span>`:''}</div>`).join('')+(rows.map(([,x])=>`<div style="padding:6px 0;border-top:1px dashed var(--line)">${esc(x)}</div>`).join('')||'<div class="mut" style="padding:6px 0">Nothing planned</div>'))}

/* ---------- wiring ---------- */
SUBS.splice(6,0,['journal','Journal']);
const _vShare=viewShare;viewShare=t=>_vShare(t)+shareExtra(t);
const _todayCard=todayCard;todayCard=()=>_todayCard()+quickBar();
const _render=render;render=function(){_render.apply(this,arguments);if(UI.tab==='trips'&&UI.tripId&&UI.sub==='journal')jLoad()};
Object.assign(ACT3,{
 rdy(d){const t=trip(UI.tripId);if(!t)return;const k=d.k;
  if(k.startsWith('m_')){t.rdy=t.rdy||{};t.rdy[k.slice(2)]=!t.rdy[k.slice(2)];save();render();return}
  if(k==='dates')tripSheet(t);else if(k==='stay'||k==='ret')itemSheet(t.id,k==='stay'?'hotel':'flight');else if(k==='pack'){UI.sub='pack';render()}else if(k==='offline')offSave();else if(k.startsWith('pp'))go('me'),UI.tripId=null,render();else if(k==='seat'){UI.sub='plan';render()}},
 packTplMy(d){const t=trip(UI.tripId),p=t.pack=t.pack||[];(myTpl()[d.k]||[]).forEach(x=>{if(!p.some(y=>y.t===x.t))p.push({id:uid(),t:x.t,cat:x.cat,done:0})});save();render()},
 tplSave(){const t=trip(UI.tripId);openSheet('Save as list',F('n','List name','',{ph:'Weekend city break'}),v=>{const n=v.n.trim();if(!n)return false;myTpl()[n]=(t.pack||[]).map(x=>({t:x.t,cat:x.cat}));save();render();toast('Saved '+n)},{ok:'Save'})},
 tplDel(){openSheet('My lists',Object.keys(myTpl()).map(n=>`<div class="row" style="padding:8px 0"><span class="sp">★ ${esc(n)} <span class="mut sm">· ${myTpl()[n].length} items</span></span><button class="btn d s" data-act="tplDelOne" data-k="${esc(n)}">✕</button></div>`).join(''))},
 tplDelOne(d){delete myTpl()[d.k];save();closeSheet();render()},
 packCopy(){const t=trip(UI.tripId),o=S.trips.filter(x=>x!==t&&(x.pack||[]).length);openSheet('Copy list from',F('from','Trip',o[0].id,{type:'select',opts:o.map(x=>[x.id,x.name+' · '+x.pack.length+' items'])}),v=>{const s=trip(v.from),p=t.pack=t.pack||[];s.pack.forEach(x=>{if(!p.some(y=>y.t===x.t))p.push({id:uid(),t:x.t,cat:x.cat,done:0})});save();render()},{ok:'Copy'})},
 placeAdd(d){placeSheet({name:d.n,lat:+d.la,lon:+d.lo})},
 quickExp(d){if(d.id)UI.tripId=UI.tripId||d.id;quickExp()},qeCat(d){quickSave(d.k)},
 tripFile(){tripFileSheet(trip(UI.tripId))},jPrint,jEdit:d=>jEdit(d.d),jPhoto:d=>jPhoto(d.id),
 async jPhotoDel(d){await docDel(d.id);closeSheet();render()},
 jToday(d){const t=trip(d.id);if(!t)return;UI.tab='trips';UI.tripId=t.id;UI.sub='journal';closeSheet();render()},
 search:searchSheet,
 srchGo(d){closeSheet();if(d.s==='gem'){UI.tab='explore';UI.ex.cat='saved';render();return}UI.tab='trips';UI.tripId=d.t;UI.sub=d.s;render()},
 calDay(d){calDay(d.d)},calOpen(d){closeSheet();UI.tab='trips';UI.tv='list';UI.tripId=d.id;UI.sub='plan';render()}});
document.addEventListener('input',e=>{if(e.target.id==='qs')runSearch(e.target.value)});
document.addEventListener('change',e=>{if(e.target.id==='tripfile'){const f=e.target.files[0];e.target.value='';if(f)f.text().then(importTripFile).catch(x=>toast('Not a Voyager trip file'))}});
addEventListener('online',()=>setTimeout(autoOffline,1500));setTimeout(autoOffline,4000);

/* ---------- v8: Earth links, day trips by drive time ---------- */
L.earth=(a,b)=>`https://earth.google.com/web/@${a},${b},0a,6000d,35y,0h,0t,0r`;
L.earthQ=q=>`https://earth.google.com/web/search/${enc(q)}`;
const DT={beach:['🏖️','Beaches','nwr["natural"="beach"]["name"]'],swim:['🏊','Swim spots','nwr["leisure"~"^(swimming_area|beach_resort)$"]["name"]'],fall:['💧','Waterfalls','nwr["waterway"="waterfall"]["name"]'],view:['🌄','Viewpoints','nwr["tourism"="viewpoint"]["name"]'],hot:['♨️','Hot springs','nwr["natural"="hot_spring"]'],park:['🌲','Nature reserves','nwr["leisure"="nature_reserve"]["name"]'],castle:['🏰','Castles','nwr["historic"="castle"]["name"]']};
const DRAD=[[23000,'30 min by car'],[46000,'1 h by car'],[70000,'1 h 30 by car'],[92000,'2 h by car'],[140000,'3 h by car']];
CATS.splice(2,0,['day','Day trips']);
function driveEst(km){const r=km*1.3,sp=r<20?35:r<60?55:75,m=Math.round(r/sp*60);return(m>=60?Math.floor(m/60)+' h '+String(m%60).padStart(2,'0'):m+' min')+' · '+Math.round(r)+' km by road'}
function dayChips(){const E=UI.ex;return`<div class="chips">${Object.entries(DT).map(([k,v])=>`<div class="chip ${(E.dsub||'beach')===k?'on':''}" data-act="exDsub" data-k="${k}">${v[0]} ${v[1]}</div>`).join('')}</div>`}
async function dayTripRun(E){const k=E.dsub||'beach',R=E.drad||46000;const j=await overpass(`[out:json][timeout:40];(${DT[k][2]}(around:${R},${E.lat},${E.lon}););out center tags 250;`);
 const seen=new Set();E.res=j.elements.map(e=>{const c=ctr(e);if(!c)return null;const t=e.tags||{},km=hav(E.lat,E.lon,c.lat,c.lon),nm=t.name||t['name:en']||DT[k][1].replace(/s$/,'');
  const ex=[t.surface&&t.surface.replace(/_/g,' '),t.lifeguard==='yes'&&'🛟 lifeguard',t.supervised==='yes'&&'🛟 supervised',t.dog&&t.dog!=='no'&&'🐕 dogs ok',t.nudism==='yes'&&'nudist',t.fee==='yes'&&'fee',t.access==='private'&&'private',t.opening_hours&&'🕒 '+t.opening_hours,t.ele&&t.ele+' m',t.description].filter(Boolean).join(' · ');
  return{id:e.type+e.id,name:nm,lat:c.lat,lon:c.lon,dist:km*1000,kind:DT[k][1].replace(/s$/,''),extra:ex,drive:driveEst(km)}}).filter(x=>{if(!x||seen.has(x.name+Math.round(x.lat*50)+Math.round(x.lon*50)))return false;seen.add(x.name+Math.round(x.lat*50)+Math.round(x.lon*50));return true}).sort((a,b)=>a.dist-b.dist).slice(0,40)}
Object.assign(ACT3,{exDsub(d){UI.ex.dsub=d.k;if(UI.ex.lat!=null)exploreRun();else render()},exDrad(d,el){UI.ex.drad=+el.value;if(UI.ex.lat!=null)exploreRun()},
 async dayIdeas(){const t=trip(UI.tripId);if(!t)return;const g=await ensureGeo(t);if(!g){toast('Add a destination first');return}Object.assign(UI.ex,{lat:g.lat,lon:g.lon,label:t.dest||t.name,cat:'day',q:t.dest||''});UI.tab='explore';render();exploreRun()}});

/* ---------- v8b: nudist beaches, style and price filters for food and drink, review links ---------- */
DT.nude=['🌞','Nudist beaches','nwr["natural"="beach"]["nudism"~"^(yes|designated|permissive|obligatory)$"]'];
DT.family=['👨‍👩‍👧','Lifeguarded beaches','nwr["natural"="beach"]["name"]["lifeguard"="yes"]'];
const gS=(q,la,lo)=>`https://www.google.com/maps/search/${enc(q)}/@${la},${lo},13z`;
function recoCard(E){const k=E.dsub||'beach',nm=DT[k][1].toLowerCase(),lab=E.label||'';const q=(k==='nude'?'naturist beaches':nm)+(lab?' near '+lab:'');
 return`<div class="card"><h3>Recommendations</h3><div class="row w">${A(gS('best '+(k==='nude'?'nudist beach':nm.replace(/s$/,'')),E.lat,E.lon),'⭐ Best rated on Maps','btn o s')}${A('https://www.google.com/search?q='+enc(q),'Search the web','btn o s')}${A('https://en.wikivoyage.org/w/index.php?search='+enc((k==='nude'?'naturism ':'')+lab),'Wikivoyage','btn o s')}${A('https://www.tripadvisor.com/Search?q='+enc(q),'TripAdvisor','btn o s')}${A('https://www.reddit.com/search/?q='+enc(q),'Reddit','btn o s')}</div></div>`}
const STY={italian:['🍝','Italian',/italian|pasta|trattoria|ristorante/],french:['🥖','French',/french|brasserie|bistro/],mexican:['🌮','Mexican',/mexican|taco|tex/],japanese:['🍣','Japanese',/japanese|sushi|ramen/],asian:['🥢','Asian',/chinese|thai|vietnam|korean|asian|dim_sum|indian/],seafood:['🦐','Seafood',/seafood|fish/],burgers:['🍔','Burgers & pizza',/burger|pizza/],veg:['🌿','Vegetarian & vegan',/vegan|vegetarian/],steak:['🥩','Grill & steak',/steak|grill|barbecue|bbq/],local:['🏠','Local cuisine',/regional|local|traditional|mediterranean|spanish|greek|lebanese|turkish|moroccan/]};
const BSTY={cocktail:['🍸','Cocktails'],wine:['🍷','Wine bars'],beer:['🍺','Beer & pubs'],live:['🎵','Live music'],outdoor:['🌤️','Outdoor seating']};
const TIERS=[['budget','€ Budget'],['mid','€€ Mid-range'],['up','€€€ Upscale']];
function priceTier(t){const pr=String(t.price_range||t['price:range']||'').toLowerCase();if(/cheap|low|^€$|^\$$|inexpensive/.test(pr))return'budget';if(/expensive|high|€€€|\$\$\$|luxury/.test(pr))return'up';if(/^(€€|\$\$|medium|moderate)$/.test(pr))return'mid';
 if(t['award:michelin']||t.michelin||t['michelin:stars']||t.stars||/fine_dining|gourmet/.test(t.cuisine||'')||t.dress_code)return'up';
 if(/^(fast_food|food_court)$/.test(t.amenity)||/kebab|burger|sandwich|street_food|noodle|bubble_tea|ice_cream|pizza|falafel/.test(t.cuisine||''))return'budget';return'mid'}
const TIERL={budget:'€',mid:'€€',up:'€€€'};
function richChips(E){const rest=E.sub==='restaurant';const sty=E.sty||'';
 const s=rest?Object.entries(STY).map(([k,v])=>[k,v[0]+' '+v[1]]):Object.entries(BSTY).map(([k,v])=>[k,v[0]+' '+v[1]]);
 const q=rest?((E.tier==='budget'?'cheap eats ':E.tier==='up'?'fine dining ':'')+(sty?STY[sty][1]+' ':'')+'restaurant'):((sty?BSTY[sty][1]:'best bar'));
 return`<div class="chips">${s.map(([k,l])=>`<div class="chip ${sty===k?'on':''}" data-act="exSty" data-k="${k}">${l}</div>`).join('')}</div><div class="chips">${rest?TIERS.map(([k,l])=>`<div class="chip ${E.tier===k?'on':''}" data-act="exTier" data-k="${k}">${l}</div>`).join(''):''}<div class="chip ${E.open?'on':''}" data-act="exOpen">🟢 Open now</div></div>${E.lat!=null?`<div class="row w" style="margin:2px 0 8px">${A(gS(q.trim(),E.lat,E.lon),'⭐ Best rated on Maps','btn o s')}</div>`:''}`}
async function richNear(E){const rest=E.sub==='restaurant',R=Math.max(E.rad,1000);
 const q=rest?`nwr["amenity"~"^(restaurant|fast_food|food_court)$"]["name"](around:${R},${E.lat},${E.lon});`:`nwr["amenity"~"^(bar|pub|biergarten|nightclub)$"]["name"](around:${R},${E.lat},${E.lon});nwr["craft"="brewery"]["name"](around:${R},${E.lat},${E.lon});`;
 const j=await overpass(`[out:json][timeout:30];(${q});out center tags 300;`);let out=j.elements.map(e=>{const c=ctr(e);if(!c)return null;const t=e.tags||{},cu=(t.cuisine||'').toLowerCase(),nm=(t.name||'').toLowerCase();
  const veg=t['diet:vegan']==='yes'||t['diet:vegan']==='only'||t['diet:vegetarian']==='yes'||t['diet:vegetarian']==='only'||/vegan|vegetarian/.test(cu);
  const feat=[veg&&'🌿 veg options',t.outdoor_seating==='yes'&&'outdoor seating',t.takeaway==='yes'&&'takeaway',t.live_music==='yes'&&'🎵 live music',t.wheelchair==='yes'&&'♿',t.opening_hours&&'🕒 '+t.opening_hours].filter(Boolean);
  const tier=rest?priceTier(t):'';const op=openNow(t.opening_hours);const m={};
  if(rest)Object.entries(STY).forEach(([k,v])=>{m[k]=v[2].test(cu)||(k==='veg'&&veg)||(k!=='veg'&&v[2].test(nm))});
  else{m.cocktail=t['drink:cocktail']==='yes'||/cocktail/.test(nm);m.wine=t['drink:wine']==='yes'||/wine|vin\b|vino|vinoteca/.test(nm);m.beer=/^(pub|biergarten)$/.test(t.amenity)||t.craft==='brewery'||t.microbrewery==='yes'||/beer|brew|bier|pub/.test(nm);m.live=t.live_music==='yes';m.outdoor=t.outdoor_seating==='yes'}
  return{id:e.type+e.id,name:t.name,lat:c.lat,lon:c.lon,dist:hav(E.lat,E.lon,c.lat,c.lon)*1000,kind:(cu?cu.replace(/_/g,' ').split(';')[0]:(t.amenity||'').replace(/_/g,' ')),extra:feat.join(' · '),badge:(tier?`<b>${TIERL[tier]}</b> <span class="mut">estimated from map tags</span>`:'')+(op===true?` <span class="pill green">Open now</span>`:op===false?` <span class="pill">Closed now</span>`:''),tier,op,m}}).filter(Boolean);
 if(E.sty)out=out.filter(x=>x.m[E.sty]);if(rest&&E.tier)out=out.filter(x=>x.tier===E.tier);if(E.open)out=out.filter(x=>x.op===true);
 E.res=out.sort((a,b)=>a.dist-b.dist).slice(0,40)}
Object.assign(ACT3,{exSty(d){UI.ex.sty=UI.ex.sty===d.k?'':d.k;exploreRun()},exTier(d){UI.ex.tier=UI.ex.tier===d.k?'':d.k;exploreRun()}});

/* ---------- v9: open now filter, smart hiking search ---------- */
const DAYK=['Su','Mo','Tu','We','Th','Fr','Sa'];
function openNow(oh,now=new Date()){if(!oh)return null;const s=String(oh).trim();if(/^24\/7$/i.test(s))return true;if(/sunrise|sunset|dawn|dusk|week|"|\[|easter/i.test(s))return null;
 const dow=now.getDay(),mins=now.getHours()*60+now.getMinutes();let state=null,any=false;
 for(const rule of s.split(';').map(x=>x.trim()).filter(Boolean)){const m=rule.match(/^((?:[A-Za-z]{2}(?:\s*-\s*[A-Za-z]{2})?(?:\s*,\s*)?|PH\s*,?\s*)*)\s*(.*)$/);if(!m)return null;const dp=m[1].trim(),tp=m[2].trim();let days=new Set();
  if(!dp)DAYK.forEach((_,i)=>days.add(i));else{for(const part of dp.split(',').map(x=>x.trim()).filter(Boolean)){if(part==='PH')continue;const r=part.split('-').map(x=>DAYK.findIndex(d=>d.toLowerCase()===x.trim().toLowerCase()));if(r.some(x=>x<0))return null;if(r.length===1)days.add(r[0]);else{let i=r[0];for(let k=0;k<8;k++){days.add(i);if(i===r[1])break;i=(i+1)%7}}}}
  any=true;if(!days.has(dow))continue;
  if(/^(off|closed)$/i.test(tp)){state=false;continue}
  const rg=[...tp.matchAll(/(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})/g)];if(!rg.length)return null;
  state=rg.some(g=>{const a=+g[1]*60+ +g[2],b=+g[3]*60+ +g[4];return b>a?mins>=a&&mins<b:mins>=a||mins<b})}
 return any?(state===null?false:state):null}
/* hiking */
const HLEN=[['short','Under 6 km'],['mid','6 – 14 km'],['long','14 – 25 km'],['epic','25 km +']],HDIF=[['easy','Easy'],['mod','Moderate'],['hard','Hard']],HTIME=[['h2','Under 2 h'],['h4','2 – 4 h'],['h6','4 – 6 h'],['day','Full day']];
const hLenK=k=>k<6?'short':k<14?'mid':k<25?'long':'epic',hTimeK=h=>h<2?'h2':h<4?'h4':h<6?'h6':'day';
const fmtH=h=>{const m=Math.round(h*60);return Math.floor(m/60)+' h '+String(m%60).padStart(2,'0')};
function hikeRad(){const E=UI.ex;return`<select data-act="exHr" style="width:auto">${[[10000,'Within 10 km'],[25000,'Within 25 km'],[50000,'Within 50 km'],[100000,'Within 100 km']].map(([v,l])=>`<option value="${v}" ${(E.hr||25000)==v?'selected':''}>${l}</option>`).join('')}</select>`}
function hikeChips(E){const mode=E.hmode||'trails';let h=`<div class="chips"><div class="chip ${mode==='trails'?'on':''}" data-act="exHmode" data-k="trails">🥾 Trails</div><div class="chip ${mode==='peaks'?'on':''}" data-act="exHmode" data-k="peaks">⛰️ Peaks & huts</div></div>`;
 if(mode==='trails'){const row=(arr,cur,act)=>`<div class="chips">${arr.map(([k,l])=>`<div class="chip ${cur===k?'on':''}" data-act="${act}" data-k="${k}">${l}</div>`).join('')}</div>`;h+=row(HLEN,E.hlen,'exHf')+row(HDIF,E.hdif,'exHd')+row(HTIME,E.htime,'exHt')+`<div class="chips"><div class="chip ${E.hloop?'on':''}" data-act="exHloop">🔁 Loops only</div></div>`}
 return h}
const SAC={hiking:1,mountain_hiking:2,demanding_mountain_hiking:3,alpine_hiking:3,demanding_alpine_hiking:4,difficult_alpine_hiking:4};
function pathLen(g){let k=0;for(let i=1;i<g.length;i++)k+=hav(g[i-1].lat,g[i-1].lon,g[i].lat,g[i].lon);return k}
async function hikeStats(rel){const ways=(rel.members||[]).filter(m=>m.type==='way'&&m.geometry&&m.geometry.length>1&&!/^(guidepost|alternative|excursion|approach)$/.test(m.role||'')).map(m=>m.geometry);if(!ways.length)return null;
 const lens=ways.map(pathLen),tot=lens.reduce((a,b)=>a+b,0);if(!tot)return null;
 const budget=95,pts=[],seg=[];ways.forEach((g,i)=>{const n=Math.max(2,Math.min(g.length,Math.round(budget*lens[i]/tot)));const idx=[];for(let k=0;k<n;k++)idx.push(Math.round(k*(g.length-1)/(n-1)));const u=[...new Set(idx)];seg.push([pts.length,u.length]);u.forEach(j=>pts.push(g[j]))});
 let asc=null;if(pts.length<=100||true){try{const P=pts.slice(0,100);const r=await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${P.map(p=>p.lat.toFixed(4)).join(',')}&longitude=${P.map(p=>p.lon.toFixed(4)).join(',')}`);const j=await r.json();if(j.elevation&&j.elevation.length===P.length){asc=0;seg.forEach(([st,n])=>{let lo=j.elevation[st];for(let k=st+1;k<st+n&&k<P.length;k++){const e=j.elevation[k];if(e>lo+5){asc+=e-lo;lo=e}else if(e<lo)lo=e}})}}catch(e){}}
 const first=ways[0][0],lastW=ways[ways.length-1],last=lastW[lastW.length-1];
 return{km:tot,asc,start:first,loop:hav(first.lat,first.lon,last.lat,last.lon)<.4}}
function hikeRate(km,asc,sac){const a=asc||0,hrs=km/5+a/600;let d;if(sac!=null)d=sac<=1?(km>12||a>500?2:1):sac===2?3:3;else{const sc=km/8+a/400;d=sc<1.2?1:sc<2.5?2:3}return{hrs,d:['','Easy','Moderate','Hard'][d],dk:['','easy','mod','hard'][d]}}
function hikeLinks(name,label){const q=enc(name+' '+(label||'').split(',')[0]);return[['AllTrails','alltrails.com'],['Komoot','komoot.com'],['Wikiloc','wikiloc.com'],['Outdooractive','outdooractive.com']].map(([n,s])=>A('https://www.google.com/search?q='+q+'+site:'+s,n,'btn o s')).join('')}
async function hikeRun(E){if(E.hmode==='peaks'){const R=E.hr||25000;const j=await overpass(`[out:json][timeout:30];(node(around:${R},${E.lat},${E.lon})[natural=peak][name];nwr(around:${R},${E.lat},${E.lon})[tourism~"^(alpine_hut|wilderness_hut)$"][name];);out center tags 80;`);E.res=norm(j.elements,'Peak',E).slice(0,30);return}
 const R=E.hr||25000;const j=await overpass(`[out:json][timeout:40];relation(around:${R},${E.lat},${E.lon})[route=hiking][name];out center tags 200;`);
 const seen={};let cand=norm(j.elements,'Trail',E).forEach?j.elements.map(e=>{const c=e.center;if(!c)return null;const t=e.tags;return{id:'r'+e.id,rid:e.id,name:t.name,t,lat:c.lat,lon:c.lon,dist:hav(E.lat,E.lon,c.lat,c.lon)*1000}}).filter(Boolean).sort((a,b)=>a.dist-b.dist):[];
 cand=cand.filter(x=>{const k=x.name.toLowerCase();if(seen[k])return false;seen[k]=1;return true});
 const take=cand.slice(E.hn||0,(E.hn||0)+14);E.res=E.res||[];E.res=[];
 const all=(E.hall=(E.hn?E.hall:[]));
 for(let i=0;i<take.length;i+=5){const ch=take.slice(i,i+5);try{const g=await overpass(`[out:json][timeout:60];rel(id:${ch.map(x=>x.rid).join(',')});out geom;`);const by={};g.elements.forEach(e=>by[e.id]=e);
  for(const x of ch){const rel=by[x.rid];let st=null;try{st=rel?await hikeStats(rel):null}catch(e){}const tg=x.t;let km=st?.km??parseFloat(String(tg.distance||'').replace(',','.'))??null;if(!(km>0))continue;const sac=SAC[tg.sac_scale]??null;const asc=st?.asc??(parseFloat(tg.ascent)||null);const R2=hikeRate(km,asc,sac);
   all.push({id:x.id,name:x.name,lat:x.lat,lon:x.lon,dist:x.dist,kind:'Trail',rel:x.rid,km,asc,hrs:R2.hrs,dk:R2.dk,d:R2.d,loop:tg.roundtrip==='yes'||st?.loop,net:{lwn:'local',rwn:'regional',nwn:'national',iwn:'international'}[tg.network]||'',ref:tg.ref||'',desc:tg.description||''})}}catch(e){}
  E.res=hikeFilter(all,E);render()}
 E.hn=(E.hn||0)+take.length;E.hmore=cand.length>E.hn;if(!all.length)throw new Error('No trail with usable data nearby — widen the radius')}
function hikeFilter(all,E){return all.filter(x=>(!E.hlen||hLenK(x.km)===E.hlen)&&(!E.hdif||x.dk===E.hdif)&&(!E.htime||hTimeK(x.hrs)===E.htime)&&(!E.hloop||x.loop)).map(x=>({...x,extra:[x.net&&x.net+' route',x.ref&&'ref '+x.ref,x.desc].filter(Boolean).join(' · '),badge:`<b>${x.km.toFixed(1)} km</b>${x.asc!=null?' · ↑ '+Math.round(x.asc)+' m':''} · ≈ ${x.km>40?'multi-day':fmtH(x.hrs)} · <span class="pill ${x.dk==='easy'?'green':x.dk==='mod'?'amber':'red'}">${x.d}</span>${x.loop?' · 🔁 loop':''}`,sites:hikeLinks(x.name,UI.ex.label)}))}
function hikeTop(E){const r=(E.res||[])[0];if(!r)return'';const why=[E.hlen&&HLEN.find(x=>x[0]===E.hlen)[1],E.hdif&&HDIF.find(x=>x[0]===E.hdif)[1],E.htime&&HTIME.find(x=>x[0]===E.htime)[1]].filter(Boolean).join(' · ');
 return`<div class="card"><div class="mut sm">TOP PICK${why?' · '+esc(why):''}</div><div style="font:700 20px var(--fh);text-transform:uppercase;letter-spacing:.5px">${esc(r.name)}</div><div class="sm">${r.badge}</div><div class="mut sm" style="margin-top:4px">${(r.dist/1000).toFixed(0)} km away${E.hn&&E.hmore?' · '+E.hn+' routes checked':''}</div></div>`}
function hikeFoot(E){return`${E.hmore?`<button class="btn o b" data-act="exHmore" style="margin:6px 0 10px">Check more routes</button>`:''}<div class="card"><h3>Compare on other sites</h3><div class="row w">${hikeLinks('best hikes',E.label)}${A('https://hiking.waymarkedtrails.org/#?map=11!'+E.lat+'!'+E.lon,'Waymarked Trails','btn o s')}</div></div>`}
Object.assign(ACT3,{exHr(d,el){UI.ex.hr=+el.value;UI.ex.hn=0;if(UI.ex.lat!=null)exploreRun()},exHmode(d){UI.ex.hmode=d.k;UI.ex.hn=0;exploreRun()},
 exHf(d){UI.ex.hlen=UI.ex.hlen===d.k?'':d.k;refilter()},exHd(d){UI.ex.hdif=UI.ex.hdif===d.k?'':d.k;refilter()},exHt(d){UI.ex.htime=UI.ex.htime===d.k?'':d.k;refilter()},exHloop(){UI.ex.hloop=!UI.ex.hloop;refilter()},
 async exHmore(){UI.ex.loading=false;toast('Checking more routes…');try{await hikeRun(UI.ex)}catch(e){UI.ex.err=e.message}render()},
 exOpen(){UI.ex.open=!UI.ex.open;exploreRun()}});
function refilter(){const E=UI.ex;E.res=hikeFilter(E.hall||[],E);render()}
