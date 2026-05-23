import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

import { supabase } from './utils/supabase.js';

async function check() {
  const { data, error } = await supabase.from('scheduled_posts').select('*').eq('status', 'Processing');
  console.log("Processing posts:");
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));

  // Also check Scheduled posts
  const { data: d2, error: e2 } = await supabase.from('scheduled_posts').select('*').eq('status', 'Scheduled');
  console.log("Scheduled posts:");
  if (e2) console.error(e2);
  else console.log(JSON.stringify(d2, null, 2));
  
  process.exit(0);
}

check();
