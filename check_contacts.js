const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: './server/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkContacts() {
  try {
    const res = await axios.get(`${SUPABASE_URL}/rest/v1/contacts?select=*&order=lastActive.desc&limit=5`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    console.log("Recent Contacts:");
    res.data.forEach(c => {
      console.log(`- chatId: ${c.chatId}, pending: ${c.pendingCampaignId}, lastActive: ${c.lastActive}`);
    });
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}

checkContacts();
