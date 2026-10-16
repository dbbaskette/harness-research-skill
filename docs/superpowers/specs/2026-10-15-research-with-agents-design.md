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
- Coverage is planned and shown: the plan is an outline of the topic, and the report shows
  which parts of it have few facts. Any topic works: a broad one ("a report on LLMs"), one
  product, a comparison, or a set of claims to check.

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
| Plans the scope, the outline and the questions | Keeps the outline and counts coverage by section |
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

## Compared with how the skill works today (0.8.1)

| | Today | This design |
| --- | --- | --- |
| **What goes in** | A plan the calling agent writes: topic, purpose, scope, any supplied documents it has already turned into text, and 1 to 30 questions | A topic, the person's links and documents, a depth and a note on who it is for. The harness writes the plan |
| **Who researches** | The calling agent, however it likes, in turn or with helpers it starts itself | The same harness, task by task from a queue, with several subagents at once |
| **The plan** | Any 1 to 30 questions, unstructured | A stated scope and an outline of sections, each with several questions, sized by depth, up to 80 questions; subjects side by side when comparing; plus one round for missing angles |
| **What a question produces** | One finding: a verdict (supported, contradicted, insufficient, unavailable), an optional headline, a summary of up to 12,000 characters, limits and up to 20 quotes | Many one-sentence facts, each with its own quotes; "answered / partly / not" for open questions and a verdict only for claims; no summary |
| **Evidence check** | The quote must appear, exactly, at the offset the agent gives, in any file in the project, including one the agent wrote itself | The quote must be in a registered source's saved text; the helper finds it, allowing for spacing, quote-mark and dash differences; every number in the fact must be in its quotes |
| **Support** | Not checked: "semantic support is the researcher's assessment" | Every fact checked by a worker that did not write it, ideally the other harness, against the original source: confirmed, narrowed or rejected |
| **Across questions** | Nothing | Duplicates merged, conflicts and superseded facts shown, missing angles researched |
| **Sources** | Supplied documents are registered with a hash; web pages are files the agent saves, with no register or label | Every source registered with a hash, a title, a publisher and a standing; the person's own sources are always primary; text read from charts or scans is marked transcribed |
| **When it is done** | When no question is pending; the guidance asks the agent to open the report and check it | When every stage is done; the helper will not say complete before then |
| **Working in parallel** | Allowed when the host permits; saves are one at a time, with "busy, retry" errors | Tasks are leased to workers, so subagents and sessions do not collide |
| **Output** | `.harness-research/research-report.md`, a per-question list in a hidden folder, and the record | `research/report.md` with coverage by section, facts in outline order (side by side when comparing), conflicts, gaps, numbered sources and rejected facts; `research/facts.json`; `research/brief.md`. The record stays |
| **Citations** | By question; no stable IDs | Stable fact keys, with a hash of each quote, that a deck, training or blog can cite and check later |
| **Studios** | Each builds its own research loop and confined worker tools (three copies) | One instruction to the harness; they read `facts.json` |

**What stays the same:** the Node-only helper; the record, its history, locking and
migration; staleness from changed inputs and sources; supplied-only versus public-web and the
`--allow-web` rule; the rule that only exact quotes count; and the `plan`, `record`, `status`
and `migrate` commands for anyone researching by hand.

**What becomes redundant:** the comparative path (`outline.yaml` and `fields.yaml` from the
retained upstream skills) does what sections and subjects now do, and could be
retired once the grid has been tried.

## Commands

The harness runs these; people do not.

