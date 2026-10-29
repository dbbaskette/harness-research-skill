// A topic asset places the same portable bundle at its root. Existing cases
// keep their research/ directory and digest representation unchanged.
export const OUTPUT_NAMES = ['report.md', 'brief.md', 'evidence.md', 'facts.json', 'output.json'];
export const outputPrefix = state => state?.layout === 'topic' ? '' : 'research';
export const outputPath = (state, name) => [outputPrefix(state), name].filter(Boolean).join('/');
export function managedSource(name, prefix = 'research') {
  return name === '.harness-research' || name.startsWith('.harness-research/') ||
    OUTPUT_NAMES.some(file => name === [prefix, file].filter(Boolean).join('/')) ||
    (prefix === '' && ['topic.json', 'sources.json', 'asset-manifest.json'].includes(name));
}
export function digestContent(dossier, author, sources, prefix = 'research') {
  return { dossier, author, sources, ...(prefix === '' ? { layout: 'topic' } : {}) };
}
