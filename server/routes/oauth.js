import express from 'express';
import axios from 'axios';
import crypto from 'crypto';
import Settings from '../models/Settings.js';
import User from '../models/User.js';
import verifyToken from '../middleware/auth.js';
import Campaign from '../models/Campaign.js';
import ScheduledPost from '../models/ScheduledPost.js';
import Flow from '../models/Flow.js';
import Contact from '../models/Contact.js';
import Message from '../models/Message.js';
import ChatMessage from '../models/ChatMessage.js';
import Caption from '../models/Caption.js';
import { OAuth2Client } from 'google-auth-library';
import { TwitterApi } from 'twitter-api-v2';

const router = express.Router();

const getGoogleClient = (redirectUri) => {
  return new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );
};

// Step 1: Redirect to Facebook OAuth
router.get('/facebook', verifyToken, (req, res) => {
  const appId = process.env.META_APP_ID;
  let baseUrl = process.env.API_BASE_URL || 'https://dm-automation-w9a4.vercel.app';

  // Clean trailing slash to prevent double-slash issues
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  const redirectUri = encodeURIComponent(`${baseUrl}/api/oauth/facebook/callback`);
  const scope = 'instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_messages,pages_show_list,pages_read_engagement,pages_manage_engagement,pages_manage_posts,pages_manage_metadata,pages_messaging,whatsapp_business_management,whatsapp_business_messaging,business_management';
  const state = req.user.userId + 
                (req.query.onboarding === 'true' ? '_onboarding' : '') + 
                (req.query.connectType ? `_${req.query.connectType}` : '') +
                (req.workspaceId ? `_ws_${req.workspaceId}` : '');

  if (!appId) {
    return res.status(500).json({ error: "Missing META_APP_ID in environment variables" });
  }

  const authUrl = `https://facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&response_type=code`;
  res.redirect(authUrl);
});

