# To-Do Application Requirements

> **Status: APPROVED — 2026-10-22**
>
> This approved baseline records verified Confluence content and user-provided clarifications. Open questions remain explicitly unresolved and must not be treated as requirements or resolved by inference.

## 1. Purpose and scope

**Source-stated goal:** “Provide a simple application for managing personal tasks.” [S1]

**Draft MVP scope:** create, view, edit, and permanently delete tasks; mark tasks complete or pending; set an optional priority and optional due date; persist tasks locally and provide useful validation/error messages. Tasks are listed newest first, with All, Pending, and Completed filters. [S1, S2; user clarifications Q1–Q6]

**User-provided scope decisions:** local use only for the MVP; no authentication or multi-user collaboration; notifications, reminders, attachments, and cloud deployment are out of MVP scope. [S2; user clarifications Q1, Q7]

This document does not select an implementation stack. Proposed React/Vite, Node.js/Express, SQLite, API routes, and task fields are architecture proposals, not requirements. [S3]

## 2. Actors and permissions

| Actor | Source-backed description | Permissions |
|---|---|---|
| Local user | The stories use the generic actor “a user.” [S1] | For the MVP, use the application locally without authentication, multi-user accounts, or roles, per the user's clarification. |

The user's local-use decision is approved. No cloud or multi-user behavior is implied.

## 3. Source pages and coverage

All eight specifically requested TODO-space pages were retrieved in full and verified by exact title and stable Confluence content ID. Links use the verified page IDs.

