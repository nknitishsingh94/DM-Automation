import 'dotenv/config';
import ScheduledPost from '../models/ScheduledPost.js';

async function updatePost() {
  const targetId = '474657f7-201d-496a-b84c-bdd632a2b593';
  console.log(`🔍 Finding target scheduled post: ${targetId}...`);
  
  try {
    const post = await ScheduledPost.findById(targetId);
    if (!post) {
      console.error("❌ Target post not found in database.");
      process.exit(1);
    }
    
    console.log("Current post mediaUrl:", post.mediaUrl);
    
    // Parse current metadata
    let metadata = {};
    try {
      if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
        metadata = JSON.parse(post.mediaUrl);
      }
    } catch (e) {
      console.warn("Failed to parse metadata, initializing new one.");
    }
    
    // Inject high-quality placeholder image
    metadata.mediaUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800";
    if (!metadata.carouselItems || metadata.carouselItems.length === 0) {
      metadata.carouselItems = [metadata.mediaUrl];
    }
    
    const newMediaUrl = JSON.stringify(metadata);
    await ScheduledPost.findByIdAndUpdate(targetId, { mediaUrl: newMediaUrl });
    
    console.log("✅ UPDATE SUCCESSFUL!");
    console.log("New saved mediaUrl metadata:", post.mediaUrl);
    
  } catch (err) {
    console.error("❌ Update failed:", err.message);
  }
  process.exit(0);
}

updatePost();