```sh
# Start a run with the topic and the person's sources (paths or links).
node scripts/harness-research.mjs research start --project DIR --topic TEXT \
  [--source PATH_OR_URL ...] [--sources LIST_FILE] [--about FILE] [--allow-web] \
  [--depth light|standard|deep] [--plan-only]

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
| 1. Plan | one | the scope, an outline of sections, and their questions |
| 2. Research | one per question | facts with quotes |
| 3. Check | one per question, never to the worker that researched it | each fact confirmed, narrowed or rejected |
| 4. Cross-check | one | duplicates, conflicts, superseded facts, missing angles |
| 5. Fill gaps | the missing angles as new questions, researched, checked and cross-checked once | more facts, at `standard` and `deep` only |
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

### 1. Plan: scope, outline and questions

A fixed number of questions does not fit every topic, and neither does a grid. "A report on
LLMs" is broad; "Valkey" is one product; "Redis vs Valkey" is a comparison; "check these
claims in our deck" is a list. The plan task first decides what kind of topic it has, then
writes three things:

- **The scope:** one paragraph saying what is in and what is out, and the date the research
  is as of. A broad topic needs this most: "LLMs" could mean the mathematics, the market or
  the regulation. The scope comes from the topic, the `--about` text (who the research is for
  and why) and the person's sources, and is shown at the top of the report so a reader knows
  what was not covered on purpose.
- **The outline:** the sections the topic breaks into, in a sensible reading order.
- **The questions:** several per section, as many as the section's importance and the depth
  need. Each is `open` (most) or a `claim` to test.

For **a comparison**, the plan also names the **subjects**, and each section's questions are
asked of every subject, so both sides get the same depth and their facts line up. Questions
that belong to no single subject (how a fork happened, how to migrate) are asked once.

Two examples, at the default `light` depth:

| | "A report on LLMs" | "Redis vs Valkey" |
| --- | --- | --- |
| Scope | Large language models as of late 2026: what they are, how they are built and run, the main models and vendors, what they can and cannot do, cost, risks and regulation, and how organisations use them. Not the mathematics in depth. | The two engines as products: technology, licensing, ecosystem and migration, as of late 2026. Not every managed service's pricing. |
| Subjects | none | Redis, Valkey |
| Sections | What an LLM is; how they work; history and milestones; main model families and vendors; capabilities and benchmarks; tools, context and agents; cost and pricing; running them; limitations; risks and security; regulation; how organisations use them; trends | Origin and governance; licensing; releases and versions; architecture; data types and commands; persistence and replication; clustering; performance; modules and vectors; security; clients and tooling; cloud offerings; enterprise support; compatibility and migration; community; known problems |
| Sections at `light` | the 6 or 7 that matter most for the scope | the 6 or 7 that matter most, such as licensing, architecture, persistence, performance, compatibility and migration |
| Questions at `light` | about 12 | about 14: one per section per subject, plus 2 cross-cutting |
| Questions at `deep` | about 45 | about 45 |

| `--depth` | Sections | Questions | Facts per question | Checking | Gap round |
| --- | --- | --- | --- | --- | --- |
| `light` (default) | the 5 to 8 that matter most | 8 to 15 | up to 8 | one checker per section | no |
| `standard` | most that apply | 20 to 40 | up to 15 | one checker per question | yes |
| `deep` | all that apply | 40 to 80 | up to 30 | one checker per question | yes |

The default is deliberately light. Even at `light`, a run gives more than today's skill:
more questions, several quoted facts per question instead of one paragraph, every fact
checked, and a cross-check. A person asks for `standard` or `deep` when a topic needs it.

- The plan is saved as today and written as `research/plan.json` and a readable
  `research/plan.md`: the scope, then the outline with its questions.
- `--plan-only` stops after planning, so a person or a studio can change the scope or the
  outline and continue. This matters most for broad topics.
- The plan limit of 30 questions rises to 80. A topic that needs more than that at `deep` is
  too broad for one run; the scope says what was left out.

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

### 3. Check the facts

At `light`, one checker takes a whole section's questions at once; at `standard` and `deep`,
each question gets its own. A checker is never given a question it researched. Where the
person has both Claude
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

One task reads every checked fact: statements, keys, sections, subjects, sources, dates and
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
  - A header: topic, date, depth, the scope paragraph, the sources given, how many facts and
    sources, and how the facts were checked.
  - **Coverage by section:** how many checked facts each section has (each subject's, when
    comparing), and which questions are partly or not answered.
  - The facts, in outline order, under their sections and questions. When comparing, each
    subject's facts sit side by side so they can be read across. Each fact shows its citation
    numbers, its as-of date, whether it was narrowed or transcribed, and "one source" when only
    one publisher backs it.
  - Conflicts, superseded facts and missing angles.
  - Gaps: unanswered questions, failed tasks and sources that could not be read, with why.
  - Sources, numbered: title, a clickable URL or the file name, publisher, standing, and
    "given" or the date saved.
  - Rejected facts, with the checker's reasons, for anyone auditing the run.
- **`research/facts.json`**, schema 1, the same content for programs: the scope, sections,
  subjects when comparing, questions, sources with their provenance (`given`, `found` or `transcribed`, or `caller`
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
2. Show the plan (scope and outline) when the person wants to approve it.
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
- **Output:** `facts.json` against its schema, coverage by section, the report's sections, links
  and numbering.
- **Live trials,** recorded in `docs/verification/`: Redis vs Valkey at `light` and at `deep` with a few given
  PDFs and links, in a person's Claude Code session with subagents, and again in Codex; and one
  narrow topic from given documents alone. Timed and costed, with the reports read by a person
  and a sample of facts checked by hand against their sources.

## Acceptance: better than today, measured

Before release, the same three requests are run with today's skill (0.8.1) and with this
design, in Claude Code, and the results compared:

1. A broad topic: "a report on LLMs".
2. A comparison with given sources: "Redis vs Valkey", with two PDFs and two links.
3. A fact-check: the claims in an existing deck.

For each run, record the time, the cost, the number of facts (or findings), the sources
used, and the questions left unanswered. Then a person checks a random sample of 30 facts
from each run against their sources: is the quote in the source, and does it say what the
fact says?

The design is ready to release when, on all three requests:

- Every sampled quote is in its source.
- At least 9 in 10 sampled facts say no more than their quotes.
- Every section of the outline has facts or a stated gap.
- The new run is judged more useful as a reference by the person reading both.

The three runs use the default `light` depth, plus Redis vs Valkey once at `deep`. Time and
cost are recorded, not limited.

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
- **Coverage is planned as an outline and reported by section,** so thin parts are visible,
  and a comparison has both sides researched to the same depth.
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
6. **Depth costs.** The default `light` run is about 12 questions with a checker per section:
   very roughly $3 to $6 and 10 to 15 minutes, a little more than Training's measured $2.31 for
   eight questions without checking. `deep` is about 45 questions, each checked, plus a gap
   round: very roughly $20 to $40 and 30 to 60 minutes. All to be measured in the trials.
7. **A deep report is long.** A `light` run gives roughly 50 to 100 facts; a deep comparison
   can hold several hundred. Coverage by section and `brief.md` are the way in.

## Settled in review

- **No answer or synthesis.** Research produces facts to use as references.
- **Support check** per fact, by another worker; **question kinds**; **provenance** on every
  source and citation.
- **Topic and starting sources as input:** links and documents such as PDFs.
- **Coverage scales with the topic:** a scope, an outline of sections with several questions
  each, subjects only for comparisons, and `--depth`, instead of a fixed 8 to 20 questions. Any
  topic works, not only comparisons.
- **A light default:** about 12 questions, a checker per section and no gap round. Anything
  more than today's skill is an improvement; `standard` and `deep` are there when asked for.
- **The harness does all the work.** The helper does no fetching, extraction or agent starting;
  it is a queue, a set of checks and the record. No `pdftotext` dependency.
- **Private words in searches:** not a concern.

## Appendix: `facts.json`, by example

Shortened, with one entry of each kind, for a comparison. For a topic that is not a
comparison, `subjects` is empty and every `subject` is null. The values are illustrative.

```json
{
  "schema": 1,
  "run": "8f3c2a91d0e4b7a6c5f1e2d3",
  "topic": "Redis vs Valkey",
  "about": "For solutions architects advising customers on in-memory data stores.",
  "depth": "light",
  "scope": "public-web",
  "status": "complete",
  "created_at": "2026-10-16T14:00:03Z",
  "completed_at": "2026-10-16T14:48:51Z",
  "counts": {"questions": 42, "facts": 318, "narrowed": 41, "rejected": 27,
             "sources": 96, "conflicts": 6, "superseded": 4, "failed": 0},

  "scope": "The two engines as products: technology, licensing, ecosystem and migration, as of late 2026. Not every managed service's pricing.",
  "sections": [{"id": "licensing", "name": "Licensing"}, {"id": "origin", "name": "Origin and governance"}],
  "subjects": [{"id": "redis", "name": "Redis"}, {"id": "valkey", "name": "Valkey"}],

  "questions": [
    {"id": "valkey.licensing", "section": "licensing", "subject": "valkey",
     "kind": "open", "round": 1,
     "question": "Under what licence is Valkey released, and has that changed?",
     "coverage": "answered", "gaps": "",
     "facts": ["valkey.licensing.3fa9c2"]},
    {"id": "fork-history", "section": "origin", "subject": null, "kind": "open", "round": 1,
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
     "section": "licensing", "subject": "valkey", "questions": ["valkey.licensing"],
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
