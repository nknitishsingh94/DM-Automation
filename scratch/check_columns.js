import 'dotenv/config';
import { supabaseAdmin } from '../server/utils/supabase.js';

async function checkColumns() {
  const { data, error } = await supabaseAdmin
    .from('scheduled_posts')
    .select('*')
    .limit(1);
    
  if (error) {
    console.error("Supabase Error:", error);
    return;
  }
  
  if (data.length > 0) {
    console.log("Columns:", Object.keys(data[0]));
  } else {
    console.log("No data to infer columns from.");
  }
}

checkColumns();
