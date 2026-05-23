import jwt from 'jsonwebtoken';
import Workspace from '../models/Workspace.js';
import { convertObjectIDToUUID } from '../utils/supabase.js';

if (!process.env.JWT_SECRET) {
  console.error('❌ FATAL: JWT_SECRET is not set in environment variables. Server cannot start securely.');
}

const verifyToken = async (req, res, next) => {
  let token = req.headers.authorization?.split(' ')[1];
  
  // For OAuth redirects that use window.location.href, the token is passed in the query
  if (!token && req.query.token) {
    token = req.query.token;
  }
  
  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Validated: Token is structurally sound. Proceed with decoded payload.
    if (!decoded.userId) {
       return res.status(401).json({ message: 'Invalid token payload' });
    }

    req.user = decoded;
    
    // Resolve workspace context
    let workspaceId = req.headers['x-workspace-id'] || req.query.workspaceId;
    const uuidUserId = convertObjectIDToUUID(decoded.userId);
    
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
        console.log(`Created Default Workspace ${activeWorkspace.id} for user ${uuidUserId}`);
      }
      
      req.workspaceId = activeWorkspace?.id || null;
    } catch (dbErr) {
      console.warn("⚠️ Workspaces table does not exist or database error. Falling back to default mode:", dbErr.message);
      req.workspaceId = null;
    }
    
    next();
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("JWT Verification Failed:", err.message);
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default verifyToken;

