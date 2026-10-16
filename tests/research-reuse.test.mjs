import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { startRun, nextTask, runStatus, verifyKeys } from '../scripts/lib/research-run.mjs';
import { runCli } from '../scripts/lib/run-cli.mjs';
import { quote, reference, fixture, setup, take, submit, finding, checked, finish, completed } from './run-fixtures.mjs';

const readers = 'Readers never wait for that writer, because each query sees a consistent snapshot';
const factsOf = async status => JSON.parse(await readFile(status.facts, 'utf8'));

test('verify reports a checked fact as confirmed without changing the saved output', async t => {
  const f = await completed(t), exported = await factsOf(f.done), key = exported.facts[0].key;
  const result = await verifyKeys({ project: f.project, keys: [key] });
  assert.equal(result.run, f.run); assert.equal(result.all_confirmed, true); assert.deepEqual(result.counts, { confirmed: 1 });
  const [entry] = result.keys;
  assert.equal(entry.key, key); assert.equal(entry.result, 'confirmed'); assert.equal(entry.statement, quote);
  assert.equal(entry.check.by, 'checker-invocation'); assert.equal(entry.sources[0].id, f.source.id);
  assert.match(result.note, /refresh/);
  assert.equal((await runStatus(f)).output_revision, f.done.output_revision);
});

test('verify follows narrowing, merging and supersession without calling an old assertion confirmed', async t => {
  // Narrowed: the old key is not confirmed; its replacement is named.
  const n = await fixture(t), nSource = await setup(n);
  await submit(n, await take(n), finding(nSource, 'OrionDB permits a single writer globally.'));
  const before = (await factsOf(await runStatus(n))).facts[0].key;
  await finish(n, { check: task => checked(task, { narrowed: quote }) });
  const narrowed = (await verifyKeys({ project: n.project, keys: [before] })).keys[0];
  assert.equal(narrowed.result, 'narrowed'); assert.equal(narrowed.statement, 'OrionDB permits a single writer globally.');
  assert.equal(narrowed.replacement.statement, quote); assert.equal(narrowed.replacement.result, 'confirmed'); assert.equal(narrowed.revision.kind, 'narrowed');

  // Merged duplicate and superseded assertion.
  const m = await fixture(t), mSource = await setup(m), data = finding(mSource);
  data.facts.push(structuredClone(data.facts[0]), { statement: 'OrionDB readers never wait for the writer.', as_of: '2026-10-15', quotes: [{ source: mSource.id, quote: readers, locator: 'Line 1' }] });
  await submit(m, await take(m), data);
  const keys = {};
  await finish(m, { cross: task => {
    const [a, b] = task.facts.filter(fact => fact.statement === quote), c = task.facts.find(fact => fact.statement !== quote);
    Object.assign(keys, { a: a.key, b: b.key, c: c.key });
    return { merges: [{ canonical: a.key, duplicates: [b.key] }], conflicts: [], superseded: [{ fact: c.key, by: a.key, note: 'Synthetic replacement.' }], missing: [] };
  } });
  const results = Object.fromEntries((await verifyKeys({ project: m.project, keys: [keys.b, keys.c, keys.a] })).keys.map(item => [item.key, item]));
  assert.equal(results[keys.b].result, 'confirmed'); assert.equal(results[keys.b].merged_into, keys.a);
  assert.equal(results[keys.c].result, 'superseded'); assert.equal(results[keys.c].replacement.key, keys.a); assert.equal(results[keys.c].revision.reason, 'Synthetic replacement.');
  assert.equal(results[keys.a].result, 'confirmed');
});

