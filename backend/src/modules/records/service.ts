import { ZodError } from 'zod';
import { BatchTooLargeError, InvalidRecordsError } from './errors.ts';
import type { RecordsRepositoryLike } from './repository.ts';
import { batchRecordsSchema } from './schema.ts';
import type { IngestResult, LeaderboardEntry } from './types.ts';

export interface RecordsServiceLike {
  ingest(payload: unknown): Promise<IngestResult>;
  getTop(limit: number): Promise<LeaderboardEntry[]>;
}

export class RecordsService implements RecordsServiceLike {
  private readonly repository: RecordsRepositoryLike;
  private readonly batchLimit: number;

  constructor(repository: RecordsRepositoryLike, batchLimit: number) {
    this.repository = repository;
    this.batchLimit = batchLimit;
  }

  public async ingest(payload: unknown): Promise<IngestResult> {
    let parsed;

    try {
      parsed = batchRecordsSchema.parse(payload);
    } catch (error) {
      throw new InvalidRecordsError(error instanceof ZodError ? error.issues : error);
    }

    if (parsed.records.length > this.batchLimit) {
      throw new BatchTooLargeError(this.batchLimit);
    }

    const acceptedIds = await this.repository.insertMany(
      parsed.records.map((record) => ({
        id: record.id,
        name: this._normalizeName(record.name),
        scoreMeters: record.scoreMeters,
        savedAt: new Date(record.savedAt),
      }))
    );

    const accepted = new Set(acceptedIds);

    return {
      acceptedIds,
      duplicates: parsed.records
        .filter((record) => !accepted.has(record.id))
        .map((record) => record.id),
    };
  }

  public async getTop(limit: number): Promise<LeaderboardEntry[]> {
    const safeLimit = Math.min(Math.max(Math.trunc(limit), 1), 50);
    return this.repository.findTop(safeLimit);
  }

  private _normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, ' ');
  }
}
