import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, realpath, rm, readFile, writeFile, mkdir, readdir, symlink, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { planResearch, recordResearch, researchStatus } from '../scripts/lib/research.mjs';
const exec = promisify(execFile);
const sourceRoot = new URL('../', import.meta.url).pathname;
async function fixture(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'tanzu-topic-')));
  t.after(() => rm(root, { recursive: true, force: true }));
  await writeFile(join(root, 'brief.md'), 'Synthetic public product research.');
  await mkdir(join(root, 'sources'));
  await writeFile(join(root, 'sources', 'release.md'), 'Feature A is available in version 2.');
  return root;
}
const plan = () => ({ topic: 'Synthetic feature availability', purpose: 'planning', scope: 'public-web', input_files: ['brief.md'], items: [
  { id: 'availability', question: 'Check feature availability', public_query: 'public feature release notes', claim: null },
  { id: 'performance', question: 'Check performance evidence', public_query: 'public benchmark methods', claim: null },
] });
const finding = () => ({ status: 'supported', summary: 'The feature is available in version 2.', limits: 'Synthetic fixture; no live product validation.', evidence: [
  { file: 'sources/release.md', title: 'Synthetic release notes', origin: 'https://example.invalid/release', quote: 'Feature A is available in version 2.', start: 0, locator: 'Feature section', source_date: '2026-10-07' },
] });
const report = root => readFile(join(root, '.harness-research', 'research-report.md'), 'utf8');

test('plan and every recorded finding automatically produce a cited report including unresolved questions', async t => {
  const root = await fixture(t);
  const initial = await planResearch(root, plan());
  assert.equal(initial.status, 'in-progress');
  assert.equal(initial.completed, 0); assert.equal(initial.total, 2);
  assert.match(await report(root), /Pending: availability, performance/);
  const first = await recordResearch(root, initial.run, 'availability', finding());
  assert.equal(first.completed, 1);
  assert.match(await report(root), /https:\/\/example.invalid\/release/);
  assert.match(await report(root), /SHA256: [0-9a-f]{64}/);
  const last = await recordResearch(root, initial.run, 'performance', { status: 'insufficient', summary: 'No inspected benchmark supports the claim.', limits: 'Performance remains an open question.', evidence: [] });
  assert.equal(last.status, 'complete'); assert.deepEqual(last.unresolved, ['performance']);
  assert.match(await report(root), /No inspected benchmark/);
  assert.match(await report(root), /Unresolved: performance/);
  assert.match(await report(root), /does not certify a factual or downstream review/);
});

test('matching plans resume findings and changes retain history with a new run', async t => {
  const root = await fixture(t);
  const first = await planResearch(root, plan());
  await recordResearch(root, first.run, 'availability', finding());
  const resumed = await planResearch(root, plan());
  assert.equal(resumed.run, first.run); assert.equal(resumed.completed, 1);
  const changed = plan(); changed.topic = 'Changed research scope';
  const next = await planResearch(root, changed);
  assert.notEqual(next.run, first.run); assert.equal(next.completed, 0);
  assert.ok((await readdir(join(root, '.harness-research', 'history'))).some(name => name.endsWith('.md')));
  await assert.rejects(recordResearch(root, first.run, 'availability', finding()), /run or content changed/);
});

test('changed content or evidence is stale and cannot silently be counted as current', async t => {
  const root = await fixture(t);
  const initial = await planResearch(root, plan());
  await recordResearch(root, initial.run, 'availability', finding());
  await writeFile(join(root, 'sources/release.md'), 'Changed release information.');
  const stale = await researchStatus(root);
  assert.equal(stale.status, 'stale'); assert.deepEqual(stale.staleItems, ['availability']);
  assert.match(await report(root), /Status: stale/);
  await writeFile(join(root, 'brief.md'), 'Changed presentation goal.');
  await assert.rejects(recordResearch(root, initial.run, 'performance', { status: 'unavailable', summary: 'Unavailable', limits: 'No source access', evidence: [] }), /run or content changed/);
  const next = await planResearch(root, plan());
  assert.notEqual(next.run, initial.run);
});

