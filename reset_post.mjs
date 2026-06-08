import 'dotenv/config';
import { supabase } from './server/utils/supabase.js';

async function resetAndCheck() {
  await supabase.from('scheduled_posts').update({ status: 'Scheduled', updatedAt: new Date(Date.now() - 3600000).toISOString() }).eq('id', '8e9b5da1-69f0-4c35-98b0-2257008a55d9');
  console.log("Reset post to Scheduled. Waiting for worker...");
}

resetAndCheck();
