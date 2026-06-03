const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) results = results.concat(walk(file));
    else results.push(file);
  });
  return results;
}

const base = path.join(__dirname, '..');
const files = walk(base).filter(f => f.endsWith('.js'));
let updated = 0;
const regex = /const \[([^\]]+)\] = await db\.query\(/g;
files.forEach(file => {
  let text = fs.readFileSync(file, 'utf8');
  const newText = text.replace(regex, (m, p1) => `const { rows: ${p1.trim()} } = await db.query(`);
  if (newText !== text) {
    fs.writeFileSync(file, newText, 'utf8');
    console.log('Updated:', file);
    updated++;
  }
});
console.log('Total files updated:', updated);