// Step 2: Handle OAuth Callback
router.get('/facebook/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const isFromOnboarding = state && state.includes('_onboarding');
  const isInstagram = state && state.includes('_instagram');
  const isFacebook = state && state.includes('_facebook');
  const isWhatsApp = state && state.includes('_whatsapp');
  const isThreads = state && state.includes('_threads');
  
  let workspaceId = '';
  const wsMatch = state && state.match(/_ws_([a-f0-9-]{36})/i);
  if (wsMatch) {
    workspaceId = wsMatch[1];
  }

  let userId = state
    ? state
        .replace('_onboarding', '')
        .replace('_instagram', '')
        .replace('_facebook', '')
        .replace('_whatsapp', '')
        .replace('_threads', '')
        .replace(new RegExp(`_ws_${workspaceId}`, 'i'), '')
    : '';

  if (error) {
    console.error("OAuth Error:", error);
    return res.redirect(`${frontendUrl}/${isFromOnboarding ? 'onboarding' : 'connections'}?oauth_error=declined`);
  }

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/${isFromOnboarding ? 'onboarding' : 'connections'}?oauth_error=missing_parameters`);
  }

  try {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    let baseUrl = process.env.API_BASE_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001');
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    const redirectUri = `${baseUrl}/api/oauth/facebook/callback`;

    // 1. Exchange the auth 'code' for a short-lived access token
    console.log(`📡 OAuth Exchange: Starting for User ${userId}`);
    console.log(`🔑 App ID: ${appId}, Secret: ${appSecret ? appSecret.substring(0, 4) + '****' : 'MISSING'}`);
    console.log(`🔗 Redirect URI: ${redirectUri}`);

    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;

    let tokenRes;
    try {
      tokenRes = await axios.get(tokenUrl);
    } catch (tokenErr) {
      console.error("❌ Meta Token Exchange Error Details:", tokenErr.response?.data || tokenErr.message);
      throw new Error("exchange_failed_at_meta");
    }

    const shortLivedToken = tokenRes.data.access_token;

    // 2. Exchange short-lived token for a Long-Lived Access Token (60 days)
    const longLivedUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
    const longLivedRes = await axios.get(longLivedUrl);
    const longToken = longLivedRes.data.access_token;

    // 3. Get User's Pages — MUST include access_token field for page-level token
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${longToken}`;
    const pagesRes = await axios.get(pagesUrl);

    let pageId = '';
    let pageAccessToken = longToken; // ✅ Will be replaced with real Page Token below
    let businessAccountId = '';
    let facebookPageName = '';
    let instagramAccountName = '';

    const pages = pagesRes.data.data;
    console.log(`🔍 Meta Discovery: User has ${pages?.length || 0} pages.`);

    if (pages && pages.length > 0) {
      const pageWithInsta = pages.find(p => p.instagram_business_account);

      if (pageWithInsta) {
        pageId = pageWithInsta.id;
        // ✅ CRITICAL: Use PAGE-LEVEL token — required for Instagram Messaging API
        pageAccessToken = pageWithInsta.access_token || longToken;
        businessAccountId = pageWithInsta.instagram_business_account.id;
        facebookPageName = pageWithInsta.name;
        instagramAccountName = pageWithInsta.name; // fallback to page name

        console.log(`📄 Found FB Page: ${pageId}, Page Token prefix: ${pageAccessToken.substring(0, 10)}...`);

        // Try to fetch the IG Username for better UX
        try {
          const igUrl = `https://graph.facebook.com/v19.0/${businessAccountId}?fields=username,name&access_token=${pageAccessToken}`;
          const igRes = await axios.get(igUrl);
          if (igRes.data && igRes.data.username) {
            instagramAccountName = igRes.data.username;
            console.log(`📸 Found Instagram Account: @${instagramAccountName}`);
          }
        } catch (igErr) {
          console.warn("⚠️ Could not fetch IG username, using page name instead.");
        }
      } else {
        pageId = pages[0].id;
        pageAccessToken = pages[0].access_token || longToken;
        facebookPageName = pages[0].name;
        instagramAccountName = pages[0].name;
        console.warn("⚠️ No Instagram Business Account found linked to these pages.");
      }
    }

    // 4. WhatsApp Business Account discovery (only if connecting WhatsApp)
    let whatsappPhoneId = '';
    let whatsappName = '';
    let whatsappBusinessAccountId = '';

    if (isWhatsApp) {
      try {
        console.log('📱 Attempting WhatsApp Business Account discovery...');
        const wabaUrl = `https://graph.facebook.com/v19.0/me/whatsapp_business_accounts?access_token=${longToken}`;
        const wabaRes = await axios.get(wabaUrl);
        const wabaList = wabaRes.data?.data || [];
        if (wabaList.length > 0) {
          const waba = wabaList[0];
          whatsappBusinessAccountId = waba.id;
          // Fetch phone numbers under this WABA
          try {
            const phoneUrl = `https://graph.facebook.com/v19.0/${waba.id}/phone_numbers?fields=id,display_phone_number,verified_name&access_token=${longToken}`;
            const phoneRes = await axios.get(phoneUrl);
            const phones = phoneRes.data?.data || [];
            if (phones.length > 0) {
              whatsappPhoneId = phones[0].id;
              whatsappName = phones[0].verified_name || phones[0].display_phone_number || 'WhatsApp Business';
              console.log(`✅ WhatsApp Phone Number found: ${whatsappPhoneId} (${whatsappName})`);
            } else {
              console.warn('⚠️ WABA found but no phone numbers configured yet.');
            }
          } catch (phoneErr) {
            console.warn('⚠️ Could not fetch WABA phone numbers:', phoneErr.message);
          }
        } else {
          console.warn('⚠️ No WhatsApp Business Accounts found for this user.');
        }
      } catch (wabaErr) {
        console.warn('⚠️ WhatsApp Business Account discovery failed:', wabaErr.response?.data || wabaErr.message);
      }
    }

    // 4.5. AUTOMATICALLY SUBSCRIBE APP TO PAGE WEBHOOKS (CRITICAL FOR RECEIVING MESSAGES)
    if (pageId && pageAccessToken) {
      try {
        console.log(`🔌 Attempting to subscribe App to Page Webhooks for page ${pageId}...`);
        const subscribeUrl = `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,feed&access_token=${pageAccessToken}`;
        const subRes = await axios.post(subscribeUrl);
        if (subRes.data && subRes.data.success) {
          console.log(`✅ Webhook Subscription Successful for Page ${pageId}!`);
        }
      } catch (subErr) {
        console.error(`❌ Webhook Subscription Failed:`, subErr.response?.data || subErr.message);
        // We don't throw here, we still want to save tokens, but warn in logs
      }
    }

    // 5. Save to Database — save only the relevant platform fields
    const updateData = { lastTestedAt: new Date() };
    if (workspaceId) {
      updateData.workspaceId = workspaceId;
    }

    if (isThreads) {
      updateData.isThreadsConnected = true;
      updateData.threadsAccessToken = pageAccessToken || longToken;
      updateData.threadsPageId = pageId || '';
      updateData.connectedThreadsName = instagramAccountName || facebookPageName || 'Threads Account';
      console.log(`✅ Threads: Serialized connection for user ${userId}.`);
    } else if (isWhatsApp) {
      updateData.isWhatsAppConnected = !!whatsappPhoneId;
      if (whatsappPhoneId) {
        updateData.whatsappToken = longToken;
        updateData.whatsappPhoneNumberId = whatsappPhoneId;
        updateData.whatsappBusinessAccountId = whatsappBusinessAccountId;
        updateData.isWhatsAppConnected = true;
        // Store name in connectedPageName JSON alongside potential Threads data —
        // but use a dedicated field so Threads and WhatsApp coexist.
        // We store WhatsApp name in connectedInstagramId repurposed field or just rely on phone ID.
        updateData.connectedInstagramId = whatsappName; // reuse unused column for WhatsApp display name
        console.log(`✅ WhatsApp: Saved Phone ID ${whatsappPhoneId} (${whatsappName}) for user ${userId}.`);
      } else {
        console.warn('⚠️ WhatsApp connected but no phone number ID found. Marking disconnected.');
        updateData.isWhatsAppConnected = false;
      }
      // ⚠️ Do NOT touch connectedPageName (Threads) or Instagram/Facebook fields
    } else if (isInstagram) {
      // ✅ Only update Instagram fields — do NOT touch Facebook, WhatsApp, or Threads
      updateData.instagramAccessToken = pageAccessToken;
      updateData.instagramPageId = pageId;
      updateData.businessAccountId = businessAccountId;
      updateData.isAccountConnected = !!businessAccountId;
      updateData.connectedInstagramName = instagramAccountName;
    } else if (isFacebook) {
      // ✅ Only update Facebook fields — do NOT touch Instagram, WhatsApp, or Threads
      updateData.facebookAccessToken = pageAccessToken;
      updateData.facebookPageId = pageId;
      updateData.isFacebookConnected = !!pageId;
      updateData.connectedFacebookName = facebookPageName;
    } else {
      // Default/general flow — fill Instagram + Facebook fields
      updateData.instagramAccessToken = pageAccessToken;
      updateData.facebookAccessToken = pageAccessToken;
      updateData.instagramPageId = pageId;
      updateData.businessAccountId = businessAccountId;
      updateData.facebookPageId = pageId;
      updateData.connectedInstagramName = instagramAccountName;
      updateData.connectedFacebookName = facebookPageName;
      updateData.isFacebookConnected = !!pageId;
      updateData.isAccountConnected = !!businessAccountId;
    }

    // Safety: never send unknown columns to Supabase
    delete updateData.whatsappError;
    delete updateData.whatsappDiscoveryError;
    delete updateData.connectionError;

    /*
    // Strict Single-Owner Mapping: Clean up other connections rows that might be linked to this page/account
    if (pageId || businessAccountId) {
      const cleanupQuery = [];
      if (pageId) cleanupQuery.push({ instagramPageId: pageId }, { facebookPageId: pageId });
      if (businessAccountId) cleanupQuery.push({ businessAccountId: businessAccountId });
      
      if (cleanupQuery.length > 0) {
        // Migration: Find other users previously linked to this page/account to move their data
        try {
          const otherSettings = await Settings.find({
            userId: { $ne: userId },
            $or: cleanupQuery
          });
          const oldUserIds = otherSettings.map(s => s.userId).filter(Boolean);
          
          if (oldUserIds.length > 0) {
            console.log(`🔄 Migrating campaigns, posts, flows, and contacts from old users [${oldUserIds.join(', ')}] to user ${userId}...`);
            for (const oldUserId of oldUserIds) {
              await Campaign.updateMany({ userId: oldUserId }, { userId });
              await ScheduledPost.updateMany({ userId: oldUserId }, { userId });
              await Flow.updateMany({ userId: oldUserId }, { userId });
              await Contact.updateMany({ userId: oldUserId }, { userId });
              await Message.updateMany({ userId: oldUserId }, { userId });
              await ChatMessage.updateMany({ userId: oldUserId }, { userId });
              await Caption.updateMany({ userId: oldUserId }, { userId });
            }
            console.log(`✅ Data migration complete for user ${userId}`);
          }
        } catch (migrationErr) {
          console.error("⚠️ Failed to migrate page/account data:", migrationErr.message);
        }

        await Settings.updateMany(
          { 
            userId: { $ne: userId },
            $or: cleanupQuery
          },
          {
            $unset: {
              instagramPageId: 1,
              businessAccountId: 1,
              facebookPageId: 1,
              instagramAccessToken: 1,
              facebookAccessToken: 1,
              connectedInstagramName: 1,
              connectedFacebookName: 1
            },
            $set: {
              isAccountConnected: false,
              isFacebookConnected: false
            }
          }
        );
      }
    }
    */

    const connectionsQuery = { userId: userId };
    if (workspaceId) {
      connectionsQuery.workspaceId = workspaceId;
    }

    const updatedSettings = await Settings.findOneAndUpdate(
      connectionsQuery,
      updateData,
      { upsert: true, new: true }
    );

    console.log(`✅ OAuth Success: Linked Pages for user ${userId}. Page Token prefix: ${pageAccessToken.substring(0, 10)}...`);
    let platformParam = 'instagram';
    if (isFacebook) platformParam = 'facebook';
    else if (isWhatsApp) platformParam = 'whatsapp';
    else if (isThreads) platformParam = 'threads';

    if (isWhatsApp && !whatsappPhoneId) {
      if (isFromOnboarding) {
        res.redirect(`${frontendUrl}/onboarding?oauth_error=whatsapp_not_configured`);
      } else {
        res.redirect(`${frontendUrl}/connections?oauth_error=whatsapp_not_configured`);
      }
      return;
    }

    if (isFromOnboarding) {
      res.redirect(`${frontendUrl}/onboarding?oauth_success=true&platform=${platformParam}`);
    } else {
      res.redirect(`${frontendUrl}/connections?oauth_success=true&platform=${platformParam}`);
    }

  } catch (err) {
    console.error("OAuth Exchange Failed:", err.response?.data || err.message);
    if (isFromOnboarding) {
      res.redirect(`${frontendUrl}/onboarding?oauth_error=exchange_failed`);
    } else {
      res.redirect(`${frontendUrl}/connections?oauth_error=exchange_failed`);
    }
  }
});

