import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildApp } from '../../src/app.ts';
import { loadEnv } from '../../src/config/env.ts';
import type { LeaderboardEntry, IngestResult } from '../../src/modules/records/types.ts';

const env = loadEnv({
  NODE_ENV: 'test',
  DATABASE_URL: 'postgres://user:password@localhost:5432/wavepunk',
  CORS_ORIGIN: '*',
});

class FakeService {
  public payloads: unknown[] = [];

  public async ingest(payload: unknown): Promise<IngestResult> {
    this.payloads.push(payload);
    return { acceptedIds: ['11111111-1111-4111-8111-111111111111'], duplicates: [] };
  }

  public async getTop(limit: number): Promise<LeaderboardEntry[]> {
    return [
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: 'neo',
        scoreMeters: 120,
        savedAt: '2026-01-01T00:00:00.000Z',
      },
    ].slice(0, limit);
  }
}

test('batch and top endpoints return normalized responses', async (t) => {
  const service = new FakeService();
  const app = await buildApp({ env, recordsService: service });
  t.after(async () => {
    await app.close();
  });

  const post = await app.inject({
    method: 'POST',
    url: '/v1/records/batch',
    payload: {
      records: [
        {
          id: '11111111-1111-4111-8111-111111111111',
          name: 'neo',
          scoreMeters: 120,
          savedAt: '2026-01-01T00:00:00.000Z',
        },
      ],
    },
  });

  assert.equal(post.statusCode, 201);
  assert.deepEqual(post.json(), {
    acceptedIds: ['11111111-1111-4111-8111-111111111111'],
    duplicates: [],
  });
  assert.equal(service.payloads.length, 1);

  const top = await app.inject({ method: 'GET', url: '/v1/records/top?limit=5' });
  assert.equal(top.statusCode, 200);
  assert.equal(top.json().records[0].name, 'neo');
});

test('invalid query parameters return 400', async (t) => {
  const app = await buildApp({ env, recordsService: new FakeService() });
  t.after(async () => {
    await app.close();
  });

  const response = await app.inject({ method: 'GET', url: '/v1/records/top?limit=0' });

  assert.equal(response.statusCode, 400);
  assert.equal(response.json().error.code, 'INVALID_QUERY');
});
