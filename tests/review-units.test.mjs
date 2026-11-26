import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm, cp, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runReviewUnitsCli } from '../scripts/lib/review-units.mjs';
import { runSynthesisCli } from '../scripts/lib/synthesis-cli.mjs';
import { runCollectionCli } from '../scripts/lib/collection.mjs';
import { PROTOCOL, LIMITS } from '../scripts/lib/review-units-model.mjs';
import { hash } from '../scripts/lib/run-storage.mjs';

// Synthetic sources only. A fact citing two sources (fact-ab) crosses units; source-c pins an original.
const SOURCES = { 'a.txt': 'Alpha context. The default is 10. Workloads vary.', 'b.txt': 'Beta context. The limit is 20. Limits depend on edition.', 'c.txt': 'Gamma context. The timeout is 30.' };
function draft() {
  const source = (id, file, extra = {}) => ({ id, file, origin: `https://example.test/${id}`, title: `Synthetic ${id}`, publisher: 'Synthetic fixture', permission: 'public', context: 'full', ...extra });
  return { schema: 2, topic: 'Synthetic defaults', audience: 'Maintainers', purpose: 'Check review units', scope: 'Synthetic fixture only', source_mode: 'public',
    sources: [source('source-a', 'a.txt'), source('source-b', 'b.txt'), source('source-c', 'c.txt', { original_file: 'c-original.bin' })],
    facts: [
      { id: 'fact-a', statement: 'The default is 10.', author: 'researcher', citations: [{ source: 'source-a', quote: 'The default is 10.' }] },
      { id: 'fact-b', statement: 'The limit is 20.', author: 'researcher', citations: [{ source: 'source-b', quote: 'The limit is 20.' }] },
      { id: 'fact-c', statement: 'The timeout is 30.', author: 'researcher', citations: [{ source: 'source-c', quote: 'The timeout is 30.' }] },
      { id: 'fact-ab', statement: 'Workloads and editions both vary.', author: 'researcher', citations: [{ source: 'source-a', quote: 'Workloads vary.' }, { source: 'source-b', quote: 'Limits depend on edition.' }] },
    ],
    findings: [
      { id: 'finding-a', title: 'Defaults vary', summary: { text: 'The default is a starting point.', kind: 'summary', refs: ['fact-a', 'fact-ab'] }, support: ['fact-a', 'fact-ab'], counter: [], implications: [], conditions: [], gaps: [] },
      { id: 'finding-c', title: 'Timeout', summary: { text: 'The timeout is 30.', kind: 'summary', refs: ['fact-c'] }, support: ['fact-c'], counter: [], implications: [], conditions: [], gaps: [] },
    ],
    sections: [{ id: 'answer', title: 'Answer', blocks: [
      { text: 'Treat the default as a starting point.', kind: 'summary', refs: ['finding-a'] },
      { text: 'The limit is 20.', kind: 'summary', refs: ['fact-b'] },
      { text: 'Production behaviour is unmeasured.', kind: 'gap', refs: [] },
      { text: 'The timeout is 30.', kind: 'summary', refs: ['finding-c', 'fact-c'] },
    ] }] };
}

