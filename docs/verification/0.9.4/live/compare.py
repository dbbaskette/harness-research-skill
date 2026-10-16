"""Compare the 0.9.4 live trials with their 0.9.1-limit baselines. Prints JSON."""
import json, re, sys, csv

WT, LIVE3 = sys.argv[1], sys.argv[2]

def words(text): return len(text.split())

def report_parts(path):
    text = open(path).read()
    folded = re.findall(r'<details>.*?</details>', text, re.S)
    listed = re.findall(r'Facts behind this answer:\n(.*?)(?=\n### |\n## )', text, re.S)
    evidence = sum(words(x) for x in folded) + sum(words(x) for x in listed)
    return {'report_words': words(text), 'evidence_words': evidence, 'outside_evidence_words': words(text) - evidence}

def run(facts_path, report_path, skip=()):
    f = json.load(open(facts_path))
    qs = [q for q in f['questions'] if q['id'] not in skip]
    sentences = sum(len(q.get('answer') or []) for q in qs)
    prose = sum(words(q['headline']['sentence']) if q.get('headline', {}).get('sentence') else 0 for q in qs) + sum(words(s['sentence']) for q in qs for s in q.get('answer') or [])
    per_q = {}
    for x in f['facts']:
        if x['status'] == 'confirmed':
            for q in x['questions']:
                if q not in skip: per_q[q] = per_q.get(q, 0) + 1
    out = {'run': f['run'], 'status': f['status'], 'questions': len(qs), 'confirmed_facts': sum(per_q.values()), 'max_facts_per_question': max(per_q.values()),
           'narrowed': f['counts']['narrowed'], 'rejected': f['counts']['rejected'], 'gaps': f['counts']['gaps'], 'answer_sentences': sentences, 'answer_prose_words': prose,
           'checker_invocations': len(f['checkers'])}
    if not skip: out.update(report_parts(report_path))
    return out

def ledger(path):
    rows = list(csv.DictReader(open(path), delimiter='\t'))
    by = {}
    for r in rows:
        role = r['role'].replace('gap-', '')
        by.setdefault(role, []).append(int(r['tokens']))
    return {'subagents': len(rows), 'tokens_total': sum(int(r['tokens']) for r in rows), 'by_role_mean': {k: round(sum(v) / len(v)) for k, v in by.items()}, 'by_role_range': {k: [min(v), max(v)] for k, v in by.items()}}

v091 = f'{WT}/docs/verification/0.9.1/live-acceptance/claude-code/sqlite-wal/research'
v092 = f'{WT}/docs/verification/0.9.2/live-codex/research'
c094 = f'{LIVE3}/claude/sqlite-wal/research'
x094 = f'{LIVE3}/codex/sqlite-wal/research'
claude_start = int(open(f'{LIVE3}/claude/logs/start').read()); claude_end = int(open(f'{LIVE3}/claude/logs/end').read())
codex = open(f'{LIVE3}/codex/logs/timing.txt').read().split(); codex_seconds = int(codex[5]) - int(codex[3])
usage = [json.loads(l) for l in open(f'{LIVE3}/codex/logs/turn1.jsonl') if '"turn.completed"' in l][-1]['usage']
usage_092 = json.load(open(f'{WT}/docs/verification/0.9.2/live-codex/summary.json'))['usage']
result = {
  'claude_code': {
    '0.9.1': {'wall_seconds': 1517, **ledger(f'{LIVE3}/claude/logs/ledger-0.9.1.tsv'),
              'final_run_after_follow_ups': run(f'{v091}/facts.json', f'{v091}/report.md'),
              'nine_questions_not_researched_again': run(f'{v091}/facts.json', None, skip=('checkpoint-starvation',)),
              'first_pass': {'questions': 10, 'facts': 111, 'narrowed': 14, 'gaps': 3, 'checker_invocations': 5}},
    '0.9.4': {'wall_seconds': claude_end - claude_start, **ledger(f'{LIVE3}/claude/logs/ledger-0.9.4.tsv'),
              'run': run(f'{c094}/facts.json', f'{c094}/report.md'),
              'nine_questions_not_researched_again': run(f'{c094}/facts.json', None, skip=('checkpoint-starvation',))}},
  'codex': {
    '0.9.2 (0.9.1 limits)': {'wall_seconds': 389, 'coordinator_usage': usage_092, 'run': run(f'{v092}/facts.json', f'{v092}/report.md')},
    '0.9.4': {'wall_seconds': codex_seconds, 'coordinator_usage': usage, 'run': run(f'{x094}/facts.json', f'{x094}/report.md')}},
}
print(json.dumps(result, indent=1))
