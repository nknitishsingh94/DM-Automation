const fs = require('fs');
let code = fs.readFileSync('client/src/pages/Scheduling.jsx', 'utf8');

// Replace the finalMediaUrl line only, adding CDN detection above it
const OLD = `            const finalMediaUrl = rawMediaSource && rawMediaSource.startsWith('http')
              ? rawMediaSource
              : (rawMediaSource ? \`\${API_BASE_URL}\${rawMediaSource}\` : '/placeholder-ig.png');`;

const NEW = `            // Instagram/Facebook CDN URLs expire - avoid 403 by not loading them
            const isInstagramCdn = !!(rawMediaSource && (
              rawMediaSource.includes('cdninstagram.com') ||
              rawMediaSource.includes('scontent-') ||
              rawMediaSource.includes('fbcdn.net')
            ));
            const finalMediaUrl = isInstagramCdn
              ? null
              : (rawMediaSource && rawMediaSource.startsWith('http')
                  ? rawMediaSource
                  : (rawMediaSource ? \`\${API_BASE_URL}\${rawMediaSource}\` : null));`;

if (!code.includes(OLD)) {
  console.error('Could not find target text!');
  process.exit(1);
}

code = code.replace(OLD, NEW);

// Now replace the media render block to handle null finalMediaUrl
const OLD_RENDER = `                  {mediaData.type === 'reel' || (finalMediaUrl && finalMediaUrl.match(/\\.(mp4|mov|webm)$/i)) ? (`;
const NEW_RENDER = `                  {!finalMediaUrl ? (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', color: '#94a3b8', gap: '6px' }}>
                      <span style={{ fontSize: '2.5rem' }}>🖼️</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>No preview available</span>
                    </div>
                  ) : mediaData.type === 'reel' || (finalMediaUrl && finalMediaUrl.match(/\\.(mp4|mov|webm)$/i)) ? (`;

if (!code.includes(OLD_RENDER)) {
  console.error('Could not find render target!');
  process.exit(1);
}

code = code.replace(OLD_RENDER, NEW_RENDER);

fs.writeFileSync('client/src/pages/Scheduling.jsx', code);
console.log('Done - CDN URL fix applied cleanly');
