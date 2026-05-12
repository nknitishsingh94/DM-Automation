import 'dotenv/config';
import { supabase } from '../utils/supabase.js';

async function checkSchema() {
  console.log("🔍 Inserting dummy message...");
  const dummy = {
    user_id: '70aafc45-6ca3-4ed1-9dea-99d4c7a613cb',
    text: 'test',
    type: 'sent',
    chatId: 'test',
    sender: 'test'
  };
  
  const { data, error } = await supabase.from('messages').insert(dummy).select();
  if (error) {
     console.error("❌ Insert failed:", error);
     // Try with userId
     console.log("🔍 Trying with 'userId'...");
     const { data: data2, error: error2 } = await supabase.from('messages').insert({ ...dummy, userId: dummy.user_id }).select();
     if (error2) console.error("❌ Insert with userId failed too:", error2);
     else console.log("✅ Success with userId! Columns:", Object.keys(data2[0]));
  } else {
     console.log("✅ Success with user_id! Columns:", Object.keys(data[0]));
  }
}

checkSchema();
