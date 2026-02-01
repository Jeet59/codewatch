import chokidar from 'chokidar';
import dbClient from './db';

export function startWatcher(repoPath: string) {
  const watcher = chokidar.watch(repoPath, {
    persistent: true,
    ignoreInitial: true,
    ignored: [/node_modules/, /\.git/, /dist/]
  });

  try {
    dbClient.exec(`
      CREATE TABLE IF NOT EXISTS file_events(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL,
        event TEXT NOT NULL,
        ts INTEGER NOT NULL
      );
    `);
  } catch (err) {
    console.error('DB init error:', err);
  }

  const insertEvent = (evt: string, filePath: string) => {
    const ts = Date.now();
    try {
      dbClient.run('INSERT INTO file_events(path,event,ts) VALUES (?,?,?)', [filePath, evt, ts]);
    } catch (err) {
      console.error('DB insert error:', err);
    }
  };

  watcher
    .on('add', path => insertEvent('add', path))
    .on('change', path => insertEvent('change', path))
    .on('unlink', path => insertEvent('unlink', path))
    .on('error', error => console.error(`Watcher error: ${error}`));

  return watcher;
}
