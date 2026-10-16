// Drives the 0.9.1 commands through an installed harness-research CLI on synthetic projects.
// Usage: node drive.mjs INSTALLED_CLI WORK_DIR OUT_DIR
// Every CLI call is logged (with the work directory replaced by <work>) to OUT_DIR/transcript.jsonl.
import { execFileSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdirSync, writeFileSync, readFileSync, appendFileSync, rmSync, realpathSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';

const [cli, work, out] = process.argv.slice(2);
if (!cli || !work || !out) throw new Error('Usage: node drive.mjs CLI WORK OUT');
rmSync(work, { recursive: true, force: true }); mkdirSync(work, { recursive: true }); mkdirSync(out, { recursive: true });
const log = join(out, 'transcript.jsonl'); writeFileSync(log, '');
const realWork = realpathSync(work), scrub = text => text.split(realWork).join('<work>').split(work).join('<work>');
const checks = [];
const ok = (name, condition, detail = '') => { checks.push({ name, pass: Boolean(condition), ...(detail ? { detail } : {}) }); if (!condition) throw new Error(`Check failed: ${name} ${detail}`); };
let step = 0;
function hr(args, { expectError } = {}) {
  step++;
  let stdout = '', stderr = '', exit = 0;
  try { stdout = execFileSync('node', [cli, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (error) { exit = error.status ?? 1; stdout = error.stdout ?? ''; stderr = error.stderr ?? ''; }
  appendFileSync(log, scrub(JSON.stringify({ step, args, exit, stdout: stdout.trim(), stderr: stderr.trim() })) + '\n');
  if (expectError) { assert.notEqual(exit, 0, `Expected refusal: ${args.join(' ')}`); assert.match(stderr + stdout, expectError); return stderr.trim(); }
  if (exit !== 0) throw new Error(`hr ${args.join(' ')} exited ${exit}: ${stderr}`);
  return JSON.parse(stdout);
}
const id = () => 'cc-' + randomBytes(4).toString('hex');
const read = (project, file) => JSON.parse(readFileSync(join(project, file), 'utf8'));
const write = (project, file, content) => { mkdirSync(join(project, file, '..'), { recursive: true }); writeFileSync(join(project, file), typeof content === 'string' ? content : JSON.stringify(content, null, 2) + '\n'); };

// Synthetic texts. Each is longer than the 280-character minimum for saved sources.
const writerQuote = 'OrionDB permits a single writer for each database.';
const readersQuote = 'Readers never wait for that writer, because each query sees a consistent snapshot taken when it starts.';
const reference = `${writerQuote} ${readersQuote} Replication, backups and retention are described in other references and are not covered here. This synthetic note exists only to exercise the Harness Research helper.\n`;
const crashQuote = 'The engine keeps a write-ahead log, so a crash loses no committed transaction.';
const crashChanged = 'The engine keeps a write-ahead log; since release 4, a crash can lose the last second of committed transactions unless synchronous commit is enabled.';
const webPage = `OrionDB durability overview. ${crashQuote} Checkpoints run every five minutes and truncate the log after the data files are flushed. Backups copy the data files and the log together, and a restore replays the log to the last committed transaction. This synthetic page exists only to exercise refresh.\n`;
const replicationQuote = 'Replication, backups and retention are described in other references and are not covered here.';
const webOrigin = 'https://fixture.invalid/oriondb/durability';

function project(name) {
  const root = join(work, 'projects', name);
  mkdirSync(join(root, 'sources'), { recursive: true }); writeFileSync(join(root, 'sources/reference.txt'), reference);
  return root;
}

// Generic workers for the task kinds the helper hands out. Research, plan and refresh need a handler.
function checked(task) {
  const candidates = task.facts.filter(fact => fact.status === 'candidate');
  return {
    facts: candidates.map(fact => ({ key: fact.key, result: 'confirmed' })),
    inspected_sources: task.sources.filter(source => candidates.some(fact => fact.citations.some(c => c.source === source.id))).map(source => ({ source: source.id, sha256: source.sha256, original_sha256: source.original_sha256, read_original: true })),
    assessments: task.questions.map(q => {
      const supported = task.facts.some(fact => fact.questions.includes(q.id) && ['candidate', 'confirmed'].includes(fact.status));
      return { id: q.id, coverage: supported ? 'answered' : 'not answered', ...(supported ? {} : { gaps: [{ kind: 'insufficient', reason: 'The inspected sources do not answer this.', sources: task.sources.map(s => s.id).slice(0, 1) }] }) };
    }),
  };
}
function writing(task) {
  return { questions: task.questions.map(q => {
    if (q.coverage === 'not answered') return { id: q.id, headline: { kind: 'gap', gaps: q.gaps }, answer: [], gaps: q.gaps };
    const facts = task.facts.filter(f => f.status === 'confirmed' && !f.superseded_by && f.questions.includes(q.id));
    return { id: q.id, headline: { sentence: facts.at(-1).statement, facts: [facts.at(-1).key] }, answer: facts.map(fact => ({ sentence: fact.statement, facts: [fact.key], paragraph: 1 })), gaps: q.gaps };
  }) };
}
const empty = () => ({ merges: [], conflicts: [], superseded: [], missing: [] });

function finish(projectDir, run, handlers = {}) {
  const researchers = new Set(), seen = [];
  for (let i = 0; i < 80; i++) {
    const status = hr(['research', 'status', '--project', projectDir, '--run', run]);
    if (status.status.startsWith('complete')) return { status, seen };
    const peek = hr(['research', 'peek', '--project', projectDir, '--run', run, '--worker', 'cc-peek0000']);
    if (!peek.task) throw new Error(`No task while ${status.status}: ${peek.waiting_for}`);
    const worker = id(); if (peek.task.kind.endsWith('research')) researchers.add(worker);
    const next = hr(['research', 'next', '--project', projectDir, '--run', run, '--worker', worker, '--harness', 'claude-code']);
    const summary = next.task, task = read(projectDir, summary.file), kind = task.kind;
    seen.push({ id: task.id, kind, questions: (task.questions ?? []).map(q => q.id), worker });
    let data;
    if (kind === 'source') data = handlers.source(task);
    else if (kind.endsWith('research')) data = handlers.research(task);
    else if (kind === 'plan') data = handlers.plan(task);
    else if (kind === 'refresh') data = handlers.refresh(task);
    else if (kind.endsWith('cross')) data = empty();
    else if (kind.endsWith('check')) data = checked(task);
    else if (kind === 'write' || kind === 'review') data = writing(task);
    else throw new Error('Unexpected task kind ' + kind);
    const file = `research/work/${task.id}-${task.attempt}.json`; write(projectDir, file, data);
    const result = hr(['research', 'submit', '--project', projectDir, '--run', run, '--task', task.id, '--worker', worker, '--lease', summary.lease, '--attempt', String(summary.attempt), '--file', file]);
    if (!result.accepted) throw new Error(`Refused ${kind}: ${JSON.stringify(result.errors)}`);
  }
  throw new Error('Run did not finish.');
}
// ---------------------------------------------------------------- Project alpha: a finished run.
const alpha = project('team/alpha');
const started = hr(['research', 'start', '--project', alpha, '--topic', 'OrionDB writers and crash safety', '--source', 'sources/reference.txt', '--allow-web', '--depth', 'light']);
const run = started.run;
ok('start creates an in-progress run', started.status === 'in-progress' && /^[a-f0-9]+$/.test(run), started.status);
const plan = { title: 'OrionDB writers and crash safety', scope: 'Synthetic OrionDB writer and durability facts from a selected note and one found page.', sections: [{ id: 'deployment', name: 'Deployment' }, { id: 'safety', name: 'Crash safety' }], subjects: [],
  questions: [{ id: 'writers', section: 'deployment', kind: 'open', question: 'How many writers does OrionDB permit?' }, { id: 'crash', section: 'safety', kind: 'open', question: 'Does OrionDB lose committed transactions in a crash?' }] };
const alphaHandlers = {
  source: task => { write(alpha, 'research/sources/reference.md', reference); return { register: [{ file: 'research/sources/reference.md', title: 'Synthetic OrionDB note', publisher: 'Fixture publisher' }] }; },
  plan: () => plan,
  research: task => {
    const questions = task.questions.map(q => {
      if (q.id === 'writers') return { id: 'writers', coverage: 'answered', gaps: [], facts: [{ statement: writerQuote, as_of: '2026-10-16', quotes: [{ source: task.sources.find(s => !s.origin?.startsWith('http')).id, quote: writerQuote, locator: 'Paragraph 1' }] }] };
      return { id: 'crash', coverage: 'answered', gaps: [], facts: [{ statement: 'OrionDB loses no committed transaction in a crash because it keeps a write-ahead log.', as_of: null, quotes: [{ file: 'research/sources/orion-durability.md', quote: crashQuote, locator: 'Paragraph 1' }] }] };
    });
    if (task.questions.some(q => q.id === 'crash')) { write(alpha, 'research/sources/orion-durability.md', webPage); return { register: [{ file: 'research/sources/orion-durability.md', origin: webOrigin, title: 'OrionDB durability overview', publisher: 'Fixture web', standing: 'primary', source_date: '2026-10-01' }], questions }; }
    return { questions };
  },
};
let done = finish(alpha, run, alphaHandlers);
ok('first pass completes', done.status.status === 'complete', done.status.status);
const alphaFacts = () => read(alpha, 'research/facts.json');
const factFor = (facts, question, status = 'confirmed') => facts.facts.find(f => f.questions.includes(question) && f.status === status);
const writersKey = factFor(alphaFacts(), 'writers').key, crashKey = factFor(alphaFacts(), 'crash').key;

// ---------------------------------------------------------------- verify
write(alpha, 'deck/outline.md', `# OrionDB\n\n- One writer per database [R:${writersKey}]\n- Crash safety [R:${crashKey}] and again [R:${crashKey}]\n`);
let verified = hr(['research', 'verify', '--project', alpha, '--keys', 'deck/outline.md']);
ok('verify reads [R:key] markers from a draft, deduplicated', verified.keys.length === 2);
ok('verify reports both cited keys confirmed', verified.all_confirmed === true && verified.keys.every(k => k.result === 'confirmed'));
const revisionBefore = verified.output_revision;
const gone = hr(['research', 'verify', '--project', alpha, '--key', writersKey, '--key', 'fact-' + '0'.repeat(32), '--key', 'not-a-key']);
ok('verify reports unknown keys as gone', gone.all_confirmed === false && gone.keys.map(k => k.result).join() === 'confirmed,gone,gone');
ok('verify is read-only', hr(['research', 'status', '--project', alpha]).output_revision === revisionBefore);
hr(['research', 'verify', '--project', alpha, '--keys', 'sources/reference.txt'], { expectError: /cites no fact keys/ });

// ---------------------------------------------------------------- approve
hr(['research', 'approve', '--project', alpha, '--by', 'Synthetic Reviewer', '--revision', String(revisionBefore - 1)], { expectError: /changed since output revision/ });
let approved = hr(['research', 'approve', '--project', alpha, '--by', 'Synthetic Reviewer', '--revision', String(revisionBefore)]);
let status = hr(['research', 'status', '--project', alpha]);
ok('approval applies to the revision approved', status.approval?.current === true && status.approval?.by === 'Synthetic Reviewer', JSON.stringify(status.approval));
ok('report records the approval', /Synthetic Reviewer/.test(readFileSync(join(alpha, 'research/report.md'), 'utf8')));

// ---------------------------------------------------------------- reassess --again
hr(['research', 'reassess', '--project', alpha, '--run', run, '--again', 'nope'], { expectError: /Unknown question: nope/ });
const again = hr(['research', 'reassess', '--project', alpha, '--run', run, '--again', 'writers', '--reason', 'Also say whether readers wait for the writer.']);
ok('again opens a round for the chosen question only', again.reassessing?.kind === 'again' && again.reassessing.questions.join() === 'writers', JSON.stringify(again.reassessing));
hr(['research', 'reassess', '--project', alpha, '--run', run, '--again', 'writers'], { expectError: /already in progress/ });
ok('checked fact stays confirmed during the round', hr(['research', 'verify', '--project', alpha, '--key', writersKey]).keys[0].result === 'confirmed');
let againTask;
done = finish(alpha, run, { ...alphaHandlers, research: task => {
  againTask = task;
  return { questions: task.questions.map(q => ({ id: q.id, coverage: 'answered', gaps: [], facts: [{ statement: 'OrionDB readers never wait for the single writer.', as_of: null, quotes: [{ source: task.sources.find(s => !s.origin?.startsWith('http')).id, quote: readersQuote, locator: 'Paragraph 1' }] }] })) };
} });
ok('again researched only writers, with the reason', againTask.questions.map(q => q.id).join() === 'writers' && againTask.again?.reason === 'Also say whether readers wait for the writer.');
ok('again round completes', done.status.status === 'complete');
ok('again round tasks covered one question', done.seen.every(item => item.questions.every(q => q === 'writers')), JSON.stringify(done.seen.map(s => [s.kind, s.questions])));
const afterAgain = alphaFacts();
ok('writers now has two confirmed facts', afterAgain.facts.filter(f => f.questions.includes('writers') && f.status === 'confirmed').length === 2);
ok('facts.json lists the again round', afterAgain.reassessments.some(r => r.kind === 'again' && r.reason === 'Also say whether readers wait for the writer.'));
ok('report discloses the again round', /Researched again on request: round 1/.test(readFileSync(join(alpha, 'research/report.md'), 'utf8')));
status = hr(['research', 'status', '--project', alpha]);
ok('earlier approval no longer applies after the round', status.approval?.current === false, JSON.stringify(status.approval));
approved = hr(['research', 'approve', '--project', alpha, '--by', 'Synthetic Reviewer', '--revision', String(status.output_revision)]);
ok('re-approval applies', hr(['research', 'status', '--project', alpha]).approval?.current === true);

// ---------------------------------------------------------------- refresh
const unchangedOpen = hr(['research', 'refresh', '--project', alpha, '--run', run]);
ok('refresh opens a reading round', unchangedOpen.refreshing?.kind === 'refresh' && unchangedOpen.refreshing.phase === 'reading', JSON.stringify(unchangedOpen.refreshing));
let refreshTask;
done = finish(alpha, run, { ...alphaHandlers,
  refresh: task => { refreshTask = task; write(alpha, 'research/sources/orion-durability-current.md', webPage.replace(crashQuote, crashChanged)); return { sources: task.sources.map(s => ({ source: s.id, read_original: true, file: 'research/sources/orion-durability-current.md' })) }; },
  research: task => {
    const current = task.sources.filter(s => s.origin === webOrigin).at(-1);
    return { questions: task.questions.map(q => ({ id: q.id, coverage: 'answered', gaps: [], facts: [{ statement: 'Since release 4, OrionDB can lose the last second of committed transactions in a crash unless synchronous commit is enabled.', as_of: null, quotes: [{ source: current.id, quote: crashChanged, locator: 'Paragraph 1' }] }] })) };
  } });
ok('refresh task lists only the cited web source and its quoted passage', refreshTask.sources.length === 1 && refreshTask.sources[0].origin === webOrigin && refreshTask.sources[0].quotes.includes(crashQuote), JSON.stringify(refreshTask.sources));
ok('refresh researched again only the question whose passage is gone', done.seen.filter(s => s.kind.endsWith('research')).every(s => s.questions.join() === 'crash'), JSON.stringify(done.seen.map(s => [s.kind, s.questions])));
ok('refresh round completes', done.status.status === 'complete');
const afterRefresh = alphaFacts();
const oldCrash = hr(['research', 'verify', '--project', alpha, '--key', crashKey, '--key', writersKey]);
ok('old crash fact is stale; writers still confirmed', oldCrash.keys[0].result === 'stale' && oldCrash.keys[1].result === 'confirmed', JSON.stringify(oldCrash.keys.map(k => [k.result, k.reason])));
ok('report discloses the refresh round', /Sources re-read: round 2 on \d{4}-\d{2}-\d{2} \(0 unchanged, 1 changed, 0 could not be opened; 1 question researched again\)/.test(readFileSync(join(alpha, 'research/report.md'), 'utf8')));
ok('approval no longer applies after refresh', hr(['research', 'status', '--project', alpha]).approval?.current === false);
status = hr(['research', 'status', '--project', alpha]);
hr(['research', 'approve', '--project', alpha, '--by', 'Synthetic Reviewer', '--revision', String(status.output_revision)]);
const alphaFinal = alphaFacts();
const alphaKeys = alphaFinal.facts.filter(f => f.status === 'confirmed').map(f => f.key).sort();

// ---------------------------------------------------------------- start --from, another project (plain reuse)
const beta = project('blog/beta');
const reused = hr(['research', 'start', '--project', beta, '--from', alpha, '--allow-web']);
ok('reuse from another project completes at once', reused.status === 'complete', reused.status);
ok('a reused run starts unapproved', reused.approval === null || reused.approval?.current === false, JSON.stringify(reused.approval));
const betaFacts = read(beta, 'research/facts.json');
ok('reuse keeps the same confirmed fact keys', betaFacts.facts.filter(f => f.status === 'confirmed').map(f => f.key).sort().join() === alphaKeys.join());
ok('origin approval is kept as history', betaFacts.origins?.[0]?.run === run && betaFacts.origins[0].approvals?.at(-1)?.by === 'Synthetic Reviewer');
ok('report says the origin approval is history', /history and not an approval of this run/.test(readFileSync(join(beta, 'research/report.md'), 'utf8')));
write(beta, 'post.md', `Draft [R:${writersKey}] [R:${crashKey}]\n`);
const betaVerify = hr(['research', 'verify', '--project', beta, '--keys', 'post.md']);
ok('verify in the reusing project: current key confirmed, stale key stays non-confirmed', betaVerify.keys.find(k => k.key === writersKey).result === 'confirmed' && betaVerify.keys.find(k => k.key === crashKey).result !== 'confirmed', JSON.stringify(betaVerify.keys.map(k => [k.key.slice(0, 12), k.result])));

// ---------------------------------------------------------------- start --from, supplied-only reuse leaves web facts out
const delta = project('blog/delta');
const suppliedOnly = hr(['research', 'start', '--project', delta, '--from', alpha]);
ok('supplied-only reuse warns that public-web facts were left out', (suppliedOnly.warnings ?? []).join(' ').includes('public-web'), JSON.stringify(suppliedOnly.warnings));
ok('supplied-only reuse researches the affected question again in an import round', suppliedOnly.reassess?.kind === 'import' && suppliedOnly.reassess.questions.includes('crash'), JSON.stringify(suppliedOnly.reassess));
done = finish(delta, suppliedOnly.run, { research: task => ({ questions: task.questions.map(q => ({ id: q.id, coverage: 'not answered', facts: [], gaps: [{ kind: 'insufficient', reason: 'Only the selected note is permitted and it does not cover crash safety.', sources: task.sources.map(s => s.id).slice(0, 1) }] })) }) });
ok('supplied-only reuse finishes with gaps', done.status.status === 'complete-with-gaps', done.status.status);

// ---------------------------------------------------------------- start --from with a new topic (planner extension)
const gamma = project('decks/gamma');
const extended = hr(['research', 'start', '--project', gamma, '--from', alpha, '--allow-web', '--topic', 'OrionDB writers, crash safety and replication scope']);
let extension;
done = finish(gamma, extended.run, {
  plan: task => { extension = task; return { sections: [{ id: 'replication', name: 'Replication' }], questions: [{ id: 'replication', section: 'replication', kind: 'open', question: 'Does the selected note cover OrionDB replication?' }] }; },
  research: task => ({ questions: task.questions.map(q => ({ id: q.id, coverage: 'answered', gaps: [], facts: [{ statement: 'The selected OrionDB note says replication is described in other references and is not covered there.', as_of: null, quotes: [{ source: task.sources.find(s => !s.origin?.startsWith('http')).id, quote: replicationQuote, locator: 'Paragraph 1' }] }] })) }),
});
ok('extension planner sees the reused questions', extension.existing?.questions?.map(q => q.id).sort().join() === 'crash,writers', JSON.stringify(extension.existing?.questions));
ok('only the new question was researched', done.seen.filter(s => s.kind.endsWith('research')).every(s => s.questions.join() === 'replication'));
const gammaFacts = read(gamma, 'research/facts.json');
ok('extended run completes with reused and new sections', done.status.status === 'complete' && gammaFacts.sections.map(s => s.id).join() === 'deployment,safety,replication', gammaFacts.sections.map(s => s.id).join());
ok('extended run keeps reused keys', alphaKeys.every(key => gammaFacts.facts.some(f => f.key === key && f.status === 'confirmed')));

// ---------------------------------------------------------------- start --from the same project
const sameRun = hr(['research', 'start', '--project', alpha, '--from', alpha, '--allow-web']);
ok('reuse from the same project starts a new run that completes at once', sameRun.run !== run && sameRun.status === 'complete', `${sameRun.run} ${sameRun.status}`);
const sameFacts = alphaFacts();
ok('same-project reuse keeps the same keys and records the earlier run as origin', sameFacts.facts.filter(f => f.status === 'confirmed').map(f => f.key).sort().join() === alphaKeys.join() && sameFacts.origins?.[0]?.run === run);
ok('same-project reuse is unapproved', hr(['research', 'status', '--project', alpha]).approval === null || hr(['research', 'status', '--project', alpha]).approval?.current === false);

// ---------------------------------------------------------------- find
mkdirSync(join(work, 'projects', 'node_modules', 'pkg'), { recursive: true });
execFileSync('cp', ['-R', join(alpha, 'research'), join(work, 'projects', 'node_modules', 'pkg', 'research')]);
const found = hr(['research', 'find', '--in', join(work, 'projects')]);
ok('find lists every project with research, skipping node_modules', found.results.map(r => r.path).sort().join() === 'blog/beta,blog/delta,decks/gamma,team/alpha', found.results.map(r => r.path).join());
const foundGamma = found.results.find(r => r.path === 'decks/gamma');
ok('find reports status, depth and counts', foundGamma.status === 'complete' && foundGamma.depth === 'light' && foundGamma.counts.questions === 3, JSON.stringify(foundGamma));
ok('find reports source age', typeof found.results[0].sources_age_days === 'number');
const queried = hr(['research', 'find', '--in', join(work, 'projects'), '--query', 'REPLICATION']);
ok('find --query matches case-insensitively', queried.results.map(r => r.path).join() === 'decks/gamma', queried.results.map(r => r.path).join());
hr(['research', 'find', '--project', alpha], { expectError: /--in DIR/ });

writeFileSync(join(out, 'checks.json'), JSON.stringify({ cli: scrub(cli), steps: step, passed: checks.filter(c => c.pass).length, failed: checks.filter(c => !c.pass).length, checks }, null, 2) + '\n');
console.log(`${checks.filter(c => c.pass).length}/${checks.length} checks passed in ${step} CLI calls`);
