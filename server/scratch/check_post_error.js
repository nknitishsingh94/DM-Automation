import 'dotenv/config';
import ScheduledPost from '../models/ScheduledPost.js';

async function check() {
  const targetId = 'b58e6c34-39b0-4e6e-af7c-49d21f32f731';
  console.log(`🔍 Checking error for post: ${targetId}...`);
  try {
    const post = await ScheduledPost.findById(targetId);
    if (!post) {
      console.error("❌ Post not found!");
      process.exit(1);
    }
    console.log(`📊 Post Status: ${post.status}`);
    console.log(`❌ Last Error: "${post.lastError}"`);
  } catch (err) {
    console.error("❌ Error checking post:", err.message);
  }
  process.exit(0);
}
check();