| Ref | Exact page title | Stable page ID / link | Source status and coverage |
|---|---|---|---|
| S1 | Product Requirements and User Stories | `8781825` — [open page](https://thakuraditi212.atlassian.net/wiki/spaces/TODO/pages/8781825/Product+Requirements+and+User+Stories) | Read in full. Draft, requires human approval. Goal, six initial MVP stories, five open questions. |
| S2 | MVP Scope and Business Rules | `8814593` — [open page](https://thakuraditi212.atlassian.net/wiki/spaces/TODO/pages/8814593/MVP+Scope+and+Business+Rules) | Read in full. Draft, requires human approval. Included scope, conditional exclusions, proposed validation/business rules. |
| S3 | System Architecture | `8847361` — [open page](https://thakuraditi212.atlassian.net/wiki/spaces/TODO/pages/8847361/System+Architecture) | Read in full. Proposed, not approved. Technical proposals and additional open decisions; treated only as downstream context. |
| S4 | Design Review | `8880129` — [open page](https://thakuraditi212.atlassian.net/wiki/spaces/TODO/pages/8880129/Design+Review) | Read in full. Pending review; checklist and verdict PENDING, no findings recorded. |
| S5 | Implementation Plan | `8847377` — [open page](https://thakuraditi212.atlassian.net/wiki/spaces/TODO/pages/8847377/Implementation+Plan) | Read in full. Draft and explicitly NOT APPROVED; sequence and preconditions inform traceability only. |
| S6 | Decisions and Open Questions | `8781841` — [open page](https://thakuraditi212.atlassian.net/wiki/spaces/TODO/pages/8781841/Decisions+and+Open+Questions) | Read in full. Questions are unanswered; decision record contains no decisions. |
| S7 | Test and Verification Report | `8912897` — [open page](https://thakuraditi212.atlassian.net/wiki/spaces/TODO/pages/8912897/Test+and+Verification+Report) | Read in full. Not run; lists planned test coverage only, not test results. |
| S8 | Release and PR Records | `8814609` — [open page](https://thakuraditi212.atlassian.net/wiki/spaces/TODO/pages/8814609/Release+and+PR+Records) | Read in full. No release or pull request has been created; checklist/record template only. |

The TODO-space search returned one additional page, **To-Do Application Home** (`8683635`), which contains default space welcome content and no requirements or links needed to understand the stories. It was not relied on. No linked requirement content was referenced by the eight pages. **Unreadable required pages: none.**

## 4. Story and requirement inventory

The source provides no stable story IDs. The identifiers below are **proposed traceability IDs**, assigned for this draft only; they are not source-provided IDs. The stories retain the source wording.

### P-US-01 — Create a task

**Source story:** “As a user, I can create a task with a title and optional description.” [S1]

**Acceptance criteria (source-backed statements and user clarifications as cited):**
- Given the user submits a title and optionally a description, when the task is created, then it is available in the task list. [S1]
- Given the title has leading or trailing whitespace, when it is submitted, then that whitespace is trimmed before validation. The trimmed title must contain 1–100 characters; missing, blank, or overlong titles are rejected. [User clarification Q3]
- Given a description is supplied, when it is saved, then leading and trailing whitespace is trimmed and the description must not exceed 1,000 characters. [User clarification Q3]
- Given no description is supplied or the supplied description trims to empty, then the description is represented as an empty string. [User clarification 2026-10-22]
- Given a request contains an invalid priority or due date, when creation is attempted, then the request is rejected with a clear validation message and HTTP 400. [User clarifications Q3–Q5]
- Given a task is created successfully, then show “Task created.” Duplicate titles are allowed. [User clarification 2026-10-22]

**Unspecified:** other create-failure and success-presentation details.

### P-US-02 — View and inspect tasks

**Source story:** “As a user, I can view my task list and inspect a task.” [S1]

**Acceptance criteria (source-backed statements and user clarifications as cited):**
- Given tasks exist, when the user views the task list without changing the filter, then all tasks are shown newest first. [S1; user clarification Q6]
- Given the user selects All, Pending, or Completed, when the list is shown, then it contains tasks matching that filter. [User clarifications Q2, Q6]
- Given a task appears in the list, then show its title, completion state, priority, and due date. In task detail, show all available task fields, including description and creation date. [User clarification 2026-10-22]
- Given the selected task filter has no matching tasks, then show “No tasks yet.” The list does not paginate and returns all matching tasks. [User clarification 2026-10-22]
- Given a task exists, when the user inspects that task, then its details are available to inspect. [S1]
- Given a task ID does not identify an existing task, when that task is requested, then show “Task not found” and return HTTP 404. [User clarification Q2]

**Unspecified:** detailed date formatting and any additional displayed fields beyond those listed above.

### P-US-03 — Edit a task

**Source story:** “As a user, I can edit an existing task.” [S1]

**Acceptance criteria (source-backed statements and user clarifications as cited):**
- Given an existing task, when the user edits its fields and saves valid changes, then the edited fields are reflected when the task is read again. Editing fields and verifying persistence are in planned test coverage. [S1, S7]
- Given the task does not exist, when an edit is attempted, then show “Task not found” and return HTTP 404. [User clarification Q2]

**Unspecified:** partial versus full update semantics, conflict behavior, and whether all task fields can be edited.

### P-US-04 — Delete a task

**Source story:** “As a user, I can delete a task.” [S1]

**Acceptance criteria (source-backed statements and user clarifications as cited):**
- Given an existing task, when the user requests deletion, then the application asks for confirmation before permanently deleting the task. [S1; user clarification Q2]
- Given the task does not exist, when deletion is attempted, then show “Task not found” and return HTTP 404. [User clarification Q2]

**User decision:** deletion is permanent and requires confirmation.

### P-US-05 — Mark complete or pending

**Source story:** “As a user, I can mark a task complete or pending.” [S1]

**Acceptance criteria (source-backed statements and user clarifications as cited):**
- Given a task is created without another completion state specified, then it starts incomplete. [User clarification Q2]
- Given a task, when the user changes its state to complete or pending, then that state change is available on subsequent read. [S1, S7]
- Given the user selects Completed or Pending, when the task list is shown, then the selected filter is applied and completed tasks are visually distinguished. [User clarification Q2]

**Unspecified:** whether completion has a timestamp or other side effect.

### P-US-06 — Assign priority and optional due date

**Source story:** “As a user, I can assign a priority and optional due date.” [S1]

**Acceptance criteria (source-backed statements and user clarifications as cited):**
- Given a task is created without a priority, then its priority defaults to Medium; an explicitly supplied priority must be Low, Medium, or High. [User clarification Q4]
- Given a task has an optional due date, when a date is supplied, then it must be a valid calendar date in `YYYY-MM-DD` format. Date-only values have no time-of-day or timezone conversion; past dates are allowed. Invalid values are rejected with a clear validation message and HTTP 400. [User clarification Q5]

**Unspecified:** whether priority or due date can be edited independently of other task fields.

## 5. Business rules and validation

The following approved rules record the user's clarifications:

| Rule | Source | Status |
|---|---|---|
| Title is required; trim outer whitespace; accept 1–100 characters after trimming. | User clarification Q3 | Approved 2026-10-22. |
| Description is optional; trim outer whitespace; maximum 1,000 characters. | User clarification Q3 | Approved 2026-10-22. |
| Priority is optional; allowed values are Low, Medium, High; default is Medium. | User clarification Q4 | Approved 2026-10-22. |
| Due date is optional, date-only `YYYY-MM-DD`; reject invalid calendar dates; past dates are allowed. | User clarification Q5 | Approved 2026-10-22. |
| Invalid API requests return HTTP 400 with a clear validation message; missing tasks return HTTP 404 and “Task not found.” | User clarifications Q2, Q3, Q5 | Approved 2026-10-22. |
| Reject unknown fields in create requests with HTTP 400 and a clear validation error. | User clarification 2026-10-22 | Approved 2026-10-22. |
| Use server-side validation and parameterized database queries. | S2 | Proposed source guidance; no separate human confirmation recorded. |

The Test and Verification Report proposes checking missing/invalid titles, invalid dates, priority values, missing task IDs, and persistence. This is planned coverage, not evidence of execution. [S7]

## 6. Security, privacy, error handling, and audit

- **Authentication / authorization:** the user specified local use for the MVP, without authentication, multiple users, or roles. [User clarification Q1]
- **Validation / database safety:** invalid API requests return HTTP 400 with a clear validation message. Server-side validation and parameterized queries are also proposed in S2; database choice remains open. [S2; user clarifications Q3–Q5]
- **Errors:** a missing task returns “Task not found” and HTTP 404; invalid API input returns HTTP 400 with a clear validation message. Other error categories and recovery behavior are unspecified. [User clarifications Q2, Q3, Q5]
- **Privacy / data handling:** tasks are intended for ordinary personal task information; do not intentionally collect passwords, payment details, or other sensitive personal data. Log application errors and operational events, but not full task descriptions or other unnecessary user-entered content. Retain tasks locally until user deletion. Formal retention, backup, and secure-deletion requirements remain OPEN. [User clarification Q8]
- **Audit:** no separate audit trail or audit-event history is required for the MVP. [User clarification Q8]

## 7. Non-functional requirements

The user specified local development and local use only for the MVP, with current desktop Chrome as the initial compatibility target. Other browsers and mobile compatibility are OPEN. No measurable performance, formal accessibility-conformance, or availability target has been provided. [User clarification Q7; S3–S6]

The design checklist mentions loading, empty, validation-error, and server-error states, and the architecture/implementation drafts propose beginner-friendly technologies and setup documentation; these are review/planning items or proposals, not approved quality targets. [S3, S4, S5]

**OPEN:** measurable performance, formal accessibility target, availability, support beyond current desktop Chrome, mobile compatibility, backup/recovery, and quantitative quality targets. Do not invent thresholds.

## 8. Dependencies, assumptions, and exclusions

### Dependencies / gates recorded in project sources
- The implementation plan requires approved requirements and architecture, resolved or explicitly accepted design-review findings, repository/script inspection, and open product decisions resolved or excluded before implementation. [S5]
- The plan sequence proposes persistence, CRUD, validation, UI states, tests, and setup documentation; it is not an approved design or implementation commitment. [S5]
- The release page requires plan approval, code review, actual test/build evidence, updated documentation, and human approval before PR creation. No PR or release is recorded. [S8]

### Assumptions
- No product assumptions are promoted to requirements in this draft.
- The architecture’s proposed stack, fields (`id`, `title`, optional `description`, `completed`, `priority`, nullable `dueDate`, `createdAt`, `updatedAt`), and routes remain proposals only. Local use is an approved user-provided scope decision. [S3; user clarification Q1]

### MVP exclusions
The user specified no authentication or multi-user collaboration, notifications, reminders, attachments, or cloud deployment for the MVP. [S2; user clarifications Q1, Q7]

## 9. Recorded user clarifications and remaining open questions

The user supplied decisions for Q1–Q6 and partial decisions for Q7–Q8, then clarified API and presentation behavior on 2026-10-22. Q9 tracks the remaining unspecified task-interaction details. The requirements were explicitly approved in chat on 2026-10-22; remaining items are acknowledged as OPEN, not settled requirements.

| ID | User-provided decision | Remaining open items / status |
|---|---|---|
| Q1 — User and access model | Local use for the MVP; no authentication, multiple users, or roles. | Approved 2026-10-22. |
| Q2 — Task lifecycle | Permanent deletion with confirmation; missing tasks display “Task not found” and return HTTP 404; new tasks start incomplete; show all tasks by default, visually distinguish completed tasks, and provide All, Pending, and Completed filters. | Approved 2026-10-22. |
| Q3 — Required fields and validation | Title required, trim leading/trailing whitespace, 1–100 characters after trimming; description optional, trim leading/trailing whitespace, maximum 1,000 characters. Reject missing/blank or overlong title, overlong description, invalid priority, and invalid due date. Invalid API requests return a clear message and HTTP 400. | Approved 2026-10-22. |
| Q4 — Priority | Optional; Low, Medium, High; default Medium. | Approved 2026-10-22. |
| Q5 — Due-date semantics | Optional ISO `YYYY-MM-DD`, date-only, no timezone conversion; allow past dates; reject invalid calendar dates or other formats with a clear message and HTTP 400 for API requests. | Approved 2026-10-22. |
| Q6 — List behavior | Newest-created first; no other sorting or search; filters are All, Pending, Completed. | Approved 2026-10-22. |
| Q7 — Platform and quality targets | Local development and local use only; current desktop Chrome is the initial compatibility target; cloud deployment is out of scope. | Performance, formal accessibility conformance, availability, other browsers, and mobile compatibility remain OPEN. |
| Q8 — Privacy and audit | Ordinary personal task information; do not intentionally collect passwords, payment details, or other sensitive personal data. Log errors and operational events, not full descriptions or unnecessary user-entered content. Keep tasks locally until user deletion; no separate audit trail is required. | Formal data-retention, backup, and secure-deletion requirements remain OPEN. |
| Q9 — Other task interaction details | Allow duplicate titles; show “Task created” after create; represent absent or empty descriptions as an empty string; no pagination (return all matching results); list shows title/completion/priority/due date; detail shows all available fields including description and creation date; empty filtered list shows “No tasks yet.” [User clarification 2026-10-22] | OPEN: which fields are editable; partial versus full update semantics and omitted/null handling; update-conflict behavior; completion write shape and timestamps/side effects; and whether priority/due date can be edited independently. |

No P0 lifecycle or access-model decisions remain unanswered. The remaining items above are approved as OPEN questions and are not to be resolved by inference.

## 10. Traceability matrix

Downstream components/tests listed below are pointers to *proposed* architecture, review, or test-plan material, not approved implementation design or executed tests.

| Proposed ID | Source | Requirement / supported acceptance | Proposed downstream component | Planned verification source |
|---|---|---|---|---|
| P-US-01 | S1, S2; user Q3–Q5 and 2026-10-22 clarification | Create task; trimmed title required (1–100 chars); description optional (max 1,000 chars), empty represented as `""`; priority/date validation; duplicate titles allowed; show “Task created.” | UI form / approved `POST /api/tasks` / task service [S3] | Planned valid create and validation checks [S7]; not run |
| P-US-02 | S1, S7; user Q2, Q6 and 2026-10-22 clarification | View all matching tasks newest first, no pagination; All/Pending/Completed filters; defined list/detail fields and empty text; missing task shows “Task not found” / HTTP 404. | UI list/detail / approved `GET /api/tasks`, `GET /api/tasks/:id` [S3] | Planned read/list, missing-ID, and UI-state checks [S7, S4]; not run |
| P-US-03 | S1, S7; user Q2 | Edit an existing task and read back changes; missing task shows “Task not found” / HTTP 404. | UI form / proposed `PATCH /api/tasks/:id` [S3] | Planned edit, persistence, and missing-ID checks [S7]; not run |
| P-US-04 | S1, S7; user Q2 | Require confirmation and permanently delete; missing task shows “Task not found” / HTTP 404. | Proposed `DELETE /api/tasks/:id` [S3] | Deletion behavior now specified; test plan [S7] has not been run |
| P-US-05 | S1, S7; user Q2 | Mark complete or pending; new tasks start incomplete; visually distinguish completed tasks and provide All/Pending/Completed filters. | Completion control / proposed task state [S3] | Planned toggle check [S7]; display/filter cases need verification |
| P-US-06 | S1, S2; user Q4, Q5 | Optional priority defaults to Medium (Low/Medium/High); optional date is valid date-only `YYYY-MM-DD`, past dates allowed. | Priority/date controls and proposed fields [S3] | Planned priority/date checks [S7]; not run |
| P-BR-01 | S2; user Q3–Q5 and 2026-10-22 clarification | Title and description constraints, priority/date validation, unknown create fields rejection, and HTTP 400 for invalid API input are user-provided; parameterized SQL remains proposed source guidance. | API/task service/data layer [S3] | Planned validation checks [S7]; not run |
| P-ERR-01 | S2, S4, S7; user Q2, Q3, Q5 | Invalid API input returns clear message / HTTP 400; missing task returns “Task not found” / HTTP 404; other error details and UI states remain unspecified. | Proposed API error handling/UI states [S3, S4] | Planned UI and invalid/missing-ID checks [S4, S7]; not run |
| P-NFR-01 | S3–S6; user Q7, Q8 | Local use; current desktop Chrome initial target; no confirmed measurable performance, accessibility, or availability targets. Other platforms, backups, and secure-deletion details remain OPEN. | Not determined | No executed verification; open targets require decision [S6, S7] |

## 11. Completeness and approval record

- **Required source-page coverage:** 8 of 8 pages read in full (S1–S8).
- **Required pages unreadable:** none.
- **Linked content needed to understand requirements:** none identified.
- **Source-backed execution evidence:** none; the test report says verification was not run.
- **Approval status:** **APPROVED — 2026-10-22**.
- **Approved by / date / evidence:** User approval and subsequent API/presentation/unknown-field clarifications in chat on 2026-10-22. Remaining Q7–Q9 items stay explicitly OPEN and are not implied to be approved behavior.
