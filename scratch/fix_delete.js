const fs = require('fs');
const filePath = 'server/index.js';
let code = fs.readFileSync(filePath, 'utf8');

// Find the start and end of the delete handler
const start = code.indexOf("app.delete('/api/scheduling/:id',");
const end = code.indexOf('});\r\n\r\n// Messages API', start);
if (start === -1 || end === -1) {
  console.error('❌ Could not find delete handler boundaries');
  console.log('Start:', start, 'End:', end);
  process.exit(1);
}

const newHandler = `app.delete('/api/scheduling/:id', verifyToken, async (req, res) => {
  try {
    const postId = req.params.id;
    console.log(\`🗑️ DELETE scheduled post requested. ID: \${postId}, User: \${req.user.userId}\`);

    // Import supabase directly to avoid userId UUID mapping issues in ScheduledPost.findOne
    const { supabase: _sb } = await import('./utils/supabase.js');

    // Fetch the post by its Supabase UUID directly
    const { data: postRows, error: fetchErr } = await _sb
      .from('scheduled_posts')
      .select('*')
      .eq('id', postId)
      .limit(1);

    if (fetchErr) throw new Error(fetchErr.message);

    const postToDelete = postRows && postRows.length > 0 ? postRows[0] : null;

    if (postToDelete) {
      // Parse associated media IDs for campaign cleanup
      let igMediaId = null;
      if (postToDelete.mediaUrl && postToDelete.mediaUrl.startsWith('{')) {
        try {
          const meta = JSON.parse(postToDelete.mediaUrl);
          igMediaId = meta.instagramMediaId;
        } catch (e) {}
      }

      const postIds = [];
      if (postToDelete.postId) postIds.push(postToDelete.postId);
      if (igMediaId) postIds.push(igMediaId);

      if (postIds.length > 0) {
        console.log(\`🗑️ Deleting associated campaigns for post IDs:\`, postIds);
        const sharedUserIds = getSharedUserIdsSync(req.user.userId);
        await Campaign.deleteMany({
          userId: { $in: sharedUserIds },
          workspaceId: req.workspaceId,
          postId: { $in: postIds }
        });
        await refreshGlobalCache();
      }

      // Delete directly from Supabase by UUID
      const { error: deleteErr } = await _sb.from('scheduled_posts').delete().eq('id', postId);
      if (deleteErr) throw new Error(deleteErr.message);

      console.log(\`✅ Successfully deleted scheduled post: \${postId}\`);
      return res.json({ success: true });
    }

    console.warn(\`⚠️ Scheduled post not found for ID: \${postId}\`);
    res.status(404).json({ error: "Post not found or unauthorized" });
  } catch (err) {
    console.error(\`❌ Error in DELETE /api/scheduling/:id:\`, err);
    res.status(500).json({ error: err.message });
  }
});`;

const endOfHandler = end + '});\r\n'.length;
const before = code.slice(0, start);
const after = code.slice(endOfHandler);
const newCode = before + newHandler + '\r\n\r\n' + after;

fs.writeFileSync(filePath, newCode);
console.log('✅ Delete handler replaced cleanly');
