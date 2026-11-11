---
name: bb-kickoff
description: Use when starting any development task, before writing code or asking clarifying questions, to decide whether the work should go through brainstorming, poteto-mode, or be done directly.
metadata:
  version: 0.2.2
---

# Kickoff

Pick the route for a development request, announce it, and hand off. Kickoff never does the work itself.

The two routes differ in who makes the decisions. `brainstorming` puts the human in charge: it asks, proposes, and waits for approval before anything is built. `poteto-mode` puts the agent in charge: it decides from evidence, prototypes instead of asking, and ends with verified code. Route by who has to decide, not by how big the task is.

## When this does not apply

- The request is not development work (summarizing, translating, questions that are not about this codebase). Answer it directly and print no `Route:` line.
- You were handed a specific task by another agent, or by a skill that is already running. Do that task. Do not re-route it.

## Safety boundary

The safety boundary covers every operation that needs the user's authorization, not only destructive ones. Check it before the routing rules. It holds on every route, including a route the user named, and it is independent of the route.

| Operation | Examples | What to do |
|---|---|---|
| Low risk or reversible | Local code, local config | Nothing extra |
| High impact, recoverable | A production deploy, a release, an infrastructure change, applying an operational configuration change, rotating a credential with a safe overlap: create the replacement, test it, switch services to it while the old one still works, with a documented recovery path | Route as usual. Authorization required, unless the user asked for this exact operation and a tested rollback path is known from the request or the repository |
| Destructive or irreversible | Permanently deleting data, a destructive migration, destroying infrastructure, rewriting shared Git history, revoking a live credential without a working replacement, revoking one that active services may still need with no recovery path, anything that can cause an unrecoverable outage or loss of access | Authorization required |

Judge an operation by its real impact: what depends on it, whether it can be rolled back, and how access or service would be recovered. Its name does not decide. Calling something a rotation does not make it safe, and a rotation is not destructive only because it ends by revoking the old credential.

Three decisions stay separate, and none implies another:

1. Selecting a route.
2. Approving an implementation plan.
3. Authorizing a high-impact or destructive operation.

When authorization is required, announce it (see Steps). Investigating, reviewing code, planning, and preparing (reading, dry runs, backups, writing the script) go ahead without it, as long as they do not change external or production state. Right before the operation runs, show the exact command and target, and run it only after the user explicitly says yes to that operation. The request itself, the route (even one the user named), and approval of a plan do not count as that yes.

## Routing rules

Check the rules in order. The first match wins.

| # | Condition | Route |
|---|---|---|
| 1 | The user asked for `direct`, `brainstorming`, or `poteto-mode` by name. The safety boundary still applies | the one they asked for |
| 2 | A destructive or irreversible operation on a shared or production system, as the safety boundary's last row defines it | `brainstorming` |
| 3 | Judged from the request as stated, any of these: a change that fits in one file with an obvious approach; a documentation or configuration edit that changes no behavior, even across several files; a question of fact that you can answer by reading code or from what you know, including how existing code works. It does not match when the cause or location of a problem is unknown, for a security fix, for a question that needs running or measuring something, when the user asks for an investigation or asks whether something is certain, for a question about what should be built, which is a decision, or for an operation that changes a shared or production system | `direct` |
| 4 | The deliverable is not code (a process, a document). Whether a git repository exists does not decide the route. An operation on a running system is not this kind of deliverable | `brainstorming` for something new, `direct` for a fix or change to something that exists |
| 5 | Not building something new: a bug, a performance problem, a refactor, an investigation the user asked for, looking after a pull request, picking up work from another session, work the user wants run to completion unattended, or an engineering operation (a deploy, a release, running a deployment procedure, infrastructure maintenance, applying an operational configuration change) whose objective and procedure are clear and leave no product or architecture decision | `poteto-mode` |
| 6 | New or changed behavior, or an engineering operation, where a human still has to decide something: who it is for, scope, preference, what success looks like, which of two conflicting requirements wins, or a product or architecture choice the operation depends on | `brainstorming` |
| 7 | New or changed behavior with nothing left for a human to decide. Open questions that can be settled by running or measuring something count as nothing left to decide | `poteto-mode` |

