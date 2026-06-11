import express from 'express';
import axios from 'axios';
import Settings from '../models/Settings.js';
import verifyToken from '../middleware/auth.js';
import ScheduledPost from '../models/ScheduledPost.js';
import OpenAI from 'openai';

// Initialize OpenAI client lazily to prevent crash on boot if API key is missing
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key not configured. Please add OPENAI_API_KEY.");
  }
  return new OpenAI({ apiKey });
};

const router = express.Router();

// 1. Initiate OAuth Login
router.get('/auth', verifyToken, async (req, res) => {
  const { YOUTUBE_CLIENT_ID } = process.env;
  if (!YOUTUBE_CLIENT_ID) {
    return res.status(500).json({ error: 'YouTube Client ID not configured on server.' });
  }

  // Use a state parameter to pass back the userId
  const state = req.user.userId;
  let baseUrl = process.env.API_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://dm-automation-w9a4.vercel.app' : 'http://localhost:5001');
  if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
  const redirectUri = `${baseUrl}/api/youtube/callback`;
  
  const scope = encodeURIComponent('https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/youtube.upload');
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${YOUTUBE_CLIENT_ID}&redirect_uri=${redirectUri}&response_type=code&scope=${scope}&access_type=offline&prompt=consent&state=${state}`;

  res.redirect(authUrl);
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
    let baseUrl = process.env.API_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://dm-automation-w9a4.vercel.app' : 'http://localhost:5001');
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    const redirectUri = `${baseUrl}/api/youtube/callback`;

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
    const channelName = channel.snippet?.customUrl || channel.snippet.title || 'YouTube Channel';

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
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const settings = await Settings.findOne({ userId: req.user.id });
    if (!settings || !settings.isYoutubeConnected || !settings.youtubeAccessToken) {
      return res.json({ error: 'YouTube not connected', notConnected: true });
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
router.get('/videos', verifyToken, async (req, res) => {
  try {
    const settings = await Settings.findOne({ userId: req.user.id });
    if (!settings || !settings.isYoutubeConnected || !settings.youtubeAccessToken) {
      return res.json({ error: 'YouTube not connected', notConnected: true });
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
router.post('/generate-thumbnail', verifyToken, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const aiResponse = await getOpenAIClient().images.generate({
      model: "dall-e-3",
      prompt: `A high-quality, eye-catching YouTube thumbnail for a video titled: "${prompt}". No text, just vibrant visual elements.`,
      n: 1,
      size: "1024x1024",
    });

    const imageUrl = aiResponse.data[0].url;
    // Fetch the image to backend and convert to base64 to avoid CORS errors on frontend
    const imgRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64 = Buffer.from(imgRes.data, 'binary').toString('base64');
    const dataUri = `data:${imgRes.headers['content-type']};base64,${base64}`;
    
    res.json({ imageUrl: dataUri });
  } catch (err) {
    console.error('Thumbnail Generation Error:', err);
    res.status(500).json({ error: 'Failed to generate thumbnail' });
  }
});

// 6. Generate AI Metadata (Title/Description) 
router.post('/generate-metadata', verifyToken, async (req, res) => {
  try {
    const { prompt, options } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Video context/prompt is required' });

    let systemPrompt = "You are an expert YouTube SEO specialist. The user will provide a rough idea or title for a video. You must generate optimized metadata.";
    let userPrompt = `Video idea: "${prompt}".\n\n`;

    if (options?.titles) {
      userPrompt += "- Generate 3 catchy, high-converting YouTube titles.\n";
    }
    if (options?.description) {
      userPrompt += "- Generate a professional, SEO-optimized YouTube description (including timestamps placeholder if relevant).\n";
    }
    if (options?.tags) {
      userPrompt += "- Generate 15-20 trending, relevant comma-separated tags.\n";
    }

    userPrompt += "\nReturn EXACTLY in this JSON format:\n{\n  \"titles\": [\"Title 1\", \"Title 2\", \"Title 3\"],\n  \"description\": \"Your generated description...\",\n  \"tags\": \"tag1, tag2, tag3\"\n}";

    const aiResponse = await getOpenAIClient().chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(aiResponse.choices[0].message.content);
    res.json(result);
  } catch (err) {
    console.error('Metadata Generation Error:', err);
    res.status(500).json({ error: 'Failed to generate metadata' });
  }
});

// 7. Get Access Token for Direct Uploads
router.get('/access-token', verifyToken, async (req, res) => {
  try {
    const settings = await Settings.findOne({ userId: req.user.id });
    if (!settings || !settings.isYoutubeConnected || !settings.youtubeAccessToken) {
      return res.status(400).json({ error: 'YouTube not connected' });
    }
    
    // In a production app, we would verify the token hasn't expired 
    // and use the refreshToken to get a new one here if needed.
    res.json({ accessToken: settings.youtubeAccessToken });
  } catch (err) {
    console.error('Access Token Error:', err);
    res.status(500).json({ error: 'Failed to retrieve access token' });
  }
});

export default router;
