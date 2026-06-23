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
    const twitterRefreshToken = settings.twitterRefreshToken || virtualFields.twitterRefreshToken;

    if (!twitterAccessToken || !twitterRefreshToken) {
      throw new Error("Twitter is not connected. Missing access or refresh token.");
    }

    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error('Twitter OAuth credentials missing on server');
    }

    const client = new TwitterApi({
      clientId: clientId,
      clientSecret: clientSecret
    });

    const { client: refreshedClient, accessToken, refreshToken: newRefreshToken } = await client.refreshOAuth2Token(twitterRefreshToken);

    virtualFields.twitterAccessToken = accessToken;
    virtualFields.twitterRefreshToken = newRefreshToken || twitterRefreshToken;
    
    await supabase.from('settings').update({
      connectedPageName: JSON.stringify(virtualFields)
    }).eq('userId', userId);

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
      }
      return null;
    };

    let mainMediaId = null;
    if (post.mediaUrl && post.mediaUrl !== 'null' && post.mediaUrl !== '{}') {
      mainMediaId = await uploadMedia(post.mediaUrl);
    }

    const isThread = post.threadPosts && Array.isArray(post.threadPosts) && post.threadPosts.length > 0;
    let tweetRes;

    if (isThread) {
      const tweets = [];
      const firstTweet = { text: post.caption || ' ' };
      if (mainMediaId) firstTweet.media = { media_ids: [mainMediaId] };
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
      if (mainMediaId) {
        tweetPayload.media = { media_ids: [mainMediaId] };
      }
      tweetRes = await finalClient.v2.tweet(tweetPayload);
    }

    return {
      status: 'PUBLISHED',
      url: `https://twitter.com/user/status/${tweetRes.data.id}`
    };
  } catch (err) {
    console.error("Twitter Publish Error:", err);
    return {
      status: 'FAILED',
      error: err.message
    };
  }
}
