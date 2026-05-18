import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Checking campaigns for active user ffe99b88-3156-4f9f-aabf-3302264a96bf...");
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
    .eq('userId', 'ffe99b88-3156-4f9f-aabf-3302264a96bf');
  
  if (error) {
    console.error("Error fetching campaigns:", error);
    return;
  }
  
  console.log(`Found ${data.length} campaigns:`);
  data.forEach((row, i) => {
    console.log(`\n--- Campaign ${i + 1} ---`);
    console.log(`id: ${row.id}`);
    console.log(`name: ${row.name}`);
    console.log(`trigger: ${row.trigger}`);
    console.log(`response: ${row.response}`);
    console.log(`status: ${row.status}`);
    console.log(`platform: ${row.platform}`);
    console.log(`postId: ${row.postId}`);
    console.log(`isAnyPost: ${row.isAnyPost}`);
    console.log(`triggerOnComments: ${row.triggerOnComments}`);
  });
}

run();
