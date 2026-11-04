import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, writeFile, readFile, mkdir, readdir, rm, symlink, cp} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {runSynthesisCli} from '../scripts/lib/synthesis-cli.mjs';
import {runtimeIdentity} from '../scripts/lib/synthesis-reuse.mjs';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {fileURLToPath} from 'node:url';
const exec=promisify(execFile);

async function fixture(t) {
  const root=await mkdtemp(join(tmpdir(),'research-unchanged-'));t.after(()=>rm(root,{recursive:true,force:true}));
  const text='The default is 10. Workload conditions still apply.';
  await writeFile(join(root,'capture.txt'),text);await writeFile(join(root,'original.txt'),text);
  const context={schema:1,protocol:'test-collection-v1',guidance:'pinned-guidance-a',independence:'isolated-author-and-reviewer-v1'};
  const dossier={schema:2,topic:'Synthetic defaults',audience:'Operators',purpose:'Evaluate a default',scope:'The supplied test source',source_mode:'public',
    sources:[{id:'s1',file:'capture.txt',original_file:'original.txt',origin:'https://example.com/docs',title:'Synthetic notes',publisher:'Example',permission:'public',context:'full',version:'1'}],
    facts:[{id:'f1',statement:'The default is 10.',author:'investigator',citations:[{source:'s1',quote:'The default is 10.'}]}],
    findings:[{id:'finding1',title:'A conditional default',summary:{text:'The default is 10.',kind:'summary',refs:['f1']},support:['f1'],counter:[],implications:[],conditions:[],gaps:[]}],
    sections:[{id:'decision',title:'Decision',blocks:[{text:'The default is 10.',kind:'summary',refs:['finding1']}]}]};
  const writeContext=()=>writeFile(join(root,'context.json'),JSON.stringify(context));await writeContext();
  async function save(reuse=true,author='writer') {
    await writeFile(join(root,'dossier.json'),JSON.stringify(dossier));
    return runSynthesisCli(['save','--project',root,'--file','dossier.json','--worker',author,...(reuse?['--reuse-unchanged','--context','context.json']:[])]);
  }
  async function review(status) {
    const value=structuredClone(status.review_template);
    for(const source of value.originals)source.read_original=true;
    for(const key of ['facts','findings','prose'])for(const item of value[key]){item.verdict='supported';item.note='Checked the complete supplied context.';}
    value.assessment={coverage:'accurate',usefulness:'adequate',note:'The scope and qualification are explicit.'};
    await writeFile(join(root,'review.json'),JSON.stringify(value));
    return runSynthesisCli(['review','--project',root,'--file','review.json','--worker','independent-checker']);
  }
  const status=()=>runSynthesisCli(['verify','--project',root]);
  return {root,dossier,context,writeContext,save,review,status};
}

test('explicit identical saves retain complete review, immutable state and saved/no-change receipt',async t=>{
  const f=await fixture(t),draft=await f.save(),complete=await f.review(draft);
  assert.equal(complete.status,'complete');
  const state=join(f.root,'.harness-research/synthesis.json'),before=await readFile(state,'utf8');
  const history=await readdir(join(f.root,'.harness-research/synthesis-history'));
  for(let repeat=0;repeat<3;repeat++){
    const saved=await f.save();assert.equal(saved.save_result,'no-change');assert.equal(saved.review_preserved,true);
    assert.equal(saved.status,'complete');assert.equal(saved.digest,complete.digest);assert.equal(saved.reviewer,'independent-checker');
  }
  assert.equal(await readFile(state,'utf8'),before);assert.deepEqual(await readdir(join(f.root,'.harness-research/synthesis-history')),history);
  assert.equal(JSON.parse(before).schema,3);assert.equal(JSON.parse(await readFile(join(f.root,'research/facts.json'))).schema,2);
});

test('legacy saves keep revision semantics; old review is not retroactively adopted',async t=>{
  const f=await fixture(t);await f.review(await f.save(false));
  assert.equal((await f.save(false)).status,'draft');
  assert.equal(JSON.parse(await readFile(join(f.root,'.harness-research/synthesis.json'))).schema,2);
  await f.review(await f.save(false));const adopted=await f.save();
  assert.equal(adopted.save_result,'saved');assert.equal(adopted.review_preserved,false);assert.equal(adopted.status,'draft');
});

test('claims, quotes, original bytes, source metadata, audience, purpose, scope and author invalidate reuse',async t=>{
  const changes={
    claim:f=>{f.dossier.facts[0].statement='The documented default is 10.';},
    quote:f=>{f.dossier.facts[0].citations[0].quote='default is 10';},
    original:async f=>writeFile(join(f.root,'original.txt'),'The default is 10. Changed complete original context.'),
    metadata:f=>{f.dossier.sources[0].version='2';},
    audience:f=>{f.dossier.audience='Different readers';},
    purpose:f=>{f.dossier.purpose='A different decision';},
    scope:f=>{f.dossier.scope='Different scope';}
  };
  for(const [name,change]of Object.entries(changes))await t.test(name,async child=>{
    const f=await fixture(child);await f.review(await f.save());await change(f);
    const result=await f.save();assert.equal(result.status,'draft');assert.equal(result.review_preserved,false);assert.equal(result.save_result,'saved');
  });
  const f=await fixture(t);await f.review(await f.save());assert.equal((await f.save(true,'another-writer')).status,'draft');
});

