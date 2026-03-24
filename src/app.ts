import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import helmet from '@fastify/helmet';
import cookie from '@fastify/cookie';
import rateLimit from '@fastify/rate-limit';
import { registerRoutes } from './routes';
import { jwtPlugin } from './plugins/jwt';
import { authenticatePlugin } from './plugins/authenticate';
import { env } from './config/env';

export async function buildApp() {
  const app = Fastify({
    logger: {
      level: env.NODE_ENV === 'production' ? 'info' : 'debug',
      redact: {
        paths: ['req.headers.authorization', 'req.headers.cookie', 'res.headers["set-cookie"]'],
        remove: true
      }
    }
  });

  await app.register(helmet, {
    contentSecurityPolicy: false
  });

  await app.register(cookie, {
    secret: env.JWT_SECRET,
    hook: 'onRequest'
  });

  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      message: 'Too many requests, please try again later.'
    })
  });

  await app.register(cors, {
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (env.FRONTEND_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'), false);
    },
    credentials: true
  });

  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
      files: 1
    }
  });

  await jwtPlugin(app);
  await authenticatePlugin(app);
  await registerRoutes(app);

  app.setErrorHandler((error, request, reply) => {
    const err = error as { statusCode?: number; message?: string; stack?: string };
    request.log.error(err);

    if (env.NODE_ENV === 'production') {
      reply.status(err.statusCode || 500).send({
        message: err.statusCode && err.statusCode < 500 ? err.message : 'Internal server error'
      });
      return;
    }

    reply.status(err.statusCode || 500).send({
      message: err.message,
      stack: err.stack
    });
  });

  return app;
}
