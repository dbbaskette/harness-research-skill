import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, realpath, symlink, chmod, utimes } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startRun, nextTask, peekTask, releaseTask, submitTask, registerSource, heartbeat, runStatus, retryTask, continueRun, blockRun, reassessRun } from '../scripts/lib/research-run.mjs';
import { researchStatus, recordResearch, planResearch } from '../scripts/lib/research.mjs';
import { hash, parseJson } from '../scripts/lib/run-storage.mjs';
import { placeQuote, numbers, numericSupport, statement } from '../scripts/lib/run-evidence.mjs';
import { runCli } from '../scripts/lib/run-cli.mjs';
import { validateFacts } from '../scripts/lib/run-schema.mjs';
import { install } from '../scripts/install.mjs';
import { fileURLToPath } from 'node:url';
import { execFile, spawnSync } from 'node:child_process';
import { promisify } from 'node:util';
import { start as startGuidance } from '../scripts/sync-guidance.mjs';

const quote = 'OrionDB permits a single writer for each database.';
// Saved sources carry their surrounding text; a source no longer than its quote is refused.
const surroundings = ' Readers never wait for that writer, because each query sees a consistent snapshot taken when it starts. The engine keeps a write-ahead log, so a crash loses no committed transaction. Replication, backups and retention are described in other references and are not covered here.';
const reference = quote + surroundings;
const plan = { scope: 'Synthetic OrionDB deployment facts from the selected reference.', sections: [{ id: 'deployment', name: 'Deployment' }], subjects: [], questions: [{ id: 'writers', section: 'deployment', kind: 'open', question: 'How many writers does OrionDB permit?' }] };
async function fixture(t, options = {}) {
  const project = await realpath(await mkdtemp(join(tmpdir(), 'research-run-test-')));
  t.after(() => rm(project, { recursive: true, force: true }));
  await mkdir(join(project, 'sources')); await writeFile(join(project, 'sources/reference.txt'), reference + '\n');
  const started = await startRun({ project, topic: 'OrionDB deployment', sources: ['sources/reference.txt'], ...options });
  return { project, run: started.run };
}
const argsFor = (f, task, more = {}) => ({ ...f, task: task.id, worker: task.worker, lease: task.lease, attempt: task.attempt, ...more });
async function take(f, worker = 'research-invocation') { return (await nextTask({ ...f, worker })).task; }
async function submit(f, task, data, more = {}) {
  const result = await submitTask(argsFor(f, task, { data, ...more }));
  assert.equal(result.accepted, true, JSON.stringify(result.errors)); return result;
}
async function setup(f, suppliedPlan = plan) {
  const sourceTask = await take(f);
  assert.equal(sourceTask.kind, 'source');
  const source = await registerSource(argsFor(f, sourceTask, { data: { file: 'sources/reference.txt', title: 'Synthetic reference', publisher: 'Fixture publisher' } }));
  await submit(f, sourceTask, { sources: [source.source.id] });
  const planner = await take(f); assert.equal(planner.kind, 'plan'); await submit(f, planner, suppliedPlan);
  return source.source;
}
function finding(source, statement = quote) { return { coverage: 'answered', facts: [{ statement, as_of: '2026-10-15', quotes: [{ source: source.id, quote, locator: 'Line 1' }] }], gaps: [] }; }
function checked(task, { rejected = false, narrowed, gap = false } = {}) {
  return {
    facts: task.facts.map(fact => ({ key: fact.key, result: rejected ? 'rejected' : narrowed ? 'narrowed' : 'confirmed', ...(narrowed ? { statement: narrowed } : {}), ...(rejected || narrowed ? { reason: 'Synthetic semantic check.' } : {}) })),
    inspected_sources: task.sources.filter(source => task.facts.some(fact => fact.citations.some(c => c.source === source.id))).map(source => ({ source: source.id, sha256: source.sha256, original_sha256: source.original_sha256, read_original: true })),
    assessments: task.questions.map(q => ({ id: q.id, coverage: rejected || gap ? 'not answered' : 'answered', ...(q.kind === 'claim' ? { verdict: rejected || gap ? 'insufficient' : 'supported' } : {}), ...(rejected ? { gaps: [{ kind: 'insufficient', reason: 'The selected source does not establish the assertion.', sources: task.sources.map(s => s.id) }] } : {}) })),
  };
}
function writing(task) {
  return { questions: task.questions.map(q => {
    if (q.coverage === 'not answered') return { id: q.id, headline: { kind: 'gap', gaps: q.gaps }, answer: [], gaps: q.gaps };
    const fact = task.facts.find(f => f.status === 'confirmed' && !f.superseded_by && f.questions.includes(q.id));
    return { id: q.id, headline: { sentence: fact.statement, facts: [fact.key] }, answer: [{ sentence: fact.statement, facts: [fact.key] }], gaps: q.gaps };
  }) };
}
async function finish(f, { gap = false, rejected = false, narrowed } = {}) {
  for (let i = 0; i < 30; i++) {
    const current = await runStatus(f);
    if (current.status.startsWith('complete')) return current;
    const response = await nextTask({ ...f, worker: 'checker-invocation' });
    const task = response.task; assert.ok(task, JSON.stringify(response));
    if (task.kind.endsWith('check')) await submit(f, task, checked(task, { gap, rejected, narrowed }));
    else if (task.kind.endsWith('cross')) await submit(f, task, { merges: [], conflicts: [], superseded: [], missing: [] });
    else if (task.kind === 'write' || task.kind === 'review') {
      if (task.kind === 'review') throw new Error('Use a separate reviewer in this fixture.');
      await submit(f, task, writing(task));
    } else throw new Error('Unexpected remaining task: ' + task.kind);
  }
  throw new Error('Run did not finish.');
}
test('queued research completes with a checked cited answer, matching exports and a legacy projection', async t => {
  const f = await fixture(t), source = await setup(f), worker = await take(f);
  assert.equal(worker.kind, 'research'); await submit(f, worker, finding(source));
  const self = await nextTask({ ...f, worker: worker.worker }); assert.equal(self.task, null); assert.match(self.waiting_for, /separate/);
  const completed = await finish(f); assert.equal(completed.status, 'complete');
  const facts = JSON.parse(await readFile(completed.facts, 'utf8'));
  assert.equal(facts.facts[0].check.by, 'checker-invocation'); assert.notEqual(facts.facts[0].authored_by, facts.facts[0].check.by);
  assert.equal(facts.questions[0].headline.facts[0], facts.facts[0].key);
  const manifest = JSON.parse(await readFile(completed.manifest, 'utf8'));
  for (const [name, digest] of Object.entries(manifest.files)) assert.equal(hash(await readFile(join(f.project, 'research', name))), digest);
  assert.match(await readFile(completed.report, 'utf8'), /OrionDB permits a single writer/);
  const legacy = await researchStatus(f.project); assert.equal(legacy.status, 'complete'); assert.equal(legacy.scope, 'supplied-only');
  await assert.rejects(recordResearch(f.project, f.run, 'writers', {}), /leased research submit/);
  await assert.rejects(planResearch(f.project, {topic:'Other',purpose:'planning',scope:'supplied-only',items:[{id:'new',question:'New?',public_query:null}]}), /leased research tasks/);
});
test('honest zero-fact and all-rejected questions complete with gaps and no invented citation', async t => {
  for (const rejected of [false, true]) {
    const f = await fixture(t), source = await setup(f), task = await take(f);
    await submit(f, task, rejected ? finding(source) : { coverage: 'not answered', facts: [], gaps: [{ kind: 'insufficient', reason: 'The selected source does not establish benchmark throughput.', sources: [source.id] }] });
    const completed = await finish(f, { gap: true, rejected }); assert.equal(completed.status, 'complete-with-gaps');
    const output = JSON.parse(await readFile(completed.facts, 'utf8'));
    assert.equal(output.questions[0].headline.kind, 'gap'); assert.deepEqual(output.questions[0].answer, []);
    assert.equal((await researchStatus(f.project)).status, 'complete'); assert.deepEqual((await researchStatus(f.project)).unresolved, ['writers']);
    assert.match(await readFile(completed.report, 'utf8'), /Not established by the sources checked/);
    assert.equal(output.rejected.length, rejected ? 1 : 0);
  }
});
const LEASE = 30 * 60 * 1000;
test('an inaccessible original can be rejected honestly, but cannot confirm or narrow a fact', async t => {
  const f = await fixture(t), source = await setup(f), research = await take(f);
  await submit(f, research, finding(source));
  const task = await take(f, 'independent-checker');
  const payload = checked(task, { rejected: true });
  payload.inspected_sources[0].read_original = false;
  payload.inspected_sources[0].access_error = 'The original could not be opened: HTTP 403.';
  payload.assessments[0].gaps = [{ kind: 'unavailable', reason: 'The checker could not open the original (HTTP 403).', sources: [source.id], attempts: ['Original read returned HTTP 403.'] }];
  for (const result of ['confirmed', 'narrowed']) {
    const invalid = structuredClone(payload);
    invalid.facts[0] = { ...invalid.facts[0], result, statement: 'OrionDB permits a single writer.' };
    const refused = await submitTask(argsFor(f, task, { data: invalid }));
    assert.equal(refused.accepted, false);
  }
  for (const mutate of [
    data => { delete data.inspected_sources[0].access_error; },
    data => { data.inspected_sources[0].sha256 = '0'.repeat(64); },
    data => { data.inspected_sources[0].original_sha256 = '0'.repeat(64); },
    data => { data.inspected_sources.push({ ...data.inspected_sources[0], read_original: true }); },
    data => { data.assessments[0].gaps = []; },
  ]) {
    const invalid = structuredClone(payload); mutate(invalid);
    assert.equal((await submitTask(argsFor(f, task, { data: invalid }))).accepted, false);
  }
  await submit(f, task, payload);
  const completed = await finish(f);
  assert.equal(completed.status, 'complete-with-gaps');
  const exported = JSON.parse(await readFile(completed.facts, 'utf8'));
  assert.equal(exported.counts.checked, 0);
  assert.equal(exported.rejected[0].check.inspected_sources[0].read_original, false);
  assert.match(exported.rejected[0].check.inspected_sources[0].access_error, /403/);
  assert.equal(exported.questions[0].headline.kind, 'gap');
});
test('a mixed-source check retains accessible support and records the inaccessible original as a gap', async t => {
  const f = await fixture(t, { allowWeb: true }), first = await setup(f), research = await take(f);
  const secondQuote = 'OrionDB readers use a consistent snapshot.';
  await writeFile(join(f.project, 'sources/second.txt'), secondQuote + surroundings);
  const registered = await registerSource(argsFor(f, research, { data: { file: 'sources/second.txt', origin: 'https://fixture.invalid/readers', title: 'Synthetic readers reference' } }));
  const second = registered.source;
  const dependent = finding(first).facts[0];
  dependent.quotes.push({ source: second.id, quote: secondQuote, locator: 'Line 1' });
  await submit(f, research, { coverage: 'answered', facts: [dependent, { statement: secondQuote, quotes: [{ source: second.id, quote: secondQuote, locator: 'Line 1' }] }], gaps: [] });
  const task = await take(f, 'independent-checker'), payload = checked(task);
  payload.facts.find(item => item.key === task.facts.find(fact => fact.citations[0].source === first.id).key).result = 'rejected';
  payload.facts[0].reason = 'The first original cannot be opened.';
  const inspected = payload.inspected_sources.find(item => item.source === first.id);
  inspected.read_original = false; inspected.access_error = 'Original access returned HTTP 403.';
  payload.assessments[0] = { id: 'writers', coverage: 'partly answered', gaps: [{ kind: 'unavailable', reason: 'The first original was inaccessible to the checker.', sources: [first.id], attempts: ['HTTP 403.'] }] };
  await submit(f, task, payload);
  const completed = await finish(f), exported = JSON.parse(await readFile(completed.facts, 'utf8'));
  assert.equal(completed.status, 'complete-with-gaps');
  assert.equal(exported.counts.checked, 1);
  assert.equal(exported.rejected.length, 1);
  assert.equal(exported.questions[0].coverage, 'partly answered');
  assert.equal(exported.questions[0].headline.facts[0], exported.facts[0].key);
});
test('lease expiry fences old workers, renews live work and accepted replay cannot rewrite results', async t => {
  const f = await fixture(t), now = Date.now(), first = (await nextTask({...f,worker:'a',now})).task;
  assert.equal(first.expires, now + LEASE);
  const renewed = await heartbeat(argsFor(f, first, { now: now + 1000 })); assert.ok(renewed.lease.expires > first.expires);
  const later = now + 1000 + LEASE + 1000, second = (await nextTask({...f,worker:'b',now:later})).task;
  assert.equal(second.id, first.id); assert.notEqual(second.lease, first.lease);
  await assert.rejects(submitTask(argsFor(f, first, { data: {sources:[]}, now:later+1 })), /another worker holds this task/);
  const registered = await registerSource(argsFor(f, second, { now:later+1, data:{file:'sources/reference.txt',title:'Reference',publisher:'Publisher'} }));
  const result = {sources:[registered.source.id]};
  await submit(f, second, result, {now:later+2});
  const replay = await submitTask(argsFor(f, second, {data:result,now:later+3*LEASE})); assert.equal(replay.replay,true);
  await assert.rejects(submitTask(argsFor(f,second,{data:{sources:[]},now:later+3*LEASE})),/different payload/);
});
test('a lapsed lease still submits while nobody else has taken the task', async t => {
  const f = await fixture(t), now = Date.now(), task = (await nextTask({...f,worker:'slow',now})).task;
  const lapsed = await runStatus({...f, now: now + LEASE + 60000});
  assert.equal(lapsed.tasks.find(item => item.id === task.id).status, 'ready');
  const registered = await registerSource(argsFor(f, task, { now: now + LEASE + 61000, data: { file: 'sources/reference.txt', title: 'Reference', publisher: 'Publisher' } }));
  await submit(f, task, { sources: [registered.source.id] }, { now: now + LEASE + 62000 });
  const state = JSON.parse(await readFile(lapsed.file, 'utf8')), done = state.tasks.find(item => item.id === task.id);
  assert.equal(done.status, 'done'); assert.equal(done.attempts.length, 1); assert.equal(done.attempts[0].error, undefined);
});
test('a refused submission keeps its lease for correction, and ten refusals end the attempt', async t => {
  const f = await fixture(t), task = await take(f);
  const refused = await submitTask(argsFor(f, task, { data: { sources: [] } }));
  assert.equal(refused.accepted, false); assert.equal(refused.lease_kept, true); assert.equal(refused.refusals, 1);
  const registered = await registerSource(argsFor(f, task, { data: { file: 'sources/reference.txt', title: 'Reference', publisher: 'Publisher' } }));
  await submit(f, task, { sources: [registered.source.id] });
  const g = await fixture(t), stubborn = await take(g);
  for (let i = 1; i <= 10; i++) { const result = await submitTask(argsFor(g, stubborn, { data: { sources: [] } })); assert.equal(result.lease_kept, i < 10); }
  const state = JSON.parse(await readFile((await runStatus(g)).file, 'utf8'));
  assert.equal(state.tasks[0].status, 'ready'); assert.match(state.tasks[0].lastError, /Refused 10 times/);
});
test('three failed attempts block instead of fabricating unavailable, explicit retry retains history', async t => {
  const f = await fixture(t);
  for(let i=0;i<3;i++) { const task=await take(f); const result=await submitTask(argsFor(f,task,{data:{error:{message:'Synthetic crash.'}}})); assert.equal(result.accepted,false); assert.equal(result.lease_kept,false); }
  const blocked=await runStatus(f); assert.equal(blocked.status,'blocked'); assert.equal(blocked.counts.gaps,0);
  const failed=blocked.tasks.find(task=>task.status==='failed');
  await retryTask({...f,task:failed.id});
  const next=await take(f); assert.equal(next.attempt,4);
  const state=JSON.parse(await readFile(blocked.file,'utf8')); assert.equal(state.tasks[0].attemptHistory.length,3);
});
test('plan-only hold supports validated edits and cannot accidentally run research early', async t => {
  const f=await fixture(t,{planOnly:true}); await setup(f);
  const held=await nextTask({...f,worker:'a'}); assert.equal(held.task,null); assert.equal(held.planOnly,true);
  await continueRun({...f,plan:{...plan,scope:'An edited but bounded scope.'}});
  assert.equal((await take(f)).kind,'research');
  await assert.rejects(continueRun({...f,plan}),/plan-only hold/);
});
test('unavailable independent checker is a visible execution block with partial artifacts', async t => {
  const f=await fixture(t),source=await setup(f),task=await take(f); await submit(f,task,finding(source));
  const blocked=await blockRun({...f,reason:'Host cannot start an independent checker invocation.'});
  assert.equal(blocked.status,'blocked'); assert.match(await readFile(blocked.report,'utf8'),/candidate/);
  const brief=await readFile(blocked.brief,'utf8'); assert.doesNotMatch(brief,/fact-[0-9a-f]{32}:/);
  assert.equal((await nextTask({...f,worker:'another-label'})).task,null);
  await continueRun(f); assert.equal((await take(f,'checker-invocation')).kind,'check');
});
test('number/quote validation and failure rollback retain no partially accepted facts', async t => {
  const f=await fixture(t),source=await setup(f),task=await take(f);
  const result=await submitTask(argsFor(f,task,{data:{...finding(source),facts:[...finding(source).facts,{statement:'OrionDB supports 999 simultaneous writers.',quotes:[{source:source.id,quote}]}]}}));
  assert.equal(result.accepted,false); assert.match(result.errors[0],/Numbers/);
  assert.equal((await runStatus(f)).counts.facts,0);
});
test('normalized quotes preserve exact original wording and Unicode offsets; numeric boundaries remain distinct', () => {
  const content='😀 OrionDB uses “one writer” — for each database.\n\nMore context.';
  const placed=placeQuote(content,'OrionDB uses "one writer" - for each database.');
  assert.equal(placed.start,2); assert.equal(placed.quote,'OrionDB uses “one writer” — for each database.');
  assert.notDeepEqual(numbers('version 7.2'),numbers('version 72'));
  assert.deepEqual(numbers('1,000 connections'),['1000']);
  assert.throws(()=>parseJson('{"scope":"public-web","scope":"anything"}'),/Duplicate/);
});
test('abbreviations stay one sentence, and spelled-out or scaled numbers meet the number rule', () => {
  for (const one of ['Redis vs. Valkey differ in licensing after the 2024 change.', 'The U.S. Department of Commerce published the rule in 2025.', 'J. Smith maintains the client, e.g. for Node.', 'Redis Ltd. changed the licence in Mar. 2024.']) assert.equal(statement(one), one);
  for (const two of ['Valkey 8.0 added threading. Redis did not.', 'It shipped. Then it changed.']) assert.throws(() => statement(two), /one sentence/);
  assert.throws(() => numericSupport('Valkey supports five replicas per shard.', ['Each shard may have 3 replicas configured.']), /5/);
  numericSupport('Valkey supports three replicas per shard.', ['Each shard may have 3 replicas configured.']);
  numericSupport('It reached 1.5 million operations.', ['It reached 1,500,000 operations per second.']);
  numericSupport('Valkey is twenty-five percent faster.', ['Valkey is 25 percent faster in this test.']);
  numericSupport('OrionDB is one of the engines.', ['OrionDB is among the engines described here.']);
  assert.throws(() => numericSupport('Valkey 8 adds threading.', ['Valkey 8.0 adds I/O threading improvements.']), /8/);
  assert.deepEqual(numbers('hundreds of users'), []);
});
test('digits inside identifiers are part of a name, not numbers the evidence must contain', () => {
  // Live 0.9.1 trials refused "sqlite3_wal_checkpoint_v2()" because 3 and 2 were not in the quotes.
  assert.deepEqual(numbers('sqlite3_wal_checkpoint_v2() returns SQLITE_BUSY'), []);
  assert.deepEqual(numbers('Use SHA256 and IPv6 on x86_64 hosts.'), []);
  numericSupport('sqlite3_wal_checkpoint_v2() reports the frames in the WAL.', ['The checkpoint function reports the total number of frames in the log file.']);
  // Numbers next to a name, units after a number and versions are still numbers.
  assert.deepEqual(numbers('The v2 API keeps 4MB of 1000 pages since 3.11.0.'), ['4', '1000', '3.11.0']);
  assert.throws(() => numericSupport('sqlite3 checkpoints at 1000 pages.', ['SQLite checkpoints at 100 pages.']), /1000/);
  assert.throws(() => numericSupport('COVID-19 changed usage.', ['The pandemic changed usage.']), /19/);
});
test('unowned output and escaping sources are preserved', async t => {
  const project=await realpath(await mkdtemp(join(tmpdir(),'research-user-files-')));t.after(()=>rm(project,{recursive:true,force:true}));
  await mkdir(join(project,'research')); await writeFile(join(project,'research/report.md'),'User report');
  await assert.rejects(startRun({project,topic:'Test'}),/unowned/);
  assert.equal(await readFile(join(project,'research/report.md'),'utf8'),'User report');
  await symlink('/etc/hosts',join(project,'escape.txt'));
  await assert.rejects(startRun({project,topic:'Escape',sources:['escape.txt']}),/regular project files/);
});

