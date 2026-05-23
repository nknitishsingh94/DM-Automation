import 'dotenv/config';
import { supabase } from '../utils/supabase.js';

async function checkAll() {
  console.log('--- USERS ---');
  const { data: users, error: errUsers } = await supabase.from('users').select('*');
  console.log(users || errUsers);

  console.log('\n--- SETTINGS ---');
  const { data: settings, error: errSettings } = await supabase.from('settings').select('*');
  console.log(settings || errSettings);

  console.log('\n--- SCHEDULED POSTS ---');
  const { data: posts, error: errPosts } = await supabase.from('scheduled_posts').select('*');
  console.log(posts || errPosts);

  console.log('\n--- CAPTIONS ---');
  const { data: captions, error: errCaptions } = await supabase.from('captions').select('*');
  console.log(captions || errCaptions);
}

checkAll().catch(console.error);
