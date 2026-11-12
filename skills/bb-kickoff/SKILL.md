---
name: bb-kickoff
description: Use when starting any development task, before writing code or asking clarifying questions, to decide whether the work should go through brainstorming, poteto-mode, or be done directly.
metadata:
  version: 0.2.5
---

# Kickoff

Pick the route for a development request, announce it, and hand off. Kickoff does the work itself only on the `direct` route.

The two routes differ in who makes the decisions. `brainstorming` puts the human in charge: it asks, proposes, and waits for approval before anything is built. `poteto-mode` puts the agent in charge: it decides from evidence, prototypes instead of asking, and ends with verified code. Route by who has to decide, not by how big the task is.

## When this does not apply

- The request is not development work on this project (summarizing, translating, a general question that is not about this codebase). Answer it directly and print no `Route:` line.
- You were handed a specific task by another agent, or by a skill that is already running. Do that task. Do not re-route it.

## Safety boundary

Check the safety boundary before the routing rules. It holds on every route, including one the user named. Routing decides how the work is done. The safety boundary decides which operations are authorized.

| Operation | Examples | What to do |
|---|---|---|
| Low risk or reversible | Local code, local config, preparing deployment commands without running them | Nothing extra |
| High impact, recoverable | A production deploy or a release with a documented, workable rollback, an infrastructure or operational configuration change with a tested recovery path, rotating a credential with a safe overlap (the replacement is created and tested, and services switch to it while the old one still works) | Route as usual. Authorization required, unless the user asked for this exact operation and you have checked in the repository (a script, a runbook) that a tested rollback path works for it |
| Destructive or irreversible | Permanently deleting data, a destructive migration with no workable recovery path, destroying infrastructure that cannot be rebuilt, rewriting shared Git history, revoking a live credential without a working replacement, revoking one that active services may still need with no recovery path, anything that can cause an unrecoverable outage or loss of access | Authorization required |

Judge an operation by its real impact: what depends on it, whether it can be rolled back, and how access or service would be recovered. Its name does not decide. A rotation is not safe because it is called one, and it is not destructive only because it ends by revoking the old credential. A rollback plan that is only claimed is not evidence. If you cannot confirm that the recovery path works for this operation, authorization is required.

Selecting a route, approving a plan, and authorizing an operation are three separate decisions, and none implies another. A route selects the workflow. Plan approval confirms the approach. Authorization allows one specific operation.

When authorization is required, announce it (see Steps). Investigating, reviewing, planning, and preparing (reading, dry runs, backups, writing the script) go ahead without it, as long as they do not change external or production state. Right before the operation runs, show the exact command and target, say what it will do and what cannot be undone, and run it only after the user explicitly says yes to that operation. Apart from the exception in the high-impact row, nothing else counts as that yes: not the request, not the route, not an approved plan, and not a general permission given earlier. Do not ask for confirmation that an operation does not need.

## Routing rules

Check the rules in order. The first match wins.

| # | Condition | Route |
|---|---|---|
| 1 | The user asked for `direct`, `brainstorming`, or `poteto-mode` by name, even for a high-risk task | the one they asked for |
| 2 | A destructive or irreversible operation on a shared or production system, as the safety boundary's last row defines it | `brainstorming` |
| 3 | Judged from the request as stated, any of these: a change that fits in one file with an obvious approach; a documentation or configuration edit that changes no behavior, even across several files; a question of fact about this codebase that you can answer by reading, including how existing code works. See the exclusions below | `direct` |
| 4 | The deliverable is not code (a process, a document). Whether a git repository exists does not decide the route. An operation on a running system is not this kind of deliverable | `brainstorming` when a human still has to decide what it says, `direct` when it records something that already exists (a checklist for an established procedure) or fixes or changes an existing one |
| 5 | Not building something new: a bug, a performance problem, a refactor, an investigation the user asked for, looking after a pull request, picking up work from another session, work the user wants run to completion unattended with no decision left for a human, or an engineering operation (a deploy, a release, running a deployment procedure, infrastructure maintenance, applying an operational configuration change) whose objective and procedure are clear and leave no product or architecture decision | `poteto-mode` |
| 6 | New or changed behavior, or an engineering operation, where a human still has to decide something: who it is for, scope, preference, what success looks like, which of two conflicting requirements wins, or a product or architecture choice the operation depends on | `brainstorming` |
| 7 | New or changed behavior with nothing left for a human to decide. Open questions that can be settled by running or measuring something count as nothing left to decide | `poteto-mode` |

Rule 3 does not match:

- when the cause or location of a problem is unknown,
- for a security fix,
- for a question that needs running or measuring something,
- when the user asks for an investigation or asks whether something is certain,
- for a question about what should be built, which is a decision,
- for an operation on credentials or secrets, a change to permissions or access, or an operation on real customer or personal data,
- for an operation that changes a shared or production system.

Editing documentation that only mentions these subjects still matches.

Engineering choices (which library, how to structure the code, naming, test layout) are not decisions for the human. Only product choices, conflicting requirements, and changes that cannot be undone are.

An engineering operation does not go to `brainstorming` only because it touches production.

A route the user named is never swapped for another, and high risk is not a reason to question it. If it cannot finish the task, for example `direct` for a task where a product decision is still open, no route fits.

If the user ruled a route out ("do not use poteto-mode"), apply the rules as usual. When they land on the ruled-out route, take another route only if the same person still decides and it can do the job:

