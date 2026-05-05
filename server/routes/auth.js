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

// Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      if (!existingUser.password) {
        // OAuth user doesn't have a password set yet - allow them to set a password
        existingUser.password = password;
        if (username) existingUser.username = username;
        await existingUser.save();
        
        const token = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '30d' });
        return res.status(200).json({ token, user: { id: existingUser._id, username: existingUser.username, email: existingUser.email, profilePhoto: existingUser.profilePhoto } });
      }
      return res.status(400).json({ message: 'User already exists' });
    }
    
    const newUser = new User({ username, email, password });
    await newUser.save();

    // Create Initial "Welcome" message from AI Agent
    const welcomeMessage = new Message({
      userId: newUser._id,
      sender: "AI Agent",
      text: `Hello ${username}! I am your AI assistant. I will help you automate your Instagram DMs and manage your campaigns. Let's get started!`,
      type: "received",
      chatId: "ai_bot_support",
      isAI: true,
      timestamp: new Date()
    });
    await welcomeMessage.save();
    
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '30d' });
    res.status(201).json({ token, user: { id: newUser._id, username: newUser.username, email: newUser.email, profilePhoto: newUser.profilePhoto } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '30d' });

    // Ensure welcome message exists for the user
    const messageCount = await Message.countDocuments({ userId: user._id });
    if (messageCount === 0) {
      const welcomeMessage = new Message({
        userId: user._id,
        sender: "AI Agent",
        text: `Welcome back, ${user.username}! I am your AI assistant. How can I help you today?`,
        type: "received",
        chatId: "ai_bot_support",
        isAI: true,
        timestamp: new Date()
      });
      await welcomeMessage.save();
    }

    res.json({ token, user: { id: user._id, username: user.username, email: user.email, profilePhoto: user.profilePhoto, plan: user.plan } });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Google Login Route
router.post('/google', async (req, res) => {
  try {
    const { token, mode } = req.body;
    
    // ... verification logic ...
    const ticket = await googleClient.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const { sub, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ email });
    
    if (!user) {
      if (mode === 'signup') {
        user = new User({
          username: name,
          email,
          googleId: sub,
          profilePhoto: picture
        });
        await user.save();
      } else {
        return res.status(404).json({ message: "Account not found. Please sign up first." });
      }
    }

    // Ensure welcome message exists for the user
    const messageCount = await Message.countDocuments({ userId: user._id });
    if (messageCount === 0) {
      const welcomeMessage = new Message({
        userId: user._id,
        sender: "AI Agent",
        text: `Welcome, ${user.username}! I am your AI assistant. How can I help you today?`,
        type: "received",
        chatId: "ai_bot_support",
        isAI: true,
        timestamp: new Date()
      });
      await welcomeMessage.save();
    }

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '30d' });
    res.json({ token: jwtToken, user: { id: user._id, username: user.username, email: user.email, profilePhoto: user.profilePhoto, plan: user.plan } });
  } catch (err) {
    console.error("❌ Google Auth Error:", err.message);
    res.status(500).json({ message: "Google Auth Failed: " + err.message });
  }
});

// Custom Google Login (from access_token flow)
router.post('/google_custom', async (req, res) => {
  try {
    const { email, name, sub, picture } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        username: name,
        email,
        googleId: sub,
        profilePhoto: picture
      });
      await user.save();
    } else if (!user.googleId) {
      user.googleId = sub;
      if (!user.profilePhoto) user.profilePhoto = picture;
      await user.save();
    }

    // Ensure welcome message exists for the user
    const messageCount = await Message.countDocuments({ userId: user._id });
    if (messageCount === 0) {
      const welcomeMessage = new Message({
        userId: user._id,
        sender: "AI Agent",
        text: `Welcome, ${user.username}! I am your AI assistant. How can I help you today?`,
        type: "received",
        chatId: "ai_bot_support",
        isAI: true,
        timestamp: new Date()
      });
      await welcomeMessage.save();
    }

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '30d' });
    res.json({ token: jwtToken, user: { id: user._id, username: user.username, email: user.email, profilePhoto: user.profilePhoto, plan: user.plan } });
  } catch (err) {
    console.error("❌ Custom Google Auth Error:", err.message);
    res.status(500).json({ message: "Custom Google Auth Failed: " + err.message });
  }
});

router.post('/facebook', async (req, res) => {

  try {
    const { accessToken, userId, mode } = req.body;

    // Verify Facebook token (Server-to-Server)
    const fbRes = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture`);
    const fbData = await fbRes.json();

    if (!fbData.id || fbData.id !== userId) {
      return res.status(400).json({ message: "Invalid Facebook Token" });
    }

    const email = fbData.email || `${fbData.id}@facebook.com`;
    let user = await User.findOne({ email });
    
    if (!user) {
      if (mode === 'signup') {
        user = new User({
          username: fbData.name,
          email,
          facebookId: fbData.id,
          profilePhoto: fbData.picture?.data?.url
        });
        await user.save();
      } else {
        return res.status(404).json({ message: "Account not found. Please sign up first." });
      }
    } else if (!user.facebookId) {
      user.facebookId = fbData.id;
      if (!user.profilePhoto) user.profilePhoto = fbData.picture?.data?.url;
      await user.save();
    }

    // Ensure welcome message exists for the user
    const messageCount = await Message.countDocuments({ userId: user._id });
    if (messageCount === 0) {
      const welcomeMessage = new Message({
        userId: user._id,
        sender: "AI Agent",
        text: `Welcome, ${user.username}! I am your AI assistant. How can I help you today?`,
        type: "received",
        chatId: "ai_bot_support",
        isAI: true,
        timestamp: new Date()
      });
      await welcomeMessage.save();
    }

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '30d' });
    res.json({ token: jwtToken, user: { id: user._id, username: user.username, email: user.email, profilePhoto: user.profilePhoto, plan: user.plan } });
  } catch (err) {
    console.error("❌ Facebook Auth Error:", err.message);
    res.status(500).json({ message: "Facebook Auth Failed: " + err.message });
  }
});

// Update Profile Route
router.put('/profile', async (req, res) => {
  try {
    const { userId, username, profilePhoto } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    if (username) user.username = username;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;
    
    await user.save();
    res.json({ id: user._id, username: user.username, email: user.email, profilePhoto: user.profilePhoto, plan: user.plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET Current Profile (Sync)
router.get('/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });
    
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    res.json({ id: user._id, username: user.username, email: user.email, profilePhoto: user.profilePhoto, plan: user.plan });
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
});


// Permanent Account Deletion
router.delete('/account', verifyToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { password } = req.body;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // No password verification needed as per user request


    // Delete all user-related data from all collections
    await Promise.all([
      User.findByIdAndDelete(userId),
      Settings.deleteMany({ userId }),
      Campaign.deleteMany({ userId }),
      Message.deleteMany({ userId }),
      Contact.deleteMany({ userId }),
      Flow.deleteMany({ userId }),
      Form.deleteMany({ userId }),
      FormSubmission.deleteMany({ userId }),
      ChatMessage.deleteMany({ userId })
    ]);

    console.log(`🗑️ PERMANENT DELETE: User ${userId} and all related data removed.`);
    res.json({ success: true, message: 'Account and all data deleted permanently.' });
  } catch (err) {
    console.error("❌ Account Deletion Failed:", err.message);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
