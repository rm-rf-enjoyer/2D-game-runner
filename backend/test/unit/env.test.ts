import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getCorsOrigins, loadEnv } from '../../src/config/env.ts';

const baseEnv = {
  DATABASE_URL: 'postgres://user:password@localhost:5432/wavepunk',
};

test('loadEnv applies defaults and validates the database url', () => {
  const env = loadEnv(baseEnv);

  assert.equal(env.NODE_ENV, 'development');
  assert.equal(env.PORT, 3000);
  assert.equal(env.SYNC_BATCH_LIMIT, 50);
  assert.equal(env.LOG_LEVEL, 'info');
});

test('loadEnv rejects a non-postgres database url', () => {
  assert.throws(() => loadEnv({ ...baseEnv, DATABASE_URL: 'mysql://localhost/db' }));
});

test('getCorsOrigins splits a list and supports wildcard', () => {
  assert.deepEqual(
    getCorsOrigins(loadEnv({ ...baseEnv, CORS_ORIGIN: 'http://a.test, http://b.test' })),
    ['http://a.test', 'http://b.test']
  );
  assert.equal(getCorsOrigins(loadEnv({ ...baseEnv, CORS_ORIGIN: '*' })), true);
});
