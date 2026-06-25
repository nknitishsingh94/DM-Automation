const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'server', 'index.js');
let content = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');

const oldCode = `app.get('/api/storage/view', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: 'path is required' });

    const { data, error } = await supabaseAdmin
      .storage
      .from('media')
      .download(filePath);

    if (error || !data) {
      console.error('❌ Proxy download error:', error?.message || 'no data');
      return res.status(404).json({ error: 'File not found' });
    }

    const buffer = Buffer.from(await data.arrayBuffer());
    res.setHeader('Content-Type', data.type || 'application/octet-stream');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(buffer);
  } catch (err) {
    console.error('❌ Storage proxy error:', err.message);
    res.status(500).json({ error: err.message });
  }
});`;

const newCode = `app.get('/api/storage/view', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: 'path is required' });

    // Redirect to Supabase public URL so Meta's crawlers can use HTTP Range
    // requests for video downloads (the old buffered proxy returned HTTP 400
    // to Meta because it didn't support Range headers).
    const { data } = supabaseAdmin.storage.from('media').getPublicUrl(filePath);
    if (data && data.publicUrl) {
      return res.redirect(302, data.publicUrl);
    }

    return res.status(404).json({ error: 'File not found' });
  } catch (err) {
    console.error('❌ Storage proxy error:', err.message);
    res.status(500).json({ error: err.message });
  }
});`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  fs.writeFileSync(filePath, content);
  console.log('✅ Successfully replaced /api/storage/view endpoint');
} else {
  console.log('❌ Could not find the old code block. Checking...');
  if (content.includes("app.get('/api/storage/view'")) {
    console.log('The endpoint exists but the exact text differs. Printing context...');
    const idx = content.indexOf("app.get('/api/storage/view'");
    console.log(content.substring(idx, idx + 600));
  }
}
