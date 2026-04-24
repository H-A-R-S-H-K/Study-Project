import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import vehicleRoutes from './vehicle.routes.js';
import driverRoutes from './driver.routes.js';
import discoveryRoutes from './discovery.routes.js';
import requestRoutes from './request.routes.js';
import offerRoutes from './offer.routes.js';

/**
 * Root API router. Feature routers (auth, users, vehicles, requests, offers,
 * chats, ratings, notifications, admin) are mounted here in later phases.
 */
const router = Router();

router.use(healthRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/drivers', driverRoutes);
router.use('/discovery', discoveryRoutes);
router.use('/requests', requestRoutes);
router.use('/offers', offerRoutes);

// Phase 7+ →
// router.use('/vehicles', vehicleRoutes);
// router.use('/requests', requestRoutes);
// router.use('/offers', offerRoutes);
// router.use('/chats', chatRoutes);
// router.use('/ratings', ratingRoutes);
// router.use('/notifications', notificationRoutes);
// router.use('/admin', adminRoutes);

export default router;
