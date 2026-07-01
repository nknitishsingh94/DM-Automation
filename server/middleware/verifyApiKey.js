import ApiKey from '../models/ApiKey.js';
import Workspace from '../models/Workspace.js';
import { convertObjectIDToUUID, convertUUIDToObjectID } from '../utils/supabase.js';

const verifyApiKey = async (req, res, next) => {
  let apiKey = req.headers.authorization?.split(' ')[1];
  
  if (!apiKey) {
    return res.status(401).json({ error: 'Unauthorized. No API Key provided.' });
  }

  if (!apiKey.startsWith('sk_live_')) {
    return res.status(401).json({ error: 'Unauthorized. Invalid API Key format.' });
  }

  try {
    const keyRecord = await ApiKey.findOne({ key: apiKey, active: true });
    if (!keyRecord) {
      return res.status(401).json({ error: 'Unauthorized. Invalid or inactive API Key.' });
    }

    const uuidUserId = keyRecord.userId; // Already UUID from Supabase database
    const objectIdUserId = convertUUIDToObjectID(uuidUserId);
    
    req.user = { userId: objectIdUserId };
    
    let workspaceId = req.headers['x-workspace-id'] || req.query.workspaceId;
    let activeWorkspace = null;
    
    try {
      if (workspaceId) {
        const uuidWorkspaceId = convertObjectIDToUUID(workspaceId);
        activeWorkspace = await Workspace.findOne({ id: uuidWorkspaceId, userId: uuidUserId });
      }
      
      if (!activeWorkspace) {
        activeWorkspace = await Workspace.findOne({ userId: uuidUserId });
      }
      
      if (!activeWorkspace) {
        activeWorkspace = await Workspace.create({
          userId: uuidUserId,
          name: 'Default Workspace'
        });
      }
      
      req.workspaceId = activeWorkspace?.id || null;
    } catch (dbErr) {
      console.warn("⚠️ verifyApiKey: Workspace resolution fallback:", dbErr.message);
      req.workspaceId = null;
    }

    next();
  } catch (err) {
    console.error("API Key Verification Failed:", err.message);
    return res.status(500).json({ error: 'Internal server error during API Key validation.' });
  }
};

export default verifyApiKey;
