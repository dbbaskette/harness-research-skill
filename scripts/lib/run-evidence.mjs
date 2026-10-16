import { hash, stable, key, text, identifier, readText, snapshot, unchanged } from './run-storage.mjs';

export const DEPTHS = { light: { facts: 12, gaps: 3 }, standard: { facts: 20, gaps: 80 }, deep: { facts: 30, gaps: 80 } };
export const coverageValues = ['answered', 'partly answered', 'not answered'];
// A quote is only checkable against the text around it. Saved text shorter than this, or a quote
// that is most of its saved text, is refused unless the source is registered as a partial capture.
export const SOURCE_MIN_CHARACTERS = 280;
export const QUOTE_SHARE_LIMIT = 0.5;
const characters = value => Array.from(String(value).trim()).length;
export function numbers(value) {
  return [...new Set((String(value).normalize('NFKC').match(/\d+(?:[.,]\d+)*/g) ?? []).map(n => /^\d{1,3}(?:,\d{3})+$/.test(n) ? n.replaceAll(',', '') : n))];
}
export function numericSupport(statement, quotes) {
  const available = new Set(quotes.flatMap(numbers)), missing = numbers(statement).filter(number => !available.has(number));
  if (missing.length) throw new Error(`Numbers not present in the cited evidence: ${missing.join(', ')}`);
}
export function statement(value, label = 'Fact') {
  const result = text(value, label, 1000);
  if (result.split(/\s+/u).length > 40 || [...new Intl.Segmenter('en', { granularity: 'sentence' }).segment(result)].filter(x => x.segment.trim()).length > 1) throw new Error(`${label} must be one sentence of at most 40 words.`);
  return result;
}
const normalizedChar = c => c.normalize('NFKC').replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/[‐‑‒–—−]/g, '-');
function normalizeWithPositions(input) {
  let value = ''; const positions = [];
  for (const [index, character] of Array.from(input).entries()) {
    for (const c of Array.from(normalizedChar(character))) {
      if (/\s/u.test(c)) {
        if (value.endsWith(' ')) { positions.at(-1).end = index + 1; continue; }
        value += ' '; positions.push({ start: index, end: index + 1 });
      } else { value += c; positions.push({ start: index, end: index + 1 }); }
    }
  }
  return { value, positions };
}
export function placeQuote(content, supplied) {
  const quote = text(supplied, 'Quote', 4000), size = Array.from(quote).length;
  if (size < 20 || size > 900) throw new Error('Each quote must contain 20 to 900 characters.');
  const index = content.indexOf(quote);
  if (index >= 0) return { quote, start: Array.from(content.slice(0, index)).length };
  const normalized = normalizeWithPositions(content), requested = normalizeWithPositions(quote).value.trim();
  const offset = normalized.value.indexOf(requested);
  if (offset < 0) throw new Error('Quote does not occur in its registered source.');
  // Locate by Unicode character positions, not UTF-16 string offsets.
  const startIndex = Array.from(normalized.value.slice(0, offset)).length;
  const endIndex = startIndex + Array.from(requested).length - 1;
  const start = normalized.positions[startIndex].start, end = normalized.positions[endIndex].end;
  return { quote: Array.from(content).slice(start, end).join(''), start };
}
export function sourceFor(state, id) {
  const source = state.sources.find(item => item.id === id);
  if (!source) throw new Error(`Unknown registered source: ${id}`);
  return source;
}
export function factFor(state, supplied) {
  let id = supplied; const seen = new Set();
  while (state.aliases.some(alias => alias.key === id)) {
    if (seen.has(id)) throw new Error('Fact alias cycle.'); seen.add(id);
    id = state.aliases.find(alias => alias.key === id).canonical;
  }
  const fact = state.facts.find(item => item.key === id);
  if (!fact) throw new Error(`Unknown fact key: ${supplied}`);
  return fact;
}
export async function sourceRecord(root, state, supplied, task) {
  const givenId = supplied.given ?? task?.given;
  const given = state.givenSources.find(item => item.id === givenId);
  if (givenId && !given) throw new Error('Unknown selected reference.');
  if (!given && state.sourceMode !== 'public-web') throw new Error('Found sources require explicit public-web permission.');
  const origin = given?.origin ?? text(supplied.origin, 'Source origin');
  if (given && supplied.origin && supplied.origin !== given.origin) throw new Error('Source origin does not match the selected reference.');
  if (!given && !/^https?:\/\//i.test(origin)) throw new Error('Found source origins must be public HTTP(S) URLs.');
  const title = text(supplied.title ?? given?.title, 'Source title');
  const limits = supplied.limits ?? 'none'; text(limits, 'Source limits');
  const capture = supplied.partial ? { kind: 'partial', reason: text(supplied.partial, 'Partial capture reason', 1000) } : null;
  if (!supplied.file) {
    if (!given || limits === 'none') throw new Error('An unreadable selected source requires a concrete gap.');
    return { id: identifier(supplied.id ?? given.id), given: given.id, title, origin, capture: null, file: null, original_file: given.original_file ?? given.file ?? null, original_sha256: given.original_sha256 ?? given.sha256 ?? null, sha256: null, publisher: supplied.publisher ?? null, standing: 'primary', provenance: 'given', limits, saved_at: new Date().toISOString() };
  }
  const extracted = await readText(root, supplied.file, { withHash: true }), content = extracted.content;
  if (!content.trim()) throw new Error('Source text is empty; record an unreadable-source gap instead.');
  if (!capture && characters(content) < SOURCE_MIN_CHARACTERS) throw new Error(`Saved source text is only ${characters(content)} characters. Save the full page or the relevant section, not just the passage to quote; if the tool returned only part of it, or the whole source is this short, register it with --partial and the reason.`);
  const sha256 = extracted.sha256, originalFile = given?.original_file ?? given?.file ?? supplied.original_file ?? null;
  const original = originalFile ? await snapshot(root, originalFile) : null;
  if (given?.sha256 && original?.sha256 !== (given.original_sha256 ?? given.sha256)) throw new Error('Selected original changed; start a new run.');
  const standing = given ? 'primary' : supplied.standing ?? 'secondary';
  if (!['primary', 'secondary', 'community'].includes(standing)) throw new Error('Invalid source standing.');
  // Capturing only part of a source changes its provenance, not its saved bytes.
  // Issue a new revision for that metadata while preserving existing full-source IDs.
  const identity = capture ? [origin, sha256, capture] : [origin, sha256];
  const id = identifier(supplied.id ?? 'source-' + hash(stable(identity)).slice(0, 20));
  const previous = state.sources.find(source => source.id === id);
  if (previous && (previous.sha256 !== sha256 || previous.origin !== origin)) throw new Error('Source IDs identify immutable revisions; register a new ID.');
  return { id, given: given?.id ?? null, title, origin, publisher: supplied.publisher ? text(supplied.publisher, 'Publisher') : null, standing, provenance: supplied.transcribed ? 'transcribed' : given ? 'given' : 'found', capture, pages: supplied.pages ?? null, file: supplied.file, sha256, original_file: originalFile, original_sha256: original?.sha256 ?? null, limits, source_date: supplied.source_date ?? null, saved_at: previous?.saved_at ?? new Date().toISOString() };
}
export async function citations(root, state, supplied, question) {
  if (!Array.isArray(supplied) || supplied.length < 1 || supplied.length > 5) throw new Error('A fact needs 1 to 5 registered-source quotes.');
  const result = [];
  for (const item of supplied) {
    const source = sourceFor(state, item.source);
    if (!source.file || !await unchanged(root, { file: source.file, sha256: source.sha256 }) || source.original_file && !await unchanged(root, { file: source.original_file, sha256: source.original_sha256 })) throw new Error('Source revision is unreadable or stale.');
    const extracted = await readText(root, source.file, { withHash: true });
    if (extracted.sha256 !== source.sha256) throw new Error('Source revision changed while reading its quote.');
    const placed = placeQuote(extracted.content, item.quote);
    if (!source.capture && characters(placed.quote) > QUOTE_SHARE_LIMIT * characters(extracted.content)) throw new Error(`The quote is most of its saved source ${source.id}. Save the surrounding page or section so the quote can be checked in context, or register the source with --partial and the reason.`);
    result.push({ source: source.id, ...placed, quote_sha256: hash(placed.quote), source_sha256: source.sha256, locator: text(item.locator ?? (source.pages ? 'Pages ' + source.pages : 'Saved source text'), 'Quote locator') });
  }
  if (question.claim && result.every(item => sourceFor(state, item.source).original_file === question.claim.file)) throw new Error('A claim target cannot establish its own assertion. Cite independent selected evidence.');
  return result;
}
export async function candidate(root, state, question, supplied, worker) {
  const value = statement(supplied.statement), quotes = await citations(root, state, supplied.quotes ?? supplied.citations, question);
  numericSupport(value, quotes.map(item => item.quote));
  const subject = state.subjects.find(item => item.id === question.subject);
  if (subject && !value.toLowerCase().includes(subject.name.toLowerCase())) throw new Error('Fact must name its comparison subject.');
  return { key: key('fact-'), statement: value, questions: [question.id], section: question.section, subject: question.subject ?? null, as_of: supplied.as_of ?? null, authored_by: worker, status: 'candidate', check: null, citations: quotes, original_statement: null, conflicts_with: [], superseded_by: null };
}
export function gaps(state, question, supplied, worker) {
  if (!Array.isArray(supplied)) throw new Error('gaps must be an array of assessed gaps.');
  return supplied.map(item => {
    if (!['insufficient', 'unreadable', 'unavailable'].includes(item.kind)) throw new Error('Gap kind must be insufficient, unreadable or unavailable.');
    const sources = item.sources ?? [];
    if (!Array.isArray(sources)) throw new Error('Gap sources must be an array.');
    sources.forEach(id => sourceFor(state, id));
    const reason = text(item.reason, 'Concrete gap reason');
    if (!sources.length && !item.attempts && state.sources.length) throw new Error('A gap must identify inspected sources or concrete access attempts.');
    return { id: key('gap-'), question: question.id, kind: item.kind, reason, sources, attempts: item.attempts ?? null, assessed_by: worker, check: null };
  });
}
export function coverage(value) {
  if (!coverageValues.includes(value)) throw new Error('Coverage must be answered, partly answered or not answered.');
  return value;
}
export function validateAssessment(state, question, supplied, worker) {
  const finalCoverage = coverage(supplied.coverage);
  const checked = state.facts.filter(fact => fact.questions.includes(question.id) && fact.status === 'confirmed' && !fact.superseded_by);
  if (finalCoverage !== 'not answered' && !checked.length) throw new Error('Answered coverage requires current confirmed facts.');
  const ids = question.gaps ?? [];
  if (finalCoverage !== 'answered' && !ids.length) throw new Error('Partial or unanswered coverage requires a concrete assessed gap.');
  const verdict = question.kind === 'claim' ? supplied.verdict : null;
  if (question.kind === 'claim' && !['supported', 'contradicted', 'insufficient'].includes(verdict)) throw new Error('Claim checking requires a verdict.');
  if (['supported', 'contradicted'].includes(verdict) && !checked.length) throw new Error('Claim verdict requires current confirmed evidence.');
  if (finalCoverage === 'not answered' && verdict && verdict !== 'insufficient') throw new Error('An unanswered claim must be insufficient.');
  question.coverage = finalCoverage; question.verdict = verdict;
  question.assessment = { by: worker, at: new Date().toISOString() };
  for (const id of ids) state.gaps.find(gap => gap.id === id).check = { by: worker, result: 'confirmed' };
}
export function validateSentence(state, supplied, { allowed } = {}) {
  const value = statement(supplied.sentence, 'Answer sentence');
  if (!Array.isArray(supplied.facts) || !supplied.facts.length) throw new Error('Every factual headline/sentence needs fact citations.');
  const facts = supplied.facts.map(id => {
    const fact = factFor(state, id);
    if (fact.status !== 'confirmed' || fact.superseded_by && supplied.historical !== true) throw new Error('Sentence cites an unchecked, rejected, stale or unqualified superseded fact.');
    if (allowed && !allowed.has(fact.key)) throw new Error('Writing review cannot add a new factual reference.');
    return fact;
  });
  numericSupport(value, facts.map(fact => fact.statement));
  return { sentence: value, facts: [...new Set(facts.map(fact => fact.key))], ...(supplied.historical ? { historical: true } : {}), ...(supplied.paragraph ? { paragraph: supplied.paragraph } : {}) };
}
export function validateAnswer(state, question, supplied, options = {}) {
  if (!Array.isArray(supplied.answer)) throw new Error('Answer must contain an array of cited sentences.');
  const expected = question.gaps ?? [];
  const gapIds = supplied.gaps ?? expected;
  if (!Array.isArray(gapIds) || gapIds.some(id => !expected.includes(id)) || expected.some(id => !gapIds.includes(id))) throw new Error('Answer must preserve the question’s assessed gap references.');
  if (question.coverage === 'not answered') {
    if (supplied.answer.length || supplied.headline?.kind !== 'gap' || !gapIds.length || stable([...(supplied.headline.gaps ?? [])].sort()) !== stable([...gapIds].sort())) throw new Error('An unanswered question needs an empty answer and a structured gap headline.');
    return { id: question.id, headline: { kind: 'gap', gaps: gapIds }, answer: [], gaps: gapIds };
  }
  if (!question.assessment || !supplied.answer.length || supplied.answer.length > 40) throw new Error('A checked answered question requires 1 to 40 cited sentences.');
  const headline = validateSentence(state, supplied.headline, options);
  const answer = supplied.answer.map(sentence => validateSentence(state, sentence, options));
  for (const sentence of answer) if (sentence.paragraph !== undefined && (!Number.isInteger(sentence.paragraph) || sentence.paragraph < 1 || sentence.paragraph > 4)) throw new Error('Answers use at most four paragraphs.');
  return { id: question.id, headline, answer, gaps: gapIds };
}
export async function changedInputs(root, state) {
  const changed = [];
  for (const input of state.inputs) if (!await unchanged(root, input)) changed.push(input.file);
  for (const source of state.sources) {
    if (source.file && !await unchanged(root, { file: source.file, sha256: source.sha256 })) changed.push(source.file);
    if (source.original_file && !await unchanged(root, { file: source.original_file, sha256: source.original_sha256 })) changed.push(source.original_file);
  }
  return [...new Set(changed)];
}
