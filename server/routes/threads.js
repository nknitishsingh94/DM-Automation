import express from 'express';
import axios from 'axios';
import verifyToken from '../middleware/auth.js';
import Settings from '../models/Settings.js';

const router = express.Router();

router.get('/profiles', verifyToken, async (req, res) => {
  try {
    const settings = await Settings.findOne({ userId: req.user.userId });
    if (!settings || !settings.connectedPageName) {
      return res.json([]);
    }
    
    try {
      const pageData = JSON.parse(settings.connectedPageName);
      if (pageData.isThreadsConnected) {
        return res.json([{
          id: pageData.threadsPageId,
          name: pageData.connectedThreadsName,
          platform: 'threads'
        }]);
      }
    } catch(e) {
    }
    
    res.json([]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/publish', verifyToken, async (req, res) => {
  try {
    const { text, mediaUrl, mediaType } = req.body; // mediaType: 'TEXT', 'IMAGE', 'VIDEO'
    
    const settings = await Settings.findOne({ userId: req.user.userId });
    if (!settings || !settings.connectedPageName) {
      return res.status(400).json({ error: 'Threads account not connected' });
    }
    
    let threadsData;
    try {
      threadsData = JSON.parse(settings.connectedPageName);
      if (!threadsData.isThreadsConnected) throw new Error();
    } catch(e) {
      return res.status(400).json({ error: 'Threads account not connected' });
    }

    const { threadsPageId, threadsAccessToken } = threadsData;

    let createContainerUrl = `https://graph.threads.net/v1.0/${threadsPageId}/threads`;
    let containerPayload = {
      media_type: mediaType || 'TEXT',
      text: text,
      access_token: threadsAccessToken
    };

    if (mediaUrl && mediaType === 'IMAGE') {
      containerPayload.image_url = mediaUrl;
    } else if (mediaUrl && mediaType === 'VIDEO') {
      containerPayload.video_url = mediaUrl;
    }

    console.log("Creating Threads Container...", containerPayload);
    const containerRes = await axios.post(createContainerUrl, containerPayload, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    const containerId = containerRes.data.id;
    console.log("Container ID:", containerId);

    let publishUrl = `https://graph.threads.net/v1.0/${threadsPageId}/threads_publish`;
    const publishRes = await axios.post(publishUrl, {
      creation_id: containerId,
      access_token: threadsAccessToken
    }, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    res.json({ success: true, id: publishRes.data.id });
  } catch (err) {
    console.error("Threads Publish Error:", err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error?.message || err.message });
  }
});


export default router;
