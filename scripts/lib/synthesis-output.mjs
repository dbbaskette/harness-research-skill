import { hash } from './run-storage.mjs';
import { OWNER } from './synthesis-model.mjs';

// Authored text is data: escape markup, HTML and newlines before putting it in generated Markdown.
export const md = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/([\\`*_{}\[\]()#+!|~])/g, '\\$1').replace(/[\r\n]+/g, ' ');
const json = value => JSON.stringify(value, null, 2) + '\n';
const anchor = id => `evidence.md#${id}`;
const references = ids => ids.map(id => `[${id}](${anchor(id)})`).join(', ');
const statement = b => `${md(b.text)}${b.refs.length ? ` (${references(b.refs)})` : ''}`;
const typedStatement = b => `**${{ summary: 'Summary', inference: 'Interpretation', recommendation: 'Conditional recommendation', gap: 'Open question' }[b.kind]}:** ${statement(b)}`;
function banner(status) {
  return `> ${status === 'complete' ? 'Reviewed synthesis' : status === 'needs-revision' ? 'Needs revision — independent review identified issues' : status === 'stale' ? 'Stale — evidence has changed or is unavailable; revise and review again' : 'Draft — independent review is pending'}.\n\n`;
}
export function renderOutputs(state, status) {
  const d = state.dossier;
  const heading = `# ${md(d.topic)}\n\n` + banner(status);
  let report = heading;
  for (const section of d.sections) { report += `## ${md(section.title)}\n\n`; for (const b of section.blocks) report += statement(b) + '\n\n'; }
  for (const c of d.comparisons || []) {
    report += `## ${md(c.title)}\n\n| Criterion | ${c.subjects.map(md).join(' | ')} |\n| --- | ${c.subjects.map(() => '---').join(' | ')} |\n`;
    for (const row of c.rows) report += `| ${md(row.criterion)} | ${c.subjects.map(subject => { const cell = row.cells.find(c => c.subject === subject); return `${md(cell.text)} (${references(cell.refs)})`; }).join(' | ')} |\n`;
    report += '\n';
  }
  const partial = d.sources.filter(s => s.context === 'partial');
  if (partial.length) report += `## Source limitations\n\n${partial.map(s => `- ${md(s.title)}: partial capture. ${md(s.context_note)}`).join('\n')}\n\n`;
  report += `## Research context\n\n**Audience:** ${md(d.audience)}\n\n**Purpose:** ${md(d.purpose)}\n\n**Scope:** ${md(d.scope)}\n\n[Reusable findings](brief.md) · [Evidence and review](evidence.md)\n`;
  let brief = heading + `Audience: ${md(d.audience)}. Purpose: ${md(d.purpose)}.\n\n`;
  const factsById = new Map(d.facts.map(f => [f.id, f]));
  const evidenceStatements = ids => ids.map(id => `- ${md(factsById.get(id).statement)} (${references([id])})`).join('\n');
  if (d.brief) {
    for (const section of d.brief) {
      brief += `## ${md(section.title)}\n\n`;
      for (const b of section.blocks) brief += statement(b) + '\n\n';
    }
  } else for (const f of d.findings) {
    brief += `## ${md(f.title)}\n\n${statement(f.summary)}\n\n`;
    if (f.support.length) brief += `**Supporting evidence**\n\n${evidenceStatements(f.support)}\n\n`;
    if (f.counter.length) brief += `**Counterevidence**\n\n${evidenceStatements(f.counter)}\n\n`;
    for (const [key, label] of [['implications','Implications'],['conditions','Qualifications to preserve'],['gaps','Gaps']]) if (f[key].length) brief += `**${label}**\n\n${f[key].map(b => `- ${statement(b)}`).join('\n')}\n\n`;
  }
  if (!d.brief && !d.findings.length) brief += 'No evidence-backed findings have been recorded yet.\n';
  let evidence = heading + `Source hashes establish capture integrity; they do not establish truth.\n\nContent digest: \`${state.digest}\`. Author: ${md(state.author)}.\n\n`;
  for (const f of d.facts) {
    evidence += `<a id="${f.id}"></a>\n## ${md(f.id)}\n\n${md(f.statement)}\n\nAuthor: ${md(f.author)}\n\n`;
    for (const c of f.citations) evidence += `> ${md(c.quote)}\n\nSource: [${c.source}](#${c.source})${c.locator ? `, ${md(c.locator)}` : ''}.\n\n`;
  }
  for (const f of d.findings) {
    evidence += `<a id="${f.id}"></a>\n## ${md(f.title)}\n\n${typedStatement(f.summary)}\n\nSupporting facts: ${references(f.support)}. Counterevidence: ${f.counter.length ? references(f.counter) : 'none recorded'}.\n\n`;
    for (const [key, label] of [['implications','Implications'],['conditions','Qualifications to preserve'],['gaps','Gaps']]) if (f[key].length) evidence += `### ${label}\n\n${f[key].map(b => `- ${typedStatement(b)}`).join('\n')}\n\n`;
  }
  for (const [label, sections] of [['Report prose', d.sections], ['Authored brief prose', d.brief || []]]) {
    if (!sections.length) continue;
    evidence += `## ${label}\n\n`;
    for (const section of sections) {
      evidence += `### ${md(section.title)}\n\n`;
      for (const b of section.blocks) evidence += typedStatement(b) + '\n\n';
    }
  }
  for (const s of d.sources) {
    const pin = state.sources.find(p => p.id === s.id);
    const origin = /^https?:\/\//.test(s.origin) ? `[Original source](${s.origin.replace(/[\s<>()[\]\\]/g, c => '%' + c.charCodeAt(0).toString(16).toUpperCase().padStart(2, '0'))})` : md(s.origin);
    evidence += `<a id="${s.id}"></a>\n## ${md(s.title)}\n\n${origin} · ${md(s.publisher)} · ${md(s.permission)} · ${md(s.context)} context\n\n`;
    if (s.context_note) evidence += md(s.context_note) + '\n\n';
    for (const key of ['source_date','accessed_at','version']) if (s[key]) evidence += `${key}: ${md(s[key])}\n\n`;
    if (pin.original_snapshot) evidence += `Original: [saved original](${pin.original_snapshot.slice('research/'.length)}); SHA-256: \`${pin.original_sha256}\`.\n\n`;
    evidence += `Capture: [saved context](${pin.snapshot.startsWith('research/') ? pin.snapshot.slice('research/'.length) : '../' + pin.snapshot}); SHA-256: \`${pin.sha256}\`.\n\n`;
  }
  if (state.review) {
    evidence += `## Independent review\n\nReviewer: ${md(state.review.worker)}. ${md(state.review.assessment.note)}\n\n`;
    for (const r of state.review.originals) if (!r.read_original) evidence += `- ${md(r.source)} — original unavailable: ${md(r.access_error)}\n`;
    for (const group of ['facts','findings','prose']) for (const r of state.review[group]) evidence += `- ${md(r.id)} — ${md(r.verdict)}: ${md(r.note)}\n`;
  } else evidence += '## Independent review\n\nPending. Exact quote matching and source hashes are mechanical checks, not semantic evidence review.\n';
  const facts = { owner: OWNER, schema: 2, digest: state.digest, status, topic: d.topic, audience: d.audience, purpose: d.purpose, scope: d.scope, source_mode: d.source_mode, sources: d.sources.map(s => ({ ...s, ...state.sources.find(p => p.id === s.id) })), facts: d.facts, findings: d.findings, sections: d.sections, brief: d.brief || null, comparisons: d.comparisons || [], review: state.review || null };
  const files = { 'report.md': report, 'brief.md': brief, 'evidence.md': evidence, 'facts.json': json(facts) };
  files['output.json'] = json({ owner: OWNER, schema: 2, digest: state.digest, status, artifacts: [...Object.entries(files).map(([file, bytes]) => ({ file, sha256: hash(bytes) })), ...[...new Map(state.sources.flatMap(s => [[s.snapshot, s.sha256], ...(s.original_snapshot ? [[s.original_snapshot, s.original_sha256]] : [])]).filter(([file]) => file.startsWith('research/')).map(([file, sha256]) => [file, { file: file.slice('research/'.length), sha256 }])).values()]] });
  return files;
}
