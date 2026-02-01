import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

export class SQLiteClient {
  private db: Database.Database;

  constructor(dbPath = 'data/codewatch.db', options?: Database.Options) {
    const dir = path.dirname(dbPath);
    fs.mkdirSync(dir, { recursive: true });
    this.db = new Database(dbPath, options);
  }

  exec(sql: string) {
    return this.db.exec(sql);
  }

  prepare(sql: string) {
    return this.db.prepare(sql);
  }

  get<T = any>(sql: string, params?: any): T | undefined {
    return this.db.prepare(sql).get(params) as T | undefined;
  }

  all<T = any>(sql: string, params?: any): T[] {
    return this.db.prepare(sql).all(params) as T[];
  }

  run(sql: string, params?: any) {
    return this.db.prepare(sql).run(params);
  }

  close() {
    return this.db.close();
  }
}

export const dbClient = new SQLiteClient();
export default dbClient;