async function fixture(t, { project, dossier = draft() } = {}) {
  const root = project ?? await mkdtemp(join(tmpdir(), 'review-units-'));
  if (!project) {
    t.after(() => rm(root, { recursive: true, force: true }));
    for (const [name, value] of Object.entries(SOURCES)) await writeFile(join(root, name), value);
    await writeFile(join(root, 'c-original.bin'), Buffer.from('Synthetic original\0bytes'));
  }
  let serial = 0;
  const input = async value => { const file = `input-${serial++}.json`; await writeFile(join(root, file), JSON.stringify(value)); return file; };
  const units = async (action, value, extra = []) => runReviewUnitsCli([action, '--project', root, ...(value === undefined ? [] : ['--file', await input(value)]), ...extra]);
  const save = async (d = dossier) => { await writeFile(join(root, 'dossier.json'), JSON.stringify(d)); return runSynthesisCli(['save', '--project', root, '--file', 'dossier.json', '--worker', 'writer']); };
  const register = (unit, reviewer, invocation = `host/review/${reviewer}`) => units('register', { unit, reviewer, invocation });
  const template = unit => units('template', undefined, ['--unit', unit]);
  const fill = (answer, change = () => {}) => {
    for (const o of answer.originals) o.read_original = true;
    for (const group of ['facts', 'findings', 'prose']) for (const item of answer[group]) Object.assign(item, { verdict: 'supported', note: 'Synthetic fixture checked against its capture.' });
    if (answer.assessment) answer.assessment = { coverage: 'accurate', usefulness: 'adequate', note: 'Synthetic fixture covers its scope.' };
    change(answer); return answer;
  };
  const review = async (unit, reviewer, change) => { await register(unit, reviewer); return units('accept', fill(await template(unit), change)); };
  const reviewAll = async (prefix, change = () => {}) => { const s = await units('status'); for (const u of s.units) if (u.status !== 'kept' && u.status !== 'accepted') await review(u.id, `${prefix}-${u.id}`, a => change(u, a)); };
  const planFile = async () => JSON.parse(await readFile(join(root, (await units('status')).plan_file), 'utf8'));
  return { root, dossier, units, save, register, template, fill, review, reviewAll, planFile, state: async () => JSON.parse(await readFile(join(root, '.harness-research/synthesis.json'), 'utf8')) };
}
const unitOwning = (plan, group, id) => plan.units.find(u => u.owns[group].includes(id));

test('a plan owns every item once, gives cited content to read, and is the same plan byte for byte', async t => {
  const f = await fixture(t); await f.save();
  const first = await f.units('plan'), plan = await f.planFile();
  assert.equal(first.phase, 'reviewing'); assert.equal(first.grain, 'source'); assert.equal(plan.protocol, PROTOCOL);
  assert.deepEqual(plan.units.map(u => u.kind), ['content', 'content', 'content', 'final']);
  for (const [group, ids] of Object.entries({ sources: ['source-a', 'source-b', 'source-c'], facts: ['fact-a', 'fact-b', 'fact-c', 'fact-ab'], findings: ['finding-a', 'finding-c'], prose: ['answer:0', 'answer:1', 'answer:2', 'answer:3'] }))
    assert.deepEqual(plan.units.flatMap(u => u.owns[group]).sort(), ids.sort(), `${group} owned exactly once`);
  assert.deepEqual(plan.units.map(u => u.owns.assessment), [false, false, false, true]);
  // A claim citing sources of two units belongs to its first source's unit and is given the other source to read.
  const a = unitOwning(plan, 'facts', 'fact-ab');
  assert.equal(a, unitOwning(plan, 'sources', 'source-a')); assert.deepEqual(a.given.sources, ['source-b']);
  assert.equal(unitOwning(plan, 'prose', 'answer:2').id, 'final', 'prose citing nothing goes to the final unit');
  assert.equal(unitOwning(plan, 'prose', 'answer:3'), unitOwning(plan, 'sources', 'source-c'));
  assert.deepEqual(plan.units.at(-1).given.sources, ['source-a', 'source-b', 'source-c']);
  const assignment = await f.units('assign', undefined, ['--unit', a.id]);
  assert.deepEqual(assignment.owns.facts.map(x => x.id), ['fact-a', 'fact-ab']); assert.equal(assignment.given.sources[0].id, 'source-b'); assert.ok(assignment.given.sources[0].sha256);
  // Same state and options: same plan, here and in a copy of the case elsewhere.
  assert.equal((await f.units('plan')).plan, first.plan);
  const copy = await mkdtemp(join(tmpdir(), 'review-units-copy-')); t.after(() => rm(copy, { recursive: true, force: true }));
  await cp(f.root, copy, { recursive: true }); await rm(join(copy, '.harness-research/review-units.json')); await rm(join(copy, '.harness-research/review-units-data'), { recursive: true });
  const elsewhere = await runReviewUnitsCli(['plan', '--project', copy]);
  assert.equal(elsewhere.plan, first.plan);
  assert.deepEqual(await readFile(join(copy, elsewhere.plan_file)), await readFile(join(f.root, first.plan_file)));
  // The host caps the number of units; ownership stays total.
  const capped = await f.units('plan', { schema: 1, max_units: 2 }), small = await f.planFile();
  assert.notEqual(capped.plan, first.plan); assert.ok(small.units.filter(u => u.kind === 'content').length <= 2);
  assert.equal(small.units.flatMap(u => u.owns.sources).length, 3);
  for (const bad of [{ max_units: 0 }, { max_units: LIMITS.max_units + 1 }, { max_reviewers: 4 }, { other: 1 }]) await assert.rejects(f.units('plan', bad), /max_units|max_reviewers|Unknown/);
});

