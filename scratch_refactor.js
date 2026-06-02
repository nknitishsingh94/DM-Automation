const fs = require('fs');
const lines = fs.readFileSync('server/index.js', 'utf8').split('\n');

let paStart = 331; let paEnd = -1; let brackets = 0; let inFunc = false;
for(let i=paStart; i<lines.length; i++){
  for(let char of lines[i]) {
    if(char === '{') { brackets++; inFunc = true; }
    if(char === '}') { brackets--; if(inFunc && brackets===0) { paEnd = i; break; } }
  }
  if(paEnd !== -1) break;
}

let dupStart = 919; let dupEnd = -1; brackets = 0; inFunc = false;
for(let i=921; i<lines.length; i++){
  for(let char of lines[i]) {
    if(char === '{') { brackets++; inFunc = true; }
    if(char === '}') { brackets--; if(inFunc && brackets===0) { dupEnd = i; break; } }
  }
  if(dupEnd !== -1) break;
}

let whStart = 942; let whEnd = -1; brackets = 0; inFunc = false;
for(let i=whStart; i<lines.length; i++){
  for(let char of lines[i]) {
    if(char === '{') { brackets++; inFunc = true; }
    if(char === '}') { brackets--; if(inFunc && brackets===0) { whEnd = i; break; } }
  }
  if(whEnd !== -1) break;
}

let swStart = 3089; let swEnd = -1; brackets = 0; inFunc = false;
for(let i=swStart; i<lines.length; i++){
  for(let char of lines[i]) {
    if(char === '{') { brackets++; inFunc = true; }
    if(char === '}') { brackets--; if(inFunc && brackets===0) { swEnd = i; break; } }
  }
  if(swEnd !== -1) break;
}

console.log('PA: ' + paStart + '-' + paEnd + ', DUP: ' + dupStart + '-' + dupEnd + ', WH: ' + whStart + '-' + whEnd + ', SW: ' + swStart + '-' + swEnd);

const toDelete = new Set();
for(let i=paStart; i<=paEnd; i++) toDelete.add(i);
for(let i=dupStart; i<=dupEnd; i++) toDelete.add(i);
for(let i=whStart; i<=whEnd; i++) toDelete.add(i);
for(let i=swStart; i<=swEnd; i++) toDelete.add(i);

let newLines = [];
newLines.push("import webhookRoutes from './routes/webhooks.js';");
newLines.push("import { runSchedulingWorker } from './services/scheduler.js';");
newLines.push("import { processAutoReply } from './services/core/automationCore.js';");

for(let i=0; i<lines.length; i++) {
  if (i === whStart) {
    newLines.push("app.use('/', webhookRoutes);");
  }
  if (!toDelete.has(i)) {
    newLines.push(lines[i]);
  }
}

newLines.push("");
newLines.push("export { settingsCache, campaignsCache, getSharedUserIdsSync, io, runFlow };");

fs.writeFileSync('server/index.js', newLines.join('\n'));
