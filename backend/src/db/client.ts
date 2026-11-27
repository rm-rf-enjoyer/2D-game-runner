import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.ts';

export function createDatabase(url: string, max: number = 10) {
  const client = postgres(url, { max });
  const db = drizzle(client, { schema });
  return { db, client };
}

export type DatabaseHandle = ReturnType<typeof createDatabase>;
export type Database = DatabaseHandle['db'];
