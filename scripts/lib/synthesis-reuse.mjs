// Explicit unchanged-save receipts. The portable dossier/output format remains schema 2.
import { readFile, readdir, lstat } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { localFile, hash, stable, parseJson } from './run-storage.mjs';

export const REUSE_PROTOCOL = 'harness-synthesis-reuse-v1';
const RUNTIME = fileURLToPath(new URL('../../', import.meta.url));

export async function runtimeIdentity(runtime = RUNTIME) {
  const files = [];
  async function visit(path) {
    const info = await lstat(path);
    if (info.isSymbolicLink()) throw new Error('Reuse requires an intact ordinary runtime tree.');
    if (info.isDirectory()) {
      for (const name of (await readdir(path)).sort()) await visit(join(path, name));
    } else if (info.isFile()) files.push([relative(runtime, path).split('\\').join('/'), hash(await readFile(path))]);
    else throw new Error('Reuse requires ordinary runtime files.');
  }
  for (const name of ['package.json', 'SKILL.md', 'guidance/manifest.json', 'scripts', 'references']) await visit(join(runtime, name));
  return hash(stable(files));
}

export async function reuseIdentity(root, file) {
  if (typeof file !== 'string' || !file) throw new Error('Unchanged-save reuse needs a project-local context file.');
  const path = await localFile(root, file), info = await lstat(path);
  if (info.size > 64_000) throw new Error('Reuse context must be at most 64,000 bytes.');
  const context = parseJson(await readFile(path, 'utf8'));
  if (!context || context.schema !== 1 || Object.keys(context).some(key => !['schema','protocol','guidance','independence'].includes(key))
      || ['protocol','guidance','independence'].some(key => typeof context[key] !== 'string' || !context[key].trim() || context[key].length > 4000)) {
    throw new Error('Reuse context needs schema 1 and nonempty protocol, guidance and independence identities.');
  }
  return {schema: 1, protocol: REUSE_PROTOCOL, context_file: file,
    context_digest: hash(stable(context)), runtime_digest: await runtimeIdentity()};
}

export async function checkReuseIdentity(root, receipt) {
  if (!receipt || receipt.schema !== 1 || receipt.protocol !== REUSE_PROTOCOL
      || !/^[a-f0-9]{64}$/.test(receipt.context_digest) || !/^[a-f0-9]{64}$/.test(receipt.runtime_digest)) {
    throw new Error('Saved unchanged-save context is invalid.');
  }
  const current = await reuseIdentity(root, receipt.context_file);
  if (stable(current) !== stable(receipt)) throw new Error('Research protocol, guidance, independence or runtime context changed.');
}
