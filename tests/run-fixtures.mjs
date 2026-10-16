// Shared synthetic runs for the reuse tests. Not a test file itself (the runner reads *.test.mjs).
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm, realpath } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startRun, nextTask, peekTask, submitTask, registerSource, runStatus } from '../scripts/lib/research-run.mjs';

export const quote = 'OrionDB permits a single writer for each database.';
export const surroundings = ' Readers never wait for that writer, because each query sees a consistent snapshot taken when it starts. The engine keeps a write-ahead log, so a crash loses no committed transaction. Replication, backups and retention are described in other references and are not covered here.';
export const reference = quote + surroundings;
export const plan = { scope: 'Synthetic OrionDB deployment facts from the selected reference.', sections: [{ id: 'deployment', name: 'Deployment' }], subjects: [], questions: [{ id: 'writers', section: 'deployment', kind: 'open', question: 'How many writers does OrionDB permit?' }] };

export async function project(t, prefix = 'research-reuse-test-') {
  const root = await realpath(await mkdtemp(join(tmpdir(), prefix)));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'sources')); await writeFile(join(root, 'sources/reference.txt'), reference + '\n');
  return root;
}
export async function fixture(t, options = {}) {
  const root = options.project ?? await project(t);
  const { project: _, ...rest } = options;
  const started = await startRun({ project: root, topic: 'OrionDB deployment', sources: ['sources/reference.txt'], ...rest });
  return { project: root, run: started.run };
}
export const argsFor = (f, task, more = {}) => ({ project: f.project, run: f.run, task: task.id, worker: task.worker, lease: task.lease, attempt: task.attempt, ...more });
export async function take(f, worker = 'research-invocation') { return (await nextTask({ project: f.project, run: f.run, worker })).task; }
export async function submit(f, task, data) {
  const result = await submitTask(argsFor(f, task, { data }));
  assert.equal(result.accepted, true, JSON.stringify(result.errors)); return result;
}
export async function setup(f, suppliedPlan = plan) {
  const sourceTask = await take(f);
  assert.equal(sourceTask.kind, 'source');
  const source = await registerSource(argsFor(f, sourceTask, { data: { file: 'sources/reference.txt', title: 'Synthetic reference', publisher: 'Fixture publisher' } }));
  await submit(f, sourceTask, { sources: [source.source.id] });
  const planner = await take(f); assert.equal(planner.kind, 'plan'); await submit(f, planner, suppliedPlan);
  return source.source;
}
export function finding(source, statement = quote, text = quote) { return { coverage: 'answered', facts: [{ statement, as_of: '2026-10-15', quotes: [{ source: source.id, quote: text, locator: 'Line 1' }] }], gaps: [] }; }
export function checked(task, { rejected = false, narrowed } = {}) {
  // A check task also lists facts already confirmed for its questions; only candidates are assessed.
  const candidates = task.facts.filter(fact => fact.status === 'candidate');
  return {
    facts: candidates.map(fact => ({ key: fact.key, result: rejected ? 'rejected' : narrowed ? 'narrowed' : 'confirmed', ...(narrowed ? { statement: narrowed } : {}), ...(rejected || narrowed ? { reason: 'Synthetic semantic check.' } : {}) })),
    inspected_sources: task.sources.filter(source => candidates.some(fact => fact.citations.some(c => c.source === source.id))).map(source => ({ source: source.id, sha256: source.sha256, original_sha256: source.original_sha256, read_original: true })),
    assessments: task.questions.map(q => {
      const supported = !rejected && task.facts.some(fact => fact.questions.includes(q.id));
      const sources = task.sources.map(s => s.id).slice(0, 1);
      return { id: q.id, coverage: supported ? 'answered' : 'not answered', ...(q.kind === 'claim' ? { verdict: supported ? 'supported' : 'insufficient' } : {}), ...(supported ? {} : { gaps: [{ kind: 'insufficient', reason: 'The selected source does not establish the assertion.', sources, ...(sources.length ? {} : { attempts: ['Synthetic: no source addressed this question.'] }) }] }) };
    }),
  };
}
export function writing(task) {
  return { questions: task.questions.map(q => {
    if (q.coverage === 'not answered') return { id: q.id, headline: { kind: 'gap', gaps: q.gaps }, answer: [], gaps: q.gaps };
    const fact = task.facts.find(f => f.status === 'confirmed' && !f.superseded_by && f.questions.includes(q.id));
    return { id: q.id, headline: { sentence: fact.statement, facts: [fact.key] }, answer: [{ sentence: fact.statement, facts: [fact.key] }], gaps: q.gaps };
  }) };
}
const empty = () => ({ merges: [], conflicts: [], superseded: [], missing: [] });
// Work every remaining task with separate invocations until the run finishes. Research, plan and
// refresh tasks need a handler from the test; checks, cross-checks, writing and review are generic.
export async function finish(f, handlers = {}) {
  for (let step = 0; step < 80; step++) {
    const current = await runStatus({ project: f.project, run: f.run });
    if (current.status.startsWith('complete')) return current;
    const peek = await peekTask({ project: f.project, run: f.run, worker: 'peeker' });
    if (!peek.task) throw new Error(`No task while ${current.status}: ${peek.waiting_for}; ${current.failedTasks.join('; ')}`);
    const kind = peek.task.kind;
    const worker = kind.endsWith('research') ? `researcher-${step}` : kind === 'review' ? 'reviewer-invocation' : kind === 'refresh' || kind === 'plan' ? `reader-${step}` : 'checker-invocation';
    const task = await take(f, worker);
    if (kind.endsWith('research')) { if (!handlers.research) throw new Error('Unexpected research task.'); await submit(f, task, await handlers.research(task)); }
    else if (kind === 'plan') { if (!handlers.plan) throw new Error('Unexpected plan task.'); await submit(f, task, await handlers.plan(task)); }
    else if (kind === 'refresh') { if (!handlers.refresh) throw new Error('Unexpected refresh task.'); await submit(f, task, await handlers.refresh(task)); }
    else if (kind.endsWith('check') && !kind.endsWith('cross')) await submit(f, task, handlers.check ? await handlers.check(task) : checked(task));
    else if (kind.endsWith('cross')) await submit(f, task, handlers.cross ? await handlers.cross(task) : empty());
    else if (kind === 'write' || kind === 'review') await submit(f, task, writing(task));
    else throw new Error('Unexpected task kind: ' + kind);
  }
  throw new Error('Run did not finish.');
}
// A finished single-question run whose fact is cited as the answer.
export async function completed(t, options = {}) {
  const f = await fixture(t, options), source = await setup(f);
  await submit(f, await take(f), finding(source));
  const done = await finish(f);
  assert.equal(done.status, 'complete');
  return { ...f, source, done };
}
