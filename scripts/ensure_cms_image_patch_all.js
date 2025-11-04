const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'ArticlePage.js');
let s = fs.readFileSync(file, 'utf8');
// Replace max-width for cms-image occurrences
s = s.replace(/max-width:\s*\d+px\s*!important;/g, 'max-width: 920px !important;');
// Replace background and padding when used in context of cms-image block
s = s.replace(/(img\.cms-image,\n\s*\.cms-image\s*\{[\s\S]*?)(background:\s*#fff;)/g, (m, p1) => p1.replace(/background:\s*#fff;/g, 'background: transparent;'));
// generic replace for padding: 8px; near cms-image
s = s.replace(/(img\.cms-image,\n\s*\.cms-image\s*\{[\s\S]*?)(padding:\s*8px;)/g, (m, p1) => p1.replace(/padding:\s*8px;/g, 'padding: 0;'));
// Also fallback: replace any standalone padding: 8px; following .cms-image
s = s.replace(/(\.cms-image[^\{]*\{[\s\S]*?)padding:\s*8px;/g, (m) => m.replace(/padding:\s*8px;/, 'padding: 0;'));
// write back
fs.writeFileSync(file, s, 'utf8');
console.log('Ensured cms-image CSS patched across file');

