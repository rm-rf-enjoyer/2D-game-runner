import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import Fastify from 'fastify';
import { getCorsOrigins, loadEnv, type Env } from './config/env.ts';
import { createDatabase, type DatabaseHandle } from './db/client.ts';
import { setErrorHandler } from './plugins/errorHandler.ts';
import { recordsRoutes } from './modules/records/routes.ts';
import { RecordsRepository } from './modules/records/repository.ts';
import { RecordsService, type RecordsServiceLike } from './modules/records/service.ts';

export interface BuildAppOptions {
  env?: Env;
  databaseHandle?: DatabaseHandle;
  recordsService?: RecordsServiceLike;
}

export async function buildApp(options: BuildAppOptions = {}) {
  const env = options.env ?? loadEnv();
  const app = Fastify({ logger: env.NODE_ENV === 'test' ? false : { level: env.LOG_LEVEL } });

  setErrorHandler(app);

  await app.register(cors, { origin: getCorsOrigins(env) });
  await app.register(helmet);
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
  });
  let service = options.recordsService;

  if (!service) {
    const handle = options.databaseHandle ?? createDatabase(env.DATABASE_URL);
    service = new RecordsService(new RecordsRepository(handle.db), env.SYNC_BATCH_LIMIT);

    if (!options.databaseHandle) {
      app.addHook('onClose', async () => {
        await handle.client.end();
      });
    }
  }

  const recordsService: RecordsServiceLike = service;
  await app.register(recordsRoutes, { service: recordsService });

  app.get('/health', async () => ({ status: 'ok' }));
  app.get('/ready', async () => {
    await recordsService.getTop(1);
    return { status: 'ready' };
  });

  return app;
}
