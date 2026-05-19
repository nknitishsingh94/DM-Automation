import 'dotenv/config';
import { createSupabaseModel } from '../utils/supabase.js';

const ScheduledPost = createSupabaseModel('scheduled_posts');

async function testDelete() {
  const id = '018c41d6-e04a-498b-89ef-64c43c6bab4c';
  const userId = 'ffe99b88-3156-4f9f-aabf-3302264a96bf';
  try {
    const postToDelete = await ScheduledPost.findOne({ _id: id, userId });
    console.log("postToDelete found:", !!postToDelete);
    if (postToDelete) {
      console.log("Deleting...");
      const res = await ScheduledPost.findByIdAndDelete(id);
      console.log("Result:", res);
    }
  } catch (err) {
    console.error("Error:", err);
  }
}
testDelete();
