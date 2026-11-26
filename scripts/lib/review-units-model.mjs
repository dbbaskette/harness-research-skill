// Review units: the independent review of one saved dossier, split into bounded units with
// explicit ownership, durable receipts and a strict assembly into the ordinary review object.
// Pure planning and checking live here; the command and its state live in review-units.mjs.
import { readFile } from 'node:fs/promises';
import { hash, stable, identifier, text, localFile, parseJson } from './run-storage.mjs';
import { proseItems, digestSource, validateReview } from './synthesis-model.mjs';

export const PROTOCOL = 'harness-review-units-v1';
export const LIMITS = Object.freeze({ max_units: 64, default_max_units: 8, max_reviewers: 3, default_max_reviewers: 3 });
export const DATA = '.harness-research/review-units-data';
export const FINAL = 'final';
const GROUPS = ['facts', 'findings', 'prose'];
const VERDICTS = ['supported', 'unsupported', 'narrow'];
const digestOf = value => hash(stable(value));
export const same = (a, b) => stable(a) === stable(b);
export function keys(value, allowed, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(`Unknown ${label} field: ${key}.`);
}
const list = (value, label) => { if (!Array.isArray(value)) throw new Error(`${label} must be an array.`); return value; };
const choice = (value, options, label) => { if (!options.includes(value)) throw new Error(`${label} must be one of ${options.join(', ')}.`); return value; };
export function bounded(value, label, min, max) {
  if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`${label} must be an integer from ${min} to ${max}.`);
  return value;
}

// Host options. max_units shapes the plan; max_reviewers only limits how many units run at once.
export function unitOptions(input) {
  const value = input ?? {};
  keys(value, ['schema', 'max_units', 'max_reviewers'], 'review-units options');
  if ((value.schema ?? 1) !== 1) throw new Error('Review-units options schema must be 1.');
  return {
    max_units: bounded(value.max_units ?? LIMITS.default_max_units, 'max_units', 1, LIMITS.max_units),
    max_reviewers: bounded(value.max_reviewers ?? LIMITS.default_max_reviewers, 'max_reviewers', 1, LIMITS.max_reviewers),
  };
}

const findingRefs = f => [...new Set([...f.summary.refs, ...f.support, ...f.counter, ...['implications', 'conditions', 'gaps'].flatMap(g => f[g].flatMap(b => b.refs))])];

