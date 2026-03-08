import { Router } from 'express';
import mongoose from 'mongoose';
import { ApiResponse } from '../utils/ApiResponse.js';

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags: [System]
 *     summary: Liveness / readiness probe
 *     responses:
 *       200:
 *         description: Service is up and reports its database connectivity
 */
router.get('/health', (_req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  ApiResponse.ok(res, {
    status: 'ok',
    uptime: process.uptime(),
    db: dbStates[mongoose.connection.readyState] ?? 'unknown',
  });
});

export default router;
