import express from 'express';
import axios from 'axios';
import Settings from '../models/Settings.js';
import { authenticateToken } from './auth.js'; // Ensure this matches existing auth middleware
import ScheduledPost from '../models/ScheduledPost.js';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const router = express.Router();

// 1. Initiate OAuth Login
router.get('/auth', authenticateToken, async (req, res) => {
  const { YOUTUBE_CLIENT_ID } = process.env;
  if (!YOUTUBE_CLIENT_ID) {
    return res.status(500).json({ error: 'YouTube Client ID not configured on server.' });
  }

  // Use a state parameter to pass back the userId
  const state = req.user.id;
  const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/youtube/callback`;
  
  const scope = encodeURIComponent('https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload');
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${YOUTUBE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;

  res.json({ url: authUrl });
});

// 2. OAuth Callback
router.get('/callback', async (req, res) => {
  const { code, state, error } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (error) {
    return res.redirect(`${frontendUrl}/settings?error=youtube_auth_failed`);
  }

  try {
    const userId = state; // We passed userId in state
    const redirectUri = `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/youtube/callback`;

    const tokenRes = await axios.post('https://oauth2.googleapis.com/token', {
      client_id: process.env.YOUTUBE_CLIENT_ID,
      client_secret: process.env.YOUTUBE_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    });

    const { access_token, refresh_token } = tokenRes.data;

    // Fetch Channel Info to get Channel ID and Name
    const channelRes = await axios.get('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    if (!channelRes.data.items || channelRes.data.items.length === 0) {
      return res.redirect(`${frontendUrl}/settings?error=no_youtube_channel_found`);
    }

    const channel = channelRes.data.items[0];
    const channelId = channel.id;
    const channelName = channel.snippet.title;

    // Save to Settings
    await Settings.findOneAndUpdate(
      { userId },
      { 
        youtubeAccessToken: access_token,
        youtubeRefreshToken: refresh_token || '', // Refresh token is only sent on first auth usually
        youtubeChannelId: channelId,
        youtubeChannelName: channelName,
        isYoutubeConnected: true
      },
      { upsert: true }
    );

    res.redirect(`${frontendUrl}/settings?success=youtube_connected`);
  } catch (err) {
    console.error('YouTube OAuth Error:', err.response?.data || err.message);
    res.redirect(`${frontendUrl}/settings?error=youtube_auth_failed`);
  }
});

// 3. Get Channel Stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const settings = await Settings.findOne({ userId: req.user.id });
    if (!settings || !settings.isYoutubeConnected || !settings.youtubeAccessToken) {
      return res.status(400).json({ error: 'YouTube not connected' });
    }

    const { youtubeAccessToken } = settings;

    const statsRes = await axios.get('https://www.googleapis.com/youtube/v3/channels?part=statistics&mine=true', {
      headers: { Authorization: `Bearer ${youtubeAccessToken}` }
    });

    if (!statsRes.data.items || statsRes.data.items.length === 0) {
      // Token might be expired, need refresh logic here in production
      return res.status(400).json({ error: 'Could not fetch channel stats' });
    }

    const stats = statsRes.data.items[0].statistics;

    res.json({
      subscriberCount: stats.subscriberCount,
      viewCount: stats.viewCount,
      videoCount: stats.videoCount
    });
  } catch (err) {
    console.error('YouTube Stats Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch YouTube stats' });
  }
});


// 4. Get Latest Videos
router.get('/videos', authenticateToken, async (req, res) => {
  try {
    const settings = await Settings.findOne({ userId: req.user.id });
    if (!settings || !settings.isYoutubeConnected || !settings.youtubeAccessToken) {
      return res.status(400).json({ error: 'YouTube not connected' });
    }

    const { youtubeAccessToken, youtubeChannelId } = settings;

    const videosRes = await axios.get(`https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${youtubeChannelId}&maxResults=12&order=date&type=video`, {
      headers: { Authorization: `Bearer ${youtubeAccessToken}` }
    });

    if (!videosRes.data.items) {
      return res.json([]);
    }

    // Map to beautiful format for frontend
    const videos = videosRes.data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      status: 'Published',
      date: new Date(item.snippet.publishedAt).toLocaleDateString(),
      views: '-', // Needs another API call for stats per video, keeping simple for now
      likes: '-',
      comments: '-',
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url
    }));

    res.json(videos);
  } catch (err) {
    console.error('YouTube Videos Error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch YouTube videos' });
  }
});

// 5. Generate AI Thumbnail
router.post('/generate-thumbnail', authenticateToken, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const aiResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: `A high-quality, eye-catching YouTube thumbnail for a video titled: "${prompt}". No text, just vibrant visual elements.`,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = aiResponse.data[0].url;
    res.json({ imageUrl });
  } catch (err) {
    console.error('Thumbnail Generation Error:', err);
    res.status(500).json({ error: 'Failed to generate thumbnail' });
  }
});

// 6. Schedule Video
router.post('/schedule', authenticateToken, async (req, res) => {
  try {
    const { title, description, scheduledFor, mediaUrl, thumbnail } = req.body;
    
    if (!title || !scheduledFor || !mediaUrl) {
      return res.status(400).json({ error: 'Title, scheduled date, and video mediaUrl are required' });
    }

    const newPost = new ScheduledPost({
      userId: req.user.id,
      platform: 'youtube',
      caption: title, // We'll use caption field for title
      mediaUrl: JSON.stringify({ 
        videoUrl: mediaUrl, 
        description: description || '',
        thumbnail: thumbnail || ''
      }),
      scheduledFor: new Date(scheduledFor),
      status: 'Pending'
    });

    await newPost.save();
    res.json({ success: true, post: newPost });
  } catch (err) {
    console.error('Schedule Error:', err);
    res.status(500).json({ error: 'Failed to schedule video' });
  }
});

export default router;
