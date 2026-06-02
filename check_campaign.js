const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: './server/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkCampaign() {
  try {
    const res = await axios.get(`${SUPABASE_URL}/rest/v1/campaigns?id=eq.becaa2b1-0a27-49f8-be11-555675d917b9`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    console.log("Campaign Details:");
    console.log(res.data[0]);
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}

checkCampaign();
