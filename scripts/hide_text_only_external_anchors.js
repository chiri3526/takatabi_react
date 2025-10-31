const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'ArticlePage.js');
let s = fs.readFileSync(file, 'utf8');
const startMarker = '(function mergeSeparatedExtInner(){';
const startIdx = s.indexOf(startMarker);
if (startIdx === -1) {
  console.error('merge IIFE not found'); process.exit(1);
}
// find end of that IIFE '})();' after startIdx
const endIdx = s.indexOf('})();', startIdx);
if (endIdx === -1) { console.error('end of merge IIFE not found'); process.exit(1); }
const insertPos = endIdx + '})();'.length;
const snippet = `\n\n    // --- 追加: テキストだけの a.external-link（URLそのものを表示しているもの）を非表示にする ---\n    (function hideTextOnlyExternalAnchors(){\n      try {\n        const containerEl = articleContentRef?.current || document.body;\n        if (!containerEl) return;\n        const anchors = Array.from(containerEl.querySelectorAll('a.external-link'));
        anchors.forEach(a => {\n          try {\n            // skip anchors that have structured content or arrow inside
            if (a.querySelector('.ext-inner') || a.querySelector('.ext-arrow')) return;\n            const href = (a.getAttribute('href') || '').trim();\n            const txt = (a.textContent || '').trim();\n            if (!href) return;\n            if (!txt) { a.style.display = 'none'; return; }\n            // if text exactly equals href (or equals href without protocol), hide it
            const noProto = href.replace(/^https?:\/\//, '');\n            if (txt === href || txt === noProto) {\n              a.style.display = 'none';\n            }\n          } catch (e) {}\n        });\n      } catch (e) {}\n    })();\n\n`;
const newS = s.slice(0, insertPos) + snippet + s.slice(insertPos);
fs.writeFileSync(file, newS, 'utf8');
console.log('Inserted hideTextOnlyExternalAnchors snippet');

