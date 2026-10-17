import { readFile, lstat, realpath } from 'node:fs/promises';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readText, identifier, text, stable, hash, localFile, exists } from './run-storage.mjs';

export const OWNER = 'harness-research-synthesis';
export const digestSource = s => ({ id: s.id, file: s.file, sha256: s.sha256, ...(s.original_file ? { original_file: s.original_file, original_sha256: s.original_sha256 } : {}) });
export const KINDS = ['summary', 'inference', 'recommendation', 'gap'];
const list = (v, label) => { if (!Array.isArray(v)) throw new Error(`${label} must be an array.`); return v; };
const choice = (v, options, label) => { if (!options.includes(v)) throw new Error(`${label} must be one of ${options.join(', ')}.`); return v; };
const unique = (items, label) => { const ids = new Set(); for (const item of items) { identifier(item.id, label); if (ids.has(item.id)) throw new Error(`Duplicate ${label}: ${item.id}`); ids.add(item.id); } return ids; };
function refs(value, allowed, label, required = true) {
  list(value, label); if (required && !value.length) throw new Error(`${label} needs supporting references.`);
  if (new Set(value).size !== value.length || value.some(id => !allowed.has(id))) throw new Error(`${label} contains duplicate or unknown references.`);
}
function block(value, allowed, label) {
  if (!value || typeof value !== 'object') throw new Error(`${label} requires a typed statement.`);
  text(value.text, label, 30000); choice(value.kind, KINDS, `${label} kind`);
  refs(value.refs, allowed, `${label} refs`, value.kind !== 'gap');
}
export function proseItems(dossier) {
  const items = dossier.sections.flatMap(s => s.blocks.map((b, i) => ({ id: `${s.id}:${i}`, ...b })));
  for (const [ci, c] of (dossier.comparisons || []).entries()) for (const [ri, r] of c.rows.entries()) for (const [si, cell] of r.cells.entries()) items.push({ id: `comparison:${ci}:${ri}:${si}`, ...cell });
  return items;
}
export async function validateDossier(root, input, author) {
  identifier(author, 'Worker');
  if (!input || input.schema !== 2) throw new Error('Dossier schema must be 2.');
  const d = structuredClone(input);
  for (const key of ['topic','audience','purpose','scope']) text(d[key], key, 20000);
  choice(d.source_mode, ['public','selected','mixed'], 'source_mode');
  list(d.sources, 'sources'); list(d.facts, 'facts'); list(d.findings, 'findings'); list(d.sections, 'sections');
  if (!d.sections.length) throw new Error('At least one report section is required.');
  const sourceIds = unique(d.sources, 'source ID'), factIds = unique(d.facts, 'fact ID'), findingIds = unique(d.findings, 'finding ID');
  unique(d.sections, 'section ID');
  const allIds = [...sourceIds, ...factIds, ...findingIds];
  if (new Set(allIds).size !== allIds.length) throw new Error(`Source, fact and finding IDs must be globally distinct. Collisions: ${[...new Set(allIds.filter((id, index) => allIds.indexOf(id) !== index))].join(', ')}.`);
  const captures = [];
  for (const source of d.sources) {
    for (const key of ['origin','title','publisher']) text(source[key], `Source ${key}`);
    choice(source.permission, ['public','selected'], 'Source permission');
    if (d.source_mode !== 'mixed' && source.permission !== d.source_mode) throw new Error('Source permission falls outside source_mode.');
    if (source.permission === 'public') { try { const url = new URL(source.origin); if (!['https:','http:'].includes(url.protocol) || url.username || url.password) throw new Error(); } catch { throw new Error('Public source origin must be an HTTP(S) URL without credentials.'); } }
    choice(source.context, ['full','partial'], 'Source context');
    if (source.context === 'partial') text(source.context_note, 'Partial source context_note');
    for (const key of ['source_date','accessed_at','version']) if (source[key] !== undefined) text(source[key], key);
    text(source.file, 'Source file');
    if (source.file.startsWith('.harness-research/') || /^research\/(report\.md|brief\.md|evidence\.md|facts\.json|output\.json)$/.test(source.file)) throw new Error('Source file cannot be a managed synthesis artifact.');
    const captured = await readText(root, source.file, { withHash: true });
    if (!captured.content.trim()) throw new Error('Source capture must contain readable context.');
    // A local original and its extraction are different evidence objects. Do not silently
    // treat unchanged extracted text as proof the selected original is unchanged.
    let originPath = null;
    if (source.origin.startsWith('file:')) { try { originPath = fileURLToPath(source.origin); } catch { throw new Error('Invalid local source origin.'); } }
    else if (!/^[a-z][a-z0-9+.-]*:/i.test(source.origin)) originPath = resolve(root, source.origin);
    if (originPath && await exists(originPath)) {
      const canonical = await realpath(originPath);
      if (canonical.startsWith(root + sep) && (await lstat(originPath)).isSymbolicLink()) throw new Error('Local source origin must not be a symlink.');
      originPath = canonical;
    }
    if (originPath?.startsWith(root + sep) && await exists(originPath)) {
      const originFile = relative(root, originPath);
      await localFile(root, originFile);
      if (originFile !== source.file && source.original_file !== originFile) throw new Error(`Local source origin requires original_file: ${originFile}`);
    }
    const capture = { id: source.id, file: source.file, sha256: captured.sha256, content: captured.content };
    if (source.original_file !== undefined) {
      text(source.original_file, 'original_file');
      if (source.original_file.startsWith('.harness-research/') || /^research\/(report\.md|brief\.md|evidence\.md|facts\.json|output\.json)$/.test(source.original_file)) throw new Error('Original file cannot be a managed synthesis artifact.');
      const original = await localFile(root, source.original_file);
      if ((await lstat(original)).size > 64 * 1024 * 1024) throw new Error('Original source exceeds 64 MiB. Use a separately identified smaller source.');
      capture.original_file = source.original_file;
      capture.original_sha256 = hash(await readFile(original));
    }
    captures.push(capture);
  }
  for (const fact of d.facts) {
    text(fact.statement, 'Fact statement', 10000); identifier(fact.author, 'Fact author');
    list(fact.citations, 'Fact citations'); if (!fact.citations.length) throw new Error('Facts need exact source quotations.');
    for (const citation of fact.citations) {
      if (!sourceIds.has(citation.source)) throw new Error('Citation references an unknown source.');
      text(citation.quote, 'Exact quote', 30000);
      if (citation.locator !== undefined) text(citation.locator, 'Citation locator');
      if (!captures.find(c => c.id === citation.source).content.includes(citation.quote)) throw new Error(`Exact quote not found in source ${citation.source}.`);
    }
  }
  for (const finding of d.findings) {
    text(finding.title, 'Finding title'); block(finding.summary, factIds, 'Finding summary');
    if (finding.summary.kind === 'gap') throw new Error('Finding summaries require evidence; place unknowns in gaps.');
    refs(finding.support, factIds, 'Finding support'); refs(finding.counter, factIds, 'Finding counter', false);
    for (const group of ['implications','conditions','gaps']) for (const value of list(finding[group], `Finding ${group}`)) block(value, factIds, `Finding ${group}`);
  }
  const evidenceIds = new Set([...factIds, ...findingIds]);
  for (const section of d.sections) { text(section.title, 'Section title'); list(section.blocks, 'Section blocks'); if (!section.blocks.length) throw new Error('Report sections need blocks.'); for (const value of section.blocks) block(value, evidenceIds, 'Report block'); }
  for (const comparison of list(d.comparisons || [], 'comparisons')) {
    text(comparison.title, 'Comparison title'); list(comparison.subjects, 'Comparison subjects');
    if (comparison.subjects.length < 2 || new Set(comparison.subjects).size !== comparison.subjects.length) throw new Error('Comparison requires at least two distinct subjects.');
    comparison.subjects.forEach(s => text(s, 'Comparison subject'));
    const criteria = new Set();
    for (const row of list(comparison.rows, 'Comparison rows')) {
      text(row.criterion, 'Comparison criterion'); if (criteria.has(row.criterion)) throw new Error('Duplicate comparison criterion.'); criteria.add(row.criterion);
      list(row.cells, 'Comparison cells');
      if (row.cells.length !== comparison.subjects.length || new Set(row.cells.map(c => c.subject)).size !== row.cells.length || row.cells.some(c => !comparison.subjects.includes(c.subject))) throw new Error('Each criterion must have exactly one cell per named subject.');
      for (const cell of row.cells) { text(cell.text, 'Comparison cell', 10000); refs(cell.refs, factIds, 'Comparison cell refs'); }
    }
  }
  const pins = captures.map(digestSource);
  const digest = hash(stable({ dossier: d, author, sources: pins }));
  return { dossier: d, author, sources: pins, digest, captures };
}
export function reviewTemplate(state) {
  return { schema: 2, digest: state.digest, originals: state.sources.map(s => ({ source: s.id, sha256: s.sha256, ...(s.original_file ? { original_sha256: s.original_sha256 } : {}), read_original: false })), facts: state.dossier.facts.map(f => ({ id: f.id, verdict: 'pending', note: '' })), findings: state.dossier.findings.map(f => ({ id: f.id, verdict: 'pending', note: '' })), prose: proseItems(state.dossier).map(p => ({ id: p.id, verdict: 'pending', note: '' })), assessment: { coverage: 'pending', usefulness: 'pending', note: '' } };
}
export function validateReview(state, review, worker) {
  identifier(worker, 'Reviewer');
  if ([state.author, ...state.dossier.facts.map(f => f.author)].includes(worker)) throw new Error('Review requires an independent worker distinct from every content author.');
  if (review.schema !== 2 || review.digest !== state.digest) throw new Error('Review digest is stale or schema is invalid.');
  const template = reviewTemplate(state);
  list(review.originals, 'Review originals');
  if (review.originals.length !== state.sources.length || new Set(review.originals.map(s => s.source)).size !== state.sources.length) throw new Error('Review must cover every original source exactly once.');
  let accepted = state.dossier.facts.length > 0 && state.dossier.findings.length > 0;
  for (const source of state.sources) {
    const item = review.originals.find(r => r.source === source.id);
    if (!item || item.sha256 !== source.sha256 || (source.original_file && item.original_sha256 !== source.original_sha256) || typeof item.read_original !== 'boolean') throw new Error('Review must attest reading each exact original source capture.');
    if (!item.read_original) { text(item.access_error, 'Original access_error'); accepted = false; }
  }
  for (const group of ['facts','findings','prose']) {
    list(review[group], `Review ${group}`);
    if (review[group].length !== template[group].length || new Set(review[group].map(r => r.id)).size !== template[group].length) throw new Error(`Review must cover each ${group} item exactly once.`);
    for (const expected of template[group]) { const item = review[group].find(r => r.id === expected.id); if (!item) throw new Error(`Missing review ${expected.id}.`); choice(item.verdict, ['supported','unsupported','narrow'], 'Review verdict'); text(item.note, 'Review explanation', 20000); if (item.verdict !== 'supported') accepted = false; }
  }
  choice(review.assessment?.coverage, ['accurate','needs-revision'], 'Coverage assessment'); choice(review.assessment?.usefulness, ['adequate','needs-revision'], 'Usefulness assessment'); text(review.assessment?.note, 'Assessment explanation', 20000);
  accepted &&= review.assessment.coverage === 'accurate' && review.assessment.usefulness === 'adequate';
  return { ...structuredClone(review), worker, accepted };
}
