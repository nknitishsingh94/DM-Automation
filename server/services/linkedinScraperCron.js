import { scrapeLatestLinkedInPosts } from '../utils/linkedinScraper.js';
import { rewriteLinkedInPost } from '../utils/aiRewriter.js';
import { publishLinkedInContent } from '../utils/linkedinApi.js';
import Settings from '../models/Settings.js';

// In-memory cache to prevent republishing the same post during the server lifecycle
// In production, this should be stored in a database table (e.g., ScrapedPostsLog)
const processedPosts = new Set();

/**
 * Runs the scraping and publishing cycle for LinkedIn.
 */
export async function runLinkedInScraperWorker() {
  console.log('📡 [ScraperCron] Starting LinkedIn Profile Scraper Worker...');

  // Configuration for the target profile
  const TARGET_PROFILE_URL = 'https://www.linkedin.com/in/sujata-sangwan/';
  
  // These could be fetched from the database per-user configuration in a multi-tenant system.
  const DEFAULT_HEADER = process.env.LINKEDIN_DEFAULT_HEADER || '📢 Industry Update:\n';
  const DEFAULT_FOOTER = process.env.LINKEDIN_DEFAULT_FOOTER || '\n\n#CompanyUpdate #Automation';
  
  try {
    // 1. Fetch latest posts
    const posts = await scrapeLatestLinkedInPosts(TARGET_PROFILE_URL);
    
    if (!posts || posts.length === 0) {
      console.log('📡 [ScraperCron] No new posts found or scraper not configured.');
      return;
    }

    // 2. We need a target userId / workspaceId to post to.
    // For this generic cron, we'll try to find an admin or specific user who has LinkedIn connected.
    // In a fully developed feature, you'd map TARGET_PROFILE_URL -> [userId, workspaceId] in a DB table.
    const settings = await Settings.findOne({ linkedinAccessToken: { $exists: true, $ne: null } });
    
    if (!settings) {
      console.log('⚠️ [ScraperCron] No user with a connected LinkedIn account found. Skipping publish.');
      return;
    }

    const userId = settings.userId;
    const workspaceId = settings.workspaceId;

    // Process posts
    for (const post of posts) {
      if (processedPosts.has(post.id)) {
        continue; // Already processed
      }

      console.log(`📡 [ScraperCron] Processing new post: ${post.id}`);

      // 3. Rewrite content with AI constraints
      const rewrittenText = await rewriteLinkedInPost(post.text, DEFAULT_HEADER, DEFAULT_FOOTER);

      console.log(`📡 [ScraperCron] Post rewritten. Publishing to company page...`);

      // 4. Publish to LinkedIn Company Page
      // The publishLinkedInContent expects a post object with specific fields
      const formattedPost = {
        id: post.id,
        caption: rewrittenText,
        mediaUrl: post.mediaUrl, // image or video URL
        type: post.mediaUrl ? (post.mediaUrl.includes('.mp4') ? 'video' : 'image') : 'text'
      };

      try {
        await publishLinkedInContent(userId, formattedPost, workspaceId);
        console.log(`✅ [ScraperCron] Successfully republished scraped post: ${post.id}`);
        // Mark as processed
        processedPosts.add(post.id);
      } catch (pubErr) {
        console.error(`❌ [ScraperCron] Failed to publish post ${post.id}:`, pubErr.message);
      }
    }
  } catch (error) {
    console.error('❌ [ScraperCron] Error in scraper worker:', error.message);
  }
}
