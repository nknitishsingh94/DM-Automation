import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_KEY in environment");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking tables and columns in Supabase...");
  const { data, error } = await supabase.rpc('inspect_schema'); // if helper exists
  
  // Or query information_schema directly:
  const { data: cols, error: colsErr } = await supabase
    .from('settings') // just test access
    .select('*')
    .limit(1);

  if (colsErr) {
    console.error("Error reading settings table:", colsErr);
  } else {
    console.log("Settings keys:", cols.length > 0 ? Object.keys(cols[0]) : "No rows");
  }

  // Let's query information_schema.columns via a postgrest direct call or sql.
  // Since we cannot run raw sql directly without an rpc function, let's query a single row from each table and print keys.
  const tables = ['users', 'settings', 'campaigns', 'contacts', 'messages', 'scheduled_posts', 'captions', 'flows', 'reviews'];
  for (const table of tables) {
    try {
      const { data: rows, error: err } = await supabase.from(table).select('*').limit(1);
      if (err) {
        console.error(`Error table '${table}':`, err.message);
      } else {
        console.log(`Table '${table}' columns:`, rows.length > 0 ? Object.keys(rows[0]) : "(empty table, fetching columns not possible via row keys)");
      }
    } catch (e) {
      console.error(`Exception table '${table}':`, e.message);
    }
  }

  // Also query information_schema using an RPC if possible, or try a system catalog query.
  // Wait, let's query pg_attribute or information_schema.columns
  const { data: columnsData, error: schemaErr } = await supabase
    .from('pg_attribute') // likely fails due to RLS/exposure, but let's try
    .select('*')
    .limit(1);
  if (schemaErr) {
    console.log("pg_attribute not exposed (normal)");
  }
}

run();
