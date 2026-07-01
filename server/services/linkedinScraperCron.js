import { scrapeLatestLinkedInPosts } from '../utils/linkedinScraper.js';
import { rewriteLinkedInPost } from '../utils/aiRewriter.js';
import { publishLinkedInContent } from '../utils/linkedinApi.js';
import Settings from '../models/Settings.js';

const processedPosts = new Set();

/**
 * Runs the scraping and publishing cycle for LinkedIn.
 */
export async function runLinkedInScraperWorker() {
  console.log('📡 [ScraperCron] Starting LinkedIn Profile Scraper Worker...');

  const TARGET_PROFILE_URL = process.env.LINKEDIN_RSS_FEED_URL;
  
  const DEFAULT_HEADER = process.env.LINKEDIN_DEFAULT_HEADER || '📢 Industry Update:\n';
  const DEFAULT_FOOTER = process.env.LINKEDIN_DEFAULT_FOOTER || '\n\n#CompanyUpdate #Automation';
  
  try {
    if (!TARGET_PROFILE_URL) {
      console.log('📡 [ScraperCron] Missing LINKEDIN_RSS_FEED_URL in .env. Skipping.');
      return;
    }
    const posts = await scrapeLatestLinkedInPosts(TARGET_PROFILE_URL);
    
    if (!posts || posts.length === 0) {
      console.log('📡 [ScraperCron] No new posts found or scraper not configured.');
      return;
    }

    const settings = await Settings.findOne({ linkedinAccessToken: { $exists: true, $ne: null } });
    
    if (!settings) {
      console.log('⚠️ [ScraperCron] No user with a connected LinkedIn account found. Skipping publish.');
      return;
    }

    const userId = settings.userId;
    const workspaceId = settings.workspaceId;

    for (const post of posts) {
      if (processedPosts.has(post.id)) {
        continue; // Already processed
      }

      console.log(`📡 [ScraperCron] Processing new post: ${post.id}`);

      const rewrittenText = await rewriteLinkedInPost(post.text, DEFAULT_HEADER, DEFAULT_FOOTER);

      console.log(`📡 [ScraperCron] Post rewritten. Publishing to company page...`);

      const formattedPost = {
        id: post.id,
        caption: rewrittenText,
        mediaUrl: post.mediaUrl, // image or video URL
        type: post.mediaUrl ? (post.mediaUrl.includes('.mp4') ? 'video' : 'image') : 'text'
      };

      try {
        await publishLinkedInContent(userId, formattedPost, workspaceId);
        console.log(`✅ [ScraperCron] Successfully republished scraped post: ${post.id}`);
        processedPosts.add(post.id);
      } catch (pubErr) {
        console.error(`❌ [ScraperCron] Failed to publish post ${post.id}:`, pubErr.message);
      }
    }
  } catch (error) {
    console.error('❌ [ScraperCron] Error in scraper worker:', error.message);
  }
}
