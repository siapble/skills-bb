# AGENTS.md

- Each skill lives at `skills/<name>/SKILL.md`, one level deep.
- This repository holds no copies of other people's skills. Do not vendor superpowers, pstack, or any other upstream skill here.
- `skills/bb-kickoff/SKILL.md` is the source of the routing rules. `README.md` restates them in shorter words for people. When you change a rule, change both, and keep the rule numbers, their order, and their routes identical.
- The install commands table must be identical in `skills/bb-kickoff/SKILL.md` and `README.md`.
- Every rule change needs a case in `tests/cases.json`. Run `node tests/run.mjs` before committing. Do not commit `tests/RESULTS.md`; it is local output.
- Bump `metadata.version` in `skills/bb-kickoff/SKILL.md` and add a `CHANGELOG.md` entry for each release.
