import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readlink, symlink, realpath, rm, access, cp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { install } from '../scripts/install.mjs';
import { migrateResearch, planResearch, recordResearch, researchStatus } from '../scripts/lib/research.mjs';
const exec = promisify(execFile), source = fileURLToPath(new URL('../', import.meta.url));
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'harness-research-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  return { root, source, home: join(root, 'home'), shared: join(root, 'shared') };
}
const plan = () => ({ topic: 'Synthetic capability', purpose: 'planning', scope: 'supplied-only', sources: [{ id: 'brief', title: 'Brief', origin: 'supplied brief', file: 'brief.md', limits: 'none' }], items: [{ id: 'feature', question: 'What capability is supported?', public_query: null }] });
const finding = () => ({ status: 'supported', summary: 'Feature A is supported.', limits: 'Synthetic fixture.', evidence: [{ file: 'brief.md', title: 'Brief', origin: 'supplied brief', quote: 'Feature A is supported.', start: 0, locator: 'Paragraph 1' }] });

test('shared shell installation is repeatable, isolated and usable in three harnesses without npm dependencies', async t => {
  const options = await fixture(t);
  const dry = await install({ ...options, dryRun: true });
  assert.equal(dry.targets.length, 3);
  await assert.rejects(access(options.home), /ENOENT/);
  const first = await install(options);
  for (const target of first.targets) { assert.equal(await realpath(target), first.runtime); await access(join(target, 'SKILL.md')); }
  assert.equal((await install(options)).runtime, first.runtime);
  await assert.rejects(access(join(options.home, '.agents/skills/research')), /ENOENT/);
  const project = join(options.root, 'project'); await mkdir(project); await writeFile(join(project, 'brief.md'), 'Feature A is supported.');
  const input = join(project, 'plan.json'); await writeFile(input, JSON.stringify(plan()));
  const { stdout } = await exec(process.execPath, [join(first.targets[2], 'scripts/harness-research.mjs'), 'plan', '--project', project, '--file', input]);
  assert.equal(JSON.parse(stdout).status, 'in-progress');
  await writeFile(join(first.runtime, 'references/evidence.md'), 'tampered');
  await assert.rejects(install(options), /Retained runtime was modified/);
});

test('installer migrates exact Brand-owned aliases and agents while preserving independent skills', async t => {
  const options = await fixture(t), skills = join(options.home, '.agents/skills'), agents = join(options.home, '.codex/agents');
  await mkdir(skills, { recursive: true }); await mkdir(agents, { recursive: true });
  const legacy = join(skills, 'research');
  await symlink(join(skills, 'tanzu-brand/scripts/research/codex/skills/research'), legacy);
  const agent = join(agents, 'web-researcher.toml');
  await symlink(join(skills, 'tanzu-brand/scripts/research/codex/agents/web-researcher.toml'), agent);
  const independent = join(skills, 'research-report'); await mkdir(independent); await writeFile(join(independent, 'personal.md'), 'keep');
  const dry = await install({ ...options, dryRun: true });
  assert.equal(dry.legacy.filter(entry => entry.status === 'would-migrate').length, 2);
  assert.match(await readlink(legacy), /tanzu-brand/);
  const result = await install(options);
  assert.equal(result.legacy.filter(entry => entry.status === 'migrated').length, 2);
  await access(join(legacy, 'SKILL.md')); await access(agent);
  assert.ok((await readlink(legacy)).startsWith(options.shared));
  assert.equal(await readFile(join(independent, 'personal.md'), 'utf8'), 'keep');
  assert.equal((await install(options)).legacy.filter(entry => entry.status === 'migrated').length, 0);
});

test('installer rejects unsafe parents and unrelated destinations before writes', async t => {
  const options = await fixture(t), outside = join(options.root, 'outside');
  await mkdir(outside); await mkdir(join(options.home, '.agents'), { recursive: true });
  await symlink(outside, join(options.home, '.agents/skills'));
  await assert.rejects(install(options), /Unsafe installer directory/);
  assert.deepEqual(await readdir(outside), []); await assert.rejects(access(options.shared), /ENOENT/);
  await rm(join(options.home, '.agents/skills')); await mkdir(join(options.home, '.agents/skills/harness-research'), { recursive: true });
  await assert.rejects(install(options), /Existing unrelated skill/);
  await assert.rejects(access(options.shared), /ENOENT/);
});

