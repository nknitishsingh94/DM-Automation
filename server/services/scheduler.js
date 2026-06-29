import ScheduledPost from '../models/ScheduledPost.js';
import Settings from '../models/Settings.js';
import { publishInstagramContent, publishFacebookContent } from '../utils/metaApi.js';
import { publishYouTubeVideo } from '../utils/youtubeApi.js';
import { publishGoogleBusinessContent } from '../utils/googleBusinessApi.js';
import { publishTwitterContent } from '../utils/twitterApi.js';
import { publishPinterestContent } from '../utils/pinterestApi.js';
import { publishLinkedInContent } from '../utils/linkedinApi.js';
import { supabase } from '../utils/supabase.js';

export async function runSchedulingWorker() {
  try {
    const now = new Date();
    const nowISO = now.toISOString();

    console.log(`📡 [Worker] Checking posts due before: ${nowISO}`);

    const duePosts = await ScheduledPost.find({
      scheduledFor: { $lte: nowISO },
      status: { $in: ['Scheduled', 'Processing'] }
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
          .update({ status: 'Scheduled', updatedAt: new Date().toISOString() })
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

    // Helper: Convert proxy URLs to direct Supabase public CDN URLs
    // Meta Graph API does NOT follow HTTP 302 redirects, so we must resolve
    // /api/storage/view?path=... → https://<supabase>/storage/v1/object/public/media/...
    const resolveMediaUrl = (url) => {
      if (!url || typeof url !== 'string') return url;
      // Already a direct Supabase public URL — keep as-is
      if (url.includes('.supabase.co/storage/v1/object/public/')) return url;
      // Proxy URL: /api/storage/view?path=<filename>
      const proxyMatch = url.match(/\/api\/storage\/view\?path=([^&]+)/);
      if (proxyMatch) {
        const path = decodeURIComponent(proxyMatch[1]);
        const supabaseHost = process.env.SUPABASE_URL
          ? new URL(process.env.SUPABASE_URL).hostname
          : 'vsrtgwvudallfqnozifu.supabase.co';
        const resolved = `https://${supabaseHost}/storage/v1/object/public/media/${path}`;
        console.log(`🔗 [Worker] Resolved proxy → direct: ${resolved}`);
        return resolved;
      }
      return url;
    };

    for (let post of duePosts) {
      console.log(`\n===========================================`);
      console.log(`⚙️ [Worker] Processing Post ID: ${post._id}`);
      
      // Parse JSON mediaUrl if it exists
      if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
        try {
          const parsedMeta = JSON.parse(post.mediaUrl);
          post.type = parsedMeta.type || 'image';
          post.carouselItems = parsedMeta.carouselItems || [];
          post.mediaUrl = parsedMeta.mediaUrl || '';
          post.pinterestTitle = parsedMeta.pinterestTitle;
          post.pinterestLink = parsedMeta.pinterestLink;
          post.pinterestBoard = parsedMeta.pinterestBoard;
          post.pinterestAltText = parsedMeta.pinterestAltText;
        } catch (e) {
          console.warn(`⚠️ [Worker] Failed to parse mediaUrl JSON for post ${post._id}`);
        }
      }

      // ✅ CRITICAL FIX: Resolve proxy URLs → direct Supabase CDN URLs
      // Meta Graph API cannot follow 302 redirects — must get the actual file URL
      post.mediaUrl = resolveMediaUrl(post.mediaUrl);
      if (Array.isArray(post.carouselItems)) {
        post.carouselItems = post.carouselItems.map(resolveMediaUrl);
      }
      console.log(`📎 [Worker] Final mediaUrl for Meta: ${post.mediaUrl || '(none)'}`);

      
      try {
        if (!post.platform || (post.platform !== 'instagram' && post.platform !== 'facebook' && post.platform !== 'youtube' && post.platform !== 'google-business' && post.platform !== 'twitter' && post.platform !== 'pinterest' && post.platform !== 'linkedin')) {
          console.log(`⏭️ [Worker] Skipping post ${post._id} - Platform is not supported (${post.platform})`);
          await safeUpdate(post.id, { status: 'Failed', errorLog: 'Platform not supported via this worker.' });
          await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Failed', errorLog: 'Unsupported platform.' });
          continue;
        }

        // If a post is Processing but has no containerId, it means the client is still uploading the media.
        // We give the client 5 minutes to finish uploading and change status to 'Scheduled'.
        if (post.status === 'Processing' && !post.containerId) {
          const postAgeMinutes = (Date.now() - new Date(post.createdAt || post.updatedAt).getTime()) / (1000 * 60);
          if (postAgeMinutes < 5) {
            console.log(`⏳ [Worker] Skipping post ${post._id} - Client is still uploading media (Processing).`);
            continue;
          } else {
            console.log(`⚠️ [Worker] Post ${post._id} stuck in Processing for > 5 mins. Proceeding anyway, but likely to fail if URL is invalid.`);
          }
        }


        const settingsQuery = { userId: post.userId };
        if (post.workspaceId) settingsQuery.workspaceId = post.workspaceId;
        const settings = await Settings.findOne(settingsQuery);
        
        if (!settings) {
          console.log(`❌ [Worker] Failed post ${post._id} - Missing Settings`);
          await safeUpdate(post.id, { status: 'Failed', errorLog: 'Settings missing. Please reconnect.' });
          await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Failed', errorLog: 'Settings missing' });
          continue;
        }

        if (post.platform === 'youtube' && !settings.youtubeAccessToken) {
          console.log(`❌ [Worker] Failed post ${post._id} - Missing YouTube Token`);
          await safeUpdate(post.id, { status: 'Failed', errorLog: 'YouTube API tokens missing. Please reconnect.' });
          await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Failed', errorLog: 'Tokens missing' });
          continue;
        }

        if (post.platform === 'google-business' && !settings.googleBusinessAccessToken) {
          console.log(`❌ [Worker] Failed post ${post._id} - Missing Google Business Token`);
          await safeUpdate(post.id, { status: 'Failed', errorLog: 'Google Business API tokens missing. Please reconnect.' });
          await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Failed', errorLog: 'Tokens missing' });
          continue;
        }

        if (post.platform === 'pinterest' && !settings.pinterestAccessToken) {
          console.log(`❌ [Worker] Failed post ${post._id} - Missing Pinterest Token`);
          await safeUpdate(post.id, { status: 'Failed', errorLog: 'Pinterest API tokens missing. Please reconnect.' });
          await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Failed', errorLog: 'Tokens missing' });
          continue;
        }

        if (post.platform === 'linkedin' && !settings.linkedinAccessToken) {
          console.log(`❌ [Worker] Failed post ${post._id} - Missing LinkedIn Token`);
          await safeUpdate(post.id, { status: 'Failed', errorLog: 'LinkedIn API tokens missing. Please reconnect.' });
          await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Failed', errorLog: 'Tokens missing' });
          continue;
        }

        if (post.platform === 'twitter' && !settings.twitterAccessToken) {
          console.log(`❌ [Worker] Failed post ${post._id} - Missing Twitter Token`);
          await safeUpdate(post.id, { status: 'Failed', errorLog: 'Twitter API tokens missing. Please reconnect.' });
          await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Failed', errorLog: 'Tokens missing' });
          continue;
        }

        if ((post.platform === 'instagram' || post.platform === 'facebook') && (!settings.instagramAccessToken || !settings.businessAccountId)) {
          console.log(`❌ [Worker] Failed post ${post._id} - Missing Meta Tokens`);
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
                let publishRes;
                if (post.platform === 'facebook') {
                  publishRes = await publishFacebookContent(post.userId, { 
                    type: post.type, 
                    mediaUrl: post.mediaUrl, 
                    caption: post.caption, 
                    carouselItems: post.carouselItems || [],
                    containerId: post.containerId 
                  }, post.workspaceId);
                } else {
                  publishRes = await publishInstagramContent(post.userId, { 
                    type: post.type, 
                    mediaUrl: post.mediaUrl, 
                    caption: post.caption, 
                    carouselItems: post.carouselItems || [],
                    containerId: post.containerId 
                  }, post.workspaceId);
                }
                
                if (publishRes && publishRes.status === 'PUBLISHED') {
                  const finalLiveUrl = publishRes.url || post.mediaUrl;
                  await safeUpdate(post.id, { 
                    status: 'Posted', 
                    publishedUrl: finalLiveUrl, 
                    publishedAt: new Date().toISOString(),
                    containerId: null // clear it
                  });
                  await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Posted', publishedUrl: finalLiveUrl });
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
                 console.log(`⚠️ [Worker] Container ${post.containerId} timed out. Resetting to Scheduled.`);
                 await safeUpdate(post.id, { status: 'Scheduled', containerId: null });
                 await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Scheduled' });
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
        console.log(`🎬 [Worker] Starting initial publish sequence for ${post._id} on ${post.platform}...`);
        await safeUpdate(post.id, { status: 'Processing' });
        await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Processing' });

        let result;
        if (post.platform === 'facebook') {
          result = await publishFacebookContent(post.userId, {
            type: post.type,
            mediaUrl: post.mediaUrl,
            caption: post.caption,
            carouselItems: post.carouselItems || []
          }, post.workspaceId);
        } else if (post.platform === 'youtube') {
          result = await publishYouTubeVideo(post.userId, {
            mediaUrl: post.mediaUrl,
            caption: post.caption,
          }, settings);
        } else if (post.platform === 'google-business') {
          result = await publishGoogleBusinessContent(post.userId, post, post.workspaceId);
        } else if (post.platform === 'twitter') {
          result = await publishTwitterContent(post.userId, post, post.workspaceId);
        } else if (post.platform === 'pinterest') {
          result = await publishPinterestContent(post.userId, post, post.workspaceId);
        } else if (post.platform === 'linkedin') {
          result = await publishLinkedInContent(post.userId, post, post.workspaceId);
        } else {
          result = await publishInstagramContent(post.userId, {
            type: post.type,
            mediaUrl: post.mediaUrl,
            caption: post.caption,
            carouselItems: post.carouselItems || []
          }, post.workspaceId);
        }

        if (result && result.status === 'PUBLISHED') {
          const finalLiveUrl = result.url || post.mediaUrl;
          await safeUpdate(post.id, { 
            status: 'Posted', 
            publishedUrl: finalLiveUrl, 
            publishedAt: new Date().toISOString() 
          });
          await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Posted', publishedUrl: finalLiveUrl });
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
           newStatus = 'Scheduled'; // Using Scheduled to retry later since Retrying is invalid in schema
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
