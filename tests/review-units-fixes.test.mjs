import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, cp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runReviewUnitsCli } from '../scripts/lib/review-units.mjs';
import { runSynthesisCli } from '../scripts/lib/synthesis-cli.mjs';

// A small synthetic case driven through the real commands.
async function project(t, files = { 'a.txt': 'Alpha context. The default is 10.', 'b.txt': 'Beta context. The limit is 20.' }) {
  const root = await mkdtemp(join(tmpdir(), 'review-units-fixes-')); t.after(() => rm(root, { recursive: true, force: true }));
  for (const [name, value] of Object.entries(files)) await writeFile(join(root, name), value);
  let n = 0;
  const units = async (action, value, extra = []) => { const args = [action, '--project', root, ...extra]; if (value !== undefined) { const file = `in-${n++}.json`; await writeFile(join(root, file), JSON.stringify(value)); args.push('--file', file); } return runReviewUnitsCli(args); };
  const save = async d => { await writeFile(join(root, 'dossier.json'), JSON.stringify(d)); return runSynthesisCli(['save', '--project', root, '--file', 'dossier.json', '--worker', 'writer']); };
  const fill = (answer, change = () => {}) => {
    answer.originals.forEach(o => o.read_original = true);
    for (const g of ['facts', 'findings', 'prose']) answer[g].forEach(r => Object.assign(r, { verdict: 'supported', note: 'Synthetic fixture checked.' }));
    if (answer.assessment) answer.assessment = { coverage: 'accurate', usefulness: 'adequate', note: 'Synthetic fixture covers its scope.' };
    change(answer); return answer;
  };
  const review = async (unit, reviewer, change) => { await units('register', { unit, reviewer, invocation: `host/${reviewer}` }); return units('accept', fill(await units('template', undefined, ['--unit', unit]), change)); };
  const reviewAll = async (prefix, change) => { for (const u of (await units('status')).units) if (!['kept', 'accepted'].includes(u.status)) await review(u.id, `${prefix}-${u.id}`, a => change?.(u, a)); };
  const synthesisState = async () => JSON.parse(await readFile(join(root, '.harness-research/synthesis.json'), 'utf8'));
  return { root, units, save, fill, review, reviewAll, synthesisState };
}
const source = id => ({ id, file: `${id.slice(-1)}.txt`, origin: `https://example.test/${id}`, title: `Synthetic ${id}`, publisher: 'Synthetic fixture', permission: 'public', context: 'full' });
function dossier() {
  return { schema: 2, topic: 'Synthetic fixes', audience: 'Maintainers', purpose: 'Check repairs', scope: 'Synthetic fixture only', source_mode: 'public',
    sources: [source('source-a'), source('source-b')],
    facts: [{ id: 'fact-a', statement: 'The default is 10.', author: 'researcher', citations: [{ source: 'source-a', quote: 'The default is 10.' }] },
      { id: 'fact-b', statement: 'The limit is 20.', author: 'researcher', citations: [{ source: 'source-b', quote: 'The limit is 20.' }] }],
    findings: [{ id: 'finding-a', title: 'Default', summary: { text: 'The default is 10.', kind: 'summary', refs: ['fact-a'] }, support: ['fact-a'], counter: [], implications: [], conditions: [], gaps: [] }],
    sections: [{ id: 'answer', title: 'Answer', blocks: [{ text: 'The default is 10.', kind: 'summary', refs: ['finding-a'] }, { text: 'The limit is 20.', kind: 'summary', refs: ['fact-b'] }] }],
    comparisons: [{ title: 'Defaults compared', subjects: ['A', 'B'], rows: [{ criterion: 'Default allowed', cells: [{ subject: 'A', text: 'Yes', refs: ['fact-a'] }, { subject: 'B', text: 'Yes', refs: ['fact-b'] }] }] }] };
}

test('fix 1: a single review cannot carry assembled-review fields, and 1.5.1 states with such fields read as before', async t => {
  const f = await project(t), saved = await f.save(dossier());
  const before = await readFile(join(f.root, '.harness-research/synthesis.json'));
  const template = structuredClone(saved.review_template); f.fill(template); template.units = {};
  await writeFile(join(f.root, 'review.json'), JSON.stringify(template));
  await assert.rejects(runSynthesisCli(['review', '--project', f.root, '--file', 'review.json', '--worker', 'checker']), /assembled review/);
  assert.deepEqual(await readFile(join(f.root, '.harness-research/synthesis.json')), before, 'nothing was written');
  assert.equal((await runSynthesisCli(['status', '--project', f.root])).status, 'draft');
  await f.units('plan'); await f.reviewAll('unit'); assert.equal((await f.units('assemble')).status, 'complete');
  const assembled = (await f.synthesisState()).review;
  await writeFile(join(f.root, 'assembled.json'), JSON.stringify(assembled));
  await assert.rejects(runSynthesisCli(['review', '--project', f.root, '--file', 'assembled.json', '--worker', 'another-checker']), /assembled review/);
  assert.equal((await runSynthesisCli(['status', '--project', f.root])).status, 'complete');
  for (const schema of [2, 3]) {
    const root = await mkdtemp(join(tmpdir(), `review-extras-${schema}-`)); t.after(() => rm(root, { recursive: true, force: true }));
    await cp(new URL(`./fixtures/review-extras-1.5.1/schema-${schema}`, import.meta.url), root, { recursive: true });
    const files = ['.harness-research/synthesis.json', ...(await readdir(join(root, 'research'))).filter(n => n.endsWith('.md') || n.endsWith('.json')).map(n => `research/${n}`)];
    const kept = await Promise.all(files.map(file => readFile(join(root, file))));
    const state = JSON.parse(kept[0]); assert.equal(state.schema, schema); assert.ok(state.review.units);
    for (const action of ['status', 'verify']) {
      const result = await runSynthesisCli([action, '--project', root]);
      assert.equal(result.status, 'complete', JSON.stringify(result.problems)); assert.equal(result.reviewer, 'checker'); assert.equal(result.reviewers, undefined); assert.equal(result.artifact_integrity, 'verified');
    }
    for (const [i, file] of files.entries()) assert.deepEqual(await readFile(join(root, file)), kept[i], `${file} is read as 1.5.1 wrote it`);
  }
});
