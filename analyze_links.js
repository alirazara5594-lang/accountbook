const fs = require('fs');
const path = require('path');

function walk(dir, files=[]) {
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (f === 'node_modules' || f === 'dist') continue;
      walk(full, files);
    } else if (f.endsWith('.tsx') || f.endsWith('.ts')) {
      files.push(full);
    }
  }
  return files;
}

const files = walk('fronted/src');
const appContent = fs.readFileSync('fronted/src/App.tsx', 'utf8');
const mapMatch = appContent.match(/const activeViewMap: Record<string, string> = \{([\s\S]*?)\n  \}/);
const mapKeys = new Set([...mapMatch[1].matchAll(/'([^']+)':\s*'[^']+'/g)].map(m => m[1]));

const allCalls = [];
for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const regex = /(?:setPage|onNavigate)\(\s*[`']([^`']+)[`']/g;
  let m;
  while ((m = regex.exec(content)) !== null) {
    allCalls.push({file: path.relative('.', file), target: m[1]});
  }
}

console.log('=== setPage/onNavigate calls pointing to targets NOT in activeViewMap (BROKEN LINKS) ===');
const reported = new Set();
allCalls.forEach(c => {
  if (c.target.includes('${')) return;
  if (!mapKeys.has(c.target)) {
    const key = c.file + '::' + c.target;
    if (!reported.has(key)) { reported.add(key); console.log(c.file, '->', c.target); }
  }
});
