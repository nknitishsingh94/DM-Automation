const axios = require('axios');
const dotenv = require('dotenv');
dotenv.config({ path: './server/.env' });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function getCamp() {
  try {
    const res = await axios.get(`${SUPABASE_URL}/rest/v1/campaigns?trigger=eq.hii%20dost%20ji`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`
      }
    });
    console.log(res.data[0]);
  } catch (err) {
    console.error(err);
  }
}

getCamp();
