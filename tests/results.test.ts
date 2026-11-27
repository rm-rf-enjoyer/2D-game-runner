import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import { getResults, getTopResults, saveResult } from '../src/utils/results.ts';

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

test('saved results are appended and read back', () => {
  assert.deepEqual(getResults(), []);

  saveResult('HERO', '12 m');
  saveResult('BOB', '30 m');

  const results = getResults();
  assert.equal(results.length, 2);
  assert.equal(results[0].name, 'HERO');
  assert.equal(results[0].score, '12 m');
  assert.equal(results[1].name, 'BOB');
  assert.ok(results[0].savedAt);
});

test('corrupted stored results are ignored', () => {
  localStorage.setItem('runGame:results', '{broken');

  assert.deepEqual(getResults(), []);

  saveResult('HERO', '5 m');
  assert.equal(getResults().length, 1);
});

test('top results are sorted by score and limited', () => {
  localStorage.setItem(
    'runGame:results',
    JSON.stringify([
      { name: 'first', score: '12 m', savedAt: '2026-01-01T00:00:00.000Z' },
      { name: 'best', score: '30 m', savedAt: '2026-01-02T00:00:00.000Z' },
      { name: 'middle', score: '20 m', savedAt: '2026-01-03T00:00:00.000Z' },
    ])
  );

  assert.deepEqual(
    getTopResults(2).map((result) => result.name),
    ['best', 'middle']
  );
  assert.deepEqual(getTopResults(0), []);
});
