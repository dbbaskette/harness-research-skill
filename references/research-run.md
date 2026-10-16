# Research through the skill

The person gives a topic, audience and starting sources. You conduct the research
with the harness's tools; the helper is your ledger and task checklist. Do not ask
the person to prepare JSON, drive a command loop or install a service. Respect
settled scope, existing authorization and the requested completion boundary.

## Start or resume

Commands use the installed runtime returned by the bootstrap. An explicitly
supplied development runtime is valid for isolated testing; disclose its local
guidance/version instead of claiming a public-main refresh.
For installed use, pass `--guidance-task TASK` from the bootstrap's saved task;
the helper verifies that pin offline and records its exact guidance identity.
Omit it only for an explicitly supplied local runtime/guidance, which is reported
as local runtime guidance. Resume the saved bootstrap task before continuing a run.

```sh
node scripts/harness-research.mjs research start --project DIR --topic "TOPIC" \
  --source sources/selected-reference.pdf --depth light
```

Repeat `--source` for more selected references or omit it when none were supplied.
`--sources FILE` accepts an array of paths/URLs or `{origin,file,title}` entries.
Copy selected local originals into the project first. `--allow-web` authorizes
additional public sources; otherwise use selected references only. Selected links
may be read as selected sources. `--about FILE` provides audience/context.
`--claims FILE` is an array of `{file,quote,start}` target objects; offsets count
Unicode characters. Targets are not automatically evidence references and cannot
establish their own assertions.

`start` creates durable state and a partial report, not an agent. Keep its run ID.
Resume with `research status --project DIR` and take tasks from that same run.
`--plan-only` holds after planning; `research continue --project DIR --run RUN`
releases it, optionally with `--file PLAN` for a validated edit. Do not add an
approval the caller did not request. Honor broad-topic decisions and studio gates.

## Work with the harness

Use your actual invocation ID as the worker identity. Parent/child invocations
have distinct IDs; changing a role name in the same context is not another agent.

```sh
node scripts/harness-research.mjs research next --project DIR --run RUN --worker INVOCATION_ID
```

The task includes its stage brief, sources, questions, run ID, `id`, worker,
`lease`, `attempt` and expiry. Follow the brief using your own tools. Independent
tasks may run in authorized subagents or sequential separate invocations.
A null task means inspect `waiting_for` and status: it can mean a live lease,
plan hold or the need for an eligible checker, not completed research.

Submit a project-local result file with the exact lease tuple:

File arguments resolve relative to `--project`, even when the command runs from
the installed runtime. Absolute paths inside that project are accepted too.

```sh
node scripts/harness-research.mjs research submit --project DIR --run RUN \
  --task TASK --worker INVOCATION_ID --lease TOKEN --attempt N --file result.json
```

Renew long work with `research heartbeat` and the tuple before expiry. An expired
attempt cannot submit after reassignment. Refusals return actionable `errors`,
record an unsuccessful attempt and retain no partial facts; take the task again
and correct the cause. After three attempts it is blocked, not an invented
`unavailable` finding. Address the cause, then use `research retry --project DIR
--run RUN --task TASK` to reopen it. Worker crashes can be submitted as
`{"error":{"message":"Concrete failure"}}`.

### Sources

Read the original, save readable text with exact wording and locators, and register
it through the current source/research task's lease. Mark chart/scan transcriptions.

```sh
node scripts/harness-research.mjs research source --project DIR --run RUN \
  --task TASK --worker INVOCATION_ID --lease TOKEN --attempt N \
  --file sources/reference.txt --title "Source title" --publisher "Publisher"
```

A source task binds its selected original automatically. From a research task,
`--given given-ID` identifies a selected reference. Found sources require public
permission and `--origin` HTTP(S) URL. Where relevant use `--standing
primary|secondary|community`, `--source-date YYYY-MM-DD`, `--original-file PATH`,
or `--transcribed --pages 4-6`. For an unreadable selected source, omit `--file`
and give a concrete `--limits` reason. Submit its source task as
`{"sources":["the-returned-source-id"]}`.
Retain excerpts within source-tool use limits and mark partial coverage in
`--limits`; a summary or translation is not the original quoted text.

### Plan and research

