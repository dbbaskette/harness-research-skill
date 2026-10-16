import { readFile, writeFile, mkdir, rename, lstat, realpath, unlink } from 'node:fs/promises';
import { join, resolve, isAbsolute, sep } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';

export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const stable = value => JSON.stringify(value, (_key, item) => item && typeof item === 'object' && !Array.isArray(item) ? Object.fromEntries(Object.keys(item).sort().map(key => [key, item[key]])) : item);
export const clone = value => structuredClone(value);
export const key = prefix => prefix + randomUUID().replaceAll('-', '');
export function text(value, label, max = 4000) {
  if (typeof value !== 'string' || !value.trim() || value.length > max) throw new Error(`${label} requires nonempty text (maximum ${max} characters).`);
  return value.trim();
}
export function identifier(value, label = 'Identifier') {
  if (typeof value !== 'string' || !/^[a-z0-9][a-z0-9-]{0,63}$/.test(value)) throw new Error(`${label} requires lowercase letters, digits and hyphens (maximum 64).`);
  return value;
}
export async function exists(path) { try { return await lstat(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } }
export async function directory(path) {
  const info = await exists(path);
  if (info && (!info.isDirectory() || info.isSymbolicLink())) throw new Error(`Research storage must be a real directory: ${path}`);
  if (!info) await mkdir(path, { mode: 0o700 });
}
export async function localFile(root, name) {
  if (typeof name !== 'string' || !name || isAbsolute(name) || name.split(/[\\/]/).some(part => !part || part === '..' || part === '.')) throw new Error('Research files must be project-relative paths without traversal.');
  const path = resolve(root, name);
  if (!path.startsWith(root + sep)) throw new Error('Research file escapes the project.');
  const actual = await realpath(path);
  const info = await lstat(path);
  if (!actual.startsWith(root + sep) || !info.isFile() || info.isSymbolicLink()) throw new Error('Research files must be regular project files, without escaping symlinks.');
  return actual;
}
export async function snapshot(root, name) {
  const path = await localFile(root, name);
  return { file: name, sha256: hash(await readFile(path)) };
}
export async function unchanged(root, input) {
  try { return (await snapshot(root, input.file)).sha256 === input.sha256; } catch { return false; }
}
export async function readText(root, name, { withHash = false } = {}) {
  const path = await localFile(root, name), info = await lstat(path);
  if (info.size > 8 * 1024 * 1024) throw new Error('Readable research source exceeds 8 MiB. Split it into identified excerpts.');
  const bytes = await readFile(path);
  let value;
  try { value = new TextDecoder('utf-8', { fatal: true }).decode(bytes); } catch { throw new Error('Research sources require readable UTF-8 extraction.'); }
  if (value.includes('\0') || value.startsWith('%PDF-') || bytes.subarray(0, 4).equals(Buffer.from('PK\x03\x04'))) throw new Error('Research sources require readable UTF-8 extraction.');
  return withHash ? { content: value, sha256: hash(bytes) } : value;
}
export async function atomic(path, value) {
  const info = await exists(path);
  if (info && (!info.isFile() || info.isSymbolicLink())) throw new Error(`Refusing to replace an unowned/nonregular output: ${path}`);
  const temp = path + '.pending-' + randomUUID();
  try { await writeFile(temp, value, { flag: 'wx', mode: 0o600 }); await rename(temp, path); }
  finally { await unlink(temp).catch(error => { if (error.code !== 'ENOENT') throw error; }); }
}
export async function paths(project, create = false) {
  const root = await realpath(resolve(project)), derived = join(root, '.harness-research');
  if (create) await directory(derived);
  else { const info = await exists(derived); if (info && (!info.isDirectory() || info.isSymbolicLink())) throw new Error('Research storage must be a real project directory.'); }
  return { root, derived, state: join(derived, 'research-run.json'), legacy: join(derived, 'research.json'), output: join(root, 'research'), lock: join(derived, 'research.lock') };
}
export async function load(locations) {
  const info = await exists(locations.state);
  if (!info) return null;
  if (!info.isFile() || info.isSymbolicLink()) throw new Error('No valid research run record.');
  const state = JSON.parse(await readFile(locations.state, 'utf8'));
  if (state.owner !== 'harness-research-run' || state.schema !== 1 || !Array.isArray(state.tasks) || !Array.isArray(state.questions) || !Array.isArray(state.facts) || !Array.isArray(state.sources)) throw new Error('Unrecognized research run record; preserve it.');
  return state;
}
export async function withStore(project, action, { create = false } = {}) {
  const locations = await paths(project, create);
  if (!await exists(locations.derived)) return action(locations, null);
  try { await writeFile(locations.lock, String(process.pid), { flag: 'wx', mode: 0o600 }); }
  catch (error) { if (error.code === 'EEXIST') throw new Error('Research storage is busy; retry after the current save. Inspect a dead process before recovering its lock.'); throw error; }
  const owned = await lstat(locations.lock);
  try { return await action(locations, await load(locations)); }
  finally {
    const current = await lstat(locations.lock);
    if (!current.isFile() || current.isSymbolicLink() || current.ino !== owned.ino || current.dev !== owned.dev) throw new Error('Research lock changed; inspect storage before retrying.');
    await unlink(locations.lock);
  }
}
export async function preserveRun(locations, state) {
  await directory(join(locations.derived, 'history'));
  if (state) await writeFile(join(locations.derived, 'history', `${state.run}-${randomUUID()}.run.json`), JSON.stringify(state, null, 2) + '\n', { flag: 'wx' });
  const info = await exists(locations.legacy);
  if (info) {
    if (!info.isFile() || info.isSymbolicLink()) throw new Error('Existing research record is not a regular file.');
    const bytes = await readFile(locations.legacy), old = JSON.parse(bytes);
    if (old.owner !== 'harness-research' || old.schema !== 1) throw new Error('Unrecognized existing research record; preserve it.');
    await writeFile(join(locations.derived, 'history', `${old.run}-${randomUUID()}.json`), bytes, { flag: 'wx' });
  }
}

// JSON.parse silently drops duplicate keys. Validate object member uniqueness first.
export function parseJson(input) {
  let i = 0;
  const ws = () => { while (/\s/.test(input[i] ?? '') && i < input.length) i++; };
  function string() {
    const start = i++;
    while (i < input.length) { const c = input[i++]; if (c === '\\') i++; else if (c === '"') return JSON.parse(input.slice(start, i)); }
    throw new Error('Unterminated JSON string.');
  }
  function value() {
    ws();
    if (input[i] === '{') {
      i++; ws(); const keys = new Set();
      if (input[i] === '}') { i++; return; }
      while (i < input.length) {
        ws(); if (input[i] !== '"') throw new Error('JSON object requires a key.');
        const name = string(); if (keys.has(name)) throw new Error(`Duplicate JSON key: ${name}`); keys.add(name);
        ws(); if (input[i++] !== ':') throw new Error('Invalid JSON object.'); value(); ws();
        const c = input[i++]; if (c === '}') return; if (c !== ',') throw new Error('Invalid JSON object.');
      }
    } else if (input[i] === '[') {
      i++; ws(); if (input[i] === ']') { i++; return; }
      while (i < input.length) { value(); ws(); const c = input[i++]; if (c === ']') return; if (c !== ',') throw new Error('Invalid JSON array.'); }
    } else if (input[i] === '"') string();
    else { const match = /^(?:true|false|null|-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?)/.exec(input.slice(i)); if (!match) throw new Error('Invalid JSON value.'); i += match[0].length; }
  }
  value(); ws(); if (i !== input.length) throw new Error('Trailing JSON content.');
  return JSON.parse(input);
}
