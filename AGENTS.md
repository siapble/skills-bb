# AGENTS.md

- Each skill lives at `skills/<name>/SKILL.md`, one level deep.
- This repository holds no copies of other people's skills. Do not vendor superpowers, pstack, or any other upstream skill here.
- `skills/bb-kickoff/SKILL.md` is the source of the routing rules and the safety boundary. `README.md` restates them in shorter words for people. When you change either, change both, and keep the rule numbers, their order, and their routes identical.
- The install commands table must be identical in `skills/bb-kickoff/SKILL.md` and `README.md`.
- Bump `metadata.version` in `skills/bb-kickoff/SKILL.md` and add a `CHANGELOG.md` entry for each release.

## Checking a change

Use cheap, deterministic checks only:

- Read the changed Markdown files and `git diff`.
- Check that rule numbers, order, and routes match between `SKILL.md` and `README.md`, and that the install tables are identical.
- Check that internal links point to files that exist.
- Run `git diff --check`.

This repository has no automated routing tests. Do not add a test suite, and do not run routing prompts through a model to check a change.
