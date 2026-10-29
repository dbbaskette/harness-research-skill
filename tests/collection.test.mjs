import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, symlink } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { runCollectionCli, verifyCollectionDossier, verifyCollectionReviewer, bindCollectionDossier } from '../scripts/lib/collection.mjs';
import { runSynthesisCli } from '../scripts/lib/synthesis-cli.mjs';
import { initializeAsset, assetContext, runAssetCli } from '../scripts/lib/topic-assets.mjs';
import { hash } from '../scripts/lib/run-storage.mjs';

async function fixture(t, amend = {}) {
  const root=await mkdtemp(join(tmpdir(),'collection-'));t.after(()=>rm(root,{recursive:true,force:true}));let serial=0;
  const request={schema:1,topic:'A bounded comparison',audience:'Engineers',purpose:'Explain the tradeoffs',scope:'Two independent defaults',source_mode:'public',workstreams:[{id:'first',questions:['What is the first default?']},{id:'second',questions:['What is the second default?']}],...amend};
  const call=async(action,input)=>{const args=[action,'--project',root];if(input!==undefined){const file=`input-${serial++}.json`;await writeFile(join(root,file),JSON.stringify(input));args.push('--file',file);}return runCollectionCli(args);};
  const started=await call('init',request);
  const source=(name,value='10',extra={})=>({id:'source-a',origin:`https://example.test/${name}`,title:`${name} manual`,publisher:'Example',file:`${name}.txt`,permission:'public',context:'full',...extra});
  const register=async(workstream,investigator=`investigator-${workstream}`)=>call('register',{workstream,investigator,invocation:`host/context/${investigator}`});
  const capture=async(workstream,src,investigator=`investigator-${workstream}`)=>{await writeFile(join(root,src.file),`Complete ${src.title} context. The default is ${workstream==='second'?'20':'10'}. source-a is an identifier mentioned in prose.`);return call('capture',{workstream,investigator,source:src});};
  const packet=(workstream,src,extra={})=>({schema:1,request_digest:started.request_digest,generation:started.generation,workstream,attempt:1,investigator:`investigator-${workstream}`,sources:[src],facts:[{id:'fact-a',statement:`source-a names default ${workstream==='second'?'20':'10'}.`,author:`investigator-${workstream}`,citations:[{source:'source-a',quote:`The default is ${workstream==='second'?'20':'10'}.`,locator:'Defaults'}]}],limitations:['Workload is not measured.'],gaps:[],...extra});
  const complete=async(workstream)=>{const src=source(workstream);await register(workstream);await capture(workstream,src);const p=packet(workstream,src);await call('accept',p);return p;};
  return {root,request,call,started,source,register,capture,packet,complete};
}
function dossier(registry) {
  return {schema:2,topic:registry.request.topic,audience:registry.request.audience,purpose:registry.request.purpose,scope:registry.request.scope,source_mode:registry.request.source_mode,sources:registry.sources,facts:registry.facts,findings:[{id:'a-finding',title:'A conditional comparison',summary:{text:'The defaults differ.',kind:'summary',refs:registry.facts.map(f=>f.id)},support:registry.facts.map(f=>f.id),counter:[],implications:[],conditions:[],gaps:[]}],sections:[{id:'answer',title:'Answer',blocks:[{text:'The defaults differ by context.',kind:'summary',refs:registry.facts.map(f=>f.id)}]}]};
}
test('two investigator packets assemble without rewriting quotations/prose and retain distinct facts/authors',async t=>{
  const f=await fixture(t);const first=await f.complete('first'),second=await f.complete('second');
  const registry=await f.call('assemble');
  assert.equal(registry.sources.length,2);assert.equal(registry.facts.length,2);
  assert.equal(new Set([...registry.sources,...registry.facts].map(v=>v.id)).size,4);
  for(const entry of [...registry.sources,...registry.facts])assert.match(entry.id,/^[a-z0-9][a-z0-9-]{0,63}$/);
  assert.deepEqual(registry.facts.map(v=>v.author),['investigator-first','investigator-second']);
  for(const [i,p] of [first,second].entries()){assert.equal(registry.facts[i].statement,p.facts[0].statement);assert.equal(registry.facts[i].citations[0].quote,p.facts[0].citations[0].quote);assert.equal(registry.facts[i].citations[0].source,registry.sources[i].id);}
  const again=await f.call('assemble');assert.equal(again.registry_digest,registry.registry_digest);
  const token=await verifyCollectionDossier(f.root,dossier(registry),'synthesis-author');
  assert.deepEqual(token,{request_digest:f.started.request_digest,generation:1,registry_digest:registry.registry_digest});
});
test('real synthesis helper accepts mixed investigators but rejects each content author as reviewer',async t=>{
  const f=await fixture(t);await f.complete('first');await f.complete('second');const registry=await f.call('assemble'),d=dossier(registry);
  await writeFile(join(f.root,'dossier.json'),JSON.stringify(d));
  const saved=await runSynthesisCli(['save','--project',f.root,'--file','dossier.json','--worker','synthesis-author']);
  await bindCollectionDossier(f.root,saved.digest);
  const template=structuredClone(saved.review_template);
  for(const item of template.originals)item.read_original=true;
  for(const group of ['facts','findings','prose'])for(const item of template[group]){item.verdict='supported';item.note='Synthetic fixture checked against the exact captured context.';}
  template.assessment={coverage:'accurate',usefulness:'adequate',note:'Synthetic validation fixture; no live research performed.'};
  await writeFile(join(f.root,'review.json'),JSON.stringify(template));
  for(const author of ['investigator-first','investigator-second','synthesis-author'])await assert.rejects(runSynthesisCli(['review','--project',f.root,'--file','review.json','--worker',author]),/independent/);
  const reviewed=await runSynthesisCli(['review','--project',f.root,'--file','review.json','--worker','independent-reviewer']);assert.equal(reviewed.status,'complete');
  assert.equal((await f.call('status')).phase,'ready-for-review');
});
test('only registered invocation labels and exact author attribution are accepted',async t=>{
  const f=await fixture(t),src=f.source('first');await f.register('first');await f.capture('first',src);
  await assert.rejects(f.call('accept',f.packet('first',src,{investigator:'invented'})),/Unregistered/);
  const wrong=f.packet('first',src);wrong.facts[0].author='synthesis-author';await assert.rejects(f.call('accept',wrong),/registered investigator/);
  const state=await f.call('status');assert.equal(state.workstreams[0].status,'running');
  await assert.rejects(f.call('register',{workstream:'second',investigator:'another-name',invocation:'host/context/investigator-first'}),/distinct registered context/);
});
test('packet permission or origin changes and unreceipted captures cannot become evidence',async t=>{
  const f=await fixture(t),src=f.source('first');await f.register('first');await f.capture('first',src);
  const p=f.packet('first',src);p.sources[0].origin='https://other.test/new';await assert.rejects(f.call('accept',p),/matching host capture receipt/);
  p.sources[0].origin='https://example.test/first';p.sources[0].permission='selected';await assert.rejects(f.call('accept',p),/source_mode/);
  p.sources[0].permission='public';p.sources[0].id='unrecorded';p.facts[0].citations[0].source='unrecorded';await assert.rejects(f.call('accept',p),/matching host capture receipt/);
});
test('selected sources require supplied membership and matching original bytes; public domain restriction is enforced',async t=>{
  const f=await fixture(t,{source_mode:'selected',supplied_sources:[{origin:'https://example.test/selected',sha256:hash('Original selected bytes')}]}),src=f.source('first','10',{permission:'selected',origin:'https://example.test/not-supplied'});
  await f.register('first');await writeFile(join(f.root,src.file),'The default is 10.');
  await assert.rejects(f.call('capture',{workstream:'first',investigator:'investigator-first',source:src}),/not supplied/);
  src.origin='https://example.test/selected';await assert.rejects(f.call('capture',{workstream:'first',investigator:'investigator-first',source:src}),/original hash/);
  await writeFile(join(f.root,'original.pdf'),'Original selected bytes');src.original_file='original.pdf';
  await f.call('capture',{workstream:'first',investigator:'investigator-first',source:src});await f.call('accept',f.packet('first',src));
  const g=await fixture(t,{allowed_domains:['allowed.test']});await g.register('first');await writeFile(join(g.root,'first.txt'),'The default is 10.');
  await assert.rejects(g.call('capture',{workstream:'first',investigator:'investigator-first',source:g.source('first')}),/outside allowed domains/);
});
test('unchanged URL does not merge distinct selected/public evidence or conflicting captures',async t=>{
  const f=await fixture(t,{source_mode:'mixed',supplied_sources:[{origin:'https://example.test/shared'}]});
  const selected=f.source('first','10',{origin:'https://example.test/shared',permission:'selected'}),pub=f.source('second','20',{origin:'https://example.test/shared'});
  await f.register('first');await f.capture('first',selected);await f.call('accept',f.packet('first',selected));
  await f.register('second');await f.capture('second',pub);await f.call('accept',f.packet('second',pub));
  const registry=await f.call('assemble');assert.equal(registry.sources.length,2);assert.deepEqual(registry.sources.map(s=>s.permission),['selected','public']);assert.notEqual(registry.facts[0].citations[0].quote,registry.facts[1].citations[0].quote);
});
test('quote mismatch, source mutations and changed immutable snapshots refuse acceptance/reuse',async t=>{
  const f=await fixture(t),src=f.source('first');await f.register('first');const receipt=await f.capture('first',src);const p=f.packet('first',src);
  p.facts[0].citations[0].quote='The default is fabricated.';await assert.rejects(f.call('accept',p),/Exact quote not found/);
  p.facts[0].citations[0].quote='The default is 10.';await f.call('accept',p);await f.complete('second');const registry=await f.call('assemble');
  await writeFile(join(f.root,receipt.receipt.snapshot),'Altered checkpoint');await assert.rejects(verifyCollectionDossier(f.root,dossier(registry),'writer'),/captured bytes changed/);
});
test('capture paths remain confined and credential-bearing origins are rejected',async t=>{
  const f=await fixture(t);await f.register('first');await writeFile(join(f.root,'first.txt'),'The default is 10.');
  for(const file of ['../escape.txt','.harness-research/collection.json'])await assert.rejects(f.call('capture',{workstream:'first',investigator:'investigator-first',source:f.source('first','10',{file})}),/traversal|managed/);
  const elsewhere=await mkdtemp(join(tmpdir(),'elsewhere-'));t.after(()=>rm(elsewhere,{recursive:true,force:true}));await writeFile(join(elsewhere,'outside.txt'),'The default is 10.');await symlink(join(elsewhere,'outside.txt'),join(f.root,'link.txt'));
  await assert.rejects(f.call('capture',{workstream:'first',investigator:'investigator-first',source:f.source('first','10',{file:'link.txt'})}),/regular project files/);
  await assert.rejects(f.call('capture',{workstream:'first',investigator:'investigator-first',source:f.source('first','10',{origin:'https://user:secret@example.test/first'})}),/without credentials/);
});
test('bounded registration respects parallel and sequential capacity without launching processes',async t=>{
  const workstreams=['first','second','third','fourth'].map(id=>({id,questions:['A bounded assignment']}));const f=await fixture(t,{workstreams,max_investigators:3});
  await f.register('first');await f.register('second');await f.register('third');await assert.rejects(f.register('fourth'),/capacity/);
  const src=f.source('first');await f.capture('first',src);await f.call('accept',f.packet('first',src));await f.register('fourth');
  const g=await fixture(t,{execution_mode:'sequential'});await g.register('first');await assert.rejects(g.register('second'),/capacity/);assert.equal((await g.call('status')).max_investigators,1);
});
test('pause checkpoints in-flight work but refuses new dispatch, and stop refuses late results',async t=>{
  const f=await fixture(t),src=f.source('first');await f.register('first');await f.capture('first',src);await f.call('pause');await assert.rejects(f.register('second'),/not dispatching/);await f.call('accept',f.packet('first',src));await f.call('resume');await f.register('second');const next=f.source('second');await f.capture('second',next);await f.call('stop');
  await assert.rejects(f.call('accept',f.packet('second',next)),/stopped/);await assert.rejects(f.call('resume'),/Only a paused/);await assert.rejects(f.call('assemble'),/Stopped/);
  assert.equal((await f.call('status')).workstreams[1].status,'cancelled');
});
test('retry requires a fresh invocation and blocks the old attempt and registry',async t=>{
  const f=await fixture(t);const old=await f.complete('first');await f.complete('second');const registry=await f.call('assemble');await f.call('retry',{workstream:'first',reason:'Need stronger source context.'});
  await assert.rejects(verifyCollectionDossier(f.root,dossier(registry),'writer'),/assembled registry/);await assert.rejects(f.call('accept',old),/Unregistered|stale/);
  await assert.rejects(f.register('first'),/distinct registered context/);
  const result=await f.call('register',{workstream:'first',investigator:'fresh-investigator',invocation:'host/fresh-context',attempt:2});assert.equal(result.registration.number,2);
});
test('explicit invalidation changes generation and scope fingerprint without adopting old packets',async t=>{
  const f=await fixture(t),old=await f.complete('first');const changed=await f.call('invalidate',{...f.request,scope:'Only the first case',workstreams:[f.request.workstreams[0]]});assert.equal(changed.generation,2);assert.notEqual(changed.request_digest,f.started.request_digest);
  await assert.rejects(f.call('accept',old),/stale request or generation/);await assert.rejects(f.call('assemble'),/no accepted/);
});
test('duplicate acceptance is idempotent and concurrent packet arrivals cannot lose state',async t=>{
  const f=await fixture(t);const a=f.source('first'),b=f.source('second');await f.register('first');await f.capture('first',a);await f.register('second');await f.capture('second',b);
  await Promise.all([f.call('accept',f.packet('first',a)),f.call('accept',f.packet('second',b))]);
  const registry=await f.call('assemble');const duplicate=await f.call('accept',f.packet('first',a));assert.equal(duplicate.idempotent,true);assert.equal((await f.call('status')).registry_digest,registry.registry_digest);
  const changed=f.packet('first',a);changed.limitations.push('Another limitation');await assert.rejects(f.call('accept',changed),/already accepted different/);
});
test('unaccepted orphan checkpoints do not become evidence on resume and changed packet hashes are refused',async t=>{
  const f=await fixture(t);await f.complete('first');await f.complete('second');const registry=await f.call('assemble');await writeFile(join(f.root,'.harness-research/collection-data/orphan.json'),JSON.stringify({accepted:true}));assert.equal((await f.call('assemble')).registry_digest,registry.registry_digest);
  await writeFile(join(f.root,registry.packets[0].file),'{}');await assert.rejects(verifyCollectionDossier(f.root,dossier(registry),'writer'),/checkpoint hash changed/);
});
test('synthesis cannot relabel facts, add unregistered evidence or change the settled task',async t=>{
  const f=await fixture(t);await f.complete('first');await f.complete('second');const registry=await f.call('assemble');
  for(const modify of [d=>d.facts[0].author='writer',d=>d.facts.push({...d.facts[0],id:'added'}),d=>d.sources[0].origin='https://other.test/',d=>d.scope='A different scope']){const d=dossier(structuredClone(registry));modify(d);await assert.rejects(verifyCollectionDossier(f.root,d,'writer'),/immutable collection registry|differs from/);}
});
test('timing reports interval union independently of accumulated assistant time and leaves costs unknown',async t=>{
  const f=await fixture(t);await f.register('first');await f.register('second');await new Promise(resolve=>setTimeout(resolve,15));const state=await f.call('status');assert.ok(state.timing.assistant_seconds>=state.timing.active_wall_seconds);assert.ok(state.timing.active_wall_seconds>0);assert.equal(state.timing.dollars,null);assert.equal(state.timing.waiting_or_stopped_seconds,null);
});
test('invalid limits, duplicate workstreams and legacy cases cannot initialize collection state',async t=>{
  for(const amend of [{max_investigators:4},{workstreams:[{id:'same',questions:['One']},{id:'same',questions:['Two']}]},{allowed_domains:['https://example.test']}])await assert.rejects(fixture(t,amend),/max_investigators|Duplicate workstream|hostnames/);
  const root=await mkdtemp(join(tmpdir(),'collection-legacy-'));t.after(()=>rm(root,{recursive:true,force:true}));await mkdir(join(root,'.harness-research'));await writeFile(join(root,'.harness-research/research-run.json'),'{}');await writeFile(join(root,'request.json'),'{}');await assert.rejects(runCollectionCli(['init','--project',root,'--file','request.json']),/Legacy research owns/);
});
test('stop requests cancellation without inventing terminal time, and host finish settles it',async t=>{
  const f=await fixture(t);await f.register('first');await f.call('stop');const stopped=await f.call('status');
  assert.equal(stopped.timing.active_wall_seconds,null);assert.equal(stopped.timing.assistant_seconds,null);assert.equal(stopped.timing.unresolved_invocations,1);assert.match(stopped.timing.note,/not confirmed/);
  const finished=await f.call('finish',{workstream:'first',investigator:'investigator-first',attempt:1,outcome:'cancelled',note:'Host confirmed context terminated.'});
  assert.equal(finished.timing.unresolved_invocations,0);assert.equal(typeof finished.timing.active_wall_seconds,'number');
});
test('unconfirmed cancelled contexts still consume capacity and refused contexts release it only through host observation',async t=>{
  const f=await fixture(t,{max_investigators:1});await f.register('first');await f.call('retry',{workstream:'first',reason:'Retry after host interruption.'});
  await assert.rejects(f.call('register',{workstream:'first',investigator:'replacement',invocation:'host/replacement',attempt:2}),/capacity/);
  await f.call('finish',{workstream:'first',investigator:'investigator-first',attempt:1,outcome:'cancelled',note:'Old context actually terminated.'});
  await f.call('register',{workstream:'first',investigator:'replacement',invocation:'host/replacement',attempt:2});
  await f.call('finish',{workstream:'first',investigator:'replacement',attempt:2,outcome:'refused',note:'Provider returned refusal; no evidence.'});
  await f.register('second');assert.equal((await f.call('status')).workstreams[0].status,'refused');
});
test('collection status reports stale input/capture integrity instead of ready when completed evidence changes',async t=>{
  const f=await fixture(t);await f.complete('first');await f.complete('second');await f.call('assemble');await writeFile(join(f.root,'first.txt'),'Changed capture bytes.');
  const result=await f.call('status');assert.equal(result.status,'stale');assert.equal(result.artifact_integrity,'failed');assert.equal(result.phase,'needs-attention');assert.ok(result.problems.length);
});
test('investigator with a zero-fact gap packet is still ineligible to review the final dossier',async t=>{
  const f=await fixture(t);await f.complete('first');await f.register('second');
  const gapPacket=f.packet('second',null,{sources:[],facts:[],gaps:['No source was accessible.']});await f.call('accept',gapPacket);const registry=await f.call('assemble');
  await assert.rejects(verifyCollectionReviewer(f.root,'investigator-second'),/independent context/);await verifyCollectionReviewer(f.root,'independent-reviewer');
  const d=dossier(registry);await writeFile(join(f.root,'dossier.json'),JSON.stringify(d));const saved=await runSynthesisCli(['save','--project',f.root,'--file','dossier.json','--worker','synthesis-author']);
  const review=structuredClone(saved.review_template);for(const source of review.originals)source.read_original=true;for(const group of ['facts','findings','prose'])for(const entry of review[group]){entry.verdict='supported';entry.note='Controlled fixture evidence checked.';}review.assessment={coverage:'accurate',usefulness:'adequate',note:'The second stream has an explicit gap.'};await writeFile(join(f.root,'review.json'),JSON.stringify(review));
  await assert.rejects(runSynthesisCli(['review','--project',f.root,'--file','review.json','--worker','investigator-second']),/independent context/);
});
test('topic intake supplies selected membership/hash automatically and re-intake makes collection stale',async t=>{
  const workspace=await mkdtemp(join(tmpdir(),'asset-collection-'));t.after(()=>rm(workspace,{recursive:true,force:true}));const inputRoot=join(workspace,'inputs');await mkdir(inputRoot);await writeFile(join(inputRoot,'guide.md'),'Original guide. The default is 10. Full surrounding qualifications.');
  const created=await initializeAsset({project:workspace,topic:'A bounded comparison',audience:'Engineers',purpose:'Explain the tradeoffs',directory:inputRoot}),root=created.asset,context=await assetContext(root);let n=0;
  const call=async(action,input)=>{const args=[action,'--project',root];if(input!==undefined){const file=`c-${n++}.json`;await writeFile(join(root,file),JSON.stringify(input));args.push('--file',file);}return runCollectionCli(args);};
  const request={schema:1,...context.request,scope:'The supplied default',workstreams:[{id:'one',questions:['What is the default?']}]};const initial=await call('init',request);const entry=context.inventory.find(e=>e.type==='document');
  await call('register',{workstream:'one',investigator:'reader-one',invocation:'host/actual-one'});
  const source={id:'source-a',origin:entry.origin,title:'Supplied guide',publisher:'Fixture',file:entry.capture_file,original_file:entry.original_file,permission:'selected',context:'full'};
  await call('capture',{workstream:'one',investigator:'reader-one',source});await call('accept',{schema:1,request_digest:initial.request_digest,generation:initial.generation,workstream:'one',attempt:1,investigator:'reader-one',sources:[source],facts:[{id:'fact-a',statement:'The default is 10.',author:'reader-one',citations:[{source:'source-a',quote:'The default is 10.'}]}],limitations:[],gaps:[]});
  const registry=await call('assemble');assert.ok(registry.request.supplied_sources.some(s=>s.origin===entry.origin&&s.sha256===entry.original_sha256));assert.equal(registry.request.input_fingerprint,context.inputFingerprint);
  await verifyCollectionDossier(root,dossier(registry),'writer');
  await writeFile(join(inputRoot,'second.md'),'More input.');await runAssetCli(['intake','--project',root,'--directory',inputRoot]);
  const status=await call('status');assert.equal(status.status,'stale');assert.match(status.problems[0],/fingerprint changed/);await assert.rejects(verifyCollectionDossier(root,dossier(registry),'writer'),/fingerprint changed/);
});
test('host completed terminal observation may precede evidence acceptance without losing truthful timing',async t=>{
  const f=await fixture(t),source=f.source('first');await f.register('first');await f.capture('first',source);const ended=await f.call('finish',{workstream:'first',investigator:'investigator-first',attempt:1,outcome:'completed',note:'Host returned a terminal researcher response.'});assert.equal(ended.workstreams[0].status,'finished');const before=ended.timing.assistant_seconds;
  await f.call('accept',f.packet('first',source));assert.equal((await f.call('status')).timing.assistant_seconds,before);
  await assert.rejects(f.call('finish',{workstream:'first',investigator:'investigator-first',attempt:1,outcome:'failed',note:'Contradicts observed completion.'}),/conflicts/);
});
test('generation invalidation cannot discard running or unconfirmed-cancelled occupancy',async t=>{
  const f=await fixture(t,{max_investigators:1});await f.register('first');await assert.rejects(f.call('invalidate',f.request),/confirm every registered context terminal/);
  await f.call('stop');await assert.rejects(f.call('invalidate',f.request),/cancellation requests alone/);assert.equal((await f.call('status')).generation,1);
  await f.call('finish',{workstream:'first',investigator:'investigator-first',attempt:1,outcome:'cancelled',note:'Host confirmed old invocation terminated.'});
  const changed=await f.call('invalidate',f.request);assert.equal(changed.generation,2);await f.call('register',{workstream:'first',investigator:'new-context',invocation:'host/actual-new'});assert.equal((await f.call('status')).workstreams[0].investigator,'new-context');
});