test('units assemble into the review a single reviewer records, naming every reviewer', async t => {
  const f = await fixture(t), saved = await f.save();
  await f.units('plan'); await f.reviewAll('unit-checker');
  const ready = await f.units('status'); assert.equal(ready.phase, 'ready-to-assemble');
  const assembled = await f.units('assemble');
  assert.equal(assembled.status, 'complete'); assert.equal(assembled.reviewer, null); assert.equal(assembled.reviewers.length, 4); assert.equal(assembled.units_status.phase, 'assembled'); assert.deepEqual(assembled.review_units, { protocol: PROTOCOL, plan: assembled.units_status.plan, units: 4 });
  const state = await f.state();
  assert.equal(state.schema, 4, 'runtimes before 1.6.0 accept only schema 2 and 3, so they refuse this state'); assert.equal(state.review.worker, undefined);
  assert.deepEqual(state.review.reviewers, [...state.review.units.receipts.map(r => r.reviewer)].sort());
  for (const action of ['status', 'verify']) assert.equal((await runSynthesisCli([action, '--project', f.root])).status, 'complete');
  assert.match(await readFile(join(f.root, 'research/evidence.md'), 'utf8'), /Reviewers, one per review unit: .*unit-checker-final \(final\)/);
  assert.equal(JSON.parse(await readFile(join(f.root, 'research/facts.json'), 'utf8')).review.units.protocol, PROTOCOL);
  // A single reviewer giving the same verdicts records the same per-item review and acceptance.
  const single = structuredClone(saved.review_template); f.fill(single);
  await writeFile(join(f.root, 'single.json'), JSON.stringify(single));
  const replaced = await runSynthesisCli(['review', '--project', f.root, '--file', 'single.json', '--worker', 'single-checker']);
  const after = await f.state();
  for (const key of ['originals', 'facts', 'findings', 'prose', 'assessment', 'accepted']) assert.deepEqual(after.review[key], state.review[key], key);
  assert.equal(replaced.reviewer, 'single-checker'); assert.equal(replaced.reviewers, undefined); assert.equal(after.schema, 3, 'a single review leaves schema 4');
});

