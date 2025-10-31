const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'ArticlePage.js');
let s = fs.readFileSync(file, 'utf8');
// Replace the specific container.querySelector(...) inside the DOMParser section with doc.querySelector(...)
s = s.replace(/const existing = container\.querySelector\(`a\.external-link\[href=\\"\$\{href\}\\"\]`\);/g, 'const existing = doc.querySelector(`a.external-link[href="${href}"]`);');
fs.writeFileSync(file, s, 'utf8');
console.log('Replaced container.querySelector with doc.querySelector in generateTocAndContent');

