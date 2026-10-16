import { readFile, readdir, realpath } from 'node:fs/promises';
import { join, resolve, relative, dirname, isAbsolute } from 'node:path';
import { hash, stable, clone, exists, readText, snapshot, parseJson, identifier } from './run-storage.mjs';
import { factFor } from './run-evidence.mjs';
import { validateFacts } from './run-schema.mjs';

const regular = async path => { const info = await exists(path); return info?.isFile() && !info.isSymbolicLink() ? info : null; };
// Reuse reads the portable research/ folder: its committed manifest, facts.json and pinned source
// text. Another project's private .harness-research queue is never needed.
export async function readOrigin(root, supplied) {
  const base = await realpath(isAbsolute(supplied) ? supplied : resolve(root, supplied)).catch(() => { throw new Error(`No saved research at ${supplied}.`); });
  let folder = base, owner = dirname(base);
  if (await regular(join(base, 'research', 'output.json'))) { folder = join(base, 'research'); owner = base; }
  else if (!await regular(join(base, 'output.json'))) throw new Error(`No saved research at ${supplied}: expected research/output.json.`);
  const label = relative(root, owner) || '.';
  const manifest = JSON.parse(await readFile(join(folder, 'output.json'), 'utf8'));
  if (manifest.owner !== 'harness-research-output' || manifest.schema !== 1) throw new Error(`${label}: research/output.json is not a harness-research output.`);
  const bytes = await regular(join(folder, 'facts.json')) ? await readFile(join(folder, 'facts.json')) : null;
  if (!bytes) throw new Error(`${label}: research/facts.json is missing.`);
  if (hash(bytes) !== manifest.files?.['facts.json']) throw new Error(`${label}: research/facts.json does not match its output.json (an interrupted or edited export). Run research status in that project, then try again.`);
  const facts = validateFacts(parseJson(bytes.toString('utf8')));
  if (facts.run !== manifest.run || facts.output_revision !== manifest.output_revision) throw new Error(`${label}: facts.json and output.json name different runs or revisions.`);
  return { label, owner, folder, facts };
}
// Paths under research/ belong to the research folder itself, wherever it was copied; other paths
// (selected originals) are relative to the project that holds it.
const located = (origin, name) => name.startsWith('research/') ? [origin.folder, name.slice('research/'.length)] : [origin.owner, name];
const readHashed = (origin, name) => { const [base, rest] = located(origin, name); return readText(base, rest, { withHash: true }).catch(() => null); };
// The saved text a fact was checked against. A pinned copy that is present but no longer matches its
// hash was altered, and is refused; runs saved before pinning checked quotes against the working file.
async function savedText(origin, source) {
  for (const name of [...new Set([source.pinned, `research/sources/revisions/${source.sha256}.txt`].filter(Boolean))]) {
    const [base, rest] = located(origin, name);
    if (!await exists(join(base, rest))) continue;
    const read = await readHashed(origin, name);
    if (read?.sha256 !== source.sha256) throw new Error(`${origin.label}: the saved text of source ${source.id} (${name}) was altered after it was checked. Reuse an intact copy.`);
    return read.content;
  }
  const working = source.file ? await readHashed(origin, source.file) : null;
  return working?.sha256 === source.sha256 ? working.content : null;
}
// Keep an ID when it is free or names the same thing; otherwise number it, so origins never collide.
function place(list, item, same) {
  identifier(item.id);
  for (let n = 1; ; n++) {
    const id = n === 1 ? item.id : `${item.id.slice(0, 62 - String(n).length)}-${n}`, other = list.find(entry => entry.id === id);
    if (!other) { list.push({ ...item, id }); return [id, true]; }
    if (same(other, { ...item, id })) return [id, false];
  }
}
const sameQuestion = (a, b) => stable([a.question, a.section, a.subject, a.kind, a.claim ?? null]) === stable([b.question, b.section, b.subject, b.kind, b.claim ?? null]);
const answerOf = (question, facts) => stable([question.coverage, question.verdict ?? null, question.headline ?? null, question.answer ?? null, [...facts].sort()]);
const CURRENCY = { rejected: 0, stale: 1, candidate: 2, confirmed: 3 };
const UNSAVED = 'Its saved source text was not available when this research was reused.';
// Bring earlier research into a new run with its keys unchanged. Checked work comes across only when
// its saved evidence still matches; what cannot be carried is researched again, never assumed.
// Nothing is written here: the pinned texts to save are returned with the questions to research and
// check again, the answers to rewrite, and selected originals that changed and must be read again.
export async function importOrigins(root, state, origins, at) {
  const research = new Set(), rewrite = new Set(), warnings = [], texts = new Map(), pins = new Map(), reselect = [], excludedAll = new Set(), answers = new Map();
  const suppliedOnly = state.sourceMode === 'supplied-only';
  state.origins = [];
  for (const origin of origins) {
    const data = origin.facts, notes = [], sectionId = new Map(), subjectId = new Map(), questionId = new Map(), excluded = new Set(), unusable = new Map();
    for (const section of data.sections ?? []) sectionId.set(section.id, place(state.sections, clone(section), (a, b) => a.name === b.name)[0]);
    for (const subject of data.subjects ?? []) subjectId.set(subject.id, place(state.subjects, clone(subject), (a, b) => a.name === b.name)[0]);
    const subjectOf = id => id == null ? null : subjectId.get(id) ?? null, staleInOrigin = new Set(data.stale_questions ?? []), changedInOrigin = new Set(data.stale_inputs ?? []);
    for (const exported of data.questions) {
      if (exported.kind === 'claim') {
        const claim = exported.claim, length = Array.from(claim?.quote ?? '').length;
        const present = claim && await readText(root, claim.file).then(content => Array.from(content).slice(claim.start, claim.start + length).join('') === claim.quote, () => false);
        if (!present) { notes.push(`Claim question ${exported.id} was left out: its claim target is not in this project unchanged.`); continue; }
        if (!state.claims.some(item => stable(item) === stable(claim))) { state.claims.push(clone(claim)); state.inputs.push(await snapshot(root, claim.file)); }
      }
      const { facts: exportedFacts = [], ...question } = clone(exported);
      Object.assign(question, { section: sectionId.get(question.section), subject: subjectOf(question.subject), researchWorkers: [], provisionalCoverage: null, gaps: question.gaps ?? [] });
      const [id, fresh] = place(state.questions, question, sameQuestion);
      questionId.set(exported.id, id);
      // A question another origin also answered is assessed again unless both say the same thing.
      if (!fresh) { if (answers.get(id) !== answerOf(question, exportedFacts)) research.add(id); continue; }
      answers.set(id, answerOf(question, exportedFacts));
      if (!question.assessment || staleInOrigin.has(exported.id)) research.add(id);
      else if (!question.headline) rewrite.add(id);
    }
    for (const source of data.sources) {
      const selected = source.given ?? source.imported?.given ?? null;
      // A supplied-only run uses sources a person selected, never ones found on the public web.
      if (suppliedOnly && !selected) { excluded.add(source.id); excludedAll.add(source.id); continue; }
      const existing = state.sources.find(item => item.id === source.id);
      if (existing) {
        if (existing.sha256 !== source.sha256 || existing.origin !== source.origin) throw new Error(`${origin.label}: source ${source.id} differs from the source with that ID in other reused research.`);
        if (existing.imported?.unusable) unusable.set(source.id, existing.imported.unusable);
        continue;
      }
      const record = { ...clone(source), given: null, imported: { from: origin.label, run: data.run, given: selected, file: source.file, original_file: source.original_file } };
      const content = source.sha256 ? await savedText(origin, source) : null;
      if (content !== null) { record.pinned = `research/sources/revisions/${source.sha256}.txt`; record.file = record.pinned; texts.set(source.sha256, content); pins.set(source.sha256, content); }
      else { Object.assign(record, { file: null, pinned: null }); if (source.sha256) unusable.set(source.id, UNSAVED); }
      // A selected original is tracked only when this project has the same file. When it is here
      // but changed, or changed in the research it came from, what rests on it is out of date.
      if (source.original_file && source.original_sha256) {
        const local = await snapshot(root, source.original_file).catch(() => null);
        if (!local) record.original_file = null;
        else if (local.sha256 !== source.original_sha256) {
          unusable.set(source.id, 'Its selected original has changed since it was checked.');
          if (selected) reselect.push({ origin: source.origin, title: source.title, file: source.original_file });
        }
      }
      if ([source.file, source.original_file, source.pinned].some(name => name && changedInOrigin.has(name))) unusable.set(source.id, 'It had changed in the research it came from.');
      if (unusable.has(source.id)) { record.stale_since ??= at; record.imported.unusable = unusable.get(source.id); }
      state.sources.push(record);
    }
    const unsaved = [...unusable.values()].filter(reason => reason === UNSAVED).length;
    if (unsaved) notes.push(`${unsaved} source${unsaved === 1 ? '' : 's'} came without saved text; facts resting on them are stale and their questions are researched again.`);
    if (unusable.size > unsaved) notes.push(`${unusable.size - unsaved} source${unusable.size - unsaved === 1 ? ' has' : 's have'} changed since checked; facts resting on them are stale and their questions are researched again.`);
    let left = 0;
    for (const exported of [...data.facts, ...data.rejected.map(fact => ({ ...fact, status: 'rejected' }))]) {
      const { sources_count: _count, best_standing: _standing, ...fact } = clone(exported);
      const questions = [...new Set(fact.questions.map(id => questionId.get(id)).filter(Boolean))], cited = [...new Set(fact.citations.map(citation => citation.source))];
      // Unchecked candidates never become confirmed by import; their questions are researched again.
      if (fact.status === 'candidate') { questions.forEach(id => research.add(id)); continue; }
      if (!questions.length) continue;
      if (cited.some(id => excluded.has(id))) { if (fact.status === 'confirmed') { left++; questions.forEach(id => research.add(id)); } continue; }
      if (fact.status === 'confirmed' && (!fact.check?.by || fact.check.by === fact.authored_by)) throw new Error(`${origin.label}: fact ${fact.key} is confirmed without an independent check, so the research was edited. Reuse an intact copy.`);
      for (const citation of fact.citations) {
        const source = state.sources.find(item => item.id === citation.source);
        if (!source || !source.sha256) throw new Error(`${origin.label}: fact ${fact.key} cites ${citation.source}, which has no saved text to quote, so the research was edited. Reuse an intact copy.`);
        const content = texts.get(source.sha256);
        if (content === undefined) continue;
        const placed = Array.from(content).slice(citation.start, citation.start + Array.from(citation.quote).length).join('');
        if (placed !== citation.quote || hash(citation.quote) !== citation.quote_sha256 || citation.source_sha256 !== source.sha256) throw new Error(`${origin.label}: fact ${fact.key} does not match its saved source text, so the research was edited after it was checked. Reuse an intact copy.`);
      }
      const outdated = cited.filter(id => unusable.has(id));
      if (fact.status === 'confirmed' && outdated.length) {
        fact.status = 'stale'; fact.stale = { at, sources: outdated, reason: unusable.get(outdated[0]) };
        questions.forEach(id => research.add(id));
      } else if (fact.status === 'stale') fact.stale ??= { at, sources: [], reason: 'A cited source had changed in the research it came from.' };
      Object.assign(fact, { questions, section: sectionId.get(fact.section) ?? fact.section, subject: subjectOf(fact.subject) });
      const existing = state.facts.find(item => item.key === fact.key);
      if (existing) {
        if (existing.statement !== fact.statement || stable(existing.citations.map(c => [c.source, c.quote_sha256])) !== stable(fact.citations.map(c => [c.source, c.quote_sha256]))) throw new Error(`${origin.label}: fact ${fact.key} differs from the fact with that key in other reused research.`);
        existing.questions = [...new Set([...existing.questions, ...questions])];
        // The same assertion from two origins keeps the less current of their states.
        if (CURRENCY[fact.status] < CURRENCY[existing.status]) Object.assign(existing, { status: fact.status, check: fact.check, ...(fact.stale ? { stale: fact.stale } : {}) });
        existing.superseded_by ??= fact.superseded_by;
      } else state.facts.push(fact);
    }
    if (left) notes.push(`${left} fact${left === 1 ? '' : 's'} resting on public-web sources ${left === 1 ? 'was' : 'were'} left out: this run uses selected sources only. Their questions are researched again.`);
    for (const alias of data.aliases) if (!state.aliases.some(item => item.key === alias.key)) state.aliases.push(clone(alias));
    for (const revision of data.revisions) if (!state.factRevisions.some(item => stable([item.previous.key, item.current, item.kind]) === stable([revision.previous.key, revision.current, revision.kind]))) state.factRevisions.push(clone(revision));
    for (const conflict of data.conflicts ?? []) if (!state.conflicts.some(item => stable(item) === stable(conflict))) state.conflicts.push(clone(conflict));
    for (const item of data.superseded ?? []) if (!state.superseded.some(other => stable(other) === stable(item))) state.superseded.push(clone(item));
    for (const gap of data.gaps) {
      const question = questionId.get(gap.question);
      if (!question || state.gaps.some(item => item.id === gap.id)) continue;
      if (gap.sources.some(id => excluded.has(id) || unusable.has(id))) { research.add(question); continue; }
      state.gaps.push({ ...clone(gap), question });
    }
    for (const item of data.missing ?? []) if (sectionId.has(item.section)) state.missing.push({ ...clone(item), section: sectionId.get(item.section), subject: subjectOf(item.subject), scheduled_question: item.scheduled_question ? questionId.get(item.scheduled_question) ?? null : null });
    for (const checker of data.checkers ?? []) if (!state.workers.some(worker => worker.id === checker.id)) state.workers.push({ id: checker.id, harness: checker.harness, imported: origin.label });
    // An origin's approval is history: it approved that research, not this run.
    state.origins.push({ from: origin.label, run: data.run, output_revision: data.output_revision, title: data.title ?? null, topic: data.topic, status: data.status, depth: data.depth, source_mode: data.source_mode, updated_at: data.updated_at ?? null, imported_at: at, approval: data.approval ?? null, approvals: data.approvals ?? [], warnings: notes });
    warnings.push(...notes.map(note => `${origin.label}: ${note}`));
  }
  // Only links between assertions that came across are kept, and no history carries evidence this
  // run may not use.
  const resolves = key => { try { factFor(state, key); return true; } catch { return false; } };
  state.aliases = state.aliases.filter(alias => resolves(alias.key));
  state.conflicts = state.conflicts.filter(conflict => conflict.facts.every(resolves));
  state.superseded = state.superseded.filter(item => resolves(item.fact) && resolves(item.by));
  const narrowedTo = key => resolves(key) || state.factRevisions.some(item => item.previous.key === key);
  state.factRevisions = state.factRevisions.filter(item => narrowedTo(item.current) && !(item.previous.citations ?? []).some(citation => excludedAll.has(citation.source)));
  for (const fact of state.facts) {
    fact.conflicts_with = (fact.conflicts_with ?? []).filter(resolves);
    if (fact.superseded_by && !resolves(fact.superseded_by)) {
      fact.superseded_by = null;
      if (fact.status === 'confirmed') { fact.status = 'stale'; fact.stale = { at, sources: [], reason: 'The assertion that superseded it was not carried over.' }; fact.questions.forEach(id => research.add(id)); }
    }
  }
  const notCurrent = key => { try { const fact = factFor(state, key); return fact.status !== 'confirmed' || Boolean(fact.superseded_by); } catch { return true; } };
  for (const question of state.questions) {
    question.gaps = question.gaps.filter(id => state.gaps.some(gap => gap.id === id));
    const supported = state.facts.some(fact => fact.status === 'confirmed' && !fact.superseded_by && fact.questions.includes(question.id));
    if (question.assessment && question.coverage !== 'not answered' && !supported) research.add(question.id);
    const cited = [...(question.headline?.facts ?? []), ...(question.answer ?? []).flatMap(sentence => sentence.facts)];
    if (cited.some(notCurrent)) rewrite.add(question.id);
    // Above light depth every answer is reviewed by a separate invocation; an unreviewed one is redone.
    if (state.depth !== 'light' && question.headline && !question.writingReview?.by) rewrite.add(question.id);
  }
  for (const id of research) rewrite.add(id);
  state.inputs = [...new Map(state.inputs.map(input => [input.file, input])).values()];
  return { research: [...research], rewrite: [...rewrite], warnings, pins, reselect };
}

