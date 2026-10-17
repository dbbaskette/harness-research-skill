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
