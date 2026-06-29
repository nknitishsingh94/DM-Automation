const fs = require('fs');
const path = require('path');

const dirsToScan = ['../client/src/pages', '../client/src/components', '../client/src'];

const replacements = [
  // More Backgrounds
  { search: /background(?:Color)?:\s*['"](?:#f9fafb|#f4f4f5|#f5f5f5|#f8f9fa|#e2e8f0|#f3f4f6|#f0f2f5|#faf5ff)['"]/gi, replace: "background: 'var(--bg-dark)'" },
  
  // More Borders
  { search: /border:\s*['"]1px solid (?:#d1d5db|#e2e8f0|#cbd5e1|#e5e7eb|#f1f5f9|#f8fafc)['"]/gi, replace: "border: '1px solid var(--border-subtle)'" },
  { search: /border(?:Bottom|Top|Left|Right):\s*['"]1px solid (?:#d1d5db|#e2e8f0|#cbd5e1|#e5e7eb|#f1f5f9|#f8fafc)['"]/gi, replace: "borderBottom: '1px solid var(--border-subtle)'" }, // simplify
  { search: /borderColor:\s*['"](?:#d1d5db|#e2e8f0|#cbd5e1|#e5e7eb|#f1f5f9|#f8fafc)['"]/gi, replace: "borderColor: 'var(--border-subtle)'" },
  
  // More Texts
  { search: /color:\s*['"](?:#374151|#4b5563|#1f2937|#111827|#0f172a|#1e293b|#334155)['"]/gi, replace: "color: 'var(--text-main)'" },
  { search: /color:\s*['"](?:#6b7280|#9ca3af|#d1d5db|#94a3b8|#64748b|#475569)['"]/gi, replace: "color: 'var(--text-muted)'" },
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
      
      // Fix the simplify replace side-effect for borderTop/borderLeft/borderRight
      // Actually my regex `(?:Bottom|Top|Left|Right)` was replaced by `borderBottom: ...` unconditionally!
      // Wait, let's not use regex for that to be safe.
      
      if (content !== original) {
        // We only write if changed. Wait, I should fix the regex above before doing it to avoid breaking borders.
      }
    }
  });
});
