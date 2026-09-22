import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import scenarioRoutes from './routes/scenarioRoutes.js';
import submissionRoutes from './routes/submissionRoutes.js';
import resultRoutes from './routes/resultRoutes.js';
import historyRoutes from './routes/historyRoutes.js';

const app = express();

// Trust reverse proxy (essential for Render, AWS ALB, Nginx to read x-forwarded-for)
app.set('trust proxy', 1);

// Security Headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Multi-Origin CORS Configuration
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, server-to-server health checks)
    if (!origin) return callback(null, true);

    // If wildcard '*' is configured
    if (allowedOrigins.includes('*')) {
      return callback(null, true);
    }

    // Match exact configured origins or localhost/127.0.0.1 in development
    const isAllowed = allowedOrigins.some(allowed => allowed === origin) ||
      (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin));

    if (isAllowed) {
      return callback(null, true);
    }

    const corsError = new Error('Not allowed by CORS');
    corsError.statusCode = 403;
    corsError.code = 'CORS_FORBIDDEN';
    return callback(corsError);
  },
  credentials: true
}));

// Request Body Parsing with strict 100kb limit
app.use(express.json({ limit: '100kb' }));

// General API Rate Limiter: 100 requests per 15 minutes per IP
const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests from this IP. Please try again after 15 minutes.'
      }
    });
  }
});

// Strict Submission Rate Limiter: 15 submissions per 15 minutes per IP
const submissionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      error: {
        code: 'SUBMISSION_RATE_LIMIT_EXCEEDED',
        message: 'Too many email assessments submitted from this IP. Please wait before submitting another.'
      }
    });
  }
});

// Apply general rate limit to all /api routes
app.use('/api', generalRateLimiter);

// Root Health / Info Endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Email Writing Assessment API is running'
  });
});

// Detailed Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Backend is running'
  });
});

// API Routes
app.use('/api/scenarios', scenarioRoutes);
app.use('/api/submissions', submissionRateLimiter, submissionRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/history', historyRoutes);

// Centralized 404 handler for unknown routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
