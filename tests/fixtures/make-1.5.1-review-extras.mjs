// Builds tests/fixtures/review-extras-1.5.1 with the Harness Research 1.5.1 runtime. Not a test.
//   git archive fa4a2e1 scripts references package.json | tar -x -C RUNTIME
//   node tests/fixtures/make-1.5.1-review-extras.mjs RUNTIME EMPTY_WORK_FOLDER
// then copy EMPTY_WORK_FOLDER/schema-2 and schema-3. 1.5.1 passes unknown review fields through,
// so each saved single review carries host fields named units and reviewers.
import { execFileSync } from 'node:child_process';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
const [runtime, base] = process.argv.slice(2);
const cli = join(runtime, 'scripts/harness-research.mjs');
const run = (...args) => JSON.parse(execFileSync(process.execPath, [cli, ...args], { encoding: 'utf8' }));
for (const schema of [2, 3]) {
  const root = join(base, `schema-${schema}`); await mkdir(root, { recursive: true });
  await writeFile(join(root, 'source.txt'), 'Synthetic context. The default is 10. Exceptions depend on workload.');
  const dossier = { schema: 2, topic: 'Synthetic extras', audience: 'Maintainers', purpose: 'Keep a 1.5.1 review readable', scope: 'Synthetic fixture only', source_mode: 'public',
    sources: [{ id: 'source-a', file: 'source.txt', origin: 'https://example.test/docs', title: 'Synthetic docs', publisher: 'Synthetic fixture', permission: 'public', context: 'full' }],
    facts: [{ id: 'fact-a', statement: 'The default is 10.', author: 'researcher', citations: [{ source: 'source-a', quote: 'The default is 10.' }] }],
    findings: [{ id: 'finding-a', title: 'Default', summary: { text: 'The default is 10.', kind: 'summary', refs: ['fact-a'] }, support: ['fact-a'], counter: [], implications: [], conditions: [], gaps: [] }],
    sections: [{ id: 'answer', title: 'Answer', blocks: [{ text: 'The default is 10.', kind: 'summary', refs: ['finding-a'] }] }] };
  await writeFile(join(root, 'dossier.json'), JSON.stringify(dossier, null, 2));
  const reuse = schema === 3 ? ['--reuse-unchanged', '--context', 'context.json'] : [];
  if (schema === 3) await writeFile(join(root, 'context.json'), JSON.stringify({ schema: 1, protocol: 'synthetic-host-protocol', guidance: 'synthetic-guidance', independence: 'separate-invocations' }));
  const saved = run('synthesis', 'save', '--project', root, '--file', 'dossier.json', '--worker', 'writer', ...reuse);
  const review = saved.review_template; review.originals.forEach(o => o.read_original = true);
  for (const group of ['facts', 'findings', 'prose']) review[group].forEach(r => Object.assign(r, { verdict: 'supported', note: 'Synthetic fixture checked.' }));
  review.assessment = { coverage: 'accurate', usefulness: 'adequate', note: 'Synthetic fixture saved by Harness Research 1.5.1.' };
  review.units = { note: 'A host field that 1.5.1 stored with the review.' };
  if (schema === 3) review.reviewers = ['host-field'];
  await writeFile(join(root, 'review.json'), JSON.stringify(review, null, 2));
  const reviewed = run('synthesis', 'review', '--project', root, '--file', 'review.json', '--worker', 'checker');
  console.log(JSON.stringify({ schema, status: reviewed.status, verify: run('synthesis', 'verify', '--project', root).status }));
}
