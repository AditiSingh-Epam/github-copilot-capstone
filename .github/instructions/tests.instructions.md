---
applyTo: "**/*.{test,spec}.{js,jsx,ts,tsx},**/tests/**,**/test/**,**/*test*.yml,**/*test*.yaml"
---

# Test Instructions
- Read the current test framework and naming conventions before creating tests.
- Map tests to story/requirement IDs when practical.
- Cover happy path, invalid input, boundary values, not found, unauthorized/forbidden, conflict, and data consistency as applicable.
- Test authentication, authorization, and data isolation at the API boundary only when required by approved requirements.
- Test task field validation separately from ordinary task list visibility.
- Use deterministic fixtures and clean up test data.
- Do not weaken or delete a test simply to obtain a green build.
- Report commands and actual results; never fabricate coverage.
