const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'ArticlePage.js');
let s = fs.readFileSync(file, 'utf8');
const marker = '(function mergeSeparatedExtInner(';
let positions = [];
let idx = s.indexOf(marker);
while (idx !== -1) {
  positions.push(idx);
  idx = s.indexOf(marker, idx + 1);
}
if (positions.length <= 1) {
  console.log('No duplicate markers found, nothing to do.');
  process.exit(0);
}
// Keep first occurrence, remove the rest
const firstPos = positions[0];
let newS = s.slice(0, firstPos);
// copy first IIFE through its closing '})();'
const firstEnd = s.indexOf('})();', firstPos);
if (firstEnd === -1) { console.error('First IIFE not closed'); process.exit(1); }
newS += s.slice(firstPos, firstEnd + 4 + 1); // '})();' length 4 plus maybe newline
// Now for remaining markers, skip their bodies
let cur = firstEnd + 4 + 1;
// Append rest of file after removing subsequent IIFEs
// We'll iterate through remaining positions and skip between start and end
for (let i = 1; i < positions.length; i++) {
  const start = positions[i];
  const end = s.indexOf('})();', start);
  if (end === -1) {
    // if not found, skip to end
    cur = s.length;
    break;
  }
  // Append content from cur up to start
  newS += s.slice(cur, start);
  cur = end + 4 + 1; // move past '})();' and following newline maybe
}
// append remaining tail
if (cur < s.length) newS += s.slice(cur);
fs.writeFileSync(file, newS, 'utf8');
console.log('Removed duplicate mergeSeparatedExtInner IIFEs, kept first.');

