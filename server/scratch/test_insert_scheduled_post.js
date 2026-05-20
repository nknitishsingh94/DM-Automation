import ScheduledPost from '../models/ScheduledPost.js';
import dotenv from 'dotenv';
dotenv.config({ path: 'server/.env' });

async function run() {
  const userId = 'ffe99b88-3156-4f9f-aabf-3302264a96bf';
  try {
    const postData = {
      caption: 'Test post creation ' + Date.now(),
      scheduledFor: new Date(Date.now() + 86400000).toISOString(), // 1 day from now
      userId: userId,
      mediaUrl: JSON.stringify({
        type: 'image',
        carouselItems: [],
        mediaUrl: 'https://example.com/test.png',
        buttons: []
      }),
      status: 'Scheduled'
    };

    console.log("⚡ Saving new scheduled post...");
    const newPost = new ScheduledPost(postData);
    await newPost.save();
    console.log("✅ Success! Created post ID:", newPost.id || newPost._id);
  } catch (err) {
    console.error("❌ Exception caught:", err);
  }
}

run();
