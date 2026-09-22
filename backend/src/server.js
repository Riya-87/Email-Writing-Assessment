import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB, closeDB } from './config/database.js';
import { evaluationQueue } from './services/concurrencyQueue.js';

const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '0.0.0.0';

/**
 * Validate essential environment configuration on startup.
 */
function validateConfig() {
  const missing = [];
  if (!process.env.MONGODB_URI) missing.push('MONGODB_URI');
  if (!process.env.GEMINI_API_KEY) missing.push('GEMINI_API_KEY');

  if (missing.length > 0) {
    console.warn(`⚠️ Warning: Missing environment variables: ${missing.join(', ')}.`);
    console.warn('Some API features will be degraded until these variables are supplied.');
  }
}

async function startServer() {
  try {
    validateConfig();

    if (process.env.MONGODB_URI) {
      await connectDB();
    } else {
      console.warn('⚠️ Warning: MONGODB_URI is not set. MongoDB operations will fail.');
    }

    const server = app.listen(PORT, HOST, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on http://${HOST}:${PORT}`);
      console.log(`Health check available at http://${HOST}:${PORT}/api/health`);
    });

    // Graceful shutdown handler
    const shutdown = async (signal) => {
      console.log(`\n${signal} received: closing HTTP server and resources...`);
      evaluationQueue.clear();

      server.close(async () => {
        try {
          await closeDB();
          console.log('HTTP server and database connections closed cleanly.');
          process.exit(0);
        } catch (err) {
          console.error('Error during shutdown:', err.message);
          process.exit(1);
        }
      });

      // Force close if graceful shutdown exceeds 10 seconds
      setTimeout(() => {
        console.error('Graceful shutdown timed out. Forcing process exit.');
        process.exit(1);
      }, 10000).unref();
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Promise Rejection:', reason instanceof Error ? reason.message : reason);
    });

    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err.message);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
