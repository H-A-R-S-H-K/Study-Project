import express, { type Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { globalRateLimiter } from './middlewares/rateLimiter.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { notFoundHandler } from './middlewares/notFound.middleware.js';
import apiRouter from './routes/index.js';

/**
 * Builds and configures the Express application. Kept separate from `server.ts`
 * so tests can import a fully-wired app without opening a port or DB connection.
 */
export function createApp(): Application {
  const app = express();

  // Trust the first proxy (needed for correct client IPs behind a load balancer).
  app.set('trust proxy', 1);

  // ── Security & hardening ──────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGINS.length ? env.CORS_ORIGINS : true,
      credentials: true,
    }),
  );

  // ── Body parsing ──────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ── Sanitisation (strip $ and . from keys → NoSQL-injection defence) ──
  app.use(mongoSanitize());

  // ── Performance & observability ───────────────────────
  app.use(compression());
  app.use(pinoHttp({ logger }));

  // ── Rate limiting ─────────────────────────────────────
  app.use(globalRateLimiter);

  // ── Routes ────────────────────────────────────────────
  app.use(env.API_PREFIX, apiRouter);

  // ── 404 + centralised error handling (must be last) ───
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
