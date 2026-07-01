const fs = require('fs');
const path = require('path');

function processDir(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'dist' && file !== 'build') {
        processDir(fullPath);
      }
    } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // We will match lines that contain ONLY a single line comment (ignoring leading whitespace)
      // and remove them. This includes the decorative dashed comments.
      const newContent = content.split('\n').filter(line => {
        // If the line is just a comment, filter it out
        if (line.trim().startsWith('//')) {
          return false;
        }
        return true;
      }).join('\n');
      
      if (content !== newContent) {
        fs.writeFileSync(fullPath, newContent, 'utf8');
        console.log(`Removed comments from ${fullPath}`);
      }
    }
  }
}

console.log('Starting comment removal...');
processDir(path.join(__dirname, 'client', 'src'));
processDir(path.join(__dirname, 'server'));
console.log('Done.');
