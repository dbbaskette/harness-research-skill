import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { atomic, exists, directory, hash, stable } from './run-storage.mjs';
import { factFor, sourceFor } from './run-evidence.mjs';
import { validateFacts } from './run-schema.mjs';

const literal = value => String(value ?? '').replace(/([\\`*_{}\[\]<>!#|])/g, '\\$1');
// The plan may name a short title; otherwise the topic's first sentence, cut to a readable length.
export function titleOf(state) {
  if (state.title) return state.title;
  const first = String(state.topic).split(/(?<=[.!?])\s/)[0].trim();
  return Array.from(first).length > 90 ? Array.from(first).slice(0, 87).join('').trimEnd() + '...' : first;
}
// Worker bookkeeping stays in the run record; the export carries what a reader or caller needs.
const exported = ({ researchWorkers, provisionalCoverage, writtenBy, ...question }) => question;
// Only facts resting on a changed source are out of date; everything else stays current.
const staleKeys = view => new Set(view?.stale?.facts ?? []);
const current = (fact, view) => fact.status === 'confirmed' && !fact.superseded_by && !staleKeys(view).has(fact.key);
const shownStatus = (fact, view) => staleKeys(view).has(fact.key) ? 'stale' : fact.status;
function sectionFacts(state, view, section) {
  const questions = new Set(state.questions.filter(question => question.section === section).map(question => question.id));
  return state.facts.filter(fact => current(fact, view) && fact.questions.some(id => questions.has(id)));
}
export function sourceCount(state, fact) {
  const publishers = fact.citations.map(citation => sourceFor(state, citation.source).publisher);
  return publishers.some(publisher => !publisher) ? null : new Set(publishers.map(publisher => publisher.toLowerCase())).size;
}
// Who checked facts, and on which harness, for the report header and export.
function checkers(state) {
  const ids = [...new Set(state.facts.map(fact => fact.check?.by).filter(Boolean))];
  return ids.map(id => ({ id, harness: state.workers?.find(worker => worker.id === id)?.harness ?? 'host-attested' }));
}
export function exportFacts(state, view) {
  return {
    schema: 1, run: state.run, output_revision: state.revision, runtime_version: state.runtimeVersion,
    guidance_version: state.guidanceVersion, guidance_revision: state.guidanceRevision, guidance_task: state.guidanceTask ?? null,
    title: titleOf(state), topic: state.topic, about: state.about, depth: state.depth, source_mode: state.sourceMode,
    scope: state.scope ?? 'Planning pending.', status: view.status, created_at: state.createdAt,
    updated_at: state.updatedAt, prose_review: state.depth === 'light' ? 'not independently reviewed at light depth' : view.status.startsWith('complete') ? 'independently reviewed' : 'pending independent review',
    sections: state.sections, subjects: state.subjects,
    questions: state.questions.map(question => ({ ...exported(question), facts: state.facts.filter(fact => fact.questions.includes(question.id) && current(fact, view)).map(fact => fact.key) })),
    sources: state.sources,
    facts: state.facts.filter(fact => fact.status !== 'rejected').map(fact => ({ ...fact, status: shownStatus(fact, view), sources_count: sourceCount(state, fact), best_standing: ['primary', 'secondary', 'community'].find(standing => fact.citations.some(citation => sourceFor(state, citation.source).standing === standing)) ?? null })),
    aliases: state.aliases, revisions: state.factRevisions, gaps: state.gaps,
    conflicts: state.conflicts, superseded: state.superseded, missing: state.missing,
    rejected: state.facts.filter(fact => fact.status === 'rejected'),
    failed: state.tasks.filter(task => task.status === 'failed').map(task => ({ id: task.id, kind: task.kind, reason: task.lastError, attempts: task.attempts })),
    counts: { questions: state.questions.length, facts: state.facts.filter(fact => fact.status !== 'rejected').length, checked: state.facts.filter(fact => current(fact, view)).length, sources: state.sources.length, narrowed: state.factRevisions.filter(item => item.kind === 'narrowed').length, rejected: state.facts.filter(fact => fact.status === 'rejected').length, gaps: state.gaps.length, conflicts: state.conflicts.length, superseded: state.superseded.length, failed: state.tasks.filter(task => task.status === 'failed').length },
    block_reasons: view.blockReasons, stale_inputs: view.staleInputs, stale_questions: view.stale?.questions ?? [],
    checkers: checkers(state), plan_warnings: state.planWarnings ?? [], reassessments: state.reassessments ?? [],
    approval: view.approval ?? null, approvals: state.approvals ?? [],
    completed_at: view.status.startsWith('complete') ? state.updatedAt : null,
  };
}
function gapText() { return 'Not established by the sources checked in this run.'; }
export function legacyRecord(state, view) {
  const results = [];
  for (const question of state.questions) {
    if (!question.assessment || !question.headline) continue;
    const facts = state.facts.filter(fact => current(fact, view) && fact.questions.includes(question.id));
    const evidence = facts.flatMap(fact => fact.citations.map(citation => {
      const source = sourceFor(state, citation.source);
      return { file: source.file, title: source.title, origin: source.origin, quote: citation.quote, start: citation.start, locator: citation.locator, sha256: source.sha256, source_id: source.id, original_sha256: source.original_sha256, source_date: source.source_date };
    }));
    const headline = question.headline.kind === 'gap' ? gapText() : question.headline.sentence;
    results.push([question.id, { status: question.kind === 'claim' ? question.verdict : question.coverage === 'answered' && facts.length ? 'supported' : 'insufficient', headline, summary: question.answer?.map(sentence => sentence.sentence).join(' ') || headline, limits: (question.gaps ?? []).map(id => state.gaps.find(gap => gap.id === id)?.reason).filter(Boolean).join(' ') || 'Research coverage; independent fact checks do not establish that sources are true or current.', evidence, checked_at: question.assessment.at }]);
  }
  const inputs = Object.fromEntries(state.inputs.map(input => [input.file, input.sha256]));
  for (const source of state.sources) {
    if (source.file) inputs[source.file] = source.sha256;
    if (source.original_file) inputs[source.original_file] = source.original_sha256;
  }
  return { schema: 1, owner: 'harness-research', workflow_run: state.run, run: state.run, topic: state.topic, purpose: state.claims.length ? 'fact-check' : 'planning', scope: state.sourceMode, input_files: Object.keys(inputs), inputs,
    sources: state.sources.map(source => ({ id: source.id, title: source.title, origin: source.origin, file: source.file, original_file: source.original_file, limits: source.limits })),
    items: state.questions.map(question => ({ id: question.id, question: question.question, public_query: null, claim: question.claim ?? null })), results: Object.fromEntries(results), created_at: state.createdAt };
}
const slug = value => String(value).toLowerCase().replace(/[^\p{L}\p{N}\s-]/gu, '').trim().replace(/\s/g, '-');
const ROUND_LABELS = { reassess: 'Reassessed after source changes', again: 'Researched again on request', refresh: 'Researched again after a refresh', import: 'Completed after reuse' };
const day = value => String(value ?? '').slice(0, 10) || 'unknown';
export function renderReport(state, view) {
  const number = new Map(state.sources.map((source, i) => [source.id, i + 1]));
  const stale = staleKeys(view), staleQuestions = new Set(view.stale?.questions ?? []);
  const cite = ids => [...new Set(ids.flatMap(id => factFor(state, id).citations.map(citation => number.get(citation.source))))].sort((a, b) => a - b).map(n => `[${n}]`).join(' ');
  const cell = value => literal(value).replace(/\n/g, ' ');
  const answered = question => question.assessment && question.coverage === 'answered' && !staleQuestions.has(question.id);
  const given = state.sources.filter(source => source.provenance === 'given' || source.given);
  const currentFacts = state.facts.filter(fact => current(fact, view));
  const coverageCount = name => state.questions.filter(question => question.assessment && question.coverage === name).length;
  const reviewed = state.questions.length > 0 && state.questions.every(question => question.writingReview?.by);
  const who = checkers(state);
  const lines = ['# ' + literal(titleOf(state)), '', ...(titleOf(state) !== state.topic ? ['Request: ' + literal(state.topic), ''] : []),
    `Run: ${state.run}; output revision: ${state.revision}.`, `Status: ${view.status}. Depth: ${state.depth}. Started ${day(state.createdAt)}; updated ${day(state.updatedAt)}.`,
    `Runtime: ${state.runtimeVersion}; guidance: ${state.guidanceVersion ?? 'unknown'} (${state.guidanceRevision ?? 'local runtime guidance'}).`, '',
    literal(state.scope ?? 'Research plan pending.'), '',
    `Sources given: ${state.givenSources.length ? state.givenSources.map(item => { const source = given.find(candidate => candidate.given === item.id && !candidate.stale_since); return source ? `[${number.get(source.id)}] ${literal(source.title)}` : literal(item.title); }).join('; ') : 'none'}${state.sourceMode === 'public-web' ? '; further public sources were permitted.' : '; no public research.'}`,
    `Counts: ${state.questions.length} questions (${coverageCount('answered')} answered, ${coverageCount('partly answered')} partly, ${state.questions.length - coverageCount('answered') - coverageCount('partly answered')} not answered or not yet assessed); ${currentFacts.length} current checked facts from ${new Set(currentFacts.flatMap(fact => fact.citations.map(citation => citation.source))).size} sources; ${state.facts.filter(fact => fact.status === 'rejected').length} rejected, ${state.factRevisions.filter(item => item.kind === 'narrowed').length} narrowed; ${state.gaps.length} gaps; ${state.conflicts.length} conflicts.`,
    `How facts were checked: ${who.length ? `each fact by a separate invocation from the one that researched it, against the original source (checkers: ${who.map(item => `${literal(item.id)} on ${literal(item.harness)}`).join(', ')}).` : 'not yet checked.'}`,
    `Prose: ${state.depth === 'light' ? 'citation and number validation, but no independent semantic writing review at light depth.' : reviewed ? 'every answer was reviewed against its cited facts by a separate invocation.' : 'independent writing review is pending.'}`,
    'Facts are checked for source support, not certified as true or live-current.', ''];
  const approval = view.approval;
  if (approval) lines.push(approval.current ? `Approval: approved by ${literal(approval.by)} on ${day(approval.at)} (output revision ${approval.output_revision}).` : `Approval: ${literal(approval.by)} approved output revision ${approval.output_revision} on ${day(approval.at)}; it no longer applies. ${literal(approval.reason)}`, '');
  if (state.planWarnings?.length) lines.push('Plan notes: ' + state.planWarnings.map(literal).join(' '), '');
  // Rounds after the first pass, grouped by why they ran. Runs saved by 0.9.0 recorded no kind.
  const rounds = [...(state.reassessments ?? []), ...(state.reassess && !state.reassess.done ? [state.reassess] : [])];
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
  for (const [kind, label] of Object.entries(ROUND_LABELS)) {
    const listed = rounds.filter(item => (item.kind ?? 'reassess') === kind);
    if (listed.length) lines.push(`${label}: ${listed.map(item => `round ${item.round} (${plural(item.questions.length, 'question')}${item.reason ? '; ' + literal(item.reason) : ''}${item.done ? '' : ', in progress'})`).join('; ')}.`, '');
  }
  lines.push('## Contents', '', '- [Coverage](#coverage)', ...state.sections.map(section => `- [${literal(section.name)}](#${slug(section.name)})`), '- [Gaps](#gaps)', '- [Conflicts and history](#conflicts-and-history)', '- [Sources](#sources)', '- [Rejected facts and failed tasks](#rejected-facts-and-failed-tasks)', '', '## Coverage', '');
  for (const section of state.sections) {
    const questions = state.questions.filter(question => question.section === section.id);
    const facts = sectionFacts(state, view, section.id);
    const shared = facts.filter(fact => !fact.subject).length;
    const bySubject = state.subjects.length > 1 && facts.some(fact => fact.subject) ? ` (${[...state.subjects.map(subject => `${literal(subject.name)} ${facts.filter(fact => fact.subject === subject.id).length}`), ...(shared ? [`cross-cutting ${shared}`] : [])].join(', ')})` : '';
    const open = questions.filter(question => question.assessment && !answered(question)).map(question => `${literal(question.question)} (${staleQuestions.has(question.id) ? 'stale' : question.coverage})`);
    lines.push(`- ${literal(section.name)}: ${facts.length} current checked facts${bySubject}; ${questions.filter(answered).length}/${questions.length} questions answered with current evidence.${open.length ? ' Open: ' + open.join('; ') + '.' : ''}`);
  }
  if (!state.sections.length) lines.push('Plan not yet submitted.');
  if (view.blockReasons.length) lines.push('', 'Execution blocked: ' + view.blockReasons.map(literal).join('; '));
  if (view.staleInputs.length) lines.push('', 'Changed inputs/sources: ' + view.staleInputs.map(literal).join(', ') + (view.stale?.facts?.length ? `. ${view.stale.facts.length} facts and ${view.stale.questions.length} questions rest on them and await reassessment.` : '.'));
  for (const section of state.sections) {
    lines.push('', '## ' + literal(section.name), '');
    // When comparing, each subject's current facts in this section side by side, before the questions.
    if (state.subjects.length > 1) {
      const facts = sectionFacts(state, view, section.id);
      const columns = state.subjects.map(subject => facts.filter(fact => fact.subject === subject.id));
      if (columns.some(column => column.length)) {
        lines.push('| ' + state.subjects.map(subject => cell(subject.name)).join(' | ') + ' |', '|' + state.subjects.map(() => ' --- |').join(''));
        for (let row = 0; row < Math.max(...columns.map(column => column.length)); row++) lines.push('| ' + columns.map(column => column[row] ? `${cell(column[row].statement)} ${cite([column[row].key])}` : '').join(' | ') + ' |');
        lines.push('');
      }
    }
    for (const question of state.questions.filter(item => item.section === section.id)) {
      lines.push('### ' + literal(question.question), '');
      if (question.headline) {
        lines.push(question.headline.kind === 'gap' ? gapText() : `${literal(question.headline.sentence)} ${cite(question.headline.facts)}`, '');
        let paragraph = [], group = 1;
        for (const sentence of question.answer ?? []) {
          if (sentence.paragraph && sentence.paragraph !== group) { lines.push(paragraph.join(' '), ''); paragraph = []; group = sentence.paragraph; }
          paragraph.push(`${literal(sentence.sentence)} ${cite(sentence.facts)}`);
        }
        if (paragraph.length) lines.push(paragraph.join(' '), '');
      } else lines.push('Answer pending. Coverage: ' + literal(question.assessment ? question.coverage : 'not yet checked') + '.', '');
      for (const id of question.gaps ?? []) { const gap = state.gaps.find(item => item.id === id); lines.push(`Gap (${id}${gap.check ? ', ' + (gap.check.result === 'confirmed' ? 'assessed' : gap.check.result) : ', awaiting check'}): ${literal(gap.reason)} ${gap.sources.map(source => `[${number.get(source)}]`).join(' ')}`, ''); }
      const facts = state.facts.filter(fact => fact.questions.includes(question.id) && fact.status !== 'rejected');
      if (facts.length) lines.push('Facts behind this answer:', '');
      for (const fact of facts) {
        lines.push(`- ${fact.key} [${shownStatus(fact, view)}${fact.superseded_by ? ', superseded' : ''}]: ${literal(fact.statement)} ${cite([fact.key])}; as of ${literal(fact.as_of ?? 'unknown')}; ${sourceCount(state, fact) === null ? 'publisher independence unknown' : sourceCount(state, fact) === 1 ? 'one publisher' : sourceCount(state, fact) + ' publishers'}.`);
        for (const citation of fact.citations) lines.push(`  > ${literal(citation.quote).replace(/\n/g, '\n  > ')} [${number.get(citation.source)}], ${literal(citation.locator)}${sourceFor(state, citation.source).provenance === 'transcribed' ? ' (transcribed)' : ''}${sourceFor(state, citation.source).capture ? ' (partial capture)' : ''}`);
        lines.push('');
      }
    }
  }
  lines.push('', '## Gaps', '');
  const gapLines = [];
  for (const question of state.questions.filter(item => item.assessment && item.coverage !== 'answered')) gapLines.push(`- ${literal(question.question)} (${question.coverage}): ${(question.gaps ?? []).map(id => state.gaps.find(gap => gap.id === id)).filter(Boolean).map(gap => `${literal(gap.reason)} ${gap.sources.map(source => `[${number.get(source)}]`).join(' ')}`.trim()).join(' ') || 'no recorded reason'}`);
  for (const question of state.questions.filter(item => staleQuestions.has(item.id))) gapLines.push(`- ${literal(question.question)}: rests on a changed source and awaits reassessment.`);
  for (const source of state.sources.filter(item => !item.stale_since && (!item.file || item.limits !== 'none' || item.capture))) gapLines.push(`- Source [${number.get(source.id)}] ${literal(source.title)}: ${!source.file ? 'could not be read' : source.capture ? 'partial capture' : 'limited'}; ${literal(source.limits !== 'none' ? source.limits : source.capture?.reason ?? '')}`);
  for (const missing of state.missing) gapLines.push(`- ${missing.scheduled_question ? 'Follow-up question (' + literal(missing.scheduled_question) + ')' : 'Unresearched angle'}: ` + literal(missing.question ?? missing.angle));
  for (const task of state.tasks.filter(item => item.status === 'failed')) gapLines.push(`- Failed task ${task.id} (${task.kind}): ${literal(task.lastError)}`);
  lines.push(...(gapLines.length ? gapLines : ['None recorded.']));
  lines.push('', '## Conflicts and history', '');
  for (const conflict of state.conflicts) {
    // Conflicting facts side by side, so the reader sees what each source says.
    const facts = conflict.facts.map(id => factFor(state, id));
    lines.push(`Conflict: ${literal(conflict.note)}`, '', '| ' + facts.map(fact => cell(state.subjects.find(subject => subject.id === fact.subject)?.name ?? fact.key)).join(' | ') + ' |', '|' + facts.map(() => ' --- |').join(''), '| ' + facts.map(fact => `${cell(fact.statement)} ${cite([fact.key])}; as of ${cell(fact.as_of ?? 'unknown')}`).join(' | ') + ' |', '');
  }
  for (const revision of state.factRevisions) lines.push(`- ${revision.previous.key} → ${revision.current} (${revision.kind}): ${literal(revision.reason)}`);
  for (const alias of state.aliases) lines.push(`- ${alias.key} aliases ${alias.canonical}.`);
  for (const fact of state.facts.filter(item => item.status === 'stale')) lines.push(`- ${fact.key} became stale on ${day(fact.stale?.at)}: its source changed.`);
  lines.push('', '## Sources', '');
  for (const source of state.sources) {
    const selected = state.givenSources.find(item => item.id === source.given);
    const local = source.original_file ?? selected?.file ?? source.file;
    const origin = /^https?:\/\//.test(source.origin) ? `[${literal(source.title)}](${source.origin.replace(/[()\s]/g, c => encodeURIComponent(c))})` : local ? `[${literal(source.title)}](../${local.split('/').map(encodeURIComponent).join('/')})` : `${literal(source.title)} (${literal(source.origin)})`;
    lines.push(`${number.get(source.id)}. ${origin}; ${literal(source.publisher ?? 'publisher unknown')}; ${source.standing}; ${source.provenance}; saved ${source.saved_at}; source date ${literal(source.source_date ?? 'unknown')}${source.stale_since ? '; superseded by a newer revision' : ''}.`);
    if (source.capture) lines.push('   Partial capture: ' + literal(source.capture.reason));
    if (source.limits !== 'none') lines.push('   Coverage gap: ' + literal(source.limits));
  }
  lines.push('', '## Rejected facts and failed tasks', '');
  for (const fact of state.facts.filter(fact => fact.status === 'rejected')) lines.push(`- ${fact.key}: ${literal(fact.statement)} — ${literal(fact.check?.reason)}`);
  for (const task of state.tasks.filter(task => task.status === 'failed')) lines.push(`- Task ${task.id} (${task.kind}): ${literal(task.lastError)}`);
  return lines.join('\n') + '\n';
}
export async function ensureOutput(locations, state) {
  const legacyInfo = await exists(locations.legacy);
  if (legacyInfo) {
    if (!legacyInfo.isFile() || legacyInfo.isSymbolicLink()) throw new Error('Existing research record is not a regular file.');
    const legacy = JSON.parse(await readFile(locations.legacy, 'utf8'));
    if (legacy.owner !== 'harness-research' || legacy.schema !== 1) throw new Error('Unrecognized existing research record; preserve it.');
  } else if (!state?.ownsOutput && await exists(join(locations.derived, 'research-report.md'))) throw new Error('Existing research report has no owned record; preserve it.');
  await directory(locations.output);
  const manifestPath = join(locations.output, 'output.json'), manifestInfo = await exists(manifestPath);
  if (manifestInfo) {
    if (!manifestInfo.isFile() || manifestInfo.isSymbolicLink()) throw new Error('Research output manifest is not a regular file.');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
    if (manifest.owner !== 'harness-research-output' || manifest.schema !== 1) throw new Error('Unrecognized research output; refusing to overwrite user files.');
  } else if (!state?.ownsOutput) {
    for (const name of ['report.md', 'facts.json', 'brief.md', 'plan.json', 'plan.md']) if (await exists(join(locations.output, name))) throw new Error(`Existing unowned research/${name}; preserve or move it before starting research.`);
  }
}
export async function writeOutput(locations, state, view) {
  await ensureOutput(locations, state);
  const facts = validateFacts(exportFacts(state, view)), report = renderReport(state, view);
  const brief = [`# ${titleOf(state)}`, `Run: ${state.run}; output revision: ${state.revision}; status: ${view.status}.`, ''];
  for (const fact of state.facts.filter(fact => current(fact, view))) brief.push(`${fact.key}: ${fact.statement}`);
  if (view.staleInputs.length) brief.push('Stale evidence: ' + view.staleInputs.join(', '));
  for (const gap of state.gaps) brief.push(`Gap ${gap.id}${gap.check ? '' : ' (unchecked)'}: ${gap.reason}`);
  for (const conflict of state.conflicts) brief.push('Conflict: ' + conflict.note);
  for (const reason of view.blockReasons) brief.push('Execution blocked: ' + reason);
  const files = { 'report.md': report, 'facts.json': JSON.stringify(facts, null, 2) + '\n', 'brief.md': brief.join('\n') + '\n' };
  const plan = { run: state.run, output_revision: state.revision, scope: state.scope ?? null, source_mode: state.sourceMode, sections: state.sections, subjects: state.subjects, questions: state.questions.map(({ id, question, section, subject, kind, claim }) => ({ id, question, section, subject, kind, ...(claim ? { claim } : {}) })) };
  files['plan.json'] = JSON.stringify(plan, null, 2) + '\n';
  files['plan.md'] = ['# Research plan: ' + titleOf(state), '', state.scope ?? 'Planning pending.', '', ...(state.planWarnings?.length ? ['Plan notes:', ...state.planWarnings.map(item => '- ' + item), ''] : []), ...state.sections.flatMap(section => ['## ' + section.name, ...state.questions.filter(q => q.section === section.id).map(q => '- ' + q.question), ''])].join('\n');
  for (const [name, content] of Object.entries(files)) await atomic(join(locations.output, name), content);
  await atomic(join(locations.derived, 'research-report.md'), report);
  await atomic(locations.legacy, JSON.stringify(legacyRecord(state, view), null, 2) + '\n');
  const manifest = { schema: 1, owner: 'harness-research-output', run: state.run, output_revision: state.revision, files: Object.fromEntries(Object.entries(files).map(([name, content]) => [name, hash(content)])) };
  await atomic(join(locations.output, 'output.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}
export async function persist(locations, state, view, { changed = true } = {}) {
  await ensureOutput(locations, state);
  changed ||= state.exportStatus !== view.status || stable(state.exportStaleInputs ?? []) !== stable(view.staleInputs);
  if (changed) { state.revision++; state.updatedAt = new Date().toISOString(); }
  state.exportStatus = view.status; state.exportStaleInputs = [...view.staleInputs];
  state.ownsOutput = true;
  await atomic(locations.state, JSON.stringify(state, null, 2) + '\n');
  return writeOutput(locations, state, view);
}