test('verdicts require actual exact passages and unknown questions or bad quotations preserve the record', async t => {
  const root = await fixture(t);
  const initial = await planResearch(root, plan());
  const bad = finding(); bad.evidence[0].quote = 'Invented supporting passage';
  await assert.rejects(recordResearch(root, initial.run, 'availability', bad), /quote.*exactly/);
  await assert.rejects(recordResearch(root, initial.run, 'availability', { ...finding(), evidence: [] }), /inspected source passage/);
  await assert.rejects(recordResearch(root, initial.run, 'unknown', finding()), /Unknown/);
  assert.equal((await researchStatus(root)).completed, 0);
});

test('supplied-only and private-query protections persist across replanning', async t => {
  const root = await fixture(t);
  const restricted = plan(); restricted.scope = 'supplied-only'; restricted.items.forEach(item => { item.public_query = null; });
  await planResearch(root, restricted);
  await assert.rejects(planResearch(root, plan()), /explicit permission/);
  const bad = plan(); bad.items[0].public_query = 'https://internal.invalid/path';
  await assert.rejects(planResearch(root, bad, { allowWeb: true }), /cannot contain URLs/);
  assert.equal((await planResearch(root, plan(), { allowWeb: true })).status, 'in-progress');
});

test('fact-checks bind exact Unicode claims to a content snapshot and keep contradictory findings', async t => {
  const root = await fixture(t);
  await writeFile(join(root, 'deck.md'), '😀 Feature A is unavailable.');
  const selected = plan(); selected.purpose = 'fact-check'; selected.items = [{ id: 'claim', question: 'Verify availability claim', public_query: 'public feature release notes', claim: { file: 'deck.md', quote: 'Feature A is unavailable.', start: 2 } }];
  const run = await planResearch(root, selected);
  await recordResearch(root, run.run, 'claim', { ...finding(), status: 'contradicted', summary: 'The inspected source contradicts the draft claim.' });
  assert.match(await report(root), /contradicted/); assert.match(await report(root), /Feature A is unavailable/);
  await writeFile(join(root, 'deck.md'), '😀 Different claim.');
  assert.equal((await researchStatus(root)).status, 'stale');
  await assert.rejects(planResearch(root, selected), /Claim does not match/);
});

test('source traversal, symlinks and unowned storage cannot overwrite external or user files', async t => {
  const root = await fixture(t);
  const run = await planResearch(root, plan());
  const bad = finding(); bad.evidence[0].file = '../outside.md';
  await assert.rejects(recordResearch(root, run.run, 'availability', bad), /relative to the project/);
  const external = await realpath(await mkdtemp(join(tmpdir(), 'tanzu-outside-'))); t.after(() => rm(external, { recursive: true, force: true }));
  await writeFile(join(external, 'source.md'), 'Feature A is available in version 2.');
  await symlink(join(external, 'source.md'), join(root, 'sources/outside.md'));
  bad.evidence[0].file = 'sources/outside.md';
  await assert.rejects(recordResearch(root, run.run, 'availability', bad), /symlink escapes/);
  await writeFile(join(root, '.harness-research', 'research.json'), '{"user_data":"keep"}');
  await assert.rejects(planResearch(root, plan()), /Unrecognized research record/);
  assert.equal(await readFile(join(root, '.harness-research', 'research.json'), 'utf8'), '{"user_data":"keep"}');
});

test('concurrent findings cannot lose a save and stale locks are surfaced', async t => {
  const root = await fixture(t);
  const initial = await planResearch(root, plan());
  const calls = await Promise.allSettled([
    recordResearch(root, initial.run, 'availability', finding()),
    recordResearch(root, initial.run, 'performance', { status: 'unavailable', summary: 'Unavailable', limits: 'No access', evidence: [] }),
  ]);
  assert.equal(calls.filter(call => call.status === 'fulfilled').length, 1);
  assert.match(calls.find(call => call.status === 'rejected').reason.message, /busy/);
  const current = await researchStatus(root);
  const remaining = current.pending[0];
  await recordResearch(root, initial.run, remaining, remaining === 'availability' ? finding() : { status: 'unavailable', summary: 'Unavailable', limits: 'No access', evidence: [] });
  assert.equal((await researchStatus(root)).completed, 2);
  await writeFile(join(root, '.harness-research', 'research.lock'), 'external active owner');
  await assert.rejects(researchStatus(root), /busy/);
  assert.equal(await readFile(join(root, '.harness-research', 'research.lock'), 'utf8'), 'external active owner');
});

