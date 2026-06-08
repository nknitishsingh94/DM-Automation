import 'dotenv/config';
import { supabase } from './server/utils/supabase.js';

async function checkRow() {
  const { data } = await supabase.from('scheduled_posts').select('*').eq('id', '8e9b5da1-69f0-4c35-98b0-2257008a55d9');
  console.log(data);
  process.exit(0);
}
checkRow();
