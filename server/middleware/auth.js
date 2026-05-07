import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
  throw new Error('❌ FATAL: JWT_SECRET is not set in environment variables. Server cannot start securely.');
}

const verifyToken = (req, res, next) => {
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
    
    // SECURITY: Validate UUID format to prevent Postgres crash on legacy MongoDB IDs
    if (decoded.userId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(decoded.userId)) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`⚠️ Blocking legacy/invalid ID format: ${decoded.userId}`);
      }
      return res.status(401).json({ message: 'Session outdated. Please log out and log in again.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.error("JWT Verification Failed:", err.message);
    }
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default verifyToken;
