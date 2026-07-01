const fs = require('fs');
let content = fs.readFileSync('client/src/pages/Scheduling.jsx', 'utf8');
content = content.replace(
  'const rawMediaSource = mediaData.localMediaUrl || (mediaData.carouselItems && mediaData.carouselItems.length > 0 ? mediaData.carouselItems[0] : null) || mediaData.mediaUrl;',
  'const rawMediaSource = mediaData.thumbnail || mediaData.localMediaUrl || (mediaData.carouselItems && mediaData.carouselItems.length > 0 ? mediaData.carouselItems[0] : null) || mediaData.mediaUrl;'
);
content = content.replace(
  'mediaData.type === \'reel\' || (finalMediaUrl && finalMediaUrl.match(/\\.(mp4|mov|webm)$/i)) ? (',
  'mediaData.type === \'reel\' || (finalMediaUrl && finalMediaUrl.match(/\\.(mp4|mov|webm)$/i) && !mediaData.thumbnail) ? ('
);
fs.writeFileSync('client/src/pages/Scheduling.jsx', content);
console.log('Fixed Scheduling.jsx');
