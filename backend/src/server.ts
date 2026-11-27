import 'dotenv/config';
import { buildApp } from './app.ts';
import { loadEnv } from './config/env.ts';

const env = loadEnv();
const app = await buildApp({ env });

const shutdown = async (): Promise<void> => {
  await app.close();
  process.exit(0);
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

try {
  await app.listen({ host: env.HOST, port: env.PORT });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
