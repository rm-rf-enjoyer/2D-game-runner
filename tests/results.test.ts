import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { getLocalRecords, getTopLocalRecords } from '../src/services/records/localRepository.ts';

class MemoryStorage {
  private readonly data = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

beforeEach(() => {
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: new MemoryStorage(),
  });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage');
});

test('legacy results are migrated and read back', () => {
  localStorage.setItem(
    'runGame:results',
    JSON.stringify([
      { name: 'HERO', score: '12 m', savedAt: '2026-01-01T00:00:00.000Z' },
      { name: 'BOB', score: '30 m', savedAt: '2026-01-02T00:00:00.000Z' },
    ])
  );

  const records = getLocalRecords();
  assert.equal(records.length, 2);
  assert.equal(records[0].name, 'HERO');
  assert.equal(records[0].scoreMeters, 12);
  assert.equal(records[1].scoreMeters, 30);
  assert.ok(records[0].savedAt);
});

test('corrupted stored records are ignored', () => {
  localStorage.setItem('runGame:records.v1', '{broken');
  assert.deepEqual(getLocalRecords(), []);
});

test('top results are sorted by score and limited', () => {
  localStorage.setItem(
    'runGame:records.v1',
    JSON.stringify([
      {
        id: '1',
        name: 'first',
        scoreMeters: 12,
        savedAt: '2026-01-01T00:00:00.000Z',
        syncedAt: null,
      },
      {
        id: '2',
        name: 'best',
        scoreMeters: 30,
        savedAt: '2026-01-02T00:00:00.000Z',
        syncedAt: null,
      },
      {
        id: '3',
        name: 'middle',
        scoreMeters: 20,
        savedAt: '2026-01-03T00:00:00.000Z',
        syncedAt: null,
      },
    ])
  );

  assert.deepEqual(
    getTopLocalRecords(2).map((record) => record.name),
    ['best', 'middle']
  );
  assert.deepEqual(getTopLocalRecords(0), []);
});