test('narrowing creates a new assertion key and retains the rejected wording in history', async t => {
  const f=await fixture(t),source=await setup(f),researcher=await take(f);
  await submit(f,researcher,finding(source,'OrionDB permits a single writer globally.'));
  const before=JSON.parse(await readFile((await runStatus(f)).facts,'utf8')).facts[0];
  const result=await finish(f,{narrowed:quote});
  const exported=JSON.parse(await readFile(result.facts,'utf8'));
  assert.notEqual(exported.facts[0].key,before.key);
  assert.equal(exported.revisions[0].previous.statement,before.statement);
  assert.equal(exported.revisions[0].current,exported.facts[0].key);
  assert.equal(exported.facts[0].original_statement,before.statement);
});

test('cross-check merges checked duplicates, preserves aliases, and rejects supersession cycles', async t => {
  const f=await fixture(t),source=await setup(f),researcher=await take(f);
  const data=finding(source);data.facts.push(...structuredClone(data.facts));
  await submit(f,researcher,data);
  const checker=await take(f,'checker');await submit(f,checker,checked(checker));
  const cross=await take(f,'cross'),[a,b]=cross.facts;
  const invalid=await submitTask(argsFor(f,cross,{data:{merges:[],conflicts:[],missing:[],superseded:[{fact:a.key,by:b.key,note:'New context.'},{fact:b.key,by:a.key,note:'Invalid cycle.'}]}}));
  assert.equal(invalid.accepted,false);assert.match(invalid.errors[0],/cycle/);
  const retried=cross; // a refusal keeps the lease, so the same task is corrected and resubmitted
  await submit(f,retried,{merges:[{canonical:a.key,duplicates:[b.key]}],conflicts:[],superseded:[],missing:[]});
  const complete=await finish(f),exported=JSON.parse(await readFile(complete.facts,'utf8'));
  assert.equal(exported.facts.length,1);assert.equal(exported.aliases[0].key,b.key);assert.equal(exported.aliases[0].canonical,a.key);
  assert.equal(exported.aliases[0].original.check.result,'confirmed');
});

