import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Cleaning up settings table duplicates...");
  const activeUserId = "ffe99b88-3156-4f9f-aabf-3302264a96bf";
  const businessAccountId = "17841446193833606";

  // Fetch all rows with this businessAccountId
  const { data, error } = await supabase
    .from('settings')
    .select('*')
    .eq('businessAccountId', businessAccountId);

  if (error) {
    console.error("Error fetching settings:", error);
    return;
  }

  console.log(`Found ${data.length} duplicate/stale settings rows for account ${businessAccountId}:`);

  for (const row of data) {
    if (row.userId !== activeUserId) {
      console.log(`Deleting stale settings row for user ${row.userId} (Row ID: ${row.id})...`);
      const { error: delErr } = await supabase
        .from('settings')
        .delete()
        .eq('id', row.id);
      
      if (delErr) {
        console.error(`Failed to delete row ${row.id}:`, delErr);
      } else {
        console.log(`Successfully deleted row ${row.id}`);
      }
    } else {
      console.log(`Keeping active settings row for user ${row.userId} (Row ID: ${row.id})`);
    }
  }

  console.log("\nCleanup done!");
}

run();
