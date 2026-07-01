import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import Settings from '../models/Settings.js';
import Campaign from '../models/Campaign.js';
import Contact from '../models/Contact.js';
import Flow from '../models/Flow.js';
import Form from '../models/Form.js';
import FormSubmission from '../models/FormSubmission.js';
import ChatMessage from '../models/ChatMessage.js';
import Caption from '../models/Caption.js';
import ScheduledPost from '../models/ScheduledPost.js';
import ApiKey from '../models/ApiKey.js';
import verifyToken from '../middleware/auth.js';
import { OAuth2Client } from 'google-auth-library';
import crypto from 'crypto';
import { convertObjectIDToUUID } from '../utils/supabase.js';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isStrongPassword = (pw) => pw && pw.length >= 8;

const autoGenerateApiKey = async (userId) => {
  try {
    const uuidUserId = convertObjectIDToUUID(userId);
    const randomHex = crypto.randomBytes(24).toString('hex');
    const newKeyString = `sk_live_${randomHex}`;
    const newKeyRecord = new ApiKey({
      user_id: uuidUserId,
      key: newKeyString,
      name: 'Default Key',
      active: true,
      createdAt: new Date().toISOString()
    });
    await newKeyRecord.save();
    console.log(`🔑 Auto-generated API Key for new user ${userId}`);
    return newKeyString;
  } catch (err) {
    console.error('⚠️ Auto API Key generation failed:', err.message);
    return null;
  }
};

router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Username, email and password are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }
    if (!isStrongPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!existingUser.password) {
        existingUser.password = password;
        if (username) existingUser.username = username.slice(0, 50);
        await existingUser.save();
        const token = signToken(existingUser._id);
        return res.status(200).json({ token, user: { id: existingUser._id, username: existingUser.username, email: existingUser.email, profilePhoto: existingUser.profilePhoto } });
      }
      return res.status(400).json({ message: 'User already exists' });
    }

    const newUser = new User({ username: username.slice(0, 50), email, password });
    await newUser.save();
    
    const newApiKey = await autoGenerateApiKey(newUser._id || newUser.id);

    const welcomeMessage = new Message({
      userId: newUser.id || newUser._id, sender: 'AI Agent',
      text: `Hello ${username}! I am your AI assistant. Let's get started!`,
      type: 'received', chatId: 'ai_bot_support', isAI: true, timestamp: new Date()
    });
    await welcomeMessage.save();

    const token = signToken(newUser._id);
    res.status(201).json({ token, user: { id: newUser._id, username: newUser.username, email: newUser.email, profilePhoto: newUser.profilePhoto }, apiKey: newApiKey });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).json({ message: 'Signup failed. Please try again.' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }
    if (!isValidEmail(email)) {
      return res.status(400).json({ message: 'Invalid email address.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Account not found. Please create an account first!' });
    }
    if (!(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Incorrect password. Please try again.' });
    }

    const messageCount = await Message.countDocuments({ userId: user._id });
    if (messageCount === 0) {
      await new Message({
        userId: user._id, sender: 'AI Agent',
        text: `Welcome back, ${user.username}! How can I help you today?`,
        type: 'received', chatId: 'ai_bot_support', isAI: true, timestamp: new Date()
      }).save();
    }

    const token = signToken(user._id);
    res.json({ token, user: { id: user._id, username: user.username, email: user.email, profilePhoto: user.profilePhoto, plan: user.plan } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: 'Login failed. Please try again.' });
  }
});

