/* ===== ALERTS ===== */
function computeAlerts(){const A=[],now=new Date();const add=(lvl,ic,text,tripId)=>A.push({lvl,ic,text,tripId});
 const pp=S.profile.passport;if(pp){const m=(D(pp)-now)/(864e5*30.4);if(m<0)add('red','🛂','Passport expired — renew before any trip');else if(m<6)add('red','🛂',`Passport expires in ${Math.floor(m)} months — many countries require 6 months' validity`);else if(m<9)add('amber','🛂',`Passport renewal reminder: expires in ${Math.floor(m)} months`)}
 S.trips.forEach(t=>{const r=tripRange(t);if(!r.end||D(r.end)<now)return;
  if(pp&&D(pp)<new Date(D(r.end).getTime()+182*864e5))add('amber','🛂',`Passport valid less than 6 months after "${t.name}" ends`,t.id);
  const fl=t.items.filter(i=>i.type==='flight').sort((a,b)=>a.start.localeCompare(b.start));
  for(let k=0;k<fl.length-1;k++){const a=fl[k],b=fl[k+1];if(a.to===b.from){const g=(D(b.start)-flightArr(a))/6e4;
    if(g<S.settings.minConnect)add('red','⏱️',`Connection at ${a.to}: only ${Math.round(g)} min between ${a.flightNo||a.from+'→'+a.to} and ${b.flightNo||''}`,t.id);
    else if(g<S.settings.minConnect+30)add('amber','⏱️',`Tight connection at ${a.to}: ${Math.round(g)} min`,t.id);
    else if(g>720&&g<1440)add('blue','🛏️',`Long layover at ${a.to} (${rel(g*6e4)})`,t.id)}
   else if(b.start&&flightArr(a)&&D(b.start)-flightArr(a)<2*864e5)add('amber','🗺️',`Airport change: arrive ${a.to}, next flight leaves from ${b.from}`,t.id)}
  fl.forEach(f=>{const dep=flightDep(f);if(!dep||dep<now)return;const st=f.status?.state;
   if(st==='Cancelled')add('red','⛔',`${itemTitle(f)} is cancelled — check rebooking & compensation`,t.id);
   else if(st==='Delayed')add('amber','⏳',`${itemTitle(f)} delayed ${f.status.delay||'?'} min`,t.id);
   else if(st==='Diverted')add('red','↪️',`${itemTitle(f)} diverted`,t.id);
   else if(st==='Gate changed')add('amber','🚪',`Gate changed for ${itemTitle(f)}`,t.id);
   const ms=dep-now;if(ms>0&&ms<864e5&&!f.checkedIn)add('blue','🧾',`Check-in open for ${itemTitle(f)}`,t.id);
   const lb=leaveBy(f);if(lb&&lb-now<9e5&&lb-now>-36e5)add('red','🚀',`GO NOW — leave for ${f.from} (${itemTitle(f)})`,t.id);
   if(ms>0&&ms<108e5&&!f.gate)add('blue','🚪',`No gate recorded yet for ${itemTitle(f)}`,t.id);
   const fr=f.fare;if(fr&&fr.paid&&fr.checks?.length){const last=fr.checks[fr.checks.length-1].price;if(last<fr.paid)add('green','💸',`Fare dropped ${(fr.paid-last).toFixed(0)} ${fr.cur||''} on ${itemTitle(f)} — ask for refund/credit`,t.id)}});
  const hasStay=t.items.some(i=>i.type==='hotel');const n=tripNights(t);if(n>0&&!hasStay)add('blue','🏨',`"${t.name}" has ${n} nights with no lodging`,t.id);
  if(fl.length&&!(t.docCount>0))add('blue','📎',`"${t.name}": no documents attached yet`,t.id)});
 S.programs.forEach(p=>{if(p.expiry){const d=(D(p.expiry)-now)/864e5;if(d<0)add('red','🎁',`${p.name}: points expired`);else if(d<120)add('amber','🎁',`${p.name}: ${p.points||''} points expire in ${Math.round(d)} days`)}});
 extraAlerts(add);const o={red:0,amber:1,green:2,blue:3};return A.sort((a,b)=>o[a.lvl]-o[b.lvl])}
