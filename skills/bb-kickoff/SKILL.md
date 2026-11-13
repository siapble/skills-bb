---
name: bb-kickoff
description: Use when starting any development task, before writing code or asking clarifying questions, to decide whether the work should go through brainstorming, poteto-mode, or be done directly.
metadata:
  version: 0.2.6
---

# Kickoff

Pick the route for a development request, announce it, and hand off. Kickoff does the work itself only on `direct`.

Route by who decides, not by task size. `brainstorming` puts the human in charge: it asks, proposes, and waits for approval. `poteto-mode` puts the agent in charge: it decides from evidence, prototypes instead of asking, and verifies its code.

## When this does not apply

- The request is not development work on this project (summarizing, translating, general questions). Answer directly and print no `Route:` line.
- You were handed a task by another agent or a running skill. Do that task; do not re-route it.

## Safety boundary

Check the safety boundary before the routing rules, on every route, including one the user named. Routing decides how the work is done; the safety boundary decides which operations are authorized.

| Operation | Examples | What to do |
|---|---|---|
| Low risk or reversible | Local code, local config, preparing deployment commands without running them | Nothing extra |
| High impact, recoverable | A production deploy or release with a documented, workable rollback; an infrastructure config change with a tested recovery path; a credential rotation with a tested replacement and a safe overlap | Route as usual. Authorization required unless the user asked for this exact operation and a tested rollback is confirmed in the repository (a script, a runbook) |
| Destructive or irreversible | Permanently deleting data, a destructive migration with no workable recovery path, destroying infrastructure that cannot be rebuilt, rewriting shared Git history, revoking a live credential or access that an active service still needs, with no working replacement or recovery path, anything causing an unrecoverable outage or loss of access | Authorization required |

Judge an operation by its real impact: what depends on it, whether it can be rolled back, and how access or service would be recovered. Its name does not decide: a rotation is not safe because it is called one, nor destructive only because it revokes the old credential. A rollback plan that is only claimed is not evidence. If you cannot confirm the recovery path works here, authorization is required.

Selecting a route, approving a plan, and authorizing an operation are three separate decisions; none implies another.

When authorization is required, announce it (see Steps). Investigating, planning, and preparing (reading, dry runs, backups, writing the script) go ahead without it, as long as they change no external or production state. Right before it runs, show the exact command and target, say what it will do and what cannot be undone, and run it only after the user explicitly says yes to that operation. Apart from the high-impact exception, nothing else counts as that yes: not the request, the route, an approved plan, or an earlier general permission. Do not ask for confirmation an operation does not need.

## Routing rules

Check the rules in order. The first match wins.

| # | Condition | Route |
|---|---|---|
| 1 | The user asked for `direct`, `brainstorming`, or `poteto-mode` by name, even for a high-risk task | the one they asked for |
| 2 | A destructive or irreversible operation on a shared or production system, as the safety boundary's last row defines it | `brainstorming` |
| 3 | Judged from the request as stated: a one-file change with an obvious approach; a docs or config edit that changes no behavior, even across files; a question of fact about this codebase answerable by reading. See the exclusions below | `direct` |
| 4 | The deliverable is not code (a process, a document); git presence does not decide, and an operation on a running system is not this kind of deliverable | `brainstorming` when a human still decides what it says, `direct` when it records something that exists (a checklist for an established procedure) or fixes or changes an existing one |
| 5 | Not building something new: a bug, a performance problem, a refactor, an investigation the user asked for, pull request upkeep, work from another session, unattended work with no decision left for a human, or an engineering operation (a deploy, release, deployment procedure, infrastructure maintenance, config change) whose objective and procedure are clear and leave no product or architecture decision | `poteto-mode` |
| 6 | New or changed behavior, or an engineering operation, where a human still has to decide something: who it is for, scope, preference, what success looks like, which of two conflicting requirements wins, or a product or architecture choice the operation depends on | `brainstorming` |
| 7 | New or changed behavior with nothing left for a human to decide. Open questions that can be settled by running or measuring something count as nothing left | `poteto-mode` |

Rule 3 does not match:

- when the cause or location of a problem is unknown,
- for a security fix,
- for a question that needs running or measuring something,
- for an investigation, or a question of whether something is certain,
- for a question about what should be built, which is a decision,
- for credentials or secrets, a permissions or access change, or real customer or personal data,
- for an operation that changes a shared or production system.

Editing documentation that only mentions these subjects still matches.

A bug is `direct` under rule 3 only when its location is known and the fix is obvious from the request. Otherwise, it belongs to rule 5.

A document describing an engineering operation is a non-code deliverable under rule 4. Performing or automating that operation belongs to rule 5 or 6.

Engineering choices (library, structure, naming, test layout) are not the human's decisions; only product choices, conflicting requirements, and irreversible changes are. An engineering operation does not go to `brainstorming` only because it touches production.

A route the user named is never swapped, and high risk is not a reason to question it; if it cannot finish the task (for example `direct` where a product decision is open), no route fits.

If the user ruled a route out ("do not use poteto-mode"), apply the rules as usual. When they land on it, take another route only if the same person still decides and it can do the job:

