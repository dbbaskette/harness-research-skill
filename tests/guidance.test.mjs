import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, readlink, rm, cp, symlink, realpath, chmod, utimes, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { install } from '../scripts/install.mjs';
import { start, resume } from '../scripts/sync-guidance.mjs';
const exec = promisify(execFile), pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url))), skill = pkg.name === 'harness-slides' ? 'harness-slides' : 'harness-research';
async function fixture(t) {
  const dir = await realpath(await mkdtemp(join(tmpdir(), 'harness-guidance-'))); t.after(() => rm(dir, { recursive: true, force: true }));
  const source = join(dir, 'source'), runtime = join(dir, 'runtime'), project = join(dir, 'content');
  for (const path of [source, runtime, project, join(source, 'references'), join(source, 'guidance'), join(source, 'scripts'), join(runtime, 'scripts')]) await mkdir(path, { recursive: true });
  await writeFile(join(runtime, 'package.json'), JSON.stringify({ name: pkg.name, version: '0.2.0' }));
  await writeFile(join(runtime, 'package-lock.json'), '{}'); await writeFile(join(runtime, 'scripts/helper.mjs'), "throw new Error('Never execute fetched helpers');");
  await writeFile(join(source, 'SKILL.md'), `---\nname: ${skill}\n---\nFirst guidance\n`);
  await writeFile(join(source, 'references/design.md'), 'First reference');
  await writeFile(join(source, 'scripts/helper.mjs'), "throw new Error('Remote helper must not execute');");
  await writeFile(join(source, 'guidance/manifest.json'), JSON.stringify({ schema: 1, skill, version: '0.3.0', entry: 'SKILL.md', minimumRuntime: '0.2.0' }));
  await exec('git', ['init', '-q', '--initial-branch=main', source]);
  const commit = async () => { await exec('git', ['-C', source, 'add', '.']); await exec('git', ['-C', source, '-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', '-c', 'commit.gpgsign=false', 'commit', '-qm', 'Fixture update']); return (await exec('git', ['-C', source, 'rev-parse', 'HEAD'])).stdout.trim(); };
  return { dir, source, runtime, project, commit, first: await commit() };
}
async function startInProcess(fixture, env) {
  const script = `const {start} = await import(${JSON.stringify(new URL('../scripts/sync-guidance.mjs', import.meta.url).href)}); try { await start(${JSON.stringify(fixture)}); } catch (error) { console.error(error.message); process.exitCode = 1; }`;
  return exec(process.execPath, ['--input-type=module', '--eval', script], { env });
}
// Rewrite a task's pin the way runtimes before 1.3.0 wrote it: tied to one installed folder and its bytes.
async function oldFormatPin(started, runtime, runtimeVersion) {
  const file = join(started.guidance, '..', 'pin.json'), pin = JSON.parse(await readFile(file, 'utf8'));
  delete pin.minimumRuntime;
  Object.assign(pin, { runtime, runtimeVersion, runtimeFiles: { 'package.json': 'a'.repeat(64), 'scripts/helper.mjs': 'b'.repeat(64) } });
  await chmod(file, 0o600); await writeFile(file, JSON.stringify(pin, null, 2) + '\n');
  return pin;
}
test('new work sees main advancement; resumed work keeps its guidance and uses the installed runtime without network', async t => {
  const f = await fixture(t), first = await start(f);
  assert.equal(first.revision, f.first); assert.equal(first.runtime, f.runtime);
  assert.equal(first.runtimeVersion, '0.2.0'); assert.equal(first.guidanceVersion, '0.3.0');
  const snapshot = join(first.guidance, '..');
  assert.deepEqual((await readdir(snapshot)).sort(), ['SKILL.md', 'pin.json', 'references']);
  // The pin saves instructions only: no installed folder, path or runtime file hash.
  const saved = JSON.parse(await readFile(join(snapshot, 'pin.json'), 'utf8'));
  assert.equal(saved.runtime, undefined); assert.equal(saved.runtimeFiles, undefined);
  assert.equal(saved.runtimeVersion, '0.2.0'); assert.equal(saved.minimumRuntime, '0.2.0');
  assert.doesNotMatch(JSON.stringify(saved), new RegExp(f.runtime.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  await writeFile(join(f.source, 'SKILL.md'), `---\nname: ${skill}\n---\nSecond guidance\n`);
  await writeFile(join(f.source, 'guidance/manifest.json'), JSON.stringify({ schema: 1, skill, version: '0.4.0', entry: 'SKILL.md', minimumRuntime: '0.2.0' })); const secondCommit = await f.commit();
  const second = await start(f); assert.equal(second.revision, secondCommit);
  assert.equal(second.runtimeVersion, '0.2.0'); assert.equal(second.guidanceVersion, '0.4.0');
  await rm(f.source, { recursive: true });
  const continued = await resume({ ...f, task: first.task });
  assert.equal(continued.freshness, 'saved-guidance'); assert.equal(continued.revision, f.first);
  assert.equal(continued.runtimeVersion, '0.2.0'); assert.equal(continued.guidanceVersion, '0.3.0');
  assert.equal(continued.runtime, f.runtime); assert.equal(continued.startedRuntimeVersion, '0.2.0'); assert.equal(continued.notice, undefined);
  assert.match(await readFile(continued.guidance, 'utf8'), /First guidance/);
  assert.equal((await resume({ ...f, task: first.task, cached: true })).freshness, 'cached-by-choice');
});

test('guidance snapshots retain attribution and upstream licenses without executable code', async t => {
  const f = await fixture(t), upstream = join(f.source, 'upstream/anthropic');
  await mkdir(upstream, { recursive: true });
  await writeFile(join(f.source, 'NOTICE.md'), 'Modified from upstream; see license.');
  await writeFile(join(upstream, 'LICENSE'), 'Upstream license text.');
  await writeFile(join(f.source, 'upstream/LICENSE'), 'Legacy upstream license.');
  await writeFile(join(upstream, 'helper.mjs'), 'throw new Error("Never execute fetched code");');
  await f.commit();
  const started = await start(f), snapshot = join(started.guidance, '..');
  assert.equal(await readFile(join(snapshot, 'NOTICE.md'), 'utf8'), 'Modified from upstream; see license.');
  assert.equal(await readFile(join(snapshot, 'upstream/anthropic/LICENSE'), 'utf8'), 'Upstream license text.');
  assert.equal(await readFile(join(snapshot, 'upstream/LICENSE'), 'utf8'), 'Legacy upstream license.');
  await assert.rejects(readFile(join(snapshot, 'upstream/anthropic/helper.mjs')), { code: 'ENOENT' });
});
test('older guidance and task pins report unknown release without inventing a version', async t => {
  const f = await fixture(t);
  await writeFile(join(f.source, 'guidance/manifest.json'), JSON.stringify({ schema: 1, skill, entry: 'SKILL.md', minimumRuntime: '0.2.0' })); await f.commit();
  const started = await start(f); assert.equal(started.guidanceVersion, null);
  const pinFile = join(started.guidance, '..', 'pin.json'), pin = JSON.parse(await readFile(pinFile, 'utf8'));
  delete pin.guidanceVersion; await chmod(pinFile, 0o600); await writeFile(pinFile, JSON.stringify(pin));
  const upgraded = join(f.dir, 'upgraded'); await mkdir(upgraded);
  await writeFile(join(upgraded, 'package.json'), JSON.stringify({ name: pkg.name, version: '0.3.0' }));
  await rm(f.source, { recursive: true });
  const continued = await resume({ ...f, runtime: upgraded, task: started.task });
  // The work continues on the runtime installed now, and says so; nothing is restored or migrated.
  assert.equal(continued.runtimeVersion, '0.3.0'); assert.equal(continued.startedRuntimeVersion, '0.2.0'); assert.equal(continued.guidanceVersion, null);
  assert.equal(continued.runtime, upgraded); assert.equal(continued.revision, started.revision);
  assert.equal(continued.notice, 'This work started on runtime 0.2.0 and now continues on the installed runtime 0.3.0 with its saved instructions. Start a new task to adopt the newest instructions.');
});
test('malformed guidance release cannot create a task', async t => {
  const f = await fixture(t);
  await writeFile(join(f.source, 'guidance/manifest.json'), JSON.stringify({ schema: 1, skill, version: 'latest', entry: 'SKILL.md', minimumRuntime: '0.2.0' })); await f.commit();
  await assert.rejects(start(f), /Invalid guidance\/runtime version/);
  assert.deepEqual(await readdir(join(f.project, '.' + skill, 'guidance')), ['repository.git']);
});
test('changed saved guidance is detected on resume; a changed, moved or removed runtime never stops saved work', async t => {
  const f = await fixture(t), pin = await start(f);
  await chmod(join(pin.guidance, '../references/design.md'), 0o600);
  await writeFile(join(pin.guidance, '../references/design.md'), 'Changed');
  await assert.rejects(resume({ ...f, task: pin.task }), /guidance changed/);
  const second = await start(f); await writeFile(join(f.runtime, 'scripts/helper.mjs'), 'Changed runtime');
  assert.equal((await resume({ ...f, task: second.task })).runtime, f.runtime);
  // A pin from before 1.3.0 names a version folder that an update has since removed, with other bytes.
  const gone = join(f.dir, 'versions', '0.2.0-0123456789abcdef0123');
  await oldFormatPin(second, gone, '0.2.0'); await assert.rejects(access(gone), { code: 'ENOENT' });
  const continued = await resume({ ...f, task: second.task });
  assert.equal(continued.runtime, f.runtime); assert.equal(continued.runtimeVersion, '0.2.0'); assert.equal(continued.notice, undefined);
  assert.equal((await resume({ ...f, task: second.task, cached: true })).freshness, 'cached-by-choice');
});
test('saved guidance that needs a newer runtime than the installed one is still refused', async t => {
  const f = await fixture(t), started = await start(f), older = join(f.dir, 'older'), refusal = /This task’s saved guidance needs a newer installed runtime\. Update with this skill’s trusted installer\./;
  await mkdir(older); await writeFile(join(older, 'package.json'), JSON.stringify({ name: pkg.name, version: '0.1.0' }));
  await assert.rejects(resume({ ...f, runtime: older, task: started.task }), error => { assert.match(error.message, refusal); assert.equal(error.minimumRuntime, '0.2.0'); return true; });
  await assert.rejects(resume({ ...f, runtime: older, task: started.task, cached: true }), refusal);
  // A pin from before 1.3.0 has no recorded floor: it is read from the task's cached revision, offline.
  await rm(f.source, { recursive: true });
  await oldFormatPin(started, join(f.dir, 'versions', '0.2.0-0123456789abcdef0123'), '0.2.0');
  await assert.rejects(resume({ ...f, runtime: older, task: started.task }), refusal);
  await writeFile(join(older, 'package.json'), JSON.stringify({ name: pkg.name, version: '0.2.0-rc.1' }));
  await assert.rejects(resume({ ...f, runtime: older, task: started.task }), refusal);
  // An older runtime that still meets the floor may continue, and says which runtime is in use.
  await oldFormatPin(started, join(f.dir, 'versions', '0.5.0-0123456789abcdef0123'), '0.5.0');
  await writeFile(join(older, 'package.json'), JSON.stringify({ name: pkg.name, version: '0.4.0' }));
  const continued = await resume({ ...f, runtime: older, task: started.task });
  assert.equal(continued.runtimeVersion, '0.4.0'); assert.match(continued.notice, /started on runtime 0\.5\.0 and now continues on the installed runtime 0\.4\.0/);
  // With the cached revision gone the floor is unknown, so only the starting runtime or newer is accepted.
  await rm(join(f.project, '.' + skill, 'guidance', 'repository.git'), { recursive: true });
  await assert.rejects(resume({ ...f, runtime: older, task: started.task }), refusal);
  await writeFile(join(older, 'package.json'), JSON.stringify({ name: pkg.name, version: '0.5.0' }));
  assert.equal((await resume({ ...f, runtime: older, task: started.task })).notice, undefined);
});
test('incompatible guidance does not create a task and releases the refresh lock', async t => {
  const f = await fixture(t);
  await writeFile(join(f.source, 'guidance/manifest.json'), JSON.stringify({ schema: 1, skill, entry: 'SKILL.md', minimumRuntime: '9.0.0' })); await f.commit();
  await assert.rejects(start(f), /newer installed runtime/);
  assert.deepEqual((await readdir(join(f.project, '.' + skill, 'guidance'))).sort(), ['repository.git']);
});
test('synthesis guidance requires its prerelease runtime and keeps its saved guidance on resume', async t => {
  const f = await fixture(t);
  await writeFile(join(f.runtime, 'package.json'), JSON.stringify({ name: pkg.name, version: '0.9.5' }));
  await writeFile(join(f.source, 'guidance/manifest.json'), JSON.stringify({ schema: 1, skill, version: '1.0.0-alpha.1', entry: 'SKILL.md', minimumRuntime: '1.0.0-alpha.1' }));
  await f.commit();
  await assert.rejects(start(f), /newer installed runtime/);
  await writeFile(join(f.runtime, 'package.json'), JSON.stringify({ name: pkg.name, version: '1.0.0-alpha.1' }));
  const started = await start(f);
  assert.equal(started.guidanceVersion, '1.0.0-alpha.1');
  assert.equal((await resume({ ...f, task: started.task })).runtimeVersion, '1.0.0-alpha.1');
  await writeFile(join(f.source, 'guidance/manifest.json'), JSON.stringify({ schema: 1, skill, version: '1.0.0', entry: 'SKILL.md', minimumRuntime: '1.0.0' }));
  await f.commit();
  await assert.rejects(start(f), /newer installed runtime/);
});
test('automatic refresh stays on stable releases even for a preview runtime', async t => {
  const f = await fixture(t);
  await exec('git', ['-C', f.source, 'tag', 'v0.3.0', f.first]);
  await writeFile(join(f.runtime, 'package.json'), JSON.stringify({ name: pkg.name, version: '1.0.0-alpha.1' }));
  await writeFile(join(f.source, 'guidance/manifest.json'), JSON.stringify({ schema: 1, skill, version: '1.0.0-alpha.1', entry: 'SKILL.md', minimumRuntime: '1.0.0-alpha.1' }));
  const preview = await f.commit();
  await exec('git', ['-C', f.source, 'tag', 'v1.0.0-alpha.1', preview]);
  assert.equal((await start(f)).revision, f.first);
  assert.equal((await start({ ...f, revision: preview })).guidanceVersion, '1.0.0-alpha.1');
});
test('fetch failures preserve existing tasks and never claim current guidance', async t => {
  const f = await fixture(t), pin = await start(f);
  await assert.rejects(start({ ...f, source: join(f.dir, 'missing') }), /fetch failed/);
  assert.equal((await resume({ ...f, task: pin.task })).revision, f.first);
});
test('DNS failures identify the network restriction without leaking Git URLs and allow a retry', async t => {
  const f = await fixture(t), pin = await start(f), bin = join(f.dir, 'bin');
  await mkdir(bin);
  const realGit = (await exec('which', ['git'])).stdout.trim();
  const diagnostic = 'fatal: unable to access https://user:sensitive-token@private.example/customer-code: Could not resolve host: private.example\n';
  await writeFile(join(bin, 'git'), `#!/usr/bin/env node\nconst {spawnSync} = require('node:child_process');\nconst args = process.argv.slice(2);\nif (args.includes('fetch')) { process.stderr.write(${JSON.stringify(diagnostic)}); process.exit(128); }\nconst result = spawnSync(${JSON.stringify(realGit)}, args, {stdio: 'inherit'}); process.exit(result.status ?? 1);\n`, { mode: 0o700 });
  await assert.rejects(startInProcess(f, { ...process.env, PATH: bin + ':' + process.env.PATH }), error => {
    assert.match(error.stderr, /Guidance fetch failed \(git fetch\).*source host \(DNS\)/);
    assert.match(error.stderr, /permitted network-access flow/);
    assert.doesNotMatch(error.stderr, /sensitive-token|private\.example|customer-code/);
    return true;
  });
  assert.equal((await resume({ ...f, task: pin.task })).revision, f.first);
  assert.equal((await start(f)).runtime, pin.runtime);
});
test('missing Git reports the actual local operation instead of a fetch failure', async t => {
  const f = await fixture(t); await start(f);
  await assert.rejects(startInProcess(f, { ...process.env, PATH: '' }), error => {
    assert.match(error.stderr, /Guidance Git operation failed \(git rev-parse\).*Git is not installed or is not on PATH/);
    assert.doesNotMatch(error.stderr, /Guidance fetch failed/);
    return true;
  });
});
test('rejects symlink or executable guidance and unsafe caches', async t => {
  const f = await fixture(t);
  await symlink('../SKILL.md', join(f.source, 'references/link.md')); await f.commit();
  await assert.rejects(start(f), /regular non-executable/);
  await rm(join(f.source, 'references/link.md'));
  await chmod(join(f.source, 'references/design.md'), 0o755); await f.commit();
  await assert.rejects(start(f), /regular non-executable/);
  const cache = join(f.project, '.' + skill, 'guidance'); await rm(cache, { recursive: true });
  await symlink(f.runtime, cache); await assert.rejects(start(f), /Unsafe guidance directory/);
});
test('pins an approved ancestor explicitly and rejects other commits or malformed task IDs', async t => {
  const f = await fixture(t); await writeFile(join(f.source, 'references/design.md'), 'New'); await f.commit();
  const pin = await start({ ...f, revision: f.first }); assert.equal(pin.revision, f.first);
  await assert.rejects(start({ ...f, revision: 'a'.repeat(40) }), /Git operation failed \(git merge-base\)/);
  await assert.rejects(resume({ ...f, task: '../escape' }), /Invalid saved task/);
});
test('refresh lock refuses concurrent updates without deleting another owner’s lock', async t => {
  const f = await fixture(t), cache = join(f.project, '.' + skill, 'guidance'); await mkdir(cache, { recursive: true });
  await writeFile(join(cache, '.sync-lock'), 'owner'); await assert.rejects(start(f), /Another guidance refresh/);
  assert.equal(await readFile(join(cache, '.sync-lock'), 'utf8'), 'owner');
});

test('installed discovery entry is the small bootstrap while executable helpers stay local', async t => {
 const dir=await realpath(await mkdtemp(join(tmpdir(),'harness-bootstrap-install-')));t.after(()=>rm(dir,{recursive:true,force:true}));
 const result=await install({home:join(dir,'home'),shared:join(dir,'shared')});
 assert.equal(result.runtimeVersion,pkg.version);
 const version = await exec(process.execPath,[join(result.runtime,'scripts/harness-research.mjs'),'--version']);
 assert.equal(version.stdout.trim(),`harness-research ${pkg.version}`);
 const help = await exec(process.execPath,[join(result.runtime,'scripts/harness-research.mjs'),'synthesis','help']);
 assert.match(help.stdout,/synthesis/);
 assert.equal(await readFile(join(result.runtime,'SKILL.md'),'utf8'),await readFile(new URL('../bootstrap/SKILL.md',import.meta.url),'utf8'));
 assert.notEqual(await readFile(join(result.runtime,'SKILL.md'),'utf8'),await readFile(new URL('../SKILL.md',import.meta.url),'utf8'));
 assert.match(await readFile(join(result.runtime,'scripts/sync-guidance.mjs'),'utf8'),/Refresh instructions only/);
});
test('after an update, work pinned to a removed version folder resumes on the stable address with a notice', async t => {
  const f = await fixture(t), home = join(f.dir, 'home'), shared = join(f.dir, 'shared'), current = join(shared, 'current');
  const repo = new URL('../', import.meta.url), node = (...args) => exec(process.execPath, args);
  const first = await install({ home, shared });
  assert.equal(first.runtime, current); assert.equal(await realpath(current), first.versionDirectory);
  // Every result names the stable address, whichever way the installed runtime is reached.
  for (const runtime of [first.runtime, first.versionDirectory, first.targets[1]]) assert.equal((await start({ ...f, runtime })).runtime, current);
  const started = await start({ ...f, runtime: current });
  assert.equal(started.runtimeVersion, pkg.version);
  await oldFormatPin(started, first.versionDirectory, pkg.version);
  // The update is the same package with a later version number.
  const update = join(f.dir, 'update'); await mkdir(update);
  for (const name of ['SKILL.md', 'LICENSE', 'NOTICE.md', 'package.json', 'package-lock.json', 'bootstrap', 'guidance', 'references', 'scripts', 'upstream', 'examples']) await cp(new URL(name, repo), join(update, name), { recursive: true });
  await writeFile(join(update, 'package.json'), JSON.stringify({ ...pkg, version: '99.0.0' }));
  const second = await install({ source: update, home, shared });
  assert.equal(second.runtime, current); assert.equal(second.runtimeVersion, '99.0.0');
  assert.deepEqual(await readdir(join(shared, 'versions')), [second.id]);
  assert.deepEqual(second.removed, [first.versionDirectory]); assert.deepEqual(second.retained, []);
  await assert.rejects(access(first.versionDirectory), { code: 'ENOENT' });
  // Helpers run through the stable link, the skill link and the new folder alike.
  for (const base of [current, first.targets[0], second.versionDirectory]) {
    assert.equal((await node(join(base, 'scripts/harness-research.mjs'), '--version')).stdout.trim(), 'harness-research 99.0.0');
    const resumed = JSON.parse((await node(join(base, 'scripts/sync-guidance.mjs'), 'resume', '--project', f.project, '--task', started.task)).stdout);
    assert.equal(resumed.runtime, current); assert.equal(resumed.runtimeVersion, '99.0.0'); assert.equal(resumed.startedRuntimeVersion, pkg.version);
    assert.equal(resumed.freshness, 'saved-guidance'); assert.equal(resumed.revision, f.first);
    assert.equal(resumed.notice, `This work started on runtime ${pkg.version} and now continues on the installed runtime 99.0.0 with its saved instructions (guidance 0.3.0). Start a new task to adopt the newest instructions.`);
    assert.match(await readFile(resumed.guidance, 'utf8'), /First guidance/);
  }
  assert.match((await node(join(current, 'scripts/harness-research.mjs'), 'synthesis', 'help')).stdout, /synthesis/);
  assert.match((await node(join(current, 'scripts/sync-guidance.mjs'), '--help')).stdout, /stable address/);
  const dry = JSON.parse((await node(join(current, 'scripts/install.mjs'), '--dry-run', '--home', home, '--shared', shared)).stdout);
  assert.equal(dry.status, 'dry-run'); assert.equal(dry.runtime, current); assert.deepEqual(dry.wouldRemove, []);
  const cached = JSON.parse((await node(join(current, 'scripts/sync-guidance.mjs'), 'cached', '--project', f.project, '--task', started.task)).stdout);
  assert.equal(cached.freshness, 'cached-by-choice'); assert.equal(cached.runtime, current); assert.match(cached.notice, /installed runtime 99\.0\.0/);
  assert.equal(await readlink(current), `versions/${second.id}`);
});
test('new work takes the newest release its runtime supports, so unreleased guidance on main is not served', async t => {
  const f = await fixture(t);
  await exec('git', ['-C', f.source, 'tag', 'v0.3.0', f.first]);
  await writeFile(join(f.source, 'SKILL.md'), `---\nname: ${skill}\n---\nUnreleased guidance\n`); await f.commit();
  await writeFile(join(f.source, 'guidance/manifest.json'), JSON.stringify({ schema: 1, skill, version: '9.0.0', entry: 'SKILL.md', minimumRuntime: '9.0.0' }));
  await exec('git', ['-C', f.source, 'tag', 'v9.0.0', await f.commit()]);
  const started = await start(f);
  assert.equal(started.revision, f.first); assert.equal(started.channel, 'release'); assert.equal(started.ref, 'refs/tags/v0.3.0');
  assert.match(await readFile(started.guidance, 'utf8'), /First guidance/);
  // Using an older release because a newer one needs a newer runtime is disclosed, never silent.
  assert.equal(started.freshness, 'older-compatible-release');
  assert.deepEqual(started.newerRelease, { ref: 'refs/tags/v9.0.0', minimumRuntime: '9.0.0' });
  assert.match(started.notice, /v9\.0\.0 needs runtime 9\.0\.0.*trusted installer/);
  await exec('git', ['-C', f.source, 'tag', '-d', 'v9.0.0']);
  const newest = await start(f);
  assert.equal(newest.freshness, 'current-at-start'); assert.equal(newest.newerRelease, undefined); assert.equal(newest.notice, undefined);
  await exec('git', ['-C', f.source, 'tag', '-d', 'v0.3.0']);
  await assert.rejects(start(f), /newer installed runtime/);
});

test('guidance lock recovers an abandoned process but retains an old live owner', async t => {
  const f = await fixture(t), cache = join(f.project, '.' + skill, 'guidance'); await mkdir(cache,{recursive:true});
  const lock = join(cache,'.sync-lock'), old = new Date(Date.now()-120000);
  await writeFile(lock,String(process.pid)); await utimes(lock,old,old);
  await assert.rejects(start(f), /Another guidance refresh/);
  assert.equal(await readFile(lock,'utf8'),String(process.pid));
  await writeFile(lock,'2147483647'); await utimes(lock,old,old);
  assert.equal((await start(f)).revision,f.first);
  await assert.rejects(readFile(lock),{code:'ENOENT'});
});

test('guidance searches beyond ten incompatible releases and distinguishes its search budget', async t => {
  const f = await fixture(t);
  await exec('git',['-C',f.source,'tag','v0.3.0',f.first]);
  await writeFile(join(f.source,'guidance/manifest.json'),JSON.stringify({schema:1,skill,version:'9.0.0',entry:'SKILL.md',minimumRuntime:'9.0.0'}));
  const incompatible = await f.commit();
  for (let i=0;i<12;i++) await exec('git',['-C',f.source,'tag',`v9.0.${i}`,incompatible]);
  await assert.rejects(start({...f,releaseLimit:10}),/search limit reached.*older compatible guidance may exist/);
  const started = await start(f); assert.equal(started.revision,f.first);
  assert.equal(started.ref,'refs/tags/v0.3.0'); assert.equal(started.freshness,'older-compatible-release');
  await exec('git',['-C',f.source,'tag','-d','v0.3.0']);
  await assert.rejects(start(f),/No guidance release supports/);
});

test('new command guidance cannot load on the older 1.0.0 runtime', async t => {
  const f = await fixture(t), manifest = JSON.parse(await readFile(new URL('../guidance/manifest.json',import.meta.url),'utf8'));
  await writeFile(join(f.source,'guidance/manifest.json'),JSON.stringify(manifest)); await f.commit();
  await writeFile(join(f.runtime,'package.json'),JSON.stringify({name:pkg.name,version:'1.0.0'}));
  await assert.rejects(start(f),/newer installed runtime/);
  await writeFile(join(f.runtime,'package.json'),JSON.stringify({name:pkg.name,version:pkg.version}));
  assert.equal((await start(f)).guidanceVersion,manifest.version);
});
