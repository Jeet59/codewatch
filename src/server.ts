import { startWatcher } from './watcher';

const REPO_PATH = '/Users/jeet/codeforces';

async function main() {
  console.log(`Starting watcher for ${REPO_PATH}`);
  const watcher = startWatcher(REPO_PATH);

  process.on('SIGINT', async () => {
    console.log('Shutting down watcher...');
    try {
      await watcher.close();
    } catch (err) {
      // ignore
    }
    process.exit(0);
  });
}

main().catch(err => {
  console.error('Failed to start server', err);
  process.exit(1);
});