test('unit answers carry the same exact-source checks as the single review', async t => {
  const f = await fixture(t); await f.save(); await f.units('plan');
  const plan = await f.planFile(), c = unitOwning(plan, 'sources', 'source-c'), a = unitOwning(plan, 'sources', 'source-a');
  await f.register(c.id, 'checker-c'); const base = await f.template(c.id);
  assert.ok(base.originals[0].original_sha256, 'an original pin is part of the template');
  const refuse = (change, pattern) => assert.rejects(f.units('accept', f.fill(structuredClone(base), change)), pattern);
  await refuse(x => x.originals[0].sha256 = 'f'.repeat(64), /attest/);
  await refuse(x => delete x.originals[0].original_sha256, /attest/);
  await refuse(x => x.originals[0].read_original = false, /access_error/);
  await refuse(x => x.facts.pop(), /exactly once/);
  await refuse(x => x.facts.push({ id: 'fact-a', verdict: 'supported', note: 'Not owned.' }), /exactly once/);
  await refuse(x => x.facts[0].id = 'fact-a', /Missing review fact-c/);
  await refuse(x => x.findings[0].verdict = 'pending', /verdict/);
  await refuse(x => x.prose[0].note = '', /explanation/);
  await refuse(x => x.assessment = { coverage: 'accurate', usefulness: 'adequate', note: 'Not this unit.' }, /Only the final unit/);
  await refuse(x => x.digest = '0'.repeat(64), /stale plan or digest/);
  await refuse(x => x.reviewer = 'someone-else', /Unregistered reviewer/);
  await refuse(x => x.extra = true, /Unknown unit answer field/);
  // An inaccessible original is recorded honestly and keeps the assembled review from completing.
  const accepted = await f.units('accept', f.fill(structuredClone(base), x => { x.originals[0].read_original = false; x.originals[0].access_error = 'The synthetic original could not be opened.'; }));
  assert.equal(accepted.accepted, true);
  await f.register('final', 'checker-final'); await assert.rejects(f.units('accept', f.fill(await f.template('final'), x => delete x.assessment)), /assessment must be an object/);
  await f.units('accept', f.fill(await f.template('final')));
  await assert.rejects(f.units('assemble'), new RegExp(`Unit ${a.id} has no kept or accepted receipt`));
  await f.reviewAll('checker');
  const done = await f.units('assemble'); assert.equal(done.status, 'needs-revision');
  assert.match(await readFile(join(f.root, 'research/evidence.md'), 'utf8'), /source-c — original unavailable/);
});

test('reviewers are registered, independent of authors, distinct per unit and bounded in number', async t => {
  const f = await fixture(t); await f.save(); await f.units('plan', { schema: 1, max_reviewers: 2 });
  const [one, two, three] = (await f.planFile()).units;
  for (const author of ['writer', 'researcher']) await assert.rejects(f.register(one.id, author), /independent/);
  await f.register(one.id, 'checker-one', 'host/one');
  assert.equal((await f.register(one.id, 'checker-one', 'host/one')).registration.number, 1, 'the same registration is idempotent');
  await assert.rejects(f.register(two.id, 'checker-two', 'host/one'), /one invocation cannot claim two units/);
  await assert.rejects(f.register(two.id, 'checker-one', 'host/two'), /distinct registered context/);
  await assert.rejects(f.register(one.id, 'checker-other', 'host/other'), /Use retry/);
  await f.register(two.id, 'checker-two', 'host/two');
  await assert.rejects(f.register(three.id, 'checker-three', 'host/three'), /capacity/);
  const answer = f.fill(await f.template(one.id)); answer.reviewer = 'checker-two';
  await assert.rejects(f.units('accept', answer), /Unregistered reviewer/);
  await f.units('accept', f.fill(await f.template(one.id)));
  await f.register(three.id, 'checker-three', 'host/three');
  const status = await f.units('status');
  assert.deepEqual(status.units.slice(0, 3).map(u => [u.status, u.reviewer]), [['accepted', 'checker-one'], ['running', 'checker-two'], ['running', 'checker-three']]);
  assert.equal(status.units[3].reviewer, null, 'no label is recorded for a unit nobody reviewed');
});

