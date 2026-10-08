import { readFile, writeFile, readdir } from 'node:fs/promises';
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
  const guidanceResult = JSON.stringify({ freshness: 'current-at-start', revision: createHash('sha256').update('sample guidance revision').digest('hex').slice(0, 40), task: createHash('sha256').update('sample guidance task').digest('hex').slice(0, 32), guidance: '<guidance>/SKILL.md', runtime: '<runtime>' }, null, 2) + '\n';
  const outputs = { guidanceStart: guidanceResult };

  const samples = Object.fromEntries(Object.entries(outputs).map(([name, value]) => [name, count(value)]));
  const path = (paths, helpers = []) => readingPath(paths, files, samples, helpers);
  const entry = ['SKILL.md'];
  const focused = [...entry, 'references/workflow.md', 'references/evidence.md'];
  const compare = [...entry, 'references/comparative.md'];
  const readingPaths = {
    focused: path(focused), quick: path([...entry, 'references/workflow.md']),
    resume: path([...entry, 'references/resume.md']),
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
    readingPaths[name] = path([...focused, 'references/strategies.md', `upstream/codex/agents/web-search-modules/${strategy}.md`]);
  const standalone = Object.fromEntries(Object.entries(readingPaths).map(([name, route]) => [name, path(['bootstrap/SKILL.md', ...route.files.map(x => x.path)], ['guidanceStart', ...route.helpers.map(x => x.name)])]));
  const description = contents['SKILL.md'].match(/^name:.*\n.*description:.*$/m)?.[0];
  if (!description) throw new Error('Missing skill metadata');
  const activation = files['bootstrap/SKILL.md'] + files['SKILL.md'];
  const routes = { 'Discovery metadata': count(description), 'Installed bootstrap': files['bootstrap/SKILL.md'], 'Bootstrap + current guidance entry': activation,
    ...Object.fromEntries(Object.entries({ quick: 'Explicit chat-only cited answer', focused: 'Focused research with saved report', resume: 'Status / resume without new findings', comparative: 'Comparative routing only', codexoutline: 'Codex comparative outline', codexitems: 'Codex add items', codexfields: 'Codex add fields', codexdeep: 'Codex deep results', codexdeepSaved: 'Codex deep results + saved evidence', claudeoutline: 'Claude comparative outline', claudedeep: 'Claude deep results', general: 'Saved research + general web strategy', academic: 'Saved research + academic strategy', github: 'Saved research + GitHub strategy', technical: 'Saved research + technical Q&A strategy', chinese: 'Saved research + Chinese sources strategy', migration: 'Legacy migration' }).map(([name, label]) => [label, standalone[name].total])) };
  const hashes = Object.fromEntries(paths.map(path => [path, createHash('sha256').update(contents[path]).digest('hex')]));
  const inputDigest = createHash('sha256').update(JSON.stringify({ hashes, outputs, readingPaths, routes })).digest('hex');
  return { tokenizer: 'cl100k_base', inputDigest, files, samples, readingPaths, standalone, routes };
}
export function renderReport(data) {
  return 'Measured with `cl100k_base`; cumulative instruction counts, including a normalized\nrepresentative guidance-start response. Bootstrap activation is shown separately.\n\n| Reading path | Tokens |\n| --- | ---: |\n' + Object.entries(data.routes).map(([label, value]) => `| ${label} | ${value.toLocaleString('en-US')} |`).join('\n') + '\n\nComparative rows include the selected platform resource, not the complete bundle.\nEach strategy row includes one router and one strategy. Status/resume skips plan\nand finding schemas until a new save is needed. Only explicitly requested chat-only\nanswers omit the saved queue; default research uses the evidence contract. Source\ncontent, images, research helper results and conversation add separately. The JSON\nreport also exposes direct-handoff paths without the bootstrap/start response.\n';
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
  if (args.includes('--write')) await writeFile(url, next);
  else if (readme !== next) throw new Error('Context counts changed; run npm run context:update');
  console.log(JSON.stringify({ routes: data.routes, inputDigest: data.inputDigest }, null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