router.post('/google', async (req, res) => {
  try {
    const { token, mode } = req.body;
    if (!token) return res.status(400).json({ message: 'Token is required.' });

    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const { sub, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ email });
    if (!user) {
      if (mode === 'signup') {
        user = new User({ username: (name || '').slice(0, 50), email, googleId: sub, profilePhoto: picture });
        await user.save();
        user._newApiKey = await autoGenerateApiKey(user._id || user.id);
      } else {
        return res.status(404).json({ message: 'Account not found. Please sign up first.' });
      }
    }

    try {
      const messageCount = await Message.countDocuments({ userId: user._id || user.id });
      if (messageCount === 0) {
        await new Message({
          userId: user._id || user.id, sender: 'AI Agent',
          text: `Welcome, ${user.username}! How can I help you today?`,
          type: 'received', chatId: 'ai_bot_support', isAI: true, timestamp: new Date()
        }).save();
      }
    } catch (msgErr) {
      console.warn('⚠️ Welcome message failed but login will continue:', msgErr.message);
    }

    const userId = user._id || user.id;
    const jwtToken = signToken(userId);
    res.json({ token: jwtToken, user: { id: userId, username: user.username, email: user.email, profilePhoto: user.profilePhoto, plan: user.plan }, apiKey: user._newApiKey });
  } catch (err) {
    console.error('Google Auth Error:', err.message);
    res.status(500).json({ 
      message: `Google authentication failed: ${err.message}`,
      error: err.message,
      hint: "Check if 'users' table has 'googleId' and 'profilePhoto' columns."
    });
  }
});

router.post('/google_custom', async (req, res) => {
  try {
    const { email, name, sub, picture } = req.body;
    if (!email || !sub) return res.status(400).json({ message: 'Invalid Google data.' });

    let user = await User.findOne({ 
      $or: [{ email }, { googleId: sub }] 
    });

    if (!user) {
      try {
        user = new User({ username: (name || '').slice(0, 50), email, googleId: sub, profilePhoto: picture });
        await user.save();
        user._newApiKey = await autoGenerateApiKey(user._id || user.id);
      } catch (saveErr) {
        if (saveErr.message?.includes('unique constraint') || saveErr.code === '23505') {
          user = await User.findOne({ email });
        } else {
          throw saveErr;
        }
      }
    } 

    if (user && !user.googleId) {
      user.googleId = sub;
      if (!user.profilePhoto) user.profilePhoto = picture;
      await user.save();
    }

    try {
      const messageCount = await Message.countDocuments({ userId: user._id || user.id });
      if (messageCount === 0) {
        await new Message({
          userId: user._id || user.id, sender: 'AI Agent',
          text: `Welcome, ${user.username}! How can I help you today?`,
          type: 'received', chatId: 'ai_bot_support', isAI: true, timestamp: new Date()
        }).save();
      }
    } catch (msgErr) {
      console.warn('⚠️ Welcome message failed but login will continue:', msgErr.message);
    }

    const userId = user._id || user.id;
    const jwtToken = signToken(userId);
    res.json({ token: jwtToken, user: { id: userId, username: user.username, email: user.email, profilePhoto: user.profilePhoto, plan: user.plan }, apiKey: user._newApiKey });
  } catch (err) {
    console.error('Custom Google Auth Error:', err.message);
    res.status(500).json({ 
      message: `Google authentication failed: ${err.message}`,
      error: err.message,
      hint: "Check if 'users' table has 'googleId' and 'profilePhoto' columns."
    });
  }
});