test('question IDs matching object properties start pending and the packaged CLI writes the automatic report', async t => {
  const root = await fixture(t);
  const supplied = plan(); supplied.items = [{ id: 'constructor', question: 'Check constructor behavior', public_query: null, claim: null }];
  const file = join(root, 'plan.json'); await writeFile(file, JSON.stringify(supplied));
  const { stdout } = await exec(process.execPath, [join(sourceRoot, 'scripts/harness-research.mjs'), 'plan', '--project', root, '--file', file]);
  assert.deepEqual(JSON.parse(stdout).pending, ['constructor']);
  await access(join(root, '.harness-research/research-report.md'));
  const status = await exec(process.execPath, [join(sourceRoot, 'scripts/harness-research.mjs'), 'status', '--project', root]);
  assert.equal(JSON.parse(status.stdout).status, 'in-progress');
});

async function uploadFixture(root) {
  await writeFile(join(root, 'sources/technical-brief.pdf'), '%PDF-1.7 synthetic original revision');
  await writeFile(join(root, 'sources/technical-brief.txt'), 'Feature A is available in version 2.\nSource context: controlled internal pilot.');
  return { id: 'technical-brief', title: 'Uploaded technical brief', origin: 'supplied technical-brief.pdf', original_file: 'sources/technical-brief.pdf', file: 'sources/technical-brief.txt', limits: 'none' };
}
function uploadedPlan(source, scope = 'supplied-only') {
  const selected = plan(); selected.scope = scope; selected.sources = [source];
  selected.items = [{ id: 'availability', question: 'Assess the selected document capability claim', public_query: null, claim: null }];
  return selected;
}
function uploadFinding() {
  const result = finding(); result.evidence[0].file = 'sources/technical-brief.txt'; result.evidence[0].locator = 'Page 3, capability section';
  return result;
}

test('uploaded-only research pins the original and extraction, binds citations and excludes unselected documents', async t => {
  const root = await fixture(t); const source = await uploadFixture(root);
  const first = await planResearch(root, uploadedPlan(source));
  assert.equal(first.sourceMode, 'Uploaded sources only'); assert.deepEqual(first.sourceGaps, []);
  await assert.rejects(recordResearch(root, first.run, 'availability', finding()), /selected readable document/);
  const wrong = uploadFinding(); wrong.evidence[0].source_id = 'unselected';
  await assert.rejects(recordResearch(root, first.run, 'availability', wrong), /match its selected/);
  const completed = await recordResearch(root, first.run, 'availability', uploadFinding());
  assert.equal(completed.status, 'complete');
  const state = JSON.parse(await readFile(completed.file, 'utf8'));
  assert.equal(state.results.availability.evidence[0].title, source.title);
  assert.equal(state.results.availability.evidence[0].origin, source.origin);
  assert.equal(state.results.availability.evidence[0].source_id, source.id);
  assert.equal(state.results.availability.evidence[0].original_sha256, state.inputs[source.original_file]);
  assert.notEqual(state.inputs[source.original_file], state.inputs[source.file]);
  const saved = await report(root);
  assert.ok(saved.includes(source.title)); assert.ok(saved.includes(source.original_file));
  assert.ok(saved.includes(state.inputs[source.original_file])); assert.ok(saved.includes('Page 3, capability section'));
  assert.equal((await planResearch(root, uploadedPlan(source))).completed, 1);
});

