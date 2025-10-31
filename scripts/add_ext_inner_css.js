const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'ArticlePage.js');
let s = fs.readFileSync(file, 'utf8');
const marker = '/* CONSOLIDATED: external-link unified card */';
const idx = s.indexOf(marker);
if (idx === -1) { console.error('marker not found'); process.exit(1); }
// find insertion point: after the consolidated block end (we'll insert right after the consolidated block header, before existing rules)
// We'll insert additional rules for .ext-inner and sibling arrow anchors
const insertPos = s.indexOf('}', idx); // crude: find first closing brace after marker
const extra = `\n  /* Support standalone .ext-inner (server-produced) to display as unified card) */\n  .ext-inner {\n    display: flex;\n    align-items: center;\n    gap: 0.8rem;\n    border: 1px solid #e9f5ef;\n    background: linear-gradient(180deg,#ffffff,#f8fff8);\n    padding: 0.45rem 0.9rem;\n    border-radius: 10px;\n    margin: 0.6rem 0;\n    width: 100%;\n    box-sizing: border-box;\n    position: relative;\n    overflow: hidden;\n  }\n  /* Hide fully empty external-link anchors (e.g. stray anchors) */\n  a.external-link:empty { display: none; }\n  /* If an arrow anchor is a sibling after .ext-inner, visually overlap it on the card's right */\n  .ext-inner + a.external-link {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    width: 40px;\n    margin-left: -40px; /* overlap into card */\n    padding: 0;\n    background: transparent;\n    border: none;\n  }\n  .ext-inner + a.external-link .ext-arrow {\n    position: relative;\n    right: 0;\n    top: 0;\n    transform: none;\n    width: 16px;\n    height: 16px;\n    display: block;\n    color: #2E7D32;\n  }\n\n`;
// insert extra after the consolidated block start (we'll place it after the marker line)
const posAfterMarker = s.indexOf('\n', idx) + 1;
const newS = s.slice(0, posAfterMarker) + extra + s.slice(posAfterMarker);
fs.writeFileSync(file, newS, 'utf8');
console.log('Inserted ext-inner CSS rules');

