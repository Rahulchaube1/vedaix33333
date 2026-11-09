import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const rawDataDir = process.env.DATA_DIR || process.cwd();
const dataDir =
  rawDataDir.endsWith('/data') || rawDataDir.endsWith('\\data')
    ? rawDataDir
    : path.join(rawDataDir, 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(path.join(dataDir, 'db.sqlite'));
const db = drizzle(sqlite, {
  schema: schema,
});

export default db;
