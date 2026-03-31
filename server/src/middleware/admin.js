/**
 * Admin Authorization Middleware
 * Must be used AFTER auth middleware — checks req.user.role === 'admin'
 */
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required.' });
  }
  next();
};

module.exports = { adminOnly };
