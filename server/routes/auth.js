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
import verifyToken from '../middleware/auth.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const router = express.Router();

// ─── Helpers ────────────────────────────────────────────────────────────────
const signToken = (userId) =>
  jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isStrongPassword = (pw) => pw && pw.length >= 8;

// ─── Signup ──────────────────────────────────────────────────────────────────
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Input validation
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
        // OAuth user — allow setting a password
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

    const welcomeMessage = new Message({
      userId: newUser.id || newUser._id, sender: 'AI Agent',
      text: `Hello ${username}! I am your AI assistant. Let's get started!`,
      type: 'received', chatId: 'ai_bot_support', isAI: true, timestamp: new Date()
    });
    await welcomeMessage.save();

    const token = signToken(newUser._id);
    res.status(201).json({ token, user: { id: newUser._id, username: newUser.username, email: newUser.email, profilePhoto: newUser.profilePhoto } });
  } catch (err) {
    // SECURITY: Never expose internal error messages in production
    console.error('Signup error:', err.message);
    res.status(500).json({ message: 'Signup failed. Please try again.' });
  }
});

// ─── Login ───────────────────────────────────────────────────────────────────
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
    // SECURITY: Same error message for missing user OR wrong password (prevents user enumeration)
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Invalid credentials' });
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

// ─── Google OAuth Login ───────────────────────────────────────────────────────
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
    res.json({ token: jwtToken, user: { id: userId, username: user.username, email: user.email, profilePhoto: user.profilePhoto, plan: user.plan } });
  } catch (err) {
    console.error('Google Auth Error:', err.message);
    res.status(500).json({ 
      message: `Google authentication failed: ${err.message}`,
      error: err.message,
      hint: "Check if 'users' table has 'googleId' and 'profilePhoto' columns."
    });
  }
});

// ─── Custom Google Login ──────────────────────────────────────────────────────
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
    res.json({ token: jwtToken, user: { id: userId, username: user.username, email: user.email, profilePhoto: user.profilePhoto, plan: user.plan } });
  } catch (err) {
    console.error('Custom Google Auth Error:', err.message);
    res.status(500).json({ 
      message: `Google authentication failed: ${err.message}`,
      error: err.message,
      hint: "Check if 'users' table has 'googleId' and 'profilePhoto' columns."
    });
  }
});

// ─── Facebook OAuth Login ─────────────────────────────────────────────────────
router.post('/facebook', async (req, res) => {
  try {
    const { accessToken, userId, mode } = req.body;
    if (!accessToken || !userId) return res.status(400).json({ message: 'Access token and userId are required.' });

    const fbRes = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture`);
    const fbData = await fbRes.json();

    // SECURITY: Verify that the token belongs to the claimed userId
    if (!fbData.id || fbData.id !== userId) {
      return res.status(400).json({ message: 'Invalid Facebook token.' });
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
      } catch (saveErr) {
        // Handle race condition for duplicate email
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
    res.json({ token: jwtToken, user: { id: user._id, username: user.username, email: user.email, profilePhoto: user.profilePhoto, plan: user.plan } });
  } catch (err) {
    console.error('Facebook Auth Error:', err.message);
    res.status(500).json({ message: 'Facebook authentication failed.' });
  }
});

// ─── Update Profile (Protected) ───────────────────────────────────────────────
// SECURITY: Now requires verifyToken — previously anyone could update any user's profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId; // from JWT — not from req.body (prevents spoofing)
    const { username, profilePhoto } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (username) user.username = username.slice(0, 50); // length cap
    if (profilePhoto !== undefined) {
      // SECURITY: Only allow http/https URLs or data URIs for profile photos
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

// ─── Get Profile (Protected) ───────────────────────────────────────────────────
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ id: user._id, username: user.username, email: user.email, profilePhoto: user.profilePhoto, plan: user.plan });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

// ─── Permanent Account Deletion (Protected) ────────────────────────────────────
router.delete('/account', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    console.log(`🗑️ Starting permanent deletion for User: ${userId} (${user.email})`);

    // Define all related models to clean up
    const models = [
      { name: 'Settings', model: Settings },
      { name: 'Campaigns', model: Campaign },
      { name: 'Messages', model: Message },
      { name: 'Contacts', model: Contact },
      { name: 'Flows', model: Flow },
      { name: 'Forms', model: Form },
      { name: 'FormSubmissions', model: FormSubmission },
      { name: 'ChatMessages', model: ChatMessage }
    ];

    // Delete related data first (resiliently)
    for (const item of models) {
      try {
        await item.model.deleteMany({ userId });
        console.log(`✅ Deleted ${item.name} records for user ${userId}`);
      } catch (err) {
        console.warn(`⚠️ Could not delete ${item.name} records:`, err.message);
        // Continue even if one fails (table might not exist)
      }
    }

    // Finally, delete the user record
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

export default router;
