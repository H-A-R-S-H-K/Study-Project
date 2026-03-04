import pino from 'pino';
import { env, isProd } from './env.js';

/**
 * Structured JSON logging in production (machine-parseable, ships to log
 * aggregators); pretty, colourised output in development.
 */
export const logger = pino({
  level: isProd ? 'info' : 'debug',
  transport: isProd
    ? undefined
    : {
        target: 'pino-pretty',
        options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
      },
  base: { env: env.NODE_ENV },
  redact: {
    // Never log secrets or tokens, even by accident.
    paths: ['req.headers.authorization', '*.password', '*.otp', '*.refreshToken'],
    remove: true,
  },
});
