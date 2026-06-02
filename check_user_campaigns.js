const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: './server/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkCampaigns() {
  try {
    const res = await axios.get(`${SUPABASE_URL}/rest/v1/campaigns?userId=eq.1622e35a-03e1-443f-9e95-cd4bdc56cb9b&status=eq.Active`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    console.log("Active Campaigns for User:");
    res.data.forEach(c => {
      console.log(`- Campaign: ${c.name || 'Unnamed'}, Trigger: "${c.trigger}", Keywords: ${c.triggerKeyword}, Platform: ${c.platform}, onComments: ${c.triggerOnComments}`);
    });
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

checkCampaigns();