const alertRow=a=>`<div class="row" style="padding:9px 0;border-bottom:1px dashed var(--line)" ${a.tripId?`data-act="openTrip" data-id="${a.tripId}"`:''}><span style="font-size:22px">${a.ic}</span><span class="sp">${esc(a.text)}</span><span class="pill ${a.lvl}">${a.lvl==='red'?'Urgent':a.lvl==='amber'?'Watch':a.lvl==='green'?'Good':'Info'}</span></div>`;
/* ===== TRIPS HOME ===== */
function nextFlight(){const now=new Date();return allFlights().find(f=>flightDep(f)&&flightArr(f)>now)}
function heroNext(){const f=nextFlight();if(!f)return'';const dep=flightDep(f),ms=dep-new Date(),lb=leaveBy(f),mu=lb?lb-new Date():null;
 let phase='';if(ms>864e5)phase=`Check-in opens in ${rel(ms-864e5)}`;else if(ms>0)phase=f.checkedIn?'Checked in':'Check-in is open';else phase='In the air';
 return`<div class="hero"><div class="mut sm">NEXT FLIGHT · ${esc(f._t.name)}</div><div class="big">${esc(itemTitle(f))}</div>
 <div class="mut">${fdt(f.start)} · ${apLabel(f.from)} → ${apLabel(f.to)}</div><hr style="border-color:rgba(255,255,255,.3)">
 <div class="row w"><div class="sp"><div class="sm mut">DEPARTS IN</div><div style="font-size:22px">${ms>0?rel(ms):'now'}</div></div>
 <div class="sp"><div class="sm mut">GO NOW</div><div style="font-size:22px">${lb?ftime(isoLocal(lb)):'—'}${mu>0&&mu<864e5?' <span class="sm">(in '+rel(mu)+')</span>':mu<=0&&ms>0?' <span class="sm">NOW</span>':''}</div></div></div>
 <div class="sm" style="margin:6px 0 10px">${phase}${f.terminal?' · Terminal '+esc(f.terminal):''}${f.gate?' · Gate '+esc(f.gate):''}</div>
 <div class="row w"><button class="btn s" data-act="tab" data-t="go" data-id="${f.id}">Open flight tools</button>${A(L.waze(AP[f.from]?.lat,AP[f.from]?.lon),'Waze to airport','btn o s')}${A(L.gll(AP[f.from]?.lat,AP[f.from]?.lon),'Google Maps','btn o s')}<button class="btn o s" data-act="passView" data-tid="${f._t.id}" data-id="${f.id}">🎫 Boarding pass</button></div></div>`}
function viewTrips(){
 if(UI.tripId)return viewTrip();
 const seg=`<div class="seg">${[['list','Trips'],['cal','Calendar']].map(([k,l])=>`<button class="${(UI.tv||'list')===k?'on':''}" data-act="tv" data-k="${k}">${l}</button>`).join('')}</div>`;
 if(UI.tv==='cal')return `<div style="margin-bottom:12px">${seg}</div>${viewCal()}`;
 const now=new Date();const up=S.trips.filter(t=>{const r=tripRange(t);return!r.end||D(r.end)>=new Date(now.toDateString())}).sort((a,b)=>(tripRange(a).start||'9').localeCompare(tripRange(b).start||'9'));
 const past=S.trips.filter(t=>!up.includes(t)).sort((a,b)=>(tripRange(b).start||'').localeCompare(tripRange(a).start||''));
 const al=computeAlerts().slice(0,3);
 const card=t=>{const r=tripRange(t),n=t.items.length,fl=t.items.filter(i=>i.type==='flight').length;const dd=r.start?dayDiff(now.toISOString().slice(0,10),r.start):null;
  return`<div class="card" data-act="openTrip" data-id="${t.id}" style="cursor:pointer"><div class="row"><div class="sp"><div style="font-size:20px;font-weight:500">${esc(t.name)}</div><div class="mut">${esc(t.dest||'')} ${t.cc?'· '+esc(CC_NAME[t.cc]||t.cc):''}</div></div>${dd!==null&&dd>=0?`<span class="pill amber">in ${dd} d</span>`:dd!==null&&r.end&&D(r.end)>=now?`<span class="pill green">now</span>`:''}</div>
  <div class="mut sm" style="margin-top:6px">${r.start?fdate(r.start,{day:'numeric',month:'short',year:'numeric'}):'No dates'}${r.end?' → '+fdate(r.end,{day:'numeric',month:'short'}):''} · ${tripNights(t)} nights · ${fl} flights · ${n} items</div></div>`};
 return`<div style="margin-bottom:12px">${seg}</div>${backupBanner()}${countdownCard()}${todayCard()}${heroNext()}
 ${al.length?`<div class="card"><h3>Alerts</h3>${al.map(alertRow).join('')}${computeAlerts().length>3?`<div class="mut sm" style="padding-top:8px" data-act="alerts">+${computeAlerts().length-3} more</div>`:''}</div>`:''}
 <div class="row" style="margin:6px 0 10px"><h3 style="margin:0;font-size:18px;text-transform:uppercase;letter-spacing:1px" class="sp">Upcoming</h3><button class="btn s" data-act="newTrip">+ Trip</button></div>
 ${up.map(card).join('')||`<div class="empty">No upcoming trips</div>`}
 ${past.length?`<h3 style="font-size:18px;text-transform:uppercase;letter-spacing:1px;margin:18px 0 10px">Past</h3>${past.map(card).join('')}`:''}
 ${S.trips.length?'':`<div class="card"><button class="btn b" data-act="demo">Load sample trip</button></div>`}
 <div class="row w" style="margin-top:14px"><label class="btn o s">Import trip file<input type="file" id="tripfile" accept=".json,application/json" hidden></label></div>`}
