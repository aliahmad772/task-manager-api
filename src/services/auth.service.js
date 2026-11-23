import User from '../models/user.model.js';
import * as tokenService from './token.service.js';
import { hashPassword, comparePassword } from '../utils/hash.util.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  decodeToken,
} from '../utils/jwt.util.js';

/**
 * Register a new user
 */
export const registerUser = async ({ name, email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    const error = new Error('Email is already registered');
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await hashPassword(password);

  return await User.create({
    name,
    email,
    password: hashedPassword,
  });
};

/**
 * Log in a user and establish a session
 */
export const loginUser = async ({ email, password, userAgent, ip }) => {
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await comparePassword(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    throw error;
  }

  const { accessToken, refreshToken } = await tokenService.generateAuthTokens(user, userAgent, ip);

  return {
    user,
    accessToken,
    refreshToken,
  };
};

/**
 * Refresh access token and rotate refresh token with reuse detection
 */
export const refreshTokens = async (refreshToken) => {
  if (!refreshToken) {
    const error = new Error('Refresh token is required');
    error.statusCode = 401;
    throw error;
  }

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (err) {
    const payload = decodeToken(refreshToken);
    if (payload && payload.userId) {
      await tokenService.deleteAllUserSessions(payload.userId);
    }
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 403;
    throw error;
  }

  const session = await tokenService.findSession(refreshToken);

  // TOKEN REUSE DETECTION
  if (!session) {
    await tokenService.deleteAllUserSessions(decoded.userId);
    const error = new Error('Token reuse detected. All active sessions have been revoked. Please log in again.');
    error.statusCode = 403;
    throw error;
  }

  const user = await User.findById(session.userId);
  if (!user) {
    await tokenService.deleteSession(refreshToken);
    const error = new Error('User no longer exists');
    error.statusCode = 404;
    throw error;
  }

  const newAccessToken = generateAccessToken({
    userId: user._id,
    email: user.email,
  });
  const newRefreshToken = generateRefreshToken({
    userId: user._id,
  });

  await tokenService.rotateSession(session._id, newRefreshToken);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
};

/**
 * Logout from current device
 */
export const logout = async ({ accessToken, refreshToken }) => {
  if (accessToken) {
    await tokenService.blacklistToken(accessToken);
  }

  if (refreshToken) {
    await tokenService.deleteSession(refreshToken);
  }
};

/**
 * Logout from all devices
 */
export const logoutAll = async ({ userId, accessToken }) => {
  if (accessToken) {
    await tokenService.blacklistToken(accessToken);
  }

  if (userId) {
    await tokenService.deleteAllUserSessions(userId);
  }
};

/**
 * Get profile data for authenticated user
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
};
