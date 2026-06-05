const fs = require('fs');
let code = fs.readFileSync('src/pages/Settings.jsx', 'utf8');

// Replace activeTab default state
code = code.replace(/const \[activeTab, setActiveTab\] = useState\('connections'\);/, "const [activeTab, setActiveTab] = useState('billing');");

// Remove 'connections' tab from the UI tab list
code = code.replace(/\{\s*id:\s*'connections',\s*label:\s*'Connections'\s*\},?\s*/g, '');

const lines = code.split('\n');
const newLines = [];
let inConn = false;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("activeTab === 'connections'")) {
    inConn = true;
    continue;
  }
  if (inConn && lines[i].includes("{activeTab === 'billing'")) {
    inConn = false;
    newLines.push(lines[i]);
    continue;
  }
  if (!inConn) {
    newLines.push(lines[i]);
  }
}

fs.writeFileSync('src/pages/Settings.jsx', newLines.join('\n'));
