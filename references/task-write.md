# Cross-check, writing and review tasks

The contract for cross-check, writing and review tasks. Your task file's `guide`
names the section you need. Starting runs, dispatching workers and finishing are
the coordinator's part, in [research-run.md](research-run.md).

Your task file gives the run, task, worker, lease and attempt. Write the result
JSON under `research/work/` and submit it with `research submit --project DIR
--run RUN --task TASK --worker ID --lease LEASE --attempt N --file FILE`; file
paths resolve against `--project`. A refusal returns `errors` and keeps your
lease: fix them and submit again. Ten refusals end the attempt. If you cannot
finish, submit `{"error":{"message":"Concrete failure"}}`; never turn a failure
into a finding. Renew work longer than 30 minutes with `research heartbeat`.

## Cross-check and writing

Cross-check results contain `merges`, `conflicts`, `superseded` and `missing`
arrays, empty when none apply. Merge entries name `canonical`, `duplicates` and
a reason; different wording needs `same_assertion:true` and compatible context.
Conflicts name fact keys and a note. Supersession names `fact`,`by`,`note`.
Missing angles name an existing section/subject and a focused question, most
important first; the task says how many become gap questions. The gap round is
researched and checked once; standard and deep also cross-check it.

Writing results contain each assigned question exactly once:

```json
{"questions":[{"id":"question-id","headline":{"sentence":"The supported one-line answer.","facts":["confirmed-fact-key"]},"answer":[{"sentence":"A supported explanatory sentence.","facts":["confirmed-fact-key"],"paragraph":1}],"gaps":[]}]}
```

The writing task carries the section's current facts; other sections' facts are in
`research/brief.md` and may be cited by key. Every factual headline and sentence
needs current keys and supported numbers. An answered question needs 1 to the
task's `sentences_per_answer` cited body sentences (10 at light, 40 at standard
and deep) in addition to its headline, in up to four paragraphs. Say what matters
most rather than everything the facts allow; explain
conflicts, dates and limitations without recommendations beyond the facts.
Preserve gap IDs. A question assessed `not answered` instead has
`headline:{kind:"gap",gaps:[IDs]}`, `answer:[]` and those gap IDs; the helper
renders the bounded gap message. At standard/deep a separate writing reviewer
returns the same structure after cutting overstatement and cannot add fact
references. Light omits independent prose review; the report discloses it.
