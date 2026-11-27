import { asc, desc } from 'drizzle-orm';
import type { Database } from '../../db/client.ts';
import { records, type NewRecordRow } from '../../db/schema.ts';
import type { LeaderboardEntry } from './types.ts';

export interface RecordsRepositoryLike {
  insertMany(rows: NewRecordRow[]): Promise<string[]>;
  findTop(limit: number): Promise<LeaderboardEntry[]>;
}

export class RecordsRepository implements RecordsRepositoryLike {
  private readonly db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  public async insertMany(rows: NewRecordRow[]): Promise<string[]> {
    if (rows.length === 0) return [];

    const inserted = await this.db
      .insert(records)
      .values(rows)
      .onConflictDoNothing({ target: records.id })
      .returning({ id: records.id });

    return inserted.map((row) => row.id);
  }

  public async findTop(limit: number): Promise<LeaderboardEntry[]> {
    const rows = await this.db
      .select({
        id: records.id,
        name: records.name,
        scoreMeters: records.scoreMeters,
        savedAt: records.savedAt,
      })
      .from(records)
      .orderBy(desc(records.scoreMeters), asc(records.savedAt))
      .limit(limit);

    return rows.map((row) => ({ ...row, savedAt: row.savedAt.toISOString() }));
  }
}
