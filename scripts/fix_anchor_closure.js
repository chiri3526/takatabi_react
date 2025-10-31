const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'src', 'pages', 'ArticlePage.js');
let s = fs.readFileSync(file, 'utf8');
const before = "        } catch (e) {\n          // eslint-disable-next-line no-console\n          console.warn('[ArticlePage] anchor processing failed for', a, e);\n        }\n      };\n    };";
const after =  "        } catch (e) {\n          // eslint-disable-next-line no-console\n          console.warn('[ArticlePage] anchor processing failed for', a, e);\n        }\n      });\n    };";
let replaced = false;
if (s.indexOf(before) !== -1) {
  s = s.replace(before, after);
  replaced = true;
} else {
  // Try relaxed pattern
  const relaxed = /(\n\s*)\} catch \(e\) \{[\s\S]*?console\.warn\([\s\S]*?\);\s*\n\s*\}\s*\n\s*\};\s*\n\s*\};/m;
  if (relaxed.test(s)) {
    s = s.replace(relaxed, (m) => m.replace(/}\s*\n\s*};\s*\n\s*};/, "}\n      });\n    };"));
    replaced = true;
  }
}
if (replaced) {
  fs.writeFileSync(file, s, 'utf8');
  const idx = s.indexOf('console.warn');
  console.log('Replacement applied. Snippet around replacement:');
  console.log(s.substring(idx - 120, idx + 120));
} else {
  console.log('No replacement made.');
}

