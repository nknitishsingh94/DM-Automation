import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function reset() {
  const { data, error } = await supabase
    .from('scheduled_posts')
    .update({ status: 'Failed', lastError: 'Stuck in processing', updatedAt: new Date().toISOString() })
    .eq('status', 'Processing');
  
  if (error) console.error("Error:", error);
  else console.log("Reset stuck posts to Failed");
}

reset();
