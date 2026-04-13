import { requestRepository } from '../repositories/request.repository.js';
import { logger } from '../config/logger.js';

const INTERVAL_MS = 10 * 60 * 1000; // every 10 minutes

/**
 * Periodically marks open requests whose expiry has passed as `expired`, so the
 * feed never shows stale demand. A single-process interval is fine for now; in a
 * multi-instance deployment this moves to a dedicated scheduler/cron (Phase 12).
 */
export function startRequestExpiryJob(): NodeJS.Timeout {
  const run = async (): Promise<void> => {
    try {
      const count = await requestRepository.expireStale(new Date());
      if (count > 0) logger.info({ count }, 'Expired stale requests');
    } catch (err) {
      logger.error({ err }, 'Request expiry sweep failed');
    }
  };
  void run(); // run once on boot
  const timer = setInterval(() => void run(), INTERVAL_MS);
  timer.unref(); // don't keep the process alive just for this
  return timer;
}
