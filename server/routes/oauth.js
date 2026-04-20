import express from 'express';
import axios from 'axios';
import Settings from '../models/Settings.js';
import User from '../models/User.js';
import verifyToken from '../middleware/auth.js';

const router = express.Router();

// Step 1: Redirect to Facebook OAuth
router.get('/facebook', verifyToken, (req, res) => {
  const appId = process.env.META_APP_ID;
  let baseUrl = process.env.API_BASE_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
  
  // Clean trailing slash to prevent double-slash issues
  if (baseUrl.endsWith('/')) {
    baseUrl = baseUrl.slice(0, -1);
  }

  if (!process.env.API_BASE_URL && process.env.NODE_ENV === 'production') {
    return res.status(500).json({ error: "Missing API_BASE_URL in production. Set it in Render/Vercel settings." });
  }

  const redirectUri = encodeURIComponent(`${baseUrl}/api/oauth/facebook/callback`);
  // Scope defines what permissions we are asking for
  // Unified scope for Instagram, Facebook Pages, and WhatsApp Business
  // Added 'instagram_basic' and 'pages_show_list' for more reliable account discovery
  const scope = 'instagram_basic,instagram_manage_messages,pages_show_list,pages_manage_metadata,pages_messaging,whatsapp_business_management,whatsapp_business_messaging,business_management';
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
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';

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
    let baseUrl = process.env.API_BASE_URL || (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000');
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    const redirectUri = `${baseUrl}/api/oauth/facebook/callback`;

    // 1. Exchange the auth 'code' for a short-lived access token
    const tokenUrl = `https://graph.facebook.com/v19.0/oauth/access_token?client_id=${appId}&redirect_uri=${redirectUri}&client_secret=${appSecret}&code=${code}`;
    const tokenRes = await axios.get(tokenUrl);
    const shortLivedToken = tokenRes.data.access_token;

    // 2. Exchange short-lived token for a Long-Lived Access Token (60 days)
    const longLivedUrl = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${shortLivedToken}`;
    const longLivedRes = await axios.get(longLivedUrl);
    const longToken = longLivedRes.data.access_token;

    // 3. Get User's Pages to extract Page ID and connected Instagram Account ID
    const pagesUrl = `https://graph.facebook.com/v19.0/me/accounts?fields=id,name,access_token,instagram_business_account&access_token=${longToken}`;
    const pagesRes = await axios.get(pagesUrl);
    
    // Attempt to find the first page that has an Instagram Business Account connected
    let pageId = '';
    let businessAccountId = '';
    let accountName = '';
    let instagramAccessToken = longToken; // Short-term using user token, can be refined to page token if needed

    const pages = pagesRes.data.data;
    console.log(`🔍 Meta Discovery: User has ${pages?.length || 0} pages.`);
    
    if (pages && pages.length > 0) {
      // Find the page that actually has an IG account connected
      const pageWithInsta = pages.find(p => p.instagram_business_account);
      
      if (pageWithInsta) {
        pageId = pageWithInsta.id;
        businessAccountId = pageWithInsta.instagram_business_account.id;
        accountName = pageWithInsta.name; // Initially use FB Page Name
        
        // Try to fetch the IG Username (actual handle) for better UX
        try {
          const igUrl = `https://graph.facebook.com/v19.0/${businessAccountId}?fields=username,name&access_token=${longToken}`;
          const igRes = await axios.get(igUrl);
          if (igRes.data && igRes.data.username) {
            accountName = igRes.data.username; // Use @handle if found
            console.log(`📸 Found Instagram Account: @${accountName}`);
          }
        } catch (igErr) {
          console.warn("⚠️ Could not fetch IG username, using page name instead.");
        }
      } else {
        // Fallback: use first page if no IG found
        pageId = pages[0].id;
        accountName = pages[0].name;
        console.warn("⚠️ No Instagram Business Account found linked to these pages.");
      }
    }

    // 4. GET WHATSAPP BUSINESS ACCOUNTS AND PHONE NUMBERS (Robust Multi-Path Discovery)
    let whatsappPhoneId = '';
    let whatsappName = '';
    let whatsappAccessToken = longToken; 
    let whatsappDiscoveryError = '';

    try {
      console.log("🔍 WhatsApp Discovery: Starting robust scan...");
      
      // Path A: Direct Field Access (More reliable for certain App Types)
      const fieldUrl = `https://graph.facebook.com/v19.0/me?fields=whatsapp_business_accounts{id,name,phone_numbers}&access_token=${longToken}`;
      const fieldRes = await axios.get(fieldUrl);
      const wabaData = fieldRes.data.whatsapp_business_accounts?.data || [];

      if (wabaData && wabaData.length > 0) {
        console.log(`💬 WhatsApp Discovery: Found ${wabaData.length} WABAs via Field Access.`);
        
        for (const waba of wabaData) {
          const phones = waba.phone_numbers?.data || [];
          if (phones && phones.length > 0) {
            whatsappPhoneId = phones[0].id;
            whatsappName = phones[0].display_phone_number || phones[0].verified_name || "WhatsApp Business";
            console.log(`✅ WhatsApp Found (Path A): ${whatsappName}`);
            break;
          }
        }
      }

      // Path B Fallback: Edge Access (Generic)
      if (!whatsappPhoneId) {
        const edgeUrl = `https://graph.facebook.com/v19.0/me/whatsapp_business_accounts?access_token=${longToken}`;
        const edgeRes = await axios.get(edgeUrl);
        const edgeData = edgeRes.data.data || [];
        
        if (edgeData.length > 0) {
          console.log(`📡 WhatsApp Discovery: Scanning ${edgeData.length} WABAs via Edge Access...`);
          for (const waba of edgeData) {
            const phoneRes = await axios.get(`https://graph.facebook.com/v19.0/${waba.id}/phone_numbers?access_token=${longToken}`);
            const phones = phoneRes.data.data;
            if (phones && phones.length > 0) {
              whatsappPhoneId = phones[0].id;
              whatsappName = phones[0].display_phone_number || phones[0].verified_name || "WhatsApp Business";
              console.log(`✅ WhatsApp Found (Path B): ${whatsappName}`);
              break;
            }
          }
        }
      }

      if (!whatsappPhoneId && !whatsappDiscoveryError) {
        whatsappDiscoveryError = 'No verified WhatsApp phone numbers were found. Ensure your number is active in Meta Business Suite.';
      }

    } catch (wErr) {
      const errorMsg = wErr.response?.data?.error?.message || wErr.message;
      const errorCode = wErr.response?.data?.error?.code;

      if (errorMsg.includes("whatsapp_business_accounts") && (errorCode === 100 || errorMsg.includes("nonexisting field"))) {
        whatsappDiscoveryError = 'ACTION REQUIRED: The "WhatsApp" product is missing from your Meta App. Please add it in the Meta Developer Portal.';
      } else {
        whatsappDiscoveryError = errorMsg;
      }
      console.error("❌ WhatsApp Discovery Error:", whatsappDiscoveryError);
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
        whatsappError: whatsappDiscoveryError,
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
