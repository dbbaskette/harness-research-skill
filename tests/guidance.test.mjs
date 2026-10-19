import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm, symlink, realpath, chmod, utimes } from 'node:fs/promises';
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
test('new work sees main advancement; resumed work retains guidance and installed runtime without network', async t => {
  const f = await fixture(t), first = await start(f);
  assert.equal(first.revision, f.first); assert.equal(first.runtime, f.runtime);
  assert.equal(first.runtimeVersion, '0.2.0'); assert.equal(first.guidanceVersion, '0.3.0');
  const snapshot = join(first.guidance, '..');
  assert.deepEqual((await readdir(snapshot)).sort(), ['SKILL.md', 'pin.json', 'references']);
  await writeFile(join(f.source, 'SKILL.md'), `---\nname: ${skill}\n---\nSecond guidance\n`);
  await writeFile(join(f.source, 'guidance/manifest.json'), JSON.stringify({ schema: 1, skill, version: '0.4.0', entry: 'SKILL.md', minimumRuntime: '0.2.0' })); const secondCommit = await f.commit();
  const second = await start(f); assert.equal(second.revision, secondCommit);
  assert.equal(second.runtimeVersion, '0.2.0'); assert.equal(second.guidanceVersion, '0.4.0');
  await rm(f.source, { recursive: true });
  const continued = await resume({ ...f, task: first.task });
  assert.equal(continued.freshness, 'pinned'); assert.equal(continued.revision, f.first);
  assert.equal(continued.runtimeVersion, '0.2.0'); assert.equal(continued.guidanceVersion, '0.3.0');
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
  assert.equal(continued.runtimeVersion, '0.2.0'); assert.equal(continued.guidanceVersion, null);
  assert.equal(continued.runtime, f.runtime); assert.equal(continued.revision, started.revision);
});
test('malformed guidance release cannot create a task', async t => {
  const f = await fixture(t);
  await writeFile(join(f.source, 'guidance/manifest.json'), JSON.stringify({ schema: 1, skill, version: 'latest', entry: 'SKILL.md', minimumRuntime: '0.2.0' })); await f.commit();
  await assert.rejects(start(f), /Invalid guidance\/runtime version/);
  assert.deepEqual(await readdir(join(f.project, '.' + skill, 'guidance')), ['repository.git']);
});
test('guidance and executable changes are detected when resuming saved work', async t => {
  const f = await fixture(t), pin = await start(f);
  await chmod(join(pin.guidance, '../references/design.md'), 0o600);
  await writeFile(join(pin.guidance, '../references/design.md'), 'Changed');
  await assert.rejects(resume({ ...f, task: pin.task }), /guidance changed/);
  const second = await start(f); await writeFile(join(f.runtime, 'scripts/helper.mjs'), 'Changed runtime');
  await assert.rejects(resume({ ...f, task: second.task }), /runtime changed/);
});
test('incompatible guidance does not create a task and releases the refresh lock', async t => {
  const f = await fixture(t);
  await writeFile(join(f.source, 'guidance/manifest.json'), JSON.stringify({ schema: 1, skill, entry: 'SKILL.md', minimumRuntime: '9.0.0' })); await f.commit();
  await assert.rejects(start(f), /newer installed runtime/);
  assert.deepEqual((await readdir(join(f.project, '.' + skill, 'guidance'))).sort(), ['repository.git']);
});
test('synthesis guidance requires its prerelease runtime and retains its pin on resume', async t => {
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
