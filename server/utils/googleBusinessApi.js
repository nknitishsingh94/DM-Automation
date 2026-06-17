import axios from 'axios';
import Settings from '../models/Settings.js';

function parseGmbDateTime(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return {
    date: {
      year: d.getUTCFullYear(),
      month: d.getUTCMonth() + 1,
      day: d.getUTCDate()
    },
    time: {
      hours: d.getUTCHours(),
      minutes: d.getUTCMinutes(),
      seconds: d.getUTCSeconds(),
      nanos: 0
    }
  };
}

export async function publishGoogleBusinessContent(userId, post, workspaceId) {
  console.log(`📡 [GMB] Starting publishing sequence for user: ${userId}, post: ${post.id || post._id}`);

  const settingsQuery = { userId };
  if (workspaceId) settingsQuery.workspaceId = workspaceId;
  
  const settings = await Settings.findOne(settingsQuery);
  if (!settings || !settings.googleBusinessAccessToken) {
    throw new Error('Google Business is not connected or token is missing.');
  }

  let accessToken = settings.googleBusinessAccessToken;
  
  // Refresh token if needed
  if (settings.googleBusinessRefreshToken) {
    try {
      console.log('🔄 [GMB] Refreshing Google Business access token...');
      const refreshRes = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: settings.googleBusinessRefreshToken,
        grant_type: 'refresh_token'
      });
      if (refreshRes.data && refreshRes.data.access_token) {
        accessToken = refreshRes.data.access_token;
        // Save new access token
        settings.googleBusinessAccessToken = accessToken;
        await settings.save();
        console.log('✅ [GMB] Token refreshed successfully!');
      }
    } catch (refreshErr) {
      console.error('❌ [GMB] Token refresh failed:', refreshErr.response?.data || refreshErr.message);
    }
  }

  let accountName = settings.googleBusinessAccountId;
  let locationName = settings.googleBusinessLocationId;
  let locationTitle = settings.connectedGoogleBusinessName;

  if (!accountName || !locationName) {
    // 1. Get Accounts
    console.log('📡 [GMB] Fetching Google Business Accounts (Cache miss)...');
    let accountsRes;
    try {
      accountsRes = await axios.get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    } catch (err) {
      console.error('❌ [GMB] Fetch accounts failed:', err.response?.data || err.message);
      throw new Error(`Google Business API failed to fetch accounts: ${err.message}`);
    }

    const accounts = accountsRes.data?.accounts || [];
    if (accounts.length === 0) {
      throw new Error('No Google Business Accounts found.');
    }

    const account = accounts[0];
    accountName = account.name;
    console.log(`✅ [GMB] Using Account: ${account.accountName || account.name}`);

    // 2. Get Locations
    console.log(`📡 [GMB] Fetching locations for account: ${accountName}...`);
    let locationsRes;
    try {
      locationsRes = await axios.get(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations?readMask=name,title`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
    } catch (err) {
      console.error('❌ [GMB] Fetch locations failed:', err.response?.data || err.message);
      throw new Error(`Google Business API failed to fetch locations: ${err.message}`);
    }

    const locations = locationsRes.data?.locations || [];
    if (locations.length === 0) {
      throw new Error('No locations found under this Google Business Account.');
    }

    const location = locations[0];
    locationName = location.name;
    locationTitle = location.title;
    console.log(`✅ [GMB] Using Location: ${location.title} (${location.name})`);

    // Save back to settings cache
    try {
      settings.googleBusinessAccountId = accountName;
      settings.googleBusinessLocationId = locationName;
      settings.connectedGoogleBusinessName = locationTitle;
      await settings.save();
      console.log('✅ [GMB] Saved Account & Location URNs to Settings cache.');
    } catch (saveErr) {
      console.warn('⚠️ [GMB] Failed to save GMB details to Settings cache:', saveErr.message);
    }
  } else {
    console.log(`✅ [GMB] Using cached details - Account: ${accountName}, Location: ${locationName}`);
  }

  // 3. Create Local Post
  const accountId = accountName.split('/')[1];
  const locationId = locationName.split('/')[1];
  const publishUrl = `https://mybusiness.googleapis.com/v4/accounts/${accountId}/locations/${locationId}/localPosts`;

  console.log(`📡 [GMB] Creating Local Post on URL: ${publishUrl}...`);

  // Parse GMB metadata settings from mediaUrl JSON string
  let summary = post.caption || '';
  let ctaEnabled = false;
  let actionType = 'LEARN_MORE';
  let searchUrl = '';
  let cleanMediaUrl = post.mediaUrl || '';
  let topicType = 'STANDARD';
  let gmbEventTitle = '';
  let gmbEventStartDate = '';
  let gmbEventEndDate = '';
  let gmbOfferCouponCode = '';
  let gmbOfferRedeemUrl = '';
  let gmbOfferTerms = '';
  let gmbProductName = '';
  let gmbProductPrice = '';

  if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
    try {
      const meta = JSON.parse(post.mediaUrl);
      ctaEnabled = meta.gmbCtaEnabled || false;
      actionType = meta.gmbActionType || 'LEARN_MORE';
      searchUrl = meta.gmbSearchUrl || '';
      cleanMediaUrl = meta.mediaUrl || '';
      if (meta.gmbCustomCaption) {
        summary = meta.gmbCustomCaption;
      }
      topicType = meta.gmbTopicType || 'STANDARD';
      gmbEventTitle = meta.gmbEventTitle || '';
      gmbEventStartDate = meta.gmbEventStartDate || '';
      gmbEventEndDate = meta.gmbEventEndDate || '';
      gmbOfferCouponCode = meta.gmbOfferCouponCode || '';
      gmbOfferRedeemUrl = meta.gmbOfferRedeemUrl || '';
      gmbOfferTerms = meta.gmbOfferTerms || '';
      gmbProductName = meta.gmbProductName || '';
      gmbProductPrice = meta.gmbProductPrice || '';
    } catch (e) {
      console.warn('⚠️ GMB Metadata parse failed:', e.message);
    }
  }

  // Prepend product details if topicType is PRODUCT (since GMB localPosts API doesn't support PRODUCT post type natively)
  if (topicType === 'PRODUCT') {
    let productDetails = '';
    if (gmbProductName) productDetails += `📦 Product: ${gmbProductName}\n`;
    if (gmbProductPrice) productDetails += `💰 Price: ${gmbProductPrice}\n`;
    if (productDetails) {
      summary = `${productDetails}\n${summary}`;
    }
  }

  const mediaList = [];
  if (cleanMediaUrl && cleanMediaUrl.startsWith('http')) {
    mediaList.push({
      mediaFormat: 'PHOTO',
      sourceUrl: cleanMediaUrl
    });
  }

  const postBody = {
    languageCode: 'en-US',
    summary: summary,
    topicType: topicType === 'PRODUCT' ? 'STANDARD' : topicType
  };

  if (mediaList.length > 0) {
    postBody.media = mediaList;
  }

  // EVENT or OFFER require event details
  if (topicType === 'EVENT' || topicType === 'OFFER') {
    const startParsed = parseGmbDateTime(gmbEventStartDate);
    const endParsed = parseGmbDateTime(gmbEventEndDate);
    if (startParsed && endParsed) {
      postBody.event = {
        title: gmbEventTitle || (topicType === 'OFFER' ? 'Special Offer' : 'Special Event'),
        schedule: {
          startDate: startParsed.date,
          startTime: startParsed.time,
          endDate: endParsed.date,
          endTime: endParsed.time
        }
      };
    }
  }

  // OFFER requires offer details
  if (topicType === 'OFFER') {
    postBody.offer = {};
    if (gmbOfferCouponCode) {
      postBody.offer.couponCode = gmbOfferCouponCode;
    }
    if (gmbOfferRedeemUrl) {
      postBody.offer.redeemOnlineUrl = gmbOfferRedeemUrl;
    }
    if (gmbOfferTerms) {
      postBody.offer.termsAndConditions = gmbOfferTerms;
    }
    // If offer is empty object, clean it up
    if (Object.keys(postBody.offer).length === 0) {
      delete postBody.offer;
    }
  }

  if (ctaEnabled) {
    // If actionType is CALL, url is not sent
    if (actionType === 'CALL') {
      postBody.callToAction = {
        actionType: 'CALL'
      };
    } else if (searchUrl) {
      postBody.callToAction = {
        actionType: actionType,
        url: searchUrl
      };
    }
  }

  try {
    const postRes = await axios.post(publishUrl, postBody, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ [GMB] Local Post created successfully:', postRes.data.name);
    return {
      status: 'PUBLISHED',
      id: postRes.data.name,
      url: postRes.data.searchUrl || cleanMediaUrl || ''
    };
  } catch (err) {
    console.error('❌ [GMB] Create Local Post failed:', err.response?.data || err.message);
    const apiError = err.response?.data?.error?.message || err.message;
    throw new Error(`Google Business API failed to publish post: ${apiError}`);
  }
}