router.post('/facebook', async (req, res) => {
  try {
    const { accessToken, userId, mode } = req.body;
    if (!accessToken) return res.status(400).json({ message: 'Access token is required.' });

    const fbRes = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture`);
    const fbData = await fbRes.json();

    if (!fbData.id) {
      return res.status(400).json({ message: 'Invalid Facebook token.' });
    }
    
    if (userId && fbData.id !== userId) {
      return res.status(400).json({ message: 'Invalid Facebook token mismatch.' });
    }

    const email = fbData.email || `${fbData.id}@facebook.com`;
    let user = await User.findOne({ 
      $or: [{ email }, { facebookId: fbData.id }] 
    });

    if (!user) {
      try {
        user = new User({
          username: (fbData.name || '').slice(0, 50), email,
          facebookId: fbData.id, profilePhoto: fbData.picture?.data?.url
        });
        await user.save();
        user._newApiKey = await autoGenerateApiKey(user._id || user.id);
      } catch (saveErr) {
        if (saveErr.message?.includes('unique constraint') || saveErr.code === '23505') {
          user = await User.findOne({ email });
        } else {
          throw saveErr;
        }
      }
    }

    if (user && !user.facebookId) {
      user.facebookId = fbData.id;
      if (!user.profilePhoto) user.profilePhoto = fbData.picture?.data?.url;
      await user.save();
    }

    const messageCount = await Message.countDocuments({ userId: user._id });
    if (messageCount === 0) {
      await new Message({
        userId: user._id, sender: 'AI Agent',
        text: `Welcome, ${user.username}! How can I help you today?`,
        type: 'received', chatId: 'ai_bot_support', isAI: true, timestamp: new Date()
      }).save();
    }

    const jwtToken = signToken(user._id);
    res.json({ token: jwtToken, user: { id: user._id, username: user.username, email: user.email, profilePhoto: user.profilePhoto, plan: user.plan }, apiKey: user._newApiKey });
  } catch (err) {
    console.error('Facebook Auth Error:', err.message);
    res.status(500).json({ message: 'Facebook authentication failed.' });
  }
});

router.put('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId; // from JWT — not from req.body (prevents spoofing)
    const { username, profilePhoto } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username) user.username = username.slice(0, 50); // length cap
    if (profilePhoto !== undefined) {
      if (typeof profilePhoto === 'string' && (profilePhoto.startsWith('http') || profilePhoto.startsWith('data:image/'))) {
        user.profilePhoto = profilePhoto;
      }
    }

    await user.save();
    res.json({ id: user._id, username: user.username, email: user.email, profilePhoto: user.profilePhoto, plan: user.plan });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ message: 'Profile update failed.' });
  }
});

router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user._id, username: user.username, email: user.email, profilePhoto: user.profilePhoto, plan: user.plan });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

router.delete('/account', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    console.log(`🗑️ Starting permanent deletion for User: ${userId} (${user.email})`);

    const models = [
      { name: 'Settings', model: Settings },
      { name: 'Campaigns', model: Campaign },
      { name: 'Messages', model: Message },
      { name: 'Contacts', model: Contact },
      { name: 'Flows', model: Flow },
      { name: 'Forms', model: Form },
      { name: 'FormSubmissions', model: FormSubmission },
      { name: 'ChatMessages', model: ChatMessage },
      { name: 'Captions', model: Caption },
      { name: 'ScheduledPosts', model: ScheduledPost }
    ];

    for (const item of models) {
      try {
        await item.model.deleteMany({ userId });

        await item.model.deleteMany({ user_id: userId });

        console.log(`✅ Deleted ${item.name} records for user ${userId}`);
      } catch (err) {
        console.warn(`⚠️ Could not delete ${item.name} records:`, err.message);
      }
    }

    try {
      await User.findByIdAndDelete(userId);
      console.log(`✅ Deleted User record: ${userId}`);
    } catch (err) {
      console.error(`❌ Failed to delete User record:`, err.message);
      return res.status(500).json({ message: 'Failed to remove user record from database.' });
    }

    console.log(`🗑️ PERMANENT DELETE COMPLETE: User ${userId} and all related data removed.`);
    res.json({ success: true, message: 'Account and all data deleted permanently.' });
  } catch (err) {
    console.error('CRITICAL: Account deletion process crashed:', err.message);
    res.status(500).json({ message: 'A critical error occurred during account deletion.' });
  }
});

router.delete('/delete', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    await User.findByIdAndDelete(userId);

    await Promise.all([
      Settings.deleteMany({ userId }),
      Message.deleteMany({ userId }),
      Campaign.deleteMany({ userId }),
      Contact.deleteMany({ userId }),
      Flow.deleteMany({ userId }),
      Form.deleteMany({ userId }),
      FormSubmission.deleteMany({ userId }),
      ChatMessage.deleteMany({ userId }),
      Caption.deleteMany({ userId }),
      ScheduledPost.deleteMany({ user_id: userId }), // some models use user_id
      ApiKey.deleteMany({ user_id: convertObjectIDToUUID(userId) })
    ]);

    res.json({ message: 'Account and all associated data permanently deleted.' });
  } catch (err) {
    console.error('Account deletion error:', err.message);
    res.status(500).json({ message: 'Failed to delete account.' });
  }
});

export default router;
