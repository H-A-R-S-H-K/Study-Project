import { Router } from 'express';
import * as ctrl from '../controllers/driver.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { uploadDocument } from '../middlewares/upload.middleware.js';
import {
  upsertDriverSchema,
  driverAvailabilitySchema,
} from '../validators/driver.validators.js';
import { UserRole } from '../types/enums.js';

/** All driver-profile routes require an authenticated driver. */
const router = Router();
router.use(authenticate, authorize(UserRole.DRIVER));

/**
 * @openapi
 * /drivers/me:
 *   get: { tags: [Drivers], summary: Get my driver profile, responses: { 200: { description: OK } } }
 *   put: { tags: [Drivers], summary: Create or update my driver profile, responses: { 200: { description: Saved } } }
 */
router
  .route('/me')
  .get(ctrl.getMyDriverProfile)
  .put(validate({ body: upsertDriverSchema }), ctrl.upsertMyDriverProfile);

router.patch(
  '/me/availability',
  validate({ body: driverAvailabilitySchema }),
  ctrl.setDriverAvailability,
);

/**
 * @openapi
 * /drivers/me/license:
 *   post:
 *     tags: [Drivers]
 *     summary: Upload driving license (multipart, field "document")
 *     responses: { 200: { description: License uploaded, pending verification } }
 */
router.post('/me/license', uploadDocument, ctrl.uploadLicense);

router.get('/me/documents', ctrl.listMyDocuments);

export default router;
