import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink,readdir,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {runAssetCli,assetContext,verifyAssetDossier,updateAssetRevision} from '../scripts/lib/topic-assets.mjs';
import {hash} from '../scripts/lib/run-storage.mjs';

async function fixture(t) {
  const root=await realpath(await mkdtemp(join(tmpdir(),'topic-assets-')));
  t.after(()=>rm(root,{recursive:true,force:true}));
  const workspace=join(root,'workspace'),inputs=join(root,'inputs');
  await mkdir(workspace);await mkdir(inputs);
  const init=(topic='A useful topic',extra=[])=>runAssetCli(['init','--project',workspace,'--topic',topic,...extra]);
  const operation=async(asset,action,input)=>{
    const name='update-'+Date.now()+'-'+Math.random()+'.json';
    await writeFile(join(asset,name),JSON.stringify(input));
    return runAssetCli([action,'--project',asset,'--file',name]);
  };
  return {root,workspace,inputs,init,operation};
}
const get=async(root,name)=>JSON.parse(await readFile(join(root,name),'utf8'));

test('standalone topic assets need no Git or studio and isolate two topics',async t=>{
  const f=await fixture(t),a=await f.init(),b=await f.init('A different topic');
  assert.equal(a.asset,join(f.workspace,'research/a-useful-topic'));
  assert.equal(a.status,'empty'); assert.equal(a.sync,'caller-owned');
  assert.equal(a.request.purpose,'General-purpose topic research');
  assert.notEqual(a.id,b.id);assert.notEqual(a.asset,b.asset);
  assert.equal((await assetContext(a.asset)).layout,'topic');
  assert.equal((await get(a.asset,'topic.json')).id,a.id);
  assert.equal((await get(a.asset,'sources.json')).entries.length,0);
  await assert.rejects(readFile(join(f.workspace,'.git')),/ENOENT/);
  assert.equal(await assetContext(f.workspace),null);
  await assert.rejects(f.init(),/already exists/);
  const custom=join(f.root,'custom');
  const c=await f.init('Third',['--destination',custom]);
  assert.equal(c.asset,custom);
});

test('batch intake retains exact originals, readable captures, URL lines and honest outcomes',async t=>{
  const f=await fixture(t);
  await mkdir(join(f.inputs,'documents'));
  await writeFile(join(f.inputs,'documents/reference.md'),'# Complete original\nThe default is 10.\n');
  await writeFile(join(f.inputs,'documents/scan.pdf'),'%PDF-1.7\noriginal bytes');
  const list='# selected references\n\nhttps://example.test/docs\nhttps://example.test/docs\nnot a URL\nhttps://user:secret@example.test/private\n';
  await writeFile(join(f.inputs,'urls.txt'),list);
  const a=await f.init('Batch',['--directory',f.inputs]);
  assert.equal(a.request.source_mode,'selected');assert.equal(a.counts.documents,2);assert.equal(a.counts.urls,4);
  const state=await assetContext(a.asset),inventory=state.inventory;
  const doc=inventory.find(e=>e.filename==='documents/reference.md');
  assert.equal(doc.outcome,'ready');
  assert.equal(await readFile(join(a.asset,doc.original_file),'utf8'),'# Complete original\nThe default is 10.\n');
  assert.equal(await readFile(join(a.asset,doc.capture_file),'utf8'),'# Complete original\nThe default is 10.\n');
  const pdf=inventory.find(e=>e.filename==='documents/scan.pdf');assert.equal(pdf.outcome,'extraction-needed');assert.equal(pdf.capture_file,undefined);
  const urls=inventory.filter(e=>e.type==='url');
  assert.deepEqual(urls.map(e=>e.line),[3,4,5,6]);
  assert.equal(urls[0].origin,urls[1].origin);assert.notEqual(urls[0].id,urls[1].id);
  assert.equal(urls[2].outcome,'rejected');assert.equal(urls[3].outcome,'rejected');
  assert.doesNotMatch(await readFile(join(a.asset,'sources.json'),'utf8'),/secret/);
  assert.equal(await readFile(join(a.asset,urls[0].list_file),'utf8'),list);
  assert.match(state.inputFingerprint,/^[a-f0-9]{64}$/);
  const d={...state.request,sources:[{id:'doc',origin:doc.origin,permission:'selected',file:doc.capture_file,original_file:doc.original_file}]};
  await verifyAssetDossier(a.asset,d);
  await assert.rejects(verifyAssetDossier(a.asset,{...d,source_mode:'mixed'}),/preserve the recorded request/);
  await assert.rejects(verifyAssetDossier(a.asset,{...d,sources:[{...d.sources[0],original_file:undefined}]}),/original_file/);
  await f.operation(a.asset,'source',{id:urls[0].id,outcome:'inaccessible',note:'Access refused.'});
  assert.equal((await get(a.asset,'sources.json')).entries.find(e=>e.id===urls[0].id).outcome,'inaccessible');
  await assert.rejects(f.operation(a.asset,'source',{id:urls[2].id,outcome:'unused'}),/Rejected input/);
});

