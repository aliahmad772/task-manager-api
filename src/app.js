import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';

const app = express();

// Standard middleware
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Backend Authentication API is running!',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      refreshToken: 'POST /api/auth/refresh-token',
      profile: 'GET /api/auth/profile',
      logout: 'POST /api/auth/logout',
      logoutAll: 'POST /api/auth/logout-all',
    },
  });
});

// Mount authentication routes
app.use('/api/auth', authRoutes);

// 404 Not Found Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found',
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;
