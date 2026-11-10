# Changelog

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
