---
name: react-node-implementation
description: Implement approved To-Do Application tasks in a beginner-friendly React and Node.js repository with tests and validation.
---

# React / Node.js Implementation Skill

Use after the human approves `impl-plan.md`. Inspect the repository and package scripts before changing code.

- Recommended default: React + Vite frontend, Node.js + Express REST API, SQLite database for a simple local-first MVP. Keep the data-access layer isolated so SQLite can be replaced later if needed.
- Use JavaScript initially to reduce setup complexity; use TypeScript only if the repository already uses it or the human approves it.
- Implement task CRUD, completion status, priority, and due date according to approved requirements.
- Validate inputs on the server; never rely only on browser-side validation.
- Use parameterized database queries and avoid committing secrets.
- Add focused tests for happy paths, invalid inputs, missing tasks, and persistence.
- Do not add authentication, multi-user sharing, cloud deployment, or unrelated features unless approved.
- Run the repository's actual lint, test, and build scripts and report results honestly.