test('receipts are immutable files bound to their attempt, and changed or foreign receipts are refused', async t => {
  const f = await fixture(t); await f.save(); const first = await f.units('plan');
  const plan = await f.planFile(), a = plan.units[0];
  const accepted = await f.review(a.id, 'checker-a');
  const receipt = JSON.parse(await readFile(join(f.root, accepted.receipt.file), 'utf8'));
  assert.equal(hash(await readFile(join(f.root, accepted.receipt.file))), accepted.receipt.sha256);
  assert.deepEqual({ unit: receipt.unit, reviewer: receipt.reviewer, invocation: receipt.invocation, attempt: receipt.attempt, plan: receipt.plan, digest: receipt.digest, basis: receipt.basis }, { unit: a.id, reviewer: 'checker-a', invocation: 'host/review/checker-a', attempt: 1, plan: first.plan, digest: first.digest, basis: a.basis });
  assert.deepEqual(receipt.pins.map(p => [p.role, p.source]), [['owned', 'source-a'], ['given', 'source-b']]);
  assert.ok(receipt.pins.every(p => /^[a-f0-9]{64}$/.test(p.sha256)));
  // The same answer again is idempotent; a different answer for the accepted attempt is refused.
  assert.equal((await f.units('accept', f.fill(await f.template(a.id), x => { x.attempt = 1; x.reviewer = 'checker-a'; }))).idempotent, true);
  await assert.rejects(f.units('accept', f.fill(await f.template(a.id), x => { x.attempt = 1; x.reviewer = 'checker-a'; x.facts[0].note = 'Different.'; })), /already accepted a different answer/);
  await f.reviewAll('checker');
  // A tampered receipt is reported and refused, before and after assembly.
  const original = await readFile(join(f.root, accepted.receipt.file));
  await writeFile(join(f.root, accepted.receipt.file), original.toString().replace('Synthetic fixture checked', 'Tampered'));
  const tampered = await f.units('status'); assert.equal(tampered.status, 'stale'); assert.match(tampered.problems[0], /receipt .* changed/);
  await assert.rejects(f.units('assemble'), /receipt .* changed/);
  await writeFile(join(f.root, accepted.receipt.file), original);
  await f.units('assemble');
  await writeFile(join(f.root, accepted.receipt.file), original.toString().replace('Synthetic fixture checked', 'Tampered'));
  const verify = await runSynthesisCli(['verify', '--project', f.root]); assert.equal(verify.status, 'stale'); assert.ok(verify.problems.some(p => /Review invalid: .*receipt/.test(p)));
  await writeFile(join(f.root, accepted.receipt.file), original);
  assert.equal((await runSynthesisCli(['verify', '--project', f.root])).status, 'complete');
  // A receipt made for another plan is not accepted in place of the current final answer.
  const statePath = join(f.root, '.harness-research/review-units.json'), units = JSON.parse(await readFile(statePath, 'utf8'));
  const finalReceipt = units.units.at(-1).attempts.at(-1).receipt;
  const merged = await f.units('plan', { schema: 1, max_units: 1 });
  assert.equal(merged.units[1].id, 'final'); assert.equal(merged.units[1].status, 'pending', 'the final unit is never kept from another plan');
  await f.review(merged.units[0].id, 'checker-merged');
  const replanned = JSON.parse(await readFile(statePath, 'utf8'));
  replanned.units.at(-1).attempts = [{ number: 1, reviewer: 'checker-final', invocation: 'host/review/checker-final', status: 'accepted', started_at: new Date().toISOString(), ended_at: new Date().toISOString(), outcome: 'completed', receipt: finalReceipt }];
  await writeFile(statePath, JSON.stringify(replanned));
  await assert.rejects(f.units('assemble'), /final.* belongs to another plan or digest/);
  // An answer written for an earlier plan is refused.
  await f.units('retry', { unit: 'final', reason: 'Fresh final check.' }); await f.register('final', 'checker-final-two');
  await assert.rejects(f.units('accept', f.fill(await f.template('final'), x => x.plan = first.plan)), /stale plan or digest/);
});

test('a correction round keeps unchanged units and reviews only changed units and the final unit', async t => {
  const f = await fixture(t); await f.save(); await f.units('plan');
  const before = await f.planFile(), c = unitOwning(before, 'facts', 'fact-c');
  await f.reviewAll('round-one', (unit, answer) => { if (unit.id === c.id) answer.facts[0].verdict = 'unsupported'; });
  assert.equal((await f.units('assemble')).status, 'needs-revision');
  const corrected = draft(); corrected.facts[2].statement = 'The documented timeout is 30.';
  const saved = await f.save(corrected);
  const stale = await f.units('status'); assert.equal(stale.phase, 'needs-plan');
  await assert.rejects(f.register(c.id, 'round-two-early'), /changed after this plan/);
  const replanned = await f.units('plan'), after = await f.planFile();
  assert.equal(replanned.digest, saved.digest);
  assert.deepEqual(replanned.units.map(u => [u.id, u.status]), [[before.units[0].id, 'kept'], [before.units[1].id, 'kept'], [c.id, 'pending'], ['final', 'pending']]);
  assert.notEqual(after.units[2].basis, before.units[2].basis); assert.equal(after.units[0].basis, before.units[0].basis);
  await assert.rejects(f.register(before.units[0].id, 'round-two-a'), /keeps an earlier receipt/);
  await assert.rejects(f.review(c.id, 'round-one-' + c.id), /distinct registered context/);
  await f.reviewAll('round-two');
  const done = await f.units('assemble'); assert.equal(done.status, 'complete');
  const state = await f.state();
  assert.deepEqual(state.review.units.receipts.map(r => r.kept), [true, true, false, false]);
  assert.deepEqual(state.review.units.receipts.map(r => r.reviewer), [`round-one-${before.units[0].id}`, `round-one-${before.units[1].id}`, `round-two-${c.id}`, 'round-two-final']);
  assert.equal((await runSynthesisCli(['verify', '--project', f.root])).status, 'complete');
  // A kept receipt whose pinned bytes change is never used again.
  await writeFile(join(f.root, 'b.txt'), 'Changed beta context.');
  assert.equal((await runSynthesisCli(['status', '--project', f.root])).status, 'stale');
});

