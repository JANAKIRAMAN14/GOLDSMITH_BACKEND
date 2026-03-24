import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes';
import { goldRateRoutes } from './goldRate.routes';
import { recordRoutes } from './record.routes';

export async function registerRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ ok: true }));

  await app.register(authRoutes, { prefix: '/api/auth' });
  await app.register(goldRateRoutes, { prefix: '/api/gold-rate' });
  await app.register(recordRoutes, { prefix: '/api/records' });
}
