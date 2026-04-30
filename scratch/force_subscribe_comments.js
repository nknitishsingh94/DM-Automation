import fs from 'fs';
import https from 'https';

function getEnv(key) {
  const content = fs.readFileSync('./server/.env', 'utf8');
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
}

const accessToken = getEnv('META_PAGE_ACCESS_TOKEN');
const pageId = '1137728142748715'; 

async function forceSubscribe() {
  try {
    console.log('📡 [META REPAIR] Attempting to subscribe to Comments & Feed (Take 2)...');
    
    // Using URLSearchParams style for body to match Meta expectations
    const fields = 'feed,comments,messages,messaging_postbacks,messaging_optins,mentions';
    const postData = `subscribed_fields=${fields}&access_token=${accessToken}`;

    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v19.0/${pageId}/subscribed_apps`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': postData.length
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        const result = JSON.parse(body);
        console.log('🚀 REPAIR RESULT:', JSON.stringify(result, null, 2));
        if (result.success) {
          console.log('✅ SUCCESS! Your Page is now listening for Comments.');
        } else {
          console.log('❌ Still failing. This token might be missing "pages_manage_metadata" permission.');
        }
      });
    });
    
    req.on('error', (e) => console.error(e));
    req.write(postData);
    req.end();
    
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

forceSubscribe();
