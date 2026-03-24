import { buildApp } from './app';
import { connectDatabase } from './config/db';
import { env } from './config/env';

async function start() {
  const app = await buildApp();

  await connectDatabase();

  await app.listen({
    host: '0.0.0.0',
    port: env.PORT
  });

  app.log.info(`Server running on port ${env.PORT}`);
}

start().catch((error) => {
  console.error(error);
  process.exit(1);
});
