import Parser from 'rss-parser';

const parser = new Parser();

/**
 * Scrapes the latest posts from a LinkedIn profile using an RSS feed.
 * 
 * @param {string} feedUrl - The RSS feed URL for the LinkedIn profile (e.g. from rss.app)
 * @returns {Promise<Array>} - Array of post objects { id, text, mediaUrl, postUrl }
 */
export async function scrapeLatestLinkedInPosts(feedUrl) {
  // If no specific feed URL is provided, fallback to env var
  const rssUrl = feedUrl || process.env.LINKEDIN_RSS_FEED_URL || '';

  if (!rssUrl) {
    console.warn('⚠️ [Scraper] Missing LINKEDIN_RSS_FEED_URL in .env');
    return [];
  }

  try {
    const feed = await parser.parseURL(rssUrl);
    const posts = feed.items || [];
    
    return posts.map(post => ({
      id: post.guid || post.link,
      text: post.contentSnippet || post.content || post.title || '',
      mediaUrl: '', // RSS feeds usually embed media in content, we might extract it if needed
      postUrl: post.link
    }));
  } catch (error) {
    console.error('❌ [Scraper] Error fetching RSS feed:', error.message);
    return [];
  }
}
