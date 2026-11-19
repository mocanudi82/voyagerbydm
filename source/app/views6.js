/* ===== v10: plan my day, packing suggestions, budget forecast, backup reminder, French ===== */

/* ---------- plan my day ---------- */
const PD={beach:['🏖️','Beach','10:30',120],hike:['🥾','Hike','09:00',240],food:['🍽️','Lunch','13:00',90],culture:['🏛️','Museum','11:00',90]};
function dayPlanBtn(d){return d>=v7today()?`<div style="padding:4px 0"><button class="btn o s" data-act="planDay" data-d="${d}">✨ Plan my day</button></div>`:''}
function planDay(d){const t=trip(UI.tripId);if(!t)return;const w=t.wx?.days?.[d],rain=w&&w[3]>=50;
 const wl=w?`<div class="row" style="margin-bottom:8px"><span style="font-size:28px">${wxIcon(w[0])}</span><span class="sp"><b style="font-weight:500">${Math.round(w[2])}° / ${Math.round(w[1])}°</b>${w[3]>=40?`<div class="mut sm">Rain ${w[3]}%</div>`:''}</span></div>`:'';
 openSheet('Plan my day · '+fdate(d,{weekday:'short',day:'numeric',month:'short'}),wl+F('beach','Beach',!rain,{type:'check'})+F('hike','Hike',!rain,{type:'check'})+F('food','Lunch spot',true,{type:'check'})+F('culture','Museums and culture',!!rain,{type:'check'})+F('drad','Travel by car up to',46000,{type:'select',opts:DRAD.map(([v,l])=>[v,l.replace(' by car','')])}),async v=>{
  if(!(v.beach||v.hike||v.food||v.culture)){toast('Choose at least one');return false}
  const g=await ensureGeo(t);if(!g){toast('Add a destination first');return false}
  toast('Searching…');const out={};const base={lat:g.lat,lon:g.lon,label:t.dest||t.name};
  const R=+v.drad||46000;
  if(v.beach)try{const E={...base,dsub:'beach',drad:R,res:[]};await dayTripRun(E);out.beach=E.res.slice(0,3)}catch(e){}
  if(v.hike)try{const E={...base,hr:Math.min(R,50000),hmode:'trails',res:[],hall:[],hn:0};await hikeRun(E);out.hike=(E.hall||[]).slice().sort((a,b)=>Math.abs(a.km-10)-Math.abs(b.km-10)).slice(0,3).map(x=>({...x,drive:x.d+' · '+x.km.toFixed(1)+' km · ≈ '+fmtH(x.hrs)}))}catch(e){}
  if(v.food)try{const E={...base,rad:3000,sub:'restaurant',tier:'',res:[]};await richNear(E);out.food=E.res.slice(0,3)}catch(e){}
  if(v.culture)try{const j=await overpass(`[out:json][timeout:30];nwr["tourism"~"^(museum|gallery)$"]["name"](around:4000,${g.lat},${g.lon});out center tags 60;`);out.culture=norm(j.elements,'Museum',base).slice(0,3)}catch(e){}
  const keys=Object.keys(out).filter(k=>out[k].length);if(!keys.length){toast('Nothing found nearby');return false}
  UI.pd={d,tid:t.id,out};
  openSheet('Pick for '+fdate(d,{weekday:'short',day:'numeric',month:'short'}),keys.map(k=>`<div class="lab" style="margin:8px 0 4px">${PD[k][0]} ${PD[k][1]}</div>`+out[k].map((r,i)=>F(`${k}_${i}`,`${esc(r.name)}<div class="mut sm" style="font-weight:400;text-transform:none;letter-spacing:0">${esc(r.drive||(r.dist<1000?Math.round(r.dist)+' m':(r.dist/1000).toFixed(1)+' km'))}</div>`,i===0,{type:'check'})).join('')+F('time_'+k,'Time',PD[k][2],{type:'time'})).join(''),v2=>{
   const P=UI.pd,tt=trip(P.tid);let n=0;Object.keys(P.out).forEach(k=>P.out[k].forEach((r,i)=>{if(!v2[`${k}_${i}`])return;const s=new Date(P.d+'T'+(v2['time_'+k]||PD[k][2])),e=new Date(s.getTime()+PD[k][3]*6e4);
    tt.items.push({id:uid(),type:k==='food'?'restaurant':'activity',title:r.name,location:r.name,lat:r.lat,lon:r.lon,start:isoLocal(s),end:isoLocal(e),notes:k==='hike'?(r.km.toFixed(1)+' km · ≈ '+fmtH(r.hrs)+' · '+r.d):''});n++}));save();render();toast(n+(n===1?' stop added':' stops added'))},{ok:'Add to day'});
  return false},{ok:'Find'})}

