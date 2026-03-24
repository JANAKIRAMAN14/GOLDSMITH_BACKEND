import { FastifyInstance } from 'fastify';
import {
  loginController,
  logoutController,
  meController,
  refreshController,
  signupController
} from '../controllers/auth.controller';

const strictRateLimit = {
  config: {
    rateLimit: {
      max: 5,
      timeWindow: '1 minute'
    }
  }
};

export async function authRoutes(app: FastifyInstance) {
  app.post('/signup', strictRateLimit, signupController);
  app.post('/login', strictRateLimit, loginController);
  app.post('/refresh', refreshController);
  app.post('/logout', logoutController);
  app.get('/me', { preHandler: [app.authenticate] }, meController);
}
