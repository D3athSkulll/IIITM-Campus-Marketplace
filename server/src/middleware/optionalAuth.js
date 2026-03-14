const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Optional JWT authentication middleware.
 * If token is present and valid, attaches req.user; otherwise continues silently.
 */
const optionalAuth = async (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (user) {
      req.user = user;
      req.userId = user._id;
    }
  } catch (_error) {
    // Intentionally ignore auth failures for optional auth routes.
  }

  next();
};

module.exports = { optionalAuth };