- `direct` ruled out: `poteto-mode` fits.
- `poteto-mode` ruled out: `direct` fits only when the cause and location are known and the change can be verified in one pass. Say in the reason that `poteto-mode` was ruled out.
- `brainstorming` ruled out: no route fits, because a decision is still the user's.

When no route fits, say why in one sentence, ask one question (for example, make the open decision now, or allow another route), and print no `Route:` line. Route again with the answer. Do the same when you cannot tell rule 6 from rule 7. If the answer leaves it unclear, choose `brainstorming`.

## Examples

| Request | Route | Authorization |
|---|---|---|
| "Fix the off-by-one bug on line 42 of src/page.ts by changing `<` to `<=`" | `direct` (rule 3) | Not required |
| "Use direct to drop the production orders table" | `direct` (rule 1) | Required: destructive |
| "Deploy v1.4 to production with the release script" | `poteto-mode` (rule 5) | Required, unless you have checked that a tested rollback in the repository fits this deploy |
| "Rotate the payment API key: create the new one, test it, switch services, then retire the old one" | `poteto-mode` (rule 5) | Required, unless the overlap and the recovery path are confirmed from the repository |
| "Revoke the live payment API key now", and no replacement exists | `brainstorming` (rule 2) | Required: destructive |
| "Add a user export, do not use brainstorming", and the export format is undecided | None: no route fits | Not applicable |

In every row, investigating and preparing go ahead before authorization.

## Steps

1. If the request contains more than one task, split it and route each task separately, one `Route:` line per task, in the order the user gave them.
2. Apply the safety boundary, then the routing rules, to the request and the context you already have.
3. Announce the route on its own line, in exactly this form:

   `Route: <target> (rule <n>) because <reason>`

   `<target>` is exactly `brainstorming`, `poteto-mode`, or `direct`, with no plugin prefix even when the installed skill has one. `<n>` is the rule that matched. If an assumption decided the route, add `Assumes: <assumption>` on the next line. If the safety boundary requires authorization, add `Authorization: required before <operation>` on the next line, after `Assumes:` if there is one. When there are several tasks, keep each task's `Assumes:` and `Authorization:` lines right under its `Route:` line. Write `<reason>` in one sentence about this task, not a restatement of the rule, and write `<reason>`, `<assumption>`, and `<operation>` in the user's language. The user may overrule the route.
4. Unless the route is `direct`, find the target skill (see below). If it is missing, follow "When the target skill is missing".
5. Invoke the target skill and follow it. For `direct`, do the work. Finish with the report described under Reporting.

## Several tasks

Work through the tasks in the order given. Before starting a later task, check whether an earlier task changed what it needs. If it did, apply the safety boundary and the rules to it again and print a new `Route:` line. Reuse what earlier tasks found instead of reading the same code again.

## Reporting

End a `direct` task, and the final report after `poteto-mode`, with a short report:

- Summary, files changed, and implemented: yes, partly, or no.
- Tests: passed, failed, or not run, with the reason (no test suite, a missing tool or dependency).
- Build: passed, failed, not run, or no build step.
- Verification: verified, partially verified (name what is left), not verified, or blocked (say what stopped you).
- Remaining risks.

Passed means you ran it in this session and it passed. Use the checks that fit the project; it does not need every kind of test. When `poteto-mode` already produced this evidence, report it instead of running the checks again.

## Finding the target skill

Look through the skills available in this session for one named `brainstorming` or ending in `:brainstorming` (for example `superpowers:brainstorming`), and likewise for `poteto-mode`. The prefix depends on how the skill was installed. If both a prefixed and an unprefixed copy exist, use the prefixed one and carry on without asking. If the session does not show a list of skills, try invoking the skill by name, and treat it as missing only if that fails.

## After brainstorming

`brainstorming` ends by handing off to its planning skill. Once the user has approved that plan, run the implementation through `poteto-mode` when it touches more than one file or has to be verified against the running system. Otherwise implement it the way the plan proposes. This choice replaces the planning skill's own choice of execution method. The approved plan is the only plan. Do not write a second one in another format. The safety boundary still applies to each step of the plan. If `poteto-mode` is missing at that point, follow "When the target skill is missing".

## When the target skill is missing

The `Route:` line is already printed, and the route stays as it is. Say which skill is missing, show the matching install command, say in one sentence why the task is not done on the `direct` route instead, and stop. Do not do that skill's job yourself, do not run the install command, and never say the skill ran. If another installed skill could do the job, you may name it as an option the user can choose. Do not choose it for them.

Some installs hide a skill so that only the user can start it (the pstack copies for Cursor and for the skills CLI do this with `poteto-mode`), and you cannot tell that from a missing skill. So always add: if the skill is already installed, type `/<skill>` followed by the request, for example `/poteto-mode The save button crashes when clicked`. When this happens after `brainstorming`, put the approved plan's path in that command, for example `/poteto-mode Implement the approved plan in <plan-path>`.

| Agent | superpowers (`brainstorming`) | pstack (`poteto-mode`) |
|---|---|---|
| Claude Code | `/plugin install superpowers@claude-plugins-official` | `/plugin marketplace add michael-denyer/pstack-claude` then `/plugin install pstack@pstack-claude` |
| Cursor | `npx skills add obra/superpowers -a cursor --copy` | `/add-plugin pstack` |
| Other agents | `npx skills add obra/superpowers --copy` | `npx skills add backnotprop/pstack --copy` |

## Wrong route

If the work shows the route was wrong, for example `poteto-mode` runs into a decision only the user can make, stop, tell the user, and apply the routing rules again. Never switch routes without saying so.
