const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: './server/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkMessages() {
  try {
    const res = await axios.get(`${SUPABASE_URL}/rest/v1/messages?select=*&order=timestamp.desc&limit=10`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    console.log("Recent Messages:");
    res.data.forEach(m => {
      console.log(`- [${m.platform}] ${m.sender} (${m.chatId}): ${m.text.substring(0, 50)} at ${m.timestamp}`);
    });
  } catch (err) {
    console.error(err.response ? err.response.data : err.message);
  }
}

checkMessages();
