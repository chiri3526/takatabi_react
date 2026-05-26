const fs = require('node:fs');
const path = require('node:path');

const filePath = path.join(__dirname, '..', 'src', 'pages', 'articles', '[id].astro');
const source = fs.readFileSync(filePath, 'utf8');

const requiredSnippets = [
  'min-width: 0;',
  'overflow-wrap: anywhere;',
  ':global(table)',
  'overflow-x: auto;',
  ':global(pre)'
];

const missing = requiredSnippets.filter(snippet => !source.includes(snippet));

if (missing.length > 0) {
  console.error('Article mobile overflow guards are missing:');
  for (const snippet of missing) {
    console.error(`- ${snippet}`);
  }
  process.exit(1);
}

console.log('Article mobile overflow guards are present.');