test('URL lists may be supplied independently and source capture updates preserve provenance',async t=>{
  const f=await fixture(t),list=join(f.root,'links.txt');await writeFile(list,'https://example.test/original\n');
  const a=await f.init('Links',['--urls',list]);
  const entry=(await assetContext(a.asset)).inventory[0];
  await writeFile(join(a.asset,'sources/web.txt'),'Complete captured context. A useful observation.');
  await assert.rejects(f.operation(a.asset,'source',{id:entry.id,outcome:'captured',capture_file:'sources/web.txt'}),/accessed_at/);
  await assert.rejects(f.operation(a.asset,'source',{id:entry.id,outcome:'captured',capture_file:'sources/web.txt',capture_sha256:'incorrect',accessed_at:'2026-10-29'}),/hash/);
  await f.operation(a.asset,'source',{id:entry.id,outcome:'captured',capture_file:'sources/web.txt',accessed_at:'2026-10-29',evidence_ids:['source-a']});
  const context=await assetContext(a.asset);
  await verifyAssetDossier(a.asset,{...context.request,sources:[{id:'source-a',origin:entry.origin,permission:'selected',file:'sources/web.txt'}]});
  await assert.rejects(f.operation(a.asset,'source',{id:entry.id,outcome:'unused',permission:'public'}),/provenance/);
  await assert.rejects(verifyAssetDossier(a.asset,{...context.request,sources:[{id:'source-a',origin:'https://unselected.test',permission:'selected',file:'sources/web.txt'}]}),/permitted inventory/);
});

test('discovered sources require public permission and real capture bytes',async t=>{
  const f=await fixture(t),a=await f.init('Public');
  await writeFile(join(a.asset,'sources/discovered.txt'),'Captured original context.');
  await assert.rejects(f.operation(a.asset,'source',{id:'new',role:'discovered',origin:'https://example.test',permission:'public',outcome:'captured',accessed_at:'2026-10-29'}),/actual readable capture/);
  await f.operation(a.asset,'source',{id:'new',role:'discovered',origin:'https://example.test',permission:'public',outcome:'captured',capture_file:'sources/discovered.txt',accessed_at:'2026-10-29'});
  const context=await assetContext(a.asset);
  await verifyAssetDossier(a.asset,{...context.request,sources:[{id:'a',origin:'https://example.test',permission:'public',file:'sources/discovered.txt'}]});
  await writeFile(join(a.asset,'sources/discovered.txt'),'Changed bytes');
  await assert.rejects(verifyAssetDossier(a.asset,{...context.request,sources:[{id:'a',origin:'https://example.test',permission:'public',file:'sources/discovered.txt'}]}),/differs/);
  const b=await f.init('Selected',['--source-mode','selected']);
  await assert.rejects(f.operation(b.asset,'source',{id:'new',role:'discovered',origin:'https://example.test',permission:'public',outcome:'pending'}),/public research permission/);
});

