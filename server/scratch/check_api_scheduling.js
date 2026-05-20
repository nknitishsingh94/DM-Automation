import { uploadToSupabase } from '../utils/supabase.js';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

async function run() {
  try {
    console.log("⚡ Testing uploadToSupabase with a dummy text file...");
    const dummyBuffer = Buffer.from('hello world ' + Date.now());
    const publicUrl = await uploadToSupabase(dummyBuffer, 'test_dummy_' + Date.now() + '.txt', 'text/plain');
    console.log("👉 Returned publicUrl:", publicUrl);
  } catch (err) {
    console.error("❌ Test Exception:", err);
  }
}

run();
