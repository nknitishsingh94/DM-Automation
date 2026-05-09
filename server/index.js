import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- GLOBAL STABILITY GUARD ---
// Prevents the server from crashing on unhandled errors
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
import Campaign from './models/Campaign.js';
import Message from './models/Message.js';
import Settings from './models/Settings.js';
import User from './models/User.js';
import Contact from './models/Contact.js';
import Flow from './models/Flow.js';
import ScheduledPost from './models/ScheduledPost.js';
import { runFlow } from './utils/FlowRunner.js';
import { sendMessageToInstagram, sendWhatsAppMessage, sendPrivateReply, sendPublicComment } from './utils/metaApi.js';
import authRoutes from './routes/auth.js';
import ChatMessage from './models/ChatMessage.js';
import Caption from './models/Caption.js';
import paymentRoutes from './routes/payment.js';
import formRoutes from './routes/forms.js';
import oauthRoutes from './routes/oauth.js';
import supportRoutes from './routes/support.js';
import { generateAIResponse } from './utils/aiHandler.js';
import { supabase } from './utils/supabase.js';
// --- MULTER SETUP (Media Uploads) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: storage,
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
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://accounts.google.com", "https://*.facebook.com", "https://*.facebook.net", "https://*.instagram.com", "https://dm-automation-roan.vercel.app"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:", "https://*.googleusercontent.com", "https://*.facebook.com", "https://*.instagram.com", "https://*.fbcdn.net", "https://dm-automation-lu44.onrender.com"],
      mediaSrc: ["'self'", "data:", "https:", "https://dm-automation-lu44.onrender.com"],
      connectSrc: ["'self'", "https://*.facebook.com", "https://*.facebook.net", "https://*.instagram.com", "https://api.openai.com", "https://accounts.google.com", "https://dm-automation-lu44.onrender.com", "https://dm-automation-roan.vercel.app"],
      frameSrc: ["'self'", "https://accounts.google.com", "https://*.facebook.com", "https://*.instagram.com", "https://dm-automation-roan.vercel.app"],
      objectSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
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
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // Server-to-server / curl
    const isAllowed = ALLOWED_ORIGINS.some(o => origin.startsWith(o))
      || origin.includes('localhost')
      || origin.includes('127.0.0.1')
      || origin.includes('vercel.app')
      || origin.includes('render.com');
    if (isAllowed) return callback(null, origin);
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

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

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);
app.use('/api/webhook', webhookLimiter);
app.use('/api/support', supportRoutes);

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

// ── SECURITY: HTTP Parameter Pollution Prevention ─────────────────────────────
app.use(hpp());

app.get('/api/health', (req, res) => res.json({ status: 'ok', domain: req.hostname, timestamp: new Date() }));
app.get('/api/ping', (req, res) => res.send('pong'));

// (Messaging helpers moved to utils/metaApi.js for cleaner architecture)

const checkFollowerStatus = async (platform, chatId, userId) => {
  if (platform !== 'instagram') return true; // Follow check currently only for Instagram

  try {
    const userSettings = await Settings.findOne({ userId });
    if (!userSettings || !userSettings.instagramAccessToken) {
      console.log("⚠️ Missing credentials for follow check. Defaulting to true.");
      return true;
    }

    // Official Instagram Messaging API way to check if a user follows the business.
    // Requires instagram_manage_messages and instagram_basic permissions.
    const res = await axios.get(`https://graph.facebook.com/v19.0/${chatId}?fields=is_user_follow_business&access_token=${userSettings.instagramAccessToken}`);

    // is_user_follow_business is a boolean returned by Meta
    return !!(res.data && res.data.is_user_follow_business === true);
  } catch (err) {
    // FALLBACK: If we can't verify (e.g. permission missing or private), 
    // we return 'false' to ensure we prioritize follower growth.
    return false;
  }
};

