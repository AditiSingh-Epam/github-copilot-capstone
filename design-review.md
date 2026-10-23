# Design Review — To-Do Application

> **Review status:** Design review complete; DR-001 response agreed and incorporated on 2026-10-22.
>
> **Verdict:** No unresolved Critical or High design findings remain. The Medium, non-blocking security finding was resolved at the architecture/design level. Implementation and verification evidence is recorded in [`impl-plan.md`](impl-plan.md); QA-007 remains partial/unverified and was accepted as a documented release-preparation limitation on 2026-10-22.
>
> **Review date:** 2026-10-22
>
> **Source of truth:** [`requirements.md`](requirements.md), approved 2026-10-22. This review evaluates [`architecture.md`](architecture.md); neither architecture decisions nor requirements were changed.

## Scope and method

Reviewed the approved requirements and architecture proposal against all 11 checklist areas in `.github/agents/design-review.agent.md`. After the human decision on DR-001, the architecture was updated to record that decision. This is a design review, not an implementation, code, or test review. The architecture identifies proposed technologies as proposals; no implementation or executed test evidence is claimed here.

## Findings

### Blocking findings

None identified.

### Non-blocking finding — design response agreed

#### DR-001 — Define browser-origin protections for the unauthenticated local API

- **Severity:** Medium
- **Requirement/component affected:** P-US-01–P-US-06, P-ERR-01; proposed Local HTTP API / local runtime security boundary.
- **Evidence/location:** `architecture.md` §2 describes browser-to-local-HTTP/JSON API calls; §3 and §6 exclude authentication and propose loopback binding and same-origin access “where practical”; §10 permits either same-origin serving or a separately configured local API origin. The design does not specify how the API validates browser `Origin`/`Host` or prevents cross-origin state-changing requests.
- **Risk/impact:** If a user runs the local API while browsing an untrusted site, that site may be able to cause browser requests to the loopback service. Depending on browser and server behavior, an unintended request could mutate or permanently delete local tasks. Loopback binding alone does not define a browser-origin policy.
- **Recommended action:** Adopt a restrictive local-origin policy: allow only the intended application origin, reject unexpected origins/hosts, do not enable permissive CORS, and protect state-changing routes against cross-origin requests (for example, verify `Origin` and require an appropriate JSON request). Add focused tests for allowed and rejected origins and for mutation requests. **Design action:** The architecture now records the selected direction; implementation and focused tests remain outstanding.
- **Decision required from human?:** Yes — answered 2026-10-22. The user selected the recommended same-origin and restrictive local-origin protections.
- **Status:** Resolved at architecture-design level; implementation and verification outstanding.
- **Blocking status:** Non-blocking for architecture review. Implement and test the agreed policy before exposing the browser-facing API. This does not require adding authentication or changing the approved local-only scope.

## Checklist results

