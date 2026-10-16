import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { startRun, nextTask, runStatus, verifyKeys } from '../scripts/lib/research-run.mjs';
import { runCli } from '../scripts/lib/run-cli.mjs';
import { quote, reference, surroundings, project, fixture, setup, take, submit, finding, checked, writing, finish, completed } from './run-fixtures.mjs';

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
const newProject = t => project(t, 'research-reuse-target-');

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

test('find lists research folders under a directory with their status, size, approval and source age', async t => {
  const { mkdir, cp } = await import('node:fs/promises');
  const base = await newProject(t);
  const nested = async name => { const dir = join(base, name); await mkdir(join(dir, 'sources'), { recursive: true }); await writeFile(join(dir, 'sources/reference.txt'), reference + '\n'); return completed(t, { project: dir }); };
  const a = await nested('decks/a'), b = await nested('blog/posts/b');
  await runCli(['approve', '--project', a.project, '--by', 'Pat Reviewer']);
  await cp(join(a.project, 'research'), join(base, 'node_modules/pkg/research'), { recursive: true });
  await cp(join(a.project, 'research'), join(base, '.cache/research'), { recursive: true });
  const all = await runCli(['find', '--in', base]);
  assert.deepEqual(all.results.map(item => item.path).sort(), ['blog/posts/b', 'decks/a']);
  const found = all.results.find(item => item.path === 'decks/a');
  assert.equal(found.run, a.run); assert.equal(found.status, 'complete'); assert.equal(found.depth, 'light');
  assert.equal(found.counts.facts, 1); assert.equal(found.counts.questions, 1); assert.equal(found.approval.by, 'Pat Reviewer');
  assert.match(found.sources_saved.oldest, /^\d{4}-/); assert.equal(found.sources_age_days, 0);
  assert.equal(all.results.find(item => item.path === 'blog/posts/b').approval, null);
  assert.equal((await runCli(['find', '--in', base, '--query', 'how many WRITERS'])).results.length, 2);
  assert.deepEqual((await runCli(['find', '--in', base, '--query', 'crash'])).results, []);
  await writeFile(join(b.project, 'research/facts.json'), '{}');
  const broken = (await runCli(['find', '--in', base])).results.find(item => item.path === 'blog/posts/b');
  assert.match(broken.error, /does not match its output\.json/);
  await assert.rejects(runCli(['find', '--project', base]), /--in DIR/);
});

// A finished public-web run whose one fact rests on a page found on the web.
async function webRun(t) {
  const f = await fixture(t, { allowWeb: true }); await setup(f);
  await writeFile(join(f.project, 'research/sources/orion-web.md'), reference + '\n');
  await submit(f, await take(f), { register: [{ file: 'research/sources/orion-web.md', origin: 'https://fixture.invalid/orion', title: 'OrionDB web page', publisher: 'Fixture web' }], coverage: 'answered', facts: [{ statement: quote, as_of: null, quotes: [{ file: 'research/sources/orion-web.md', quote, locator: 'Line 1' }] }], gaps: [] });
  const done = await finish(f);
  return { ...f, done, key: (await factsOf(done)).facts[0].key };
}
const reread = (f, content) => async task => {
  await writeFile(join(f.project, 'research/sources/orion-web-current.md'), content);
  return { sources: task.sources.map(source => ({ source: source.id, read_original: true, file: 'research/sources/orion-web-current.md' })) };
};

test('refresh re-reads web sources; unchanged text keeps every fact current', async t => {
  const f = await webRun(t);
  const opened = await runCli(['refresh', '--project', f.project, '--run', f.run]);
  assert.equal(opened.refreshing.kind, 'refresh'); assert.equal(opened.refreshing.phase, 'reading');
  let task;
  const done = await finish(f, { refresh: async item => { task = item; return reread(f, reference + '\n')(item); } });
  assert.deepEqual(task.sources.map(source => source.origin), ['https://fixture.invalid/orion']); assert.deepEqual(task.sources[0].quotes, [quote]);
  assert.match(task.brief, /Open each listed original again/);
  assert.equal(done.status, 'complete');
  const exported = await factsOf(done), source = exported.sources.find(item => item.origin === 'https://fixture.invalid/orion');
  assert.equal(source.refreshed.result, 'unchanged'); assert.equal(exported.facts.find(fact => fact.key === f.key).status, 'confirmed');
  assert.match(await readFile(done.report, 'utf8'), /Sources re-read: round 1 on \d{4}-\d{2}-\d{2} \(1 unchanged, 0 changed, 0 could not be opened; 0 questions researched again\)/);
});

