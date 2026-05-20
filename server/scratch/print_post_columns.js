import ScheduledPost from '../models/ScheduledPost.js';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

async function run() {
  try {
    const posts = await ScheduledPost.find({}).limit(1);
    if (posts.length > 0) {
      console.log("Post structure:", Object.keys(posts[0].toObject()));
      console.log("Full post:", JSON.stringify(posts[0].toObject(), null, 2));
    } else {
      console.log("No posts found.");
    }
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

run();
