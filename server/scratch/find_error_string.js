import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverDir = path.join(__dirname, '..');

function searchDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      if (file !== 'node_modules' && file !== '.git') {
        searchDir(fullPath);
      }
    } else {
      if (file.endsWith('.js') || file.endsWith('.json')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.toLowerCase().includes('unexpected error') || content.toLowerCase().includes('unexpected_error')) {
          console.log(`Found in: ${fullPath}`);
          // Print matching line
          const lines = content.split('\n');
          lines.forEach((line, index) => {
            if (line.toLowerCase().includes('unexpected error') || line.toLowerCase().includes('unexpected_error')) {
              console.log(`  Line ${index + 1}: ${line.trim()}`);
            }
          });
        }
      }
    }
  }
}

searchDir(serverDir);
