import { parseArgs } from 'node:util';
import { readFile, realpath } from 'node:fs/promises';
import { resolve, relative, isAbsolute, join } from 'node:path';
import { parseJson, atomic, directory } from './run-storage.mjs';
import { findResearch } from './run-reuse.mjs';
import { startRun, nextTask, peekTask, releaseTask, submitTask, registerSource, heartbeat, runStatus, retryTask, continueRun, blockRun, reassessRun, verifyKeys, approveRun, refreshRun } from './research-run.mjs';

// Every command answers compactly by default: a coordinator calls these many times, and each reply
// costs it time and context. The full task payload goes to a file its worker reads; --verbose shows all.
function compact(result) {
  if (!result || typeof result !== 'object' || !Array.isArray(result.tasks)) return result;
  const { tasks, ...rest } = result, summary = {};
  for (const task of tasks) summary[task.status] = (summary[task.status] ?? 0) + 1;
  const active = tasks.filter(task => ['ready', 'leased'].includes(task.status)).map(({ id, kind, status, section, questions, worker }) => ({ id, kind, status, ...(section ? { section } : {}), ...(questions ? { questions } : {}), ...(worker ? { worker } : {}) }));
  return { ...rest, task_summary: summary, active_tasks: active };
}
async function taskFile(root, task) {
  const folder = join(root, '.harness-research', 'tasks'); await directory(folder);
  const name = `.harness-research/tasks/${task.id}-attempt-${task.attempt}.json`;
  await atomic(join(root, name), JSON.stringify(task, null, 2) + '\n');
  const { id, kind, run, worker, lease, attempt, expires, section, questions } = task;
  return { id, kind, run, worker, lease, attempt, expires, ...(section ? { section } : {}), questions: (questions ?? []).map(question => question.id), file: name, brief: task.brief };
}