| # | Review area | Result | Evidence and assessment |
|---|---|---|---|
| 1 | Functional coverage and traceability | **Pass** | `architecture.md` §14 maps P-US-01–P-US-06, P-BR-01, P-ERR-01, and P-NFR-01 to proposed components/interfaces; §§2–5 and §14 cover create/read/edit/delete, completion, priority, due date, filters/order, and required validation. Requirements’ traceability matrix records corresponding stories and planned (not executed) verification. |
| 2 | Role boundaries and backend authorization | **Pass** | Architecture §§1, 3, and 6 correctly reflect approved local single-user scope without authentication, roles, or ownership checks. It does not imply multi-user isolation and recommends loopback binding. Finding DR-001 separately addresses browser-origin access to the unauthenticated API. |
| 3 | User task-field validation, including direct API response leakage | **Pass** | Architecture §§4–6 requires service/API validation independent of the UI for title, description, priority, due date, and completion; defines 400 for invalid input and avoids returning internal exception details. It also recommends not logging task descriptions. No unapproved task fields or direct echo behavior is specified. Implementation should preserve these boundaries. |
| 4 | Task validation, error semantics, and not-found behavior | **Pass** | Architecture §§4–5 and §8 specify required 400 validation behavior, exact `Task not found` / 404 behavior for missing read/edit/delete targets, and controlled generic handling for other failures without exposing internals. Exact error envelopes and other statuses are correctly left as contract details rather than requirements. |
| 5 | Data consistency, persistence, transaction boundaries, and race conditions | **Pass** | Architecture §§2–3, 7, and 10 proposes local durable persistence, atomic committed mutations, parameterized operations, and reporting success only after commit. §7 explicitly distinguishes individual transaction atomicity from concurrent-edit conflict behavior and records Q9 alternatives without selecting one. The datastore is not yet selected, so implementation must preserve these properties with its selected technology. |
| 6 | Unresolved task completion/deletion policy and other open business rules | **Pass** | Architecture §§4–5 and §12 reflect approved incomplete-by-default, complete/pending behavior, permanent deletion with UI confirmation, and no soft-delete/undo. §§4, 7, 12, and 13 preserve unresolved Q9 items instead of inferring behavior. See the implementation gates below; the existence of an OPEN item is not itself a finding. |
| 7 | Authentication/session handling and secrets management | **Pass** | Authentication and sessions are not applicable to the approved no-auth local MVP. Architecture §§6 and 10 states that no credential is required, recommends local-only binding, and does not claim encryption, backup, or secure deletion. No secrets are introduced. |
| 8 | Data model integrity, lifecycle, and auditability | **Pass** | Architecture §5 defines the conceptual task fields and required defaults/constraints; §§6 and 10 reflect local retention until user deletion and explicitly state no audit trail is required. Requirements Q8 also states no separate audit history. Schema/migrations and storage path are identified as implementation decisions, not falsely claimed as existing. |
| 9 | Availability, performance, observability, maintainability, and testability | **Pass** | Requirements Q7 has no measurable performance, availability, or formal accessibility target. Architecture §§8, 11, 12, and 13 avoids inventing one, proposes local diagnostics without task content, and identifies proposed components and test tooling. The lack of quantitative targets is not a finding; do not claim unapproved guarantees. |
| 10 | Dependency, deployment, and integration risks | **Pass** | Architecture §§1, 9–11 clearly labels React/Vite, Node/Express, SQLite, and Vitest as proposals, notes no application stack is present, gives alternatives, and excludes cloud/external integrations consistently with scope. §10 calls out local storage location and migration choices for implementation. |
| 11 | Failure modes, rollback/recovery, and operational support | **Pass** | Architecture §§7–8 and §10 addresses atomic mutation behavior, unavailable/busy database, disk-full and unexpected failures, generic user-facing errors, local diagnostics, durable storage location, and explicit absence of backup/recovery or secure-erasure guarantees. The Q8 omissions are not represented as available capabilities. |

## Coverage and traceability summary

- The approved requirements define P-US-01 through P-US-06 plus P-BR-01, P-ERR-01, and P-NFR-01. Architecture §14 provides a row for each; the mapping is coherent at proposal level.
- Required task behavior and approved validation/error constraints are represented in the component, API, data-model, and validation sections.
- Proposed routes, JSON envelopes, stack, and schema are not requirements or approval evidence. Architecture correctly labels them as proposed.
- Requirements §10 and architecture §15 state that tests have not been run / implementation is absent; this review makes no claim of code correctness or verification.
- Review coverage is based on the complete approved requirement baseline and current architecture document. No code was inspected or changed.

## OPEN decisions and implementation readiness

The remaining OPEN questions are not treated as findings merely because they are unresolved:

- **Q7 — Platform and quality targets:** Performance, availability, formal accessibility conformance, other browsers, mobile, and quantitative targets do **not** block the approved local MVP. Desktop Chrome is the initial target. Do not claim support or targets that have not been approved.
- **Q8 — Privacy/data lifecycle:** Formal retention, backup/recovery, and secure deletion do **not** block the MVP as scoped because the architecture explicitly makes no such guarantees. They remain operational limitations; do not present them as solved or as accepted risks without a named owner/rationale.
- **Q9 — Task interactions:** These remain open, not design defects by default. However, the edit contract (which fields are editable and partial versus full update), update-conflict behavior, and the completion write shape/side effects affect implementation choices. Do not implement those behaviors by inference: obtain a human decision or explicitly exclude the affected behavior before implementing it. Other Q9 items (such as pagination, duplicate handling, empty-state presentation, and success feedback) can be excluded from initial implementation if scope is made explicit; do not invent their behavior.

Accordingly, unresolved Q7/Q8 targets do not block MVP implementation. Relevant Q9 choices block the affected task flows until decided or explicitly excluded. The approved requirements’ implementation gate also requires architecture approval; this review does not approve the architecture.

## Review verdict and human decisions

- **Review verdict:** No Critical/High design finding; DR-001 is resolved at architecture-design level, with implementation and verification outstanding. Architecture is approved for Planning; this review does not approve implementation.
- **Architecture change:** Updated §§6, 10, and 15 after the user's DR-001 decision. Requirements were not changed.
- **Decision recorded:** The user selected the recommended DR-001 same-origin and restrictive local-origin protections on 2026-10-22; architecture §§6, 10, and 15 record the proposed response. The user has not approved the architecture overall.
- **Next approval:** Approve or request changes to the implementation plan before implementation. Resolve or explicitly exclude Q9 items that affect each implementation slice before those flows are built.
- **Approval evidence:** Requirements approval and architecture approval for planning were given in chat on 2026-10-22.
