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

router.get('/facebook', verifyToken, (req, res) => {
  const appId = process.env.META_APP_ID;
  let baseUrl = process.env.API_BASE_URL || 'https://dm-automation-w9a4.vercel.app';

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

  const authUrl = `https://facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&response_type=code&auth_type=rerequest`;
  res.redirect(authUrl);
});

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

    const longLivedUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
    const longLivedRes = await axios.get(longLivedUrl);
    const longToken = longLivedRes.data.access_token;

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
        pageAccessToken = pageWithInsta.access_token || longToken;
        businessAccountId = pageWithInsta.instagram_business_account.id;
        facebookPageName = pageWithInsta.name;
        instagramAccountName = pageWithInsta.name; // fallback to page name

        console.log(`📄 Found FB Page: ${pageId}, Page Token prefix: ${pageAccessToken.substring(0, 10)}...`);

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
      }
    }

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
        updateData.connectedInstagramId = whatsappName; // reuse unused column for WhatsApp display name
        console.log(`✅ WhatsApp: Saved Phone ID ${whatsappPhoneId} (${whatsappName}) for user ${userId}.`);
      } else {
        console.warn('⚠️ WhatsApp connected but no phone number ID found. Marking disconnected.');
        updateData.isWhatsAppConnected = false;
      }
    } else if (isInstagram) {
      updateData.instagramAccessToken = pageAccessToken;
      updateData.instagramPageId = pageId;
      updateData.businessAccountId = businessAccountId;
      updateData.isAccountConnected = !!businessAccountId;
      updateData.connectedInstagramName = instagramAccountName;
    } else if (isFacebook) {
      updateData.facebookAccessToken = pageAccessToken;
      updateData.facebookPageId = pageId;
      updateData.isFacebookConnected = !!pageId;
      updateData.connectedFacebookName = facebookPageName;
    } else {
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

    delete updateData.whatsappError;
    delete updateData.whatsappDiscoveryError;
    delete updateData.connectionError;

    /*
    if (pageId || businessAccountId) {
      const cleanupQuery = [];
      if (pageId) cleanupQuery.push({ instagramPageId: pageId }, { facebookPageId: pageId });
      if (businessAccountId) cleanupQuery.push({ businessAccountId: businessAccountId });
      
      if (cleanupQuery.length > 0) {
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

    if (isInstagram && !businessAccountId) {
      if (isFromOnboarding) {
        res.redirect(`${frontendUrl}/onboarding?oauth_error=no_instagram_account`);
      } else {
        res.redirect(`${frontendUrl}/connections?oauth_error=no_instagram_account`);
      }
      return;
    }

    if (isFacebook && !pageId) {
      if (isFromOnboarding) {
        res.redirect(`${frontendUrl}/onboarding?oauth_error=no_pages_found`);
      } else {
        res.redirect(`${frontendUrl}/connections?oauth_error=no_pages_found`);
      }
      return;
    }

    if (!isWhatsApp && !isThreads && !pageId && !businessAccountId) {
      if (isFromOnboarding) {
        res.redirect(`${frontendUrl}/onboarding?oauth_error=no_pages_found`);
      } else {
        res.redirect(`${frontendUrl}/connections?oauth_error=no_pages_found`);
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

router.post('/facebook/select-page', verifyToken, async (req, res) => {
  try {
    const { pageId, pageAccessToken, businessAccountId, instagramUsername } = req.body;

    const updateData = {
      instagramAccessToken: pageAccessToken,
      instagramPageId: pageId,
      isAccountConnected: !!businessAccountId,
      connectedInstagramName: instagramUsername || 'Connected Instagram',
      workspaceId: req.workspaceId,
      
      facebookAccessToken: null,
      facebookPageId: null,
      isFacebookConnected: false,
      connectedFacebookName: null
    };

    if (businessAccountId) {
      updateData.businessAccountId = businessAccountId;
    }

    /*
    if (pageId || businessAccountId) {
      const cleanupQuery = [];
      if (pageId) cleanupQuery.push({ instagramPageId: pageId }, { facebookPageId: pageId });
      if (businessAccountId) cleanupQuery.push({ businessAccountId: businessAccountId });
      
      if (cleanupQuery.length > 0) {
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


router.get('/pinterest', verifyToken, (req, res) => {
  const clientId = process.env.PINTEREST_CLIENT_ID;
  let baseUrl = process.env.API_BASE_URL || 'https://dm-automation-w9a4.vercel.app';
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

  const redirectUri = `${baseUrl}/api/oauth/pinterest/callback`;
  const scope = 'boards:read,pins:read,boards:write,pins:write,user_accounts:read';
  const state = req.user.userId + (req.workspaceId ? `_ws_${req.workspaceId}` : '');

  if (!clientId) {
    return res.status(500).json({ error: "Missing PINTEREST_CLIENT_ID in environment variables" });
  }

  const authUrl = `https://www.pinterest.com/oauth/?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scope}&state=${state}`;
  res.redirect(authUrl);
});

router.get('/pinterest/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  if (error || !code) {
    return res.redirect(`${frontendUrl}/connections?error=pinterest_oauth_failed`);
  }

  let workspaceId = '';
  const wsMatch = state && state.match(/_ws_([a-f0-9-]{36})/i);
  if (wsMatch) {
    workspaceId = wsMatch[1];
  }
  let userId = state ? state.replace(/_ws_([a-f0-9-]{36})/i, '') : null;

  try {
    const clientId = process.env.PINTEREST_CLIENT_ID;
    const clientSecret = process.env.PINTEREST_CLIENT_SECRET;
    let baseUrl = process.env.API_BASE_URL || 'https://dm-automation-w9a4.vercel.app';
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    const redirectUri = `${baseUrl}/api/oauth/pinterest/callback`;

    const tokenUrl = 'https://api.pinterest.com/v5/oauth/token';
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const tokenRes = await axios.post(tokenUrl, new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri
    }).toString(), {
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${authHeader}`
      }
    });

    const accessToken = tokenRes.data.access_token;
    const refreshToken = tokenRes.data.refresh_token;

    const profileRes = await axios.get('https://api.pinterest.com/v5/user_account', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    const pinterestId = profileRes.data.account_type; // Using account_type or custom if needed
    const pinterestUsername = profileRes.data.username || 'Pinterest Account';

    const updateData = {
      isPinterestConnected: true,
      pinterestAccessToken: accessToken,
      pinterestRefreshToken: refreshToken || null,
      connectedPinterestId: profileRes.data.username,
      connectedPinterestName: pinterestUsername
    };

    let settingsQuery = { userId };
    if (workspaceId) {
      settingsQuery.workspaceId = workspaceId;
    }
    
    await Settings.findOneAndUpdate(
      settingsQuery,
      updateData,
      { upsert: true, new: true }
    );

    res.redirect(`${frontendUrl}/connections?success=pinterest_connected`);
  } catch (err) {
    console.error("Pinterest Exchange Failed:", err.response?.data || err.message);
    const errorMsg = err.response?.data?.message || err.message || 'unknown';
    res.redirect(`${frontendUrl}/connections?error=pinterest_oauth_failed&reason=${encodeURIComponent(errorMsg)}`);
  }
});


router.get('/threads', verifyToken, (req, res) => {
  const appId = process.env.THREADS_APP_ID || process.env.META_APP_ID;
  let baseUrl = process.env.API_BASE_URL || 'https://dm-automation-w9a4.vercel.app';

  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

  const redirectUri = encodeURIComponent(`${baseUrl}/api/oauth/threads/callback`);
  const scope = 'threads_basic,threads_content_publish';
  const state = req.user.userId + 
                (req.workspaceId ? `_ws_${req.workspaceId}` : '');

  if (!appId) {
    return res.status(500).json({ error: "Missing META_APP_ID or THREADS_APP_ID in environment variables" });
  }

  const authUrl = `https://threads.net/oauth/authorize?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${state}`;
  res.redirect(authUrl);
});

router.get('/threads/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  if (error || !code) {
    return res.redirect(`${frontendUrl}/connections?error=threads_oauth_failed`);
  }

  let workspaceId = '';
  const wsMatch = state && state.match(/_ws_([a-f0-9-]{36})/i);
  if (wsMatch) {
    workspaceId = wsMatch[1];
  }
  let userId = state ? state.replace(/_ws_([a-f0-9-]{36})/i, '') : null;

  try {
    const appId = process.env.THREADS_APP_ID || process.env.META_APP_ID;
    const appSecret = process.env.THREADS_APP_SECRET || process.env.META_APP_SECRET;
    let baseUrl = process.env.API_BASE_URL || 'https://dm-automation-w9a4.vercel.app';
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    const redirectUri = `${baseUrl}/api/oauth/threads/callback`;

    const tokenRes = await axios.post('https://graph.threads.net/oauth/access_token', new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code: code
    }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const shortLivedToken = tokenRes.data.access_token;

    const longTokenRes = await axios.get('https://graph.threads.net/access_token', {
      params: {
        grant_type: 'th_exchange_token',
        client_secret: appSecret,
        access_token: shortLivedToken
      }
    });

    const longLivedToken = longTokenRes.data.access_token;
    
    const profileRes = await axios.get('https://graph.threads.net/v1.0/me', {
      params: {
        fields: 'id,username,name',
        access_token: longLivedToken
      }
    });
    
    const threadsPageId = profileRes.data.id;
    const threadsUsername = profileRes.data.username || profileRes.data.name;

    const updateData = {
      isThreadsConnected: true,
      threadsAccessToken: longLivedToken,
      threadsPageId: threadsPageId,
      connectedThreadsName: threadsUsername || 'Threads Account'
    };

    let settingsQuery = { userId };
    if (workspaceId) {
      settingsQuery.workspaceId = workspaceId;
    }
    
    await Settings.findOneAndUpdate(
      settingsQuery,
      updateData,
      { upsert: true, new: true }
    );

    res.redirect(`${frontendUrl}/connections?success=threads_connected`);
  } catch (err) {
    console.error("Threads Exchange Failed:", err.response?.data || err.message);
    const errorMsg = err.response?.data?.error?.message || err.response?.data?.error_message || err.message || 'unknown';
    res.redirect(`${frontendUrl}/connections?error=threads_oauth_failed&reason=${encodeURIComponent(errorMsg)}`);
  }
});

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

router.get('/linkedin', verifyToken, (req, res) => {
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  let baseUrl = process.env.API_BASE_URL || 'https://dm-automation-w9a4.vercel.app';
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
  const redirectUri = `${baseUrl}/api/oauth/linkedin/callback`;
  
  const isBusiness = req.query.type === 'business';
  const state = req.user.userId + 
                (req.query.onboarding === 'true' ? '_onboarding' : '') + 
                (req.workspaceId ? `_ws_${req.workspaceId}` : '') +
                (isBusiness ? '_type_business' : '_type_personal');

  if (!clientId) {
    return res.status(500).json({ error: "Missing LINKEDIN_CLIENT_ID in environment variables" });
  }

  let scope = 'openid%20profile%20email%20w_member_social';
  if (isBusiness) {
    scope += '%20w_organization_social%20r_organization_social';
  }

  const authUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${scope}`;
  res.redirect(authUrl);
});

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
        .replace('_type_business', '')
        .replace('_type_personal', '')
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
    
    let profileName = 'LinkedIn Member';
    let personUrn = '';
    try {
      const profileRes = await axios.get('https://api.linkedin.com/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      if (profileRes.data) {
        if (profileRes.data.sub) {
          personUrn = `urn:li:person:${profileRes.data.sub}`;
        }
        if (profileRes.data.name) {
          profileName = profileRes.data.name;
        } else if (profileRes.data.given_name) {
          profileName = `${profileRes.data.given_name} ${profileRes.data.family_name || ''}`.trim();
        }
      }
    } catch (profileErr) {
      console.warn("Could not fetch LinkedIn profile name:", profileErr.response?.data || profileErr.message);
    }

    let pages = [];
    if (personUrn) {
      pages.push({
        urn: personUrn,
        name: `${profileName} (Personal)`,
        type: 'profile'
      });
    }

    const isBusiness = state && state.includes('_type_business');
    if (isBusiness) {
      try {
        console.log("📡 [LinkedIn] Fetching organization access list using /organizationAcls...");
        const aclRes = await axios.get('https://api.linkedin.com/v2/organizationAcls', {
          params: {
            q: 'roleAssignee',
            projection: '(elements*(organization~(localizedName)))'
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'X-Restli-Protocol-Version': '2.0.0'
          }
        });
        if (aclRes.data && aclRes.data.elements) {
          for (const elem of aclRes.data.elements) {
            const targetUrn = elem.organization;
            const targetDetails = elem['organization~'];
            if (targetUrn && targetDetails) {
              pages.push({
                urn: targetUrn,
                name: targetDetails.localizedName || targetUrn,
                type: 'page'
              });
            }
          }
        }
      } catch (aclErr) {
        console.warn("⚠️ LinkedIn /organizationAcls failed, trying legacy /organizationalEntityAcls...", aclErr.response?.data || aclErr.message);
        try {
          const legacyAclRes = await axios.get('https://api.linkedin.com/v2/organizationalEntityAcls', {
          params: {
            q: 'roleAssignee',
            projection: '(elements*(organizationalTarget~(localizedName)))'
          },
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'X-Restli-Protocol-Version': '2.0.0'
            }
          });
          if (legacyAclRes.data && legacyAclRes.data.elements) {
            for (const elem of legacyAclRes.data.elements) {
              const targetUrn = elem.organizationalTarget;
              const targetDetails = elem['organizationalTarget~'];
              if (targetUrn && targetDetails) {
                pages.push({
                  urn: targetUrn,
                  name: targetDetails.localizedName || targetUrn,
                  type: 'page'
                });
              }
            }
          }
        } catch (legacyAclErr) {
          console.error("❌ Both LinkedIn organization endpoints failed:", legacyAclErr.response?.data || legacyAclErr.message);
        }
      }
    }

    const connectionsQuery = { userId: userId };
    if (workspaceId) {
      connectionsQuery.workspaceId = workspaceId;
    }

    const updateData = {};
    updateData.isLinkedInConnected = true;
    updateData.connectedLinkedInName = profileName;
    updateData.linkedinAccessToken = accessToken;
    updateData.linkedinPages = pages;
    
    updateData.linkedinPageId = null;
    updateData.linkedinOrganizationId = null;

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

    
    let googleUserName = '';
    let businessName = 'Google Business Account';
    try {
      const userInfoRes = await axios.get('https://www.googleapis.com/oauth2/v1/userinfo?alt=json', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      if (userInfoRes.data && userInfoRes.data.name) {
        googleUserName = userInfoRes.data.name;
        businessName = googleUserName;
      }
    } catch(err) {
      console.warn('Could not fetch Google user info:', err.message);
    }

    let gmbFetched = false;
    let gmbAccountId = null;
    let gmbLocationId = null;
    try {
      const accountsRes = await axios.get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      });
      if (accountsRes.data && accountsRes.data.accounts && accountsRes.data.accounts.length > 0) {
        const account = accountsRes.data.accounts[0];
        businessName = account.accountName || account.name;
        gmbAccountId = account.name; // e.g. "accounts/123456789"
        gmbFetched = true;
        
        try {
          const locationsRes = await axios.get(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title`, {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
          });
          if (locationsRes.data && locationsRes.data.locations && locationsRes.data.locations.length > 0) {
            const location = locationsRes.data.locations[0];
            businessName = location.title;
            gmbLocationId = location.name; // e.g. "locations/987654321"
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

    if (!gmbFetched) {
      try {
        const existingSettings = await Settings.findOne(connectionsQuery);
        if (existingSettings && existingSettings.connectedGoogleBusinessName) {
          businessName = existingSettings.connectedGoogleBusinessName;
        }
      } catch (dbErr) {
        console.warn("Could not fetch existing settings to preserve GMB name:", dbErr.message);
      }
    }



    const updateData = {};
    updateData.isGoogleBusinessConnected = true;
    updateData.connectedGoogleBusinessName = businessName;
    updateData.googleBusinessAccessToken = tokens.access_token;
    updateData.googleBusinessRefreshToken = tokens.refresh_token || null;
    if (gmbAccountId) updateData.googleBusinessAccountId = gmbAccountId;
    if (gmbLocationId) updateData.googleBusinessLocationId = gmbLocationId;

    await Settings.findOneAndUpdate(
      connectionsQuery,
      updateData,
      { upsert: true, new: true }
    );

    if (gmbAccountId && gmbLocationId) {
      console.log(`✅ [GMB] Account ID & Location ID saved at connect time: ${gmbAccountId}, ${gmbLocationId}`);
    }

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

router.get('/twitter', verifyToken, async (req, res) => {
  const clientId = process.env.TWITTER_CLIENT_ID;
  const clientSecret = process.env.TWITTER_CLIENT_SECRET;
  
  if (!clientId || !clientSecret) {
    return res.status(500).json({ error: "Missing TWITTER_CLIENT_ID or TWITTER_CLIENT_SECRET in environment variables. Please configure OAuth 2.0 credentials." });
  }

  let baseUrl = process.env.API_BASE_URL || 'https://dm-automation-w9a4.vercel.app';
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
  const redirectUri = `${baseUrl}/api/oauth/twitter/callback`;
  
  const client = new TwitterApi({ clientId, clientSecret });
  
  try {
    const { url, codeVerifier, state } = client.generateOAuth2AuthLink(redirectUri, { 
      scope: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'] 
    });

    const pkceSession = {
      codeVerifier,
      state,
      userId: req.user.userId,
      workspaceId: req.workspaceId || '',
      onboarding: req.query.onboarding === 'true'
    };

    const connectionsQuery = { userId: req.user.userId };
    if (req.workspaceId) {
      connectionsQuery.workspaceId = req.workspaceId;
    }
    
    await Settings.findOneAndUpdate(
      connectionsQuery,
      { twitterRefreshToken: JSON.stringify(pkceSession) },
      { upsert: true, new: true }
    );
    
    res.redirect(url);
  } catch (err) {
    console.error("Twitter OAuth 2.0 Link Gen Error:", err);
    return res.status(500).json({ error: "Failed to generate Twitter Auth Link." });
  }
});

router.get('/twitter/callback', async (req, res) => {
  const { code, state, error: twitterError } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (twitterError || !code || !state) {
    return res.redirect(`${frontendUrl}/connections?oauth_error=declined`);
  }

  try {
    
    const settings = await Settings.find({});
    let targetSettings = null;
    let pkceSession = null;
    
    for (const s of settings) {
      if (s.twitterRefreshToken && s.twitterRefreshToken.startsWith('{')) {
        try {
          const parsed = JSON.parse(s.twitterRefreshToken);
          if (parsed.state === state) {
            targetSettings = s;
            pkceSession = parsed;
            break;
          }
        } catch(e) {}
      }
    }

    if (!targetSettings || !pkceSession) {
      throw new Error("Session expired, invalid state, or not found.");
    }

    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;
    
    let baseUrl = process.env.API_BASE_URL || 'https://dm-automation-w9a4.vercel.app';
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    const redirectUri = `${baseUrl}/api/oauth/twitter/callback`;

    const client = new TwitterApi({ clientId, clientSecret });

    const { client: loggedClient, accessToken, refreshToken } = await client.loginWithOAuth2({ 
      code, 
      codeVerifier: pkceSession.codeVerifier, 
      redirectUri 
    });

    let profileName = 'Twitter User';
    let profileId = '';
    try {
      const user = await loggedClient.v2.me();
      if (user && user.data) {
        profileName = `@${user.data.username}`;
        profileId = user.data.id;
      }
    } catch (profileErr) {
      console.warn("Could not fetch Twitter profile name:", profileErr.message);
    }

    const updateData = {};
    updateData.isTwitterConnected = true;
    updateData.connectedTwitterName = profileName;
    updateData.twitterAccessToken = accessToken;
    updateData.twitterRefreshToken = refreshToken; 
    updateData.connectedTwitterId = profileId;

    const connectionsQuery = { userId: pkceSession.userId };
    if (pkceSession.workspaceId) {
      connectionsQuery.workspaceId = pkceSession.workspaceId;
    }

    await Settings.findOneAndUpdate(
      connectionsQuery,
      updateData,
      { upsert: true, new: true }
    );

    console.log(`✅ Twitter OAuth 2.0 Success for user ${pkceSession.userId}. Profile: ${profileName}`);
    
    if (pkceSession.onboarding) {
      res.redirect(`${frontendUrl}/onboarding?oauth_success=true&platform=twitter`);
    } else {
      res.redirect(`${frontendUrl}/connections?oauth_success=true&platform=twitter`);
    }

  } catch (err) {
    console.error("Twitter Exchange Failed:", err);
    res.redirect(`${frontendUrl}/connections?oauth_error=exchange_failed`);
  }
});

export default router;


