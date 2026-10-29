import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,realpath,rm,cp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash} from 'node:crypto';
import {initializeAsset,assetContext,runAssetCli} from '../scripts/lib/topic-assets.mjs';
import {runSynthesisCli} from '../scripts/lib/synthesis-cli.mjs';

async function setup(t) {
  const workspace=await realpath(await mkdtemp(join(tmpdir(),'topic-integration-')));
  t.after(()=>rm(workspace,{recursive:true,force:true}));
  const inputs=join(workspace,'inputs');await mkdir(inputs);
  await writeFile(join(inputs,'guide.md'),'Synthetic fixture: one writer is supported. Test-only data, not product research.\n');
  await writeFile(join(inputs,'urls.txt'),'# supplied references\nhttps://example.invalid/missing\nnot a url\n');
  const result=await initializeAsset({project:workspace,topic:'Storage comparison',directory:inputs});
  const root=result.asset,context=await assetContext(root), entry=context.inventory.find(e=>e.type==='document');
  const dossier={schema:2,...context.request,scope:'Synthetic test fixture',sources:[{id:'source-a',origin:entry.origin,title:'Fixture guide',publisher:'Synthetic fixture',permission:'selected',context:'full',file:entry.capture_file,original_file:entry.original_file}],facts:[{id:'fact-a',statement:'The fixture supports one writer.',author:'investigator-a',citations:[{source:'source-a',quote:'one writer is supported'}]}],findings:[{id:'finding-a',title:'Writer scope',summary:{text:'A single writer is supported in this fixture.',kind:'summary',refs:['fact-a']},support:['fact-a'],counter:[],implications:[],conditions:[],gaps:[]}],sections:[{id:'answer',title:'Scope',blocks:[{text:'The fixture supports one writer.',kind:'summary',refs:['finding-a']}]}]};
  const input=async (name,value)=>{await writeFile(join(root,name),JSON.stringify(value));return name;};
  const save=async()=>runSynthesisCli(['save','--project',root,'--file',await input('dossier.json',dossier),'--worker','writer']);
  const review=async draft=>{
    const r=structuredClone(draft.review_template);
    r.originals.forEach(x=>x.read_original=true);
    for(const group of ['facts','findings','prose'])r[group].forEach(x=>Object.assign(x,{verdict:'supported',note:'Synthetic fixture assertion checked against the fixture capture.'}));
    r.assessment={coverage:'accurate',usefulness:'adequate',note:'Synthetic fixture, not live research.'};
    return runSynthesisCli(['review','--project',root,'--file',await input('review.json',r),'--worker','fixture-checker']);
  };
  return {workspace,inputs,root,dossier,input,save,review};
}
test('topic assets save root-level reviewed bundles with portable relative citations and preserve supplied failures',async t=>{
  const f=await setup(t),draft=await f.save();
  assert.equal(draft.layout,'topic');assert.ok(draft.outputs.includes('report.md'));assert.ok(!draft.outputs.includes('research/report.md'));
  assert.equal((await f.review(draft)).status,'complete');
  const status=await runSynthesisCli(['verify','--project',f.root]);assert.equal(status.artifact_integrity,'verified');
  const evidence=await readFile(join(f.root,'evidence.md'),'utf8');assert.match(evidence,/\(sources\/revisions\//);assert.doesNotMatch(evidence,/\.\.\/sources|\(research\//);
  const manifest=JSON.parse(await readFile(join(f.root,'output.json'),'utf8'));
  for(const a of manifest.artifacts)assert.equal(createHash('sha256').update(await readFile(join(f.root,a.file))).digest('hex'),a.sha256);
  const inventory=JSON.parse(await readFile(join(f.root,'sources.json'),'utf8'));
  assert.ok(inventory.entries.some(e=>e.origin==='https://example.invalid/missing'&&e.outcome==='pending'));
  assert.ok(inventory.entries.some(e=>e.origin==='not a url'&&e.outcome==='rejected'));
  assert.deepEqual(inventory.entries.find(e=>e.type==='document').evidence_ids,['source-a']);
  assert.equal(inventory.entries.find(e=>e.type==='document').used_in_digest,draft.digest);
  const copy=join(f.workspace,'copied-topic');await cp(f.root,copy,{recursive:true});
  assert.equal((await runSynthesisCli(['verify','--project',copy])).status,'complete');
});
test('tag edits do not create evidence approval and topic revisions preserve reviewed predecessors',async t=>{
  const f=await setup(t),draft=await f.save();await f.review(draft);
  await runAssetCli(['metadata','--project',f.root,'--file',await f.input('metadata.json',{tags:['storage','internal'],description:'Fixture comparison'})]);
  const before=await runSynthesisCli(['status','--project',f.root]);assert.equal(before.status,'complete');assert.equal(before.digest,draft.digest);
  f.dossier.sections[0].blocks[0].text='For this synthetic fixture, one writer is supported.';
  const changed=await f.save();assert.equal(changed.status,'draft');assert.notEqual(changed.digest,draft.digest);
  const topic=JSON.parse(await readFile(join(f.root,'topic.json'),'utf8'));
  assert.deepEqual(topic.tags,['storage','internal']);assert.ok(topic.revisions.some(r=>r.digest===draft.digest));
  await assert.rejects(f.review(draft),/stale/);
});
test('asset intake changes invalidate research and authored permission changes are refused',async t=>{
  const f=await setup(t),draft=await f.save();await f.review(draft);
  f.dossier.source_mode='mixed';await assert.rejects(f.save(),/source_mode|request|intent|permission/);f.dossier.source_mode='selected';
  await writeFile(join(f.inputs,'new.txt'),'New supplied material');
  await runAssetCli(['intake','--project',f.root,'--directory',f.inputs]);
  assert.equal((await runSynthesisCli(['status','--project',f.root])).status,'stale');
});
test('managed asset paths cannot be used as evidence or overwritten through review template aliases',async t=>{
  const f=await setup(t);await f.save();
  await assert.rejects(runSynthesisCli(['template','--project',f.root,'--out','topic.json']),/managed/);
  await assert.rejects(runSynthesisCli(['template','--project',f.root,'--out','documents/new.json']),/managed/);
  f.dossier.sources[0].file='report.md';await assert.rejects(f.save(),/managed synthesis/);
});
