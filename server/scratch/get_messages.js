import 'dotenv/config';
import { supabase } from '../utils/supabase.js';

async function run() {
  try {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*')
      .eq('userId', '1622e35a-03e1-443f-9e95-cd4bdc56cb9b')
      .order('timestamp', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching messages:', error);
    } else {
      console.log('Recent Messages:', JSON.stringify(messages, null, 2));
    }
  } catch (err) {
    console.error('Error running script:', err);
  }
}

run();
