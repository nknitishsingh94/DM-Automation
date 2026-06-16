import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("CRITICAL: Missing keys in server/.env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Checking YouTube scheduled/failed posts...");
  const { data: posts, error } = await supabase
    .from('scheduled_posts')
    .select('*')
    .eq('platform', 'youtube');

  if (error) {
    console.error(error);
    return;
  }

  console.log(`Found ${posts.length} YouTube posts total.`);
  posts.forEach(p => {
    console.log(`\n- ID: ${p.id}
  Status: ${p.status}
  Scheduled For: ${p.scheduledFor}
  Media URL: ${p.mediaUrl}
  Caption: ${p.caption}
  Retry Count: ${p.retryCount}
  Last Error: ${p.lastError || 'None'}
  Created At: ${p.createdAt || p.created_at}`);
  });
}

check();
