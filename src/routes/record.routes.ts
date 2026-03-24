import { FastifyInstance } from 'fastify';
import {
  createRecordController,
  deleteRecordController,
  listRecordsController,
  toggleRecordStatusController,
  updateRecordController,
  updateRecordImageController
} from '../controllers/record.controller';

export async function recordRoutes(app: FastifyInstance) {
  app.get('/', { preHandler: [app.authenticate] }, listRecordsController);
  app.post('/', { preHandler: [app.authenticate] }, createRecordController);
  app.patch('/:id', { preHandler: [app.authenticate] }, updateRecordController);
  app.patch('/:id/image', { preHandler: [app.authenticate] }, updateRecordImageController);
  app.patch('/:id/status', { preHandler: [app.authenticate] }, toggleRecordStatusController);
  app.delete('/:id', { preHandler: [app.authenticate] }, deleteRecordController);
}
