import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { loadEnv } from '../config/env.ts';
import { createDatabase } from './client.ts';

const env = loadEnv();
const { db, client } = createDatabase(env.DATABASE_URL, 1);

try {
  await migrate(db, { migrationsFolder: './drizzle' });
} finally {
  await client.end();
}
