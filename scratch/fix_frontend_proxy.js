const fs = require('fs');
const filePath = 'client/src/pages/Scheduling.jsx';
let code = fs.readFileSync(filePath, 'utf8');

const targetSnippet = "if (match) return `${API_BASE_URL}/api/storage/view?path=media/${match[1]}`;";
const replacementSnippet = "if (match) return `${API_BASE_URL}/api/storage/view?path=${match[1]}`;";

if (code.includes(targetSnippet)) {
  code = code.replace(targetSnippet, replacementSnippet);
  fs.writeFileSync(filePath, code);
  console.log('✅ Fixed frontend proxy URL.');
} else {
  console.log('❌ Could not find the target string in Scheduling.jsx');
}
