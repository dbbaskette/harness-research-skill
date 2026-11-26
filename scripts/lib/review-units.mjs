import { readFile, writeFile, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { exists, directory, localFile, readText, atomic, hash, stable, parseJson, identifier, text, acquireLock, releaseLock } from './run-storage.mjs';
import { loadSynthesis, synthesisStatus, recordAssembledReview, writeTemplate } from './synthesis-cli.mjs';
import { verifyCollectionReviewer, collectionGrain } from './collection.mjs';
import { outputPath } from './synthesis-layout.mjs';
import { proseItems } from './synthesis-model.mjs';
import { PROTOCOL, LIMITS, DATA, FINAL, keys, bounded, proseContexts, unitOptions, computePlan, unitTemplate, validateUnitAnswer, independent, checkPins, makeReceipt, checkReceipt, assembleReview } from './review-units-model.mjs';

const OWNER = 'harness-research-review-units';
const STATE = '.harness-research/review-units.json';
const VERSION = 1;
const ACTIONS = ['plan', 'assign', 'template', 'register', 'accept', 'finish', 'retry', 'stop', 'status', 'assemble', 'help'];
const FILE_ACTIONS = ['register', 'accept', 'finish', 'retry'];
const HELP = 'review-units plan [--file OPTIONS.json] | assign|template --unit ID [--out NEW.json] | register|accept|finish|retry --file INPUT.json | stop|status|assemble --project CASE. Independent review of the saved dossier in bounded units with durable receipts, assembled into the ordinary review. The host launches one reviewer invocation per unit, registers its actual identity, enforces budgets and cancels workers; the helper records, checks and assembles. The single synthesis review is unchanged and needs none of this.';
const json = value => JSON.stringify(value, null, 2) + '\n';
const now = () => new Date().toISOString();

function argumentsFor(argv) {
  const action = argv[0] ?? 'help', options = { action };
  if (!ACTIONS.includes(action)) throw new Error(`Unknown review-units action. ${HELP}`);
  for (let i = 1; i < argv.length; i++) {
    const name = argv[i];
    if (name === '--verbose') { if (options.verbose) throw new Error('Duplicate --verbose.'); options.verbose = true; continue; }
    if (!['--project', '--file', '--unit', '--out'].includes(name) || !argv[i + 1] || argv[i + 1].startsWith('--') || options[name.slice(2)]) throw new Error(`Invalid review-units arguments. ${HELP}`);
    options[name.slice(2)] = argv[++i];
  }
  if (action !== 'help' && !options.project) throw new Error('--project is required.');
  if (FILE_ACTIONS.includes(action) && !options.file) throw new Error('--file is required.');
  if (options.file && ![...FILE_ACTIONS, 'plan'].includes(action)) throw new Error('This review-units action does not accept --file.');
  if (['assign', 'template'].includes(action) !== Boolean(options.unit)) throw new Error('--unit belongs to assign and template, and they need it.');
  if (options.out && !['assign', 'template'].includes(action)) throw new Error('--out is only valid for assign and template.');
  return options;
}

async function readState(root) {
  const info = await exists(join(root, STATE));
  if (!info) return null;
  if (!info.isFile() || info.isSymbolicLink()) throw new Error('Review-units state must be a regular owned file.');
  const state = parseJson(await readText(root, STATE));
  if (state.owner !== OWNER || state.schema !== VERSION || state.protocol !== PROTOCOL || !state.plan || !Array.isArray(state.units) || !Array.isArray(state.identities) || !Array.isArray(state.receipts) || !['active', 'stopped'].includes(state.status)) throw new Error('Unrecognized or changed review-units state; preserve and inspect it.');
  bounded(state.generation, 'Review-units generation', 1, Number.MAX_SAFE_INTEGER);
  return state;
}
async function saveState(root, state) { state.updated_at = now(); await atomic(join(root, STATE), json(state)); }
async function immutable(root, name, bytes) {
  const path = join(root, DATA, name), info = await exists(path);
  if (info) {
    if (!info.isFile() || info.isSymbolicLink() || !(await readFile(path)).equals(Buffer.from(bytes))) throw new Error('Immutable review-units record changed; preserve and inspect it.');
  } else await writeFile(path, bytes, { flag: 'wx', mode: 0o600 });
  return `${DATA}/${name}`;
}
async function readPlan(root, state) {
  const bytes = await readFile(await localFile(root, state.plan.file));
  if (hash(bytes) !== state.plan.sha256) throw new Error('Review plan record changed; preserve and inspect it.');
  const plan = parseJson(bytes.toString('utf8'));
  if (hash(stable(plan)) !== state.plan.digest || plan.units.length !== state.units.length || plan.units.some((u, i) => u.id !== state.units[i].id)) throw new Error('Review plan record does not match its state.');
  return plan;
}
const unitRecord = (state, id) => { identifier(id, 'Unit'); const unit = state.units.find(u => u.id === id); if (!unit) throw new Error('Unknown review unit.'); return unit; };
const running = state => state.units.flatMap(u => u.attempts).filter(a => a.started_at && !a.ended_at);
const receiptOf = unit => unit.kept ?? (unit.attempts.at(-1)?.status === 'accepted' ? unit.attempts.at(-1).receipt : null);
// A receipt the host gave up on (retry, an unsuccessful outcome, stop) is retired for good, with why.
const indexed = (state, ref) => ref ? state.receipts.find(e => e.file === ref.file && e.sha256 === ref.sha256) : null;
function retire(state, ref, reason, note) { const entry = indexed(state, ref); if (entry && !entry.retired) entry.retired = { reason, note, at: now() }; }
function usable(state, ref) {
  const entry = indexed(state, ref);
  if (!entry) throw new Error('Review unit receipt is not an accepted receipt of this review.');
  if (entry.retired) throw new Error(`Review unit receipt for ${entry.unit} was retired by ${entry.retired.reason}; review the unit again.`);
}
const unitStatus = unit => unit.kept ? 'kept' : unit.attempts.at(-1)?.status ?? 'pending';

function timing(state, current = Date.now()) {
  const attempts = state.units.flatMap(u => u.attempts), unresolved = attempts.filter(a => a.cancellation_requested_at && !a.ended_at).length;
  const intervals = attempts.filter(a => a.started_at).map(a => [Date.parse(a.started_at), a.ended_at ? Date.parse(a.ended_at) : a.cancellation_requested_at ? Date.parse(a.cancellation_requested_at) : current]).filter(([s, e]) => Number.isFinite(s) && Number.isFinite(e) && e >= s).sort((a, b) => a[0] - b[0]);
  let assistant = 0, active = 0, from = null, until = null;
  for (const [s, e] of intervals) { assistant += e - s; if (from === null) { from = s; until = e; } else if (s <= until) until = Math.max(until, e); else { active += until - from; from = s; until = e; } }
  if (from !== null) active += until - from;
  return { active_wall_seconds: unresolved ? null : active / 1000, assistant_seconds: unresolved ? null : assistant / 1000, observed_active_wall_seconds: active / 1000, observed_assistant_seconds: assistant / 1000, unresolved_invocations: unresolved, dollars: null, note: 'Intervals run from host registration to the accepted answer or host-confirmed terminal context. Costs and process cancellation remain host-owned.' };
}

async function report(root, state, synthesis, check = true) {
  const problems = [];
  const current = synthesis.state.digest === state.plan.state_digest;
  let plan = null;
  try { plan = await readPlan(root, state); } catch (error) { problems.push(error.message); }
  if (plan && current && check) {
    for (const [index, record] of state.units.entries()) {
      const ref = receiptOf(record);
      if (!ref) continue;
      try { usable(state, ref); await checkReceipt(root, synthesis.state, plan.units[index], ref); } catch (error) { problems.push(error.message); }
    }
  }
  const assembled = current && synthesis.state.review?.units?.plan === state.plan.digest;
  const ready = state.units.every(u => receiptOf(u)) && state.units.find(u => u.id === FINAL)?.attempts.at(-1)?.status === 'accepted';
  const phase = problems.length ? 'needs-attention' : !current ? 'needs-plan' : state.status === 'stopped' ? 'stopped' : assembled ? 'assembled' : ready ? 'ready-to-assemble' : 'reviewing';
  const counts = unit => Object.fromEntries(['sources', 'facts', 'findings', 'prose'].map(g => [g, unit.owns[g].length]));
  return { schema: VERSION, protocol: PROTOCOL, status: problems.length ? 'stale' : !current ? 'needs-plan' : state.status, phase, artifact_integrity: problems.length ? 'failed' : 'verified', problems,
    digest: synthesis.state.digest, plan: state.plan.digest, plan_file: state.plan.file, planned_digest: state.plan.state_digest, generation: state.generation,
    grain: plan?.grain ?? null, max_units: state.plan.max_units, max_reviewers: state.max_reviewers, running: running(state).length,
    units: state.units.map((u, i) => ({ id: u.id, kind: plan?.units[i]?.kind ?? null, areas: plan?.units[i]?.areas ?? [], status: unitStatus(u), attempt: u.attempts.at(-1)?.number ?? null, reviewer: u.kept?.reviewer ?? u.attempts.at(-1)?.reviewer ?? null, kept: Boolean(u.kept), owns: plan ? counts(plan.units[i]) : null, given_sources: plan?.units[i]?.given.sources.length ?? null })),
    review_status: synthesis.state.review ? (synthesis.state.review.units ? 'assembled' : 'single') : 'none', timing: timing(state),
    caveat: 'Reviewer registration and invocation identities are supplied by the host; these local records cannot prove identity, semantic truth or actual process cancellation.' };
}

async function grain(root, synthesis) { return synthesis.state.collection ? collectionGrain(root) : null; }
async function fresh(root, synthesis) {
  const current = await synthesisStatus(root, synthesis.state);
  if (current.status === 'stale') throw new Error(`Evidence is stale. Save revised content before review. ${current.problems.join(' ')}`);
  return current;
}
function currentPlan(state, synthesis) {
  if (synthesis.state.digest !== state.plan.state_digest) throw new Error('The saved dossier changed after this plan; run review-units plan for the new digest.');
}

// Keep an earlier accepted content receipt whose basis is unchanged and whose bytes and reviewer still hold.
async function keptReceipt(root, state, synthesis, unit) {
  if (unit.kind !== 'content') return null;
  for (const entry of state.receipts.filter(r => r.basis === unit.basis && !r.retired).reverse()) {
    try {
      await checkReceipt(root, synthesis.state, unit, entry, { reviewer: entry.reviewer, invocation: entry.invocation, attempt: entry.attempt, plan: entry.plan });
      await verifyCollectionReviewer(root, entry.reviewer);
      return { file: entry.file, sha256: entry.sha256, plan: entry.plan, digest: entry.digest, reviewer: entry.reviewer, invocation: entry.invocation, attempt: entry.attempt };
    } catch { /* A receipt that no longer holds is never used. */ }
  }
  return null;
}

async function planAction(root, existing, synthesis, input) {
  const options = unitOptions(input ?? {});
  await fresh(root, synthesis);
  const { plan, digest } = computePlan(synthesis.state, options.max_units, await grain(root, synthesis));
  const bytes = json(plan), file = await immutable(root, `plan-${digest}.json`, bytes);
  if (existing && existing.plan.digest === digest) {
    if (existing.status === 'stopped') {
      if (running(existing).length) throw new Error('Host must confirm every registered review invocation terminal with finish before resuming.');
      existing.status = 'active';
    }
    existing.max_reviewers = options.max_reviewers;
    await saveState(root, existing);
    return existing;
  }
  if (existing) {
    if (running(existing).length) throw new Error('Host must confirm every registered review invocation terminal with finish before replanning; cancellation requests alone do not release capacity.');
    await immutable(root, `history-${existing.generation}-${hash(stable(existing))}.json`, json(existing));
  }
  const state = { owner: OWNER, schema: VERSION, protocol: PROTOCOL, status: 'active', generation: (existing?.generation ?? 0) + 1, max_reviewers: options.max_reviewers,
    plan: { digest, file, sha256: hash(bytes), state_digest: synthesis.state.digest, max_units: options.max_units }, units: [],
    identities: existing?.identities ?? [], receipts: existing?.receipts ?? [], created_at: now(), updated_at: now() };
  for (const unit of plan.units) state.units.push({ id: unit.id, kept: existing ? await keptReceipt(root, state, synthesis, unit) : null, attempts: [] });
  await saveState(root, state);
  return state;
}

function view(synthesis, plan, unit) {
  const d = synthesis.state.dossier, pins = new Map(synthesis.state.sources.map(p => [p.id, p]));
  const source = id => { const s = d.sources.find(x => x.id === id), p = pins.get(id); return { ...s, sha256: p.sha256, snapshot: p.snapshot, ...(p.original_file ? { original_sha256: p.original_sha256, original_snapshot: p.original_snapshot } : {}) }; };
  const fact = id => d.facts.find(f => f.id === id), finding = id => d.findings.find(f => f.id === id);
  const placed = proseContexts(d), prose = new Map(proseItems(d).map(p => [p.id, { ...p, context: placed.get(p.id) }]));
  const items = set => ({ sources: set.sources.map(source), facts: set.facts.map(fact), findings: set.findings.map(finding), prose: set.prose.map(id => prose.get(id)) });
  return { owns: { ...items(unit.owns), assessment: unit.owns.assessment }, given: items(unit.given) };
}

async function assemble(root, state, synthesis) {
  if (state.status === 'stopped') throw new Error('Stopped review units cannot assemble a review.');
  currentPlan(state, synthesis);
  const current = await fresh(root, synthesis);
  const plan = await readPlan(root, state), recomputed = computePlan(synthesis.state, state.plan.max_units, await grain(root, synthesis));
  if (recomputed.digest !== state.plan.digest) throw new Error('Review plan no longer matches the saved dossier; plan again.');
  const entries = [];
  for (const [index, record] of state.units.entries()) {
    const unit = plan.units[index], attempt = record.attempts.at(-1);
    if (unit.kind === 'final' && attempt?.status !== 'accepted') throw new Error('The final unit has no accepted answer for this plan.');
    const ref = record.kept ?? (attempt?.status === 'accepted' ? attempt.receipt : null);
    if (!ref) throw new Error(`Unit ${unit.id} has no kept or accepted receipt.`);
    usable(state, ref);
    const expected = record.kept ? { reviewer: ref.reviewer, invocation: ref.invocation, attempt: ref.attempt, plan: ref.plan } : { reviewer: attempt.reviewer, invocation: attempt.invocation, attempt: attempt.number, plan: state.plan.digest, digest: synthesis.state.digest };
    const receipt = await checkReceipt(root, synthesis.state, unit, ref, expected);
    await verifyCollectionReviewer(root, receipt.reviewer);
    entries.push({ unit, receipt, file: ref.file, sha256: ref.sha256 });
  }
  const review = assembleReview(synthesis.state, plan, state.plan.digest, entries);
  const response = await recordAssembledReview(root, synthesis.state, review, current, synthesis.context);
  return response;
}

export async function runReviewUnitsCli(argv) {
  const options = argumentsFor(argv); if (options.action === 'help') return { usage: HELP, protocol: PROTOCOL, limits: LIMITS };
  const root = await realpath(resolve(options.project)); await directory(join(root, '.harness-research'));
  const lock = join(root, '.harness-research/research.lock'), owned = await acquireLock(lock);
  try {
    await directory(join(root, DATA));
    const synthesis = await loadSynthesis(root);
    let state = await readState(root);
    const input = options.file ? parseJson(await readText(root, options.file)) : null;
    if (options.action === 'plan') { state = await planAction(root, state, synthesis, input); return await report(root, state, synthesis); }
    if (!state) {
      if (options.action === 'status') return { schema: VERSION, protocol: PROTOCOL, status: 'not-planned', phase: 'needs-plan', digest: synthesis.state.digest, plan: null, limits: LIMITS, review_status: synthesis.state.review ? (synthesis.state.review.units ? 'assembled' : 'single') : 'none' };
      throw new Error('No review plan; run review-units plan first.');
    }
    if (options.action === 'status') return await report(root, state, synthesis);
    if (options.action === 'stop') {
      state.status = 'stopped';
      for (const unit of state.units) { const attempt = unit.attempts.at(-1); if (attempt?.status === 'running') { attempt.status = 'cancelled'; attempt.cancellation_requested_at = now(); retire(state, attempt.receipt, 'stop', 'Stopped before acceptance.'); } }
      await saveState(root, state); return await report(root, state, synthesis, false);
    }
    if (options.action === 'finish') {
      keys(input, ['unit', 'reviewer', 'attempt', 'outcome', 'note'], 'host finish');
      identifier(input.reviewer, 'Reviewer'); bounded(input.attempt, 'Host finish attempt', 1, Number.MAX_SAFE_INTEGER);
      if (!['completed', 'failed', 'refused', 'cancelled'].includes(input.outcome)) throw new Error('Host finish outcome must be completed, failed, refused or cancelled.');
      text(input.note, 'Host terminal observation', 20000);
      const attempt = unitRecord(state, input.unit).attempts.find(a => a.number === input.attempt && a.reviewer === input.reviewer);
      if (!attempt) throw new Error('Host finish does not match a registered review invocation.');
      if (attempt.ended_at) { if (attempt.outcome && attempt.outcome !== input.outcome) throw new Error('Host finish conflicts with the recorded terminal observation.'); return await report(root, state, synthesis, false); }
      attempt.ended_at = now(); attempt.outcome = input.outcome; attempt.terminal_note = input.note;
      if (input.outcome !== 'completed') retire(state, attempt.receipt, input.outcome, input.note);
      if (attempt.status === 'running') attempt.status = input.outcome === 'completed' ? 'finished' : input.outcome;
      await saveState(root, state); return await report(root, state, synthesis, false);
    }
    if (options.action === 'retry') {
      keys(input, ['unit', 'reason'], 'retry'); text(input.reason, 'Retry reason', 20000);
      if (state.status !== 'active') throw new Error('Review units are not dispatching retries.');
      currentPlan(state, synthesis);
      const unit = unitRecord(state, input.unit), previous = unit.attempts.at(-1);
      if (previous?.status === 'reserved') throw new Error('A retry is already reserved.');
      if (previous?.status === 'running') { previous.status = 'cancelled'; previous.cancellation_requested_at = now(); }
      retire(state, previous?.receipt, 'retry', input.reason); retire(state, unit.kept, 'retry', input.reason);
      unit.kept = null;
      unit.attempts.push({ number: (previous?.number ?? 0) + 1, status: 'reserved', reason: input.reason });
      await saveState(root, state); return await report(root, state, synthesis, false);
    }
    currentPlan(state, synthesis);
    const plan = await readPlan(root, state);
    const planned = id => plan.units[state.units.indexOf(unitRecord(state, id))];
    if (options.action === 'assign' || options.action === 'template') {
      const record = unitRecord(state, options.unit), unit = planned(options.unit), attempt = record.attempts.at(-1);
      const template = unitTemplate(synthesis.state, state.plan.digest, unit, attempt?.status === 'running' ? attempt : null);
      const value = options.action === 'template' ? template : { schema: VERSION, protocol: PROTOCOL, plan: state.plan.digest, digest: synthesis.state.digest, unit: { id: unit.id, kind: unit.kind, areas: unit.areas, basis: unit.basis, status: unitStatus(record) },
        attempt: attempt ? { number: attempt.number, status: attempt.status, reviewer: attempt.reviewer ?? null } : null,
        context: Object.fromEntries(['topic', 'audience', 'purpose', 'scope', 'source_mode'].map(k => [k, synthesis.state.dossier[k]])),
        outputs: Object.fromEntries(['report.md', 'brief.md', 'evidence.md'].map(n => [n.replace('.md', ''), outputPath(synthesis.state, n)])),
        ...view(synthesis, plan, unit), template, guidance: 'references/review-unit.md' };
      if (!options.out) return value;
      await writeTemplate(root, options.out, value, synthesis.state);
      return { schema: VERSION, protocol: PROTOCOL, plan: state.plan.digest, digest: synthesis.state.digest, unit: unit.id, [options.action === 'template' ? 'template_file' : 'assignment_file']: options.out };
    }
    if (options.action === 'register') {
      keys(input, ['unit', 'reviewer', 'invocation', 'attempt'], 'registration');
      if (state.status !== 'active') throw new Error('Review units are not dispatching new reviews.');
      identifier(input.reviewer, 'Reviewer'); text(input.invocation, 'Actual host invocation', 4000);
      const record = unitRecord(state, input.unit), previous = record.attempts.at(-1);
      if (record.kept) throw new Error('This unit keeps an earlier receipt; retry it to review it again.');
      const number = previous?.status === 'reserved' ? previous.number : (previous?.number ?? 0) + 1;
      if (previous?.status === 'running' && previous.reviewer === input.reviewer && previous.invocation === input.invocation && (input.attempt === undefined || input.attempt === previous.number)) return { ...await report(root, state, synthesis, false), registration: { unit: record.id, plan: state.plan.digest, digest: synthesis.state.digest, ...previous } };
      if (previous && previous.status !== 'reserved') throw new Error('Use retry before registering another attempt.');
      if (input.attempt !== undefined && input.attempt !== number) throw new Error('Registration attempt is stale.');
      independent(synthesis.state, input.reviewer);
      await verifyCollectionReviewer(root, input.reviewer);
      if (state.identities.some(v => v.reviewer === input.reviewer || v.invocation === input.invocation)) throw new Error('Reviewer and invocation must identify a distinct registered context; one invocation cannot claim two units.');
      if (running(state).length >= state.max_reviewers) throw new Error('Reviewer capacity is exhausted.');
      const attempt = { number, reviewer: input.reviewer, invocation: input.invocation, status: 'running', started_at: now() };
      if (previous?.status === 'reserved') record.attempts[record.attempts.length - 1] = attempt; else record.attempts.push(attempt);
      state.identities.push({ reviewer: input.reviewer, invocation: input.invocation, unit: record.id, plan: state.plan.digest });
      await saveState(root, state);
      return { ...await report(root, state, synthesis, false), registration: { unit: record.id, plan: state.plan.digest, digest: synthesis.state.digest, ...attempt } };
    }
    if (options.action === 'accept') {
      if (state.status === 'stopped') throw new Error('Review units stopped; late answers are not accepted.');
      keys(input, ['schema', 'protocol', 'plan', 'digest', 'unit', 'attempt', 'reviewer', 'originals', 'facts', 'findings', 'prose', 'assessment'], 'unit answer');
      const record = unitRecord(state, input.unit), unit = planned(input.unit), attempt = record.attempts.at(-1);
      if (!attempt || attempt.reviewer !== input.reviewer || attempt.number !== input.attempt) throw new Error('Unregistered reviewer or stale attempt.');
      if (!['running', 'finished', 'accepted'].includes(attempt.status)) throw new Error('Review attempt is not active.');
      const answer = validateUnitAnswer(synthesis.state, state.plan.digest, unit, attempt, input);
      await verifyCollectionReviewer(root, attempt.reviewer);
      await checkPins(root, synthesis.state, unit);
      const bytes = json(makeReceipt(synthesis.state, state.plan.digest, unit, attempt, answer)), sha256 = hash(bytes);
      if (attempt.status === 'accepted') {
        if (attempt.receipt.sha256 !== sha256) throw new Error('Attempt already accepted a different answer; use retry.');
        await checkReceipt(root, synthesis.state, unit, attempt.receipt);
        return { ...await report(root, state, synthesis, false), accepted: true, idempotent: true, receipt: attempt.receipt };
      }
      const file = await immutable(root, `receipt-${state.plan.digest.slice(0, 16)}-${unit.id}-${attempt.number}-${sha256}.json`, bytes);
      attempt.receipt = { file, sha256 }; attempt.status = 'accepted'; attempt.ended_at ??= now(); attempt.outcome ??= 'completed';
      state.receipts.push({ plan: state.plan.digest, digest: synthesis.state.digest, unit: unit.id, basis: unit.basis, attempt: attempt.number, reviewer: attempt.reviewer, invocation: attempt.invocation, file, sha256 });
      await saveState(root, state);
      return { ...await report(root, state, synthesis, false), accepted: true, idempotent: false, receipt: attempt.receipt };
    }
    if (options.action === 'assemble') {
      const response = await assemble(root, state, synthesis);
      return { ...response, units_status: await report(root, state, synthesis, false) };
    }
    throw new Error(`Unknown review-units action. ${HELP}`);
  } finally { await releaseLock(lock, owned); }
}
export function reviewUnitsExitCode(action, result) {
  return result?.artifact_integrity === 'failed' || result?.status === 'stale' || (action === 'assemble' && result?.status === 'needs-revision') ? 1 : 0;
}
