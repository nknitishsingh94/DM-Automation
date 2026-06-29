import 'dotenv/config';
import { supabaseAdmin } from '../server/utils/supabase.js';

async function checkSupabase() {
  const { data, error } = await supabaseAdmin
    .from('scheduled_posts')
    .select('*')
    .eq('platform', 'pinterest')
    .eq('status', 'Failed')
    .order('created_at', { ascending: false })
    .limit(5);
    
  if (error) {
    console.error("Supabase Error:", error);
    return;
  }
  
  console.log("Failed Pinterest Posts in Supabase:");
  data.forEach(p => {
    console.log(`- ID: ${p.id}`);
    console.log(`  Error: ${p.errorLog}`);
    console.log(`  Board: ${p.pinterestBoard}`);
    console.log('---');
  });
}

checkSupabase();
