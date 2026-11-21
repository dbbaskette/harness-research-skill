// Explicit unchanged-save receipts. The portable dossier/output format remains schema 2.
import { readFile, lstat } from 'node:fs/promises';
import { localFile, hash, stable, parseJson } from './run-storage.mjs';

export const REUSE_PROTOCOL = 'harness-synthesis-reuse-v1';

// A receipt binds reviewed work to the host's own protocol, guidance and independence identities.
// It does not bind to the installed runtime: an update must never make reviewed work stale, and
// every status or verify already rechecks the dossier digest, source bytes and review with the
// runtime installed now.
export async function reuseIdentity(root, file) {
  if (typeof file !== 'string' || !file) throw new Error('Unchanged-save reuse needs a project-local context file.');
  const path = await localFile(root, file), info = await lstat(path);
  if (info.size > 64_000) throw new Error('Reuse context must be at most 64,000 bytes.');
  const context = parseJson(await readFile(path, 'utf8'));
  if (!context || context.schema !== 1 || Object.keys(context).some(key => !['schema','protocol','guidance','independence'].includes(key))
      || ['protocol','guidance','independence'].some(key => typeof context[key] !== 'string' || !context[key].trim() || context[key].length > 4000)) {
    throw new Error('Reuse context needs schema 1 and nonempty protocol, guidance and independence identities.');
  }
  return {schema: 1, protocol: REUSE_PROTOCOL, context_file: file, context_digest: hash(stable(context))};
}

// Receipts saved before 1.3.0 also carry runtime_digest, a hash of one installed runtime. It is
// accepted and ignored, so work reviewed on an earlier runtime stays reviewed after an update.
export function sameReuseIdentity(left, right) {
  return Boolean(left && right) && ['schema','protocol','context_file','context_digest'].every(key => left[key] === right[key]);
}

export async function checkReuseIdentity(root, receipt) {
  if (!receipt || receipt.schema !== 1 || receipt.protocol !== REUSE_PROTOCOL || typeof receipt.context_file !== 'string'
      || !/^[a-f0-9]{64}$/.test(receipt.context_digest) || receipt.runtime_digest !== undefined && !/^[a-f0-9]{64}$/.test(receipt.runtime_digest)) {
    throw new Error('Saved unchanged-save context is invalid.');
  }
  if (!sameReuseIdentity(await reuseIdentity(root, receipt.context_file), receipt)) throw new Error('Research protocol, guidance or independence context changed.');
}
