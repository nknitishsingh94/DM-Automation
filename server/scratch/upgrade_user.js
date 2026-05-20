import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  const email = 'nknitishsingh94@gmail.com';
  console.log(`⚡ Upgrading user ${email} to 'pro' plan...`);

  const { data, error } = await supabase
    .from('users')
    .update({ plan: 'pro' })
    .eq('email', email)
    .select();

  if (error) {
    console.error('❌ Error upgrading user:', error);
  } else {
    console.log('✅ Success! Upgraded user details:', JSON.stringify(data, null, 2));
  }
}

run();
