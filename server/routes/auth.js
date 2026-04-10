import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Message from '../models/Message.js';
import { OAuth2Client } from 'google-auth-library';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);



const router = express.Router();

// Signup Route
router.post('/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'User already exists' });
    
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
    
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });
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
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });

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

    res.json({ token, user: { id: user._id, username: user.username, email: user.email, profilePhoto: user.profilePhoto } });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Google Login Route
router.post('/google', async (req, res) => {
  try {
    const { token } = req.body;
    
    // Mock Login Bypass for Demo
    if (token === "mock_google_token") {
      const email = "demo_google_user@example.com";
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({ username: "Demo Google User", email, googleId: "mock_google_id" });
        await user.save();
      }
      const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });
      return res.json({ token: jwtToken, user: { id: user._id, username: user.username, email: user.email } });
    }

    const ticket = await googleClient.verifyIdToken({

      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const { sub, email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ email });
    if (!user) {
      user = new User({
        username: name,
        email,
        googleId: sub,
        profilePhoto: picture
      });
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

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });
    res.json({ token: jwtToken, user: { id: user._id, username: user.username, email: user.email, profilePhoto: user.profilePhoto } });
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

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });
    res.json({ token: jwtToken, user: { id: user._id, username: user.username, email: user.email, profilePhoto: user.profilePhoto } });
  } catch (err) {
    console.error("❌ Custom Google Auth Error:", err.message);
    res.status(500).json({ message: "Custom Google Auth Failed: " + err.message });
  }
});

router.post('/facebook', async (req, res) => {

  try {
    const { accessToken, userId } = req.body;

    // Mock Login Bypass for Demo
    if (accessToken === "mock_token") {
      const email = "demo_facebook_user@example.com";
      let user = await User.findOne({ email });
      if (!user) {
        user = new User({ username: "Demo Facebook User", email, facebookId: "mock_fb_id" });
        await user.save();
      }
      const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });
      return res.json({ token: jwtToken, user: { id: user._id, username: user.username, email: user.email } });
    }
    
    // Verify Facebook token (Server-to-Server)

    const fbRes = await fetch(`https://graph.facebook.com/me?access_token=${accessToken}&fields=id,name,email,picture`);
    const fbData = await fbRes.json();

    if (!fbData.id || fbData.id !== userId) {
      return res.status(400).json({ message: "Invalid Facebook Token" });
    }

    const email = fbData.email || `${fbData.id}@facebook.com`;
    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({
        username: fbData.name,
        email,
        facebookId: fbData.id,
        profilePhoto: fbData.picture?.data?.url
      });
      await user.save();
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

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '1d' });
    res.json({ token: jwtToken, user: { id: user._id, username: user.username, email: user.email, profilePhoto: user.profilePhoto } });
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
    res.json({ id: user._id, username: user.username, email: user.email, profilePhoto: user.profilePhoto });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export default router;