// The plan is a pure function of the saved state, the collection mappings and max_units.
// Areas: a collection's workstreams (registry mappings), or else each source. A fact belongs to
// its workstream, or else to the area of its first cited source. Findings and prose go to the
// unit owning most of what they cite (ties to the earlier unit); prose citing nothing, and the
// whole-dossier assessment, go to the final unit.
export function computePlan(state, maxUnits, collection = null) {
  bounded(maxUnits, 'max_units', 1, LIMITS.max_units);
  const d = state.dossier, pins = new Map(state.sources.map(p => [p.id, p]));
  const grain = collection ? 'collection' : 'source';
  const sourceArea = new Map(), factArea = new Map(), order = [];
  if (collection) {
    for (const m of collection.mappings) {
      order.push(m.workstream);
      for (const id of Object.values(m.sources)) sourceArea.set(id, m.workstream);
      for (const id of Object.values(m.facts)) factArea.set(id, m.workstream);
    }
  } else {
    for (const s of d.sources) { sourceArea.set(s.id, s.id); order.push(s.id); }
    for (const f of d.facts) factArea.set(f.id, sourceArea.get(f.citations[0]?.source));
  }
  for (const s of d.sources) if (!sourceArea.has(s.id)) throw new Error(`Source ${s.id} has no collection workstream; assemble the collection again.`);
  for (const f of d.facts) if (factArea.get(f.id) === undefined) throw new Error(`Fact ${f.id} has no area.`);
  const used = new Set([...d.sources.map(s => sourceArea.get(s.id)), ...d.facts.map(f => factArea.get(f.id))]);
  const areas = order.filter((a, i) => used.has(a) && order.indexOf(a) === i);
  let groups;
  if (areas.length <= maxUnits) groups = areas.map(a => [a]);
  else {
    // Above the cap, an area's unit depends only on its own key, so other areas' changes do not move it.
    const buckets = new Map();
    for (const a of areas) { const b = parseInt(hash(`review-unit\0${a}`).slice(0, 12), 16) % maxUnits; if (!buckets.has(b)) buckets.set(b, []); buckets.get(b).push(a); }
    groups = [...buckets.values()];
  }
  const units = groups.map(g => ({ id: 'unit-' + digestOf({ grain, areas: g }).slice(0, 16), kind: 'content', areas: g }));
  if (new Set(units.map(u => u.id)).size !== units.length) throw new Error('Review unit identity collision.');
  const areaUnit = new Map(); units.forEach((u, i) => u.areas.forEach(a => areaUnit.set(a, i)));
  const unitOfSource = id => areaUnit.get(sourceArea.get(id)), unitOfFact = id => areaUnit.get(factArea.get(id));
  const plurality = indexes => {
    const counts = new Map(); for (const i of indexes) counts.set(i, (counts.get(i) ?? 0) + 1);
    let best = -1, most = 0; for (const [i, n] of [...counts].sort((a, b) => a[0] - b[0])) if (n > most) { best = i; most = n; }
    return best;
  };
  const factById = new Map(d.facts.map(f => [f.id, f])), findingById = new Map(d.findings.map(f => [f.id, f]));
  const sourceById = new Map(d.sources.map(s => [s.id, s])), prose = proseItems(d), proseById = new Map(prose.map(p => [p.id, p]));
  const findingUnit = new Map(d.findings.map(f => [f.id, plurality(findingRefs(f).map(unitOfFact))]));
  const refUnit = id => factById.has(id) ? unitOfFact(id) : findingUnit.get(id);
  const empty = () => ({ sources: [], facts: [], findings: [], prose: [], assessment: false });
  const owns = units.map(empty), finalOwns = { ...empty(), assessment: true };
  for (const s of d.sources) owns[unitOfSource(s.id)].sources.push(s.id);
  for (const f of d.facts) owns[unitOfFact(f.id)].facts.push(f.id);
  for (const f of d.findings) { const i = findingUnit.get(f.id); (i < 0 ? finalOwns : owns[i]).findings.push(f.id); }
  for (const p of prose) { const i = plurality([...new Set(p.refs)].map(refUnit)); (i < 0 ? finalOwns : owns[i]).prose.push(p.id); }
  const ordered = (ids, all) => all.filter(id => ids.has(id));
  function given(o) {
    const g = { sources: new Set(), facts: new Set(), findings: new Set() };
    const fact = id => { g.facts.add(id); for (const c of factById.get(id).citations) g.sources.add(c.source); };
    const finding = id => { g.findings.add(id); findingRefs(findingById.get(id)).forEach(fact); };
    o.facts.forEach(fact); o.findings.forEach(finding);
    for (const id of o.prose) for (const ref of proseById.get(id).refs) (factById.has(ref) ? fact : finding)(ref);
    for (const group of ['sources', 'facts', 'findings']) for (const id of o[group]) g[group].delete(id);
    return { sources: ordered(g.sources, [...sourceById.keys()]), facts: ordered(g.facts, [...factById.keys()]), findings: ordered(g.findings, [...findingById.keys()]), prose: [] };
  }
  const finalGiven = { sources: [...sourceById.keys()], facts: [...factById.keys()], findings: d.findings.map(f => f.id).filter(id => !finalOwns.findings.includes(id)), prose: prose.map(p => p.id).filter(id => !finalOwns.prose.includes(id)) };
  const context = { topic: d.topic, audience: d.audience, purpose: d.purpose, scope: d.scope, source_mode: d.source_mode };
  const view = { sources: id => ({ record: sourceById.get(id), pin: digestSource(pins.get(id)) }), facts: id => factById.get(id), findings: id => findingById.get(id), prose: id => proseById.get(id) };
  const content = set => Object.fromEntries(['sources', ...GROUPS].map(g => [g, set[g].map(view[g])]));
  const basis = (kind, o, g) => digestOf({ protocol: PROTOCOL, kind, context, owns: { ...content(o), assessment: o.assessment }, given: content(g) });
  const planned = [...units.map((u, i) => { const g = given(owns[i]); return { ...u, owns: owns[i], given: g, basis: basis('content', owns[i], g) }; }),
    { id: FINAL, kind: 'final', areas: [], owns: finalOwns, given: finalGiven, basis: basis('final', finalOwns, finalGiven) }];
  const plan = { schema: 1, protocol: PROTOCOL, digest: state.digest, grain, ...(collection ? { registry_digest: collection.registry_digest } : {}), max_units: maxUnits, units: planned };
  checkOwnership(state, plan);
  return { plan, digest: digestOf(plan) };
}

