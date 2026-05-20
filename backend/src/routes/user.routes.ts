import { Router } from 'express';
import * as ctrl from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { uploadAvatar } from '../middlewares/upload.middleware.js';
import {
  updateProfileSchema,
  updateLocationSchema,
  userIdParams,
} from '../validators/user.validators.js';
import { registerDeviceSchema } from '../validators/notification.validators.js';

/** Profile self-service for any authenticated user (all roles). */
const router = Router();

/**
 * @openapi
 * /users/me:
 *   patch:
 *     tags: [Users]
 *     summary: Update my profile (name, email, home address)
 *     responses: { 200: { description: Updated } }
 */
router.patch('/me', authenticate, validate({ body: updateProfileSchema }), ctrl.updateMyProfile);

/**
 * @openapi
 * /users/me/location:
 *   patch:
 *     tags: [Users]
 *     summary: Update my last-known location (drives nearby matching)
 *     responses: { 200: { description: Updated } }
 */
router.patch(
  '/me/location',
  authenticate,
  validate({ body: updateLocationSchema }),
  ctrl.updateMyLocation,
);

/**
 * @openapi
 * /users/me/avatar:
 *   post:
 *     tags: [Users]
 *     summary: Upload profile photo (multipart, field "avatar")
 *     responses: { 200: { description: Avatar updated } }
 */
router.post('/me/avatar', authenticate, uploadAvatar, ctrl.updateMyAvatar);

/**
 * @openapi
 * /users/me/devices:
 *   post:
 *     tags: [Users]
 *     summary: Register this device's FCM token for push notifications
 *     responses: { 200: { description: Registered } }
 */
router.post(
  '/me/devices',
  authenticate,
  validate({ body: registerDeviceSchema }),
  ctrl.registerDevice,
);
router.delete('/me/devices/:token', authenticate, ctrl.unregisterDevice);

/**
 * @openapi
 * /users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get a public user profile
 *     responses: { 200: { description: Public profile } }
 */
router.get('/:id', authenticate, validate({ params: userIdParams }), ctrl.getPublicProfile);

export default router;
