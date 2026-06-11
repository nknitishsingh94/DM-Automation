const fs = require('fs');
const content = fs.readFileSync('client/src/pages/FlowBuilder.jsx', 'utf8');
let open = 0;
let lines = content.split('\n');
lines.forEach((l, i) => {
  // Simple regex to match <div...> and </div> (ignores cases where div is in comments or strings, which should be fine for JSX without multi-line strings with HTML)
  const openCount = (l.match(/<div[^>]*>/g) || []).length;
  const closeCount = (l.match(/<\/div>/g) || []).length;
  open += openCount - closeCount;
  if (openCount > 0 || closeCount > 0) {
    console.log(`Line ${i+1}: open=${open} (added ${openCount}, removed ${closeCount})`);
  }
});
console.log('Total unclosed divs:', open);
