import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runReviewUnitsCli } from '../scripts/lib/review-units.mjs';
import { runSynthesisCli } from '../scripts/lib/synthesis-cli.mjs';
import { runCollectionCli } from '../scripts/lib/collection.mjs';
import { initializeAsset, assetContext } from '../scripts/lib/topic-assets.mjs';
import { hash, stable } from '../scripts/lib/run-storage.mjs';

// Synthetic content only. Cases driven through the commands, then changed by hand where a check is local.
const FILES = { 'a.txt': 'Alpha context. The default is 10.', 'b.txt': 'Beta context. The limit is 20.' };
const source = (id, file) => ({ id, file, origin: `https://example.test/${id}`, title: `Synthetic ${id}`, publisher: 'Synthetic fixture', permission: 'public', context: 'full' });
const dossier = () => ({ schema: 2, topic: 'Synthetic third round', audience: 'Maintainers', purpose: 'Check repairs', scope: 'Synthetic fixture only', source_mode: 'public',
  sources: [source('source-a', 'a.txt'), source('source-b', 'b.txt')],
  facts: [{ id: 'fact-a', statement: 'The default is 10.', author: 'researcher', citations: [{ source: 'source-a', quote: 'The default is 10.' }] }, { id: 'fact-b', statement: 'The limit is 20.', author: 'researcher', citations: [{ source: 'source-b', quote: 'The limit is 20.' }] }],
  findings: [{ id: 'finding-a', title: 'Default', summary: { text: 'The default is 10.', kind: 'summary', refs: ['fact-a'] }, support: ['fact-a'], counter: [], implications: [], conditions: [], gaps: [] }],
  sections: [{ id: 'answer', title: 'Answer', blocks: [{ text: 'The default is 10.', kind: 'summary', refs: ['finding-a'] }, { text: 'The limit is 20.', kind: 'summary', refs: ['fact-b'] }, { text: 'Unknown.', kind: 'gap', refs: [] }] }] });
async function project(t, { root, files = FILES } = {}) {
  if (!root) { root = await mkdtemp(join(tmpdir(), 'review-units-round3-')); t.after(() => rm(root, { recursive: true, force: true })); for (const [n, v] of Object.entries(files)) await writeFile(join(root, n), v); }
  let n = 0, serial = 0;
  const units = async (action, value, extra = []) => { const args = [action, '--project', root, ...extra]; if (value !== undefined) { const file = `in-${n++}.json`; await writeFile(join(root, file), JSON.stringify(value)); args.push('--file', file); } return runReviewUnitsCli(args); };
  const save = async d => { await writeFile(join(root, 'dossier.json'), JSON.stringify(d)); return runSynthesisCli(['save', '--project', root, '--file', 'dossier.json', '--worker', 'writer']); };
  const fill = a => { a.originals.forEach(o => o.read_original = true); for (const g of ['facts', 'findings', 'prose']) a[g].forEach(r => Object.assign(r, { verdict: 'supported', note: 'Synthetic fixture checked.' })); if (a.assessment) a.assessment = { coverage: 'accurate', usefulness: 'adequate', note: 'Synthetic fixture covers its scope.' }; return a; };
  const review = async (unit, reviewer) => { await units('register', { unit, reviewer, invocation: `host/${reviewer}` }); return units('accept', fill(await units('template', undefined, ['--unit', unit]))); };
  const reviewAll = async prefix => { for (const u of (await units('status')).units) if (!['kept', 'accepted'].includes(u.status)) await review(u.id, `${prefix}-${serial++}`); };
  const indexPath = join(root, '.harness-research/review-units.json');
  const index = async () => JSON.parse(await readFile(indexPath, 'utf8'));
  const writeIndex = value => writeFile(indexPath, JSON.stringify(value, null, 2) + '\n');
  return { root, units, save, review, reviewAll, index, writeIndex, synthesis: a => runSynthesisCli([a, '--project', root]) };
}
async function assembled(t, options) { const f = await project(t, options); await f.save(options?.dossier ?? dossier()); await f.units('plan'); await f.reviewAll('first'); assert.equal((await f.units('assemble')).status, 'complete'); return f; }
async function tree(root, folder = '') {
  const out = {};
  for (const e of await readdir(join(root, folder), { withFileTypes: true })) {
    const p = folder ? `${folder}/${e.name}` : e.name;
    if (!folder && /^in-\d+\.json$/.test(e.name)) continue; // the test's own command inputs
    if (e.isDirectory()) Object.assign(out, { [p + '/']: 'dir' }, await tree(root, p)); else out[p] = e.isSymbolicLink() ? 'link' : hash(await readFile(join(root, p)));
  }
  return out;
}
async function refusesUntouched(f, run, pattern) { const before = await tree(f.root); await assert.rejects(run(), pattern); assert.deepEqual(await tree(f.root), before); }
async function expectRetiredEverywhere(f, label) {
  for (const action of ['status', 'verify']) { const r = await f.synthesis(action); assert.equal(r.status, 'stale', `${label}: ${action}`); assert.ok(r.problems.some(p => /retired by/.test(p)), `${label}: ${JSON.stringify(r.problems)}`); }
  assert.equal((await f.units('status')).phase, 'review-invalid', label);
}

