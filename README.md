# codewatch

Minimal TypeScript watcher using `chokidar`.

Setup

```bash
npm install
```

Development

Edit `src/server.ts` and set `REPO_PATH` to the repository path you want to monitor.

Run in development mode (uses `ts-node-dev`):

```bash
npm run dev
```

Build & Run

```bash
npm run build
npm start
```

The watcher logs `add`, `change`, and `unlink` events to stdout. Replace the hardcoded path in `src/server.ts` when ready.
