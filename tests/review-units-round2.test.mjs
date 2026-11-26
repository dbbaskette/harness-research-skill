import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, cp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runReviewUnitsCli } from '../scripts/lib/review-units.mjs';
import { runSynthesisCli } from '../scripts/lib/synthesis-cli.mjs';
import { runCollectionCli } from '../scripts/lib/collection.mjs';
import { computePlan } from '../scripts/lib/review-units-model.mjs';
import { hash } from '../scripts/lib/run-storage.mjs';

// Synthetic content only. Three sources, a brief, a comparison and a gap block.
const FILES = { 'a.txt': 'Alpha context. The default is 10. Workloads vary.', 'b.txt': 'Beta context. The limit is 20.', 'c.txt': 'Gamma. The timeout is 30.' };
const source = (id, file) => ({ id, file, origin: `https://example.test/${id}`, title: `Synthetic ${id}`, publisher: 'Synthetic fixture', permission: 'public', context: 'full' });
function dossier() {
  return { schema: 2, topic: 'Synthetic second round', audience: 'Maintainers', purpose: 'Check repairs', scope: 'Synthetic fixture only', source_mode: 'public',
    sources: [source('source-a', 'a.txt'), source('source-b', 'b.txt'), source('source-c', 'c.txt')],
    facts: [{ id: 'fact-a', statement: 'The default is 10.', author: 'researcher', citations: [{ source: 'source-a', quote: 'The default is 10.' }] },
      { id: 'fact-b', statement: 'The limit is 20.', author: 'researcher', citations: [{ source: 'source-b', quote: 'The limit is 20.' }] },
      { id: 'fact-c', statement: 'The timeout is 30.', author: 'researcher', citations: [{ source: 'source-c', quote: 'The timeout is 30.' }] }],
    findings: [{ id: 'finding-a', title: 'Default', summary: { text: 'The default is 10.', kind: 'summary', refs: ['fact-a'] }, support: ['fact-a'], counter: [], implications: [], conditions: [], gaps: [] },
      { id: 'finding-c', title: 'Timeout', summary: { text: 'The timeout is 30.', kind: 'summary', refs: ['fact-c'] }, support: ['fact-c'], counter: [], implications: [], conditions: [], gaps: [] }],
    sections: [{ id: 'answer', title: 'Answer', blocks: [{ text: 'The default is 10.', kind: 'summary', refs: ['finding-a'] }, { text: 'The limit is 20.', kind: 'summary', refs: ['fact-b'] }, { text: 'Unknown.', kind: 'gap', refs: [] }] },
      { id: 'more', title: 'More', blocks: [{ text: 'Timeout 30.', kind: 'summary', refs: ['finding-c'] }] }],
    brief: [{ id: 'lead', title: 'Lead', blocks: [{ text: 'Default 10.', kind: 'summary', refs: ['fact-a'] }] }, { id: 'next', title: 'Next', blocks: [{ text: 'Limit 20.', kind: 'summary', refs: ['fact-b'] }] }],
    comparisons: [{ title: 'Defaults compared', subjects: ['A', 'B'], rows: [{ criterion: 'Default allowed', cells: [{ subject: 'A', text: 'Yes', refs: ['fact-a'] }, { subject: 'B', text: 'Yes', refs: ['fact-b'] }] }, { criterion: 'Timeout', cells: [{ subject: 'A', text: '30', refs: ['fact-c'] }, { subject: 'B', text: '30', refs: ['fact-c'] }] }] }] };
}
async function project(t, root) {
  if (!root) {
    root = await mkdtemp(join(tmpdir(), 'review-units-round2-')); t.after(() => rm(root, { recursive: true, force: true }));
    for (const [name, value] of Object.entries(FILES)) await writeFile(join(root, name), value);
  }
  let n = 0;
  const units = async (action, value, extra = []) => { const args = [action, '--project', root, ...extra]; if (value !== undefined) { const file = `in-${n++}.json`; await writeFile(join(root, file), JSON.stringify(value)); args.push('--file', file); } return runReviewUnitsCli(args); };
  const synthesis = action => runSynthesisCli([action, '--project', root]);
  const save = async d => { await writeFile(join(root, 'dossier.json'), JSON.stringify(d)); return runSynthesisCli(['save', '--project', root, '--file', 'dossier.json', '--worker', 'writer']); };
  const fill = (answer, change = () => {}) => {
    answer.originals.forEach(o => o.read_original = true);
    for (const g of ['facts', 'findings', 'prose']) answer[g].forEach(r => Object.assign(r, { verdict: 'supported', note: 'Synthetic fixture checked.' }));
    if (answer.assessment) answer.assessment = { coverage: 'accurate', usefulness: 'adequate', note: 'Synthetic fixture covers its scope.' };
    change(answer); return answer;
  };
  let serial = 0;
  const review = async (unit, reviewer) => { await units('register', { unit, reviewer, invocation: `host/${reviewer}` }); return units('accept', fill(await units('template', undefined, ['--unit', unit]))); };
  const reviewAll = async prefix => { for (const u of (await units('status')).units) if (!['kept', 'accepted'].includes(u.status)) await review(u.id, `${prefix}-${serial++}`); };
  const state = async () => JSON.parse(await readFile(join(root, '.harness-research/review-units.json'), 'utf8'));
  const saved = async () => JSON.parse(await readFile(join(root, '.harness-research/synthesis.json'), 'utf8'));
  return { root, units, synthesis, save, fill, review, reviewAll, state, saved };
}
async function assembled(t) { const f = await project(t); await f.save(dossier()); await f.units('plan'); await f.reviewAll('first'); assert.equal((await f.units('assemble')).status, 'complete'); return f; }
// Every file and folder of a case, with file hashes: a refused command must leave it exactly so.
async function tree(root, folder = '') {
  const out = {};
  for (const entry of await readdir(join(root, folder), { withFileTypes: true })) {
    const path = folder ? `${folder}/${entry.name}` : entry.name;
    if (!folder && /^in-\d+\.json$/.test(entry.name)) continue; // the test's own command inputs
    if (entry.isDirectory()) Object.assign(out, { [path + '/']: 'dir' }, await tree(root, path));
    else out[path] = hash(await readFile(join(root, path)));
  }
  return out;
}
async function refusesUntouched(f, run, pattern) { const before = await tree(f.root); await assert.rejects(run(), pattern); assert.deepEqual(await tree(f.root), before); }

