import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { buildApp } from '../../src/app.ts';
import { loadEnv } from '../../src/config/env.ts';
import { createDatabase } from '../../src/db/client.ts';

const firstId = '11111111-1111-4111-8111-111111111111';
const secondId = '22222222-2222-4222-8222-222222222222';

test('records api persists, deduplicates and ranks results', async (t) => {
  const container = await new PostgreSqlContainer('postgres:17-alpine').start();
  t.after(async () => {
    await container.stop();
  });

  const connectionUri = container.getConnectionUri();
  const handle = createDatabase(connectionUri, 1);
  await migrate(handle.db, { migrationsFolder: './drizzle' });
  t.after(async () => {
    await handle.client.end();
  });

  const env = loadEnv({
    ...process.env,
    NODE_ENV: 'test',
    DATABASE_URL: connectionUri,
    CORS_ORIGIN: '*',
    RATE_LIMIT_MAX: '1000',
  });

  const app = await buildApp({ env, databaseHandle: handle });
  t.after(async () => {
    await app.close();
  });

  const payload = {
    records: [{ id: firstId, name: 'Neo', scoreMeters: 120, savedAt: '2026-01-01T00:00:00.000Z' }],
  };

  const first = await app.inject({ method: 'POST', url: '/v1/records/batch', payload });
  assert.equal(first.statusCode, 201);
  assert.deepEqual(first.json(), { acceptedIds: [firstId], duplicates: [] });

  const duplicate = await app.inject({ method: 'POST', url: '/v1/records/batch', payload });
  assert.equal(duplicate.statusCode, 201);
  assert.deepEqual(duplicate.json(), { acceptedIds: [], duplicates: [firstId] });

  const second = await app.inject({
    method: 'POST',
    url: '/v1/records/batch',
    payload: {
      records: [
        { id: secondId, name: 'Trinity', scoreMeters: 240, savedAt: '2026-01-02T00:00:00.000Z' },
      ],
    },
  });
  assert.equal(second.statusCode, 201);

  const top = await app.inject({ method: 'GET', url: '/v1/records/top?limit=10' });
  assert.equal(top.statusCode, 200);
  assert.deepEqual(
    top.json().records.map((row: { name: string }) => row.name),
    ['trinity', 'neo']
  );

  const health = await app.inject({ method: 'GET', url: '/health' });
  assert.equal(health.statusCode, 200);

  const ready = await app.inject({ method: 'GET', url: '/ready' });
  assert.equal(ready.statusCode, 200);
});
