import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import { createServer } from 'http';
import { Server } from 'socket.io';

import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import Campaign from './models/Campaign.js';
import Message from './models/Message.js';
import Settings from './models/Settings.js';
import User from './models/User.js';
import authRoutes from './routes/auth.js';
import paymentRoutes from './routes/payment.js';
import verifyToken from './middleware/auth.js';

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
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5000',
      'https://dm-automation-roan.vercel.app',
      'https://dm-automation-server.onrender.com'
    ];
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
      callback(null, true);
    } else {
      console.warn(`⚠️ [CORS] Origin ${origin} not explicitly allowed, but allowing for debugging`);
      callback(null, true); // Still allow during debugging, but log it
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());

// Meta Graph API Helper: Send Message
const sendMessageToInstagram = async (platform, recipientId, text, mediaUrl = '') => {
  const accessToken = process.env.META_PAGE_ACCESS_TOKEN;
  if (!accessToken) {
    console.warn("⚠️ META_PAGE_ACCESS_TOKEN not set. Skipping real API call.");
    return false;
  }

  try {
    const url = `https://graph.facebook.com/v19.0/me/messages?access_token=${accessToken}`;
    const payload = {
      recipient: { id: recipientId },
      messaging_type: "RESPONSE",
      message: { text }
    };

    // If media is provided, we can handle it here (Meta requires different structure for media)
    // For now, attaching link/video info to the text if present
    if (mediaUrl) {
      payload.message.text += `\n\nCheck this out: ${mediaUrl}`;
    }

    const response = await axios.post(url, payload);
    console.log("✅ Message sent to Meta API:", response.data);
    return true;
  } catch (err) {
    console.error("❌ Meta API Error:", err.response?.data || err.message);
    return false;
  }
};

const checkFollowerStatus = async (platform, chatId) => {
  // TODO: Once you have the Business ID, implement the real check here
  return true; 
};

// Reusable Auto-Reply Logic
const processAutoReply = async (userId, platform, chatId, text) => {
  const userMessage = text.toLowerCase();
  const activeCampaigns = await Campaign.find({ userId, status: 'Active' });
  
  const match = activeCampaigns.find(c => {
    const platformMatch = c.platform === 'all' || c.platform === (platform || 'instagram');
    return platformMatch && userMessage.includes(c.trigger.toLowerCase());
  });

  if (match) {
    // --- Follower Check Gating ---
    if (match.requireFollow) {
      const isFollowing = await checkFollowerStatus(platform, chatId);
      if (!isFollowing) {
        const followText = match.unfollowedResponse || "Please follow our account first to unlock this automation!";
        await sendMessageToInstagram(platform, chatId, followText);
        
        const followPrompt = new Message({
          userId: new mongoose.Types.ObjectId(userId),
          chatId: chatId || 'default',
          sender: 'AI Agent',
          text: followText,
          type: 'sent',
          platform: platform,
          isAI: true,
          timestamp: new Date()
        });
        await followPrompt.save();
        io.to(userId.toString()).emit('new_message', followPrompt);
        return { reply: followPrompt, gated: true };
      }
    }

    // --- Send Real Message ---
    await sendMessageToInstagram(platform, chatId, match.response, match.videoUrl || match.linkUrl);

    const autoReply = new Message({
      userId: new mongoose.Types.ObjectId(userId),
      chatId: chatId || 'default',
      sender: 'AI Agent',
      text: match.response,
      type: 'sent',
      platform: platform,
      videoUrl: match.videoUrl || '',
      linkUrl: match.linkUrl || '',
      isAI: true,
      campaignId: match._id,
      timestamp: new Date()
    });
    await autoReply.save();
    io.to(userId.toString()).emit('new_message', autoReply);
    return { reply: autoReply };
  }
  return null;
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
      for (const messaging of entry.messaging) {
        const senderId = messaging.sender.id;
        const text = messaging.message?.text;
        
        if (text) {
          console.log(`📬 Received Message from ${senderId}: ${text}`);
          
          // Find the user associated with this Page (For multi-tenancy)
          // For now, we assume the first user or a specific user for testing
          // In a real app, you'd find user by Meta Page ID
          const someUser = await User.findOne(); 
          if (someUser) {
            // 1. Save incoming message to DB
            const incoming = new Message({
              userId: someUser._id,
              chatId: senderId,
              sender: 'user',
              text: text,
              type: 'received',
              platform: body.object === 'instagram' ? 'instagram' : 'facebook',
              timestamp: new Date()
            });
            await incoming.save();
            io.to(someUser._id.toString()).emit('new_message', incoming);

            // 2. Trigger Auto-Reply
            await processAutoReply(someUser._id.toString(), incoming.platform, senderId, text);
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

const PORT = process.env.PORT || 5000;

// Dashboard Stats Endpoint
app.get('/api/stats', verifyToken, async (req, res) => {
  try {
    const totalDMs = await Campaign.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.userId) } },
      { $group: { _id: null, total: { $sum: "$dmsSent" } } }
    ]);
    const campaignsCount = await Campaign.countDocuments({ userId: req.user.userId });
    const messagesCount = await Message.countDocuments({ userId: req.user.userId });
    
    const sentMessages = await Message.countDocuments({ userId: req.user.userId, type: 'sent' });
    const receivedMessages = await Message.countDocuments({ userId: req.user.userId, type: 'received' });
    const aiSentMessages = await Message.countDocuments({ userId: req.user.userId, type: 'sent', isAI: true });
    
    // Fetch unique contacts and user plan
    const uniqueContacts = await Message.distinct('chatId', { userId: req.user.userId });
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

    // Emit new message via Socket.io to the specific user's room
    io.to(req.user.userId).emit('new_message', newMessage);

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
    let settings = await Settings.findOne({ userId: req.user.id });
    if (!settings) {
      settings = new Settings({ userId: req.user.id });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/settings', verifyToken, async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: req.user.id },
      { ...req.body, updatedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

