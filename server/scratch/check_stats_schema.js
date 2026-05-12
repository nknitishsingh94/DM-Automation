import 'dotenv/config';
import { supabase } from '../utils/supabase.js';

async function checkSchema() {
  console.log("🔍 Checking 'messages' table...");
  const { data: messages, error: mErr } = await supabase.from('messages').select('*').limit(1);
  if (mErr) console.error("❌ Messages error:", mErr);
  else console.log("✅ Messages columns:", Object.keys(messages[0] || {}));

  console.log("\n🔍 Checking 'campaigns' table...");
  const { data: campaigns, error: cErr } = await supabase.from('campaigns').select('*').limit(1);
  if (cErr) console.error("❌ Campaigns error:", cErr);
  else console.log("✅ Campaigns columns:", Object.keys(campaigns[0] || {}));
}

checkSchema();
