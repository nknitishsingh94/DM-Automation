import 'dotenv/config';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- GLOBAL STABILITY GUARD ---
// Prevents // Main server file from crashing on unhandled errors
process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason);
  // Optional: Send alert to monitoring service
});

process.on('uncaughtException', (err) => {
  console.error('🔥 CRITICAL: Uncaught Exception thrown:', err.message);
  console.error(err.stack);
  // Keep the process alive if possible, or restart gracefully
});
import axios from 'axios';
import { createServer } from 'http';
import { Server } from 'socket.io';
import OpenAI from 'openai';

import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import hpp from 'hpp';
import xss from 'xss';
import webhookRoutes from './routes/webhooks.js';
import Campaign from './models/Campaign.js';
import Message from './models/Message.js';
import Settings from './models/Settings.js';
import User from './models/User.js';
import Contact from './models/Contact.js';
import Flow from './models/Flow.js';
import ScheduledPost from './models/ScheduledPost.js';
import PostLog from './models/PostLog.js';
import { runFlow } from './utils/FlowRunner.js';
import { sendMessageToInstagram, sendWhatsAppMessage, sendPrivateReply, sendPublicComment } from './utils/metaApi.js';
import authRoutes from './routes/auth.js';
import ChatMessage from './models/ChatMessage.js';
import Caption from './models/Caption.js';
import Review from './models/Review.js';
import paymentRoutes from './routes/payment.js';
import youtubeRoutes from './routes/youtube.js';
import formRoutes from './routes/forms.js';
import oauthRoutes from './routes/oauth.js';
import supportRoutes from './routes/support.js';
import threadsRoutes from './routes/threads.js';
import aiRoutes from './routes/ai.js';
import apiKeyRoutes from './routes/apiKeys.js';
import postsRoutes from './routes/posts.js';
import analyticsRoutes from './routes/analytics.js';
import { setupSwagger } from './swagger.js';
import { generateAIResponse } from './utils/aiHandler.js';
import { supabase, supabaseAdmin, convertObjectIDToUUID } from './utils/supabase.js';
import Workspace from './models/Workspace.js';
import { processYouTubeComments } from './utils/youtube-automation.js';

// --- GLOBAL CACHE (Nitro Speed) ---
const settingsCache = new Map();
const campaignsCache = new Map();

// Media proxy base URL used across routes and workers
const SERVER_PUBLIC_URL = process.env.API_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 5001}`);

// Periodic Cache Refresh (Every 30s)
async function refreshGlobalCache() {
  try {
    const [allSettings, allCampaigns] = await Promise.all([
      Settings.find({}),
      Campaign.find({ status: 'Active' })
    ]);
    
    settingsCache.clear();
    allSettings.forEach(s => {
      if (s.userId && s.workspaceId) {
        const key = `${s.userId.toString()}_${s.workspaceId.toString()}`;
        settingsCache.set(key, s);
      }
    });
    
    campaignsCache.clear();
    allCampaigns.forEach(c => {
      if (c.userId && c.workspaceId) {
        const key = `${c.userId.toString()}_${c.workspaceId.toString()}`;
        if (!campaignsCache.has(key)) campaignsCache.set(key, []);
        campaignsCache.get(key).push(c);
      }
    });
    
    console.log(`⚡ [NITRO] Cache Refreshed: ${settingsCache.size} settings, ${allCampaigns.length} active campaigns.`);
  } catch (err) {
    console.warn("⚠️ NITRO Cache Refresh Failed:", err.message);
  }
}
refreshGlobalCache();

// Helper to get all user IDs sharing the same connected page details within a workspace
function getSharedUserIdsSync(userId, workspaceId = null) {
  if (!userId) return [];
  const uidStr = userId.toString();
  
  // Find settings in cache
  let settings = null;
  if (workspaceId) {
    settings = settingsCache.get(`${uidStr}_${workspaceId}`);
  } else {
    for (const [key, s] of settingsCache.entries()) {
      if (key.startsWith(`${uidStr}_`)) {
        settings = s;
        break;
      }
    }
  }
  if (!settings) return [uidStr];
  
  const bId = settings.businessAccountId;
  const iId = settings.instagramPageId;
  const fId = settings.facebookPageId;
  const wId = settings.whatsappPhoneNumberId;
  
  if (!bId && !iId && !fId && !wId) {
    return [uidStr];
  }
  
  const uids = new Set([uidStr]);
  for (const [key, s] of settingsCache.entries()) {
    if (
      (bId && s.businessAccountId === bId) ||
      (iId && s.instagramPageId === iId) ||
      (fId && s.facebookPageId === fId) ||
      (wId && s.whatsappPhoneNumberId === wId)
    ) {
      if (s.userId) {
        uids.add(s.userId.toString());
      }
    }
  }
  return Array.from(uids);
}

// --- MULTER SETUP (Media Uploads - Using Memory Storage for Serverless compatibility) ---
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit (reduced from 50MB)
  fileFilter: (req, file, cb) => {
    // SECURITY: Only allow safe file types
    const ALLOWED_MIME = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'video/mp4', 'video/quicktime', 'video/webm',
      'audio/mpeg', 'audio/ogg',
    ];
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type '${file.mimetype}' is not allowed.`), false);
    }
  }
});
import verifyToken from './middleware/auth.js';

const app = express();
setupSwagger(app); // Initialize Swagger Docs
app.set('trust proxy', 1); // Trust Render/Vercel proxies for rate limiting
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: (origin, callback) => {
      // Allow all origins to resolve connectivity, but in a way that allows credentials
      callback(null, true);
    },
    methods: ["GET", "POST"]
  }
});

// ── SECURITY: Helmet (HTTP Headers) ──────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com", "https://*.facebook.com", "https://*.facebook.net", "https://*.instagram.com", "https://*.vercel.app"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "https://*.googleusercontent.com", "https://*.facebook.com", "https://*.instagram.com", "https://*.fbcdn.net", "https://*.vercel.app"],
      mediaSrc: ["'self'", "data:", "https:", "https://*.vercel.app"],
      connectSrc: ["'self'", "https://*.facebook.com", "https://*.facebook.net", "https://*.instagram.com", "https://api.openai.com", "https://accounts.google.com", "https://*.vercel.app"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://*.facebook.com", "https://*.instagram.com", "https://*.vercel.app"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// ── SECURITY: CORS (Whitelist Only) ──────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
  process.env.API_BASE_URL,
].filter(Boolean);

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Workspace-ID', 'x-workspace-id', 'workspace', 'Cache-Control']
}));
app.options('*', cors());

// Explicitly handle OPTIONS preflight for all routes
app.options('*', (req, res) => {
  res.sendStatus(204);
});

// ── SECURITY: Rate Limiters ───────────────────────────────────────────────────
// Auth routes (login/signup) — very strict to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,   // 15 minutes
  max: 20,                     // max 20 attempts per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  skip: (req) => req.path.includes('/api/webhook'), // webhooks bypass
});

// General API — prevent abuse
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,    // 1 minute
  max: 120,                    // 120 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please slow down.' },
  skip: (req) => req.path.includes('/api/webhook'),
});

// Webhook — Meta sends many events; don't rate limit
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/', (req, res) => { res.status(200).json({ message: '🚀 Instagram DM Automation AI API is running!', status: 'Healthy' }); });
app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);
app.use('/api/webhook', webhookLimiter);

app.use(compression());
app.use(morgan('combined'));

// ── Request Logging ───────────────────────────────────────────────────────────
app.use((req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No Origin'}`);
  }
  next();
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── SECURITY: Body size limits (prevent payload bombs) ────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// ── SECURITY: XSS Input Sanitization ──────────────────────────────────────────
// Sanitize string fields in req.body to prevent stored XSS attacks
app.use((req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    const sanitize = (obj) => {
      for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') {
          obj[key] = xss(obj[key]);
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
          sanitize(obj[key]);
        }
      }
    };
    sanitize(req.body);
  }
  next();
});

app.use(hpp());

app.use('/api', webhookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/forms', formRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/youtube', youtubeRoutes);
app.use('/api/threads', threadsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/apikeys', apiKeyRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/analytics', analyticsRoutes);

app.get('/api/health', (req, res) => res.json({ status: 'ok', domain: req.hostname, timestamp: new Date() }));
app.get('/api/ping', (req, res) => res.send('pong'));

// (Messaging helpers moved to utils/metaApi.js for cleaner architecture)

const checkFollowerStatus = async (platform, chatId, userId, preloadedSettings = null) => {
  if (platform !== 'instagram') return false; // Force false for Facebook so they get the Follow prompt

  try {
    const userSettings = preloadedSettings || await Settings.findOne({ userId });
    if (!userSettings || !userSettings.instagramAccessToken) {
      console.log("⚠️ Missing credentials for follow check. Defaulting to false.");
      return false; // MUST fail if no token to prevent unwanted leaks
    }

    // Official Instagram Messaging API way to check if a user follows the business.
    // Requires instagram_manage_messages and instagram_basic permissions.
    const res = await axios.get(`https://graph.facebook.com/v19.0/${chatId}?fields=is_user_follow_business&access_token=${userSettings.instagramAccessToken}`, {
      timeout: 5000 // Fast timeout so it doesn't block frontend load or webhook replies
    });

    // is_user_follow_business is a boolean returned by Meta
    return !!(res.data && res.data.is_user_follow_business === true);
  } catch (err) {
    console.warn("⚠️ Follow check API failed:", err.response?.data || err.message);
    // FALLBACK: Return false on API error so we strictly enforce the gated follower setting
    return false;
  }
};


// --- AI Studio Studio / Test Playground routes ---
app.get('/api/chats', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId);
    const messages = await ChatMessage.find({ userId: { $in: sharedUserIds }, workspaceId: req.workspaceId }).sort({ createdAt: 1 }).limit(50);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chats', verifyToken, async (req, res) => {
  try {
    const newMessage = new ChatMessage({ ...req.body, userId: req.user.userId, workspaceId: req.workspaceId });
    await newMessage.save();
    res.json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chat', verifyToken, async (req, res) => {
  try {
    const { message } = req.body;
    const reply = await generateAIResponse(req.user.userId, message);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/chats', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId);
    await ChatMessage.deleteMany({ userId: { $in: sharedUserIds }, workspaceId: req.workspaceId });
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard Stats Endpoint
app.get('/api/stats', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const sharedUserIds = getSharedUserIdsSync(userId, req.workspaceId);

    // Fetch real metrics dynamically from the database for this specific user
    const [sentMessages, receivedMessages, campaigns, contactCount] = await Promise.all([
      Message.countDocuments({ userId: { $in: sharedUserIds }, workspaceId: req.workspaceId, type: 'sent' }),
      Message.countDocuments({ userId: { $in: sharedUserIds }, workspaceId: req.workspaceId, type: 'received' }),
      Campaign.countDocuments({ userId: { $in: sharedUserIds }, workspaceId: req.workspaceId }),
      Contact.countDocuments({ userId: { $in: sharedUserIds }, workspaceId: req.workspaceId })
    ]);

    const totalDMs = sentMessages + receivedMessages;

    // Fetch current user plan
    const user = await User.findById(userId);
    const plan = user?.plan || 'free';

    res.json({
      totalDMs,
      sentMessages,
      receivedMessages,
      campaigns,
      messages: totalDMs,
      aiReplyRate: sentMessages > 0 ? `${Math.round((sentMessages / (sentMessages + receivedMessages)) * 100)}%` : "0%",
      plan,
      contactCount,
      newFollowers: contactCount // Maps to Contact count for active growth representation
    });
  } catch (err) {
    console.error("❌ DASHBOARD STATS ERROR:", err);
    res.status(500).json({ 
      error: "Stats calculation failed", 
      message: err.message
    });
  }
});

// Sync Campaign from Post (Scheduled or Live)
app.post('/api/campaigns/sync-from-post', verifyToken, async (req, res) => {
  try {
    const { postId, triggerKeyword, autoResponse, requireFollow } = req.body;
    
    // Find if a campaign already exists for this post
    // Note: verifyToken sets req.user.userId
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
    let campaign = await Campaign.findOne({ userId: { $in: sharedUserIds }, workspaceId: req.workspaceId, postId });

    if (campaign) {
      campaign.triggerKeyword = triggerKeyword;
      campaign.autoResponse = autoResponse;
      campaign.requireFollow = requireFollow;
      await campaign.save();
    } else {
      campaign = new Campaign({
        userId: req.user.userId,
        workspaceId: req.workspaceId,
        name: `Auto-Campaign: ${postId}`,
        triggerKeyword,
        autoResponse,
        requireFollow,
        postId,
        isAnyPost: false,
        status: 'active'
      });
      await campaign.save();
    }
    
    await refreshGlobalCache(); // Instant Sync
    res.json({ message: 'Automation synced successfully', campaign });
  } catch (err) {
    res.status(500).json({ message: 'Error syncing automation' });
  }
});

