import type { FastifyInstance } from 'fastify';
import { topQuerySchema } from './schema.ts';
import type { RecordsServiceLike } from './service.ts';

export interface RecordsRouteOptions {
  service: RecordsServiceLike;
}

const batchBodySchema = {
  type: 'object',
  required: ['records'],
  properties: {
    records: {
      type: 'array',
      minItems: 1,
      maxItems: 100,
      items: { type: 'object' },
    },
  },
} as const;

export async function recordsRoutes(
  app: FastifyInstance,
  options: RecordsRouteOptions
): Promise<void> {
  const { service } = options;

  app.post('/v1/records/batch', { schema: { body: batchBodySchema } }, async (request, reply) => {
    const result = await service.ingest(request.body);
    return reply.code(201).send(result);
  });

  app.get('/v1/records/top', async (request) => {
    const query = topQuerySchema.parse(request.query);
    return { records: await service.getTop(query.limit) };
  });
}
