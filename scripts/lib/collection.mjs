import { readFile, writeFile, realpath } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { exists, directory, localFile, readText, atomic, hash, stable, parseJson, identifier, text, acquireLock, releaseLock } from './run-storage.mjs';
import { validateDossier, DEFAULT_PURPOSE } from './synthesis-model.mjs';

const OWNER = 'harness-research-collection';
const STATE = '.harness-research/collection.json';
const DATA = '.harness-research/collection-data';
const VERSION = 1;
const HELP = 'collection init|register|capture|accept|finish|retry|invalidate --project CASE --file INPUT.json | assemble|pause|resume|stop|status --project CASE. Local records only: the host launches investigators, registers actual invocations and capture receipts, enforces budgets and cancels workers. Never let model output register its own identity or permissions.';
const json = value => JSON.stringify(value, null, 2) + '\n';
const digest = value => hash(stable(value));
const list = (value, label) => { if (!Array.isArray(value)) throw new Error(`${label} must be an array.`); return value; };
const strings = (value, label) => list(value, label).map((v, i) => text(v, `${label}[${i}]`, 20000));
const same = (a, b) => stable(a) === stable(b);
const boundedInteger = (value, label, min = 1, max = Number.MAX_SAFE_INTEGER) => { if (!Number.isSafeInteger(value) || value < min || value > max) throw new Error(`${label} must be an integer from ${min} to ${max}.`); return value; };
const sha = (value, label) => { if (typeof value !== 'string' || !/^[a-f0-9]{64}$/.test(value)) throw new Error(`${label} must be a SHA-256 digest.`); return value; };
const keys = (value, allowed, label) => { if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${label} must be an object.`); for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(`Unknown ${label} field: ${key}.`); };
const sourceKeys = ['id', 'origin', 'title', 'publisher', 'file', 'permission', 'context', 'context_note', 'source_date', 'accessed_at', 'version', 'original_file'];
function sourceShape(source) { keys(source, sourceKeys, 'source'); identifier(source.id, 'Source ID'); }
function url(value) {
  try { const parsed = new URL(value); if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) throw new Error(); return parsed; }
  catch { throw new Error('Public source origin requires an HTTP(S) URL without credentials.'); }
}
function domain(value) {
  text(value, 'Allowed domain', 253);
  if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(value)) throw new Error('Allowed domains must be hostnames, not URLs or wildcard expressions.');
  return value.toLowerCase();
}
async function asset(root) {
  if (!await exists(join(root, '.harness-research/asset.json'))) return null;
  const { assetContext } = await import('./topic-assets.mjs');
  return assetContext(root);
}
async function outputPrefix(root) { return await asset(root) ? '' : 'research'; }
function validateRequest(input, context) {
  keys(input, ['schema','topic','audience','purpose','scope','source_mode','workstreams','supplied_sources','allowed_domains','max_investigators','execution_mode','input_fingerprint'], 'collection request');
  if (input.schema !== VERSION) throw new Error('Collection request schema must be 1.');
  const request = structuredClone(input);
  for (const field of ['topic','audience','scope']) request[field] = text(request[field], field, 20000);
  request.purpose = request.purpose == null || typeof request.purpose === 'string' && !request.purpose.trim() ? DEFAULT_PURPOSE : text(request.purpose, 'purpose', 20000);
  if (!['public','selected','mixed'].includes(request.source_mode)) throw new Error('Invalid collection source_mode.');
  request.max_investigators = boundedInteger(request.max_investigators ?? 3, 'max_investigators', 1, 3);
  request.execution_mode ??= 'parallel';
  if (!['parallel','sequential'].includes(request.execution_mode)) throw new Error('execution_mode must be parallel or sequential.');
  if (request.execution_mode === 'sequential') request.max_investigators = 1;
  if (!list(request.workstreams, 'workstreams').length || request.workstreams.length > 64) throw new Error('Collection needs 1 to 64 bounded workstreams.');
  const ids = new Set();
  for (const stream of request.workstreams) {
    keys(stream, ['id','questions'], 'workstream'); identifier(stream.id, 'Workstream ID');
    if (ids.has(stream.id)) throw new Error('Duplicate workstream ID.'); ids.add(stream.id);
    stream.questions = strings(stream.questions, 'Workstream questions');
    if (!stream.questions.length || stream.questions.length > 64) throw new Error('Workstream needs 1 to 64 questions.');
  }
  if (request.supplied_sources === undefined && context) {
    request.supplied_sources = context.inventory.filter(entry => entry.role === 'supplied' && entry.outcome !== 'rejected').map(entry => ({ origin: entry.origin, ...(entry.original_file && entry.original_sha256 ? { file: entry.original_file, sha256: entry.original_sha256 } : {}) }));
  }
  request.supplied_sources ??= [];
  for (const source of list(request.supplied_sources, 'supplied_sources')) {
    keys(source, ['origin','file','sha256'], 'supplied source'); text(source.origin, 'Supplied source origin', 20000);
    if (source.file !== undefined) text(source.file, 'Supplied source file');
    if (source.sha256 !== undefined) sha(source.sha256, 'Supplied source sha256');
    if (source.file && !source.sha256) throw new Error('Supplied local files require a hash.');
  }
  request.allowed_domains = [...new Set(list(request.allowed_domains ?? [], 'allowed_domains').map(domain))].sort();
  if (request.input_fingerprint !== undefined) sha(request.input_fingerprint, 'input_fingerprint');
  if (context) {
    for (const field of ['topic','audience','purpose','source_mode']) if (request[field] !== context.request[field]) throw new Error(`Collection ${field} must preserve the asset request.`);
    if (request.input_fingerprint && request.input_fingerprint !== context.inputFingerprint) throw new Error('Collection inputs do not match the asset intake fingerprint.');
    request.input_fingerprint = context.inputFingerprint;
  }
  return request;
}
async function currentInputs(root, state) {
  const context = await asset(root);
  if (state.asset_id && (!context || context.id !== state.asset_id || context.inputFingerprint !== state.request.input_fingerprint)) throw new Error('Collection input fingerprint changed; invalidate collection before reuse.');
  for (const source of state.request.supplied_sources) if (source.file && hash(await readFile(await localFile(root, source.file))) !== source.sha256) throw new Error('Supplied source bytes changed; invalidate collection before reuse.');
}
async function readState(root, required = true) {
  const path = join(root, STATE), info = await exists(path);
  if (!info) { if (!required) return null; throw new Error('No collection initialized.'); }
  const state = parseJson(await readText(root, STATE));
  if (state.owner !== OWNER || state.schema !== VERSION || !Array.isArray(state.workstreams) || !state.request || state.request_digest !== digest(state.request)) throw new Error('Unrecognized or changed collection state; preserve and inspect it.');
  boundedInteger(state.generation, 'Collection generation');
  if (!['active','paused','stopped'].includes(state.status) || state.workstreams.length !== state.request.workstreams.length) throw new Error('Invalid collection state.');
  return state;
}
async function saveState(root, state) { state.updated_at = new Date().toISOString(); await atomic(join(root, STATE), json(state)); }
async function immutable(root, name, bytes) {
  const path = join(root, DATA, name), info = await exists(path);
  if (info) {
    if (!info.isFile() || info.isSymbolicLink() || !(await readFile(path)).equals(Buffer.from(bytes))) throw new Error('Immutable collection checkpoint changed; preserve and inspect it.');
  } else await writeFile(path, bytes, { flag: 'wx', mode: 0o600 });
  return `${DATA}/${name}`;
}
async function checkedJson(root, file, expected) {
  const bytes = await readFile(await localFile(root, file));
  if (hash(bytes) !== expected) throw new Error('Immutable collection checkpoint hash changed.');
  return parseJson(bytes.toString('utf8'));
}
function workstream(state, id) { identifier(id, 'Workstream'); const stream = state.workstreams.find(s => s.id === id); if (!stream) throw new Error('Unknown workstream.'); return stream; }
function activeAttempt(state, input, { accepting = false } = {}) {
  const stream = workstream(state, input.workstream), attempt = stream.attempts.at(-1);
  if (state.status === 'stopped') throw new Error('Collection stopped; late completions are not accepted.');
  if (!attempt || attempt.investigator !== input.investigator || (input.attempt !== undefined && input.attempt !== attempt.number)) throw new Error('Unregistered investigator or stale attempt.');
  if (accepting && !['running','finished','accepted'].includes(attempt.status) || !accepting && !['running','finished'].includes(attempt.status)) throw new Error('Investigation attempt is not active.');
  return { stream, attempt };
}
function sourcePermission(request, source, pin) {
  if (request.source_mode !== 'mixed' && request.source_mode !== source.permission) throw new Error('Source permission falls outside collection source_mode.');
  if (source.permission === 'selected') {
    const supplied = request.supplied_sources.filter(s => s.origin === source.origin);
    if (!supplied.length) throw new Error('Selected source was not supplied in the collection request.');
    if (!supplied.some(s => !s.sha256 || s.sha256 === (pin.original_sha256 ?? pin.sha256))) throw new Error('Selected source does not match the supplied original hash.');
  } else if (source.permission === 'public') {
    const hostname = url(source.origin).hostname.toLowerCase();
    if (request.allowed_domains.length && !request.allowed_domains.some(d => hostname === d || hostname.endsWith('.' + d))) throw new Error('Public source origin is outside allowed domains.');
  } else throw new Error('Invalid source permission.');
}
async function validateEvidence(root, request, sources, facts, investigator) {
  for (const source of list(sources, 'Packet sources')) sourceShape(source);
  for (const fact of list(facts, 'Packet facts')) {
    keys(fact, ['id','statement','author','citations'], 'fact');
    if (fact.author !== investigator) throw new Error('Packet fact author must be the registered investigator.');
    for (const citation of list(fact.citations, 'Fact citations')) keys(citation, ['source','quote','locator'], 'citation');
  }
  const checked = await validateDossier(root, { schema: 2, topic: request.topic, audience: request.audience, purpose: request.purpose, scope: request.scope, source_mode: request.source_mode, sources, facts, findings: [], sections: [{id:'pending', title:'Investigation packet', blocks:[{kind:'gap',text:'Intermediate evidence; synthesis and independent review are pending.',refs:[]}]}] }, investigator, { outputPrefix: await outputPrefix(root) });
  for (const source of sources) sourcePermission(request, source, checked.sources.find(s => s.id === source.id));
  return checked;
}
async function pinReceipt(root, checked, source) {
  const pin = checked.sources.find(s => s.id === source.id), bytes = await readFile(await localFile(root, source.file));
  if (hash(bytes) !== pin.sha256) throw new Error('Capture changed during receipt registration.');
  const snapshot = await immutable(root, `capture-${pin.sha256}.bin`, bytes);
  let original_snapshot;
  if (pin.original_file) {
    const original = await readFile(await localFile(root, pin.original_file));
    if (hash(original) !== pin.original_sha256) throw new Error('Original changed during receipt registration.');
    original_snapshot = await immutable(root, `original-${pin.original_sha256}.bin`, original);
  }
  return { source: structuredClone(source), ...pin, snapshot, ...(original_snapshot ? { original_snapshot } : {}) };
}
async function checkReceipt(root, receipt) {
  for (const [file, expected] of [[receipt.file,receipt.sha256],[receipt.snapshot,receipt.sha256],...(receipt.original_file ? [[receipt.original_file,receipt.original_sha256],[receipt.original_snapshot,receipt.original_sha256]] : [])]) {
    if (hash(await readFile(await localFile(root, file))) !== expected) throw new Error('Collection captured bytes changed; retry affected investigation.');
  }
}
function packetShape(input, state) {
  keys(input, ['schema','request_digest','generation','workstream','attempt','investigator','sources','facts','limitations','gaps'], 'packet');
  if (input.schema !== VERSION || input.request_digest !== state.request_digest || input.generation !== state.generation) throw new Error('Packet belongs to a stale request or generation.');
  identifier(input.investigator, 'Investigator'); boundedInteger(input.attempt, 'Packet attempt');
  strings(input.limitations, 'Packet limitations'); strings(input.gaps, 'Packet gaps');
}
function timing(state, now = Date.now()) {
  const attempts = state.workstreams.flatMap(s => s.attempts);
  const unresolved = attempts.filter(a => a.cancellation_requested_at && !a.ended_at).length;
  const intervals = attempts.filter(a => a.started_at).map(a => [Date.parse(a.started_at), a.ended_at ? Date.parse(a.ended_at) : a.cancellation_requested_at ? Date.parse(a.cancellation_requested_at) : now]).filter(([start,end]) => Number.isFinite(start) && Number.isFinite(end) && end >= start).sort((a,b) => a[0]-b[0]);
  let assistant = 0, active = 0, from = null, until = null;
  for (const [start,end] of intervals) { assistant += end-start; if (from === null) {from=start;until=end;} else if (start <= until) until=Math.max(until,end); else {active+=until-from;from=start;until=end;} }
  if (from !== null) active += until-from;
  return { elapsed_seconds: Math.max(0,(now-Date.parse(state.created_at))/1000), active_wall_seconds: unresolved ? null : active/1000, assistant_seconds: unresolved ? null : assistant/1000, observed_active_wall_seconds: active/1000, observed_assistant_seconds: assistant/1000, unresolved_invocations: unresolved, waiting_or_stopped_seconds: null, dollars: null, note: unresolved ? 'Cancellation requested but terminal context not confirmed. Observed intervals are lower bounds; active/assistant totals are unknown until the host records finish. No process cancellation was performed by the helper.' : 'Intervals run from host registration to returned evidence or host-confirmed terminal context. Costs and process cancellation remain host-owned; unrecorded gaps are not classified as pauses.' };
}
async function status(root, state) {
  const problems=[];
  try { await currentInputs(root,state); if(state.registry) await verifiedRegistry(root,state); } catch(error) { problems.push(error.message); }
  let phase = state.status === 'stopped' ? 'stopped' : state.registry ? 'combining-findings' : 'investigating';
  if (state.final_digest) {
    try { const saved = parseJson(await readText(root, '.harness-research/synthesis.json')); if (saved.digest === state.final_digest) phase = saved.review?.accepted ? 'ready-for-review' : saved.review ? 'needs-revision' : 'independent-check'; } catch { /* No final dossier yet. */ }
  }
  if(problems.length) phase='needs-attention';
  return { schema: VERSION, protocol: state.protocol, request_digest: state.request_digest, generation: state.generation, status: problems.length?'stale':state.status, artifact_integrity:problems.length?'failed':'verified', problems, phase, execution_mode: state.request.execution_mode, max_investigators: state.request.max_investigators, workstreams: state.workstreams.map(s => ({id:s.id, status:s.attempts.at(-1)?.status ?? 'pending', attempt:s.attempts.at(-1)?.number ?? 1, investigator:s.attempts.at(-1)?.investigator ?? null})), ...(state.registry ? {registry_digest:state.registry.digest,registry_file:state.registry.file} : {}), ...(state.final_digest ? {final_digest:state.final_digest} : {}), timing:timing(state), caveat: 'Invocation registration and capture permissions are supplied by the host; these local records cannot prove identity, source truth or actual process cancellation.' };
}
async function newState(root, request, previous = null) {
  const context = await asset(root), normalized = validateRequest(request, context);
  const state = {owner:OWNER,schema:VERSION,protocol:'parallel-v1',request:normalized,request_digest:digest(normalized),generation:(previous?.generation ?? 0)+1,status:'active',asset_id:context?.id ?? null,created_at:new Date().toISOString(),updated_at:new Date().toISOString(),workstreams:normalized.workstreams.map(s=>({id:s.id,attempts:[]})),identities:[],registry:null,final_digest:null};
  await currentInputs(root,state);
  if (previous) await immutable(root,`history-${previous.generation}-${digest(previous)}.json`,json(previous));
  return state;
}
async function assemble(root, state) {
  await currentInputs(root,state);
  if (state.status === 'stopped') throw new Error('Stopped collection cannot assemble evidence.');
  const sources=[],facts=[],mappings=[],packets=[],limitations=[],gaps=[],ids=new Set();
  const newId = (kind, stream, local) => {const id=`${kind}-${digest([stream,local]).slice(0,48)}`; if(ids.has(id)) throw new Error('Namespaced evidence ID collision.');ids.add(id);return id;};
  for (const stream of state.workstreams) {
    const attempt=stream.attempts.at(-1);
    if (attempt?.status !== 'accepted') throw new Error(`Workstream ${stream.id} has no accepted current packet.`);
    const packet=await checkedJson(root,attempt.packet.file,attempt.packet.sha256);
    packetShape(packet,state);
    if (packet.investigator!==attempt.investigator || packet.attempt!==attempt.number || packet.workstream!==stream.id) throw new Error('Accepted packet no longer matches its registered invocation.');
    await validateEvidence(root,state.request,packet.sources,packet.facts,attempt.investigator);
    for(const source of packet.sources) {
      const receipt=attempt.receipts.find(r=>r.id===source.id);
      if(!receipt || !same(receipt.source,source)) throw new Error('Packet source has no matching host capture receipt.');
      await checkReceipt(root,receipt);
    }
    const sourceMap=new Map(packet.sources.map(s=>[s.id,newId('s',stream.id,s.id)]));
    const factMap=new Map(packet.facts.map(f=>[f.id,newId('f',stream.id,f.id)]));
    for(const source of packet.sources) sources.push({...structuredClone(source),id:sourceMap.get(source.id)});
    for(const fact of packet.facts) facts.push({...structuredClone(fact),id:factMap.get(fact.id),citations:fact.citations.map(c=>({...structuredClone(c),source:sourceMap.get(c.source)}))});
    mappings.push({workstream:stream.id,sources:Object.fromEntries(sourceMap),facts:Object.fromEntries(factMap)});
    packets.push({workstream:stream.id,investigator:attempt.investigator,invocation:attempt.invocation,attempt:attempt.number,file:attempt.packet.file,sha256:attempt.packet.sha256});
    limitations.push(...packet.limitations.map(value=>({workstream:stream.id,text:value})));gaps.push(...packet.gaps.map(value=>({workstream:stream.id,text:value})));
  }
  const registry={schema:VERSION,protocol:state.protocol,request_digest:state.request_digest,generation:state.generation,request:state.request,sources,facts,mappings,packets,limitations,gaps};
  const registryDigest=digest(registry), bytes=json(registry);
  const file=await immutable(root,`registry-${registryDigest}.json`,bytes);
  state.registry={digest:registryDigest,file,sha256:hash(bytes)};state.final_digest=null;
  return {...registry,registry_digest:registryDigest,registry_file:file};
}
async function verifiedRegistry(root,state) {
  await currentInputs(root,state);
  if (!state.registry || state.status === 'stopped') throw new Error('Collection needs a current assembled registry before synthesis.');
  const registered=state.registry,registry=await checkedJson(root,registered.file,registered.sha256);
  if(digest(registry)!==registered.digest || registry.request_digest!==state.request_digest || registry.generation!==state.generation) throw new Error('Collection registry is stale or changed.');
  // Reassembly checks accepted packet identities, receipts and captured bytes without writes.
  for (const stream of state.workstreams) {
    const attempt=stream.attempts.at(-1), named=registry.packets.find(p=>p.workstream===stream.id);
    if(attempt?.status!=='accepted' || !named || named.sha256!==attempt.packet.sha256 || named.investigator!==attempt.investigator || named.attempt!==attempt.number) throw new Error('Registry no longer matches accepted workstreams.');
    const packet=await checkedJson(root,attempt.packet.file,attempt.packet.sha256); packetShape(packet,state);
    await validateEvidence(root,state.request,packet.sources,packet.facts,attempt.investigator);
    for(const source of packet.sources){const receipt=attempt.receipts.find(r=>r.id===source.id);if(!receipt||!same(receipt.source,source))throw new Error('Host capture receipt changed.');await checkReceipt(root,receipt);}
  }
  return registry;
}
export async function verifyCollectionDossier(root,dossier,author) {
  root=await realpath(resolve(root));
  const state=await readState(root,false);if(!state)return null;
  identifier(author,'Synthesis author');
  const registry=await verifiedRegistry(root,state);
  for(const key of ['topic','audience','purpose','scope','source_mode']) if(dossier[key]!==state.request[key])throw new Error(`Synthesis ${key} differs from the collection request.`);
  if(!same(dossier.sources,registry.sources)||!same(dossier.facts,registry.facts))throw new Error('Synthesis sources/facts must match the immutable collection registry; accept investigation changes first.');
  return {request_digest:state.request_digest,generation:state.generation,registry_digest:state.registry.digest};
}
export async function verifyCollectionReviewer(root,worker) {
  root=await realpath(resolve(root));
  const state=await readState(root,false);if(!state)return null;
  identifier(worker,'Reviewer');
  if(state.identities.some(identity=>identity.investigator===worker))throw new Error('Collection review requires an independent context distinct from every registered investigator, including those with no facts.');
  await verifiedRegistry(root,state);
  return {request_digest:state.request_digest,generation:state.generation,registry_digest:state.registry.digest};
}
export async function bindCollectionDossier(root,dossierDigest) {
  root=await realpath(resolve(root));
  const state=await readState(root,false);if(!state)return null;
  sha(dossierDigest,'Final dossier digest');await verifiedRegistry(root,state);state.final_digest=dossierDigest;await saveState(root,state);
  return {request_digest:state.request_digest,generation:state.generation,registry_digest:state.registry.digest};
}
function argumentsFor(argv) {
  const action=argv[0]??'help',options={action};
  if(!['init','register','capture','accept','finish','assemble','retry','pause','resume','stop','invalidate','status','help'].includes(action))throw new Error(`Unknown collection action. ${HELP}`);
  for(let i=1;i<argv.length;i++){const name=argv[i];if(name==='--verbose'){if(options.verbose)throw new Error('Duplicate --verbose.');options.verbose=true;continue;}if(!['--project','--file'].includes(name)||!argv[i+1]||argv[i+1].startsWith('--')||options[name.slice(2)])throw new Error(`Invalid collection arguments. ${HELP}`);options[name.slice(2)]=argv[++i];}
  if(action!=='help'&&!options.project)throw new Error('--project is required.');
  if(['init','register','capture','accept','finish','retry','invalidate'].includes(action)&&!options.file)throw new Error('--file is required.');
  if(!['init','register','capture','accept','finish','retry','invalidate'].includes(action)&&options.file)throw new Error('This collection action does not accept --file.');
  return options;
}
export async function runCollectionCli(argv) {
  const options=argumentsFor(argv);if(options.action==='help')return{usage:HELP};
  const root=await realpath(resolve(options.project));await directory(join(root,'.harness-research'));
  const lock=join(root,'.harness-research/research.lock'),owned=await acquireLock(lock);
  try {
    for(const legacy of ['research-run.json','research.json'])if(await exists(join(root,'.harness-research',legacy)))throw new Error('Legacy research owns this project; use a separate collection case.');
    await directory(join(root,DATA));
    let state=await readState(root,false);
    const input=options.file?parseJson(await readText(root,options.file)):null;
    if(options.action==='init') {
      if(state)throw new Error('Collection already initialized; preserve it or use invalidate for an explicit new generation.');
      if(await exists(join(root,'.harness-research/synthesis.json')))throw new Error('Existing serial synthesis must retain its protocol; start collection in a fresh topic asset.');
      state=await newState(root,input);await saveState(root,state);return status(root,state);
    }
    if(!state)throw new Error('No collection initialized.');
    if(options.action==='invalidate'){
      if(state.workstreams.flatMap(stream=>stream.attempts).some(attempt=>attempt.started_at&&!attempt.ended_at))throw new Error('Host must confirm every registered context terminal with finish before invalidating the generation; cancellation requests alone do not release capacity.');
      state=await newState(root,input,state);await saveState(root,state);return status(root,state);
    }
    if(options.action==='status')return status(root,state);
    if(options.action==='stop') {
      state.status='stopped';state.registry=null;state.final_digest=null;
      for(const stream of state.workstreams){const attempt=stream.attempts.at(-1);if(attempt?.status==='running'){attempt.status='cancelled';attempt.cancellation_requested_at=new Date().toISOString();}}
      await saveState(root,state);return status(root,state);
    }
    if(options.action==='finish') {
      keys(input,['workstream','investigator','attempt','outcome','note'],'host finish');
      identifier(input.investigator,'Investigator');boundedInteger(input.attempt,'Host finish attempt');
      if(!['completed','failed','refused','cancelled'].includes(input.outcome))throw new Error('Host finish outcome must be completed, failed, refused or cancelled.');
      text(input.note,'Host terminal observation',20000);
      const stream=workstream(state,input.workstream),attempt=stream.attempts.find(a=>a.number===input.attempt&&a.investigator===input.investigator);
      if(!attempt)throw new Error('Host finish does not match a registered invocation.');
      if(attempt.ended_at){if(attempt.outcome&&attempt.outcome!==input.outcome)throw new Error('Host finish conflicts with the recorded terminal observation.');return status(root,state);}
      attempt.ended_at=new Date().toISOString();attempt.outcome=input.outcome;attempt.terminal_note=input.note;
      if(attempt.status==='running')attempt.status=input.outcome==='completed'?'finished':input.outcome;
      await saveState(root,state);return status(root,state);
    }
    await currentInputs(root,state);
    if(options.action==='pause'){if(state.status==='stopped')throw new Error('Stopped collection requires explicit invalidate.');state.status='paused';await saveState(root,state);return status(root,state);}
    if(options.action==='resume'){if(state.status!=='paused')throw new Error('Only a paused collection can resume.');state.status='active';await saveState(root,state);return status(root,state);}
    if(options.action==='register') {
      keys(input,['workstream','investigator','invocation','attempt'],'registration');
      if(state.status!=='active')throw new Error('Collection is not dispatching new investigations.');
      identifier(input.investigator,'Investigator');text(input.invocation,'Actual host invocation',4000);
      const stream=workstream(state,input.workstream),previous=stream.attempts.at(-1),number=previous?.status==='reserved'?previous.number:(previous?.number??0)+1;
      if(previous?.status==='running'&&previous.investigator===input.investigator&&previous.invocation===input.invocation&&(input.attempt===undefined||input.attempt===previous.number))return {...await status(root,state),registration:{workstream:stream.id,...previous}};
      if(previous&&previous.status!=='reserved')throw new Error('Use retry before registering another attempt.');
      if(input.attempt!==undefined&&input.attempt!==number)throw new Error('Registration attempt is stale.');
      if(state.identities.some(v=>v.investigator===input.investigator||v.invocation===input.invocation))throw new Error('Investigator and invocation must identify a distinct registered context.');
      if(state.workstreams.flatMap(s=>s.attempts).filter(a=>a.started_at&&!a.ended_at).length>=state.request.max_investigators)throw new Error('Investigator capacity is exhausted.');
      const attempt={number,investigator:input.investigator,invocation:input.invocation,status:'running',started_at:new Date().toISOString(),receipts:[]};
      if(previous?.status==='reserved')stream.attempts[stream.attempts.length-1]=attempt;else stream.attempts.push(attempt);
      state.identities.push({investigator:input.investigator,invocation:input.invocation});state.registry=null;state.final_digest=null;
      await saveState(root,state);return {...await status(root,state),registration:{workstream:stream.id,...attempt}};
    }
    if(options.action==='capture') {
      keys(input,['workstream','investigator','attempt','source'],'capture receipt');
      const {attempt}=activeAttempt(state,input);sourceShape(input.source);
      const checked=await validateEvidence(root,state.request,[input.source],[],attempt.investigator);
      const receipt=await pinReceipt(root,checked,input.source),prior=attempt.receipts.find(r=>r.id===receipt.id);
      if(prior&&!same(prior,receipt))throw new Error('Capture ID already registered with different metadata or bytes; retry investigation.');
      if(!prior)attempt.receipts.push(receipt);await saveState(root,state);return {schema:VERSION,request_digest:state.request_digest,generation:state.generation,receipt};
    }
    if(options.action==='accept') {
      packetShape(input,state);const {stream,attempt}=activeAttempt(state,input,{accepting:true});
      const packetBytes=json(input),packetHash=hash(packetBytes);
      if(attempt.status==='accepted'){
        if(attempt.packet.sha256!==packetHash)throw new Error('Attempt already accepted different evidence; use retry.');
        await checkedJson(root,attempt.packet.file,attempt.packet.sha256);for(const receipt of attempt.receipts)await checkReceipt(root,receipt);
        return {...await status(root,state),accepted:true,idempotent:true};
      }
      await validateEvidence(root,state.request,input.sources,input.facts,attempt.investigator);
      for(const source of input.sources){const receipt=attempt.receipts.find(r=>r.id===source.id);if(!receipt||!same(receipt.source,source))throw new Error('Packet source has no matching host capture receipt.');await checkReceipt(root,receipt);}
      const file=await immutable(root,`packet-${state.generation}-${stream.id}-${attempt.number}-${packetHash}.json`,packetBytes);
      attempt.packet={file,sha256:packetHash};attempt.status='accepted';attempt.ended_at??=new Date().toISOString();attempt.outcome??='completed';state.registry=null;state.final_digest=null;
      await saveState(root,state);return {...await status(root,state),accepted:true,idempotent:false};
    }
    if(options.action==='retry') {
      keys(input,['workstream','reason'],'retry');text(input.reason,'Retry reason',20000);if(state.status!=='active')throw new Error('Collection is not dispatching retries.');
      const stream=workstream(state,input.workstream),previous=stream.attempts.at(-1);
      if(previous?.status==='running'){previous.status='cancelled';previous.cancellation_requested_at=new Date().toISOString();}
      if(previous?.status==='reserved')throw new Error('A retry is already reserved.');
      stream.attempts.push({number:(previous?.number??0)+1,status:'reserved',reason:input.reason});state.registry=null;state.final_digest=null;await saveState(root,state);return status(root,state);
    }
    if(options.action==='assemble'){const registry=await assemble(root,state);await saveState(root,state);return registry;}
    throw new Error(`Unknown collection action. ${HELP}`);
  } finally {await releaseLock(lock,owned);}
}
