import { readFile, writeFile, mkdir, rename, realpath, lstat, unlink, readdir, cp, rm } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { join, resolve, sep, isAbsolute } from 'node:path';

const scopeLabels = { 'supplied-only': 'Uploaded sources only', 'public-web': 'Uploaded sources plus external research' };
const verdicts = ['supported', 'contradicted', 'insufficient', 'unavailable'];
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const stable = value => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
const literal = value => String(value).replace(/([\\`*_{}\[\]<>!#|])/g, '\\$1');
function text(value, label, max = 4000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`${label} requires nonempty text (maximum ${max} characters).`);
  return value;
}
async function exists(path) { try { return await lstat(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } }
async function localPath(root, name, { optional = false } = {}) {
  if (typeof name !== 'string' || !name || isAbsolute(name) || name.split(/[\\/]/).some(part => part === '..' || part === '')) throw new Error('Research file paths must be relative to the project.');
  const path = resolve(root, name);
  if (!path.startsWith(root + sep)) throw new Error('Research path escapes the project.');
  if (!await exists(path)) { if (optional) return path; throw new Error(`Research source is missing: ${name}`); }
  const actual = await realpath(path);
  if (!actual.startsWith(root + sep)) throw new Error('Research source symlink escapes the project.');
  return actual;
}
async function fingerprint(root, name) {
  try { return digest(await readFile(await localPath(root, name))); }
  catch (error) { if (error.code === 'ENOENT' || error.message.startsWith('Research source is missing:')) return null; throw error; }
}
function readable(bytes) {
  let value;
  try { value = new TextDecoder('utf-8', { fatal: true }).decode(bytes); }
  catch { throw new Error('Research evidence needs a readable UTF-8 extraction.'); }
  if (value.includes('\0') || bytes.subarray(0, 4).equals(Buffer.from('PK\x03\x04')) || value.startsWith('%PDF-')) throw new Error('Research evidence needs a readable UTF-8 extraction.');
  return value;
}
async function selectedSources(root, supplied, files) {
  if (!Array.isArray(supplied) || supplied.length > 100) throw new Error('sources must be an array of up to 100 selected documents.');
  const seen = new Set();
  const snapshots = new Set();
  const sources = [];
  for (const source of supplied) {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(source.id) || seen.has(source.id)) throw new Error('Selected source IDs must be unique lowercase identifiers.');
    seen.add(source.id); text(source.title, 'Document title'); text(source.origin, 'Document origin');
    const limits = source.limits ?? 'none'; text(limits, 'Document coverage limits');
    if (!source.file && !source.original_file) throw new Error('Selected documents need an original file or readable snapshot.');
    if (!source.file && (!source.limits || source.limits === 'none')) throw new Error('Unreadable documents need an explicit coverage gap.');
    if (source.original_file) { await localPath(root, source.original_file); files.add(source.original_file); }
    if (source.file) {
      if (snapshots.has(source.file)) throw new Error('Selected readable snapshots must be unique.');
      snapshots.add(source.file);
      const content = readable(await readFile(await localPath(root, source.file)));
      if (!content.trim()) throw new Error('Selected readable snapshots must contain text; record unreadable documents as coverage gaps.');
      files.add(source.file);
    }
    sources.push({ id: source.id, title: source.title, origin: source.origin, original_file: source.original_file ?? null, file: source.file ?? null, limits });
  }
  return sources;
}
async function inputs(root, names) { return Object.fromEntries(await Promise.all(names.map(async name => [name, await fingerprint(root, name)]))); }
async function paths(project, create = false) {
  const root = await realpath(resolve(project));
  const derived = join(root, '.harness-research');
  const state = await exists(derived);
  if (state && (!state.isDirectory() || state.isSymbolicLink())) throw new Error('Research storage must be a real project directory.');
  if (create) await mkdir(derived, { recursive: true });
  return { root, derived, file: join(derived, 'research.json'), report: join(derived, 'research-report.md') };
}
async function readState(path, owner = 'harness-research') {
  const info = await exists(path);
  if (!info || !info.isFile() || info.isSymbolicLink()) throw new Error('No valid Harness research record; plan research first.');
  const value = JSON.parse(await readFile(path, 'utf8'));
  if (value.schema !== 1 || value.owner !== owner || !Array.isArray(value.items) || !value.results || !value.inputs) throw new Error('Unrecognized research record; refusing to overwrite it.');
  return value;
}
async function atomic(path, value) {
  const state = await exists(path);
  if (state && (!state.isFile() || state.isSymbolicLink())) throw new Error(`Research output is not a regular file: ${path}`);
  const temporary = `${path}.pending-${randomUUID()}`;
  try { await writeFile(temporary, value, { flag: 'wx' }); await rename(temporary, path); }
  finally { await unlink(temporary).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
}
async function inspect(locations, value) {
  let stale = stable(await inputs(locations.root, Object.keys(value.inputs))) !== stable(value.inputs);
  const staleItems = [];
  for (const [id, result] of Object.entries(value.results)) {
    let changed = false;
    for (const source of result.evidence) {
      try { changed ||= await fingerprint(locations.root, source.file) !== source.sha256; }
      catch { changed = true; }
    }
    if (changed) staleItems.push(id);
  }
  stale ||= staleItems.length > 0;
  const pending = value.items.filter(item => !Object.hasOwn(value.results, item.id)).map(item => item.id);
  const unresolved = Object.entries(value.results).filter(([, result]) => ['insufficient', 'unavailable'].includes(result.status)).map(([id]) => id);
  const sourceGaps = (value.sources ?? []).filter(source => !source.file || source.limits !== 'none').map(source => ({ id: source.id, title: source.title, limits: source.limits }));
  return { run: value.run, scope: value.scope, sourceMode: scopeLabels[value.scope], sourceGaps, status: stale ? 'stale' : pending.length ? 'in-progress' : 'complete', pending, unresolved, staleItems, completed: Object.keys(value.results).length, total: value.items.length, file: locations.file, report: locations.report, assessment: 'Research coverage; does not certify a factual or downstream review.' };
}
function render(value, status) {
  const lines = ['# Research brief', '', `Topic: ${literal(value.topic)}`, `Purpose: ${value.purpose}; scope: ${scopeLabels[value.scope]} (${value.scope}).`, `Status: ${status.status}. Completed: ${status.completed}/${status.total}.`, `Pending: ${status.pending.join(', ') || 'none'}.`, `Unresolved: ${status.unresolved.join(', ') || 'none'}.`, `Stale evidence: ${status.staleItems.join(', ') || (status.status === 'stale' ? 'content inputs changed' : 'none')}.`, '', status.assessment, ''];
  if (value.sources?.length) {
    lines.push('## Selected supplied documents', '');
    for (const source of value.sources) {
      lines.push(`Document: ${literal(source.title)} (${source.id})`, `Origin: ${literal(source.origin)}`);
      if (source.original_file) lines.push(`Original: ${literal(source.original_file)}; SHA256: ${value.inputs[source.original_file]}`);
      lines.push(source.file ? `Readable snapshot: ${literal(source.file)}; SHA256: ${value.inputs[source.file]}` : 'Readable snapshot: unavailable.', `Coverage limits: ${literal(source.limits)}`, '');
    }
  }
  for (const item of value.items) {
    const finding = Object.hasOwn(value.results, item.id) ? value.results[item.id] : null;
    lines.push(`## ${item.id}`, '', literal(item.question), '', `Status: ${finding?.status ?? 'pending'}.`, '');
    if (item.claim) lines.push(`Claim in ${literal(item.claim.file)} at character ${item.claim.start}:`, `> ${literal(item.claim.quote).replace(/\n/g, '\n> ')}`, '');
    if (!finding) continue;
    lines.push(literal(finding.summary), '', `Limits/open questions: ${literal(finding.limits)}`, `Checked: ${finding.checked_at}`, '');
    for (const source of finding.evidence) {
      if (source.source_id) lines.push(`Supplied document: ${literal(source.source_id)}; original revision SHA256: ${source.original_sha256 ?? source.sha256}`, '');
      lines.push(`Source: ${literal(source.title)}`, `Origin: ${literal(source.origin)}`, `Snapshot: ${literal(source.file)}; SHA256: ${source.sha256}`, `Location: ${literal(source.locator)}; source date: ${literal(source.source_date ?? 'not available')}`, '', `> ${literal(source.quote).replace(/\n/g, '\n> ')}`, '');
    }
  }
  return lines.join('\n') + '\n';
}
async function save(locations, value) {
  // Retain earlier records before replacing a plan or result.
  if (await exists(locations.file)) {
    await readState(locations.file);
    const history = join(locations.derived, 'history');
    const old = await exists(history);
    if (old && (!old.isDirectory() || old.isSymbolicLink())) throw new Error('Research history must be a real directory.');
    await mkdir(history, { recursive: true });
    const id = randomUUID();
    await writeFile(join(history, `${id}.json`), await readFile(locations.file), { flag: 'wx' });
    if (await exists(locations.report)) {
      const info = await lstat(locations.report);
      if (!info.isFile() || info.isSymbolicLink()) throw new Error('Research report is not a regular file.');
      await writeFile(join(history, `${id}.md`), await readFile(locations.report), { flag: 'wx' });
    }
  } else if (await exists(locations.report)) throw new Error('An existing report has no owned research record; refusing to overwrite it.');
  const status = await inspect(locations, value);
  await atomic(locations.file, JSON.stringify(value, null, 2) + '\n');
  await atomic(locations.report, render(value, status));
  return status;
}

async function planUnlocked(project, supplied, { allowWeb = false } = {}) {
  const locations = await paths(project);
  if (!await exists(locations.file) && await exists(join(locations.root, '.tanzu-research'))) throw new Error('Older Brand research exists; run migrate before starting a new plan.');
  text(supplied.topic, 'Topic');
  if (!['planning', 'fact-check'].includes(supplied.purpose) || !['supplied-only', 'public-web'].includes(supplied.scope)) throw new Error('Choose planning/fact-check and supplied-only/public-web.');
  if (!Array.isArray(supplied.items) || supplied.items.length < 1 || supplied.items.length > 30) throw new Error('Plan 1–30 focused research questions.');
  if (!Array.isArray(supplied.input_files ?? [])) throw new Error('input_files must be an array of project-relative paths.');
  const files = new Set(supplied.input_files ?? []);
  const sources = supplied.sources === undefined ? undefined : await selectedSources(locations.root, supplied.sources, files);
  const seen = new Set();
  for (const item of supplied.items) {
    if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(item.id) || seen.has(item.id)) throw new Error('Research question IDs must be unique, lowercase identifiers.');
    seen.add(item.id); text(item.question, 'Question');
    if (item.public_query != null) {
      text(item.public_query, 'Public query', 500);
      if (supplied.scope !== 'public-web' || /https?:\/\/|[/\\@]/.test(item.public_query)) throw new Error('Public queries require public-web scope and cannot contain URLs, paths or emails.');
    }
    if (item.claim) {
      const claim = item.claim; text(claim.quote, 'Claim');
      if (!Number.isInteger(claim.start) || claim.start < 0) throw new Error('Claim needs a nonnegative character start.');
      const content = Array.from(await readFile(await localPath(locations.root, claim.file), 'utf8'));
      if (content.slice(claim.start, claim.start + Array.from(claim.quote).length).join('') !== claim.quote) throw new Error('Claim does not match the selected content.');
      files.add(claim.file);
    } else if (supplied.purpose === 'fact-check') throw new Error('Fact-check questions must map to exact content claims.');
  }
  const plan = { topic: supplied.topic, purpose: supplied.purpose, scope: supplied.scope, input_files: [...files].sort(), ...(sources === undefined ? {} : { sources }), items: supplied.items };
  const pin = await inputs(locations.root, plan.input_files);
  const run = digest(stable([plan, pin])).slice(0, 24);
  if (await exists(locations.file)) {
    const old = await readState(locations.file);
    if (old.scope === 'supplied-only' && plan.scope === 'public-web' && !allowWeb) throw new Error('Supplied-only research requires explicit permission before changing to public-web scope.');
    if (old.run === run) return statusUnlocked(project);
  }
  await paths(project, true);
  return save(locations, { schema: 1, owner: 'harness-research', run, ...plan, inputs: pin, results: {}, created_at: new Date().toISOString() });
}
async function recordUnlocked(project, run, id, supplied) {
  const locations = await paths(project);
  const value = await readState(locations.file);
  if (value.run !== run || stable(await inputs(locations.root, Object.keys(value.inputs))) !== stable(value.inputs)) throw new Error('Research run or content changed; refresh the plan before recording results.');
  if (!value.items.some(item => item.id === id)) throw new Error('Unknown research question.');
  if (!verdicts.includes(supplied.status) || !Array.isArray(supplied.evidence) || supplied.evidence.length > 20) throw new Error('Result requires a supported/contradicted/insufficient/unavailable status and up to 20 evidence passages.');
  text(supplied.summary, 'Summary', 12000); text(supplied.limits, 'Coverage limits');
  const evidence = [];
  for (const source of supplied.evidence) {
    text(source.title, 'Source title'); text(source.origin, 'Source origin'); text(source.locator, 'Source location'); text(source.quote, 'Evidence quote', 12000);
    const selected = value.sources?.find(document => document.file && document.file === source.file);
    if (source.source_id != null && selected?.id !== source.source_id) throw new Error('Evidence must match its selected supplied document.');
    if (value.sources !== undefined && value.scope === 'supplied-only' && !selected) throw new Error('Uploaded-sources-only evidence must come from a selected readable document.');
    const bytes = await readFile(await localPath(locations.root, source.file));
    const content = Array.from(readable(bytes));
    if (!Number.isInteger(source.start) || source.start < 0 || content.slice(source.start, source.start + Array.from(source.quote).length).join('') !== source.quote) throw new Error('Evidence must quote the inspected source snapshot exactly.');
    evidence.push({ ...source, ...(selected ? { source_id: selected.id, title: selected.title, origin: selected.origin, original_sha256: value.inputs[selected.original_file ?? selected.file] } : {}), sha256: digest(bytes) });
  }
  if (['supported', 'contradicted'].includes(supplied.status) && !evidence.length) throw new Error('Supported or contradicted findings require an inspected source passage.');
  value.results[id] = { status: supplied.status, summary: supplied.summary, limits: supplied.limits, evidence, checked_at: new Date().toISOString() };
  return save(locations, value);
}
async function statusUnlocked(project) {
  const locations = await paths(project);
  if (!await exists(locations.file)) return { status: await exists(join(locations.root, '.tanzu-research')) ? 'legacy-found' : 'not-started', file: locations.file, report: locations.report };
  const value = await readState(locations.file);
  const status = await inspect(locations, value);
  await atomic(locations.report, render(value, status));
  return status;
}

