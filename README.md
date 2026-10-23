# To-Do Application

A local, single-user task application and its Agentic SDLC workflow artifacts. The application uses React + Vite, Node.js + Express, SQLite through Node's built-in `node:sqlite` module, and Vitest.

## Implemented scope

- Create tasks with a required title, optional description, optional Low/Medium/High priority (default Medium), and optional date-only due date.
- Validate and normalize task fields on the server. Titles are trimmed and limited to 1–100 Unicode code points; descriptions are trimmed and limited to 1,000 code points. Unknown create fields and invalid task values return HTTP 400. Due dates must be valid `YYYY-MM-DD` calendar dates; past dates are allowed.
- List all tasks or filter Pending/Completed; return all matches newest-created-first.
- Inspect a task's details and permanently delete it after a browser confirmation.
- Persist tasks in a local SQLite database; new tasks start incomplete.
- Serve the built UI and API from one local origin. The API binds to `127.0.0.1`, validates the expected local `Host` and `Origin`, requires JSON content type for mutations, and does not enable CORS.

### Explicitly deferred

Task editing and any completion/pending **write** control or route are not implemented. Requirements Q9 leaves editable fields, update semantics/conflicts, completion-write shape, and completion side effects unresolved. The UI can display a task's current completion state and filter by it, but newly created tasks start incomplete and this implementation provides no control for changing that state. Do not treat the absence of these flows as a product decision.

## Requirements and decisions

The approved business requirements are in [`requirements.md`](requirements.md); the reviewed architecture is in [`architecture.md`](architecture.md), the design findings in [`design-review.md`](design-review.md), and the approved limited implementation plan in [`impl-plan.md`](impl-plan.md). Open Q7/Q8 limitations and Q9 blockers remain open; implementation status does not silently resolve them.

## Prerequisites

- Node.js 22.12+ within the 22.x line, 24.x, or 26+ (matching the locked Vite/Vitest engine ranges; `node:sqlite` is used; Node 24 was used for the recorded implementation checks).
- npm.

## Install and run in development

```sh
npm install
```

Start the API in one terminal:

```sh
npm run dev:api
```

Start Vite in a second terminal:

```sh
npm run dev
```

Open `http://127.0.0.1:5173`. Both processes bind to loopback. Keep the API's configured origin aligned with the Vite origin if changing the development port.

## Build and run the local application

```sh
npm run build
npm start
```

Open `http://127.0.0.1:3000`. The production server serves the built UI and API on the same local origin. `PORT` may select a different port; `TODO_ALLOWED_ORIGIN` may select a loopback HTTP origin for a custom local setup. The server bind address remains `127.0.0.1`.

## Data location

On Windows, the default database is `%LOCALAPPDATA%\ToDoApplication\data.sqlite`. If `LOCALAPPDATA` is unavailable, the fallback is `%USERPROFILE%\AppData\Local\ToDoApplication\data.sqlite`. Set `TODO_DB_PATH` to an absolute path to choose another location. Versioned SQLite migrations run at startup; a failed migration prevents the server from starting. The database and SQLite sidecar files are ignored by Git.

No backup, recovery, encryption-at-rest, formal retention, or secure-erasure guarantee is provided. Task content is intended for ordinary personal task information; do not store passwords, payment details, or other sensitive data.

## Verification commands

```sh
npm test
npm run lint
npm run build
npm audit
```

`npm test` runs the Vitest API, validation, persistence, configuration, and UI suites. The latest independent QA run on 2026-10-23 passed 56 tests in 5 files; rerun the command for current results.

## Workflow kit

This repository also retains the specialist agents, repository instructions, prompts, skills, and project artifacts under `.github/`. Follow the approval gates in those artifacts. Independent QA/review is complete; its evidence is recorded in [`impl-plan.md`](impl-plan.md). The standalone Chrome 155 delete-confirmation smoke remains incomplete. The user accepted this as a documented limitation for release preparation on 2026-10-22; that acceptance does not mean the test passed or authorize PR creation. No PR has been created.
