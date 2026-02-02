import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { initTables, Rule, FileChange, ChangeHistory } from './schemas';
import { generateDiff } from '../utils/diff';

export class DBClient {
    private db: Database.Database;

    constructor(dbPath = 'data/codewatch.db') {
        const dir = path.dirname(dbPath);
        fs.mkdirSync(dir, { recursive: true });
        this.db = new Database(dbPath);
        initTables(this.db);
    }

    async addFile(filePath: string): Promise<void> {
        const content = await fs.promises.readFile(filePath, 'utf-8');
        const result = this.db.prepare(
            'INSERT INTO file_changes (file_path, current) VALUES (?, ?)'
        ).run(filePath, content);

        const fileChangeId = result.lastInsertRowid as number;

        this.db.prepare(
            'INSERT INTO change_history (file_change_id, diff, ai_summary) VALUES (?, ?, ?)'
        ).run(fileChangeId, null, 'Initial file addition');
    }

    async updateFile(filePath: string): Promise<void> {
        const existingFile = this.db.prepare(
            'SELECT * FROM file_changes WHERE file_path = ?'
        ).get(filePath) as FileChange | undefined;

        if (!existingFile) {
            await this.addFile(filePath);
            return;
        }
        
        const newContent = await fs.promises.readFile(filePath, 'utf-8');
        const diff = generateDiff(existingFile.current, newContent);

        this.db.prepare(
            'UPDATE file_changes SET current = ? WHERE id = ?'
        ).run(newContent, existingFile.id);

        this.db.prepare(
            'INSERT INTO change_history (file_change_id, diff, ai_summary) VALUES (?, ?, ?)'
        ).run(existingFile.id, diff, 'Pending AI summary');
    }

    async deleteFile(filePath: string): Promise<void> {
        this.db.prepare(
            'DELETE FROM file_changes WHERE file_path = ?'
        ).run(filePath);
    }

    async fileData(filePath: string): Promise<string> {
        const fileChanges = this.db.prepare(
            'SELECT * FROM file_changes WHERE file_path = ?'
        ).get(filePath) as FileChange | undefined;

        const changeHistory = this.db.prepare(
            'SELECT * FROM change_history WHERE file_change_id = ? ORDER BY timestamp DESC'
        ).all(fileChanges?.id) as ChangeHistory[];
        return `
        File Path: ${filePath},
        Current Content: ${fileChanges?.current || ''},
        Change History: ${JSON.stringify(changeHistory, null, 2)}
        `;
    }

    close() {
        return this.db.close();
    }
}

const dbClient = new DBClient();
export default dbClient;