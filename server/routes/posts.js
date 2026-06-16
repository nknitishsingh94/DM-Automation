import express from 'express';
import ScheduledPost from '../models/ScheduledPost.js';
import verifyApiKey from '../middleware/verifyApiKey.js';
import axios from 'axios';

const router = express.Router();

// Helper to parse ScheduledPost objects
const parseScheduledPost = (post) => {
  return post.toObject ? post.toObject() : post;
};

// Create programmatically scheduled post(s)
router.post('/', verifyApiKey, async (req, res) => {
  try {
    const {
      caption = '',
      mediaUrl = '',
      carouselItems = [],
      scheduledFor,
      platforms,
      type = 'image',
      triggerKeyword = '',
      autoResponse = ''
    } = req.body;

    if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
      return res.status(400).json({ error: 'platforms must be a non-empty array.' });
    }

    const validPlatforms = ['instagram', 'facebook', 'threads', 'youtube'];
    const invalidPlats = platforms.filter(p => !validPlatforms.includes(p.toLowerCase()));
    if (invalidPlats.length > 0) {
      return res.status(400).json({ error: `Unsupported platform(s): ${invalidPlats.join(', ')}. Valid options are: ${validPlatforms.join(', ')}` });
    }

    // Set default scheduled time to now if not provided
    let scheduledDate = scheduledFor;
    try {
      if (scheduledDate) {
        scheduledDate = new Date(scheduledDate).toISOString();
      } else {
        scheduledDate = new Date().toISOString();
      }
    } catch (e) {
      return res.status(400).json({ error: 'Invalid scheduledFor date format. Use ISO 8601 format.' });
    }

    // Serialize metadata for the mediaUrl field (compatibility with background worker)
    const metadata = {
      type: type,
      carouselItems: carouselItems,
      mediaUrl: mediaUrl,
      buttons: [],
      requireFollow: false,
      unfollowedResponse: '',
      publicReply: '',
      automationStatus: 'Active',
      anyKeyword: false,
      openingMessage: false,
      openingMessageText: '',
      openingMessageButton: '',
      threadCustomCaption: '',
      threadPosts: [],
      gmbActionType: 'LEARN_MORE',
      gmbCtaEnabled: false,
      gmbSearchUrl: '',
      gmbCustomCaption: '',
      youtubeVideoId: ''
    };
    const finalMediaUrl = JSON.stringify(metadata);

    const createdPosts = [];
    let shouldTriggerWorker = false;

    for (const rawPlatform of platforms) {
      const platform = rawPlatform.toLowerCase();

      const postData = {
        caption,
        platform,
        scheduledFor: scheduledDate,
        userId: req.user.userId,
        workspaceId: req.workspaceId,
        mediaUrl: finalMediaUrl,
        triggerKeyword,
        autoResponse,
        status: 'Scheduled'
      };

      const newPost = new ScheduledPost(postData);
      await newPost.save();
      createdPosts.push(parseScheduledPost(newPost));

      const isDue = new Date(scheduledDate) <= new Date();
      if (isDue) {
        shouldTriggerWorker = true;
      }
    }

    if (shouldTriggerWorker) {
      // Trigger background worker via cron-publish trigger (async, fire-and-forget)
      const SERVER_PUBLIC_URL = process.env.API_BASE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : `http://localhost:${process.env.PORT || 5001}`);
      axios.get(`${SERVER_PUBLIC_URL}/api/cron/publish`).catch(err => {
        console.warn(`⚠️ API post creation worker ping warning:`, err.message);
      });
    }

    res.status(201).json({
      message: 'Post(s) scheduled successfully programmatically.',
      posts: createdPosts
    });
  } catch (err) {
    console.error('❌ Programmatic API Posting Error:', err.message);
    res.status(500).json({ error: 'Failed to create programmatic post: ' + err.message });
  }
});

export default router;