test('one light gap round is capped, skips the gap cross-check, and unresearched angles remain explicit gaps', async t => {
  const f=await fixture(t),source=await setup(f),researcher=await take(f);
  await submit(f,researcher,finding(source));
  const checker=await take(f,'checker');await submit(f,checker,checked(checker));
  const cross=await take(f,'cross');
  await submit(f,cross,{missing:Array.from({length:4},(_,i)=>({id:'extra-'+i,section:'deployment',question:'Follow-up angle '+i+'?'}))});
  for(let i=0;i<3;i++){const task=await take(f,'gap-researcher');assert.equal(task.kind,'gap-research');await submit(f,task,finding(source));}
  const gapCheck=await take(f,'gap-checker');assert.equal(gapCheck.kind,'gap-check');await submit(f,gapCheck,checked(gapCheck));
  // Light depth goes straight from the checked gap round to writing.
  const writer=await peekTask({...f,worker:'cross'});assert.equal(writer.task.kind,'write');
  const complete=await finish(f),exported=JSON.parse(await readFile(complete.facts,'utf8'));
  assert.equal(complete.status,'complete-with-gaps');assert.equal(exported.questions.length,4);
  assert.equal(exported.missing.filter(item=>!item.scheduled_question).length,1);
  assert.match(await readFile(complete.report,'utf8'),/Unresearched angle/);
});

