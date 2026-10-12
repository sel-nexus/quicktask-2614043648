# QuickTask

A small, responsive task manager that runs entirely in your browser. Add tasks with the button or Enter, mark them complete, remove them, and return to the same list after a reload. Tasks are stored locally in your browser; no account, server, or database is used.

## Requirements

- Node.js 18 or newer
- npm

## Install and run

From the repository root:

```sh
cd quicktask
npm install
npm run dev
```

Open the local URL printed by Vite. Your task list is saved in this browser's LocalStorage.

## Verify

Run the component tests:

```sh
cd quicktask
node node_modules/vitest/vitest.mjs run
```

Run the browser end-to-end tests (install the Playwright Chromium browser once with `node node_modules/@playwright/test/cli.js install chromium`):

```sh
cd quicktask
node node_modules/@playwright/test/cli.js test
```

Create a production static build:

```sh
cd quicktask
node node_modules/vite/bin/vite.js build
```

The generated static site is written to `quicktask/dist/`.