/* ===== TRIP DETAIL ===== */
const SUBS=[['plan','Plan'],['crew','People'],['money','Money'],['pack','Pack'],['docs','Docs'],['share','Share'],['info','Info'],['alerts','Alerts']];
function viewTrip(){const t=trip(UI.tripId);if(!t){UI.tripId=null;return viewTrips()}
 const r=tripRange(t);
 const chips=`<div class="chips">${SUBS.map(([k,l])=>`<div class="chip ${UI.sub===k?'on':''}" data-act="sub" data-k="${k}">${l}</div>`).join('')}</div>`;
 const head=`<div class="card"><div class="row"><div class="sp"><div class="mut">${esc(t.dest||'')}${t.cc?' · '+esc(CC_NAME[t.cc]||t.cc):''}</div><div class="mut sm">${r.start?fdate(r.start):'No dates'}${r.end?' → '+fdate(r.end):''} · ${tripNights(t)} nights</div></div><button class="btn o s" data-act="editTrip">Edit</button></div></div>`;
 let body='';if(UI.sub==='plan')body=viewPlan(t);else if(UI.sub==='docs')body=`<div id="docsbox"><div class="empty">Loading…</div></div>`;else if(UI.sub==='crew')body=viewCrew(t);else if(UI.sub==='money')body=viewMoney(t);else if(UI.sub==='pack')body=viewPack(t);else if(UI.sub==='share')body=viewShare(t);else if(UI.sub==='info')body=viewInfo(t);else if(UI.sub==='journal')body=viewJournal(t);else body=viewTripAlerts(t);
 return head+chips+body}
function itemRow(i){const st=i.status?.state;const sub=[];
 if(i.type==='flight'){sub.push(`${apLabel(i.from)} → ${apLabel(i.to)}`);if(i.airline)sub.push(i.airline)}else if(i.address||i.location)sub.push(i.address||i.location);
 const meta=[i.conf&&'Ref '+i.conf,i.terminal&&'T'+i.terminal,i.gate&&'Gate '+i.gate,i.seat&&'Seat '+i.seat].filter(Boolean);
 if(i.type==='hotel'&&i.start&&i.end){const n=dayDiff(i.start.slice(0,10),i.end.slice(0,10));if(n>0){meta.unshift(n+(n>1?' nights':' night'));const num=parseFloat(String(i.cost||'').replace(',','.'));if(i.cost&&num>0){meta.push(i.cost+' total');const unit=String(i.cost).replace(/[0-9.,\s]/g,'');meta.push((Math.round(num/n*100)/100)+(unit?' '+unit:'')+'/night')}}}
 return`<div class="item ${i.type}" data-act="itemMenu" data-id="${i.id}"><div class="ic">${TYPES[i.type][0]}</div><div class="sp"><div class="t">${esc(itemTitle(i))}</div>
 <div class="mut sm">${ftime(i.start)}${i.end?' → '+(i.end.slice(0,10)!==(i.start||'').slice(0,10)?fdate(i.end.slice(0,10),{day:'numeric',month:'short'})+' ':'')+ftime(i.end):''}${sub.length?' · '+esc(sub.join(' · ')):''}</div>
 ${meta.length?`<div style="margin-top:4px">${meta.map(m=>`<span class="tag">${esc(m)}</span>`).join('')}</div>`:''}${st&&st!=='On time'?`<div style="margin-top:4px"><span class="pill ${st==='Cancelled'?'red':'amber'}">${esc(st)}${i.status.delay?' '+i.status.delay+' min':''}</span></div>`:''}</div></div>`}
