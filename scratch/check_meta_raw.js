const fs = require('fs');
const https = require('https');

// Simple manual env loader
function loadEnv() {
  const envPath = './server/.env';
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, 'utf8');
  const lines = content.split('\n');
  const env = {};
  lines.forEach(line => {
    const parts = line.split('=');
    if (parts.length >= 2) {
      env[parts[0].trim()] = parts[1].trim();
    }
  });
  return env;
}

const env = loadEnv();
const accessToken = env.META_PAGE_ACCESS_TOKEN;
const pageId = '1137728142748715'; 

function callGraph(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'graph.facebook.com',
      port: 443,
      path: `/v19.0${path}`,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => resolve(JSON.parse(body)));
    });
    
    req.on('error', (e) => reject(e));
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function run() {
  try {
    console.log('🔍 Checking Meta Subscriptions...');
    const resp = await callGraph(`/${pageId}/subscribed_apps?access_token=${accessToken}`);
    console.log('✅ Status:', JSON.stringify(resp, null, 2));
    
    const fields = resp.data?.[0]?.subscribed_fields || [];
    console.log('📊 Subscribed Fields:', fields);
    
    if (!fields.includes('comments') || !fields.includes('feed')) {
      console.log('⚠️ MISSING REEL FIELDS! Attempting automatic fix...');
      const fix = await callGraph(`/${pageId}/subscribed_apps?access_token=${accessToken}`, 'POST', {
        subscribed_fields: 'feed,comments,messages,messaging_postbacks,messaging_optins'
      });
      console.log('🚀 REPAIR RESULT:', JSON.stringify(fix, null, 2));
    } else {
      console.log('✅ REELS ARE ALREADY SUBSCRIBED. The issue might be elsewhere.');
    }
  } catch (err) {
    console.error('❌ Error:', err);
  }
}

run();
