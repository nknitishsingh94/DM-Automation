import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  const { data: messages, error } = await supabase
    .from('users')
    .select('*')
    .limit(20);

  if (error) {
    console.error('Error fetching messages:', error);
  } else {
    console.log('Recent 20 Messages:', JSON.stringify(messages, null, 2));
  }

  const { data: campaigns, error2 } = await supabase
    .from('campaigns')
    .select('*')
    .limit(20);

  if (error2) {
    console.error('Error fetching campaigns:', error2);
  } else {
    console.log('Recent 20 Campaigns:', JSON.stringify(campaigns, null, 2));
  }
}

run();
