#!/usr/bin/env node
import { readdir, readFile, mkdir, writeFile, symlink, readlink, lstat, rename, rm, open, realpath } from 'node:fs/promises';
import { join, resolve, dirname } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { randomUUID } from 'node:crypto';
import { hash, digest } from './lib/common.mjs';

const packageRoot = fileURLToPath(new URL('../', import.meta.url));
const roots = ['SKILL.md', 'LICENSE', 'NOTICE.md', 'package.json', 'package-lock.json', 'references', 'scripts', 'upstream', 'examples'];
const aliases = ['research', 'research-add-items', 'research-add-fields', 'research-deep', 'research-report'];

async function files(root) {
  const out = new Map();
  async function visit(name) {
    const path = join(root, name), stat = await lstat(path);
    if (stat.isSymbolicLink()) throw new Error(`Package symlink: ${name}`);
    if (stat.isDirectory()) for (const item of (await readdir(path)).sort()) await visit(`${name}/${item}`);
    else if (stat.isFile()) out.set(name, await readFile(path));
    else throw new Error('Unsupported package member');
  }
  for (const name of roots) await visit(name);
  return out;
}
async function state(path) {
  try { const stat = await lstat(path); return { link: stat.isSymbolicLink() ? await readlink(path) : null, ino: stat.ino, dev: stat.dev }; }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
async function systemPath(value) {
  const path = resolve(value);
  // macOS's root aliases are OS-owned; user-controlled directory symlinks
  // remain disallowed by checkParents. Normalize before destination planning.
  if (process.platform === 'darwin') for (const prefix of ['/var', '/tmp', '/etc']) {
    if (path === prefix || path.startsWith(prefix + '/')) {
      const actual = await realpath(prefix);
      if (actual === '/private' + prefix) return actual + path.slice(prefix.length);
    }
  }
  return path;
}
async function checkParents(path) {
  const parts = resolve(path).split('/').filter(Boolean);
  let current = '/';
  for (const part of parts) {
    current = join(current, part);
    try { const stat = await lstat(current); if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Unsafe installer directory: ${current}`); }
    catch (error) { if (error.code === 'ENOENT') break; throw error; }
  }
}
async function safeParent(path) {
  await checkParents(path);
  await mkdir(path, { recursive: true, mode: 0o700 });
  const stat = await lstat(path);
  if ((stat.mode & 0o022) !== 0 || typeof process.getuid === 'function' && stat.uid !== process.getuid()) throw new Error(`Unsafe installer directory: ${path}`);
}
async function legacyLinks(home, claude, current) {
  const entries = [];
  for (const [runtime, config, skills] of [['codex', join(home, '.codex'), join(home, '.agents', 'skills')], ['codex', join(home, '.codex'), join(home, '.codex', 'skills')], ['claude', claude, join(claude, 'skills')]]) {
    for (const name of aliases) entries.push({ path: join(skills, name), old: join(skills, 'tanzu-brand', 'scripts', 'research', runtime, 'skills', name), source: join(current, 'upstream', runtime, 'skills', name) });
    // Agents from the old Codex installer use the .agents skill package.
    if (runtime === 'codex' && skills === join(home, '.codex', 'skills')) continue;
    for (const name of [runtime === 'codex' ? 'web-researcher.toml' : 'web-search-agent.md', 'web-search-modules']) entries.push({ path: join(config, 'agents', name), old: join(skills, 'tanzu-brand', 'scripts', 'research', runtime, 'agents', name), source: join(current, 'upstream', runtime, 'agents', name) });
  }
  for (const entry of entries) {
    const existing = await state(entry.path);
    entry.status = existing?.link && await systemPath(resolve(dirname(entry.path), existing.link)) === entry.old ? 'would-migrate' : 'preserved';
    entry.previous = existing;
  }
  return entries;
}

export async function install({ source = packageRoot, home = homedir(), claudeConfigDir, shared, dryRun = false } = {}) {
  if (Number(process.versions.node.split('.')[0]) < 20) throw new Error('Node.js 20+ is required.');
  source = await realpath(resolve(source));
  home = await systemPath(home);
  const claude = claudeConfigDir ? await systemPath(claudeConfigDir) : join(home, '.claude');
  shared = await systemPath(shared ?? (process.platform === 'darwin' ? join(home, 'Library', 'Application Support', 'Harness Research') : join(home, '.local', 'share', 'harness-research')));
  const targets = [join(home, '.agents', 'skills', 'harness-research'), join(claude, 'skills', 'harness-research'), join(home, '.cursor', 'skills', 'harness-research')];
  if (new Set(targets).size !== targets.length || targets.some(path => path === shared || path.startsWith(shared + '/') || shared.startsWith(path + '/'))) throw new Error('Install destinations overlap.');
  const payload = await files(source), checks = Object.fromEntries([...payload].map(([name, bytes]) => [name, hash(bytes)]));
  const pkg = JSON.parse(payload.get('package.json'));
  if (pkg.name !== 'harness-research-skill' || !/^\d+\.\d+\.\d+$/.test(pkg.version) || !/^name: harness-research$/m.test(payload.get('SKILL.md').toString())) throw new Error('Unrecognized research package.');
  const contentDigest = digest(checks), id = `${pkg.version}-${contentDigest.slice(0, 20)}`, runtime = join(shared, 'versions', id), current = join(shared, 'current');
  const previous = await state(current);
  if (previous && (!previous.link || !/^versions\/[\w.-]+$/.test(previous.link))) throw new Error('Unrecognized shared pointer; preserve it.');
  for (const target of targets) {
    await checkParents(dirname(target));
    const existing = await state(target);
    if (existing && existing.link !== current) throw new Error(`Existing unrelated skill: ${target}; preserve or move it before installation.`);
  }
  await checkParents(shared);
  const legacy = await legacyLinks(home, claude, current);
  for (const entry of legacy.filter(entry => entry.status === 'would-migrate')) await checkParents(dirname(entry.path));
  if (dryRun) return { status: 'dry-run', shared, runtime, targets, legacy, contentDigest };
  await safeParent(shared);
  const lock = await open(join(shared, '.install-lock'), 'wx', 0o600), created = [], migrated = [];
  try {
    await safeParent(join(shared, 'versions'));
    const existing = await state(runtime);
    if (existing) {
      const info = await lstat(runtime);
      if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Retained runtime is not a real directory.');
      const retained = await files(runtime);
      if (retained.size !== payload.size || [...payload].some(([name, bytes]) => !retained.has(name) || hash(retained.get(name)) !== hash(bytes))) throw new Error('Retained runtime was modified; preserve it and repair installation.');
    } else {
      const stage = join(shared, 'versions', `.stage-${randomUUID()}`);
      await mkdir(stage, { mode: 0o700 });
      try {
        for (const [name, bytes] of payload) { await mkdir(dirname(join(stage, name)), { recursive: true }); await writeFile(join(stage, name), bytes, { flag: 'wx', mode: 0o644 }); }
        await rename(stage, runtime);
      } finally { await rm(stage, { recursive: true, force: true }); }
    }
    for (const target of targets) {
      await safeParent(dirname(target));
      const existing = await state(target);
      if (existing && existing.link !== current) throw new Error(`Skill destination changed: ${target}`);
      if (!existing) { await symlink(current, target); created.push(target); }
    }
    for (const entry of legacy.filter(entry => entry.status === 'would-migrate')) {
      if (JSON.stringify(await state(entry.path)) !== JSON.stringify(entry.previous)) throw new Error(`Legacy link changed: ${entry.path}`);
      const temp = `${entry.path}.migration-${randomUUID()}`;
      try { await symlink(entry.source, temp); await rename(temp, entry.path); migrated.push(entry); entry.status = 'migrated'; }
      finally { await rm(temp, { force: true }); }
    }
    if (JSON.stringify(await state(current)) !== JSON.stringify(previous)) throw new Error('Installer pointer changed concurrently.');
    const temp = join(shared, `.pointer-${randomUUID()}`);
    try { await symlink(`versions/${id}`, temp); await rename(temp, current); }
    finally { await rm(temp, { force: true }); }
    return { status: 'installed', shared, runtime, targets, legacy, contentDigest };
  } catch (error) {
    const failures = [];
    for (const entry of migrated.reverse()) try {
      if ((await state(entry.path))?.link !== entry.source) throw new Error(`Migrated link changed: ${entry.path}`);
      const temp = `${entry.path}.restore-${randomUUID()}`;
      try { await symlink(entry.previous.link, temp); await rename(temp, entry.path); } finally { await rm(temp, { force: true }); }
    } catch (failure) { failures.push(failure); }
    for (const target of created) try { if ((await state(target))?.link === current) await rm(target); } catch (failure) { failures.push(failure); }
    if (failures.length) throw new AggregateError([error, ...failures], 'Installation failed; some links require recovery.');
    throw error;
  } finally { await lock.close(); await rm(join(shared, '.install-lock')); }
}

async function main() {
  const { values } = parseArgs({ options: { home: { type: 'string' }, shared: { type: 'string' }, 'claude-config': { type: 'string' }, 'dry-run': { type: 'boolean' }, help: { type: 'boolean', short: 'h' } } });
  if (values.help) { console.log('Usage: node scripts/install.mjs [--dry-run] [--home DIR] [--shared DIR] [--claude-config DIR]\nCreates one shared harness-research skill; migrates only existing Brand-owned aliases.'); return; }
  console.log(JSON.stringify(await install({ home: values.home, shared: values.shared, claudeConfigDir: values['claude-config'] ?? (values.home ? undefined : process.env.CLAUDE_CONFIG_DIR), dryRun: values['dry-run'] }), null, 2));
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
