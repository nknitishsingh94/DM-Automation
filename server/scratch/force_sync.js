import 'dotenv/config';
import ScheduledPost from '../models/ScheduledPost.js';
import Campaign from '../models/Campaign.js';
import { publishInstagramContent } from '../utils/metaApi.js';

async function forceSync() {
  try {
    const nowISO = new Date().toISOString();
    console.log(`🚀 Starting Force Sync at ${nowISO}`);
    
    const duePosts = await ScheduledPost.find({
      scheduledFor: { $lte: nowISO },
      status: 'Scheduled'
    });

    console.log(`Found ${duePosts.length} due posts to process.`);

    for (const post of duePosts) {
      console.log(`🔄 Processing Post ${post._id}...`);
      
      let finalMedia = post.mediaUrl;
      let finalType = post.type || 'image';
      let finalCarousel = [];
      
      if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
        try {
          const meta = JSON.parse(post.mediaUrl);
          finalType = meta.type || finalType;
          finalCarousel = meta.carouselItems || [];
          finalMedia = meta.mediaUrl || (finalCarousel.length > 0 ? finalCarousel[0] : '');
        } catch (e) {}
      }

      // Mark as Processing
      await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Processing' });

      try {
        console.log(`📸 Publishing to Instagram...`);
        const publishedId = await publishInstagramContent(post.userId, finalType, finalMedia, post.caption, finalCarousel);

        if (post.triggerKeyword && post.autoResponse) {
          const campaign = new Campaign({
            userId: post.userId,
            name: `Auto: ${post.caption.substring(0, 20)}...`,
            trigger: post.triggerKeyword,
            response: post.autoResponse,
            status: 'Active',
            isAnyPost: false,
            postId: publishedId
          });
          await campaign.save();
        }

        await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Posted', postedAt: new Date() });
        console.log(`✅ SUCCESS: Post ${post._id} is LIVE.`);
      } catch (err) {
        console.error(`❌ FAILED: ${err.message}`);
        await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Failed', lastError: err.message });
      }
    }
  } catch (err) {
    console.error('Critical Error:', err.message);
  } finally {
    process.exit();
  }
}

forceSync();
