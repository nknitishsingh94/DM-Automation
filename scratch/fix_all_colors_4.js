const fs = require('fs');
const path = require('path');

const dirsToScan = ['../client/src/pages', '../client/src/components', '../client/src'];

const replacements = [
  // White and Black Backgrounds
  { search: /background(?:Color)?:\s*['"](?:white|black)['"]/gi, replace: "background: 'var(--bg-card)'" },
];

let changedFiles = 0;

dirsToScan.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.jsx')) {
      const p = path.join(dir, file);
      let content = fs.readFileSync(p, 'utf-8');
      let original = content;
      
      replacements.forEach(r => {
        // Only replace if it's not a color on a colored button. Wait, if it's background, it's fine.
        content = content.replace(r.search, r.replace);
      });
      
      if (content !== original) {
        fs.writeFileSync(p, content);
        changedFiles++;
        console.log(`Updated ${file}`);
      }
    }
  });
});

console.log(`Total files updated: ${changedFiles}`);