function viewPlan(t){
 const its=t.items.slice().sort((a,b)=>(a.start||'~').localeCompare(b.start||'~'));const r=tripRange(t);
 const by={};its.forEach(i=>{const d=(i.start||'').slice(0,10)||'undated';(by[d]=by[d]||[]).push(i)});
 const days=new Set(Object.keys(by).filter(d=>d!=='undated'));
 if(r.start&&r.end&&dayDiff(r.start,r.end)<=60){for(let d=D(r.start);d<=D(r.end);d=new Date(d.getTime()+864e5))days.add(isoLocal(d).slice(0,10))}
 const list=[...days].sort();const today=isoLocal(new Date()).slice(0,10);const firstOpen=list.find(d=>d>=today&&by[d])||list.find(d=>by[d]);
 const stays=t.items.filter(i=>i.type==='hotel'&&i.start&&i.end);
 const ICO={flight:'✈️',hotel:'🏨',rail:'🚆',car:'🚗',activity:'🎟️',restaurant:'🍽️',note:'📝'};
 let h=list.map((d,k)=>{const its2=by[d]||[];const sIn=stays.filter(s=>s.start.slice(0,10)<d&&s.end.slice(0,10)>d);
  const kinds=[...new Set(its2.map(i=>ICO[i.type]))].join(' ');const fl=its2.filter(i=>i.type==='flight').length;
  const sOut0=stays.some(s=>s.end.slice(0,10)===d&&s.start.slice(0,10)<d);const sum=its2.length?`${its2.length} item${its2.length>1?'s':''}${fl?' · '+fl+' flight'+(fl>1?'s':''):''}`:sIn.length?'Staying at '+esc(sIn[0].title||'stay'):sOut0?'Check-out day':'Free day';
  const title=`<span class="sp"><span class="dtt">${fdate(d,{weekday:'short',day:'numeric',month:'short'})}</span> <span class="mut sm" style="text-transform:none;letter-spacing:0">· Day ${r.start?dayDiff(r.start,d)+1:k+1}</span><div class="mut sm" style="text-transform:none;letter-spacing:0;font-weight:400">${sum}${wxDay(t,d)}</div></span><span style="font-size:18px">${kinds}</span>`;
  const sOut=stays.filter(s=>s.end.slice(0,10)===d&&s.start.slice(0,10)<d);const inner=sOut.map(s=>`<div class="mut sm" style="padding:6px 4px">🏨 Check-out · ${esc(s.title||'Stay')}${ftime(s.end)?' · '+ftime(s.end):''}</div>`).join('')+its2.map(itemRow).join('')+sIn.map(s=>`<div class="mut sm" style="padding:6px 4px">🏨 ${esc(s.title||'Stay')} · night ${dayDiff(s.start.slice(0,10),d)+1} of ${dayDiff(s.start.slice(0,10),s.end.slice(0,10))}</div>`).join('')+(!its2.length&&!sIn.length&&!sOut.length?'<div class="mut sm" style="padding:6px 4px">Nothing planned</div>':'');
  return acc('d_'+t.id+d,title,inner+dayRoute(its2)+dayPlanBtn(d),d===firstOpen||d===today,fl?'alt':'')}).join('');
 if(by.undated)h+=acc('d_'+t.id+'u','<span class="sp">Undated</span>',by.undated.map(itemRow).join(''),true);
 const fl=t.items.filter(i=>i.type==='flight');const kg=fl.reduce((s,i)=>s+co2(i).kg,0);
 return`${readyCard(t)}${summaryCard(t)}<div class="row w" style="margin-bottom:10px"><button class="btn s" data-act="addItem">+ Add</button><button class="btn o s" data-act="importMail">📥 From email</button><button class="btn o s" data-act="exportIcs">📅 Calendar (.ics)</button><button class="btn o s" data-act="tripMap">🗺️ Explore here</button><button class="btn o s" data-act="tmapGo">🗺️ Trip map</button><button class="btn o s" data-act="dayIdeas">🏖️ Day trips</button></div>
 ${h||'<div class="empty">Nothing planned yet</div>'}
 ${offlineCard(t)}${fl.length?`<div class="card" style="margin-top:12px"><h3>Carbon</h3><div class="row"><div class="sp"><div class="big">${(kg/1000).toFixed(2)} t</div><div class="mut sm">CO₂e for ${fl.length} flight${fl.length>1?'s':''} · offset ≈ ${offsetEur(kg).toFixed(0)} €</div></div><button class="btn o s" data-act="tool" data-k="carbon">Offset options</button></div></div>`:''}`}
/* ---- docs ---- */
async function loadDocs(){const t=trip(UI.tripId);if(!t||UI.sub!=='docs')return;let ds=[];try{ds=(await docsOf(t.id)).filter(d=>!d.kind)}catch(e){}
 t.docCount=ds.length;save();const lim=S.settings.docLimit;
 const box=$('#docsbox');if(!box)return;
 box.innerHTML=`<div class="card"><div class="row"><h3 class="sp" style="margin:0">Documents</h3><span class="pill ${ds.length>=lim?'red':''}">${ds.length} / ${lim}</span></div>
 <div class="bar" style="margin:10px 0"><i style="width:${Math.min(100,ds.length/lim*100)}%"></i></div>
 <label class="btn b ${ds.length>=lim?'o':''}" style="${ds.length>=lim?'opacity:.5':''}">+ Add photo, QR code or PDF<input type="file" id="docin" accept="image/*,application/pdf" multiple hidden ${ds.length>=lim?'disabled':''}></label></div>
 ${ds.map(d=>`<div class="card row"><div style="font-size:26px">${d.type.includes('pdf')?'📄':'🖼️'}</div><div class="sp"><div>${esc(d.name)}</div><div class="mut sm">${(d.size/1024).toFixed(0)} KB · ${esc(fdate(d.added.slice(0,10),{day:'numeric',month:'short'}))}</div></div><button class="btn o s" data-act="docOpen" data-id="${d.id}">Open</button><button class="btn o s" data-act="docRen" data-id="${d.id}">Rename</button><button class="btn d s" data-act="docDel" data-id="${d.id}">✕</button></div>`).join('')||'<div class="empty">No documents yet</div>'}`;
 const inp=$('#docin');if(inp)inp.onchange=async e=>{let n=ds.length;for(const f of e.target.files){if(n>=lim){toast('Document limit reached ('+lim+')');break}await docPut({id:uid(),tripId:t.id,name:f.name,type:f.type,size:f.size,added:new Date().toISOString(),blob:f});n++}loadDocs()}}