// What a person approves: the plan, the answers, the facts and the exact source revisions they rest
// on. Bookkeeping (workers, tasks, refresh notes) is left out, so it does not undo an approval.
export function contentDigest(state) {
  return hash(stable({
    run: state.run, title: state.title ?? null, scope: state.scope ?? null, sections: state.sections, subjects: state.subjects,
    questions: state.questions.map(({ id, question, section, subject, kind, claim, coverage, verdict, gaps, headline, answer }) => ({ id, question, section, subject, kind, claim: claim ?? null, coverage, verdict: verdict ?? null, gaps, headline: headline ?? null, answer: answer ?? null })),
    facts: state.facts.map(({ key, statement, status, superseded_by, citations }) => ({ key, statement, status, superseded_by, citations: citations.map(citation => [citation.source, citation.quote_sha256]) })),
    sources: state.sources.map(({ id, sha256, original_sha256, stale_since, limits }) => ({ id, sha256, original_sha256, stale_since: stale_since ?? null, limits })),
    gaps: state.gaps.map(({ id, question, kind, reason, sources }) => ({ id, question, kind, reason, sources })),
    conflicts: state.conflicts, superseded: state.superseded, aliases: state.aliases.map(({ key, canonical }) => ({ key, canonical })),
  }));
}
// The latest approval, and whether it still applies to the research as it is now.
export function approvalView(state, status) {
  const last = state.approvals?.at(-1);
  if (!last) return null;
  const stale = status === 'stale', changed = last.content !== contentDigest(state);
  const current = !stale && !changed && status.startsWith('complete');
  return { by: last.by, at: last.at, output_revision: last.output_revision, current, ...(current ? {} : { reason: stale ? 'Sources changed since it was approved.' : changed ? 'The research changed since it was approved.' : `The research is ${status}.` }) };
}
// Research kept with the work can be found again: every research/ folder under a directory, with
// what a person needs to choose one. Hidden directories, node_modules and symlinks are not followed.
const FIND_DEPTH = 6, FIND_LIMIT = 20000, DAY = 24 * 60 * 60 * 1000;
export async function findResearch({ dir, query, now = Date.now() }) {
  const root = await realpath(resolve(dir)), projects = [];
  let visited = 0;
  async function walk(path, depth) {
    if (depth > FIND_DEPTH || ++visited > FIND_LIMIT) return;
    const entries = await readdir(path, { withFileTypes: true }).catch(() => []);
    if (await regular(join(path, 'research', 'output.json'))) projects.push(path);
    for (const entry of entries) if (entry.isDirectory() && !entry.name.startsWith('.') && !['node_modules', 'research'].includes(entry.name)) await walk(join(path, entry.name), depth + 1);
  }
  await walk(root, 0);
  const words = String(query ?? '').toLowerCase().split(/\s+/).filter(Boolean), results = [];
  for (const path of projects) {
    const label = relative(root, path) || '.';
    let facts;
    try { facts = (await readOrigin(root, path)).facts; } catch (error) { results.push({ path: label, absolute: path, error: error.message }); continue; }
    const text = [facts.title, facts.topic, ...facts.questions.map(question => question.question)].join(' ').toLowerCase();
    if (!words.every(word => text.includes(word))) continue;
    const saved = facts.sources.map(source => source.saved_at).filter(Boolean).sort(), dated = facts.sources.map(source => source.source_date).filter(Boolean).sort();
    results.push({ path: label, absolute: path, run: facts.run, output_revision: facts.output_revision, title: facts.title ?? facts.topic, topic: facts.topic, status: facts.status, depth: facts.depth, source_mode: facts.source_mode,
      created_at: facts.created_at ?? null, updated_at: facts.updated_at ?? null, counts: { questions: facts.counts.questions, facts: facts.counts.checked, sources: facts.counts.sources, gaps: facts.counts.gaps },
      approval: facts.approval ?? null, sources_saved: { oldest: saved[0] ?? null, newest: saved.at(-1) ?? null }, source_dates: { oldest: dated[0] ?? null, newest: dated.at(-1) ?? null },
      sources_age_days: saved.length ? Math.floor((now - Date.parse(saved[0])) / DAY) : null, reused_from: (facts.origins ?? []).map(origin => origin.from),
      ...(words.length ? { matching_questions: facts.questions.filter(question => words.some(word => question.question.toLowerCase().includes(word))).map(question => question.id) } : {}) });
  }
  results.sort((a, b) => (b.matching_questions?.length ?? 0) - (a.matching_questions?.length ?? 0) || String(b.updated_at ?? '').localeCompare(String(a.updated_at ?? '')) || a.path.localeCompare(b.path));
  return { in: root, query: query ?? null, count: results.length, results, note: 'Approval and status are as last exported; a folder\'s own research status shows whether its sources changed since.' };
}
