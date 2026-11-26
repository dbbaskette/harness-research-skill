import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, cp, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { initializeAsset, assetContext, runAssetCli } from '../scripts/lib/topic-assets.mjs';
import { runCollectionCli } from '../scripts/lib/collection.mjs';
import { runSynthesisCli } from '../scripts/lib/synthesis-cli.mjs';
import { runReviewUnitsCli } from '../scripts/lib/review-units.mjs';

const absolute = /(?:^|[\s"'(=:])\/(?:Users|home|private|var|tmp|Volumes|opt|root|example)\//m;
async function workspace(t) {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'supplied-origins-'))); t.after(() => rm(root, { recursive: true, force: true }));
  const inputs = join(root, 'inputs'); await mkdir(join(inputs, 'notes'), { recursive: true });
  await writeFile(join(inputs, 'guide.md'), 'Synthetic guide. The default is 10. Exceptions depend on workload.\n');
  await writeFile(join(inputs, 'notes/limits.md'), 'Synthetic limits. The limit is 20. Editions differ.\n');
  await writeFile(join(inputs, 'scan.pdf'), '%PDF-1.7\nSynthetic original bytes');
  return { root, inputs, project: join(root, 'workspace') };
}
// Files a shared bundle carries: what asset-manifest.json and output.json list, and sources.json.
async function sharedFiles(asset) {
  const manifest = JSON.parse(await readFile(join(asset, 'asset-manifest.json'), 'utf8')), output = JSON.parse(await readFile(join(asset, 'output.json'), 'utf8'));
  return [...new Set(['asset-manifest.json', 'output.json', 'sources.json', ...manifest.artifacts.map(a => a.file), ...output.artifacts.map(a => a.file)])].sort();
}

test('a new intake records each supplied document by its name in the folder, and the shared bundle names no folder of the computer', async t => {
  const w = await workspace(t); await mkdir(w.project);
  const created = await initializeAsset({ project: w.project, topic: 'Synthetic origins', audience: 'Maintainers', purpose: 'Share a bundle', directory: w.inputs });
  const context = await assetContext(created.asset), documents = context.inventory.filter(e => e.type === 'document');
  assert.deepEqual(documents.map(e => e.origin).sort(), ['supplied:guide.md', 'supplied:notes/limits.md', 'supplied:scan.pdf']);
  for (const entry of documents) assert.equal(entry.origin, `supplied:${entry.filename}`);
  // The label flows through collection, synthesis and review units unchanged.
  let n = 0; const call = async (fn, action, value, extra = []) => { const args = [action, '--project', created.asset, ...extra]; if (value !== undefined) { const file = `cmd-${n++}.json`; await writeFile(join(created.asset, file), JSON.stringify(value)); args.push('--file', file); } return fn(args); };
  const started = await call(runCollectionCli, 'init', { schema: 1, ...context.request, scope: 'Synthetic fixture only', workstreams: [{ id: 'defaults', questions: ['What is the default?'] }, { id: 'limits', questions: ['What is the limit?'] }] });
  assert.ok(started.request_digest);
  for (const [stream, name, quote] of [['defaults', 'guide.md', 'The default is 10.'], ['limits', 'notes/limits.md', 'The limit is 20.']]) {
    const entry = documents.find(e => e.filename === name), investigator = `investigator-${stream}`;
    const source = { id: 'supplied', origin: entry.origin, title: `Synthetic ${stream}`, publisher: 'Synthetic fixture', file: entry.capture_file, original_file: entry.original_file, permission: 'selected', context: 'full' };
    await call(runCollectionCli, 'register', { workstream: stream, investigator, invocation: `host/${investigator}` });
    await call(runCollectionCli, 'capture', { workstream: stream, investigator, source });
    await call(runCollectionCli, 'accept', { schema: 1, request_digest: started.request_digest, generation: started.generation, workstream: stream, attempt: 1, investigator, sources: [source], facts: [{ id: 'fact', statement: quote, author: investigator, citations: [{ source: 'supplied', quote }] }], limitations: [], gaps: [] });
  }
  const registry = await call(runCollectionCli, 'assemble'), ids = registry.facts.map(f => f.id);
  assert.ok(registry.request.supplied_sources.every(s => s.origin.startsWith('supplied:')));
  const dossier = { schema: 2, ...context.request, scope: 'Synthetic fixture only', sources: registry.sources, facts: registry.facts,
    findings: [{ id: 'finding', title: 'Defaults and limits', summary: { text: 'The default is 10 and the limit is 20.', kind: 'summary', refs: ids }, support: ids, counter: [], implications: [], conditions: [], gaps: [] }],
    sections: [{ id: 'answer', title: 'Answer', blocks: [{ text: 'The default is 10 and the limit is 20 here.', kind: 'summary', refs: ['finding'] }] }] };
  await writeFile(join(created.asset, 'dossier.json'), JSON.stringify(dossier));
  await runSynthesisCli(['save', '--project', created.asset, '--file', 'dossier.json', '--worker', 'synthesis-author']);
  const planned = await call(runReviewUnitsCli, 'plan');
  for (const unit of planned.units) {
    await call(runReviewUnitsCli, 'register', { unit: unit.id, reviewer: `checker-${unit.id}`, invocation: `host/checker-${unit.id}` });
    const answer = await call(runReviewUnitsCli, 'template', undefined, ['--unit', unit.id]);
    answer.originals.forEach(o => o.read_original = true);
    for (const group of ['facts', 'findings', 'prose']) answer[group].forEach(r => Object.assign(r, { verdict: 'supported', note: 'Synthetic fixture checked against its retained original.' }));
    if (answer.assessment) answer.assessment = { coverage: 'accurate', usefulness: 'adequate', note: 'Synthetic fixture covers its scope.' };
    await call(runReviewUnitsCli, 'accept', answer);
  }
  assert.equal((await call(runReviewUnitsCli, 'assemble')).status, 'complete');
  const status = await runAssetCli(['status', '--project', created.asset]);
  assert.equal(status.status, 'complete'); assert.equal(status.reviewers.length, 3);
  assert.deepEqual(JSON.parse(await readFile(join(created.asset, 'topic.json'), 'utf8')).current.reviewers, status.reviewers);
  const files = await sharedFiles(created.asset);
  for (const name of ['sources.json', 'facts.json', 'evidence.md', 'report.md', 'brief.md', 'topic.json']) assert.ok(files.includes(name), name);
  for (const file of files) {
    const content = await readFile(join(created.asset, file), 'latin1');
    for (const folder of [w.root, w.inputs, w.project, tmpdir()]) assert.ok(!content.includes(folder), `${file} names ${folder}`);
    assert.doesNotMatch(content, absolute, `${file} holds an absolute path`);
  }
  assert.match(await readFile(join(created.asset, 'evidence.md'), 'utf8'), /supplied:guide\.md/);
});

