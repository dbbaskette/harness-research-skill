import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runSynthesisCli } from '../scripts/lib/synthesis-cli.mjs';
import { planResearch, recordResearch, migrateResearch } from '../scripts/lib/research.mjs';

const draft = { schema: 2, topic: 'Ownership', audience: 'Developers', purpose: 'Check isolation', scope: 'Selected documents', source_mode: 'selected', sources: [], facts: [], findings: [], sections: [{ id: 'pending', title: 'Pending', blocks: [{ kind: 'gap', text: 'Evidence collection is pending.', refs: [] }] }] };
const plan = { topic: 'Legacy work', purpose: 'planning', scope: 'supplied-only', items: [{ id: 'question', question: 'What does the reference establish?' }] };
async function fixture(t) {
  const project = await mkdtemp(join(tmpdir(), 'synthesis-ownership-'));
  t.after(() => rm(project, { recursive: true, force: true }));
  await writeFile(join(project, 'draft.json'), JSON.stringify(draft));
  return project;
}
const save = project => runSynthesisCli(['save', '--project', project, '--file', 'draft.json', '--worker', 'author']);

test('manual planning, recording and migration cannot poison a synthesis project', async t => {
  const project = await fixture(t), saved = await save(project);
  const before = await readFile(join(project, '.harness-research/synthesis.json'), 'utf8');
  await mkdir(join(project, '.tanzu-research'));
  await assert.rejects(planResearch(project, plan), /uses synthesis research/);
  await assert.rejects(recordResearch(project, 'any', 'question', {}), /uses synthesis research/);
  await assert.rejects(migrateResearch(project), /uses synthesis research/);
  await assert.rejects(access(join(project, '.harness-research/research.json')));
  assert.equal(await readFile(join(project, '.harness-research/synthesis.json'), 'utf8'), before);
  assert.equal((await runSynthesisCli(['verify', '--project', project])).digest, saved.digest);
});

test('concurrent old and new starts select one project owner without mixed state', async t => {
  const project = await fixture(t);
  const results = await Promise.allSettled([save(project), planResearch(project, plan)]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(results.filter(r => r.status === 'rejected').length, 1);
  const states = await Promise.allSettled(['synthesis.json', 'research.json'].map(name => access(join(project, '.harness-research', name))));
  assert.equal(states.filter(r => r.status === 'fulfilled').length, 1);
});
