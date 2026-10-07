import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { measureContext, renderReport, readingPath } from '../tools/context-usage.mjs';
const root = new URL('../', import.meta.url);

test('routed instruction links and sections resolve', async () => {
  const paths = ['SKILL.md', 'bootstrap/SKILL.md', ...(await readdir(new URL('references/', root))).filter(x => x.endsWith('.md')).map(x => 'references/' + x)];
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

test('reported paths count each input once and README reflects the tested instructions', async () => {
  const data = await measureContext(), readme = await readFile(new URL('README.md', root), 'utf8');
  assert.ok(readme.includes(renderReport(data)));
  for (const route of [...Object.values(data.readingPaths), ...Object.values(data.standalone)]) {
    assert.equal(new Set(route.files.map(x => x.path)).size, route.files.length);
    assert.equal(new Set(route.helpers.map(x => x.name)).size, route.helpers.length);
    assert.equal(route.total, [...route.files, ...route.helpers].reduce((n, x) => n + x.tokens, 0));
  }
  assert.equal(readingPath(['entry', 'entry'], { entry: 3 }).total, 3);
  assert.throws(() => readingPath(['missing'], {}), /Unknown instruction/);
  assert.equal(data.readingPaths.resume.files.some(x => x.path.endsWith('evidence.md') || x.path.endsWith('workflow.md')), false);
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
