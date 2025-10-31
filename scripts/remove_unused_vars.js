const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'ArticlePage.js');
let s = fs.readFileSync(file, 'utf8');
// Remove favicon declarations (two occurrences)
s = s.replace(/\n\s*const favicon = `https:\/\/www\.google\.com\/s2\/favicons\?domain=\$\{domain\}`;\n/g, '\n  // favicon omitted\n');
// Remove hrefCandidates and aSiblings declarations
s = s.replace(/\n\s*const hrefCandidates = new Set\(\);\n\s*const aSiblings = Array\.from\(containerEl\.querySelectorAll\('a\.external-link'\)\);\n/g, '\n  // hrefCandidates / aSiblings removed (unused)\n');
fs.writeFileSync(file, s, 'utf8');
console.log('Removed unused variable declarations');

