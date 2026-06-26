import { supabase } from './supabase.js';
import { TwitterApi } from 'twitter-api-v2';

export async function publishTwitterContent(userId, post, workspaceId) {
  try {
    // ── Settings Lookup: prefer workspaceId row, fall back to userId row ──
    // This matches the pattern used by other platform utilities (linkedinApi, etc.)
    let settingsQuery = supabase.from('settings').select('*').limit(1);
    if (workspaceId) {
      settingsQuery = settingsQuery.eq('workspaceId', workspaceId);
    } else {
      settingsQuery = settingsQuery.eq('userId', userId);
    }

    const { data: userSettings, error: setErr } = await settingsQuery;

    if (setErr || !userSettings || userSettings.length === 0) {
      // If workspaceId lookup failed, try userId as fallback
      if (workspaceId) {
        const { data: fallbackSettings, error: fallbackErr } = await supabase
          .from('settings')
          .select('*')
          .eq('userId', userId)
          .limit(1);
        if (fallbackErr || !fallbackSettings || fallbackSettings.length === 0) {
          throw new Error("Settings not found. Please reconnect your Twitter account.");
        }
        return _doPublish(fallbackSettings[0], post);
      }
      throw new Error("Settings not found for user");
    }

    return await _doPublish(userSettings[0], post);
  } catch (err) {
    console.error("Twitter Publish Error:", err);
    throw err;
  }
}

async function _doPublish(settings, post) {
  let virtualFields = {};
  if (typeof settings.connectedPageName === 'string' && settings.connectedPageName.startsWith('{')) {
    try { virtualFields = JSON.parse(settings.connectedPageName); } catch(e) {}
  } else if (settings.connectedPageName && typeof settings.connectedPageName === 'object') {
    virtualFields = settings.connectedPageName;
  }

  const twitterAccessToken = settings.twitterAccessToken || virtualFields.twitterAccessToken;
  const twitterAccessSecret = settings.twitterRefreshToken || virtualFields.twitterRefreshToken;

  if (!twitterAccessToken || !twitterAccessSecret) {
    throw new Error("Twitter is not connected. Missing access token or secret. Please reconnect your account.");
  }

  const appKey = process.env.TWITTER_API_KEY;
  const appSecret = process.env.TWITTER_API_SECRET;

  if (!appKey || !appSecret) {
    throw new Error('Twitter OAuth 1.0a credentials missing on server. Set TWITTER_API_KEY and TWITTER_API_SECRET.');
  }

  const finalClient = new TwitterApi({
    appKey: appKey,
    appSecret: appSecret,
    accessToken: twitterAccessToken,
    accessSecret: twitterAccessSecret
  });

  const uploadMedia = async (url) => {
    if (!url || url === 'null' || url === '{}' || url === '') return null;
    try {
      let mediaUrl = url;
      // Unwrap JSON-encoded mediaUrl
      if (typeof mediaUrl === 'string' && mediaUrl.startsWith('{')) {
        try {
          const parsed = JSON.parse(mediaUrl);
          mediaUrl = parsed.mediaUrl || parsed.url || mediaUrl;
        } catch(e) {}
      }

      if (!mediaUrl || mediaUrl.startsWith('blob:') || mediaUrl.startsWith('http') === false) {
        console.warn('⚠️ [Twitter] Skipping invalid media URL:', mediaUrl);
        return null;
      }

      console.log(`📎 [Twitter] Uploading media: ${mediaUrl}`);
      const mediaRes = await fetch(mediaUrl);
      if (!mediaRes.ok) throw new Error(`Failed to fetch media: ${mediaRes.status} ${mediaRes.statusText}`);
      const buffer = await mediaRes.arrayBuffer();
      const mimeType = mediaRes.headers.get('content-type') || 'image/jpeg';
      return await finalClient.v1.uploadMedia(Buffer.from(buffer), { mimeType });
    } catch (mediaErr) {
      console.error("Twitter Media Upload Error:", mediaErr.message);
      throw new Error("Media upload failed: " + mediaErr.message);
    }
  };

  // Resolve carousel items — support both post.carouselItems and finalCarousel patterns
  const carouselItems = post.carouselItems || [];
  const hasMedia = (post.mediaUrl && post.mediaUrl !== 'null' && post.mediaUrl !== '{}' && post.mediaUrl !== '');
  const hasCarousel = (carouselItems.length > 0);

  let mediaIds = [];
  if (post.type === 'carousel' && hasCarousel) {
    // Twitter supports up to 4 images in a single tweet
    for (const itemUrl of carouselItems.slice(0, 4)) {
      const mId = await uploadMedia(itemUrl);
      if (mId) mediaIds.push(mId);
    }
  } else if (hasMedia) {
    const mId = await uploadMedia(post.mediaUrl);
    if (mId) mediaIds.push(mId);
  }

  const isThread = post.threadPosts && Array.isArray(post.threadPosts) && post.threadPosts.length > 0;
  let tweetRes;

  if (isThread) {
    const tweets = [];
    const firstTweet = { text: post.caption || ' ' };
    if (mediaIds.length > 0) firstTweet.media = { media_ids: mediaIds };
    tweets.push(firstTweet);

    for (const tPost of post.threadPosts) {
      const tPayload = { text: tPost.caption || ' ' };
      const tMediaUrl = tPost.mediaUrl || '';
      if (tMediaUrl && tMediaUrl !== 'null' && tMediaUrl !== '{}') {
        const tMediaId = await uploadMedia(tMediaUrl);
        if (tMediaId) tPayload.media = { media_ids: [tMediaId] };
      }
      tweets.push(tPayload);
    }

    tweetRes = await finalClient.v2.tweetThread(tweets);
    tweetRes = { data: tweetRes[0].data }; // Use the first tweet for the returned URL
  } else {
    const tweetText = post.caption || ' ';
    const tweetPayload = { text: tweetText };
    if (mediaIds.length > 0) {
      tweetPayload.media = { media_ids: mediaIds };
    }
    tweetRes = await finalClient.v2.tweet(tweetPayload);
  }

  const tweetId = tweetRes.data.id;
  console.log(`✅ [Twitter] Tweet published successfully! ID: ${tweetId}`);

  return {
    status: 'PUBLISHED',
    url: `https://twitter.com/i/web/status/${tweetId}`,
    id: tweetId
  };
}
