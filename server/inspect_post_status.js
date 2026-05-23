import 'dotenv/config';
import { supabase } from './utils/supabase.js';

async function testList() {
  const { data: posts, error } = await supabase
    .from('scheduled_posts')
    .select('*');

  if (error) {
    console.error('❌ Failed to list posts:', error.message);
  } else {
    console.log(posts);
  }
}

testList().catch(console.error);
