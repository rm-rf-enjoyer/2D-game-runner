import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { NewRecordRow } from '../../src/db/schema.ts';
import { BatchTooLargeError, InvalidRecordsError } from '../../src/modules/records/errors.ts';
import type { RecordsRepositoryLike } from '../../src/modules/records/repository.ts';
import { RecordsService } from '../../src/modules/records/service.ts';
import type { LeaderboardEntry } from '../../src/modules/records/types.ts';

class FakeRepository implements RecordsRepositoryLike {
  public readonly rows: NewRecordRow[] = [];
  public lastLimit = 0;

  public async insertMany(rows: NewRecordRow[]): Promise<string[]> {
    const accepted: string[] = [];

    for (const row of rows) {
      if (this.rows.some((existing) => existing.id === row.id)) continue;
      this.rows.push(row);
      accepted.push(row.id);
    }

    return accepted;
  }

  public async findTop(limit: number): Promise<LeaderboardEntry[]> {
    this.lastLimit = limit;

    return this.rows
      .slice()
      .sort((a, b) => b.scoreMeters - a.scoreMeters || a.savedAt.getTime() - b.savedAt.getTime())
      .slice(0, limit)
      .map((row) => ({
        id: row.id,
        name: row.name,
        scoreMeters: row.scoreMeters,
        savedAt: row.savedAt.toISOString(),
      }));
  }
}

const firstId = '11111111-1111-4111-8111-111111111111';
const secondId = '22222222-2222-4222-8222-222222222222';

function record(id: string, name: string, scoreMeters: number) {
  return { id, name, scoreMeters, savedAt: '2026-01-01T00:00:00.000Z' };
}

test('ingest normalizes names and reports duplicates', async () => {
  const repository = new FakeRepository();
  const service = new RecordsService(repository, 10);
  const payload = { records: [record(firstId, ' Neo  Runner ', 120)] };

  const first = await service.ingest(payload);
  const second = await service.ingest(payload);

  assert.deepEqual(first, { acceptedIds: [firstId], duplicates: [] });
  assert.deepEqual(second, { acceptedIds: [], duplicates: [firstId] });
  assert.equal(repository.rows[0].name, 'neo runner');
});

test('ingest rejects malformed payloads', async () => {
  const service = new RecordsService(new FakeRepository(), 10);
  const payload = { records: [{ ...record('not-a-uuid', 'neo', 10) }] };

  await assert.rejects(() => service.ingest(payload), InvalidRecordsError);
});

test('ingest enforces the configured batch limit', async () => {
  const service = new RecordsService(new FakeRepository(), 2);
  const payload = {
    records: [
      record(firstId, 'a', 1),
      record(secondId, 'b', 2),
      record(crypto.randomUUID(), 'c', 3),
    ],
  };

  await assert.rejects(() => service.ingest(payload), BatchTooLargeError);
});

test('getTop clamps the requested limit', async () => {
  const repository = new FakeRepository();
  const service = new RecordsService(repository, 10);

  await repository.insertMany([
    { id: firstId, name: 'low', scoreMeters: 1, savedAt: new Date('2026-01-01T00:00:00.000Z') },
    { id: secondId, name: 'high', scoreMeters: 9, savedAt: new Date('2026-01-02T00:00:00.000Z') },
  ]);

  const top = await service.getTop(999);

  assert.equal(repository.lastLimit, 50);
  assert.deepEqual(
    top.map((entry) => entry.name),
    ['high', 'low']
  );
});
