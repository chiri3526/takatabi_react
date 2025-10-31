const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'ArticlePage.js');
let s = fs.readFileSync(file, 'utf8');
const lines = s.split(/\r?\n/);
let changed = false;
const out = lines.filter(line => {
  if (/\bconst\s+favicon\s*=/.test(line)) { changed = true; return false; }
  return true;
});
if (changed) {
  fs.writeFileSync(file, out.join('\n'), 'utf8');
  console.log('Removed favicon lines');
} else {
  console.log('No favicon lines found');
}

