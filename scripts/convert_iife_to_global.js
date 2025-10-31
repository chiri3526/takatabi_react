const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'ArticlePage.js');
let s = fs.readFileSync(file, 'utf8');
function extractAndRemove(marker) {
  const res = [];
  let idx = s.indexOf(marker);
  while (idx !== -1) {
    const start = idx;
    const bodyStart = s.indexOf('{', start);
    if (bodyStart === -1) break;
    // find the matching closing '})();' -- search for '})();' after start
    const endMarker = '})();';
    const end = s.indexOf(endMarker, bodyStart);
    if (end === -1) break;
    const body = s.substring(bodyStart + 1, end); // inside braces
    res.push(body);
    // remove this whole IIFE
    s = s.slice(0, start) + s.slice(end + endMarker.length);
    idx = s.indexOf(marker, start);
  }
  return res;
}
const mergeMarker = '(function mergeSeparatedExtInner()';
const hideMarker = '(function hideTextOnlyExternalAnchors()';
const mergeBodies = extractAndRemove(mergeMarker);
const hideBodies = extractAndRemove(hideMarker);
// choose first body if exists
const mergeBody = mergeBodies.length ? mergeBodies[0] : null;
const hideBody = hideBodies.length ? hideBodies[0] : null;
// prepare global function strings
let insertFuncs = '\n    // --- converted: global utility functions for merging/hiding external links ---\n';
if (mergeBody) {
  insertFuncs += '    window.mergeSeparatedExtInner = function() {' + mergeBody + '    };\n    ';
}
if (hideBody) {
  insertFuncs += '    window.hideTextOnlyExternalAnchors = function() {' + hideBody + '    };\n    ';
}
// Insert after the first occurrence of 'processAnchors();' (the initial call)
const procIdx = s.indexOf('processAnchors();');
if (procIdx === -1) {
  console.error('processAnchors(); not found after cleanup');
  fs.writeFileSync(file, s, 'utf8');
  process.exit(1);
}
// position after the line
const afterLine = s.indexOf('\n', procIdx + 'processAnchors();'.length);
const before = s.slice(0, afterLine + 1);
const after = s.slice(afterLine + 1);
let newS = before + '\n' + insertFuncs + '\n' + after;
// ensure initial calls: add calls right after processAnchors(); if not present
if (!/mergeSeparatedExtInner\(\)/.test(newS.slice(afterLine, afterLine + 200))) {
  newS = newS.replace('processAnchors();', 'processAnchors();\n    window.mergeSeparatedExtInner && window.mergeSeparatedExtInner();\n    window.hideTextOnlyExternalAnchors && window.hideTextOnlyExternalAnchors();');
}
// modify observer setTimeout to also call the functions
newS = newS.replace(/setTimeout\(processAnchors,\s*50\);/g, `setTimeout(()=>{ processAnchors(); window.mergeSeparatedExtInner && window.mergeSeparatedExtInner(); window.hideTextOnlyExternalAnchors && window.hideTextOnlyExternalAnchors(); }, 50);`);
fs.writeFileSync(file, newS, 'utf8');
console.log('Converted IIFEs to global functions and wired calls.');

