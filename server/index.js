import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

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

import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import Campaign from './models/Campaign.js';
import Message from './models/Message.js';
import Settings from './models/Settings.js';
import User from './models/User.js';
import Contact from './models/Contact.js';
import Flow from './models/Flow.js';
import { runFlow } from './utils/FlowRunner.js';
import { sendMessageToInstagram, sendWhatsAppMessage, sendPrivateReply } from './utils/metaApi.js';
import authRoutes from './routes/auth.js';
import ChatMessage from './models/ChatMessage.js';
import paymentRoutes from './routes/payment.js';
import formRoutes from './routes/forms.js';
import oauthRoutes from './routes/oauth.js';
import { generateAIResponse } from './utils/aiHandler.js';
// --- MULTER SETUP (Media Uploads) ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage, limits: { fileSize: 50 * 1024 * 1024 } }); // 50MB limit
import verifyToken from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
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

app.use(helmet());
app.use(compression());
app.use(morgan('combined'));
// Request Logging for debugging CORS
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toISOString()}] ${req.method} ${req.url} - Origin: ${req.headers.origin || 'No Origin'}`);
  next();
});

app.use(cors({
  origin: (origin, callback) => {
    // Permit all local origins and all Vercel subdomains dynamically to resolve CORS Blocked:Origin
    if (!origin) return callback(null, true);
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('vercel.app')) {
      return callback(null, origin);
    }
    callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ status: 'ok', domain: req.hostname, timestamp: new Date() }));
app.get('/api/ping', (req, res) => res.send('pong'));

// (Messaging helpers moved to utils/metaApi.js for cleaner architecture)

const checkFollowerStatus = async (platform, chatId, userId) => {
  if (platform !== 'instagram') return true; // Follow check currently only for Instagram
  
  try {
    const userSettings = await Settings.findOne({ userId });
    if (!userSettings || !userSettings.instagramAccessToken || !userSettings.businessAccountId) {
      console.log("⚠️ Missing credentials for follow check. Defaulting to true.");
      return true;
    }

    // Standard way to check if User A follows Business B (requires manageable insights or specific permissions)
    // For now, we attempt a quick fetch of the user's relationship or public following status
    // Note: This endpoint is illustrative and depends on the App's approved permissions
    const res = await axios.get(`https://graph.facebook.com/v19.0/${userSettings.businessAccountId}/followers?user_id=${chatId}&access_token=${userSettings.instagramAccessToken}`);
    
    // If the API returns the user, they follow. If not, it might error or return empty data.
    return res.data && res.data.data && res.data.data.length > 0;
  } catch (err) {
    console.warn("🔍 Follower check failed or restricted:", err.message);
    // FALLBACK: In a real-world SaaS, if we can't verify (e.g. private account), 
    // we often default to 'false' to encourage the follow, or 'true' to avoid blocking the user.
    // For this implementation, we return false to trigger the 'Please Follow' prompt.
    return false; 
  }
};