/* ---------- packing suggestions ---------- */
PACK.Sun=['Sunscreen','Sunglasses','Hat','Reusable water bottle'];PACK.Rain=['Umbrella','Rain jacket','Waterproof bag'];PACK.Long=['Laundry bag','Travel detergent','Spare charging cable'];
function packSuggest(t){const txt=(t.items.map(i=>[i.title,i.location,i.notes].join(' ')).join(' ')+' '+(t.name||'')+' '+(t.notes||'')).toLowerCase();const have=new Set((t.pack||[]).map(x=>x.t)),add=[],why=[];
 const grp=(k,r)=>{const n=PACK[k].filter(x=>!have.has(x)&&!add.some(a=>a.t===x));if(n.length){n.forEach(x=>add.push({t:x,cat:k}));why.push(r)}};
 if(!(t.pack||[]).length)grp('Essentials','Essentials');
 if(/beach|plage|playa|snorkel|swim|baignade|nudist|naturist/.test(txt))grp('Beach','Beach plans');
 if(/hike|hiking|trek|trail|rando|sendero|randonn/.test(txt))grp('Hiking','Hiking plans');
 if(/\bski|snowboard|piste/.test(txt))grp('Ski','Ski plans');
 const wd=Object.values(t.wx?.days||{});if(wd.length){const mn=Math.min(...wd.map(x=>x[2])),mx=Math.max(...wd.map(x=>x[1])),rn=Math.max(...wd.map(x=>x[3]));
  if(mn<8)grp('Cold','Down to '+Math.round(mn)+'°');if(mx>=27)grp('Sun','Up to '+Math.round(mx)+'°');if(rn>=50)grp('Rain','Rain likely')}
 if(tripNights(t)>=8)grp('Long','Long trip');
 return{add,why}}
function suggestCard(t){const s=packSuggest(t);if(!s.add.length)return'';
 return`<div class="card"><div class="row"><h3 class="sp" style="margin:0">Suggested for this trip</h3><span class="pill">${s.add.length}</span></div><div class="row w" style="margin:8px 0">${s.why.map(w=>`<span class="pill blue">${esc(w)}</span>`).join('')}</div><div class="mut sm" style="margin-bottom:8px">${s.add.slice(0,8).map(x=>esc(x.t)).join(' · ')}${s.add.length>8?' …':''}</div><button class="btn s" data-act="packSugg">Add ${s.add.length} items</button></div>`}
const _vPack=viewPack;viewPack=t=>suggestCard(t)+_vPack(t);

/* ---------- budget forecast ---------- */
function paceOf(t){const ex=exps(t);if(!ex.length)return null;const ds=new Set(ex.map(e=>e.date)),eur=ex.reduce((s,e)=>s+e.eur,0),r=tripRange(t),td=v7today();let n=ds.size;if(r.start&&td>=r.start)n=Math.max(n,dayDiff(r.start,r.end&&td>r.end?r.end:td)+1);return n>=2?{perDay:eur/n,days:n}:null}
function forecastCard(t){const r=tripRange(t);if(!r.start||!r.end)return'';const td=v7today(),days=dayDiff(r.start,r.end)+1,bk=bookingsEUR(t).sum,started=td>=r.start;let rate=null,src='';
 const own=started?paceOf(t):null;if(own){rate=own.perDay;src='your pace so far'}else{const o=S.trips.filter(x=>x!==t).map(paceOf).filter(Boolean);if(o.length){rate=o.reduce((s,x)=>s+x.perDay,0)/o.length;src='your average on past trips'}}
 if(rate==null)return'';const spent=exps(t).reduce((s,e)=>s+e.eur,0),done=started?Math.min(days,dayDiff(r.start,td>r.end?r.end:td)+1):0,proj=bk+spent+rate*Math.max(0,days-done);
 return`<div class="card"><div class="mut sm">FORECAST</div><div class="big">${money(proj)}</div><div class="mut sm">${money(rate)} a day, based on ${src}${bk?' · bookings '+money(bk):''}</div>${t.budget?`<div class="bar" style="margin:8px 0"><i style="width:${Math.min(100,proj/t.budget*100)}%${proj>t.budget?';background:var(--bad)':''}"></i></div><span class="pill ${proj>t.budget?'red':'green'}">${proj>t.budget?money(proj-t.budget)+' over budget':money(t.budget-proj)+' under budget'}</span>`:''}</div>`}
const _vMoney=viewMoney;viewMoney=t=>forecastCard(t)+_vMoney(t);

