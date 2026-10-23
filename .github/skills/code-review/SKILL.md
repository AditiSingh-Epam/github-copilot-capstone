---
name: code-review
description: Review diffs and verification evidence for correctness, security, test coverage, clarity, DRY, and dependency safety.
---

# Code Review Skill
- Review the actual diff and requirements, not only summaries.
- Check correctness, security, error handling, missing-field/not-found cases, authorization where required, task-data exposure, consistency, tests, clarity, duplication, and dependency safety.
- Cite file/line evidence and explain impact.
- Separate blockers, must-fix, should-fix, and informational findings.
- Run safe tests when available and report exact commands/results.
- Never claim tests, coverage, vulnerability scans, or builds passed without evidence.
- Do not make feature fixes; send actionable findings to the implementation stage.
