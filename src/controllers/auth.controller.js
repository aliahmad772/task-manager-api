import * as authService from '../services/auth.service.js';

const getCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});

/**
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    const user = await authService.registerUser({ name, email, password });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const userAgent = req.headers['user-agent'] || 'Unknown Device';
    const ip = req.ip || req.connection?.remoteAddress || 'Unknown IP';

    const { user, accessToken, refreshToken } = await authService.loginUser({
      email,
      password,
      userAgent,
      ip,
    });

    res.cookie('refreshToken', refreshToken, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      accessToken,
      user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/refresh-token
 */
export const refreshToken = async (req, res, next) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token cookie is missing',
      });
    }

    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshTokens(token);

    res.cookie('refreshToken', newRefreshToken, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: 'Access token refreshed successfully',
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    const accessToken = req.token;
    const currentRefreshToken = req.cookies.refreshToken;

    await authService.logout({
      accessToken,
      refreshToken: currentRefreshToken,
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully from this device',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/auth/logout-all
 */
export const logoutAll = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const accessToken = req.token;

    await authService.logoutAll({
      userId,
      accessToken,
    });

    res.clearCookie('refreshToken', {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully from all devices',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/auth/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const user = await authService.getUserProfile(req.user.userId);

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    next(error);
  }
};
