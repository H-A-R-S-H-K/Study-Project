import { Router } from 'express';
import * as ctrl from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  listNotificationsQuery,
  notificationIdParams,
} from '../validators/notification.validators.js';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: My notifications (in-app inbox), optionally unread-only
 *     responses: { 200: { description: Paginated notifications } }
 */
router.get('/', validate({ query: listNotificationsQuery }), ctrl.listNotifications);

/**
 * @openapi
 * /notifications/unread-count:
 *   get:
 *     tags: [Notifications]
 *     summary: Number of unread notifications (for the badge)
 *     responses: { 200: { description: { count } } }
 */
router.get('/unread-count', ctrl.unreadCount);

router.post('/read-all', ctrl.markAllRead);
router.post('/:id/read', validate({ params: notificationIdParams }), ctrl.markRead);

export default router;
