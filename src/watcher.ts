import chokidar from 'chokidar';
import dbClient from './db/index';

export function startWatcher(repoPath: string) {
    const db = dbClient;
    const watcher = chokidar.watch(repoPath, {
        persistent: true,
        ignoreInitial: true,
        ignored: [/node_modules/, /\.git/, /dist/]
    });

    watcher
        .on('add', (filePath: string) => db.addFile(filePath))
        .on('change', (filePath: string) => db.updateFile(filePath))
        .on('unlink', (filePath: string) => db.deleteFile(filePath))
        .on('error', error => console.error(`Watcher error: ${error}`));

    return watcher;
}
