import { Router } from 'express';
import * as ctrl from '../controllers/discovery.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';
import { validate } from '../middlewares/validate.middleware.js';
import { nearbyQuerySchema } from '../validators/discovery.validators.js';

/**
 * Read-only geo discovery for the map. Any authenticated user may search;
 * customers use it to see providers, and it powers the "view nearby available
 * providers" feature. Distance is returned for display only.
 */
const router = Router();
router.use(authenticate);

/**
 * @openapi
 * /discovery/vehicles/nearby:
 *   get:
 *     tags: [Discovery]
 *     summary: Available vehicles near a point (2dsphere), nearest first
 *     parameters:
 *       - { in: query, name: lng, required: true, schema: { type: number } }
 *       - { in: query, name: lat, required: true, schema: { type: number } }
 *       - { in: query, name: radius, schema: { type: integer }, description: metres }
 *       - { in: query, name: type, schema: { type: string }, description: vehicle type }
 *     responses: { 200: { description: List of nearby vehicles with distanceMeters } }
 */
router.get('/vehicles/nearby', validate({ query: nearbyQuerySchema }), ctrl.nearbyVehicles);

/**
 * @openapi
 * /discovery/drivers/nearby:
 *   get:
 *     tags: [Discovery]
 *     summary: Available drivers near a point (optionally filtered by drivable category)
 *     responses: { 200: { description: List of nearby drivers with distanceMeters } }
 */
router.get('/drivers/nearby', validate({ query: nearbyQuerySchema }), ctrl.nearbyDrivers);

/**
 * @openapi
 * /discovery/providers/nearby:
 *   get:
 *     tags: [Discovery]
 *     summary: Combined nearby vehicles + drivers, merged and sorted by distance
 *     responses: { 200: { description: Mixed list of nearby providers } }
 */
router.get('/providers/nearby', validate({ query: nearbyQuerySchema }), ctrl.nearbyProviders);

export default router;