test('I1: a retired receipt makes a recorded assembled review incomplete everywhere until it is planned again', async t => {
  const f = await assembled(t);
  const target = (await f.units('status')).units.find(u => u.kind === 'content');
  await f.units('retry', { unit: target.id, reason: 'Host discarded this answer as wrong.' });
  const entry = (await f.state()).receipts.find(r => r.unit === target.id);
  assert.equal(entry.retired.reason, 'retry');
  assert.ok((await readdir(join(f.root, '.harness-research/review-units-data'))).includes(`retired-${entry.sha256}.json`));
  for (const action of ['status', 'verify']) {
    const result = await f.synthesis(action);
    assert.equal(result.status, 'stale'); assert.ok(result.problems.some(p => /Review invalid: .*retired by retry/.test(p)), JSON.stringify(result.problems));
  }
  const status = await f.units('status');
  assert.equal(status.phase, 'review-invalid'); assert.equal(status.assembled_review.status, 'invalid'); assert.match(status.next_step, /^Run review-units plan/);
  const stopped = await f.units('stop');
  assert.equal(stopped.phase, 'review-invalid'); assert.equal((await f.synthesis('status')).status, 'stale');
  // The documented recovery works from here.
  const replanned = await f.units('plan');
  assert.equal(replanned.set_aside.schema, 4); assert.equal((await f.synthesis('status')).status, 'draft');
  assert.equal(replanned.units.find(u => u.id === target.id).status, 'pending', 'the retired receipt is not kept');
  await f.reviewAll('second');
  assert.equal((await f.units('assemble')).status, 'complete');
  assert.ok(!(await f.saved()).review.units.receipts.some(r => r.sha256 === entry.sha256));
});