test('stop cancels outstanding units, a failed unit retries alone, and nothing half accepted remains', async t => {
  const f = await fixture(t); await f.save(); await f.units('plan');
  const [a, b] = (await f.planFile()).units;
  const kept = await f.review(a.id, 'checker-a'), keptBytes = await readFile(join(f.root, kept.receipt.file));
  await f.register(b.id, 'checker-b');
  await f.units('finish', { unit: b.id, reviewer: 'checker-b', attempt: 1, outcome: 'failed', note: 'Host saw the reviewer fail.' });
  assert.equal((await f.units('status')).units[1].status, 'failed');
  await assert.rejects(f.units('accept', f.fill(await f.template(b.id), x => { x.attempt = 1; x.reviewer = 'checker-b'; })), /not active/);
  await f.units('retry', { unit: b.id, reason: 'Reviewer failed; dispatch again.' });
  await f.register(b.id, 'checker-b-two');
  const answer = f.fill(await f.template(b.id));
  const stopped = await f.units('stop');
  assert.equal(stopped.phase, 'stopped'); assert.equal(stopped.units[1].status, 'cancelled'); assert.equal(stopped.timing.unresolved_invocations, 1);
  await assert.rejects(f.units('accept', answer), /stopped/);
  await assert.rejects(f.units('assemble'), /Stopped/);
  await assert.rejects(f.register('final', 'checker-final'), /not dispatching/);
  assert.equal((await readdir(join(f.root, '.harness-research/review-units-data'))).filter(n => n.includes(`-${b.id}-`)).length, 0, 'no receipt for the cancelled unit');
  await assert.rejects(f.units('plan'), /finish before resuming/);
  await f.units('finish', { unit: b.id, reviewer: 'checker-b-two', attempt: 2, outcome: 'cancelled', note: 'Host confirmed the reviewer ended.' });
  const resumed = await f.units('plan'); assert.equal(resumed.status, 'active'); assert.equal(resumed.units[0].status, 'accepted');
  assert.deepEqual(await readFile(join(f.root, kept.receipt.file)), keptBytes);
  await f.units('retry', { unit: b.id, reason: 'Resume after stop.' });
  await f.reviewAll('resumed');
  assert.equal((await f.units('assemble')).status, 'complete');
});

