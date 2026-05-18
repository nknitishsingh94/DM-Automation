import 'dotenv/config';
import { supabase } from '../utils/supabase.js';

async function check() {
  if (!supabase) {
    console.error("❌ Supabase client is not initialized.");
    process.exit(1);
  }
  
  try {
    const { data, error } = await supabase.from('scheduled_posts').select('*').limit(1);
    if (error) throw error;
    console.log("📊 Raw Row from Supabase:");
    console.log(JSON.stringify(data[0], null, 2));
  } catch (err) {
    console.error("❌ Error:", err.message);
  }
  process.exit(0);
}
check();
