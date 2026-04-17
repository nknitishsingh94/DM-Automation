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
  const scope = 'instagram_manage_messages,pages_manage_metadata,pages_messaging';
  // State is used to pass the user ID through the OAuth flow securely
  const state = req.user.id; 

  if (!appId) {
    return res.status(500).json({ error: "Missing META_APP_ID in environment variables" });
  }

  const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&state=${state}&response_type=code`;
  
  res.json({ url: authUrl });
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

    // 4. Save the Tokens and IDs to the Database
    await Settings.findOneAndUpdate(
      { userId: userId },
      {
        instagramAccessToken: longToken,
        facebookAccessToken: longToken,
        instagramPageId: pageId,
        businessAccountId: businessAccountId,
        facebookPageId: pageId,
        isAccountConnected: true,
        isFacebookConnected: true,
        connectedInstagramName: accountName,
        connectedFacebookName: accountName,
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
