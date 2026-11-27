import type { GlobalSnapshot, NewRecordInput, StoredRecord, SyncState } from './types.ts';

const RECORDS_KEY = 'runGame:records.v1';
const LEGACY_KEY = 'runGame:results';
const SYNC_STATE_KEY = 'runGame:records.sync';
const GLOBAL_SNAPSHOT_KEY = 'runGame:records.global';

const DEFAULT_SYNC_STATE: SyncState = {
  lastAttemptAt: null,
  nextAttemptAt: null,
  failCount: 0,
};

interface LegacyRecord {
  name: string;
  score: string;
  savedAt: string;
}

function getStorage(): Storage | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}

function readJson(key: string): unknown {
  const storage = getStorage();
  if (!storage) return null;

  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeJson(key: string, value: unknown): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    return;
  }
}

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

function normalizeName(name: string): string {
  const normalized = name
    .trim()
    .replace(/[^A-Za-z0-9 _-]/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 16);

  return normalized || 'player';
}

function parseScore(score: string): number {
  const value = Number.parseFloat(score);
  return Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function toIso(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function isLegacyRecord(value: unknown): value is LegacyRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Partial<LegacyRecord>;
  return (
    typeof record.name === 'string' &&
    typeof record.score === 'string' &&
    typeof record.savedAt === 'string'
  );
}

function isStoredRecord(value: unknown): value is StoredRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Partial<StoredRecord>;
  return (
    typeof record.id === 'string' &&
    typeof record.name === 'string' &&
    typeof record.scoreMeters === 'number' &&
    Number.isInteger(record.scoreMeters) &&
    record.scoreMeters >= 0 &&
    typeof record.savedAt === 'string' &&
    (record.syncedAt === null || typeof record.syncedAt === 'string')
  );
}

function writeRecords(records: StoredRecord[]): void {
  writeJson(RECORDS_KEY, records);
}

function ensureMigrated(): void {
  const storage = getStorage();
  if (!storage || storage.getItem(RECORDS_KEY) !== null) return;

  const legacy = readJson(LEGACY_KEY);
  const records = Array.isArray(legacy)
    ? legacy.filter(isLegacyRecord).map((record) => ({
        id: createId(),
        name: normalizeName(record.name),
        scoreMeters: parseScore(record.score),
        savedAt: toIso(record.savedAt),
        syncedAt: null,
      }))
    : [];

  writeRecords(records);
}

export function getLocalRecords(): StoredRecord[] {
  ensureMigrated();
  const records = readJson(RECORDS_KEY);
  return Array.isArray(records) ? records.filter(isStoredRecord) : [];
}

export function saveLocalRecord(input: NewRecordInput): StoredRecord {
  const record: StoredRecord = {
    id: createId(),
    name: normalizeName(input.name),
    scoreMeters:
      Number.isFinite(input.scoreMeters) && input.scoreMeters >= 0
        ? Math.floor(input.scoreMeters)
        : 0,
    savedAt: new Date().toISOString(),
    syncedAt: null,
  };

  writeRecords([...getLocalRecords(), record]);
  return record;
}

export function getPendingRecords(): StoredRecord[] {
  return getLocalRecords().filter((record) => record.syncedAt === null);
}

export function markSynced(ids: string[], syncedAt: string): void {
  const synced = new Set(ids);
  const records = getLocalRecords().map((record) =>
    synced.has(record.id) && record.syncedAt === null ? { ...record, syncedAt } : record
  );

  writeRecords(records);
}

export function getTopLocalRecords(limit: number): StoredRecord[] {
  if (limit <= 0) return [];

  return getLocalRecords()
    .slice()
    .sort((a, b) => b.scoreMeters - a.scoreMeters || a.savedAt.localeCompare(b.savedAt))
    .slice(0, limit);
}

export function getSyncState(): SyncState {
  const state = readJson(SYNC_STATE_KEY);
  if (typeof state !== 'object' || state === null) return { ...DEFAULT_SYNC_STATE };

  const candidate = state as Partial<SyncState>;
  return {
    lastAttemptAt: typeof candidate.lastAttemptAt === 'string' ? candidate.lastAttemptAt : null,
    nextAttemptAt: typeof candidate.nextAttemptAt === 'number' ? candidate.nextAttemptAt : null,
    failCount:
      typeof candidate.failCount === 'number' && Number.isFinite(candidate.failCount)
        ? Math.max(0, Math.floor(candidate.failCount))
        : 0,
  };
}

export function setSyncState(state: SyncState): void {
  writeJson(SYNC_STATE_KEY, state);
}

export function getGlobalSnapshot(): GlobalSnapshot | null {
  const snapshot = readJson(GLOBAL_SNAPSHOT_KEY);
  if (typeof snapshot !== 'object' || snapshot === null) return null;

  const candidate = snapshot as Partial<GlobalSnapshot>;
  if (!Array.isArray(candidate.records) || typeof candidate.fetchedAt !== 'string') return null;

  const records = candidate.records.filter((entry): entry is StoredRecord => isStoredRecord(entry));
  return {
    records,
    fetchedAt: candidate.fetchedAt,
    stale: candidate.stale === true,
  };
}

export function setGlobalSnapshot(snapshot: GlobalSnapshot): void {
  writeJson(GLOBAL_SNAPSHOT_KEY, snapshot);
}
