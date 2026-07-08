import express from 'express';
import verifyToken from '../middleware/auth.js';
import User from '../models/User.js';
import Workspace from '../models/Workspace.js';
import ScheduledPost from '../models/ScheduledPost.js';
import Flow from '../models/Flow.js';
import Settings from '../models/Settings.js';

const router = express.Router();

// Middleware to check if user is the founder
const isSuperAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.email !== 'nknitishsingh91@gmail.com') {
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

export default router;