async function legacyFixture(t) {
  const options = await fixture(t), project = join(options.root, 'project'); await mkdir(project);
  await writeFile(join(project, 'brief.md'), 'Feature A is supported.');
  const initial = await planResearch(project, plan()); await recordResearch(project, initial.run, 'feature', finding());
  const newer = join(project, '.harness-research'), legacy = join(project, '.tanzu-research');
  await cp(newer, legacy, { recursive: true });
  const path = join(legacy, 'research.json'), value = JSON.parse(await readFile(path, 'utf8')); value.owner = 'tanzu-brand';
  await writeFile(path, JSON.stringify(value)); await rm(newer, { recursive: true });
  return { ...options, project, legacy, initial, before: await readFile(path, 'utf8') };
}
test('legacy migration preserves originals, scope, run IDs, evidence and history; stale inputs stay stale', async t => {
  const options = await legacyFixture(t);
  assert.equal((await researchStatus(options.project)).status, 'legacy-found');
  await assert.rejects(planResearch(options.project, plan()), /run migrate/);
  const migrated = await migrateResearch(options.project);
  assert.equal(migrated.run, options.initial.run); assert.equal(migrated.completed, 1); assert.equal(migrated.scope, 'supplied-only');
  assert.equal(await readFile(join(options.legacy, 'research.json'), 'utf8'), options.before);
  const history = await readdir(join(options.legacy, 'history'));
  for (const name of history) assert.deepEqual(await readFile(join(options.legacy, 'history', name)), await readFile(join(options.project, '.harness-research/history', name)));
  assert.equal((await planResearch(options.project, plan())).completed, 1);
  await assert.rejects(migrateResearch(options.project), /already exists/);
  await writeFile(join(options.project, 'brief.md'), 'Changed feature claim.');
  assert.equal((await researchStatus(options.project)).status, 'stale');
});
test('legacy migration refuses active locks, unowned state and hostile history without changing old files', async t => {
  const options = await legacyFixture(t), lock = join(options.legacy, 'research.lock');
  await writeFile(lock, 'active owner');
  await assert.rejects(migrateResearch(options.project), /busy/);
  assert.equal(await readFile(lock, 'utf8'), 'active owner'); await rm(lock);
  const path = join(options.legacy, 'research.json'); await writeFile(path, '{"schema":1,"owner":"someone-else"}');
  await assert.rejects(migrateResearch(options.project), /Unrecognized/);
  await writeFile(path, options.before);
  await symlink(join(options.project, 'brief.md'), join(options.legacy, 'history', 'hostile.md'));
  await assert.rejects(migrateResearch(options.project), /Unsafe legacy history/);
  await assert.rejects(access(join(options.project, '.harness-research/research.json')), /ENOENT/);
  assert.equal(await readFile(path, 'utf8'), options.before); await assert.rejects(access(lock), /ENOENT/);
});
test('generic entrypoint routes valid local resources and CLI refuses irrelevant flags', async () => {
  for (const name of ['SKILL.md', ...await readdir(join(source, 'references')).then(names => names.map(name => `references/${name}`))]) {
    const content = await readFile(join(source, name), 'utf8');
    for (const [, target] of content.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) if (!/^[a-z]+:/i.test(target)) await access(join(dirname(join(source, name)), target));
  }
  await assert.rejects(exec(process.execPath, [join(source, 'scripts/harness-research.mjs'), 'status', '--project', source, '--file', 'ignored.json']), /not valid for status/);
  const entry = await readFile(join(source, 'SKILL.md'), 'utf8');
  assert.ok(entry.split(/\s+/).length < 430);
  const agent = await readFile(join(source, 'upstream/codex/agents/web-researcher.toml'), 'utf8');
  assert.doesNotMatch(agent, /^model\s*=/m);
  assert.match(agent, /^sandbox_mode = "workspace-write"$/m);
});
test('preserved comparative validator detects missing fields without requiring system Python changes', { skip: !process.env.HARNESS_RESEARCH_PYTHON }, async t => {
  const options = await fixture(t), fields = join(options.root, 'fields.yaml'), result = join(options.root, 'result.json');
  await writeFile(fields, 'fields:\n  Basic Info:\n    - name: name\n      description: Item name\n      detail_level: brief\n    - name: release_date\n      description: Release date\n      detail_level: brief\n');
  await writeFile(result, '{"name":"Synthetic","release_date":"2026-01-01"}');
  const args = [join(source, 'upstream/codex/skills/research/validate_json.py'), '-f', fields, '-j', result];
  await exec(process.env.HARNESS_RESEARCH_PYTHON, args);
  await writeFile(result, '{"name":"Synthetic"}');
  await assert.rejects(exec(process.env.HARNESS_RESEARCH_PYTHON, args));
});
