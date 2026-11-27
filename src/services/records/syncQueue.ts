import { getPendingRecords, getSyncState, markSynced, setSyncState } from './localRepository.ts';
import type { RecordsApi } from './apiClient.ts';

export interface SyncQueueOptions {
  api: RecordsApi;
  now?: () => number;
  minBackoffMs?: number;
  maxBackoffMs?: number;
  batchSize?: number;
}

export class SyncQueue {
  private readonly api: RecordsApi;
  private readonly now: () => number;
  private readonly minBackoffMs: number;
  private readonly maxBackoffMs: number;
  private readonly batchSize: number;
  private inFlight: Promise<void> | null = null;

  constructor(options: SyncQueueOptions) {
    this.api = options.api;
    this.now = options.now ?? Date.now;
    this.minBackoffMs = options.minBackoffMs ?? 5000;
    this.maxBackoffMs = options.maxBackoffMs ?? 60 * 60 * 1000;
    this.batchSize = options.batchSize ?? 50;
  }

  public flush(): Promise<void> {
    if (this.inFlight) return this.inFlight;

    const state = getSyncState();
    if (state.nextAttemptAt !== null && this.now() < state.nextAttemptAt) {
      return Promise.resolve();
    }

    const pending = getPendingRecords();
    if (pending.length === 0) return Promise.resolve();

    const current = this._sendPending(pending);
    this.inFlight = current;
    void current.finally(() => {
      if (this.inFlight === current) this.inFlight = null;
    });

    return current;
  }

  private async _sendPending(records: ReturnType<typeof getPendingRecords>): Promise<void> {
    for (let index = 0; index < records.length; index += this.batchSize) {
      const chunk = records.slice(index, index + this.batchSize);
      const attemptAt = new Date(this.now()).toISOString();

      try {
        const result = await this.api.sendBatch(chunk);
        markSynced([...result.acceptedIds, ...result.duplicates], attemptAt);
        setSyncState({ lastAttemptAt: attemptAt, nextAttemptAt: null, failCount: 0 });
      } catch {
        const failCount = getSyncState().failCount + 1;
        const delay = Math.min(this.minBackoffMs * 2 ** (failCount - 1), this.maxBackoffMs);

        setSyncState({
          lastAttemptAt: attemptAt,
          nextAttemptAt: this.now() + delay,
          failCount,
        });
        return;
      }
    }
  }
}