test('refresh makes a fact stale when its passage is gone, and researches, checks and rewrites just its question', async t => {
  const f = await webRun(t);
  await runCli(['refresh', '--project', f.project, '--run', f.run]);
  const changed = reference.replace(quote, 'OrionDB now permits two writers for each database, one per region.') + '\n';
  let researched;
  const done = await finish(f, { refresh: reread(f, changed), research: task => {
    researched = task;
    const current = task.sources.find(source => source.origin === 'https://fixture.invalid/orion');
    return { coverage: 'answered', facts: [{ statement: 'OrionDB now permits two writers for each database.', as_of: null, quotes: [{ source: current.id, quote: 'OrionDB now permits two writers for each database, one per region.', locator: 'Line 1' }] }], gaps: [] };
  } });
  assert.deepEqual(researched.questions.map(q => q.id), ['writers']);
  assert.equal(done.status, 'complete');
  const exported = await factsOf(done), sources = exported.sources.filter(item => item.origin === 'https://fixture.invalid/orion');
  assert.equal(sources.length, 2); assert.equal(sources[1].revision_of, sources[0].id); assert.ok(sources[0].stale_since);
  assert.equal(sources[0].refreshed.result, 'changed'); assert.equal(sources[0].refreshed.passages_missing, 1);
  const old = (await verifyKeys({ project: f.project, keys: [f.key] })).keys[0];
  assert.equal(old.result, 'stale'); assert.match(old.reason, /no longer in the current original/);
  assert.match(exported.questions[0].headline.sentence, /two writers/);
  assert.match(await readFile(done.report, 'utf8'), /Sources re-read: round 1 .*\(0 unchanged, 1 changed, 0 could not be opened; 1 question researched again\)/);
});

test('refresh keeps facts whose passages remain, records unreadable originals, and needs a finished run', async t => {
  const f = await webRun(t);
  await runCli(['refresh', '--project', f.project, '--run', f.run]);
  const done = await finish(f, { refresh: reread(f, reference + ' A later paragraph adds release notes that do not touch the writer rule at all.\n') });
  const exported = await factsOf(done);
  assert.equal(exported.facts.find(fact => fact.key === f.key).status, 'confirmed');
  assert.equal(exported.sources.filter(item => item.origin === 'https://fixture.invalid/orion').length, 2);
  assert.equal(exported.reassessments.at(-1).questions.length, 0);

  await runCli(['refresh', '--project', f.project, '--run', f.run]);
  const unread = await finish(f, { refresh: task => ({ sources: task.sources.map(source => ({ source: source.id, read_original: false, access_error: 'HTTP 503 from the site.' })) }) });
  const after = (await factsOf(unread)).sources.find(item => item.origin === 'https://fixture.invalid/orion' && !item.stale_since);
  assert.equal(after.refreshed.result, 'unavailable'); assert.match(after.refreshed.reason, /503/);
  assert.equal((await verifyKeys({ project: f.project, keys: [f.key] })).keys[0].result, 'confirmed');

  const local = await completed(t);
  const nothing = await runCli(['refresh', '--project', local.project, '--run', local.run]);
  assert.equal(nothing.status, 'complete'); assert.equal(nothing.refreshing.done, true); assert.match(nothing.note, /no cited source is a readable web page/);
  const open = await fixture(t); await setup(open);
  await assert.rejects(runCli(['refresh', '--project', open.project, '--run', open.run]), /finished run/);
  await writeFile(join(local.project, 'sources/reference.txt'), reference.replace('single', 'sole') + '\n');
  await assert.rejects(runCli(['refresh', '--project', local.project, '--run', local.run]), /reassess first/);
});

// Regression tests from the 0.9.1 review.
const twoQuestions = { scope: 'Synthetic OrionDB facts.', sections: [{ id: 'deployment', name: 'Deployment' }], subjects: [], questions: [{ id: 'writers', section: 'deployment', kind: 'open', question: 'How many writers does OrionDB permit?' }, { id: 'readers', section: 'deployment', kind: 'open', question: 'Do OrionDB readers wait for the writer?' }] };
const readerFact = source => ({ statement: 'OrionDB readers never wait for the writer.', as_of: null, quotes: [{ source: source.id, quote: readers, locator: 'Line 1' }] });

