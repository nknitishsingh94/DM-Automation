require('dotenv').config();
(async () => {
  const { createSupabaseModel } = await import('./server/utils/supabase.js');
  const S = createSupabaseModel('scheduled_posts');
  const result = await S.find({ status: 'Scheduled' });
  console.log(result);
})();
