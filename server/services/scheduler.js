import ScheduledPost from '../models/ScheduledPost.js';
import Settings from '../models/Settings.js';
import { publishInstagramContent } from '../utils/metaApi.js';
import { supabase } from '../utils/supabase.js';

export async function runSchedulingWorker() {
  try {
    const now = new Date();
    const nowISO = now.toISOString();

    console.log(`📡 [Worker] Checking posts due before: ${nowISO}`);

    const duePosts = await ScheduledPost.find({
      scheduledFor: { $lte: nowISO },
      status: { $in: ['Scheduled', 'Retrying', 'Processing'] }
    });

    console.log(`🔥 [Worker] Processing ${duePosts.length} posts...`);

    const _updatePost = async (id, fields) => {
      const { data, error } = await supabase.from('scheduled_posts').update({ ...fields, updatedAt: new Date().toISOString() }).eq('id', id);
      if (error) throw new Error(error.message);
      return data;
    };

    // ── Safety net: reset any "Processing" posts that have been orphaned ──
    {
      const STUCK_THRESHOLD_MINUTES = 10;
      const stuckBoundary = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000).toISOString();
      try {
        const { data: stuckData, error: stuckErr } = await supabase
          .from('scheduled_posts')
          .update({ status: 'Retrying', updatedAt: new Date().toISOString() })
          .eq('status', 'Processing')
          .lt('updatedAt', stuckBoundary)
          .select('id');
        if (stuckErr) {
          console.warn('⚠️ [Worker] Safety-net reset failed:', stuckErr.message);
        }
      } catch (resetErr) {
        console.warn('⚠️ [Worker] Safety-net reset error:', resetErr.message);
      }
    }

    const safeUpdate = async (id, fields) => {
      try {
        await _updatePost(id, fields);
      } catch (upErr) {
        console.error(`⚠️ [Worker] _updatePost silently failed for post ${id}:`, upErr.message || upErr);
      }
    };

    if (duePosts.length === 0) return { skipped: true, reason: 'No posts due' };

    for (const post of duePosts) {
      console.log(`\n===========================================`);
      console.log(`⚙️ [Worker] Processing Post ID: ${post._id}`);
      
      try {
        if (!post.platform || post.platform !== 'instagram') {
          console.log(`⏭️ [Worker] Skipping post ${post._id} - Platform is not instagram (${post.platform})`);
          await safeUpdate(post.id, { status: 'Failed', errorLog: 'Only Instagram is supported via this worker.' });
          await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Failed', errorLog: 'Only Instagram is supported.' });
          continue;
        }

        const settingsQuery = { userId: post.userId };
        if (post.workspaceId) settingsQuery.workspaceId = post.workspaceId;
        const settings = await Settings.findOne(settingsQuery);
        
        if (!settings || !settings.instagramAccessToken || !settings.businessAccountId) {
          console.log(`❌ [Worker] Failed post ${post._id} - Missing Settings/Tokens`);
          await safeUpdate(post.id, { status: 'Failed', errorLog: 'Meta API tokens missing. Please reconnect.' });
          await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Failed', errorLog: 'Tokens missing' });
          continue;
        }

        // --- NEW ARCHITECTURE: Check Media Readiness First ---
        // If containerId exists but not published, we check readiness
        if (post.containerId && post.status === 'Processing') {
          console.log(`⏳ [Worker] Checking readiness for container ${post.containerId}...`);
          try {
            const { checkMediaReadiness } = await import('../utils/metaApi.js');
            const isReady = await checkMediaReadiness(post.containerId, settings.instagramAccessToken);
            
            if (isReady) {
              console.log(`🚀 [Worker] Container ${post.containerId} is READY. Publishing now...`);
              try {
                const publishRes = await publishInstagramContent(post.userId, { 
                  type: post.type, 
                  mediaUrl: post.mediaUrl, 
                  caption: post.caption, 
                  carouselItems: post.carouselItems || [],
                  containerId: post.containerId 
                }, post.workspaceId);
                
                if (publishRes && publishRes.status === 'PUBLISHED') {
                  const finalLiveUrl = publishRes.url || post.mediaUrl;
                  await safeUpdate(post.id, { 
                    status: 'Published', 
                    publishedUrl: finalLiveUrl, 
                    publishedAt: new Date().toISOString(),
                    containerId: null // clear it
                  });
                  await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Published', publishedUrl: finalLiveUrl });
                  console.log(`✅ [Worker] Post ${post._id} published successfully! URL: ${finalLiveUrl}`);
                }
              } catch (pubErr) {
                 if (pubErr.message && (pubErr.message.includes('not ready') || pubErr.message.includes('processing'))) {
                   console.log(`⏳ [Worker] Container ${post.containerId} STILL not ready during publish attempt. Waiting for next cycle.`);
                   await safeUpdate(post.id, { updatedAt: new Date().toISOString() });
                 } else {
                   throw pubErr;
                 }
              }
            } else {
              console.log(`⏳ [Worker] Container ${post.containerId} is STILL processing. Waiting for next cron cycle.`);
              const processingStart = new Date(post.updatedAt).getTime();
              if (Date.now() - processingStart > 15 * 60 * 1000) {
                 console.log(`⚠️ [Worker] Container ${post.containerId} timed out. Resetting to Retrying.`);
                 await safeUpdate(post.id, { status: 'Retrying', containerId: null });
                 await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Retrying' });
              }
            }
          } catch (readyErr) {
            console.error(`❌ [Worker] Error checking readiness for ${post._id}:`, readyErr.message);
            await safeUpdate(post.id, { status: 'Failed', errorLog: readyErr.message });
            await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Failed', errorLog: readyErr.message });
          }
          continue;
        }

        // --- Standard Publishing Flow (New Posts) ---
        console.log(`🎬 [Worker] Starting initial publish sequence for ${post._id}...`);
        await safeUpdate(post.id, { status: 'Processing' });
        await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Processing' });

        const result = await publishInstagramContent(post.userId, {
          type: post.type,
          mediaUrl: post.mediaUrl,
          caption: post.caption,
          carouselItems: post.carouselItems || []
        }, post.workspaceId);

        if (result && result.status === 'PUBLISHED') {
          const finalLiveUrl = result.url || post.mediaUrl;
          await safeUpdate(post.id, { 
            status: 'Published', 
            publishedUrl: finalLiveUrl, 
            publishedAt: new Date().toISOString() 
          });
          await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Published', publishedUrl: finalLiveUrl });
          console.log(`✅ [Worker] Post ${post._id} published successfully! URL: ${finalLiveUrl}`);
        } 
        else if (result && result.status === 'IG_PROCESSING' && result.containerId) {
          console.log(`⏳ [Worker] Post ${post._id} needs more time for Meta processing. Saved container ${result.containerId}`);
          await safeUpdate(post.id, { 
            status: 'Processing', 
            containerId: result.containerId 
          });
          await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Processing' });
        }

      } catch (err) {
        console.error(`❌ [Worker] Error processing post ${post._id}:`, err.message);
        
        let newStatus = 'Failed';
        if (err.message && (err.message.includes('timeout') || err.message.includes('network'))) {
           newStatus = 'Retrying';
        }
        
        await safeUpdate(post.id, { status: newStatus, errorLog: err.message });
        await ScheduledPost.findByIdAndUpdate(post._id, { status: newStatus, errorLog: err.message });
      }
    }
    
    console.log(`✅ [Worker] Completed cycle.`);
    return { success: true, processed: duePosts.length };
  } catch (err) {
    console.error('🔥 [Worker] Fatal crash:', err);
    return { error: err.message };
  }
}
