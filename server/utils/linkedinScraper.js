import axios from 'axios';

/**
 * Scrapes the latest posts from a LinkedIn profile.
 * 
 * Note: Direct scraping of LinkedIn is blocked. This utility uses a third-party API 
 * structure (like RapidAPI LinkedIn Data API or PhantomBuster).
 * 
 * @param {string} profileUrl - The LinkedIn profile URL to scrape
 * @returns {Promise<Array>} - Array of post objects { id, text, mediaUrl, postUrl }
 */
export async function scrapeLatestLinkedInPosts(profileUrl) {
  // Replace this with your actual scraping API URL (e.g., from RapidAPI)
  const SCRAPING_API_URL = process.env.LINKEDIN_SCRAPING_API_URL || '';
  const SCRAPING_API_KEY = process.env.LINKEDIN_SCRAPING_API_KEY || '';

  if (!SCRAPING_API_URL || !SCRAPING_API_KEY) {
    console.warn('⚠️ [Scraper] Missing LINKEDIN_SCRAPING_API_URL or LINKEDIN_SCRAPING_API_KEY in .env');
    console.warn('⚠️ [Scraper] Returning empty array. Please configure a third-party scraper (e.g., RapidAPI) to fetch actual data.');
    
    // For testing purposes, you could return a mocked post here
    // return [{
    //   id: 'urn:li:activity:7476193793088724993',
    //   text: 'Sample post from Sujata Sangwan! #company #update',
    //   mediaUrl: '',
    //   postUrl: 'https://www.linkedin.com/feed/update/urn:li:activity:7476193793088724993/'
    // }];
    return [];
  }

  try {
    const response = await axios.get(SCRAPING_API_URL, {
      headers: {
        'x-api-key': SCRAPING_API_KEY
      },
      params: {
        url: profileUrl
      }
    });

    // Map the response based on your chosen API's format
    // This is a generic mapping example
    const posts = response.data.data || [];
    
    return posts.map(post => ({
      id: post.urn || post.id,
      text: post.text || post.content || '',
      mediaUrl: post.image_url || post.video_url || '',
      postUrl: post.url || `https://www.linkedin.com/feed/update/${post.urn}`
    }));
  } catch (error) {
    console.error('❌ [Scraper] Error fetching LinkedIn posts:', error.message);
    return [];
  }
}