test('verify follows a narrowed assertion that was later superseded to the one standing now', async t => {
  const f = await fixture(t), source = await setup(f), data = finding(source, 'OrionDB permits a single writer globally.');
  data.facts.push(readerFact(source));
  await submit(f, await take(f), data);
  const before = (await factsOf(await runStatus(f))).facts.find(fact => /globally/.test(fact.statement)).key;
  let replacement;
  await finish(f, {
    check: task => { const result = checked(task); result.facts = result.facts.map(item => item.key === before ? { ...item, result: 'narrowed', statement: quote, reason: 'Synthetic narrowing.' } : item); return result; },
    cross: task => { const narrowed = task.facts.find(fact => fact.statement === quote), other = task.facts.find(fact => fact.statement !== quote); replacement = other.key; return { merges: [], conflicts: [], superseded: [{ fact: narrowed.key, by: other.key, note: 'Synthetic replacement.' }], missing: [] }; },
  });
  const entry = (await verifyKeys({ project: f.project, keys: [before] })).keys[0];
  assert.equal(entry.result, 'narrowed'); assert.equal(entry.replacement.key, replacement); assert.equal(entry.replacement.result, 'confirmed');
});

test('a round that finishes before the first pass writes a section leaves that section to be written in full', async t => {
  const f = await fixture(t), source = await setup(f, twoQuestions);
  const research = await take(f), data = { questions: [{ id: 'writers', ...finding(source) }, { id: 'readers', coverage: 'answered', facts: [readerFact(source)], gaps: [] }] };
  await submit(f, research, data);
  const check = await take(f, 'checker'); await submit(f, check, checked(check));
  await runCli(['reassess', '--project', f.project, '--run', f.run, '--again', 'writers']);
  const again = await take(f, 'researcher-again'); assert.equal(again.kind, 'research');
  const cross = await take(f, 'crosser'); assert.equal(cross.kind, 'cross');
  await submit(f, again, { coverage: 'answered', facts: [], gaps: [] });
  const recheck = await take(f, 'checker-2'); await submit(f, recheck, checked(recheck));
  const write = await take(f, 'writer'); assert.deepEqual(write.questions.map(q => q.id), ['writers']); await submit(f, write, writing(write));
  await submit(f, cross, { merges: [], conflicts: [], superseded: [], missing: [] });
  const done = await finish(f);
  assert.equal(done.status, 'complete');
  assert.ok((await factsOf(done)).questions.every(question => question.headline), 'every question is written');
});

test('refresh follows a page through several revisions, including back to earlier text', async t => {
  const f = await webRun(t), refresh = () => runCli(['refresh', '--project', f.project, '--run', f.run]);
  for (const text of [reference + ' A first added paragraph about release notes leaves the writer rule alone.\n', reference + ' A second added paragraph about packaging leaves the writer rule alone.\n', reference + '\n']) { await refresh(); await finish(f, { refresh: reread(f, text) }); }
  await refresh();
  let task;
  await finish(f, {
    refresh: async item => { task = item; return reread(f, reference.replace(quote, 'OrionDB now permits two writers for each database, one per region.') + '\n')(item); },
    research: item => ({ coverage: 'answered', facts: [{ statement: 'OrionDB now permits two writers for each database.', as_of: null, quotes: [{ source: item.sources.find(s => s.origin === 'https://fixture.invalid/orion').id, quote: 'OrionDB now permits two writers for each database, one per region.' }] }], gaps: [] }),
  });
  assert.equal(task.sources.length, 1); assert.deepEqual(task.sources[0].quotes, [quote]);
  assert.equal((await verifyKeys({ project: f.project, keys: [f.key] })).keys[0].result, 'stale');
  const web = JSON.parse(await readFile(join(f.project, '.harness-research/research-run.json'), 'utf8')).sources.filter(s => s.origin === 'https://fixture.invalid/orion');
  assert.equal(new Set(web.map(s => s.id)).size, 5); assert.equal(web.filter(s => !s.stale_since).length, 1);
});

test('import does not carry a confirmed fact whose saved text is gone, even from an older revision, and refuses an altered pin', async t => {
  const { rm, chmod } = await import('node:fs/promises');
  const f = await webRun(t);
  await runCli(['refresh', '--project', f.project, '--run', f.run]);
  await finish(f, { refresh: reread(f, reference + ' An added paragraph about packaging leaves the writer rule alone.\n') });
  const record = JSON.parse(await readFile(join(f.project, '.harness-research/research-run.json'), 'utf8'));
  const old = record.sources.find(s => s.origin === 'https://fixture.invalid/orion' && s.stale_since);
  await rm(join(f.project, old.pinned)); await rm(join(f.project, old.file));
  const started = await startRun({ project: await newProject(t), from: [f.project], allowWeb: true });
  assert.equal(started.status, 'in-progress'); assert.deepEqual(started.reassess.questions, ['writers']);
  const imported = (await verifyKeys({ project: started.file.replace('/.harness-research/research-run.json', ''), keys: [f.key] })).keys[0];
  assert.equal(imported.result, 'stale');

  const g = await completed(t), pinned = (await factsOf(g.done)).sources[0].pinned;
  await chmod(join(g.project, pinned), 0o644); await writeFile(join(g.project, pinned), reference.replace('single', 'sole') + '\n');
  await assert.rejects(startRun({ project: await newProject(t), from: [g.project] }), /saved text .* altered/);
});

