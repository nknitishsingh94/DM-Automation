import 'dotenv/config';
import { supabase } from '../utils/supabase.js';

async function test() {
  const { data, error } = await supabase.from('scheduled_posts').select('*').limit(1);
  if (error) {
    console.error(error);
  } else {
    console.log("Post structure:", data[0]);
  }
}
test();
