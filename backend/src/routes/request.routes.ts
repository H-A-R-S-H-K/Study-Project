import { Router } from 'express';
import * as ctrl from '../controllers/request.controller.js';
import * as offerCtrl from '../controllers/offer.controller.js';
import * as ratingCtrl from '../controllers/rating.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import {
  createRequestSchema,
  cancelRequestSchema,
  requestIdParams,
  feedQuerySchema,
  historyQuerySchema,
} from '../validators/request.validators.js';
import {
  createOfferSchema,
  requestOfferParams,
  requestIdOnlyParams,
} from '../validators/offer.validators.js';
import { rateSchema, ratingRequestParams } from '../validators/rating.validators.js';
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

// ── Offers on a request ───────────────────────────────

/**
 * @openapi
 * /requests/{requestId}/offers:
 *   post:
 *     tags: [Offers]
 *     summary: Send a priced offer on a request (provider). Price is manual.
 *     responses: { 201: { description: Offer sent } }
 *   get:
 *     tags: [Offers]
 *     summary: List offers on my request (customer)
 *     responses: { 200: { description: Offers with provider + vehicle } }
 */
router.post(
  '/:requestId/offers',
  authorize(UserRole.VEHICLE_OWNER, UserRole.DRIVER),
  validate({ params: requestIdOnlyParams, body: createOfferSchema }),
  offerCtrl.createOffer,
);
router.get(
  '/:requestId/offers',
  authorize(UserRole.CUSTOMER),
  validate({ params: requestIdOnlyParams }),
  offerCtrl.listRequestOffers,
);

/**
 * @openapi
 * /requests/{requestId}/offers/{offerId}/accept:
 *   post:
 *     tags: [Offers]
 *     summary: Accept an offer (customer) → matches the request and opens a chat
 *     responses: { 200: { description: Accepted, chat opened } }
 */
router.post(
  '/:requestId/offers/:offerId/accept',
  authorize(UserRole.CUSTOMER),
  validate({ params: requestOfferParams }),
  offerCtrl.acceptOffer,
);

/**
 * @openapi
 * /requests/{requestId}/complete:
 *   post:
 *     tags: [Requests]
 *     summary: Mark a matched job complete (customer or matched provider)
 *     responses: { 200: { description: Completed } }
 */
router.post(
  '/:requestId/complete',
  validate({ params: requestIdOnlyParams }),
  offerCtrl.completeRequest,
);

// ── Ratings on a completed request ────────────────────

/**
 * @openapi
 * /requests/{requestId}/ratings:
 *   post:
 *     tags: [Ratings]
 *     summary: Rate the other party after completion (customer or provider)
 *     responses: { 201: { description: Rating saved } }
 */
router.post(
  '/:requestId/ratings',
  validate({ params: ratingRequestParams, body: rateSchema }),
  ratingCtrl.rate,
);

/**
 * @openapi
 * /requests/{requestId}/rating-status:
 *   get:
 *     tags: [Ratings]
 *     summary: Whether the caller can rate this job (and who they'd rate)
 *     responses: { 200: { description: Rating status } }
 */
router.get(
  '/:requestId/rating-status',
  validate({ params: ratingRequestParams }),
  ratingCtrl.ratingStatus,
);

export default router;
