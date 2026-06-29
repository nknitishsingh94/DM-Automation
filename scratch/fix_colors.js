const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../client/src');

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let originalContent = content;
      
      // Fix color: 'var(--bg-card)' back to color: 'white'
      content = content.replace(/color:\s*['"]var\(--bg-card\)['"]/g, "color: 'white'");
      content = content.replace(/color:\s*['"]var\(--bg-base\)['"]/g, "color: 'white'");

      // Also fix fill: 'var(--bg-card)' if any SVG used it
      content = content.replace(/fill:\s*['"]var\(--bg-card\)['"]/g, "fill: 'white'");
      content = content.replace(/fill:\s*['"]var\(--bg-base\)['"]/g, "fill: 'white'");

      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Fixed text color in ${filePath}`);
      }
    }
  }
}

processDirectory(srcDir);
