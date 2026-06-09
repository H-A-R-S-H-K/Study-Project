import { Router } from 'express';
import * as ctrl from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { authRateLimiter } from '../middlewares/rateLimiter.js';
import {
  adminLoginSchema,
  listUsersQuery,
  setUserStatusSchema,
  verifyDocumentSchema,
  idParams,
  listQuery,
} from '../validators/admin.validators.js';
import { UserRole } from '../types/enums.js';

const router = Router();

/**
 * @openapi
 * /admin/auth/login:
 *   post:
 *     tags: [Admin]
 *     summary: Admin login with email + password
 *     security: []
 *     responses: { 200: { description: Tokens + admin user } }
 */
router.post('/auth/login', authRateLimiter, validate({ body: adminLoginSchema }), ctrl.login);

// Everything below requires an authenticated admin.
router.use(authenticate, authorize(UserRole.ADMIN));

router.get('/stats', ctrl.stats);

router.get('/users', validate({ query: listUsersQuery }), ctrl.listUsers);
router.patch(
  '/users/:id/status',
  validate({ params: idParams, body: setUserStatusSchema }),
  ctrl.setUserStatus,
);

router.get('/documents', validate({ query: listQuery }), ctrl.documentQueue);
router.patch(
  '/documents/:id/verify',
  validate({ params: idParams, body: verifyDocumentSchema }),
  ctrl.verifyDocument,
);

router.get('/vehicles', validate({ query: listQuery }), ctrl.listVehicles);
router.get('/requests', validate({ query: listQuery }), ctrl.listRequests);

export default router;