/* ---- share ---- */
function viewShare(t){const txt=tripText(t);
 return`<div class="card"><h3>Send plans</h3><div class="row w"><button class="btn s" data-act="nshare">Share…</button><button class="btn o s" data-act="shr" data-k="wa">WhatsApp</button><button class="btn o s" data-act="shr" data-k="sms">SMS</button><button class="btn o s" data-act="shr" data-k="mail">Email</button><button class="btn o s" data-act="copyTrip">Copy text</button></div>
 <label class="row" style="margin-top:10px"><input type="checkbox" data-act="sharePP" ${UI.sharePP?'checked':''}><span class="sp">Include passport numbers</span></label><textarea readonly rows="9" style="margin-top:10px;font-size:14px">${esc(txt)}</textarea></div>
 <div class="card"><div class="row"><h3 class="sp" style="margin:0">Inner Circle</h3><button class="btn o s" data-act="tab" data-t="me">Manage</button></div>
 ${S.circle.length?S.circle.map(c=>`<div class="row" style="padding:8px 0;border-bottom:1px dashed var(--line)"><div class="sp"><div>${esc(c.name)}</div><div class="mut sm">${esc(c.contact)} · ${esc(c.method)}</div></div><button class="btn s" data-act="notifyOne" data-id="${c.id}">Send update</button></div>`).join(''):'<div class="empty">No contacts yet</div>'}
 ${S.circle.length?`<button class="btn b" style="margin-top:10px" data-act="notifyAll">Send update to everyone</button>`:''}</div>`}
/* ---- info ---- */
function viewInfo(t){const cc=t.cc;const inf=INFO[cc];const chk=t.checklist||(t.checklist=[['Passport valid & visa/entry rules checked',0],['Visa / ETA / entry form',0],['Travel insurance',0],['Online check-in done',0],['Currency / cards ready',0],['eSIM or roaming plan',0],['Plug adapter',0],['Offline maps downloaded',0],['Home secured / mail held',0]]);
 const fr='https://www.diplomatie.gouv.fr/fr/conseils-aux-voyageurs/conseils-par-pays-destination/';
 return`<div class="card"><h3>${cc?esc(CC_NAME[cc]||cc):'Country info'}</h3>${inf?[['Currency',inf[0]],['Plug type',inf[1]],['Voltage',inf[2]],['Emergency',inf[3]],['Driving',inf[4]],['Language',inf[5]],['Tipping',inf[6]],['Water',inf[7]]].map(([k,v])=>`<div class="kv"><b>${k}</b><span>${esc(v)}</span></div>`).join(''):`<div class="empty">Set a destination country on the trip${cc?' — no data for '+esc(cc):''}</div>`}
 <div class="row w" style="margin-top:10px">${A(fr,'FR travel advisories')}${A('https://www.travel-advisory.info/'+(cc||''),'Risk score')}${A('https://www.google.com/search?q='+enc('entry requirements '+(CC_NAME[cc]||t.dest||'')+' French citizens'),'Entry rules')}</div><div class="mut sm" style="margin-top:8px">Reference only — confirm visas, health and entry rules with official sources before you travel.</div></div>
 ${tzCard(t)}${entryChecks(t)}${phraseCard(t)}<div class="card"><h3>Before you go</h3>${chk.map((c,k)=>`<label class="row" style="padding:7px 0"><input type="checkbox" data-act="chk" data-k="${k}" ${c[1]?'checked':''}><span class="sp" style="${c[1]?'text-decoration:line-through;color:var(--mut)':''}">${esc(c[0])}</span></label>`).join('')}<button class="btn o s" data-act="chkAdd">+ Item</button></div>
 <div class="card"><h3>Travel tips</h3>${CITY_TIPS.map(x=>`<div class="row" style="padding:7px 0;align-items:flex-start"><span style="font-size:22px">${x[0]}</span><div class="sp"><b style="font-weight:500">${x[1]}</b><div class="mut sm">${x[2]}</div></div></div>`).join('')}</div>`}
