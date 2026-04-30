import fs from 'fs';
import https from 'https';

function getEnv(key) {
  const content = fs.readFileSync('./server/.env', 'utf8');
  const match = content.match(new RegExp(`^${key}=(.*)$`, 'm'));
  return match ? match[1].trim() : null;
}

const accessToken = getEnv('META_PAGE_ACCESS_TOKEN');
const instaBizId = '17841446193833606'; // Your Instagram Business Account ID

async function forceSubscribeInsta() {
  try {
    console.log('📡 [INSTA REPAIR] Attempting to subscribe Instagram ID to Comments...');
    
    // For Instagram Business Accounts, we sometimes need to hit the /subscribed_apps endpoint
    // with specific Instagram-related fields.
    const fields = 'comments,mentions';
    const postData = `subscribed_fields=${fields}&access_token=${accessToken}`;

    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v19.0/${instaBizId}/subscribed_apps`,
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
        if (result.success || result.id) {
          console.log('✅ SUCCESS! Instagram is now listening for Comments.');
        } else {
          console.log('❌ Failed. This account might need manual subscription in the Meta Dashboard.');
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

forceSubscribeInsta();
