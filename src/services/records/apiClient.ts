import type { LeaderboardEntry, StoredRecord, SyncResult } from './types.ts';

export interface RecordsApi {
  sendBatch(records: StoredRecord[]): Promise<SyncResult>;
  fetchTop(limit: number): Promise<LeaderboardEntry[]>;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}

function isSyncResult(value: unknown): value is SyncResult {
  if (typeof value !== 'object' || value === null) return false;
  const result = value as Partial<SyncResult>;
  return isStringArray(result.acceptedIds) && isStringArray(result.duplicates);
}

function isLeaderboardEntry(value: unknown): value is LeaderboardEntry {
  if (typeof value !== 'object' || value === null) return false;
  const entry = value as Partial<LeaderboardEntry>;
  return (
    typeof entry.id === 'string' &&
    typeof entry.name === 'string' &&
    typeof entry.scoreMeters === 'number' &&
    Number.isInteger(entry.scoreMeters) &&
    typeof entry.savedAt === 'string'
  );
}

export function createRecordsApi(
  baseUrl: string,
  fetchImpl: typeof fetch = fetch,
  timeoutMs: number = 8000
): RecordsApi {
  const root = baseUrl.replace(/\/$/, '');

  const request = async (path: string, init?: RequestInit): Promise<unknown> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(`${root}${path}`, {
        ...init,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Records API responded with ${response.status}`);
      }

      return await response.json();
    } finally {
      clearTimeout(timer);
    }
  };

  return {
    async sendBatch(records) {
      const payload = await request('/v1/records/batch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          records: records.map((record) => ({
            id: record.id,
            name: record.name,
            scoreMeters: record.scoreMeters,
            savedAt: record.savedAt,
          })),
        }),
      });

      if (!isSyncResult(payload)) {
        throw new Error('Records API returned an invalid batch response');
      }

      return payload;
    },

    async fetchTop(limit) {
      const payload = await request(`/v1/records/top?limit=${limit}`);
      if (typeof payload !== 'object' || payload === null) {
        throw new Error('Records API returned an invalid top response');
      }

      const records = (payload as { records?: unknown }).records;
      if (!Array.isArray(records) || !records.every(isLeaderboardEntry)) {
        throw new Error('Records API returned an invalid top response');
      }

      return records;
    },
  };
}
