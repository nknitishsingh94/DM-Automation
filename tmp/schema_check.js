
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  console.log("CHECKING DB SCHEMA...");
  
  // Try to fetch one row and see the keys
  const { data, error } = await supabase.from('scheduled_posts').select('*').limit(1);
  
  if (error) {
    console.error("DB Error:", error.message);
  } else if (data && data.length > 0) {
    console.log("Columns found in scheduled_posts:", Object.keys(data[0]).join(", "));
  } else {
    // If no data, try to fetch table definition via RPC or just guess
    console.log("No data in scheduled_posts to check columns.");
  }

  const { data: posts } = await supabase.from('scheduled_posts').select('*').eq('status', 'Scheduled');
  console.log(`Found ${posts?.length || 0} scheduled posts.`);
  posts?.forEach(p => {
    console.log(`Post: ${p.id}, status: ${p.status}, for: ${p.scheduled_for || p.scheduledFor || 'MISSING'}`);
  });
}
check();
