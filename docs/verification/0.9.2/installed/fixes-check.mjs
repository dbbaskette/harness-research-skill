// Checks each 0.9.2 fix through an installed harness-research CLI on a synthetic project.
// Usage: node fixes-check.mjs INSTALLED_CLI WORK_DIR OUT_DIR
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, appendFileSync, rmSync, realpathSync } from 'node:fs';
import { join, relative } from 'node:path';

const [cli, work, out] = process.argv.slice(2);
if (!cli || !work || !out) throw new Error('Usage: node fixes-check.mjs CLI WORK OUT');
rmSync(work, { recursive: true, force: true }); mkdirSync(work, { recursive: true }); mkdirSync(out, { recursive: true });
const realWork = realpathSync(work), scrub = text => text.split(realWork).join('<work>').split(work).join('<work>');
const log = join(out, 'fixes-transcript.jsonl'); writeFileSync(log, '');
const checks = [];
const ok = (name, condition, detail = '') => { checks.push({ name, pass: Boolean(condition), ...(detail ? { detail: scrub(String(detail)) } : {}) }); if (!condition) throw new Error(`Check failed: ${name} ${detail}`); };
let step = 0;
function hr(args) {
  step++;
  let stdout = '', stderr = '', exit = 0;
  try { stdout = execFileSync('node', [cli, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
  catch (error) { exit = error.status ?? 1; stdout = error.stdout ?? ''; stderr = error.stderr ?? ''; }
  appendFileSync(log, scrub(JSON.stringify({ step, args, exit, stdout: stdout.trim(), stderr: stderr.trim() })) + '\n');
  return { exit, json: stdout.trim().startsWith('{') ? JSON.parse(stdout) : null, message: (stderr || stdout).trim() };
}
const write = (project, file, data) => { mkdirSync(join(project, file, '..'), { recursive: true }); writeFileSync(join(project, file), typeof data === 'string' ? data : JSON.stringify(data, null, 2) + '\n'); };

// 1. A missing project folder is reported plainly.
const missing = join(realWork, 'not-created');
let r = hr(['research', 'start', '--project', missing, '--topic', 'Missing folder']);
ok('missing project folder gets a plain message', r.exit !== 0 && /does not exist/.test(r.message) && !/ENOENT/.test(r.message), r.message);

// A project with one selected source, taken through to a research task.
const project = join(realWork, 'projects', 'checkpoint');
const text = 'The checkpoint interface reports the total number of frames in the log file and the number of frames that have been checkpointed, so a caller can tell how much of the log remains to be copied back into the database file. Automatic checkpoints are passive and never wait for readers or writers. This synthetic note exists only to check the release.\n';
mkdirSync(join(project, 'sources'), { recursive: true }); writeFileSync(join(project, 'sources/note.txt'), text);
const started = hr(['research', 'start', '--project', project, '--topic', 'Checkpoint reporting', '--source', 'sources/note.txt']).json;
const run = started.run;
const take = worker => {
  const next = hr(['research', 'next', '--project', project, '--run', run, '--worker', worker, '--harness', 'claude-code']).json.task;
  return { ...next, full: JSON.parse(readFileSync(join(project, next.file), 'utf8')) };
};
const submit = (task, data, name) => { write(project, `research/work/${name}.json`, data); return hr(['research', 'submit', '--project', project, '--run', run, '--task', task.id, '--worker', task.worker, '--lease', task.lease, '--attempt', String(task.attempt), '--file', `research/work/${name}.json`]); };

// 2. peek accepts --harness, as next does.
r = hr(['research', 'peek', '--project', project, '--run', run, '--worker', 'cc-peek0001', '--harness', 'claude-code']);
ok('peek accepts --harness', r.exit === 0 && r.json.task?.kind === 'source', r.message);

const source = take('cc-coord001');
write(project, 'research/sources/note.md', text);
ok('source task accepted', submit(source, { register: [{ file: 'research/sources/note.md', title: 'Synthetic checkpoint note', publisher: 'Fixture publisher' }] }, 'source').json?.accepted);
const planner = take('cc-coord001');
ok('plan accepted', submit(planner, { scope: 'Synthetic checkpoint reporting.', sections: [{ id: 'reporting', name: 'Reporting' }], subjects: [], questions: [{ id: 'frames', section: 'reporting', kind: 'open', question: 'What does the checkpoint interface report?' }] }, 'plan').json?.accepted);

// 3. Digits inside an identifier need not appear in the quotes; a real number still must.
const research = take('cc-research1'), sourceId = research.full.sources[0].id;
const quote = 'The checkpoint interface reports the total number of frames in the log file and the number of frames that have been checkpointed';
const fact = statement => ({ questions: [{ id: 'frames', coverage: 'answered', gaps: [], facts: [{ statement, as_of: null, quotes: [{ source: sourceId, quote, locator: 'Paragraph 1' }] }] }] });
r = submit(research, fact('The sqlite3_wal_checkpoint_v2() interface reports 1000 frames in the log file.'), 'research-number');
ok('an unsupported count is still refused', r.json?.accepted === false && /1000/.test(JSON.stringify(r.json.errors)), JSON.stringify(r.json?.errors));
r = submit(research, fact('The sqlite3_wal_checkpoint_v2() interface reports the total frames in the log and the frames already checkpointed.'), 'research-identifier');
ok('an identifier with digits is accepted without those digits in the quote', r.json?.accepted === true, JSON.stringify(r.json?.errors));

// 4. A relative --from that finds nothing says where it looked.
const target = join(realWork, 'projects', 'reuse'); mkdirSync(target, { recursive: true });
r = hr(['research', 'start', '--project', target, '--from', 'checkpoint']);
ok('relative --from refusal names the folder it looked in', r.exit !== 0 && r.message.includes(join(target, 'checkpoint')) && /relative to --project/.test(r.message), r.message);
r = hr(['research', 'start', '--project', target, '--from', join(realWork, 'projects', 'nothing')]);
ok('absolute --from refusal carries no relative-path hint', r.exit !== 0 && /No saved research/.test(r.message) && !/relative to --project/.test(r.message), r.message);
r = hr(['research', 'start', '--project', target, '--from', relative(target, project)]);
ok('a correct relative --from resolves against --project', r.exit === 0 && r.json?.run, r.message);

writeFileSync(join(out, 'fixes-checks.json'), JSON.stringify({ steps: step, passed: checks.filter(c => c.pass).length, failed: checks.filter(c => !c.pass).length, checks }, null, 2) + '\n');
console.log(`${checks.filter(c => c.pass).length}/${checks.length} fix checks passed in ${step} CLI calls`);