test('collection units follow workstreams, keep overlapping captures apart and exclude investigators as reviewers', async t => {
  const root = await mkdtemp(join(tmpdir(), 'review-units-collection-')); t.after(() => rm(root, { recursive: true, force: true }));
  let n = 0; const call = async (action, value) => { const file = `c-${n++}.json`; if (value !== undefined) await writeFile(join(root, file), JSON.stringify(value)); return runCollectionCli([action, '--project', root, ...(value === undefined ? [] : ['--file', file])]); };
  const request = { schema: 1, topic: 'Synthetic overlap', audience: 'Maintainers', purpose: 'Check review units', scope: 'Synthetic fixture only', source_mode: 'public', workstreams: [{ id: 'first', questions: ['What does the shared page say first?'] }, { id: 'second', questions: ['What does it say second?'] }] };
  const started = await runCollectionCli(['init', '--project', root, '--file', await (async () => { await writeFile(join(root, 'request.json'), JSON.stringify(request)); return 'request.json'; })()]);
  for (const stream of ['first', 'second']) {
    const investigator = `investigator-${stream}`, file = `${stream}.txt`;
    await writeFile(join(root, file), `Shared page as read by ${stream}. The ${stream} value is stated.`);
    const source = { id: 'shared', origin: 'https://example.test/shared', title: 'Shared page', publisher: 'Synthetic fixture', file, permission: 'public', context: 'full' };
    await call('register', { workstream: stream, investigator, invocation: `host/${investigator}` });
    await call('capture', { workstream: stream, investigator, source });
    await call('accept', { schema: 1, request_digest: started.request_digest, generation: started.generation, workstream: stream, attempt: 1, investigator, sources: [source], facts: [{ id: 'fact', statement: `The ${stream} value is stated.`, author: investigator, citations: [{ source: 'shared', quote: `The ${stream} value is stated.` }] }], limitations: [], gaps: [] });
  }
  const registry = await call('assemble'), ids = registry.facts.map(x => x.id);
  const dossier = { schema: 2, ...Object.fromEntries(['topic', 'audience', 'purpose', 'scope', 'source_mode'].map(k => [k, registry.request[k]])), sources: registry.sources, facts: registry.facts,
    findings: [{ id: 'both', title: 'Both values', summary: { text: 'Both values are stated.', kind: 'summary', refs: ids }, support: ids, counter: [], implications: [], conditions: [], gaps: [] }],
    sections: [{ id: 'answer', title: 'Answer', blocks: [{ text: 'Both values are stated.', kind: 'summary', refs: ['both'] }, { text: 'The second value is stated.', kind: 'summary', refs: [ids[1]] }] }] };
  const f = await fixture(t, { project: root, dossier }); await f.save();
  const status = await f.units('plan'), plan = await f.planFile();
  assert.equal(status.grain, 'collection');
  assert.deepEqual(plan.units.map(u => u.areas), [['first'], ['second'], []]);
  assert.deepEqual(plan.units.map(u => u.owns.sources), [[registry.sources[0].id], [registry.sources[1].id], []], 'the same URL captured twice stays two owned sources');
  assert.deepEqual(plan.units[0].owns.findings, ['both'], 'a finding across workstreams goes to the earlier unit on a tie');
  assert.deepEqual(plan.units[0].given.sources, [registry.sources[1].id]);
  const givenTwice = registry.sources.filter(s => plan.units.filter(u => u.owns.sources.includes(s.id) || u.given.sources.includes(s.id)).length > 1).length;
  assert.equal(givenTwice, 2, 'each source is read by its owner, the other content unit or the final unit');
  for (const investigator of ['investigator-first', 'investigator-second']) await assert.rejects(f.register(plan.units[0].id, investigator), /independent/);
  await f.reviewAll('collection-checker');
  assert.equal((await f.units('assemble')).status, 'complete');
  assert.equal((await call('status')).phase, 'ready-for-review');
  assert.equal((await runSynthesisCli(['verify', '--project', root])).status, 'complete');
});

test('the capability file names the protocol, schemas and limits the runtime enforces', async t => {
  const capability = JSON.parse(await readFile(new URL('../references/review-units-capability.json', import.meta.url), 'utf8'));
  assert.equal(capability.protocol, PROTOCOL); assert.deepEqual(capability.limits, LIMITS);
  assert.equal(capability.command, 'review-units'); assert.equal(capability.state_schema, 4);
  const schema = JSON.parse(await readFile(new URL(`../${capability.json_schema}`, import.meta.url), "utf8"));
  const f = await fixture(t); await f.save(); await f.units('plan');
  const template = await f.template('final');
  assert.deepEqual(Object.keys(template).sort(), Object.keys(schema.$defs.answer.properties).sort());
  for (const key of schema.$defs.answer.required) assert.ok(Object.hasOwn(template, key), key);
  await f.reviewAll('schema-checker');
  const status = await f.units('status'), unit = status.units[0];
  const receipt = JSON.parse(await readFile(join(f.root, JSON.parse(await readFile(join(f.root, '.harness-research/review-units.json'), 'utf8')).units[0].attempts[0].receipt.file), 'utf8'));
  assert.equal(receipt.unit, unit.id);
  assert.deepEqual(Object.keys(receipt).sort(), [...schema.$defs.receipt.required].sort());
  assert.equal((await runReviewUnitsCli(['help'])).protocol, PROTOCOL);
});

