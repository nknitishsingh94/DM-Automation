const fs = require('fs');
const path = require('path');

const dirsToScan = ['../client/src/pages', '../client/src/components', '../client/src'];

const replacements = [
  // More Backgrounds
  { search: /background(?:Color)?:\s*['"](?:#f9fafb|#f4f4f5|#f5f5f5|#f8f9fa|#e2e8f0|#f3f4f6|#f0f2f5|#faf5ff)['"]/gi, replace: "background: 'var(--bg-dark)'" },
  { search: /background(?:Color)?:\s*['"](?:#0f172a|#1e293b|#111827|#1f2937)['"]/gi, replace: "background: 'var(--bg-card)'" }, // some dark backgrounds that should adapt
  
  // More Borders
  { search: /border:\s*['"](?:1px|2px) solid (?:#d1d5db|#e2e8f0|#cbd5e1|#e5e7eb|#f1f5f9|#f8fafc)['"]/gi, replace: "border: '1px solid var(--border-subtle)'" },
  { search: /borderBottom:\s*['"](?:1px|2px) solid (?:#d1d5db|#e2e8f0|#cbd5e1|#e5e7eb|#f1f5f9|#f8fafc)['"]/gi, replace: "borderBottom: '1px solid var(--border-subtle)'" },
  { search: /borderTop:\s*['"](?:1px|2px) solid (?:#d1d5db|#e2e8f0|#cbd5e1|#e5e7eb|#f1f5f9|#f8fafc)['"]/gi, replace: "borderTop: '1px solid var(--border-subtle)'" },
  { search: /borderLeft:\s*['"](?:1px|2px) solid (?:#d1d5db|#e2e8f0|#cbd5e1|#e5e7eb|#f1f5f9|#f8fafc)['"]/gi, replace: "borderLeft: '1px solid var(--border-subtle)'" },
  { search: /borderRight:\s*['"](?:1px|2px) solid (?:#d1d5db|#e2e8f0|#cbd5e1|#e5e7eb|#f1f5f9|#f8fafc)['"]/gi, replace: "borderRight: '1px solid var(--border-subtle)'" },
  { search: /borderColor:\s*['"](?:#d1d5db|#e2e8f0|#cbd5e1|#e5e7eb|#f1f5f9|#f8fafc)['"]/gi, replace: "borderColor: 'var(--border-subtle)'" },
  
  // More Texts
  { search: /color:\s*['"](?:#374151|#4b5563|#1f2937|#111827|#0f172a|#1e293b|#334155|#000|#111|#222|#333|#262626|#1a1a1a)['"]/gi, replace: "color: 'var(--text-main)'" },
  { search: /color:\s*['"](?:#6b7280|#9ca3af|#d1d5db|#94a3b8|#64748b|#475569|#555|#666|#777|#888|#999)['"]/gi, replace: "color: 'var(--text-muted)'" },
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
