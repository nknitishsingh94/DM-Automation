const fs = require('fs');
const path = require('path');

// 1. Inject proxy endpoint in server/index.js
const serverFile = path.join(__dirname, '../server/index.js');
let serverCode = fs.readFileSync(serverFile, 'utf8');

const injectionTarget = `app.post('/api/scheduling', verifyToken, (req, res, next) => {`;
const proxyCode = `app.get('/api/storage/proxy-external', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: 'url is required' });

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      console.log('⚠️ Proxy external image failed: ' + response.status + ' ' + targetUrl);
      return res.redirect(302, 'https://placehold.co/400x400/f1f5f9/94a3b8.png?text=Expired');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(buffer);
  } catch (err) {
    console.error('❌ External Storage proxy error:', err.message);
    res.redirect(302, 'https://placehold.co/400x400/f1f5f9/94a3b8.png?text=Error');
  }
});

app.post('/api/scheduling', verifyToken, (req, res, next) => {`;

if (!serverCode.includes('/api/storage/proxy-external')) {
  serverCode = serverCode.replace(injectionTarget, proxyCode);
  fs.writeFileSync(serverFile, serverCode);
  console.log('✅ Injected proxy endpoint into server/index.js');
}

// 2. Modify client files
const dir = path.join(__dirname, '../client/src/pages');
const files = fs.readdirSync(dir);

const getSafeUrlFunc = `
const getSafeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return url;
  if (url.includes('cdninstagram.com') || url.includes('scontent-') || url.includes('fbcdn.net')) {
    const API_BASE_URL = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'https://dm-automation-w9a4.vercel.app' 
      : 'https://dm-automation-w9a4.vercel.app';
    return API_BASE_URL + '/api/storage/proxy-external?url=' + encodeURIComponent(url);
  }
  return url;
};
`;

let count = 0;
for (const file of files) {
  if (file.endsWith('.jsx')) {
    const fullPath = path.join(dir, file);
    let code = fs.readFileSync(fullPath, 'utf8');
    
    if (code.includes('<img') && !code.includes('getSafeImageUrl')) {
      const importEnd = code.lastIndexOf("import ");
      if (importEnd !== -1) {
        const nextLine = code.indexOf("\\n", importEnd);
        code = code.slice(0, nextLine + 1) + getSafeUrlFunc + code.slice(nextLine + 1);
        
        code = code.replace(/(<img[^>]*?src={)([^}]+)(}[^>]*?>)/g, (match, p1, p2, p3) => {
          if (p2.includes('getSafeImageUrl')) return match;
          return p1 + 'getSafeImageUrl(' + p2 + ')' + p3;
        });
        
        fs.writeFileSync(fullPath, code);
        count++;
      }
    }
  }
}
console.log('✅ Modified ' + count + ' client components');
