import Session from '../models/session.model.js';
import Blacklist from '../models/blacklist.model.js';
import {
  generateAccessToken,
  generateRefreshToken,
  decodeToken,
} from '../utils/jwt.util.js';

/**
 * Calculate expiration Date based on string or default days (e.g., '7d')
 */
export const getRefreshTokenExpiresAt = () => {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
  const days = parseInt(expiresIn, 10) || 7;
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);
  return expiresAt;
};

/**
 * Generate Access & Refresh tokens, and store session in MongoDB
 */
export const generateAuthTokens = async (user, userAgent = 'Unknown Device', ip = 'Unknown IP') => {
  const payload = {
    userId: user._id,
    email: user.email,
  };

  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken({ userId: user._id });
  const expiresAt = getRefreshTokenExpiresAt();

  await Session.create({
    userId: user._id,
    refreshToken,
    userAgent,
    ip,
    expiresAt,
  });

  return { accessToken, refreshToken };
};

/**
 * Add an access token to the blacklist
 */
export const blacklistToken = async (token) => {
  if (!token) return;

  const decoded = decodeToken(token);
  const expiresAt = decoded && decoded.exp
    ? new Date(decoded.exp * 1000)
    : new Date(Date.now() + 15 * 60 * 1000);

  try {
    await Blacklist.create({ token, expiresAt });
  } catch (error) {
    if (error.code !== 11000) {
      throw error;
    }
  }
};

/**
 * Check if a token has been blacklisted
 */
export const isTokenBlacklisted = async (token) => {
  const blacklisted = await Blacklist.findOne({ token });
  return Boolean(blacklisted);
};

/**
 * Find session by refresh token
 */
export const findSession = async (refreshToken) => {
  return await Session.findOne({ refreshToken });
};

/**
 * Update an existing session with a new refresh token (Token Rotation)
 */
export const rotateSession = async (sessionId, newRefreshToken) => {
  const expiresAt = getRefreshTokenExpiresAt();
  return await Session.findByIdAndUpdate(
    sessionId,
    {
      refreshToken: newRefreshToken,
      expiresAt,
    },
    { new: true }
  );
};

/**
 * Delete a single session by refresh token (Current device logout)
 */
export const deleteSession = async (refreshToken) => {
  return await Session.deleteOne({ refreshToken });
};

/**
 * Delete all sessions for a specific user (Logout all devices)
 */
export const deleteAllUserSessions = async (userId) => {
  return await Session.deleteMany({ userId });
};
