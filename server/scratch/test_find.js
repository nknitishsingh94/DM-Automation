import 'dotenv/config';
import { createSupabaseModel } from '../utils/supabase.js';

const ScheduledPost = createSupabaseModel('scheduled_posts');

async function testFind() {
  try {
    const posts1 = await ScheduledPost.find({ userId: '51c6e3d7-b0fe-4d8a-bb05-104023fe1f1e' });
    console.log("posts for 51c6e3d7-b0fe-4d8a-bb05-104023fe1f1e count:", posts1.length);

    const posts2 = await ScheduledPost.find({ userId: 'ffe99b88-3156-4f9f-aabf-3302264a96bf' });
    console.log("posts for ffe99b88-3156-4f9f-aabf-3302264a96bf count:", posts2.length);
  } catch (err) {
    console.error("Error:", err);
  }
}
testFind();
