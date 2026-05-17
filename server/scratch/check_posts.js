import 'dotenv/config';
import ScheduledPost from '../models/ScheduledPost.js';

async function check() {
  console.log("🔍 Checking all scheduled posts in the database...");
  try {
    const posts = await ScheduledPost.find({}).sort({ createdAt: -1 });
    console.log(`📊 Found ${posts.length} posts:`);
    posts.forEach((p, idx) => {
      console.log(`\n[Post #${idx + 1}]`);
      console.log(`  - ID: ${p._id}`);
      console.log(`  - Caption: "${p.caption}"`);
      console.log(`  - Status: ${p.status}`);
      console.log(`  - MediaUrl: ${p.mediaUrl}`);
      console.log(`  - CreatedAt: ${p.createdAt}`);
    });
  } catch (err) {
    console.error("❌ Error fetching posts:", err.message);
  }
  process.exit(0);
}
check();
