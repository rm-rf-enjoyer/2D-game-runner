import { createRecordsApi, type RecordsApi } from './apiClient.ts';
import { getApiBaseUrl } from './apiConfig.ts';
import {
  getGlobalSnapshot,
  getTopLocalRecords,
  saveLocalRecord,
  setGlobalSnapshot,
} from './localRepository.ts';
import { SyncQueue } from './syncQueue.ts';
import type { GlobalSnapshot, StoredRecord } from './types.ts';

const AUTO_SYNC_INTERVAL_MS = 60 * 60 * 1000;

export class RecordsService {
  private readonly api: RecordsApi;
  private readonly sync: SyncQueue;
  private autoTasksStarted = false;

  constructor(api: RecordsApi, sync: SyncQueue) {
    this.api = api;
    this.sync = sync;
  }

  public save(name: string, scoreMeters: number): void {
    saveLocalRecord({ name, scoreMeters });
    void this.sync.flush();
  }

  public getLocalLeaderboard(limit: number): StoredRecord[] {
    return getTopLocalRecords(limit);
  }

  public async getGlobalLeaderboard(limit: number): Promise<GlobalSnapshot> {
    await this.sync.flush();

    try {
      const records = await this.api.fetchTop(limit);
      const snapshot: GlobalSnapshot = {
        records,
        fetchedAt: new Date().toISOString(),
        stale: false,
      };
      setGlobalSnapshot(snapshot);
      return snapshot;
    } catch {
      const cached = getGlobalSnapshot();
      if (cached) return { ...cached, stale: true };

      return { records: [], fetchedAt: new Date().toISOString(), stale: true };
    }
  }

  public flush(): Promise<void> {
    return this.sync.flush();
  }

  public startAutoTasks(): void {
    if (this.autoTasksStarted) return;
    this.autoTasksStarted = true;

    globalThis.setInterval(() => void this.flush(), AUTO_SYNC_INTERVAL_MS);
    window.addEventListener('online', () => void this.flush());
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) void this.flush();
    });
  }
}

export function createRecordsService(): RecordsService {
  const api = createRecordsApi(getApiBaseUrl());
  return new RecordsService(api, new SyncQueue({ api }));
}

let instance: RecordsService | undefined;

export function getRecordsService(): RecordsService {
  instance ??= createRecordsService();
  return instance;
}