test('I1: collection status does not call a review ready when it rests on a retired receipt', async t => {
  const root = await mkdtemp(join(tmpdir(), 'review-units-round2-collection-')); t.after(() => rm(root, { recursive: true, force: true }));
  let n = 0; const call = async (action, value) => { const args = [action, '--project', root]; if (value !== undefined) { const file = `c-${n++}.json`; await writeFile(join(root, file), JSON.stringify(value)); args.push('--file', file); } return runCollectionCli(args); };
  const started = await call('init', { schema: 1, topic: 'Synthetic collection', audience: 'Maintainers', purpose: 'Check repairs', scope: 'Synthetic fixture only', source_mode: 'public', workstreams: [{ id: 'one', questions: ['What is stated?'] }, { id: 'two', questions: ['What else?'] }] });
  for (const stream of ['one', 'two']) {
    const investigator = `investigator-${stream}`, file = `${stream}.txt`, quote = `The ${stream} value is stated.`;
    await writeFile(join(root, file), `Synthetic page ${stream}. ${quote}`);
    const src = { id: 'page', origin: `https://example.test/${stream}`, title: stream, publisher: 'Synthetic fixture', file, permission: 'public', context: 'full' };
    await call('register', { workstream: stream, investigator, invocation: `host/${investigator}` }); await call('capture', { workstream: stream, investigator, source: src });
    await call('accept', { schema: 1, request_digest: started.request_digest, generation: started.generation, workstream: stream, attempt: 1, investigator, sources: [src], facts: [{ id: 'fact', statement: quote, author: investigator, citations: [{ source: 'page', quote }] }], limitations: [], gaps: [] });
  }
  const registry = await call('assemble'), ids = registry.facts.map(x => x.id);
  const f = await project(t, root);
  await f.save({ schema: 2, ...Object.fromEntries(['topic', 'audience', 'purpose', 'scope', 'source_mode'].map(k => [k, registry.request[k]])), sources: registry.sources, facts: registry.facts,
    findings: [{ id: 'both', title: 'Both', summary: { text: 'Both values are stated.', kind: 'summary', refs: ids }, support: ids, counter: [], implications: [], conditions: [], gaps: [] }],
    sections: [{ id: 'answer', title: 'Answer', blocks: [{ text: 'Both values are stated.', kind: 'summary', refs: ['both'] }] }] });
  await f.units('plan'); await f.reviewAll('checker'); await f.units('assemble');
  assert.equal((await call('status')).phase, 'ready-for-review');
  await f.units('retry', { unit: (await f.units('status')).units.find(u => u.kind === 'content').id, reason: 'Discarded.' });
  const status = await call('status');
  assert.notEqual(status.phase, 'ready-for-review'); assert.ok(status.problems.some(p => /retired by retry/.test(p)));
});

test('I2: plan refuses untouched while an invocation runs, and the next step it names then succeeds', async t => {
  const f = await assembled(t);
  const [first, second] = (await f.units('status')).units.filter(u => u.kind === 'content');
  await f.units('retry', { unit: first.id, reason: 'Again.' }); await f.units('register', { unit: first.id, reviewer: 'late-reviewer', invocation: 'host/late' });
  const lost = (await f.state()).units.find(u => u.id === second.id).attempts.at(-1).receipt.file;
  await rm(join(f.root, lost));
  const status = await f.units('status');
  assert.equal(status.phase, 'review-invalid'); assert.match(status.next_step, /^Confirm every running review invocation terminal with review-units finish/);
  await refusesUntouched(f, () => f.units('plan'), /Host must confirm every registered review invocation terminal with finish before replanning/);
  await f.units('finish', { unit: first.id, reviewer: 'late-reviewer', attempt: 2, outcome: 'cancelled', note: 'Host ended it.' });
  assert.match((await f.units('status')).next_step, /^Run review-units plan/);
  const replanned = await f.units('plan');
  assert.ok(replanned.set_aside); assert.equal((await f.synthesis('status')).status, 'draft');
  await f.reviewAll('second'); assert.equal((await f.units('assemble')).status, 'complete');
  assert.equal((await f.synthesis('verify')).status, 'complete');
});