function viewTripAlerts(t){const al=computeAlerts().filter(a=>a.tripId===t.id);return`<div class="card"><h3>Disruption watch</h3>${al.map(alertRow).join('')||'<div class="empty">Nothing to flag</div>'}<div class="mut sm" style="margin-top:8px">Checks connection times, status you log, passport validity, lodging gaps, documents and fares.</div></div>`}
/* ===== SHEETS: trip / item ===== */
function tripSheet(t){const cc=Object.keys(CC_NAME).sort((a,b)=>CC_NAME[a].localeCompare(CC_NAME[b]));
 openSheet(t?'Edit trip':'New trip',F('name','Trip name',t?.name,{ph:'Mexico, Christmas'})+F('dest','Destination',t?.dest,{ph:'Oaxaca'})+F('cc','Country',t?.cc||'',{type:'select',opts:[['','—'],...cc.map(c=>[c,CC_NAME[c]])]})+`<div class="g2">${F('start','Start',t?.start,{type:'date'})}${F('end','End',t?.end,{type:'date'})}</div>`+F('notes','Notes',t?.notes,{type:'area'})+(t?`<button class="btn o b" data-act="dupTrip" style="margin-bottom:8px">Duplicate trip</button><button class="btn d b" data-act="delTrip" style="margin-bottom:8px">Delete trip</button>`:''),v=>{if(!v.name.trim()){toast('Name the trip');return false}
  if(t)Object.assign(t,v);else{const n={id:uid(),items:[],docCount:0,...v};S.trips.push(n);UI.tripId=n.id;UI.sub='plan'}save();render()})}
function itemSheet(tid,type,it,pre){const t=trip(tid);it=it||pre||{};type=type||it.type||'flight';
 const tabs=`<div class="chips">${Object.entries(TYPES).map(([k,[ic,l]])=>`<div class="chip ${k===type?'on':''}" data-act="itemType" data-k="${k}">${ic} ${l}</div>`).join('')}</div>`;
 let f='';if(type==='flight'){f=`<div class="g2">${F('airline','Airline',it.airline)}${F('flightNo','Flight no.',it.flightNo,{ph:'AF1234',up:1})}</div><div class="g2">${F('from','From (IATA)',it.from,{ph:'CDG',up:1,list:'apl'})}${F('to','To (IATA)',it.to,{ph:'MEX',up:1,list:'apl'})}</div><div class="g2">${F('start','Departs (local)',it.start,{type:'datetime-local'})}${F('end','Arrives (local)',it.end,{type:'datetime-local'})}</div><div class="g3">${F('terminal','Terminal',it.terminal)}${F('gate','Gate',it.gate)}${F('seat','Seat',it.seat,{up:1})}</div><div class="g2">${F('cabin','Cabin',it.cabin||'Economy',{type:'select',opts:Object.keys(CLASS_MULT)})}${F('conf','Booking ref',it.conf,{up:1})}</div>`}
 else if(type==='hotel'){f=F('title','Name',it.title)+F('address','Address',it.address)+`<div class="g2">${F('start','Check-in',it.start,{type:'datetime-local'})}${F('end','Check-out',it.end,{type:'datetime-local'})}</div>`+F('conf','Booking ref',it.conf,{up:1})}
 else{f=F('title','Title',it.title)+F('location','Place / address',it.location||it.address)+`<div class="g2">${F('start','Start',it.start,{type:'datetime-local'})}${F('end','End',it.end,{type:'datetime-local'})}</div>`+F('conf','Booking ref',it.conf,{up:1})}
 f+=F('cost',type==='hotel'?'Total price for the stay':'Cost',it.cost,{ph:type==='hotel'?'480 €':'€'})+F('notes','Notes',it.notes,{type:'area'});
 const dl='';
 UI._item={tid,id:it.id,type};
 openSheet((it.id?'Edit ':'Add ')+TYPES[type][1],tabs+f+dl+(it.id?`<button class="btn d b" data-act="delItem" data-id="${it.id}" style="margin-bottom:8px">Delete</button>`:''),v=>{
  if(type==='flight'){v.from=(v.from||'').toUpperCase().trim();v.to=(v.to||'').toUpperCase().trim();v.flightNo=(v.flightNo||'').toUpperCase().replace(/\s/g,'');if(!v.from||!v.to||!v.start){toast('Add airports and departure time');return false}}
  else if(!v.title.trim()){toast('Add a title');return false}
  if(it.id)Object.assign(getItem(tid,it.id),v,{type});else t.items.push({id:uid(),type,...v});save();render()})}
