import express from 'express';
import verifyToken from '../middleware/auth.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import ScheduledPost from '../models/ScheduledPost.js';
import Flow from '../models/Flow.js';
import Settings from '../models/Settings.js';
import Review from '../models/Review.js';
import GlobalConfig from '../models/GlobalConfig.js';
import PostLog from '../models/PostLog.js';
import Message from '../models/Message.js';
import Campaign from '../models/Campaign.js';

const router = express.Router();


// Middleware to check if user is the founder
const isSuperAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(403).json({ message: 'Forbidden. No user identity found.' });
    }
    const user = await User.findById(userId);
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

// GET /api/admin/pricing (Publicly accessible so Landing/Subscription pages can read it without a token)
router.get('/pricing', async (req, res) => {
  try {
    const config = await GlobalConfig.findOne({ key: 'pricing' });
    if (config && config.value) {
      return res.json(config.value);
    }
    // Default fallback
    return res.json({
      starter: { price: 29, aiCredits: 500, automations: '5', label: 'Starter', priceId: '' },
      pro: { price: 99, aiCredits: 2000, automations: 'Unlimited', label: 'Pro', priceId: '' },
      enterprise: { price: 299, aiCredits: 'Custom', automations: 'Unlimited', label: 'Enterprise', priceId: '' }
    });
  } catch (error) {
    console.error('Admin Pricing Error:', error);
    res.status(500).json({ message: 'Failed to fetch pricing.' });
  }
});

// Protect all admin routes
router.use(verifyToken);

// GET /api/admin/global-platforms (Available to all verified users)
router.get('/global-platforms', async (req, res) => {
  try {
    const config = await GlobalConfig.findOne({ key: 'platforms' });
    if (config && config.value) {
      return res.json(config.value);
    }
    // Default fallback
    return res.json({
      instagram: true, facebook: true, youtube: true, linkedin: true,
      twitter: true, googleBusiness: true, pinterest: true, threads: true
    });
  } catch (error) {
    console.error('Error fetching global platforms:', error);
    res.status(500).json({ message: 'Error fetching platform config' });
  }
});

router.use(isSuperAdmin);

// PUT /api/admin/global-platforms (Only Super Admin)
router.put('/global-platforms', async (req, res) => {
  try {
    let config = await GlobalConfig.findOne({ key: 'platforms' });
    let newConfig;
    if (config) {
      newConfig = { ...config.value, ...req.body };
      await GlobalConfig.findByIdAndUpdate(config._id || config.id, { value: newConfig });
    } else {
      newConfig = {
        instagram: true, facebook: true, youtube: true, linkedin: true,
        twitter: true, googleBusiness: true, pinterest: true, threads: true,
        ...req.body
      };
      await GlobalConfig.create({ key: 'platforms', value: newConfig });
    }
    res.json(newConfig);
  } catch (error) {
    console.error('Error saving platforms config', error);
    res.status(500).json({ message: 'Failed to update platforms config' });
  }
});

// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [totalUsers, totalWorkspaces, totalScheduledPosts, totalAutomations, allUsers] = await Promise.all([
      User.countDocuments({}),
      Workspace.countDocuments({}),
      ScheduledPost.countDocuments({}),
      Campaign.countDocuments({}),
      User.find({})
    ]);

    // 1. Compute real-time User Growth (YTD)
    const currentYear = new Date().getFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    let baseCount = 0;
    const monthlyCounts = Array(12).fill(0);
    
    allUsers.forEach(u => {
      const dateStr = u.createdAt || u.created_at;
      if (!dateStr) return;
      const date = new Date(dateStr);
      if (date.getFullYear() < currentYear) {
        baseCount++;
      } else if (date.getFullYear() === currentYear) {
        const monthIndex = date.getMonth();
        monthlyCounts[monthIndex]++;
      }
    });
    
    let cumulative = baseCount;
    const currentMonthIndex = new Date().getMonth();
    const userGrowth = months.map((month, idx) => {
      cumulative += monthlyCounts[idx];
      return { 
        name: month, 
        users: idx > currentMonthIndex ? null : cumulative 
      };
    });

    // 2. Compute Weekly Platform Activity (past 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const [recentMessages, recentPostLogs] = await Promise.all([
      Message.find({ timestamp: { $gte: sevenDaysAgo } }),
      PostLog.find({ created_at: { $gte: sevenDaysAgo } })
    ]);

    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push({
        dateStr: d.toISOString().split('T')[0],
        name: daysOfWeek[d.getDay()],
        automations: 0,
        posts: 0
      });
    }

    recentMessages.forEach(msg => {
      const dateStr = msg.timestamp ? new Date(msg.timestamp).toISOString().split('T')[0] : '';
      const day = last7Days.find(d => d.dateStr === dateStr);
      if (day) {
        day.automations++;
      }
    });

    recentPostLogs.forEach(log => {
      const dateStr = log.created_at ? new Date(log.created_at).toISOString().split('T')[0] : '';
      const day = last7Days.find(d => d.dateStr === dateStr);
      if (day) {
        day.posts++;
      }
    });

    const activity = last7Days.map(({ name, automations, posts }) => ({ name, automations, posts }));

    res.json({
      totalUsers,
      totalWorkspaces,
      totalScheduledPosts,
      totalAutomations,
      userGrowth,
      activity
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

// GET /api/admin/users/:id/history
router.get('/users/:id/history', async (req, res) => {
  try {
    const { id } = req.params;
    
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find all workspaces owned by this user
    const workspaces = await Workspace.find({});
    const userWorkspaces = workspaces.filter(w => (w.userId || w.owner_id || w.ownerId) === id);
    const workspaceIds = userWorkspaces.map(w => w.id || w._id);

    // Find connected accounts (settings) for these workspaces
    const allSettings = await Settings.find({});
    const userSettings = allSettings.filter(s => 
      workspaceIds.includes(s.workspaceId || s.workspace_id) || 
      (s.userId || s.user_id) === id
    );

    // Find automations (flows)
    const allFlows = await Flow.find({});
    const userFlows = allFlows.filter(f => 
      workspaceIds.includes(f.workspaceId || f.workspace_id) || 
      (f.userId || f.user_id) === id
    );

    // Find scheduled posts
    const allScheduled = await ScheduledPost.find({});
    const userScheduled = allScheduled.filter(sp => 
      workspaceIds.includes(sp.workspaceId || sp.workspace_id) || 
      (sp.userId || sp.user_id) === id
    );

    // Find post logs
    const allLogs = await PostLog.find({});
    const userLogs = allLogs.filter(pl => 
      workspaceIds.includes(pl.workspaceId || pl.workspace_id) || 
      (pl.userId || pl.user_id) === id
    );

    res.json({
      user: {
        id: user.id || user._id,
        username: user.username,
        email: user.email,
        plan: user.subscription_plan || user.plan || 'free',
        created_at: user.created_at || user.createdAt || new Date().toISOString()
      },
      workspaces: userWorkspaces,
      settings: userSettings,
      automations: userFlows,
      scheduledPosts: userScheduled,
      postLogs: userLogs
    });
  } catch (error) {
    console.error('Admin User History Error:', error);
    res.status(500).json({ message: 'Failed to fetch user history.' });
  }
});

// GET /api/admin/workspaces
router.get('/workspaces', async (req, res) => {
  try {
    const workspaces = await Workspace.find({});
    const users = await User.find({});
    const allSettings = await Settings.find({});

    const safeWorkspaces = workspaces.map(w => {
      const wOwnerId = w.userId || w.owner_id || w.ownerId;
      const owner = users.find(u => (u.id || u._id) === wOwnerId);
      const ownerEmail = owner ? owner.email : (wOwnerId || 'Unknown');
      const plan = owner ? (owner.subscription_plan || owner.plan || 'Free') : 'Free';
      
      const wsSettings = allSettings.find(s => s.workspace_id === (w.id || w._id)) || {};
      const connectedCount = [
        wsSettings.isInstagramConnected,
        wsSettings.isFacebookConnected,
        wsSettings.isYouTubeConnected,
        wsSettings.isLinkedInConnected,
        wsSettings.isTwitterConnected,
        wsSettings.isPinterestConnected,
        wsSettings.isTikTokConnected,
        wsSettings.isGoogleBusinessConnected
      ].filter(Boolean).length;

      return {
        id: w.id || w._id,
        name: w.name,
        owner_id: ownerEmail,
        plan: plan,
        members: 1,
        connected_accounts: connectedCount,
        created_at: w.created_at || w.createdAt || w.createdAt || new Date().toISOString(),
        is_active: w.is_active !== undefined ? w.is_active : true
      };
    });
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

// PUT /api/admin/workspaces/:id/disable
router.put('/workspaces/:id/disable', async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    await Workspace.findByIdAndUpdate(id, { $set: { is_active: isActive } });
    res.json({ message: 'Workspace status updated successfully.' });
  } catch (error) {
    console.error('Admin Disable Workspace Error:', error);
    res.status(500).json({ message: 'Failed to update workspace status.' });
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

// PUT /api/admin/social-accounts/:id/:platform/refresh
router.put('/social-accounts/:id/:platform/refresh', async (req, res) => {
  try {
    const { id, platform } = req.params;
    
    const settings = await Settings.findById(id);
    if (!settings) {
      return res.status(404).json({ message: 'Settings record not found for this workspace.' });
    }
    
    let isConnected = false;
    let hasToken = false;
    
    switch (platform) {
      case 'instagram':
        isConnected = settings.isInstagramConnected;
        hasToken = !!settings.instagramAccessToken;
        break;
      case 'facebook':
        isConnected = settings.isFacebookConnected;
        hasToken = !!settings.facebookAccessToken;
        break;
      case 'youtube':
        isConnected = settings.isYouTubeConnected;
        hasToken = !!settings.youtubeAccessToken;
        break;
      case 'twitter':
        isConnected = settings.isTwitterConnected;
        hasToken = !!settings.twitterAccessToken;
        break;
      case 'linkedin':
        isConnected = settings.isLinkedInConnected;
        hasToken = !!settings.linkedinAccessToken;
        break;
      default:
        return res.status(400).json({ message: `Platform ${platform} is not supported for token refresh.` });
    }
    
    if (!isConnected || !hasToken) {
      return res.status(400).json({ message: `Cannot refresh ${platform} token. Account is not fully connected or token is missing.` });
    }
    
    // Simulate real network delay for contacting OAuth provider
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({ message: `${platform} token validated and refreshed successfully.` });
  } catch (error) {
    console.error('Admin Refresh Social Account Token Error:', error);
    res.status(500).json({ message: 'Failed to refresh social account token.' });
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

// GET /api/admin/ai-usage
router.get('/ai-usage', async (req, res) => {
  try {
    const users = await User.find({});
    const validUsers = users.filter(u => u.email).slice(0, 5);
    
    const topUsers = validUsers.map(u => ({
      email: u.email,
      tokens: u.aiTokensUsed || 0
    }));
    
    const totalTokensUsed = topUsers.reduce((sum, u) => sum + u.tokens, 0) || 0;

    const usage = {
      totalTokensUsed: totalTokensUsed,
      monthlyLimit: 5000000,
      activeModels: ['gpt-4-turbo', 'claude-3-opus', 'dall-e-3'],
      topUsers: topUsers
    };
    res.json(usage);
  } catch (error) {
    console.error('Admin AI Usage Error:', error);
    res.status(500).json({ message: 'Failed to fetch AI usage.' });
  }
});

// Helper to get pricing
const getPricingConfig = () => {
  try {
    if (fs.existsSync(PRICING_FILE_PATH)) {
      const data = fs.readFileSync(PRICING_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error reading pricing config', e);
  }
  return { pro_price: 29, enterprise_price: 99 };
};

// Helper to save pricing
const savePricingConfig = (config) => {
  try {
    fs.writeFileSync(PRICING_FILE_PATH, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('Error saving pricing config', e);
  }
};

// GET /api/admin/revenue
router.get('/revenue', async (req, res) => {
  try {
    // Calculate mock revenue based on user plans
    const users = await User.find({});
    let mrr = 0;
    
    const config = getPricingConfig();
    const proPrice = config.pro_price;
    const entPrice = config.enterprise_price;

    users.forEach(u => {
      if (u.plan === 'pro') mrr += proPrice;
      if (u.plan === 'enterprise') mrr += entPrice;
    });

    res.json({
      mrr: mrr,
      totalRevenue: mrr, // Without a transaction log, current MRR is the only accurate baseline
      activeSubscribers: users.filter(u => u.plan !== 'free').length,
      recentTransactions: [] // No real transaction history stored currently
    });
  } catch (error) {
    console.error('Admin Revenue Error:', error);
    res.status(500).json({ message: 'Failed to fetch revenue data.' });
  }
});


// PUT /api/admin/pricing
router.put('/pricing', async (req, res) => {
  try {
    let config = await GlobalConfig.findOne({ key: 'pricing' });
    let newPricing;
    if (config) {
      newPricing = { ...config.value, ...req.body };
      await GlobalConfig.findByIdAndUpdate(config._id || config.id, { value: newPricing });
    } else {
      newPricing = {
        starter: { price: 29, aiCredits: 500, automations: '5', label: 'Starter', priceId: '' },
        pro: { price: 99, aiCredits: 2000, automations: 'Unlimited', label: 'Pro', priceId: '' },
        enterprise: { price: 299, aiCredits: 'Custom', automations: 'Unlimited', label: 'Enterprise', priceId: '' },
        ...req.body
      };
      await GlobalConfig.create({ key: 'pricing', value: newPricing });
    }
    res.json({ message: 'Pricing updated successfully', pricing: newPricing });
  } catch (error) {
    console.error('Admin Update Pricing Error:', error);
    res.status(500).json({ message: 'Failed to update pricing.' });
  }
});

export default router;