test('import rewrites and reviews answers that were never reviewed at standard depth', async t => {
  const f = await fixture(t, { depth: 'standard' }), source = await setup(f);
  await submit(f, await take(f), finding(source));
  const check = await take(f, 'checker'); await submit(f, check, checked(check));
  await submit(f, await take(f, 'checker'), { merges: [], conflicts: [], superseded: [], missing: [] });
  const write = await take(f, 'writer'); await submit(f, write, writing(write));
  assert.equal((await runStatus(f)).status, 'in-progress');
  const target = await newProject(t), started = await startRun({ project: target, from: [f.project] });
  assert.equal(started.status, 'in-progress'); assert.deepEqual(started.reassess.rewrite, ['writers']);
  const done = await finish({ project: target, run: started.run });
  const exported = await factsOf(done);
  assert.equal(exported.prose_review, 'independently reviewed'); assert.ok(exported.questions[0].writingReview.by);
});

test('a question two origins answer differently is assessed again, and a stale or edited selected original is read again', async t => {
  const rejected = await fixture(t), rSource = await setup(rejected);
  await submit(rejected, await take(rejected), finding(rSource));
  await finish(rejected, { check: task => checked(task, { rejected: true }) });
  const answered = await completed(t), target = await newProject(t);
  const started = await startRun({ project: target, from: [rejected.project, answered.project] });
  const done = await finish({ project: target, run: started.run }, { plan: () => ({ questions: [] }), research: () => ({ coverage: 'answered', facts: [], gaps: [] }) });
  const question = (await factsOf(done)).questions[0];
  assert.equal(question.coverage, 'answered'); assert.notEqual(question.headline.kind, 'gap');
  assert.deepEqual((await factsOf(done)).reassessments.map(item => item.questions), [['writers']]);

  const local = await completed(t), key = (await factsOf(local.done)).facts[0].key;
  await writeFile(join(local.project, 'sources/reference.txt'), reference.replace('single writer', 'single primary writer') + '\n');
  const again = await startRun({ project: local.project, from: ['.'] });
  assert.equal(again.status, 'in-progress');
  assert.equal((await verifyKeys({ project: local.project, keys: [key] })).keys[0].result, 'stale');
  const reread = await take({ project: local.project, run: again.run }, 'reader');
  assert.equal(reread.kind, 'source'); assert.equal(reread.selected.file, 'sources/reference.txt');
});

test('a research folder copied under another name keeps its saved text', async t => {
  const { cp, mkdir } = await import('node:fs/promises');
  const origin = await completed(t), target = await newProject(t);
  await mkdir(join(target, 'archive')); await cp(join(origin.project, 'research'), join(target, 'archive/orion-research'), { recursive: true });
  const started = await startRun({ project: target, from: ['archive/orion-research'] });
  assert.equal(started.status, 'complete'); assert.deepEqual(started.warnings, []);
});

test('reuse with a new selected source reads it before the planner extends the plan', async t => {
  const origin = await completed(t), target = await newProject(t);
  await writeFile(join(target, 'sources/backups.txt'), 'OrionDB backups are taken from a consistent snapshot every night.' + surroundings + '\n');
  const started = await startRun({ project: target, from: [origin.project], sources: ['sources/backups.txt'] });
  const f = { project: target, run: started.run }, kinds = [];
  const first = await take(f, 'reader'); kinds.push(first.kind);
  await submit(f, first, { register: [{ file: 'sources/backups.txt', title: 'Backups', publisher: 'Fixture' }] });
  const done = await finish(f, { plan: task => { kinds.push(task.kind); assert.ok(task.sources.some(source => source.given)); return { questions: [] }; } });
  assert.deepEqual(kinds, ['source', 'plan']); assert.equal(done.status, 'complete');
});

