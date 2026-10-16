import { readFile } from 'node:fs/promises';

// The bundled JSON Schema deliberately uses only these keywords. This small,
// dependency-free evaluator validates that contract, not arbitrary JSON Schemas.
const schema = JSON.parse(await readFile(new URL('../../references/facts.schema.json', import.meta.url), 'utf8'));
const keywords = new Set(['$schema', '$defs', '$ref', 'title', 'type', 'required', 'properties', 'items', 'enum', 'pattern', 'minimum', 'minItems']);
const types = { object: value => value !== null && typeof value === 'object' && !Array.isArray(value), array: Array.isArray, string: value => typeof value === 'string', null: value => value === null, integer: Number.isInteger };
function check(value, rule, path) {
  for (const name of Object.keys(rule)) if (!keywords.has(name)) throw new Error('Unsupported bundled schema keyword: ' + name);
  if (rule.$ref) {
    if (!rule.$ref.startsWith('#/$defs/') || !schema.$defs[rule.$ref.slice(8)]) throw new Error('Unknown bundled schema reference.');
    return check(value, schema.$defs[rule.$ref.slice(8)], path);
  }
  if (rule.type && ![rule.type].flat().some(type => types[type]?.(value))) throw new Error(`Invalid facts export at ${path}: expected ${rule.type}.`);
  if (rule.enum && !rule.enum.includes(value)) throw new Error(`Invalid facts export enum at ${path}.`);
  if (rule.pattern && !new RegExp(rule.pattern).test(value)) throw new Error(`Invalid facts export pattern at ${path}.`);
  if (rule.minimum !== undefined && value < rule.minimum) throw new Error(`Invalid facts export minimum at ${path}.`);
  if (types.object(value)) {
    for (const name of rule.required ?? []) if (!Object.hasOwn(value, name)) throw new Error(`Missing facts export field ${path}.${name}.`);
    for (const [name, child] of Object.entries(rule.properties ?? {})) if (Object.hasOwn(value, name)) check(value[name], child, path + '.' + name);
  }
  if (Array.isArray(value)) {
    if (rule.minItems !== undefined && value.length < rule.minItems) throw new Error(`Invalid facts export length at ${path}.`);
    if (rule.items) value.forEach((item, i) => check(item, rule.items, `${path}[${i}]`));
  }
}
export function validateFacts(value) { check(value, schema, '$'); return value; }
