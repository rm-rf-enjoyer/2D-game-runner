export interface StoredRecord {
  id: string;
  name: string;
  scoreMeters: number;
  savedAt: string;
  syncedAt: string | null;
}

export interface NewRecordInput {
  name: string;
  scoreMeters: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  scoreMeters: number;
  savedAt: string;
}

export interface GlobalSnapshot {
  records: LeaderboardEntry[];
  fetchedAt: string;
  stale: boolean;
}

export interface SyncState {
  lastAttemptAt: string | null;
  nextAttemptAt: number | null;
  failCount: number;
}

export interface SyncResult {
  acceptedIds: string[];
  duplicates: string[];
}

export type RecordsMode = 'local' | 'global';