async function withLock(project, create, action) {
  const locations = await paths(project, create);
  if (!await exists(locations.derived)) return action();
  const lock = join(locations.derived, 'research.lock');
  try { await writeFile(lock, String(process.pid), { flag: 'wx' }); }
  catch (error) { if (error.code === 'EEXIST') throw new Error('Research storage is busy; retry after the current save.'); throw error; }
  const owned = await lstat(lock);
  try { return await action(); }
  finally {
    const current = await exists(lock);
    if (!current || !current.isFile() || current.isSymbolicLink() || current.dev !== owned.dev || current.ino !== owned.ino) throw new Error('Research lock changed; inspect storage before retrying.');
    await unlink(lock);
  }
}
export const planResearch = (project, plan, options) => withLock(project, true, () => planUnlocked(project, plan, options));
export const recordResearch = (project, run, id, finding) => withLock(project, false, () => recordUnlocked(project, run, id, finding));
export const researchStatus = project => withLock(project, false, () => statusUnlocked(project));

// Copy legacy state without altering its files, scope or evidence currency.
export async function migrateResearch(project) {
  const locations = await paths(project, true);
  const legacy = join(locations.root, '.tanzu-research');
  const old = await exists(legacy);
  if (!old?.isDirectory() || old.isSymbolicLink()) throw new Error('No safe legacy research directory.');
  return withLock(project, true, async () => {
    if (await exists(locations.file) || await exists(locations.report) || await exists(join(locations.derived, 'history'))) throw new Error('New research already exists; refusing to overwrite it.');
    const lock = join(legacy, 'research.lock');
    try { await writeFile(lock, String(process.pid), { flag: 'wx' }); }
    catch (error) { if (error.code === 'EEXIST') throw new Error('Legacy research is busy; retry after the current save.'); throw error; }
    const owned = await lstat(lock);
    const stage = join(locations.derived, `.migration-${randomUUID()}`);
    try {
      const value = await readState(join(legacy, 'research.json'), 'tanzu-brand');
      value.owner = 'harness-research';
      // Validate paths and stale source state before staging any publication.
      await inspect(locations, value);
      await mkdir(stage);
      const history = join(legacy, 'history');
      if (await exists(history)) {
        const info = await lstat(history);
        if (!info.isDirectory() || info.isSymbolicLink()) throw new Error('Unsafe legacy research history.');
        await mkdir(join(stage, 'history'));
        for (const name of await readdir(history)) {
          const file = join(history, name), stat = await lstat(file);
          if (!stat.isFile() || stat.isSymbolicLink()) throw new Error('Unsafe legacy history member.');
          await cp(file, join(stage, 'history', name), { errorOnExist: true, force: false });
        }
      }
      if (await exists(join(stage, 'history'))) await rename(join(stage, 'history'), join(locations.derived, 'history'));
      return { ...await save(locations, value), migratedFrom: legacy };
    } finally {
      await rm(stage, { recursive: true, force: true });
      const current = await exists(lock);
      if (!current?.isFile() || current.isSymbolicLink() || current.ino !== owned.ino || current.dev !== owned.dev) throw new Error('Legacy research lock changed; inspect before retrying.');
      await unlink(lock);
    }
  });
}
