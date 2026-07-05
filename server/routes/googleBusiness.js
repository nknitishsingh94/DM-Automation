import express from 'express';
import axios from 'axios';
import verifyToken from '../middleware/auth.js';
import Settings from '../models/Settings.js';
import { supabase } from '../utils/supabase.js';

const router = express.Router();

/**
 * Helper to refresh GMB token if needed
 */
async function getValidToken(settings) {
  let accessToken = settings.googleBusinessAccessToken;
  if (!accessToken) throw new Error('Google Business not connected');

  if (settings.googleBusinessRefreshToken) {
    try {
      const refreshRes = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        refresh_token: settings.googleBusinessRefreshToken,
        grant_type: 'refresh_token'
      });
      if (refreshRes.data?.access_token) {
        accessToken = refreshRes.data.access_token;
        settings.googleBusinessAccessToken = accessToken;
        await settings.save();
      }
    } catch (e) {
      console.warn('GMB token refresh failed:', e.message);
    }
  }
  return accessToken;
}

/**
 * GET /api/google-business/locations
 * Fetches all available locations for the connected account
 */
router.get('/locations', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const workspaceId = req.workspaceId;
    
    const query = { userId };
    if (workspaceId) query.workspaceId = workspaceId;
    
    const settings = await Settings.findOne(query);
    if (!settings || !settings.googleBusinessAccessToken) {
      return res.status(400).json({ error: 'Google Business is not connected.' });
    }

    const token = await getValidToken(settings);

    // Get accounts
    let accountsRes;
    try {
      accountsRes = await axios.get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (e) {
      return res.status(500).json({ error: 'Failed to fetch accounts.' });
    }

    const accounts = accountsRes.data?.accounts || [];
    if (accounts.length === 0) return res.json({ locations: [] });

    // Fetch locations for all accounts
    let allLocations = [];
    for (const account of accounts) {
      try {
        const locRes = await axios.get(`https://mybusinessbusinessinformation.googleapis.com/v1/${account.name}/locations?readMask=name,title,storeCode`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (locRes.data?.locations) {
          allLocations = allLocations.concat(
            locRes.data.locations.map(loc => ({
              accountId: account.name,
              locationId: loc.name,
              title: loc.title
            }))
          );
        }
      } catch (e) {
        console.warn('Failed to fetch locations for account', account.name);
      }
    }

    res.json({ locations: allLocations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google-business/select-location
 * Saves the selected location to settings
 */
router.post('/select-location', verifyToken, async (req, res) => {
  try {
    const { accountId, locationId, title } = req.body;
    if (!accountId || !locationId) {
      return res.status(400).json({ error: 'Missing accountId or locationId' });
    }

    const userId = req.user.userId;
    const workspaceId = req.workspaceId;
    
    const query = { userId };
    if (workspaceId) query.workspaceId = workspaceId;
    
    const settings = await Settings.findOne(query);
    if (!settings) return res.status(404).json({ error: 'Settings not found' });

    settings.googleBusinessAccountId = accountId;
    settings.googleBusinessLocationId = locationId;
    settings.connectedGoogleBusinessName = title || 'Selected Location';

    // Parse and update connectedPageName JSON cache
    let pageData = {};
    try {
      if (settings.connectedPageName) {
        pageData = JSON.parse(settings.connectedPageName);
      }
    } catch(e) {}
    
    pageData.googleBusinessAccountId = accountId;
    pageData.googleBusinessLocationId = locationId;
    pageData.connectedGoogleBusinessName = title;
    
    settings.connectedPageName = JSON.stringify(pageData);
    await settings.save();

    res.json({ success: true, message: 'Location selected successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/google-business/reviews
 * Fetch recent reviews for the selected location
 */
router.get('/reviews', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const workspaceId = req.workspaceId;
    
    const query = { userId };
    if (workspaceId) query.workspaceId = workspaceId;
    
    const settings = await Settings.findOne(query);
    if (!settings || !settings.googleBusinessLocationId) {
      return res.status(400).json({ error: 'Google Business location not selected.' });
    }

    const token = await getValidToken(settings);
    
    // mybusiness.googleapis.com/v4/accounts/{accountId}/locations/{locationId}/reviews
    // locationId saved is already "locations/..." but we need the v4 format.
    const accountStr = settings.googleBusinessAccountId; // e.g. accounts/123
    const locationStr = settings.googleBusinessLocationId; // e.g. locations/456
    
    const v4AccountStr = accountStr.split('/')[1];
    const v4LocationStr = locationStr.split('/')[1];
    
    const endpoint = `https://mybusiness.googleapis.com/v4/accounts/${v4AccountStr}/locations/${v4LocationStr}/reviews`;
    
    const reviewsRes = await axios.get(endpoint, {
      headers: { Authorization: `Bearer ${token}` }
    });

    res.json(reviewsRes.data || { reviews: [] });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/google-business/reviews/reply
 * Reply to a specific review
 */
router.post('/reviews/reply', verifyToken, async (req, res) => {
  try {
    const { reviewId, replyText } = req.body;
    if (!reviewId || !replyText) {
      return res.status(400).json({ error: 'Missing reviewId or replyText' });
    }

    const userId = req.user.userId;
    const workspaceId = req.workspaceId;
    
    const query = { userId };
    if (workspaceId) query.workspaceId = workspaceId;
    
    const settings = await Settings.findOne(query);
    if (!settings || !settings.googleBusinessLocationId) {
      return res.status(400).json({ error: 'Location not selected.' });
    }

    const token = await getValidToken(settings);
    
    const accountStr = settings.googleBusinessAccountId.split('/')[1];
    const locationStr = settings.googleBusinessLocationId.split('/')[1];
    
    // Review ID comes as "reviewId123", endpoint expects accounts/X/locations/Y/reviews/Z/reply
    // If reviewId already contains the path, use it, else append.
    let fullReviewId = reviewId;
    if (!reviewId.startsWith('accounts/')) {
      fullReviewId = `accounts/${accountStr}/locations/${locationStr}/reviews/${reviewId}`;
    }
    
    const endpoint = `https://mybusiness.googleapis.com/v4/${fullReviewId}/reply`;
    
    const replyRes = await axios.put(endpoint, {
      comment: replyText
    }, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ success: true, data: replyRes.data });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: error.response?.data?.error?.message || error.message });
  }
});

export default router;