test('verify reports rejected, unchecked, stale and gone keys, including keys from an earlier run', async t => {
  const r = await fixture(t), rSource = await setup(r);
  await submit(r, await take(r), finding(rSource));
  const candidate = (await factsOf(await runStatus(r))).facts[0].key;
  assert.equal((await verifyKeys({ project: r.project, keys: [candidate] })).keys[0].result, 'unchecked');
  await finish(r, { check: task => checked(task, { rejected: true }) });
  const rejected = (await verifyKeys({ project: r.project, keys: [candidate] })).keys[0];
  assert.equal(rejected.result, 'rejected'); assert.equal(rejected.reason, 'Synthetic semantic check.');

  const f = await completed(t), key = (await factsOf(f.done)).facts[0].key;
  await writeFile(join(f.project, 'sources/reference.txt'), reference.replace('single writer', 'single primary writer') + '\n');
  const stale = await verifyKeys({ project: f.project, keys: [key, 'fact-' + '0'.repeat(32), 'not-a-key'] });
  assert.equal(stale.all_confirmed, false); assert.equal(stale.status, 'stale');
  assert.deepEqual(stale.keys.map(item => item.result), ['stale', 'gone', 'gone']);
  assert.match(stale.keys[0].reason, /reassess/); assert.match(stale.keys[2].reason, /Not a fact key/);

  await writeFile(join(f.project, 'sources/reference.txt'), reference + '\n');
  await startRun({ project: f.project, topic: 'A different question', sources: [] });
  const earlier = (await verifyKeys({ project: f.project, keys: [key] })).keys[0];
  assert.equal(earlier.result, 'gone'); assert.equal(earlier.previous_run, f.run);
});

test('verify reads cited keys from any file and needs no run ID on the command line', async t => {
  const f = await completed(t), key = (await factsOf(f.done)).facts[0].key;
  await writeFile(join(f.project, 'deck.md'), `# Slide\n\nOrionDB has one writer [R:${key}] and more [R:${key}].\n`);
  const result = await runCli(['verify', '--project', f.project, '--keys', 'deck.md']);
  assert.equal(result.keys.length, 1); assert.equal(result.keys[0].result, 'confirmed');
  await writeFile(join(f.project, 'keys.json'), JSON.stringify([key, 'fact-bad']));
  assert.deepEqual((await runCli(['verify', '--project', f.project, '--keys', 'keys.json'])).keys.map(item => item.result), ['confirmed', 'gone']);
  assert.equal((await runCli(['verify', '--project', f.project, '--key', key, '--run', f.run])).all_confirmed, true);
  await writeFile(join(f.project, 'empty.md'), 'No keys here.\n');
  await assert.rejects(runCli(['verify', '--project', f.project, '--keys', 'empty.md']), /no fact keys/i);
  await assert.rejects(runCli(['verify', '--project', f.project, '--key', key, '--run', 'a'.repeat(24)]), /run changed/);
  assert.equal((await nextTask({ project: f.project, run: f.run, worker: 'anyone' })).task, null);
});

test('reassess --again researches, checks and rewrites only the chosen question and keeps its checked facts', async t => {
  const f = await completed(t), first = (await factsOf(f.done)).facts[0].key;
  const opened = await runCli(['reassess', '--project', f.project, '--run', f.run, '--again', 'writers', '--reason', 'Also say whether readers wait.']);
  assert.equal(opened.reassessing.kind, 'again'); assert.deepEqual(opened.reassessing.questions, ['writers']);
  assert.equal((await verifyKeys({ project: f.project, keys: [first] })).keys[0].result, 'confirmed');
  let seen;
  const done = await finish(f, { research: task => {
    seen = task;
    return { coverage: 'answered', facts: [{ statement: 'OrionDB readers never wait for the writer.', as_of: null, quotes: [{ source: f.source.id, quote: readers, locator: 'Line 1' }] }], gaps: [] };
  } });
  assert.deepEqual(seen.questions.map(q => q.id), ['writers']); assert.equal(seen.again.reason, 'Also say whether readers wait.');
  assert.ok(seen.facts.some(fact => fact.key === first && fact.status === 'confirmed'));
  assert.equal(done.status, 'complete');
  const exported = await factsOf(done);
  assert.equal(exported.facts.filter(fact => fact.status === 'confirmed').length, 2);
  assert.deepEqual(exported.reassessments.map(item => [item.kind, item.reason]), [['again', 'Also say whether readers wait.']]);
  assert.match(await readFile(done.report, 'utf8'), /Researched again on request: round 1 \(1 question; Also say whether readers wait\.\)/);
  assert.equal((await verifyKeys({ project: f.project, keys: [first] })).keys[0].result, 'confirmed');
});

