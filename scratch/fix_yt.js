const fs = require('fs');
let content = fs.readFileSync('server/utils/youtubeApi.js', 'utf8');
content = content.replace(
  'body: thumbStream,',
  'mimeType: "application/octet-stream", body: thumbStream,'
);
content = content.replace(
  'console.warn(`s,? [YouTube API] Failed to set thumbnail:`, thumbErr.message);',
  'console.warn(`s,? [YouTube API] Failed to set thumbnail:`, thumbErr.response?.data?.error?.message || thumbErr.message);'
);
fs.writeFileSync('server/utils/youtubeApi.js', content);
console.log('Fixed youtubeApi.js');
