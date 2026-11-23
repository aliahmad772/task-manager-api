import jwt from 'jsonwebtoken';

/**
 * Generate a short-lived Access Token
 * Typically valid for 15 minutes (or as defined in .env)
 * @param {object} payload - Data to embed in the token (e.g. { userId, email })
 * @returns {string} - Signed JWT access token
 */
export const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
  });
};

/**
 * Generate a long-lived Refresh Token
 * Typically valid for 7 days (or as defined in .env)
 * @param {object} payload - Data to embed in the token (e.g. { userId })
 * @returns {string} - Signed JWT refresh token
 */
export const generateRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  });
};

/**
 * Verify an Access Token
 * Throws an error if token is expired or invalid
 * @param {string} token - JWT access token string
 * @returns {object} - Decoded payload
 */
export const verifyAccessToken = (token) => {
  return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
};

/**
 * Verify a Refresh Token
 * Throws an error if token is expired or invalid
 * @param {string} token - JWT refresh token string
 * @returns {object} - Decoded payload
 */
export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

/**
 * Decode a token without verifying signature (useful to read userId even if expired)
 * @param {string} token - JWT string
 * @returns {object|null} - Decoded payload
 */
export const decodeToken = (token) => {
  return jwt.decode(token);
};
