import express from 'express';
import verifyToken from '../middleware/auth.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import ScheduledPost from '../models/ScheduledPost.js';
import Flow from '../models/Flow.js';
import Settings from '../models/Settings.js';
import Review from '../models/Review.js';

const router = express.Router();

// Middleware to check if user is the founder
const isSuperAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.email !== 'nknitishsingh94@gmail.com') {
      return res.status(403).json({ message: 'Forbidden. Super Admin access required.' });
    }
    req.adminUser = user;
    next();
  } catch (error) {
    console.error('Super Admin Auth Error:', error);
    res.status(500).json({ message: 'Internal server error during admin auth.' });
  }
};

// Protect all admin routes
router.use(verifyToken);
router.use(isSuperAdmin);

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalWorkspaces, totalScheduledPosts, totalAutomations] = await Promise.all([
      User.countDocuments({}),
      Workspace.countDocuments({}),
      ScheduledPost.countDocuments({}),
      Flow.countDocuments({})
    ]);

    res.json({
      totalUsers,
      totalWorkspaces,
      totalScheduledPosts,
      totalAutomations
    });
  } catch (error) {
    console.error('Admin Stats Error:', error);
    res.status(500).json({ message: 'Failed to fetch admin stats.' });
  }
});

// GET /api/admin/users
router.get('/users', async (req, res) => {
  try {
    // Only return safe fields
    const users = await User.find({});
    const safeUsers = users.map(u => ({
      id: u.id || u._id,
      username: u.username,
      email: u.email,
      created_at: u.created_at || u.createdAt || new Date().toISOString()
    }));
    res.json(safeUsers);
  } catch (error) {
    console.error('Admin Users Error:', error);
    res.status(500).json({ message: 'Failed to fetch users.' });
  }
});

// GET /api/admin/workspaces
router.get('/workspaces', async (req, res) => {
  try {
    const workspaces = await Workspace.find({});
    const safeWorkspaces = workspaces.map(w => ({
      id: w.id || w._id,
      name: w.name,
      owner_id: w.owner_id || w.ownerId,
      created_at: w.created_at || w.createdAt || new Date().toISOString()
    }));
    res.json(safeWorkspaces);
  } catch (error) {
    console.error('Admin Workspaces Error:', error);
    res.status(500).json({ message: 'Failed to fetch workspaces.' });
  }
});

// DELETE /api/admin/workspaces/:id
router.delete('/workspaces/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await Workspace.findByIdAndDelete(id);
    res.json({ message: 'Workspace deleted successfully.' });
  } catch (error) {
    console.error('Admin Delete Workspace Error:', error);
    res.status(500).json({ message: 'Failed to delete workspace.' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.adminUser.id || id === req.adminUser._id) {
      return res.status(400).json({ message: 'You cannot delete yourself.' });
    }
    await User.findByIdAndDelete(id);
    // Optionally delete related workspaces, settings, etc. But for Phase 1, just delete user.
    res.json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('Admin Delete User Error:', error);
    res.status(500).json({ message: 'Failed to delete user.' });
  }
});

// GET /api/admin/subscriptions
router.get('/subscriptions', async (req, res) => {
  try {
    const users = await User.find({});
    const subscriptions = users.map(u => ({
      userId: u.id || u._id,
      email: u.email,
      plan: u.plan || 'free',
      status: 'active'
    }));
    res.json(subscriptions);
  } catch (error) {
    console.error('Admin Subscriptions Error:', error);
    res.status(500).json({ message: 'Failed to fetch subscriptions.' });
  }
});

// PUT /api/admin/subscriptions/:userId
router.put('/subscriptions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { plan } = req.body;
    
    if (!['free', 'pro', 'enterprise'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan specified.' });
    }

    await User.findByIdAndUpdate(userId, { plan });
    res.json({ message: `User plan successfully updated to ${plan}.` });
  } catch (error) {
    console.error('Admin Update Subscription Error:', error);
    res.status(500).json({ message: 'Failed to update user subscription.' });
  }
});