// Zorcha Exact Flow: Get available Facebook Pages & their linked Instagram accounts
router.get('/facebook/pages', verifyToken, async (req, res) => {
  try {
    const connections = await Settings.findOne({ userId: req.user.userId, workspaceId: req.workspaceId });
    const token = connections?.facebookAccessToken || connections?.instagramAccessToken || process.env.META_PAGE_ACCESS_TOKEN;

    if (!token) {
      console.error(`❌ No token found for user ${req.user.userId}`);
      return res.status(400).json({ error: 'Please connect your Meta account first.' });
    }

    console.log(`📡 Fetching pages for user ${req.user.userId} using token prefix: ${token.substring(0, 10)}...`);

    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${token}`;

    let pagesRes;
    try {
      pagesRes = await axios.get(pagesUrl);
    } catch (axErr) {
      // If code 100, it's probably a Page Token (Pages don't have 'accounts')
      if (axErr.response?.data?.error?.code === 100) {
        console.log("ℹ️ Token is likely a Page Token, fetching /me instead...");
        try {
          const meRes = await axios.get(`https://graph.facebook.com/v19.0/me?fields=id,name,instagram_business_account&access_token=${token}`);
          pagesRes = { data: { data: [{ ...meRes.data, access_token: token }] } };
        } catch (meErr) {
          console.error("❌ Both /me/accounts and /me failed:", meErr.response?.data || meErr.message);
          return res.status(401).json({ error: 'Meta session expired. Please reconnect.' });
        }
      } else {
        console.error("❌ Meta Graph API Error:", axErr.response?.data || axErr.message);
        return res.status(axErr.response?.status || 500).json({
          error: 'Meta session expired. Please reconnect.',
          details: axErr.response?.data?.error?.message
        });
      }
    }

    const rawPages = pagesRes.data.data || [];
    const pages = [];

    console.log(`📄 Meta returned ${rawPages.length} pages/accounts.`);

    for (const p of rawPages) {
      let linkedInstagram = null;

      // Try to find Instagram account ID
      const igId = p.instagram_business_account?.id || p.instagram_business_account;

      if (igId) {
        try {
          const igRes = await axios.get(`https://graph.facebook.com/v19.0/${igId}?fields=username,name,profile_picture_url&access_token=${p.access_token || token}`);
          linkedInstagram = {
            id: igId,
            username: igRes.data.username,
            name: igRes.data.name,
            profilePicture: igRes.data.profile_picture_url
          };
        } catch (igErr) {
          console.warn(`⚠️ IG fetch failed for page ${p.name} (${igId}):`, igErr.message);
          linkedInstagram = { id: igId, username: 'instagram_account' };
        }
      }

      pages.push({ id: p.id, name: p.name, accessToken: p.access_token, linkedInstagram });
    }

    res.json(pages);
  } catch (err) {
    console.error("🔥 Critical 500 Error in facebook/pages:", err.message);
    res.status(500).json({ error: 'Internal server error while fetching pages' });
  }
});

