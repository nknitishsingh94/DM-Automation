import 'dotenv/config';
import { supabase } from '../utils/supabase.js';

async function test() {
  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error(error);
  } else {
    console.log("Recent Scheduled Posts:");
    data.forEach(post => {
      console.log(`ID: ${post.id} | Status: ${post.status} | For: ${post.scheduledFor} | Error: ${post.lastError || 'None'}`);
    });
  }
}
test();
