import 'dotenv/config';
import { supabase } from './utils/supabase.js';
import Settings from './models/Settings.js';
import axios from 'axios';

async function checkStatus() {
  const userId = '1622e35a-03e1-443f-9e95-cd4bdc56cb9b';
  const settings = await Settings.findOne({ userId });
  if (!settings) {
    console.error('No settings found');
    return;
  }
  
  const accessToken = settings.instagramAccessToken;
  const containerId = '18079122281539795';
  
  console.log('Querying Meta API for status_code only...');
  try {
    const res = await axios.get(`https://graph.facebook.com/v19.0/${containerId}`, {
      params: {
        fields: 'status_code',
        access_token: accessToken
      }
    });
    console.log('Container Status Code:', res.data);
  } catch (err) {
    console.error('Error fetching status_code:', err.response?.data || err.message);
  }
}

checkStatus().catch(console.error);
