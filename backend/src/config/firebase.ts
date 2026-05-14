import { readFileSync } from 'node:fs';
import admin from 'firebase-admin';
import { env } from './env.js';
import { logger } from './logger.js';

/**
 * Firebase Admin is initialised only if a service-account file is configured and
 * readable. When it isn't (local dev), `isFirebaseConfigured` stays false and
 * the push service degrades to a no-op — notifications are still persisted and
 * delivered in-app over the socket, just not pushed to devices.
 */
let configured = false;

try {
  if (env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const serviceAccount = JSON.parse(
      readFileSync(env.FIREBASE_SERVICE_ACCOUNT_PATH, 'utf-8'),
    ) as admin.ServiceAccount;
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    configured = true;
    logger.info('Firebase Admin initialised');
  } else {
    logger.warn('FIREBASE_SERVICE_ACCOUNT_PATH not set — push notifications disabled');
  }
} catch (err) {
  logger.warn({ err }, 'Firebase Admin init failed — push notifications disabled');
}

export const isFirebaseConfigured = configured;
export { admin };
