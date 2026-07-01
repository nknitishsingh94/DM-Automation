import express from 'express';
import verifyToken from '../middleware/auth.js';
import PostLog from '../models/PostLog.js';
import ScheduledPost from '../models/ScheduledPost.js';

const router = express.Router();

/**
 * @swagger
 * /api/analytics:
 *   get:
 *     summary: Get analytics dashboard data
 *     description: Returns total posts, success/failure counts, and recent post logs for the authenticated user and workspace.
 *     tags: [Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: header
 *         name: x-workspace-id
 *         schema:
 *           type: string
 *         required: false
 *         description: Workspace ID for filtering logs
 *     responses:
 *       200:
 *         description: Analytics data retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Server error
 */
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id || req.user._id || req.user.userId;
    const workspaceId = req.headers['x-workspace-id'] || req.headers['workspace'] || req.query.workspaceId;

    let query = { userId: userId };
    if (workspaceId) {
      query.workspaceId = workspaceId;
    }

    const scheduledPosts = await ScheduledPost.find(query);
    const totalScheduled = scheduledPosts.length;
    const publishedCount = scheduledPosts.filter(p => p.status === 'published').length;

    const logs = await PostLog.find(query);
    const totalLogs = logs.length;
    const successCount = logs.filter(log => log.status === 'success').length;
    const failedCount = logs.filter(log => log.status === 'failed').length;

    const recentLogs = logs.sort((a, b) => new Date(b.created_at || b.createdAt) - new Date(a.created_at || a.createdAt)).slice(0, 10);

    res.json({
      success: true,
      data: {
        stats: {
          totalScheduled,
          totalPublished: publishedCount,
          totalAttempted: totalLogs,
          successCount,
          failedCount,
        },
        recentLogs
      }
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ success: false, message: 'Server Error fetching analytics' });
  }
});

export default router;
