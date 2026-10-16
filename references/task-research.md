# Source, plan and research tasks

The contract for source, plan and research tasks. Your task file's `guide` names
the sections you need. Starting runs, dispatching workers and finishing are the
coordinator's part, in [research-run.md](research-run.md).

Your task file gives the run, task, worker, lease and attempt. Write the result
JSON under `research/work/` and submit it with `research submit --project DIR
--run RUN --task TASK --worker ID --lease LEASE --attempt N --file FILE`; file
paths resolve against `--project`. A refusal returns `errors` and keeps your
lease: fix them and submit again. Ten refusals end the attempt. If you cannot
finish, submit `{"error":{"message":"Concrete failure"}}`; never turn a failure
into a finding. Renew work longer than 30 minutes with `research heartbeat`.

## Sources

Read the original and save its full readable text with exact wording and locators:
the whole page or document, or at least the whole relevant section, never only the
sentence you will quote. A quote is checked against its surrounding text, so text
shorter than 280 characters, or a quote that is most of its saved source, is
refused. When a tool returns only part of a page, or the source really is that
short, register it with `"partial":"reason"`; its facts are labelled. Mark chart or
scan transcriptions with `"transcribed":true,"pages":"4-6"`. Keep markup that
changes meaning: write struck-through or deleted text as `~~text~~`, never as
plain current wording, and do not cite it as current. A summary or translation
is not the original quoted text.

Reuse sources already listed in the task by their registered IDs:
`{"source":"source-id","quote":"Exact original wording.","locator":"Section"}`.
Do not register the same selected source again from a research task: without
its `given` ID a new registration is treated as a found public source. For a
new extraction of a selected reference, include its `given` ID from the task
source record.

Register new sources inside the result that uses them, and cite them by file:

```json
{"register":[{"file":"research/sources/valkey-docs.md","origin":"https://valkey.io/topics/persistence/","title":"Valkey persistence","publisher":"Valkey project","standing":"primary","source_date":"2026-09-01"}],
 "questions":[{"id":"question-id","coverage":"answered","gaps":[],
   "facts":[{"statement":"One atomic assertion naming its subject.","as_of":null,
     "quotes":[{"file":"research/sources/valkey-docs.md","quote":"The inspected original wording.","locator":"Section heading"}]}]}]}
```

The helper pins a copy of each registered text under
`research/sources/revisions/` and checks every quote against that copy, so a later
overwrite of the working file cannot change evidence. Use one file name per page
and do not reuse a name for different content. A source task binds its selected
original automatically: submit `{"register":[{"file":"...","title":"...","publisher":"..."}]}`.
For an unreadable selected source register `{"title":"...","limits":"concrete reason"}`
without a file. Found sources require public permission and an HTTP(S) `origin`;
`standing` is `primary`, `secondary` or `community`. `research source` registers one
source by command when that is easier, with the same fields as flags.

## Plan and research

Plan results contain an optional short `title`, `scope`, `sections` (`id`,`name`),
optional `subjects` (`id`,`name`), and `questions` (`id`,`section`,`subject`,`kind`:
`open` or `claim`, `question`, plus the exact `claim` object for claim questions).
Include all requested claims. Light is about 20 questions in 6 to 10 sections; do
not pad a narrow request or fixed claim set. When comparing, ask each section's
questions of every subject. A plan outside the usual size, or uneven across
subjects, is accepted with `warnings`; fix it or say why it is right.

At light depth a research task covers a whole section; at standard and deep, one
question. Return every assigned question in `questions` as above. Record at most
the task's `facts_per_question` facts per question (8 at light, 20 at standard, 30
at deep): the strongest, not a quota. Facts are single sentences of at most 40
words, with 1–5 exact source quotes of 20–900 characters.
Every number must occur in its quotes, including spelled-out numbers ("five"),
preserving decimal and version distinctions; that filter does not prove semantic
support. Comparison facts must name their subject. An honest `not answered` can
contain no facts. Every gap names what it rests on: the sources inspected (source
IDs, or files registered in the same result) or, when nothing could be read, the
access attempts:
`{"kind":"insufficient","reason":"Concrete limitation","sources":["research/sources/x.md"]}`
or `{"kind":"unavailable","reason":"...","attempts":["https://... returned 403"]}`.
Source-access limitations may be assessed gaps; execution failures are not absence
of evidence.
