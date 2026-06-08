import 'dotenv/config';
import { supabase } from './server/utils/supabase.js';

async function checkThreads() {
  const { data, error } = await supabase.from('scheduled_posts')
    .select('*')
    .eq('platform', 'threads')
    .order('createdAt', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log(`Found ${data.length} threads posts.`);
  data.forEach(d => {
    console.log(`Post ${d.id} | Status: ${d.status} | Error: ${d.lastError}`);
  });
  process.exit(0);
}

checkThreads();
