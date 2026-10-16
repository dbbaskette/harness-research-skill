import { parseArgs } from 'node:util';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute } from 'node:path';
import { parseJson } from './run-storage.mjs';
import { startRun, nextTask, submitTask, registerSource, heartbeat, runStatus, retryTask, continueRun, blockRun } from './research-run.mjs';

export async function runCli(argv) {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: {
    project: { type: 'string' }, run: { type: 'string' }, topic: { type: 'string' }, source: { type: 'string', multiple: true }, sources: { type: 'string' }, claims: { type: 'string' }, about: { type: 'string' }, depth: { type: 'string' }, 'allow-web': { type: 'boolean' }, 'plan-only': { type: 'boolean' }, 'source-mode': { type: 'string' }, 'guidance-task': { type: 'string' },
    worker: { type: 'string' }, harness: { type: 'string' }, task: { type: 'string' }, lease: { type: 'string' }, attempt: { type: 'string' }, file: { type: 'string' }, origin: { type: 'string' }, title: { type: 'string' }, publisher: { type: 'string' }, standing: { type: 'string' }, given: { type: 'string' }, id: { type: 'string' }, 'original-file': { type: 'string' }, 'source-date': { type: 'string' }, transcribed: { type: 'boolean' }, pages: { type: 'string' }, limits: { type: 'string' }, reason: { type: 'string' }, help: { type: 'boolean', short: 'h' },
  } });
  const [action, ...extra] = positionals;
  const allowed = {
    start: ['topic', 'source', 'sources', 'claims', 'about', 'depth', 'allow-web', 'plan-only', 'source-mode', 'guidance-task'],
    next: ['worker', 'harness'], submit: ['task', 'worker', 'lease', 'attempt', 'file'],
    source: ['task', 'worker', 'lease', 'attempt', 'file', 'origin', 'title', 'publisher', 'standing', 'given', 'id', 'original-file', 'source-date', 'transcribed', 'pages', 'limits'],
    heartbeat: ['task', 'worker', 'lease', 'attempt'], status: [], retry: ['task'], continue: ['file'], block: ['reason'],
  };
  if (values.help || !action || action === 'help') return { usage: 'node scripts/harness-research.mjs research start|next|submit|source|heartbeat|status|retry|continue|block --project DIR [options]', note: 'The harness does the research; this helper manages durable tasks and evidence. Start requires --topic; all writes after start bind the current --run. Task writes require --task --worker --lease --attempt.' };
  if (extra.length || !Object.hasOwn(allowed, action) || !values.project) throw new Error('Choose a research action and --project DIR.');
  for (const name of Object.keys(values)) if (!['project', 'run', ...allowed[action]].includes(name)) throw new Error(`--${name} is not valid for research ${action}.`);
  if (action === 'start' && values.run) throw new Error('research start creates a new run; omit --run.');
  if (!['start', 'status'].includes(action) && !values.run) throw new Error('Supply the current --run ID.');
  if (['submit', 'source', 'heartbeat'].includes(action)) for (const name of ['task', 'worker', 'lease', 'attempt']) if (!values[name]) throw new Error(`Task writes require --${name}.`);
  const root = await realpath(resolve(values.project));
  const projectFile = async file => isAbsolute(file) ? relative(root, await realpath(file)) : file;
  const sourceInput = async source => {
    if (typeof source === 'string') return /^https?:\/\//i.test(source) ? source : projectFile(source);
    return { ...source, ...(source.file ? { file: await projectFile(source.file) } : {}), ...(source.original_file ? { original_file: await projectFile(source.original_file) } : {}) };
  };
  const json = async file => parseJson(await readFile(isAbsolute(file) ? file : resolve(root, file), 'utf8'));
  const args = { ...values };
  switch (action) {
    case 'start': {
      const sourceList = values.sources ? await json(values.sources) : [];
      if (!Array.isArray(sourceList)) throw new Error('--sources requires a JSON array.');
      const selected = [...(values.source ?? []), ...sourceList];
      const claims = values.claims ? await json(values.claims) : [];
      if (!Array.isArray(claims)) throw new Error('--claims requires a JSON array.');
      return startRun({ project: values.project, topic: values.topic, sources: await Promise.all(selected.map(sourceInput)), claims: await Promise.all(claims.map(async claim => ({ ...claim, file: await projectFile(claim.file) }))), aboutFile: values.about ? await projectFile(values.about) : undefined, depth: values.depth, allowWeb: values['allow-web'], sourceMode: values['source-mode'], planOnly: values['plan-only'], guidanceTask: values['guidance-task'] });
    }
    case 'next': return nextTask(args);
    case 'submit': if (!values.file) throw new Error('Submission requires --file result.json.'); return submitTask({ ...args, data: await json(values.file) });
    case 'source': return registerSource({ ...args, data: { file: values.file ? await projectFile(values.file) : null, origin: values.origin, title: values.title, publisher: values.publisher, standing: values.standing, given: values.given, id: values.id, original_file: values['original-file'] ? await projectFile(values['original-file']) : undefined, source_date: values['source-date'], transcribed: values.transcribed, pages: values.pages, limits: values.limits } });
    case 'heartbeat': return heartbeat(args);
    case 'status': return runStatus(args);
    case 'retry': return retryTask(args);
    case 'continue': return continueRun({ ...args, ...(values.file ? { plan: await json(values.file) } : {}) });
    case 'block': return blockRun(args);
  }
}
