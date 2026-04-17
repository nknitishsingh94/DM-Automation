import express from 'express';
import axios from 'axios';
import Settings from '../models/Settings.js';
import User from '../models/User.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

// Step 1: Redirect to Facebook OAuth
router.get('/facebook', verifyToken, (req, res) => {
  const appId = process.env.META_APP_ID;
  const redirectUri = encodeURIComponent(`${process.env.API_BASE_URL || 'http://localhost:5000'}/api/oauth/facebook/callback`);
  // Scope defines what permissions we are asking for
  // Unified scope for Instagram, Facebook Pages, and WhatsApp Business
  const scope = 'instagram_manage_messages,pages_manage_metadata,pages_messaging,whatsapp_business_management,whatsapp_business_messaging,business_management';
  // State is used to pass the user ID through the OAuth flow securely
  const state = req.user.userId; 

  if (!appId) {
    return res.status(500).json({ error: "Missing META_APP_ID in environment variables" });
  }

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&response_type=code`;
  
  res.redirect(authUrl);
});

// Step 2: Handle OAuth Callback
router.get('/facebook/callback', async (req, res) => {
  const { code, state, error } = req.query;

  // Render frontend URL for redirection after success/failure
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) {
    console.error("OAuth Error:", error);
    return res.redirect(`${frontendUrl}/settings?oauth_error=declined`);
  }

  if (!code || !state) {
    return res.redirect(`${frontendUrl}/settings?oauth_error=missing_parameters`);
  }

  const userId = state;

  try {
    const appId = process.env.META_APP_ID;
    const appSecret = process.env.META_APP_SECRET;
    const redirectUri = `${process.env.API_BASE_URL || 'http://localhost:5000'}/api/oauth/facebook/callback`;

    // 1. Exchange the auth 'code' for a short-lived access token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`;
    const tokenRes = await axios.get(tokenUrl);
    const shortLivedToken = tokenRes.data.access_token;

    // 2. Exchange short-lived token for a Long-Lived Access Token (60 days)
    const longLivedUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
    const longLivedRes = await axios.get(longLivedUrl);
    const longToken = longLivedRes.data.access_token;

    // 3. Get User's Pages to extract Page ID and connected Instagram Account ID
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,instagram_business_account&access_token=${longToken}`;
    const pagesRes = await axios.get(pagesUrl);
    
    // Attempt to find the first page that has an Instagram Business Account connected
    let pageId = '';
    let businessAccountId = '';
    let accountName = '';

    const pages = pagesRes.data.data;
    if (pages && pages.length > 0) {
      const pageWithInsta = pages.find(p => p.instagram_business_account);
      if (pageWithInsta) {
        pageId = pageWithInsta.id;
        businessAccountId = pageWithInsta.instagram_business_account.id;
        accountName = pageWithInsta.name;
      } else {
        // Fallback: just use the first page if no Instagram is connected
        pageId = pages[0].id;
        accountName = pages[0].name;
      }
    }

    // 4. GET WHATSAPP BUSINESS ACCOUNTS AND PHONE NUMBERS (Auto-Discovery)
    let whatsappPhoneId = '';
    let whatsappName = '';
    let whatsappAccessToken = longToken; 

    try {
      const wabaUrl = `https://graph.facebook.com/v19.0/me/whatsapp_business_accounts?access_token=${longToken}`;
      const wabaRes = await axios.get(wabaUrl);
      const wabaData = wabaRes.data.data;

      if (wabaData && wabaData.length > 0) {
        // Use the first WhatsApp Business Account
        const wabaId = wabaData[0].id;
        const phoneUrl = `https://graph.facebook.com/v19.0/${wabaId}/phone_numbers?access_token=${longToken}`;
        const phoneRes = await axios.get(phoneUrl);
        const phones = phoneRes.data.data;

        if (phones && phones.length > 0) {
          whatsappPhoneId = phones[0].id;
          whatsappName = phones[0].display_phone_number || phones[0].verified_name || "WhatsApp Business";
        }
      }
    } catch (wErr) {
      console.warn("⚠️ WhatsApp discovery failed (User might not have WABA):", wErr.response?.data || wErr.message);
    }

    // 5. Save the Tokens and IDs to the Database
    const updatedSettings = await Settings.findOneAndUpdate(
      { userId: userId },
      {
        instagramAccessToken: longToken,
        facebookAccessToken: longToken,
        whatsappToken: whatsappPhoneId ? longToken : "", // only set if we found a phone ID
        instagramPageId: pageId,
        businessAccountId: businessAccountId,
        facebookPageId: pageId,
        whatsappPhoneNumberId: whatsappPhoneId,
        isAccountConnected: !!businessAccountId,
        isFacebookConnected: !!pageId,
        isWhatsAppConnected: !!whatsappPhoneId,
        connectedInstagramName: accountName,
        connectedFacebookName: accountName,
        connectedWhatsAppName: whatsappName,
        lastTestedAt: new Date()
      },
      { upsert: true, new: true }
    );

    console.log(`✅ OAuth Success: Automatically linked Pages for user ${userId}`);
    res.redirect(`${frontendUrl}/settings?oauth_success=true`);

  } catch (err) {
    console.error("OAuth Exchange Failed:", err.response?.data || err.message);
    res.redirect(`${frontendUrl}/settings?oauth_error=exchange_failed`);
  }
});

export default router;
