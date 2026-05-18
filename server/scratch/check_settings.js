import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking settings table...");
  const { data, error } = await supabase
    .from('settings')
    .select('*');
  
  if (error) {
    console.error("Error fetching settings:", error);
    return;
  }
  
  console.log(`Found ${data.length} settings rows:`);
  data.forEach((row, i) => {
    console.log(`\n--- Settings Row ${i + 1} ---`);
    console.log(`id: ${row.id}`);
    console.log(`userId: ${row.userId}`);
    console.log(`instagramPageId: ${row.instagramPageId}`);
    console.log(`businessAccountId: ${row.businessAccountId}`);
    console.log(`facebookPageId: ${row.facebookPageId}`);
    console.log(`instagramUsername: ${row.instagramUsername}`);
  });
}

run();
