import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const _sb = createClient(supabaseUrl, supabaseKey);

async function testWorkerError() {
  const postId = 'afe96820-57bd-4f8d-ae4e-5c4e34916be0';
  let postErr = new Error("");

  const cleanFields = { status: 'Failed', lastError: postErr.message, retryCount: 1 };
  delete cleanFields.retryCount;
  
  console.log("Updating with fields:", cleanFields);
  
  try {
    const { data, error } = await _sb.from('scheduled_posts').update({ ...cleanFields, updatedAt: new Date().toISOString() }).eq('id', postId);
    console.log("Result:", { error, data });
  } catch (err) {
    console.log("Exception:", err.message);
  }
}
testWorkerError();
