---
name: run-sdlc
description: Start or resume the coordinated Agentic SDLC workflow for the To-Do Application.
agent: SDLC Orchestrator
---

Run or resume the Agentic SDLC workflow using the repository's custom agents and the capstone stages.

1. Inspect existing artifacts, Git status, and current branch before doing work.
2. Read Confluence requirements through the configured Atlassian MCP tools and verify source pages.
3. Follow the stage order defined in `.github/agents/sdlc-orchestrator.agent.md`.
4. Delegate to specialist agents when actual delegation is supported. Report any runtime limitation honestly.
5. Reuse valid approved artifacts and avoid repeating completed stages.
6. Ask clarification questions for material ambiguities.
7. Stop for explicit human approval before implementation.
8. After implementation, run QA/review and fix findings through the implementation stage as needed.
9. Stop for explicit human approval before creating or pushing a PR.
10. Finish with a stage ledger, artifacts, test evidence, unresolved risks, and PR status.

Do not make assumptions about task completion and deletion semantics. Do not push, merge, deploy, or create a PR without explicit approval.
