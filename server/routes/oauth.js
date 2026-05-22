import express from 'express';
import axios from 'axios';
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

const router = express.Router();

// Step 1: Redirect to Facebook OAuth
router.get('/facebook', verifyToken, (req, res) => {
  const appId = process.env.META_APP_ID;
  let baseUrl = process.env.API_BASE_URL || 'https://dm-automation-w9a4.vercel.app';

  // Clean trailing slash to prevent double-slash issues
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  const redirectUri = encodeURIComponent(`${baseUrl}/api/oauth/facebook/callback`);
  const scope = 'instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_messages,pages_show_list,pages_manage_metadata,pages_messaging,whatsapp_business_management,whatsapp_business_messaging,business_management';
  const state = req.user.userId + (req.query.onboarding === 'true' ? '_onboarding' : '') + (req.query.connectType ? `_${req.query.connectType}` : '');

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
  let userId = state
    ? state
        .replace('_onboarding', '')
        .replace('_instagram', '')
        .replace('_facebook', '')
        .replace('_whatsapp', '')
        .replace('_threads', '')
    : '';

  if (error) {
    console.error("OAuth Error:", error);
    return res.redirect(`${frontendUrl}/${isFromOnboarding ? 'onboarding' : 'settings'}?oauth_error=declined`);
  }

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/${isFromOnboarding ? 'onboarding' : 'settings'}?oauth_error=missing_parameters`);
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
    let accountName = '';

    const pages = pagesRes.data.data;
    console.log(`🔍 Meta Discovery: User has ${pages?.length || 0} pages.`);

    if (pages && pages.length > 0) {
      const pageWithInsta = pages.find(p => p.instagram_business_account);

      if (pageWithInsta) {
        pageId = pageWithInsta.id;
        // ✅ CRITICAL: Use PAGE-LEVEL token — required for Instagram Messaging API
        pageAccessToken = pageWithInsta.access_token || longToken;
        businessAccountId = pageWithInsta.instagram_business_account.id;
        accountName = pageWithInsta.name;

        console.log(`📄 Found FB Page: ${pageId}, Page Token prefix: ${pageAccessToken.substring(0, 10)}...`);

        // Try to fetch the IG Username for better UX
        try {
          const igUrl = `https://graph.facebook.com/v19.0/${businessAccountId}?fields=username,name&access_token=${pageAccessToken}`;
          const igRes = await axios.get(igUrl);
          if (igRes.data && igRes.data.username) {
            accountName = igRes.data.username;
            console.log(`📸 Found Instagram Account: @${accountName}`);
          }
        } catch (igErr) {
          console.warn("⚠️ Could not fetch IG username, using page name instead.");
        }
      } else {
        pageId = pages[0].id;
        pageAccessToken = pages[0].access_token || longToken;
        accountName = pages[0].name;
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

    if (isThreads) {
      // Serialize Threads data into connectedPageName TEXT column (no extra schema needed)
      const threadsData = {
        isThreadsConnected: true,
        threadsAccessToken: pageAccessToken || longToken,
        threadsPageId: pageId || '',
        connectedThreadsName: accountName || 'Threads Account'
      };
      updateData.connectedPageName = JSON.stringify(threadsData);
      console.log(`✅ Threads: Serialized connection for user ${userId}.`);
    } else if (isWhatsApp) {
      updateData.isWhatsAppConnected = !!whatsappPhoneId;
      if (whatsappPhoneId) {
        updateData.whatsappToken = longToken;
        updateData.whatsappPhoneNumberId = whatsappPhoneId;
        updateData.whatsappBusinessAccountId = whatsappBusinessAccountId;
        updateData.isWhatsAppConnected = true;
        console.log(`✅ WhatsApp: Saved Phone ID ${whatsappPhoneId} for user ${userId}.`);
      } else {
        console.warn('⚠️ WhatsApp connected but no phone number ID found. Marking as connected without phone ID.');
        updateData.isWhatsAppConnected = false;
      }
    } else if (isInstagram) {
      updateData.instagramAccessToken = pageAccessToken;
      updateData.instagramPageId = pageId;
      updateData.businessAccountId = businessAccountId;
      updateData.isAccountConnected = !!businessAccountId;
      updateData.connectedInstagramName = accountName;
    } else if (isFacebook) {
      updateData.facebookAccessToken = pageAccessToken;
      updateData.facebookPageId = pageId;
      updateData.isFacebookConnected = !!pageId;
      updateData.connectedFacebookName = accountName;
    } else {
      // Default/general flow — fill Instagram + Facebook fields
      updateData.instagramAccessToken = pageAccessToken;
      updateData.facebookAccessToken = pageAccessToken;
      updateData.instagramPageId = pageId;
      updateData.businessAccountId = businessAccountId;
      updateData.facebookPageId = pageId;
      updateData.connectedInstagramName = accountName;
      updateData.connectedFacebookName = accountName;
      updateData.isFacebookConnected = !!pageId;
      updateData.isAccountConnected = !!businessAccountId;
    }

    // Non-WhatsApp flows: don't overwrite whatsapp fields
    if (!isWhatsApp && !isThreads) {
      // Only touch WhatsApp fields if it was explicitly a WhatsApp connection
      // (Leave whatsapp* columns untouched for Instagram/Facebook flows)
    }

    /*
    // Strict Single-Owner Mapping: Clean up other settings rows that might be linked to this page/account
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

    const updatedSettings = await Settings.findOneAndUpdate(
      { userId: userId },
      updateData,
      { upsert: true, new: true }
    );

    console.log(`✅ OAuth Success: Linked Pages for user ${userId}. Page Token prefix: ${pageAccessToken.substring(0, 10)}...`);
    if (isFromOnboarding) {
      res.redirect(`${frontendUrl}/onboarding?oauth_success=true`);
    } else {
      res.redirect(`${frontendUrl}/settings?oauth_success=true`);
    }

  } catch (err) {
    console.error("OAuth Exchange Failed:", err.response?.data || err.message);
    if (isFromOnboarding) {
      res.redirect(`${frontendUrl}/onboarding?oauth_error=exchange_failed`);
    } else {
      res.redirect(`${frontendUrl}/settings?oauth_error=exchange_failed`);
    }
  }
});

// Zorcha Exact Flow: Get available Facebook Pages & their linked Instagram accounts
router.get('/facebook/pages', verifyToken, async (req, res) => {
  try {
    const settings = await Settings.findOne({ userId: req.user.userId });
    const token = settings?.facebookAccessToken || settings?.instagramAccessToken || process.env.META_PAGE_ACCESS_TOKEN;

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
    // Strict Single-Owner Mapping: Clean up other settings rows that might be linked to this page/account
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

    const settings = await Settings.findOneAndUpdate(
      { userId: req.user.userId },
      updateData,
      { upsert: true, new: true }
    );

    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
