import 'dotenv/config';
import { supabaseAdmin } from '../server/utils/supabase.js';

async function checkFailed() {
  const { data, error } = await supabaseAdmin
    .from('scheduled_posts')
    .select('*')
    .eq('status', 'Failed')
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) {
    console.error("Supabase Error:", error);
    return;
  }
  
  console.log("Failed Posts in Supabase:");
  data.forEach(p => {
    console.log(`- ID: ${p.id}, Platform: ${p.platform}, Error: ${p.errorLog}`);
  });
}

checkFailed();
