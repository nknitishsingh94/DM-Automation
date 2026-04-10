import 'dotenv/config';
import express from 'express';
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

// Helper to check if a user is following the account (Real API placeholder)
const checkFollowerStatus = async (platform, chatId) => {
  // TODO: Implement actual Meta Graph API calls here
  // For now, we simulate a 'not following' state if message contains 'NOT_FOLLOWING' for testing
  return true; 
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
    socket.join(userId);
    console.log(`👤 User ${userId} joined their private room`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected');
  });
});


app.use('/api/auth', authRoutes);
app.use('/api/payment', paymentRoutes);

const PORT = process.env.PORT || 5000;

// Dashboard Stats Endpoint
app.get('/api/stats', verifyToken, async (req, res) => {
  try {
    const totalDMs = await Campaign.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(req.user.id) } },
      { $group: { _id: null, total: { $sum: "$dmsSent" } } }
    ]);
    const campaignsCount = await Campaign.countDocuments({ userId: req.user.id });
    const messagesCount = await Message.countDocuments({ userId: req.user.id });
    
    const sentMessages = await Message.countDocuments({ userId: req.user.id, type: 'sent' });
    const receivedMessages = await Message.countDocuments({ userId: req.user.id, type: 'received' });
    const aiSentMessages = await Message.countDocuments({ userId: req.user.id, type: 'sent', isAI: true });
    
    // Fetch unique contacts and user plan
    const uniqueContacts = await Message.distinct('chatId', { userId: req.user.id });
    const userProfile = await User.findById(req.user.id);

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
  const campaigns = await Campaign.find({ userId: req.user.id }).sort({ createdAt: -1 });
  res.json(campaigns);
});

app.post('/api/campaigns', verifyToken, async (req, res) => {
  try {
    const newCampaign = new Campaign({ ...req.body, userId: req.user.id });
    await newCampaign.save();
    res.json(newCampaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/campaigns/:id', verifyToken, async (req, res) => {
  try {
    const { status } = req.body;
    const campaign = await Campaign.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { status },
      { new: true }
    );
    res.json(campaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/campaigns/:id', verifyToken, async (req, res) => {
  try {
    await Campaign.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
    res.json({ message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Campaign Logs Endpoint
app.get('/api/campaigns/:id/logs', verifyToken, async (req, res) => {
  try {
    const logs = await Message.find({ 
      userId: req.user.id, 
      campaignId: req.params.id 
    }).sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Messages API (Inbox)
app.get('/api/messages', verifyToken, async (req, res) => {
  const messages = await Message.find({ userId: req.user.id }).sort({ timestamp: 1 });
  res.json(messages);
});

app.post('/api/messages', verifyToken, async (req, res) => {
  try {
    const { sender, text, type, chatId, platform } = req.body;
    
    // Check for Free Plan Limit (30 Unique Contacts)
    const userProfile = await User.findById(req.user.id);
    if (userProfile && userProfile.plan === 'free') {
      const existingMessage = await Message.findOne({ userId: req.user.id, chatId: chatId || 'default' });
      
      // If this is a message to a NEW contact
      if (!existingMessage) {
        const uniqueContacts = await Message.distinct('chatId', { userId: req.user.id });
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
      userId: new mongoose.Types.ObjectId(req.user.id),
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
    io.to(req.user.id).emit('new_message', newMessage);

    // AI Auto-Reply Logic
    if (sender === 'user') {
      const activeCampaigns = await Campaign.find({ userId: req.user.id, status: 'Active' });
      const userMessage = text.toLowerCase();
      
      const match = activeCampaigns.find(c => {
        const platformMatch = c.platform === 'all' || c.platform === (platform || 'instagram');
        return platformMatch && userMessage.includes(c.trigger.toLowerCase());
      });

      if (match) {
        // --- Follower Check Gating ---
        if (match.requireFollow) {
          const isFollowing = await checkFollowerStatus(newMessage.platform, chatId);
          if (!isFollowing) {
            const followPrompt = new Message({
              userId: new mongoose.Types.ObjectId(req.user.id),
              chatId: chatId || 'default',
              sender: 'AI Agent',
              text: match.unfollowedResponse || "Please follow our account first to unlock this automation!",
              type: 'sent',
              platform: newMessage.platform,
              isAI: true,
              timestamp: new Date()
            });
            await followPrompt.save();
            io.to(req.user.id).emit('new_message', followPrompt);
            return res.json({ original: newMessage, reply: followPrompt, gated: true });
          }
        }
        // -----------------------------

        const autoReply = new Message({
          userId: new mongoose.Types.ObjectId(req.user.id),
          chatId: chatId || 'default',
          sender: 'AI Agent',
          text: match.response,
          type: 'sent',
          platform: newMessage.platform,
          videoUrl: match.videoUrl || '',
          linkUrl: match.linkUrl || '',
          isAI: true,
          campaignId: match._id,
          timestamp: new Date()
        });
        await autoReply.save();
        console.log("🤖 AI Reply saved:", autoReply._id);
        
        // Emit AI reply via Socket.io to the specific user's room
        io.to(req.user.id).emit('new_message', autoReply);
        
        return res.json({ original: newMessage, reply: autoReply });
      } else {
        // Default AI Fallback Response
        const defaultReply = new Message({
          userId: new mongoose.Types.ObjectId(req.user.id),
          chatId: chatId || 'default',
          sender: 'AI Agent',
          text: "Thanks for reaching out! Our team will get back to you shortly.",
          type: 'sent',
          platform: newMessage.platform,
          isAI: true,
          timestamp: new Date()
        });
        await defaultReply.save();
        console.log("🤖 Default Fallback AI Reply saved:", defaultReply._id);
        
        io.to(req.user.id).emit('new_message', defaultReply);
        
        return res.json({ original: newMessage, reply: defaultReply });
      }
    }

    res.json(newMessage);

  } catch (err) {
    console.error("❌ Error saving message:", err.message);
    res.status(500).json({ error: "DB Save Error: " + err.message });
  }
});

app.delete('/api/messages/:id', verifyToken, async (req, res) => {
  try {
    await Message.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
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

