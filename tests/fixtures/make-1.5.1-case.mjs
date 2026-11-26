// Builds tests/fixtures/case-1.5.1 with the Harness Research 1.5.1 runtime. Not a test.
//   git archive fa4a2e1 scripts references package.json | tar -x -C RUNTIME
//   node tests/fixtures/make-1.5.1-case.mjs RUNTIME EMPTY_WORK_FOLDER
// then copy EMPTY_WORK_FOLDER/workspace/research/synthetic-saved-case. After 1.5.1 takes the
// inputs in, only the folder part of each supplied origin is replaced with a synthetic absolute
// path, so the fixture names no folder of the computer that made it; 1.5.1 writes everything
// else, including every digest, review, registry and output that contains those origins.
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, readFile, realpath, rm } from 'node:fs/promises';
import { join } from 'node:path';
const [runtime, base] = process.argv.slice(2);
const cli = join(runtime, 'scripts/harness-research.mjs');
const run = (...args) => JSON.parse(execFileSync(process.execPath, [cli, ...args], { encoding: 'utf8' }));
const workspace = join(base, 'workspace'), inputs = join(base, 'inputs');
await mkdir(workspace, { recursive: true }); await mkdir(join(inputs, 'notes'), { recursive: true });
await writeFile(join(inputs, 'guide.md'), 'Synthetic guide. The default is 10. Exceptions depend on workload.\n');
await writeFile(join(inputs, 'notes/limits.md'), 'Synthetic limits. The limit is 20. Editions differ.\n');
const created = run('asset', 'init', '--project', workspace, '--topic', 'Synthetic saved case', '--directory', inputs, '--audience', 'Maintainers', '--purpose', 'Keep a case saved by 1.5.1');
const root = created.asset, real = await realpath(inputs);
const marker = join(root, '.harness-research/asset.json'), asset = JSON.parse(await readFile(marker, 'utf8'));
for (const entry of asset.inventory) if (entry.origin.startsWith(real + '/')) entry.origin = '/example/supplied-inputs/' + entry.origin.slice(real.length + 1);
await writeFile(marker, JSON.stringify(asset, null, 2) + '\n');
run('asset', 'status', '--project', root);
let n = 0; const file = async value => { const name = `cmd-${n++}.json`; await writeFile(join(root, name), JSON.stringify(value)); return name; };
const request = { schema: 1, topic: 'Synthetic saved case', audience: 'Maintainers', purpose: 'Keep a case saved by 1.5.1', scope: 'Synthetic fixture only', source_mode: 'selected', workstreams: [{ id: 'defaults', questions: ['What is the default?'] }, { id: 'limits', questions: ['What is the limit?'] }] };
const started = run('collection', 'init', '--project', root, '--file', await file(request));
const plan = [['defaults', 'guide.md', 'The default is 10.'], ['limits', 'notes/limits.md', 'The limit is 20.']];
for (const [stream, name, quote] of plan) {
  const entry = asset.inventory.find(e => e.filename === name), investigator = `investigator-${stream}`;
  const source = { id: 'supplied', origin: entry.origin, title: `Synthetic ${stream}`, publisher: 'Synthetic fixture', file: entry.capture_file, original_file: entry.original_file, permission: 'selected', context: 'full' };
  run('collection', 'register', '--project', root, '--file', await file({ workstream: stream, investigator, invocation: `synthetic-host/${investigator}` }));
  run('collection', 'capture', '--project', root, '--file', await file({ workstream: stream, investigator, source }));
  run('collection', 'accept', '--project', root, '--file', await file({ schema: 1, request_digest: started.request_digest, generation: started.generation, workstream: stream, attempt: 1, investigator, sources: [source], facts: [{ id: 'fact', statement: quote, author: investigator, citations: [{ source: 'supplied', quote }] }], limitations: [], gaps: [] }));
}
const registry = run('collection', 'assemble', '--project', root), ids = registry.facts.map(f => f.id);
const dossier = { schema: 2, topic: request.topic, audience: request.audience, purpose: request.purpose, scope: request.scope, source_mode: 'selected', sources: registry.sources, facts: registry.facts,
  findings: [{ id: 'finding', title: 'Defaults and limits', summary: { text: 'The default is 10 and the limit is 20.', kind: 'summary', refs: ids }, support: ids, counter: [], implications: [], conditions: [], gaps: [] }],
  sections: [{ id: 'answer', title: 'Answer', blocks: [{ text: 'The default is 10 and the limit is 20 in this synthetic case.', kind: 'summary', refs: ['finding'] }] }] };
await writeFile(join(root, 'dossier.json'), JSON.stringify(dossier, null, 2));
const saved = run('synthesis', 'save', '--project', root, '--file', 'dossier.json', '--worker', 'synthesis-author');
const review = saved.review_template; review.originals.forEach(o => o.read_original = true);
for (const group of ['facts', 'findings', 'prose']) review[group].forEach(r => Object.assign(r, { verdict: 'supported', note: 'Synthetic fixture checked against its retained original.' }));
review.assessment = { coverage: 'accurate', usefulness: 'adequate', note: 'Synthetic fixture saved by Harness Research 1.5.1.' };
await writeFile(join(root, 'review.json'), JSON.stringify(review, null, 2));
const reviewed = run('synthesis', 'review', '--project', root, '--file', 'review.json', '--worker', 'independent-reviewer');
for (let i = 0; i < n; i++) await rm(join(root, `cmd-${i}.json`));
console.log(JSON.stringify({ root, status: reviewed.status, digest: reviewed.digest, asset: run('asset', 'status', '--project', root).status }));
