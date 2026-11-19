const S={tab:'style',theme:'auto',seg:'a'};
const sw=(c,n)=>`<div><i style="background:${c}"></i><span>${n}</span></div>`;
function render(){
 $('#hdr').innerHTML=dmHeader({title:'DM kit',sub:'Style · Components · Build',by:false,big:true}).replace('class="disco"','class="disco"');
 $('#nav').innerHTML=dmNav([['style','🎨','Style'],['comp','🧩','Parts'],['apps','📱','Apps']],S.tab);
 $('#view').innerHTML=S.tab==='style'?vStyle():S.tab==='comp'?vComp():vApps()}
const vStyle=()=>`
<div class="card"><div class="lab">Theme</div>${dmSeg([['auto','Auto'],['light','Light'],['dark','Dark']],S.theme,'theme')}</div>
<div class="card"><h3>Titles</h3><h1 class="disco" style="display:block;font:700 38px/1 var(--fh);text-transform:uppercase;letter-spacing:1px;text-shadow:2px 2px 0 #4fbbbc,4px 4px 0 #f39120,6px 6px 0 #ec4624,8px 8px 0 #222a2a;padding:2px 12px 14px 0;margin:0">Voyager<span style="font:700 25px CavDM;text-transform:none;text-shadow:none;margin-left:6px;display:inline-block;transform:rotate(-3deg)">by DM</span></h1><div class="stitle" style="margin-top:12px">Day title · Thu 24 Dec</div><div class="lab" style="margin:8px 0 0">Today · Thursday 19 November</div></div>
<div class="card"><h3>Colours</h3><div class="sw">${sw('#2b8f91','Teal')}${sw('#4fbbbc','Light teal')}${sw('#f39120','Orange')}${sw('#ec4624','Red')}${sw('#222a2a','Dark')}${sw('#173a3c','Ink')}</div><div class="mut sm" style="margin:10px 0 4px">Background</div><div style="height:46px;border-radius:16px;background:linear-gradient(90deg,var(--g1),var(--g2),var(--g3));border:1px solid var(--line)"></div></div>
<div class="card"><h3>Font</h3><div style="font:700 30px var(--fh)">Oswald 700</div><div style="font:500 22px var(--fh)">Oswald 500 · 0123456789 €</div><div style="font:700 28px CavDM">handwritten · by DM</div></div>`;
const vComp=()=>`
<div class="card"><h3>Buttons</h3><div class="row w"><button class="btn">Primary</button><button class="btn o">Outline</button><button class="btn c">Amber</button><button class="btn d">Danger</button><button class="btn s">Small</button></div></div>
<div class="card"><h3>Switch and chips</h3>${dmSeg([['a','Trips'],['b','Calendar']],S.seg,'seg')}<div style="height:10px"></div>${dmChips([['1','Plan'],['2','People'],['3','Money'],['4','Pack']],'1','x')}</div>
<div class="card"><h3>Status</h3><div class="row w">${dmPill('green','Good')}${dmPill('amber','Watch')}${dmPill('red','Urgent')}${dmPill('blue','Info')}${dmPill('','Neutral')}</div><div style="height:12px"></div>${dmBar(62)}</div>
<div class="g2">${dmStat('8','Trip days')}${dmStat('3','Flights')}</div>
<div style="height:12px"></div>
${dmAcc('<span class="dtt">Thu 24 Dec</span> · Day 1','<div class="item"><div class="ic">✈️</div><div><div class="t">AF178 CDG → MEX</div><div class="mut sm">11:15 → 16:30</div></div></div>',true)}${dmAcc('<span class="dtt">Fri 25 Dec</span>','Day content',false,true)}
<div class="hero"><div class="mut">NEXT FLIGHT</div><div class="big">AF178 CDG → MEX</div><div class="row w" style="margin-top:10px"><button class="btn">Open</button><button class="btn o">Maps</button></div></div>
<div class="card"><h3>Form and list</h3><label class="f"><b>Name</b><input value="Dani"></label><div class="kv"><b>Seat</b><span>12A</span></div><div class="kv"><b>Gate</b><span>K42</span></div><div class="row w" style="margin-top:10px"><button class="btn o" data-act="sheet">Open sheet</button><button class="btn o" data-act="toast">Toast</button></div></div>`;
const vApps=()=>`<div class="card"><h3>The family</h3><div class="apps"><div class="app"><b>Training</b><div class="mut sm">Master look</div></div><div class="app"><b>Voyager</b><div class="mut sm">Travel</div></div><div class="app"><b>Next app</b><div class="mut sm">Same kit</div></div><div class="app edf"><b>EDF tools</b><div class="sm">Own identity, kept apart</div></div></div></div>
<div class="card"><h3>Build</h3><div class="kv"><b>dm-style.css</b><span>Look</span></div><div class="kv"><b>dm-core.js</b><span>Helpers</span></div><div class="kv"><b>dm-fonts.css</b><span>Fonts</span></div><div class="kv"><b>build.py</b><span>One file out</span></div></div>`;
const ACT={tab(d){S.tab=d.t;render()},theme(d){S.theme=d.k;dmTheme(d.k);render()},seg(d){S.seg=d.k;render()},sheet(){openSheet('Sheet',F('n','Name','Dani')+F('s','Seat','12A',{type:'select',opts:['Aisle','Window']}),()=>toast('Saved'))},toast(){toast('Toast message')},back(){},alerts(){}};
dmWire(ACT);render();
