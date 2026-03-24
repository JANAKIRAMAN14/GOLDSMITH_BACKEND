import { FastifyInstance } from 'fastify';
import { getTodayGoldRateController, setTodayGoldRateController } from '../controllers/goldRate.controller';

export async function goldRateRoutes(app: FastifyInstance) {
  app.get('/today', { preHandler: [app.authenticate] }, getTodayGoldRateController);
  app.put('/today', { preHandler: [app.authenticate] }, setTodayGoldRateController);
}
