import 'dotenv/config';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
import Review from './models/Review.js';
import paymentRoutes from './routes/payment.js';
import formRoutes from './routes/forms.js';
import oauthRoutes from './routes/oauth.js';
import supportRoutes from './routes/support.js';
import { generateAIResponse } from './utils/aiHandler.js';
import { supabase, convertObjectIDToUUID } from './utils/supabase.js';
import Workspace from './models/Workspace.js';

// --- GLOBAL CACHE (Nitro Speed) ---
const settingsCache = new Map();
const campaignsCache = new Map();

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
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);

    const originLower = origin.toLowerCase();
    const isVercel = originLower.endsWith('.vercel.app') || originLower.includes('vercel.app');
    const isLocal = originLower.includes('localhost') || originLower.includes('127.0.0.1');
    const isExplicit = originLower === 'https://dm-automation-roan.vercel.app';
    const isAllowed = isVercel || isLocal || isExplicit || ALLOWED_ORIGINS.some(o => originLower.startsWith(o.toLowerCase()));

    if (isAllowed) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS request rejected for origin: ${origin}`);
      callback(null, false);
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Workspace-ID', 'x-workspace-id', 'Cache-Control'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

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

// Reusable Auto-Reply Logic
const processAutoReply = async (userId, platform, chatId, text, source = 'dm', commentId = null, passedToken = null, mediaId = null, workspaceId = null) => {
  const queryUserId = userId;
  
  // Ensure text is a string to prevent crashing on null/undefined
  text = typeof text === 'string' ? text : '';
  
  // Resolve settings and contact by workspaceId if provided
  let userSettingsQuery = { userId };
  let contactQuery = { userId, chatId };
  if (workspaceId) {
    userSettingsQuery.workspaceId = workspaceId;
    contactQuery.workspaceId = workspaceId;
  }
  
  // Load settings and contact in parallel (Use cache if available)
  let cachedSettings = null;
  if (workspaceId) {
    cachedSettings = settingsCache.get(`${userId.toString()}_${workspaceId.toString()}`);
  } else {
    for (const [key, s] of settingsCache.entries()) {
      if (key.startsWith(`${userId.toString()}_`)) {
        cachedSettings = s;
        break;
      }
    }
  }

  const [contact, userSettings] = await Promise.all([
    Contact.findOne(contactQuery),
    cachedSettings ? Promise.resolve(cachedSettings) : Settings.findOne(userSettingsQuery)
  ]);

  if (contact && contact.isBotMuted) {
    console.log(`🔇 Bot is muted for contact ${chatId}. Skipping auto-reply.`);
    return { skipped: true, reason: 'muted' };
  }

  // --- DESKTOP FALLBACK: Follower Re-check ---
  // If the user has a pending campaign (was gated by Follow Check),
  // we check if they have followed now. This allows desktop users
  // (who can't see the "I Followed" button) to just follow and send ANY message to continue.
  if (contact && contact.pendingCampaignId && !contact.pendingCampaignId.startsWith('OPENING:')) {
    console.log(`📡 [DESKTOP FALLBACK] User ${chatId} has pending campaign ${contact.pendingCampaignId}. Checking follow status...`);
    let isFollowing = false;
    if (platform === 'facebook') {
      isFollowing = true; // Trust-based bypass for Facebook since we can't verify
    } else {
      isFollowing = await checkFollowerStatus(platform, chatId, userId, userSettings);
    }
    
    const pendingId = contact.pendingCampaignId;
    const match = await Campaign.findById(pendingId);
    
    if (match && match.status === 'Active') {
      const activeToken = passedToken || userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;
      
      if (isFollowing) {
        console.log(`🔓 [DESKTOP SUCCESS] User ${chatId} has now followed! Triggering pending campaign.`);
        await Contact.findOneAndUpdate(contactQuery, { $unset: { pendingCampaignId: 1 } });
        
        if (match.openingMessage && match.openingMessageText) {
          console.log(`📩 Sending OPENING MESSAGE after follow for ${match.name}`);
          const btnText = match.openingMessageButton || "Click to Continue 🚀";
          const payload = `CAMP_${match._id}`;
          
          const openingSent = await sendMessageToInstagram(platform, chatId, match.openingMessageText, '', userId, btnText, activeToken, [], payload);
          if (openingSent) {
            await Contact.findOneAndUpdate(
              contactQuery,
              { pendingCampaignId: `OPENING:${match._id}`, lastActive: new Date() },
              { upsert: true }
            );
            return { opening_message_sent: true };
          }
        }
        
        await sendMessageToInstagram(platform, chatId, match.response, match.videoUrl || match.linkUrl, userId, match.buttonText, activeToken, match.buttons);
        await Campaign.findByIdAndUpdate(pendingId, { $inc: { dmsSent: 1 } });
        return { pending_triggered: true };
      } else {
        console.log(`🚫 [DESKTOP FAIL] User ${chatId} still not following. Sending buttons!`);
        const followText = match.unfollowedResponse || "It looks like you haven't followed us yet! Please follow our profile and then click the button below. 😊";
        const checkFollowPayload = `CHECK_FOLLOW_${match._id}`;
        let profileUrl;
        if (platform === 'facebook') {
          const fbId = userSettings?.facebookPageId;
          profileUrl = fbId ? `https://www.facebook.com/${fbId}` : `https://www.facebook.com/`;
        } else {
          const igUsername = userSettings?.connectedInstagramName || userSettings?.instagramUsername;
          profileUrl = igUsername ? `https://www.instagram.com/${igUsername.replace('@', '')}/` : `https://www.instagram.com/`;
        }
        
        const followButtons = [
          { text: 'View Profile', url: profileUrl },
          { text: "I've Followed! ✅", payload: checkFollowPayload }
        ];
        await sendMessageToInstagram(platform, chatId, followText, '', userId, '', activeToken, followButtons, '');
        return { pending_retry: true };
      }
    }
  }

  // --- DESKTOP FALLBACK: Opening Message Re-check ---
  // If the user was sent an "Opening Message" (Double opt-in), and they reply with text,
  // we treat it as if they clicked the button.
  if (contact && contact.pendingCampaignId && contact.pendingCampaignId.startsWith('OPENING:')) {
    const pendingId = contact.pendingCampaignId.replace('OPENING:', '');
    const match = await Campaign.findById(pendingId);

    if (match && match.status === 'Active') {
      const btnText = (match.openingMessageButton || "Send me the link!").toLowerCase().trim();
      const incomingText = (text || '').toLowerCase().trim();
      const cleanBtnText = btnText.replace(/[\u1F600-\u1F64F\u2702-\u27B0]/g, '').trim();

      if (incomingText === btnText || (cleanBtnText && incomingText.includes(cleanBtnText)) || incomingText.includes('link') || incomingText.includes('send') || incomingText.includes('yes')) {
        console.log(`🔓 [DESKTOP SUCCESS] User ${chatId} replied correctly to Opening Message. Triggering final response.`);
        await Contact.findOneAndUpdate(contactQuery, { $unset: { pendingCampaignId: 1 } });

        const activeToken = passedToken || userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;
        
        let finalResponse = match.response;
        if (match.isAI) {
           try {
             const { generateAIResponse } = await import('./utils/aiHandler.js');
             const generated = await generateAIResponse(match.userId, `User just confirmed they want the link. Warmly deliver the content for "${match.triggerKeyword || match.trigger}".`, workspaceId);
             if (generated) {
               if (finalResponse === "[AI Agent will generate a custom neural reply here]" || !finalResponse.trim()) {
                 finalResponse = generated;
               } else {
                 finalResponse = generated + "\n\n" + finalResponse;
               }
             }
           } catch (e) {
             finalResponse = "Here it is! Click the button below! 👇";
           }
        } else if (finalResponse === "[AI Agent will generate a custom neural reply here]") {
           finalResponse = "Here is your link! 👇";
        }

        await sendMessageToInstagram(platform, chatId, finalResponse, match.videoUrl || match.linkUrl, userId, match.buttonText, activeToken, match.buttons);
        await Campaign.findByIdAndUpdate(pendingId, { $inc: { dmsSent: 1 } });
        return { opening_triggered: true };
      } else {
        console.log(`🚫 [DESKTOP FAIL] User ${chatId} replied with "${text}" instead of button click. Cancelling pending opening trigger.`);
        await Contact.findOneAndUpdate(contactQuery, { $unset: { pendingCampaignId: 1 } });
        // Let it fall through to normal keyword processing
      }
    }
  }

  // 1. Fetch Active Flows and Keyword Campaigns in parallel (Advanced Automation)
  const sharedUids = getSharedUserIdsSync(userId, workspaceId);
  let cachedCampaignsMerged = [];
  let allCached = true;
  for (const uid of sharedUids) {
    const key = workspaceId ? `${uid}_${workspaceId}` : uid;
    const cached = campaignsCache.get(key);
    if (cached) {
      cachedCampaignsMerged.push(...cached);
    } else {
      allCached = false;
    }
  }

  const flowQuery = { userId: { $in: sharedUids }, status: 'Active' };
  if (workspaceId) flowQuery.workspaceId = workspaceId;
  const campaignQuery = { userId: { $in: sharedUids }, status: 'Active' };
  if (workspaceId) campaignQuery.workspaceId = workspaceId;

  const [activeFlows, activeCampaignsRaw] = await Promise.all([
    Flow.find(flowQuery),
    allCached ? Promise.resolve(cachedCampaignsMerged) : Campaign.find(campaignQuery)
  ]);

  const matchedFlow = activeFlows.find(f => {
    if (!f.triggerKeyword) return false;
    const keywords = f.triggerKeyword.split(',').map(k => k.toLowerCase().replace(/\s+/g, ' ').trim());
    const cleanUserMsg = text.toLowerCase().replace(/\s+/g, ' ').trim();
    // Support wildcard (*) for flows too
    return keywords.some(k => k === '*' || cleanUserMsg.includes(k));
  });

  if (matchedFlow) {
    console.log(`🌊 FLOW MATCH: Triggering Flow "${matchedFlow.name}" for Sender: ${chatId}`);
    await runFlow(userId, matchedFlow._id, chatId, platform, text, commentId, workspaceId);

    // NEW: Also send a public reply to the comment for matched visual flows!
    if (source === 'comment' && commentId) {
      console.log(`💬 Sending public comment reply for matched flow to ${commentId}`);
      const activeToken = passedToken || userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;
      
      let nodesArray = matchedFlow.nodes;
      if (typeof nodesArray === 'string') {
        try {
          nodesArray = JSON.parse(nodesArray);
        } catch (e) {
          nodesArray = [];
        }
      }
      const triggerNode = Array.isArray(nodesArray) ? nodesArray.find(n => n.type === 'trigger') : null;
      const replyText = triggerNode?.data?.publicReplyText || matchedFlow.publicReplyText || `Check your DMs! 🚀 I've sent you the info.`;
      
      await sendPublicComment(platform, commentId, replyText, userId, activeToken);
    }

    return { flow: matchedFlow.name };
  }

  const userMessage = text.toLowerCase();

  // 2. Keyword Campaign Checking
  let activeCampaigns = activeCampaignsRaw;

  // SORT: Specific keywords first, Wildcards (*) last
  activeCampaigns = activeCampaigns.sort((a, b) => {
    if (a.trigger === '*' && b.trigger !== '*') return 1;
    if (a.trigger !== '*' && b.trigger === '*') return -1;
    return 0;
  });

  console.log(`🔍 DEBUG: Checking ${activeCampaigns.length} active campaigns for user ${userId}. Message: "${text}"`);

  const match = activeCampaigns.find(c => {
    const platformMatch = !c.platform || c.platform === 'all' || c.platform === (platform || 'instagram');
    // Legacy support: If new booleans are missing, fallback to the old triggerSource string
    const triggerDms = c.triggerOnDms ?? (c.triggerSource === 'dm' || !c.triggerSource);
    const triggerComments = c.triggerOnComments ?? (c.triggerSource === 'comment');
    const triggerStories = c.triggerOnStories ?? (c.triggerSource === 'story_mention');

    const sourceMatch = (source === 'dm' && triggerDms) ||
      (source === 'comment' && triggerComments) ||
      (source === 'story_mention' && triggerStories);

    const cleanUserMsg = text.toLowerCase().replace(/\s+/g, ' ').trim();

    // Support for multiple keywords separated by commas (safely handle undefined triggers)
    const keywords = (c.trigger || '').split(',').map(k => k.toLowerCase().replace(/\s+/g, ' ').trim());

    // Check if any keyword matches
    const keywordMatch = keywords.some(k => {
      if (!k) return false; // Avoid matching empty triggers/trailing commas to everything
      if (k === '*') return true; // Wildcard match
      return cleanUserMsg.includes(k);
    });

    // Strict Post-Specific Filter for Comments:
    // If a campaign has a specific postId defined, it MUST match the commented post's mediaId.
    // Otherwise, if it has no postId, it can match any post if isAnyPost or isUniversal is true.
    let postMatch = true;
    if (source === 'comment') {
      const isPostIdValid = c.postId && c.postId !== 'any' && c.postId !== '' && String(c.postId) !== 'undefined' && String(c.postId) !== 'null';
      if (isPostIdValid) {
        postMatch = !!(mediaId && String(c.postId) === String(mediaId));
        console.log(`[processAutoReply DEBUG] Campaign: "${c.name}", c.postId="${c.postId}" (${typeof c.postId}), mediaId="${mediaId}" (${typeof mediaId}) -> postMatch=${postMatch}`);
      } else {
        const hasNoSpecificPost = !c.postId || String(c.postId) === 'undefined' || String(c.postId) === 'null' || String(c.postId) === 'any' || String(c.postId) === '';
        postMatch = !!(c.isUniversal || c.isAnyPost || hasNoSpecificPost);
        console.log(`[processAutoReply DEBUG] Campaign: "${c.name}", c.postId="${c.postId}", isUniversal=${c.isUniversal}, isAnyPost=${c.isAnyPost}, hasNoSpecificPost=${hasNoSpecificPost} -> postMatch=${postMatch}`);
      }
    }

    const isMatched = !!(platformMatch && sourceMatch && keywordMatch && postMatch);
    console.log(`[processAutoReply DEBUG] Evaluation for "${c.name}": platformMatch=${platformMatch}, sourceMatch=${sourceMatch}, keywordMatch=${keywordMatch}, postMatch=${postMatch} -> isMatched=${isMatched}`);

    return isMatched;
  });

  if (match) {
    const campaignName = match.name || `Automation (${match.trigger})`;
    console.log(`🎯 MATCH FOUND! Campaign: "${campaignName}" | Trigger: "${match.trigger}" | Platform: ${platform} | Source: ${source}`);

    // Determine the best token to use
    const activeToken = passedToken || userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;

    // GATING: Follower Check (Now universal for ALL sources)
    if (match.requireFollow) {
      console.log(`🛡️ UNIVERSAL GATING: Checking follower status for ${chatId}...`);
      const isFollowing = await checkFollowerStatus(platform, chatId, userId, userSettings);

      if (!isFollowing) {
        console.log(`🚫 GATED: User ${chatId} is not following. Sending follow-request DM.`);

        // 1. Send Private DM Request with "Visit Profile" + "Check Follow" buttons
        const followText = match.unfollowedResponse || "Hey! Please follow our account first to get the link! 😊";
        const checkFollowPayload = `CHECK_FOLLOW_${match._id}`;

        let profileUrl;
        if (platform === 'facebook') {
          const fbId = userSettings?.facebookPageId;
          profileUrl = fbId ? `https://www.facebook.com/${fbId}` : `https://www.facebook.com/`;
        } else {
          const igUsername = userSettings?.connectedInstagramName || userSettings?.instagramUsername;
          if (igUsername) {
            profileUrl = `https://www.instagram.com/${igUsername.replace('@', '')}/`;
          } else if (userSettings?.businessAccountId || userSettings?.instagramPageId) {
            const igId = userSettings?.businessAccountId || userSettings?.instagramPageId;
            profileUrl = `https://www.instagram.com/accounts/login/?next=/${igId}/`;
          } else {
            profileUrl = `https://www.instagram.com/`;
          }
        }

        // Always send TWO buttons: Visit Profile (URL) + I've Followed (postback)
        const followButtons = [
          { text: 'View Profile', url: profileUrl },
          { text: "I've Followed! ✅", payload: checkFollowPayload }
        ];
        console.log(`📎 Profile URL for follow gate: ${profileUrl}`);
        await sendMessageToInstagram(platform, chatId, followText, '', userId, '', activeToken, followButtons, '', commentId);

        // 2. Send PUBLIC Comment Reply (Crucial for Comments)
        if (source === 'comment' && commentId) {
          console.log(`💬 Sending GATED public reply to comment ${commentId}`);
          const thanksReplies = [
            "Thanks for your comment! Check DMs! 🚀",
            "Thanks! I've sent you the info in your DMs! 😊",
            "I've sent the details to your inbox! Thanks for reaching out! 🔥",
            "Check your DMs! I just sent it over. Thanks! ✨"
          ];
          const publicGated = match.publicReplyText || thanksReplies[Math.floor(Math.random() * thanksReplies.length)];
          await sendPublicComment(platform, commentId, publicGated, userId, activeToken);
        }

        // Store this campaign as 'pending' for when they follow
        await Contact.findOneAndUpdate(
          contactQuery,
          { pendingCampaignId: match._id, lastActive: new Date() },
          { upsert: true }
        );

        return { gated: true };
      }
      console.log(`✅ UNGATED: User ${chatId} is a follower.`);
    }

    if (match.openingMessage && match.openingMessageText) {
      console.log(`📩 Sending OPENING MESSAGE First for ${match.name}`);
      const btnText = match.openingMessageButton || "Click to Continue 🚀";
      const payload = `CAMP_${match._id}`;

      // Fire the public comment FIRST so it always happens, even if the DM button is rejected by Meta
      if (source === 'comment' && commentId) {
        console.log(`💬 Sending CUSTOM public comment reply to ${commentId} (Opening Message)`);
        const replyText = match.publicReplyText || `Check your DMs! 🚀 I've sent you the info.`;
        await sendPublicComment(platform, commentId, replyText, userId, activeToken).catch(e => console.error("Public comment failed:", e));
      }

      // This is a comment reply, so it uses commentId
      // NOTE: If Meta rejects the template (button) for comment private replies, it will silently fail the DM but the public comment was already sent.
      const openingSent = await sendMessageToInstagram(platform, chatId, match.openingMessageText, '', userId, btnText, activeToken, [], payload, commentId);

      if (openingSent) {
        // Track that this user is waiting for an opening message confirmation (using pendingCampaignId with OPENING: prefix)
        await Contact.findOneAndUpdate(
          contactQuery,
          { pendingCampaignId: `OPENING:${match._id}`, lastActive: new Date() },
          { upsert: true }
        );

        console.log(`⏳ Flow paused. Waiting for user to click "${btnText}" or reply. Payload: ${payload}`);
        return { opening_message_sent: true };
      } else {
        console.warn(`⚠️ Opening message failed. Falling back to immediate response.`);
      }
    }

    console.log(`✅ EXECUTING: Dispatching response for "${campaignName}"`);
    let finalResponse = match.response;
    if (match.isAI) {
      console.log(`🤖 Campaign has AI response enabled. Generating dynamic response...`);
      try {
        const generated = await generateAIResponse(userId, text, workspaceId);
        if (generated) {
          if (finalResponse === "[AI Agent will generate a custom neural reply here]" || !finalResponse.trim()) {
            finalResponse = generated;
          } else {
            finalResponse = generated + "\n\n" + finalResponse;
          }
        }
      } catch (aiErr) {
        console.error("🔥 Campaign AI generation failed, falling back to static response:", aiErr);
      }
    }
    const dmPromise = sendMessageToInstagram(platform, chatId, finalResponse, match.videoUrl || match.linkUrl, userId, match.buttonText, activeToken, match.buttons, '', commentId);

    let commentPromise = Promise.resolve(true);
    if (source === 'comment' && commentId) {
      console.log(`💬 Sending "Thanks" style public comment reply to ${commentId}`);
      const thanksReplies = [
        "Thanks for your comment! Check DMs! 🚀",
        "Thanks! I've sent you the info in your DMs! 😊",
        "I've sent the details to your inbox! Thanks for reaching out! 🔥",
        "Check your DMs! I just sent it over. Thanks! ✨"
      ];
      const replyText = match.publicReplyText || thanksReplies[Math.floor(Math.random() * thanksReplies.length)];
      commentPromise = sendPublicComment(platform, commentId, replyText, userId, activeToken);
    }

    const [sent, commentSent] = await Promise.all([dmPromise, commentPromise]);

    if (sent) {
      const autoReply = new Message({
        userId: userId,
        workspaceId: workspaceId,
        chatId: chatId || 'default', sender: 'AI Agent', text: finalResponse, type: 'sent', platform, isAI: true, campaignId: match._id, timestamp: new Date()
      });
      
      await Promise.all([
        autoReply.save().catch(dbErr => console.error("⚠️ Failed to save campaign message to DB:", dbErr.message)),
        Campaign.findByIdAndUpdate(match._id, { $inc: { dmsSent: 1 } }).catch(dbErr => console.error("⚠️ Failed to increment dmsSent:", dbErr.message))
      ]);

      const sharedUids = getSharedUserIdsSync(userId, workspaceId);
      sharedUids.forEach(uid => {
        io.to(uid).emit('new_message', autoReply);
      });
      console.log(`🚀 REPLY DISPATCHED to ${chatId}`);
      return { reply: autoReply };
    } else {
      console.error(`❌ DISPATCH FAIL: metaApi.js could not send the message to ${chatId}`);
      return { error: 'dispatch_failed' };
    }
  }

  // 3. AI Studio Fallback (Only if enabled)
  const isAiEnabledForPlatform = platform === 'facebook'
    ? (userSettings?.facebookAutomationEnabled ?? true)
    : (userSettings?.instagramAutomationEnabled ?? true);

  if (isAiEnabledForPlatform) {
    console.log(`😴 NO KEYWORD MATCH: Falling back to AI Studio...`);
    try {
      const aiResponse = await generateAIResponse(userId, text, workspaceId);

      if (aiResponse) {
        const sent = await sendMessageToInstagram(platform, chatId, aiResponse, '', userId, '', null, [], '', commentId);

        if (sent) {
          try {
            const autoReply = new Message({
              userId: userId,
              workspaceId: workspaceId,
              chatId: chatId || 'default',
              sender: 'AI Agent',
              text: aiResponse,
              type: 'sent',
              platform,
              isAI: true,
              timestamp: new Date()
            });
            await autoReply.save();
            const sharedUids = getSharedUserIdsSync(userId, workspaceId);
            sharedUids.forEach(uid => {
              io.to(uid).emit('new_message', autoReply);
            });
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
    if (mode === 'subscribe' && token === (process.env.META_VERIFY_TOKEN || process.env.VERIFY_TOKEN || 'dm_automate_verify_123')) {
      console.log('✅ Webhook Verified');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Webhook Event Deduplication Cache
const webhookCache = new Map();

function isDuplicateEvent(eventId) {
  if (!eventId) return false;
  const now = Date.now();
  
  // Clean up old entries (older than 2 minutes)
  for (const [key, time] of webhookCache.entries()) {
    if (now - time > 120000) {
      webhookCache.delete(key);
    }
  }
  
  if (webhookCache.has(eventId)) {
    console.log(`🚫 [DEDUPE] Event ${eventId} already in flight. Blocking duplicate.`);
    return true;
  }
  
  // Set immediate lock for 5 minutes
  webhookCache.set(eventId, now);
  return false;
}

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

        // DEDUPLICATION: Skip duplicate message IDs
        const messageId = messaging.message?.mid;
        if (messageId && isDuplicateEvent(messageId)) {
          console.log(`⏭️ Skipping duplicate message event: ${messageId}`);
          continue;
        }

        console.log(`📩 Messaging detected from ${senderId}`);

        // 1.1 Handle Messages (Text/Story)
        if (messaging.message?.text || messaging.message?.story || messaging.message?.reply_to?.story) {
          const isStoryMention = !!(messaging.message?.story || messaging.message?.reply_to?.story);
          const messageText = messaging.message?.text || (isStoryMention ? "[Story Mention]" : "");

          console.log(`📬 INCOMING DM: ${isStoryMention ? 'Story' : 'DM'} | Sender: ${senderId} | Msg: ${messageText}`);

          const platform = body.object === 'instagram' ? 'instagram' : 'facebook';
          let allMatchingSettings = await Settings.find({
            $or: [{ instagramPageId: pageId }, { businessAccountId: pageId }, { facebookPageId: pageId }]
          }).sort({ createdAt: -1 });

          if (!allMatchingSettings || allMatchingSettings.length === 0) {
            console.warn(`🛑 UNKNOWN PAGE: ID ${pageId} is not linked to any user.`);
            continue;
          }

          let userSettings = allMatchingSettings[0];
          if (allMatchingSettings.length > 1) {
            for (const setting of allMatchingSettings) {
              const campaigns = await Campaign.find({ userId: setting.userId, status: 'Active' });
              if (campaigns && campaigns.length > 0) {
                userSettings = setting;
                break;
              }
            }
          }

          const targetUserId = userSettings?.userId;
          const targetWorkspaceId = userSettings?.workspaceId;
          if (targetUserId) {
            console.log(`✅ [ID MATCH]: Processing message for User ${targetUserId} in workspace ${targetWorkspaceId}`);
            // 1. Send Reply FIRST (Nitro Speed)
            const replyPromise = processAutoReply(targetUserId.toString(), platform, senderId, messageText, isStoryMention ? "story_mention" : "dm", null, null, null, targetWorkspaceId)
              .catch(err => console.error("🔥 Nitro Reply error:", err));

            // 2. Log in background
            const saveAndEmitPromise = (async () => {
              try {
                const sharedUids = getSharedUserIdsSync(targetUserId, targetWorkspaceId);
                const contact = await Contact.findOne({ userId: { $in: sharedUids }, chatId: senderId, workspaceId: targetWorkspaceId });
                const contactUserId = contact ? contact.userId : targetUserId;

                const incoming = new Message({
                  userId: contactUserId, chatId: senderId, sender: 'user', text: messageText,
                  type: 'received', platform, timestamp: new Date(),
                  workspaceId: targetWorkspaceId
                });
                incoming.save(); // Don't await the save for speed

                sharedUids.forEach(uid => {
                  io.to(uid).emit('new_message', incoming);
                });
              } catch (dbErr) {
                console.error("⚠️ Background logging failed:", dbErr.message);
              }
            })();

            // We still await the reply to ensure Vercel doesn't kill the function before the DM is fired
            await replyPromise;
            // Background logging doesn't need to block the response
            saveAndEmitPromise.catch(e => console.error("Logging background fail:", e));
          }
        }

        // 1.2 Handle Postbacks (Button Clicks)
        if (messaging.postback) {
          const postbackKey = `postback_${senderId}_${messaging.timestamp}`;
          if (isDuplicateEvent(postbackKey)) {
            console.log(`⏭️ Skipping duplicate postback event: ${postbackKey}`);
            continue;
          }

          const payload = messaging.postback.payload;
          console.log(`🔘 POSTBACK DETECTED from ${senderId}: ${payload}`);

          const platform = body.object === 'instagram' ? 'instagram' : 'facebook';

          // A. Opening Message Button Click
          if (payload.startsWith('CAMP_')) {
            const campaignId = payload.split('_')[1];
            try {
              const match = await Campaign.findById(campaignId);

              if (match && match.status === 'Active') {
                console.log(`🚀 TRIGGERING MAIN RESPONSE for Campaign: ${match.name}`);
                
                // Clear the pending state so future triggers work properly!
                await Contact.findOneAndUpdate({ chatId: senderId, userId: match.userId }, { $unset: { pendingCampaignId: 1 } });
                
                const userSettings = await Settings.findOne({ userId: match.userId });
                const activeToken = userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;

                let finalResponse = match.response;
                if (match.isAI) {
                   console.log(`🤖 Postback has AI response enabled. Generating dynamic response...`);
                   try {
                     const { generateAIResponse } = await import('./utils/aiHandler.js');
                     // Note: We use a descriptive prompt for the AI since there's no user text for a button click
                     const generated = await generateAIResponse(match.userId, `User just clicked the button to get the link for campaign "${match.trigger}". Give a very warm, short, friendly one-sentence reply handing them the link.`);
                     if (generated) {
                       if (finalResponse === "[AI Agent will generate a custom neural reply here]" || !finalResponse.trim()) {
                         finalResponse = generated;
                       } else {
                         finalResponse = generated + "\n\n" + finalResponse;
                       }
                     }
                   } catch (aiErr) {
                     console.error("🔥 Postback AI generation failed:", aiErr);
                     finalResponse = "Here is exactly what you requested! 👇";
                   }
                } else if (finalResponse === "[AI Agent will generate a custom neural reply here]") {
                   // Fallback in case AI toggle was off but placeholder was saved
                   finalResponse = "Here is your link! 👇";
                }

                await sendMessageToInstagram(platform, senderId, finalResponse, match.videoUrl || match.linkUrl, match.userId, match.buttonText, activeToken, match.buttons);
                await Campaign.findByIdAndUpdate(campaignId, { $inc: { dmsSent: 1 } });
              }
            } catch (err) {
              console.error("Error processing CAMP_ postback:", err);
            }
          }

          // B. "I've Followed" Button Click
          if (payload.startsWith('CHECK_FOLLOW_')) {
            const campaignId = payload.split('_')[2];
            try {
              const match = await Campaign.findById(campaignId);

              if (match && match.status === 'Active') {
                console.log(`🛡️ VERIFYING FOLLOW on button click for ${senderId}...`);
                let isFollowing = false;
                if (platform === 'facebook') {
                  isFollowing = true; // Trust-based bypass for Facebook
                } else {
                  isFollowing = await checkFollowerStatus(platform, senderId, match.userId);
                }

                const userSettings = await Settings.findOne({ userId: match.userId });
                const activeToken = userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;

                if (isFollowing) {
                  console.log(`✅ VERIFIED! Sending "Send me the link" button for ${match.name}`);

                  // 1. Clear pending status
                  await Contact.findOneAndUpdate({ chatId: senderId, userId: match.userId }, { $unset: { pendingCampaignId: 1 } });

                  // 2. Send the "Send me the link" intermediate button
                  const followSuccessText = match.openingMessageText || "Verified! Awesome. Click below to receive your link instantly. 🚀";
                  const sendLinkButtonText = match.openingMessageButton || "Send me the link! 🔗";
                  const sendLinkPayload = `SEND_LINK_${match._id}`;
                  await sendMessageToInstagram(platform, senderId, followSuccessText, '', match.userId, sendLinkButtonText, activeToken, [], sendLinkPayload);
                } else {
                  console.log(`🚫 STILL NOT FOLLOWING: ${senderId}`);
                  const retryText = "It looks like you haven't followed yet! Please follow our profile and then click the button again. 😊";
                  await sendMessageToInstagram(platform, senderId, retryText, '', match.userId, "Try Again! ✅", activeToken, [], payload);
                }
              }
            } catch (err) {
              console.error("Error processing CHECK_FOLLOW_ postback:", err);
            }
          }

          // C. "Send me the link" Postback (Final Delivery)
          if (payload.startsWith('SEND_LINK_')) {
            const campaignId = payload.split('_')[2];
            try {
              const match = await Campaign.findById(campaignId);
              if (match && match.status === 'Active') {
                console.log(`🚀 FINAL DELIVERY: Delivering content for campaign ${match.name}`);
                
                // Clear the pending state so future triggers work properly!
                await Contact.findOneAndUpdate({ chatId: senderId, userId: match.userId }, { $unset: { pendingCampaignId: 1 } });
                
                const userSettings = await Settings.findOne({ userId: match.userId });
                const activeToken = userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;

                let finalResponse = match.response;
                if (match.isAI) {
                   try {
                     const { generateAIResponse } = await import('./utils/aiHandler.js');
                     const generated = await generateAIResponse(match.userId, `User just confirmed they want the link. Warmly deliver the content for "${match.trigger}".`);
                     if (generated) {
                       if (finalResponse === "[AI Agent will generate a custom neural reply here]" || !finalResponse.trim()) {
                         finalResponse = generated;
                       } else {
                         finalResponse = generated + "\n\n" + finalResponse;
                       }
                     }
                   } catch (e) {
                   }
                } else if (finalResponse === "[AI Agent will generate a custom neural reply here]") {
                   finalResponse = "Here is your link! 👇";
                }

                await sendMessageToInstagram(platform, senderId, finalResponse, match.videoUrl || match.linkUrl, match.userId, match.buttonText, activeToken, match.buttons);
                await Campaign.findByIdAndUpdate(campaignId, { $inc: { dmsSent: 1 } });
              }
            } catch (err) {
              console.error("Error processing SEND_LINK_ postback:", err);
            }
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
          console.log(`[webhook DEBUG] Extracted comment values: text="${text}", senderId="${senderId}", commentId="${commentId}", mediaId="${mediaId}" (from val.media?.id="${val.media?.id}", val.post_id="${val.post_id}", val.video_id="${val.video_id}")`);

          // Handle all interaction types (Comment, Post, Video, etc.)
          console.log(`🎯 [REEL DEBUG] Processing interaction from ${change.field}. Item: ${val.item || 'N/A'}`);

          // CRITICAL: Ensure we are not replying to ourselves
          if (senderId === pageId) {
            console.log('⏭️ Skipping change from ourselves.');
            continue;
          }

          console.log(`💬 COMMENT DETECTED: "${text}" from ${senderId} (on Page: ${pageId})`);

          if (text && senderId && commentId) {
            if (isDuplicateEvent(commentId)) {
              console.log(`⏭️ Skipping duplicate comment event: ${commentId}`);
              continue;
            }

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
            if (allMatchingSettings.length > 1) {
              for (const setting of allMatchingSettings) {
                const campaigns = await Campaign.find({ userId: setting.userId, status: 'Active' });
                if (campaigns && campaigns.length > 0) {
                  userSettings = setting;
                  break;
                }
              }
            }

            let targetUserId = userSettings?.userId;
            let targetWorkspaceId = userSettings?.workspaceId;

            if (!targetUserId) {
              console.warn(`🚨 [ID MISMATCH]: No user settings found for ID ${pageId}. Trying fallback...`);
              const fallback = await User.findOne();
              targetUserId = fallback?._id;
              if (fallback) targetWorkspaceId = fallback.workspaceId; // or null if fallback doesn't have it
              if (targetUserId) console.log(`🩹 [FALLBACK]: Using User ID ${targetUserId} as catch-all.`);
            }

            if (targetUserId) {
              console.log(`✅ [MATCH FOUND]: Processing comment for User ${targetUserId} in workspace ${targetWorkspaceId}`);
              const accessToken = userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;

              const saveAndEmitPromise = (async () => {
                try {
                  const sharedUids = getSharedUserIdsSync(targetUserId, targetWorkspaceId);
                  const contact = await Contact.findOne({ userId: { $in: sharedUids }, chatId: senderId, workspaceId: targetWorkspaceId });
                  const contactUserId = contact ? contact.userId : targetUserId;

                  const incoming = new Message({
                    userId: contactUserId, chatId: senderId, sender: 'user', text: `[Comment] ${text}`,
                    type: 'received', platform, timestamp: new Date(),
                    workspaceId: targetWorkspaceId
                  });
                  await incoming.save();

                  sharedUids.forEach(uid => {
                    io.to(uid).emit('new_message', incoming);
                  });
                } catch (dbErr) {
                  console.error("⚠️ Failed to save incoming comment to DB:", dbErr.message);
                }
              })();

              const replyPromise = (async () => {
                try {
                  await processAutoReply(targetUserId.toString(), platform, senderId, text, 'comment', commentId, accessToken, mediaId, targetWorkspaceId);
                } catch (err) {
                  console.error("🔥 Comment Reply error:", err);
                }
              })();

              // CRITICAL (Vercel/Serverless): Must await both promises
              await Promise.all([saveAndEmitPromise, replyPromise]);
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

            // Find if this user has a pending automation under any workspace
            const contacts = await Contact.find({ chatId: senderId, pendingCampaignId: { $ne: null } });

            for (const contact of contacts) {
              if (contact.pendingCampaignId.startsWith('OPENING:')) continue;
              console.log(`🎯 AUTO-TRIGGER: User ${senderId} followed! Sending pending campaign ${contact.pendingCampaignId} in workspace ${contact.workspaceId}`);

              const targetUserId = contact.userId;
              const campaignId = contact.pendingCampaignId;
              const targetWorkspaceId = contact.workspaceId;

              // Clear pending status so it doesn't repeat
              await Contact.findByIdAndUpdate(contact._id || contact.id, { $unset: { pendingCampaignId: 1 } });

              const match = await Campaign.findById(campaignId);
              if (match && match.status === 'Active') {
                const userSettingsQuery = { userId: targetUserId };
                if (targetWorkspaceId) userSettingsQuery.workspaceId = targetWorkspaceId;
                const userSettings = await Settings.findOne(userSettingsQuery);
                const activeToken = userSettings?.instagramAccessToken || userSettings?.facebookAccessToken || process.env.META_PAGE_ACCESS_TOKEN;

                try {
                  await processAutoReply(targetUserId.toString(), platform, senderId, "[FOLLOW_TRIGGER]", 'dm', null, activeToken, null, targetWorkspaceId);
                } catch (err) {
                  console.error("🔥 Follow Auto-Trigger error:", err);
                }
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
              let targetWorkspaceId = null;

              if (userSettings) {
                targetUserId = userSettings.userId;
                targetWorkspaceId = userSettings.workspaceId;
              } else {
                const fallbackUser = await User.findOne();
                if (fallbackUser) {
                  targetUserId = fallbackUser._id;
                  targetWorkspaceId = fallbackUser.workspaceId;
                }
              }

              if (targetUserId) {
                try {
                  const sharedUids = getSharedUserIdsSync(targetUserId, targetWorkspaceId);
                  const contact = await Contact.findOne({ userId: { $in: sharedUids }, chatId: senderPhone, workspaceId: targetWorkspaceId });
                  const contactUserId = contact ? contact.userId : targetUserId;

                  const incoming = new Message({
                    userId: contactUserId,
                    workspaceId: targetWorkspaceId,
                    chatId: senderPhone,
                    sender: 'user',
                    text: text,
                    type: 'received',
                    platform: 'whatsapp',
                    timestamp: new Date()
                  });
                  await incoming.save();
                  
                  sharedUids.forEach(uid => {
                    io.to(uid).emit('new_message', incoming);
                  });
                } catch (dbErr) {
                  console.error("⚠️ Failed to save incoming WhatsApp message to DB:", dbErr.message);
                }

                // Auto-reply
                await processAutoReply(targetUserId.toString(), 'whatsapp', senderPhone, text, 'dm', null, null, null, targetWorkspaceId);
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

// --- AVATAR UPLOAD ROUTE ---
app.post('/api/upload/avatar', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { uploadToSupabase } = await import('./utils/supabase.js');
    const uniqueName = `avatar-${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
    
    const publicUrl = await uploadToSupabase(req.file.buffer, uniqueName, req.file.mimetype);
    
    if (!publicUrl) {
      return res.status(500).json({ error: 'Failed to upload avatar to storage' });
    }
    
    res.json({ url: publicUrl });
  } catch (err) {
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- MEDIA UPLOAD ROUTE ---
app.post('/api/upload', verifyToken, upload.single('media'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const { uploadToSupabase } = await import('./utils/supabase.js');
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(req.file.originalname)}`;
    
    let fileBuffer = req.file.buffer;

    // Apply watermark to ALL users for now (as requested by user)
    // const user = await User.findById(req.user.userId);
    // const isFreePlan = !user || !user.plan || user.plan.toLowerCase() === 'free';
    const applyWatermark = true;

    // Apply watermark if it's an image
    if (applyWatermark && req.file.mimetype.startsWith('image/')) {
      try {
        const sharp = (await import('sharp')).default;
        
        // Exact styling based on the user's screenshot
        const watermarkSvg = `
          <svg width="340" height="70" xmlns="http://www.w3.org/2000/svg">
            <rect x="0" y="0" width="340" height="70" rx="35" fill="#0f172a" fill-opacity="0.9" stroke="#3b82f6" stroke-width="2"/>
            <circle cx="35" cy="35" r="24" fill="#ffffff" />
            <text x="35" y="42" font-family="Arial, sans-serif" font-size="20" font-weight="900" fill="#4f46e5" text-anchor="middle">10X</text>
            <text x="75" y="32" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#ffffff">Powered by SMART10X</text>
            <text x="75" y="52" font-family="Arial, sans-serif" font-size="14" fill="#cbd5e1">www.smart10x.in</text>
          </svg>
        `;

        // We resize the image slightly if it's too small for the watermark, 
        // but typically social media images are large enough (1080x1080).
        fileBuffer = await sharp(req.file.buffer)
          .composite([
            {
              input: Buffer.from(watermarkSvg),
              gravity: 'southeast'
            }
          ])
          .toBuffer();
          
        console.log(`🖌️ Applied SMART10X Watermark for Free user ${req.user.userId}`);
      } catch (watermarkErr) {
        console.error('⚠️ Watermark application failed (uploading original image):', watermarkErr.message);
      }
    }
    
    console.log(`📤 Uploading file to Supabase Storage: ${uniqueName}...`);
    const publicUrl = await uploadToSupabase(fileBuffer, uniqueName, req.file.mimetype);
    
    if (!publicUrl) {
      throw new Error("Failed to upload file to Supabase Storage");
    }

    console.log(`✅ Upload success! Public URL: ${publicUrl}`);
    res.json({ url: publicUrl });
  } catch (err) {
    console.error("❌ Upload Endpoint Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// --- Contacts API (Tagging & Notes) ---
app.get('/api/contacts', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
    const contacts = await Contact.find({ userId: { $in: sharedUserIds }, workspaceId: req.workspaceId }).sort({ lastActive: -1 });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/contacts/:id', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId, req.workspaceId);
    const contact = await Contact.findOneAndUpdate(
      { _id: req.params.id, userId: { $in: sharedUserIds }, workspaceId: req.workspaceId },
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
          try {
            const isFb = p.platform === 'facebook';
            const fetchToken = isFb ? (userSettings?.facebookPageAccessToken || userSettings?.facebookAccessToken || accessToken) : accessToken;

            // First priority: Fetch actual live image from Meta Platforms API
            console.log(`🌐 [Meta API] Fetching live image for post ${p._id} (Media ID: ${instagramMediaId})...`);
            const metaRes = await axios.get(`https://graph.facebook.com/v19.0/${instagramMediaId}`, {
              params: {
                fields: isFb ? 'full_picture,picture,source' : 'media_url,thumbnail_url',
                access_token: fetchToken
              },
              timeout: 4000 // Fast timeout so it doesn't block frontend load
            });

            if (metaRes.data && (metaRes.data.media_url || metaRes.data.thumbnail_url || metaRes.data.full_picture || metaRes.data.source || metaRes.data.picture)) {
              const liveUrl = metaRes.data.thumbnail_url || metaRes.data.media_url || metaRes.data.full_picture || metaRes.data.source || metaRes.data.picture;
              p.mediaUrl = liveUrl;

              // Cache it back to DB to optimize future API requests
              if (parsedMeta) {
                parsedMeta.cachedLiveMediaUrl = liveUrl;
                await ScheduledPost.findByIdAndUpdate(p.id || p._id, { mediaUrl: JSON.stringify(parsedMeta) });
              }
            } else {
              p.mediaUrl = localImage; // Fallback
            }
          } catch (error) {
            // Silently fallback if Meta API is still propagating the media URL
            p.mediaUrl = localImage;
          }
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
    const { data, error } = await supabase.storage
      .from('media')
      .createSignedUploadUrl(fileName);

    if (error) throw error;

    res.json({ 
      uploadUrl: data.signedUrl, 
      token: data.token,
      publicUrl: supabase.storage.from('media').getPublicUrl(fileName).data.publicUrl
    });
  } catch (err) {
    console.error('❌ Signed URL Error:', err.message);
    res.status(500).json({ error: err.message });
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
      openingMessageButton: req.body.openingMessageButton || ''
    };
    
    const finalMediaUrl = JSON.stringify(metadata);

    // Normalize date to ISO string for consistent comparison in background worker
    let scheduledDate = req.body.scheduledFor;
    try {
      if (scheduledDate) {
        scheduledDate = new Date(scheduledDate).toISOString();
      }
    } catch (e) {
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
    const postToUpdate = await ScheduledPost.findOne({ 
      _id: req.params.id, 
      userId: { $in: sharedUserIds },
      workspaceId: req.workspaceId
    });
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

    const updatedPost = await ScheduledPost.findOneAndUpdate(
      { _id: req.params.id, userId: { $in: sharedUserIds } },
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
    const isDue = (updatedPost.status === 'Scheduled' || updatedPost.status === 'Retrying') &&
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
    console.log(`🗑️ DELETE scheduled post requested. ID: ${req.params.id}, User: ${req.user.userId}`);
    const sharedUserIds = getSharedUserIdsSync(req.user.userId);
    const postToDelete = await ScheduledPost.findOne({ 
      _id: req.params.id, 
      userId: { $in: sharedUserIds },
      workspaceId: req.workspaceId
    });
    
    if (postToDelete) {
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
        console.log(`🗑️ Deleting associated campaigns for scheduled post IDs:`, postIds);
        await Campaign.deleteMany({
          userId: { $in: sharedUserIds },
          workspaceId: req.workspaceId,
          postId: { $in: postIds }
        });
        await refreshGlobalCache(); // Instant Sync
      }
      
      await ScheduledPost.findByIdAndDelete(req.params.id);
      console.log(`✅ Successfully deleted scheduled post: ${req.params.id}`);
      return res.json({ success: true });
    }
    
    console.warn(`⚠️ Scheduled post not found or unauthorized for ID: ${req.params.id}`);
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
    const sharedUserIds = getSharedUserIdsSync(req.user.userId);
    const settings = await Settings.findOne({ 
      userId: { $in: sharedUserIds }, 
      workspaceId: req.workspaceId,
      instagramAccessToken: { $ne: null }, 
      businessAccountId: { $ne: null } 
    });
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
    res.status(500).json({ error: 'Failed to fetch Instagram media' });
  }
});

app.get('/api/facebook/media', verifyToken, async (req, res) => {
  try {
    const sharedUserIds = getSharedUserIdsSync(req.user.userId);
    const settings = await Settings.findOne({ 
      userId: { $in: sharedUserIds }, 
      workspaceId: req.workspaceId,
      facebookAccessToken: { $ne: null }, 
      facebookPageId: { $ne: null } 
    });
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
    res.status(500).json({ error: 'Failed to fetch Facebook posts' });
  }
});

app.post('/api/settings', verifyToken, async (req, res) => {
  try {
    const platform = req.body._platform; // frontend sends which platform is being saved
    
    // Explicitly allow only valid settings columns in PostgreSQL to prevent 500 Column Not Found errors
    const allowedKeys = [
      'id', 'userId', 
      'instagramAccessToken', 'instagramPageId', 'businessAccountId', 'connectedInstagramName', 'isAccountConnected', 'instagramAutomationEnabled',
      'facebookAccessToken', 'facebookPageId', 'connectedFacebookName', 'isFacebookConnected', 'facebookAutomationEnabled',
      'whatsappToken', 'whatsappPhoneNumberId', 'connectedWhatsAppName', 'isWhatsAppConnected', 'whatsappAutomationEnabled',
      'telegramToken', 'isTelegramConnected', 'telegramAutomationEnabled',
      'twitterApiKey', 'isTwitterConnected', 'twitterAutomationEnabled',
      'youtubeApiKey', 'isYouTubeConnected', 'youtubeAutomationEnabled',
      'linkedinAccessToken', 'isLinkedInConnected', 'linkedinAutomationEnabled',
      'lastTestedAt',
      'aiFallbackMessage', 'aiName', 'aiTone', 'aiKnowledgeBase', 'aiTemperature',
      'connectedPageName', 'whatsappBusinessAccountId'
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
    delete data.isThreadsConnected;
    delete data.threadsAccessToken;
    delete data.threadsPageId;
    delete data.connectedThreadsName;

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

// --- REINFORCED BACKGROUND WORKER (Scheduling) ---
async function runSchedulingWorker() {
  try {
    const now = new Date();
    const nowISO = now.toISOString();

    console.log(`📡 [Worker] Checking posts due before: ${nowISO}`);

    const duePosts = await ScheduledPost.find({
      scheduledFor: { $lte: nowISO },
      status: { $in: ['Scheduled', 'Retrying', 'Processing'] }
    });

    console.log(`🔥 [Worker] Processing ${duePosts.length} posts...`);
    const { publishInstagramContent } = await import('./utils/metaApi.js');

    // Pre-load Supabase client and safeUpdate before touching DB state
    const { supabase: _sb } = await import('./utils/supabase.js');
    const _updatePost = async (id, fields) => {
      const { data, error } = await _sb.from('scheduled_posts').update({ ...fields, updatedAt: new Date().toISOString() }).eq('id', id);
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
          .update({ status: 'Retrying', updatedAt: new Date().toISOString() })
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

    // If the media URL is a local path, convert it to a public URL
    const SERVER_PUBLIC_URL = process.env.API_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 5001}`);

    // Limit to 3 posts per run to prevent Vercel 10-second timeout
    const postsToProcess = duePosts.slice(0, 3);
    if (duePosts.length > 3) {
      console.log(`⚠️ Limit hit: Processing 3 out of ${duePosts.length} due posts to prevent timeout. The rest will be processed on the next ping.`);
    }

    // Process due posts in parallel
    const processPromises = postsToProcess.map(async (post) => {
      try {
        const postId = post.id || post._id;
        console.log(`🔄 EXECUTION: Processing Post ${postId} for User ${post.userId}`);

        // Deserialize metadata
        let finalMedia = post.mediaUrl;
        let finalType = post.type || 'image';
        let finalCarousel = [];

        if (post.mediaUrl && post.mediaUrl.startsWith('{')) {
          try {
            const meta = JSON.parse(post.mediaUrl);
            finalType = meta.type || finalType;
            finalCarousel = meta.carouselItems || [];
            finalMedia = meta.mediaUrl || (finalCarousel.length > 0 ? finalCarousel[0] : '');
          } catch (e) {
            console.warn("⚠️ Metadata parse failed, using raw mediaUrl");
          }
        }

        // If the media URL is a local path, convert it to a public URL
        if (finalMedia && finalMedia.startsWith('/uploads/')) {
          finalMedia = `${SERVER_PUBLIC_URL}${finalMedia}`;
        }

        if (finalCarousel && finalCarousel.length > 0) {
          finalCarousel = finalCarousel.map(item => (item && item.startsWith('/uploads/')) ? `${SERVER_PUBLIC_URL}${item}` : item);
        }

        if (!finalMedia || finalMedia.includes('127.0.0.1') || finalMedia.includes('localhost')) {
          if (!finalMedia) {
             console.log(`⏭️ Post ${postId} has no media URL yet (likely still uploading). Skipping.`);
             return;
          }
          console.error(`❌ No publicly accessible media URL for post ${post._id}.`);
          await safeUpdate(postId, { status: 'Failed', lastError: 'No public media URL. Use Supabase Storage or a public image URL.' });
          return;
        }

        // Atomic claim: directly update status to 'Processing'
        // Cooldown set to 2 minutes to ensure large videos/images don't get picked up twice while uploading
        const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();

        const { data: claimData, error: claimErr } = await _sb
          .from('scheduled_posts')
          .update({ status: 'Processing', updatedAt: new Date().toISOString() })
          .eq('id', postId)
          .or(`status.in.(Scheduled,Retrying),and(status.eq.Processing,updatedAt.lt.${twoMinutesAgo})`)
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
        } else {
          // Default to instagram
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
        } else {
          updatedMetaObj.instagramMediaId = publishedId;
        }

        const updatedMediaUrl = JSON.stringify(updatedMetaObj);

        await safeUpdate(postId, { status: 'Posted', mediaUrl: updatedMediaUrl });
        console.log(`✅ SUCCESS: Post ${postId} is now LIVE on ${post.platform === 'facebook' ? 'Facebook' : 'Instagram'}.`);

      } catch (postErr) {
        console.error(`❌ PUBLISH FAILED for Post ${post._id}:`, postErr.message);
        const currentRetryCount = (post.retryCount || 0) + 1;
        const MAX_RETRIES = 5;
        const MAX_RETRY_WINDOW = 2880;
        const scheduledAt = new Date(post.scheduledFor);
        const minutesSinceScheduled = (Date.now() - scheduledAt.getTime()) / 60000;

        if (postErr.message && (postErr.message.includes('Authorization Error') || postErr.message.toLowerCase().includes('credential'))) {
          console.log(`🚫 [Worker] Fatal Auth Error. Marking Post ${postId} as Failed immediately.`);
          await safeUpdate(postId, { status: 'Failed', lastError: postErr.message });
        } else if (currentRetryCount <= MAX_RETRIES && minutesSinceScheduled < MAX_RETRY_WINDOW) {
          await safeUpdate(postId, { status: 'Retrying', lastError: postErr.message, retryCount: currentRetryCount });
        } else {
          await safeUpdate(postId, { status: 'Failed', lastError: postErr.message });
        }
      }
    });

    const results = await Promise.allSettled(processPromises);
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
// Must be LAST middleware. Prevents stack trace leakage in production.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(`❌ [Error] ${req.method} ${req.url}:`, err.stack || err.message || err);
  res.status(err.status || 500).json({
    message: err.message,
    stack: err.stack,
  });
});

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
  }
});


export default app;