// Zorcha Exact Flow: Select & connect a specific Facebook page & Instagram
router.post('/facebook/select-page', verifyToken, async (req, res) => {
  try {
    const { pageId, pageAccessToken, businessAccountId, instagramUsername } = req.body;

    const updateData = {
      instagramAccessToken: pageAccessToken,
      instagramPageId: pageId,
      isAccountConnected: !!businessAccountId,
      connectedInstagramName: instagramUsername || 'Connected Instagram',
      workspaceId: req.workspaceId,
      
      // Explicitly isolate from Facebook:
      facebookAccessToken: null,
      facebookPageId: null,
      isFacebookConnected: false,
      connectedFacebookName: null
    };

    if (businessAccountId) {
      updateData.businessAccountId = businessAccountId;
    }

    /*
    // Strict Single-Owner Mapping: Clean up other connections rows that might be linked to this page/account
    if (pageId || businessAccountId) {
      const cleanupQuery = [];
      if (pageId) cleanupQuery.push({ instagramPageId: pageId }, { facebookPageId: pageId });
      if (businessAccountId) cleanupQuery.push({ businessAccountId: businessAccountId });
      
      if (cleanupQuery.length > 0) {
        // Migration: Find other users previously linked to this page/account to move their data
        try {
          const otherSettings = await Settings.find({
            userId: { $ne: req.user.userId },
            $or: cleanupQuery
          });
          const oldUserIds = otherSettings.map(s => s.userId).filter(Boolean);
          
          if (oldUserIds.length > 0) {
            console.log(`🔄 Migrating campaigns, posts, flows, and contacts from old users [${oldUserIds.join(', ')}] to user ${req.user.userId}...`);
            for (const oldUserId of oldUserIds) {
              await Campaign.updateMany({ userId: oldUserId }, { userId: req.user.userId });
              await ScheduledPost.updateMany({ userId: oldUserId }, { userId: req.user.userId });
              await Flow.updateMany({ userId: oldUserId }, { userId: req.user.userId });
              await Contact.updateMany({ userId: oldUserId }, { userId: req.user.userId });
              await Message.updateMany({ userId: oldUserId }, { userId: req.user.userId });
              await ChatMessage.updateMany({ userId: oldUserId }, { userId: req.user.userId });
              await Caption.updateMany({ userId: oldUserId }, { userId: req.user.userId });
            }
            console.log(`✅ Data migration complete for user ${req.user.userId}`);
          }
        } catch (migrationErr) {
          console.error("⚠️ Failed to migrate page/account data:", migrationErr.message);
        }

        await Settings.updateMany(
          { 
            userId: { $ne: req.user.userId },
            $or: cleanupQuery
          },
          {
            $unset: {
              instagramPageId: 1,
              businessAccountId: 1,
              facebookPageId: 1,
              instagramAccessToken: 1,
              facebookAccessToken: 1,
              connectedInstagramName: 1,
              connectedFacebookName: 1
            },
            $set: {
              isAccountConnected: false,
              isFacebookConnected: false
            }
          }
        );
      }
    }
    */

    const connections = await Settings.findOneAndUpdate(
      { userId: req.user.userId, workspaceId: req.workspaceId },
      updateData,
      { upsert: true, new: true }
    );

    // 🚀 CRITICAL FIX: Subscribe the selected page to webhooks!
    if (pageId && pageAccessToken) {
      try {
        console.log(`🔌 Attempting to subscribe App to Page Webhooks for selected page ${pageId}...`);
        const subscribeUrl = `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,feed&access_token=${pageAccessToken}`;
        const subRes = await axios.post(subscribeUrl);
        if (subRes.data && subRes.data.success) {
          console.log(`✅ Webhook Subscription Successful for Selected Page ${pageId}!`);
        }
      } catch (subErr) {
        console.error(`❌ Webhook Subscription Failed for selected page:`, subErr.response?.data || subErr.message);
      }
    }

    res.json({ success: true, connections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// YOUTUBE OAUTH FLOW
// ==========================================

// Step 1: Redirect to Google OAuth
router.get('/youtube', verifyToken, (req, res) => {
  let baseUrl = process.env.API_BASE_URL || 'https://dm-automation-w9a4.vercel.app';
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
  const redirectUri = `${baseUrl}/api/oauth/youtube/callback`;
  
  const oauth2Client = getGoogleClient(redirectUri);

  const state = req.user.userId + 
                (req.query.onboarding === 'true' ? '_onboarding' : '') + 
                (req.workspaceId ? `_ws_${req.workspaceId}` : '');

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly'
    ],
    state: state,
    prompt: 'consent' // Force to get refresh token
  });

  res.redirect(authUrl);
});

// Step 2: Handle Google OAuth Callback
router.get('/youtube/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const isFromOnboarding = state && state.includes('_onboarding');
  
  let workspaceId = '';
  const wsMatch = state && state.match(/_ws_([a-f0-9-]{36})/i);
  if (wsMatch) {
    workspaceId = wsMatch[1];
  }

  let userId = state
    ? state
        .replace('_onboarding', '')
        .replace(new RegExp(`_ws_${workspaceId}`, 'i'), '')
    : '';

  if (error) {
    console.error("YouTube OAuth Error:", error);
    return res.redirect(`${frontendUrl}/${isFromOnboarding ? 'onboarding' : 'connections'}?oauth_error=declined`);
  }

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/${isFromOnboarding ? 'onboarding' : 'connections'}?oauth_error=missing_parameters`);
  }

  try {
    let baseUrl = process.env.API_BASE_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001');
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    const redirectUri = `${baseUrl}/api/oauth/youtube/callback`;

    const oauth2Client = getGoogleClient(redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch YouTube Channel Name
    let channelName = 'YouTube Channel';
    try {
      const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      if (channelRes.data && channelRes.data.items && channelRes.data.items.length > 0) {
        channelName = channelRes.data.items[0].snippet.customUrl || channelRes.data.items[0].snippet.title;
      }
    } catch (ytErr) {
      console.warn("Could not fetch YouTube channel name:", ytErr.message);
    }

    // Save tokens in the database metadata field since strict schema might drop new fields
    // Actually, we can just save it. Supabase schema accepts it if it exists, or we use metadata.
    const connectionsQuery = { userId: userId };
    if (workspaceId) {
      connectionsQuery.workspaceId = workspaceId;
    }

    const updateData = {};
    updateData.isYouTubeConnected = true;
    updateData.connectedYouTubeName = channelName;
    updateData.youtubeAccessToken = tokens.access_token;
    updateData.youtubeRefreshToken = tokens.refresh_token || null;

    await Settings.findOneAndUpdate(
      connectionsQuery,
      updateData,
      { upsert: true, new: true }
    );

    console.log(`✅ YouTube OAuth Success for user ${userId}. Channel: ${channelName}`);
    
    if (isFromOnboarding) {
      res.redirect(`${frontendUrl}/onboarding?oauth_success=true&platform=youtube`);
    } else {
      res.redirect(`${frontendUrl}/connections?oauth_success=true&platform=youtube`);
    }

  } catch (err) {
    console.error("YouTube Exchange Failed:", err.message);
    if (isFromOnboarding) {
      res.redirect(`${frontendUrl}/onboarding?oauth_error=exchange_failed`);
    } else {
      res.redirect(`${frontendUrl}/connections?oauth_error=exchange_failed`);
    }
  }
});
// ==========================================
// LINKEDIN OAUTH FLOW
// ==========================================

// Step 1: Redirect to LinkedIn OAuth
router.get('/linkedin', verifyToken, (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  let baseUrl = process.env.API_BASE_URL || 'https://dm-automation-w9a4.vercel.app';
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
  const redirectUri = `${baseUrl}/api/oauth/linkedin/callback`;
  
  const state = req.user.userId + 
                (req.query.onboarding === 'true' ? '_onboarding' : '') + 
                (req.workspaceId ? `_ws_${req.workspaceId}` : '');

  if (!clientId) {
    return res.status(500).json({ error: "Missing LINKEDIN_CLIENT_ID in environment variables" });
  }

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=openid%20profile%20w_member_social%20email`;
  res.redirect(authUrl);
});

// Step 2: Handle LinkedIn OAuth Callback
router.get('/linkedin/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const isFromOnboarding = state && state.includes('_onboarding');
  
  let workspaceId = '';
  const wsMatch = state && state.match(/_ws_([a-f0-9-]{36})/i);
  if (wsMatch) {
    workspaceId = wsMatch[1];
  }

  let userId = state
    ? state
        .replace('_onboarding', '')
        .replace(new RegExp(`_ws_${workspaceId}`, 'i'), '')
    : '';

  if (error) {
    console.error("LinkedIn OAuth Error:", error);
    return res.redirect(`${frontendUrl}/${isFromOnboarding ? 'onboarding' : 'connections'}?oauth_error=declined`);
  }

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/${isFromOnboarding ? 'onboarding' : 'connections'}?oauth_error=missing_parameters`);
  }

  try {
    const clientId = process.env.LINKEDIN_CLIENT_ID;
    const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
    let baseUrl = process.env.API_BASE_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001');
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    const redirectUri = `${baseUrl}/api/oauth/linkedin/callback`;

    // 1. Exchange code for access token
    const tokenRes = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', null, {
      params: {
        grant_type: 'authorization_code',
        code: code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri
      },
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const accessToken = tokenRes.data.access_token;
    
    // 2. Fetch User Profile
    let profileName = 'LinkedIn Member';
    try {
      const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (profileRes.data && profileRes.data.name) {
        profileName = profileRes.data.name;
      }
    } catch (profileErr) {
      console.warn("Could not fetch LinkedIn profile name:", profileErr.response?.data || profileErr.message);
    }

    // 3. Save to DB
    const connectionsQuery = { userId: userId };
    if (workspaceId) {
      connectionsQuery.workspaceId = workspaceId;
    }

    const updateData = {};
    updateData.isLinkedInConnected = true;
    updateData.connectedLinkedInName = profileName;
    updateData.linkedinAccessToken = accessToken;

    await Settings.findOneAndUpdate(
      connectionsQuery,
      updateData,
      { upsert: true, new: true }
    );

    console.log(`✅ LinkedIn OAuth Success for user ${userId}. Profile: ${profileName}`);
    
    if (isFromOnboarding) {
      res.redirect(`${frontendUrl}/onboarding?oauth_success=true&platform=linkedin`);
    } else {
      res.redirect(`${frontendUrl}/connections?oauth_success=true&platform=linkedin`);
    }

  } catch (err) {
    console.error("LinkedIn Exchange Failed:", err.response?.data || err.message);
    if (isFromOnboarding) {
      res.redirect(`${frontendUrl}/onboarding?oauth_error=exchange_failed`);
    } else {
      res.redirect(`${frontendUrl}/connections?oauth_error=exchange_failed`);
    }
  }
});
// ==========================================
// GOOGLE BUSINESS OAUTH FLOW
// ==========================================

// Step 1: Redirect to Google OAuth for Business Profile
router.get('/google-business', verifyToken, (req, res) => {
  let baseUrl = process.env.API_BASE_URL || 'https://dm-automation-w9a4.vercel.app';
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
  const redirectUri = `${baseUrl}/api/oauth/google-business/callback`;
  
  const oauth2Client = getGoogleClient(redirectUri);

  const state = req.user.userId + 
                (req.query.onboarding === 'true' ? '_onboarding' : '') + 
                (req.workspaceId ? `_ws_${req.workspaceId}` : '');

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/business.manage',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email'
    ],
    state: state,
    prompt: 'consent' // Force to get refresh token
  });

  res.redirect(authUrl);
});

// Step 2: Handle Google Business OAuth Callback
router.get('/google-business/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const isFromOnboarding = state && state.includes('_onboarding');
  
  let workspaceId = '';
  const wsMatch = state && state.match(/_ws_([a-f0-9-]{36})/i);
  if (wsMatch) {
    workspaceId = wsMatch[1];
  }

  let userId = state
    ? state
        .replace('_onboarding', '')
        .replace(new RegExp(`_ws_${workspaceId}`, 'i'), '')
    : '';

  if (error) {
    console.error("Google Business OAuth Error:", error);
    return res.redirect(`${frontendUrl}/${isFromOnboarding ? 'onboarding' : 'connections'}?oauth_error=declined`);
  }

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/${isFromOnboarding ? 'onboarding' : 'connections'}?oauth_error=missing_parameters`);
  }

  try {
    let baseUrl = process.env.API_BASE_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001');
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    const redirectUri = `${baseUrl}/api/oauth/google-business/callback`;

    const oauth2Client = getGoogleClient(redirectUri);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Fetch Google Business Account Name
    let businessName = 'Google Business Account';
    try {
      const accountsRes = await axios.get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      if (accountsRes.data && accountsRes.data.accounts && accountsRes.data.accounts.length > 0) {
        const account = accountsRes.data.accounts[0];
        businessName = account.accountName || account.name;
        
        try {
          const locationsRes = await axios.get(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=title`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
          });
          if (locationsRes.data && locationsRes.data.locations && locationsRes.data.locations.length > 0) {
            businessName = locationsRes.data.locations[0].title;
          }
        } catch (locErr) {
          console.warn('Could not fetch Google Business locations:', locErr.message);
        }
      }
    } catch (gbErr) {
      console.warn("Could not fetch Google Business account name:", gbErr.message);
    }

    const connectionsQuery = { userId: userId };
    if (workspaceId) {
      connectionsQuery.workspaceId = workspaceId;
    }

    const updateData = {};
    updateData.isGoogleBusinessConnected = true;
    updateData.connectedGoogleBusinessName = businessName;
    updateData.googleBusinessAccessToken = tokens.access_token;
    updateData.googleBusinessRefreshToken = tokens.refresh_token || null;

    await Settings.findOneAndUpdate(
      connectionsQuery,
      updateData,
      { upsert: true, new: true }
    );

    console.log(`✅ Google Business OAuth Success for user ${userId}. Account: ${businessName}`);
    
    if (isFromOnboarding) {
      res.redirect(`${frontendUrl}/onboarding?oauth_success=true&platform=google-business`);
    } else {
      res.redirect(`${frontendUrl}/connections?oauth_success=true&platform=google-business`);
    }

  } catch (err) {
    console.error("Google Business Exchange Failed:", err.message);
    if (isFromOnboarding) {
      res.redirect(`${frontendUrl}/onboarding?oauth_error=exchange_failed`);
    } else {
      res.redirect(`${frontendUrl}/connections?oauth_error=exchange_failed`);
    }
  }
});
// ==========================================
// TWITTER / X OAUTH FLOW (OAuth 2.0 PKCE)
// ==========================================

// Helper: Generate base64url encoded string
const base64URLEncode = (str) => {
  return str.toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// Helper: Generate SHA256 hash
const sha256 = (buffer) => {
  return crypto.createHash('sha256').update(buffer).digest();
};

// Step 1: Redirect to Twitter OAuth
router.get('/twitter', verifyToken, (req, res) => {
  const clientId = process.env.TWITTER_CLIENT_ID;
  if (!clientId) {
    return res.status(500).json({ error: "Missing TWITTER_CLIENT_ID in environment variables" });
  }

  let baseUrl = process.env.API_BASE_URL || 'https://dm-automation-w9a4.vercel.app';
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
  const redirectUri = `${baseUrl}/api/oauth/twitter/callback`;
  
  const codeVerifier = base64URLEncode(crypto.randomBytes(32));
  const codeChallenge = base64URLEncode(sha256(codeVerifier));

  const stateObj = {
    userId: req.user.userId,
    workspaceId: req.workspaceId || '',
    isFromOnboarding: req.query.onboarding === 'true',
    codeVerifier: codeVerifier
  };
  
  const state = Buffer.from(JSON.stringify(stateObj)).toString('base64');

  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read%20tweet.write%20users.read%20offline.access&state=${encodeURIComponent(state)}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
  
  res.redirect(authUrl);
});

// Step 2: Handle Twitter OAuth Callback
router.get('/twitter/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error || !code || !state) {
    return res.redirect(`${frontendUrl}/connections?oauth_error=declined`);
  }

  try {
    const stateObj = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
    const { userId, workspaceId, isFromOnboarding, codeVerifier } = stateObj;

    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    
    let baseUrl = process.env.API_BASE_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5001');
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    const redirectUri = `${baseUrl}/api/oauth/twitter/callback`;

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await axios.post('https://api.twitter.com/2/oauth2/token', 
      new URLSearchParams({
        code: code,
        grant_type: 'authorization_code',
        client_id: clientId,
        redirect_uri: redirectUri,
        code_verifier: codeVerifier
      }).toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        }
      }
    );

    const { access_token, refresh_token } = tokenRes.data;

    // Fetch User Profile
    let profileName = 'Twitter User';
    let profileId = '';
    try {
      const profileRes = await axios.get('https://api.twitter.com/2/users/me', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      if (profileRes.data && profileRes.data.data) {
        profileName = `@${profileRes.data.data.username}`;
        profileId = profileRes.data.data.id;
      }
    } catch (profileErr) {
      console.warn("Could not fetch Twitter profile name:", profileErr.response?.data || profileErr.message);
    }

    const connectionsQuery = { userId: userId };
    if (workspaceId) {
      connectionsQuery.workspaceId = workspaceId;
    }

    const updateData = {};
    updateData.isTwitterConnected = true;
    updateData.connectedTwitterName = profileName;
    updateData.twitterAccessToken = access_token;
    updateData.twitterRefreshToken = refresh_token || null;
    updateData.connectedTwitterId = profileId;

    await Settings.findOneAndUpdate(
      connectionsQuery,
      updateData,
      { upsert: true, new: true }
    );

    console.log(`✅ Twitter OAuth Success for user ${userId}. Profile: ${profileName}`);
    
    if (isFromOnboarding) {
      res.redirect(`${frontendUrl}/onboarding?oauth_success=true&platform=twitter`);
    } else {
      res.redirect(`${frontendUrl}/connections?oauth_success=true&platform=twitter`);
    }

  } catch (err) {
    console.error("Twitter Exchange Failed:", err);
    if (isFromOnboarding) {
      res.redirect(`${frontendUrl}/onboarding?oauth_error=exchange_failed`);
    } else {
      res.redirect(`${frontendUrl}/connections?oauth_error=exchange_failed`);
    }
  }
});

export default router;