test('changed source permissions and provenance require a new review',async t=>{
  const f=await fixture(t);await f.review(await f.save());
  f.dossier.source_mode='selected';f.dossier.sources[0].permission='selected';
  f.dossier.sources[0].origin='Supplied synthetic notes';
  const result=await f.save();assert.equal(result.status,'draft');assert.equal(result.review_preserved,false);
});

test('protocol, guidance and independence context changes make prior work stale until resaved and reviewed',async t=>{
  for(const field of ['protocol','guidance','independence'])await t.test(field,async child=>{
    const f=await fixture(child);await f.review(await f.save());f.context[field]+='-changed';await f.writeContext();
    assert.equal((await f.status()).status,'stale');
    const saved=await f.save();assert.equal(saved.status,'draft');assert.equal(saved.save_result,'saved');assert.equal(saved.review_preserved,false);
  });
});

test('missing or tampered captures, originals and immutable snapshots cannot preserve review',async t=>{
  for(const file of ['capture.txt','original.txt','snapshot','missing-snapshot'])await t.test(file,async child=>{
    const f=await fixture(child);await f.review(await f.save());
    const state=JSON.parse(await readFile(join(f.root,'.harness-research/synthesis.json')));
    const target=file.includes('snapshot')?state.sources[0].snapshot:file;
    if(file==='snapshot')await writeFile(join(f.root,target),'tampered');else await rm(join(f.root,target));
    await assert.rejects(f.save());assert.equal((await f.status()).status,'stale');
  });
});

test('concurrent duplicate intents serialize and preserve one reviewed revision',async t=>{
  const f=await fixture(t),draft=await f.save();await f.review(draft);
  const args=['save','--project',f.root,'--file','dossier.json','--worker','writer','--reuse-unchanged','--context','context.json'];
  const results=await Promise.all([runSynthesisCli(args),runSynthesisCli(args)]);
  for(const result of results){assert.equal(result.save_result,'no-change');assert.equal(result.status,'complete');assert.equal(result.review_preserved,true);}
});

test('CLI verification detects changed runtime/guidance bytes',async t=>{
  const f=await fixture(t),draft=await f.save();await f.review(draft);
  const copied=await mkdtemp(join(tmpdir(),'research-reuse-runtime-'));t.after(()=>rm(copied,{recursive:true,force:true}));
  const root=fileURLToPath(new URL('../',import.meta.url));
  for(const name of ['package.json','SKILL.md','guidance','scripts','references'])await cp(join(root,name),join(copied,name),{recursive:true});
  const cli=join(copied,'scripts/harness-research.mjs');
  const verified=await exec(process.execPath,[cli,'synthesis','verify','--project',f.root]);assert.equal(JSON.parse(verified.stdout).status,'complete');
  await writeFile(join(copied,'references/synthesis-reuse.md'),'Changed required review guidance.');
  await assert.rejects(exec(process.execPath,[cli,'synthesis','verify','--project',f.root]),error=>JSON.parse(error.stdout).status==='stale');
});

test('context is explicit, bounded, project-local and valid only on opted-in save',async t=>{
  const f=await fixture(t);await writeFile(join(f.root,'dossier.json'),JSON.stringify(f.dossier));
  const base=['save','--project',f.root,'--file','dossier.json','--worker','writer'];
  await assert.rejects(runSynthesisCli([...base,'--reuse-unchanged']),/belong together/);
  await assert.rejects(runSynthesisCli([...base,'--context','context.json']),/belong together/);
  await writeFile(join(f.root,'context.json'),'x'.repeat(64_001));await assert.rejects(f.save(),/64,000/);
  await writeFile(join(f.root,'context.json'),'{}');await assert.rejects(f.save(),/protocol, guidance and independence/);
});

test('runtime identity covers executable, protocol and guidance bytes and refuses links',async t=>{
  const root=await mkdtemp(join(tmpdir(),'research-runtime-id-'));t.after(()=>rm(root,{recursive:true,force:true}));
  for(const name of ['scripts','references','guidance'])await mkdir(join(root,name));
  for(const name of ['package.json','SKILL.md','guidance/manifest.json','scripts/runtime.mjs','references/rules.md'])await writeFile(join(root,name),'initial');
  let before=await runtimeIdentity(root);
  for(const name of ['scripts/runtime.mjs','references/rules.md','guidance/manifest.json']){
    await writeFile(join(root,name),'changed');const next=await runtimeIdentity(root);assert.notEqual(next,before);before=next;
  }
  await symlink(join(root,'SKILL.md'),join(root,'scripts/link'));await assert.rejects(runtimeIdentity(root),/ordinary runtime/);
});
