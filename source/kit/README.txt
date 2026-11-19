DM kit v1 (personal apps only; EDF apps keep their own identity and are not part of it)
dm-style.css   look: colours, layered titles, cards, buttons, pills, chips, segmented switch, bars, accordions, sheet, toast, tab bar, light/dark (+ forced theme)
dm-fonts.css   Oswald 500/700 and the handwritten "by DM" (embedded)
dm-core.js     helpers: sheet, toast, form fields, header and tab bar builders, IndexedDB, encrypted backup, passcode, theme, language, shared backup envelope
dm-shell.html  page skeleton; build.py puts kit + one app into a single index.html, manifest and service worker
specimen/      example app showing every part (open specimen/dist/index.html)
Build:  python3 build.py specimen/app.json
