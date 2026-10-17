import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { Tiktoken } from 'js-tiktoken/lite';
import ranks from 'js-tiktoken/ranks/cl100k_base';
const root = new URL('../', import.meta.url), exec = promisify(execFile);
export function readingPath(paths, files, helpers = {}, samples = []) {
  const selected = [...new Set(paths)].map(path => {
    if (!Object.hasOwn(files, path)) throw new Error(`Unknown instruction file: ${path}`);
    return { path, tokens: files[path] };
  });
  const results = [...new Set(samples)].map(name => {
    if (!Object.hasOwn(helpers, name)) throw new Error(`Unknown helper sample: ${name}`);
    return { name, tokens: helpers[name] };
  });
  return { files: selected, helpers: results, total: [...selected, ...results].reduce((n, x) => n + x.tokens, 0) };
}
export async function measureContext() {
  const encoder = new Tiktoken(ranks), count = source => encoder.encode(source).length;
  const refs = (await readdir(new URL('references/', root))).filter(name => name.endsWith('.md')).sort().map(name => 'references/' + name);
  const paths = ['bootstrap/SKILL.md', 'SKILL.md', ...refs, ...['upstream/codex/agents/web-search-modules/academic-papers.md', 'upstream/codex/agents/web-search-modules/chinese-tech.md', 'upstream/codex/agents/web-search-modules/general-web.md', 'upstream/codex/agents/web-search-modules/github-debug.md', 'upstream/codex/agents/web-search-modules/stackoverflow.md', 'upstream/codex/skills/research/SKILL.md', 'upstream/codex/skills/research-add-fields/SKILL.md', 'upstream/codex/skills/research-add-items/SKILL.md', 'upstream/codex/skills/research-deep/SKILL.md', 'upstream/codex/skills/research-report/SKILL.md', 'upstream/claude/agents/web-search-agent.md', 'upstream/claude/agents/web-search-modules/academic-papers.md', 'upstream/claude/agents/web-search-modules/chinese-tech.md', 'upstream/claude/agents/web-search-modules/general-web.md', 'upstream/claude/agents/web-search-modules/github-debug.md', 'upstream/claude/agents/web-search-modules/stackoverflow.md', 'upstream/claude/skills/research/SKILL.md', 'upstream/claude/skills/research-add-fields/SKILL.md', 'upstream/claude/skills/research-add-items/SKILL.md', 'upstream/claude/skills/research-deep/SKILL.md', 'upstream/claude/skills/research-report/SKILL.md']];
  const contents = Object.fromEntries(await Promise.all(paths.map(async path => [path, await readFile(new URL(path, root), 'utf8')])));
  const files = Object.fromEntries(paths.map(path => [path, count(contents[path])]));
  // Representative start response shape, normalized paths; no fetch or account access.
  const pkg = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
  const manifest = JSON.parse(await readFile(new URL('guidance/manifest.json', root), 'utf8'));
  const guidanceResult = JSON.stringify({ freshness: 'current-at-start', runtimeVersion: pkg.version, guidanceVersion: manifest.version ?? null, revision: createHash('sha256').update('sample guidance revision').digest('hex').slice(0, 40), task: createHash('sha256').update('sample guidance task').digest('hex').slice(0, 32), guidance: '<guidance>/SKILL.md', runtime: '<runtime>' }, null, 2) + '\n';
  const outputs = { guidanceStart: guidanceResult };

  const samples = Object.fromEntries(Object.entries(outputs).map(([name, value]) => [name, count(value)]));
  const path = (paths, helpers = []) => readingPath(paths, files, samples, helpers);
  const entry = ['SKILL.md'];
  const focused = [...entry, 'references/workflow.md', 'references/evidence.md'];
  // The coordinator reads the run guidance and the contracts for the tasks it does itself (source,
  // plan, cross-check); a worker subagent reads only the one file its task's guide names.
  const queued = [...entry, 'references/research-run.md', 'references/task-research.md', 'references/task-write.md'];
  const compare = [...entry, 'references/comparative.md'];
  const readingPaths = {
    synthesisCoordinator: path([...entry, 'references/synthesis-workflow.md']),
    synthesisFull: path([...entry, 'references/synthesis-workflow.md', 'references/investigate.md', 'references/synthesize.md', 'references/review-synthesis.md']),
    investigator: path(['references/investigate.md']), synthesisWriter: path(['references/synthesize.md']), synthesisReviewer: path(['references/review-synthesis.md']),
    synthesisReuse: path([...entry, 'references/synthesis-reuse.md']),
    studioHandoff: path([...entry, 'references/synthesis-workflow.md', 'references/studio-handoff.md']),
    queued: path(queued), researchWorker: path(['references/task-research.md']), checkWorker: path(['references/task-check.md']), writeWorker: path(['references/task-write.md']), refreshWorker: path(['references/reuse.md']), focused: path(focused), quick: path([...entry, 'references/workflow.md']),
    resume: path([...entry, 'references/resume.md']),
    reuse: path([...entry, 'references/reuse.md']),
    comparative: path(compare), migration: path([...entry, 'references/migration.md']),
  };
  for (const platform of ['codex', 'claude']) {
    for (const [operation, resource] of Object.entries({ outline: 'research', items: 'research-add-items', fields: 'research-add-fields', deep: 'research-deep' })) {
      const selected = [...compare, `upstream/${platform}/skills/${resource}/SKILL.md`];
      readingPaths[`${platform}${operation}`] = path(selected);
      if (operation === 'deep') readingPaths[`${platform}deepSaved`] = path([...selected, 'references/evidence.md']);
    }
  }
  for (const [name, strategy] of Object.entries({ general: 'general-web', academic: 'academic-papers', github: 'github-debug', technical: 'stackoverflow', chinese: 'chinese-tech' }))
    readingPaths[name] = path([...entry, 'references/synthesis-workflow.md', 'references/investigate.md', 'references/strategies.md', `upstream/codex/agents/web-search-modules/${strategy}.md`]);
  const standalone = Object.fromEntries(Object.entries(readingPaths).map(([name, route]) => [name, path(['bootstrap/SKILL.md', ...route.files.map(x => x.path)], ['guidanceStart', ...route.helpers.map(x => x.name)])]));
  const description = contents['SKILL.md'].match(/^name:.*\n.*description:.*$/m)?.[0];
  if (!description) throw new Error('Missing skill metadata');
  const activation = files['bootstrap/SKILL.md'] + files['SKILL.md'];
  const routes = { 'Discovery metadata': count(description), 'Installed bootstrap': files['bootstrap/SKILL.md'], 'Bootstrap + current guidance entry': activation,
    'Investigator stage': readingPaths.investigator.total, 'Synthesis writer stage': readingPaths.synthesisWriter.total, 'Independent reviewer stage': readingPaths.synthesisReviewer.total,
    ...Object.fromEntries(Object.entries({ synthesisCoordinator: 'New synthesis: coordinator entry and workflow', synthesisFull: 'New synthesis: all stages in one context', synthesisReuse: 'Synthesis resume, verify or refresh', studioHandoff: 'Optional studio task handoff',
      queued: 'Legacy 0.9 queued coordinator', reuse: 'Legacy 0.9 reuse or refresh', quick: 'Legacy explicit chat-only answer', focused: 'Legacy manual saved research', resume: 'Legacy manual status or resume', comparative: 'Legacy comparative routing only', codexoutline: 'Legacy Codex comparative outline', codexitems: 'Legacy Codex add items', codexfields: 'Legacy Codex add fields', codexdeep: 'Legacy Codex deep results', codexdeepSaved: 'Legacy Codex deep results + saved evidence', claudeoutline: 'Legacy Claude comparative outline', claudedeep: 'Legacy Claude deep results', general: 'Investigation + general web strategy', academic: 'Investigation + academic strategy', github: 'Investigation + GitHub strategy', technical: 'Investigation + technical Q&A strategy', chinese: 'Investigation + Chinese sources strategy', migration: 'Legacy migration' }).map(([name, label]) => [label, standalone[name].total])) };
  const hashes = Object.fromEntries(paths.map(path => [path, createHash('sha256').update(contents[path]).digest('hex')]));
  const inputDigest = createHash('sha256').update(JSON.stringify({ hashes, outputs, readingPaths, routes })).digest('hex');
  return { tokenizer: 'cl100k_base', inputDigest, files, samples, readingPaths, standalone, routes };
}
export function renderReport(data) {
  return 'Measured with `cl100k_base`; cumulative instruction counts include a normalized\nrepresentative guidance-start response. Stage-only rows count their own reference.\n\n| Reading path | Tokens |\n| --- | ---: |\n' + Object.entries(data.routes).map(([label, value]) => `| ${label} | ${value.toLocaleString('en-US')} |`).join('\n') + '\n\nThe new default starts with the entry and synthesis workflow. Investigation, writing\nand independent review each load their own reference when needed. The all-stages\nrow shows their cumulative cost if read in one context; delegated stage rows are\nseparate contexts. Synthesis reuse does not load investigation or writing contracts\nuntil new work is needed. Strategy rows add exactly one source strategy. Legacy\nqueue, manual and comparative paths remain available only for existing callers.\nSource documents, evidence payloads, tool responses and conversation add separately.\nThe JSON output also exposes direct-checkout paths without bootstrap/start overhead.\n';
}
// The progressive disclosure map: what loads at each step, from the same measurements as the table.
const tokens = n => n < 1000 ? `${n} tokens` : `~${(n / 1000).toFixed(1)}k`;
const escape = value => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
function box(x, y, w, color, title, value, note, dashed = false) {
  return `  <g transform="translate(${x} ${y})">
    <rect width="${w}" height="96" rx="12" fill="white" stroke="${color}" stroke-width="2"${dashed ? ' stroke-dasharray="6 4"' : ''}/>
    <text x="16" y="26" font-size="17" font-weight="700" fill="${color}">${escape(title)}</text>
    <text x="16" y="56" font-size="26" font-weight="700">${escape(value)}</text>
    <text x="16" y="80" font-size="13">${escape(note)}</text>
  </g>`;
}
export function renderMap(data) {
  const r = data.routes, main = '#005C8A', stage = '#6C4B94', legacy = '#6B7280';
  const rows = [
    box(24, 80, 328, main, 'Skill discovery', tokens(r['Discovery metadata']), 'Name and description, always visible'),
    box(376, 80, 328, main, 'Installed bootstrap', tokens(r['Installed bootstrap']), 'Pins compatible stable guidance'),
    box(728, 80, 328, main, 'Guidance entry', tokens(r['Bootstrap + current guidance entry']), 'Routes to the needed workflow'),
    box(24, 230, 328, main, 'Synthesis coordinator', tokens(r['New synthesis: coordinator entry and workflow']), 'Entry + synthesis-workflow.md'),
    box(376, 230, 328, main, 'Resume or refresh', tokens(r['Synthesis resume, verify or refresh']), 'Entry + synthesis-reuse.md'),
    box(728, 230, 328, main, 'All stages in one context', tokens(r['New synthesis: all stages in one context']), 'Cumulative, if one agent reads all stages'),
    box(24, 400, 328, stage, 'Investigate', tokens(r['Investigator stage']), 'investigate.md, when gathering evidence'),
    box(376, 400, 328, stage, 'Synthesize', tokens(r['Synthesis writer stage']), 'synthesize.md, when writing the report'),
    box(728, 400, 328, stage, 'Independent review', tokens(r['Independent reviewer stage']), 'review-synthesis.md, in a separate review'),
    box(24, 570, 328, legacy, 'Legacy queue', tokens(r['Legacy 0.9 queued coordinator']), 'Existing 0.9 callers only', true),
    box(376, 570, 328, legacy, 'Legacy manual research', tokens(r['Legacy manual saved research']), 'Older plan and record callers', true),
    box(728, 570, 328, legacy, 'Legacy comparative route', tokens(r['Legacy comparative routing only']), 'One upstream resource when selected', true),
  ];
  const description = Object.entries(r).filter(([label]) => !label.startsWith('Investigation +') && !label.startsWith('Legacy')).map(([label, value]) => `${label}: ${tokens(value)}`).join('. ') + '. Each stage loads when needed. Branches are not added together; all-stages total is shown explicitly.';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="700" viewBox="0 0 1080 700" role="img" aria-labelledby="title description">
  <title id="title">Harness Research: progressive context loading</title>
  <desc id="description">${escape(description)}</desc>
  <!-- Input digest: ${data.inputDigest} -->
  <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${main}"/></marker></defs>
  <rect width="1080" height="700" rx="16" fill="#F5F7F9"/>
  <g font-family="Arial, Helvetica, sans-serif" fill="#1B1D36">
    <text x="24" y="36" font-size="24" font-weight="700">Load what the task needs</text>
    <text x="24" y="59" font-size="15">New work follows synthesis. Stage references load progressively; legacy routes stay separate.</text>
    <g fill="none" stroke="${main}" stroke-width="2" marker-end="url(#arrow)">
      <path d="M352 128 H376"/><path d="M704 128 H728"/>
      <path d="M892 176 V202 H188 V230"/><path d="M540 202 V230"/>
    </g>
    <text x="24" y="356" font-size="14" fill="${stage}" font-weight="700">Each stage reads its own contract; independent review remains a separate invocation.</text>
    <text x="24" y="556" font-size="14" fill="${legacy}" font-weight="700">Compatibility routes are loaded only when the existing work needs them.</text>
${rows.join('\n')}
  </g>
</svg>
`;
}
export async function main() {
  const args = process.argv.slice(2);
  if (args.some(x => !['--write', '--check', '--json'].includes(x)) || args.length > 1) throw new Error('Choose --write, --check or --json');
  const data = await measureContext();
  if (args.includes('--json')) { console.log(JSON.stringify(data, null, 2)); return; }
  const url = new URL('README.md', root), readme = await readFile(url, 'utf8');
  const pattern = /<!-- CONTEXT-USAGE:START -->[\s\S]*?<!-- CONTEXT-USAGE:END -->/;
  if (!pattern.test(readme) || (readme.match(/<!-- CONTEXT-USAGE:START -->/g) ?? []).length !== 1) throw new Error('Expected one context report marker pair');
  const next = readme.replace(pattern, `<!-- CONTEXT-USAGE:START -->\n${renderReport(data)}<!-- CONTEXT-USAGE:END -->`);
  const mapUrl = new URL('docs/images/context-loading.svg', root), map = renderMap(data);
  const savedMap = await readFile(mapUrl, 'utf8').catch(() => null);
  if (args.includes('--write')) { await mkdir(new URL('docs/images/', root), { recursive: true }); await writeFile(url, next); await writeFile(mapUrl, map); }
  else if (readme !== next || savedMap !== map) throw new Error('Context counts changed; run npm run context:update');
  console.log(JSON.stringify({ routes: data.routes, inputDigest: data.inputDigest }, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