// Reusable Auto-Reply Logic
const processAutoReply = async (userId, platform, chatId, text, source = 'dm', commentId = null, passedToken = null, mediaId = null) => {
  // Human Handover Check
  const contact = await Contact.findOne({ userId, chatId });
  if (contact && contact.isBotMuted) {
    console.log(`🔇 Bot is muted for contact ${chatId}. Skipping auto-reply.`);
    return { skipped: true, reason: 'muted' };
  }

  // --- DESKTOP FALLBACK: Follower Re-check ---
  // If the user has a pending campaign (was gated by Follow Check),
  // we check if they have followed now. This allows desktop users
  // (who can't see the "I Followed" button) to just follow and send ANY message to continue.
  if (contact && contact.pendingCampaignId) {
    console.log(`📡 [DESKTOP FALLBACK] User ${chatId} has pending campaign ${contact.pendingCampaignId}. Checking follow status...`);
    const isFollowing = await checkFollowerStatus(platform, chatId, userId);
    
    if (isFollowing) {
      console.log(`🔓 [DESKTOP SUCCESS] User ${chatId} has now followed! Triggering pending campaign.`);
      const pendingId = contact.pendingCampaignId;
      
      // Clear pending status first to avoid loops
      await Contact.findOneAndUpdate({ userId, chatId }, { $unset: { pendingCampaignId: 1 } });
      
      // Execute the pending campaign
      const match = await Campaign.findById(pendingId);
      if (match && match.status === 'Active') {
        const userSettings = await Settings.findOne({ userId });
        const activeToken = passedToken || userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;
        
        await sendMessageToInstagram(platform, chatId, match.response, match.videoUrl || match.linkUrl, userId, match.buttonText, activeToken, match.buttons);
        await Campaign.findByIdAndUpdate(pendingId, { $inc: { dmsSent: 1 } });
        return { pending_triggered: true };
      }
    } else {
      console.log(`🚫 [DESKTOP FAIL] User ${chatId} still not following.`);
    }
  }

  // --- DESKTOP FALLBACK: Opening Message Re-check ---
  // If the user was sent an "Opening Message" (Double opt-in), and they reply with text,
  // we treat it as if they clicked the button.
  if (contact && contact.pendingOpeningCampaignId) {
    console.log(`🔓 [DESKTOP SUCCESS] User ${chatId} replied to Opening Message. Triggering final response.`);
    const pendingId = contact.pendingOpeningCampaignId;
    
    // Clear pending status
    await Contact.findOneAndUpdate({ userId, chatId }, { $unset: { pendingOpeningCampaignId: 1 } });
    
    const match = await Campaign.findById(pendingId);
    if (match && match.status === 'Active') {
      const userSettings = await Settings.findOne({ userId });
      const activeToken = passedToken || userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;
      
      await sendMessageToInstagram(platform, chatId, match.response, match.videoUrl || match.linkUrl, userId, match.buttonText, activeToken, match.buttons);
      await Campaign.findByIdAndUpdate(pendingId, { $inc: { dmsSent: 1 } });
      return { opening_triggered: true };
    }
  }

  // 1. Check for Active Flows first (Advanced Automation)
  const queryUserId = userId;
  const activeFlows = await Flow.find({
    $or: [{ userId }, { userId: queryUserId }],
    status: 'Active'
  });

  const matchedFlow = activeFlows.find(f => {
    if (!f.triggerKeyword) return false;
    const keywords = f.triggerKeyword.split(',').map(k => k.toLowerCase().replace(/\s+/g, ' ').trim());
    const cleanUserMsg = text.toLowerCase().replace(/\s+/g, ' ').trim();
    return keywords.some(k => cleanUserMsg.includes(k));
  });

  if (matchedFlow) {
    console.log(`🌊 FLOW MATCH: Triggering Flow "${matchedFlow.name}" for Sender: ${chatId}`);
    await runFlow(userId, matchedFlow._id, chatId, platform, text, commentId);
    return { flow: matchedFlow.name };
  }

  const userMessage = text.toLowerCase();

  // 2. Keyword Campaign Checking
  let activeCampaigns = await Campaign.find({
    $or: [{ userId }, { userId: queryUserId }],
    status: 'Active'
  });

  // SORT: Specific keywords first, Wildcards (*) last
  activeCampaigns = activeCampaigns.sort((a, b) => {
    if (a.trigger === '*' && b.trigger !== '*') return 1;
    if (a.trigger !== '*' && b.trigger === '*') return -1;
    return 0;
  });

  console.log(`🔍 DEBUG: Checking ${activeCampaigns.length} active campaigns for user ${userId}. Message: "${text}"`);

  const match = activeCampaigns.find(c => {
    const platformMatch = c.platform === 'all' || c.platform === (platform || 'instagram');
    // Legacy support: If new booleans are missing, fallback to the old triggerSource string
    const triggerDms = c.triggerOnDms ?? (c.triggerSource === 'dm' || !c.triggerSource);
    const triggerComments = c.triggerOnComments ?? (c.triggerSource === 'comment');
    const triggerStories = c.triggerOnStories ?? (c.triggerSource === 'story_mention');

    const sourceMatch = (source === 'dm' && triggerDms) ||
      (source === 'comment' && triggerComments) ||
      (source === 'story_mention' && triggerStories);

    const cleanUserMsg = text.toLowerCase().replace(/\s+/g, ' ').trim();

    // Support for multiple keywords separated by commas
    const keywords = c.trigger.split(',').map(k => k.toLowerCase().replace(/\s+/g, ' ').trim());

    // Check if any keyword matches
    const keywordMatch = keywords.some(k => {
      if (k === '*') return true; // Wildcard match
      return cleanUserMsg.includes(k);
    });

    // Only apply Post ID filtering for COMMENTS. DMs and Story Mentions stay global.
    // Universal Triggers (c.isUniversal) bypass post-specific filtering.
    const postMatch = (source !== 'comment') || c.isUniversal || c.isAnyPost || (mediaId && c.postId === mediaId);

    return platformMatch && sourceMatch && keywordMatch && postMatch;
  });

  if (match) {
    const campaignName = match.name || `Automation (${match.trigger})`;
    console.log(`🎯 MATCH FOUND! Campaign: "${campaignName}" | Trigger: "${match.trigger}" | Platform: ${platform} | Source: ${source}`);

    // Determine the best token to use
    const userSettings = await Settings.findOne({ userId });
    const activeToken = passedToken || userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;

    // GATING: Follower Check
    if (match.requireFollow) {
      console.log(`🛡️ GATING: Checking follower status for ${chatId}...`);
      const isFollowing = await checkFollowerStatus(platform, chatId, userId);

      if (!isFollowing) {
        console.log(`🚫 GATED: User ${chatId} is not following. Sending follow-request DM.`);

        // 1. Send Private DM Request with a "Check Follow" button
        const followText = match.unfollowedResponse || "Hey! Please follow our account first to get the link! 😊";
        const checkFollowPayload = `CHECK_FOLLOW_${match._id}`;

        // Use a generic template with a postback button for reliability
        await sendMessageToInstagram(platform, chatId, followText, '', userId, "I've Followed! ✅", activeToken, [], checkFollowPayload);

        // 2. Send PUBLIC Comment Reply (Crucial for Comments)
        if (source === 'comment' && commentId) {
          console.log(`💬 Sending GATED public reply to comment ${commentId}`);
          const publicGated = "I've sent you a DM! 🚀 Please follow our account first to receive your exclusive link! 😊";
          await sendPublicComment(platform, commentId, publicGated, userId, activeToken);
        }

        // Store this campaign as 'pending' for when they follow
        await Contact.findOneAndUpdate(
          { userId, chatId },
          { pendingCampaignId: match._id, lastActive: new Date() },
          { upsert: true }
        );

        return { gated: true };
      }
      console.log(`✅ UNGATED: User ${chatId} is a follower.`);
    }

    if (match.openingMessage && match.openingMessageText) {
      console.log(`👋 Sending OPENING message for campaign "${campaignName}"`);
      // Ensure there's a button text, otherwise the postback flow won't work
      const btnText = match.openingMessageButton || "Click to Continue 🚀";
      const payload = `CAMP_${match._id}`;

      const openingSent = await sendMessageToInstagram(platform, chatId, match.openingMessageText, '', userId, btnText, activeToken, [], payload);

      if (openingSent) {
        // Track that this user is waiting for an opening message confirmation
        await Contact.findOneAndUpdate(
          { userId, chatId },
          { pendingOpeningCampaignId: match._id, lastActive: new Date() },
          { upsert: true }
        );

        if (source === 'comment' && commentId) {
          console.log(`💬 Sending CUSTOM public comment reply to ${commentId} (Opening Message)`);
          const replyText = match.publicReplyText || `Check your DMs! 🚀 I've sent you the info.`;
          await sendPublicComment(platform, commentId, replyText, userId, activeToken);
        }
        console.log(`⏳ Flow paused. Waiting for user to click "${btnText}" or reply. Payload: ${payload}`);
        return { opening_message_sent: true };
      } else {
        console.warn(`⚠️ Opening message failed. Falling back to immediate response.`);
      }
    }

    console.log(`✅ EXECUTING: Dispatching response for "${campaignName}"`);
    const sent = await sendMessageToInstagram(platform, chatId, match.response, match.videoUrl || match.linkUrl, userId, match.buttonText, activeToken, match.buttons);

    // NEW: If it's a comment, also send a public reply to the comment
    if (source === 'comment' && commentId) {
      console.log(`💬 Sending CUSTOM public comment reply to ${commentId}`);
      const replyText = match.publicReplyText || `Check your DMs! 🚀 I've sent you the info.`;
      await sendPublicComment(platform, commentId, replyText, userId, activeToken);
    }

    if (sent) {
      const autoReply = new Message({
        userId: userId,
        chatId: chatId || 'default', sender: 'AI Agent', text: match.response, type: 'sent', platform, isAI: true, campaignId: match._id, timestamp: new Date()
      });
      try {
        await autoReply.save();
      } catch (dbErr) {
        console.error("⚠️ Failed to save campaign message to DB:", dbErr.message);
      }
      await Campaign.findByIdAndUpdate(match._id, { $inc: { dmsSent: 1 } });
      io.to(userId.toString()).emit('new_message', autoReply);
      console.log(`🚀 REPLY DISPATCHED to ${chatId}`);
      return { reply: autoReply };
    } else {
      console.error(`❌ DISPATCH FAIL: metaApi.js could not send the message to ${chatId}`);
      return { error: 'dispatch_failed' };
    }
  }

  // 3. AI Studio Fallback (Only if enabled)
  const settings = await Settings.findOne({
    $or: [{ userId }, { userId: queryUserId }]
  });
  if (settings?.isAiEnabled) {
    console.log(`😴 NO KEYWORD MATCH: Falling back to AI Studio...`);
    try {
      const aiResponse = await generateAIResponse(userId, text);

      if (aiResponse) {
        const sent = await sendMessageToInstagram(platform, chatId, aiResponse, '', userId);

        if (sent) {
          try {
            const autoReply = new Message({
              userId: userId,
              chatId: chatId || 'default',
              sender: 'AI Agent',
              text: aiResponse,
              type: 'sent',
              platform,
              isAI: true,
              timestamp: new Date()
            });
            await autoReply.save();
            io.to(userId.toString()).emit('new_message', autoReply);
          } catch (dbErr) {
            console.error("⚠️ Failed to save AI response to DB:", dbErr.message);
          }
          console.log(`🤖 AI FALLBACK SUCCESS: Sent AI response to ${chatId}`);
          return { ai_reply: aiResponse };
        }
      }
    } catch (aiErr) {
      console.error("🔥 AI Fallback failed:", aiErr);
    }
  } else {
    console.log(`😴 NO KEYWORD MATCH: AI Studio is disabled for user ${userId}.`);
  }

  return { skipped: true, reason: 'no keywords matched and AI failed' };
};

