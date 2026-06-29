const fs = require('fs');
const path = require('path');

const dirsToScan = ['../client/src/pages', '../client/src/components'];

const replacements = [
  // Backgrounds
  { search: /background(?:Color)?:\s*['"](?:#ffffff|#fff|#f8fafc|#f1f5f9|#fafafa|#f3f4f6)['"]/gi, replace: "background: 'var(--bg-card)'" },
  { search: /background(?:Color)?:\s*`#ffffff`/gi, replace: "background: 'var(--bg-card)'" },
  { search: /background:\s*['"]#011C40['"]/gi, replace: "background: 'var(--sidebar-bg)'" },
  
  // Borders
  { search: /border:\s*['"]1px solid (?:#e2e8f0|#cbd5e1|#e5e7eb)['"]/gi, replace: "border: '1px solid var(--border-subtle)'" },
  { search: /borderBottom:\s*['"]1px solid (?:#e2e8f0|#cbd5e1|#e5e7eb)['"]/gi, replace: "borderBottom: '1px solid var(--border-subtle)'" },
  { search: /borderTop:\s*['"]1px solid (?:#e2e8f0|#cbd5e1|#e5e7eb)['"]/gi, replace: "borderTop: '1px solid var(--border-subtle)'" },
  { search: /borderColor:\s*['"](?:#e2e8f0|#cbd5e1|#e5e7eb)['"]/gi, replace: "borderColor: 'var(--border-subtle)'" },
  
  // Texts
  { search: /color:\s*['"](?:#1e293b|#334155|#111827|#0f172a|#111|#333|#1e1e1e|#000000|#000)['"]/gi, replace: "color: 'var(--text-main)'" },
  { search: /color:\s*['"](?:#64748b|#475569|#94a3b8|#6b7280|#444|#555|#666|#888)['"]/gi, replace: "color: 'var(--text-muted)'" },
  
  // Accents (optional, but good for consistency)
  { search: /['"]#7c3aed['"]/gi, replace: "'var(--accent-color)'" },
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
