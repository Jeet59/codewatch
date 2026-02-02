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

    CREATE TABLE IF NOT EXISTS notepad (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      note TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT,
      rule_caption TEXT,
      explanation TEXT
    );
  `);
}

export function setRules(db: Database){
  db.exec(`
    INSERT INTO rules (natural_language)
    SELECT 'Alert when console logging (console.log, console.error, console.warn) is added to source files.'
    WHERE NOT EXISTS (
      SELECT 1 FROM rules WHERE natural_language = 'Alert when console logging (console.log, console.error, console.warn) is added to source files.'
    );

    INSERT INTO rules (natural_language)
    SELECT 'Alert when TODO or FIXME comments are introduced or left in committed code.'
    WHERE NOT EXISTS (
      SELECT 1 FROM rules WHERE natural_language = 'Alert when TODO or FIXME comments are introduced or left in committed code.'
    );

    INSERT INTO rules (natural_language)
    SELECT 'Alert when use of dynamic code execution is added (eval, new Function, setTimeout with string, etc.).'
    WHERE NOT EXISTS (
      SELECT 1 FROM rules WHERE natural_language = 'Alert when use of dynamic code execution is added (eval, new Function, setTimeout with string, etc.).'
    );

    INSERT INTO rules (natural_language)
    SELECT 'Alert when possible secrets (API keys, private keys, tokens, passwords, long base64 strings) appear in source or config files.'
    WHERE NOT EXISTS (
      SELECT 1 FROM rules WHERE natural_language = 'Alert when possible secrets (API keys, private keys, tokens, passwords, long base64 strings) appear in source or config files.'
    );

    INSERT INTO rules (natural_language)
    SELECT 'Alert when large generated/minified files or files over a size threshold are added to source directories (probable accidental commit).'
    WHERE NOT EXISTS (
      SELECT 1 FROM rules WHERE natural_language = 'Alert when large generated/minified files or files over a size threshold are added to source directories (probable accidental commit).'
    );
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