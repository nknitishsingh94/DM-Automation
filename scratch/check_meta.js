import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
const pageId = '1137728142748715'; // From your logs

async function checkSubscriptions() {
  try {
    console.log('🔍 Checking Webhook Subscriptions for Page:', pageId);
    
    // 1. Get subscribed apps
    const url = `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?access_token=${accessToken}`;
    const resp = await axios.get(url);
    console.log('✅ Subscribed Apps:', JSON.stringify(resp.data, null, 2));
    
    // 2. Check if 'comments' and 'feed' are in the list
    const fields = resp.data?.data?.[0]?.subscribed_fields || [];
    console.log('📊 Current Subscribed Fields:', fields);
    
    if (!fields.includes('comments') || !fields.includes('feed')) {
      console.log('⚠️ MISSING FIELDS detected! Attempting to fix...');
      const fixUrl = `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps`;
      await axios.post(fixUrl, {
        subscribed_fields: ['feed', 'comments', 'messages', 'messaging_postbacks', 'messaging_optins'],
        access_token: accessToken
      });
      console.log('🚀 REPAIR SUCCESSFUL! All fields subscribed.');
    } else {
      console.log('✅ Everything looks perfectly configured in Meta.');
    }
    
  } catch (err) {
    console.error('❌ ERROR during diagnostic:', err.response?.data || err.message);
  }
}

checkSubscriptions();
