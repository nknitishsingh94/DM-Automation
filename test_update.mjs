import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });
import { supabase } from './server/utils/supabase.js';

async function test() {
  const { data, error } = await supabase.from('scheduled_posts').select('*').limit(1);
  if (error || !data || data.length === 0) {
    console.log("No posts found or error:", error);
    return;
  }
  
  const post = data[0];
  console.log("BEFORE UPDATE:", post.status);
  
  const { data: updated, error: updateErr } = await supabase.from('scheduled_posts')
    .update({ status: 'TestStatus' })
    .eq('id', post.id)
    .select();
    
  console.log("UPDATE ERR:", updateErr);
  console.log("AFTER UPDATE:", updated);
  
  // Restore
  await supabase.from('scheduled_posts').update({ status: post.status }).eq('id', post.id);
}
test();
