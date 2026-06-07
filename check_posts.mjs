import 'dotenv/config';
import { supabase } from './server/utils/supabase.js';

async function checkPosts() {
  const { data, error } = await supabase.from('scheduled_posts').select('*').eq('id', '1302c2c9-cf99-4bad-bcef-976b4bd3efa9');
  if (error) {
    console.error("Error:", error);
    return;
  }
  data.forEach(d => {
    console.log(`Post ${d.id}`);
    console.log(`Error: ${d.lastError}`);
  });
  process.exit(0);
}

checkPosts();