// Every source attestation, fact, finding and prose item is owned exactly once; the assessment once.
export function checkOwnership(state, plan) {
  const expected = { sources: state.sources.map(s => s.id), facts: state.dossier.facts.map(f => f.id), findings: state.dossier.findings.map(f => f.id), prose: proseItems(state.dossier).map(p => p.id) };
  for (const group of Object.keys(expected)) {
    const owned = plan.units.flatMap(u => u.owns[group]);
    if (owned.length !== expected[group].length || !same([...owned].sort(), [...expected[group]].sort())) throw new Error(`Review plan must own every ${group} item exactly once.`);
  }
  if (plan.units.filter(u => u.owns.assessment).length !== 1 || !plan.units.at(-1).owns.assessment) throw new Error('Review plan must give the assessment to the final unit only.');
}

export const ownerOf = plan => {
  const owners = new Map();
  for (const unit of plan.units) for (const group of ['sources', ...GROUPS]) for (const id of unit.owns[group]) owners.set(`${group}\0${id}`, unit.id);
  return owners;
};

// The template a unit reviewer fills: the same per-item fields as the single review template.
export function unitTemplate(state, planDigest, unit, attempt = null) {
  const pins = new Map(state.sources.map(p => [p.id, p]));
  return { schema: 1, protocol: PROTOCOL, plan: planDigest, digest: state.digest, unit: unit.id, attempt: attempt?.number ?? null, reviewer: attempt?.reviewer ?? null,
    originals: unit.owns.sources.map(id => { const s = pins.get(id); return { source: id, sha256: s.sha256, ...(s.original_file ? { original_sha256: s.original_sha256 } : {}), read_original: false }; }),
    ...Object.fromEntries(GROUPS.map(g => [g, unit.owns[g].map(id => ({ id, verdict: 'pending', note: '' }))])),
    ...(unit.owns.assessment ? { assessment: { coverage: 'pending', usefulness: 'pending', note: '' } } : {}) };
}

// The same checks validateReview applies, restricted to what this unit owns.
export function validateUnitItems(state, unit, answer) {
  const pins = new Map(state.sources.map(p => [p.id, p]));
  list(answer.originals, 'Unit originals');
  if (answer.originals.length !== unit.owns.sources.length || new Set(answer.originals.map(o => o?.source)).size !== unit.owns.sources.length) throw new Error('A unit answer must cover every original source it owns exactly once.');
  for (const id of unit.owns.sources) {
    const item = answer.originals.find(o => o?.source === id), pin = pins.get(id);
    if (!item) throw new Error(`Missing unit original ${id}.`);
    keys(item, ['source', 'sha256', 'original_sha256', 'read_original', 'access_error'], 'unit original');
    if (item.sha256 !== pin.sha256 || (pin.original_file && item.original_sha256 !== pin.original_sha256) || typeof item.read_original !== 'boolean') throw new Error('Review must attest reading each exact original source capture.');
    if (!item.read_original) text(item.access_error, 'Original access_error');
  }
  for (const group of GROUPS) {
    list(answer[group], `Unit ${group}`);
    if (answer[group].length !== unit.owns[group].length || new Set(answer[group].map(r => r?.id)).size !== unit.owns[group].length) throw new Error(`A unit answer must cover each ${group} item it owns exactly once.`);
    for (const id of unit.owns[group]) {
      const item = answer[group].find(r => r?.id === id);
      if (!item) throw new Error(`Missing review ${id}.`);
      keys(item, ['id', 'verdict', 'note'], `unit ${group} item`);
      choice(item.verdict, VERDICTS, 'Review verdict'); text(item.note, 'Review explanation', 20000);
    }
  }
  if (unit.owns.assessment) {
    keys(answer.assessment, ['coverage', 'usefulness', 'note'], 'assessment');
    choice(answer.assessment.coverage, ['accurate', 'needs-revision'], 'Coverage assessment'); choice(answer.assessment.usefulness, ['adequate', 'needs-revision'], 'Usefulness assessment'); text(answer.assessment.note, 'Assessment explanation', 20000);
  } else if (answer.assessment !== undefined) throw new Error('Only the final unit answers the whole-dossier assessment.');
  return structuredClone({ originals: answer.originals, facts: answer.facts, findings: answer.findings, prose: answer.prose, ...(unit.owns.assessment ? { assessment: answer.assessment } : {}) });
}

export function independent(state, reviewer) {
  identifier(reviewer, 'Reviewer');
  if ([state.author, ...state.dossier.facts.map(f => f.author)].includes(reviewer)) throw new Error('Review requires an independent worker distinct from every content author.');
}

