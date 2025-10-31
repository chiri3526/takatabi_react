const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'ArticlePage.js');
let s = fs.readFileSync(file, 'utf8');
const marker = 'processAnchors();';
const idx = s.indexOf(marker);
if (idx === -1) {
  console.error('processAnchors() not found');
  process.exit(1);
}
// find position after the marker's line end
const afterIdx = s.indexOf('\n', idx + marker.length);
if (afterIdx === -1) {
  console.error('line end not found'); process.exit(1);
}
const insert = `\n\n    // --- 追加: クライアント側で分離している .ext-inner と隣接する a.external-link を統合する ---\n    (function mergeSeparatedExtInner(){\n      try {\n        const containerEl = articleContentRef?.current || document.body;\n        if (!containerEl) return;\n        const inners = Array.from(containerEl.querySelectorAll('.ext-inner'));
        inners.forEach(inner => {\n          // skip if already inside an anchor
          if (inner.closest('a.external-link')) return;\n          // find nearest anchor siblings that share the same href
          const hrefCandidates = new Set();\n          const aSiblings = Array.from(containerEl.querySelectorAll('a.external-link'));
          // collect anchors that have same href and are adjacent to this inner
          let anchor = null;\n          // look back
          let prev = inner.previousElementSibling;\n          while(prev) { if (prev.tagName === 'A' && prev.classList.contains('external-link')) { anchor = prev; break; } prev = prev.previousElementSibling; }\n          // look forward if not found
          if (!anchor) { let next = inner.nextElementSibling; while(next) { if (next.tagName === 'A' && next.classList.contains('external-link')) { anchor = next; break; } next = next.nextElementSibling; } }\n          // if anchor still not found, try to find any anchor that has same href as inner's internal anchors
          if (!anchor) { const innerA = inner.querySelector('a.external-link'); const href = innerA ? innerA.getAttribute('href') : null; if (href) { anchor = Array.from(containerEl.querySelectorAll('a.external-link')).find(x=>x.getAttribute('href')===href); } }\n          // if still not found, create one and insert before inner
          if (!anchor) { anchor = document.createElement('a'); anchor.className = 'external-link'; const innerA = inner.querySelector('a.external-link'); if (innerA && innerA.getAttribute('href')) anchor.setAttribute('href', innerA.getAttribute('href')); anchor.setAttribute('target','_blank'); anchor.setAttribute('rel','noopener noreferrer'); anchor.dataset.previewApplied = '1'; inner.parentNode.insertBefore(anchor, inner); }
          // move arrow if exists in adjacent anchor
          const possibleArrowAnchor = inner.nextElementSibling && inner.nextElementSibling.tagName==='A' && inner.nextElementSibling.classList.contains('external-link') && inner.nextElementSibling.querySelector('.ext-arrow') ? inner.nextElementSibling : null;
          if (possibleArrowAnchor) {
            const arrow = possibleArrowAnchor.querySelector('.ext-arrow');
            if (arrow) anchor.appendChild(arrow);
            try { possibleArrowAnchor.parentNode.removeChild(possibleArrowAnchor); } catch (e) {}
          }
          // replace any anchors inside inner with spans to avoid nested anchors
          const innerAnchors = Array.from(inner.querySelectorAll('a.external-link'));
          innerAnchors.forEach(aEl => { try { const span = document.createElement('span'); span.className = 'ext-link-text'; span.textContent = aEl.textContent || aEl.getAttribute('href') || ''; aEl.parentNode.replaceChild(span, aEl); } catch(e){} });
          // finally append inner into anchor
          try { anchor.appendChild(inner); } catch(e){}
        });\n      } catch(e) {}\n    })();\n\n`;
const newS = s.slice(0, afterIdx+1) + insert + s.slice(afterIdx+1);
fs.writeFileSync(file, newS, 'utf8');
console.log('Injected mergeSeparatedExtInner after processAnchors()');

