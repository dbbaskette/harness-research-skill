# Research a topic with Claude Code or Codex: vetted, cited facts

Date: 2026-10-15. Status: draft 5, after the owner's review. Issue:
[harness-research-skill#9](https://github.com/dbbaskette/harness-research-skill/issues/9).

## What it is for

A topic and, optionally, some starting sources go in: links, and documents such as PDFs.
What comes out is a report of facts about that topic with their citations, for people and
studios to use as references:

- Each fact is one sentence that stands on its own.
- Each fact quotes, exactly, the saved text of a source.
- Each fact has been checked by a second agent that did not write it.
- Nothing is concluded from the facts. There is no answer, summary or recommendation: the
  caller decides what the facts mean.
- Coverage is planned and shown: for a comparison, every subject is researched on every
  dimension, and the report shows where the facts are thin.

"Vetted" means traceable and checked for support. It does not mean true: a fact quoted
correctly from a wrong or out-of-date source is still wrong. Each fact therefore shows where
it came from, what kind of source that is, and the date it holds for, so the reader can judge.

## The split: the harness does the work, the helper keeps the books

Claude Code or Codex (the harness) does all the work, with everything it has: web search and
fetch, reading PDFs, Word files, slides, charts and scanned pages, its browser and other
connections, its subagents running side by side, and its own judgement.

`harness-research` (the helper) does no research, fetching or reading. It keeps the books and
referees:

| The harness | The helper |
| --- | --- |
| Reads the person's sources and finds new ones | Holds the run, its stages and its tasks, and hands out the next one |
| Saves each source's text and registers it | Pins each registered text by hash |
| Plans the questions | Lays the plan out as a grid of subjects and dimensions |
| Writes the facts | Refuses a quote that is not in its source's text, and a number that is not in its quote |
| Checks other workers' facts against the originals | Makes sure no worker checks its own facts |
| Finds duplicates, conflicts and missing angles | Refuses references to facts that do not exist |
| Runs several subagents at once | Leases tasks so they never collide, and returns abandoned ones |
| | Refuses to call the run finished until every stage is done |
| | Writes the report, `facts.json` and `brief.md` |

Agents are strong researchers and weak bookkeepers: they skip steps, stop early, paraphrase a
quote or round a number. The helper is what keeps a run complete and its citations honest;
the harness is what makes the research good.

## Why

harness-research today is a ledger: it saves a plan, checks that each recorded quote is in its
source, and rewrites a report. The research is done by whoever calls it, and three studios
each do it with their own copy of the code:

| | Training | Presentation | Blog |
| --- | --- | --- | --- |
| Orchestration | `runner/engine.py` | `runner/research_steps.py` | `scripts/studio_research/steps.py` (not committed) |
| Worker tools | copy of Presentation's | `runner/worker_tools.py` | `scripts/studio_research/tools.py` (not committed) |
| Workers at once | 3 | 3 | 1 |
| After 3 failed tries | question stays pending | question stays pending | records a made-up `unavailable` |

The copies have drifted, and their workers are confined to a few hand-written tools, so they
cannot read a chart, use the harness's own fetch, or start subagents.

The output is also weaker than it looks. The one standalone report I could find on this
computer (Valkey vs Redis, 8 October) had nine broad questions, each marked "supported" by a
single quote. The first summary claims caches, sessions, counters and rankings; its only
quote is "Valkey is a data structure server." The checks passed.

## Commands

The harness runs these; people do not.

```sh
# Start a run with the topic and the person's sources (paths or links).
node scripts/harness-research.mjs research start --project DIR --topic TEXT \
  [--source PATH_OR_URL ...] [--sources LIST_FILE] [--about FILE] [--allow-web] \
  [--depth quick|standard|deep] [--plan-only]

# Take the next task, then hand back its result.
node scripts/harness-research.mjs research next --project DIR --worker NAME
node scripts/harness-research.mjs research submit --project DIR --task ID --file result.json

# Register the text of a source the harness has saved.
node scripts/harness-research.mjs research source --project DIR --file research/sources/NAME.md \
  --origin URL_OR_PATH --title TEXT [--standing primary|secondary|community] \
  [--transcribed --pages 4-6]

# Where the run stands: stages, tasks, coverage, what is missing.
node scripts/harness-research.mjs research status --project DIR
```

`plan`, `record`, `status` and `migrate` stay as they are, for callers that research by hand.

## The stages

| Stage | Tasks | Produces |
| --- | --- | --- |
| 0. Sources | one per source the person gave | the saved text of each, registered |
| 1. Plan | one | subjects, dimensions and questions |
| 2. Research | one per question | facts with quotes |
| 3. Check | one per question, never to the worker that researched it | each fact confirmed, narrowed or rejected |
| 4. Cross-check | one | duplicates, conflicts, superseded facts, missing angles |
| 5. Fill gaps | the missing angles as new questions, researched, checked and cross-checked once | more facts, at `standard` and `deep` |
| 6. Write | none: the helper | `research/report.md`, `facts.json`, `brief.md` |

`research next` hands out tasks in that order, several at once where they are independent, so
a harness can give one to each subagent. A task is leased to the worker that took it; if that
worker does not submit in time, the task goes back on the queue. A task that fails three times
is shown as `failed` with its reason; it is never recorded as a finding. `research status`
says the run is complete only when every stage is done.

### 0. Sources

Each source the person gave becomes a task: read it, save its text, register it.

- **The harness saves the text, word for word,** as `research/sources/<name>.md`, and
  registers it with `research source`. The text must be the source's own words. A summary, a
  translation or a tidied version is not a source, because every quote is checked against
  this text.
- **Documents:** the harness reads PDFs, Word files and slides itself. It may use whatever
  extraction it has; Claude Code and Codex can both read these formats.
- **What has no plain text,** such as a chart, a scanned page or a table, the harness reads and
  writes out, and registers with `--transcribed --pages`. Facts quoting it are marked as
  coming from the harness's reading of those pages, and the checker reads the same pages.
- **Links:** the harness fetches them with its own tools. A page that needs signing in can be
  read if the person's session can reach it, for example through its browser; otherwise it is
  a gap, and the person can save it as a PDF and give that instead.
- **Sources the person gives are always `primary`.** The helper sets that when they are
  registered. Sources found during research are labelled by the harness: `primary` (the
  subject's own documentation, specifications, announcements, standards or filings),
  `secondary` (press, analysts) or `community` (forums, personal blogs).
- A source that cannot be read is registered with its reason, so the report shows it as a gap
  rather than dropping it.
- New sources found during research are saved and registered the same way.
- Without `--allow-web`, only the given sources are used. With it, the harness may also search
  and fetch.

### 1. Plan: subjects, dimensions and questions

A fixed number of questions does not fit every topic. "Redis vs Valkey" needs a technical
dive into two products and a comparison; a narrow fact-check needs five questions. So the
plan is built from the shape of the topic:

- **Subjects:** the things researched. One for a dive ("Valkey"), two or more for a
  comparison.
- **Dimensions:** the aspects every subject is researched on. For Redis vs Valkey: origin and
  governance; licensing and its history; release history and versions; architecture and
  threading; data types and commands; persistence; replication and failover; clustering;
  memory efficiency; performance claims and benchmarks; modules, search, JSON and vectors;
  security; client and tooling support; managed cloud offerings; enterprise features and
  support; compatibility and migration; community and contributors; known problems.
- **Questions:** one per subject and dimension, so both products get the same depth and their
  facts line up, plus cross-cutting questions that belong to neither alone (how the fork
  happened, how to migrate between them, what the major cloud providers changed).

Redis vs Valkey at `deep` comes to about 2 × 18 + 6 = 42 questions.

| `--depth` | Dimensions | Facts per question | Gap round |
| --- | --- | --- | --- |
| `quick` | the 6 to 8 that matter most | up to 10 | no |
| `standard` (default) | 10 to 14 | up to 20 | yes |
| `deep` | all that apply | up to 30 | yes |

- The plan task uses the topic, the `--about` text (who the research is for and why) and the
  saved sources. It drops dimensions the topic does not need and adds ones the sources raise.
- Each question is `open` (most) or a `claim` to test.
- The plan is saved as today and written as `research/plan.json` and a readable
  `research/plan.md`, laid out as the subject and dimension grid.
- `--plan-only` stops after planning, so a person or a studio can approve the grid and
  continue.
- The plan limit of 30 questions rises to 80.

### 2. Research a question

The task gives the question, the topic, the `--about` text, the registered sources and the
brief. The harness researches it however it judges best, and hands back:

```json
{"coverage": "answered | partly answered | not answered",
 "verdict": "supported | contradicted | insufficient   (claim questions only)",
 "facts": [{"statement": "...", "as_of": "2025-05-01",
            "quotes": [{"source": "NAME", "quote": "..."}]}],
 "gaps": "what the question still lacks"}
```

The helper refuses a submission, with a reason the harness can act on, when:

- A quote is not in its registered source. Quotes are found exactly, then allowing for
  differences in spacing, quote marks and dashes, and stored in the source's own wording. 20
  to 900 characters each, 1 to 5 per fact.
- **A number in a statement is not in any of its quotes.** Numbers, years and version strings
  are compared after normalising separators. This catches the most common invented detail
  before any agent judges anything.
- A statement is more than one sentence or 40 words, or does not name its subject.
- There are more facts than the depth allows.

### 3. Check a question's facts

Given only to a worker that did not research the question. Where the person has both Claude
Code and Codex, the brief suggests the other one checks: one model is more likely to miss its
own kind of mistake.

- The checker reads each fact, its quotes and the text around them, and **opens the original
  source itself** (the page, the PDF, the pages a transcript names) to confirm the quote is
  really there. This also catches a saved text that is not the source's own words.
- For each fact it returns `confirmed`, `narrowed` (with the narrower statement the quotes do
  support, which must pass the number rule) or `rejected` (with a reason).
- Narrowed facts replace the original, which is kept. Rejected facts move to a rejected list
  shown at the end of the report, never deleted.

### 4. Cross-check the set

One task reads every checked fact: statements, keys, subjects, dimensions, sources, dates and
standing. It hands back references to existing facts only:

- **Duplicates,** merged into one fact that keeps every quote, so it shows how many
  independent sources back it.
- **Conflicts,** with one line on how they differ. Both stay; the report shows them side by
  side.
- **Superseded:** an older fact that a newer one replaces, such as a licence that has since
  changed.
- **Missing angles:** what the set does not cover that the topic needs.

### 5. Fill the gaps

At `standard` and `deep`, the missing angles become new questions, which are researched,
checked and cross-checked once. Only one round, so a run always ends.

### 6. Output

All in `research/`, where a person will look:

- **`research/report.md`**, a reference document:
  - A header: topic, date, depth, scope, the sources given, how many facts and sources, and how
    the facts were checked.
  - **A coverage grid** for subjects and dimensions: how many checked facts each cell has, and
    which cells are partly or not answered.
  - The facts, by dimension, with each subject's facts side by side so a comparison can be read
    across. Each fact shows its citation numbers, its as-of date, whether it was narrowed or
    transcribed, and "one source" when only one publisher backs it.
  - Conflicts, superseded facts and missing angles.
  - Gaps: unanswered cells, failed tasks and sources that could not be read, with why.
  - Sources, numbered: title, a clickable URL or the file name, publisher, standing, and
    "given" or the date saved.
  - Rejected facts, with the checker's reasons, for anyone auditing the run.
- **`research/facts.json`**, schema 1, the same content for programs: subjects, dimensions,
  questions, sources with their provenance (`given`, `found` or `transcribed`, or `caller`
  for a file quoted through `record`), facts with their checks and citations, conflicts,
  superseded, missing, rejected and counts. A fact's `key` is its question ID and a short hash
  of its statement, such as `valkey.licensing.3fa9c2`. It stays the same when the run is
  repeated and the fact is found again, so a deck, a training or a blog can cite it and later
  check it; each citation also carries the hash of its quote.
- **`research/brief.md`**: every fact with its key, one per line, no quotes. The shortest
  context to hand a downstream worker.

## Running it

### In a person's session

When a person asks their Claude Code or Codex to research a topic, the skill's guidance tells
it to:

1. Run `research start` with the topic and the person's sources.
2. Show the plan grid when the person wants to approve it.
3. Work the queue: start several subagents where it can, each taking tasks with `research
   next`, doing them and submitting them, until none are left. Without subagents, work
   through the tasks in turn.
4. Stop only when `research status` says the run is complete, then point the person to the
   report.

The briefs, one per stage, are in the runtime and come with each task, so every worker gets
the same instructions however it was started.

### From a studio

A studio starts the harness the way it already does, with one instruction: research this
topic, with these sources, at this depth, using harness-research. The harness does the rest.
A studio that wants more workers than one session's subagents can start several sessions on
the same project; the queue keeps them apart. The studio keeps only its own rules: who may
allow web research, how the topic and `--about` text are written, which documents it gives,
its gates (with `--plan-only`), and what the facts feed.

## Changes to the existing commands

- `record` also accepts facts, coverage and verdicts, so callers that research by hand get the
  same checks. Its citations are marked `caller` unless the quoted file is a registered source.
- For readers that only know `status`, an open question's coverage maps to `supported` when
  answered and `insufficient` otherwise.
- `headline` and `summary` stay accepted but are not produced by `research`.

## Not changing

- `plan`, `status` and `migrate`, staleness, locking and history.
- The rule that only exact quotes from saved text count as evidence.
- No new runtime dependencies: Node 20 or newer only. The helper does not fetch, extract or
  start agents.

## Testing

- **The queue:** every stage in order; parallel workers; leases that expire and return a task;
  three failures; a checker never given its own facts; the gap round run once; stop and
  resume; `--plan-only`; and the refusal to call a run complete while any stage is unfinished.
  Tested with scripted workers, no agent needed.
- **Submissions:** each refusal; quote placing; the number rule; transcribed sources; key
  stability across runs; merging and conflict links; references to facts that do not exist.
- **Sources:** registration, hashing, gaps, sources registered after planning.
- **Output:** `facts.json` against its schema, the coverage grid, the report's sections, links
  and numbering.
- **Live trials,** recorded in `docs/verification/`: Redis vs Valkey at `deep` with a few given
  PDFs and links, in a person's Claude Code session with subagents, and again in Codex; and one
  narrow topic from given documents alone. Timed and costed, with the reports read by a person
  and a sample of facts checked by hand against their sources.

## Release and adoption

- harness-research 0.9.0, a runtime change: `minimumRuntime` moves to 0.9.0 and Brand's pin
  follows.
- Then the studios: Blog, Presentation, Training. Each replaces its research code with one
  harness instruction and reads `research/facts.json`. Their citations move to fact keys.
- Blog's uncommitted `studio_research/tools.py` and `steps.py` are not needed.

## Build order

1. The queue: runs, stages, tasks, leases, `start`, `next`, `submit`, `source`, `status`, and
   the completeness rule.
2. Submissions: facts, the quote and number checks, checks, cross-check, the gap round, keys
   and provenance.
3. Output: the report with its coverage grid, `facts.json`, `brief.md`.
4. Briefs and guidance; a first live trial in Claude Code; fixes from it.
5. The live trial in Codex, the narrow-topic trial, and the 0.9.0 release.

## Review: how well this will work

### What it does well

- **The harness works at full strength:** its own search, fetch, document and chart reading,
  browser, subagents and judgement.
- **Every fact traces to saved text,** and a checker confirms that text against the original.
- **Every fact is checked by a worker that did not write it,** ideally the other harness.
- **Made-up numbers are refused mechanically.**
- **Coverage is planned as a grid and reported as one,** so a comparison has both sides
  researched to the same depth and thin cells are visible.
- **The steps cannot be skipped:** the queue, not the agent, decides when the run is done.
- **Far less code than the studios carry today,** and none of it duplicates the harness.

### What will still go wrong

1. **A quoted fact can still be false.** The checks prove the source says it, not that the
   source is right or current. Standing, dates and the superseded list help the reader judge.
2. **The checker is a model too.** Using the other harness reduces shared blind spots; it does
   not remove them.
3. **Saved text depends on the harness.** The helper cannot prove a saved text is the source's
   own words; the checker re-reading the original is what catches it, and a missed case would
   pass. Transcribed charts and scans are the harness's reading, marked as such.
4. **Parallelism depends on the harness.** Claude Code runs subagents side by side; where a
   harness cannot, the run is sequential unless more sessions are started on the queue.
5. **A harness reading the web can be misled by a page.** In a person's session it has
   whatever the person allowed it; a studio decides what its headless sessions may do.
6. **Depth costs.** Redis vs Valkey at `deep` is about 42 questions, each researched and
   checked, plus a gap round: very roughly $20 to $40 and 30 to 60 minutes, to be measured in
   the trials. `quick` is a fraction of that.
7. **The report is long.** A deep comparison can hold several hundred facts. The coverage grid
   and `brief.md` are the way in.

## Settled in review

- **No answer or synthesis.** Research produces facts to use as references.
- **Support check** per fact, by another worker; **question kinds**; **provenance** on every
  source and citation.
- **Topic and starting sources as input:** links and documents such as PDFs.
- **Coverage scales with the topic:** subjects × dimensions, `--depth`, and one gap round,
  instead of a fixed 8 to 20 questions.
- **The harness does all the work.** The helper does no fetching, extraction or agent starting;
  it is a queue, a set of checks and the record. No `pdftotext` dependency.
- **Private words in searches:** not a concern.

## Appendix: `facts.json`, by example

Shortened, with one entry of each kind. The values are illustrative.

```json
{
  "schema": 1,
  "run": "8f3c2a91d0e4b7a6c5f1e2d3",
  "topic": "Redis vs Valkey",
  "about": "For solutions architects advising customers on in-memory data stores.",
  "depth": "deep",
  "scope": "public-web",
  "status": "complete",
  "created_at": "2026-10-16T14:00:03Z",
  "completed_at": "2026-10-16T14:48:51Z",
  "counts": {"questions": 42, "facts": 318, "narrowed": 41, "rejected": 27,
             "sources": 96, "conflicts": 6, "superseded": 4, "failed": 0},

  "subjects":   [{"id": "redis", "name": "Redis"}, {"id": "valkey", "name": "Valkey"}],
  "dimensions": [{"id": "licensing", "name": "Licensing and its history"}],

  "questions": [
    {"id": "valkey.licensing", "subject": "valkey", "dimension": "licensing",
     "kind": "open", "round": 1,
     "question": "Under what licence is Valkey released, and has that changed?",
     "coverage": "answered", "gaps": "",
     "facts": ["valkey.licensing.3fa9c2"]},
    {"id": "fork-history", "subject": null, "dimension": "origin", "kind": "open", "round": 1,
     "question": "How and when was Valkey forked from Redis?",
     "coverage": "partly answered",
     "gaps": "No primary source gives the date the first Valkey release was tagged.",
     "facts": ["fork-history.77d1e0"]}
  ],

  "sources": [
    {"id": "s07", "title": "Valkey licence", "origin": "https://github.com/valkey-io/valkey/blob/unstable/COPYING",
     "publisher": "valkey-io", "standing": "primary", "provenance": "found",
     "saved_at": "2026-10-16T14:09:40Z", "source_date": null,
     "file": "research/sources/valkey-copying.md", "sha256": "c41e…", "limits": "none"},
    {"id": "s02", "title": "Platform architecture review", "origin": "given: docs/architecture-review.pdf",
     "publisher": null, "standing": "primary", "provenance": "transcribed", "pages": "12-13",
     "saved_at": "2026-10-16T14:01:12Z", "source_date": "2026-06-30",
     "file": "research/sources/architecture-review-p12-13.md", "sha256": "9ab0…",
     "limits": "Pages 12-13 are a chart; the text is the harness's reading of it."}
  ],

  "facts": [
    {"key": "valkey.licensing.3fa9c2",
     "statement": "Valkey is licensed under the BSD 3-Clause licence.",
     "subject": "valkey", "dimension": "licensing", "questions": ["valkey.licensing"],
     "as_of": null,
     "check": {"result": "confirmed", "by": "codex", "at": "2026-10-16T14:31:05Z"},
     "original_statement": null,
     "sources_count": 2, "best_standing": "primary",
     "conflicts_with": [], "superseded_by": null,
     "citations": [
       {"source": "s07", "quote": "Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met",
        "quote_sha256": "5d2f…", "start": 118, "locator": "COPYING, opening paragraph"}
     ]}
  ],

  "conflicts": [
    {"facts": ["redis.performance.1b2c3d", "valkey.performance.9e8f7a"],
     "note": "Each vendor's benchmark uses a different instance size and client count."}
  ],
  "superseded": [
    {"fact": "redis.licensing.aa11bb", "by": "redis.licensing.cc22dd",
     "note": "A later release added another licence option."}
  ],
  "missing": [
    {"angle": "Support lifecycle and end-of-life policy", "became": ["redis.support", "valkey.support"]}
  ],
  "rejected": [
    {"statement": "Redis Cluster supports active-active writes across regions.",
     "question": "redis.clustering",
     "reason": "The quote describes Redis Enterprise's Active-Active feature, not open-source Redis Cluster.",
     "by": "codex", "citations": [{"source": "s31", "quote": "…"}]}
  ],
  "failed": []
}
```

- **Keys** are stable: the question ID and a short hash of the statement. A deck, training or
  blog cites `valkey.licensing.3fa9c2`, and can later look the key up to check the fact still
  stands, unchanged (`quote_sha256`), not narrowed, rejected or superseded.
- **`statement` is what a consumer uses;** `original_statement` shows what a narrowed fact said
  before the checker cut it back.
- **`sources_count` and `best_standing`** let a consumer prefer facts backed by more than one
  publisher, or by primary sources. A source the person gave is always `primary`.
- **Questions list their facts and facts list their questions,** because a merged duplicate can
  answer more than one question.
- **`rejected` and `failed`** are kept for auditing. Consumers should not cite them.
