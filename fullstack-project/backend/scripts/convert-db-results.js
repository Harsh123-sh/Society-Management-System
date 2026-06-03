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
files.forEach(file => {
  let text = fs.readFileSync(file, 'utf8');
  const newText = text.replace(/const \[rows\] = await db\.query\(/g, 'const { rows } = await db.query(');
  if (newText !== text) {
    fs.writeFileSync(file, newText, 'utf8');
    console.log('Updated:', file);
    updated++;
  }
});
console.log('Total files updated:', updated);
