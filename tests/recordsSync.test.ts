import assert from 'node:assert/strict';
import { afterEach, beforeEach, test } from 'node:test';
import type { RecordsApi } from '../src/services/records/apiClient.ts';
import {
  getLocalRecords,
  getPendingRecords,
  getSyncState,
  saveLocalRecord,
} from '../src/services/records/localRepository.ts';
import { SyncQueue } from '../src/services/records/syncQueue.ts';
import type { LeaderboardEntry, StoredRecord, SyncResult } from '../src/services/records/types.ts';

class MemoryStorage {
  private readonly data = new Map<string, string>();

  public getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }

  public setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
}

class FakeApi implements RecordsApi {
  public readonly calls: StoredRecord[][] = [];
  public fail = false;

  public async sendBatch(records: StoredRecord[]): Promise<SyncResult> {
    this.calls.push(records);
    if (this.fail) throw new Error('offline');
    return { acceptedIds: records.map((record) => record.id), duplicates: [] };
  }

  public async fetchTop(): Promise<LeaderboardEntry[]> {
    return [];
  }
}

let clock = 0;

beforeEach(() => {
  clock = 0;
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: new MemoryStorage(),
  });
});

afterEach(() => {
  Reflect.deleteProperty(globalThis, 'localStorage');
});

function createQueue(api: RecordsApi, batchSize = 50): SyncQueue {
  return new SyncQueue({
    api,
    now: () => clock,
    minBackoffMs: 1000,
    maxBackoffMs: 10_000,
    batchSize,
  });
}

test('successful flush marks local records as synced', async () => {
  const api = new FakeApi();
  saveLocalRecord({ name: 'hero', scoreMeters: 12 });

  await createQueue(api).flush();

  assert.equal(api.calls.length, 1);
  assert.equal(api.calls[0][0].name, 'hero');
  assert.deepEqual(getPendingRecords(), []);
  assert.equal(getLocalRecords()[0].syncedAt, new Date(0).toISOString());
  assert.equal(getSyncState().failCount, 0);
});

test('failed flush respects the persisted backoff', async () => {
  const api = new FakeApi();
  api.fail = true;
  saveLocalRecord({ name: 'hero', scoreMeters: 12 });

  await createQueue(api).flush();
  assert.equal(getSyncState().nextAttemptAt, 1000);

  clock = 500;
  await createQueue(api).flush();
  assert.equal(api.calls.length, 1);

  clock = 1000;
  await createQueue(api).flush();
  assert.equal(api.calls.length, 2);
  assert.equal(getSyncState().failCount, 2);
});

test('large queues are sent in configured batches', async () => {
  const api = new FakeApi();
  saveLocalRecord({ name: 'a', scoreMeters: 1 });
  saveLocalRecord({ name: 'b', scoreMeters: 2 });
  saveLocalRecord({ name: 'c', scoreMeters: 3 });

  await createQueue(api, 2).flush();

  assert.deepEqual(
    api.calls.map((call) => call.length),
    [2, 1]
  );
  assert.deepEqual(getPendingRecords(), []);
});