- `direct` ruled out: `poteto-mode` fits.
- `poteto-mode` ruled out: `direct` fits only when the cause and location are known and the change can be verified in one pass. Say in the reason that `poteto-mode` was ruled out.
- `brainstorming` ruled out: no route fits, because a decision is still the user's.

When no route fits, say why in one sentence, ask one question (for example, decide now or allow another route), and print no `Route:` line; route again with the answer. Do the same when you cannot tell rule 6 from rule 7, and choose `brainstorming` if the answer leaves it unclear.

## Examples

| Request | Route | Authorization |
|---|---|---|
| "Fix the off-by-one bug on line 42 of src/page.ts by changing `<` to `<=`" | `direct` (rule 3) | Not required |
| "Use direct to drop the production orders table" | `direct` (rule 1) | Required: destructive |
| "Deploy v1.4 to production with the release script" | `poteto-mode` (rule 5) | Required unless a tested rollback in the repository fits |
| "Rotate the payment API key with a tested replacement and overlap" | `poteto-mode` (rule 5) | Required unless the overlap and recovery path are confirmed |
| "Write a runbook for the deploy procedure we use" | `direct` (rule 4) | Not required |
| "Write the billing export spec; its content is still open" | `brainstorming` (rule 4) | Not required |
| "Build the notification system exactly as the spec says" | `poteto-mode` (rule 7) | Not required |
| "Revoke the live payment API key; no replacement exists" | `brainstorming` (rule 2) | Required: destructive |
| "Add a user export, do not use brainstorming; the format is undecided" | None: no route fits | Not applicable |

## Steps

1. If the request has more than one task, split it and route each task separately, one `Route:` line per task, in the order given.
2. Apply the safety boundary, then the routing rules, to the request and the context you already have.
3. Announce the route on its own line, in exactly this form:

   `Route: <target> (rule <n>) because <reason>`

   `<target>` is exactly `brainstorming`, `poteto-mode`, or `direct`, with no plugin prefix even when the installed skill has one. `<n>` is the matched rule. Write `<reason>` in one sentence about this task, not a restatement of the rule, in the user's language, as are `<assumption>` and `<operation>`.

   If an assumption decided the route, add `Assumes: <assumption>` below. If authorization is required, add `Authorization: required before <operation>` below, under `Assumes:` when both apply. With several tasks, keep each task's lines under its own `Route:` line. The user may overrule the route.
4. Unless the route is `direct`, find the target skill (see below). If it is missing, follow "When the target skill is missing".
5. Invoke the target skill and follow it. For `direct`, do the work. Finish with the report under Reporting.

## Several tasks

Work through the tasks in order. Before a later task, check whether an earlier one changed what it needs; if so, apply the safety boundary and rules again and print a new `Route:` line. Reuse what earlier tasks found instead of re-reading code.

## Reporting

End a `direct` task, and the final `poteto-mode` report, with:

- Summary, files changed, and implemented: yes, partly, or no.
- Tests: passed, failed, or not run, with the reason (no test suite, a missing tool or dependency).
- Build: passed, failed, not run, or no build step.
- Verification: verified, partially verified (name what is left), not verified, or blocked (say what stopped you).
- Remaining risks.

Passed means you ran it this session and it passed. Use checks that fit the project. If `poteto-mode` already produced this evidence, report it instead of re-running.

## Finding the target skill

Look for `brainstorming` or a name ending in `:brainstorming` (for example `superpowers:brainstorming`), and likewise `poteto-mode`; the prefix depends on the install. If both exist, use the prefixed one without asking. If the session shows no skill list, invoke the skill by name and treat it as missing only if that fails.

## After brainstorming

`brainstorming` ends by handing off to its planning skill. Once the user approves that plan, run it through `poteto-mode` when it touches more than one file or must be verified against the running system; otherwise implement it as the plan proposes. This replaces the planning skill's own execution choice: the approved plan is the only plan, so do not write a second one in another format. The safety boundary still applies to each step. If `poteto-mode` is missing then, follow "When the target skill is missing".

## When the target skill is missing

The `Route:` line stays as printed. Say which skill is missing, show the matching install command, say in one sentence why it is not done on `direct` instead, and stop. Do not do that skill's job, do not run the install command, and never say the skill ran. If another installed skill could do the job, you may name it as an option; do not choose it for them.

Some installs hide a skill only the user can start (the pstack copies for Cursor and the skills CLI do this with `poteto-mode`), which looks like missing. Always add: if the skill is installed, type `/<skill>` and the request, as in `/poteto-mode The save button crashes when clicked`; after `brainstorming`, add the approved plan's path: `/poteto-mode Implement the approved plan in <plan-path>`.

| Agent | superpowers (`brainstorming`) | pstack (`poteto-mode`) |
|---|---|---|
| Claude Code | `/plugin install superpowers@claude-plugins-official` | `/plugin marketplace add michael-denyer/pstack-claude` then `/plugin install pstack@pstack-claude` |
| Cursor | `npx skills add obra/superpowers -a cursor --copy` | `/add-plugin pstack` |
| Other agents | `npx skills add obra/superpowers --copy` | `npx skills add backnotprop/pstack --copy` |

## Wrong route

If the work shows the route was wrong, for example `poteto-mode` hits a user-only decision, stop, tell the user, and route again. Never switch routes silently.
