require('dotenv').config();
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  const { data } = await supabase.from('settings').select('connectedPageName').eq('isGoogleBusinessConnected', true).limit(1);
  if (!data || data.length === 0) {
    console.log("No GMB connection found.");
    return;
  }
  const token = JSON.parse(data[0].connectedPageName).googleBusinessAccessToken;

  try {
    const res = await axios.get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log("ACCOUNTS:", JSON.stringify(res.data, null, 2));

    if (res.data.accounts && res.data.accounts.length > 0) {
      const accountName = res.data.accounts[0].name;
      const locationsRes = await axios.get(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=title`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log("LOCATIONS:", JSON.stringify(locationsRes.data, null, 2));
    }
  } catch (e) {
    console.error('API Error:', e.response ? e.response.data : e.message);
  }
}

run();
