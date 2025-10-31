const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'ArticlePage.js');
let s = fs.readFileSync(file, 'utf8');
// find last occurrence of the merge IIFE
const marker = '(function mergeSeparatedExtInner()';
let idx = s.lastIndexOf(marker);
if (idx === -1) { console.error('merge IIFE not found'); process.exit(1); }
// find the closing '})();' after idx
const closeIdx = s.indexOf('})();', idx);
if (closeIdx === -1) { console.error('closing of merge IIFE not found'); process.exit(1); }
const insertPos = closeIdx + '})();'.length;
const snippet = `\n\n    // --- 追加: テキストのみの a.external-link を非表示にする（URLだけのもの） ---\n    (function hideTextOnlyExternalAnchors(){\n      try {\n        const containerEl = articleContentRef?.current || document.body;\n        if (!containerEl) return;\n        const anchors = Array.from(containerEl.querySelectorAll('a.external-link'));
        anchors.forEach(a => {\n          try {\n            // 既にカード形式で内部要素がある場合は無視\n            if (a.querySelector('.ext-inner') || a.querySelector('.ext-arrow')) return;\n            // テキストノードのみかどうか判定（子要素が無い）\n            const hasElementChild = Array.from(a.childNodes).some(n => n.nodeType === 1);\n            if (hasElementChild) return;\n            const txt = (a.textContent || '').trim();\n            const href = (a.getAttribute('href') || '').trim();\n            if (!txt) { a.style.display = 'none'; return; }\n            const noProto = href.replace(/^https?:\/\//, '');\n            if (txt === href || txt === noProto) { a.style.display = 'none'; }\n          } catch (e) {}\n        });\n      } catch (e) {}\n    })();\n\n`;
const newS = s.slice(0, insertPos) + snippet + s.slice(insertPos);
fs.writeFileSync(file, newS, 'utf8');
console.log('Inserted hideTextOnlyExternalAnchors after last merge IIFE');