/* ---------- backup reminder ---------- */
function backupBanner(){if(!S.trips.length)return'';const n=S._chg||0,last=S.lastBackup?Math.floor((Date.now()-new Date(S.lastBackup))/864e5):null,sn=S.settings.bkSnooze;if(sn&&sn>v7today())return'';
 if(!((last===null&&n>=12)||(last!==null&&last>=3&&n>=30)||(last!==null&&last>=30)))return'';
 return`<div class="card"><div class="row"><div class="sp"><b style="font-weight:500">Back up your trips</b><div class="mut sm">${last===null?'Never backed up':'Last backup '+last+' days ago'} · ${n} changes since</div></div><button class="btn s" data-act="exportAll">Back up</button><button class="btn o s" data-act="bkLater">Later</button></div></div>`}
Object.assign(ACT3,{planDay(d){planDay(d.d)},packSugg(){const t=trip(UI.tripId),s=packSuggest(t),p=t.pack=t.pack||[];s.add.forEach(x=>p.push({id:uid(),t:x.t,cat:x.cat,done:0}));save();render();toast(s.add.length+' items added')},bkLater(){S.settings.bkSnooze=addDays(v7today(),3);save();render()}});

/* ---------- French for the new screens ---------- */
Object.assign(FR,{'Ready to go':'Prêt à partir','Dates set':'Dates définies','Add trip dates':'Ajouter les dates','Return travel booked':'Retour réservé','No transport added':'Aucun transport ajouté','Stay booked for every night':'Hébergement pour chaque nuit','Packing list not started':'Liste de valise non commencée','Maps saved offline':'Cartes enregistrées hors ligne','Maps not saved offline':'Cartes non enregistrées hors ligne','Travel insurance':'Assurance voyage','Visa / entry permit':'Visa / autorisation d’entrée','Cash and cards':'Espèces et cartes','NEXT TRIP':'PROCHAIN VOYAGE','DAYS':'JOURS','DAY':'JOUR',
'Save as list':'Enregistrer la liste','Copy from trip':'Copier d’un voyage','My lists':'Mes listes','Save as list ':'Enregistrer la liste','Suggested for this trip':'Suggestions pour ce voyage','Essentials':'Indispensables','Beach plans':'Projets plage','Hiking plans':'Projets rando','Ski plans':'Projets ski','Rain likely':'Pluie probable','Long trip':'Long voyage',
'⚡ Quick':'⚡ Rapide','Quick expense':'Dépense rapide','🍽️ Food':'🍽️ Repas','🚕 Transport':'🚕 Transport','🏨 Stay':'🏨 Hébergement','🎟️ Activities':'🎟️ Activités','🛍️ Shopping':'🛍️ Achats','🧾 Other':'🧾 Autre','FORECAST':'PRÉVISION',
'Share trip file':'Partager le fichier du voyage','PDF summary':'Résumé PDF','Trip file':'Fichier du voyage','Import trip file':'Importer un voyage','Share trip file ':'Partager le voyage','Booking references':'Références de réservation','Packing list':'Liste de valise','Journal text':'Texte du journal','Share':'Partager','Journal':'Journal','PDF journal':'Journal en PDF','＋ Write':'+ Écrire','Notes':'Notes','Photos':'Photos','Photo':'Photo','Delete photo':'Supprimer la photo','Today':'Aujourd’hui',
'Search':'Rechercher','No results':'Aucun résultat','⚡ Expense':'⚡ Dépense','📓 Journal':'📓 Journal','🔍 Search':'🔍 Rechercher','Same time':'Même heure',
'Add to a trip day':'Ajouter à un jour','＋ Trip day':'+ Jour du voyage','🏖️ Day trips':'🏖️ Sorties','Day trips':'Sorties','🗺️ Day route':'🗺️ Itinéraire du jour','🌍 Earth':'🌍 Earth','Earth':'Earth','⭐ Reviews':'⭐ Avis','⭐ Best rated on Maps':'⭐ Mieux notés sur Maps','Search the web':'Chercher sur le web','Recommendations':'Recommandations','Compare on other sites':'Comparer sur d’autres sites',
'✨ Plan my day':'✨ Planifier ma journée','Find':'Trouver','Add to day':'Ajouter au jour','Beach':'Plage','Hike':'Randonnée','Lunch spot':'Déjeuner','Museums and culture':'Musées et culture','Travel by car up to':'En voiture jusqu’à','Time':'Heure','Duration (min)':'Durée (min)','Day':'Jour',
'🏖️ Beaches':'🏖️ Plages','🌞 Nudist beaches':'🌞 Plages naturistes','👨‍👩‍👧 Lifeguarded beaches':'👨‍👩‍👧 Plages surveillées','🏊 Swim spots':'🏊 Baignades','💧 Waterfalls':'💧 Cascades','🌄 Viewpoints':'🌄 Points de vue','♨️ Hot springs':'♨️ Sources chaudes','🌲 Nature reserves':'🌲 Réserves naturelles','🏰 Castles':'🏰 Châteaux',
'🥾 Trails':'🥾 Sentiers','⛰️ Peaks & huts':'⛰️ Sommets et refuges','Under 6 km':'Moins de 6 km','6 – 14 km':'6 – 14 km','14 – 25 km':'14 – 25 km','25 km +':'25 km et +','Easy':'Facile','Moderate':'Modéré','Hard':'Difficile','Under 2 h':'Moins de 2 h','2 – 4 h':'2 – 4 h','4 – 6 h':'4 – 6 h','Full day':'Journée','🔁 Loops only':'🔁 Boucles seulement','Check more routes':'Voir plus de sentiers','TOP PICK':'MEILLEUR CHOIX','Trail':'Sentier',
'🟢 Open now':'🟢 Ouvert maintenant','Open now':'Ouvert','Closed now':'Fermé','€ Budget':'€ Économique','€€ Mid-range':'€€ Moyen','€€€ Upscale':'€€€ Haut de gamme','🍝 Italian':'🍝 Italien','🥖 French':'🥖 Français','🌮 Mexican':'🌮 Mexicain','🍣 Japanese':'🍣 Japonais','🥢 Asian':'🥢 Asiatique','🦐 Seafood':'🦐 Fruits de mer','🍔 Burgers & pizza':'🍔 Burgers et pizzas','🌿 Vegetarian & vegan':'🌿 Végétarien et vegan','🥩 Grill & steak':'🥩 Grillades','🏠 Local cuisine':'🏠 Cuisine locale','🍸 Cocktails':'🍸 Cocktails','🍷 Wine bars':'🍷 Bars à vin','🍺 Beer & pubs':'🍺 Bières et pubs','🎵 Live music':'🎵 Musique live','🌤️ Outdoor seating':'🌤️ Terrasse',
'Back up your trips':'Sauvegardez vos voyages','Back up':'Sauvegarder','Later':'Plus tard','Save maps automatically':'Enregistrer les cartes automatiquement','On':'Oui','Off':'Non','Travel Workout trip':'Voyage Travel Workout'});
function frRule(k){let m;
 if(k.includes(' · ')){const ps=k.split(' · '),o=ps.map(x=>FR[x]!==undefined?FR[x]:frRule(x)||x);return o.join(' · ')!==k?o.join(' · '):null}
 if(m=k.match(/^Last backup (\d+) days? ago$/))return'Dernière sauvegarde il y a '+m[1]+' j';
 if(k==='Never backed up')return'Jamais sauvegardé';
 if(m=k.match(/^(\d+) changes? since$/))return m[1]+' modifications depuis';
 if(m=k.match(/^(\d+) flights?$/))return m[1]+' vol'+(m[1]==='1'?'':'s');
 if(m=k.match(/^(\d+) items?$/))return m[1]+' élément'+(m[1]==='1'?'':'s');
 if(m=k.match(/^(\d+) nights?$/))return m[1]+(m[1]==='1'?' nuit':' nuits');
 if(k==='passport expiry not entered')return'expiration du passeport non renseignée';
 if(k==='Never backed up')return k;
 if(m=k.match(/^(\d+) nights? without a stay$/))return m[1]+(m[1]==='1'?' nuit':' nuits')+' sans hébergement';
 if(m=k.match(/^Packing (\d+) of (\d+)$/))return'Valise '+m[1]+' sur '+m[2];
 if(m=k.match(/^Ready (\d+) \/ (\d+)/))return'Prêt '+m[1]+' / '+m[2]+k.slice(m[0].length);
 if(m=k.match(/^Within (\d+) km$/))return'À moins de '+m[1]+' km';
 if(m=k.match(/^(.+) by car$/))return m[1].replace(/ min$/,' min').replace(/^(\d) h$/,'$1 h')+' en voiture';
 if(m=k.match(/^Add (\d+) items$/))return'Ajouter '+m[1]+' éléments';
 if(m=k.match(/^(\d+) days? to /))return k.replace(/ to /,' avant ');
 if(m=k.match(/^Day (\d+)$/))return'Jour '+m[1];
 if(m=k.match(/^Staying · (.*)$/))return'Sur place · '+m[1];
 if(m=k.match(/^Check-out · (.*)$/))return'Départ de l’hébergement · '+m[1];
 if(m=k.match(/^(.+) estimated from map tags$/))return m[1]+' estimé d’après les données de carte';
 if(m=k.match(/^(.+) local time$/))return k;return null}