test('claim questions come across only when their exact target is in the new project', async t => {
  const origin = await project(t), draft = 'OrionDB permits a single writer for each database, says our draft.\n';
  await writeFile(join(origin, 'draft.md'), draft);
  const claim = { file: 'draft.md', quote: 'OrionDB permits a single writer', start: 0 };
  const f = await fixture(t, { project: origin, claims: [claim] });
  await setup(f, { scope: 'Check the draft.', sections: [{ id: 'claims', name: 'Claims' }], subjects: [], questions: [{ id: 'claim-1', section: 'claims', kind: 'claim', question: 'Is the draft right about writers?', claim }] });
  await submit(f, await take(f), finding((await factsOf(await runStatus(f))).sources[0]));
  assert.equal((await finish(f)).status, 'complete');
  const without = await startRun({ project: await newProject(t), from: [origin] });
  assert.match(without.warnings.join(' '), /Claim question claim-1 was left out/); assert.equal(without.counts.questions, 0);
  const withDraft = await newProject(t); await writeFile(join(withDraft, 'draft.md'), draft);
  const carried = await startRun({ project: withDraft, from: [origin] });
  assert.equal(carried.status, 'complete'); assert.equal((await factsOf(carried)).questions[0].verdict, 'supported');
});

test('a file selected again, or already carried over by reuse, is one selected source and never stalls the run', async t => {
  const researchWithNewSource = item => ({ coverage: 'answered', facts: [{ statement: 'OrionDB permits a single primary writer.', as_of: null, quotes: [{ source: item.sources.find(source => source.given && !source.stale_since).id, quote: 'OrionDB permits a single primary writer for each database.' }] }], gaps: [] });
  const changedText = reference.replace('single writer', 'single primary writer') + '\n';
  const readSelected = async (f, task) => submit(f, task, { register: [{ file: task.selected.file, title: 'Reference', publisher: 'Fixture' }] });
  async function drive(f) {
    const tasks = [];
    for (let step = 0; step < 40; step++) {
      const status = await runStatus(f);
      if (status.status.startsWith('complete')) return { status, tasks };
      const task = await take(f, `w-${step}`); assert.ok(task, `stalled: ${JSON.stringify(status.blockReasons)}`); tasks.push(task.kind);
      if (task.kind === 'source') await readSelected(f, task);
      else if (task.kind === 'plan') await submit(f, task, { questions: [] });
      else if (task.kind === 'research') await submit(f, task, researchWithNewSource(task));
      else if (task.kind.endsWith('check') && !task.kind.endsWith('cross')) await submit(f, task, checked(task));
      else if (task.kind.endsWith('cross')) await submit(f, task, { merges: [], conflicts: [], superseded: [], missing: [] });
      else await submit(f, task, writing(task));
    }
    throw new Error('Run did not finish.');
  }
  // Changed original, also selected with --source: one source task.
  const a = await completed(t);
  await writeFile(join(a.project, 'sources/reference.txt'), changedText);
  const fromA = await startRun({ project: a.project, from: ['.'], sources: ['sources/reference.txt'] });
  const driven = await drive({ project: a.project, run: fromA.run });
  assert.equal(driven.tasks.filter(kind => kind === 'source').length, 1); assert.equal(driven.status.status, 'complete');

  // Unchanged original selected again: the carried-over source becomes the selected one.
  const b = await completed(t);
  const fromB = await startRun({ project: b.project, from: ['.'], sources: ['sources/reference.txt'] });
  const plain = await drive({ project: b.project, run: fromB.run });
  assert.deepEqual(plain.tasks, ['source', 'plan']); assert.equal(plain.status.status, 'complete');

  // Two origins selected different versions of one file; this project holds a third.
  const one = await completed(t), two = await project(t);
  await writeFile(join(two, 'sources/reference.txt'), reference.replace('Replication', 'Replication and failover') + '\n');
  const twoRun = await fixture(t, { project: two }), twoSource = await setup(twoRun);
  await submit(twoRun, await take(twoRun), finding(twoSource)); await finish(twoRun);
  const target = await newProject(t); await writeFile(join(target, 'sources/reference.txt'), changedText);
  const both = await startRun({ project: target, from: [one.project, two] });
  assert.equal((await drive({ project: target, run: both.run })).tasks.filter(kind => kind === 'source').length, 1);

  // The same file selected twice on a new run.
  const twice = await startRun({ project: await newProject(t), topic: 'Twice', sources: ['sources/reference.txt', 'sources/reference.txt'] });
  assert.equal(JSON.parse(await readFile(twice.file, 'utf8')).givenSources.length, 1);
});
