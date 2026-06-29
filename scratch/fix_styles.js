const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../client/src');

// Map of hex colors to CSS variables
const colorMap = {
  "'#ffffff'": "'var(--bg-card)'",
  "'white'": "'var(--bg-card)'",
  "'#f8fafc'": "'var(--sidebar-bg)'",
  "'#f1f5f9'": "'var(--bg-dark)'",
  "'#f0f2f5'": "'var(--bg-dark)'",
  "'#1e293b'": "'var(--text-main)'",
  "'#0f172a'": "'var(--text-main)'",
  "'#64748b'": "'var(--text-muted)'",
  "'#475569'": "'var(--text-muted)'",
  "'#94a3b8'": "'var(--text-muted)'",
  "'#e2e8f0'": "'var(--border-subtle)'",
  "'#cbd5e1'": "'var(--border-subtle)'",
};

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
      
      for (const [hex, variable] of Object.entries(colorMap)) {
        // e.g. background: '#ffffff' -> background: 'var(--bg-card)'
        const regex = new RegExp(hex.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        content = content.replace(regex, variable);
      }
      
      if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
      }
    }
  }
}

processDirectory(srcDir);
console.log("Done refactoring styles!");
