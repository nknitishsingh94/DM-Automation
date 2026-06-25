const fs = require('fs');
const filePath = 'server/index.js';
let code = fs.readFileSync(filePath, 'utf8');

const OLD = `          updatedMetaObj.retryCount = currentRetryCount;\r\n          const nextRunTime = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();\r\n          console.log(\`⚠️ Post \${postId} failed. Rescheduling for retry in \${delayMinutes} mins at \${nextRunTime}.\`);\r\n          await safeUpdate(postId, { status: 'Scheduled', scheduledFor: nextRunTime, lastError: errorMsg, mediaUrl: JSON.stringify(updatedMetaObj) });`;

const NEW = `          // Store retry time in metadata — DO NOT overwrite scheduledFor so user's original time is preserved
          updatedMetaObj.retryCount = currentRetryCount;
          updatedMetaObj.nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
          console.log(\`⚠️ Post \${postId} failed. Next retry in \${delayMinutes} mins at \${updatedMetaObj.nextRetryAt}. scheduledFor unchanged.\`);
          await safeUpdate(postId, { status: 'Retrying', lastError: errorMsg, mediaUrl: JSON.stringify(updatedMetaObj) });`;

if (!code.includes(OLD.replace(/\r\n/g, '\n'))) {
  // Try LF only
  const OLD_LF = OLD.replace(/\r\n/g, '\n');
  if (code.includes(OLD_LF)) {
    code = code.replace(OLD_LF, NEW);
    fs.writeFileSync(filePath, code);
    console.log('✅ Fixed (LF)');
  } else {
    // Try CRLF
    const OLD_CRLF = OLD;
    if (code.includes(OLD_CRLF)) {
      code = code.replace(OLD_CRLF, NEW);
      fs.writeFileSync(filePath, code);
      console.log('✅ Fixed (CRLF)');
    } else {
      console.error('❌ Could not find target text!');
      // Show surrounding context
      const idx = code.indexOf('updatedMetaObj.retryCount = currentRetryCount');
      console.log('Context around retryCount:', JSON.stringify(code.substring(idx, idx+300)));
    }
  }
} else {
  code = code.replace(OLD, NEW);
  fs.writeFileSync(filePath, code);
  console.log('✅ Fixed');
}