// GET /api/admin/social-accounts
router.get('/social-accounts', async (req, res) => {
  try {
    const settingsList = await Settings.find({});
    let allAccounts = [];

    settingsList.forEach(setting => {
      const platforms = [
        { name: 'instagram', key: 'instagramAccessToken', displayKey: 'connectedInstagramName' },
        { name: 'facebook', key: 'facebookAccessToken', displayKey: 'connectedFacebookName' },
        { name: 'youtube', key: 'youtubeAccessToken', displayKey: 'connectedYoutubeName' },
        { name: 'twitter', key: 'twitterAccessToken', displayKey: 'connectedTwitterName' },
        { name: 'linkedin', key: 'linkedinAccessToken', displayKey: 'connectedLinkedinName' },
        { name: 'pinterest', key: 'pinterestAccessToken', displayKey: 'connectedPinterestName' },
      ];

      platforms.forEach(p => {
        if (setting[p.key]) {
          allAccounts.push({
            id: setting.id || setting._id, // Using setting ID for the disconnect action
            userId: setting.userId,
            workspaceId: setting.workspaceId,
            platform: p.name,
            displayName: setting[p.displayKey] || 'Unknown Account',
            status: 'connected'
          });
        }
      });
    });

    res.json(allAccounts);
  } catch (error) {
    console.error('Admin Social Accounts Error:', error);
    res.status(500).json({ message: 'Failed to fetch social accounts.' });
  }
});

// DELETE /api/admin/social-accounts/:id/:platform
router.delete('/social-accounts/:id/:platform', async (req, res) => {
  try {
    const { id, platform } = req.params;
    
    const updatePayload = {};
    if (platform === 'instagram') {
      updatePayload.instagramAccessToken = null;
      updatePayload.connectedInstagramName = null;
    } else if (platform === 'facebook') {
      updatePayload.facebookAccessToken = null;
      updatePayload.connectedFacebookName = null;
    } else if (platform === 'youtube') {
      updatePayload.youtubeAccessToken = null;
      updatePayload.connectedYoutubeName = null;
    } else if (platform === 'twitter') {
      updatePayload.twitterAccessToken = null;
      updatePayload.connectedTwitterName = null;
    } else if (platform === 'linkedin') {
      updatePayload.linkedinAccessToken = null;
      updatePayload.connectedLinkedinName = null;
    } else if (platform === 'pinterest') {
      updatePayload.pinterestAccessToken = null;
      updatePayload.connectedPinterestName = null;
    } else {
      return res.status(400).json({ message: 'Unknown platform' });
    }

    await Settings.findByIdAndUpdate(id, updatePayload);
    res.json({ message: `Successfully disconnected ${platform} account.` });
  } catch (error) {
    console.error('Admin Disconnect Social Error:', error);
    res.status(500).json({ message: 'Failed to disconnect social account.' });
  }
});

// GET /api/admin/automations
router.get('/automations', async (req, res) => {
  try {
    const automations = await Flow.find({});
    res.json(automations);
  } catch (error) {
    console.error('Admin Automations Error:', error);
    res.status(500).json({ message: 'Failed to fetch automations.' });
  }
});

// DELETE /api/admin/automations/:id
router.delete('/automations/:id', async (req, res) => {
  try {
    await Flow.findByIdAndDelete(req.params.id);
    res.json({ message: 'Automation deleted successfully.' });
  } catch (error) {
    console.error('Admin Delete Automation Error:', error);
    res.status(500).json({ message: 'Failed to delete automation.' });
  }
});

// GET /api/admin/scheduled-posts
router.get('/scheduled-posts', async (req, res) => {
  try {
    const posts = await ScheduledPost.find({});
    res.json(posts);
  } catch (error) {
    console.error('Admin Scheduled Posts Error:', error);
    res.status(500).json({ message: 'Failed to fetch scheduled posts.' });
  }
});

// DELETE /api/admin/scheduled-posts/:id
router.delete('/scheduled-posts/:id', async (req, res) => {
  try {
    await ScheduledPost.findByIdAndDelete(req.params.id);
    res.json({ message: 'Scheduled post deleted successfully.' });
  } catch (error) {
    console.error('Admin Delete Scheduled Post Error:', error);
    res.status(500).json({ message: 'Failed to delete scheduled post.' });
  }
});

// GET /api/admin/reviews
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await Review.find({});
    res.json(reviews);
  } catch (error) {
    console.error('Admin Reviews Error:', error);
    res.status(500).json({ message: 'Failed to fetch reviews.' });
  }
});

// DELETE /api/admin/reviews/:id
router.delete('/reviews/:id', async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: 'Review deleted successfully.' });
  } catch (error) {
    console.error('Admin Delete Review Error:', error);
    res.status(500).json({ message: 'Failed to delete review.' });
  }
});

export default router;