test('reassess --again refuses unknown or unassessed questions, a round in progress and a reason alone', async t => {
  const f = await fixture(t); await setup(f);
  await assert.rejects(runCli(['reassess', '--project', f.project, '--run', f.run, '--again', 'writers']), /not been assessed/);
  await assert.rejects(runCli(['reassess', '--project', f.project, '--run', f.run, '--again', 'nope']), /Unknown question: nope/);
  await assert.rejects(runCli(['reassess', '--project', f.project, '--run', f.run, '--reason', 'Why']), /--reason goes with --again/);
  const c = await completed(t);
  await runCli(['reassess', '--project', c.project, '--run', c.run, '--again', 'writers']);
  await assert.rejects(runCli(['reassess', '--project', c.project, '--run', c.run, '--again', 'writers']), /already in progress/);
});

test('approve records who approved which content, and a later change says it no longer applies', async t => {
  const f = await fixture(t); await setup(f);
  await assert.rejects(runCli(['approve', '--project', f.project, '--by', 'Pat Reviewer']), /approve once it is complete/);
  const c = await completed(t);
  await assert.rejects(runCli(['approve', '--project', c.project, '--by', 'Pat Reviewer', '--revision', String(c.done.output_revision - 1)]), /changed since output revision/);
  await assert.rejects(runCli(['approve', '--project', c.project]), /--by/);
  const approved = await runCli(['approve', '--project', c.project, '--run', c.run, '--by', 'Pat Reviewer', '--revision', String(c.done.output_revision)]);
  assert.equal(approved.approval.by, 'Pat Reviewer'); assert.equal(approved.approval.output_revision, c.done.output_revision); assert.equal(approved.approval.current, true);
  const status = await runStatus(c); assert.equal(status.approval.current, true);
  const exported = await factsOf(status);
  assert.equal(exported.approval.by, 'Pat Reviewer'); assert.equal(exported.approvals.length, 1); assert.match(exported.approvals[0].content, /^[a-f0-9]{64}$/);
  assert.match(await readFile(status.report, 'utf8'), /Approval: approved by Pat Reviewer on \d{4}-\d{2}-\d{2} \(output revision \d+\)\./);
  assert.equal((await verifyKeys({ project: c.project, keys: [exported.facts[0].key] })).approval.current, true);
  await runCli(['reassess', '--project', c.project, '--run', c.run, '--again', 'writers']);
  const changed = await runStatus(c);
  assert.equal(changed.approval.current, false); assert.match(changed.approval.reason, /changed since it was approved/);
  assert.match(await readFile(changed.report, 'utf8'), /no longer applies/);
});

const trial = new URL('../docs/verification/0.9.0/claude-code-redis-valkey/new', import.meta.url).pathname;
async function newProject(t) { const { project } = await import('./run-fixtures.mjs'); return project(t, 'research-reuse-target-'); }

