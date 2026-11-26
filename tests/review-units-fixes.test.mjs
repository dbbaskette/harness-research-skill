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

test('fix 2: a receipt retired by retry, an unsuccessful outcome or stop is never kept again', async t => {
  const f = await project(t); await f.save(dossier()); await f.units('plan');
  const status = await f.units('status'), plan = JSON.parse(await readFile(join(f.root, status.plan_file), 'utf8'));
  const a = plan.units.find(u => u.owns.sources.includes('source-a'));
  const bad = await f.review(a.id, 'bad-reviewer', x => x.facts[0].verdict = 'unsupported');
  await f.units('retry', { unit: a.id, reason: 'The host discarded this answer.' });
  const changed = dossier(); changed.facts[1].statement = 'The documented limit is 20.';
  await f.save(changed);
  const replanned = await f.units('plan'), unit = replanned.units.find(u => u.id === a.id);
  assert.equal(unit.status, 'pending'); assert.equal(unit.kept, false); assert.notEqual(unit.reviewer, 'bad-reviewer');
  const state = JSON.parse(await readFile(join(f.root, '.harness-research/review-units.json'), 'utf8'));
  const entry = state.receipts.find(r => r.file === bad.receipt.file);
  assert.equal(entry.retired.reason, 'retry'); assert.equal(entry.retired.note, 'The host discarded this answer.');
  // Only accepted, never-retired receipts are kept: a good one is, and once retired it is not.
  await f.review(a.id, 'good-reviewer');
  await f.save(dossier()); const kept = await f.units('plan');
  assert.equal(kept.units.find(u => u.id === a.id).status, 'kept'); assert.equal(kept.units.find(u => u.id === a.id).reviewer, 'good-reviewer');
  await f.units('retry', { unit: a.id, reason: 'Review the kept unit again.' });
  await f.save(changed); const again = await f.units('plan');
  assert.equal(again.units.find(u => u.id === a.id).status, 'pending');
  // A retired receipt planted back on the unit is refused at assembly.
  const units = JSON.parse(await readFile(join(f.root, '.harness-research/review-units.json'), 'utf8'));
  const goodEntry = units.receipts.find(r => r.reviewer === 'good-reviewer');
  assert.equal(goodEntry.retired.reason, 'retry');
  units.units.find(u => u.id === a.id).kept = { file: goodEntry.file, sha256: goodEntry.sha256, plan: goodEntry.plan, digest: goodEntry.digest, reviewer: goodEntry.reviewer, invocation: goodEntry.invocation, attempt: goodEntry.attempt };
  await writeFile(join(f.root, '.harness-research/review-units.json'), JSON.stringify(units));
  await f.reviewAll('round-three');
  await assert.rejects(f.units('assemble'), /retired/);
});

test('fix 3: a unit basis covers the headings, criterion, subjects and title a reader meets each prose item under', async () => {
  const { computePlan } = await import('../scripts/lib/review-units-model.mjs');
  const base = () => { const d = dossier(); d.brief = [{ id: 'lead', title: 'Lead with the default', blocks: [{ text: 'The default is 10.', kind: 'summary', refs: ['fact-a'] }] }]; return d; };
  const state = d => ({ digest: '0'.repeat(64), author: 'writer', dossier: d, sources: d.sources.map((s, i) => ({ id: s.id, file: s.file, sha256: String(i + 1).repeat(64), snapshot: `research/sources/revisions/${i}.txt` })) });
  const plan = d => computePlan(state(d), 8).plan;
  const owner = (p, id) => p.units.find(u => u.owns.prose.includes(id));
  const before = plan(base());
  for (const [label, change, ids] of [
    ['comparison criterion', d => d.comparisons[0].rows[0].criterion = 'Default forbidden', ['comparison:0:0:0', 'comparison:0:0:1']],
    ['comparison title', d => d.comparisons[0].title = 'Limits compared', ['comparison:0:0:0', 'comparison:0:0:1']],
    ['comparison subjects', d => { d.comparisons[0].subjects = ['B', 'A']; }, ['comparison:0:0:0', 'comparison:0:0:1']],
    ['report section title', d => d.sections[0].title = 'What changed', ['answer:0', 'answer:1']],
    ['brief section title', d => d.brief[0].title = 'Lead with the exception', ['brief:lead:0']],
  ]) {
    const after = plan((d => (change(d), d))(base()));
    for (const id of ids) assert.notEqual(owner(after, id).basis, owner(before, id).basis, `${label} changes the basis of the unit owning ${id}`);
  }
  // The final unit is given every prose item in its context too.
  const renamed = base(); renamed.sections[0].title = 'Renamed'; assert.notEqual(plan(renamed).units.at(-1).basis, before.units.at(-1).basis);
});