test('metadata keeps stable identity and exact review revision; reintake creates a changed fingerprint',async t=>{
  const f=await fixture(t);await writeFile(join(f.inputs,'one.md'),'Original input');
  const a=await f.init('Metadata',['--directory',f.inputs]);
  await updateAssetRevision(a.asset,{digest:'a'.repeat(64),author:'writer',review:{worker:'checker'}},{status:'complete'});
  const first=await get(a.asset,'topic.json');
  await f.operation(a.asset,'metadata',{title:'Useful title',description:'Discovery only',tags:['Redis','cache','Redis']});
  const edited=await get(a.asset,'topic.json');
  assert.equal(edited.id,a.id);assert.deepEqual(edited.tags,['Redis','cache']);assert.deepEqual(edited.current,first.current);
  await assert.rejects(f.operation(a.asset,'metadata',{current:{status:'complete'}}),/title, description and tags only/);
  await writeFile(join(f.inputs,'two.md'),'Additional source');
  const changed=await runAssetCli(['intake','--project',a.asset,'--directory',f.inputs]);
  assert.notEqual(changed.inputFingerprint,a.inputFingerprint);assert.equal(changed.status,'stale');
  assert.equal((await readdir(join(a.asset,'.harness-research/intake-history'))).length,1);
  const repeated=await runAssetCli(['intake','--project',a.asset,'--directory',f.inputs]);
  assert.equal(repeated.inputFingerprint,changed.inputFingerprint);
  await updateAssetRevision(a.asset,{digest:'b'.repeat(64),author:'writer',review:null},{status:'draft'});
  const revised=await get(a.asset,'topic.json');assert.equal(revised.revisions.length,2);assert.equal(revised.current.status,'draft');
  assert.equal(revised.revisions[0].digest,'a'.repeat(64));
});

test('asset projections repair from authoritative state but changed input copies block reuse',async t=>{
  const f=await fixture(t);await writeFile(join(f.inputs,'one.txt'),'Authoritative input');
  const a=await f.init('Integrity',['--directory',f.inputs]);
  await writeFile(join(a.asset,'topic.json'),'damaged');
  await runAssetCli(['status','--project',a.asset]);assert.equal((await get(a.asset,'topic.json')).id,a.id);
  const entry=(await assetContext(a.asset)).inventory[0];
  await writeFile(join(a.asset,entry.original_file),'Tampered original');
  await assert.rejects(assetContext(a.asset),/snapshot changed/);
  await assert.rejects(runAssetCli(['status','--project',a.asset]),/snapshot changed/);
});

test('intake excludes owned output, rejects links and refuses overlap or unsafe destinations',async t=>{
  const f=await fixture(t);await writeFile(join(f.inputs,'one.txt'),'Readable input');
  await symlink(join(f.inputs,'one.txt'),join(f.inputs,'linked.txt'));
  await mkdir(join(f.inputs,'.git'));await writeFile(join(f.inputs,'.git/config'),'not read');
  await mkdir(join(f.inputs,'.aws'));await writeFile(join(f.inputs,'.aws/credentials'),'not read');
  await writeFile(join(f.inputs,'.env.local'),'not read');
  await mkdir(join(f.inputs,'old/.harness-research'),{recursive:true});await writeFile(join(f.inputs,'old/report.md'),'Generated report');
  const a=await f.init('Boundaries',['--directory',f.inputs]);
  const entries=(await assetContext(a.asset)).inventory;
  assert.equal(entries.find(e=>e.filename==='linked.txt').outcome,'rejected');
  assert.equal(entries.find(e=>e.filename==='old').outcome,'excluded');
  assert.ok(!entries.some(e=>e.filename==='.git/config'||e.filename.startsWith('.aws')||e.filename.startsWith('.env')));
  await assert.rejects(f.init('Overlap',['--directory',f.workspace]),/overlap/);
  const linked=join(f.workspace,'linked-parent');await symlink(f.inputs,linked);
  await assert.rejects(f.init('Unsafe',['--destination',join(linked,'asset')]),/symlinks/);
  await mkdir(join(f.workspace,'already'));
  await assert.rejects(f.init('Already',['--destination','already']),/already exists/);
});

test('unreadable URL bytes and incompatible source mode fail without leaving an asset',async t=>{
  const f=await fixture(t);await writeFile(join(f.inputs,'urls.txt'),Buffer.from([0xff,0xfe]));
  await assert.rejects(f.init('Invalid',['--directory',f.inputs]),/UTF-8/);
  assert.deepEqual(await readdir(f.workspace),[]);
  await writeFile(join(f.inputs,'urls.txt'),'https://example.test\n');
  await assert.rejects(f.init('Public inputs',['--directory',f.inputs,'--source-mode','public']),/selected or mixed/);
});


