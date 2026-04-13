import { Router } from 'express';
import * as ctrl from '../controllers/request.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createRequestSchema,
  cancelRequestSchema,
  requestIdParams,
  feedQuerySchema,
  historyQuerySchema,
} from '../validators/request.validators.js';
import { UserRole } from '../types/enums.js';

const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /requests:
 *   post:
 *     tags: [Requests]
 *     summary: Post a transport request (customer)
 *     responses: { 201: { description: Request created } }
 *   get:
 *     tags: [Requests]
 *     summary: My request history (customer), filterable by status
 *     responses: { 200: { description: Paginated requests } }
 */
router
  .route('/')
  .post(authorize(UserRole.CUSTOMER), validate({ body: createRequestSchema }), ctrl.createRequest)
  .get(
    authorize(UserRole.CUSTOMER),
    validate({ query: historyQuerySchema }),
    ctrl.listMyRequests,
  );

/**
 * @openapi
 * /requests/feed:
 *   get:
 *     tags: [Requests]
 *     summary: Nearby open requests a provider can fulfil ($geoNear on pickup)
 *     parameters:
 *       - { in: query, name: lng, required: true, schema: { type: number } }
 *       - { in: query, name: lat, required: true, schema: { type: number } }
 *       - { in: query, name: radius, schema: { type: integer } }
 *       - { in: query, name: vehicleType, schema: { type: string } }
 *     responses: { 200: { description: Nearby requests with distance } }
 */
router.get(
  '/feed',
  authorize(UserRole.VEHICLE_OWNER, UserRole.DRIVER),
  validate({ query: feedQuerySchema }),
  ctrl.requestFeed,
);

/**
 * @openapi
 * /requests/{id}:
 *   get:
 *     tags: [Requests]
 *     summary: Get a request (owner, matched provider, or any provider while open)
 *     responses: { 200: { description: Request } }
 */
router.get('/:id', validate({ params: requestIdParams }), ctrl.getRequest);

/**
 * @openapi
 * /requests/{id}/cancel:
 *   post:
 *     tags: [Requests]
 *     summary: Cancel an open/matched request (customer)
 *     responses: { 200: { description: Cancelled } }
 */
router.post(
  '/:id/cancel',
  authorize(UserRole.CUSTOMER),
  validate({ params: requestIdParams, body: cancelRequestSchema }),
  ctrl.cancelRequest,
);

export default router;
