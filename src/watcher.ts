import chokidar from 'chokidar';
import dbClient from './db/index';
import aiClient from './ai';
import summaryAgent from './agents/summary';
import notifierAgent from './agents/rule';
import patternAgent from './agents/pattern';

export function startWatcher(repoPath: string) {
    const db = dbClient;
    const ai = aiClient;
    const watcher = chokidar.watch(repoPath, {
        persistent: true,
        ignoreInitial: true,
        ignored: [/node_modules/, /\.git/, /dist/]
    });
    const addFile = async (filePath: string) => {
        await db.addFile(filePath);
        await summaryAgent(ai, db, filePath);
        await notifierAgent(ai, db, filePath);
        await patternAgent(ai, db);
    }
    const updateFile = async (filePath: string) => {
        await db.updateFile(filePath);
        await summaryAgent(ai, db, filePath);
        await notifierAgent(ai, db, filePath);
        await patternAgent(ai, db);
    };
    const deleteFile = async (filePath: string) => {
        await db.deleteFile(filePath);
        await patternAgent(ai, db);
    };

    watcher
        .on('add', (filePath: string) => addFile(filePath))
        .on('change', (filePath: string) => updateFile(filePath))
        .on('unlink', (filePath: string) => deleteFile(filePath))
        .on('error', error => console.error(`Watcher error: ${error}`));

    return watcher;
}
