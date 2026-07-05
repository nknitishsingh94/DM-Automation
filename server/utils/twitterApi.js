import { supabase } from './supabase.js';
import { TwitterApi } from 'twitter-api-v2';

export async function publishTwitterContent(userId, post, workspaceId) {
  try {
    let settingsQuery = supabase.from('settings').select('*').limit(1);
    if (workspaceId) {
      settingsQuery = settingsQuery.eq('workspaceId', workspaceId);
    } else {
      settingsQuery = settingsQuery.eq('userId', userId);
    }

    const { data: userSettings, error: setErr } = await settingsQuery;

    if (setErr || !userSettings || userSettings.length === 0) {
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
    
    // Parse the Twitter V2 API Error response
    const errCode = err.code || err.status;
    const errDetail = err.data?.detail?.toLowerCase() || '';
    const errTitle = err.data?.title?.toLowerCase() || '';
    
    // 1. Credits Depleted
    if (errCode === 402 || (err.data && err.data.type === 'https://api.twitter.com/2/problems/credits')) {
      const detail = err.data?.detail || 'Your Twitter account does not have enough credits to publish. Please add credits to your Twitter account and try again.';
      throw new Error(`Twitter Credits Depleted: ${detail}`);
    }
    
    // 2. Duplicate Tweet
    if (errCode === 403 && (errDetail.includes('duplicate') || errTitle.includes('duplicate') || errTitle.includes('forbidden'))) {
      if (errDetail.includes('duplicate')) {
         throw new Error("X (Twitter) does not allow duplicate tweets. Modify the text, even slightly.");
      }
    }

    // 3. Rate Limit Hit
    if (errCode === 429) {
      throw new Error("Rate limit hit. Please wait 10 minutes. Reduce posting frequency.");
    }

    // 4. Missing Scope / Unauthorized
    if (errCode === 401 || errCode === 403) {
       if (errDetail.includes('scope') || errTitle.includes('unauthorized') || errTitle.includes('forbidden')) {
         throw new Error("Missing tweet.write scope or token expired. Reconnect the account with all required permissions.");
       }
    }
    
    // 5. Tweet too long
    if (errCode === 400 && (errDetail.includes('too long') || errTitle.includes('too long'))) {
      throw new Error("Tweet text is too long. Twitter's limit is 280 characters. Note: URLs count as 23 characters.");
    }

    throw new Error(err.data?.detail || err.message || "Failed to publish to Twitter");
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
  const twitterRefreshToken = settings.twitterRefreshToken || virtualFields.twitterRefreshToken;

  if (!twitterAccessToken || !twitterRefreshToken) {
    throw new Error("Twitter is not connected. Missing access token or refresh token. Please reconnect your account.");
  }

  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Twitter OAuth 2.0 credentials missing on server. Set TWITTER_CLIENT_ID and TWITTER_CLIENT_SECRET.');
  }

  let finalClient = new TwitterApi(twitterAccessToken);

  try {
    const refreshClient = new TwitterApi({ clientId, clientSecret });
    const { client: refreshedClient, accessToken, refreshToken } = await refreshClient.refreshOAuth2Token(twitterRefreshToken);
    
    finalClient = refreshedClient;

    await supabase.from('settings')
      .update({ 
        twitterAccessToken: accessToken, 
        twitterRefreshToken: refreshToken 
      })
      .eq('id', settings.id);
      
    console.log(`🔄 [Twitter] Successfully refreshed OAuth 2.0 token for user ${settings.userId}`);
  } catch (refreshErr) {
    console.warn(`⚠️ [Twitter] Token refresh failed (maybe still valid). Proceeding with existing token. Error: ${refreshErr.message}`);
  }

  const isThread = post.threadPosts && Array.isArray(post.threadPosts) && post.threadPosts.length > 0;
  let tweetRes;

  if (isThread) {
    const tweets = [];
    const firstTweet = { text: post.caption || ' ' };
    tweets.push(firstTweet);

    for (const tPost of post.threadPosts) {
      const tPayload = { text: tPost.caption || ' ' };
      tweets.push(tPayload);
    }

    tweetRes = await finalClient.v2.tweetThread(tweets);
    tweetRes = { data: tweetRes[0].data }; // Use the first tweet for the returned URL
  } else {
    const tweetText = post.caption || ' ';
    const tweetPayload = { text: tweetText };
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
