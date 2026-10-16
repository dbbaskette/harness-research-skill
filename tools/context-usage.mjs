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
    readingPaths[name] = path([...queued, 'references/strategies.md', `upstream/codex/agents/web-search-modules/${strategy}.md`]);
  const standalone = Object.fromEntries(Object.entries(readingPaths).map(([name, route]) => [name, path(['bootstrap/SKILL.md', ...route.files.map(x => x.path)], ['guidanceStart', ...route.helpers.map(x => x.name)])]));
  const description = contents['SKILL.md'].match(/^name:.*\n.*description:.*$/m)?.[0];
  if (!description) throw new Error('Missing skill metadata');
  const activation = files['bootstrap/SKILL.md'] + files['SKILL.md'];
  const routes = { 'Discovery metadata': count(description), 'Installed bootstrap': files['bootstrap/SKILL.md'], 'Bootstrap + current guidance entry': activation,
    'Research worker subagent': readingPaths.researchWorker.total, 'Checker subagent': readingPaths.checkWorker.total, 'Writer or reviewer subagent': readingPaths.writeWorker.total, 'Refresh worker': readingPaths.refreshWorker.total,
    ...Object.fromEntries(Object.entries({ queued: 'Coordinator: skill research with independent checks and saved report', reuse: 'Verify, research again, reuse or refresh', quick: 'Explicit chat-only cited answer', focused: 'Legacy manual research with saved report', resume: 'Status / resume without new findings', comparative: 'Comparative routing only', codexoutline: 'Codex comparative outline', codexitems: 'Codex add items', codexfields: 'Codex add fields', codexdeep: 'Codex deep results', codexdeepSaved: 'Codex deep results + saved evidence', claudeoutline: 'Claude comparative outline', claudedeep: 'Claude deep results', general: 'Saved research + general web strategy', academic: 'Saved research + academic strategy', github: 'Saved research + GitHub strategy', technical: 'Saved research + technical Q&A strategy', chinese: 'Saved research + Chinese sources strategy', migration: 'Legacy migration' }).map(([name, label]) => [label, standalone[name].total])) };
  const hashes = Object.fromEntries(paths.map(path => [path, createHash('sha256').update(contents[path]).digest('hex')]));
  const inputDigest = createHash('sha256').update(JSON.stringify({ hashes, outputs, readingPaths, routes })).digest('hex');
  return { tokenizer: 'cl100k_base', inputDigest, files, samples, readingPaths, standalone, routes };
}
export function renderReport(data) {
  return 'Measured with `cl100k_base`; cumulative instruction counts, including a normalized\nrepresentative guidance-start response. Bootstrap activation is shown separately.\n\n| Reading path | Tokens |\n| --- | ---: |\n' + Object.entries(data.routes).map(([label, value]) => `| ${label} | ${value.toLocaleString('en-US')} |`).join('\n') + '\n\nComparative rows include the selected platform resource, not the complete bundle.\nWorker rows count only the file a task\'s `guide` names, without the\nbootstrap or entry. Each strategy row includes one router and one strategy. Status/resume skips plan\nand finding schemas until a new save is needed. Only explicitly requested chat-only\nanswers omit saved artifacts; default research uses the skill task/evidence workflow. Source\ncontent, images, research task responses and conversation add separately. The JSON\nreport also exposes direct-handoff paths without the bootstrap/start response.\n';
}
// The progressive disclosure map: what loads at each step, from the same measurements as the table.
const tokens = n => n < 1000 ? `${n} tokens` : `~${(n / 1000).toFixed(1)}k`;
const range = values => values.length ? `${tokens(Math.min(...values))}–${tokens(Math.max(...values)).replace('~', '')}` : '';
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
  const r = data.routes, pick = prefix => Object.entries(r).filter(([label]) => prefix(label)).map(([, value]) => value);
  const comparative = pick(label => label === 'Comparative routing only' || /^(Codex|Claude) /.test(label)), strategies = pick(label => label.startsWith('Saved research + '));
  const main = '#005C8A', worker = '#6C4B94', legacy = '#6B7280', W = 240, xs = [24, 288, 552, 816];
  const rows = [
    box(24, 80, 300, main, 'Skill discovery', tokens(r['Discovery metadata']), 'Name and description, always visible'),
    box(390, 80, 300, main, 'Installed bootstrap', tokens(r['Installed bootstrap']), 'Picks and pins the guidance release'),
    box(756, 80, 300, main, 'Guidance entry', tokens(r['Bootstrap + current guidance entry']), 'SKILL.md routes to one path'),
    box(xs[0], 230, W, main, 'Checked research run', tokens(r['Coordinator: skill research with independent checks and saved report']), 'Coordinator: run guide + 2 contracts'),
    box(xs[1], 230, W, main, 'Verify, again, reuse', tokens(r['Verify, research again, reuse or refresh']), 'Follow-ups on saved research'),
    box(xs[2], 230, W, main, 'Status or resume', tokens(r['Status / resume without new findings']), 'No new findings'),
    box(xs[3], 230, W, main, 'Chat-only answer', tokens(r['Explicit chat-only cited answer']), 'Only when asked for no saved report'),
    box(xs[0], 400, W, worker, 'Researcher', tokens(r['Research worker subagent']), 'task-research.md'),
    box(xs[1], 400, W, worker, 'Checker', tokens(r['Checker subagent']), 'task-check.md'),
    box(xs[2], 400, W, worker, 'Writer or reviewer', tokens(r['Writer or reviewer subagent']), 'task-write.md'),
    box(xs[3], 400, W, worker, 'Refresh reader', tokens(r['Refresh worker']), 'reuse.md'),
    box(xs[0], 570, W, legacy, 'Manual 0.8 workflow', tokens(r['Legacy manual research with saved report']), 'plan and record commands', true),
    box(xs[1], 570, W, legacy, 'Comparative outlines', range(comparative), 'One preserved upstream resource', true),
    box(xs[2], 570, W, legacy, 'Source strategies', range(strategies), 'Run guidance + one strategy', true),
    box(xs[3], 570, W, legacy, 'Older Brand records', tokens(r['Legacy migration']), 'Migration', true),
  ];
  const centre = x => x + W / 2;
  const arrows = [
    'M324 128 H390', 'M690 128 H756',
    `M906 176 V202 H${centre(xs[0])} V230`, `M${centre(xs[1])} 202 V230`, `M${centre(xs[2])} 202 V230`, `M${centre(xs[3])} 202 V230`,
  ].map(d => `      <path d="${d}"/>`);
  // One dashed trunk from the coordinator, then a drop to each worker; only the drops carry arrowheads.
  const trunk = `      <path d="M${centre(xs[0])} 326 V378 H${centre(xs[3])}"/>`;
  const workers = xs.map(x => `      <path d="M${centre(x)} 378 V400" marker-end="url(#arrow-worker)"/>`);
  const description = `Progressive disclosure, cumulative instruction tokens measured with cl100k_base. Discovery ${tokens(r['Discovery metadata'])}, installed bootstrap ${tokens(r['Installed bootstrap'])}, guidance entry ${tokens(r['Bootstrap + current guidance entry'])}. Paths: checked research run ${tokens(r['Coordinator: skill research with independent checks and saved report'])}, verify/again/reuse/refresh ${tokens(r['Verify, research again, reuse or refresh'])}, status or resume ${tokens(r['Status / resume without new findings'])}, chat-only answer ${tokens(r['Explicit chat-only cited answer'])}. Worker subagents read only their own contract: researcher ${tokens(r['Research worker subagent'])}, checker ${tokens(r['Checker subagent'])}, writer or reviewer ${tokens(r['Writer or reviewer subagent'])}, refresh reader ${tokens(r['Refresh worker'])}. Legacy paths: manual workflow ${tokens(r['Legacy manual research with saved report'])}, comparative outlines ${range(comparative)}, source strategies ${range(strategies)}, older Brand records ${tokens(r['Legacy migration'])}. One path is loaded, not the sum.`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="700" viewBox="0 0 1080 700" role="img" aria-labelledby="title description">
  <title id="title">Harness Research: progressive context loading</title>
  <desc id="description">${escape(description)}</desc>
  <!-- Input digest: ${data.inputDigest} -->
  <defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${main}"/></marker><marker id="arrow-worker" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 L10 5 L0 10 z" fill="${worker}"/></marker></defs>
  <rect width="1080" height="700" rx="16" fill="#F5F7F9"/>
  <g font-family="Arial, Helvetica, sans-serif" fill="#1B1D36">
    <text x="24" y="36" font-size="24" font-weight="700">Load what the task needs</text>
    <text x="24" y="59" font-size="15">Cumulative instruction tokens. Each request takes one path; branches are not added together.</text>
    <g fill="none" stroke="${main}" stroke-width="2" marker-end="url(#arrow)">
${arrows.join('\n')}
    </g>
    <text x="164" y="356" font-size="14" fill="${worker}" font-weight="700">The coordinator hands each task a guide; a worker subagent reads only that file.</text>
    <g fill="none" stroke="${worker}" stroke-width="2" stroke-dasharray="6 4">
${trunk}
${workers.join('\n')}
    </g>
    <text x="24" y="556" font-size="14" fill="${legacy}" font-weight="700">Kept for older callers: routed from the entry only when that work is asked for.</text>
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
