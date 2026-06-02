import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config();
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkCampaigns() {
    const { data, error } = await supabase.from('campaigns').select('*').eq('status', 'Active');
    console.log("Active Campaigns:", JSON.stringify(data, null, 2));
}

checkCampaigns();
