import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { measureContext, renderReport, renderMap, readingPath } from '../tools/context-usage.mjs';
const root = new URL('../', import.meta.url);

test('routed instruction links and sections resolve', async () => {
  async function markdownFiles(path = 'references/') {
    const entries = await readdir(new URL(path, root), { withFileTypes: true });
    return (await Promise.all(entries.map(entry => entry.isDirectory() ? markdownFiles(path + entry.name + '/') : entry.name.endsWith('.md') ? [path + entry.name] : []))).flat();
  }
  const paths = ['SKILL.md', 'bootstrap/SKILL.md', ...await markdownFiles()];
  for (const path of paths) {
    const url = new URL(path, root), source = await readFile(url, 'utf8');
    for (const [, target] of source.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
      if (/^[a-z]+:/i.test(target) || target.startsWith('#')) continue;
      const [file, anchor] = target.split('#'), destination = new URL(file, url);
      await access(destination);
      if (anchor && destination.pathname.endsWith('.md')) {
        const text = await readFile(destination, 'utf8');
        const slugs = [...text.matchAll(/^#+ (.+)$/gm)].map(([, heading]) => heading.toLowerCase().replace(/[^a-z0-9 -]/g, '').replace(/ /g, '-'));
        assert.ok(slugs.includes(anchor), `Missing section: ${path} -> ${target}`);
      }
    }
  }
});

test('reported paths count each input once and the developer guide reflects the tested instructions', async () => {
  const data = await measureContext(), guide = await readFile(new URL('docs/development.md', root), 'utf8');
  assert.ok(guide.includes(renderReport(data)));
  for (const route of [...Object.values(data.readingPaths), ...Object.values(data.standalone)]) {
    assert.equal(new Set(route.files.map(x => x.path)).size, route.files.length);
    assert.equal(new Set(route.helpers.map(x => x.name)).size, route.helpers.length);
    assert.equal(route.total, [...route.files, ...route.helpers].reduce((n, x) => n + x.tokens, 0));
  }
  assert.equal(readingPath(['entry', 'entry'], { entry: 3 }).total, 3);
  assert.throws(() => readingPath(['missing'], {}), /Unknown instruction/);
  assert.equal(data.readingPaths.resume.files.some(x => x.path.endsWith('evidence.md') || x.path.endsWith('workflow.md')), false);
  for (const [route, file] of [['researchWorker', 'task-research.md'], ['checkWorker', 'task-check.md'], ['writeWorker', 'task-write.md']]) assert.deepEqual(data.readingPaths[route].files.map(x => x.path), ['references/' + file]);
  assert.deepEqual(data.readingPaths.queued.files.map(x => x.path).filter(x => x.startsWith('references/')), ['references/research-run.md', 'references/task-research.md', 'references/task-write.md']);
  // New work is routed independently of the retained question queue and manual schemas.
  assert.deepEqual(data.readingPaths.synthesisCoordinator.files.map(x => x.path), ['SKILL.md', 'references/synthesis-workflow.md']);
  assert.deepEqual(data.readingPaths.synthesisReuse.files.map(x => x.path), ['SKILL.md', 'references/synthesis-reuse.md']);
  for (const [route, file] of [['investigator', 'investigate.md'], ['synthesisWriter', 'synthesize.md'], ['synthesisReviewer', 'review-synthesis.md']]) {
    assert.deepEqual(data.readingPaths[route].files.map(x => x.path), ['references/' + file]);
    assert.ok(data.readingPaths[route].total < 3000, `${route} should stay a focused stage contract`);
  }
  assert.deepEqual(data.readingPaths.synthesisFull.files.map(x => x.path), ['SKILL.md', 'references/synthesis-workflow.md', 'references/investigate.md', 'references/synthesize.md', 'references/review-synthesis.md']);
  assert.ok(data.readingPaths.synthesisFull.total > data.readingPaths.synthesisCoordinator.total);
  assert.deepEqual(data.readingPaths.packetInvestigator.files.map(x => x.path), ['references/investigate.md', 'references/investigation-packet.md']);
  for (const [route, adapter] of [['parallelCodex','codex.md'], ['parallelClaude','claude-code.md']]) {
    const adapters = data.readingPaths[route].files.filter(x => x.path.includes('/harnesses/'));
    assert.deepEqual(adapters.map(x => x.path), ['references/harnesses/' + adapter]);
    assert.equal(data.readingPaths[route].files.some(x => x.path.endsWith('topic-assets.md')), false);
  }
  for (const route of ['synthesisCoordinator', 'synthesisFull', 'synthesisReuse']) assert.equal(data.readingPaths[route].files.some(x => /task-|research-run|evidence\.md|comparative/.test(x.path)), false);
  assert.equal(data.readingPaths.quick.files.some(x => x.path.endsWith('evidence.md')), false);
  assert.ok(data.readingPaths.focused.files.some(x => x.path.endsWith('evidence.md')));
  for (const platform of ['codex', 'claude']) for (const operation of ['outline', 'items', 'fields', 'deep']) {
    const selected = data.readingPaths[platform + operation].files.filter(x => x.path.startsWith('upstream/'));
    assert.equal(selected.length, 1);
    assert.ok(selected[0].path.startsWith('upstream/' + platform + '/'));
  }
  assert.ok(data.readingPaths.codexdeepSaved.total > data.readingPaths.codexdeep.total);
  for (const name of ['general', 'academic', 'github', 'technical', 'chinese'])
    assert.equal(data.readingPaths[name].files.filter(x => x.path.includes('web-search-modules')).length, 1);
});

test('the developer guide shows the progressive disclosure map, generated from the same measurements', async () => {
  const data = await measureContext(), map = await readFile(new URL('docs/images/context-loading.svg', root), 'utf8');
  assert.equal(map, renderMap(data), 'docs/images/context-loading.svg is stale; run npm run context:update');
  assert.match(await readFile(new URL('docs/development.md', root), 'utf8'), /!\[Progressive disclosure[^\]]*\]\(images\/context-loading\.svg\)/);
  assert.ok(map.includes(data.inputDigest));
  // Every path the map draws shows its measured total, and nothing is left unescaped.
  for (const label of ['Discovery metadata', 'Installed bootstrap', 'Investigator stage', 'Synthesis writer stage', 'Independent reviewer stage']) {
    const value = data.routes[label], shown = value < 1000 ? `${value} tokens` : `~${(value / 1000).toFixed(1)}k`;
    assert.ok(map.includes(`>${shown}<`), `${label}: ${shown}`);
  }
  assert.doesNotMatch(map.replace(/<!--[\s\S]*?-->/g, ''), /&(?!amp;|lt;|gt;|quot;)/);
});
