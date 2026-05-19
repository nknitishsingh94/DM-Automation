import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  const { data: users, error } = await supabase
    .from('users')
    .select('id, username, email, googleId, facebookId, createdAt')
    .order('createdAt', { ascending: false });
    
  if (error) {
    console.error('Error fetching users:', error);
  } else {
    console.log('Users count:', users.length);
    console.log('Users:', JSON.stringify(users, null, 2));
  }
}

run();
