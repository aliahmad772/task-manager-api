import { verifyAccessToken } from '../utils/jwt.util.js';
import { isTokenBlacklisted } from '../services/token.service.js';

/**
 * Authentication Middleware
 */
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    // Check if token is blacklisted
    const blacklisted = await isTokenBlacklisted(token);
    if (blacklisted) {
      return res.status(401).json({
        success: false,
        message: 'This token has been revoked / logged out. Please log in again.',
      });
    }

    // Verify token
    const decoded = verifyAccessToken(token);

    req.user = decoded;
    req.token = token;

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Access token has expired. Please refresh your token.',
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Invalid access token.',
    });
  }
};

export default authMiddleware;
