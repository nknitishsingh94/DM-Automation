import 'dotenv/config';
import ScheduledPost from '../models/ScheduledPost.js';
import { supabase } from '../utils/supabase.js';

async function checkSchema() {
  try {
    const post = await ScheduledPost.findOne({});
    if (post) {
      console.log('Columns found in scheduled_posts:');
      console.log(Object.keys(post));
      console.log('Sample Data:', JSON.stringify(post, null, 2));
    } else {
      console.log('No posts found in scheduled_posts table.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

checkSchema();
