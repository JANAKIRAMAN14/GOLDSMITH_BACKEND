import { buildApp } from './app';
import { connectDatabase } from './config/db';
import { env } from './config/env';
import type { FastifyBaseLogger } from 'fastify';

function startKeepAlive(log: FastifyBaseLogger) {
  const url = process.env.RENDER_EXTERNAL_URL;
  if (!url || process.env.NODE_ENV !== 'production') return;

  setInterval(async () => {
    try {
      const res = await fetch(`${url}/health`);
      log.info(`keep-alive ping: ${res.status}`);
    } catch (err) {
      log.error(`keep-alive ping failed: ${(err as Error).message}`);
    }
  }, 10 * 60 * 1000); // every 10 minutes
}
async function start() {
  const app = await buildApp();

  await connectDatabase();

  await app.listen({
    host: '0.0.0.0',
    port: env.PORT
  });
  startKeepAlive(app.log);
  app.log.info(`Server running on port ${env.PORT}`);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
