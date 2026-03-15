import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.js';
import {
  requestOtpSchema,
  verifyOtpSchema,
  registerSchema,
  refreshSchema,
  logoutSchema,
} from '../validators/auth.validators.js';

const router = Router();

/**
 * @openapi
 * /auth/otp/request:
 *   post:
 *     tags: [Auth]
 *     summary: Send a one-time passcode to a phone number
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone: { type: string, example: "+919876543210" }
 *     responses:
 *       200: { description: OTP sent (dev builds echo the code) }
 *       429: { description: Too many attempts }
 */
router.post(
  '/otp/request',
  authRateLimiter,
  validate({ body: requestOtpSchema }),
  authController.requestOtp,
);

/**
 * @openapi
 * /auth/otp/verify:
 *   post:
 *     tags: [Auth]
 *     summary: Verify an OTP — logs in an existing user or returns a registration token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, code]
 *             properties:
 *               phone: { type: string }
 *               code:  { type: string, example: "123456" }
 *     responses:
 *       200: { description: Verified }
 *       400: { description: Incorrect or expired code }
 */
router.post(
  '/otp/verify',
  authRateLimiter,
  validate({ body: verifyOtpSchema }),
  authController.verifyOtp,
);

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Create an account using a registration token from OTP verification
 *     security: []
 *     responses:
 *       201: { description: Account created }
 *       409: { description: Phone already registered }
 */
router.post('/register', validate({ body: registerSchema }), authController.register);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate a refresh token and issue a new access/refresh pair
 *     security: []
 *     responses:
 *       200: { description: New token pair }
 *       401: { description: Invalid/expired/reused refresh token }
 */
router.post('/refresh', validate({ body: refreshSchema }), authController.refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke a single refresh token (current device)
 *     security: []
 *     responses:
 *       200: { description: Logged out }
 */
router.post('/logout', validate({ body: logoutSchema }), authController.logout);

/**
 * @openapi
 * /auth/logout-all:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke every active session for the current user
 *     responses:
 *       200: { description: Logged out everywhere }
 */
router.post('/logout-all', authenticate, authController.logoutAll);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get the current authenticated user
 *     responses:
 *       200: { description: Current user }
 *       401: { description: Unauthenticated }
 */
router.get('/me', authenticate, authController.me);

export default router;