function itemMenu(id){const t=trip(UI.tripId),i=getItem(t.id,id);const pos=i.type==='flight'?AP[i.from]:null;const q=i.address||i.location||i.title||'';
 const nav=i.type==='flight'?`${A(L.waze(pos?.lat,pos?.lon),'Waze to '+i.from)}${A(L.gll(pos?.lat,pos?.lon),'Google Maps')}`:q?`${A(L.gdir(q),'Google Maps')}${A(L.wazeQ(q),'Waze')}${A(L.earthQ(q),'🌍 Earth')}${A(L.apple(q),'Apple Maps')}`:'';
 openSheet(esc(itemTitle(i)),`<div class="mut">${fdt(i.start)}${i.end?' → '+fdt(i.end):''}</div>${i.conf?`<div class="kv"><b>Ref</b><span>${esc(i.conf)}</span></div>`:''}${i.notes?`<div class="mut" style="margin:8px 0">${esc(i.notes)}</div>`:''}
 <div class="row w" style="margin:12px 0">${nav}</div><div class="row w">
 <button class="btn s" data-act="editItem" data-id="${id}">Edit</button>${i.start?A(gcalLink(i),'Add to Google Calendar'):''}
 ${i.type==='flight'?`<button class="btn o s" data-act="tab" data-t="go" data-id="${id}">Flight tools</button>`:''}${i.type==='hotel'?`<button class="btn o s" data-act="exHotel" data-id="${id}">Nearby</button>`:''}
 <button class="btn o s" data-act="itemPass" data-id="${id}">🎫 Pass</button><button class="btn o s" data-act="shareItem" data-id="${id}">Share</button></div>`)}
