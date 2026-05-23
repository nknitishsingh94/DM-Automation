import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking tables and columns in Supabase...");
  const tables = ['users', 'settings', 'campaigns', 'contacts', 'messages', 'scheduled_posts', 'captions', 'flows', 'reviews'];
  for (const table of tables) {
    try {
      const { data: rows, error: err } = await supabase.from(table).select('*').limit(1);
      if (err) {
        console.error(`Error table '${table}':`, err.message);
      } else {
        console.log(`Table '${table}' columns:`, rows.length > 0 ? Object.keys(rows[0]) : "(empty table)");
      }
    } catch (e) {
      console.error(`Exception table '${table}':`, e.message);
    }
  }
}

run();
