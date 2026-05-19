import 'dotenv/config';
import { createSupabaseModel } from '../utils/supabase.js';

const ScheduledPost = createSupabaseModel('scheduled_posts');

async function test() {
  try {
    const post = await ScheduledPost.findOne({});
    if (!post) {
      console.log("No posts found to test!");
      return;
    }
    
    console.log("Found post:", post._id);
    console.log("Current triggerKeyword:", post.triggerKeyword);
    console.log("Current autoResponse:", post.autoResponse);
    
    console.log("Updating post...");
    const updated = await ScheduledPost.findOneAndUpdate(
      { _id: post._id },
      { triggerKeyword: 'TEST_KEYWORD', autoResponse: 'TEST_RESPONSE' },
      { new: true }
    );
    
    console.log("Updated result from findOneAndUpdate:");
    console.log("triggerKeyword:", updated.triggerKeyword);
    console.log("autoResponse:", updated.autoResponse);
    
    console.log("Fetching fresh from DB to verify:");
    const fresh = await ScheduledPost.findOne({ _id: post._id });
    console.log("Fresh triggerKeyword:", fresh.triggerKeyword);
    console.log("Fresh autoResponse:", fresh.autoResponse);
    
  } catch (err) {
    console.error("Error during test:", err);
  }
  process.exit(0);
}

test();
