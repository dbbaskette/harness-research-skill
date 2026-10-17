import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, mkdir, symlink, rm, readdir, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runSynthesisCli } from '../scripts/lib/synthesis-cli.mjs';

async function fixture(t) {
  const project = await mkdtemp(join(tmpdir(), 'synthesis-test-')); t.after(() => rm(project, { recursive:true, force:true }));
  await writeFile(join(project, 'source.txt'), 'Complete context. The default is 10. Exceptions depend on workload.');
  const dossier = { schema:2, topic:'A comparison', audience:'Operators', purpose:'Choose a safe migration', scope:'Documented behavior only', source_mode:'public', sources:[{id:'source-a',file:'source.txt',origin:'https://example.com/docs',title:'Primary docs',publisher:'Publisher',permission:'public',context:'full',version:'1'}],facts:[{id:'fact-a',statement:'The default is 10.',author:'researcher',citations:[{source:'source-a',quote:'The default is 10.'}]}],findings:[{id:'finding-a',title:'A conditional choice',summary:{text:'The default is 10.',refs:['fact-a'],kind:'summary'},support:['fact-a'],counter:[],implications:[{text:'Evaluate the default in your workload.',refs:['fact-a'],kind:'recommendation'}],conditions:[],gaps:[]}],sections:[{id:'decision',title:'Decision',blocks:[{text:'The default is 10.',refs:['finding-a'],kind:'summary'}]}],comparisons:[{title:'Default comparison',subjects:['A','B'],rows:[{criterion:'Default',cells:[{subject:'B',text:'10',refs:['fact-a']},{subject:'A',text:'10',refs:['fact-a']}]}]}] };
  const save = async (d = dossier) => { await writeFile(join(project, 'dossier.json'),JSON.stringify(d)); return runSynthesisCli(['save','--project',project,'--file','dossier.json','--worker','writer']); };
  const review = async (status, worker = 'checker', change = () => {}) => { const r = structuredClone(status.review_template); for (const s of r.originals) s.read_original = true; for (const group of ['facts','findings','prose']) for (const entry of r[group]) { entry.verdict='supported'; entry.note='Read original and checked context, qualification and support.'; } r.assessment = {coverage:'accurate',usefulness:'adequate',note:'Scope is explicit and the recommendation is qualified.'}; change(r); await writeFile(join(project,'review.json'),JSON.stringify(r)); return runSynthesisCli(['review','--project',project,'--file','review.json','--worker',worker]); };
  return {project,dossier,save,review,status:() => runSynthesisCli(['status','--project',project])};
}
test('draft -> independent checked report; hashes and criterion-aligned output; derived repair',async t=>{
  const f = await fixture(t), draft = await f.save(); assert.equal(draft.status,'draft'); assert.equal(draft.review_template.prose.length,3);
  assert.match(await readFile(join(f.project,'research/report.md'),'utf8'),/Draft/);
  const complete = await f.review(draft); assert.equal(complete.status,'complete');
  const facts = JSON.parse(await readFile(join(f.project,'research/facts.json'),'utf8')); assert.equal(facts.schema,2); assert.equal(facts.sources[0].version,'1');
  await writeFile(join(f.project,'research/report.md'),'damaged derived output'); const repaired = await f.status(); assert.equal(repaired.artifact_integrity,'repaired'); assert.ok(repaired.regenerated_files.includes('research/report.md')); assert.equal((await f.status()).artifact_integrity,'verified'); assert.match(await readFile(join(f.project,'research/report.md'),'utf8'),/Reviewed synthesis/);
  const manifest = JSON.parse(await readFile(join(f.project,'research/output.json'),'utf8')); assert.equal(manifest.artifacts.length,5); assert.ok(manifest.artifacts.some(a=>a.file.startsWith('sources/revisions/')));
});
test('reusable brief carries readable evidence, authored counterargument, qualifications and purpose',async t=>{
  const f=await fixture(t);
  f.dossier.purpose='Prepare operator training with illustrative examples.';
  f.dossier.facts.push({id:'fact-b',statement:'Exceptions depend on workload.',author:'researcher',citations:[{source:'source-a',quote:'Exceptions depend on workload.'}]});
  Object.assign(f.dossier.findings[0],{
    summary:{text:'Treat the documented default as a starting point.',kind:'inference',refs:['fact-a','fact-b']},
    counter:['fact-b'],
    conditions:[{text:'Workload exceptions limit any recommendation to keep the default.',kind:'inference',refs:['fact-b']},{text:'Illustrative example: compare the default with an exception before choosing; this is not a measured result.',kind:'inference',refs:['fact-a','fact-b']}],
    gaps:[{text:'The intended workload has not been measured.',kind:'gap',refs:[]}]
  });
  const draft=await f.save(); await f.review(draft);
  const brief=await readFile(join(f.project,'research/brief.md'),'utf8');
  assert.ok(brief.includes(f.dossier.purpose));
  for (const fact of f.dossier.facts) assert.ok(brief.includes(`- ${fact.statement} ([${fact.id}](evidence.md#${fact.id}))`),`Readable linked evidence for ${fact.id}`);
  for (const block of [...f.dossier.findings[0].conditions,...f.dossier.findings[0].implications,...f.dossier.findings[0].gaps]) {
    assert.ok(brief.includes(block.text), 'Preserve authored meaning, qualifications and examples');
    for (const ref of block.refs) assert.ok(brief.includes(`[${ref}](evidence.md#${ref})`));
  }
  assert.ok(brief.includes('Illustrative example:'),'Preserve authored qualification without procedural prefixes');
  assert.ok(!brief.includes('**Interpretation:**'));
  const facts=JSON.parse(await readFile(join(f.project,'research/facts.json'),'utf8'));
  assert.deepEqual(facts.findings,f.dossier.findings);
  f.dossier.purpose='Prepare a migration decision instead of training.';
  const revised=await f.save(); assert.equal(revised.status,'draft'); assert.notEqual(revised.digest,draft.digest);
  await assert.rejects(f.review(draft),/stale/);
  for (const name of ['report.md','brief.md','facts.json']) assert.ok((await readFile(join(f.project,'research',name),'utf8')).includes(f.dossier.purpose));
});
test('reject unsupported references and source quotes before state persists',async t=>{
  const f=await fixture(t); f.dossier.sections[0].blocks[0].refs=['unknown']; await assert.rejects(f.save(),/unknown references/);
  f.dossier.sections[0].blocks[0].refs=['fact-a']; f.dossier.facts[0].citations[0].quote='Invented'; await assert.rejects(f.save(),/Exact quote not found/);
  await assert.rejects(readFile(join(f.project,'.harness-research/synthesis.json')),/ENOENT/);
});
test('review requires independent identity, full original reads, semantic checks and current digest',async t=>{
  const f=await fixture(t), draft=await f.save();
  for (const worker of ['writer','researcher']) await assert.rejects(f.review(draft,worker),/independent worker/);
  await assert.rejects(f.review(draft,'checker',r=>r.originals[0].read_original=false),/access_error/);
  await assert.rejects(f.review(draft,'checker',r=>r.prose.pop()),/cover each prose/);
  await assert.rejects(f.review(draft,'checker',r=>r.digest='old'),/stale/);
  const narrowed=await f.review(draft,'checker',r=>r.findings[0].verdict='narrow'); assert.equal(narrowed.status,'needs-revision');
  const saved=await f.save(); assert.equal(saved.status,'draft');
});
test('changed working sources and immutable captures invalidate completed reports',async t=>{
  const f=await fixture(t), draft=await f.save(); await f.review(draft);
  await writeFile(join(f.project,'source.txt'),'Changed source'); assert.equal((await f.status()).status,'stale');
  await assert.rejects(f.review(draft),/Evidence is stale/);
  await writeFile(join(f.project,'source.txt'),'Complete context. The default is 10. Exceptions depend on workload.');
  await writeFile(join(f.project,draft.sources[0].snapshot),'Tampered snapshot'); assert.equal((await f.status()).status,'stale'); await assert.rejects(f.save(),/immutable snapshot/);
});
test('source permissions, partial context and comparison alignment are explicit',async t=>{
  const f=await fixture(t); f.dossier.sources[0].permission='selected'; await assert.rejects(f.save(),/outside source_mode/);
  f.dossier.sources[0].permission='public'; f.dossier.sources[0].context='partial'; await assert.rejects(f.save(),/context_note/);
  f.dossier.sources[0].context_note='Only an identified excerpt is available.'; await f.save(); assert.match(await readFile(join(f.project,'research/report.md'),'utf8'),/partial capture/);
  f.dossier.comparisons[0].rows[0].cells[1].subject='B'; await assert.rejects(f.save(),/one cell per named subject/);
});
test('protect unowned outputs, legacy runs, traversal and symlink destinations',async t=>{
  const f=await fixture(t); f.dossier.sources[0].file='../outside.txt'; await assert.rejects(f.save(),/traversal/); f.dossier.sources[0].file='source.txt';
  await mkdir(join(f.project,'research')); await writeFile(join(f.project,'research/report.md'),'User file'); await assert.rejects(f.save(),/unowned/); assert.equal(await readFile(join(f.project,'research/report.md'),'utf8'),'User file');
  await rm(join(f.project,'research/report.md')); await f.save(); await rm(join(f.project,'research/brief.md')); await symlink(join(f.project,'source.txt'),join(f.project,'research/brief.md')); await assert.rejects(f.status(),/nonregular/);
  await writeFile(join(f.project,'.harness-research/research-run.json'),'{}'); await assert.rejects(f.status(),/legacy research engine/);
});
test('authored markdown and HTML cannot inject links, tables or HTML',async t=>{
  const f=await fixture(t); f.dossier.sections[0].blocks[0].text='<script>alert(1)</script> [click](javascript:evil)\n| rogue |'; await f.save(); const report=await readFile(join(f.project,'research/report.md'),'utf8'); assert.ok(!report.includes('<script>')); assert.ok(!report.includes('[click]')); assert.ok(report.includes('\\| rogue \\|'));
});
test('forged accepted/worker fields cannot override semantic rejection or reviewer identity',async t=>{
  const f=await fixture(t), draft=await f.save(); const result=await f.review(draft,'checker',r=>{ r.accepted=true; r.worker='writer'; r.facts[0].verdict='unsupported'; }); assert.equal(result.status,'needs-revision'); assert.equal(result.reviewer,'checker');
});
test('minimal scope draft has no manufactured evidence and cannot retain review after save',async t=>{
  const f=await fixture(t); Object.assign(f.dossier,{sources:[],facts:[],findings:[],comparisons:[],sections:[{id:'scope',title:'Scope',blocks:[{text:'Research is pending.',kind:'gap',refs:[]}]}]}); const result=await f.save(); assert.equal(result.status,'draft'); assert.equal(result.sources.length,0); assert.equal((await f.review(result)).status,'needs-revision');
});