// Reusable Auto-Reply Logic
const processAutoReply = async (userId, platform, chatId, text, source = 'dm', commentId = null) => {
  // Human Handover Check
  const contact = await Contact.findOne({ userId, chatId });
  if (contact && contact.isBotMuted) {
    console.log(`🔇 Bot is muted for contact ${chatId}. Skipping auto-reply.`);
    return { skipped: true, reason: 'muted' };
  }

  // 1. Check for Active Flows first (Advanced Automation)
  const activeFlows = await Flow.find({ userId, status: 'Active' });
  
  const matchedFlow = activeFlows.find(f => {
    if (!f.triggerKeyword) return false;
    const keywords = f.triggerKeyword.split(',').map(k => k.trim().toLowerCase());
    return keywords.some(k => text.toLowerCase().includes(k));
  });
  
  if (matchedFlow) {
    console.log(`🌊 Triggering Flow: ${matchedFlow.name} for ${chatId}`);
    await runFlow(userId, matchedFlow._id, chatId, platform, text, commentId);
    return { flow: matchedFlow.name };
  }

  const userMessage = text.toLowerCase();
  
  // 2. Keyword Campaign Checking
  const activeCampaigns = await Campaign.find({ userId, status: 'Active' });
  const match = activeCampaigns.find(c => {
    const platformMatch = c.platform === 'all' || c.platform === (platform || 'instagram');
    const sourceMatch = (c.triggerSource || 'dm') === source;
    return platformMatch && sourceMatch && userMessage.includes(c.trigger.toLowerCase());
  });

  if (match) {
    if (match.requireFollow) {
      const isFollowing = await checkFollowerStatus(platform, chatId, userId);
      if (!isFollowing) {
        const followText = match.unfollowedResponse || "Please follow our account first to unlock this automation!";
        await sendMessageToInstagram(platform, chatId, followText, '', userId);
        
        const followPrompt = new Message({
          userId: new mongoose.Types.ObjectId(userId),
          chatId: chatId || 'default', sender: 'AI Agent', text: followText, type: 'sent', platform, isAI: true, timestamp: new Date()
        });
        await followPrompt.save();
        io.to(userId.toString()).emit('new_message', followPrompt);
        return { reply: followPrompt, gated: true };
      }
    }

    if (source === 'comment' && commentId) {
      await sendPrivateReply(platform, commentId, match.response, userId);
    } else {
      await sendMessageToInstagram(platform, chatId, match.response, match.videoUrl || match.linkUrl, userId);
    }

    const autoReply = new Message({
      userId: new mongoose.Types.ObjectId(userId),
      chatId: chatId || 'default', sender: 'AI Agent', text: match.response, type: 'sent', platform, videoUrl: match.videoUrl || '', linkUrl: match.linkUrl || '', isAI: true, campaignId: match._id, timestamp: new Date()
    });
    await autoReply.save();
    io.to(userId.toString()).emit('new_message', autoReply);
    return { reply: autoReply };
  } 

  // 2. Dynamic OpenAI Fallback
  const fallbackText = await generateAIResponse(userId, text);
    
  const fallbackReply = new Message({
    userId: new mongoose.Types.ObjectId(userId),
    chatId: chatId || 'default', sender: 'AI Agent', text: fallbackText, type: 'sent', platform, isAI: true, timestamp: new Date()
  });
  await fallbackReply.save();
  
  io.to(userId.toString()).emit('new_message', fallbackReply.toObject());
  
  if (chatId !== 'ai_bot_support') {
    if (source === 'comment' && commentId) {
      await sendPrivateReply(platform, commentId, fallbackText, userId);
    } else {
      await sendMessageToInstagram(platform, chatId, fallbackText, '', userId);
    }
  }
  
  return { reply: fallbackReply, fallback: true };
};

let lastDbError = null;

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Fail after 5 seconds if no connection
    });
    console.log('✅ Connected to MongoDB');
    lastDbError = null;
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    lastDbError = err.message;
  }
};

// Start connection
connectDB();