test('fix 4: unit order and tie-breaks do not depend on which other areas exist', async () => {
  const { computePlan } = await import('../scripts/lib/review-units-model.mjs');
  const make = ids => {
    const d = { schema: 2, topic: 'Synthetic', audience: 'Maintainers', purpose: 'Check ties', scope: 'Synthetic', source_mode: 'public',
      sources: ids.map(id => ({ id, file: `${id}.txt`, origin: `https://example.test/${id}`, title: id, publisher: 'Synthetic', permission: 'public', context: 'full' })),
      facts: ids.map(id => ({ id: `fact-${id}`, statement: `${id} states a value.`, author: 'researcher', citations: [{ source: id, quote: 'value' }] })),
      findings: [{ id: 'fd', title: 'Tie', summary: { text: 'Both state values.', kind: 'summary', refs: ['fact-s0', 'fact-s1'] }, support: ['fact-s0', 'fact-s1'], counter: [], implications: [], conditions: [], gaps: [] }],
      sections: [{ id: 'answer', title: 'Answer', blocks: [{ text: 'Both state values.', kind: 'summary', refs: ['fd'] }] }] };
    return { digest: '0'.repeat(64), author: 'writer', dossier: d, sources: ids.map((id, i) => ({ id, file: `${id}.txt`, sha256: hashOf(id), snapshot: `s/${i}` })) };
  };
  const hashOf = id => Buffer.from(id.padEnd(32, 'x')).toString('hex').slice(0, 64);
  let compared = 0;
  for (const cap of [2, 3, 8]) {
    const base = ['s0', 's1', 's3', 's5'], before = computePlan(make(base), cap).plan;
    const unitWith = (p, area) => p.units.find(u => u.areas.includes(area));
    if (unitWith(before, 's0') === unitWith(before, 's1')) continue;
    const ownerArea = ['s0', 's1'].find(a => unitWith(before, a).owns.findings.includes('fd'));
    for (const extra of ['s2', 's4', 's6', 's7', 's8', 's9', 'sa', 'sb']) {
      const after = computePlan(make([extra, ...base]), cap).plan;
      if (unitWith(after, 's0') === unitWith(after, 's1')) continue;
      compared++;
      assert.ok(unitWith(after, ownerArea).owns.findings.includes('fd'), `cap ${cap}: adding ${extra} moved the finding away from ${ownerArea}`);
      const order = p => p.units.filter(u => u.kind === 'content').map(u => base.find(a => u.areas.includes(a))).filter(Boolean);
      assert.deepEqual([...new Set(order(after))], [...new Set(order(before))], `cap ${cap}: adding ${extra} reordered the units`);
    }
  }
  assert.ok(compared >= 8, 'the probe compared enough plans');
});

test('fix 5: synthesis status and verify check the stored plan file of an assembled review', async t => {
  const f = await project(t); await f.save(dossier());
  const planned = await f.units('plan'); await f.reviewAll('unit'); await f.units('assemble');
  const file = join(f.root, planned.plan_file), bytes = await readFile(file);
  await writeFile(file, bytes.toString().replace('"max_units": 8', '"max_units": 7'));
  for (const action of ['status', 'verify']) {
    const result = await runSynthesisCli([action, '--project', f.root]);
    assert.equal(result.status, 'stale'); assert.ok(result.problems.some(p => /Review invalid: .*plan file/.test(p)), JSON.stringify(result.problems));
  }
  await rm(file);
  assert.ok((await runSynthesisCli(['verify', '--project', f.root])).problems.some(p => /plan file/.test(p)));
  await writeFile(file, bytes);
  assert.equal((await runSynthesisCli(['verify', '--project', f.root])).status, 'complete');
});
