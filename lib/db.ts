import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export type CommandKind = 'chat' | 'points' | 'bits' | 'extensions';
export type Role = 'viewer' | 'sub' | 'vip' | 'mod' | 'broadcaster';

export type CommandRow = {
  id: number;
  kind: CommandKind;
  command: string | null;
  title: string;
  description: string;
  response: string;
  roles_json: string;
  aliases_json: string;
  cost: number | null;
  currency: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
};

let db: Database.Database | null = null;

function ensureSchema(d: Database.Database) {
  d.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS commands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      kind TEXT NOT NULL,
      command TEXT,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      response TEXT NOT NULL DEFAULT '',
      roles_json TEXT NOT NULL DEFAULT '[]',
      aliases_json TEXT NOT NULL DEFAULT '[]',
      cost INTEGER,
      currency TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_by TEXT
    );

    CREATE UNIQUE INDEX IF NOT EXISTS idx_commands_kind_command ON commands(kind, command);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_commands_kind_title ON commands(kind, title);
  `);
}

export function getDb() {
  if (db) return db;
  const dir = process.env.SQLITE_DIR || './data';
  fs.mkdirSync(dir, { recursive: true });
  const dbPath = path.join(dir, 'bromeolive-commands.sqlite');
  db = new Database(dbPath);
  ensureSchema(db);
  return db;
}

export function rowToCommand(row: CommandRow) {
  return {
    id: row.id,
    kind: row.kind as CommandKind,
    command: row.command,
    title: row.title,
    description: row.description,
    response: row.response,
    roles: JSON.parse(row.roles_json || '[]') as Role[],
    aliases: JSON.parse(row.aliases_json || '[]') as string[],
    cost: row.cost,
    currency: row.currency,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by
  };
}
