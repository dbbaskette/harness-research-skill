import { writeFile, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { hash, stable, key, text, identifier, readText, snapshot, unchanged, exists, directory, localFile } from './run-storage.mjs';

export const DEPTHS = { light: { facts: 12, gaps: 3 }, standard: { facts: 20, gaps: 80 }, deep: { facts: 30, gaps: 80 } };
export const coverageValues = ['answered', 'partly answered', 'not answered'];
// A quote is only checkable against the text around it. Saved text shorter than this, or a quote
// that is most of its saved text, is refused unless the source is registered as a partial capture.
export const SOURCE_MIN_CHARACTERS = 280;
export const QUOTE_SHARE_LIMIT = 0.5;
const characters = value => Array.from(String(value).trim()).length;
// Spelled-out counts are numbers too: "five replicas" must not pass against a quote saying 3.
// "one" is left out because it is far more often a pronoun ("one of the forks") than a count.
const UNITS = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, twice: 2, thrice: 3 };
const TENS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const SCALES = { hundred: 2, thousand: 3, million: 6, billion: 9, trillion: 12 };
const ONES = { one: 1, ...UNITS };
// Multiply a decimal string by 10^places without floating-point error: "1.5" × 10^6 → "1500000".
function shift(value, places) {
  const [whole, fraction = ''] = value.split('.'), digits = whole + fraction, point = whole.length + places;
  const result = point >= digits.length ? digits + '0'.repeat(point - digits.length) : digits.slice(0, point) + '.' + digits.slice(point);
  return result.replace(/^0+(?=\d)/, '');
}
function spelled(text) {
  const tens = Object.keys(TENS).join('|'), ones = Object.keys(ONES).join('|'), units = Object.keys(UNITS).join('|'), scales = Object.keys(SCALES).join('|');
  // "twenty-five", "twenty", "five"; a scale word after a number scales it: "1.5 million", "two hundred".
  return text
    .replace(new RegExp(`\\b(${tens})[-\\s](${Object.keys(ONES).filter(word => !['twice', 'thrice'].includes(word) && ONES[word] < 10).join('|')})\\b`, 'gi'), (_, ten, one) => String(TENS[ten.toLowerCase()] + ONES[one.toLowerCase()]))
    .replace(new RegExp(`\\b(${tens})\\b`, 'gi'), word => String(TENS[word.toLowerCase()]))
    .replace(new RegExp(`\\b(${ones})(?=\\s+(?:${scales})\\b)`, 'gi'), word => String(ONES[word.toLowerCase()]))
    .replace(new RegExp(`\\b(${units})\\b`, 'gi'), word => String(UNITS[word.toLowerCase()]))
    .replace(new RegExp(`(\\d+(?:[.,]\\d+)*)\\s+(${scales})\\b(?!s)`, 'gi'), (_, number, scale) => /^\d{1,3}(?:,\d{3})+$/.test(number) ? number : shift(number.replace(/,/g, ''), SCALES[scale.toLowerCase()]));
}
export function numbers(value) {
  return [...new Set((spelled(String(value).normalize('NFKC')).match(/\d+(?:[.,]\d+)*/g) ?? []).map(n => /^\d{1,3}(?:,\d{3})+$/.test(n) ? n.replaceAll(',', '') : n))];
}
export function numericSupport(statement, quotes) {
  const available = new Set(quotes.flatMap(numbers)), missing = numbers(statement).filter(number => !available.has(number));
  if (missing.length) throw new Error(`Numbers not present in the cited evidence: ${missing.join(', ')}`);
}
// Sentence segmentation breaks after "vs." or "U.S." followed by a capital, so the full stops in
// common abbreviations and initials are masked before counting sentences.
const ABBREVIATIONS = /\b(?:vs|etc|e\.g|i\.e|cf|approx|incl|est|Inc|Ltd|Corp|Co|LLC|Nos?|Dr|Mr|Mrs|Ms|Prof|Jr|Sr|St|Fig|Figs|Vol|Ver|Rev|Sec|Ch|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec)\.(?=\s)/g;
function masked(value) {
  return value
    .replace(/\b(?:[A-Za-z]\.){2,}/g, match => match.replaceAll('.', '\uE000'))
    .replace(ABBREVIATIONS, match => match.replaceAll('.', '\uE000'))
    .replace(/(^|\s)([A-Z])\.(?=\s+[A-Z])/g, '$1$2\uE000');
}
export function statement(value, label = 'Fact') {
  const result = text(value, label, 1000);
  if (result.split(/\s+/u).length > 40 || [...new Intl.Segmenter('en', { granularity: 'sentence' }).segment(masked(result))].filter(x => x.segment.trim()).length > 1) throw new Error(`${label} must be one sentence of at most 40 words.`);
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
// The helper keeps its own copy of every registered text, named by its hash, and checks quotes
// against that copy. The harness's working file can then change without silently changing evidence.
export const PINNED_DIRECTORY = 'research/sources/revisions';
export async function pin(root, sha256, content) {
  for (const part of ['research', 'research/sources', PINNED_DIRECTORY]) await directory(join(root, part));
  const name = `${PINNED_DIRECTORY}/${sha256}.txt`, path = join(root, name);
  if (!await exists(path)) await writeFile(path, content, { flag: 'wx', mode: 0o444 }).catch(error => { if (error.code !== 'EEXIST') throw error; });
  if (!await unchanged(root, { file: name, sha256 })) throw new Error(`Pinned source revision ${name} does not match its hash; restore or remove it.`);
  return name;
}
async function readPinnable(root, file, sha256) {
  const bytes = await readFile(await localFile(root, file));
  if (hash(bytes) !== sha256) throw new Error('Source text changed while it was being registered; register it again.');
  return bytes;
}
// The text a citation is checked against: the pinned copy, or the working file for runs saved before pinning.
export const evidenceFile = source => source.pinned ?? source.file;
export async function sourceRecord(root, state, supplied, task) {
  const givenId = supplied.given ?? task?.given;
  const given = state.givenSources.find(item => item.id === givenId);
  if (givenId && !given) throw new Error('Unknown selected reference.');
  // A selected original edited before anything was registered from it is simply read as it is now.
  if (given?.sha256) {
    const current = await snapshot(root, given.original_file ?? given.file).catch(() => null);
    if (current && current.sha256 !== (given.original_sha256 ?? given.sha256)) {
      if (state.sources.some(source => source.given === given.id)) throw new Error('Selected original changed after registration; run research reassess.');
      if (given.original_file) given.original_sha256 = current.sha256; else given.sha256 = current.sha256;
      state.inputs = state.inputs.map(input => input.file === current.file ? current : input);
    }
  }
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
  // A changed original with unchanged extracted text is still a new revision.
  const identity = [origin, sha256, ...(original && original.sha256 !== sha256 ? [original.sha256] : []), ...(capture ? [capture] : [])];
  const id = identifier(supplied.id ?? 'source-' + hash(stable(identity)).slice(0, 20));
  const previous = state.sources.find(source => source.id === id);
  if (previous && (previous.sha256 !== sha256 || previous.origin !== origin)) throw new Error('Source IDs identify immutable revisions; register a new ID.');
  const pinned = await pin(root, sha256, await readPinnable(root, supplied.file, sha256));
  return { id, given: given?.id ?? null, title, origin, publisher: supplied.publisher ? text(supplied.publisher, 'Publisher') : null, standing, provenance: supplied.transcribed ? 'transcribed' : given ? 'given' : 'found', capture, pages: supplied.pages ?? null, file: supplied.file, pinned, sha256, original_file: originalFile, original_sha256: original?.sha256 ?? null, limits, source_date: supplied.source_date ?? null, saved_at: previous?.saved_at ?? new Date().toISOString() };
}
export async function citations(root, state, supplied, question) {
  if (!Array.isArray(supplied) || supplied.length < 1 || supplied.length > 5) throw new Error('A fact needs 1 to 5 registered-source quotes.');
  const result = [];
  for (const item of supplied) {
    if (!item || typeof item.source !== 'string' || !item.source.trim()) throw new Error('Quote needs a registered source ID in "source". Reuse an ID from the task; a "file" citation requires registering that file in the same result.');
    const source = sourceFor(state, item.source);
    if (!source.file || !await unchanged(root, { file: evidenceFile(source), sha256: source.sha256 }) || source.original_file && !await unchanged(root, { file: source.original_file, sha256: source.original_sha256 })) throw new Error(`Source ${source.id} is unreadable or its original changed; register the current text as a new source (or run research reassess).`);
    const extracted = await readText(root, evidenceFile(source), { withHash: true });
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
const COVERAGE_ALIASES = { partial: 'partly answered', partly: 'partly answered', 'partially answered': 'partly answered', unanswered: 'not answered' };
export function coverage(value) {
  value = COVERAGE_ALIASES[value] ?? value;
  if (!coverageValues.includes(value)) throw new Error('Coverage must be answered, partly answered or not answered.');
  return value;
}
export function validateAssessment(state, question, supplied, worker, now = Date.now()) {
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
  question.assessment = { by: worker, at: new Date(now).toISOString() };
  // A gap the checker wrote itself is its own assessment, not an independently confirmed one.
  for (const id of ids) { const gap = state.gaps.find(item => item.id === id); gap.check = { by: worker, result: gap.assessed_by === worker ? 'checker assessment' : 'confirmed', at: new Date(now).toISOString() }; }
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
  // A sentence may state a cited fact's own date, which is part of what was checked.
  numericSupport(value, facts.flatMap(fact => [fact.statement, ...(fact.as_of ? [fact.as_of, String(fact.as_of).replace(/-/g, ' ')] : [])]));
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
// What changed since it was pinned, and what that makes out of date. Only work resting on a changed
// source is affected: facts citing it, the questions they or their gaps belong to, and answers citing
// those facts. A changed claim target invalidates its claim questions. Other inputs are reported only.
export async function changedState(root, state) {
  const sources = new Set(), files = new Set();
  for (const source of state.sources) {
    if (source.stale_since) continue;
    let changed = false;
    if (source.original_file && !await unchanged(root, { file: source.original_file, sha256: source.original_sha256 })) { changed = true; files.add(source.original_file); }
    if (source.file && !await unchanged(root, { file: evidenceFile(source), sha256: source.sha256 })) { changed = true; files.add(evidenceFile(source)); }
    if (changed) sources.add(source.id);
  }
  const claimFiles = new Set(state.claims.map(claim => claim.file)), claims = new Set();
  const informational = [];
  for (const input of state.inputs) {
    if (await unchanged(root, input)) continue;
    files.add(input.file);
    if (claimFiles.has(input.file)) for (const question of state.questions) { if (question.claim?.file === input.file) claims.add(question.id); }
    else if (!state.sources.some(source => source.original_file === input.file || source.file === input.file)) informational.push(input.file);
  }
  const facts = new Set(state.facts.filter(fact => ['candidate', 'confirmed'].includes(fact.status) && fact.citations.some(citation => sources.has(citation.source))).map(fact => fact.key));
  const research = new Set([...claims]);
  for (const fact of state.facts) if (facts.has(fact.key)) fact.questions.forEach(id => research.add(id));
  for (const gap of state.gaps) if (gap.sources.some(id => sources.has(id))) research.add(gap.question);
  const rewrite = new Set(research);
  for (const question of state.questions) {
    const cited = [...(question.headline?.facts ?? []), ...(question.answer ?? []).flatMap(sentence => sentence.facts)];
    if (cited.some(id => facts.has(resolveKey(state, id)))) rewrite.add(question.id);
  }
  return { files: [...files], sources: [...sources], facts: [...facts], research: [...research], rewrite: [...rewrite], claims: [...claims], informational };
}
function resolveKey(state, id) { try { return factFor(state, id).key; } catch { return id; } }
export async function changedInputs(root, state) { return (await changedState(root, state)).files; }
