import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('..', import.meta.url);

test('the stated intake limits are the ones the runtime enforces', async () => {
  const stated = JSON.parse(await readFile(new URL('references/intake-limits.json', root), 'utf8'));
  const code = await readFile(new URL('scripts/lib/topic-assets.mjs', root), 'utf8');
  const [, files, inventory, bytes, total] = code.match(/const MAX_FILES = (\d+), MAX_INVENTORY = (\d+), MAX_BYTES = (\d+) \* 1024 \* 1024, MAX_TOTAL = (\d+) \* 1024 \* 1024;/);
  assert.deepEqual(stated, { schema: 1, entries: +files, inventory: +inventory, bytes_per_input: bytes * 1048576, bytes_total: total * 1048576 });
  assert.ok(stated.entries >= 2000 && stated.inventory >= stated.entries);
});

test('a long list is taken whole and one past the limit is refused', async t => {
  const { mkdtemp, mkdir, writeFile, rm, realpath } = await import('node:fs/promises');
  const { tmpdir } = await import('node:os');
  const { join } = await import('node:path');
  const { runAssetCli } = await import('../scripts/lib/topic-assets.mjs');
  const base = await realpath(await mkdtemp(join(tmpdir(), 'intake-limits-')));
  t.after(() => rm(base, { recursive: true, force: true }));
  const workspace = join(base, 'workspace'); await mkdir(workspace);
  const list = count => Array.from({ length: count }, (_, n) => `https://example.invalid/page-${n}`).join('\n') + '\n';
  await writeFile(join(base, 'many.txt'), list(1600));
  const made = await runAssetCli(['init', '--project', workspace, '--topic', 'Many links', '--urls', join(base, 'many.txt')]);
  const held = JSON.parse(await readFile(join(made.asset, 'sources.json'), 'utf8'));
  assert.equal(held.entries.length, 1600);
  await writeFile(join(base, 'over.txt'), list(2001));
  await assert.rejects(runAssetCli(['init', '--project', workspace, '--topic', 'Too many links', '--urls', join(base, 'over.txt')]), /Intake exceeds 2000 entries/);
});
