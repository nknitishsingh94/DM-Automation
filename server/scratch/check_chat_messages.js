import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  try {
    const { data, error } = await supabase.from('chat_messages').select('*').limit(1);
    if (error) {
      console.error('❌ chat_messages table error:', error.message);
    } else {
      console.log('✅ chat_messages table exists! Columns:', data.length > 0 ? Object.keys(data[0]) : '(empty)');
    }
  } catch (e) {
    console.error('Exception:', e.message);
  }
}

run();
