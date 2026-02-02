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

    getSummaryAgentData(filePath: string): {
        diff: string | null;
        current: string | null;
        changeHistoryId: number | null;
    } {
        const file = this.db.prepare(
            'SELECT * FROM file_changes WHERE file_path = ?'
        ).get(filePath) as FileChange | undefined;

        if (!file) {
            return { diff: null, current: null, changeHistoryId: null };
        }

        const change = this.db.prepare(
            'SELECT * FROM change_history WHERE file_change_id = ? ORDER BY timestamp DESC LIMIT 1'
        ).get(file.id) as ChangeHistory | undefined;

        if (!change) {
            return { diff: null, current: file.current, changeHistoryId: null };
        }

        return {
            diff: change.diff,
            current: file.current,
            changeHistoryId: change.id
        };
    }

    getRuleAgentData(filePath: string): {
        filePath: string;
        diff: string | null;
        ai_summary: string;
        current: string;
    } | null {
        const file = this.db.prepare(
            'SELECT * FROM file_changes WHERE file_path = ?'
        ).get(filePath) as FileChange | undefined;

        if (!file) return null;

        const change = this.db.prepare(
            'SELECT * FROM change_history WHERE file_change_id = ? ORDER BY timestamp DESC LIMIT 1'
        ).get(file.id) as ChangeHistory | undefined;

        if (!change) return null;

        return {
            filePath: file.file_path,
            diff: change.diff,
            ai_summary: change.ai_summary,
            current: file.current
        };
    }

    getPatternAgentData(limit: number = 10): {
        filePath: string;
        diff: string | null;
        ai_summary: string;
    }[] {
        return this.db.prepare(
            `
        SELECT
            fc.file_path as filePath,
            ch.diff as diff,
            ch.ai_summary as ai_summary
        FROM change_history ch
        JOIN file_changes fc ON fc.id = ch.file_change_id
        WHERE ch.ai_summary IS NOT NULL
          AND ch.ai_summary != 'Pending AI summary'
        ORDER BY ch.id DESC
        LIMIT ?
        `
        ).all(limit) as {
            filePath: string;
            diff: string | null;
            ai_summary: string;
        }[];
    }


    setAISummary(changeHistoryId: number, summary: string): void {
        this.db.prepare(
            'UPDATE change_history SET ai_summary = ? WHERE id = ?'
        ).run(summary, changeHistoryId);
    }

    getRules(): Rule[] {
        return this.db.prepare(
            'SELECT * FROM rules ORDER BY id ASC'
        ).all() as Rule[];
    }

    getNotepad(): {
        id: number;
        note: string;
    }[] {
        return this.db.prepare(
            `SELECT id, note FROM notepad ORDER BY id DESC`
        ).all() as {
            id: number;
            note: string;
        }[];
    }

    addNotepad(note: string): number {
        const result = this.db.prepare(
            `INSERT INTO notepad (note) VALUES (?)`
        ).run(note);
        return result.lastInsertRowid as number;
    }

    addNotification(
        filePath: string | null,
        ruleCaption: string,
        explanation: string,
    ): number {
        const result = this.db.prepare(
            `INSERT INTO notifications
     (file_path, rule_caption, explanation)
     VALUES (?, ?, ?)`
        ).run(
            filePath,
            ruleCaption,
            explanation,
        );
        return result.lastInsertRowid as number;
    }


    close() {
        return this.db.close();
    }
}

const dbClient = new DBClient();
export default dbClient;