test('standard depth requires a different writing reviewer and rejects unsupported headlines', async t => {
  const f=await fixture(t,{depth:'standard'}),source=await setup(f),researcher=await take(f);
  await submit(f,researcher,finding(source));
  const checker=await take(f,'checker');await submit(f,checker,checked(checker));
  const cross=await take(f,'checker');await submit(f,cross,{});
  const writer=await take(f,'writer'),bad=writing(writer);bad.questions[0].headline.sentence='OrionDB permits 9000 writers.';
  assert.equal((await submitTask(argsFor(f,writer,{data:bad}))).accepted,false);
  const retry=writer;await submit(f,retry,writing(retry)); // same lease, corrected
  assert.equal((await nextTask({...f,worker:'writer'})).task,null);
  assert.equal((await runStatus(f)).status,'in-progress');
  const review=await take(f,'prose-reviewer');assert.equal(review.kind,'review');await submit(f,review,writing(review));
  const exported=JSON.parse(await readFile((await runStatus(f)).facts,'utf8'));
  assert.equal(exported.status,'complete');assert.equal(exported.prose_review,'independently reviewed');
  assert.equal(exported.questions[0].writingReview.by,'prose-reviewer');
});

test('source original and extraction revisions are pinned separately; changed originals invalidate current use', async t => {
  const f=await fixture(t,{sources:[]});
  await writeFile(join(f.project,'sources/original.pdf'),'%PDF-1.7 synthetic fixture');
  const started=await startRun({project:f.project,topic:'Original revisions',sources:[{file:'sources/reference.txt',original_file:'sources/original.pdf'}]});f.run=started.run;
  await setup(f);const researcher=await take(f);
  const source=researcher.sources[0];assert.equal(source.original_sha256,hash('%PDF-1.7 synthetic fixture'));assert.notEqual(source.sha256,source.original_sha256);
  await submit(f,researcher,finding(source));await finish(f);
  await writeFile(join(f.project,'sources/original.pdf'),'%PDF-1.7 changed fixture');
  const stale=await runStatus(f);assert.equal(stale.status,'stale');assert.equal(stale.counts.confirmed,0);
  assert.doesNotMatch(await readFile(stale.brief,'utf8'),/fact-[a-f0-9]{32}:/);
  const facts=JSON.parse(await readFile(stale.facts,'utf8'));assert.equal(facts.facts[0].status,'stale');assert.deepEqual(facts.questions[0].facts,[]);
});

test('UTF-8 BOM hashes use original bytes, and unreadable selected originals become assessed gaps', async t => {
  const f=await fixture(t);await writeFile(join(f.project,'sources/reference.txt'),'\uFEFF'+reference);
  const started=await startRun({project:f.project,topic:'BOM reference',sources:['sources/reference.txt']});f.run=started.run;
  const source=await setup(f);assert.equal(source.sha256,hash('\uFEFF'+reference));
  const task=await take(f);await submit(f,task,finding(source));assert.equal((await finish(f)).status,'complete');
  const binary=await fixture(t,{sources:[]});await writeFile(join(binary.project,'sources/scan.pdf'),'%PDF-1.7 unreadable fixture');
  binary.run=(await startRun({project:binary.project,topic:'Scan',sources:['sources/scan.pdf']})).run;
  const selected=await take(binary);
  await assert.rejects(registerSource(argsFor(binary,selected,{data:{file:'sources/scan.pdf',title:'Scan'}})),/UTF-8 extraction/);
  const unavailable=await registerSource(argsFor(binary,selected,{data:{title:'Scan',limits:'No readable text in the selected scan.'}}));
  await submit(binary,selected,{sources:[unavailable.source.id]});const planner=await take(binary);await submit(binary,planner,plan);
  const research=await take(binary);await submit(binary,research,{coverage:'not answered',facts:[],gaps:[{kind:'unreadable',reason:'Selected scan has no readable text.',sources:[unavailable.source.id]}]});
  assert.equal((await finish(binary,{gap:true})).status,'complete-with-gaps');
});

test('public-source permissions and exact Unicode claim targets cannot be bypassed by self-citation', async t => {
  const f=await fixture(t),source=await setup(f),task=await take(f);
  await assert.rejects(registerSource(argsFor(f,task,{data:{origin:'https://example.test/reference',file:'sources/reference.txt',title:'Found source'}})),/public-web/);
  const claimFile='sources/claim.txt';await writeFile(join(f.project,claimFile),'😀 '+reference);
  const claim={file:claimFile,start:2,quote};
  await assert.rejects(startRun({project:f.project,topic:'Claim',claims:[{...claim,start:1}]}),/exact target/);
  f.run=(await startRun({project:f.project,topic:'Claim',sources:[claimFile],claims:[claim]})).run;
  const selected=await take(f),target=await registerSource(argsFor(f,selected,{data:{file:claimFile,title:'Target document'}}));await submit(f,selected,{sources:[target.source.id]});
  const planner=await take(f);await submit(f,planner,{...plan,questions:[{...plan.questions[0],kind:'claim',claim}]});
  const research=await take(f),response=await submitTask(argsFor(f,research,{data:finding(target.source)}));
  assert.equal(response.accepted,false);assert.match(response.errors[0],/own assertion/);
  await assert.rejects(startRun({project:f.project,topic:'Permission',sourceMode:'public-web'}),/allow-web/);
});

test('status repairs interrupted derived writes without changing revision and refuses stale run writes', async t => {
  const f=await fixture(t),source=await setup(f),task=await take(f);await submit(f,task,finding(source));const complete=await finish(f);
  await writeFile(complete.report,'interrupted report');await rm(complete.facts);
  const repaired=await runStatus(f);assert.equal(repaired.output_revision,complete.output_revision);
  const manifest=JSON.parse(await readFile(repaired.manifest,'utf8'));
  for(const[name,digest]of Object.entries(manifest.files))assert.equal(hash(await readFile(join(f.project,'research',name))),digest);
  await startRun({project:f.project,topic:'New run'});
  await assert.rejects(heartbeat(argsFor(f,task)),/run changed/);
});

test('concurrent task claims wait for the shared lock and never return the same lease', async t => {
  const f=await fixture(t);await setup(f);
  const claims=await Promise.allSettled(Array.from({length:6},(_,i)=>nextTask({...f,worker:'worker-'+i})));
  assert.equal(claims.filter(result=>result.status==='rejected').length,0);
  const tasks=claims.map(result=>result.value.task).filter(Boolean);
  assert.equal(tasks.length,1);
  const snapshot=JSON.parse(await readFile((await runStatus(f)).file,'utf8'));assert.equal(snapshot.tasks.filter(task=>task.status==='leased').length,1);
});
test('a lock left by an exited process is recovered; a live one is waited for, then reported', async t => {
  const f=await fixture(t),lock=join(f.project,'.harness-research/research.lock');
  await writeFile(lock,'999999999');const old=new Date(Date.now()-120000);await utimes(lock,old,old);
  assert.equal((await runStatus(f)).run,f.run);
  await writeFile(lock,String(process.pid));
  process.env.HARNESS_RESEARCH_LOCK_WAIT_MS='200';
  try{await assert.rejects(runStatus(f),/busy after waiting/);}finally{delete process.env.HARNESS_RESEARCH_LOCK_WAIT_MS;await rm(lock);}
});

