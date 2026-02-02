import type { Database } from 'better-sqlite3';

export function initTables(db: Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      natural_language TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS file_changes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT NOT NULL UNIQUE,
      current TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS change_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_change_id INTEGER NOT NULL,
      diff TEXT,
      ai_summary TEXT NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (file_change_id) REFERENCES file_changes(id)
    );

    CREATE INDEX IF NOT EXISTS idx_change_history_file 
      ON change_history(file_change_id);
  `);
}

export interface Rule {
  id: number;
  natural_language: string;
}

export interface FileChange {
  id: number;
  file_path: string;
  current: string;
}

export interface ChangeHistory {
  id: number;
  file_change_id: number;
  diff: string | null;
  ai_summary: string;
  timestamp: string;
}