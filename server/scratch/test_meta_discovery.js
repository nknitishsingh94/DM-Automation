import axios from 'axios';
import 'dotenv/config';

const testMetaDiscovery = async () => {
  const token = process.env.META_PAGE_ACCESS_TOKEN;
  if (!token) {
    console.error("❌ No META_PAGE_ACCESS_TOKEN found in .env");
    return;
  }

  console.log("🔍 Testing Meta Discovery with token prefix:", token.substring(0, 15));

  try {
    // Test 1: Check Permissions
    console.log("\n1. Checking Token Permissions...");
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${token}&access_token=${token}`;
    // Note: debug_token requires an app token or the token itself if it has rights. 
    // Usually easier to just try the fields.
    
    // Test 2: Check WhatsApp Business Accounts
    console.log("\n2. Checking WhatsApp Business Accounts (me/whatsapp_business_accounts)...");
    try {
      const wabaUrl = `https://graph.facebook.com/v19.0/me/whatsapp_business_accounts?access_token=${token}`;
      const wabaRes = await axios.get(wabaUrl);
      console.log("✅ WABA Response:", JSON.stringify(wabaRes.data, null, 2));
    } catch (e) {
      console.error("❌ WABA Error:", e.response?.data || e.message);
    }

    // Test 3: Check Pages
    console.log("\n3. Checking Pages (me/accounts)...");
    try {
      const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?access_token=${token}`;
      const pagesRes = await axios.get(pagesUrl);
      console.log("✅ Pages Response:", JSON.stringify(pagesRes.data, null, 2));
    } catch (e) {
      console.error("❌ Pages Error:", e.response?.data || e.message);
    }

  } catch (err) {
    console.error("❌ Critical Error:", err.response?.data || err.message);
  }
};

testMetaDiscovery();
