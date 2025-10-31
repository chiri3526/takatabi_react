const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'ArticlePage.js');
let s = fs.readFileSync(file, 'utf8');
const oldLine = "const noProto = href.replace(/^https?://, '');";
const newLine = "const noProto = href.replace(/^https?:\\/\\//, '');";
if (s.indexOf(oldLine) === -1) {
  console.log('Old line not found, attempting looser replace');
  // try to replace unescaped pattern using regex
  const re = /const\s+noProto\s*=\s*href\.replace\(\s*\/\^https\?:\/\/\s*\/,\s*''\s*\);/;
  if (re.test(s)) {
    s = s.replace(re, newLine);
    fs.writeFileSync(file, s, 'utf8');
    console.log('Replaced via regex');
  } else {
    // fallback: replace the simpler variant where slashes aren't escaped
    const oldSimple = "const noProto = href.replace(/^https?:///, '');";
    if (s.indexOf(oldSimple) !== -1) {
      s = s.replace(oldSimple, newLine);
      fs.writeFileSync(file, s, 'utf8');
      console.log('Replaced oldSimple');
    } else {
      console.error('Could not find the target line to replace');
      process.exit(1);
    }
  }
} else {
  s = s.replace(oldLine, newLine);
  fs.writeFileSync(file, s, 'utf8');
  console.log('Replaced exact oldLine');
}

