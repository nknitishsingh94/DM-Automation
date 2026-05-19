import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

async function run() {
  const { data: posts, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .limit(10);
    
  if (error) {
    console.error('Error fetching posts:', error);
  } else {
    console.log('Posts:', JSON.stringify(posts, null, 2));
  }
}

run();