test('combined research retains uploaded and contrary public evidence in the same report', async t => {
  const root = await fixture(t); const source = await uploadFixture(root);
  await writeFile(join(root, 'sources/release.md'), 'Feature A is limited to a pilot in version 2.');
  const first = await planResearch(root, uploadedPlan(source, 'public-web'));
  assert.equal(first.sourceMode, 'Uploaded sources plus external research');
  const result = uploadFinding(); result.status = 'contradicted'; result.summary = 'The supplied brief and public release notes differ on general availability.';
  result.evidence.push({ ...finding().evidence[0], quote: 'Feature A is limited to a pilot in version 2.' });
  await recordResearch(root, first.run, 'availability', result);
  const saved = await report(root);
  assert.ok(saved.includes(source.title)); assert.ok(saved.includes('https://example.invalid/release'));
  assert.ok(saved.includes('controlled') === false); // Only the inspected passage is cited, not the entire private extraction.
  assert.ok(saved.includes('contradicted'));
  const restricted = await planResearch(root, uploadedPlan(source));
  await assert.rejects(recordResearch(root, first.run, 'availability', result), /run or content changed/);
  await assert.rejects(recordResearch(root, restricted.run, 'availability', result), /selected readable document/);
  await assert.rejects(planResearch(root, uploadedPlan(source, 'public-web')), /explicit permission/);
});

test('uncited uploads and changed extractions invalidate research and retain earlier revisions', async t => {
  const root = await fixture(t); const source = await uploadFixture(root);
  const first = await planResearch(root, uploadedPlan(source, 'public-web'));
  await recordResearch(root, first.run, 'availability', finding()); // Upload was selected but not cited yet.
  await writeFile(join(root, source.original_file), '%PDF-1.7 revised original');
  assert.equal((await researchStatus(root)).status, 'stale');
  await assert.rejects(recordResearch(root, first.run, 'availability', finding()), /run or content changed/);
  const next = await planResearch(root, uploadedPlan(source, 'public-web'));
  assert.notEqual(next.run, first.run); assert.equal(next.completed, 0);
  await writeFile(join(root, source.file), 'Revised readable extraction.');
  assert.equal((await researchStatus(root)).status, 'stale');
  assert.ok((await readdir(join(root, '.harness-research/history'))).some(name => name.endsWith('.md')));
});

test('unreadable and partial uploads remain explicit coverage gaps without preventing an uploaded-only report', async t => {
  const root = await fixture(t); const source = await uploadFixture(root);
  const selected = uploadedPlan({ ...source, file: null, limits: 'Scan is unreadable; no page text extracted.' });
  const first = await planResearch(root, selected);
  assert.deepEqual(first.sourceGaps, [{ id: source.id, title: source.title, limits: selected.sources[0].limits }]);
  await assert.rejects(recordResearch(root, first.run, 'availability', uploadFinding()), /selected readable document/);
  const finished = await recordResearch(root, first.run, 'availability', { status: 'unavailable', summary: 'The selected upload cannot establish the capability.', limits: selected.sources[0].limits, evidence: [] });
  assert.equal(finished.status, 'complete'); assert.deepEqual(finished.unresolved, ['availability']);
  assert.ok((await report(root)).includes('Readable snapshot: unavailable.'));
  assert.ok((await report(root)).includes(selected.sources[0].limits));
  const partial = await planResearch(root, uploadedPlan({ ...source, limits: 'Pages 1–3 readable; appendix remains unavailable.' }));
  assert.equal(partial.sourceGaps.length, 1);
  await assert.rejects(planResearch(root, uploadedPlan({ ...source, file: null, limits: 'none' })), /explicit coverage gap/);
});

test('binary uploads cannot be cited as text and selected documents obey project path boundaries', async t => {
  const root = await fixture(t); const source = await uploadFixture(root);
  await assert.rejects(planResearch(root, uploadedPlan({ ...source, file: source.original_file })), /readable UTF-8 extraction/);
  await writeFile(join(root, 'sources/invalid.txt'), Buffer.from([0xff, 0xfe, 0x41]));
  await assert.rejects(planResearch(root, uploadedPlan({ ...source, file: 'sources/invalid.txt' })), /readable UTF-8 extraction/);
  await assert.rejects(planResearch(root, uploadedPlan({ ...source, original_file: '../outside.pdf' })), /relative to the project/);
  const first = await planResearch(root, plan());
  const binary = uploadFinding(); binary.evidence[0].file = source.original_file; binary.evidence[0].quote = '%PDF-1.7';
  await assert.rejects(recordResearch(root, first.run, 'availability', binary), /readable UTF-8 extraction/);
  assert.equal((await researchStatus(root)).completed, 0);
});