test('start --from reuses finished research at once, with the same keys and the origin approval kept as history', async t => {
  const origin = await completed(t);
  await runCli(['approve', '--project', origin.project, '--by', 'Origin Reviewer']);
  const key = (await factsOf(await runStatus(origin))).facts[0].key, target = await newProject(t);
  const started = await runCli(['start', '--project', target, '--from', origin.project]);
  assert.equal(started.status, 'complete'); assert.equal(started.approval, null);
  const exported = await factsOf(started);
  assert.equal(exported.topic, 'OrionDB deployment'); assert.deepEqual(exported.facts.map(fact => fact.key), [key]);
  assert.equal(exported.origins[0].run, origin.run); assert.equal(exported.origins[0].approvals[0].by, 'Origin Reviewer');
  assert.equal(exported.sources[0].imported.run, origin.run); assert.match(exported.sources[0].file, /^research\/sources\/revisions\//);
  assert.equal((await verifyKeys({ project: target, keys: [key] })).keys[0].result, 'confirmed');
  const report = await readFile(started.report, 'utf8');
  assert.match(report, /Started from: .* approved there by Origin Reviewer .* history and not an approval of this run/);
  assert.match(report, /OrionDB permits a single writer/);
  // Reuse can then be approved, researched again and reused in turn, keeping the same key.
  const again = await runCli(['start', '--project', await newProject(t), '--from', target]);
  assert.deepEqual((await factsOf(again)).facts.map(fact => fact.key), [key]);
});

test('start --from researches again what it cannot carry: unsaved text, unchecked candidates, or found sources in a supplied-only run', async t => {
  const target = await newProject(t);
  const stale = await startRun({ project: target, from: [trial], allowWeb: true });
  assert.equal(stale.status, 'in-progress'); assert.equal(stale.reassess.kind, 'import'); assert.equal(stale.reassess.questions.length, 20);
  const exported = await factsOf(stale);
  assert.equal(exported.facts.filter(fact => fact.status === 'stale').length, 113); assert.equal(exported.counts.checked, 0);
  assert.match(stale.warnings[0], /without saved text/);
  const one = (await verifyKeys({ project: target, keys: [exported.facts[0].key] })).keys[0];
  assert.equal(one.result, 'stale'); assert.match(one.reason, /saved source text was not available/);
  assert.equal((await nextTask({ project: target, run: stale.run, worker: 'w' })).task.kind, 'research');

  const supplied = await startRun({ project: await newProject(t), from: [trial] });
  assert.equal((await factsOf(supplied)).facts.length, 0); assert.match(supplied.warnings.join(' '), /113 facts resting on public-web sources were left out/);
  assert.equal(supplied.reassess.questions.length, 20);

  const partial = await fixture(t), partialSource = await setup(partial);
  await submit(partial, await take(partial), finding(partialSource));
  const fromPartial = await startRun({ project: await newProject(t), from: [partial.project] });
  assert.equal((await factsOf(fromPartial)).facts.length, 0); assert.deepEqual(fromPartial.reassess.questions, ['writers']);
});

test('start --from refuses edited research, claims, a different depth and a replacement plan', async t => {
  const origin = await completed(t), file = join(origin.project, 'research/facts.json');
  const target = await newProject(t);
  await assert.rejects(startRun({ project: target, from: [origin.project], depth: 'standard' }), /keeps its depth/);
  await assert.rejects(startRun({ project: target, from: [origin.project], claims: [{ file: 'sources/reference.txt', quote, start: 0 }] }), /fact-check is its own run/);
  await assert.rejects(startRun({ project: target, from: [join(target, 'nothing')] }), /No saved research/);
  const reused = await startRun({ project: target, from: [origin.project], planOnly: true });
  await assert.rejects(runCli(['continue', '--project', target, '--run', reused.run, '--file', file]), /extended by the planner, not replaced/);
  const facts = JSON.parse(await readFile(file, 'utf8'));
  facts.facts[0].citations[0].quote = facts.facts[0].citations[0].quote.replace('single', 'sole');
  const edited = JSON.stringify(facts, null, 2) + '\n', manifest = JSON.parse(await readFile(join(origin.project, 'research/output.json'), 'utf8'));
  const { hash } = await import('../scripts/lib/run-storage.mjs');
  manifest.files['facts.json'] = hash(edited);
  await writeFile(file, edited); await writeFile(join(origin.project, 'research/output.json'), JSON.stringify(manifest));
  await assert.rejects(startRun({ project: await newProject(t), from: [origin.project] }), /does not match its saved source text/);
  await writeFile(file, edited.replace('OrionDB', 'OrionDB '));
  await assert.rejects(startRun({ project: await newProject(t), from: [origin.project] }), /does not match its output\.json/);
});

test('a new topic extends the reused plan; only new questions are researched, checked, cross-checked and written', async t => {
  const origin = await completed(t), key = (await factsOf(origin.done)).facts[0].key, target = await newProject(t);
  const started = await startRun({ project: target, from: [origin.project], topic: 'OrionDB deployment and crash safety' });
  const f = { project: target, run: started.run };
  let extension, researched;
  const done = await finish(f, {
    plan: task => { extension = task; return { sections: [{ id: 'safety', name: 'Crash safety' }], questions: [{ id: 'crash', section: 'safety', question: 'Does OrionDB lose committed transactions in a crash?' }] }; },
    research: task => { researched = task.questions.map(q => q.id); return { coverage: 'answered', facts: [{ statement: 'OrionDB loses no committed transaction in a crash.', as_of: null, quotes: [{ source: task.sources[0].id, quote: 'The engine keeps a write-ahead log, so a crash loses no committed transaction.', locator: 'Line 1' }] }], gaps: [] }; },
  });
  assert.match(extension.brief, /reuses earlier checked research/); assert.deepEqual(extension.existing.questions.map(q => q.id), ['writers']);
  assert.deepEqual(researched, ['crash']); assert.equal(done.status, 'complete');
  const exported = await factsOf(done);
  assert.deepEqual(exported.sections.map(s => s.id), ['deployment', 'safety']);
  assert.ok(exported.facts.some(fact => fact.key === key)); assert.equal(exported.counts.checked, 2);
  assert.deepEqual(exported.reassessments.map(item => [item.kind, item.questions]), [['import', ['crash']]]);
  const tasks = JSON.parse(await readFile(done.file, 'utf8')).tasks.map(task => task.kind);
  assert.ok(tasks.includes('gap-cross')); assert.ok(!tasks.includes('source'));
  assert.match(await readFile(done.report, 'utf8'), /## Crash safety[\s\S]*OrionDB loses no committed transaction/);
});

test('two origins with colliding IDs are renamed, and a shared question is assessed again by one checker', async t => {
  const first = await completed(t);
  const otherPlan = { scope: 'Synthetic operations.', sections: [{ id: 'deployment', name: 'Operations' }], subjects: [], questions: [{ id: 'writers', section: 'deployment', kind: 'open', question: 'Does OrionDB allow several writers?' }] };
  const second = await fixture(t), secondSource = await setup(second, otherPlan);
  await submit(second, await take(second), finding(secondSource)); await finish(second);
  const target = await newProject(t), started = await startRun({ project: target, from: [first.project, second.project] });
  const done = await finish({ project: target, run: started.run }, { plan: () => ({ questions: [] }) });
  assert.equal(done.status, 'complete');
  const exported = await factsOf(done);
  assert.deepEqual(exported.sections.map(s => s.id), ['deployment', 'deployment-2']);
  assert.deepEqual(exported.questions.map(q => [q.id, q.section]), [['writers', 'deployment'], ['writers-2', 'deployment-2']]);
  assert.deepEqual(exported.questions.map(q => q.facts.length), [1, 1]);
  assert.equal(exported.origins.length, 2);

  const twin = await completed(t), sharedProject = await newProject(t), shared = await startRun({ project: sharedProject, from: [first.project, twin.project] });
  assert.equal(shared.reassess, null);
  const sharedDone = await finish({ project: sharedProject, run: shared.run }, { plan: () => ({ questions: [] }), research: () => ({ coverage: 'answered', facts: [], gaps: [] }) });
  const sharedFacts = await factsOf(sharedDone);
  assert.equal(sharedFacts.questions.length, 1); assert.equal(sharedFacts.questions[0].facts.length, 2);
  assert.deepEqual(sharedFacts.reassessments.map(item => item.questions), [['writers']]);
});
