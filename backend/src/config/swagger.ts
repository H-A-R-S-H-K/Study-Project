import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env.js';

/**
 * OpenAPI 3 definition. Route handlers document themselves with `@openapi` JSDoc
 * blocks (see health.routes.ts); swagger-jsdoc assembles them into a spec served
 * at `${API_PREFIX}/docs` (wired up in Phase 2 alongside the first real routes).
 */
export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Village Transport Connect API',
      version: '0.1.0',
      description:
        'Matchmaking API for rural transport. No fares, no payments — connection only.',
    },
    servers: [{ url: env.API_PREFIX, description: 'API root' }],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: ['src/routes/*.ts', 'src/models/*.ts'],
});
