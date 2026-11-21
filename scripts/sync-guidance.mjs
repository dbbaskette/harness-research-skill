#!/usr/bin/env node
// Refresh instructions only. All executable operations use the installed runtime, which is
// always handed out by its stable address and is never pinned to one installed version.
import { readFile, writeFile, mkdir, rename, rm, lstat, realpath } from 'node:fs/promises';
import { resolve, join, dirname, basename, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify, parseArgs } from 'node:util';
import { createHash, randomUUID } from 'node:crypto';
import { parseVersion, compareVersions } from './lib/version.mjs';
import { acquireLock, releaseLock } from './lib/run-storage.mjs';
const exec = promisify(execFile), root = fileURLToPath(new URL('../', import.meta.url));
const sources = {
  'harness-slides': { skill: 'harness-slides', repository: 'https://github.com/dbbaskette/harness-slides-skill.git' },
  'harness-research-skill': { skill: 'harness-research', repository: 'https://github.com/dbbaskette/harness-research-skill.git' },
};
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const revisionPattern = /^[a-f0-9]{40,64}$/;
const taskPattern = /^[a-f0-9]{32}$/;
const allowed = name => ['SKILL.md', 'NOTICE.md', 'LICENSE'].includes(name) || /^upstream\/(?:[\w./ -]+\/)?LICENSE$/.test(name) || /^(references|upstream)\/[\w./ -]+\.(md|json|toml|txt|yaml|yml)$/.test(name);
const validPath = name => typeof name === 'string' && !name.startsWith('/') && !name.split('/').includes('..') && !name.includes('\\');
// An installed runtime lives in <shared>/versions/<id> behind the <shared>/current link, and the
// installer replaces that folder on every update. Callers are therefore given <shared>/current, the
// one address that survives updates, and the version reported is the one that link points at now.
// A checkout or a disposable test runtime has no such link and is its own address.
async function settings(runtime) {
  let real = await realpath(runtime), address = real;
  if (basename(dirname(real)) === 'versions') {
    const current = join(dirname(dirname(real)), 'current');
    const linked = await lstat(current).then(stat => stat.isSymbolicLink(), () => false);
    const target = linked ? await realpath(current).catch(() => null) : null;
    if (target && dirname(target) === dirname(real)) { address = current; real = target; }
  }
  const pkg = JSON.parse(await readFile(join(real, 'package.json'), 'utf8')), config = sources[pkg.name];
  if (!config) throw new Error('Unrecognized installed skill runtime.');
  return { ...config, packageName: pkg.name, version: pkg.version, runtime: address, real };
}
async function directory(path) {
  const parent = dirname(path);
  if (parent !== path) await directory(parent);
  try { const stat = await lstat(path); if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error(`Unsafe guidance directory: ${path}`); }
  catch (error) { if (error.code !== 'ENOENT') throw error; await mkdir(path, { mode: 0o700 }); }
}
async function file(path) {
  const stat = await lstat(path);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error(`Expected a regular guidance file: ${path}`);
  return readFile(path);
}
async function cacheFor(project, config, create = false) {
  const base = await realpath(resolve(project));
  if (base === config.real || base.startsWith(config.real + sep)) throw new Error('Keep guidance and work outside the installed skill.');
  const cache = join(base, '.' + config.skill, 'guidance');
  if (create) await directory(cache);
  else {
    for (const path of [join(base, '.' + config.skill), cache]) {
      const stat = await lstat(path);
      if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Unsafe guidance cache.');
    }
  }
  return cache;
}
async function git(repository, ...args) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('GIT_')));
  Object.assign(env, { GIT_TERMINAL_PROMPT: '0', GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' });
  try {
    return (await exec('git', ['--git-dir=' + repository, '-c', 'core.hooksPath=/dev/null', ...args], { env, timeout: 45000, maxBuffer: 16 * 1024 * 1024, encoding: 'buffer' })).stdout;
  } catch (error) {
    const operation = args[0], stderr = String(error.stderr ?? '');
    // Report a useful cause without echoing Git's potentially credential-bearing
    // URLs, proxy settings, local paths or arbitrary remote output.
    const reason = error.code === 'ENOENT' ? 'Git is not installed or is not on PATH.'
      : error.killed || error.code === 'ETIMEDOUT' ? 'Git timed out.'
      : /could not resolve proxy/i.test(stderr) ? 'Git could not resolve the proxy host (DNS).'
      : /could not resolve host|could not resolve hostname|name or service not known|temporary failure in name resolution/i.test(stderr) ? 'Git could not resolve the source host (DNS).'
      : /certificate|SSL|TLS/i.test(stderr) ? 'Git could not establish a trusted TLS connection.'
      : /failed to connect|couldn.t connect|connection refused|network is unreachable/i.test(stderr) ? 'Git could not connect to the source host.'
      : /permission denied|operation not permitted|access denied/i.test(stderr) ? 'Git was denied access.'
      : Number.isInteger(error.code) ? `Git exited with status ${error.code}.` : 'Git could not complete the operation.';
    const network = ['fetch', 'ls-remote'].includes(operation);
    const prefix = network ? 'Guidance fetch failed' : 'Guidance Git operation failed';
    const recovery = network
      ? 'If the agent sandbox restricts networking, retry this command through the host\'s permitted network-access flow. Existing work can resume its saved task without fetching.'
      : 'Check the reported Git operation and local cache; this is not necessarily a network failure.';
    throw new Error(`${prefix} (git ${operation}). ${reason} ${recovery}`);
  }
}
function compatible(required, actual, guidance = 'Current guidance') {
  if (compareVersions(required, actual) > 0) throw Object.assign(new Error(`${guidance} needs a newer installed runtime. Update with this skill’s trusted installer.`), { minimumRuntime: required });
}
async function blob(repository, id, size) {
  if (!Number.isSafeInteger(size) || size < 0 || size > 1024 * 1024) throw new Error('Guidance file exceeds size limit.');
  const bytes = await git(repository, 'cat-file', 'blob', id);
  if (bytes.length !== size) throw new Error('Guidance blob size mismatch.');
  new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  return bytes;
}
// Releases, newest first: tags named vMAJOR.MINOR.PATCH on the trusted source.
async function releaseTags(repository, source) {
  const listing = (await git(repository, 'ls-remote', '--tags', '--refs', source, 'refs/tags/v*')).toString('utf8');
  return listing.split('\n').map(line => line.trim().split(/\s+/)[1]).filter(ref => /^refs\/tags\/v\d+\.\d+\.\d+$/.test(ref ?? ''))
    .map(ref => ({ ref, parts: parseVersion(ref.slice('refs/tags/v'.length)).core }))
    .sort((a, b) => b.parts[0] - a.parts[0] || b.parts[1] - a.parts[1] || b.parts[2] - a.parts[2]);
}
// Read a commit's guidance inventory and manifest, refusing one the installed runtime cannot run.
async function inspectCommit(repository, commit, config, guidance) {
  if (!revisionPattern.test(commit)) throw new Error('Invalid guidance revision.');
  const listing = (await git(repository, 'ls-tree', '-r', '-l', '-z', commit)).toString('utf8').split('\0').filter(Boolean).map(line => {
    const [meta, name] = line.split('\t'), [mode, type, id, size] = meta.trim().split(/\s+/);
    return { mode, type, id, size: Number(size), name };
  });
  const metadata = listing.find(item => item.name === 'guidance/manifest.json') ?? listing.find(item => item.name === 'package.json');
  if (!metadata || metadata.mode !== '100644' || metadata.type !== 'blob') throw new Error('Guidance compatibility metadata is missing.');
  const manifest = JSON.parse(await blob(repository, metadata.id, metadata.size));
  const guidanceVersion = manifest.version ?? null;
  if (guidanceVersion !== null) parseVersion(guidanceVersion);
  if (metadata.name === 'guidance/manifest.json') {
    if (manifest.schema !== 1 || manifest.skill !== config.skill || manifest.entry !== 'SKILL.md') throw new Error('Unsupported guidance contract.');
  } else if (manifest.name !== config.packageName) throw new Error('Unrecognized guidance package.');
  const minimumRuntime = metadata.name === 'guidance/manifest.json' ? manifest.minimumRuntime : manifest.version;
  compatible(minimumRuntime, config.version, guidance);
  return { listing, guidanceVersion, minimumRuntime };
}
// The one compatibility rule that survives an update: saved instructions may not need a newer runtime
// than the one installed. Tasks started before 1.3.0 did not record that floor. A runtime at least as
// new as the one that started them satisfies it; for an older one the floor is read from the task's
// cached revision, without the network.
async function savedCompatibility(pin, config, repository) {
  const saved = 'This task’s saved guidance';
  if (pin.minimumRuntime !== undefined) return compatible(pin.minimumRuntime, config.version, saved);
  if (typeof pin.runtimeVersion !== 'string' || compareVersions(pin.runtimeVersion, config.version) <= 0) return;
  try { await inspectCommit(repository, pin.revision, config, saved); }
  catch (error) {
    if (/newer installed runtime/.test(error.message)) throw error;
    // The floor cannot be read locally; the only runtime known to satisfy it is the newer one.
    compatible(pin.runtimeVersion, config.version, saved);
  }
}
export async function start({ project, runtime = root, source, revision, releaseLimit = 100 } = {}) {
  if (!Number.isSafeInteger(releaseLimit) || releaseLimit < 1 || releaseLimit > 1000) throw new Error('releaseLimit must be between 1 and 1000.');
  const config = await settings(runtime), cache = await cacheFor(project, config, true);
  const lockPath = join(cache, '.sync-lock');
  const lock = await acquireLock(lockPath, { wait: 0, busy: 'Another guidance refresh is running' });
  let stage;
  try {
    const repository = join(cache, 'repository.git');
    try { const stat = await lstat(repository); if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Unsafe guidance repository.'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; await git(repository, 'init', '--bare', '--initial-branch=main'); }
    if (revision !== undefined && !revisionPattern.test(revision)) throw new Error('Invalid saved guidance revision.');
    // source is a library-only seam for local disposable test repositories.
    const trustedSource = source ?? config.repository;
    const shallow = (await git(repository, 'rev-parse', '--is-shallow-repository')).toString().trim() === 'true';
    const head = async () => (await git(repository, 'rev-parse', '--verify', 'FETCH_HEAD^{commit}')).toString().trim();
    let commit, inspected, channel = 'main', ref = 'refs/heads/main';
    const skipped = [];
    if (revision) {
      await git(repository, 'fetch', '--quiet', '--no-tags', ...(shallow ? ['--unshallow'] : []), trustedSource, ref);
      await git(repository, 'merge-base', '--is-ancestor', revision, await head()); commit = revision;
    } else {
      // New work uses the newest release the installed runtime supports, so unreleased guidance on
      // main never reaches installed users. A repository with no release tags is served from main.
      const releases = await releaseTags(repository, trustedSource);
      for (const release of releases.slice(0, releaseLimit)) {
        await git(repository, 'fetch', '--quiet', '--no-tags', '--depth=1', trustedSource, release.ref);
        const candidate = await head();
        try { inspected = await inspectCommit(repository, candidate, config); commit = candidate; channel = 'release'; ref = release.ref; break; }
        catch (error) { if (!/newer installed runtime/.test(error.message)) throw error; skipped.push({ ref: release.ref, minimumRuntime: error.minimumRuntime }); }
      }
      if (!commit && releases.length > releaseLimit) throw new Error(`Guidance compatibility search limit reached after ${releaseLimit} releases; older compatible guidance may exist. Resume a saved task, pin an approved revision, or update with the trusted installer.`);
      if (!commit && releases.length) throw new Error('No guidance release supports this installed runtime; it needs a newer installed runtime. Update with this skill’s trusted installer.');
      if (!commit) { await git(repository, 'fetch', '--quiet', '--no-tags', '--depth=1', trustedSource, ref); commit = await head(); }
    }
    inspected ??= await inspectCommit(repository, commit, config);
    const { listing, guidanceVersion, minimumRuntime } = inspected;
    const selected = listing.filter(item => allowed(item.name));
    if (!selected.some(item => item.name === 'SKILL.md') || selected.length > 500 || selected.reduce((n, item) => n + item.size, 0) > 8 * 1024 * 1024) throw new Error('Guidance inventory is missing or too large.');
    const task = randomUUID().replaceAll('-', '');
    await directory(join(cache, 'tasks'));
    stage = join(cache, 'tasks', '.' + task); await mkdir(stage, { mode: 0o700 });
    const hashes = {};
    for (const item of selected) {
      if (!validPath(item.name) || item.mode !== '100644' || item.type !== 'blob') throw new Error('Guidance must contain regular non-executable files only.');
      const bytes = await blob(repository, item.id, item.size), path = join(stage, item.name);
      await mkdir(dirname(path), { recursive: true, mode: 0o700 }); await writeFile(path, bytes, { flag: 'wx', mode: 0o400 });
      hashes[item.name] = sha(bytes);
    }
    // The pin saves this task's instructions. It records the runtime version that started the work for
    // information only: no installed folder, path or file hash is saved, so an update never strands it.
    const pin = { schema: 1, skill: config.skill, repository: config.repository, revision: commit, channel, ref, guidanceVersion, minimumRuntime, task, createdAt: new Date().toISOString(), runtimeVersion: config.version, files: hashes };
    await writeFile(join(stage, 'pin.json'), JSON.stringify(pin, null, 2) + '\n', { flag: 'wx', mode: 0o400 });
    const snapshot = join(cache, 'tasks', task); await rename(stage, snapshot); stage = null;
    // Falling back to an older release because a newer one needs a newer runtime is disclosed, so the
    // agent can tell the person and offer the update; it is never reported as the current guidance.
    const tag = name => name.slice('refs/tags/'.length), newer = skipped[0];
    const disclosure = newer ? { freshness: 'older-compatible-release', newerRelease: newer, notice: `Guidance ${tag(newer.ref)} needs runtime ${newer.minimumRuntime}; this task uses ${tag(ref)}, the newest release runtime ${config.version} supports. Update with this skill’s trusted installer to use the newer guidance.` } : { freshness: 'current-at-start' };
    return { ...disclosure, channel, ref, runtimeVersion: config.version, guidanceVersion, revision: commit, task, guidance: join(snapshot, 'SKILL.md'), runtime: config.runtime };
  } finally { try { if (stage) await rm(stage, { recursive: true, force: true }); } finally { await releaseLock(lockPath, lock); } }
}
export async function resume({ project, task, runtime = root, cached = false } = {}) {
  const config = await settings(runtime);
  if (!taskPattern.test(task)) throw new Error('Invalid saved task ID.');
  const cache = await cacheFor(project, config), tasks = join(cache, 'tasks'), snapshot = join(tasks, task);
  for (const path of [tasks, snapshot]) { const stat = await lstat(path); if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Unsafe saved guidance directory.'); }
  const pin = JSON.parse(await file(join(snapshot, 'pin.json')));
  if (pin.schema !== 1 || pin.task !== task || pin.skill !== config.skill || pin.repository !== config.repository || !revisionPattern.test(pin.revision) || !pin.files?.['SKILL.md']) throw new Error('Invalid saved guidance pin.');
  if (pin.guidanceVersion !== undefined && pin.guidanceVersion !== null) parseVersion(pin.guidanceVersion);
  for (const [name, digest] of Object.entries(pin.files)) {
    if (!validPath(name) || !allowed(name)) throw new Error('Invalid saved guidance path.');
    let parent = dirname(join(snapshot, name));
    while (parent !== snapshot) { const stat = await lstat(parent); if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Unsafe saved guidance path.'); parent = dirname(parent); }
    if (sha(await file(join(snapshot, name))) !== digest) throw new Error('Saved guidance changed; reopen an intact task or start new work.');
  }
  // Saved work keeps its instructions and always continues on the runtime installed now. Pins written
  // before 1.3.0 also carry runtime, runtimeFiles and an exact runtimeVersion; those are not checked.
  await savedCompatibility(pin, config, join(cache, 'repository.git'));
  const guidanceVersion = pin.guidanceVersion ?? null, startedRuntimeVersion = typeof pin.runtimeVersion === 'string' ? pin.runtimeVersion : null;
  const notice = startedRuntimeVersion && startedRuntimeVersion !== config.version
    ? `This work started on runtime ${startedRuntimeVersion} and now continues on the installed runtime ${config.version} with its saved instructions${guidanceVersion ? ` (guidance ${guidanceVersion})` : ''}. Start a new task to adopt the newest instructions.` : null;
  return { freshness: cached ? 'cached-by-choice' : 'saved-guidance', ...(notice ? { notice } : {}), runtimeVersion: config.version, startedRuntimeVersion, guidanceVersion, revision: pin.revision, task, guidance: join(snapshot, 'SKILL.md'), runtime: config.runtime };
}
async function main() {
  const { values, positionals } = parseArgs({ options: { project: { type: 'string' }, task: { type: 'string' }, revision: { type: 'string' }, help: { type: 'boolean' } }, allowPositionals: true });
  const [action, ...extra] = positionals;
  if (values.help || !action) { console.log('Usage: node scripts/sync-guidance.mjs start|resume|cached|pin --project DIR [--task ID] [--revision COMMIT]\nOnly guidance refreshes. Executable helpers stay in the installed runtime; the returned runtime is its stable address.'); return; }
  if (extra.length || !values.project || !['start', 'resume', 'cached', 'pin'].includes(action)) throw new Error('Choose an action and --project DIR.');
  if ((action === 'start' && (values.task || values.revision)) || (action === 'pin' && (!values.revision || values.task)) || (['resume', 'cached'].includes(action) && (!values.task || values.revision))) throw new Error('Invalid guidance action options.');
  const result = ['start', 'pin'].includes(action) ? await start({ project: values.project, revision: values.revision }) : await resume({ project: values.project, task: values.task, cached: action === 'cached' });
  console.log(JSON.stringify(result, null, 2));
}
const invokedPath = process.argv[1] && process.argv[1] !== '-' ? await realpath(resolve(process.argv[1])).catch(() => null) : null;
if (invokedPath && import.meta.url === pathToFileURL(invokedPath).href) main().catch(error => { console.error(error.message); process.exitCode = 1; });
