import jwt from 'jsonwebtoken';

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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_insta_agent_key_123');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default verifyToken;

