import { Router } from 'express';
import * as ctrl from '../controllers/vehicle.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { uploadImages, uploadDocument } from '../middlewares/upload.middleware.js';
import {
  createVehicleSchema,
  updateVehicleSchema,
  availabilitySchema,
  vehicleIdParams,
} from '../validators/vehicle.validators.js';
import { UserRole } from '../types/enums.js';

/**
 * All vehicle routes require an authenticated vehicle-owner. Ownership of the
 * specific vehicle is enforced in the service layer.
 */
const router = Router();
router.use(authenticate, authorize(UserRole.VEHICLE_OWNER));

/**
 * @openapi
 * /vehicles:
 *   post:
 *     tags: [Vehicles]
 *     summary: Add a vehicle (vehicle owner)
 *     responses: { 201: { description: Vehicle created } }
 *   get:
 *     tags: [Vehicles]
 *     summary: List my vehicles (paginated)
 *     responses: { 200: { description: List of vehicles } }
 */
router
  .route('/')
  .post(validate({ body: createVehicleSchema }), ctrl.createVehicle)
  .get(ctrl.listMyVehicles);

/**
 * @openapi
 * /vehicles/{id}:
 *   get:    { tags: [Vehicles], summary: Get one of my vehicles, responses: { 200: { description: OK } } }
 *   patch:  { tags: [Vehicles], summary: Update a vehicle, responses: { 200: { description: Updated } } }
 *   delete: { tags: [Vehicles], summary: Remove (soft-delete) a vehicle, responses: { 200: { description: Removed } } }
 */
router
  .route('/:id')
  .get(validate({ params: vehicleIdParams }), ctrl.getVehicle)
  .patch(validate({ params: vehicleIdParams, body: updateVehicleSchema }), ctrl.updateVehicle)
  .delete(validate({ params: vehicleIdParams }), ctrl.deleteVehicle);

router.patch(
  '/:id/availability',
  validate({ params: vehicleIdParams, body: availabilitySchema }),
  ctrl.setVehicleAvailability,
);

/**
 * @openapi
 * /vehicles/{id}/images:
 *   post:
 *     tags: [Vehicles]
 *     summary: Upload up to 8 images (multipart, field "images")
 *     responses: { 200: { description: Images uploaded } }
 */
router.post(
  '/:id/images',
  validate({ params: vehicleIdParams }),
  uploadImages,
  ctrl.uploadVehicleImages,
);

/**
 * @openapi
 * /vehicles/{id}/registration:
 *   post:
 *     tags: [Vehicles]
 *     summary: Upload the registration document (multipart, field "document")
 *     responses: { 200: { description: Document uploaded, pending verification } }
 */
router.post(
  '/:id/registration',
  validate({ params: vehicleIdParams }),
  uploadDocument,
  ctrl.uploadVehicleRegistration,
);

export default router;