test('item 1: a receipt is retired if either the retirement file or the receipt index says so, for every reader', async t => {
  for (const kind of ['content', 'final']) {
    for (const remove of ['file', 'flag']) {
      const f = await assembled(t), label = `${kind} unit, ${remove} removed`;
      const target = (await f.units('status')).units.find(u => u.kind === kind);
      await f.units('retry', { unit: target.id, reason: 'Discarded.' });
      const entry = (await f.index()).receipts.find(r => r.unit === target.id && r.retired);
      if (remove === 'file') await rm(join(f.root, `.harness-research/review-units-data/retired-${entry.sha256}.json`));
      else { const index = await f.index(); for (const r of index.receipts) delete r.retired; await f.writeIndex(index); }
      await expectRetiredEverywhere(f, label);
      const stopped = await f.units('stop'); assert.equal(stopped.phase, 'review-invalid', `${label}: stop`);
      await f.units('finish', { unit: target.id, reviewer: 'nobody', attempt: 1, outcome: 'cancelled', note: 'x' }).catch(() => {});
      const replanned = await f.units('plan');
      assert.ok(replanned.set_aside, label); assert.equal(replanned.units.find(u => u.id === target.id).status, 'pending', `${label}: not kept`);
    }
  }
});

test('item 1: collection status reads either retirement record', async t => {
  const root = await mkdtemp(join(tmpdir(), 'review-units-round3-collection-')); t.after(() => rm(root, { recursive: true, force: true }));
  let n = 0; const call = async (action, value) => { const args = [action, '--project', root]; if (value !== undefined) { const file = `c-${n++}.json`; await writeFile(join(root, file), JSON.stringify(value)); args.push('--file', file); } return runCollectionCli(args); };
  const started = await call('init', { schema: 1, topic: 'Synthetic collection', audience: 'Maintainers', purpose: 'Check repairs', scope: 'Synthetic fixture only', source_mode: 'public', workstreams: [{ id: 'one', questions: ['What is stated?'] }] });
  const quote = 'The value is stated.'; await writeFile(join(root, 'one.txt'), `Synthetic page. ${quote}`);
  const src = { id: 'page', origin: 'https://example.test/one', title: 'One', publisher: 'Synthetic fixture', file: 'one.txt', permission: 'public', context: 'full' };
  await call('register', { workstream: 'one', investigator: 'investigator-one', invocation: 'host/one' }); await call('capture', { workstream: 'one', investigator: 'investigator-one', source: src });
  await call('accept', { schema: 1, request_digest: started.request_digest, generation: started.generation, workstream: 'one', attempt: 1, investigator: 'investigator-one', sources: [src], facts: [{ id: 'fact', statement: quote, author: 'investigator-one', citations: [{ source: 'page', quote }] }], limitations: [], gaps: [] });
  const registry = await call('assemble');
  const d = { schema: 2, ...Object.fromEntries(['topic', 'audience', 'purpose', 'scope', 'source_mode'].map(k => [k, registry.request[k]])), sources: registry.sources, facts: registry.facts,
    findings: [{ id: 'finding', title: 'Value', summary: { text: quote, kind: 'summary', refs: [registry.facts[0].id] }, support: [registry.facts[0].id], counter: [], implications: [], conditions: [], gaps: [] }],
    sections: [{ id: 'answer', title: 'Answer', blocks: [{ text: quote, kind: 'summary', refs: ['finding'] }] }] };
  const f = await assembled(t, { root, dossier: d });
  const target = (await f.units('status')).units.find(u => u.kind === 'content');
  await f.units('retry', { unit: target.id, reason: 'Discarded.' });
  const entry = (await f.index()).receipts.find(r => r.retired);
  await rm(join(root, `.harness-research/review-units-data/retired-${entry.sha256}.json`));
  const status = await call('status');
  assert.notEqual(status.phase, 'ready-for-review'); assert.ok(status.problems.some(p => /retired by retry/.test(p)));
});

test('item 1: review-units status never says assembled while a unit of that review has no receipt', async t => {
  const f = await assembled(t);
  const index = await f.index(), unit = index.units.find(u => u.id !== 'final');
  unit.attempts.push({ number: unit.attempts.at(-1).number + 1, status: 'reserved', reason: 'Edited by hand.' });
  await f.writeIndex(index);
  assert.notEqual((await f.units('status')).phase, 'assembled');
});

