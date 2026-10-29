import { readFile, writeFile, mkdir, readdir, lstat, realpath, rename, rm } from 'node:fs/promises';
import { join, resolve, dirname, relative, extname, sep, isAbsolute } from 'node:path';
import { randomUUID } from 'node:crypto';
import { parseArgs } from 'node:util';
import { hash, stable, text, identifier, exists, localFile, readText, atomic, directory, acquireLock, releaseLock, parseJson } from './run-storage.mjs';

export const ASSET_OWNER = 'harness-research-asset';
const SCHEMA = 1;
const DEFAULT_PURPOSE = 'General-purpose topic research';
const MAX_FILES = 200, MAX_BYTES = 64 * 1024 * 1024, MAX_TOTAL = 128 * 1024 * 1024;
const TEXT_EXTENSIONS = new Set(['.txt','.md','.markdown','.html','.htm','.csv','.json','.yaml','.yml','.xml','.toml','.rst','.log']);
const DOCUMENT_EXTENSIONS = new Set(['.pdf','.docx','.pptx','.xlsx','.odt','.rtf']);
const SKIP = new Set(['.git','.harness-research','node_modules','.codex-build','.DS_Store','.claude','.codex','.cursor','.agents','.aws','.ssh','.env']);
const json = value => JSON.stringify(value, null, 2) + '\n';
const now = () => new Date().toISOString();
const markerName = '.harness-research/asset.json';
const inventoryName = 'sources.json';
const within = (root, path) => path === root || path.startsWith(root + sep);
const tags = value => {
  if (!Array.isArray(value) || value.length > 50 || value.some(v => typeof v !== 'string' || !v.trim() || v.length > 100)) throw new Error('Tags must be at most 50 nonempty strings of at most 100 characters.');
  return [...new Set(value.map(v => v.trim()))];
};
const slug = title => title.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g,'').slice(0,64).replace(/-$/,'') || 'topic';
function urlOrigin(value) {
  try {
    const u = new URL(value);
    if (!['https:','http:'].includes(u.protocol)) return { origin: value, valid: false, note: 'Only HTTP(S) URLs are supported.' };
    if (u.username || u.password) { u.username = ''; u.password = ''; return { origin: u.href, valid: false, note: 'URL credentials were rejected and redacted from this inventory.' }; }
    return { origin: value, valid: true };
  } catch { return { origin: value, valid: false, note: 'Malformed URL.' }; }
}
async function regularParents(path) {
  const parts = resolve(path).split(sep).filter(Boolean); let current = sep;
  for (const part of parts) {
    current = join(current, part);
    const info = await exists(current);
    if (!info) continue;
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Asset destination parents must be regular directories without symlinks.');
  }
}
function namedPath(workspace, name) {
  let path = resolve(workspace, name);
  if (process.platform === 'darwin') for (const prefix of ['/tmp','/var','/etc']) {
    if (path === prefix || path.startsWith(prefix + '/')) { path = '/private' + path; break; }
  }
  return path;
}
async function marker(root) {
  const info = await exists(join(root, '.harness-research'));
  if (!info) return null;
  if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Asset state must be a regular directory.');
  if (!await exists(join(root, markerName))) return null;
  const path = await localFile(root, markerName);
  const state = parseJson(await readFile(path,'utf8'));
  if (state.owner !== ASSET_OWNER || state.schema !== SCHEMA || state.layout !== 'topic' || !state.id || !state.request || !state.metadata || !state.intake || !Array.isArray(state.inventory) || !Array.isArray(state.revisions)) throw new Error('Unrecognized topic asset; preserve it.');
  identifier(state.id, 'Asset ID');
  if (state.inputFingerprint !== hash(stable(state.intake))) throw new Error('Asset intake fingerprint changed; preserve and inspect it.');
  return state;
}
async function verifyIntake(root, state) {
  for (const item of state.intake.files || []) {
    if (!item.file) continue;
    const path = await localFile(root, item.file);
    if (hash(await readFile(path)) !== item.sha256) throw new Error('Asset input snapshot changed; re-intake from the source before reuse.');
  }
}
export async function assetContext(project) {
  const root = await realpath(resolve(project)), state = await marker(root);
  if (!state) return null;
  await verifyIntake(root, state);
  return { owner: state.owner, schema: state.schema, id: state.id, root, layout: 'topic', request: structuredClone(state.request), inputFingerprint: state.inputFingerprint, inventory: structuredClone(state.inventory), markerPath: markerName };
}
function topicRecord(state) {
  return { owner: ASSET_OWNER, schema: SCHEMA, id: state.id, ...state.metadata, created_at: state.created_at, updated_at: state.updated_at, current: state.current || null, revisions: state.revisions };
}
async function writeAssetManifest(root,state) {
  const files=new Map(),problems=[];
  const add=async(file,expected,kind)=>{
    if (typeof file!=='string' || file.startsWith('.harness-research/') || !/^[a-f0-9]{64}$/.test(expected||'')) {problems.push('Invalid public asset manifest member.');return;}
    if (files.has(file) && files.get(file).sha256!==expected) {problems.push(`Conflicting hashes for ${file}.`);return;}
    try {
      const actual=hash(await readFile(await localFile(root,file)));
      if (actual!==expected) problems.push(`${file}: content changed.`);
      files.set(file,{file,sha256:expected,kind});
    } catch {problems.push(`${file}: unavailable or unsafe path.`);}
  };
  for (const file of ['topic.json','sources.json']) await add(file,hash(await readFile(await localFile(root,file))),'metadata');
  for (const entry of state.inventory) for (const [key,hashKey,kind] of [['original_file','original_sha256','original'],['capture_file','capture_sha256','capture']]) {
    if (entry[key]) {
      if (!entry[key].startsWith(key==='original_file'?'documents/':'sources/')) {problems.push('Inventory member is outside its permitted asset directory.');continue;}
      await add(entry[key],entry[hashKey],kind);
    }
  }
  const outputPath=join(root,'output.json');
  if (await exists(outputPath)) {
    try {
      const bytes=await readFile(await localFile(root,'output.json')),output=parseJson(bytes.toString('utf8'));
      if (output.owner!=='harness-research-synthesis' || output.schema!==2 || !Array.isArray(output.artifacts)) throw new Error();
      await add('output.json',hash(bytes),'reviewed-bundle');
      for (const entry of output.artifacts) {
        if (!['report.md','brief.md','evidence.md','facts.json'].includes(entry.file) && !entry.file?.startsWith('sources/revisions/')) {problems.push('Reviewed bundle has an unexpected asset path.');continue;}
        await add(entry.file,entry.sha256,'reviewed-bundle');
      }
      if (state.current && (output.digest!==state.current.digest || output.status!==state.current.status)) problems.push('Recorded review state differs from the saved output bundle.');
    } catch {problems.push('Saved output manifest is unavailable or invalid.');}
  } else if (state.current) problems.push('Saved output manifest is unavailable.');
  await atomic(join(root,'asset-manifest.json'),json({owner:ASSET_OWNER,schema:SCHEMA,asset:state.id,recorded_review:{status:state.current?.status||'empty',digest:state.current?.digest||null},integrity:problems.length?'failed':'verified',problems:[...new Set(problems)],artifacts:[...files.values()].sort((a,b)=>a.file.localeCompare(b.file)),note:'Local file integrity only. Recorded review state is separate; verify synthesis before synchronization. Private state and input URL-list snapshots are excluded.'}));
}
async function projections(root, state) {
  await atomic(join(root,'topic.json'), json(topicRecord(state)));
  await atomic(join(root,inventoryName), json({owner:ASSET_OWNER,schema:SCHEMA,asset:state.id,input_fingerprint:state.inputFingerprint,entries:state.inventory}));
  await writeAssetManifest(root,state);
}
async function persist(root, state) {
  await atomic(join(root,markerName),json(state));
  await projections(root,state);
}
async function withAsset(project, action) {
  const root = await realpath(resolve(project));
  const initial = await marker(root);
  if (!initial) throw new Error('No owned topic asset here; initialize a new destination first.');
  const lock = join(root,'.harness-research/research.lock'), held = await acquireLock(lock);
  try {
    const state = await marker(root); await verifyIntake(root,state);
    return await action(root,state);
  } finally { await releaseLock(lock,held); }
}
async function immutable(root, name, bytes) {
  const parent = dirname(join(root,name)); await directory(parent);
  const info = await exists(join(root,name));
  if (info) {
    const path=await localFile(root,name);
    if (hash(await readFile(path)) !== hash(bytes)) throw new Error('Immutable asset input was modified; preserve it.');
  } else await writeFile(join(root,name),bytes,{flag:'wx',mode:0o600});
}
function readable(bytes, extension) {
  if (!TEXT_EXTENSIONS.has(extension) || bytes.length > 8*1024*1024) return null;
  try {
    const value = new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    if (!value.trim() || value.includes('\0') || value.startsWith('%PDF-') || bytes.subarray(0,4).equals(Buffer.from('PK\x03\x04'))) return null;
    return value;
  } catch { return null; }
}
async function intakeSnapshot(workspace, destination, options) {
  const entries=[], payloads=new Map(), fingerprint=[], files=[];
  let bytesTotal=0, count=0, sourceRoot=null, urlFile=null;
  const addBytes = (file, bytes) => { payloads.set(file,bytes); files.push({file,sha256:hash(bytes)}); };
  const addEntry = entry => { if (++count > MAX_FILES) throw new Error(`Intake exceeds ${MAX_FILES} entries; choose a smaller source directory/list.`); entries.push(entry); };
  if (options.directory) {
    const requested=namedPath(workspace,options.directory), info=await lstat(requested);
    if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Source directory must be a regular directory, not a symlink.');
    sourceRoot=await realpath(requested);
    if (within(sourceRoot,destination) || within(destination,sourceRoot)) throw new Error('Source directory and asset destination overlap; use separate input and output folders.');
  }
  if (options.urls) urlFile=namedPath(workspace,options.urls);
  else if (sourceRoot && await exists(join(sourceRoot,'urls.txt'))) urlFile=join(sourceRoot,'urls.txt');
  if (urlFile && within(destination,urlFile)) throw new Error('URL list cannot be inside the asset output.');
  if (sourceRoot) {
    async function visit(folder,depth=0) {
      if (depth > 12) throw new Error('Source directory nesting exceeds 12 levels.');
      const listing=await readdir(folder,{withFileTypes:true});
      for (const item of listing.sort((a,b)=>a.name.localeCompare(b.name))) {
        if (SKIP.has(item.name) || item.name.startsWith('.env.')) continue;
        const path=join(folder,item.name), local=relative(sourceRoot,path).split(sep).join('/');
        if (path === urlFile) continue;
        const id='input-'+hash('document\0'+local).slice(0,32), base={id,role:'supplied',type:'document',origin:path,filename:local,permission:'selected'};
        const info=await lstat(path);
        if (info.isSymbolicLink()) { addEntry({...base,outcome:'rejected',note:'Symlink input was not followed.'}); fingerprint.push({path:local,kind:'symlink'}); continue; }
        if (info.isDirectory()) {
          if (await exists(join(path,'.harness-research'))) { addEntry({...base,outcome:'excluded',note:'Owned research output directory was excluded.'}); fingerprint.push({path:local,kind:'research-output'}); continue; }
          await visit(path,depth+1); continue;
        }
        if (!info.isFile()) { addEntry({...base,outcome:'rejected',note:'Input is not a regular file.'}); fingerprint.push({path:local,kind:'nonregular'}); continue; }
        if (info.size > MAX_BYTES) { addEntry({...base,outcome:'unsupported',note:'Input exceeds 64 MiB.'}); fingerprint.push({path:local,size:info.size,outcome:'oversized'}); continue; }
        let bytes;
        try { bytes=await readFile(path); } catch { addEntry({...base,outcome:'unreadable',note:'Original input could not be read.'}); fingerprint.push({path:local,outcome:'unreadable'}); continue; }
        const after=await lstat(path);
        if (after.ino!==info.ino || after.size!==info.size || after.mtimeMs!==info.mtimeMs || after.isSymbolicLink()) throw new Error('Source changed during intake; retry after inputs are stable.');
        bytesTotal+=bytes.length; if (bytesTotal>MAX_TOTAL) throw new Error('Intake exceeds 128 MiB; select fewer inputs.');
        const h=hash(bytes), extension=extname(item.name).toLowerCase(), suffix=/^\.[a-z0-9]{1,10}$/.test(extension)?extension:'.bin';
        const original='documents/'+h+suffix;
        addBytes(original,bytes);
        const body=readable(bytes,extension), capture=body===null?null:'sources/'+h+'.txt';
        if (capture) addBytes(capture,bytes);
        addEntry({...base,original_file:original,original_sha256:h,...(capture?{capture_file:capture,capture_sha256:h}:{}),outcome:capture?'ready':DOCUMENT_EXTENSIONS.has(extension)?'extraction-needed':'unsupported',...(!capture?{note:DOCUMENT_EXTENSIONS.has(extension)?'Original retained; a readable extraction is needed.':'Original retained; this format has no readable capture.'}:{})});
        fingerprint.push({path:local,sha256:h});
      }
    }
    await visit(sourceRoot);
  }
  if (urlFile) {
    const info=await lstat(urlFile);
    if (!info.isFile() || info.isSymbolicLink() || info.size>1024*1024) throw new Error('URL list must be a regular UTF-8 file of at most 1 MiB.');
    const bytes=await readFile(urlFile); let contents;
    try { contents=new TextDecoder('utf-8',{fatal:true}).decode(bytes); } catch { throw new Error('URL list requires UTF-8 text.'); }
    if (contents.includes('\0')) throw new Error('URL list requires plain text.');
    const h=hash(bytes), snapshot='.harness-research/intake/'+h+'.urls.txt';
    addBytes(snapshot,bytes); fingerprint.push({kind:'url-list',sha256:h});
    const lines=contents.replace(/^\uFEFF/,'').split(/\r?\n/);
    for (const [index,line] of lines.entries()) {
      const value=line.trim(); if (!value || value.startsWith('#')) continue;
      const checked=urlOrigin(value);
      addEntry({id:'input-'+hash('url\0'+h+'\0'+index).slice(0,32),role:'supplied',type:'url',origin:checked.origin,permission:'selected',line:index+1,list_file:snapshot,outcome:checked.valid?'pending':'rejected',...(checked.note?{note:checked.note}:{})});
    }
  }
  return {entries,payloads,intake:{files:[...new Map(files.map(f=>[f.file,f])).values()],inventory:fingerprint},sourceRoot,urlFile};
}
function response(root,state) {
  return {owner:ASSET_OWNER,schema:SCHEMA,id:state.id,asset:root,layout:'topic',status:state.current && state.current.inputFingerprint!==state.inputFingerprint?'stale':state.current?.status||'empty',digest:state.current?.digest||null,inputFingerprint:state.inputFingerprint,request:state.request,paths:{topic:'topic.json',sources:inventoryName,report:'report.md',brief:'brief.md',evidence:'evidence.md',bundle:'output.json',asset_manifest:'asset-manifest.json'},counts:{inputs:state.inventory.length,documents:state.inventory.filter(e=>e.type==='document').length,urls:state.inventory.filter(e=>e.type==='url').length},sync:'caller-owned'};
}
export async function initializeAsset(options) {
  const workspace=await realpath(resolve(options.project || '.'));
  const topic=text(options.topic,'Topic',20000), destination=namedPath(workspace,options.destination||join('research',slug(topic)));
  if (destination===workspace) throw new Error('Asset destination must be a new topic directory, not the working directory.');
  await regularParents(dirname(destination));
  if (await exists(destination)) throw new Error('Asset destination already exists; preserve it or choose another destination.');
  const snapshot=await intakeSnapshot(workspace,destination,options);
  const sourceMode=options['source-mode'] || (options.directory||options.urls?'selected':'public');
  if (!['selected','public','mixed'].includes(sourceMode)) throw new Error('source-mode must be selected, public or mixed.');
  if (sourceMode==='public' && snapshot.entries.length) throw new Error('Supplied inputs require selected or mixed source-mode.');
  const created=now(), state={owner:ASSET_OWNER,schema:SCHEMA,id:'topic-'+randomUUID().replaceAll('-',''),layout:'topic',created_at:created,updated_at:created,request:{topic,audience:options.audience?.trim()||'General readers',purpose:options.purpose?.trim()||DEFAULT_PURPOSE,source_mode:sourceMode},metadata:{title:topic,description:'',tags:[]},intake:snapshot.intake,inputFingerprint:hash(stable(snapshot.intake)),inventory:snapshot.entries,revisions:[]};
  // Build off to the side. The destination is claimed only after all input files exist.
  await mkdir(dirname(destination),{recursive:true,mode:0o700}); await regularParents(dirname(destination));
  const stage=destination+'.pending-'+randomUUID(); await mkdir(stage,{mode:0o700});
  try {
    for (const dir of ['.harness-research','.harness-research/intake','documents','sources']) await directory(join(stage,dir));
    for (const [name,bytes] of snapshot.payloads) await immutable(stage,name,bytes);
    await persist(stage,state);
    // mkdir gives exclusive ownership before moving staged children. On failure leave no user files overwritten.
    await mkdir(destination,{mode:0o700});
    try { for (const entry of await readdir(stage)) await rename(join(stage,entry),join(destination,entry)); }
    catch (error) { throw new Error(`Asset initialization interrupted; preserve ${destination} and inspect it. ${error.message}`); }
  } finally { await rm(stage,{recursive:true,force:true}); }
  return response(destination,state);
}
async function sourceUpdate(root,state,input) {
  const updates=Array.isArray(input.entries)?input.entries:[input];
  if (!updates.length || updates.length>MAX_FILES) throw new Error('Source update needs a bounded nonempty list.');
  const changed=structuredClone(state.inventory);
  for (const update of updates) {
    let entry=changed.find(e=>e.id===update.id);
    if (!entry) {
      if (update.role!=='discovered' || !['public','mixed'].includes(state.request.source_mode)) throw new Error('Source update must identify an existing inventory entry; discovered URLs require public research permission.');
      const checked=urlOrigin(update.origin);
      if (!checked.valid || update.permission!=='public') throw new Error('A discovered source requires a credential-free HTTP(S) URL and public permission.');
      const id=update.id||'source-'+hash(update.origin).slice(0,32); identifier(id,'Inventory source ID');
      if (changed.length>=1000) throw new Error('Source inventory exceeds 1000 entries.');
      entry={id,type:'url',role:'discovered',origin:update.origin,permission:'public',outcome:'pending'};
      changed.push(entry);
    }
    const allowed=['pending','captured','inaccessible','excluded','unused','unsupported','extraction-needed'];
    if (!allowed.includes(update.outcome)) throw new Error('Source update has an unsupported outcome.');
    if (entry.outcome==='rejected') throw new Error('Rejected input cannot be promoted by an outcome update; correct and re-intake it.');
    for (const key of ['origin','permission','role','original_file','original_sha256']) if (Object.hasOwn(update,key) && update[key]!==entry[key]) throw new Error('Source update cannot change captured origin, permission or provenance.');
    let capture={};
    if (update.capture_file) {
      if (!update.capture_file.startsWith('sources/')) throw new Error('Readable capture must be under sources/.');
      const value=await readText(root,update.capture_file,{withHash:true});
      if (update.capture_sha256 && update.capture_sha256!==value.sha256) throw new Error('Capture hash does not match captured bytes.');
      capture={capture_file:update.capture_file,capture_sha256:value.sha256};
    }
    if (update.outcome==='captured' && !capture.capture_file && !entry.capture_file) throw new Error('Captured outcome needs actual readable capture bytes.');
    if (update.outcome==='captured') text(update.accessed_at,'Capture accessed_at');
    if (update.note!==undefined) text(update.note,'Source note',4000);
    if (update.evidence_ids!==undefined && (!Array.isArray(update.evidence_ids) || update.evidence_ids.length>200)) throw new Error('evidence_ids must be a bounded array.');
    update.evidence_ids?.forEach(id=>identifier(id,'Evidence source ID'));
    Object.assign(entry,{outcome:update.outcome,...capture,...(update.note?{note:update.note}:{}),...(update.accessed_at?{accessed_at:update.accessed_at}:{}),...(update.evidence_ids?{evidence_ids:update.evidence_ids}:{})});
  }
  state.inventory=changed;
}
export async function verifyAssetDossier(project,dossier) {
  const root=await realpath(resolve(project)),state=await marker(root);
  if (!state) return;
  await verifyIntake(root,state);
  for (const field of ['topic','audience','purpose','source_mode']) {
    const actual=field==='purpose'&&(dossier[field]==null||typeof dossier[field]==='string'&&!dossier[field].trim())?DEFAULT_PURPOSE:dossier[field];
    if (actual!==state.request[field]) throw new Error(`Asset dossier ${field} must preserve the recorded request.`);
  }
  for (const source of dossier.sources||[]) {
    const entries=state.inventory.filter(e=>e.origin===source.origin && e.permission===source.permission && ['ready','captured'].includes(e.outcome));
    if (!entries.length) throw new Error(`Source ${source.id} is not a captured source in this asset's permitted inventory.`);
    const captured=await readText(root,source.file,{withHash:true});
    const matching=entries.find(e=>e.capture_sha256===captured.sha256);
    if (!matching) throw new Error(`Source ${source.id} capture differs from the accepted asset inventory.`);
    if (matching.original_file) {
      if (!source.original_file) throw new Error(`Source ${source.id} must preserve its supplied original_file.`);
      const original=await localFile(root,source.original_file);
      if (hash(await readFile(original))!==matching.original_sha256) throw new Error(`Source ${source.id} original differs from the retained supplied original.`);
    }
  }
}
export async function updateAssetRevision(project,synthesisState,result) {
  const root=await realpath(resolve(project)),state=await marker(root);
  if (!state) return;
  if (!synthesisState?.digest || !result?.status) throw new Error('A saved synthesis digest and actual result status are required.');
  const oldInventory = stable(state.inventory);
  if (synthesisState.dossier) for (const entry of state.inventory) {
    const ids = synthesisState.dossier.sources.filter(source => {
      const pin = synthesisState.sources.find(value => value.id === source.id);
      return source.origin === entry.origin && source.permission === entry.permission && pin?.sha256 === entry.capture_sha256;
    }).map(source => source.id);
    entry.evidence_ids = ids;
    if (ids.length) entry.used_in_digest = synthesisState.digest;
    else delete entry.used_in_digest;
  }
  const revision={digest:synthesisState.digest,status:result.status,inputFingerprint:state.inputFingerprint,author:synthesisState.author,reviewer:synthesisState.review?.worker||null,updated_at:now()};
  const old=state.revisions.findIndex(r=>r.digest===revision.digest);
  if (state.current && ['digest','status','inputFingerprint','author','reviewer'].every(k=>state.current[k]===revision[k])) {if (stable(state.inventory) !== oldInventory) await persist(root,state); else await projections(root,state);return;}
  if (old<0) state.revisions.push(revision); else state.revisions[old]=revision;
  state.current=revision; state.updated_at=revision.updated_at;
  await persist(root,state);
}
const USAGE='asset init --project WORKSPACE --topic TITLE [--destination DIR] [--directory INPUTS] [--urls URLS.txt] [--audience TEXT] [--purpose TEXT] [--source-mode selected|public|mixed] | intake --project ASSET --directory INPUTS [--urls URLS.txt] | metadata|source --project ASSET --file INPUT.json | status --project ASSET. Local files only; sync belongs to the caller.';
export async function runAssetCli(argv) {
  const {values,positionals}=parseArgs({args:argv,allowPositionals:true,options:{project:{type:'string'},topic:{type:'string'},destination:{type:'string'},directory:{type:'string'},urls:{type:'string'},audience:{type:'string'},purpose:{type:'string'},'source-mode':{type:'string'},file:{type:'string'},help:{type:'boolean'},verbose:{type:'boolean'}}});
  const action=positionals[0]||'help';
  if (values.help || action==='help') return {usage:USAGE};
  if (positionals.length!==1 || !['init','intake','metadata','source','status'].includes(action) || !values.project) throw new Error(USAGE);
  const allowed={init:['project','topic','destination','directory','urls','audience','purpose','source-mode','verbose'],intake:['project','directory','urls','verbose'],metadata:['project','file','verbose'],source:['project','file','verbose'],status:['project','verbose']}[action];
  if (Object.keys(values).some(k=>!allowed.includes(k))) throw new Error(USAGE);
  if (action==='init') return initializeAsset(values);
  const result = await withAsset(values.project,async(root,state)=>{
    if (action==='intake') {
      if (!values.directory&&!values.urls) throw new Error('Intake requires --directory or --urls.');
      const snapshot=await intakeSnapshot(root,root,values);
      if (state.request.source_mode==='public' && snapshot.entries.length) throw new Error('Supplied inputs require selected or mixed source-mode.');
      for (const [name,bytes] of snapshot.payloads) await immutable(root,name,bytes);
      const nextFingerprint=hash(stable(snapshot.intake));
      if (nextFingerprint!==state.inputFingerprint) {
        const previous={intake:state.intake,inputFingerprint:state.inputFingerprint,inventory:state.inventory};
        await directory(join(root,'.harness-research/intake-history'));
        await immutable(root,'.harness-research/intake-history/'+hash(stable(previous))+'.json',Buffer.from(json(previous)));
        state.intake=snapshot.intake; state.inputFingerprint=nextFingerprint; state.inventory=snapshot.entries;
      }
    } else if (action==='metadata'||action==='source') {
      if (!values.file) throw new Error('--file is required.');
      const input=parseJson(await readText(root,values.file));
      if (action==='metadata') {
        if (!input || typeof input!=='object' || Array.isArray(input) || Object.keys(input).some(k=>!['title','description','tags'].includes(k))) throw new Error('Metadata may update title, description and tags only.');
        if (input.title!==undefined) state.metadata.title=text(input.title,'Metadata title',20000);
        if (input.description!==undefined && (typeof input.description!=='string' || input.description.length>10000)) throw new Error('Description must be text of at most 10000 characters.');
        if (input.description!==undefined) state.metadata.description=input.description;
        if (input.tags!==undefined) state.metadata.tags=tags(input.tags);
      } else await sourceUpdate(root,state,input);
    }
    if (action!=='status') {state.updated_at=now();await persist(root,state);} else await projections(root,state);
    return {...response(root,state),...(action==='status'?{inventory:state.inventory,metadata:state.metadata,revisions:state.revisions}:{})};
  });
  // The synthesis helper owns current review/integrity status. Invoke it only
  // after releasing this asset operation's shared lock; it updates the projection.
  if (await exists(join(result.asset,'.harness-research/synthesis.json'))) {
    const {runSynthesisCli}=await import('./synthesis-cli.mjs');
    const checked=await runSynthesisCli(['status','--project',result.asset,'--compact']);
    return {...result,status:checked.status,digest:checked.digest,reviewer:checked.reviewer,artifact_integrity:checked.artifact_integrity,problems:checked.problems};
  }
  return result;
}
