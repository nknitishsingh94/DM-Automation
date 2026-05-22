import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });
import { supabase } from '../utils/supabase.js';

async function listCampaigns() {
  try {
    const { data: campaigns, error } = await supabase.from('campaigns').select('*');
    if (error) {
      console.error("Error fetching campaigns:", error);
      return;
    }
    console.log(`Found ${campaigns.length} campaigns:`);
    for (const c of campaigns) {
      console.log(JSON.stringify(c, null, 2));
    }
  } catch (err) {
    console.error("Exception:", err);
  }
}

listCampaigns();
