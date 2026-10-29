import { readFile, writeFile, realpath } from 'node:fs/promises';
import { join, resolve, extname, isAbsolute, relative, basename, sep } from 'node:path';
import { exists, directory, localFile, readText, atomic, hash, stable, parseJson, acquireLock, releaseLock } from './run-storage.mjs';
import { OWNER, digestSource, validateDossier, validateReview, reviewTemplate } from './synthesis-model.mjs';
import { renderOutputs } from './synthesis-output.mjs';
import { OUTPUT_NAMES, outputPrefix, outputPath, digestContent, managedSource } from './synthesis-layout.mjs';
import { assetContext, verifyAssetDossier, updateAssetRevision } from './topic-assets.mjs';
import { verifyCollectionDossier, bindCollectionDossier, verifyCollectionReviewer } from './collection.mjs';

const OUTPUTS = OUTPUT_NAMES;
const HELP = 'synthesis save|review|validate --project DIR --file INPUT.json --worker ID [--compact|--verbose] | status|verify --project DIR [--compact|--verbose] | template --project DIR [--out NEW.json]. Paths are project-relative. Full responses remain the default; --compact omits sources and review_template. Validate does not write. Template prints pending review JSON or creates --out without overwriting. Save writes drafts; review binds to exact content. Verify exits 1 for stale/failed integrity; review exits 1 for rejected work. Intact drafts and completed outputs exit 0. The helper never fetches sources or makes semantic judgments.';
export function synthesisExitCode(action, result) {
  return result?.artifact_integrity === 'failed' || result?.status === 'stale' ||
    (action === 'review' && result?.status === 'needs-revision') ? 1 : 0;
}
function args(argv) {
  const action = argv[0] || 'help', result = { action };
  if (!['save','review','validate','template','status','verify','help'].includes(action)) throw new Error(`Unknown synthesis action. ${HELP}`);
  for (let i = 1; i < argv.length; i++) {
    const name = argv[i], key = name.slice(2);
    if (['--compact','--verbose'].includes(name)) {
      if (result[key]) throw new Error(`Duplicate ${name}.`);
      result[key] = true;
    } else {
      if (!['--project','--file','--worker','--out'].includes(name) || !argv[i + 1] || argv[i + 1].startsWith('--') || result[key]) throw new Error(`Invalid synthesis arguments. ${HELP}`);
      result[key] = argv[++i];
    }
  }
  if (result.compact && result.verbose) throw new Error('Choose --compact or --verbose.');
  if (action !== 'help' && !result.project) throw new Error('--project is required.');
  if (['save','review','validate'].includes(action) && (!result.file || !result.worker)) throw new Error('--file and --worker are required.');
  if (['status','verify','template'].includes(action) && (result.file || result.worker)) throw new Error('status/verify/template do not accept --file or --worker.');
  if (result.out && action !== 'template') throw new Error('--out is only valid for template.');
  if (action === 'template' && (result.compact || result.verbose)) throw new Error('template does not accept output-format flags.');
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
  const problems = [], artifactProblems = [], checked = new Map();
  let bytesHashed = 0;
  const recomputed = hash(stable(digestContent(state.dossier, state.author, state.sources.map(digestSource), outputPrefix(state))));
  if (recomputed !== state.digest) problems.push('Saved content digest does not match the dossier.');
  try {
    const context = await assetContext(root);
    if ((context?.layout || null) !== (state.layout || null)) throw new Error('Saved output layout does not match the topic asset.');
    if (context) {
      if (state.asset_input_fingerprint !== context.inputFingerprint) throw new Error('Topic inputs changed after this research revision was saved.');
      await verifyAssetDossier(root, state.dossier);
    }
    const collection = await verifyCollectionDossier(root, state.dossier, state.author);
    if (stable(collection || null) !== stable(state.collection || null)) throw new Error('Saved collection provenance is no longer current.');
  } catch (error) { problems.push(error.message); }
  async function inspect(path) {
    if (!checked.has(path)) {
      try {
        const bytes = await readFile(await localFile(root, path)); bytesHashed += bytes.length;
        checked.set(path, hash(bytes));
      } catch { checked.set(path, null); }
    }
    return checked.get(path);
  }
  for (const source of state.sources) {
    const files = [['working source',source.file,source.sha256,false],['immutable snapshot',source.snapshot,source.sha256,true], ...(source.original_file ? [['working original',source.original_file,source.original_sha256,false],['immutable original snapshot',source.original_snapshot,source.original_sha256,true]] : [])];
    for (const [name, path, expected, artifact] of files) {
      const actual = await inspect(path);
      if (actual !== expected) {
        problems.push(`${source.id}: ${name} ${actual === null ? 'is unavailable' : 'changed'}.`);
        if (artifact) artifactProblems.push(`${path}: ${actual === null ? 'unavailable' : 'content changed'}.`);
      }
    }
  }
  let accepted = false;
  if (state.review) { try { await verifyCollectionReviewer(root, state.review.worker); accepted = validateReview(state, state.review, state.review.worker).accepted; } catch (e) { problems.push(`Review invalid: ${e.message}`); } }
  return { status: problems.length ? 'stale' : !state.review ? 'draft' : accepted ? 'complete' : 'needs-revision', problems, artifact_problems: [...new Set(artifactProblems)], integrity_checks: { files_checked: checked.size, bytes_hashed: bytesHashed } };
}
async function materialize(root, state, current) {
  const output = join(root, outputPrefix(state)); await protectOutputs(output, state); await directory(output);
  const regenerated = [], preserved = [];
  for (const [name, content] of Object.entries(renderOutputs(state, current.status))) {
    let previous = null; try { previous = await readFile(join(output, name)); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    if (!previous?.equals(Buffer.from(content))) {
      if (previous !== null) {
        const backupDir = join(root, '.harness-research', 'output-backups'); await directory(backupDir);
        const backup = `${hash(previous)}-${name}`, path = join(backupDir, backup), info = await exists(path);
        if (info) {
          if (!info.isFile() || info.isSymbolicLink() || !(await readFile(path)).equals(previous)) throw new Error('Output backup changed; preserve and inspect it.');
        } else await writeFile(path, previous, { flag: 'wx', mode: 0o600 });
        preserved.push({ file: outputPath(state, name), backup: `.harness-research/output-backups/${backup}` });
      }
      regenerated.push(outputPath(state, name)); await atomic(join(output, name), content);
    }
  }
  return { artifact_integrity: current.artifact_problems.length ? 'failed' : regenerated.length ? 'repaired' : 'verified', regenerated_files: regenerated, preserved_files: preserved };
}
function result(state, current, compact) {
  const base = { schema: 2, ...current, digest: state.digest, author: state.author, reviewer: state.review?.worker || null, ...(state.layout ? { layout: state.layout } : {}), ...(state.collection ? { collection: state.collection } : {}), outputs: OUTPUTS.map(f => outputPath(state, f)) };
  if (compact) return { ...base, counts: { sources: state.sources.length, facts: state.dossier.facts.length, findings: state.dossier.findings.length }, template_command: 'synthesis template --project DIR' };
  return { ...base, sources: state.sources, review_template: reviewTemplate(state), caveat: 'Worker identities and original-read attestations are supplied by the harness. Hashes and structural validation do not prove truth or process independence.' };
}
async function writeTemplate(root, name, template, state) {
  // Require an existing project-local parent and create without overwriting.
  if (!name || isAbsolute(name) || name.split(/[\\/]/).some(p => !p || p === '.' || p === '..')) throw new Error('--out must be a project-relative path without traversal.');
  const prefix = outputPrefix(state), sources = [prefix, 'sources'].filter(Boolean).join('/');
  const managed = p => managedSource(p, prefix) || p === sources || p.startsWith(sources + '/') || (state.layout === 'topic' && (p === 'documents' || p.startsWith('documents/')));
  if (managed(name)) throw new Error('--out cannot replace managed research files.');
  const path = join(root, name), parent = await realpath(resolve(path, '..'));
  if (parent !== root && !parent.startsWith(root + sep)) throw new Error('--out escapes the project.');
  if (managed(relative(root, join(parent, basename(path))).split(sep).join('/'))) throw new Error('--out cannot write through an alias to managed research files.');
  await writeFile(path, JSON.stringify(template, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
}
export async function runSynthesisCli(argv) {
  const options = args(argv); if (options.action === 'help') return { usage: HELP };
  const root = await realpath(resolve(options.project)), derived = join(root, '.harness-research'), statePath = join(derived, 'synthesis.json');
  if (options.action === 'validate') {
    const input = parseJson(await readText(root, options.file));
    const context = await assetContext(root);
    const checked = await validateDossier(root, input, options.worker, { outputPrefix: context ? '' : 'research' });
    await verifyAssetDossier(root, checked.dossier);
    await verifyCollectionDossier(root, checked.dossier, options.worker);
    return { schema: 2, valid: true, digest: checked.digest, counts: { sources: checked.sources.length, facts: checked.dossier.facts.length, findings: checked.dossier.findings.length } };
  }
  await directory(derived);
  const lock = join(derived, 'research.lock'), owned = await acquireLock(lock);
  try {
    if (await exists(join(derived, 'research-run.json')) || await exists(join(derived, 'research.json'))) throw new Error('Existing legacy research engine owns this project. Use a separate project directory; existing research is preserved.');
    const context = await assetContext(root), layout = context ? { layout: 'topic' } : {};
    let state = await readState(statePath);
    if (state && (state.layout || null) !== (context?.layout || null)) throw new Error('Saved output layout does not match the topic asset; preserve and inspect it.');
    if (options.action === 'save') {
      const input = parseJson(await readText(root, options.file));
      const validated = await validateDossier(root, input, options.worker, { outputPrefix: context ? '' : 'research' });
      await verifyAssetDossier(root, validated.dossier);
      const collection = await verifyCollectionDossier(root, validated.dossier, options.worker);
      const output = join(root, outputPrefix(layout));
      await protectOutputs(output, state);
      await directory(output);
      await directory(join(output, 'sources'));
      await directory(join(output, 'sources', 'revisions'));
      async function pin(file, expected, extension) {
        const snapshot = outputPath(layout, `sources/revisions/${expected}${extension}`), path = join(root, snapshot), info = await exists(path);
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
      state = { owner: OWNER, schema: 2, ...layout, ...(context ? { asset_input_fingerprint: context.inputFingerprint } : {}), ...(collection ? { collection } : {}), dossier: validated.dossier, author: validated.author, digest: validated.digest, sources: validated.sources, review: null };
      await atomic(statePath, JSON.stringify(state, null, 2) + '\n');
      if (collection) await bindCollectionDossier(root, state.digest);
    } else if (!state) throw new Error('No synthesis dossier saved in this project.');
    if (options.action === 'template') {
      const template = reviewTemplate(state);
      if (!options.out) return template;
      await writeTemplate(root, options.out, template, state);
      return { schema: 2, digest: state.digest, template_file: options.out };
    }
    let current;
    if (options.action === 'review') {
      current = await stateStatus(root, state); if (current.status === 'stale') throw new Error(`Evidence is stale. Save revised content before review. ${current.problems.join(' ')}`);
      const review = parseJson(await readText(root, options.file));
      await verifyCollectionReviewer(root, options.worker);
      const checked = validateReview(state, review, options.worker);
      await protectOutputs(join(root, outputPrefix(state)), state);
      await preserveState(derived, state);
      state.review = checked;
      await atomic(statePath, JSON.stringify(state, null, 2) + '\n');
    }
    // Review changes no source bytes; reuse its inspection, but recompute acceptance.
    if (current) current.status = state.review.accepted ? 'complete' : 'needs-revision';
    else current = await stateStatus(root, state);
    const artifacts = await materialize(root, state, current);
    const response = { ...result(state, current, options.compact), ...artifacts };
    if (context) await updateAssetRevision(root, state, response);
    return response;
  } finally { await releaseLock(lock, owned); }
}
