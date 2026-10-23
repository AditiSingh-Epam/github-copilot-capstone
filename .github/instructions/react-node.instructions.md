---
applyTo: "**/*.{js,jsx,ts,tsx,json,sql}"
---

# React / Node.js Instructions

- Inspect `package.json`, existing source structure, and scripts before proposing changes.
- Preferred beginner stack if the repository is empty: React + Vite, Node.js + Express, SQLite, and Vitest. Do not silently replace an existing stack.
- Keep frontend components, API routes, business logic, and persistence concerns separated.
- Validate title, priority, due date, and status on the server. Use parameterized database queries.
- Store dates consistently and document whether due dates are date-only or timestamps.
- Do not introduce authentication, deployment infrastructure, or additional libraries without a requirement or approval.
- Never claim tests passed unless they were actually run and their exit status was successful.