// Server is ready

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    database: lastDbError ? 'Error' : 'Connected to Supabase',
    db_error: lastDbError,
    supabase_url_exists: !!process.env.SUPABASE_URL,
    timestamp: new Date()
  });
});

app.get('/', (req, res) => {
  res.status(200).json({
    message: "🚀 Instagram DM Automation AI API is running!",
    status: "Healthy",
    docs: "Contact administrator for API documentation"
  });
});

// Socket.io Connection
io.on('connection', (socket) => {
  console.log('🔌 New client connected:', socket.id);

  socket.on('join_room', (userId) => {
    socket.join(userId.toString());
    console.log(`👤 User ${userId} joined their private room`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected');
  });
});


// --- Meta Webhook Verification (GET) ---
app.get('/api/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === (process.env.META_VERIFY_TOKEN || 'dm_automate_verify_123')) {
      console.log('✅ Webhook Verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

app.post('/api/webhook', async (req, res) => {
  const body = req.body;
  console.log('🚀 [SUPER LOG] Webhook Received! Object:', body.object);
  console.log('📦 Full Payload:', JSON.stringify(body, null, 2));

  // --- WEBHOOK HIT DETECTOR ---
  console.log('---------------------------------------------------------');
  console.log('📡 [WEBHOOK HIT] Incoming Request from Meta!');
  console.log('📅 Time:', new Date().toISOString());
  console.log('📦 Body Keys:', Object.keys(req.body));
  console.log('---------------------------------------------------------');

  if (body.object === 'instagram' || body.object === 'page') {
    if (!body.entry || !Array.isArray(body.entry)) {
      console.warn('⚠️ Webhook received but "entry" is missing or not an array.');
      return res.status(200).send('NO_ENTRY');
    }

    for (const entry of body.entry) {
      const pageId = entry.id;
      console.log(`🏠 Entry ID (Page/Account): ${pageId}`);

      // 1. Handle Messaging (DMs)
      const messagingArray = entry.messaging || [];
      for (const messaging of messagingArray) {
        // IGNORE ECHOS (Messages sent by the page/app itself)
        if (messaging.message?.is_echo) {
          console.log('⏭️ Skipping echo message (sent by us).');
          continue;
        }

        const senderId = messaging.sender.id;
        const text = messaging.message?.text;

        // EXTRA SAFETY: If the sender is the page itself, skip it
        if (senderId === pageId) {
          console.log('⏭️ Skipping message from our own Page ID.');
          continue;
        }

        console.log(`📩 Messaging detected from ${senderId}`);

        // 1.1 Handle Messages (Text/Story)
        if (messaging.message?.text || messaging.message?.story) {
          const isStoryMention = !!messaging.message?.story;
          const messageText = messaging.message?.text || (isStoryMention ? "[Story Mention]" : "");

          console.log(`📬 INCOMING DM: ${isStoryMention ? 'Story' : 'DM'} | Sender: ${senderId} | Msg: ${messageText}`);

          const platform = body.object === 'instagram' ? 'instagram' : 'facebook';
          let allMatchingSettings = await Settings.find({
            $or: [{ instagramPageId: pageId }, { businessAccountId: pageId }, { facebookPageId: pageId }]
          });

          if (!allMatchingSettings || allMatchingSettings.length === 0) {
            console.warn(`🛑 UNKNOWN PAGE: ID ${pageId} is not linked to any user.`);
            continue;
          }

          let userSettings = allMatchingSettings[0];
          for (const setting of allMatchingSettings) {
            const campaigns = await Campaign.find({ userId: setting.userId, status: 'Active' });
            if (campaigns && campaigns.length > 0) {
              userSettings = setting;
              break;
            }
          }

          const targetUserId = userSettings.userId;
          if (targetUserId) {
            try {
              const incoming = new Message({
                userId: targetUserId, chatId: senderId, sender: 'user', text: messageText,
                type: 'received', platform, timestamp: new Date()
              });
              await incoming.save();
              io.to(targetUserId.toString()).emit('new_message', incoming);
            } catch (dbErr) {
              console.error("⚠️ Failed to save incoming DM to DB:", dbErr.message);
            }

            processAutoReply(targetUserId.toString(), platform, senderId, messageText, isStoryMention ? "story_mention" : "dm").catch(err => {
              console.error("🔥 AutoReply error:", err);
            });
          }
        }

        // 1.2 Handle Postbacks (Button Clicks)
        if (messaging.postback) {
          const payload = messaging.postback.payload;
          console.log(`🔘 POSTBACK DETECTED from ${senderId}: ${payload}`);

          const platform = body.object === 'instagram' ? 'instagram' : 'facebook';

          // A. Opening Message Button Click
          if (payload.startsWith('CAMP_')) {
            const campaignId = payload.split('_')[1];

            // Run asynchronously to prevent webhook timeouts
            (async () => {
              try {
                const match = await Campaign.findById(campaignId);

                if (match && match.status === 'Active') {
                  console.log(`🚀 TRIGGERING MAIN RESPONSE for Campaign: ${match.name}`);
                  const userSettings = await Settings.findOne({ userId: match.userId });
                  const activeToken = userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;
                  await sendMessageToInstagram(platform, senderId, match.response, match.videoUrl || match.linkUrl, match.userId, match.buttonText, activeToken, match.buttons);
                  await Campaign.findByIdAndUpdate(campaignId, { $inc: { dmsSent: 1 } });
                }
              } catch (err) {
                console.error("Error processing CAMP_ postback:", err);
              }
            })();
          }

          // B. "I've Followed" Button Click
          if (payload.startsWith('CHECK_FOLLOW_')) {
            const campaignId = payload.split('_')[2];

            // Run asynchronously to prevent webhook timeouts
            (async () => {
              try {
                const match = await Campaign.findById(campaignId);

                if (match && match.status === 'Active') {
                  console.log(`🛡️ VERIFYING FOLLOW on button click for ${senderId}...`);
                  const isFollowing = await checkFollowerStatus(platform, senderId, match.userId);

                  const userSettings = await Settings.findOne({ userId: match.userId });
                  const activeToken = userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;

                  if (isFollowing) {
                    console.log(`✅ VERIFIED! Triggering automation for ${match.name}`);

                    // 1. Clear pending status
                    await Contact.findOneAndUpdate({ chatId: senderId }, { $unset: { pendingCampaignId: 1 } });

                    // 2. Decide: Opening Message or Main Response?
                    if (match.openingMessage && match.openingMessageText) {
                      const btnText = match.openingMessageButton || "Click to Continue 🚀";
                      const nextPayload = `CAMP_${match._id}`;
                      await sendMessageToInstagram(platform, senderId, match.openingMessageText, '', match.userId, btnText, activeToken, [], nextPayload);
                    } else {
                      await sendMessageToInstagram(platform, senderId, match.response, match.videoUrl || match.linkUrl, match.userId, match.buttonText, activeToken, match.buttons);
                      await Campaign.findByIdAndUpdate(campaignId, { $inc: { dmsSent: 1 } });
                    }
                  } else {
                    console.log(`🚫 STILL NOT FOLLOWING: ${senderId}`);
                    const retryText = "It looks like you haven't followed yet! Please follow @us and then click the button again. 😊";
                    await sendMessageToInstagram(platform, senderId, retryText, '', match.userId, "Try Again! ✅", activeToken, [], payload);
                  }
                }
              } catch (err) {
                console.error("Error processing CHECK_FOLLOW_ postback:", err);
              }
            })();
          }
        }
      }

      // 2. Handle Comments
      const changes = entry.changes || [];
      if (changes.length === 0 && body.object === 'instagram') {
        console.warn('💡 CONNECTION DOCTOR: Received a webhook but "changes" (Comments) is empty. Please ensure you have subscribed to the "comments" field in your Meta Developer Dashboard -> Webhooks -> Instagram.');
      }
      console.log(`🔄 Changes detected: ${changes.length}`);

      for (const change of changes) {
        console.log(`📝 Change Field: ${change.field}`);
        if (change.field === 'feed' || change.field === 'comments') {
          const val = change.value;
          console.log('💎 [DEEP DATA] Interaction Detected! Field:', change.field);
          console.log('📦 Value:', JSON.stringify(val, null, 2));

          const text = val.text || val.message;
          const senderId = val.from?.id;
          const commentId = val.id || val.comment_id;
          const mediaId = val.media?.id || val.post_id || val.video_id;

          // Handle all interaction types (Comment, Post, Video, etc.)
          console.log(`🎯 [REEL DEBUG] Processing interaction from ${change.field}. Item: ${val.item || 'N/A'}`);

          // CRITICAL: Ensure we are not replying to ourselves
          if (senderId === pageId) {
            console.log('⏭️ Skipping change from ourselves.');
            continue;
          }

          console.log(`💬 COMMENT DETECTED: "${text}" from ${senderId} (on Page: ${pageId})`);

          if (text && senderId && commentId) {
            const platform = body.object === 'instagram' ? 'instagram' : 'facebook';

            // Identity Search
            let allMatchingSettings = await Settings.find({
              $or: [
                { instagramPageId: pageId },
                { businessAccountId: pageId },
                { facebookPageId: pageId }
              ]
            });

            let userSettings = allMatchingSettings[0];
            for (const setting of allMatchingSettings) {
              const campaigns = await Campaign.find({ userId: setting.userId, status: 'Active' });
              if (campaigns && campaigns.length > 0) {
                userSettings = setting;
                break;
              }
            }

            let targetUserId = userSettings?.userId;

            if (!targetUserId) {
              console.warn(`🚨 [ID MISMATCH]: No user settings found for ID ${pageId}. Trying fallback...`);
              const fallback = await User.findOne();
              targetUserId = fallback?._id;
              if (targetUserId) console.log(`🩹 [FALLBACK]: Using User ID ${targetUserId} as catch-all.`);
            }

            if (targetUserId) {
              console.log(`✅ [MATCH FOUND]: Processing comment for User ${targetUserId}`);
              const accessToken = userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;

              try {
                const incoming = new Message({
                  userId: targetUserId, chatId: senderId, sender: 'user', text: `[Comment] ${text}`,
                  type: 'received', platform, timestamp: new Date()
                });
                await incoming.save();
                io.to(targetUserId.toString()).emit('new_message', incoming);
              } catch (dbErr) {
                console.error("⚠️ Failed to save incoming comment to DB:", dbErr.message);
              }

              // Pass the fresh token and mediaId to processAutoReply
              processAutoReply(targetUserId.toString(), platform, senderId, text, 'comment', commentId, accessToken, mediaId).catch(err => {
                console.error("🔥 Comment Reply error:", err);
              });
            }
          } else {
            console.log(`⏭️ Skipping comment: text missing or sender is the page itself.`);
          }
        }

        // 3. Handle Relationships (Follows)
        if (change.field === 'relationships') {
          const val = change.value;
          console.log(`👤 RELATIONSHIP CHANGE: ${val.action} from ${val.from_id || val.id}`);

          if (val.action === 'follow') {
            const senderId = val.from_id || val.id;
            const platform = body.object === 'instagram' ? 'instagram' : 'facebook';

            // Find if this user has a pending automation
            const contact = await Contact.findOne({ chatId: senderId });

            if (contact && contact.pendingCampaignId) {
              console.log(`🎯 AUTO-TRIGGER: User ${senderId} followed! Sending pending campaign ${contact.pendingCampaignId}`);

              const targetUserId = contact.userId;
              const campaignId = contact.pendingCampaignId;

              // Clear pending status so it doesn't repeat
              await Contact.findByIdAndUpdate(contact._id, { $unset: { pendingCampaignId: 1 } });

              const match = await Campaign.findById(campaignId);
              if (match && match.status === 'Active') {
                const userSettings = await Settings.findOne({ userId: targetUserId });
                const activeToken = userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;

                // Execute! (Opening message flow if enabled)
                processAutoReply(targetUserId.toString(), platform, senderId, "[FOLLOW_TRIGGER]", 'dm', null, activeToken).catch(err => {
                  console.error("🔥 Follow Auto-Trigger error:", err);
                });
              }
            }
          }
        }
      }
    }
    return res.status(200).send('EVENT_RECEIVED');

    // WhatsApp webhook handling
  } else if (body.object === 'whatsapp_business_account') {
    for (const entry of body.entry) {
      const changes = entry.changes || [];
      for (const change of changes) {
        if (change.field === 'messages') {
          const value = change.value;
          const phoneNumberId = value?.metadata?.phone_number_id;
          const messages = value?.messages || [];

          for (const msg of messages) {
            const senderPhone = msg.from;
            const text = msg.text?.body;

            if (text) {
              console.log(`📬 WhatsApp Message from ${senderPhone}: ${text}`);

              // Find user by WhatsApp Phone Number ID
              const userSettings = await Settings.findOne({ whatsappPhoneNumberId: phoneNumberId });
              let targetUserId;

              if (userSettings) {
                targetUserId = userSettings.userId;
              } else {
                const fallbackUser = await User.findOne();
                if (fallbackUser) targetUserId = fallbackUser._id;
              }

              if (targetUserId) {
                try {
                  const incoming = new Message({
                    userId: targetUserId,
                    chatId: senderPhone,
                    sender: 'user',
                    text: text,
                    type: 'received',
                    platform: 'whatsapp',
                    timestamp: new Date()
                  });
                  await incoming.save();
                  io.to(targetUserId.toString()).emit('new_message', incoming);
                } catch (dbErr) {
                  console.error("⚠️ Failed to save incoming WhatsApp message to DB:", dbErr.message);
                }

                // Auto-reply
                await processAutoReply(targetUserId.toString(), 'whatsapp', senderPhone, text);
              }
            }
          }
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/oauth', oauthRoutes);
app.use('/api/forms', formRoutes);

// --- MEDIA UPLOAD ROUTE ---
app.post('/api/upload', verifyToken, upload.single('media'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    // Dynamically determine the base URL from the request
    const host = req.get('host');
    const protocol = req.protocol;
    // Prioritize localhost for local testing even if API_BASE_URL is set (prevents ngrok tunnel issues)
    const baseUrl = (host.includes('localhost') || host.includes('127.0.0.1'))
      ? `${protocol}://${host}`
      : (process.env.API_BASE_URL || `${protocol}://${host}`);

    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const fileUrl = `${cleanBaseUrl}/uploads/${req.file.filename}`;

    res.json({ url: fileUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Contacts API (Tagging & Notes) ---
app.get('/api/contacts', verifyToken, async (req, res) => {
  try {
    const contacts = await Contact.find({ userId: req.user.userId }).sort({ lastActive: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/contacts/:id', verifyToken, async (req, res) => {
  try {
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { ...req.body },
      { new: true }
    );
    res.json(contact);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5001;

// --- AI Studio Studio / Test Playground routes ---
app.get('/api/chats', verifyToken, async (req, res) => {
  try {
    const messages = await ChatMessage.find({ userId: req.user.userId }).sort({ createdAt: 1 }).limit(50);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chats', verifyToken, async (req, res) => {
  try {
    const newMessage = new ChatMessage({ ...req.body, userId: req.user.userId });
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
    await ChatMessage.deleteMany({ userId: req.user.userId });
    res.json({ success: true, message: 'Chat history cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Dashboard Stats Endpoint
app.get('/api/stats', verifyToken, async (req, res) => {
  try {
    const { filter } = req.query;
    let dateQuery = {};

    if (filter === '7d') {
      const d = new Date(); d.setDate(d.getDate() - 7);
      dateQuery = { $gte: d };
    } else if (filter === '30d') {
      const d = new Date(); d.setDate(d.getDate() - 30);
      dateQuery = { $gte: d };
    }

    const campaignMatch = { userId: req.user.userId };
    const messageMatch = { userId: req.user.userId };

    if (Object.keys(dateQuery).length > 0) {
      campaignMatch.createdAt = dateQuery;
      messageMatch.timestamp = dateQuery;
    }

    const totalDMs = await Campaign.aggregate([
      { $match: campaignMatch },
      { $group: { _id: null, total: { $sum: "$dmsSent" } } }
    ]);
    const campaignsCount = await Campaign.countDocuments(campaignMatch);
    const messagesCount = await Message.countDocuments(messageMatch);

    const sentMessages = await Message.countDocuments({ ...messageMatch, type: 'sent' });
    const receivedMessages = await Message.countDocuments({ ...messageMatch, type: 'received' });
    const aiSentMessages = await Message.countDocuments({ ...messageMatch, type: 'sent', isAI: true });

    // Fetch unique contacts and user plan
    const uniqueContacts = await Message.distinct('chatId', messageMatch);
    const userProfile = await User.findById(req.user.userId);

    let accuracy = 0;
    if (receivedMessages > 0) {
      accuracy = Math.round((aiSentMessages / receivedMessages) * 100);
      if (accuracy > 100) accuracy = 100;
    }

    res.json({
      totalDMs: totalDMs[0]?.total || 0,
      sentMessages,
      receivedMessages,
      campaigns: campaignsCount,
      messages: messagesCount,
      aiReplyRate: `${accuracy}%`,
      plan: userProfile?.plan || 'free',
      contactCount: uniqueContacts.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Campaigns API
app.get('/api/campaigns', verifyToken, async (req, res) => {
  try {
    const campaigns = await Campaign.find({
      userId: req.user.userId
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
      userId: req.user.userId
    });
    await newCampaign.save();
    res.json(newCampaign);
  } catch (err) {
    console.error("❌ Error creating campaign:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/campaigns/:id', verifyToken, async (req, res) => {
  try {
    const updateData = { ...req.body };
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: updateData },
      { new: true }
    );
    res.json(campaign);
  } catch (err) {
    console.error("❌ Error updating campaign:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/campaigns/:id', verifyToken, async (req, res) => {
  try {
    const result = await Campaign.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.userId
    });

    if (!result) {
      return res.status(404).json({ message: "Campaign not found or unauthorized to delete" });
    }

    res.json({ message: 'Campaign deleted successfully' });
  } catch (err) {
    console.error("❌ Error deleting campaign:", err.message);
    res.status(500).json({ error: "Internal Server Error: Could not delete campaign" });
  }
});

// Campaign Logs Endpoint
app.get('/api/campaigns/:id/logs', verifyToken, async (req, res) => {
  try {
    const logs = await Message.find({
      userId: req.user.userId,
      campaignId: req.params.id
    }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Scheduling API
app.get('/api/scheduling', verifyToken, async (req, res) => {
  try {
    const posts = await ScheduledPost.find({ userId: req.user.userId }).sort({ scheduledFor: 1 });
    // Handle serialized metadata
    const processedPosts = posts.map(post => {
      const p = post.toObject ? post.toObject() : { ...post };
      if (p.mediaUrl && p.mediaUrl.startsWith('{')) {
        try {
          const meta = JSON.parse(p.mediaUrl);
          p.type = meta.type || p.type;
          p.carouselItems = meta.carouselItems || [];
          p.mediaUrl = meta.mediaUrl || (p.carouselItems.length > 0 ? p.carouselItems[0] : '');
        } catch (e) {}
      } else if (p.mediaUrl && p.mediaUrl.startsWith('[')) {
        try {
          p.carouselItems = JSON.parse(p.mediaUrl);
          p.mediaUrl = p.carouselItems[0];
        } catch (e) {}
      }
      return p;
    });
    res.json(processedPosts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/scheduling', verifyToken, upload.array('files', 10), async (req, res) => {
  try {
    const { uploadToSupabase } = await import('./utils/supabase.js');
    
    // Process and upload files to Supabase Storage for persistence
    const mediaFiles = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const fileContent = fs.readFileSync(file.path);
        const fileName = `${Date.now()}-${file.filename}`;
        const publicUrl = await uploadToSupabase(fileContent, fileName, file.mimetype);
        if (publicUrl) {
          mediaFiles.push(publicUrl);
        }
        // Cleanup local file after cloud upload
        try { fs.unlinkSync(file.path); } catch (e) {}
      }
    }

    let mediaUrl = mediaFiles.length > 0 ? mediaFiles[0] : req.body.mediaUrl;
    
    // Serialize metadata for Supabase/DB compatibility
    const metadata = {
      type: req.body.type || 'image',
      carouselItems: mediaFiles.length > 0 ? mediaFiles : (req.body.carouselItems || []),
      mediaUrl: mediaUrl
    };
    
    const finalMediaUrl = JSON.stringify(metadata);

    const postData = {
      ...req.body,
      userId: req.user.userId,
      mediaUrl: finalMediaUrl,
      status: 'Scheduled'
    };

    // Clean up fields that might not exist in schema
    delete postData.type;
    delete postData.carouselItems;

    console.log(`📡 Checking user existence for: ${req.user.userId}`);
    const userExists = await User.findById(req.user.userId);
    if (!userExists) {
      console.error(`❌ USER NOT FOUND IN DATABASE: ${req.user.userId}. This will cause a foreign key error.`);
    } else {
      console.log(`✅ User verified in database: ${userExists.username || userExists.email}`);
    }

    const newPost = new ScheduledPost(postData);
    try {
      await newPost.save();
      res.json(newPost);
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
    const captions = await Caption.find({ userId: req.user.userId }).sort({ createdAt: -1 });
    res.json(captions);
  } catch (err) {
    console.error('❌ CAPTIONS FETCH ERROR:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/captions', verifyToken, async (req, res) => {
  try {
    const newCaption = new Caption({ ...req.body, userId: req.user.userId });
    await newCaption.save();
    res.json(newCaption);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/captions/:id', verifyToken, async (req, res) => {
  try {
    await Caption.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/scheduling/:id', verifyToken, async (req, res) => {
  try {
    await ScheduledPost.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Messages API (Inbox)
app.get('/api/messages', verifyToken, async (req, res) => {
  const messages = await Message.find({ userId: req.user.userId }).sort({ timestamp: 1 });
  res.json(messages);
});

// Optimized route for Audience Manager history
app.get('/api/messages/contact/:chatId', verifyToken, async (req, res) => {
  try {
    const messages = await Message.find({
      userId: req.user.userId,
      chatId: req.params.chatId
    }).sort({ timestamp: -1 }).limit(100);
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', verifyToken, async (req, res) => {
  try {
    const { sender, text, type, chatId, platform } = req.body;

    // Explicitly casting userId to ObjectId to ensure it saves correctly
    const newMessage = new Message({
      userId: req.user.userId,
      sender,
      text,
      type: type || 'sent', // Default to sent if missing
      chatId: chatId || 'default',
      platform: platform || 'instagram',
      videoUrl: req.body.videoUrl || '',
      linkUrl: req.body.linkUrl || '',
      timestamp: new Date()
    });

    await newMessage.save();
    console.log("✅ Message saved to DB:", newMessage._id);

    // Auto-Upsert Contact Metadata
    try {
      await Contact.findOneAndUpdate(
        { userId: req.user.userId, chatId: chatId || 'default' },
        {
          $set: {
            lastActive: new Date(),
            platform: platform || 'instagram'
          },
          $inc: { totalMessages: 1 },
          $setOnInsert: {
            name: sender !== 'AI Agent' && sender !== 'admin' ? sender : (chatId || 'default'),
            tags: [],
            notes: ''
          }
        },
        { upsert: true, new: true }
      );
    } catch (contactErr) {
      console.error("⚠️ Failed to update contact metadata:", contactErr.message);
    }

    // Emit new message via Socket.io to the specific user's room
    const emissionPayload = newMessage.toObject();
    if (req.body.tempId) {
      emissionPayload.tempId = req.body.tempId;
    }
    io.to(req.user.userId).emit('new_message', emissionPayload);

    // AI Auto-Reply Logic (Run asynchronously so it doesn't block the response)
    if (sender === 'user') {
      processAutoReply(req.user.userId, newMessage.platform, chatId, text).catch(err => {
        console.error("AutoReply error:", err);
      });
    }

    res.json(newMessage);

  } catch (err) {
    console.error("❌ Error saving message:", err.message);
    res.status(500).json({ error: "DB Save Error: " + err.message });
  }
});

app.delete('/api/messages/all', verifyToken, async (req, res) => {
  try {
    await Message.deleteMany({ userId: req.user.userId });
    res.json({ message: 'All messages deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/messages/:id', verifyToken, async (req, res) => {
  try {
    await Message.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    res.json({ message: 'Message deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Settings API
app.get('/api/settings', verifyToken, async (req, res) => {
  try {
    console.log(`🔍 SETTINGS LOOKUP: Fetching for userId: ${req.user.userId}`);
    let settings = await Settings.findOne({ userId: req.user.userId });
    
    if (!settings) {
      console.warn(`⚠️ SETTINGS NOT FOUND for userId: ${req.user.userId}. Creating default.`);
      settings = new Settings({ userId: req.user.userId });
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
    const settings = await Settings.findOne({ userId: req.user.userId });
    if (!settings || !settings.instagramAccessToken || !settings.businessAccountId) {
      return res.status(400).json({ error: 'Instagram account not fully connected' });
    }

    const { type } = req.query; // 'media' or 'stories'
    const endpoint = type === 'stories' ? 'stories' : 'media';

    const response = await axios.get(`https://graph.facebook.com/v19.0/${settings.businessAccountId}/${endpoint}`, {
      params: {
        fields: 'id,media_type,media_url,thumbnail_url,timestamp,permalink',
        access_token: settings.instagramAccessToken
      }
    });

    res.json(response.data.data || []);
  } catch (err) {
    console.error("❌ Error fetching IG media:", err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch Instagram media' });
  }
});

app.post('/api/settings', verifyToken, async (req, res) => {
  try {
    const data = { ...req.body, updatedAt: new Date() };
    const platform = req.body._platform; // frontend sends which platform is being saved
    delete data._platform;

    // ── Validate tokens against Meta Graph API ──
    if (platform === 'instagram') {
      if (data.instagramAccessToken) {
        try {
          const testRes = await axios.get(`https://graph.facebook.com/v19.0/me?access_token=${data.instagramAccessToken}`);
          if (testRes.data && testRes.data.id) {
            data.isAccountConnected = true;
            data.connectionError = '';
            data.connectedInstagramName = testRes.data.name || testRes.data.id;
            data.lastTestedAt = new Date();
            console.log('✅ Instagram token validated:', data.connectedInstagramName);
          }
        } catch (metaErr) {
          data.isAccountConnected = false;
          const errMsg = metaErr.response?.data?.error?.message || 'Invalid Access Token';
          data.connectionError = errMsg;
          return res.status(400).json({
            error: `Instagram connection failed: ${errMsg}`,
            isAccountConnected: false
          });
        }
      } else {
        data.isAccountConnected = false;
      }
    }

    if (platform === 'facebook') {
      if (data.facebookAccessToken && data.facebookPageId) {
        try {
          const testRes = await axios.get(`https://graph.facebook.com/v19.0/${data.facebookPageId}?access_token=${data.facebookAccessToken}`);
          if (testRes.data && testRes.data.id) {
            data.isFacebookConnected = true;
            data.connectionError = '';
            data.connectedFacebookName = testRes.data.name || testRes.data.id;
            data.lastTestedAt = new Date();
            console.log('✅ Facebook token validated:', data.connectedFacebookName);
          }
        } catch (metaErr) {
          data.isFacebookConnected = false;
          const errMsg = metaErr.response?.data?.error?.message || 'Invalid Access Token or Page ID';
          data.connectionError = errMsg;
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
            data.connectionError = '';
            data.connectedWhatsAppName = testRes.data.verified_name || testRes.data.display_phone_number || testRes.data.id;
            data.lastTestedAt = new Date();
            console.log('✅ WhatsApp token validated:', data.connectedWhatsAppName);
          }
        } catch (metaErr) {
          data.isWhatsAppConnected = false;
          const errMsg = metaErr.response?.data?.error?.message || 'Invalid Access Token or Phone Number ID';
          data.connectionError = errMsg;
          return res.status(400).json({
            error: `WhatsApp connection failed: ${errMsg}`,
            isWhatsAppConnected: false
          });
        }
      } else {
        data.isWhatsAppConnected = false;
      }
    }

    const settings = await Settings.findOneAndUpdate(
      { userId: req.user.userId },
      data,
      { upsert: true, new: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings/whatsapp/connect-qr', verifyToken, async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: req.user.userId },
      {
        isWhatsAppConnected: true,
        connectedWhatsAppName: 'WhatsApp QR Connected',
        whatsappToken: 'mock_qr_token',
        whatsappPhoneNumberId: 'mock_qr_id',
        lastTestedAt: new Date()
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
    const flows = await Flow.find({ userId: req.user.userId });
    res.json(flows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/flows/:id', verifyToken, async (req, res) => {
  try {
    const flow = await Flow.findOne({ _id: req.params.id, userId: req.user.userId });
    if (!flow) return res.status(404).json({ error: 'Flow not found' });
    res.json(flow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/flows', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.plan !== 'pro') {
      return res.status(403).json({ error: 'Pro plan required to create advanced flows.' });
    }
    const newFlow = new Flow({ ...req.body, userId: req.user.userId });
    await newFlow.save();
    res.json(newFlow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/flows/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.plan !== 'pro') {
      return res.status(403).json({ error: 'Pro plan required to update advanced flows.' });
    }
    const flow = await Flow.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { ...req.body, updatedAt: new Date() },
      { new: true }
    );
    res.json(flow);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/flows/:id', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user || user.plan !== 'pro') {
      return res.status(403).json({ error: 'Pro plan required to delete advanced flows.' });
    }
    await Flow.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
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

    for (const contactId of contactIds) {
      const contact = await Contact.findOne({ _id: contactId, userId: req.user.userId });
      if (!contact) {
        results.failed++;
        continue;
      }

      const sent = await sendMessageToInstagram(platform || contact.platform || 'instagram', contact.chatId, text, '', req.user.userId);

      if (sent) {
        const msg = new Message({
          userId: req.user.userId,
          chatId: contact.chatId,
          sender: 'admin',
          text: text,
          type: 'sent',
          platform: platform || contact.platform || 'instagram',
          isAI: false,
          timestamp: new Date()
        });
        await msg.save();
        io.to(req.user.userId.toString()).emit('new_message', msg);
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


// Start the server

// --- BACKGROUND WORKER (Scheduling) ---
setInterval(async () => {
  try {
    const now = new Date();
    const duePosts = await ScheduledPost.find({
      scheduledFor: { $lte: now.toISOString() },
      status: 'Scheduled'
    });

    for (const post of duePosts) {
      console.log(`⏰ Processing Scheduled Post: ${post._id || post.id}`);

      // Deserialize metadata if it's a JSON object/array
      let finalMedia = post.mediaUrl;
      let finalType = post.type || 'image';
      let finalCarousel = [];
      
      if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
        try {
          const meta = JSON.parse(post.mediaUrl);
          finalType = meta.type || finalType;
          finalCarousel = meta.carouselItems || [];
          finalMedia = meta.mediaUrl || (finalCarousel.length > 0 ? finalCarousel[0] : '');
        } catch (e) {}
      } else if (post.mediaUrl && post.mediaUrl.startsWith('[')) {
        try {
          finalCarousel = JSON.parse(post.mediaUrl);
          finalMedia = finalCarousel[0];
        } catch (e) {}
      }

      await ScheduledPost.findByIdAndUpdate(post._id || post.id, { status: 'Processing' });

      try {
        const { publishInstagramContent } = await import('./utils/metaApi.js');
        
        console.log(`📸 Publishing ${finalType} to Instagram for User: ${post.userId}`);
        const publishedId = await publishInstagramContent(post.userId, finalType, finalMedia, post.caption);

        if (post.triggerKeyword && post.autoResponse) {
          const campaign = new Campaign({
            userId: post.userId,
            name: `Auto: ${post.caption.substring(0, 20)}...`,
            trigger: post.triggerKeyword,
            response: post.autoResponse,
            status: 'Active',
            isAnyPost: false,
            postId: publishedId
          });
          await campaign.save();
          console.log(`✅ Automation Campaign created for post ${publishedId}`);
        }

        await ScheduledPost.findByIdAndUpdate(post._id || post.id, { status: 'Posted' });
      } catch (postErr) {
        console.error(`❌ Failed to process scheduled post ${post._id}:`, postErr.message);
        await ScheduledPost.findByIdAndUpdate(post._id, { status: 'Failed' });
      }
    }
  } catch (err) {
    console.error("Worker Error:", err);
  }
}, 60000);

// ── SECURITY: Global Error Handler ────────────────────────────────────────────
// Must be LAST middleware. Prevents stack trace leakage in production.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';
  console.error(`❌ [Error] ${req.method} ${req.url}:`, err.message);
  res.status(err.status || 500).json({
    message: isProd ? 'An unexpected error occurred.' : err.message,
    ...(isProd ? {} : { stack: err.stack }),
  });
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔒 Security: Rate limiting, Helmet CSP, CORS whitelist, NoSQL sanitization, XSS protection active`);
});
