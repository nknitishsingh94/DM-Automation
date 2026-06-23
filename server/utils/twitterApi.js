import { supabase } from './supabase.js';
import { TwitterApi } from 'twitter-api-v2';

export async function publishTwitterContent(userId, post, workspaceId) {
  try {
    const { data: userSettings, error: setErr } = await supabase
      .from('settings')
      .select('*')
      .eq('userId', userId)
      .limit(1);

    if (setErr || !userSettings || userSettings.length === 0) {
      throw new Error("Settings not found for user");
    }

    const settings = userSettings[0];
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
      try {
        let mediaUrl = url;
        try {
          const parsed = JSON.parse(url);
          mediaUrl = parsed.mediaUrl || parsed.url || mediaUrl;
        } catch(e) {}
        
        if (mediaUrl) {
          const mediaRes = await fetch(mediaUrl);
          const buffer = await mediaRes.arrayBuffer();
          const mimeType = mediaRes.headers.get('content-type') || 'image/jpeg';
          return await finalClient.v1.uploadMedia(Buffer.from(buffer), { mimeType });
        }
      } catch (mediaErr) {
        console.error("Twitter Media Upload Error:", mediaErr);
        throw new Error("Media upload failed: " + mediaErr.message);
      }
      return null;
    };

    let mediaIds = [];
    if (post.type === 'carousel' && post.carouselItems && post.carouselItems.length > 0) {
      for (const itemUrl of post.carouselItems.slice(0, 4)) {
        const mId = await uploadMedia(itemUrl);
        if (mId) mediaIds.push(mId);
      }
    } else if (post.mediaUrl && post.mediaUrl !== 'null' && post.mediaUrl !== '{}') {
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
        if (tPost.mediaUrl && tPost.mediaUrl !== 'null' && tPost.mediaUrl !== '{}') {
          const tMediaId = await uploadMedia(tPost.mediaUrl);
          if (tMediaId) tPayload.media = { media_ids: [tMediaId] };
        }
        tweets.push(tPayload);
      }

      tweetRes = await finalClient.v2.tweetThread(tweets);
      tweetRes = { data: tweetRes[0].data }; // Use the first tweet for the returned URL
    } else {
      const tweetPayload = { text: post.caption || ' ' };
      if (mediaIds.length > 0) {
        tweetPayload.media = { media_ids: mediaIds };
      }
      tweetRes = await finalClient.v2.tweet(tweetPayload);
    }

    return {
      status: 'PUBLISHED',
      url: `https://twitter.com/user/status/${tweetRes.data.id}`
    };
  } catch (err) {
    console.error("Twitter Publish Error:", err);
    throw err;
  }
}