export function validateUnitAnswer(state, planDigest, unit, attempt, answer) {
  keys(answer, ['schema', 'protocol', 'plan', 'digest', 'unit', 'attempt', 'reviewer', 'originals', 'facts', 'findings', 'prose', 'assessment'], 'unit answer');
  if (answer.schema !== 1 || answer.protocol !== PROTOCOL) throw new Error(`Unit answer needs schema 1 and protocol ${PROTOCOL}.`);
  if (answer.plan !== planDigest || answer.digest !== state.digest) throw new Error('Unit answer belongs to a stale plan or digest.');
  if (answer.unit !== unit.id || answer.attempt !== attempt.number || answer.reviewer !== attempt.reviewer) throw new Error('Unit answer does not match the registered reviewer and attempt.');
  independent(state, attempt.reviewer);
  return validateUnitItems(state, unit, answer);
}

const pinRecord = (pin, role) => ({ role, source: pin.id, file: pin.file, sha256: pin.sha256, snapshot: pin.snapshot, ...(pin.original_file ? { original_file: pin.original_file, original_sha256: pin.original_sha256, original_snapshot: pin.original_snapshot } : {}) });
const unitPins = (state, unit) => {
  const pins = new Map(state.sources.map(p => [p.id, p]));
  return [...unit.owns.sources.map(id => pinRecord(pins.get(id), 'owned')), ...unit.given.sources.map(id => pinRecord(pins.get(id), 'given'))];
};

// Every byte a unit attested or was given, read again now.
export async function checkPins(root, state, unit) {
  for (const pin of unitPins(state, unit)) {
    const files = [[pin.file, pin.sha256], [pin.snapshot, pin.sha256], ...(pin.original_file ? [[pin.original_file, pin.original_sha256], [pin.original_snapshot, pin.original_sha256]] : [])];
    for (const [file, expected] of files) {
      let actual = null;
      try { actual = hash(await readFile(await localFile(root, file))); } catch { /* reported below */ }
      if (actual !== expected) throw new Error(`Pinned review bytes changed or unavailable for ${pin.source}: ${file}.`);
    }
  }
}

export function makeReceipt(state, planDigest, unit, attempt, answer) {
  return { schema: 1, protocol: PROTOCOL, kind: 'review-unit-receipt', plan: planDigest, digest: state.digest, unit: unit.id, unit_kind: unit.kind, basis: unit.basis, attempt: attempt.number, reviewer: attempt.reviewer, invocation: attempt.invocation, owns: unit.owns, given: unit.given, pins: unitPins(state, unit), answer };
}
const RECEIPT = ['schema', 'protocol', 'kind', 'plan', 'digest', 'unit', 'unit_kind', 'basis', 'attempt', 'reviewer', 'invocation', 'owns', 'given', 'pins', 'answer'];

// A receipt is used only while its file, its unit's basis, its pins and its reviewer still hold.
export async function checkReceipt(root, state, unit, ref, expected = {}) {
  let bytes;
  try { bytes = await readFile(await localFile(root, ref.file)); } catch { throw new Error(`Review unit receipt for ${unit.id} is unavailable.`); }
  if (hash(bytes) !== ref.sha256) throw new Error(`Review unit receipt for ${unit.id} changed.`);
  const receipt = parseJson(bytes.toString('utf8'));
  keys(receipt, RECEIPT, 'review unit receipt');
  if (receipt.schema !== 1 || receipt.protocol !== PROTOCOL || receipt.kind !== 'review-unit-receipt') throw new Error('Unrecognized review unit receipt.');
  if (receipt.unit_kind !== unit.kind || receipt.basis !== unit.basis || !same(receipt.owns, unit.owns) || !same(receipt.given, unit.given) || !same(receipt.pins, unitPins(state, unit))) throw new Error(`Review unit receipt for ${unit.id} is stale; its unit changed.`);
  for (const [key, value] of Object.entries(expected)) if (value !== undefined && receipt[key] !== value) throw new Error(`Review unit receipt for ${unit.id} ${['plan', 'digest'].includes(key) ? 'belongs to another plan or digest' : 'does not match its registered review'}.`);
  identifier(receipt.reviewer, 'Reviewer'); text(receipt.invocation, 'Reviewer invocation', 4000);
  independent(state, receipt.reviewer);
  await checkPins(root, state, unit);
  if (!same(validateUnitItems(state, unit, receipt.answer), receipt.answer)) throw new Error('Review unit receipt answer is not normalized.');
  return receipt;
}

