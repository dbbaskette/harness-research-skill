import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { startRun, nextTask, submitTask, runStatus } from '../scripts/lib/research-run.mjs';
import { DEPTHS } from '../scripts/lib/run-evidence.mjs';
import { start as startGuidance } from '../scripts/sync-guidance.mjs';
import { quote, project, fixture, setup, take, submit, argsFor, checked } from './run-fixtures.mjs';

const names = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa', 'lambda', 'mu'];
const facts = (source, n) => ({ coverage: 'answered', gaps: [], facts: names.slice(0, n).map(name => ({ statement: `OrionDB permits a single writer for each database (${name}).`, as_of: null, quotes: [{ source: source.id, quote, locator: 'Line 1' }] })) });
const refused = async (f, task, data) => { const result = await submitTask(argsFor(f, task, { data })); assert.equal(result.accepted, false); return JSON.stringify(result.errors); };

test('light depth keeps facts and answers short: at most 6 facts per question and 10 answer sentences', async t => {
  assert.deepEqual([DEPTHS.light.facts, DEPTHS.standard.facts, DEPTHS.deep.facts], [6, 20, 30]);
  assert.deepEqual([DEPTHS.light.sentences, DEPTHS.standard.sentences, DEPTHS.deep.sentences], [10, 40, 40]);
  const f = await fixture(t), source = await setup(f), research = await take(f);
  assert.equal(research.facts_per_question, 6); assert.match(research.brief, /at most facts_per_question/);
  assert.match(await refused(f, research, facts(source, 7)), /exceeds the 6 allowed at light depth/);
  await submit(f, research, facts(source, 6));
});

test('a light writer gets its sentence limit in the task and more is refused', async t => {
  const f = await fixture(t), source = await setup(f);
  await submit(f, await take(f), facts(source, 2));
  const check = await take(f, 'checker-invocation'); await submit(f, check, checked(check));
  const cross = await take(f, 'checker-invocation'); await submit(f, cross, { merges: [], conflicts: [], superseded: [], missing: [] });
  const write = await take(f, 'writer-invocation');
  assert.equal(write.kind, 'write'); assert.equal(write.sentences_per_answer, 10); assert.match(write.brief, /sentences_per_answer/);
  const key = write.facts.find(fact => fact.status === 'confirmed').key;
  const answer = n => ({ questions: [{ id: 'writers', headline: { sentence: quote, facts: [key] }, answer: Array.from({ length: n }, () => ({ sentence: quote, facts: [key] })), gaps: [] }] });
  assert.match(await refused(f, write, answer(11)), /1 to 10 cited sentences at light depth/);
  await submit(f, write, answer(10));
  assert.equal((await runStatus(f)).status, 'complete');
});

test('standard depth keeps its larger limits', async t => {
  const f = await fixture(t, { depth: 'standard' }), source = await setup(f), research = await take(f);
  assert.equal(research.facts_per_question, 20);
  await submit(f, research, { questions: [{ id: 'writers', ...facts(source, 12) }] });
});

test('each task names the guidance sections its worker needs, from the runtime when guidance is local', async t => {
  const f = await fixture(t), source = await setup(f), research = await take(f);
  const guide = name => fileURLToPath(new URL('../references/' + name, import.meta.url));
  assert.deepEqual(research.guide, { file: guide('task-research.md'), sections: ['Sources', 'Plan and research'] });
  // Every section a guide names is a heading in the file it names.
  for (const [name, sections] of [['task-research.md', ['Sources', 'Plan and research']], ['task-check.md', ['Independent checking']], ['task-write.md', ['Cross-check and writing']]]) {
    const headings = [...(await readFile(guide(name), 'utf8')).matchAll(/^## (.+)$/gm)].map(match => match[1]);
    for (const section of sections) assert.ok(headings.includes(section), `${name}: ${section}`);
  }
  await submit(f, research, facts(source, 1));
  const check = await take(f, 'checker-invocation');
  assert.deepEqual(check.guide, { file: guide('task-check.md'), sections: ['Independent checking'] });
  await submit(f, check, checked(check));
  const cross = await take(f, 'checker-invocation');
  assert.deepEqual(cross.guide, { file: guide('task-write.md'), sections: ['Cross-check and writing'] });
  await submit(f, cross, { merges: [], conflicts: [], superseded: [], missing: [] });
  assert.deepEqual((await take(f, 'writer-invocation')).guide, { file: guide('task-write.md'), sections: ['Cross-check and writing'] });
  const fresh = await fixture(t), plain = await take(fresh);
  assert.equal(plain.kind, 'source'); assert.deepEqual(plain.guide.sections, ['Sources']);
});

test('a pinned guidance task points workers at its own snapshot, falling back to older guidance files', async t => {
  const exec = promisify(execFile), runtime = fileURLToPath(new URL('../', import.meta.url));
  const pinned = async files => {
    const root = await project(t), source = join(root, 'guidance-source');
    await mkdir(join(source, 'guidance'), { recursive: true }); await mkdir(join(source, 'references'), { recursive: true });
    await writeFile(join(source, 'SKILL.md'), '# Synthetic saved guidance\n');
    await writeFile(join(source, 'guidance/manifest.json'), JSON.stringify({ schema: 1, skill: 'harness-research', entry: 'SKILL.md', version: '0.9.4', minimumRuntime: '0.9.0' }));
    for (const name of files) await writeFile(join(source, 'references', name), '# Synthetic\n\n## Sources\n\nText.\n');
    await exec('git', ['init', '-q', '--initial-branch=main', source]); await exec('git', ['-C', source, 'add', '.']);
    await exec('git', ['-C', source, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Synthetic guidance']);
    const pin = await startGuidance({ project: root, source, runtime }); await rm(source, { recursive: true });
    const started = await startRun({ project: root, topic: 'Pinned guide', sources: ['sources/reference.txt'], guidanceTask: pin.task });
    return { task: (await nextTask({ project: root, run: started.run, worker: 'w' })).task, snapshot: join(pin.guidance, '..') };
  };
  const current = await pinned(['task-research.md', 'research-run.md']);
  assert.deepEqual(current.task.guide, { file: join(current.snapshot, 'references/task-research.md'), sections: ['Sources'] });
  const older = await pinned(['research-run.md']);
  assert.deepEqual(older.task.guide, { file: join(older.snapshot, 'references/research-run.md'), sections: ['Sources'] });
  const none = await pinned([]);
  assert.equal(none.task.guide, null);
});
