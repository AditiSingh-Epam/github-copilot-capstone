# Copilot Instructions — To-Do Application

This repository contains the To-Do Application and its Agentic SDLC workflow artifacts. Follow the specialist agents and approval gates.

## Product scope (initial MVP)
- Create, list/view, edit, and delete tasks.
- Mark tasks complete or pending.
- Assign a priority (proposed default: Low, Medium, High) and an optional due date. Confirm these values in requirements before implementation.
- Validate required fields and invalid dates; show useful errors.
- Persist tasks in a database.

## Recommended beginner stack
If the repository has no established stack, recommend React + Vite, Node.js + Express, SQLite, and Vitest. Prefer JavaScript for a beginner unless TypeScript is already in use or approved. Inspect the repo before deciding; do not overwrite an existing project stack without approval.

## Guardrails
- Treat `requirements.md`, `architecture.md`, `design-review.md`, and `impl-plan.md` as sequential artifacts.
- Stop for explicit human approval before implementation and before PR creation.
- Never invent user stories, security requirements, deployment targets, or approval evidence. Mark uncertainties as open questions.
- Use server-side validation and parameterized SQL. Keep secrets out of source control.
- Do not add login, multi-user collaboration, reminders, attachments, or cloud deployment unless approved.
- Run actual tests and builds and report exact outcomes. Do not claim a stage or subagent ran unless confirmed by the environment.
