const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'ArticlePage.js');
let s = fs.readFileSync(file, 'utf8');
// find all occurrences of '(function mergeSeparatedExtInner()' and keep only first IIFE
const marker = '(function mergeSeparatedExtInner()';
let idx = s.indexOf(marker);
if (idx === -1) { console.log('No merge IIFE found'); process.exit(0); }
// find end of first IIFE
const firstEnd = s.indexOf('})();', idx);
if (firstEnd === -1) { console.error('first IIFE not closed'); process.exit(1); }
// remove any further occurrences of the marker and their bodies until '})();' following them
let pos = firstEnd + '})();'.length;
while (true) {
  const nextIdx = s.indexOf(marker, pos);
  if (nextIdx === -1) break;
  const nextEnd = s.indexOf('})();', nextIdx);
  if (nextEnd === -1) break;
  // remove from nextIdx to nextEnd+'})();'.length
  s = s.slice(0, nextIdx) + s.slice(nextEnd + '})();'.length);
  pos = nextIdx; // continue after removed segment
}
fs.writeFileSync(file, s, 'utf8');
console.log('Removed duplicate mergeSeparatedExtInner occurrences');

