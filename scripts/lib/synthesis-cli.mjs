import { readFile, writeFile, realpath } from 'node:fs/promises';
import { join, resolve, extname } from 'node:path';
import { exists, directory, localFile, readText, atomic, hash, stable, parseJson, acquireLock, releaseLock } from './run-storage.mjs';
import { OWNER, digestSource, validateDossier, validateReview, reviewTemplate } from './synthesis-model.mjs';
import { renderOutputs } from './synthesis-output.mjs';

const OUTPUTS = ['report.md','brief.md','evidence.md','facts.json','output.json'];
const HELP = 'synthesis save --project DIR --file dossier.json --worker ID | review --project DIR --file review.json --worker ID | status --project DIR | verify --project DIR. File paths are project-relative. Status includes an independent review template. Save writes draft artifacts; review binds to exact content and source hashes. The helper never fetches sources or makes semantic judgments.';
function args(argv) {
  const action = argv[0] || 'help', result = { action };
  if (!['save','review','status','verify','help'].includes(action)) throw new Error(`Unknown synthesis action. ${HELP}`);
  for (let i = 1; i < argv.length; i += 2) { const name = argv[i]; if (!['--project','--file','--worker'].includes(name) || !argv[i + 1] || argv[i + 1].startsWith('--') || result[name.slice(2)]) throw new Error(`Invalid synthesis arguments. ${HELP}`); result[name.slice(2)] = argv[i + 1]; }
  if (action !== 'help' && !result.project) throw new Error('--project is required.');
  if (['save','review'].includes(action) && (!result.file || !result.worker)) throw new Error('--file and --worker are required.');
  if (['status','verify'].includes(action) && (result.file || result.worker)) throw new Error('status/verify accept only --project.');
  return result;
}
async function readState(path) {
  const info = await exists(path); if (!info) return null;
  if (!info.isFile() || info.isSymbolicLink()) throw new Error('Synthesis state must be a regular owned file.');
  const state = parseJson(await readFile(path, 'utf8'));
  if (state.owner !== OWNER || state.schema !== 2 || !Array.isArray(state.sources) || !state.dossier || !state.digest) throw new Error('Unrecognized synthesis state; preserve it.');
  return state;
}
async function preserveState(derived, state) {
  if (!state) return;
  const history = join(derived, 'synthesis-history'); await directory(history);
  const bytes = JSON.stringify(state, null, 2) + '\n';
  const path = join(history, `${state.digest}-${hash(stable(state)).slice(0, 16)}.json`);
  const info = await exists(path);
  if (info) { if (!info.isFile() || info.isSymbolicLink() || await readFile(path, 'utf8') !== bytes) throw new Error('Synthesis history changed; preserve and inspect it.'); }
  else await writeFile(path, bytes, { flag: 'wx', mode: 0o600 });
}
async function protectOutputs(output, state) {
  const info = await exists(output);
  if (info && (!info.isDirectory() || info.isSymbolicLink())) throw new Error('Research output must be a real directory.');
  for (const file of OUTPUTS) {
    const existing = await exists(join(output, file));
    if (existing && (!state || !existing.isFile() || existing.isSymbolicLink())) throw new Error(`Refusing to replace unowned/nonregular research/${file}.`);
  }
}
async function stateStatus(root, state) {
  const problems = [];
  const recomputed = hash(stable({ dossier: state.dossier, author: state.author, sources: state.sources.map(digestSource) }));
  if (recomputed !== state.digest) problems.push('Saved content digest does not match the dossier.');
  for (const source of state.sources) for (const [name, path, expected] of [['working source',source.file,source.sha256],['immutable snapshot',source.snapshot,source.sha256], ...(source.original_file ? [['working original',source.original_file,source.original_sha256],['immutable original snapshot',source.original_snapshot,source.original_sha256]] : [])]) {
    try { if (hash(await readFile(await localFile(root, path))) !== expected) problems.push(`${source.id}: ${name} changed.`); }
    catch { problems.push(`${source.id}: ${name} is unavailable.`); }
  }
  let accepted = false;
  if (state.review) { try { accepted = validateReview(state, state.review, state.review.worker).accepted; } catch (e) { problems.push(`Review invalid: ${e.message}`); } }
  return { status: problems.length ? 'stale' : !state.review ? 'draft' : accepted ? 'complete' : 'needs-revision', problems };
}
async function materialize(root, state, status) {
  const output = join(root, 'research'); await protectOutputs(output, state); await directory(output);
  const regenerated = [];
  for (const [name, content] of Object.entries(renderOutputs(state, status))) {
    let previous = null; try { previous = await readFile(join(output, name), 'utf8'); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    if (previous !== content) { regenerated.push(`research/${name}`); await atomic(join(output, name), content); }
  }
  const artifactProblems = [];
  for (const source of state.sources) for (const [file, expected] of [[source.snapshot, source.sha256], ...(source.original_file ? [[source.original_snapshot, source.original_sha256]] : [])]) {
    try { if (hash(await readFile(await localFile(root, file))) !== expected) artifactProblems.push(`${file}: content changed.`); }
    catch { artifactProblems.push(`${file}: unavailable.`); }
  }
  return { artifact_integrity: artifactProblems.length ? 'failed' : regenerated.length ? 'repaired' : 'verified', artifact_problems: artifactProblems, regenerated_files: regenerated };
}
function result(state, current) {
  return { schema: 2, ...current, digest: state.digest, author: state.author, reviewer: state.review?.worker || null, sources: state.sources, outputs: OUTPUTS.map(f => `research/${f}`), review_template: reviewTemplate(state), caveat: 'Worker identities and original-read attestations are supplied by the harness. Hashes and structural validation do not prove truth or process independence.' };
}
export async function runSynthesisCli(argv) {
  const options = args(argv); if (options.action === 'help') return { usage: HELP };
  const root = await realpath(resolve(options.project)), derived = join(root, '.harness-research'), statePath = join(derived, 'synthesis.json');
  await directory(derived);
  const lock = join(derived, 'research.lock'), owned = await acquireLock(lock);
  try {
    if (await exists(join(derived, 'research-run.json')) || await exists(join(derived, 'research.json'))) throw new Error('Existing legacy research engine owns this project. Use a separate project directory; existing research is preserved.');
    let state = await readState(statePath);
    if (options.action === 'save') {
      const input = parseJson(await readText(root, options.file));
      const validated = await validateDossier(root, input, options.worker);
      await protectOutputs(join(root, 'research'), state);
      await directory(join(root, 'research'));
      await directory(join(root, 'research', 'sources'));
      await directory(join(root, 'research', 'sources', 'revisions'));
      async function pin(file, expected, extension) {
        const snapshot = `research/sources/revisions/${expected}${extension}`, path = join(root, snapshot), info = await exists(path);
        if (info) { if (!info.isFile() || info.isSymbolicLink() || hash(await readFile(path)) !== expected) throw new Error('Existing immutable snapshot has changed; preserve and inspect it.'); }
        else { const bytes = await readFile(await localFile(root, file)); if (hash(bytes) !== expected) throw new Error('Source changed during save.'); await writeFile(path, bytes, { flag: 'wx', mode: 0o600 }); }
        return snapshot;
      }
      for (const capture of validated.captures) {
        const source = validated.sources.find(s => s.id === capture.id);
        source.snapshot = await pin(capture.file, capture.sha256, '.txt');
        if (capture.original_file) {
          const suffix = extname(capture.original_file);
          source.original_snapshot = await pin(capture.original_file, capture.original_sha256, /^\.[a-z0-9]{1,10}$/i.test(suffix) ? suffix.toLowerCase() : '.bin');
        }
      }
      await preserveState(derived, state);
      // Every save is a revision, even when text is unchanged: no old review is carried over.
      state = { owner: OWNER, schema: 2, dossier: validated.dossier, author: validated.author, digest: validated.digest, sources: validated.sources, review: null };
      await atomic(statePath, JSON.stringify(state, null, 2) + '\n');
    } else if (!state) throw new Error('No synthesis dossier saved in this project.');
    if (options.action === 'review') {
      const current = await stateStatus(root, state); if (current.status === 'stale') throw new Error(`Evidence is stale. Save revised content before review. ${current.problems.join(' ')}`);
      const review = parseJson(await readText(root, options.file));
      const checked = validateReview(state, review, options.worker);
      await protectOutputs(join(root, 'research'), state);
      await preserveState(derived, state);
      state.review = checked;
      await atomic(statePath, JSON.stringify(state, null, 2) + '\n');
    }
    const current = await stateStatus(root, state);
    const artifacts = await materialize(root, state, current.status);
    return { ...result(state, current), ...artifacts };
  } finally { await releaseLock(lock, owned); }
}