test('I2: a changed plan file is kept aside and plan with the same options leads to a complete review', async t => {
  const f = await assembled(t);
  const planned = await f.units('status'), file = join(f.root, planned.plan_file), original = await readFile(file);
  const changed = original.toString().replace('"max_units": 8', '"max_units": 7');
  await writeFile(file, changed);
  const status = await f.units('status'); assert.equal(status.phase, 'review-invalid'); assert.match(status.next_step, /^Run review-units plan/);
  const replanned = await f.units('plan');
  assert.equal(replanned.plan_file_replaced, true); assert.ok(replanned.set_aside); assert.equal(replanned.plan, planned.plan);
  assert.deepEqual(await readFile(file), original);
  const names = await readdir(join(f.root, '.harness-research/review-units-data'));
  assert.ok(names.includes(`plan-${planned.plan}-changed-${hash(Buffer.from(changed))}.json`), 'the changed bytes are kept');
  assert.equal((await f.units('plan')).generation, replanned.generation, 'plan again is a no-op');
  await f.reviewAll('second'); assert.equal((await f.units('assemble')).status, 'complete');
  assert.equal((await f.synthesis('verify')).status, 'complete');
});

test('I2: every refusing review-units command leaves the case byte for byte as it was', async t => {
  const f = await project(t); await f.save(dossier());
  await refusesUntouched(f, () => f.units('register', { unit: 'final', reviewer: 'r', invocation: 'host/r' }), /No review plan/);
  const before = await tree(f.root); assert.equal((await f.units('status')).phase, 'needs-plan'); assert.deepEqual(await tree(f.root), before, 'status with no plan writes nothing');
  await refusesUntouched(f, () => f.units('plan', { schema: 1, max_units: 0 }), /max_units/);
  const planned = await f.units('plan'), [unit] = planned.units;
  await f.units('register', { unit: unit.id, reviewer: 'r-one', invocation: 'host/one' });
  await refusesUntouched(f, () => f.units('register', { unit: 'final', reviewer: 'r-two', invocation: 'host/one' }), /one invocation cannot claim two units/);
  await refusesUntouched(f, async () => f.units('accept', f.fill(await f.units('template', undefined, ['--unit', unit.id]), a => a.facts.pop())), /exactly once/);
  await refusesUntouched(f, () => f.units('finish', { unit: unit.id, reviewer: 'someone-else', attempt: 1, outcome: 'failed', note: 'No.' }), /does not match/);
  await refusesUntouched(f, () => f.units('assemble'), /has no kept or accepted receipt|final unit/);
  await f.units('retry', { unit: unit.id, reason: 'Again.' });
  await refusesUntouched(f, () => f.units('retry', { unit: unit.id, reason: 'Again.' }), /already reserved/);
  await writeFile(join(f.root, 'a.txt'), 'Changed alpha context.');
  await refusesUntouched(f, () => f.units('plan'), /Evidence is stale/);
});