Engineering choices (which library, how to structure the code, naming, test layout) are not decisions for the human. Only product choices, conflicting requirements, and changes that cannot be undone are.

An engineering operation does not go to `brainstorming` only because it touches production. Routing it to `poteto-mode` lets the agent investigate and prepare. It never authorizes running the operation. The safety boundary decides that.

If the user ruled a route out ("do not use poteto-mode"), apply the rules as usual. When they land on the ruled-out route, check the remaining routes against the task. Take one only if the same person still decides and it can do the job:

- `direct` ruled out: `poteto-mode` fits.
- `poteto-mode` ruled out: `direct` fits only when the cause and location are known and the change can be verified in one pass. Say in the reason that `poteto-mode` was ruled out.
- `brainstorming` ruled out: no remaining route fits, because a decision is still the user's.

When nothing fits, say in one sentence why, ask one question (for example, make the open decision now, or allow the ruled-out route), and print no `Route:` line. Route again with the answer.

## Steps

1. If the request contains more than one task, split it and route each task separately, one `Route:` line per task, in the order the user gave them.
2. Apply the safety boundary, then the routing rules, to the request and the context you already have.
3. If you cannot tell rule 6 from rule 7, ask the user one question. If it is still unclear, choose `brainstorming`.
4. Unless the route is `direct`, find the target skill (see below).
5. Announce the route on its own line, in exactly this form:

   `Route: <target> (rule <n>) because <reason>`

   `<target>` is exactly `brainstorming`, `poteto-mode`, or `direct`, with no plugin prefix even when the installed skill has one. `<n>` is the rule that matched. Write `<reason>` in one sentence in the user's language. If an assumption decided the route, add one more line, `Assumes: <assumption>`. If the safety boundary requires authorization, add `Authorization: required before <operation>`. The user may overrule the route.
6. Invoke the target skill and follow it. For `direct`, do the work and report as described below. Kickoff is finished.

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

`brainstorming` ends by handing off to its planning skill. Once the user has approved that plan, run the implementation through `poteto-mode` when it touches more than one file or has to be verified against the running system. Otherwise implement it the way the plan proposes. This choice replaces the planning skill's own choice of execution method. The approved plan is the only plan. Do not write a second one in another format. Approving the plan does not authorize its high-impact or destructive steps. Each one still waits for the yes the safety boundary asks for. If `poteto-mode` is missing at that point, follow "When the target skill is missing".

## When the target skill is missing

Say which skill is missing, show the matching install command, and stop. Do not do that skill's job yourself, do not run the install command, and never say the skill ran. If another installed skill could do the job, you may name it as an option the user can choose. Do not choose it for them.

Some installs hide a skill from you so that only the user can start it. The pstack copies for Cursor and for the skills CLI do this with `poteto-mode`. You cannot tell such a skill apart from a missing one, so always add: if the skill is already installed, type `/<skill>` followed by the request, for example `/poteto-mode The save button crashes when clicked`.

| Agent | superpowers (`brainstorming`) | pstack (`poteto-mode`) |
|---|---|---|
| Claude Code | `/plugin install superpowers@claude-plugins-official` | `/plugin marketplace add michael-denyer/pstack-claude` then `/plugin install pstack@pstack-claude` |
| Cursor | `npx skills add obra/superpowers -a cursor --copy` | `/add-plugin pstack` |
| Other agents | `npx skills add obra/superpowers --copy` | `npx skills add backnotprop/pstack --copy` |

## Wrong route

If the work shows the route was wrong, for example `poteto-mode` runs into a decision only the user can make, stop, tell the user, and apply the routing rules again. Never switch routes without saying so.