// Health Check Endpoint
app.get('/health', (req, res) => {
  const readyState = mongoose.connection.readyState;
  const states = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };
  
  res.status(200).json({ 
    status: 'OK', 
    database: states[readyState] || 'Unknown',
    db_error: lastDbError,
    mongodb_uri_exists: !!process.env.MONGODB_URI,
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

  if (body.object === 'instagram' || body.object === 'page') {
    for (const entry of body.entry) {
      const pageId = entry.id; // The Page/Instagram ID that received the message
      
      for (const messaging of entry.messaging) {
        const senderId = messaging.sender.id;
        const text = messaging.message?.text;
        
          if (text || messaging.message?.story) {
            const isStoryMention = !!messaging.message?.story;
            const messageText = text || (isStoryMention ? "[Story Mention]" : "");
            
            console.log(`📬 Received ${isStoryMention ? 'Story Mention' : 'Message'} on Page ${pageId} from ${senderId}: ${messageText}`);
            
            // Find the user who connected this Page ID in their Settings
            const platform = body.object === 'instagram' ? 'instagram' : 'facebook';
            let userSettings;
            
            if (platform === 'instagram') {
              userSettings = await Settings.findOne({ 
                $or: [{ instagramPageId: pageId }, { businessAccountId: pageId }]
              });
            } else {
              userSettings = await Settings.findOne({ facebookPageId: pageId });
            }
            
            let targetUserId;
            if (userSettings) {
              targetUserId = userSettings.userId;
              console.log(`✅ Matched Page ${pageId} to User ${targetUserId}`);
            } else {
              // Fallback: find first user (for testing/single-user setups)
              const fallbackUser = await User.findOne();
              if (fallbackUser) {
                targetUserId = fallbackUser._id;
                console.warn(`⚠️ No Settings match for Page ${pageId}, using fallback user ${targetUserId}`);
              }
            }
            
            if (targetUserId) {
              // 1. Save incoming message to DB
              const incoming = new Message({
                userId: targetUserId,
                chatId: senderId,
                sender: 'user',
                text: messageText,
                type: 'received',
                platform: platform,
                timestamp: new Date()
              });
              await incoming.save();
              io.to(targetUserId.toString()).emit('new_message', incoming);

              // 2. Trigger Auto-Reply (with userId so it uses correct token)
              // If it's a story mention, we pass "story_mention" as source. 
              // We use messageText as the "text" to match triggers, but story mentions might match "*" or specific keywords if they also sent text.
              await processAutoReply(targetUserId.toString(), platform, senderId, messageText, isStoryMention ? "story_mention" : "dm");
            }
          }

        // --- Handle Comments (Feed/Feed Changes) ---
        const changes = entry.changes || [];
        for (const change of changes) {
          if (change.field === 'feed' || change.field === 'comments') {
            const val = change.value;
            const text = val.text || val.message;
            const senderId = val.from?.id;
            const commentId = val.id || val.comment_id;

            if (text && senderId && commentId && senderId !== pageId) {
              console.log(`💬 Received Comment on Page ${pageId} from ${senderId}: ${text}`);
              
              const platform = body.object === 'instagram' ? 'instagram' : 'facebook';
              let userSettings;
              if (platform === 'instagram') {
                userSettings = await Settings.findOne({ $or: [{ instagramPageId: pageId }, { businessAccountId: pageId }] });
              } else {
                userSettings = await Settings.findOne({ facebookPageId: pageId });
              }

              let targetUserId = userSettings?.userId || (await User.findOne())?._id;

              if (targetUserId) {
                // Save comment as a "received" message item for history
                const incoming = new Message({
                  userId: targetUserId, chatId: senderId, sender: 'user', text: `[Comment] ${text}`,
                  type: 'received', platform: platform, timestamp: new Date()
                });
                await incoming.save();
                io.to(targetUserId.toString()).emit('new_message', incoming);

                // Process Comment-to-DM Trigger
                await processAutoReply(targetUserId.toString(), platform, senderId, text, 'comment', commentId);
              }
            }
          }
        }
      }
    }
    res.status(200).send('EVENT_RECEIVED');
  
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
    
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:5000';
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

const PORT = process.env.PORT || 5000;

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

    const campaignMatch = { userId: new mongoose.Types.ObjectId(req.user.userId) };
    const messageMatch = { userId: new mongoose.Types.ObjectId(req.user.userId) };
    
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
      userId: new mongoose.Types.ObjectId(req.user.userId) 
    }).sort({ createdAt: -1 });
    res.json(campaigns);
  } catch (err) {
    console.error("❌ Error fetching campaigns:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/campaigns', verifyToken, async (req, res) => {
  try {
    const newCampaign = new Campaign({ 
      ...req.body, 
      userId: new mongoose.Types.ObjectId(req.user.userId) 
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
    const { status } = req.body;
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, userId: new mongoose.Types.ObjectId(req.user.userId) },
      { status },
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
      userId: new mongoose.Types.ObjectId(req.user.userId) 
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
    
    // Check for Free Plan Limit (30 Unique Contacts)
    const userProfile = await User.findById(req.user.userId);
    if (userProfile && userProfile.plan === 'free') {
      const existingMessage = await Message.findOne({ userId: req.user.userId, chatId: chatId || 'default' });
      
      // If this is a message to a NEW contact
      if (!existingMessage) {
        const uniqueContacts = await Message.distinct('chatId', { userId: req.user.userId });
        if (uniqueContacts.length >= 30) {
          return res.status(403).json({ 
            error: 'Contact limit reached.', 
            message: 'You have reached the 30-contact limit on the Free plan. Please Upgrade to Pro for unlimited contacts.' 
          });
        }
      }
    }
    
    // Explicitly casting userId to ObjectId to ensure it saves correctly
    const newMessage = new Message({
      userId: new mongoose.Types.ObjectId(req.user.userId),
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
    let settings = await Settings.findOne({ userId: req.user.userId });
    if (!settings) {
      settings = new Settings({ userId: req.user.userId });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
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

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

