import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { performance } from 'node:perf_hooks';
import { runReviewUnitsCli } from '../scripts/lib/review-units.mjs';
import { runSynthesisCli } from '../scripts/lib/synthesis-cli.mjs';

// Controlled callbacks measure the local contract, not native reviewers or provider speed.
const WORK_MS = 150, STREAMS = ['alpha', 'beta', 'gamma'];
async function scenario(t, mode) {
  const root = await mkdtemp(join(tmpdir(), 'review-units-benchmark-')); t.after(() => rm(root, { recursive: true, force: true }));
  let serial = 0;
  const call = async (action, input, extra = []) => {
    const args = [action, '--project', root, ...extra];
    if (input !== undefined) { const file = `job-${serial++}.json`; await writeFile(join(root, file), JSON.stringify(input)); args.push('--file', file); }
    return runReviewUnitsCli(args);
  };
  const sources = STREAMS.map(id => ({ id: `source-${id}`, file: `${id}.txt`, origin: `https://example.invalid/${id}`, title: `Fixture ${id}`, publisher: 'Synthetic fixture', permission: 'public', context: 'full' }));
  for (const id of STREAMS) await writeFile(join(root, `${id}.txt`), `Synthetic source: ${id} supports one writer. ${id} keeps a log.`);
  const facts = STREAMS.map(id => ({ id: `fact-${id}`, statement: `${id} supports one writer.`, author: 'scripted-investigator', citations: [{ source: `source-${id}`, quote: `${id} supports one writer.` }] }));
  // One cross-area claim, so one source is read by a unit that does not own it.
  facts.push({ id: 'fact-logs', statement: 'Alpha and beta keep logs.', author: 'scripted-investigator', citations: [{ source: 'source-alpha', quote: 'alpha keeps a log.' }, { source: 'source-beta', quote: 'beta keeps a log.' }] });
  const dossier = { schema: 2, topic: 'Controlled review benchmark', audience: 'Maintainers', purpose: 'Measure review units', scope: 'Synthetic contexts only', source_mode: 'public', sources, facts,
    findings: STREAMS.map(id => ({ id: `finding-${id}`, title: `Fixture ${id}`, summary: { text: `${id} supports one writer.`, kind: 'summary', refs: [`fact-${id}`] }, support: [`fact-${id}`], counter: [], implications: [], conditions: [], gaps: [] })),
    sections: [{ id: 'answer', title: 'Fixture result', blocks: [...STREAMS.map(id => ({ text: `${id} supports one writer; no product was measured.`, kind: 'summary', refs: [`finding-${id}`] })), { text: 'Alpha and beta keep logs.', kind: 'summary', refs: ['fact-logs'] }] }] };
  await writeFile(join(root, 'dossier.json'), JSON.stringify(dossier));
  await runSynthesisCli(['save', '--project', root, '--file', 'dossier.json', '--worker', 'scripted-synthesis']);
  const planned = await call('plan', { schema: 1, max_reviewers: mode === 'parallel' ? 3 : 1 });
  const plan = JSON.parse(await readFile(join(root, planned.plan_file), 'utf8'));
  const content = plan.units.filter(u => u.kind === 'content').map(u => u.id), intervals = [];
  let registered = 0, release; const barrier = new Promise(resolve => release = resolve);
  async function invocation(unit, overlap) {
    const reviewer = `scripted-checker-${unit}`;
    await call('register', { unit, reviewer, invocation: `controlled-callback/${mode}/${unit}` });
    registered++;
    if (overlap) { if (registered === content.length) release(); await barrier; }
    const answer = await call('template', undefined, ['--unit', unit]);
    const started = performance.now(); await new Promise(resolve => setTimeout(resolve, WORK_MS)); intervals.push([started, performance.now()]);
    answer.originals.forEach(o => o.read_original = true);
    for (const group of ['facts', 'findings', 'prose']) answer[group].forEach(r => Object.assign(r, { verdict: 'supported', note: 'Deterministic fixture check, not semantic live acceptance.' }));
    if (answer.assessment) answer.assessment = { coverage: 'accurate', usefulness: 'adequate', note: 'Scripted benchmark fixture only.' };
    await call('accept', answer);
  }
  const begin = performance.now();
  if (mode === 'parallel') await Promise.all(content.map(unit => invocation(unit, true))); else for (const unit of content) await invocation(unit, false);
  const contentEnd = performance.now();
  if (mode === 'parallel') assert.ok(Math.max(...intervals.map(i => i[0])) < Math.min(...intervals.map(i => i[1])), 'Barrier must demonstrate that three units overlap');
  else { const sorted = intervals.toSorted((a, b) => a[0] - b[0]); assert.ok(sorted.every((v, i) => i === 0 || v[0] >= sorted[i - 1][1])); }
  await invocation('final', false);
  const reviewEnd = performance.now();
  const assembled = await call('assemble'); assert.equal(assembled.status, 'complete');
  const status = await call('status');
  const readers = id => plan.units.filter(u => u.owns.sources.includes(id) || u.given.sources.includes(id)).length;
  const contentReaders = id => plan.units.filter(u => u.kind === 'content' && (u.owns.sources.includes(id) || u.given.sources.includes(id))).length;
  return { units: plan.units.length, content_units: content.length, max_reviewers: status.max_reviewers, content_review_ms: contentEnd - begin, review_ms: reviewEnd - begin,
    active_wall_seconds: status.timing.active_wall_seconds, assistant_seconds: status.timing.assistant_seconds,
    sources: sources.length, source_reads: sources.reduce((n, s) => n + readers(s.id), 0),
    sources_given_to_more_than_one_unit: sources.filter(s => readers(s.id) > 1).length,
    sources_given_to_more_than_one_content_unit: sources.filter(s => contentReaders(s.id) > 1).length,
    review: (({ originals, facts, findings, prose, assessment, accepted }) => ({ originals, facts, findings, prose, assessment, accepted }))(JSON.parse(await readFile(join(root, '.harness-research/synthesis.json'), 'utf8')).review) };
}

test('equivalent synthetic units run one at a time and three at a time, with the duplicated source reads counted', async t => {
  const serial = await scenario(t, 'sequential'), parallel = await scenario(t, 'parallel');
  assert.equal(serial.max_reviewers, 1); assert.equal(parallel.max_reviewers, 3);
  assert.deepEqual(parallel.review, serial.review, 'the same verdicts assemble the same review either way');
  assert.equal(serial.sources_given_to_more_than_one_content_unit, 1); assert.equal(parallel.sources_given_to_more_than_one_unit, 3, 'the final unit reads every source');
  assert.ok(parallel.assistant_seconds >= parallel.active_wall_seconds);
  const { review: _s, ...one } = serial, { review: _p, ...three } = parallel;
  const record = { scope: 'Synthetic callback benchmark; not native reviewer or provider performance', simulated_work_ms_per_unit: WORK_MS, serial: one, parallel: three };
  t.diagnostic(JSON.stringify(record));
  if (process.env.HARNESS_RESEARCH_REVIEW_BENCHMARK_OUT) await writeFile(process.env.HARNESS_RESEARCH_REVIEW_BENCHMARK_OUT, JSON.stringify(record, null, 2) + '\n');
});
