const fs = require('fs');

let css = fs.readFileSync('../client/src/styles/AIStudio.css', 'utf-8');

const replacements = [
  { search: /background:\s*#f8fafc;/gi, replace: 'background: var(--bg-dark);' },
  { search: /background:\s*#ffffff;/gi, replace: 'background: var(--bg-card);' },
  { search: /background:\s*#f1f5f9;/gi, replace: 'background: var(--sidebar-bg);' },
  { search: /background:\s*#f5f3ff;/gi, replace: 'background: var(--bg-gradient-2);' },
  { search: /color:\s*#1e293b;/gi, replace: 'color: var(--text-main);' },
  { search: /color:\s*#64748b;/gi, replace: 'color: var(--text-muted);' },
  { search: /color:\s*#0f172a;/gi, replace: 'color: var(--text-main);' },
  { search: /border:\s*1px\s*solid\s*#e2e8f0;/gi, replace: 'border: 1px solid var(--border-subtle);' },
  { search: /border:\s*8px\s*solid\s*#f1f5f9;/gi, replace: 'border: 8px solid var(--sidebar-bg);' },
  { search: /border-bottom:\s*1px\s*solid\s*#e2e8f0;/gi, replace: 'border-bottom: 1px solid var(--border-subtle);' },
  { search: /border:\s*1px\s*solid\s*#cbd5e1;/gi, replace: 'border: 1px solid var(--border-subtle);' }
];

replacements.forEach(r => {
  css = css.replace(r.search, r.replace);
});

fs.writeFileSync('../client/src/styles/AIStudio.css', css);
console.log('Fixed AIStudio.css');