// Deterministic assembly in template order. entries: one {unit, receipt, file, sha256} per plan unit.
export function assembleReview(state, plan, planDigest, entries) {
  const byUnit = new Map();
  for (const entry of entries) {
    if (byUnit.has(entry.unit.id)) throw new Error(`Duplicate receipt for unit ${entry.unit.id}.`);
    if (!plan.units.some(u => u.id === entry.unit.id)) throw new Error(`Receipt for unit ${entry.unit.id} is not in this plan.`);
    byUnit.set(entry.unit.id, entry);
  }
  for (const unit of plan.units) if (!byUnit.has(unit.id)) throw new Error(`Unit ${unit.id} has no kept or accepted receipt.`);
  const ordered = plan.units.map(u => byUnit.get(u.id));
  for (const label of ['reviewer', 'invocation']) if (new Set(ordered.map(e => e.receipt[label])).size !== ordered.length) throw new Error('Each unit needs its own reviewer and invocation; one invocation cannot answer two units.');
  for (const { unit, receipt } of ordered) {
    if (receipt.basis !== unit.basis) throw new Error(`Receipt for unit ${unit.id} is stale.`);
    if (receipt.plan === planDigest ? receipt.digest !== state.digest : unit.kind === 'final') throw new Error(`Receipt for unit ${unit.id} belongs to another plan or digest.`);
  }
  const owners = ownerOf(plan), answer = (group, id) => byUnit.get(owners.get(`${group}\0${id}`)).receipt.answer;
  const pick = (group, id, key) => answer(group, id)[group === 'sources' ? 'originals' : group].find(item => item[key] === id);
  const review = { schema: 2, digest: state.digest,
    originals: state.sources.map(s => pick('sources', s.id, 'source')),
    facts: state.dossier.facts.map(f => pick('facts', f.id, 'id')),
    findings: state.dossier.findings.map(f => pick('findings', f.id, 'id')),
    prose: proseItems(state.dossier).map(p => pick('prose', p.id, 'id')),
    assessment: byUnit.get(FINAL).receipt.answer.assessment,
    reviewers: ordered.map(e => e.receipt.reviewer).sort(),
    units: { schema: 1, protocol: PROTOCOL, plan: planDigest, grain: plan.grain, max_units: plan.max_units,
      receipts: ordered.map(({ unit, receipt, file, sha256 }) => ({ unit: unit.id, kind: unit.kind, reviewer: receipt.reviewer, invocation: receipt.invocation, attempt: receipt.attempt, plan: receipt.plan, digest: receipt.digest, basis: receipt.basis, kept: receipt.plan !== planDigest, file, sha256 })) } };
  // The single-review validator decides structure and acceptance, once per actual reviewer.
  let accepted = null;
  for (const reviewer of review.reviewers) accepted = validateReview(state, review, reviewer).accepted;
  return { ...review, accepted };
}

// Re-run on every status and verify, as the collection registry is.
export async function checkAssembledReview(root, state, collection) {
  const review = state.review, u = review.units;
  keys(u, ['schema', 'protocol', 'plan', 'grain', 'max_units', 'receipts'], 'assembled review units');
  if (u.schema !== 1 || u.protocol !== PROTOCOL || !Array.isArray(u.receipts)) throw new Error('Unrecognized assembled review.');
  if ((u.grain === 'collection') !== Boolean(collection)) throw new Error('Assembled review plan no longer matches the saved collection provenance.');
  const { plan, digest } = computePlan(state, u.max_units, collection);
  if (digest !== u.plan) throw new Error('Assembled review plan no longer matches the saved dossier.');
  const entries = [];
  for (const entry of u.receipts) {
    const unit = plan.units.find(x => x.id === entry?.unit);
    if (!unit) throw new Error('Assembled review names a unit outside its plan.');
    const receipt = await checkReceipt(root, state, unit, entry, { reviewer: entry.reviewer, invocation: entry.invocation, attempt: entry.attempt, plan: entry.plan, digest: entry.digest });
    entries.push({ unit, receipt, file: entry.file, sha256: entry.sha256 });
  }
  const rebuilt = assembleReview(state, plan, digest, entries);
  const { accepted: _stored, ...stored } = review, { accepted, ...fresh } = rebuilt;
  if (!same(stored, fresh)) throw new Error('Assembled review does not match its receipts.');
  return accepted;
}