test('a case saved by 1.5.1 with absolute origins keeps them and still verifies, untouched', async t => {
  const root = await mkdtemp(join(tmpdir(), 'case-1.5.1-')); t.after(() => rm(root, { recursive: true, force: true }));
  const asset = join(root, 'synthetic-saved-case');
  await cp(new URL('./fixtures/case-1.5.1', import.meta.url), asset, { recursive: true });
  const kept = ['.harness-research/synthesis.json', '.harness-research/asset.json', '.harness-research/collection.json', 'sources.json', 'facts.json', 'evidence.md', 'output.json', 'report.md', 'brief.md'];
  const before = Object.fromEntries(await Promise.all(kept.map(async f => [f, await readFile(join(asset, f))])));
  const saved = JSON.parse(before['.harness-research/synthesis.json']);
  assert.equal(saved.schema, 2); assert.equal(saved.review.worker, 'independent-reviewer');
  assert.ok(saved.dossier.sources.every(s => s.origin.startsWith('/example/supplied-inputs/')), 'the fixture holds absolute origins');
  for (const action of ['status', 'verify']) {
    const result = await runSynthesisCli([action, '--project', asset]);
    assert.equal(result.status, 'complete', JSON.stringify(result.problems)); assert.equal(result.digest, saved.digest); assert.equal(result.artifact_integrity, 'verified');
  }
  assert.equal((await runAssetCli(['status', '--project', asset])).status, 'complete');
  assert.equal((await runCollectionCli(['status', '--project', asset])).phase, 'ready-for-review');
  for (const file of kept) assert.deepEqual(await readFile(join(asset, file)), before[file], `${file} is not rewritten`);
  const inventory = JSON.parse(await readFile(join(asset, 'sources.json'), 'utf8')).entries;
  assert.deepEqual(inventory.map(e => e.origin).sort(), ['/example/supplied-inputs/guide.md', '/example/supplied-inputs/notes/limits.md']);
});

test('taking in the same unchanged folder again keeps the origins an earlier intake stored', async t => {
  const w = await workspace(t); await mkdir(w.project);
  const created = await initializeAsset({ project: w.project, topic: 'Earlier intake', directory: w.inputs });
  // Rewrite the inventory to what 1.5.1 stored: the full path of each supplied document.
  const marker = join(created.asset, '.harness-research/asset.json'), state = JSON.parse(await readFile(marker, 'utf8'));
  for (const entry of state.inventory) if (entry.type === 'document') entry.origin = join(w.inputs, entry.filename);
  await writeFile(marker, JSON.stringify(state, null, 2) + '\n');
  const again = await runAssetCli(['intake', '--project', created.asset, '--directory', w.inputs]);
  assert.equal(again.inputFingerprint, created.inputFingerprint, 'the origin is not part of the intake fingerprint');
  const inventory = (await assetContext(created.asset)).inventory.filter(e => e.type === 'document');
  assert.ok(inventory.every(e => e.origin === join(w.inputs, e.filename)), 'stored origins are not rewritten');
  await writeFile(join(w.inputs, 'added.md'), 'A changed folder is a new intake.\n');
  await runAssetCli(['intake', '--project', created.asset, '--directory', w.inputs]);
  assert.ok((await assetContext(created.asset)).inventory.filter(e => e.type === 'document').every(e => e.origin === `supplied:${e.filename}`));
});
