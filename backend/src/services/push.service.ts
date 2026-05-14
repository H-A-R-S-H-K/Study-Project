import { admin, isFirebaseConfigured } from '../config/firebase.js';
import { userRepository } from '../repositories/user.repository.js';
import { logger } from '../config/logger.js';

export interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Sends FCM pushes to all of a user's registered devices. Invalid/expired tokens
 * reported by FCM are pruned so we stop trying them. A no-op (that still logs)
 * when Firebase isn't configured, so the rest of the app is unaffected in dev.
 */
class PushService {
  async sendToUser(userId: string, payload: PushPayload): Promise<void> {
    if (!isFirebaseConfigured) {
      logger.debug({ userId, title: payload.title }, 'Push skipped (Firebase not configured)');
      return;
    }

    const user = await userRepository.findById(userId, { fcmTokens: 1 });
    const tokens = user?.fcmTokens ?? [];
    if (tokens.length === 0) return;

    try {
      const res = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title: payload.title, body: payload.body },
        data: payload.data ?? {},
        android: { priority: 'high' },
      });

      // Prune tokens FCM reports as unregistered/invalid.
      const stale: string[] = [];
      res.responses.forEach((r, i) => {
        if (!r.success) {
          const code = r.error?.code ?? '';
          if (
            code === 'messaging/registration-token-not-registered' ||
            code === 'messaging/invalid-registration-token'
          ) {
            stale.push(tokens[i]);
          }
        }
      });
      await Promise.all(stale.map((t) => userRepository.removeFcmToken(userId, t)));
    } catch (err) {
      // Never let a push failure break the triggering action.
      logger.error({ err, userId }, 'FCM send failed');
    }
  }
}

export const pushService = new PushService();
