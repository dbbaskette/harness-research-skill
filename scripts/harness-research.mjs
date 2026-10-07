#!/usr/bin/env node
import { parseArgs } from 'node:util';
import { readFile } from 'node:fs/promises';
import { planResearch, recordResearch, researchStatus, migrateResearch } from './lib/research.mjs';
const { values, positionals } = parseArgs({ options: { project: { type: 'string' }, file: { type: 'string' }, run: { type: 'string' }, item: { type: 'string' }, 'allow-web': { type: 'boolean' }, help: { type: 'boolean', short: 'h' } }, allowPositionals: true });
try {
  const action = positionals[0];
  if (values.help) console.log('Usage: node scripts/harness-research.mjs plan|record|status|migrate --project DIR [--file JSON] [--run ID --item ID] [--allow-web]');
  else {
    if (!values.project || positionals.length !== 1 || !['plan', 'record', 'status', 'migrate'].includes(action)) throw new Error('Choose plan, record, status or migrate and supply --project.');
    const allowed = { plan: ['project', 'file', 'allow-web'], record: ['project', 'file', 'run', 'item'], status: ['project'], migrate: ['project'] }[action];
    for (const key of Object.keys(values)) if (!allowed.includes(key)) throw new Error(`--${key} is not valid for ${action}.`);
    let result;
    if (action === 'migrate') result = await migrateResearch(values.project);
    else if (action === 'status') result = await researchStatus(values.project);
    else {
      if (!values.file) throw new Error('--file is required for plan or record.');
      const supplied = JSON.parse(await readFile(values.file, 'utf8'));
      if (action === 'plan') result = await planResearch(values.project, supplied, { allowWeb: values['allow-web'] });
      else { if (!values.run || !values.item) throw new Error('Recording requires --run and --item.'); result = await recordResearch(values.project, values.run, values.item, supplied); }
    }
    console.log(JSON.stringify(result, null, 2));
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
