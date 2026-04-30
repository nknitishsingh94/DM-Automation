import fs from 'fs';
import https from 'https';

function getEnv(key) {
  const content = fs.readFileSync('./server/.env', 'utf8');
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
}

const accessToken = getEnv('META_PAGE_ACCESS_TOKEN');
const bizId = '17841446193833606';

function callGraph(path) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v19.0${path}&access_token=${accessToken}`,
      method: 'GET'
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    req.on('error', (e) => reject(e));
    req.end();
  });
}

async function audit() {
  try {
    console.log('🛡️ [AUDIT] Checking Token Permissions...');
    const debug = await callGraph(`/debug_token?input_token=${accessToken}`);
    const scopes = debug.data?.scopes || [];
    console.log('📋 Current Scopes:', scopes.join(', '));
    
    const required = ['instagram_manage_comments', 'pages_show_list', 'pages_read_engagement'];
    const missing = required.filter(s => !scopes.includes(s));
    
    if (missing.length > 0) {
      console.log('❌ MISSING PERMISSIONS:', missing.join(', '));
    } else {
      console.log('✅ ALL PERMISSIONS PRESENT!');
    }

    console.log('\n📸 [AUDIT] Fetching Latest Media & Comments...');
    const media = await callGraph(`/${bizId}/media?fields=id,caption,shortcode&limit=1`);
    
    if (media.data && media.data.length > 0) {
      const lastMediaId = media.data[0].id;
      console.log(`🔍 Last Media ID: ${lastMediaId} (${media.data[0].shortcode})`);
      
      const comments = await callGraph(`/${lastMediaId}/comments?fields=id,text,from`);
      console.log('💬 Latest Comments found via API:', JSON.stringify(comments.data, null, 2));
      
      if (!comments.data || comments.data.length === 0) {
        console.log('⚠️ No comments found on your latest post. Please try commenting on it yourself to test!');
      }
    } else {
      console.log('❌ No media found for this Instagram account.');
    }

  } catch (err) {
    console.error('❌ Audit Error:', err.message);
  }
}

audit();
