import { Router } from 'express';
import * as ctrl from '../controllers/offer.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { offerIdParams } from '../validators/offer.validators.js';
import { UserRole } from '../types/enums.js';

/** A provider's own offers. Request-scoped offer actions live under /requests. */
const router = Router();
router.use(authenticate, authorize(UserRole.VEHICLE_OWNER, UserRole.DRIVER));

/**
 * @openapi
 * /offers/mine:
 *   get:
 *     tags: [Offers]
 *     summary: My sent offers (provider), paginated
 *     responses: { 200: { description: Offers } }
 */
router.get('/mine', ctrl.listMyOffers);

/**
 * @openapi
 * /offers/{id}/withdraw:
 *   post:
 *     tags: [Offers]
 *     summary: Withdraw a pending offer (provider)
 *     responses: { 200: { description: Withdrawn } }
 */
router.post('/:id/withdraw', validate({ params: offerIdParams }), ctrl.withdrawOffer);

export default router;
