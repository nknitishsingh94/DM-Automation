import dotenv from 'dotenv';
dotenv.config({ path: './server/.env' });

import { supabase } from '../server/utils/supabase.js';

async function check() {
  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('platform', 'twitter')
    .order('created_at', { ascending: false })
    .limit(5);
    
  console.log('Error:', error);
  console.log('Posts:', JSON.stringify(data, null, 2));
}

check();