/* ===== EMAIL IMPORT ===== */
const MON=w=>{w=w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');return/^jan/.test(w)?1:/^fev|^feb/.test(w)?2:/^mar/.test(w)?3:/^avr|^apr/.test(w)?4:/^mai|^may/.test(w)?5:/^juin|^jun/.test(w)?6:/^juil|^jul/.test(w)?7:/^aou|^aug/.test(w)?8:/^sep/.test(w)?9:/^oct/.test(w)?10:/^nov/.test(w)?11:/^dec/.test(w)?12:0};
function findDates(s){const o=[];let m;const y=(n)=>n<100?2000+n:n;const iso=(Y,M,Dd)=>`${Y}-${pad(M)}-${pad(Dd)}`;
 const r1=/\b(20\d\d)-(\d\d)-(\d\d)\b/g;while(m=r1.exec(s))o.push({i:m.index,d:m[0]});
 const r2=/\b(\d{1,2})[\/.](\d{1,2})[\/.](20\d\d)\b/g;while(m=r2.exec(s))o.push({i:m.index,d:iso(m[3],m[2],m[1])});
 const r3=/\b(\d{1,2})(?:st|nd|rd|th|er)?\s+([A-Za-zéûôàù]{3,10})\.?,?\s+(20\d\d)\b/g;while(m=r3.exec(s)){const mo=MON(m[2]);if(mo)o.push({i:m.index,d:iso(m[3],mo,m[1])})}
 const r4=/\b([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(20\d\d)\b/g;while(m=r4.exec(s)){const mo=MON(m[1]);if(mo)o.push({i:m.index,d:iso(m[3],mo,m[2])})}
 return o.sort((a,b)=>a.i-b.i)}
function findTimes(s){const o=[];const r=/\b([01]?\d|2[0-3])\s?[:h]\s?([0-5]\d)\s?(am|pm|AM|PM)?/g;let m;while(m=r.exec(s)){let h=+m[1];if(m[3]){const p=m[3].toLowerCase();if(p==='pm'&&h<12)h+=12;if(p==='am'&&h===12)h=0}o.push({i:m.index,t:pad(h)+':'+m[2]})}return o}
function parseEmail(txt){const T=txt.replace(/\r/g,''),out=[];
 let conf='';const km=/(confirmation|booking|reservation|reference|PNR|locator|réservation|dossier)/i.exec(T);if(km){const sub=T.slice(km.index+km[0].length,km.index+km[0].length+60);const c=/\b(?=[A-Z0-9]*[0-9])(?=[A-Z0-9]*[A-Z])[A-Z0-9]{5,8}\b|\b[A-Z]{6}\b/.exec(sub);if(c)conf=c[0]}
 const dates=findDates(T),times=findTimes(T);const fr=/\b([A-Z][A-Z0-9]|[A-Z0-9][A-Z])\s?(\d{2,4})\b/g;let m;const fm=[];
 while(m=fr.exec(T)){if(/^(20|19)\d\d$/.test(m[2])&&m[1].length===2&&!/[A-Z]/.test(m[1]))continue;fm.push({i:m.index,no:m[1]+m[2]})}
 fm.forEach((f,k)=>{const end=k+1<fm.length?fm[k+1].i:f.i+400;const ctx=T.slice(f.i,Math.min(end,f.i+400));const codes=[...ctx.matchAll(/\b[A-Z]{3}\b/g)].map(x=>x[0]).filter((c,ix,a)=>AP[c]&&a.indexOf(c)===ix);
  if(codes.length<2)return;const dBefore=dates.filter(d=>d.i<=f.i+400&&d.i>=f.i-250).sort((a,b)=>Math.abs(a.i-f.i)-Math.abs(b.i-f.i))[0]||dates.filter(d=>d.i<f.i).pop()||dates[0];
  const ts=times.filter(x=>x.i>f.i&&x.i<f.i+400);const date=dBefore?.d||'';
  const dep=ts[0]?.t||'',arr=ts[1]?.t||'';let ad=date;if(dep&&arr&&arr<dep&&date)ad=isoLocal(new Date(D(date).getTime()+864e5)).slice(0,10);
  out.push({type:'flight',flightNo:f.no,from:codes[0],to:codes[1],start:date?date+'T'+(dep||'00:00'):'',end:date&&arr?ad+'T'+arr:'',conf})});
 const hot=T.split('\n').find(l=>/h[oô]tel|resort|\binn\b|suites|hostel|apartment|airbnb|lodge|riad/i.test(l)&&l.trim().length<90);
 const ci=/check[- ]?in|arriv[ée]e|arrival/i.exec(T),co=/check[- ]?out|d[ée]part|departure/i.exec(T);
 if(hot&&ci&&co){const dIn=dates.find(d=>d.i>=ci.index-20)||dates[0],dOut=dates.find(d=>d.i>=co.index-20&&d.d>(dIn?.d||''))||dates[1];
  if(dIn)out.push({type:'hotel',title:hot.trim().replace(/^[^A-Za-zÀ-ÿ0-9]+/,''),start:dIn.d+'T15:00',end:dOut?dOut.d+'T11:00':'',conf})}
 if(!out.length)out.push({type:'note',title:T.split('\n').find(l=>l.trim())?.slice(0,60)||'Imported note',notes:T.slice(0,600),start:dates[0]?dates[0].d+'T09:00':''});
 return out}
function importSheet(){openSheet('Add from email',`<div class="mut sm" style="margin-bottom:8px">Paste a confirmation email (flight, hotel, rail…). Flights, airports, dates, times and references are detected and shown for review before anything is added.</div><textarea data-f="txt" rows="10" placeholder="Paste email text here"></textarea>`,v=>{if(!v.txt.trim()){toast('Paste the email text');return false}
 const d=parseEmail(v.txt);UI._drafts=d;setTimeout(()=>reviewDrafts(),50)},{ok:'Detect'})}
function reviewDrafts(){const d=UI._drafts;openSheet('Review detected plans',d.map((x,k)=>`<label class="card row" style="align-items:flex-start"><input type="checkbox" data-f="c${k}" checked><div class="sp"><div style="font-weight:500">${TYPES[x.type][0]} ${esc(itemTitle(x))}</div><div class="mut sm">${fdt(x.start)||'No date found'}${x.end?' → '+ftime(x.end):''}${x.conf?' · ref '+esc(x.conf):''}</div></div></label>`).join('')+'<div class="mut sm">Details can be edited after adding.</div>',v=>{const t=trip(UI.tripId);let n=0;d.forEach((x,k)=>{if(v['c'+k]){t.items.push({id:uid(),...x});n++}});save();render();toast(n+' added')},{ok:'Add selected'})}
/* ===== DEMO ===== */
function demo(){const y=new Date().getFullYear()+(new Date().getMonth()>10?1:0);const d=(m,dd,t)=>`${y}-${pad(m)}-${pad(dd)}T${t}`;
 S.trips.push({id:uid(),name:'Oaxaca & Mexico City',dest:'Mexico',cc:'MX',start:`${y}-12-24`,end:`${y+1}-01-07`,docCount:0,items:[
 {id:uid(),type:'flight',airline:'Air France',flightNo:'AF178',from:'CDG',to:'MEX',start:d(12,24,'11:15'),end:d(12,24,'16:30'),conf:'XK4P9Q',cabin:'Economy',terminal:'2E'},
 {id:uid(),type:'hotel',title:'Casa Condesa',address:'Colima 190, Roma Norte, Mexico City',start:d(12,24,'15:00'),end:d(12,28,'11:00'),conf:'HT55120',cost:'480 €'},
 {id:uid(),type:'flight',airline:'Aeroméxico',flightNo:'AM637',from:'MEX',to:'OAX',start:d(12,28,'09:40'),end:d(12,28,'11:05'),conf:'XK4P9Q'},
 {id:uid(),type:'activity',title:'Monte Albán guided visit',location:'Monte Albán, Oaxaca',start:d(12,30,'09:00'),end:d(12,30,'13:00')},
 {id:uid(),type:'flight',airline:'Air France',flightNo:'AF179',from:'MEX',to:'CDG',start:`${y+1}-01-06T22:10`,end:`${y+1}-01-07T16:35`,conf:'XK4P9Q'}]});save();render()}
