/* ===== CORE ===== */
const enc=encodeURIComponent;
const KEY='wayfar.v1';
function defaults(){return{trips:[],gems:[],programs:[],circle:[],safety:[],people:[],wallet:[],lastBackup:'',
profile:{name:'',passport:'',passportNo:'',passportCountry:'',seat:'Aisle',meal:'',ktn:'',emerg:'',home:'CDG'},
settings:{docLimit:25,buffer:150,bufferDom:120,travelMin:45,minConnect:60,offsetPrice:30,notify:false,wiki:'en'},
ratings:[],fired:{}}}
let S=(()=>{try{const j=JSON.parse(localStorage.getItem(KEY));if(j)return{...defaults(),...j,profile:{...defaults().profile,...j.profile},settings:{...defaults().settings,...j.settings}}}catch(e){}return defaults()})();
function save(){try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){toast('Storage is full — export a backup')}}
let UI={tab:'trips',tripId:null,sub:'plan',tool:null,goFlight:null,ex:{cat:'near',sub:'restaurant',rad:1000,res:[],lat:null,lon:null,label:'',loading:false,err:''}};
const trip=id=>S.trips.find(t=>t.id===id);
/* ---- dates ---- */
const D=s=>s?new Date(s.length<=10?s+'T12:00':s):null;
const pad=n=>String(n).padStart(2,'0');
const isoLocal=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
const fdate=(s,o)=>{if(!s)return'';return D(s).toLocaleDateString(LOC(),o||{weekday:'short',day:'numeric',month:'short',year:'numeric'})};
const ftime=s=>s&&s.length>10?s.slice(11,16):'';
const fdt=s=>s?fdate(s,{weekday:'short',day:'numeric',month:'short'})+(s.length>10?' · '+ftime(s):''):'';
const dayDiff=(a,b)=>Math.round((D(b.slice(0,10))-D(a.slice(0,10)))/864e5);
function rel(ms){const a=Math.abs(ms),m=Math.round(a/6e4),h=Math.floor(m/60),d=Math.floor(h/24);const s=d>=2?d+' d '+(h%24)+' h':h>=1?h+' h '+pad(m%60)+' min':m+' min';return s}
/* ---- geo ---- */
const hav=(a,b,c,d)=>{const R=6371,r=x=>x*Math.PI/180,dl=r(c-a),dn=r(d-b),x=Math.sin(dl/2)**2+Math.cos(r(a))*Math.cos(r(c))*Math.sin(dn/2)**2;return 2*R*Math.asin(Math.sqrt(x))};
const apDist=(a,b)=>AP[a]&&AP[b]?hav(AP[a].lat,AP[a].lon,AP[b].lat,AP[b].lon):0;
const apLabel=c=>AP[c]?`${c} · ${AP[c].city}`:c;
/* ---- map links ---- */
const L={
 gdir:(q,m)=>`https://www.google.com/maps/dir/?api=1&destination=${enc(q)}${m?'&travelmode='+m:''}`,
 gsearch:q=>`https://www.google.com/maps/search/?api=1&query=${enc(q)}`,
 gll:(a,b)=>`https://www.google.com/maps/dir/?api=1&destination=${a},${b}`,
 waze:(a,b)=>`https://waze.com/ul?ll=${a},${b}&navigate=yes`,
 wazeQ:q=>`https://waze.com/ul?q=${enc(q)}&navigate=yes`,
 apple:q=>`https://maps.apple.com/?daddr=${enc(q)}`,
 osm:(a,b,z)=>`https://www.openstreetmap.org/?mlat=${a}&mlon=${b}#map=${z||16}/${a}/${b}`,
 embed:(a,b,d)=>{d=d||.01;return`https://www.openstreetmap.org/export/embed.html?bbox=${b-d},${a-d*.6},${b+d},${a+d*.6}&layer=mapnik&marker=${a},${b}`}
};
const A=(h,t,c='btn o s')=>`<a class="${c}" href="${h}" target="_blank" rel="noopener">${t}</a>`;
/* ---- toast / sheet ---- */
/* ---- IndexedDB docs ---- */
const DB=dmDB('wayfar-docs',['docs','wallet'],2);
const docPut=d=>DB.put('docs',d),docDel=id=>DB.del('docs',id),docAll=()=>DB.all('docs');
const docsOf=async tid=>(await docAll()).filter(d=>d.tripId===tid);
/* ---- file out ---- */
/* ---- items ---- */
const TYPES={flight:['✈️','Flight'],hotel:['🏨','Stay'],rail:['🚆','Rail'],car:['🚗','Car'],activity:['🎟️','Activity'],restaurant:['🍽️','Dining'],note:['📝','Note']};
const allFlights=()=>S.trips.flatMap(t=>t.items.filter(i=>i.type==='flight').map(i=>({...i,_t:t}))).sort((a,b)=>(a.start||'').localeCompare(b.start||''));
const itemTitle=i=>i.type==='flight'?`${i.flightNo||'Flight'} ${i.from||'?'} → ${i.to||'?'}`:(i.title||TYPES[i.type][1]);
const getItem=(tid,iid)=>trip(tid)?.items.find(i=>i.id===iid);
const flightDep=i=>D(i.start),flightArr=i=>D(i.end||i.start);
const isIntl=i=>AP[i.from]&&AP[i.to]?AP[i.from].cc!==AP[i.to].cc:true;
function leaveBy(i){const dep=flightDep(i);if(!dep)return null;const buf=isIntl(i)?S.settings.buffer:S.settings.bufferDom;const tm=i.travelMin??S.settings.travelMin;return new Date(dep.getTime()-(buf+tm)*6e4)}
function tripRange(t){const ds=t.items.map(i=>i.start).filter(Boolean).sort();const es=t.items.map(i=>i.end||i.start).filter(Boolean).sort();return{start:t.start||ds[0]?.slice(0,10),end:t.end||es[es.length-1]?.slice(0,10)}}
function tripNights(t){const r=tripRange(t);return r.start&&r.end?Math.max(0,dayDiff(r.start,r.end)):0}
/* ---- carbon ---- */
const CLASS_MULT={Economy:1,'Premium economy':1.5,Business:2.5,First:3};
function co2(i){const d=apDist(i.from,i.to)*1.08;if(!d)return{km:0,kg:0};const f=d<1500?.150:d<4000?.115:.100;return{km:d,kg:d*f*(CLASS_MULT[i.cabin||'Economy']||1)}}
const offsetEur=kg=>kg/1000*S.settings.offsetPrice;
/* ---- ICS ---- */
const icsDt=d=>`${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
const icsEsc=s=>String(s||'').replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');
function icsEvent(uid_,title,s,e,loc,desc,alarmMin){const a=alarmMin!=null?`BEGIN:VALARM\r\nACTION:DISPLAY\r\nDESCRIPTION:${icsEsc(title)}\r\nTRIGGER:-PT${alarmMin}M\r\nEND:VALARM\r\n`:'';
 return`BEGIN:VEVENT\r\nUID:${uid_}@wayfar\r\nDTSTAMP:${icsDt(new Date())}\r\nDTSTART:${icsDt(s)}\r\nDTEND:${icsDt(e)}\r\nSUMMARY:${icsEsc(title)}\r\nLOCATION:${icsEsc(loc)}\r\nDESCRIPTION:${icsEsc(desc)}\r\n${a}END:VEVENT\r\n`}
function tripICS(t){let o='BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Voyager by DM//EN\r\nCALSCALE:GREGORIAN\r\n';
 t.items.forEach(i=>{if(!i.start)return;const s=D(i.start),e=i.end?D(i.end):new Date(s.getTime()+36e5);
  const loc=i.type==='flight'?(AP[i.from]?.name||i.from):(i.address||i.location||'');
  const desc=[i.conf&&'Ref: '+i.conf,i.seat&&'Seat: '+i.seat,i.terminal&&'Terminal: '+i.terminal,i.gate&&'Gate: '+i.gate,i.notes].filter(Boolean).join('\n');
  o+=icsEvent(i.id,(TYPES[i.type][0])+' '+itemTitle(i),s,e,loc,desc,i.type==='flight'?180:60);
  if(i.type==='flight'){const ci=new Date(s.getTime()-864e5);o+=icsEvent(i.id+'-ci','Check-in opens: '+itemTitle(i),ci,new Date(ci.getTime()+18e5),'',(i.conf?'Ref: '+i.conf:''),0);
   const lb=leaveBy(i);if(lb)o+=icsEvent(i.id+'-go','GO NOW to airport: '+itemTitle(i),lb,new Date(lb.getTime()+9e5),AP[i.from]?.name||'','Leave now to reach '+i.from+' in time',0)}});
 return o+'END:VCALENDAR\r\n'}
function gcalLink(i){const s=D(i.start),e=i.end?D(i.end):new Date(s.getTime()+36e5);return`https://calendar.google.com/calendar/render?action=TEMPLATE&text=${enc(itemTitle(i))}&dates=${icsDt(s)}/${icsDt(e)}&details=${enc(i.conf?'Ref: '+i.conf:'')}&location=${enc(i.address||i.location||AP[i.from]?.name||'')}`}
/* ---- text summary ---- */
function tripText(t){const r=tripRange(t);let s=`✈️ ${t.name}${t.dest?' — '+t.dest:''}\n${r.start?fdate(r.start):''}${r.end?' → '+fdate(r.end):''}\n`;let day='';s+=crewText(t,UI.sharePP);
 t.items.slice().sort((a,b)=>(a.start||'').localeCompare(b.start||'')).forEach(i=>{const d=(i.start||'').slice(0,10);if(d!==day){day=d;s+=`\n${d?fdate(d):'Undated'}\n`}
  s+=`${TYPES[i.type][0]} ${ftime(i.start)} ${itemTitle(i)}${i.type==='flight'&&i.end?' (arr '+ftime(i.end)+')':''}${i.conf?' · ref '+i.conf:''}${i.terminal?' · T'+i.terminal:''}${i.gate?' gate '+i.gate:''}\n`});
 return s.trim()}
function shareTo(kind,text,to){const e=enc(text);const u={wa:`https://wa.me/${to?to.replace(/\D/g,''):''}?text=${e}`,sms:`sms:${to||''}&body=${e}`,mail:`mailto:${to||''}?subject=${enc('Travel plans')}&body=${e}`}[kind];location.href=u}
async function nativeShare(text){if(navigator.share){try{await navigator.share({title:'Travel plans',text});return}catch(e){if(e.name==='AbortError')return}}copy(text)}
