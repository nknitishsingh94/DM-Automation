const fs = require('fs');
const path = require('path');

const dirsToScan = ['../client/src/pages', '../client/src/components'];

const colorRegex = /#(?:[0-9a-fA-F]{3,4}){1,2}(?![0-9a-fA-F])/g;
// ignore #fff, #000, which might be okay or already handled, but let's see everything first.

dirsToScan.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(file => {
    if (file.endsWith('.jsx')) {
      const p = path.join(dir, file);
      const content = fs.readFileSync(p, 'utf-8');
      const matches = content.match(colorRegex);
      if (matches) {
        // filter out matches inside comments? For now just print.
        console.log(`File: ${p} has ${matches.length} hex colors: ${[...new Set(matches)].join(', ')}`);
      }
    }
  });
});