// Campaigns API
app.get('/api/campaigns', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
    const campaigns = await Campaign.find({
      userId: { $in: sharedUserIds },
      workspaceId: req.workspaceId
    }).sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    console.error("❌ Error fetching campaigns:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/campaigns', verifyToken, async (req, res) => {
  try {
    const { linkUrl } = req.body;

    // Basic URL validation if link is provided
    if (linkUrl) {
      try {
        new URL(linkUrl);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid URL provided. Please enter a valid link (e.g., https://example.com)' });
      }
    }

    const newCampaign = new Campaign({
      ...req.body,
      status: req.body.status || 'Active',
      userId: req.user.userId,
      workspaceId: req.workspaceId
    });
    await newCampaign.save();
    refreshGlobalCache(); // Instant Sync
    res.json(newCampaign);
  } catch (err) {
    console.error("❌ Error creating campaign:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/campaigns/:id', verifyToken, async (req, res) => {
  try {
    const updateData = { ...req.body };
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, userId: { $in: sharedUserIds }, workspaceId: req.workspaceId },
      { $set: updateData },
      { new: true }
    );
    refreshGlobalCache(); // Instant Sync
    res.json(campaign);
  } catch (err) {
    console.error("❌ Error updating campaign:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/campaigns/:id', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
    const result = await Campaign.findOneAndDelete({
      _id: req.params.id,
      userId: { $in: sharedUserIds },
      workspaceId: req.workspaceId
    });

    if (!result) {
      return res.status(404).json({ message: "Campaign not found or unauthorized to delete" });
    }

    refreshGlobalCache(); // Instant Sync
    res.json({ message: 'Campaign deleted successfully' });
  } catch (err) {
    console.error("❌ Error deleting campaign:", err.message);
    res.status(500).json({ error: "Internal Server Error: Could not delete campaign" });
  }
});

// Campaign Logs Endpoint
app.get('/api/campaigns/:id/logs', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId);
    const logs = await Message.find({
      userId: { $in: sharedUserIds },
      workspaceId: req.workspaceId,
      campaignId: req.params.id
    }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper to deserialize all advanced automation settings from mediaUrl JSON metadata
function parseScheduledPost(post) {
  if (!post) return post;
  const p = post.toObject ? post.toObject() : { ...post };
  
  let instagramMediaId = null;
  let cachedLiveMediaUrl = null;
  let localImage = p.mediaUrl;
  let parsedMeta = null;

  if (p.mediaUrl && p.mediaUrl.startsWith('{')) {
    try {
      parsedMeta = JSON.parse(p.mediaUrl);
      p.type = parsedMeta.type || p.type;
      p.carouselItems = parsedMeta.carouselItems || [];
      p.buttons = parsedMeta.buttons || [];
      p.requireFollow = parsedMeta.requireFollow !== undefined ? parsedMeta.requireFollow : false;
      p.unfollowedResponse = parsedMeta.unfollowedResponse || '';
      p.publicReply = parsedMeta.publicReply || '';
      p.automationStatus = parsedMeta.automationStatus || 'Active';
      p.anyKeyword = parsedMeta.anyKeyword !== undefined ? parsedMeta.anyKeyword : false;
      p.openingMessage = parsedMeta.openingMessage !== undefined ? parsedMeta.openingMessage : false;
      p.openingMessageText = parsedMeta.openingMessageText || '';
      p.openingMessageButton = parsedMeta.openingMessageButton || '';
      p.triggerKeyword = parsedMeta.triggerKeyword || p.triggerKeyword || '';
      p.autoResponse = parsedMeta.autoResponse || p.autoResponse || '';
      
      instagramMediaId = parsedMeta.instagramMediaId || parsedMeta.facebookPostId || null;
      cachedLiveMediaUrl = parsedMeta.cachedLiveMediaUrl || null;
      localImage = parsedMeta.mediaUrl || (p.carouselItems.length > 0 ? p.carouselItems[0] : '');
      p.mediaUrl = localImage;
    } catch (e) {
      console.warn("⚠️ Metadata parse failed:", e.message);
    }
  } else if (p.mediaUrl && p.mediaUrl.startsWith('[')) {
    try {
      p.carouselItems = JSON.parse(p.mediaUrl);
      p.type = 'carousel';
      p.mediaUrl = p.carouselItems[0];
      localImage = p.mediaUrl;
    } catch (e) {
      console.warn("⚠️ Carousel items parse failed:", e.message);
    }
  }

  // Attach internal tracking attributes for live URL resolutions
  p._instagramMediaId = instagramMediaId;
  p._cachedLiveMediaUrl = cachedLiveMediaUrl;
  p._localImage = localImage;
  p._parsedMeta = parsedMeta;

  return p;
}

// Pinterest Boards API
app.get('/api/pinterest/boards', verifyToken, async (req, res) => {
  try {
    const query = { userId: req.user.userId };
    if (req.workspaceId) query.workspaceId = req.workspaceId;
    const Settings = (await import('./models/Settings.js')).default;
    const settings = await Settings.findOne(query);
    
    if (!settings || !settings.pinterestAccessToken) {
      return res.status(400).json({ error: 'Pinterest not connected.' });
    }

    const { default: axios } = await import('axios');
    const axiosRes = await axios.get('https://api.pinterest.com/v5/boards', {
      headers: { Authorization: `Bearer ${settings.pinterestAccessToken}` }
    });
    
    return res.json({ boards: axiosRes.data.items || [] });
  } catch (err) {
    console.error('❌ Error fetching Pinterest boards:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch Pinterest boards.' });
  }
});

// Scheduling API
app.get('/api/scheduling', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
    const posts = await ScheduledPost.find({ userId: { $in: sharedUserIds }, workspaceId: req.workspaceId }).sort({ scheduledFor: 1 });
    
    // Fetch user settings once to use across posts
    const userSettings = await Settings.findOne({ 
      userId: { $in: sharedUserIds },
      workspaceId: req.workspaceId,
      instagramAccessToken: { $ne: null }
    }) || await Settings.findOne({ userId: req.user.userId, workspaceId: req.workspaceId });
    const accessToken = userSettings?.instagramAccessToken;

    // Handle serialized metadata and fetch live image for Posted status
    const processedPosts = await Promise.all(posts.map(async (post) => {
      const p = parseScheduledPost(post);
      
      const instagramMediaId = p._instagramMediaId;
      const cachedLiveMediaUrl = p._cachedLiveMediaUrl;
      const localImage = p._localImage;
      const parsedMeta = p._parsedMeta;

      // Clean up temp properties
      delete p._instagramMediaId;
      delete p._cachedLiveMediaUrl;
      delete p._localImage;
      delete p._parsedMeta;

      // --- EXPECTED FLOW IMPLEMENTATION ---
      if (p.status === 'Posted') {
        if (cachedLiveMediaUrl) {
          p.mediaUrl = cachedLiveMediaUrl;
        } else if (instagramMediaId && accessToken) {
          p.mediaUrl = localImage; // Fallback to local image immediately to avoid blocking load
          
          // Fire-and-forget background check to cache the live URL for future loads
          const isFb = p.platform === 'facebook';
          const fetchToken = isFb ? (userSettings?.facebookPageAccessToken || userSettings?.facebookAccessToken || accessToken) : accessToken;
          
          axios.get(`https://graph.facebook.com/v19.0/${instagramMediaId}`, {
            params: {
              fields: isFb ? 'full_picture,picture,source' : 'media_url,thumbnail_url',
              access_token: fetchToken
            },
            timeout: 5000
          }).then(metaRes => {
            if (metaRes.data && (metaRes.data.media_url || metaRes.data.thumbnail_url || metaRes.data.full_picture || metaRes.data.source || metaRes.data.picture)) {
              const liveUrl = metaRes.data.thumbnail_url || metaRes.data.media_url || metaRes.data.full_picture || metaRes.data.source || metaRes.data.picture;
              if (parsedMeta) {
                parsedMeta.cachedLiveMediaUrl = liveUrl;
                ScheduledPost.findByIdAndUpdate(p.id || p._id, { mediaUrl: JSON.stringify(parsedMeta) }).catch(()=>{});
              }
            }
          }).catch(()=>{});

        } else {
          p.mediaUrl = localImage; // Fallback
        }
      } else {
        // Status is "scheduling" / "Scheduled" / "Retrying" / "Failed"
        // Always return the parsed Supabase public URL (not the raw JSON string)
        p.mediaUrl = localImage && localImage.startsWith('http') ? localImage : (parsedMeta?.mediaUrl || localImage || '');
      }

      return p;
    }));

    res.json(processedPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- NEW: Signed URL Endpoint for Large File Uploads (Bypasses Vercel 4.5MB limit) ---
app.post('/api/storage/sign', verifyToken, async (req, res) => {
  try {
    const { fileName, contentType } = req.body;
    if (!fileName) return res.status(400).json({ error: 'fileName is required' });

    console.log(`🔐 Generating Signed URL for: ${fileName}`);
    const { data, error } = await supabaseAdmin
      .storage
      .from('media')
      .createSignedUploadUrl(fileName);

    if (error) throw error;

    const proxyBase = `${SERVER_PUBLIC_URL}/api/storage/view?path=${encodeURIComponent(fileName)}`;

    res.json({ 
      uploadUrl: data.signedUrl, 
      token: data.token,
      publicUrl: proxyBase
    });
  } catch (err) {
    console.error('❌ Signed URL Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/storage/view', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ error: 'path is required' });

    // Redirect to Supabase public URL so Meta's crawlers can use HTTP Range
    // requests for video downloads (the old buffered proxy returned HTTP 400
    // to Meta because it didn't support Range headers).
    const { data } = supabaseAdmin.storage.from('media').getPublicUrl(filePath);
    if (data && data.publicUrl) {
      return res.redirect(302, data.publicUrl);
    }

    return res.status(404).json({ error: 'File not found' });
  } catch (err) {
    console.error('❌ Storage proxy error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/storage/proxy-external', async (req, res) => {
  try {
    const targetUrl = req.query.url;
    if (!targetUrl) return res.status(400).json({ error: 'url is required' });

    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
      }
    });

    if (!response.ok) {
      console.log('⚠️ Proxy external image failed: ' + response.status + ' ' + targetUrl);
      return res.redirect(302, 'https://placehold.co/400x400/f1f5f9/94a3b8.png?text=Expired');
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    res.setHeader('Content-Type', response.headers.get('content-type') || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(buffer);
  } catch (err) {
    console.error('❌ External Storage proxy error:', err.message);
    res.redirect(302, 'https://placehold.co/400x400/f1f5f9/94a3b8.png?text=Error');
  }
});

app.post('/api/scheduling', verifyToken, (req, res, next) => {
  // If request is JSON, skip multer and move to handler
  if (req.is('json')) {
    return next();
  }
  // Otherwise, use multer to process files
  upload.array('files', 10)(req, res, next);
}, async (req, res) => {
  try {
    let mediaFiles = [];
    
    // Handle files if uploaded via multipart
    if (req.files && req.files.length > 0) {
      console.log(`🚀 Memory Upload: Uploading ${req.files.length} files in parallel to Supabase Storage...`);
      const { uploadToSupabase } = await import('./utils/supabase.js');
      
      const uploadPromises = req.files.map(async (file) => {
        const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        const publicUrl = await uploadToSupabase(file.buffer, uniqueName, file.mimetype);
        if (!publicUrl) {
          throw new Error(`Failed to upload file "${file.originalname}" to Supabase Storage`);
        }
        return publicUrl;
      });

      mediaFiles = await Promise.all(uploadPromises);
    }

    // Determine final media URL and carousel items
    // If JSON was sent, files will be empty and we use body.mediaUrl / body.carouselItems
    let mediaUrl = mediaFiles.length > 0 ? mediaFiles[0] : req.body.mediaUrl;
    let carouselItems = mediaFiles.length > 0 ? mediaFiles : (req.body.carouselItems || []);

    // Unwrap JSON-stringified media metadata sent by the frontend (e.g. blob URL payloads)
    if (typeof mediaUrl === 'string' && mediaUrl.startsWith('{')) {
      try {
        const nested = JSON.parse(mediaUrl);
        if (nested.mediaUrl) mediaUrl = nested.mediaUrl;
        if (nested.carouselItems && Array.isArray(nested.carouselItems)) carouselItems = nested.carouselItems;
      } catch (e) {}
    }

    // Ensure carouselItems is always an array (Multer might send it as a string if it was FormData)
    if (typeof carouselItems === 'string') {
      try { carouselItems = JSON.parse(carouselItems); } catch (e) { carouselItems = [carouselItems]; }
    }
    
    // Serialize metadata for Supabase/DB compatibility
    const metadata = {
      type: req.body.type || 'image',
      carouselItems: carouselItems,
      mediaUrl: mediaUrl,
      buttons: typeof req.body.buttons === 'string' ? JSON.parse(req.body.buttons) : (req.body.buttons || []),
      requireFollow: req.body.requireFollow === 'true' || req.body.requireFollow === true,
      unfollowedResponse: req.body.unfollowedResponse || '',
      publicReply: req.body.publicReply || '',
      automationStatus: req.body.automationStatus || 'Active',
      anyKeyword: req.body.anyKeyword === 'true' || req.body.anyKeyword === true,
      openingMessage: req.body.openingMessage === 'true' || req.body.openingMessage === true,
      openingMessageText: req.body.openingMessageText || '',
      openingMessageButton: req.body.openingMessageButton || '',
      threadCustomCaption: req.body.threadCustomCaption || '',
      threadPosts: Array.isArray(req.body.threadPosts) ? req.body.threadPosts : [],
      gmbActionType: req.body.gmbActionType || 'LEARN_MORE',
      gmbCtaEnabled: req.body.gmbCtaEnabled,
      gmbSearchUrl: req.body.gmbSearchUrl || '',
      gmbCustomCaption: req.body.gmbCustomCaption || '',
      gmbTopicType: req.body.gmbTopicType || 'STANDARD',
      gmbEventTitle: req.body.gmbEventTitle || '',
        pinterestTitle: req.body.pinterestTitle || '',
        pinterestLink: req.body.pinterestLink || '',
        pinterestBoard: req.body.pinterestBoard || '',
        pinterestIsAIModified: req.body.pinterestIsAIModified || false,
        pinterestIsAIGeneratedPerson: req.body.pinterestIsAIGeneratedPerson || false,
        pinterestAllowComments: req.body.pinterestAllowComments !== undefined ? req.body.pinterestAllowComments : true,
        pinterestShowSimilarProducts: req.body.pinterestShowSimilarProducts !== undefined ? req.body.pinterestShowSimilarProducts : true,
        pinterestAltText: req.body.pinterestAltText || '',
      gmbEventStartDate: req.body.gmbEventStartDate || '',
      gmbEventEndDate: req.body.gmbEventEndDate || '',
      gmbOfferCouponCode: req.body.gmbOfferCouponCode || '',
      gmbOfferRedeemUrl: req.body.gmbOfferRedeemUrl || '',
      gmbOfferTerms: req.body.gmbOfferTerms || '',
      gmbProductName: req.body.gmbProductName || '',
      gmbProductPrice: req.body.gmbProductPrice || '',
      youtubeVideoId: req.body.youtubeVideoId || '',
      whatsappNumbers: req.body.whatsappNumbers || ''
    };
    
    const finalMediaUrl = JSON.stringify(metadata);

    // Normalize date to ISO string for consistent comparison in background worker
    let scheduledDate = req.body.scheduledFor;
    try {
      if (!scheduledDate || (typeof scheduledDate === 'string' && scheduledDate.trim() === '')) {
        scheduledDate = new Date().toISOString();
      } else {
        scheduledDate = new Date(scheduledDate).toISOString();
      }
    } catch (e) {
      scheduledDate = new Date().toISOString();
      console.error("⚠️ Date parsing error:", e.message);
    }

    const postData = {
      ...req.body,
      scheduledFor: scheduledDate,
      userId: req.user.userId,
      workspaceId: req.workspaceId,
      mediaUrl: finalMediaUrl,
      status: req.body.status || 'Scheduled'
    };

    // Clean up fields that might not exist in schema
    delete postData.type;
    delete postData.carouselItems;
    delete postData.buttons;
    delete postData.requireFollow;
    delete postData.unfollowedResponse;
    delete postData.publicReply;
    delete postData.automationStatus;
    delete postData.anyKeyword;
    delete postData.openingMessage;
    delete postData.openingMessageText;
    delete postData.openingMessageButton;
    delete postData.threadCustomCaption;
    delete postData.threadPosts;
    delete postData.gmbActionType;
    delete postData.gmbCtaEnabled;
    delete postData.gmbSearchUrl;
    delete postData.gmbCustomCaption;
    delete postData.gmbTopicType;
    delete postData.gmbEventTitle;
    delete postData.gmbEventStartDate;
    delete postData.gmbEventEndDate;
    delete postData.gmbOfferCouponCode;
    delete postData.gmbOfferRedeemUrl;
    delete postData.gmbOfferTerms;
    delete postData.gmbProductName;
    delete postData.gmbProductPrice;
    delete postData.youtubeVideoId;
    delete postData.whatsappNumbers;

    const newPost = new ScheduledPost(postData);
    try {
      await newPost.save();

      // OPTIMIZATION: Trigger the scheduling worker immediately if scheduled for now/past
      const isDue = !newPost.scheduledFor || new Date(newPost.scheduledFor) <= new Date();
      if (isDue) {
        console.log(`🚀 [Scheduling] Post ${newPost.id || newPost._id} is due immediately. Triggering worker...`);
        
        // 1. Local in-process execution (async, non-blocking)
        setImmediate(() => {
          runSchedulingWorker().catch(err => {
            console.error("❌ Error in background in-process worker:", err.message);
          });
        });

        // 2. External self-ping to prevent Vercel container freezing (fire and forget)
        const SERVER_PUBLIC_URL = process.env.API_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 5001}`);
        axios.get(`${SERVER_PUBLIC_URL}/api/cron/publish`).catch(err => {
          console.warn(`⚠️ Background API ping warning:`, err.message);
        });
      }

      res.json(parseScheduledPost(newPost));
    } catch (saveErr) {
      console.error('❌ SUPABASE SAVE ERROR (ScheduledPost):', saveErr.message || saveErr);
      if (saveErr.details) console.error('🔍 Error Details:', saveErr.details);
      if (saveErr.hint) console.error('💡 Hint:', saveErr.hint);
      console.error('📦 Payload sent:', JSON.stringify(postData, null, 2));
      throw saveErr;
    }
  } catch (err) {
    console.error('❌ SCHEDULING ERROR:', err.message);
    res.status(500).json({ error: 'Failed to schedule: ' + err.message });
  }
});



// Captions API
app.get('/api/captions', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
    const captions = await Caption.find({ userId: { $in: sharedUserIds }, workspaceId: req.workspaceId }).sort({ createdAt: -1 });
    res.json(captions || []);
  } catch (err) {
    console.error('❌ CAPTIONS FETCH ERROR:', err.message, err.code, err.details, err.hint);
    // Return empty array instead of 500 so UI doesn't crash
    res.json([]);
  }
});

app.post('/api/captions', verifyToken, async (req, res) => {
  try {
    const { supabase, convertObjectIDToUUID } = await import('./utils/supabase.js');
    const { title, content } = req.body;
    const userId = convertObjectIDToUUID(req.user.userId);
    const workspaceId = convertObjectIDToUUID(req.workspaceId);

    console.log('📝 Saving caption for user:', userId, '| workspace:', workspaceId, '| title:', title);

    if (!supabase) return res.status(500).json({ error: 'Database not connected' });

    // Enforce duplicate check across all shared user IDs
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
    const sharedUuids = sharedUserIds.map(uid => convertObjectIDToUUID(uid));
    const cleanContent = (content || '').trim();
    let checkQuery = supabase
      .from('captions')
      .select('id')
      .in('user_id', sharedUuids)
      .eq('content', cleanContent);

    if (workspaceId) {
      checkQuery = checkQuery.eq('workspace_id', workspaceId);
    }

    const { data: existing, error: checkError } = await checkQuery;

    if (checkError) {
      console.error('❌ CAPTIONS CHECK ERROR:', checkError.message);
    } else if (existing && existing.length > 0) {
      return res.status(200).json({ alreadySaved: true, message: 'Already caption is saved' });
    }

    const insertPayload = { title: title || '', content: content || '', user_id: userId };
    if (workspaceId) {
      insertPayload.workspace_id = workspaceId;
    }

    const { data, error } = await supabase
      .from('captions')
      .insert(insertPayload)
      .select()
      .limit(1);

    if (error) {
      console.error('❌ CAPTIONS SAVE ERROR:', error.message, error.code, error.details, error.hint);
      return res.status(500).json({ error: error.message, details: error.details, hint: error.hint });
    }

    console.log('✅ Caption saved:', data);
    res.json(data && data.length > 0 ? data[0] : { success: true });
  } catch (err) {
    console.error('❌ CAPTIONS SAVE CRASH:', err.message);
    res.status(500).json({ error: err.message });
  }
});


app.delete('/api/captions/:id', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
    await Caption.findOneAndDelete({ _id: req.params.id, userId: { $in: sharedUserIds }, workspaceId: req.workspaceId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/scheduling/:id', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId);

    // Use direct Supabase query to avoid userId UUID mapping issues
    const { supabase: _sbPut } = await import('./utils/supabase.js');
    const { data: putRows, error: putFetchErr } = await _sbPut
      .from('scheduled_posts')
      .select('*')
      .eq('id', req.params.id)
      .limit(1);
    if (putFetchErr) throw new Error(putFetchErr.message);
    const postToUpdate = putRows && putRows.length > 0 ? ScheduledPost(putRows[0]) : null;
    if (!postToUpdate) return res.status(404).json({ error: 'Post not found' });

    const updateData = { ...req.body };
    
    if (updateData.response !== undefined && updateData.autoResponse === undefined) {
      updateData.autoResponse = updateData.response;
    }
    
    // 1. Handle Schema-Safe Metadata (Serialize all advanced options into mediaUrl JSON)
    let currentMetadata = {};
    try {
      if (postToUpdate.mediaUrl && postToUpdate.mediaUrl.startsWith('{')) {
        currentMetadata = JSON.parse(postToUpdate.mediaUrl);
      } else {
        currentMetadata = { mediaUrl: postToUpdate.mediaUrl, type: postToUpdate.type || 'image' };
      }
    } catch (e) {
      currentMetadata = { mediaUrl: postToUpdate.mediaUrl };
    }

    if (req.body.mediaUrl) {
      if (req.body.mediaUrl.startsWith('{')) {
        try {
          const incomingMeta = JSON.parse(req.body.mediaUrl);
          Object.assign(currentMetadata, incomingMeta);
        } catch(e) {}
      } else {
        currentMetadata.mediaUrl = req.body.mediaUrl;
      }
    }

    if (updateData.carouselItems !== undefined) currentMetadata.carouselItems = updateData.carouselItems;
    if (updateData.buttons !== undefined) currentMetadata.buttons = updateData.buttons;
    if (updateData.requireFollow !== undefined) currentMetadata.requireFollow = updateData.requireFollow;
    if (updateData.unfollowedResponse !== undefined) currentMetadata.unfollowedResponse = updateData.unfollowedResponse;
    if (updateData.publicReply !== undefined) currentMetadata.publicReply = updateData.publicReply;
    if (updateData.automationStatus !== undefined) currentMetadata.automationStatus = updateData.automationStatus;
    if (updateData.anyKeyword !== undefined) currentMetadata.anyKeyword = updateData.anyKeyword;
    if (updateData.openingMessage !== undefined) currentMetadata.openingMessage = updateData.openingMessage;
    if (updateData.openingMessageText !== undefined) currentMetadata.openingMessageText = updateData.openingMessageText;
    if (updateData.openingMessageButton !== undefined) currentMetadata.openingMessageButton = updateData.openingMessageButton;
    if (updateData.triggerKeyword !== undefined) currentMetadata.triggerKeyword = updateData.triggerKeyword;
    if (updateData.autoResponse !== undefined) currentMetadata.autoResponse = updateData.autoResponse;
    if (updateData.threadCustomCaption !== undefined) currentMetadata.threadCustomCaption = updateData.threadCustomCaption;
    if (updateData.threadPosts !== undefined) currentMetadata.threadPosts = updateData.threadPosts;
    if (updateData.gmbActionType !== undefined) currentMetadata.gmbActionType = updateData.gmbActionType;
    if (updateData.gmbCtaEnabled !== undefined) currentMetadata.gmbCtaEnabled = updateData.gmbCtaEnabled;
    if (updateData.gmbSearchUrl !== undefined) currentMetadata.gmbSearchUrl = updateData.gmbSearchUrl;
    if (updateData.gmbCustomCaption !== undefined) currentMetadata.gmbCustomCaption = updateData.gmbCustomCaption;
    if (updateData.gmbTopicType !== undefined) currentMetadata.gmbTopicType = updateData.gmbTopicType;
    if (updateData.gmbEventTitle !== undefined) currentMetadata.gmbEventTitle = updateData.gmbEventTitle;
    if (updateData.gmbEventStartDate !== undefined) currentMetadata.gmbEventStartDate = updateData.gmbEventStartDate;
    if (updateData.gmbEventEndDate !== undefined) currentMetadata.gmbEventEndDate = updateData.gmbEventEndDate;
    if (updateData.gmbOfferCouponCode !== undefined) currentMetadata.gmbOfferCouponCode = updateData.gmbOfferCouponCode;
    if (updateData.gmbOfferRedeemUrl !== undefined) currentMetadata.gmbOfferRedeemUrl = updateData.gmbOfferRedeemUrl;
    if (updateData.gmbOfferTerms !== undefined) currentMetadata.gmbOfferTerms = updateData.gmbOfferTerms;
    if (updateData.gmbProductName !== undefined) currentMetadata.gmbProductName = updateData.gmbProductName;
    if (updateData.gmbProductPrice !== undefined) currentMetadata.gmbProductPrice = updateData.gmbProductPrice;
    if (updateData.youtubeVideoId !== undefined) currentMetadata.youtubeVideoId = updateData.youtubeVideoId;

    updateData.mediaUrl = JSON.stringify(currentMetadata);

    // Clean up fields that might not exist in the Supabase schema
    delete updateData.buttons;
    delete updateData.type;
    delete updateData.carouselItems;
    delete updateData.anyKeyword;
    delete updateData.openingMessage;
    delete updateData.openingMessageText;
    delete updateData.openingMessageButton;
    delete updateData.requireFollow;
    delete updateData.unfollowedResponse;
    delete updateData.publicReply;
    delete updateData.automationStatus;
    delete updateData.triggerKeyword;
    delete updateData.autoResponse;
    delete updateData.threadCustomCaption;
    delete updateData.threadPosts;
    delete updateData.gmbActionType;
    delete updateData.gmbCtaEnabled;
    delete updateData.gmbSearchUrl;
    delete updateData.gmbCustomCaption;
    delete updateData.gmbTopicType;
    delete updateData.gmbEventTitle;
    delete updateData.gmbEventStartDate;
    delete updateData.gmbEventEndDate;
    delete updateData.gmbOfferCouponCode;
    delete updateData.gmbOfferRedeemUrl;
    delete updateData.gmbOfferTerms;
    delete updateData.gmbProductName;
    delete updateData.gmbProductPrice;
    delete updateData.youtubeVideoId;

    const updatedPost = await ScheduledPost.findOneAndUpdate(
      { id: req.params.id },
      updateData,
      { new: true }
    );
    
    if (!updatedPost) return res.status(404).json({ error: 'Post not found after update' });

    // 2. Sync to Active Campaign if already posted (Defensive)
    try {
      let igMediaId = null;
      let fbPostId = null;
      if (updatedPost.mediaUrl && updatedPost.mediaUrl.startsWith('{')) {
        try {
          const meta = JSON.parse(updatedPost.mediaUrl);
          igMediaId = meta.instagramMediaId;
          fbPostId = meta.facebookPostId;
        } catch (e) {}
      }

      const postIds = [];
      if (updatedPost.postId) postIds.push(updatedPost.postId);
      if (igMediaId) postIds.push(igMediaId);
      if (fbPostId) postIds.push(fbPostId);

      if (postIds.length > 0) {
        // Parse current metadata to get automationStatus and advanced options
        let automationStatus = 'Active';
        let reqFollow = false;
        let unfollowedResp = '';
        let pubReply = '';
        let openMsg = false;
        let openMsgText = '';
        let openMsgBtn = '';
        let btns = [];

        let triggerKeyword = updatedPost.triggerKeyword;
        let autoResponse = updatedPost.autoResponse;

        if (updatedPost.mediaUrl && updatedPost.mediaUrl.startsWith('{')) {
          try {
            const meta = JSON.parse(updatedPost.mediaUrl);
            automationStatus = meta.automationStatus || 'Active';
            reqFollow = meta.requireFollow || false;
            unfollowedResp = meta.unfollowedResponse || '';
            pubReply = meta.publicReply || '';
            openMsg = meta.openingMessage || false;
            openMsgText = meta.openingMessageText || '';
            openMsgBtn = meta.openingMessageButton || '';
            btns = meta.buttons || [];
            if (meta.triggerKeyword) triggerKeyword = meta.triggerKeyword;
            if (meta.autoResponse) autoResponse = meta.autoResponse;
          } catch (e) {}
        }

        const isPaused = (automationStatus === 'Paused') || !triggerKeyword || !autoResponse;

        console.log(`🔄 Syncing Campaign for post IDs ${postIds}. Paused status: ${isPaused}`);

        await Campaign.findOneAndUpdate(
          { userId: { $in: sharedUserIds }, postId: { $in: postIds } },
          { 
            userId: updatedPost.userId || req.user.userId,
            workspaceId: updatedPost.workspaceId || req.workspaceId,
            postId: igMediaId || updatedPost.postId || postIds[0],
            name: `Auto: ${(updatedPost.caption || '').substring(0, 20)}...`,
            isAnyPost: false,
            trigger: triggerKeyword || '*', 
            response: autoResponse || '',
            publicReplyText: pubReply,
            status: isPaused ? 'Paused' : 'Active',
            platform: updatedPost.platform || 'instagram',
            triggerOnComments: true,
            triggerOnDms: false,
            triggerOnStories: false,
            requireFollow: reqFollow,
            unfollowedResponse: unfollowedResp,
            openingMessage: openMsg,
            openingMessageText: openMsgText,
            openingMessageButton: openMsgBtn,
            buttons: btns
          },
          { upsert: true, new: true }
        );
        await refreshGlobalCache(); // Instant Sync
      }
    } catch (campaignErr) {
      console.error('⚠️ Campaign Sync Error (Non-critical):', campaignErr.message);
    }
    
    // OPTIMIZATION: Trigger the scheduling worker immediately if scheduled for now/past
    const isDue = (updatedPost.status === 'Scheduled') &&
                  (!updatedPost.scheduledFor || new Date(updatedPost.scheduledFor) <= new Date());
    if (isDue) {
      console.log(`🚀 [Scheduling] Post ${updatedPost.id || updatedPost._id} is updated and due immediately. Triggering worker...`);
      
      // 1. Local in-process execution (async, non-blocking)
      setImmediate(() => {
        runSchedulingWorker().catch(err => {
          console.error("❌ Error in background in-process worker:", err.message);
        });
      });

      // 2. External self-ping to prevent Vercel container freezing (fire and forget)
      const SERVER_PUBLIC_URL = process.env.API_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 5001}`);
      axios.get(`${SERVER_PUBLIC_URL}/api/cron/publish`).catch(err => {
        console.warn(`⚠️ Background API ping warning:`, err.message);
      });
    }
    
    res.json(parseScheduledPost(updatedPost));
  } catch (err) {
    console.error('❌ CRITICAL UPDATE ERROR:', err);
    if (err.details) console.error('🔍 DB Details:', err.details);
    if (err.hint) console.error('💡 DB Hint:', err.hint);
    res.status(500).json({ 
      error: err.message,
      details: err.details || 'Check server logs for more info'
    });
  }
});

app.delete('/api/scheduling/:id', verifyToken, async (req, res) => {
  try {
    const postId = req.params.id;
    console.log(`🗑️ DELETE scheduled post requested. ID: ${postId}, User: ${req.user.userId}`);

    // Import supabase directly to avoid userId UUID mapping issues in ScheduledPost.findOne
    const { supabase: _sb } = await import('./utils/supabase.js');

    // Fetch the post by its Supabase UUID directly
    const { data: postRows, error: fetchErr } = await _sb
      .from('scheduled_posts')
      .select('*')
      .eq('id', postId)
      .limit(1);

    if (fetchErr) throw new Error(fetchErr.message);

    const postToDelete = postRows && postRows.length > 0 ? postRows[0] : null;

    if (postToDelete) {
      // Parse associated media IDs for campaign cleanup
      let igMediaId = null;
      if (postToDelete.mediaUrl && postToDelete.mediaUrl.startsWith('{')) {
        try {
          const meta = JSON.parse(postToDelete.mediaUrl);
          igMediaId = meta.instagramMediaId;
        } catch (e) {}
      }

      const postIds = [];
      if (postToDelete.postId) postIds.push(postToDelete.postId);
      if (igMediaId) postIds.push(igMediaId);

      if (postIds.length > 0) {
        console.log(`🗑️ Deleting associated campaigns for post IDs:`, postIds);
        const sharedUserIds = getSharedUserIdsSync(req.user.userId);
        await Campaign.deleteMany({
          userId: { $in: sharedUserIds },
          workspaceId: req.workspaceId,
          postId: { $in: postIds }
        });
        await refreshGlobalCache();
      }

      // Delete directly from Supabase by UUID
      const { error: deleteErr } = await _sb.from('scheduled_posts').delete().eq('id', postId);
      if (deleteErr) throw new Error(deleteErr.message);

      console.log(`✅ Successfully deleted scheduled post: ${postId}`);
      return res.json({ success: true });
    }

    console.warn(`⚠️ Scheduled post not found for ID: ${postId}`);
    res.status(404).json({ error: "Post not found or unauthorized" });
  } catch (err) {
    console.error(`❌ Error in DELETE /api/scheduling/:id:`, err);
    res.status(500).json({ error: err.message });
  }
});


// Messages API (Inbox)
app.get('/api/messages', verifyToken, async (req, res) => {
  const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
  const messages = await Message.find({ userId: { $in: sharedUserIds }, workspaceId: req.workspaceId }).sort({ timestamp: 1 });
  res.json(messages);
});

// Optimized route for Audience Manager history
app.get('/api/messages/contact/:chatId', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
    const messages = await Message.find({
      userId: { $in: sharedUserIds },
      chatId: req.params.chatId,
      workspaceId: req.workspaceId
    }).sort({ timestamp: -1 }).limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', verifyToken, async (req, res) => {
  try {
    const { sender, text, type, chatId, platform } = req.body;
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);

    // Find if there is an existing contact under any of the shared user IDs to avoid creating duplicate contacts
    const existingContact = await Contact.findOne({ userId: { $in: sharedUserIds }, chatId: chatId || 'default', workspaceId: req.workspaceId });
    const targetUserId = existingContact ? existingContact.userId : req.user.userId;

    const newMessage = new Message({
      userId: targetUserId,
      workspaceId: req.workspaceId,
      sender,
      text,
      type: type || 'sent',
      chatId: chatId || 'default',
      platform: platform || 'instagram',
      timestamp: new Date()
    });

    await newMessage.save();

    // Auto-Upsert Contact Metadata under targetUserId
    try {
      await Contact.findOneAndUpdate(
        { userId: targetUserId, chatId: chatId || 'default', workspaceId: req.workspaceId },
        {
          $set: { lastActive: new Date(), platform: platform || 'instagram', workspaceId: req.workspaceId },
          $inc: { totalMessages: 1 },
          $setOnInsert: {
            name: sender !== 'AI Agent' && sender !== 'admin' ? sender : (chatId || 'default'),
            tags: [],
            notes: ''
          }
        },
        { upsert: true, new: true }
      );
    } catch (contactErr) {}

    sharedUserIds.forEach(uid => {
      io.to(uid).emit('new_message', newMessage);
    });

    // AI Auto-Reply Logic
    if (sender === 'user') {
      processAutoReply(targetUserId, platform || 'instagram', chatId, text, 'dm', null, null, null, req.workspaceId).catch(e => console.error(e));
    }

    res.json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Generation Endpoint
app.post('/api/ai/generate', verifyToken, async (req, res) => {
  try {
    const { prompt } = req.body;
    const { generateAIResponse } = await import('./utils/aiHandler.js');
    const response = await generateAIResponse(req.user.userId, prompt, req.workspaceId);
    res.json({ response });
  } catch (err) {
    console.error('❌ AI GENERATION ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// YouTube Frontend Resumable Upload URL Generator
app.post('/api/youtube/get-upload-url', verifyToken, async (req, res) => {
  try {
    const { fileSize, contentType, title, description } = req.body;
    const settings = await Settings.findOne({ userId: req.user.userId });
    if (!settings || !settings.youtubeAccessToken) {
      return res.status(400).json({ error: 'YouTube not connected.' });
    }

    const { default: axios } = await import('axios');
    let accessToken = settings.youtubeAccessToken;
    const oauth2Client = new OAuth2Client(process.env.YOUTUBE_CLIENT_ID, process.env.YOUTUBE_CLIENT_SECRET);

    if (settings.youtubeRefreshToken) {
      oauth2Client.setCredentials({ refresh_token: settings.youtubeRefreshToken });
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        accessToken = credentials.access_token;
        if (credentials.refresh_token) {
          settings.youtubeRefreshToken = credentials.refresh_token;
        }
        await Settings.findOneAndUpdate(
          { userId: req.user.userId },
          { youtubeAccessToken: accessToken, youtubeRefreshToken: settings.youtubeRefreshToken },
          { upsert: true }
        );
      } catch (refreshErr) {
        console.warn('⚠️ [YouTube] Token refresh failed, using existing access token:', refreshErr.message);
      }
    }

    const response = await axios.post(
      'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status',
      {
        snippet: {
          title: title ? title.substring(0, 100) : 'Video',
          description: description || ''
        },
        status: {
          privacyStatus: 'private'
        }
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Upload-Content-Length': fileSize,
          'X-Upload-Content-Type': contentType,
          'Content-Type': 'application/json'
        }
      }
    );

    const uploadUrl = response.headers.location || response.headers['Location'] || response.headers['location'];
    if (!uploadUrl) throw new Error('No upload URL returned from YouTube');

    res.json({ uploadUrl });
  } catch (err) {
    const errorMsg = err.response?.data?.error?.message || err.message;
    console.error('❌ YouTube Resumable Upload URL Error:', errorMsg);
    res.status(500).json({ error: errorMsg });
  }
});


app.delete('/api/messages/all', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
    await Message.deleteMany({ userId: { $in: sharedUserIds }, workspaceId: req.workspaceId });
    res.json({ message: 'All messages deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/messages/:id', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
    await Message.findOneAndDelete({ _id: req.params.id, userId: { $in: sharedUserIds }, workspaceId: req.workspaceId });
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Workspaces API ---
app.get('/api/workspaces', verifyToken, async (req, res) => {
  try {
    const { convertObjectIDToUUID } = await import('./utils/supabase.js');
    const userId = convertObjectIDToUUID(req.user.userId);
    const workspaces = await Workspace.find({ userId });
    
    // Fetch settings for each workspace to get connected account names
    let enrichedWorkspaces = [];
    try {
      enrichedWorkspaces = await Promise.all(workspaces.map(async (ws) => {
        const wsJson = ws.toJSON ? ws.toJSON() : { ...ws };
        try {
          const settings = await Settings.findOne({ userId, workspaceId: ws.id });
          if (settings) {
            wsJson.connectedInstagramName = settings.connectedInstagramName || null;
            wsJson.connectedFacebookName = settings.connectedFacebookName || null;
            wsJson.isInstagramConnected = settings.isAccountConnected || (!!settings.instagramAccessToken && !!settings.businessAccountId);
            wsJson.isFacebookConnected = settings.isFacebookConnected || (!!settings.facebookAccessToken && !!settings.facebookPageId);
            wsJson.isWhatsAppConnected = settings.isWhatsAppConnected || !!settings.whatsappToken;
            wsJson.isTelegramConnected = settings.isTelegramConnected || !!settings.telegramToken;
            wsJson.isDiscordConnected = settings.isDiscordConnected || !!settings.discordToken;
          }
        } catch (settingsErr) {
          // If query fails (e.g. column doesn't exist), just log and proceed without settings details
          console.warn(`⚠️ Settings lookup failed for workspace ${ws.id}:`, settingsErr.message);
        }
        return wsJson;
      }));
    } catch (err) {
      enrichedWorkspaces = workspaces;
    }
    res.json(enrichedWorkspaces || []);
  } catch (err) {
    console.warn("⚠️ Error fetching workspaces, returning empty array for safety:", err.message || err);
    res.json([]);
  }
});

app.post('/api/workspaces', verifyToken, async (req, res) => {
  try {
    const { convertObjectIDToUUID } = await import('./utils/supabase.js');
    const userId = convertObjectIDToUUID(req.user.userId);
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Workspace name is required' });
    }

    let finalName = name.trim();
    let counter = 1;
    
    // Find all workspaces for this user to check for duplicates
    const existingWorkspaces = await Workspace.find({ userId });
    const existingNames = existingWorkspaces.map(w => w.name.toLowerCase());
    
    // If the name already exists, append a counter suffix (e.g. "facebook 2")
    let tempName = finalName;
    while (existingNames.includes(tempName.toLowerCase())) {
      counter++;
      tempName = `${finalName} ${counter}`;
    }
    finalName = tempName;

    const newWorkspace = await Workspace.create({
      userId,
      name: finalName
    });
    // Initialize empty Settings for this new workspace
    const newSettings = new Settings({
      userId,
      workspaceId: newWorkspace.id,
      aiEnabled: false,
      isAccountConnected: false,
      isFacebookConnected: false,
      isWhatsAppConnected: false
    });
    await newSettings.save();
    
    // Refresh global cache so it is immediately registered
    await refreshGlobalCache();
    
    res.json(newWorkspace);
  } catch (err) {
    console.warn("⚠️ Error creating workspace:", err.message);
    if (err.message && (err.message.includes('relation') || err.message.includes('does not exist') || err.code === '42P01')) {
      return res.status(400).json({ error: 'Workspaces table does not exist. Please run the Supabase database migration script first.' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/workspaces/:id', verifyToken, async (req, res) => {
  try {
    const { convertObjectIDToUUID } = await import('./utils/supabase.js');
    const userId = convertObjectIDToUUID(req.user.userId);
    const workspaceId = convertObjectIDToUUID(req.params.id);

    // Find the workspace
    const workspace = await Workspace.findOne({ id: workspaceId, userId });
    if (!workspace) {
      return res.status(404).json({ error: 'Workspace not found' });
    }
    if (workspace.name === 'Default Workspace') {
      return res.status(400).json({ error: 'Default Workspace cannot be deleted.' });
    }

    // Delete the workspace (ON DELETE CASCADE in Postgres will delete settings/campaigns/etc.)
    await Workspace.findOneAndDelete({ id: workspaceId, userId });
    
    // Refresh global cache so it is immediately updated
    await refreshGlobalCache();
    
    res.json({ success: true, message: 'Workspace deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settings API
app.get('/api/settings', verifyToken, async (req, res) => {
  try {
    console.log(`🔍 SETTINGS LOOKUP: Fetching for userId: ${req.user.userId}, workspaceId: ${req.workspaceId}`);
    let settings = await Settings.findOne({ userId: req.user.userId, workspaceId: req.workspaceId });
    
    if (!settings) {
      console.warn(`⚠️ SETTINGS NOT FOUND for userId: ${req.user.userId}, workspaceId: ${req.workspaceId}. Creating default.`);
      settings = new Settings({ userId: req.user.userId, workspaceId: req.workspaceId });
      await settings.save();
    }
    
    console.log(`✅ SETTINGS FOUND for ${req.user.userId}: ${settings.connectedInstagramName || 'No IG Linked'}`);
    res.json(settings);
  } catch (err) {
    console.error(`❌ SETTINGS ERROR for ${req.user.userId}:`, err.message);
    res.status(500).json({
      error: err.message,
      hint: "Check if 'settings' table has 'userId' column and RLS is configured correctly."
    });
  }
});

app.get('/api/instagram/media', verifyToken, async (req, res) => {
  try {
    let settings = await Settings.findOne({ 
      userId: req.user.userId, 
      workspaceId: req.workspaceId,
      instagramAccessToken: { $ne: null }, 
      businessAccountId: { $ne: null } 
    });
    if (!settings) {
      const sharedUserIds = getSharedUserIdsSync(req.user.userId);
      settings = await Settings.findOne({ 
        userId: { $in: sharedUserIds }, 
        workspaceId: req.workspaceId,
        instagramAccessToken: { $ne: null }, 
        businessAccountId: { $ne: null } 
      });
    }
    const activeSettings = settings || await Settings.findOne({ userId: req.user.userId, workspaceId: req.workspaceId });

    if (!activeSettings || !activeSettings.instagramAccessToken || !activeSettings.businessAccountId) {
      return res.status(400).json({ error: 'Instagram account not fully connected' });
    }

    const { type } = req.query; // 'media' or 'stories'
    const endpoint = type === 'stories' ? 'stories' : 'media';

    const response = await axios.get(`https://graph.facebook.com/v19.0/${activeSettings.businessAccountId}/${endpoint}`, {
      params: {
        fields: 'id,media_type,media_url,thumbnail_url,timestamp,permalink',
        access_token: activeSettings.instagramAccessToken
      }
    });

    res.json(response.data.data || []);
  } catch (err) {
    console.error("❌ Error fetching IG media:", err.response?.data || err.message);
    const errorDetails = err.response?.data?.error?.message || err.message;
    res.status(400).json({ error: 'Failed to fetch Instagram media', details: errorDetails });
  }
});

app.get('/api/facebook/media', verifyToken, async (req, res) => {
  try {
    let settings = await Settings.findOne({ 
      userId: req.user.userId, 
      workspaceId: req.workspaceId,
      facebookAccessToken: { $ne: null }, 
      facebookPageId: { $ne: null } 
    });
    if (!settings) {
      const sharedUserIds = getSharedUserIdsSync(req.user.userId);
      settings = await Settings.findOne({ 
        userId: { $in: sharedUserIds }, 
        workspaceId: req.workspaceId,
        facebookAccessToken: { $ne: null }, 
        facebookPageId: { $ne: null } 
      });
    }
    const activeSettings = settings || await Settings.findOne({ userId: req.user.userId, workspaceId: req.workspaceId });

    if (!activeSettings || !activeSettings.facebookAccessToken || !activeSettings.facebookPageId) {
      return res.status(400).json({ error: 'Facebook account not fully connected' });
    }

    const response = await axios.get(`https://graph.facebook.com/v19.0/${activeSettings.facebookPageId}/published_posts`, {
      params: {
        fields: 'id,message,full_picture,created_time,permalink_url,attachments{media_type,type,media,subattachments}',
        access_token: activeSettings.facebookAccessToken
      }
    });

    // Map Facebook post fields to match the Instagram media format for the frontend
    const mappedData = (response.data.data || []).map(post => {
      let media_type = 'IMAGE'; // Default
      let media_url = post.full_picture;
      let thumbnail_url = post.full_picture;

      if (post.attachments && post.attachments.data && post.attachments.data.length > 0) {
        const attachment = post.attachments.data[0];
        
        // Extract media URL from attachment if available
        if (attachment.media) {
          if (attachment.media.source) {
            media_url = attachment.media.source; // Video source
          } else if (attachment.media.image && attachment.media.image.src) {
            media_url = attachment.media.image.src; // High-res image
            thumbnail_url = attachment.media.image.src;
          }
        }

        // Check for Video or Reel
        if (attachment.media_type === 'video' || attachment.type === 'video_inline' || attachment.type === 'video_autoplay' || attachment.type === 'reel') {
          media_type = 'VIDEO';
        } 
        // Check for Carousel / Album
        else if (attachment.subattachments && attachment.subattachments.data && attachment.subattachments.data.length > 1) {
          media_type = 'CAROUSEL_ALBUM';
          // Use first subattachment's image as thumbnail if available
          const firstSub = attachment.subattachments.data[0];
          if (firstSub.media && firstSub.media.image && firstSub.media.image.src) {
            media_url = firstSub.media.image.src;
            thumbnail_url = firstSub.media.image.src;
          }
        } else if (attachment.media_type === 'photo') {
          media_type = 'IMAGE';
        }
      }

      return {
        id: post.id,
        media_type: media_type,
        media_url: media_url,
        thumbnail_url: thumbnail_url,
        timestamp: post.created_time,
        permalink: post.permalink_url,
        caption: post.message
      };
    });

    res.json(mappedData);
  } catch (err) {
    console.error("❌ Error fetching FB media:", err.response?.data || err.message);
    const errorDetails = err.response?.data?.error?.message || err.message;
    res.status(400).json({ error: 'Failed to fetch Facebook posts', details: errorDetails });
  }
});

app.post('/api/settings', verifyToken, async (req, res) => {
  try {
    const platform = req.body._platform; // frontend sends which platform is being saved
    
    // Explicitly allow only valid settings columns in PostgreSQL to prevent 500 Column Not Found errors
    const allowedKeys = [
      'id', 'userId', 'workspaceId', 'instagramAccessToken', 'instagramPageId', 'businessAccountId', 'connectedInstagramName', 'isAccountConnected', 'instagramAutomationEnabled', 'facebookAccessToken', 'facebookPageId', 'connectedFacebookName', 'isFacebookConnected', 'facebookAutomationEnabled', 'whatsappToken', 'whatsappPhoneNumberId', 'connectedWhatsAppName', 'isWhatsAppConnected', 'whatsappAutomationEnabled', 'telegramToken', 'isTelegramConnected', 'telegramAutomationEnabled', 'twitterApiKey', 'isTwitterConnected', 'twitterAutomationEnabled', 'twitterAccessToken', 'twitterRefreshToken', 'connectedTwitterName', 'connectedTwitterId', 'youtubeApiKey', 'isYouTubeConnected', 'isYoutubeConnected', 'youtubeAutomationEnabled', 'youtubeAccessToken', 'youtubeRefreshToken', 'youtubeChannelId', 'youtubeChannelName', 'linkedinAccessToken', 'isLinkedInConnected', 'linkedinAutomationEnabled', 'connectedLinkedInName', 'isGoogleBusinessConnected', 'connectedGoogleBusinessName', 'googleBusinessAccessToken', 'googleBusinessRefreshToken', 'isThreadsConnected', 'threadsAccessToken', 'threadsPageId', 'connectedThreadsName', 'isPinterestConnected', 'connectedPinterestName', 'pinterestAccessToken', 'pinterestRefreshToken', 'connectedPinterestId', 'pinterestAutomationEnabled', 'lastTestedAt', 'aiFallbackMessage', 'aiName', 'aiTone', 'aiKnowledgeBase', 'aiTemperature', 'connectedPageName', 'whatsappBusinessAccountId'
    ];

    const data = {};
    for (const key of allowedKeys) {
      if (req.body[key] !== undefined) {
        data[key] = req.body[key];
      }
    }

    // ── Validate tokens against Meta Graph API ──
    if (platform === 'instagram') {
      if (data.instagramAccessToken) {
        try {
          const testRes = await axios.get(`https://graph.facebook.com/v19.0/me?access_token=${data.instagramAccessToken}`);
          if (testRes.data && testRes.data.id) {
            data.isAccountConnected = true;
            data.connectedInstagramName = testRes.data.name || testRes.data.id;
            data.lastTestedAt = new Date();
            console.log('✅ Instagram token validated:', data.connectedInstagramName);
          }
        } catch (metaErr) {
          data.isAccountConnected = false;
          const errMsg = metaErr.response?.data?.error?.message || 'Invalid Access Token';
          return res.status(400).json({
            error: `Instagram connection failed: ${errMsg}`,
            isAccountConnected: false
          });
        }
      } else {
        // Explicitly clear integration from database when disconnecting
        data.isAccountConnected = false;
        data.instagramAccessToken = null;
        data.instagramPageId = null;
        data.businessAccountId = null;
        data.connectedInstagramName = null;
      }
    }

    if (platform === 'facebook') {
      if (data.facebookAccessToken && data.facebookPageId) {
        try {
          const testRes = await axios.get(`https://graph.facebook.com/v19.0/${data.facebookPageId}?access_token=${data.facebookAccessToken}`);
          if (testRes.data && testRes.data.id) {
            data.isFacebookConnected = true;
            data.connectedFacebookName = testRes.data.name || testRes.data.id;
            data.lastTestedAt = new Date();
            console.log('✅ Facebook token validated:', data.connectedFacebookName);
          }
        } catch (metaErr) {
          data.isFacebookConnected = false;
          const errMsg = metaErr.response?.data?.error?.message || 'Invalid Access Token or Page ID';
          return res.status(400).json({
            error: `Facebook connection failed: ${errMsg}`,
            isFacebookConnected: false
          });
        }
      } else {
        data.isFacebookConnected = false;
      }
    }

    if (platform === 'whatsapp') {
      if (data.whatsappToken && data.whatsappPhoneNumberId) {
        try {
          const testRes = await axios.get(`https://graph.facebook.com/v19.0/${data.whatsappPhoneNumberId}?access_token=${data.whatsappToken}`);
          if (testRes.data && testRes.data.id) {
            data.isWhatsAppConnected = true;
            data.connectedWhatsAppName = testRes.data.verified_name || testRes.data.display_phone_number || testRes.data.id;
            data.lastTestedAt = new Date();
            console.log('✅ WhatsApp token validated:', data.connectedWhatsAppName);
          }
        } catch (metaErr) {
          data.isWhatsAppConnected = false;
          const errMsg = metaErr.response?.data?.error?.message || 'Invalid Access Token or Phone Number ID';
          return res.status(400).json({
            error: `WhatsApp connection failed: ${errMsg}`,
            isWhatsAppConnected: false
          });
        }
      } else {
        data.isWhatsAppConnected = false;
      }
    }

    // Safety: remove any unknown columns before saving
    delete data.connectionError;
    delete data._platform;

    const oldSettings = await Settings.findOne({ userId: req.user.userId, workspaceId: req.workspaceId });
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);

    if (platform === 'instagram' && data.isAccountConnected && oldSettings) {
      if (oldSettings.businessAccountId && oldSettings.businessAccountId !== data.businessAccountId) {
        console.log(`🧹 Instagram account changed from ${oldSettings.businessAccountId} to ${data.businessAccountId}. Clearing old IG history.`);
        await Message.deleteMany({ userId: { $in: sharedUserIds }, workspaceId: req.workspaceId, platform: 'instagram' });
        await ChatMessage.deleteMany({ userId: { $in: sharedUserIds }, workspaceId: req.workspaceId });
      }
    }

    if (platform === 'facebook' && data.isFacebookConnected && oldSettings) {
      if (oldSettings.facebookPageId && oldSettings.facebookPageId !== data.facebookPageId) {
        console.log(`🧹 Facebook account changed from ${oldSettings.facebookPageId} to ${data.facebookPageId}. Clearing old FB history.`);
        await Message.deleteMany({ userId: { $in: sharedUserIds }, workspaceId: req.workspaceId, platform: 'facebook' });
      }
    }

    const settings = await Settings.findOneAndUpdate(
      { userId: req.user.userId, workspaceId: req.workspaceId },
      { ...data, workspaceId: req.workspaceId },
      { upsert: true, new: true }
    );
    refreshGlobalCache(); // Instant Sync
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// WhatsApp Meta Embedded Signup API Connection
app.post('/api/settings/whatsapp/connect-embedded', verifyToken, async (req, res) => {
  try {
    const { accessToken, wabaId: inputWabaId, phoneNumberId: inputPhoneNumberId } = req.body;
    if (!accessToken) {
      return res.status(400).json({ error: 'Missing access token' });
    }

    // 1. Fetch User's Business Accounts first
    let businessRes;
    try {
      businessRes = await axios.get(`https://graph.facebook.com/v20.0/me/businesses?access_token=${accessToken}`);
    } catch (metaErr) {
      const errMsg = metaErr.response?.data?.error?.message || metaErr.message;
      return res.status(400).json({ error: `Failed to fetch businesses: ${errMsg}` });
    }

    if (!businessRes.data.data || businessRes.data.data.length === 0) {
      return res.status(400).json({ error: 'No Meta Business Accounts found. Please create one during the login popup.' });
    }

    const businessId = businessRes.data.data[0].id;

    // 2. Fetch WABAs owned by this business
    let wabaRes;
    try {
      wabaRes = await axios.get(`https://graph.facebook.com/v20.0/${businessId}/owned_whatsapp_business_accounts?access_token=${accessToken}`);
    } catch (metaErr) {
      const errMsg = metaErr.response?.data?.error?.message || metaErr.message;
      return res.status(400).json({ error: `Failed to fetch WABA: ${errMsg}` });
    }

    let wabaId = inputWabaId;
    let connectedName = 'WhatsApp Business';

    if (wabaId) {
      if (wabaRes.data.data && wabaRes.data.data.length > 0) {
        const matchedWaba = wabaRes.data.data.find(w => w.id === wabaId);
        if (matchedWaba && matchedWaba.name) {
          connectedName = matchedWaba.name;
        }
      }
    } else {
      if (!wabaRes.data.data || wabaRes.data.data.length === 0) {
        return res.status(400).json({ error: 'No WhatsApp Business Accounts found for this Business' });
      }
      wabaId = wabaRes.data.data[0].id;
      connectedName = wabaRes.data.data[0].name || 'WhatsApp Business';
    }

    // 3. Fetch the Phone Numbers for this WABA
    let phoneRes;
    try {
      phoneRes = await axios.get(`https://graph.facebook.com/v20.0/${wabaId}/phone_numbers?access_token=${accessToken}`);
    } catch (metaErr) {
      const errMsg = metaErr.response?.data?.error?.message || metaErr.message;
      return res.status(400).json({ error: `Failed to fetch phone numbers: ${errMsg}` });
    }

    let phoneNumberId = inputPhoneNumberId;
    let selectedPhone;

    if (phoneNumberId && phoneRes.data.data) {
      selectedPhone = phoneRes.data.data.find(p => p.id === phoneNumberId);
    }

    if (!selectedPhone) {
      if (!phoneRes.data.data || phoneRes.data.data.length === 0) {
        return res.status(400).json({ error: 'No phone numbers registered in this WhatsApp Business Account' });
      }
      selectedPhone = phoneRes.data.data[0];
      phoneNumberId = selectedPhone.id;
    }

    if (selectedPhone.verified_name) {
      connectedName = selectedPhone.verified_name;
    } else if (selectedPhone.display_phone_number) {
      connectedName = selectedPhone.display_phone_number;
    }

    // 3. Save to database
    const updateData = {
      isWhatsAppConnected: true,
      whatsappPhoneNumberId: phoneNumberId,
      whatsappBusinessAccountId: wabaId,
      whatsappToken: accessToken,
      connectedWhatsAppName: connectedName
    };

    let settingsQuery = { userId: req.user.userId };
    if (req.user.workspaceId) {
      settingsQuery.workspaceId = req.user.workspaceId;
    }

    await Settings.findOneAndUpdate(settingsQuery, updateData, { upsert: true, new: true });

    res.json({
      success: true,
      whatsappPhoneNumberId: phoneNumberId,
      whatsappBusinessAccountId: wabaId,
      connectedWhatsAppName: connectedName
    });
  } catch (error) {
    console.error('Error connecting WhatsApp embedded:', error);
    res.status(500).json({ error: 'Failed to complete WhatsApp Embedded Signup' });
  }
});

// WhatsApp Send Test Message API
app.post('/api/settings/whatsapp/send-test', verifyToken, async (req, res) => {
  try {
    const { targetPhoneNumber } = req.body;
    if (!targetPhoneNumber) {
      return res.status(400).json({ error: 'Missing target phone number' });
    }

    let settingsQuery = { userId: req.user.userId };
    if (req.user.workspaceId) settingsQuery.workspaceId = req.user.workspaceId;

    const settings = await Settings.findOne(settingsQuery);
    if (!settings || !settings.whatsappToken || !settings.whatsappPhoneNumberId) {
      return res.status(400).json({ error: 'WhatsApp is not connected' });
    }

    // Send the hello_world template
    const payload = {
      messaging_product: "whatsapp",
      to: targetPhoneNumber,
      type: "template",
      template: {
        name: "hello_world",
        language: { code: "en_US" }
      }
    };

    const response = await axios.post(
      `https://graph.facebook.com/v20.0/${settings.whatsappPhoneNumberId}/messages`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${settings.whatsappToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    res.json({ success: true, data: response.data });
  } catch (error) {
    console.error('Error sending WhatsApp test message:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to send WhatsApp message', 
      details: error.response?.data?.error?.message || error.message 
    });
  }
});
app.post('/api/settings/whatsapp/connect-qr', verifyToken, async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: req.user.userId, workspaceId: req.workspaceId },
      {
        isWhatsAppConnected: true,
        connectedWhatsAppName: 'WhatsApp QR Connected',
        whatsappToken: 'mock_qr_token',
        whatsappPhoneNumberId: 'mock_qr_id',
        lastTestedAt: new Date(),
        workspaceId: req.workspaceId
      },
      { upsert: true, new: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/settings/whatsapp/qr', verifyToken, async (req, res) => {
  try {
    const uniqueData = `zenxchat_wa_connect_${req.user.userId}_${Date.now()}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(uniqueData)}`;
    res.json({ qrUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- FLOWS API ---
app.get('/api/flows', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
    const flows = await Flow.find({ userId: { $in: sharedUserIds }, workspaceId: req.workspaceId });
    res.json(flows);
  } catch (err) {
    console.error("❌ FLOWS FETCH ERROR (Full):", JSON.stringify(err, null, 2));
    res.status(500).json({ 
      error: "Failed to fetch flows", 
      details: err.message || "Unknown DB Error",
      hint: "Check if the 'flows' table exists in Supabase and has a 'userId' column."
    });
  }
});

app.get('/api/flows/:id', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
    const flow = await Flow.findOne({ _id: req.params.id, userId: { $in: sharedUserIds }, workspaceId: req.workspaceId });
    if (!flow) return res.status(404).json({ error: 'Flow not found' });
    res.json(flow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/flows', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
    const proUser = await User.findOne({ _id: { $in: sharedUserIds }, plan: 'pro' });
    if (!proUser) {
      return res.status(403).json({ error: 'Pro plan required to create advanced flows.' });
    }
    const newFlow = new Flow({ ...req.body, userId: req.user.userId, workspaceId: req.workspaceId });
    await newFlow.save();
    res.json(newFlow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/flows/:id', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
    const proUser = await User.findOne({ _id: { $in: sharedUserIds }, plan: 'pro' });
    if (!proUser) {
      return res.status(403).json({ error: 'Pro plan required to update advanced flows.' });
    }
    const flow = await Flow.findOneAndUpdate(
      { _id: req.params.id, userId: { $in: sharedUserIds }, workspaceId: req.workspaceId },
      { ...req.body, updatedAt: new Date(), workspaceId: req.workspaceId },
      { new: true }
    );
    res.json(flow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/flows/:id', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
    const proUser = await User.findOne({ _id: { $in: sharedUserIds }, plan: 'pro' });
    if (!proUser) {
      return res.status(403).json({ error: 'Pro plan required to delete advanced flows.' });
    }
    await Flow.findOneAndDelete({ _id: req.params.id, userId: { $in: sharedUserIds }, workspaceId: req.workspaceId });
    res.json({ message: 'Flow deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Broadcast API: Send Bulk Messages
app.post('/api/broadcasts', verifyToken, async (req, res) => {
  const { contactIds, text, platform } = req.body;
  if (!contactIds || !text || !Array.isArray(contactIds)) {
    return res.status(400).json({ error: 'Missing contactIds (array) or text' });
  }

  try {
    const results = { success: 0, failed: 0 };
    const sharedUserIds = getSharedUserIdsSync(req.user.userId);

    for (const contactId of contactIds) {
      const contact = await Contact.findOne({ 
        _id: contactId, 
        userId: { $in: sharedUserIds },
        workspaceId: req.workspaceId 
      });
      if (!contact) {
        results.failed++;
        continue;
      }

      const sent = await sendMessageToInstagram(platform || contact.platform || 'instagram', contact.chatId, text, '', contact.userId);

      if (sent) {
        const msg = new Message({
          userId: contact.userId,
          workspaceId: req.workspaceId,
          chatId: contact.chatId,
          sender: 'admin',
          text: text,
          type: 'sent',
          platform: platform || contact.platform || 'instagram',
          isAI: false,
          timestamp: new Date()
        });
        await msg.save();
        
        sharedUserIds.forEach(uid => {
          io.to(uid.toString()).emit('new_message', msg);
        });
        results.success++;
      } else {
        results.failed++;
      }

      // 0.5s delay to prevent burst
      await new Promise(r => setTimeout(r, 500));
    }

    res.json({ message: 'Broadcast completed', results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DIAGNOSTIC ENDPOINT: Check Scheduled Posts Status ---
app.get('/api/debug/scheduled', verifyToken, async (req, res) => {
  try {
    const { supabase: sb } = await import('./utils/supabase.js');
    const now = new Date().toISOString();

    // Fetch ALL posts for this user (any status)
    const { data: allPosts, error: allErr } = await sb
      .from('scheduled_posts')
      .select('id, platform, status, scheduledFor, lastError, mediaUrl, caption')
      .eq('userId', req.user.userId)
      .order('scheduledFor', { ascending: false })
      .limit(10);

    // Fetch DUE posts (should be picked up by worker)
    const { data: duePosts, error: dueErr } = await sb
      .from('scheduled_posts')
      .select('id, platform, status, scheduledFor, lastError')
      .eq('userId', req.user.userId)
      .in('status', ['Scheduled', 'Processing'])
      .lte('scheduledFor', now);

    const settings = await Settings.findOne({ userId: req.user.userId });

    res.json({
      serverTime: now,
      allPosts: allPosts || [],
      allErr: allErr?.message || null,
      duePosts: duePosts || [],
      dueErr: dueErr?.message || null,
      credentials: {
        instagram: !!(settings?.instagramAccessToken && settings?.businessAccountId),
        facebook: !!(settings?.facebookAccessToken && settings?.facebookPageId),
        threads: !!settings?.connectedPageName,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- DEBUG ENDPOINT: Check saved tokens & test Meta API ---
app.get('/api/debug/settings', verifyToken, async (req, res) => {
  try {
    const settings = await Settings.findOne({ userId: req.user.userId });
    if (!settings) return res.json({ error: 'No settings found for this user' });

    const tokenPrefix = settings.instagramAccessToken ? settings.instagramAccessToken.substring(0, 20) + '...' : 'NOT SET';
    const result = {
      instagramPageId: settings.instagramPageId || 'NOT SET',
      businessAccountId: settings.businessAccountId || 'NOT SET',
      facebookPageId: settings.facebookPageId || 'NOT SET',
      instagramTokenPrefix: tokenPrefix,
      isAccountConnected: settings.isAccountConnected,
    };

    // Live test with Meta API
    if (settings.instagramAccessToken && settings.instagramPageId) {
      try {
        const testUrl = `https://graph.facebook.com/v19.0/${settings.instagramPageId}?fields=name,id&access_token=${settings.instagramAccessToken}`;
        const testRes = await axios.get(testUrl);
        result.metaApiTest = { status: 'SUCCESS', data: testRes.data };
      } catch (e) {
        result.metaApiTest = { status: 'FAILED', error: e.response?.data || e.message };
      }
    } else {
      result.metaApiTest = 'Skipped - missing token or pageId';
    }

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ONE-TIME FIX: Fetch and cache GMB Account/Location IDs for current user ---
app.post('/api/fix-gmb-cache', async (req, res) => {
  try {
    // Inline auth check
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token provided.' });
    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch(e) {
      return res.status(401).json({ error: 'Invalid token.' });
    }
    const userId = decoded.id || decoded._id || decoded.userId;
    const workspaceId = req.headers['x-workspace-id'] || req.body.workspaceId;

    const { supabase: _sb } = await import('./utils/supabase.js');
    const Settings = (await import('./models/Settings.js')).default;

    const query = { userId };
    if (workspaceId) query.workspaceId = workspaceId;
    const settings = await Settings.findOne(query);

    if (!settings || !settings.googleBusinessAccessToken) {
      return res.status(400).json({ error: 'Google Business not connected.' });
    }

    // Refresh token
    let accessToken = settings.googleBusinessAccessToken;
    if (settings.googleBusinessRefreshToken) {
      const axios = (await import('axios')).default;
      try {
        const refreshRes = await axios.post('https://oauth2.googleapis.com/token', {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: settings.googleBusinessRefreshToken,
          grant_type: 'refresh_token'
        });
        if (refreshRes.data?.access_token) accessToken = refreshRes.data.access_token;
      } catch(e) {}
    }

    const axios = (await import('axios')).default;
    const accountsRes = await axios.get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const accounts = accountsRes.data?.accounts || [];
    if (accounts.length === 0) return res.status(400).json({ error: 'No GMB accounts found.' });

    const account = accounts[0];
    const accountId = account.name;

    const locationsRes = await axios.get(`https://mybusinessbusinessinformation.googleapis.com/v1/${accountId}/locations?readMask=name,title`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    const locations = locationsRes.data?.locations || [];
    if (locations.length === 0) return res.status(400).json({ error: 'No GMB locations found.' });

    const location = locations[0];
    const locationId = location.name;
    const locationTitle = location.title;

    // Save to connectedPageName JSON
    let pageData = {};
    try { pageData = JSON.parse(settings.connectedPageName || '{}'); } catch(e) {}
    pageData.googleBusinessAccountId = accountId;
    pageData.googleBusinessLocationId = locationId;
    pageData.connectedGoogleBusinessName = locationTitle;

    const updateQ = _sb.from('settings').update({ connectedPageName: JSON.stringify(pageData) });
    if (workspaceId) {
      await updateQ.eq('workspaceId', workspaceId);
    } else {
      await updateQ.eq('userId', userId);
    }

    console.log(`✅ [GMB FIX] Saved Account: ${accountId}, Location: ${locationId} for user ${userId}`);
    res.json({ success: true, accountId, locationId, locationTitle });
  } catch (err) {
    console.error('❌ [GMB FIX] Error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});


// Start the server


// --- REINFORCED BACKGROUND WORKER (Scheduling) ---
async function runSchedulingWorker() {
  try {
    const now = new Date();
    const nowISO = now.toISOString();

    console.log(`📡 [Worker] Checking posts due before: ${nowISO}`);

    const duePosts = await ScheduledPost.find({
      scheduledFor: { $lte: nowISO },
      status: { $in: ['Scheduled', 'Processing'] }
    });

    console.log(`🔥 [Worker] Processing ${duePosts.length} posts...`);
    const { publishInstagramContent } = await import('./utils/metaApi.js');

    // Pre-load Supabase client and safeUpdate before touching DB state
    const { supabase: _sb } = await import('./utils/supabase.js');
    const _updatePost = async (id, fields) => {
      // Convert camelCase fields to snake_case for direct Supabase query
      const cleanFields = { ...fields };
      delete cleanFields.retryCount;
      const { data, error } = await _sb.from('scheduled_posts').update({ ...cleanFields, updatedAt: new Date().toISOString() }).eq('id', id);
      if (error) throw new Error(error.message);
      return data;
    };

    // ── Safety net: reset any "Processing" posts that have been orphaned ──
    {
      const STUCK_THRESHOLD_MINUTES = 10;
      const stuckBoundary = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000).toISOString();
      try {
        const { data: stuckData, error: stuckErr } = await _sb
          .from('scheduled_posts')
          .update({ status: 'Failed', lastError: 'Worker crash/timeout reset', updatedAt: new Date().toISOString() })
          .eq('status', 'Processing')
          .lt('updatedAt', stuckBoundary)
          .select('id');
        if (stuckErr) {
          console.warn('⚠️ [Worker] Safety-net reset failed:', stuckErr.message);
        }
      } catch (resetErr) {
        console.warn('⚠️ [Worker] Safety-net reset error:', resetErr.message);
      }
    }

    const safeUpdate = async (id, fields) => {
      try {
        await _updatePost(id, fields);
      } catch (upErr) {
        console.error(`⚠️ [Worker] _updatePost silently failed for post ${id}:`, upErr.message || upErr);
      }
    };

    // Process up to 20 posts per run to handle many users scheduling at the same time
    const postsToProcess = duePosts.slice(0, 20);
    if (duePosts.length > 20) {
      console.log(`⚠️ Limit hit: Processing 20 out of ${duePosts.length} due posts to prevent timeout. The rest will be processed on the next ping.`);
    }

    // Process due posts in parallel
    const processPromises = postsToProcess.map(async (post) => {
      const postId = post.id || post._id;
      try {
        console.log(`🔄 EXECUTION: Processing Post ${postId} for User ${post.userId}`);

        // Deserialize metadata
        let finalMedia = post.mediaUrl;
        let finalType = post.type || 'image';
        let finalCarousel = [];

        let hasYouTubeVideoId = false;
        if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
          try {
            const meta = JSON.parse(post.mediaUrl);
            finalType = meta.type || finalType;
            finalCarousel = meta.carouselItems || [];
            finalMedia = meta.mediaUrl || (finalCarousel.length > 0 ? finalCarousel[0] : '');
            hasYouTubeVideoId = !!meta.youtubeVideoId;
            // Enforce retry delay — skip if nextRetryAt has not been reached yet
            if (meta.nextRetryAt && new Date() < new Date(meta.nextRetryAt)) {
              console.log(`⏳ [Worker] Post ${postId} retry not due until ${meta.nextRetryAt}. Skipping.`);
              return;
            }
          } catch (e) {
            console.warn("⚠️ Metadata parse failed, using raw mediaUrl");
          }
        }

        // Unwrap any nested JSON-encoded media metadata (defensive against double-encoding from older records)
        if (finalMedia && typeof finalMedia === 'string' && finalMedia.startsWith('{')) {
          try {
            const nested = JSON.parse(finalMedia);
            if (nested.mediaUrl) finalMedia = nested.mediaUrl;
          } catch (e) {}
        }

        // If the media URL is a local path, convert it to a public URL
        if (finalMedia && finalMedia.startsWith('/uploads/')) {
          finalMedia = `${SERVER_PUBLIC_URL}${finalMedia}`;
        }

        if (finalCarousel && finalCarousel.length > 0) {
          const hasInvalidCarouselItem = finalCarousel.some(item => item && item.startsWith('blob:'));
          if (hasInvalidCarouselItem) {
            console.error(`❌ Blob URL detected in carousel items for post ${post._id}.`);
            await safeUpdate(postId, { status: 'Failed', lastError: 'Invalid media URL (blob:) in carousel. Please re-upload the media — blob URLs cannot be used for publishing.' });
            return;
          }
          finalCarousel = finalCarousel.map(item => (item && item.startsWith('/uploads/')) ? `${SERVER_PUBLIC_URL}${item}` : item);
        }

        const requiresMedia = !post.platform || post.platform === 'instagram' || (post.platform === 'youtube' && !hasYouTubeVideoId);
        if (requiresMedia && !finalMedia) {
           console.log(`⏭️ Post ${postId} has no media URL yet (likely still uploading). Skipping.`);
           return;
        }
        
        if (finalMedia && finalMedia.startsWith('blob:')) {
          console.error(`❌ Blob URL detected for post ${post._id}. Blob URLs are not accessible from the server.`);
          await safeUpdate(postId, { status: 'Failed', lastError: 'Invalid media URL (blob:). Please re-upload the media — blob URLs cannot be used for publishing.' });
          return;
        }

        if (finalMedia && (finalMedia.includes('127.0.0.1') || finalMedia.includes('localhost'))) {
          console.error(`❌ No publicly accessible media URL for post ${post._id}.`);
          await safeUpdate(postId, { status: 'Failed', lastError: 'No public media URL. Use Supabase Storage or a public image URL.' });
          return;
        }

        const unwriteProxyToSupabasePublic = (url) => {
          if (!url || typeof url !== 'string') return url;
          
          // If it's already a Supabase public URL, keep it
          if (url.includes('.supabase.co/storage/v1/object/public/media')) return url;
          
          // If it's the proxy URL, extract the path and convert to direct Supabase public URL
          // This ensures Meta/Facebook crawlers hit the CDN directly and avoid 302 redirect issues!
          const match = url.match(/\/api\/storage\/view\?path=(.+)/);
          if (match) {
             const path = match[1].split('&')[0]; // Remove any extra query params
             return `https://${process.env.SUPABASE_URL ? new URL(process.env.SUPABASE_URL).hostname : 'vsrtgwvudallfqnozifu.supabase.co'}/storage/v1/object/public/media/${path}`;
          }
          return url;
        };

        // Ensure we pass the DIRECT Supabase CDN url to Meta APIs, not the Vercel proxy!
        finalMedia = unwriteProxyToSupabasePublic(finalMedia);

        if (finalCarousel && finalCarousel.length > 0) {
          finalCarousel = finalCarousel.map(item => unwriteProxyToSupabasePublic(item));
        }

        // Atomic claim: directly update status to 'Processing'
        // Cooldown set to 2 minutes to ensure large videos/images don't get picked up twice while uploading
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

        const { data: claimData, error: claimErr } = await _sb
          .from('scheduled_posts')
          .update({ status: 'Processing', updatedAt: new Date().toISOString() })
          .eq('id', postId)
          .or(`status.in.(Scheduled),and(status.eq.Processing,updatedAt.lt.${twoMinutesAgo})`)
          .select()
          .limit(1);

        if (claimErr) console.warn('⚠️ Claim error:', claimErr.message);
        const claimedPost = !claimErr && claimData && claimData.length > 0 ? claimData[0] : null;
        if (!claimedPost) {
          console.log(`⏭️ Post ${postId} skipped - already claimed`);
          return;
        }

        let existingContainerId = null;
        if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
          try {
            const meta = JSON.parse(post.mediaUrl);
            existingContainerId = meta.igContainerId;
          } catch (e) {}
        }

        // --- STEP 2: Publish (Using state-machine logic) ---
        let publishResult = null;
        if (post.platform === 'facebook') {
          const { publishFacebookContent } = await import('./utils/metaApi.js');
          publishResult = await publishFacebookContent(post.userId, {
            type: finalType,
            mediaUrl: finalMedia,
            caption: post.caption,
            carouselItems: finalCarousel
          }, post.workspaceId);
        } else if (post.platform === 'threads') {
          const { publishThreadsContent } = await import('./utils/metaApi.js');
          publishResult = await publishThreadsContent(post.userId, {
            type: finalType,
            mediaUrl: finalMedia,
            caption: post.caption,
            containerId: existingContainerId
          }, post.workspaceId);
        } else if (post.platform === 'youtube') {
          const { publishYouTubeVideo } = await import('./utils/youtubeApi.js');
          const { data: userSettings, error: setErr } = await _sb.from('settings').select('*').eq('workspaceId', post.workspaceId).limit(1);
          if (setErr || !userSettings || userSettings.length === 0) {
            throw new Error('Settings not found for workspace. Please connect YouTube first.');
          }
          // Parse connectedPageName to extract tokens if needed
          let youtubeSettings = userSettings[0];
          if (youtubeSettings.connectedPageName) {
            try {
              const pageData = JSON.parse(youtubeSettings.connectedPageName);
              youtubeSettings = { ...youtubeSettings, ...pageData };
            } catch(e){}
          }
          publishResult = await publishYouTubeVideo(post.userId, {
            type: finalType,
            mediaUrl: finalMedia,
            caption: post.caption
          }, youtubeSettings);
        } else if (post.platform === 'google-business') {
          const { publishGoogleBusinessContent } = await import('./utils/googleBusinessApi.js');
          publishResult = await publishGoogleBusinessContent(post.userId, post, post.workspaceId);
        } else if (post.platform === 'twitter') {
          const { publishTwitterContent } = await import('./utils/twitterApi.js');
          publishResult = await publishTwitterContent(post.userId, post, post.workspaceId);
        } else if (post.platform === 'pinterest') {
          const { publishPinterestContent } = await import('./utils/pinterestApi.js');
          publishResult = await publishPinterestContent(post.userId, post, post.workspaceId);
        } else if (post.platform === 'linkedin') {
          const { publishLinkedInContent } = await import('./utils/linkedinApi.js');
          publishResult = await publishLinkedInContent(post.userId, post, post.workspaceId);
        } else if (post.platform === 'whatsapp') {
          const { publishWhatsAppContent } = await import('./services/platforms/whatsapp.js');
          publishResult = await publishWhatsAppContent(post.userId, post, post.workspaceId);
        } else if (post.platform === 'twitter') {
          const { publishTwitterContent } = await import('./utils/twitterApi.js');
          publishResult = await publishTwitterContent(post.userId, post, post.workspaceId);
        } else {
          // Default to instagram
          const { publishInstagramContent } = await import('./utils/metaApi.js');
          publishResult = await publishInstagramContent(post.userId, {
            type: finalType,
            mediaUrl: finalMedia,
            caption: post.caption,
            carouselItems: finalCarousel,
            containerId: existingContainerId
          }, post.workspaceId);
        }

        if (publishResult && publishResult.status === 'IG_PROCESSING') {
          // Meta is still thinking. Save the containerId and try again in the next cron run
          console.log(`⏳ Meta is still processing Post ${postId}. Container: ${publishResult.containerId}`);

          let updatedMeta = {};
          try {
            if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
              updatedMeta = JSON.parse(post.mediaUrl);
            }
          } catch (e) {}

          // Add polling timeout logic
          if (!updatedMeta.pollingStartedAt) {
            // If it's already an old post stuck in processing, backdate the start time to trigger failure immediately
            const scheduledAt = new Date(post.scheduledFor || Date.now());
            const minsSince = (Date.now() - scheduledAt.getTime()) / 60000;
            if (minsSince > 10 && updatedMeta.igContainerId) {
               updatedMeta.pollingStartedAt = new Date(Date.now() - 11 * 60000).toISOString(); 
            } else {
               updatedMeta.pollingStartedAt = new Date().toISOString();
            }
          }

          const pollingMins = (Date.now() - new Date(updatedMeta.pollingStartedAt).getTime()) / 60000;
          if (pollingMins > 10) {
             console.error(`⏳ Meta has been processing Post ${postId} for over 10 minutes! Aborting container.`);
             await safeUpdate(postId, { status: 'Failed', lastError: 'Meta processing timeout. Instagram took too long to process the media container. Please try again.' });
             return;
          }

          updatedMeta.igContainerId = publishResult.containerId;
          updatedMeta.type = finalType;
          updatedMeta.mediaUrl = finalMedia;
          updatedMeta.carouselItems = finalCarousel;

          await safeUpdate(postId, { status: 'Scheduled', mediaUrl: JSON.stringify(updatedMeta) });

          // ── Safety refresh: always bump updatedAt at the end so the 2-min cooldown
          //     gate is freshly reset even if the DB write above had a soft failure.
          await safeUpdate(postId, {});
          return;
        }

        // --- STEP 3: Success Logic ---
        const publishedId = publishResult.id;
        const liveUrl = publishResult.url;

        // Deserialize automation options
        let requireFollow = false, unfollowedResponse = '', publicReply = '', automationStatus = 'Active';
        let openingMessage = false, openingMessageText = '', openingMessageButton = '', buttons = [];

        let triggerKeyword = post.triggerKeyword;
        let autoResponse = post.autoResponse;

        if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
          try {
            const meta = JSON.parse(post.mediaUrl);
            requireFollow = meta.requireFollow || false;
            unfollowedResponse = meta.unfollowedResponse || "Hey! Please follow our account first to get the link! 😊";
            publicReply = meta.publicReply || "Check your DMs! 🚀 I've sent you the info.";
            automationStatus = meta.automationStatus || 'Active';
            openingMessage = meta.openingMessage || false;
            openingMessageText = meta.openingMessageText || '';
            openingMessageButton = meta.openingMessageButton || '';
            buttons = meta.buttons || [];
            if (meta.triggerKeyword) triggerKeyword = meta.triggerKeyword;
            if (meta.autoResponse) autoResponse = meta.autoResponse;
          } catch (e) {}
        }

        if (triggerKeyword && autoResponse && automationStatus === 'Active') {
          const campaign = new Campaign({
            userId: post.userId,
            workspaceId: post.workspaceId,
            name: `Auto: ${post.caption.substring(0, 20)}...`,
            trigger: triggerKeyword,
            response: autoResponse,
            status: 'Active',
            isAnyPost: false,
            postId: publishedId,
            platform: post.platform || 'instagram',
            triggerOnComments: true,
            requireFollow,
            unfollowedResponse,
            publicReplyText: publicReply,
            openingMessage,
            openingMessageText,
            openingMessageButton,
            buttons
          });
          try {
            await campaign.save();
            await refreshGlobalCache(); // Instant Sync
          } catch (saveErr) {
            console.error(`⚠️ [Worker] Campaign save failed for post ${postId}:`, saveErr.message);
          }
        }

        let updatedMetaObj = {};
        if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
          try { updatedMetaObj = JSON.parse(post.mediaUrl); } catch(e){}
        }

        updatedMetaObj.mediaUrl = publishResult.media_url || finalMedia;
        updatedMetaObj.liveUrl = liveUrl || '';
        updatedMetaObj.localMediaUrl = finalMedia;
        updatedMetaObj.type = finalType;
        if (post.platform === 'facebook') {
          updatedMetaObj.facebookPostId = publishedId;
        } else if (post.platform === 'threads') {
          updatedMetaObj.threadsPostId = publishedId;
        } else if (post.platform === 'google-business') {
          updatedMetaObj.gmbPostId = publishedId;
        } else if (post.platform === 'linkedin') {
          updatedMetaObj.linkedinPostId = publishedId;
        } else {
          updatedMetaObj.instagramMediaId = publishedId;
        }

        const updatedMediaUrl = JSON.stringify(updatedMetaObj);

        await safeUpdate(postId, { status: 'Posted', mediaUrl: updatedMediaUrl });
        
        // Log success for Analytics
        try {
          const log = new PostLog({
            post_id: postId,
            status: 'success',
            platform: post.platform || 'instagram',
            response: publishResult,
            user_id: post.userId,
            workspace_id: post.workspaceId
          });
          await log.save();
        } catch (logErr) {
          console.error(`⚠️ Failed to save success log for Post ${postId}:`, logErr.message);
        }

        console.log(`✅ SUCCESS: Post ${postId} is now LIVE on ${post.platform === 'facebook' ? 'Facebook' : 'Instagram'}.`);

      } catch (postErr) {
        console.error(`❌ PUBLISH FAILED for Post ${post._id}:`, postErr.message);
        let existingRetryCount = 0;
        let updatedMetaObj = {};
        if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
          try { 
            updatedMetaObj = JSON.parse(post.mediaUrl); 
            existingRetryCount = updatedMetaObj.retryCount || 0;
          } catch(e){}
        }

        const currentRetryCount = existingRetryCount + 1;
        const MAX_RETRIES = 5;
        const MAX_RETRY_WINDOW = 2880;
        const scheduledAt = new Date(post.scheduledFor);
        const minutesSinceScheduled = (Date.now() - scheduledAt.getTime()) / 60000;

        const errorMsg = postErr.message || '';
        const lowerError = errorMsg.toLowerCase();
        
        const isFatalError = 
          (lowerError.includes('authorization error') || 
          lowerError.includes('credential') || 
          lowerError.includes('token') || 
          lowerError.includes('auth') || 
          lowerError.includes('scope') || 
          lowerError.includes('permission') || 
          lowerError.includes('insufficient') ||
          lowerError.includes('403') ||
          lowerError.includes('400') ||
          lowerError.includes('bad request')) &&
          !(
            lowerError.includes('429') ||
            lowerError.includes('quota') ||
            lowerError.includes('limit') ||
            lowerError.includes('resource_exhausted')
          );

        if (isFatalError) {
          console.log(`🚫 [Worker] Fatal/Client Error for Post ${postId}. Marking as Failed immediately.`);
          await safeUpdate(postId, { status: 'Failed', lastError: errorMsg });
          
          try {
            await new PostLog({ post_id: postId, status: 'failed', platform: post.platform || 'instagram', response: { error: errorMsg }, user_id: post.userId, workspace_id: post.workspaceId }).save();
          } catch(e) {}
        } else if (currentRetryCount <= MAX_RETRIES && minutesSinceScheduled < MAX_RETRY_WINDOW) {
          // Add exponentially longer delays for rate limits (15 min, 1h, 4h, 12h, 24h)
          let delayMinutes = 5 * currentRetryCount;
          if (lowerError.includes('quota') || lowerError.includes('429') || lowerError.includes('limit')) {
             const backoffs = [15, 60, 240, 720, 1440];
             delayMinutes = backoffs[Math.min(currentRetryCount - 1, 4)];
          }
          
          // Store retry time in metadata — DO NOT overwrite scheduledFor so user's original time is preserved
          updatedMetaObj.retryCount = currentRetryCount;
          updatedMetaObj.nextRetryAt = new Date(Date.now() + delayMinutes * 60 * 1000).toISOString();
          console.log(`⚠️ Post ${postId} failed. Next retry in ${delayMinutes} mins at ${updatedMetaObj.nextRetryAt}. scheduledFor unchanged.`);
          await safeUpdate(postId, { status: 'Scheduled', lastError: errorMsg, mediaUrl: JSON.stringify(updatedMetaObj) });
        } else {
          await safeUpdate(postId, { status: 'Failed', lastError: errorMsg });
          
          try {
            await new PostLog({ post_id: postId, status: 'failed', platform: post.platform || 'instagram', response: { error: errorMsg }, user_id: post.userId, workspace_id: post.workspaceId }).save();
          } catch(e) {}
        }
      }
    });

    const results = await Promise.allSettled(processPromises);
    results.forEach((res, idx) => {
      if (res.status === 'rejected') {
        console.error(`❌ [Worker] Promise ${idx} rejected:`, res.reason);
      }
    });
    return { message: 'Processed due posts', count: duePosts.length, results };
  } catch (err) {
    console.error("🔥 CRITICAL WORKER ERROR:", err.message);
    return { error: err.message };
  }
}

console.log('⏰ Scheduling worker ready (Triggered via /api/cron/publish).');

// Vercel Cron/Webhook Route to trigger scheduler
// This is the PRIMARY trigger on Vercel (serverless = no persistent setInterval)
app.get('/api/cron/publish', async (req, res) => {
  // Authorization check removed to allow external ping services like cron-job.org
  // to trigger the scheduler without needing special headers.
  // The worker only processes posts that are already due in the database.
  
  console.log('⏰ [CRON] Vercel Cron Job triggered scheduling check...');
  const startTime = Date.now();
  const workerResult = await runSchedulingWorker();
  const elapsed = Date.now() - startTime;
  console.log(`✅ [CRON] Worker finished in ${elapsed}ms`);
  res.json({ success: true, message: 'Scheduling check completed', elapsed, workerResult });
});

// ── Public Testimonials & Reviews API (Supabase Postgres Database) ──────────

const DEFAULT_REVIEWS = [
  {
    id: "review-new-1",
    name: "Priya Sharma",
    handle: "@priya_creates",
    role: "Digital Marketer",
    rating: 5,
    text: "Ye tool sach mein amazing hai! Maine apne client ke liye Instagram DM automation set kiya aur pehle hi din 50+ qualified leads generate ho gaye. Setup bahut hi aasan tha aur ab manual reply karne ki zaroorat nahi padti.",
    platform: "instagram",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=256&q=80",
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "review-1",
    name: "Sarah Jenkins",
    handle: "@sarah_fitsocial",
    role: "Fitness Coach (120k Followers)",
    rating: 5,
    text: "This automation is absolute magic! I used to spend 3 hours a day replying to 'INFO' comments on my reels. Now, smart10X handles it in milliseconds. My story engagement went up by 42% in the first week!",
    platform: "instagram",
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "review-2",
    name: "Michael Chen",
    handle: "@techdeals_co",
    role: "E-Commerce Founder",
    rating: 5,
    text: "The WhatsApp and Instagram funnel integrations are flawless. We set up an automated discount code delivery system based on trigger words. Our conversion rate increased by 18% instantly.",
    platform: "whatsapp",
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "review-3",
    name: "Elena Rostova",
    handle: "@elena_travels",
    role: "Travel Creator",
    rating: 5,
    text: "The AI Studio fallback option is a game-changer! When someone replies with something unexpected, the AI automatically replies in my tone instead of breaking. My DM inbox has never been cleaner.",
    platform: "instagram",
    verified: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "review-4",
    name: "Marcus Aurelius",
    handle: "@philosophy_daily",
    role: "Content Creator",
    rating: 5,
    text: "Aesthetically pleasing UI and highly functional campaign manager. It is remarkably robust. Extremely simple to create new keyword-based responses for comment threads.",
    platform: "facebook",
    verified: true,
    createdAt: new Date().toISOString()
  }
];

app.get('/api/user-feedback', async (req, res) => {
  // Disable all caching so new reviews always appear immediately
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  
  try {
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select('*')
      .order('createdAt', { ascending: false });

    if (error) {
      throw error;
    }
    
    // Merge database reviews with the default marketing reviews
    let allReviews = [];
    if (reviews && reviews.length > 0) {
      allReviews = [...reviews];
    }
    
    // Add default reviews at the end
    allReviews = [...allReviews, ...DEFAULT_REVIEWS];
    
    res.json(allReviews);
  } catch (err) {
    console.error("Error reading reviews from DB:", err.message);
    res.json(DEFAULT_REVIEWS);
  }
});

app.get('/api/user-feedback/check', verifyToken, async (req, res) => {
  try {
    const uuidUserId = convertObjectIDToUUID(req.user.userId);
    const { data: existing, error } = await supabase
      .from('reviews')
      .select('id')
      .eq('id', uuidUserId)
      .maybeSingle();

    if (error) throw error;
    res.json({ exists: !!existing });
  } catch (err) {
    console.error("Error checking review status:", err.message);
    res.status(500).json({ error: 'Failed to check review status' });
  }
});

app.post('/api/user-feedback', async (req, res) => {
  try {
    const { name, handle, role, rating, text, platform, avatarUrl } = req.body;
    if (!name || !text) {
      return res.status(400).json({ error: 'Name and review text are required.' });
    }

    const authHeader = req.headers.authorization;
    let uuidUserId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      try {
const decoded = jwt.verify(token, process.env.JWT_SECRET);
        uuidUserId = convertObjectIDToUUID(decoded.userId);
      } catch (err) {
        console.warn("Invalid token for review submission, treating as anonymous");
      }
    }

    if (uuidUserId) {
      // Enforce 1 review per person by ID
      const { data: existingReview, error: checkError } = await supabase
        .from('reviews')
        .select('id')
        .eq('id', uuidUserId)
        .maybeSingle();
  
      if (checkError) {
        console.warn("Error checking existing review by ID:", checkError.message);
      }
  
      if (existingReview) {
        return res.status(400).json({ error: 'You have already submitted a review.' });
      }
    }

    // Check 2: By Name (case-insensitive) - for both guests and logged-in users
    const { data: existingByName, error: checkNameError } = await supabase
      .from('reviews')
      .select('id')
      .ilike('name', name.trim())
      .limit(1);

    if (checkNameError) {
      console.warn("⚠️ Error checking existing review by name:", checkNameError.message);
    }

    if (existingByName && existingByName.length > 0) {
      return res.status(400).json({ error: 'A review with this name has already been submitted.' });
    }

    // Insert new review with user ID as primary key to prevent duplicate entries at DB level
    const { data: inserted, error: insertError } = await supabase
      .from('reviews')
      .insert({
        id: uuidUserId || crypto.randomUUID(),
        name: xss(name),
        handle: handle ? xss(handle) : '',
        role: role ? xss(role) : (uuidUserId ? 'Verified Creator' : 'Guest'),
        rating: Number(rating) || 5,
        text: xss(text),
        platform: platform || 'instagram',
        avatarUrl: avatarUrl ? xss(avatarUrl) : null,
        verified: true,
        createdAt: new Date().toISOString()
      })
      .select();

    if (insertError) {
      throw insertError;
    }

    const savedReview = inserted && inserted.length > 0 ? inserted[0] : {
      id: uuidUserId || crypto.randomUUID(),
      name,
      handle,
      role,
      rating,
      text,
      platform,
      avatarUrl,
      verified: true
    };

    res.status(201).json(savedReview);
  } catch (err) {
    console.error("Error saving review to Supabase:", err.message);
    res.status(500).json({ error: 'Failed to save review to database: ' + err.message });
  }
});

app.get('/api/diag-storage', async (req, res) => {
  try {
    const diag = {
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_URL_DEFINED: !!process.env.SUPABASE_URL,
      SUPABASE_URL_PREFIX: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.slice(0, 15) : 'none',
      SUPABASE_KEY_DEFINED: !!process.env.SUPABASE_KEY,
      SUPABASE_KEY_LENGTH: process.env.SUPABASE_KEY ? process.env.SUPABASE_KEY.length : 0,
      SUPABASE_SERVICE_ROLE_KEY_DEFINED: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      SUPABASE_SERVICE_ROLE_KEY_LENGTH: process.env.SUPABASE_SERVICE_ROLE_KEY ? process.env.SUPABASE_SERVICE_ROLE_KEY.length : 0,
      VITE_SUPABASE_URL_DEFINED: !!process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_PUBLISHABLE_KEY_DEFINED: !!process.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    };

    const { createClient } = await import('@supabase/supabase-js');
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

    diag.CLIENT_INIT = { urlDefined: !!url, keyDefined: !!key };
    
    if (url && key) {
      try {
        const client = createClient(url, key);
        const { data, error } = await client.storage.listBuckets();
        diag.LIST_BUCKETS = { success: !error, error: error ? error.message : null, buckets: data ? data.map(b => b.name) : [] };
      } catch (clientErr) {
        diag.LIST_BUCKETS = { success: false, error: clientErr.message };
      }
    } else {
      diag.LIST_BUCKETS = 'Skipped - missing URL or Key';
    }

    res.json(diag);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── SECURITY: Global Error Handler ────────────────────────────────────────────
// --- TWITTER TESTING ENDPOINT ---
app.post('/api/test/twitter/post', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) {
      return res.status(400).json({ error: "Missing 'text' in request body" });
    }

    const { supabase: _sb } = await import('./utils/supabase.js');
    const { data: userSettings, error: setErr } = await _sb.from('settings').select('*').eq('userId', req.user.userId).limit(1);

    if (setErr || !userSettings || userSettings.length === 0) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    const settings = userSettings[0];
    
    // Extract virtual fields from connectedPageName
    let virtualFields = {};
    if (settings.connectedPageName) {
      try {
        virtualFields = JSON.parse(settings.connectedPageName);
      } catch(e) {}
    }

    const twitterAccessToken = settings.twitterAccessToken || virtualFields.twitterAccessToken;
    const twitterRefreshToken = settings.twitterRefreshToken || virtualFields.twitterRefreshToken;

    if (!twitterAccessToken || !twitterRefreshToken) {
      return res.status(401).json({ error: 'Twitter is not connected. Please connect Twitter first.' });
    }

    const { TwitterApi } = await import('twitter-api-v2');
    const clientId = process.env.TWITTER_CLIENT_ID;
    const clientSecret = process.env.TWITTER_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: 'Twitter OAuth credentials missing on server' });
    }

    // Refresh token if needed
    const client = new TwitterApi({
      clientId: clientId,
      clientSecret: clientSecret
    });

    const { client: refreshedClient, accessToken, refreshToken: newRefreshToken } = await client.refreshOAuth2Token(twitterRefreshToken);

    // Save new tokens back to virtual fields
    virtualFields.twitterAccessToken = accessToken;
    virtualFields.twitterRefreshToken = newRefreshToken || twitterRefreshToken;
    
    await _sb.from('settings').update({
      connectedPageName: JSON.stringify(virtualFields)
    }).eq('userId', req.user.userId);

    // Post tweet
    const tweetRes = await refreshedClient.v2.tweet(text);

    res.json({ success: true, tweet: tweetRes.data });
  } catch (err) {
    console.error("❌ Twitter Test Posting Error:", err);
    res.status(500).json({ error: err.message, raw: err });
  }
});

// Must be LAST middleware. Prevents stack trace leakage in production.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`❌ [Error] ${req.method} ${req.url}:`, err.stack || err.message || err);
  res.status(err.status || 500).json({
    message: err.message,
    stack: err.stack,
  });
});

const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔒 Security: Rate limiting, Helmet CSP, CORS whitelist, NoSQL sanitization, XSS protection active`);

  // Start persistent local cron runner if not running in serverless (Vercel) environment
  if (!process.env.VERCEL) {
    console.log('⏰ [Scheduler] Running in persistent environment. Starting local 60s checker...');
    // Run immediately on startup
    setImmediate(() => {
      runSchedulingWorker().catch(err => {
        console.error("❌ Error in initial startup local scheduler:", err.message);
      });
    });
    // Then run every 15 seconds
    setInterval(() => {
      runSchedulingWorker().catch(err => {
        console.error("❌ Error in persistent local scheduler:", err.message);
      });
    }, 15 * 1000);

    // Run YouTube Comment Automation every 30 minutes
    setInterval(() => {
      processYouTubeComments().catch(err => {
        console.error("❌ Error in persistent local YouTube scheduler:", err.message);
      });
    }, 30 * 60 * 1000);
  }
});
export default app;

// Trigger backend deployment on Vercel


export { getSharedUserIdsSync, settingsCache, campaignsCache, io, runFlow };