test('item 2: plan checks both history files before its first write', async t => {
  const f = await assembled(t);
  await rm(join(f.root, (await f.units('status')).plan_file));
  const state = JSON.parse(await readFile(join(f.root, '.harness-research/synthesis.json'), 'utf8'));
  await mkdir(join(f.root, '.harness-research/synthesis-history'), { recursive: true });
  await writeFile(join(f.root, `.harness-research/synthesis-history/${state.digest}-${hash(stable(state)).slice(0, 16)}.json`), 'A changed history file.\n');
  await refusesUntouched(f, () => f.units('plan'), /Synthesis history changed/);
  const g = await project(t); await g.save(dossier()); await g.units('plan'); await g.reviewAll('first');
  const changed = dossier(); changed.findings[0].title = 'Default value'; await g.save(changed);
  const index = await g.index();
  await writeFile(join(g.root, `.harness-research/review-units-data/history-${index.generation}-${hash(stable(index))}.json`), 'x');
  await refusesUntouched(g, () => g.units('plan'), /Immutable review-units record changed/);
  const h = await assembled(t);
  await h.units('retry', { unit: (await h.units('status')).units.find(u => u.kind === 'content').id, reason: 'Discarded.' });
  const after = await h.index();
  await writeFile(join(h.root, `.harness-research/review-units-data/history-${after.generation}-${hash(stable(after))}.json`), 'x');
  await refusesUntouched(h, () => h.units('plan'), /Immutable review-units record changed/);
});

test('item 2: assemble checks the asset revision files before writing anything', async t => {
  const root = await mkdtemp(join(tmpdir(), 'review-units-round3-asset-')); t.after(() => rm(root, { recursive: true, force: true }));
  const inputs = join(root, 'inputs'); await mkdir(inputs); await mkdir(join(root, 'workspace'));
  await writeFile(join(inputs, 'guide.md'), 'Synthetic guide. The default is 10.\n');
  const created = await initializeAsset({ project: join(root, 'workspace'), topic: 'Synthetic asset', audience: 'Maintainers', purpose: 'Check repairs', directory: inputs });
  const entry = (await assetContext(created.asset)).inventory[0];
  const d = { schema: 2, topic: 'Synthetic asset', audience: 'Maintainers', purpose: 'Check repairs', scope: 'Synthetic fixture only', source_mode: 'selected',
    sources: [{ id: 'guide', origin: entry.origin, title: 'Guide', publisher: 'Synthetic fixture', permission: 'selected', context: 'full', file: entry.capture_file, original_file: entry.original_file }],
    facts: [{ id: 'fact', statement: 'The default is 10.', author: 'researcher', citations: [{ source: 'guide', quote: 'The default is 10.' }] }],
    findings: [{ id: 'finding', title: 'Default', summary: { text: 'The default is 10.', kind: 'summary', refs: ['fact'] }, support: ['fact'], counter: [], implications: [], conditions: [], gaps: [] }],
    sections: [{ id: 'answer', title: 'Answer', blocks: [{ text: 'The default is 10.', kind: 'summary', refs: ['finding'] }] }] };
  const f = await project(t, { root: created.asset }); await f.save(d); await f.units('plan'); await f.reviewAll('first');
  await rm(join(created.asset, 'topic.json')); await mkdir(join(created.asset, 'topic.json'));
  await refusesUntouched(f, () => f.units('assemble'), /unowned\/nonregular output/);
});

test('item 3: retry retires a receipt even when the receipt index does not list it', async t => {
  const f = await assembled(t);
  const target = (await f.units('status')).units.find(u => u.kind === 'content');
  const index = await f.index(), sha256 = index.units.find(u => u.id === target.id).attempts.at(-1).receipt.sha256;
  index.receipts = index.receipts.filter(r => r.sha256 !== sha256); await f.writeIndex(index);
  await f.units('retry', { unit: target.id, reason: 'Discarded.' });
  assert.ok((await readdir(join(f.root, '.harness-research/review-units-data'))).includes(`retired-${sha256}.json`));
  await expectRetiredEverywhere(f, 'unindexed receipt');
});

test('item 4: retry on an assembled review says it is no longer complete and names plan as the next step', async t => {
  const f = await assembled(t);
  const result = await f.units('retry', { unit: (await f.units('status')).units.find(u => u.kind === 'content').id, reason: 'Discarded.' });
  assert.equal(result.phase, 'review-invalid'); assert.equal(result.assembled_review.status, 'invalid');
  assert.match(result.next_step, /^Run review-units plan/);
});

test('item 5: a plan record that is a folder or a link is named as such, not sent to plan', async t => {
  for (const kind of ['folder', 'link']) {
    const f = await assembled(t), file = join(f.root, (await f.units('status')).plan_file);
    await rm(file);
    if (kind === 'folder') await mkdir(file); else await symlink(join(f.root, 'a.txt'), file);
    const status = await f.units('status');
    assert.equal(status.next_step, 'Review plan record is not a regular file; preserve and inspect it.', kind);
    await refusesUntouched(f, () => f.units('plan'), /Review plan record is not a regular file; preserve and inspect it/);
  }
});