Plan results contain `scope`, `sections` (`id`,`name`), optional `subjects`
(`id`,`name`), and `questions` (`id`,`section`,`subject`,`kind`: `open` or `claim`, `question`, plus
the exact `claim` object for claim questions). Include all requested claims.
Light is about 20 questions; do not pad a narrow request or fixed claim set.

Research result shape:

```json
{"coverage":"answered","facts":[{"statement":"One atomic assertion naming its subject.","as_of":null,"quotes":[{"source":"registered-source-id","quote":"The inspected original source wording.","locator":"Page or section"}]}],"gaps":[]}
```

Facts are single sentences of at most 40 words, with 1–5 exact source quotes of
20–900 characters each. Every number must occur in its quotes, preserving decimal
and version distinctions; that filter does not prove semantic support. Comparison
facts must name their subject. An honest `not answered` can contain no facts and
gaps such as `{kind:"insufficient",reason:"Concrete limitation",sources:[IDs]}`.
Source-access limitations may be assessed gaps; execution failures are not absence
of evidence.

### Independent checking

Assign checks to an authorized fresh invocation that researched none of the
assigned questions. At light depth it checks a whole section. Give it the raw
sources and candidate facts, not private reasoning or an intended verdict. It
opens the originals, reads context, and returns:

```json
{"facts":[{"key":"assigned-fact-key","result":"confirmed"}],"inspected_sources":[{"source":"source-id","sha256":"extraction-hash-from-task","original_sha256":"original-hash-from-task-or-null","read_original":true}],"assessments":[{"id":"question-id","coverage":"answered","gaps":[]}]}
```

Each fact may instead be `narrowed` with a supported `statement` and `reason`, or
`rejected` with a reason. Claim assessments also give `verdict`: supported,
contradicted or insufficient. Assess every assigned fact and question. After all
facts are rejected, do not keep `answered`; supply a concrete assessed gap.
Revision attestations do not mean the helper independently inspected the original.

If independent checking is unavailable, run `research block --project DIR --run
RUN --reason "Independent checking is unavailable"`, save the partial report and
explain the block. Renaming yourself or claiming an unavailable model ran is invalid.

### Cross-check and writing

Cross-check results contain `merges`, `conflicts`, `superseded` and `missing`
arrays, empty when none apply. Merge entries name `canonical`, `duplicates` and
a reason; different wording needs `same_assertion:true` and compatible context.
Conflicts name fact keys and a note. Supersession names `fact`,`by`,`note`.
Missing angles name an existing section/subject and a focused question. The
helper schedules one bounded gap round using the same research/check contracts.

Writing results contain each assigned question exactly once:

```json
{"questions":[{"id":"question-id","headline":{"sentence":"The supported one-line answer.","facts":["confirmed-fact-key"]},"answer":[{"sentence":"A supported explanatory sentence.","facts":["confirmed-fact-key"],"paragraph":1}],"gaps":[]}]}
```

Every factual headline and sentence needs current keys and supported numbers.
Use up to four paragraphs; explain conflicts, dates and limitations without
recommendations beyond the facts. Preserve gap IDs. A question assessed `not
answered` instead has `headline:{kind:"gap",gaps:[IDs]}`, `answer:[]` and those
gap IDs; the helper renders the bounded gap message. At standard/deep a separate
writing reviewer returns the same structure after cutting overstatement and
cannot add fact references. Light omits independent prose review; disclose it.

## Return the saved report

Refresh `research status --project DIR`, open its actual report and verify the
saved run/revision. `complete` and `complete-with-gaps` have finished assessments;
return `research/report.md` with a cited synthesis and important gaps. Facts,
brief and plan live next to it. `research/output.json` commits their shared
run/revision and hashes; `status` repairs an interrupted export from durable state.
The [facts export schema](facts.schema.json) documents the machine-readable contract.

`blocked` and `stale` are incomplete: name the cause and link the partial report
when it exists. Original/source edits invalidate current use; stale facts are
excluded from the current checked-facts brief. Manual `plan`/`record` runs retain
their own references and semantics but cannot bypass a queued run's checking.
Reuse/verify/refresh commands remain later milestones; do not claim them in 0.9.0.
