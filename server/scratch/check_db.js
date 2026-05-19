import 'dotenv/config';
import { supabase } from '../utils/supabase.js';

async function checkDb() {
  try {
    console.log("📡 Querying scheduled_posts table from Supabase...");
    const { data, error } = await supabase.from('scheduled_posts').select('*').limit(1);
    if (error) {
      console.error("❌ Error fetching scheduled_posts:", error);
    } else {
      console.log("✅ Success! Sample row:", data);
    }
  } catch (err) {
    console.error("❌ Error running script:", err);
  }
}

checkDb();
