const fs = require('fs');
let file = fs.readFileSync('client/src/pages/Connections.jsx', 'utf8');

// 1. Change New Connection button from orange to brand purple
file = file.replace(
  /background: '#ea580c'/g,
  "background: '#7c3aed'"
);
file = file.replace(
  /e\.currentTarget\.style\.background = '#c2410c'/g,
  "e.currentTarget.style.background = '#6d28d9'"
);
file = file.replace(
  /e\.currentTarget\.style\.background = '#ea580c'/g,
  "e.currentTarget.style.background = '#7c3aed'"
);
file = file.replace(
  /boxShadow: '0 4px 12px rgba\(234, 88, 12, 0\.25\)'/g,
  "boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'"
);

// 2. Update Profile buttons to open respective social media profiles
// Instagram Profile
file = file.replace(
  /(<!-- *)?(\{settings\.isAccountConnected[\s\S]*?<div style=\{\{ display: 'flex', gap: '8px', marginTop: 'auto', width: '100%' \}\}>\s*<button\s*\n\s*onClick=\{)\(e\) => \{ e\.stopPropagation\(\); navigate\('\/profile'\); \}\}/,
  "$2(e) => { e.stopPropagation(); window.open(`https://instagram.com/${settings.connectedInstagramName || ''}`, '_blank'); }}"
);

fs.writeFileSync('client/src/pages/Connections.jsx', file);
console.log('Step 1 done - colors updated');

// Now do targeted Profile button updates per platform
file = fs.readFileSync('client/src/pages/Connections.jsx', 'utf8');

// Find each card section and replace the navigate('/profile') with proper URLs
const lines = file.split('\n');
let currentPlatform = null;

for (let i = 0; i < lines.length; i++) {
  // Detect which card we are in
  if (lines[i].includes('INSTAGRAM CARD')) currentPlatform = 'instagram';
  else if (lines[i].includes('FACEBOOK CARD')) currentPlatform = 'facebook';
  else if (lines[i].includes('YOUTUBE CARD')) currentPlatform = 'youtube';
  else if (lines[i].includes('LINKEDIN CARD')) currentPlatform = 'linkedin';
  else if (lines[i].includes('TWITTER/X CARD')) currentPlatform = 'twitter';
  else if (lines[i].includes('GOOGLE BUSINESS CARD')) currentPlatform = 'google';
  else if (lines[i].includes('THREADS CARD')) currentPlatform = 'threads';
  else if (lines[i].includes('WHATSAPP CARD') || lines[i].includes('WHATSAPP BUSINESS CARD')) currentPlatform = 'whatsapp';
  
  // Replace navigate('/profile') with proper URL
  if (lines[i].includes("navigate('/profile')") || lines[i].includes("navigate(\"/profile\")")) {
    switch(currentPlatform) {
      case 'instagram':
        lines[i] = lines[i].replace(
          /navigate\(['"]\/profile['"]\)/,
          "window.open(`https://instagram.com/${settings.connectedInstagramName || ''}`, '_blank')"
        );
        break;
      case 'facebook':
        lines[i] = lines[i].replace(
          /navigate\(['"]\/profile['"]\)/,
          "window.open(`https://facebook.com/${settings.connectedFacebookName || settings.facebookPageId || ''}`, '_blank')"
        );
        break;
      case 'youtube':
        lines[i] = lines[i].replace(
          /navigate\(['"]\/profile['"]\)/,
          "window.open(`https://youtube.com/@${settings.connectedYouTubeName || settings.youtubeChannelName || ''}`, '_blank')"
        );
        break;
      case 'linkedin':
        lines[i] = lines[i].replace(
          /navigate\(['"]\/profile['"]\)/,
          "window.open(`https://linkedin.com/in/${settings.connectedLinkedInName || ''}`, '_blank')"
        );
        break;
      case 'twitter':
        lines[i] = lines[i].replace(
          /navigate\(['"]\/profile['"]\)/,
          "window.open(`https://x.com/${settings.connectedTwitterName || ''}`, '_blank')"
        );
        break;
      case 'google':
        lines[i] = lines[i].replace(
          /navigate\(['"]\/profile['"]\)/,
          "window.open('https://business.google.com', '_blank')"
        );
        break;
      case 'threads':
        lines[i] = lines[i].replace(
          /navigate\(['"]\/profile['"]\)/,
          "window.open(`https://threads.net/@${settings.connectedThreadsName || settings.connectedInstagramName || ''}`, '_blank')"
        );
        break;
      case 'whatsapp':
        lines[i] = lines[i].replace(
          /navigate\(['"]\/profile['"]\)/,
          "window.open(`https://wa.me/${settings.whatsappPhoneNumberId || ''}`, '_blank')"
        );
        break;
    }
  }
}

file = lines.join('\n');
fs.writeFileSync('client/src/pages/Connections.jsx', file);
console.log('Step 2 done - Profile buttons updated to open social media profiles');
