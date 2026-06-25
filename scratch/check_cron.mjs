import { config } from 'dotenv';
config({ path: 'server/.env' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function checkCronJobs() {
  const { data, error } = await supabase.from('cron.job').select('*').catch(e => ({error: e}));
  if (error) {
    console.error('Error fetching cron jobs:', error.message);
  } else {
    console.log('Cron Jobs:', data);
  }
}

checkCronJobs();