test('asset status delegates actual integrity checks after releasing the shared lock',async t=>{
  const f=await fixture(t);await writeFile(join(f.inputs,'one.md'),'Evidence pending.');
  const a=await f.init('Status',['--directory',f.inputs]);
  const context=await assetContext(a.asset);
  const dossier={schema:2,...context.request,scope:'Synthetic status fixture',sources:[],facts:[],findings:[],sections:[{id:'pending',title:'Pending',blocks:[{text:'No researched evidence yet.',kind:'gap',refs:[]}]}]};
  await writeFile(join(a.asset,'dossier.json'),JSON.stringify(dossier));
  const {runSynthesisCli}=await import('../scripts/lib/synthesis-cli.mjs');
  await runSynthesisCli(['save','--project',a.asset,'--file','dossier.json','--worker','writer']);
  const before=await runAssetCli(['status','--project',a.asset]);
  assert.equal(before.status,'draft');assert.equal(before.artifact_integrity,'verified');
  const saved=await get(a.asset,'.harness-research/synthesis.json');
  saved.digest='changed';await writeFile(join(a.asset,'.harness-research/synthesis.json'),JSON.stringify(saved));
  const stale=await runAssetCli(['status','--project',a.asset]);
  assert.equal(stale.status,'stale');assert.ok(stale.problems.some(p=>p.includes('digest')));
});

test('asset manifest includes unused originals and metadata while excluding private working state',async t=>{
  const f=await fixture(t);
  await writeFile(join(f.inputs,'used.md'),'Readable original');
  await writeFile(join(f.inputs,'unused.pdf'),'%PDF-1.7\nUnused original');
  await writeFile(join(f.inputs,'urls.txt'),'https://example.test/unused\n');
  const a=await f.init('Portable bundle',['--directory',f.inputs]);
  assert.equal(a.paths.asset_manifest,'asset-manifest.json');
  const before=await get(a.asset,'asset-manifest.json');
  assert.equal(before.integrity,'verified');
  const context=await assetContext(a.asset),unused=context.inventory.find(e=>e.filename==='unused.pdf');
  assert.ok(before.artifacts.some(e=>e.file===unused.original_file));
  assert.ok(before.artifacts.some(e=>e.file==='sources.json'));
  assert.ok(before.artifacts.some(e=>e.file==='topic.json'));
  assert.ok(!before.artifacts.some(e=>e.file.startsWith('.harness-research/')||e.file.includes('urls.txt')));
  for (const file of before.artifacts) assert.equal(hash(await readFile(join(a.asset,file.file))),file.sha256);
  await f.operation(a.asset,'metadata',{tags:['portable','topic']});
  const after=await get(a.asset,'asset-manifest.json');
  assert.notEqual(after.artifacts.find(e=>e.file==='topic.json').sha256,before.artifacts.find(e=>e.file==='topic.json').sha256);
  assert.equal(after.recorded_review.status,'empty');
});


test('empty selected input remains selected and unchanged intake preserves captured URL receipts',async t=>{
  const f=await fixture(t);
  const empty=await f.init('Empty selection',['--directory',f.inputs]);assert.equal(empty.request.source_mode,'selected');
  await writeFile(join(f.inputs,'urls.txt'),'https://example.test/reference\n');
  const a=await f.init('No-op intake',['--directory',f.inputs]);
  const entry=(await assetContext(a.asset)).inventory[0];
  await writeFile(join(a.asset,'sources/web.txt'),'Complete retained context');
  await f.operation(a.asset,'source',{id:entry.id,outcome:'captured',capture_file:'sources/web.txt',accessed_at:'2026-10-29'});
  const repeated=await runAssetCli(['intake','--project',a.asset,'--directory',f.inputs]);
  assert.equal(repeated.inputFingerprint,a.inputFingerprint);
  const after=(await assetContext(a.asset)).inventory.find(e=>e.id===entry.id);
  assert.equal(after.outcome,'captured');assert.equal(after.capture_file,'sources/web.txt');
});
