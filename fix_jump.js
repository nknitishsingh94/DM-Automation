const fs = require('fs');
const path = require('path');
const dir = 'client/src/pages/SuperAdmin';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
let updatedCount = 0;

files.forEach(f => {
  const filepath = path.join(dir, f);
  let content = fs.readFileSync(filepath, 'utf8');
  let changed = false;

  const regex = /(position:\s*'sticky',\s*top:\s*)'-24px'/g;
  if (regex.test(content)) {
    content = content.replace(regex, `$1 0`);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filepath, content);
    console.log('Updated ' + f);
    updatedCount++;
  }
});
console.log('Total updated: ' + updatedCount);
