const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const clientDir = path.join(rootDir, 'client');
const clientDistDir = path.join(clientDir, 'dist');
const rootDistDir = path.join(rootDir, 'dist');

console.log('==> Starting Vercel Production Build for Insta AI Agent...');

// 1. Install client dependencies including devDependencies (such as vite)
console.log('==> [1/3] Ensuring client dependencies are installed...');
execSync('npm install --include=dev', {
  cwd: clientDir,
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' }
});

// 2. Build the client using Vite
console.log('==> [2/3] Building client application via Vite...');
execSync('npm run build', {
  cwd: clientDir,
  stdio: 'inherit'
});

// 3. Sync client/dist to root/dist
console.log('==> [3/3] Copying build artifacts to root dist folder...');
if (fs.existsSync(rootDistDir)) {
  fs.rmSync(rootDistDir, { recursive: true, force: true });
}

fs.cpSync(clientDistDir, rootDistDir, { recursive: true });

if (fs.existsSync(path.join(rootDistDir, 'index.html'))) {
  console.log('==> Build completed successfully! root/dist/index.html is ready.');
} else {
  console.error('==> Error: root/dist/index.html was not found after build!');
  process.exit(1);
}