test('CLI JSON and source paths resolve against project; help and malformed payload errors are actionable', async t => {
  const f=await fixture(t,{sources:[]});
  const started=await runCli(['start','--project',f.project,'--topic','CLI test','--source',join(f.project,'sources/reference.txt')]);f.run=started.run;
  const task=await take(f),registered=await runCli(['source','--project',f.project,'--run',f.run,'--task',task.id,'--worker',task.worker,'--lease',task.lease,'--attempt',String(task.attempt),'--file',join(f.project,'sources/reference.txt'),'--title','CLI reference']);
  await writeFile(join(f.project,'result.json'),JSON.stringify({sources:[registered.source.id]}));
  const submitted=await runCli(['submit','--project',f.project,'--run',f.run,'--task',task.id,'--worker',task.worker,'--lease',task.lease,'--attempt',String(task.attempt),'--file','result.json']);assert.equal(submitted.accepted,true);
  assert.match((await runCli(['help'])).usage,/research start/);
  await writeFile(join(f.project,'bad.json'),'{}');await assert.rejects(runCli(['start','--project',f.project,'--topic','Bad','--sources','bad.json']),/JSON array/);
  await assert.rejects(runCli(['status','--project',f.project,'--file','bad.json']),/not valid/);
});

test('published schema validates the complete design fixture and rejects malformed external exports', async () => {
  const doc=await readFile(new URL('../docs/superpowers/specs/2026-10-15-research-with-agents-design.md',import.meta.url),'utf8');
  const fixture=JSON.parse([...doc.matchAll(/```json\n([\s\S]*?)\n```/g)].at(-1)[1]);
  validateFacts(fixture);
  const broken=structuredClone(fixture);delete broken.facts[0].citations[0].quote_sha256;
  assert.throws(()=>validateFacts(broken),/quote_sha256/);
  broken.facts[0].citations[0].quote_sha256='incorrect';assert.throws(()=>validateFacts(broken),/pattern/);
  const wrongScope=structuredClone(fixture);wrongScope.source_mode='Private sources and perhaps web';assert.throws(()=>validateFacts(wrongScope),/enum/);
});

test('isolated installation includes queued CLI, schema and skill guidance with no runtime dependencies', async t => {
  const f=await fixture(t,{sources:[]}),source=fileURLToPath(new URL('../',import.meta.url));
  const installed=await install({source,home:join(f.project,'home'),shared:join(f.project,'shared')});
  const cli=join(installed.targets[2],'scripts/harness-research.mjs');
  const exec=promisify(execFile);
  const version=await exec(process.execPath,[cli,'--version']);assert.equal(version.stdout.trim(),'harness-research 0.9.5');
  const started=JSON.parse((await exec(process.execPath,[cli,'research','start','--project',f.project,'--topic','Installed skill flow'])).stdout);
  assert.equal(started.runtimeVersion,'0.9.5');assert.equal(started.guidanceVersion,'0.9.5');assert.equal(started.guidanceRevision,null);
  const task=JSON.parse((await exec(process.execPath,[cli,'research','next','--project',f.project,'--run',started.run,'--worker','installed-invocation'])).stdout).task;
  assert.equal(task.kind,'plan');
  assert.match(await readFile(join(installed.runtime,'references/research-run.md'),'utf8'),/helper is your ledger/);
  validateFacts(JSON.parse(await readFile(started.facts,'utf8')));
});

test('legacy status repairs an interrupted projection and manual commands cannot replace canonical work', async t => {
  const f=await fixture(t),source=await setup(f),task=await take(f);await submit(f,task,finding(source));await finish(f);
  await rm(join(f.project,'.harness-research/research.json'));
  await assert.rejects(planResearch(f.project,{topic:'Other'}),/leased research tasks/);
  const projected=await researchStatus(f.project);assert.equal(projected.status,'complete');assert.equal(projected.completed,1);
});

test('new research records and verifies the saved bootstrap guidance identity offline', async t => {
  const f=await fixture(t,{sources:[]}),source=join(f.project,'guidance-source'),runtime=fileURLToPath(new URL('../',import.meta.url));
  await mkdir(join(source,'guidance'),{recursive:true});await writeFile(join(source,'SKILL.md'),'# Synthetic saved guidance\n');
  await writeFile(join(source,'guidance/manifest.json'),JSON.stringify({schema:1,skill:'harness-research',entry:'SKILL.md',version:'0.9.5',minimumRuntime:'0.9.0'}));
  const exec=promisify(execFile);await exec('git',['init','-q','--initial-branch=main',source]);await exec('git',['-C',source,'add','.']);
  await exec('git',['-C',source,'-c','user.name=Fixture','-c','user.email=fixture@example.invalid','-c','commit.gpgsign=false','commit','-qm','Synthetic guidance']);
  const pin=await startGuidance({project:f.project,source,runtime});await rm(source,{recursive:true});
  const started=await startRun({project:f.project,topic:'Pinned identity',guidanceTask:pin.task});
  assert.equal(started.guidanceTask,pin.task);assert.equal(started.guidanceRevision,pin.revision);assert.equal(started.guidanceVersion,'0.9.5');assert.equal(started.runtimeVersion,'0.9.5');
  await chmod(pin.guidance,0o600);await writeFile(pin.guidance,'Changed guidance');
  await assert.rejects(startRun({project:f.project,topic:'Tampered pin',guidanceTask:pin.task}),/Saved guidance changed/);
});

test('programmatic research imports work from stdin without treating it as a guidance executable', () => {
  const imported=new URL('../scripts/lib/research-run.mjs',import.meta.url).href;
  const result=spawnSync(process.execPath,['--input-type=module','-'],{input:`await import(${JSON.stringify(imported)});`,encoding:'utf8'});
  assert.equal(result.status,0,result.stderr);
});

test('preserved live skill examples keep valid exports, exact evidence and independent check identities', async () => {
  for(const name of ['supplied','public']) {
    const root=new URL(`../docs/verification/0.9.0/${name}/`,import.meta.url);
    const facts=validateFacts(JSON.parse(await readFile(new URL('research/facts.json',root),'utf8')));
    const manifest=JSON.parse(await readFile(new URL('research/output.json',root),'utf8'));
    assert.equal(manifest.run,facts.run);assert.equal(manifest.output_revision,facts.output_revision);
    for(const[file,digest]of Object.entries(manifest.files))assert.equal(hash(await readFile(new URL('research/'+file,root))),digest);
    for(const fact of facts.facts){
      assert.equal(fact.status,'confirmed');assert.notEqual(fact.authored_by,fact.check.by);
      for(const citation of fact.citations){
        const source=facts.sources.find(s=>s.id===citation.source),bytes=await readFile(new URL(source.file,root));
        assert.equal(hash(bytes),source.sha256);assert.equal(citation.source_sha256,source.sha256);
        assert.equal(Array.from(new TextDecoder().decode(bytes)).slice(citation.start,citation.start+Array.from(citation.quote).length).join(''),citation.quote);
        assert.equal(hash(citation.quote),citation.quote_sha256);
      }
    }
    if(name==='supplied'){assert.equal(facts.gaps.length,2);assert.equal(facts.facts.length,4);}
    else {assert.equal(facts.facts.length,8);assert.equal(facts.revisions.filter(r=>r.kind==='narrowed').length,1);}
  }
});

