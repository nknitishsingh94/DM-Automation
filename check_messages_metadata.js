const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: './server/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkMessages() {
  try {
    const res = await axios.get(`${SUPABASE_URL}/rest/v1/messages?select=id,platform,sender,chatId,text,metadata,timestamp&order=timestamp.desc&limit=5`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    console.log("Recent Messages with Metadata:");
    res.data.forEach(m => {
      console.log(`\n--- [${m.platform}] ${m.sender} (${m.chatId}) at ${m.timestamp} ---`);
      console.log(`Text: ${m.text.substring(0, 100)}`);
      if (m.metadata) {
        console.log(`Metadata:`, JSON.stringify(m.metadata, null, 2));
      } else {
        console.log(`Metadata: NONE`);
      }
    });
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

checkMessages();
