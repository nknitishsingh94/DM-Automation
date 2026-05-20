
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: 'server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("CRITICAL: Missing keys in server/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking scheduled posts...");
  const { data: posts, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('status', 'Scheduled');

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Found ${posts.length} scheduled posts.`);
  posts.forEach(p => {
    console.log(`- ID: ${p.id}, User: ${p.userId}, Scheduled: ${p.scheduledFor}, Status: ${p.status}`);
  });
  
  console.log("\nChecking for failed posts...");
  const { data: failed, error2 } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('status', 'Failed')
    .order('created_at', { ascending: false })
    .limit(5);
    
  failed?.forEach(p => {
    console.log(`- ID: ${p.id}, Error: ${p.lastError}`);
  });
}

check();