test('the preserved Claude Code trial export verifies against its manifest and keeps researcher and checker apart', async () => {
  const root = new URL('../docs/verification/0.9.0/claude-code-redis-valkey/new/research/', import.meta.url);
  const facts = validateFacts(JSON.parse(await readFile(new URL('facts.json', root), 'utf8')));
  const manifest = JSON.parse(await readFile(new URL('output.json', root), 'utf8'));
  assert.equal(manifest.run, facts.run); assert.equal(manifest.output_revision, facts.output_revision);
  for (const [file, digest] of Object.entries(manifest.files)) assert.equal(hash(await readFile(new URL(file, root))), digest);
  assert.ok(facts.facts.length >= 100); assert.equal(facts.status, 'complete-with-gaps');
  for (const fact of facts.facts) { assert.equal(fact.status, 'confirmed'); assert.notEqual(fact.authored_by, fact.check.by); for (const citation of fact.citations) assert.equal(hash(citation.quote), citation.quote_sha256); }
});
test('a failed section holds up only what depends on it; other sections are checked as soon as they are researched', async t => {
  const twoSections = { ...plan, sections: [...plan.sections, { id: 'reading', name: 'Reading' }], questions: [...plan.questions, { id: 'readers', section: 'reading', kind: 'open', question: 'Do OrionDB readers wait for the writer?' }] };
  const f = await fixture(t), source = await setup(f, twoSections);
  let failedId;
  for (let i = 0; i < 3; i++) { const task = await take(f, 'researcher'); failedId ??= task.id; assert.equal(task.id, failedId); await submitTask(argsFor(f, task, { data: { error: { message: 'Synthetic crash.' } } })); }
  const meanwhile = await runStatus(f); assert.equal(meanwhile.status, 'in-progress'); assert.equal(meanwhile.failedTasks.length, 1);
  const other = await take(f, 'researcher'); assert.notEqual(other.id, failedId);
  await submit(f, other, { coverage: 'answered', facts: [{ statement: 'OrionDB readers never wait for the single writer.', as_of: null, quotes: [{ source: source.id, quote: 'Readers never wait for that writer, because each query sees a consistent snapshot taken when it starts.' }] }], gaps: [] });
  // The researched section's check is available at once, while the failed section waits.
  const check = await take(f, 'checker-invocation'); assert.equal(check.kind, 'check'); assert.deepEqual(check.questions.map(q => q.id), ['readers']);
  await submit(f, check, checked(check));
  const stuck = await runStatus(f); assert.equal(stuck.status, 'blocked'); assert.match(stuck.blockReasons[0], /Synthetic crash/);
  assert.equal((await nextTask({ ...f, worker: 'checker-invocation' })).task, null);
  await retryTask({ ...f, task: failedId });
  const again = await take(f, 'researcher'); assert.equal(again.id, failedId); await submit(f, again, finding(source));
  assert.equal((await finish(f)).status, 'complete');
});
test('peek shows the next task without taking it, and release gives it back without a failed attempt', async t => {
  const f = await fixture(t);
  const peeked = await peekTask({ ...f, worker: 'a' }); assert.equal(peeked.task.kind, 'source');
  const task = await take(f, 'a'); assert.equal(task.id, peeked.task.id);
  assert.equal((await releaseTask(argsFor(f, task))).released, task.id);
  await assert.rejects(submitTask(argsFor(f, task, { data: { sources: [] } })), /lease/);
  const again = await take(f, 'b'); assert.equal(again.id, task.id); assert.equal(again.attempt, 2);
  const state = JSON.parse(await readFile((await runStatus(f)).file, 'utf8'));
  assert.equal(state.tasks[0].attempts.length, 1); assert.ok(state.tasks[0].attemptHistory[0].released);
});
test('releasing research preserves checker exclusion, including after a refused finding', async t => {
  for (const refused of [false, true]) {
    const f = await fixture(t), source = await setup(f), researcher = await take(f, 'first-researcher');
    if (refused) {
      const result = await submitTask(argsFor(f, researcher, { data: finding(source, 'OrionDB permits 999 writers.') }));
      assert.equal(result.accepted, false); assert.equal(result.lease_kept, true);
    }
    await releaseTask(argsFor(f, researcher));
    const replacement = await take(f, 'replacement-researcher');
    await submit(f, replacement, finding(source));
    const excluded = await nextTask({ ...f, worker: researcher.worker });
    assert.equal(excluded.task, null); assert.match(excluded.waiting_for, /separate eligible invocation/);
    const state = JSON.parse(await readFile(excluded.file, 'utf8'));
    assert.ok(state.questions[0].researchWorkers.includes(researcher.worker));
    const history = state.tasks.find(task => task.id === researcher.id).attemptHistory;
    assert.ok(history[0].released); assert.equal(history[0].refusals ?? 0, refused ? 1 : 0);
    assert.equal((await finish(f)).status, 'complete');
  }
});
test('saved source text must carry its surroundings unless registered as a partial capture', async t => {
  const f = await fixture(t, { sources: [] });
  await writeFile(join(f.project, 'sources/excerpt.txt'), quote + '\n');
  f.run = (await startRun({ project: f.project, topic: 'Excerpts', sources: ['sources/excerpt.txt'] })).run;
  const task = await take(f);
  await assert.rejects(registerSource(argsFor(f, task, { data: { file: 'sources/excerpt.txt', title: 'Excerpt' } })), /only \d+ characters/);
  const partial = await registerSource(argsFor(f, task, { data: { file: 'sources/excerpt.txt', title: 'Excerpt', partial: 'The vendor page shows only this sentence to automated readers.' } }));
  assert.equal(partial.source.capture.kind, 'partial');
  await submit(f, task, { sources: [partial.source.id] }); const planner = await take(f); await submit(f, planner, plan);
  const research = await take(f); await submit(f, research, finding(partial.source));
  const done = await finish(f), report = await readFile(done.report, 'utf8');
  assert.match(report, /\(partial capture\)/); assert.match(report, /Partial capture: The vendor page/);
  assert.equal(JSON.parse(await readFile(done.facts, 'utf8')).sources[0].capture.kind, 'partial');
  const g = await fixture(t, { sources: [] });
  const longQuote = 'OrionDB keeps every committed transaction in a write-ahead log that is flushed before the commit returns, so a crash of the process or the host loses no acknowledged write and recovery replays the log from the last checkpoint.';
  await writeFile(join(g.project, 'sources/log.txt'), longQuote + ' Backups, replication and retention are covered in other references and are not described here at all.\n');
  g.run = (await startRun({ project: g.project, topic: 'Logs', sources: ['sources/log.txt'] })).run;
  const s = await take(g), registered = await registerSource(argsFor(g, s, { data: { file: 'sources/log.txt', title: 'Log' } }));
  await submit(g, s, { sources: [registered.source.id] }); await submit(g, await take(g), plan);
  const r = await take(g), refused = await submitTask(argsFor(g, r, { data: { coverage: 'answered', facts: [{ statement: 'OrionDB keeps every committed transaction in a write-ahead log.', as_of: null, quotes: [{ source: registered.source.id, quote: longQuote }] }], gaps: [] } }));
  assert.equal(refused.accepted, false); assert.match(refused.errors[0], /most of its saved source/);
  assert.equal(refused.lease_kept, true);
  const correctedData = { file: 'sources/log.txt', title: 'Log', given: registered.source.given, partial: 'The tool returned only this section excerpt.' };
  const corrected = await registerSource(argsFor(g, r, { data: correctedData }));
  assert.notEqual(corrected.source.id, registered.source.id);
  assert.equal(corrected.source.sha256, registered.source.sha256);
  assert.equal((await registerSource(argsFor(g, r, { data: correctedData }))).source.id, corrected.source.id);
  await assert.rejects(registerSource(argsFor(g, r, { data: { ...correctedData, id: registered.source.id } })), /metadata is immutable/);
  const state = JSON.parse(await readFile((await runStatus(g)).file, 'utf8'));
  assert.deepEqual(state.sources.find(source => source.id === registered.source.id), registered.source);
  assert.equal(state.sources.length, 2);
  await submit(g, r, { coverage: 'answered', facts: [{ statement: 'OrionDB keeps every committed transaction in a write-ahead log.', as_of: null, quotes: [{ source: corrected.source.id, quote: longQuote }] }], gaps: [] });
  const completed = await finish(g), facts = JSON.parse(await readFile(completed.facts, 'utf8'));
  assert.equal(facts.facts[0].citations[0].source, corrected.source.id);
  assert.match(await readFile(completed.report, 'utf8'), /\(partial capture\)/);
});
test('reports take a short title, compare subjects side by side, and export no worker bookkeeping', async t => {
  const topic = 'Compare OrionDB and NovaDB for a small internal app. Cover writers only, in two questions, using the selected reference.';
  const comparison = { title: 'OrionDB and NovaDB writers', scope: 'Writers in OrionDB and NovaDB, from the selected reference.', sections: plan.sections,
    subjects: [{ id: 'orion', name: 'OrionDB' }, { id: 'nova', name: 'NovaDB' }],
    questions: [{ id: 'orion-writers', section: 'deployment', subject: 'orion', kind: 'open', question: 'How many writers does OrionDB permit?' },
      { id: 'nova-writers', section: 'deployment', subject: 'nova', kind: 'open', question: 'How many writers does NovaDB permit?' }] };
  const f = await fixture(t, { topic }), source = await setup(f, comparison);
  // At light depth one researcher takes the whole section, both subjects together.
  const section = await take(f); assert.deepEqual(section.questions.map(q => q.id), ['orion-writers', 'nova-writers']);
  await submit(f, section, { questions: [{ id: 'orion-writers', ...finding(source) }, { id: 'nova-writers', coverage: 'not answered', facts: [], gaps: [{ kind: 'insufficient', reason: 'The selected reference does not describe NovaDB.', sources: [source.id] }] }] });
  const checker = await take(f, 'checker-invocation');
  await submit(f, checker, { facts: checker.facts.map(fact => ({ key: fact.key, result: 'confirmed' })), inspected_sources: [{ source: source.id, sha256: source.sha256, original_sha256: source.original_sha256, read_original: true }],
    assessments: [{ id: 'orion-writers', coverage: 'answered' }, { id: 'nova-writers', coverage: 'not answered' }] });
  const done = await finish(f), report = await readFile(done.report, 'utf8'), exported = JSON.parse(await readFile(done.facts, 'utf8'));
  assert.match(report, /^# OrionDB and NovaDB writers\n\nRequest: Compare OrionDB and NovaDB/);
  assert.match(report, /\| OrionDB \| NovaDB \|\n\| --- \| --- \|\n\| OrionDB permits a single writer for each database\. \[1\] \|  \|/);
  assert.equal(exported.title, 'OrionDB and NovaDB writers');
  for (const question of exported.questions) for (const field of ['researchWorkers', 'provisionalCoverage', 'writtenBy']) assert.equal(Object.hasOwn(question, field), false, field);
});
test('comparison tables keep merged facts in every linked question section', async t => {
  const sections = [{ id: 'architecture', name: 'Architecture' }, { id: 'capacity', name: 'Capacity' }];
  const comparison = { scope: 'Writer models in OrionDB and NovaDB, across architecture and capacity.', sections,
    subjects: [{ id: 'orion', name: 'OrionDB' }, { id: 'nova', name: 'NovaDB' }],
    questions: sections.flatMap(section => ['orion', 'nova'].map(subject => ({ id: section.id + '-' + subject, section: section.id, subject, question: 'What writer model does ' + subject + ' use for ' + section.name + '?' }))) };
  const f = await fixture(t), source = await setup(f, comparison);
  for (let i = 0; i < sections.length; i++) {
    const task = await take(f); assert.equal(task.questions.length, 2);
    await submit(f, task, { questions: task.questions.map(q => q.subject === 'orion' ? { id: q.id, ...finding(source) } : { id: q.id, coverage: 'not answered', facts: [], gaps: [{ kind: 'insufficient', reason: 'The selected reference does not establish NovaDB writer behavior.', sources: [source.id] }] }) });
  }
  for (let i = 0; i < sections.length; i++) {
    const task = await take(f, 'checker-invocation'), result = checked(task);
    result.assessments.forEach(assessment => { assessment.coverage = task.questions.find(q => q.id === assessment.id).subject === 'orion' ? 'answered' : 'not answered'; });
    await submit(f, task, result);
  }
  const cross = await take(f, 'cross-checker');
  await submit(f, cross, { merges: [{ canonical: cross.facts[0].key, duplicates: [cross.facts[1].key] }] });
  const done = await finish(f), report = await readFile(done.report, 'utf8');
  const exported = JSON.parse(await readFile(done.facts, 'utf8'));
  assert.equal(exported.facts.length, 1); assert.equal(exported.aliases.length, 1);
  for (const section of sections) {
    assert.match(report, new RegExp('- ' + section.name + ': 1 current checked facts'));
    const table = report.split('## ' + section.name + '\n')[1].split('### ')[0];
    assert.match(table, /\| OrionDB \| NovaDB \|/);
    assert.ok(table.includes(quote));
    const question = exported.questions.find(q => q.id === section.id + '-orion');
    assert.deepEqual(question.facts, [exported.facts[0].key]);
  }
});
test('the sources list reads one path or link per line, and peek and release work from the command line', async t => {
  const f = await fixture(t, { sources: [] });
  await writeFile(join(f.project, 'sources.txt'), '# selected references\nsources/reference.txt\tOrion reference\nhttps://example.test/orion\n');
  const started = await runCli(['start', '--project', f.project, '--topic', 'Lines', '--sources', 'sources.txt']); f.run = started.run;
  const state = JSON.parse(await readFile(started.file, 'utf8'));
  assert.deepEqual(state.givenSources.map(s => [s.origin, s.title]), [['sources/reference.txt', 'Orion reference'], ['https://example.test/orion', 'https://example.test/orion']]);
  assert.equal((await runCli(['peek', '--project', f.project, '--run', f.run, '--worker', 'a'])).task.kind, 'source');
  const task = (await runCli(['next', '--project', f.project, '--run', f.run, '--worker', 'a'])).task;
  const released = await runCli(['release', '--project', f.project, '--run', f.run, '--task', task.id, '--worker', 'a', '--lease', task.lease, '--attempt', String(task.attempt)]);
  assert.equal(released.released, task.id);
});
test('published guidance still accepts runtime 0.8.1 and routes it to the manual workflow', async () => {
  const manifest = JSON.parse(await readFile(new URL('../guidance/manifest.json', import.meta.url), 'utf8'));
  assert.equal(manifest.minimumRuntime, '0.8.1');
  const skill = await readFile(new URL('../SKILL.md', import.meta.url), 'utf8');
  assert.match(skill, /queued workflow needs runtime 0\.9\.0/); assert.match(skill, /0\.8\.x runtime/);
});
test('registered text is pinned: editing the working file changes nothing, and the pinned copy is what quotes check against', async t => {
  const f = await fixture(t), source = await setup(f);
  assert.match(source.pinned, /^research\/sources\/revisions\/[a-f0-9]{64}\.txt$/);
  assert.equal(hash(await readFile(join(f.project, source.pinned))), source.sha256);
  // A selected file is also the person's original, so it is restored before checking the working-copy case below.
  const researcher = await take(f); await submit(f, researcher, finding(source));
  assert.equal((await finish(f)).status, 'complete');
  const g = await fixture(t, { sources: [], allowWeb: true });
  g.run = (await startRun({ project: g.project, topic: 'Found sources', allowWeb: true })).run;
  await submit(g, await take(g), plan);
  await mkdir(join(g.project, 'research/sources'), { recursive: true });
  await writeFile(join(g.project, 'research/sources/orion.md'), reference + '\n');
  const research = await take(g);
  // Inline registration: the result registers its source and cites it by file in one submission.
  await submit(g, research, { register: [{ file: 'research/sources/orion.md', origin: 'https://example.test/orion', title: 'OrionDB guide', publisher: 'Orion', standing: 'primary' }], coverage: 'answered', facts: [{ statement: quote, as_of: null, quotes: [{ file: 'research/sources/orion.md', quote, locator: 'Overview' }] }], gaps: [] });
  await writeFile(join(g.project, 'research/sources/orion.md'), 'Overwritten by another fetch.\n');
  const status = await runStatus(g); assert.equal(status.status, 'in-progress'); assert.deepEqual(status.stale.facts, []);
  const done = await finish(g); assert.equal(done.status, 'complete');
  const exported = JSON.parse(await readFile(done.facts, 'utf8'));
  assert.equal(exported.sources[0].provenance, 'found'); assert.ok(exported.sources[0].pinned);
  assert.equal(exported.facts[0].citations[0].source, exported.sources[0].id);
});
test('a changed original makes only the work resting on it stale, and reassess redoes just that', async t => {
  const f = await fixture(t, { sources: [] });
  const novaText = 'NovaDB permits many concurrent writers per database.' + surroundings.replaceAll('OrionDB', 'NovaDB') + '\n';
  await writeFile(join(f.project, 'sources/nova.txt'), novaText);
  f.run = (await startRun({ project: f.project, topic: 'Two engines', sources: ['sources/reference.txt', 'sources/nova.txt'] })).run;
  const registered = [];
  for (let i = 0; i < 2; i++) { const task = await take(f); const file = task.selected.file; await submit(f, task, { register: [{ file, title: file, publisher: 'Fixture ' + i }] }); registered.push((await runStatus(f)).file); }
  const state0 = JSON.parse(await readFile(registered[0], 'utf8')), [orion, nova] = ['sources/reference.txt', 'sources/nova.txt'].map(file => state0.sources.find(s => s.file === file));
  const twoSections = { scope: 'Writers in two engines.', sections: [{ id: 'orion', name: 'OrionDB' }, { id: 'nova', name: 'NovaDB' }], questions: [{ id: 'orion-writers', section: 'orion', question: 'How many writers does OrionDB permit?' }, { id: 'nova-writers', section: 'nova', question: 'How many writers does NovaDB permit?' }] };
  await submit(f, await take(f), twoSections);
  for (let i = 0; i < 2; i++) {
    const task = await take(f), id = task.questions[0].id;
    await submit(f, task, id === 'orion-writers' ? finding(orion) : { coverage: 'answered', facts: [{ statement: 'NovaDB permits many concurrent writers per database.', as_of: null, quotes: [{ source: nova.id, quote: 'NovaDB permits many concurrent writers per database.' }] }], gaps: [] });
  }
  const complete = await finish(f); assert.equal(complete.status, 'complete');
  await writeFile(join(f.project, 'sources/nova.txt'), novaText.replace('many concurrent', 'two concurrent'));
  const stale = await runStatus(f);
  assert.equal(stale.status, 'stale'); assert.deepEqual(stale.stale.questions, ['nova-writers']); assert.equal(stale.stale.facts.length, 1);
  const brief = await readFile(stale.brief, 'utf8'); assert.match(brief, /OrionDB permits a single writer/); assert.doesNotMatch(brief, /NovaDB permits many/);
  assert.equal((await nextTask({ ...f, worker: 'anyone' })).task, null);
  const reassessing = await reassessRun(f); assert.equal(reassessing.status, 'in-progress'); assert.deepEqual(reassessing.reassessing.questions, ['nova-writers']);
  const reread = await take(f, 'reader'); assert.equal(reread.kind, 'source');
  await submit(f, reread, { register: [{ file: 'sources/nova.txt', title: 'NovaDB notes', publisher: 'Fixture 1' }] });
  const updated = JSON.parse(await readFile(stale.file, 'utf8')).sources.find(s => s.file === 'sources/nova.txt' && !s.stale_since);
  const redo = await take(f, 'researcher-2'); assert.deepEqual(redo.questions.map(q => q.id), ['nova-writers']);
  await submit(f, redo, { coverage: 'answered', facts: [{ statement: 'NovaDB permits two concurrent writers per database.', as_of: null, quotes: [{ source: updated.id, quote: 'NovaDB permits two concurrent writers per database.' }] }], gaps: [] });
  const done = await finish(f); assert.equal(done.status, 'complete');
  const exported = JSON.parse(await readFile(done.facts, 'utf8'));
  assert.equal(exported.facts.filter(fact => fact.status === 'stale').length, 1);
  assert.deepEqual(exported.questions.find(q => q.id === 'orion-writers').facts.length, 1);
  assert.match(exported.questions.find(q => q.id === 'nova-writers').headline.sentence, /two concurrent/);
  assert.equal(exported.reassessments.length, 1);
  assert.match(await readFile(done.report, 'utf8'), /Reassessed after source changes: round 1/);
});
test('plans outside the depth size or uneven across subjects are accepted with warnings shown in the plan and report', async t => {
  const f = await fixture(t, { topic: 'Compare OrionDB and NovaDB' });
  const uneven = { scope: 'Writers.', sections: plan.sections, subjects: [{ id: 'orion', name: 'OrionDB' }, { id: 'nova', name: 'NovaDB' }], questions: [{ id: 'orion-writers', section: 'deployment', subject: 'orion', question: 'How many writers does OrionDB permit?' }] };
  const sourceTask = await take(f); await submit(f, sourceTask, { register: [{ file: 'sources/reference.txt', title: 'Reference', publisher: 'Fixture' }] });
  const planner = await take(f), accepted = await submit(f, planner, uneven);
  assert.ok(accepted.warnings.some(w => /usually plans 15 to 25 questions/.test(w)));
  assert.ok(accepted.warnings.some(w => /does not ask about NovaDB/.test(w)));
  assert.match(await readFile(join(f.project, 'research/plan.md'), 'utf8'), /Plan notes:/);
  const report = await readFile(accepted.report, 'utf8');
  for (const part of [/Plan notes:/, /^Counts: 1 questions/m, /^How facts were checked: not yet checked\./m, /^## Contents/m, /^## Gaps/m, /Sources given: \[1\] Reference/]) assert.match(report, part);
});
test('the command line writes the full task to a file and answers compactly unless asked for everything', async t => {
  const f = await fixture(t);
  const compactTask = await runCli(['next', '--project', f.project, '--run', f.run, '--worker', 'cli-worker']);
  assert.equal(compactTask.tasks, undefined); assert.equal(compactTask.task_summary.leased, 1);
  const saved = JSON.parse(await readFile(join(f.project, compactTask.task.file), 'utf8'));
  assert.equal(saved.id, compactTask.task.id); assert.ok(saved.selected); assert.equal(compactTask.task.selected, undefined);
  const verbose = await runCli(['status', '--project', f.project, '--verbose']); assert.ok(Array.isArray(verbose.tasks));
});
test('trial fixes: gaps name inline files, "partial" coverage is accepted, and sentences may state a fact\'s date', async t => {
  const f = await fixture(t, { sources: [], allowWeb: true });
  f.run = (await startRun({ project: f.project, topic: 'Trial fixes', allowWeb: true })).run;
  await submit(f, await take(f), plan);
  await mkdir(join(f.project, 'research/sources'), { recursive: true });
  await writeFile(join(f.project, 'research/sources/orion.md'), reference + '\n');
  const research = await take(f);
  await submit(f, research, { register: [{ file: 'research/sources/orion.md', origin: 'https://example.test/orion', title: 'OrionDB guide' }], coverage: 'partial', facts: [{ statement: quote, as_of: '2026-10-15', quotes: [{ file: 'research/sources/orion.md', quote }] }], gaps: [{ kind: 'insufficient', reason: 'The guide does not cover replicas.', sources: ['research/sources/orion.md'] }] });
  const checker = await take(f, 'checker'), result = checked(checker);
  result.assessments[0].coverage = 'partial'; await submit(f, checker, result);
  await submit(f, await take(f, 'cross'), {});
  const writer = await take(f, 'writer'), fact = writer.facts[0], q = writer.questions[0];
  await submit(f, writer, { questions: [{ id: q.id, headline: { sentence: 'As of 2026-10-15, OrionDB permits a single writer for each database.', facts: [fact.key] }, answer: [{ sentence: fact.statement, facts: [fact.key] }], gaps: q.gaps }] });
  const exported = JSON.parse(await readFile((await runStatus(f)).facts, 'utf8'));
  assert.equal(exported.questions[0].coverage, 'partly answered'); assert.equal(exported.gaps[0].sources[0], exported.sources[0].id);
});
test('start names a missing project folder plainly, and peek accepts the --harness that next takes', async t => {
  const dir = await realpath(await mkdtemp(join(tmpdir(), 'research-cli-friction-'))); t.after(() => rm(dir, { recursive: true, force: true }));
  const missing = join(dir, 'not-created');
  await assert.rejects(runCli(['start', '--project', missing, '--topic', 'Missing folder']), error => /does not exist/.test(error.message) && error.message.includes(missing) && !/ENOENT/.test(error.message));
  const started = await runCli(['start', '--project', dir, '--topic', 'Peek flags']);
  const peeked = await runCli(['peek', '--project', dir, '--run', started.run, '--worker', 'cc-peek0001', '--harness', 'claude-code']);
  assert.equal(peeked.task.kind, 'plan');
  assert.equal((await runCli(['peek', '--project', dir, '--run', started.run, '--worker', 'cc-peek0001'])).task.id, peeked.task.id);
});
