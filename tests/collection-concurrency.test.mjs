import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {performance} from 'node:perf_hooks';
import {runCollectionCli} from '../scripts/lib/collection.mjs';
import {runSynthesisCli} from '../scripts/lib/synthesis-cli.mjs';

// Controlled callbacks measure the local contract, not native agents or provider speed.
async function scenario(t, mode) {
  const root=await mkdtemp(join(tmpdir(),'collection-benchmark-'));
  t.after(()=>rm(root,{recursive:true,force:true}));
  let serial=0;
  const call=async(action,input)=>{
    const args=[action,'--project',root];
    if(input!==undefined){const path=`job-${serial++}.json`;await writeFile(join(root,path),JSON.stringify(input));args.push('--file',path);}
    return runCollectionCli(args);
  };
  const ids=['first','second','third'];
  const request={schema:1,topic:'Controlled benchmark',audience:'Maintainers',scope:'Synthetic contexts only',source_mode:'public',execution_mode:mode,max_investigators:3,workstreams:ids.map(id=>({id,questions:['What does this fixture say?']}))};
  const start=await call('init',request), intervals=[];
  let registered=0,release;
  const barrier=new Promise(resolve=>release=resolve);
  const begin=performance.now();
  async function invocation(id) {
    const investigator='fixture-'+id;
    await call('register',{workstream:id,investigator,invocation:`controlled-callback/${mode}/${id}`});
    registered++;
    if(mode==='parallel'){if(registered===ids.length)release();await barrier;}
    const started=performance.now();
    await new Promise(resolve=>setTimeout(resolve,40));
    const ended=performance.now();intervals.push([started,ended]);
    const file=`source-${id}.txt`;await writeFile(join(root,file),`Synthetic source: ${id} supports one writer.`);
    const source={id:'source',title:'Fixture '+id,publisher:'Synthetic fixture',origin:`https://example.invalid/${id}`,file,permission:'public',context:'full'};
    await call('capture',{workstream:id,investigator,source});
    await call('accept',{schema:1,request_digest:start.request_digest,generation:start.generation,workstream:id,attempt:1,investigator,sources:[source],facts:[{id:'fact',statement:`${id} supports one writer in this fixture.`,author:investigator,citations:[{source:'source',quote:`${id} supports one writer.`}]}],limitations:['Synthetic evidence, not product behavior.'],gaps:[]});
  }
  if(mode==='parallel')await Promise.all(ids.map(invocation));else for(const id of ids)await invocation(id);
  const collectionEnd=performance.now();
  if(mode==='parallel')assert.ok(Math.max(...intervals.map(i=>i[0]))<Math.min(...intervals.map(i=>i[1])),'Barrier must demonstrate all three callbacks overlap');
  else {const sorted=intervals.toSorted((a,b)=>a[0]-b[0]);assert.ok(sorted.every((v,i)=>i===0||v[0]>=sorted[i-1][1]));}
  const registry=await call('assemble');
  const dossier={schema:2,topic:registry.request.topic,audience:registry.request.audience,purpose:registry.request.purpose,scope:registry.request.scope,source_mode:registry.request.source_mode,sources:registry.sources,facts:registry.facts,findings:[{id:'finding',title:'Fixture boundary',summary:{text:'All supplied synthetic contexts describe one writer.',kind:'summary',refs:registry.facts.map(f=>f.id)},support:registry.facts.map(f=>f.id),counter:[],implications:[],conditions:[],gaps:[]}],sections:[{id:'answer',title:'Fixture result',blocks:[{text:'Each synthetic context supports one writer; no actual product was measured.',kind:'summary',refs:['finding']}]}]};
  await writeFile(join(root,'dossier.json'),JSON.stringify(dossier));
  const draft=await runSynthesisCli(['save','--project',root,'--file','dossier.json','--worker','scripted-synthesis']);
  const review=draft.review_template;review.originals.forEach(r=>r.read_original=true);
  for(const group of ['facts','findings','prose'])review[group].forEach(r=>Object.assign(r,{verdict:'supported',note:'Deterministic fixture check, not semantic live acceptance.'}));
  review.assessment={coverage:'accurate',usefulness:'adequate',note:'Scripted benchmark fixture only.'};
  await writeFile(join(root,'review.json'),JSON.stringify(review));
  const checked=await runSynthesisCli(['review','--project',root,'--file','review.json','--worker','scripted-checker']);assert.equal(checked.status,'complete');
  const finished=performance.now(),status=await call('status');
  return {collection_ms:collectionEnd-begin,synthesis_review_ms:finished-collectionEnd,end_to_end_ms:finished-begin,active_wall_seconds:status.timing.active_wall_seconds,assistant_seconds:status.timing.assistant_seconds,max_investigators:start.max_investigators,tokens:null,dollars:null,failures:0,retries:0,callbacks_overlap:mode==='parallel'};
}
test('matched controlled callbacks overlap within the collection limit and retain full synthesis/review overhead',async t=>{
  const serial=await scenario(t,'sequential'),parallel=await scenario(t,'parallel');
  assert.equal(serial.max_investigators,1);assert.equal(parallel.max_investigators,3);
  assert.ok(parallel.assistant_seconds>=parallel.active_wall_seconds);
  const record={scope:'Synthetic callback benchmark; not native harness or provider performance',workstreams:3,simulated_work_ms_per_stream:40,serial,parallel};
  if(process.env.HARNESS_RESEARCH_BENCHMARK_OUT)await writeFile(process.env.HARNESS_RESEARCH_BENCHMARK_OUT,JSON.stringify(record,null,2)+'\n');
});
