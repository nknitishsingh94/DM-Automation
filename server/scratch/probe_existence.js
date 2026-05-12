import 'dotenv/config';
import { supabase } from '../utils/supabase.js';

async function probe() {
  const { data, error } = await supabase.from('messages').select('*').limit(0);
  if (error) {
    console.error("❌ Messages table error:", error.message);
  } else {
    console.log("✅ Messages table exists.");
  }
  
  const { data: d2, error: e2 } = await supabase.from('campaigns').select('*').limit(0);
  if (e2) console.error("❌ Campaigns table error:", e2.message);
  else console.log("✅ Campaigns table exists.");
}

probe();
