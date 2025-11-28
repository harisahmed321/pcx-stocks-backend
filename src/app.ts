import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { config } from './config/index.js';
import { errorHandler, notFoundHandler } from './utils/errorHandler.js';
import { logger } from './utils/logger.js';

// Import routes
import authRoutes from './modules/auth/auth.routes.js';
import usersRoutes from './modules/users/users.routes.js';
import portfoliosRoutes from './modules/portfolios/portfolios.routes.js';
import holdingsRoutes from './modules/holdings/holdings.routes.js';
import transactionsRoutes from './modules/transactions/transactions.routes.js';
import watchlistsRoutes from './modules/watchlists/watchlists.routes.js';
import alertsRoutes from './modules/alerts/alerts.routes.js';
import marketRoutes from './modules/market/market.routes.js';
import symbolsRoutes from './modules/symbols/symbols.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import taxRoutes from './modules/tax/tax.routes.js';

export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(
    cors({
      origin: config.cors.origin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      exposedHeaders: ['Content-Type', 'Authorization']
    })
  );

  // Body parser
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Logging
  if (config.env === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(
      morgan('combined', {
        stream: {
          write: (message: string) => logger.info(message.trim())
        }
      })
    );
  }

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 1000, // Increased limit for testing
    message: 'Too many requests from this IP, please try again later'
  });

  app.use('/api/', limiter);

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime()
    });
  });

  // API routes
  const apiRouter = express.Router();

  apiRouter.use('/auth', authRoutes);
  apiRouter.use('/users', usersRoutes);
  apiRouter.use('/portfolios', portfoliosRoutes);
  apiRouter.use('/holdings', holdingsRoutes);
  apiRouter.use('/transactions', transactionsRoutes);
  apiRouter.use('/watchlists', watchlistsRoutes);
  apiRouter.use('/alerts', alertsRoutes);
  apiRouter.use('/market', marketRoutes);
  apiRouter.use('/symbols', symbolsRoutes);
  apiRouter.use('/admin', adminRoutes);
  apiRouter.use('/tax', taxRoutes);

  app.use(`/api/${config.apiVersion}`, apiRouter);

  // 404 handler
  app.use(notFoundHandler);

  // Error handler
  app.use(errorHandler);

  return app;
}
