# skills-bb

[![skills.sh](https://skills.sh/b/siapble/skills-bb)](https://skills.sh/siapble/skills-bb)

`bb-kickoff` is an agent skill that decides how a development task should be handled before the agent starts on it.

## The problem

Coding agents can work in very different ways. Some workflows stop and ask you about every choice. Others make the choices themselves and only show you the result. Picking the wrong one costs you either a long round of questions about a typo, or a finished feature that solves the wrong problem.

`bb-kickoff` makes that pick for you, says which one it picked and why, and hands the task over.

## The idea

Route by who has to decide, not by how big the task is.

A one-line change to the default currency still needs you to say which currency. A rename across 300 files needs nobody's opinion. So the first goes to you and the second goes to the agent.

## Three routes

| Route | What the agent does | When it fits |
|---|---|---|
| `brainstorming` | Asks questions, proposes options, and waits for your approval before building anything. | You still have decisions to make. |
| `poteto-mode` | Investigates, decides from evidence, and delivers code it has verified. | The goal is clear and the effort is in doing it well. |
| `direct` | Does the task and reports what it changed and checked. | The task is small and clear. |

```mermaid
flowchart LR
    R[Your request] --> K[bb-kickoff]
    K --> S{Who has to decide?}
    S -->|Small and clear| D[direct]
    S -->|You do| B[brainstorming]
    S -->|The agent can| P[poteto-mode]
```

`brainstorming` comes from [superpowers](https://github.com/obra/superpowers) and `poteto-mode` comes from [pstack](https://github.com/backnotprop/pstack). This repository does not copy them. You install them yourself.

## Install

```bash
npx skills add siapble/skills-bb -a claude-code cursor --copy
```

The skills CLI asks for Node.js 22.20 or later.

## Required skills

Install both of these once.

| Agent | superpowers (`brainstorming`) | pstack (`poteto-mode`) |
|---|---|---|
| Claude Code | `/plugin install superpowers@claude-plugins-official` | `/plugin marketplace add michael-denyer/pstack-claude` then `/plugin install pstack@pstack-claude` |
| Cursor | `npx skills add obra/superpowers -a cursor --copy` | `/add-plugin pstack` |
| Other agents | `npx skills add obra/superpowers --copy` | `npx skills add backnotprop/pstack --copy` |

The Claude Code command for pstack installs `michael-denyer/pstack-claude`, a third-party build of pstack for Claude Code. In that build the agent can start `poteto-mode` itself.

The Cursor plugin and the skills CLI copy of pstack mark `poteto-mode` so that only you can start it. The agent cannot see a skill marked this way, so it reports `poteto-mode` as missing. Its message also tells you that, if pstack is already installed, you can type `/poteto-mode` followed by your request.

If one of the two is missing, `bb-kickoff` tells you which one, shows the command from this table, and stops. It does not install anything, and it does not do the missing skill's job itself. It may name a skill you already have that could do the job instead, and leave the choice to you.

## What you see

You ask for something:

```
The save button crashes when clicked
```

The agent answers with one line and then starts that route:

```
Route: poteto-mode (rule 5) because this is a bug and its cause is not known yet
```

If an assumption decided the route, a second line says so:

```
Assumes: the export format is already agreed in the ticket
```

If the task includes a destructive operation, another line says so:

```
Authorization: required before dropping the legacy_orders table
```

If you disagree, name the route you want and the agent switches. Requests that are not development work, such as "translate this email", get a plain answer with no `Route:` line.

## Safety boundary

Before routing, `bb-kickoff` checks whether the task includes a destructive operation. This holds on every route, including one you named.

| Operation | Examples | What happens |
|---|---|---|
| Low risk or reversible | Local code, local config | Nothing extra |
| High impact, recoverable | A production deploy, an infrastructure change, rotating a credential | Normal routing. Authorization required, unless you asked for this exact operation and a tested rollback is known |
| Destructive or irreversible | Permanently deleting data, a destructive migration, destroying infrastructure, rewriting shared Git history, revoking a live credential | Authorization required |

When authorization is required, the agent still investigates, plans, and prepares. Right before the operation runs, it shows you the exact command and target and waits for your yes. Your request, the route, and an approved plan do not count as that yes.

## Rules

`bb-kickoff` checks these in order and stops at the first one that matches.

| # | Your request | Route |
|---|---|---|
| 1 | You asked for `direct`, `brainstorming`, or `poteto-mode` by name. The safety boundary still applies | the one you asked for |
| 2 | A destructive or irreversible operation on a shared or production system, as the safety boundary defines it | `brainstorming` |
| 3 | A one-file change with an obvious fix, a docs or config edit that changes no behavior, or a question of fact the agent can answer by reading, including how existing code works | `direct` |
| 4 | The result is not code. Having a git repository or not does not decide the route | `brainstorming` for something new, `direct` for a fix or change to something that exists |
| 5 | A bug, a slowdown, a refactor, an investigation you asked for, pull request upkeep, picking up work from another session, or a task to run unattended | `poteto-mode` |
| 6 | New or changed behavior, and you still have to decide who it is for, how far it goes, what done means, or which of two conflicting requirements wins | `brainstorming` |
| 7 | New or changed behavior with nothing left for you to decide, including questions the agent can answer by running or measuring something | `poteto-mode` |

Rule 3 is judged from the request alone. It does not apply when:

- nobody knows yet where the problem is,
- the change is a security fix,
- answering means running or measuring something, as in "is cache A or B faster?",
- you ask for an investigation or ask whether something is certain, as in "are we sure this handles expired tokens?",
- the question is about what should be built, as in "what should the dashboard show?". That is a decision for you.

Engineering choices, such as which library, how to structure the code, or what to name things, are the agent's to make. Only product choices and conflicts count as decisions for you in rule 6.

You can rule a route out, as in "do not use poteto-mode". If the rules land on that route anyway, the agent checks the remaining routes and takes one only if the same person still decides and it can do the job:

- `direct` ruled out: the agent uses `poteto-mode`.
- `poteto-mode` ruled out: the agent uses `direct` only when the cause and location are known and the change can be verified in one pass, and says so.
- `brainstorming` ruled out: a decision is still yours, so no other route fits.

When nothing fits, the agent says why and asks you one question, such as making the open decision now or allowing the route you ruled out.

## Examples

| Request | Route | Rule |
|---|---|---|
| "Fix the typo in README.md" | `direct` | 3 |
| "How does the login flow work in this repo?" | `direct` | 3 |
| "Rename the local variable tmp to retryCount in src/net/retry.ts" | `direct` | 3 |
| "The app crashes when I log in" | `poteto-mode` | 5 |
| "This SQL query takes 40 seconds. Make it faster." | `poteto-mode` | 5 |
| "Research whether we need Redis for session storage" | `poteto-mode` | 5 |
| "Rename the package com.acme.old across all 300 files" | `poteto-mode` | 5 |
| "Build a notification system" | `brainstorming` | 6 |
| "Change the default currency shown to all users" | `brainstorming` | 6 |
| "Build the notification system exactly as specified in docs/notifications-spec.md" | `poteto-mode` | 7 |
| "Drop the legacy_orders table from the production database" | `brainstorming` | 2 |
| "Use poteto-mode to fix the typo in README.md" | `poteto-mode` | 1 |

## Several tasks in one request

Each task gets its own `Route:` line, and the agent works through them in the order you gave.

```
Fix the typo in README.md, then find out why search is slow, then add a notification system
```

```
Route: direct (rule 3) because the typo fix is one file with an obvious change
Route: poteto-mode (rule 5) because the slowdown has an unknown cause
Route: brainstorming (rule 6) because you still have to decide what the notifications cover
```

Before it starts a later task, the agent checks whether an earlier one changed what that task needs. If it did, it routes the task again and prints a new `Route:` line. It reuses what earlier tasks found instead of reading the same code again.

## After brainstorming

`brainstorming` ends with a written plan that you approve. If that plan touches more than one file, or has to be checked against the running system, `bb-kickoff` tells the agent to build it through `poteto-mode`. Smaller plans are built the way the plan itself proposes.

## Make agents call bb-kickoff

An agent will not always call `bb-kickoff` by itself. To make it the first step, add this line to the `AGENTS.md` of each project:

```
Before starting any development task, invoke the bb-kickoff skill and follow its route.
```

Cursor reads `AGENTS.md`. For Claude Code, add `@AGENTS.md` to the project's `CLAUDE.md`.

## Agent compatibility

| Agent | Finds the skill | Routes correctly | Starts `poteto-mode` itself | Tested |
|---|---|---|---|---|
| Claude Code | Yes, from `.claude/skills/` | Covered by `node tests/run.mjs` | Yes with `pstack-claude`. No with the skills CLI copy, so you type `/poteto-mode` | Automated |
| Cursor | Yes, from `.agents/skills/` | Yes for the 0.1 rules | No, the Cursor plugin marks it for you to start | By hand, 0.1 rules only |
| Codex | Not tested | Not tested | Not tested | No |

## Testing

```bash
node tests/run.mjs
```

The script builds throwaway projects in your temp folder and installs this repository into them. Most get superpowers and the Claude Code build of pstack. One gets the skills CLI copy of pstack, to test the case where only you can start `poteto-mode`, and one gets neither, to test missing skills. It then sends every case in [tests/cases.json](tests/cases.json) to `claude -p` three times. A case passes only when all three runs pick the expected route. Results go to `tests/RESULTS.md` on your machine. That file is not committed.

You need Claude Code signed in. A full run makes about 150 model calls and takes several minutes. Use `--runs 1` for a quick check, or `--only S01,M01` for a few cases. The script disables the superpowers and pstack plugins for its own calls, so every machine tests the same copies.

## Limitations

- The agent's choice comes from a language model, so the same request can be routed differently on different runs. The test suite measures how often that happens. It cannot rule it out.
- Nothing forces an agent to call `bb-kickoff`. The `AGENTS.md` line makes it likely, not certain.
- The tests check the `Route:` line. They do not check what the target skill does after the handoff.
- The rules were written against superpowers and pstack as of November 2026. If either changes how it works, the rules may need updating.
- The install commands for Claude Code and Cursor plugins were checked against installed copies, not run on a clean machine.

## Cost

`poteto-mode` uses more tokens than the other two routes. It hands most of the work to subagents, and by default it runs bug and performance work on a large model.

## Contributing

Read [AGENTS.md](AGENTS.md) first. Change a rule in `skills/bb-kickoff/SKILL.md` and this README together, add or update a case in `tests/cases.json`, and run the tests before you open a pull request.

## Version history

See [CHANGELOG.md](CHANGELOG.md).

## License

MIT. See [LICENSE](LICENSE).
