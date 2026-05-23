import 'dotenv/config';
import ScheduledPost from './models/ScheduledPost.js';
import { publishInstagramContent } from './utils/metaApi.js';
import { supabase as _sb } from './utils/supabase.js';
import Campaign from './models/Campaign.js';
import { checkMediaReadiness } from './utils/metaApi.js';

async function runSchedulingWorker() {
  try {
    const now = new Date();
    const nowISO = now.toISOString();
    
    console.log(`📡 [Worker] Checking posts due before: ${nowISO}`);
    
    // Find due posts
    const duePosts = await ScheduledPost.find({
      scheduledFor: { $lte: nowISO },
      status: { $in: ['Scheduled', 'Retrying', 'Processing'] } // Include Processing for our test
    });

    console.log(`📡 [Worker] Query returned ${duePosts?.length || 0} posts.`);

    for (const post of duePosts) {
      if (post.id !== '972a3777-a946-431e-821b-6d76f2f4b497') continue; // Only run our target post
      
      try {
        console.log(`🔄 EXECUTION: Processing Post ${post.id} for User ${post.userId}`);

        let finalMedia = post.mediaUrl;
        let finalType = post.type || 'image';
        let finalCarousel = [];
        
        if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
          try {
            const meta = JSON.parse(post.mediaUrl);
            finalType = meta.type || finalType;
            finalCarousel = meta.carouselItems || [];
            finalMedia = meta.mediaUrl || (finalCarousel.length > 0 ? finalCarousel[0] : '');
          } catch (e) {
            console.warn("⚠️ Metadata parse failed");
          }
        }

        const SERVER_PUBLIC_URL = process.env.API_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 5001}`);
        
        if (finalMedia && finalMedia.startsWith('/uploads/')) {
          finalMedia = `${SERVER_PUBLIC_URL}${finalMedia}`;
        }
        
        const _updatePost = async (id, fields) => _sb.from('scheduled_posts').update({ ...fields, updatedAt: new Date().toISOString() }).eq('id', id);

        const postId = post.id;
        
        let existingContainerId = null;
        if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
          try {
            const meta = JSON.parse(post.mediaUrl);
            existingContainerId = meta.igContainerId;
          } catch (e) {}
        }

        console.log(`Calling publishInstagramContent with existingContainerId: ${existingContainerId}...`);
        const publishResult = await publishInstagramContent(post.userId, {
          type: finalType,
          mediaUrl: finalMedia,
          caption: post.caption,
          carouselItems: finalCarousel,
          containerId: existingContainerId
        });

        console.log('Publish result:', publishResult);

        if (publishResult.status === 'IG_PROCESSING') {
          console.log(`⏳ Meta is still processing Post ${postId}. Container: ${publishResult.containerId}`);
          continue;
        }

        const publishedId = publishResult.id;
        const liveUrl = publishResult.url;
        
        let requireFollow = false, unfollowedResponse = '', publicReply = '', automationStatus = 'Active';
        let openingMessage = false, openingMessageText = '', openingMessageButton = '', buttons = [];

        if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
          try {
            const meta = JSON.parse(post.mediaUrl);
            requireFollow = meta.requireFollow || false;
            unfollowedResponse = meta.unfollowedResponse || "Hey! Please follow our account first to get the link! 😊";
            publicReply = meta.publicReply || "Check your DMs! 🚀 I've sent you the info.";
            automationStatus = meta.automationStatus || 'Active';
            openingMessage = meta.openingMessage || false;
            openingMessageText = meta.openingMessageText || '';
            openingMessageButton = meta.openingMessageButton || '';
            buttons = meta.buttons || [];
          } catch (e) {}
        }

        if (post.triggerKeyword && post.autoResponse && automationStatus === 'Active') {
          const campaign = new Campaign({
            userId: post.userId,
            name: `Auto: ${post.caption.substring(0, 20)}...`,
            trigger: post.triggerKeyword,
            response: post.autoResponse,
            status: 'Active',
            isAnyPost: false,
            postId: publishedId,
            platform: 'instagram',
            triggerOnComments: true,
            requireFollow,
            unfollowedResponse,
            publicReplyText: publicReply,
            openingMessage,
            openingMessageText,
            openingMessageButton,
            buttons
          });
          await campaign.save();
        }

        const updatedMediaUrl = JSON.stringify({ 
          mediaUrl: liveUrl,
          localMediaUrl: finalMedia, 
          instagramMediaId: publishedId 
        });

        await _updatePost(postId, { status: 'Posted', mediaUrl: updatedMediaUrl });
        console.log(`✅ SUCCESS: Post ${postId} is now LIVE on Instagram.`);

      } catch (postErr) {
        console.error(`❌ PUBLISH FAILED for Post ${post.id}:`, postErr.message);
      }
    }
  } catch (err) {
    console.error("🔥 CRITICAL WORKER ERROR:", err.message);
  }
}

runSchedulingWorker().catch(console.error);
