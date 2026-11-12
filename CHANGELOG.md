# Changelog

## 0.2.4

### Changed

- Rule 3 (`direct`) no longer takes operations on credentials or secrets, changes to permissions or access, or operations on real customer or personal data. Editing documentation that only mentions these subjects is still `direct`.
- When the target skill is missing, the `Route:` line is printed first and the route is kept. The message then names the missing skill, shows the install command, and says in one sentence why the task is not done on the `direct` route instead.
- The reason in the `Route:` line must be about the task, not a restatement of the rule.
- The README compatibility table records manual checks of routing and the full workflow on Claude Code and Cursor.

## 0.2.3

### Changed

- A route the user names is kept even for a high-risk task, and is never swapped for another. Naming a route authorizes nothing. If the named route cannot finish the task, the agent states the conflict and asks one question.
- The safety boundary states the split in one line: routing decides how the work is done, the safety boundary decides which operations are authorized. A general permission given earlier does not authorize a later operation, and the agent says what cannot be undone before it asks.
- A rollback plan that is only claimed is not evidence. Authorization for a high-impact operation is skipped only when the user asked for that exact operation and the agent has checked in the repository that a tested rollback works for it.
- Rule 4 routes a non-code deliverable by what is left to decide. A document that records something that already exists, such as a checklist for an established procedure, goes to `direct`. One whose content a human still has to decide goes to `brainstorming`.
- Rule 5 takes work the user wants run unattended only when no decision is left for a human.
- Rule 3 covers questions of fact about the codebase only. A general question that is not about the codebase gets a plain answer with no `Route:` line.
- The one exception to explicit authorization is stated once: a high-impact operation the user asked for by name, with a rollback the agent has checked. Nothing else counts as a yes.
- `SKILL.md` is shorter. Repeated statements are merged, the rule 3 exclusions are a list under the table, and "no route fits" is described in one place. The intro no longer says kickoff never does the work, because it does on the `direct` route.
- The README shows the three routes as three plain questions instead of a flowchart.
- The agent compatibility table in the README separates installing, finding the skill, inspecting routing, and verifying a full workflow.

### Added

- An examples table in `SKILL.md` covering a named route on a destructive operation, a production deploy, credential rotation, credential revocation, and a ruled-out route with nothing left that fits.

## 0.2.2

### Changed

- Rule 5 covers engineering operations (a deploy, a release, a deployment procedure, infrastructure maintenance, an operational configuration change) when the goal and procedure are clear and no product or architecture decision remains. Rule 6 takes them when such a decision remains. Rules 3 and 4 no longer take operations that change a shared or production system.
- The safety boundary covers every operation that needs authorization, not only destructive ones, and says it is independent of the route.
- Credential rotation is split by real impact. Rotating with a tested replacement, an overlap period, and a recovery path is high impact but recoverable. Revoking a credential with no working replacement, or one that active services may still need with no recovery path, is destructive.
- Selecting a route, approving a plan, and authorizing an operation are listed as three separate decisions. Investigation, review, planning, and preparation that do not change external or production state need no authorization.

### Removed

- The routing test suite (`tests/cases.json`, `tests/run.mjs`) and the generated `tests/RESULTS.md`. Checks are now the lightweight ones in `AGENTS.md`. The skill's reporting rules are unchanged.

## 0.2.1

### Added

- A safety boundary, checked before the routing rules and on every route, including one the user named. A destructive or irreversible operation prints `Authorization: required before <operation>`. The agent may investigate, plan, and prepare, but runs the operation only after the user says yes to that exact command and target. The request, the route, and an approved plan do not count as that yes.
- Rule 1 accepts `direct` as a route the user can name.
- One report shape for `direct` and the final report after `poteto-mode`: implemented, tests, build, verification (verified, partially verified, not verified, or blocked), and remaining risks.
- Test cases for the safety boundary (F01 to F06), no git repository (G04), ruled-out routes (X01 to X04), and reporting (V01 to V06, checked by hand because a `Route:` line cannot show them). `tests/run.mjs` gains `anyOf`, `mustNotMention`, and `manual`.

### Changed

- Rule 2 covers only destructive or irreversible operations. A deploy, an infrastructure change, or a credential rotation routes as usual, and needs authorization unless the user asked for that exact operation and a tested rollback is known.
- Rule 4 no longer looks at whether a git repository exists. A missing repository does not send new work to `brainstorming`.
- A ruled-out route is no longer swapped for a fixed partner. The agent checks the remaining routes and takes one only if the same person still decides and it can do the job. When nothing fits, it explains and asks one question. A ruled-out `poteto-mode` becomes `direct` only when the cause and location are known and one pass can verify the change.

## 0.2.0

### Changed

- The `Route:` line now names the rule that decided it, as in `Route: poteto-mode (rule 5) because ...`.
- Rules are renumbered to make room for the new rule 2. Rules 2 to 6 of 0.1 are now rules 3 to 7.

### Added

- Rule 2. A change that cannot be undone on a shared or production system goes to `brainstorming`, so the user decides it.
- Engineering choices do not count as decisions for the user. Product choices and conflicting requirements do.
- An optional `Assumes:` line when an assumption decided the route.
- A reporting contract for the `direct` route. The agent reports what changed and what it checked, and never claims a check it did not run.
- In a request with several tasks, a later task is routed again when an earlier task changed what it needs.
- When a target skill is missing, the agent may name an installed skill the user could choose instead. It still stops and does not choose for them.
- Rule 3 (`direct`) no longer takes security fixes, questions that need running or measuring, or questions about what should be built.
- The missing-skill message tells the user to type the slash command if the skill is installed but hidden from the agent. The Cursor plugin and the skills CLI copy of pstack hide `poteto-mode` this way.
- A routing test suite in `tests/`, run with `node tests/run.mjs`.

## 0.1.0

- First release of `bb-kickoff` with six routing rules and three routes: `direct`, `brainstorming`, `poteto-mode`.
