const fs = require('fs');
const filePath = 'server/index.js';
let code = fs.readFileSync(filePath, 'utf8');

// Precisely fix the PUT scheduling endpoint findOne - search using shorter unique string
const targetSnippet = `    const sharedUserIds = getSharedUserIdsSync(req.user.userId);\r\n    const postToUpdate = await ScheduledPost.findOne({ \r\n      _id: req.params.id, \r\n      userId: { $in: sharedUserIds },\r\n      workspaceId: req.workspaceId\r\n    });\r\n    if (!postToUpdate) return res.status(404).json({ error: 'Post not found' });`;

const replacement = `    const sharedUserIds = getSharedUserIdsSync(req.user.userId);\r\n\r\n    // Use direct Supabase query to avoid userId UUID mapping issues\r\n    const { supabase: _sbPut } = await import('./utils/supabase.js');\r\n    const { data: putRows, error: putFetchErr } = await _sbPut\r\n      .from('scheduled_posts')\r\n      .select('*')\r\n      .eq('id', req.params.id)\r\n      .limit(1);\r\n    if (putFetchErr) throw new Error(putFetchErr.message);\r\n    const postToUpdate = putRows && putRows.length > 0 ? ScheduledPost(putRows[0]) : null;\r\n    if (!postToUpdate) return res.status(404).json({ error: 'Post not found' });`;

// fix findOneAndUpdate to use 'id' not '_id'
const updateTarget = `    const updatedPost = await ScheduledPost.findOneAndUpdate(\r\n      { _id: req.params.id, userId: { $in: sharedUserIds } },\r\n      updateData,\r\n      { new: true }\r\n    );`;

const updateReplacement = `    const updatedPost = await ScheduledPost.findOneAndUpdate(\r\n      { id: req.params.id },\r\n      updateData,\r\n      { new: true }\r\n    );`;

let changed = false;

if (code.includes(targetSnippet)) {
  code = code.replace(targetSnippet, replacement);
  console.log('✅ Fixed PUT findOne');
  changed = true;
} else {
  // Try LF-only version
  const lfSnippet = targetSnippet.replace(/\r\n/g, '\n');
  if (code.includes(lfSnippet)) {
    const lfReplacement = replacement.replace(/\r\n/g, '\n');
    code = code.replace(lfSnippet, lfReplacement);
    console.log('✅ Fixed PUT findOne (LF)');
    changed = true;
  } else {
    console.error('❌ Could not find PUT findOne target');
    const idx = code.indexOf('ScheduledPost.findOne');
    console.log('All ScheduledPost.findOne occurrences context:');
    let pos = 0;
    while ((pos = code.indexOf('ScheduledPost.findOne', pos)) !== -1) {
      console.log('  At pos', pos, ':', JSON.stringify(code.slice(pos - 50, pos + 100)));
      pos++;
    }
  }
}

if (code.includes(updateTarget)) {
  code = code.replace(updateTarget, updateReplacement);
  console.log('✅ Fixed PUT findOneAndUpdate');
  changed = true;
} else {
  const lfTarget = updateTarget.replace(/\r\n/g, '\n');
  if (code.includes(lfTarget)) {
    const lfUpdateReplacement = updateReplacement.replace(/\r\n/g, '\n');
    code = code.replace(lfTarget, lfUpdateReplacement);
    console.log('✅ Fixed PUT findOneAndUpdate (LF)');
    changed = true;
  } else {
    console.error('❌ Could not find findOneAndUpdate target');
  }
}

if (changed) {
  fs.writeFileSync(filePath, code);
  console.log('File saved');
}
