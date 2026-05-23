import 'dotenv/config';
import { createSupabaseModel } from './server/utils/supabase.js';

(async () => {
  const S = createSupabaseModel('scheduled_posts');
  const result = await S.find({ status: 'Scheduled' });
  console.log(result);
})();