export async function runCli(argv) {
  const { values, positionals } = parseArgs({ args: argv, allowPositionals: true, options: {
    project: { type: 'string' }, run: { type: 'string' }, topic: { type: 'string' }, source: { type: 'string', multiple: true }, sources: { type: 'string' }, claims: { type: 'string' }, about: { type: 'string' }, depth: { type: 'string' }, 'allow-web': { type: 'boolean' }, 'plan-only': { type: 'boolean' }, 'source-mode': { type: 'string' }, 'guidance-task': { type: 'string' },
    worker: { type: 'string' }, harness: { type: 'string' }, task: { type: 'string' }, lease: { type: 'string' }, attempt: { type: 'string' }, file: { type: 'string' }, origin: { type: 'string' }, title: { type: 'string' }, publisher: { type: 'string' }, standing: { type: 'string' }, given: { type: 'string' }, id: { type: 'string' }, 'original-file': { type: 'string' }, partial: { type: 'string' }, 'source-date': { type: 'string' }, transcribed: { type: 'boolean' }, pages: { type: 'string' }, limits: { type: 'string' }, reason: { type: 'string' }, verbose: { type: 'boolean' }, help: { type: 'boolean', short: 'h' },
    keys: { type: 'string' }, key: { type: 'string', multiple: true }, again: { type: 'string' }, by: { type: 'string' }, revision: { type: 'string' }, from: { type: 'string', multiple: true }, in: { type: 'string' }, query: { type: 'string' },
  } });
  const [action, ...extra] = positionals;
  const allowed = {
    start: ['topic', 'source', 'sources', 'claims', 'about', 'depth', 'allow-web', 'plan-only', 'source-mode', 'guidance-task', 'from'],
    next: ['worker', 'harness'], peek: ['worker', 'harness'], release: ['task', 'worker', 'lease', 'attempt'], submit: ['task', 'worker', 'lease', 'attempt', 'file'],
    source: ['task', 'worker', 'lease', 'attempt', 'file', 'origin', 'title', 'publisher', 'standing', 'given', 'id', 'original-file', 'source-date', 'transcribed', 'pages', 'limits', 'partial'],
    heartbeat: ['task', 'worker', 'lease', 'attempt'], status: [], retry: ['task'], continue: ['file'], block: ['reason'], reassess: ['again', 'reason'],
    verify: ['keys', 'key'], approve: ['by', 'revision'], refresh: [],
  };
  if (values.help || !action || action === 'help') return { usage: 'node scripts/harness-research.mjs research start|next|peek|submit|source|heartbeat|release|status|retry|continue|block|reassess|verify|approve|refresh --project DIR [options] [--verbose]; research find --in DIR [--query TEXT]', note: 'The harness does the research; this helper manages durable tasks and evidence. Start requires --topic, or --from PATH to begin from earlier research; all writes after start bind the current --run. Task writes require --task --worker --lease --attempt. next writes the full task to the file it names; --verbose prints full JSON. reassess --again ID,... [--reason TEXT] researches chosen questions again. verify reads --keys FILE (or --key KEY) and reports what became of each cited fact. approve --by NAME [--revision N] records an approval. refresh re-reads the web sources of a finished run.' };
  // find searches a directory for research folders rather than working in one project.
  if (action === 'find') {
    if (extra.length || !values.in) throw new Error('research find needs --in DIR (and optionally --query TEXT).');
    for (const name of Object.keys(values)) if (!['in', 'query', 'verbose'].includes(name)) throw new Error(`--${name} is not valid for research find.`);
    return findResearch({ dir: values.in, query: values.query });
  }
  if (extra.length || !Object.hasOwn(allowed, action) || !values.project) throw new Error('Choose a research action and --project DIR.');
  for (const name of Object.keys(values)) if (!['project', 'run', 'verbose', ...allowed[action]].includes(name)) throw new Error(`--${name} is not valid for research ${action}.`);
  const verbose = Boolean(values.verbose), output = result => verbose ? result : compact(result);
  if (action === 'start' && values.run) throw new Error('research start creates a new run; omit --run.');
  // Reading commands may name the run to make sure it is the one they mean; writes must.
  // Approval binds the content and, with --revision, the exact output the person saw.
  if (!['start', 'status', 'verify', 'approve'].includes(action) && !values.run) throw new Error('Supply the current --run ID.');
  if (['submit', 'source', 'heartbeat', 'release'].includes(action)) for (const name of ['task', 'worker', 'lease', 'attempt']) if (!values[name]) throw new Error(`Task writes require --${name}.`);
  const root = await realpath(resolve(values.project)).catch(error => {
    if (error.code === 'ENOENT') throw new Error(`Project folder ${resolve(values.project)} does not exist; create it first or pass an existing --project.`);
    throw error;
  });
  const projectFile = async file => isAbsolute(file) ? relative(root, await realpath(file)) : file;
  const sourceInput = async source => {
    if (typeof source === 'string') return /^https?:\/\//i.test(source) ? source : projectFile(source);
    return { ...source, ...(source.file ? { file: await projectFile(source.file) } : {}), ...(source.original_file ? { original_file: await projectFile(source.original_file) } : {}) };
  };
  const json = async file => parseJson(await readFile(isAbsolute(file) ? file : resolve(root, file), 'utf8'));
  // A sources list is a JSON array, or plain lines: a path or link, optionally a tab and a title. # starts a comment.
  const sourceListFile = async file => {
    const content = await readFile(isAbsolute(file) ? file : resolve(root, file), 'utf8');
    if (content.trimStart().startsWith('[') || content.trimStart().startsWith('{')) return parseJson(content);
    return content.split(/\r?\n/).map(line => line.trim()).filter(line => line && !line.startsWith('#')).map(line => {
      const [origin, ...title] = line.split('\t'); const named = title.join('\t').trim();
      if (!named) return origin.trim();
      return /^https?:\/\//i.test(origin) ? { origin: origin.trim(), title: named } : { origin: origin.trim(), file: origin.trim(), title: named };
    });
  };
  // Cited keys: a JSON array of keys, or any file citing them (an outline, a draft with [R:key] markers).
  const keyFile = async file => {
    const content = await readFile(isAbsolute(file) ? file : resolve(root, file), 'utf8');
    if (content.trimStart().startsWith('[')) {
      let list; try { list = parseJson(content); } catch { list = null; }
      if (Array.isArray(list) && list.every(item => typeof item === 'string')) return list;
    }
    return [...new Set(content.match(/fact-[a-f0-9]{32}/g) ?? [])];
  };
  const args = { ...values };
  switch (action) {
    case 'start': {
      const sourceList = values.sources ? await sourceListFile(values.sources) : [];
      if (!Array.isArray(sourceList)) throw new Error('--sources requires a JSON array, or one path or link per line.');
      const selected = [...(values.source ?? []), ...sourceList];
      const claims = values.claims ? await json(values.claims) : [];
      if (!Array.isArray(claims)) throw new Error('--claims requires a JSON array.');
      return output(await startRun({ project: values.project, topic: values.topic, sources: await Promise.all(selected.map(sourceInput)), claims: await Promise.all(claims.map(async claim => ({ ...claim, file: await projectFile(claim.file) }))), aboutFile: values.about ? await projectFile(values.about) : undefined, depth: values.depth, allowWeb: values['allow-web'], sourceMode: values['source-mode'], planOnly: values['plan-only'], guidanceTask: values['guidance-task'], from: values.from ?? [] }));
    }
    case 'next': { const result = await nextTask(args); return output(verbose || !result.task ? result : { ...result, task: await taskFile(root, result.task) }); }
    case 'peek': return output(await peekTask(args));
    case 'release': return output(await releaseTask(args));
    case 'submit': if (!values.file) throw new Error('Submission requires --file result.json.'); return output(await submitTask({ ...args, data: await json(values.file) }));
    case 'source': return output(await registerSource({ ...args, data: { file: values.file ? await projectFile(values.file) : null, origin: values.origin, title: values.title, publisher: values.publisher, standing: values.standing, given: values.given, id: values.id, original_file: values['original-file'] ? await projectFile(values['original-file']) : undefined, source_date: values['source-date'], transcribed: values.transcribed, pages: values.pages, limits: values.limits, partial: values.partial } }));
    case 'heartbeat': return output(await heartbeat(args));
    case 'status': return output(await runStatus(args));
    case 'retry': return output(await retryTask(args));
    case 'continue': return output(await continueRun({ ...args, ...(values.file ? { plan: await json(values.file) } : {}) }));
    case 'block': return output(await blockRun(args));
    case 'reassess': return output(await reassessRun({ ...args, again: values.again ? values.again.split(',').map(id => id.trim()).filter(Boolean) : [] }));
    case 'approve': return output(await approveRun(args));
    case 'refresh': return output(await refreshRun(args));
    case 'verify': {
      const keys = [...(values.keys ? await keyFile(values.keys) : []), ...(values.key ?? [])];
      if (!keys.length) throw new Error(values.keys ? `${values.keys} cites no fact keys.` : 'Supply --keys FILE or --key KEY.');
      return verifyKeys({ project: values.project, run: values.run, keys });
    }
  }
}
