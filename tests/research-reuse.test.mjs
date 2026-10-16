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
