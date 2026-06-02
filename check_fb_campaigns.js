const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: './server/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function updateCampaigns() {
  try {
    const res = await axios.patch(`${SUPABASE_URL}/rest/v1/campaigns?triggerOnComments=eq.false`, 
      { triggerOnComments: true, triggerOnStories: true },
      {
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );
    console.log("Updated Campaigns:");
    res.data.forEach(c => {
      console.log(`- ${c.name || 'undefined'}: trigger="${c.trigger}", triggerOnComments=${c.triggerOnComments}`);
    });
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}

updateCampaigns();
