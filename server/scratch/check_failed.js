import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFailed() {
  const { data, error } = await supabase
    .from('scheduled_posts')
    .select('id, status, platform, lastError')
    .eq('id', 'afe96820-57bd-4f8d-ae4e-5c4e34916be0');
  
  console.log("Post status now:", data);
}
checkFailed();
