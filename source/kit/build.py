#!/usr/bin/env python3
"""DM kit builder:  python3 build.py app.json   ->  <out>/index.html, manifest.webmanifest, sw.js
app.json: {"name":"Voyager by DM","short":"Voyager","out":"dist","css":["app.css"],"js":["app.js"],"icons":"path/to/icons","cache":"voyager-v1"}"""
import json,sys,os,shutil
K=os.path.dirname(os.path.abspath(__file__));cfg=json.load(open(sys.argv[1]));base=os.path.dirname(os.path.abspath(sys.argv[1]))
rd=lambda p:open(p,encoding='utf8').read()
out=os.path.join(base,cfg.get('out','dist'));os.makedirs(out,exist_ok=True)
h=rd(os.path.join(K,'dm-shell.html'))
for k,v in {'{{TITLE}}':cfg['name'],'{{SHORT}}':cfg['short'],'{{FONTS}}':rd(os.path.join(K,'dm-fonts.css')),'{{CSS}}':rd(os.path.join(K,'dm-style.css')),
 '{{APPCSS}}':'\n'.join(rd(os.path.join(base,f)) for f in cfg.get('css',[])),'{{KIT_JS}}':rd(os.path.join(K,'dm-core.js')),'{{APP_JS}}':'\n'.join(rd(os.path.join(base,f)) for f in cfg['js'])}.items():h=h.replace(k,v)
open(os.path.join(out,'index.html'),'w',encoding='utf8').write(h)
json.dump({"name":cfg['name'],"short_name":cfg['short'],"start_url":".","scope":".","display":"standalone","background_color":"#d8f0ef","theme_color":"#d8f0ef","icons":[{"src":"icon-192.png","sizes":"192x192","type":"image/png"},{"src":"icon-512.png","sizes":"512x512","type":"image/png","purpose":"any"}]},open(os.path.join(out,'manifest.webmanifest'),'w'),indent=1)
sw=rd(os.path.join(K,'sw.template.js')).replace('{{CACHE}}',cfg.get('cache','dm-v1'));open(os.path.join(out,'sw.js'),'w').write(sw)
if cfg.get('icons'):
    for f in os.listdir(os.path.join(base,cfg['icons'])):shutil.copy(os.path.join(base,cfg['icons'],f),out)
print('built',out)