test('one tie-break rule on both sides of the cap: an unrelated area never moves an item between unchanged units', () => {
  const make = ids => {
    const d = { schema: 2, topic: 'S', audience: 'M', purpose: 'P', scope: 'S', source_mode: 'public',
      sources: ids.map(id => ({ id, file: `${id}.txt`, origin: `https://example.test/${id}`, title: id, publisher: 'S', permission: 'public', context: 'full' })),
      facts: ids.map(id => ({ id: `fact-${id}`, statement: id, author: 'researcher', citations: [{ source: id, quote: 'v' }] })),
      findings: [{ id: 'fd', title: 'Tie', summary: { text: 'x', kind: 'summary', refs: ['fact-s0', 'fact-s1'] }, support: ['fact-s0', 'fact-s1'], counter: [], implications: [], conditions: [], gaps: [] }],
      sections: [{ id: 'answer', title: 'Answer', blocks: [{ text: 'x', kind: 'summary', refs: ['fd'] }] }] };
    return { digest: '0'.repeat(64), author: 'writer', dossier: d, sources: ids.map((id, i) => ({ id, file: `${id}.txt`, sha256: 'a'.repeat(64), snapshot: `s/${i}` })) };
  };
  const owner = p => p.units.find(u => u.owns.findings.includes('fd'));
  const single = (p, area) => p.units.find(u => u.areas.length === 1 && u.areas[0] === area);
  let compared = 0;
  for (const cap of [2, 3, 4, 5, 6, 8]) {
    const base = ['s0', 's1']; for (let i = 2; base.length < cap; i++) base.push(`x${i}`);
    for (let k = 0; k < 150; k++) {
      const small = computePlan(make(base), cap).plan, large = computePlan(make([...base, `e${k}`]), cap).plan;
      for (const [from, to] of [[small, large], [large, small]]) {
        const pairs = ['s0', 's1'].map(a => [single(from, a), single(to, a)]);
        if (pairs.some(([x, y]) => !x || !y || x.id !== y.id)) continue;
        compared++;
        assert.equal(owner(to).id, owner(from).id, `cap ${cap}, e${k}: the tied finding moved between unchanged units`);
        const order = p => p.units.filter(u => ['s0', 's1'].includes(u.areas[0]) && u.areas.length === 1).map(u => u.areas[0]);
        assert.deepEqual(order(to), order(from));
      }
    }
  }
  assert.ok(compared > 100, `crossing comparisons made: ${compared}`);
});

test('a malformed stored assembled review is reported by every reader, never thrown, and plan recovers', async t => {
  const f = await assembled(t);
  const fields = ['unit', 'kind', 'reviewer', 'invocation', 'attempt', 'plan', 'digest', 'basis', 'kept', 'file', 'sha256'];
  const cases = {
    'review null': s => s.review = null, 'units missing': s => delete s.review.units, 'units null': s => s.review.units = null, 'units a string': s => s.review.units = 'units',
    'receipts missing': s => delete s.review.units.receipts, 'receipts null': s => s.review.units.receipts = null, 'receipts not an array': s => s.review.units.receipts = {}, 'receipts a string': s => s.review.units.receipts = 'x',
    'receipt entry null': s => s.review.units.receipts[0] = null, 'reviewers missing': s => delete s.review.reviewers, 'assessment null': s => s.review.assessment = null, 'facts a string': s => s.review.facts = 'x',
    ...Object.fromEntries(fields.map(field => [`receipt missing ${field}`, s => delete s.review.units.receipts[0][field]])),
  };
  for (const [label, mutate] of Object.entries(cases)) {
    const root = await mkdtemp(join(tmpdir(), 'review-units-malformed-')); t.after(() => rm(root, { recursive: true, force: true }));
    await cp(f.root, root, { recursive: true });
    const g = await project(t, root), state = await g.saved(); mutate(state);
    await writeFile(join(root, '.harness-research/synthesis.json'), JSON.stringify(state, null, 2) + '\n');
    for (const action of ['status', 'verify']) {
      const result = await g.synthesis(action);
      assert.equal(result.status, 'stale', `${label}: ${action}`); assert.ok(result.problems.some(p => p.startsWith('Review invalid')), `${label}: ${JSON.stringify(result.problems)}`);
    }
    assert.equal((await g.units('status')).phase, 'review-invalid', label);
    assert.ok((await g.units('plan')).set_aside, label); assert.equal((await g.synthesis('status')).status, 'draft', label);
  }
});

test('review-units status without a plan reads the review kind from the state schema', async t => {
  for (const schema of [2, 3]) {
    const root = await mkdtemp(join(tmpdir(), `review-units-schema-${schema}-`)); t.after(() => rm(root, { recursive: true, force: true }));
    await cp(new URL(`./fixtures/review-extras-1.5.1/schema-${schema}`, import.meta.url), root, { recursive: true });
    const before = await tree(root), status = await runReviewUnitsCli(['status', '--project', root]);
    assert.equal(status.review_status, 'single'); assert.equal(status.phase, 'needs-plan'); assert.deepEqual(await tree(root), before);
  }
});

