import { asc, desc } from 'drizzle-orm';
import { index, integer, pgTable, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const records = pgTable(
  'records',
  {
    id: uuid('id').primaryKey(),
    name: varchar('name', { length: 16 }).notNull(),
    scoreMeters: integer('score_meters').notNull(),
    savedAt: timestamp('saved_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('records_score_saved_idx').on(desc(table.scoreMeters), asc(table.savedAt))]
);

export type RecordRow = typeof records.$inferSelect;
export type NewRecordRow = typeof records.$inferInsert;