test('changed pinned bytes refuse acceptance, and a dossier without sources is planned as the final unit alone', async t => {
  const f = await fixture(t); await f.save(); await f.units('plan');
  const a = (await f.planFile()).units[0];
  await f.register(a.id, 'checker-a'); const answer = f.fill(await f.template(a.id));
  const snapshot = JSON.parse(await readFile(join(f.root, '.harness-research/synthesis.json'), 'utf8')).sources.find(s => s.id === 'source-b').snapshot;
  const kept = await readFile(join(f.root, snapshot));
  await writeFile(join(f.root, snapshot), 'Tampered given snapshot.');
  await assert.rejects(f.units('accept', answer), /Pinned review bytes changed or unavailable for source-b/);
  await writeFile(join(f.root, snapshot), kept);
  assert.equal((await f.units('accept', answer)).accepted, true);
  const empty = { ...draft(), sources: [], facts: [], findings: [], sections: [{ id: 'scope', title: 'Scope', blocks: [{ text: 'Research is pending.', kind: 'gap', refs: [] }] }] };
  const g = await fixture(t, { dossier: empty }); await g.save();
  const status = await g.units('plan');
  assert.deepEqual(status.units.map(u => [u.id, u.owns]), [['final', { sources: 0, facts: 0, findings: 0, prose: 1 }]]);
  await g.review('final', 'checker-final');
  assert.equal((await g.units('assemble')).status, 'needs-revision', 'like the single review, no evidence cannot complete');
});

test('above the cap, an area keeps its unit when other areas are added', async t => {
  const f = await fixture(t); await f.save(); await f.units('plan', { schema: 1, max_units: 2 });
  const before = await f.planFile(), unitOf = (plan, id) => plan.units.find(u => u.areas.includes(id));
  const more = draft();
  for (const id of ['source-d', 'source-e']) {
    await writeFile(join(f.root, `${id}.txt`), `Context for ${id}. The value is stated.`);
    more.sources.push({ id, file: `${id}.txt`, origin: `https://example.test/${id}`, title: `Synthetic ${id}`, publisher: 'Synthetic fixture', permission: 'public', context: 'full' });
    more.facts.push({ id: `fact-${id}`, statement: 'The value is stated.', author: 'researcher', citations: [{ source: id, quote: 'The value is stated.' }] });
  }
  await f.save(more); await f.units('plan', { schema: 1, max_units: 2 });
  const after = await f.planFile();
  assert.ok(after.units.filter(u => u.kind === 'content').length <= 2);
  for (const id of ['source-a', 'source-b', 'source-c']) for (const other of ['source-a', 'source-b', 'source-c'])
    assert.equal(unitOf(before, id) === unitOf(before, other), unitOf(after, id) === unitOf(after, other), `${id} and ${other} stay together or apart`);
});

test('review-unit guidance stays within the stage budgets', async () => {
  const { measureContext } = await import('../tools/context-usage.mjs');
  const data = await measureContext();
  assert.deepEqual(data.readingPaths.unitReviewer.files.map(x => x.path), ['references/review-synthesis.md', 'references/review-unit.md']);
  assert.ok(data.readingPaths.unitReviewer.total < 3000, 'a unit reviewer reads a focused stage contract');
  assert.ok(data.files['references/review-units.md'] < 3000, 'the host page is a focused stage contract');
  assert.ok(data.readingPaths.reviewUnits.total <= data.readingPaths.parallelClaude.total, 'coordinating review units costs no more than coordinating collection');
});