test('inaccessible originals persist an honest failed review and locator survives export',async t=>{
  const f=await fixture(t); f.dossier.facts[0].citations[0].locator='Default section'; const draft=await f.save(); const checked=await f.review(draft,'checker',r=>{r.originals[0].read_original=false;r.originals[0].access_error='Original source capture could not be opened.';}); assert.equal(checked.status,'needs-revision'); const evidence=await readFile(join(f.project,'research/evidence.md'),'utf8'); assert.match(evidence,/original unavailable/); assert.match(evidence,/Default section/);
});

test('portable research folder retains exact snapshots and old reviewed revisions are preserved',async t=>{
  const f=await fixture(t), draft=await f.save(); await f.review(draft);
  assert.match(draft.sources[0].snapshot,/^research\/sources\/revisions\/[a-f0-9]{64}\.txt$/);
  const exported=await mkdtemp(join(tmpdir(),'synthesis-export-')); t.after(()=>rm(exported,{recursive:true,force:true})); await cp(join(f.project,'research'),join(exported,'research'),{recursive:true});
  const facts=JSON.parse(await readFile(join(exported,'research/facts.json'),'utf8')); assert.match(await readFile(join(exported,facts.sources[0].snapshot),'utf8'),/Complete context/);
  const evidence=await readFile(join(exported,'research/evidence.md'),'utf8'); assert.match(evidence,/\(sources\/revisions\//); assert.ok(!evidence.includes('../.harness-research'));
  f.dossier.topic='Revised topic'; await f.save(); const names=await readdir(join(f.project,'.harness-research/synthesis-history')); const states=await Promise.all(names.map(n=>readFile(join(f.project,'.harness-research/synthesis-history',n),'utf8').then(JSON.parse))); assert.ok(states.some(s=>s.review?.accepted && s.digest===draft.digest));
});
test('portable snapshot directories cannot redirect writes through symlinks',async t=>{
  const f=await fixture(t); await mkdir(join(f.project,'research')); await symlink(f.project,join(f.project,'research/sources')); await assert.rejects(f.save(),/real directory/);
});

test('repeated verify never calls missing or modified portable source artifacts verified',async t=>{
  const f=await fixture(t), draft=await f.save(); await f.review(draft); await rm(join(f.project,draft.sources[0].snapshot));
  for (let i=0;i<2;i++) { const checked=await runSynthesisCli(['verify','--project',f.project]); assert.equal(checked.status,'stale'); assert.equal(checked.artifact_integrity,'failed'); assert.match(checked.artifact_problems[0],/unavailable/); }
  await writeFile(join(f.project,draft.sources[0].snapshot),'Changed snapshot'); const changed=await f.status(); assert.equal(changed.artifact_integrity,'failed'); assert.match(changed.artifact_problems[0],/content changed/);
});

test('selected binary originals are explicitly pinned, portable, reviewed, and tracked separately from extraction',async t=>{
  const f=await fixture(t); Object.assign(f.dossier,{source_mode:'selected'}); Object.assign(f.dossier.sources[0],{permission:'selected',origin:'original.pdf'});
  const original=Buffer.from('%PDF-1.7\nOriginal bytes\x00binary'); await writeFile(join(f.project,'original.pdf'),original);
  await assert.rejects(f.save(),/requires original_file/);
  f.dossier.sources[0].original_file='original.pdf'; const draft=await f.save(); assert.match(draft.sources[0].original_snapshot,/\.pdf$/); assert.deepEqual(await readFile(join(f.project,draft.sources[0].original_snapshot)),original); assert.ok(draft.review_template.originals[0].original_sha256);
  await assert.rejects(f.review(draft,'checker',r=>delete r.originals[0].original_sha256),/attest/);
  assert.equal((await f.review(draft)).status,'complete');
  const manifest=JSON.parse(await readFile(join(f.project,'research/output.json'),'utf8')); assert.ok(manifest.artifacts.some(a=>a.file.endsWith('.pdf')));
  await writeFile(join(f.project,'original.pdf'),Buffer.from('%PDF-1.7\nChanged original')); const stale=await f.status(); assert.equal(stale.status,'stale'); assert.ok(stale.problems.some(p=>p.includes('working original changed')));
  await f.save(); const changed=await f.status(); assert.notEqual(changed.digest,draft.digest); assert.equal(changed.status,'draft');
  await rm(join(f.project,changed.sources[0].original_snapshot)); const damaged=await f.status(); assert.equal(damaged.status,'stale'); assert.equal(damaged.artifact_integrity,'failed');
});

test('original_file rejects traversal and symlinks while file URI origin requires the real local original',async t=>{
  const f=await fixture(t); f.dossier.source_mode='selected'; Object.assign(f.dossier.sources[0],{permission:'selected',origin:'Selected document',original_file:'../outside.pdf'}); await assert.rejects(f.save(),/traversal/);
  await symlink(join(f.project,'source.txt'),join(f.project,'original.txt')); f.dossier.sources[0].original_file='original.txt'; await assert.rejects(f.save(),/regular project files/);
  await rm(join(f.project,'original.txt')); await writeFile(join(f.project,'original.txt'),'An original'); f.dossier.sources[0].origin=new URL(`file://${join(f.project,'original.txt')}`).href; delete f.dossier.sources[0].original_file; await assert.rejects(f.save(),/requires original_file/);
});

test('synthesis waits on the shared research lock used by legacy mutations',async t=>{
  const f=await fixture(t); await mkdir(join(f.project,'.harness-research')); await writeFile(join(f.project,'.harness-research/research.lock'),String(process.pid)); const before=process.env.HARNESS_RESEARCH_LOCK_WAIT_MS; process.env.HARNESS_RESEARCH_LOCK_WAIT_MS='10';
  try { await assert.rejects(f.save(),/Research storage is busy/); } finally { if (before===undefined) delete process.env.HARNESS_RESEARCH_LOCK_WAIT_MS; else process.env.HARNESS_RESEARCH_LOCK_WAIT_MS=before; }
  await assert.rejects(readFile(join(f.project,'.harness-research/synthesis.json')),/ENOENT/);
});


test('authored brief preserves priority, all sections, fact/finding refs and typed audit without procedural reader labels',async t=>{
  const f=await fixture(t);
  f.dossier.brief=[
    {id:'decision',title:'Lead with the consequence',blocks:[{text:'For this workload, evaluate the default before committing.',kind:'recommendation',refs:['finding-a','fact-a']}]},
    {id:'example',title:'Explain through an example',blocks:[{text:'Illustrative example: the default could be a starting point, not a measured outcome.',kind:'inference',refs:['fact-a']}]},
    {id:'qualification',title:'Keep the exception',blocks:[{text:'The intended workload remains unmeasured.',kind:'gap',refs:[]}]},
    {id:'support',title:'Evidence for the author',blocks:[{text:'The default is 10.',kind:'summary',refs:['fact-a']}]}
  ];
  f.dossier.sections[0].blocks.push(...f.dossier.brief.flatMap(s=>s.blocks));
  const draft=await f.save();
  const briefIds=draft.review_template.prose.filter(p=>p.id.startsWith('brief:')).map(p=>p.id);
  assert.deepEqual(briefIds,['brief:decision:0','brief:example:0','brief:qualification:0','brief:support:0']);
  assert.ok(draft.review_template.prose.some(p=>p.id==='decision:0'),'Report and brief section IDs cannot collide');
  assert.equal((await f.review(draft)).status,'complete');
  const brief=await readFile(join(f.project,'research/brief.md'),'utf8');
  let last=-1;
  for (const section of f.dossier.brief) {
    const position=brief.indexOf(`## ${section.title}`); assert.ok(position>last); last=position;
    for (const block of section.blocks) { assert.ok(brief.includes(block.text)); for (const id of block.refs) assert.ok(brief.includes(`[${id}](evidence.md#${id})`)); }
  }
  assert.ok(!brief.includes('## A conditional choice'),'Authored brief replaces automatic finding inventory');
  const report=await readFile(join(f.project,'research/report.md'),'utf8');
  for (const publicText of [brief,report]) assert.doesNotMatch(publicText,/\*\*(Interpretation|Conditional recommendation|Open question|Summary):\*\*|Source hashes/);
  const evidence=await readFile(join(f.project,'research/evidence.md'),'utf8');
  for (const label of ['Interpretation','Conditional recommendation','Open question','Summary']) assert.ok(evidence.includes(`**${label}:**`));
  assert.match(evidence,/Source hashes establish capture integrity/);
  const facts=JSON.parse(await readFile(join(f.project,'research/facts.json'),'utf8'));
  assert.deepEqual(facts.brief,f.dossier.brief); assert.deepEqual(facts.sections,f.dossier.sections);
});

test('authored brief requires complete independent review and unsupported prose prevents completion',async t=>{
  const f=await fixture(t);
  f.dossier.brief=[{id:'lead',title:'Lead',blocks:[{text:'The default is 10.',kind:'summary',refs:['fact-a']}]}];
  const draft=await f.save();
  await assert.rejects(f.review(draft,'checker',r=>r.prose=r.prose.filter(p=>!p.id.startsWith('brief:'))),/cover each prose/);
  await assert.rejects(f.review(draft,'checker',r=>r.prose.find(p=>p.id==='brief:lead:0').id='brief:invented:0'),/Missing review brief:lead:0/);
  assert.equal((await f.review(draft,'checker',r=>r.prose.find(p=>p.id==='brief:lead:0').verdict='unsupported')).status,'needs-revision');
  for (const file of ['report.md','brief.md']) assert.match(await readFile(join(f.project,'research',file),'utf8'),/Needs revision — independent review identified issues/);
  assert.equal((await f.review(draft)).status,'complete');
  f.dossier.brief[0].blocks[0].text='The documented default is 10.';
  const changed=await f.save(); assert.notEqual(changed.digest,draft.digest); assert.equal(changed.status,'draft');
  await assert.rejects(f.review(draft),/stale/);
});

test('brief draft and stale status stay explicit without technical integrity banners',async t=>{
  const f=await fixture(t);
  f.dossier.brief=[{id:'lead',title:'Lead',blocks:[{text:'The default is 10.',kind:'summary',refs:['finding-a']}]}];
  const draft=await f.save();
  for (const file of ['report.md','brief.md']) assert.match(await readFile(join(f.project,'research',file),'utf8'),/Draft — independent review is pending/);
  await f.review(draft); await writeFile(join(f.project,'source.txt'),'Evidence changed');
  assert.equal((await f.status()).status,'stale');
  for (const file of ['report.md','brief.md']) assert.match(await readFile(join(f.project,'research',file),'utf8'),/Stale — evidence has changed or is unavailable/);
});

test('omitted authored brief retains every finding and explicitly exports its absence',async t=>{
  const f=await fixture(t);
  for (let i=1;i<5;i++) f.dossier.findings.push({...structuredClone(f.dossier.findings[0]),id:`finding-${i}`,title:`Additional finding ${i}`});
  await f.save();
  const brief=await readFile(join(f.project,'research/brief.md'),'utf8');
  for (const finding of f.dossier.findings) assert.ok(brief.includes(`## ${finding.title}`));
  assert.equal(JSON.parse(await readFile(join(f.project,'research/facts.json'),'utf8')).brief,null);
});

test('malformed authored briefs fail before writing state',async t=>{
  const f=await fixture(t);
  const section={id:'lead',title:'Lead',blocks:[{text:'The default is 10.',kind:'summary',refs:['fact-a']}]};
  for (const [brief,error] of [
    [null,/brief must be an array/],[{},/brief must be an array/],[[],/at least one section/],
    [[section,section],/Duplicate brief section ID/],
    [[{...section,id:'brief:lead'}],/brief section ID/],
    [[{...section,title:''}],/title/],
    [[{...section,blocks:[]}],/Brief sections need blocks/],
    [[{...section,blocks:[{text:'Unsupported',kind:'summary',refs:['missing']}]}],/unknown references/],
    [[{...section,blocks:[{text:'Source refs are not fact support',kind:'summary',refs:['source-a']}]}],/unknown references/],
    [[{...section,blocks:[{text:'Missing support',kind:'summary',refs:[]}]}],/supporting references/],
    [[{...section,blocks:[{text:'Bad kind',kind:'opinion',refs:['fact-a']}]}],/kind must be/]
  ]) { f.dossier.brief=brief; await assert.rejects(f.save(),error); }
  await assert.rejects(readFile(join(f.project,'.harness-research/synthesis.json')),/ENOENT/);
});

test('authored extras cannot override collision-safe review identities',async t=>{
  const f=await fixture(t);
  f.dossier.sections[0].blocks[0].id='brief:lead:0';
  f.dossier.brief=[{id:'lead',title:'Lead',blocks:[{id:'decision:0',text:'The default is 10.',kind:'summary',refs:['fact-a']}]}];
  f.dossier.comparisons[0].rows[0].cells[0].id='decision:0';
  const draft=await f.save();
  assert.deepEqual(draft.review_template.prose.map(p=>p.id),['decision:0','brief:lead:0','comparison:0:0:0','comparison:0:0:1']);
  assert.equal((await f.review(draft)).status,'complete');
});

test('missing purpose defaults to general topic research and explicit studio tasks remain intact',async t=>{
  const f=await fixture(t);
  delete f.dossier.purpose;
  const initial=await f.save();
  const expected='General-purpose topic research';
  for (const name of ['report.md','brief.md','facts.json']) assert.ok((await readFile(join(f.project,'research',name),'utf8')).includes(expected));
  const stored=JSON.parse(await readFile(join(f.project,'.harness-research/synthesis.json'),'utf8'));
  assert.equal(stored.dossier.purpose,expected);
  for (const value of [null,'','   ',expected]) {
    f.dossier.purpose=value;
    const saved=await f.save(); assert.equal(saved.digest,initial.digest,'Absent purpose and explicit default have the same saved meaning');
  }
  f.dossier.purpose='Support a 20-minute presentation for platform engineers';
  const custom=await f.save(); assert.notEqual(custom.digest,initial.digest);
  const exported=JSON.parse(await readFile(join(f.project,'research/facts.json'),'utf8'));
  assert.equal(exported.purpose,f.dossier.purpose);
  f.dossier.purpose=42; await assert.rejects(f.save(),/purpose/);
});
