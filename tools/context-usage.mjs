import { readFile, writeFile, readdir } from 'node:fs/promises';
import { Tiktoken } from 'js-tiktoken/lite';
import ranks from 'js-tiktoken/ranks/cl100k_base';
const root = new URL('../', import.meta.url), encoder = new Tiktoken(ranks), count = source => encoder.encode(source).length;
const paths = ['bootstrap/SKILL.md', 'SKILL.md', ...(await readdir(new URL('references/', root))).filter(name => name.endsWith('.md')).sort().map(name => 'references/' + name)];
const counts = Object.fromEntries(await Promise.all(paths.map(async path => [path, count(await readFile(new URL(path, root), 'utf8'))])));
const entry = await readFile(new URL('SKILL.md', root), 'utf8');
const routes = {
  'Discovery metadata': count(entry.split('---')[1]),
  'Installed bootstrap': counts['bootstrap/SKILL.md'],
  'Bootstrap + current guidance entry': counts['bootstrap/SKILL.md'] + counts['SKILL.md'],
  'Focused research / fact-check with saved report': counts['bootstrap/SKILL.md'] + counts['SKILL.md'] + counts['references/workflow.md'] + counts['references/evidence.md'],
  'Comparative workflow routing': counts['bootstrap/SKILL.md'] + counts['SKILL.md'] + counts['references/comparative.md'],
  'Legacy migration': counts['bootstrap/SKILL.md'] + counts['SKILL.md'] + counts['references/migration.md'],
};
const report = 'Measured with `cl100k_base`; cumulative whole-file instruction counts.\n\n| Reading path | Tokens |\n| --- | ---: |\n' + Object.entries(routes).map(([label, value]) => `| ${label} | ${value.toLocaleString('en-US')} |`).join('\n') + '\n\nOne source strategy, selected comparative resources and evidence add conditional\ncontext. The complete upstream bundle is never a default loading path.\n';
const file = new URL('README.md', root), readme = await readFile(file, 'utf8'), pattern = /<!-- CONTEXT-USAGE:START -->[\s\S]*?<!-- CONTEXT-USAGE:END -->/;
if (!pattern.test(readme)) throw new Error('Missing context report markers');
const next = readme.replace(pattern, `<!-- CONTEXT-USAGE:START -->\n${report}<!-- CONTEXT-USAGE:END -->`);
if (process.argv.includes('--write')) await writeFile(file, next);
else if (readme !== next) { console.error('Context counts changed; run npm run context:update'); process.exitCode = 1; }
console.log(JSON.stringify({ routes, files: counts }, null, 2));
