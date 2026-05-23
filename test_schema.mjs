import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

(async () => {
  const { data, error } = await supabase.from('scheduled_posts').select('*').limit(1);
  if (error) console.error(error);
  else console.log(data);
})();
