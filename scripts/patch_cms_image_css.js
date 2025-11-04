const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'ArticlePage.js');
let s = fs.readFileSync(file, 'utf8');
const oldBlockStart = '  /* 本文内画像をコンテナ内に収める */\n  img.cms-image,';
const idx = s.indexOf(oldBlockStart);
if (idx === -1) { console.error('old block not found'); process.exit(1); }
// find end of the block by finding the next closing brace of that selector group
const from = idx;
const braceIdx = s.indexOf('\n\n', from);
// We'll do a targeted replace of localized properties: max-width, background, padding
s = s.replace(/max-width:\s*\d+px\s*!important;/g, 'max-width: 920px !important;');
s = s.replace(/background:\s*#fff;/g, 'background: transparent;');
s = s.replace(/padding:\s*8px;/g, 'padding: 0;');
fs.writeFileSync(file, s, 'utf8');
console.log('Patched cms-image CSS: max-width/background/padding updated');

