#!/usr/bin/env node
// Routing tests for bb-kickoff. Runs each case through `claude -p` in throwaway projects.
// Usage: node tests/run.mjs [--runs 3] [--only S01,M01] [--reuse] [--jobs 6]
import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const runs = Number(flag('runs', 3));
const jobs = Number(flag('jobs', 6));
const only = flag('only', '').split(',').filter(Boolean);
const reuse = args.includes('--reuse');
const work = join(tmpdir(), 'bb-kickoff-tests');

// Plugins that would shadow the copies installed below. Disabled so every machine tests the same skills.
const shadowingPlugins = [
  'superpowers@superpowers-dev',
  'superpowers@claude-plugins-official',
  'superpowers@superpowers-marketplace',
  'pstack@pstack-claude',
  'pstack@cursor-plugins',
  'superpowers@synced',
  'pstack@synced',
];
const settingsPath = join(work, 'settings.json');

// full and nogit match the README's Claude Code setup, where the agent can invoke poteto-mode itself.
// useronly matches the Cursor and skills CLI setup, where only the user can start poteto-mode.
const sandboxes = {
  full: { git: true, sources: [repo, 'obra/superpowers', 'michael-denyer/pstack-claude'] },
  nogit: { git: false, sources: [repo, 'obra/superpowers', 'michael-denyer/pstack-claude'] },
  useronly: { git: true, sources: [repo, 'obra/superpowers', 'backnotprop/pstack'] },
  nodeps: { git: true, sources: [repo] },
};

const quote = (s) => (/[\s"]/.test(s) ? `"${s.replaceAll('"', '\\"')}"` : s);

function sh(cmd, cwd) {
  const r = spawnSync(cmd, { cwd, shell: true, encoding: 'utf8', env: { ...process.env, DISABLE_TELEMETRY: '1' } });
  if (r.status !== 0) throw new Error(`${cmd} failed in ${cwd}\n${r.stdout}\n${r.stderr}`);
}

function setUp() {
  if (!reuse) rmSync(work, { recursive: true, force: true });
  mkdirSync(work, { recursive: true });
  writeFileSync(settingsPath, JSON.stringify({ enabledPlugins: Object.fromEntries(shadowingPlugins.map((p) => [p, false])) }));
  for (const [name, box] of Object.entries(sandboxes)) {
    const dir = join(work, name);
    box.dir = dir;
    if (reuse && existsSync(dir)) {
      sh(`npx --yes skills@latest add ${quote(repo)} -a claude-code --copy -y`, dir);
      continue;
    }
    mkdirSync(dir, { recursive: true });
    if (box.git) sh('git init -q', dir);
    for (const src of box.sources) sh(`npx --yes skills@latest add ${quote(src)} -a claude-code --copy -y`, dir);
  }
}

const PROMPTS = {
  route:
    'Invoke the bb-kickoff skill for the request below. Print only the lines the skill tells you to announce, then stop without doing the work. If the skill says no Route line applies, say so in one sentence. Request: ',
  follow: 'Invoke the bb-kickoff skill for this request and follow it: ',
};

function ask(c) {
  const box = sandboxes[c.sandbox ?? 'full'];
  return new Promise((done) => {
    const child = spawn('claude', ['-p', '--settings', quote(settingsPath)], { cwd: box.dir, shell: true });
    let out = '';
    child.stdout.on('data', (d) => (out += d));
    child.stderr.on('data', () => {});
    const timer = setTimeout(() => child.kill(), 240_000);
    child.on('close', () => {
      clearTimeout(timer);
      done(out);
    });
    child.stdin.end(PROMPTS[c.mode ?? 'route'] + c.input);
  });
}

const ROUTE = /^Route: (direct|brainstorming|poteto-mode) \(rule (\d+)\) because (.+)$/gm;

const expected = (c) => (c.anyOf ? `any of ${c.anyOf.join(', ')}` : [c.expect].flat().join(', '));

function judge(c, out) {
  const routes = [...out.matchAll(ROUTE)].map((m) => ({ target: m[1], rule: Number(m[2]), reason: m[3] }));
  const strayRoute = /^Route:/m.test(out) && routes.length === 0;
  if (strayRoute) return 'Route line does not match the required format';
  const got = routes.map((r) => r.target);
  if (c.expect === 'none') {
    if (routes.length) return `expected no Route line, got ${got}`;
  } else {
    const ok = c.anyOf ? got.length === 1 && c.anyOf.includes(got[0]) : got.join() === [c.expect].flat().join();
    if (!ok) return `expected ${expected(c)}, got ${got.join(', ') || 'no Route line'}`;
  }
  if (c.rule && routes[0].rule !== c.rule) return `expected rule ${c.rule}, got rule ${routes[0].rule}`;
  if (c.reasonLang === 'th' && !/[\u0E00-\u0E7F]/.test(routes[0].reason)) return 'reason is not in Thai';
  for (const pattern of c.mustMention ?? []) if (!new RegExp(pattern, 'm').test(out)) return `output does not mention ${pattern}`;
  for (const pattern of c.mustNotMention ?? []) if (new RegExp(pattern, 'm').test(out)) return `output mentions ${pattern}`;
  return null;
}

async function pool(items, size, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: size }, worker));
  return results;
}

// Cases marked manual describe behavior after the handoff, which a Route line cannot show.
const cases = JSON.parse(readFileSync(join(repo, 'tests', 'cases.json'), 'utf8')).filter((c) => !c.manual && (!only.length || only.includes(c.id)));
console.log(`Setting up sandboxes in ${work} ...`);
setUp();
const version = spawnSync('claude --version', { shell: true, encoding: 'utf8' }).stdout.trim();
console.log(`${cases.length} cases x ${runs} runs on ${version}`);

const attempts = cases.flatMap((c) => Array.from({ length: runs }, (_, n) => ({ c, n })));
const outputs = await pool(attempts, jobs, ({ c }) => ask(c));

const rows = cases.map((c) => {
  const mine = attempts.map((a, i) => (a.c === c ? outputs[i] : null)).filter((o) => o !== null);
  const failures = mine.map((o) => judge(c, o)).filter(Boolean);
  const first = (mine.find((o) => judge(c, o)) ?? mine[0]).trim().split('\n').slice(0, 3).join(' ').slice(0, 160);
  return { c, passed: mine.length - failures.length, failure: failures[0], sample: first };
});

const failed = rows.filter((r) => r.passed !== runs);
for (const r of rows) console.log(`${r.passed === runs ? 'PASS' : 'FAIL'} ${r.c.id} ${r.passed}/${runs}${r.failure ? `  ${r.failure}` : ''}`);
console.log(`\n${rows.length - failed.length}/${rows.length} cases passed all ${runs} runs`);

const cell = (s) => String(s).replaceAll('|', '\\|').replaceAll('\n', ' ');
const report = [
  '# Routing test results',
  '',
  `Run on ${new Date().toISOString().slice(0, 10)} with ${version}, ${runs} runs per case.`,
  `${rows.length - failed.length} of ${rows.length} cases passed every run.`,
  '',
  '| ID | Category | Expected | Passed | Note |',
  '|---|---|---|---|---|',
  ...rows.map((r) => `| ${r.c.id} | ${r.c.category} | ${cell(expected(r.c))}${r.c.rule ? ` (rule ${r.c.rule})` : ''} | ${r.passed}/${runs} | ${cell(r.failure ? `${r.failure}. Sample: ${r.sample}` : '')} |`),
  '',
];
writeFileSync(join(repo, 'tests', 'RESULTS.md'), report.join('\n'));
process.exit(failed.length ? 1 : 0);
