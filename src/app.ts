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
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'res.headers["set-cookie"]'
        ],
        remove: true
      }
    }
  });

  // 🔐 Security headers
  await app.register(helmet, {
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
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

  // 🌐 CORS configuration
  await app.register(cors, {
    origin: (origin, callback) => {
      // Allow non-browser requests (Postman, curl)
      if (!origin) return callback(null, true);

      const normalizedOrigin = origin.replace(/\/+$/, '');

      const allowedOrigins = [
        'https://goldsmithss.netlify.app'
      ];

      if (allowedOrigins.includes(normalizedOrigin) || env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  });

  // 📦 File upload
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
    const err = error as {
      statusCode?: number;
      message?: string;
      stack?: string;
    };

    request.log.error(err);

    if (env.NODE_ENV === 'production') {
      reply.status(err.statusCode || 500).send({
        message:
          err.statusCode && err.statusCode < 500
            ? err.message
            : 'Internal server error'
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