test('the final unit is reviewed again after any change and its assignment carries the whole dossier', async t => {
  const state = d => ({ digest: '0'.repeat(64), author: 'writer', dossier: d, sources: d.sources.map((s, i) => ({ id: s.id, file: s.file, sha256: String(i + 1).repeat(64), snapshot: `s/${i}.txt` })) });
  const finalBasis = d => computePlan(state(d), 8).plan.units.at(-1).basis, base = finalBasis(dossier());
  const changes = {
    'section order': d => d.sections.reverse(), 'brief section order': d => d.brief.reverse(), 'block order': d => { const b = d.sections[0].blocks; [b[0], b[1]] = [b[1], b[0]]; },
    'comparison row order': d => d.comparisons[0].rows.reverse(), 'one comparison cell': d => d.comparisons[0].rows[0].cells[1].text = 'No',
    'a block text': d => d.sections[0].blocks[0].text = 'Changed.', 'a brief block': d => d.brief[1].blocks[0].text = 'Changed.',
    'fact order': d => d.facts.reverse(), 'finding order': d => d.findings.reverse(), 'source order': d => d.sources.reverse(),
    'a fact statement': d => d.facts[1].statement = 'Changed.', 'a source title': d => d.sources[2].title = 'Changed', 'the scope': d => d.scope = 'Changed',
  };
  for (const [label, change] of Object.entries(changes)) { const d = dossier(); change(d); assert.notEqual(finalBasis(d), base, label); }
  const f = await project(t); await f.save(dossier()); await f.units('plan');
  const assignment = await f.units('assign', undefined, ['--unit', 'final']);
  assert.deepEqual(assignment.dossier, (await f.saved()).dossier);
  assert.deepEqual(assignment.dossier.comparisons[0].rows, dossier().comparisons[0].rows, 'every comparison row whole');
  const content = (await f.units('status')).units.find(u => u.kind === 'content');
  assert.equal((await f.units('assign', undefined, ['--unit', content.id])).dossier, undefined, 'a content unit is not shown the whole dossier');
});

test('stop refuses a late answer the host saw complete, also after plan resumes', async t => {
  const f = await project(t); await f.save(dossier());
  const unit = (await f.units('plan')).units[0].id;
  await f.units('register', { unit, reviewer: 'r1', invocation: 'host/r1' });
  const answer = f.fill(await f.units('template', undefined, ['--unit', unit]));
  await f.units('finish', { unit, reviewer: 'r1', attempt: 1, outcome: 'completed', note: 'Host saw it return.' });
  assert.equal((await f.units('stop')).units[0].status, 'cancelled');
  await assert.rejects(f.units('accept', answer), /stopped/);
  await f.units('plan');
  await assert.rejects(f.units('accept', answer), /not active/);
  await f.units('retry', { unit, reason: 'Dispatch after stop.' });
  assert.equal((await f.review(unit, 'r2')).accepted, true);
});

test('I2: assemble and plan check output backups before writing anything', async t => {
  // A backup already stored for the current report, but with other bytes: writing over the report would fail.
  const plant = async f => { const report = await readFile(join(f.root, 'research/report.md')), dir = join(f.root, '.harness-research/output-backups'); await mkdir(dir, { recursive: true }); await writeFile(join(dir, `${hash(report)}-report.md`), 'A changed backup.'); };
  const f = await project(t); await f.save(dossier()); await f.units('plan'); await f.reviewAll('first');
  await plant(f);
  await refusesUntouched(f, () => f.units('assemble'), /Output backup changed/);
  const g = await assembled(t);
  await g.units('retry', { unit: (await g.units('status')).units.find(u => u.kind === 'content').id, reason: 'Discarded.' });
  await plant(g);
  await refusesUntouched(g, () => g.units('plan'), /Output backup changed/);
});
