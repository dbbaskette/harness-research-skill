# Research a topic with Claude Code or Codex: a thoroughly researched, cited report

Date: 2026-10-15. Status: draft 9, revised after the 0.9.0 review for speed, selective staleness and
release-tag guidance (2026-10-16). Issue:
[harness-research-skill#9](https://github.com/dbbaskette/harness-research-skill/issues/9).

## What it is for

A topic and, optionally, some starting sources go in: links, and documents such as PDFs.
What comes out is a thoroughly researched report on that topic, written as questions and
answers, with the checked facts it is built from underneath, for people and studios to use as
references:

- The report follows the plan: sections, each with its questions, each question answered in
  plain prose, starting with a one-line answer.
- Every factual sentence, including the one-line answer, cites the facts it rests on and
  says nothing they do not say. Questions without checked support get a structured gap
  answer, not an invented fact. Where sources disagree or an answer is partial, it says so.
- Each fact is one sentence, quotes exactly the saved text of a source, and has been checked
  by a second agent that did not write it.
- The report explains what the facts establish. It does not recommend or decide anything
  beyond them: the reader does.
- Coverage is planned and shown: the plan is an outline of the topic, and the report shows
  which parts of it have few facts. Any topic works: a broad one ("a report on LLMs"), one
  product, a comparison, or a set of claims to check.

"Vetted" means traceable and checked for support. It does not mean true: a fact quoted
correctly from a wrong or out-of-date source is still wrong. Each fact therefore shows where
it came from, what kind of source that is, and the date it holds for, so the reader can judge.

## The split: the harness does the work, the helper keeps the books

**This remains a skill at heart.** The person invokes it with a plain-language
research request. Its guidance owns planning, source selection, research judgement,
independent checking and writing through the harness's native tools. Helper commands and
JSON are implementation details for the agent; a person is not asked to run a workflow
engine. Acceptance includes invoking the skill itself, not only scripted CLI tests.

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
| Checks facts in a separate agent invocation against the originals | Enforces the recorded author/checker invocation identities |
| Finds duplicates, conflicts and missing angles | Refuses references to facts that do not exist |
| Writes each question's answer from its checked facts | Refuses a sentence with no citation, a citation to a fact that was not confirmed, and a number that is not in the cited facts |
| Runs several subagents at once | Leases tasks so they never collide, and returns abandoned ones |
| | Separates finished coverage, evidence gaps and blocked execution |
| | Refreshes the report, `facts.json` and `brief.md` after each accepted save |

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
| **What a question produces** | One finding: a verdict (supported, contradicted, insufficient, unavailable), an optional headline, a summary of up to 12,000 characters, limits and up to 20 quotes | A cited one-line answer and prose, or a structured gap answer; checked atomic facts underneath; coverage for open questions and a checked verdict for exact claims |
| **Evidence check** | The quote must appear, exactly, at the offset the agent gives, in any file in the project, including one the agent wrote itself | The quote must be in a registered source's saved text; the helper finds it, allowing for spacing, quote-mark and dash differences; every number in the fact must be in its quotes |
| **Support** | Not checked: "semantic support is the researcher's assessment" | Every fact checked by a worker that did not write it, ideally the other harness, against the original source: confirmed, narrowed or rejected |
| **Across questions** | Nothing | Duplicates merged, conflicts and superseded facts shown, missing angles researched |
| **Sources** | Supplied documents are registered with a hash; web pages are files the agent saves, with no register or label | Every source registered with a hash, a title, a publisher and a standing; the person's own sources are always primary; text read from charts or scans is marked transcribed |
| **When it is done** | When no question is pending; the guidance asks the agent to open the report and check it | When required stages are done, as `complete` or `complete-with-gaps`; execution failures remain `blocked` with saved partial output |
| **Working in parallel** | Allowed when the host permits; saves are one at a time, with "busy, retry" errors | Tasks are leased to workers, so subagents and sessions do not collide |
| **Output** | `.harness-research/research-report.md`, a per-question list in a hidden folder, and the record | `research/report.md`: a written report in questions and answers, in outline order, with coverage by section, conflicts, gaps, numbered sources, the facts behind each answer and the rejected facts; `research/facts.json`; `research/brief.md`. The record stays |
| **Citations** | By question; no stable IDs | Immutable fact keys, quote hashes, merge aliases and revision links that callers can verify later |
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
  [--claims FILE] [--depth light|standard|deep] [--plan-only]

# Take the next task, then hand back its result.
node scripts/harness-research.mjs research next --project DIR --run RUN --worker INVOCATION_ID
node scripts/harness-research.mjs research submit --project DIR --run RUN \
  --task ID --worker INVOCATION_ID --lease TOKEN --attempt N --file result.json

# See the next task without taking it; give a task back without a failed attempt.
node scripts/harness-research.mjs research peek --project DIR --run RUN --worker INVOCATION_ID
node scripts/harness-research.mjs research release --project DIR --run RUN \
  --task ID --worker INVOCATION_ID --lease TOKEN --attempt N

# Renew a lease; explicitly retry a failed task after its cause is addressed.
node scripts/harness-research.mjs research heartbeat --project DIR --run RUN \
  --task ID --worker INVOCATION_ID --lease TOKEN --attempt N
node scripts/harness-research.mjs research retry --project DIR --run RUN --task ID

# Register the text of a source the harness has saved.
node scripts/harness-research.mjs research source --project DIR --file research/sources/NAME.md \
  --origin URL_OR_PATH --title TEXT [--publisher TEXT] \
  [--standing primary|secondary|community] [--transcribed --pages 4-6] [--partial REASON] \
  --run RUN --task ID --worker INVOCATION_ID --lease TOKEN --attempt N

# Where the run stands: stages, tasks, coverage, what is missing.
node scripts/harness-research.mjs research status --project DIR

# Release a --plan-only hold (optionally with an edited plan); record an execution block.
node scripts/harness-research.mjs research continue --project DIR --run RUN [--file PLAN]
node scripts/harness-research.mjs research block --project DIR --run RUN --reason TEXT

# After a registered source changed: redo only the work that rests on it.
node scripts/harness-research.mjs research reassess --project DIR --run RUN
```

Commands answer compactly: `next` writes the full task to a file under
`.harness-research/tasks/` and returns its path, and status replies summarise tasks
by state. `--verbose` prints everything. A result may register its sources in a
`register` array and cite them by file, instead of one `research source` command per
source. The helper waits up to 30 seconds for a busy store, so parallel workers do
not fail on each other's saves, and recovers a lock left by an exited process.

`plan`, `record`, `status` and `migrate` stay as they are, for callers that research by hand.
For a fact-check, `--claims FILE` supplies exact claim objects (`file`, `quote`, Unicode
character `start`) in the existing format. The helper pins the target files separately
from evidence sources. A target is not a research reference merely because it was uploaded;
using it as evidence requires a separate, explicit source selection. Otherwise the helper
refuses a citation to it. A target alone cannot establish its own claims. Changing a target
invalidates its claim assessments and downstream answers. Even when separately selected as
a contextual reference, repeating the target assertion is not independent support for that
assertion. A requested internal-consistency check must be labelled as such.

## The stages

| Stage | Tasks | Produces |
| --- | --- | --- |
| 0. Sources | one per source the person gave | the saved text of each, registered |
| 1. Plan | one | the scope, an outline of sections, and their questions |
| 2. Research | one per section at `light`, otherwise one per question | facts with quotes |
| 3. Check | one per section at `light`, otherwise per question; a separate invocation eligible for every question it receives | each fact checked, plus the final coverage and claim verdict |
| 4. Cross-check | one | duplicates, conflicts, superseded facts, missing angles |
| 5. Fill gaps | the missing angles as new questions, researched and checked once, and cross-checked at `standard` and `deep` | more facts: up to 3 questions at `light`, all missing angles at `standard` and `deep` |
| 6. Write | one per section | cited factual headlines/prose or structured gap answers |
| 7. Review the writing | at `standard` and `deep`, one per section, never the writer | sentences that say more than their facts, cut back or removed |
| 8. Finalize | none: the helper | one consistent output revision and a terminal status; partial outputs exist throughout |

`research next` hands out tasks in that order, several at once where they are independent.
Stages are pipelined on accepted results rather than run as whole-stage waves: a unit is
checked as soon as everything it covers has been researched; plan waits for the selected
sources, the cross-check for all checks, and writing for the cross-check. At `light` a section
is written as soon as its own gap-round questions are checked, and the gap round is not
cross-checked again, so writing overlaps the gap round. At `standard` and `deep`, a section's
review starts when its writing is accepted.

**Speed.** A run should take a small multiple of one agent researching alone, not an order
of magnitude more. That holds when the coordinator dispatches every ready task to parallel
subagents, does the small tasks (selected sources, plan, cross-check) itself, and workers
register sources inside their results. A `light` run is then about six waves: plan,
section research with checks following each section, cross-check, the gap round alongside
writing. Sequential execution remains valid but is several times slower.

### Worker identity and independent checking

`--worker` is the harness's durable identifier for an actual agent invocation, not an
editable role name. The coordinator records that invocation's harness/session identity and
keeps it fixed when it researches, retries or resumes. This is a trusted-coordinator
contract: the helper checks recorded identities; a different string alone does not prove a
different agent ran. A checker receives the source, facts and question in a fresh invocation,
not the researcher's private reasoning. The same model may be used.

At `light`, a section checker must not have researched any question in that section.
Writing reviewers must likewise differ from the writer. Separate invocations may run
sequentially, so parallel execution is optional. If the host cannot start a separate
invocation and no separately authorized session is available, checking is `blocked`.
Candidate facts and a partial report remain available, clearly unchecked. Renaming the
original invocation cannot turn its work into checked research. A second harness or account
is optional; the skill must not silently start an unavailable or unauthorized one.

### Leases, attempts and late submissions

Taking a task returns its run ID, task ID, worker invocation, monotonically increasing
attempt number, opaque lease token and expiry. A lease lasts 30 minutes, because research
and checking routinely take longer than a few; `heartbeat` renews it. An expired lease
returns the task to the queue, but the worker holding it may still submit, renew or
register sources until another worker takes the task: its attempt is then revived rather
than wasted. Once a newer lease exists, the old one is refused. Expiry is decided by the
helper rather than by a worker's clock. `peek` shows the task a worker would get without
taking it, and `release` gives a taken task back without counting a failed attempt.
Release retains the invocation's research participation, so it cannot later check
the same question; `peek` is the way to inspect a task without becoming its researcher.

Every task submission is checked under the record lock against that entire lease identity.
New results from replaced leases and submissions for old runs are refused before any
result is saved. A submission that fails validation is refused with actionable errors but
keeps its lease, so the worker corrects it and submits again; ten refusals in one attempt
end that attempt. A worker crash, reported as an error, ends the attempt at once. Within the same run, repeating an already accepted submission with the
same token and payload digest returns its recorded acknowledgement without a second write,
even after that lease expired; a different payload is refused. Accepting the result, advancing the stage and
recording the accepted digest are one durable state transition. Mutable source registration
from a worker is bound to its current lease too; it cannot replace a source after losing its
task. Sources are versioned rather than overwritten beneath another worker's quotes.

After three unsuccessful attempts, a task remains `failed` with its attempts and reasons.
It is not converted into an `unavailable` finding. `research retry` explicitly reopens it
with a new lease generation and retained history; starting another run also invalidates all
earlier leases. A failed task holds up only the stages after it: independent tasks at its
own stage are still handed out, and the run is `blocked` only when nothing else can
proceed.

### Completion and saved output

| Run status | Meaning |
| --- | --- |
| `in-progress` | Required work is ready or leased; accepted results and partial output are saved |
| `complete` | All required stages succeeded, all scoped questions are answered, and no coverage/source gaps remain |
| `complete-with-gaps` | All required stages succeeded; assessed questions or unreadable sources leave explicit evidence gaps |
| `blocked` | A required task exhausted retries, independent checking is unavailable, or another prerequisite prevents progress |
| `stale` | A selected original, a pinned source revision or a claim target changed; only the facts, questions and answers resting on it need reassessment |

An honest `not answered` assessment with a concrete gap is successful research work. An
agent crash, invalid submission or missing checker is an execution problem, not evidence of
absence. Blocked runs show failed tasks and their dependent stages; they cannot claim either
completion status. A paused or interrupted run resumes from durable task state, keeping the
last accepted results. A person may use its explicitly partial report without relabelling
that run complete.

The helper materializes the report, `facts.json` and `brief.md` on start and after every
accepted source, result, check, revision or status change. Pending/unchecked facts are
labelled and excluded from the checked-facts digest in `brief.md`. All three artifacts name
the same run and output revision. One committed record revision is authoritative; file
replacement is atomic, and `research/output.json` commits their run/revision and file hashes
only after all three are written. Consumers reject a missing manifest or mismatched hashes
rather than accepting mixed or incomplete exports. `status` repairs an interrupted export
from that record before returning an output revision. A failure before finalization must
still leave an inspectable partial report, or report an explicit persistence error rather
than success.

### 0. Sources

Each source the person gave becomes a task: read it, save its text, register it.
Files supplied as claim targets are pinned separately and are not evidence-source tasks.

- **The harness saves the text, word for word,** as `research/sources/<name>.md`, and
  registers it with `research source`. The text must be the source's own words. A summary, a
  translation or a tidied version is not a source, because every quote is checked against
  this text.
- **The whole page or section, not the passage.** A quote is only checkable against the
  text around it, so saved text under 280 characters, or a quote that is more than half of
  its saved source, is refused. When a tool returns only part of a page, or the source
  really is that short, the harness registers it with `--partial` and the reason; the
  source and every fact quoting it are labelled as a partial capture.
  Registering a partial capture after an earlier full capture issues a new default
  source revision ID even when the saved bytes match. Existing revisions remain immutable;
  update the refused candidate's citations to the new returned ID before resubmission.
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
- **The helper pins what it registers.** Each registered text is copied to
  `research/sources/revisions/<sha256>.txt` and quotes are checked against that copy, so a
  later overwrite of the harness's working file (two workers fetching one page, say) changes
  no evidence and does not make the run stale.
- **A changed original affects only what rests on it.** `status` names the stale facts,
  questions and answers; other facts stay current. `research reassess` keeps the stale facts
  as history, reads the changed selected sources again, re-researches and re-checks only the
  affected questions, and rewrites answers that cited stale facts. A changed claim target
  cannot be reassessed, because its exact claim no longer matches; it needs a new run.
- Registration preserves the original document identity/hash and the extraction hash,
  version/date when available, publisher and page/section locators. A checker records which
  original revision it inspected. Changing either an original file or its saved extraction
  invalidates affected facts, checks, answers and approvals. A changed live page cannot be
  silently substituted for the revision quoted by a worker. Missing access or version
  information is explicit; a saved-text hash alone does not prove current live content.
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
| Sections at `light` | the 8 or 9 that matter most for the scope | the 8 or 9 that matter most, such as licensing, architecture, persistence, clustering, performance, security, compatibility and migration |
| Questions at `light` | about 20 | about 20: one per section per subject, plus 2 cross-cutting |
| Questions at `deep` | about 45 | about 45 |

| `--depth` | Sections | Questions | Facts per question | Checking | Gap round |
| --- | --- | --- | --- | --- | --- |
| `light` (default) | the 6 to 10 that matter most | 15 to 25 | up to 12 | one checker per section | up to 3 questions |
| `standard` | most that apply | 25 to 45 | up to 20 | one checker per question | yes |
| `deep` | all that apply | 45 to 80 | up to 30 | one checker per question | yes |

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
 "gaps": [{"kind": "insufficient | unreadable | unavailable",
           "reason": "what the inspected sources do not establish or why they could not be read",
           "sources": ["NAME"]}]}
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

Research coverage and a claim verdict are provisional until checking. A `not answered`
submission can contain zero facts, but must identify a concrete gap and the selected sources
or assessed source-access limitations it rests on. Tool/worker crashes are failed attempts,
not an invitation to submit invented `unavailable` evidence; a genuine access limitation can
be an assessed source gap with its recorded reason. Numeric presence is a filter, not proof
of the relationship or units; the semantic check still assesses those. Normalization must preserve
decimal values and version boundaries.

### 3. Check the facts

At `light`, one checker takes a whole section's questions at once; at `standard` and `deep`,
each question gets its own. A checker invocation is never given a question it researched;
a section checker must be eligible for every question in the section. Where the
person has both Claude
Code and Codex, the brief suggests the other one checks: one model is more likely to miss its
own kind of mistake.

- The checker reads each fact, its quotes and the text around them, and **opens the original
  source itself** (the page, the PDF, the pages a transcript names) to confirm the quote is
  really there. This also catches a saved text that is not the source's own words.
- For each fact it returns `confirmed`, `narrowed` (with the narrower statement the quotes do
  support, which must pass the number rule) or `rejected` (with a reason).
- If the checker cannot open an original, it must not claim it did. It may retain the
  exact revision hashes with `read_original: false` and a concrete `access_error`, but
  every fact citing that original must be rejected with a reason. Each affected question
  needs partial/unanswered coverage and an unavailable/unreadable gap naming the source.
  Other facts resting only on inspected originals may remain confirmed. This completes an
  honest access-limited assessment; it never confirms or narrows from an unread original.
- Narrowed facts replace the original, which is kept. Rejected facts move to a rejected list
  shown at the end of the report, never deleted.
- A narrowed replacement that passes the checks is exported as a confirmed assertion with
  `check.change: narrowed`; the old key/statement remain in the revision history.
- The checker also assesses whether the remaining confirmed facts answer the question and,
  for a claim, support or contradict the exact pinned claim. If all facts are rejected, an
  earlier `answered`/`supported` cannot survive unchanged: coverage is `not answered` with a
  gap and the claim is `insufficient` unless other confirmed evidence establishes a verdict.
  Further fact revisions invalidate these assessments and the answers that depend on them.

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

### Fact identity, revisions and aliases

A fact key is an immutable helper-issued identifier, `fact-` plus 32 lowercase hexadecimal
characters. It is independent of question IDs and fits existing citation-marker limits.
Reusing a saved fact preserves its key. Independently researched duplicates may initially
have different keys; cross-checking chooses a canonical key and retains permanent aliases
for the other keys. Matching uses the statement and its subject/version/as-of context, not
the question name alone. Unknown or incompatible contexts must not be merged automatically.

Changing the assertion, including narrowing it, creates a new fact key and an explicit
revision relationship to the old key and statement. The old assertion and its checks remain
in history. Verification of the old key reports `narrowed`, `superseded` or `rejected` and
the replacement where one exists; it never silently treats a new assertion as confirmation
of the old one. Merge aliases resolve the same assertion; revisions record a changed one.
Quote changes invalidate checks even if the fact key stays the same. The export contains
the alias and revision records needed to resolve every previously published key.

### 5. Fill the gaps

The missing angles become new questions: the 3 that matter most at `light`, all of them at
`standard` and `deep`. They are researched, checked and cross-checked once. Only one round, so
a run always ends.

### 6. Write the answers

One task per section, given the section's questions and their confirmed facts (and the
conflicts and superseded facts that touch them). For each question the writer hands back:

- **A one-line answer:** `{ "sentence": "...", "facts": ["fact-key"] }`, the direct answer
  as far as the facts allow. It is checked exactly like every other factual sentence.
- **The answer:** one to four paragraphs of plain prose that explain the facts in a sensible
  order, compare subjects where the plan compares them, and say where sources disagree, where
  a fact is dated, and what the facts leave open.
- Every sentence lists the fact keys it rests on. The writer may use facts from other
  sections by key when they bear on the question.
- A `not answered` question instead has an empty prose answer, a headline of
  `{ "kind": "gap", "gaps": ["gap-id"] }` and at least one recorded gap. The helper renders
  a bounded message such as "Not established by the sources checked in this run" and links
  the gap reasons and inspected sources. This is run-status metadata, not an uncited claim
  that no evidence exists anywhere. Partial answers carry their factual sentences plus gap
  references. Every question still appears in the report.

The helper refuses the section, with reasons the writer can act on, when:

- A factual sentence or factual headline cites no facts. Questions, headings and generated
  run-status/gap messages may stand without fact citations; gap messages must cite recorded
  gap IDs. Arbitrary writer prose cannot use that exemption.
- A sentence cites a fact that was rejected, superseded without saying so, or does not exist.
- **A number in a sentence is not in any of its cited facts,** the same rule as for facts.
- An answer leaves out a question in the section.
- An empty prose answer has no checked gap assessment, a gap ID is missing, or a
  `not answered` question nevertheless includes an unsupported factual headline.

It does not judge whether the prose says more than its facts; at `light` that rests on the
writer's brief, and at `standard` and `deep` on the review.

### 7. Review the writing

At `standard` and `deep`, a separate invocation reads each answer and headline against its
cited facts and cuts back or removes any sentence that says more than they do. It cannot add
claims. At `light` this stage is skipped. The report explicitly distinguishes checked facts
from independently reviewed prose: default-depth prose has citation/number validation and
the writer's brief, but no independent semantic review. Acceptance sampling must include
headlines and body sentences at that default depth. Completion is not a guarantee that all
prose follows semantically from the facts.

### 8. Output

All in `research/`, where a person will look:

- **`research/report.md`**, the report:
  - A short title, from the plan or the topic's first sentence, with the full request beneath
    it when they differ.
  - A header: run/output revision, status, runtime/guidance identities, topic, date, depth,
    the scope paragraph, the sources given, counts, how facts were checked and whether the
    prose was independently reviewed; then the contents.
  - **Coverage by section:** how many checked facts each section has (each subject's, when
    comparing), and which questions are partly or not answered.
  - **When comparing,** each section opens with a table of every subject's current facts side
    by side.
  - **The questions and answers,** in outline order: each section's questions, each with its
    one-line answer and its paragraphs. Factual sentences carry the numbers of the sources
    behind their facts; generated gap messages link to the assessed gaps.
  - **The facts behind each answer,** listed under it: each fact with its source numbers, its
    as-of date, whether it was narrowed or transcribed, and "one source" when only one
    publisher backs it. When comparing, each subject's facts sit side by side.
  - Conflicts, superseded facts and missing angles.
  - Gaps: unanswered questions, failed tasks and sources that could not be read, with why.
  - Sources, numbered: title, a clickable URL or the file name, publisher, standing, and
    "given" or the date saved.
  - Rejected facts, with the checker's reasons, for anyone auditing the run.
- **`research/facts.json`**, schema 1, the same content for programs: separate `source_mode`
  (`supplied-only` or `public-web`) and narrative `scope`, sections,
  subjects when comparing, questions with their answers (each sentence with its fact keys), sources with their provenance (`given`, `found` or `transcribed`, or `caller`
  for a file quoted through `record`), facts with their checks and citations, conflicts,
  superseded, missing, rejected, gaps and counts, plus the report `title` and each source's
  `capture` (null, or partial with its reason). Fact keys, aliases and revision links follow
  the identity contract above; each citation carries its source revision and quote hash.
  Worker bookkeeping such as which invocations researched a question stays in the run
  record; the export keeps what a reader or caller needs, including who checked each fact.
- **`research/brief.md`**: current checked facts with keys, one per line, no quotes, followed
  by gaps, conflicts and run status. Pending, rejected, superseded or stale facts are not
  presented as current reference material. This is the downstream context, including when
  the run is partial.

## Running it

### In a person's session

When a person asks their Claude Code or Codex to research a topic, the skill's guidance tells
it to:

1. Run `research start` with the topic and the person's sources.
2. Show the plan (scope and outline) when the person wants to approve it.
3. Work the queue through leased tasks, using actual invocation identities. Parallelism is
   optional; separate researcher/checker invocations may run in turn. If independent
   checking cannot run, report the block rather than self-checking under another name.
4. On `complete` or `complete-with-gaps`, open the saved report, verify its output revision
   and point the person to it with the gaps. On `blocked`, name the failed prerequisite and
   link the saved partial report; do not loop forever or call it completed research. An
   interrupted run retains its partial artifacts and resumes without discarding them.

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
  Acceptance by `record` alone does not establish independent checking or satisfy a new
  run's Check stage. Legacy-only runs retain their existing assessment semantics and caveat;
  their unreviewed assertions are not exported as independently confirmed facts.
- For readers that only know `status`, an open question's coverage maps to `supported` when
  answered by current confirmed facts and `insufficient` otherwise. Apply that mapping after
  checking and fact revisions, not to the researcher's provisional coverage. Claim verdicts
  stay tied to exact target claims. Preserve legacy `scope` as its existing source-mode enum;
  only the new export separates that enum into `source_mode` and narrative `scope`.
- `research` also fills each question's `headline` (the one-line answer) and `summary` (the
  answer's text) in the record, so callers that read today's findings keep working while they
  move to `facts.json`. The legacy headline is the validated sentence or generated gap text,
  not an additional unvalidated string. For runs using the new workflow, legacy completion
  cannot precede the required stages. New `complete-with-gaps` maps to legacy `complete`
  with unresolved IDs; `blocked` maps to legacy `in-progress` with a block reason, and
  `stale` stays `stale`. Legacy-only manual runs keep their current completion semantics.

## Not changing

- The legacy interfaces of `plan`, `status` and `migrate`, with the explicit new-workflow
  status mapping above; staleness, locking and history remain required.
- The rule that only exact quotes from saved text count as evidence.
- No new runtime dependencies: Node 20 or newer only. The helper does not fetch, extract or
  start agents.

## Testing

- **The queue:** every stage in order; parallel workers; leases that expire and return a task;
  heartbeat renewal; late submissions after reassignment or a new run; idempotent repeated
  submissions and conflicting payloads; three failures followed by explicit retry; a checker
  never given its own facts; section-wide eligibility; sequential separate invocations;
  unavailable independent checking; the gap round run once; stop and resume; `--plan-only`;
  and refusal to call a blocked run complete.
  Tested with scripted workers, no agent needed.
- **Submissions:** each refusal; quote placing; the number rule; transcribed sources; key
  stability on reuse; same fact found under different question IDs; permanent merge aliases;
  narrowed/superseded keys still resolving to their original assertions and replacements;
  incompatible contexts kept separate; conflict links; references to facts that do not exist.
- **Writing:** an uncited sentence, a citation to a rejected or missing fact, a number not in
  the cited facts, an unsupported headline and a missing question are each refused. A
  zero-fact question and an all-facts-rejected question produce gap answers and
  `complete-with-gaps`, not invented citations or a deadlock. No `supported` verdict survives
  removal of all its supporting facts. The review stage runs at `standard` and `deep`, and
  the output discloses when prose was not independently reviewed.
- **Sources:** registration, original and extraction hashes, gaps, new source versions,
  sources registered after planning, and invalidation of checks/answers after a change.
  A claim-target deck alone cannot confirm its own claim; exact target edits invalidate the
  assessment. Supplied-only scope and explicit web permission survive retries and imports.
- **Output:** a duplicate-key-rejecting JSON parse, `facts.json` against its schema,
  source-mode/scope separation, reference closure, counts, quote/number checks, coverage,
  links and numbering. The complete appendix fixture is validated, not only displayed.
  Interrupt exports between each file replacement; `status` must recover one consistent
  revision. Verify readable partial artifacts after a save, interruption and blocked task,
  including zero sources or zero checked facts. Legacy callers keep their source-mode and
  completion semantics.
- **Live trials,** recorded in `docs/verification/`: Redis vs Valkey at `light` and at `deep` with a few given
  PDFs and links, in a person's Claude Code session with subagents, and again in Codex; and one
  narrow topic from given documents alone. Timed and costed, with the reports read by a person
  and a sample of facts checked by hand against their sources.

## Acceptance: better than today, measured

> **0.9.0 release decision, 2026-10-16:** after native verification and 13 eligible
> live report cases, the owner accepted release for ongoing-use refinement:
> “looks good for now... ongoing use will let me tweak more than a specific test”.
> Formal human sampling and comparative scoring below were not completed and are
> not claimed as passed. This scoped exception preserves the target criteria for
> later evaluation; see the [release record](../../verification/0.9.0/live-acceptance/README.md).

Before release, the same three requests are run with today's skill (0.8.1) and with this
design, in Claude Code, and the results compared:

1. A broad topic: "a report on LLMs".
2. A comparison with given sources: "Redis vs Valkey", with two PDFs and two links.
3. A fact-check: the claims in an existing deck.

For each run, record the time, the cost, the number of facts (or findings), the sources
used, and the questions left unanswered. Compare atomic factual assertions, not a new fact
against an entire old summary: split the old findings into assertions for sampling. A
person checks a random sample of 30 assertions per run, or every assertion if fewer than
30, against the original source: is the quote present, and does it support the assertion?

The design is ready to release when, on all three requests:

- Every sampled quote is in its source.
- At least 9 in 10 sampled assertions say no more than their quotes, and at least 9 in 10
  sampled answer sentences say no more than their facts. Sample 30 answer sentences or all
  of them if fewer, including headlines; record the actual denominator. Generated gap
  messages are audited against the run's gap records rather than counted as checked facts.
- Every section of the outline has facts or a stated gap.
- The new run is judged more useful as a reference by the person reading both.

The three runs use the default `light` depth, plus Redis vs Valkey once at `deep`. Time and
cost are recorded, not limited.

Before release, the deterministic acceptance cases must also pass: no facts found, every
candidate rejected, no second invocation available, all three attempts failed, an expired
worker submitting after reassignment, interruption during export, an unsupported headline,
a target claim trying to cite itself, and a previously cited fact being narrowed or merged.
These exercise the completion and trust contracts independently of the live quality sample.

## Release and adoption

- **0.9.0 is an explicit installed-runtime upgrade, and publishing it breaks no one.** An older
  Research bootstrap refuses guidance whose minimum runtime it does not meet, and new
  instructions cannot teach it to fall back. So the 0.9.0 guidance keeps `minimumRuntime:
  0.8.1` and routes a 0.8.x runtime to the manual workflow; the queued workflow needs runtime
  0.9.0. Callers pinned to 0.8.1, such as Tanzu Brand 0.13.6, keep working. Raise the minimum
  only when the manual path is retired. Keep old task/runtime pins intact and document the
  installer upgrade for new runs.
- **Standalone acceptance in both harnesses is part of 0.9.0:** the Claude Code trials, the
  Codex trials and the narrow supplied-only trial precede release. Do not advertise Codex
  acceptance while deferring its trial to a later patch.
- **0.9.x adds verification and reuse before caller migration.** It may add an explicit,
  disclosed compatibility fallback to the executable bootstrap; that feature works only
  after installing a helper that implements it. It is not a guarantee about already
  installed older helpers or a silent substitute after a failed network fetch.
- **Brand 0.14 follows that compatible 0.9.x release**, pinning a runtime with `verify` and
  the other commands its handoff actually uses. Slides citation checks land before that
  handoff requires them. Studios then migrate Blog, Presentation and Training, replacing
  their loops and adapting their gates/citations together. Until each migration passes its
  compatibility checks, its existing orchestration stays in use.

## Build order

1. The queue: runs, stages, tasks, leases, `start`, `next`, `submit`, `source`, `status`, and
   the completeness rule, invocation identities, lease renewal/fencing and explicit retry.
2. Submissions: facts, the quote and number checks, checks, cross-check, the gap round, keys
   and provenance, exact claim targets, immutable identities, aliases and revision records.
3. Writing and output: the answers and their checks, the review, the report with coverage by
   section, gap answers, `facts.json` and `brief.md`, including partial exports and recovery.
4. Briefs and guidance; a first live trial in Claude Code; fixes from it.
5. The live trial in Codex, the narrow-topic trial, and the 0.9.0 release.

## Review: how well this will work

### What it does well

- **The harness works at full strength:** its own search, fetch, document and chart reading,
  browser, subagents and judgement.
- **Every fact traces to saved text,** and a checker confirms that text against the original.
- **Every published current fact is checked in a separate invocation,** ideally the other
  harness; inability to do that is a visible block, not a renamed self-check.
- **A report a person can read,** whose factual headlines and sentences lead through checked
  facts to quoted sources, and whose gap messages lead to recorded assessments.
- **Made-up numbers are refused mechanically.**
- **Coverage is planned as an outline and reported by section,** so thin parts are visible,
  and a comparison has both sides researched to the same depth.
- **Completion is explicit:** required stages cannot be skipped; honest evidence gaps can
  finish, execution failures block, and partial artifacts remain inspectable.
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
   harness cannot, independent invocations may run sequentially. If the host cannot provide
   a second invocation at all, checking blocks and the report remains partial.
5. **A harness reading the web can be misled by a page.** In a person's session it has
   whatever the person allowed it; a studio decides what its headless sessions may do.
6. **Depth costs.** The default `light` run is about 20 questions with a checker and a writer
   per section and up to 3 gap questions: very roughly $7 to $12 and 20 to 30 minutes, judged from
   Training's measured $2.31 for eight questions without checking. `deep` is about 45 questions, each checked, plus a gap
   round: very roughly $20 to $40 and 30 to 60 minutes. All to be measured in the trials.
7. **Prose can still overstate.** The helper makes sure every factual sentence cites confirmed facts
   and invents no numbers, but only a reader can tell whether a sentence says more than its
   facts. At `light` nothing but the writer's brief prevents it; at `standard` and `deep` a
   reviewer cuts such sentences back.
8. **A deep report is long.** A `light` run gives roughly 100 to 200 facts; a deep comparison
   can hold several hundred. Coverage by section and `brief.md` are the way in.

## Settled in review

- **A written report, in questions and answers,** whose factual prose cites checked facts
  and whose gap messages cite the run's assessments. It explains what the facts establish;
  it does not recommend or decide. Default-depth prose is not independently reviewed.
- **Support check** per fact, by another worker; **question kinds**; **provenance** on every
  source and citation.
- **Topic and starting sources as input:** links and documents such as PDFs.
- **Coverage scales with the topic:** a scope, an outline of sections with several questions
  each, subjects only for comparisons, and `--depth`, instead of a fixed 8 to 20 questions. Any
  topic works, not only comparisons.
- **A light default:** about 20 questions, a checker per section and up to 3 gap questions.
  Anything more than today's skill is an improvement; `standard` and `deep` are there when
  asked for.
- **The harness does all the work.** The helper does no fetching, extraction or agent starting;
  it is a queue, a set of checks and the record. No `pdftotext` dependency.
- **Private words in searches:** not a concern.

## Appendix: `facts.json`, by example

This is a complete, small synthetic contract fixture, not live research or quoted product
proof. Its two one-sentence sources are registered as partial captures with a reason,
because the runtime refuses saved text under 280 characters, or a quote that is most of
its source, unless the capture is labelled partial. Counts and references are closed. Both original fixture files and their saved
extractions contain the exact text shown below, with one trailing newline. The example
illustrates a narrowed assertion, a merge alias and a zero-fact gap; other audit lists are
empty. Runtime/guidance identities below are synthetic too.

```json
{
  "schema": 1,
  "run": "8f3c2a91d0e4b7a6c5f1e2d3",
  "output_revision": 12,
  "topic": "Valkey: licensing, origin and support",
  "about": "A minimal synthetic contract fixture, not a live product assessment.",
  "depth": "light",
  "source_mode": "supplied-only",
  "scope": "Licensing, fork origin and support as described by the selected fixture sources; no external research.",
  "status": "complete-with-gaps",
  "created_at": "2026-10-16T02:00:00Z",
  "completed_at": "2026-10-16T02:06:00Z",
  "prose_review": "not independently reviewed at light depth",
  "counts": {
    "questions": 3,
    "facts": 2,
    "narrowed": 1,
    "rejected": 0,
    "sources": 2,
    "conflicts": 0,
    "superseded": 0,
    "gaps": 1,
    "failed": 0,
    "checked": 2
  },
  "sections": [
    {
      "id": "licensing",
      "name": "Licensing"
    },
    {
      "id": "origin",
      "name": "Origin"
    },
    {
      "id": "support",
      "name": "Support"
    }
  ],
  "subjects": [],
  "questions": [
    {
      "id": "valkey-licensing",
      "section": "licensing",
      "subject": null,
      "kind": "open",
      "round": 1,
      "question": "Under what licence is Valkey released?",
      "coverage": "answered",
      "gaps": [],
      "headline": {
        "sentence": "Valkey is licensed under the BSD 3-Clause licence.",
        "facts": [
          "fact-00000000000000000000000000000001"
        ]
      },
      "answer": [
        {
          "sentence": "Valkey is licensed under the BSD 3-Clause licence.",
          "facts": [
            "fact-00000000000000000000000000000001"
          ]
        }
      ],
      "facts": [
        "fact-00000000000000000000000000000001"
      ],
      "assessment": {
        "by": "checker-invocation-02",
        "at": "2026-10-16T02:05:00Z"
      }
    },
    {
      "id": "fork-origin",
      "section": "origin",
      "subject": null,
      "kind": "open",
      "round": 1,
      "question": "Where did Valkey originate?",
      "coverage": "answered",
      "gaps": [],
      "headline": {
        "sentence": "Valkey was forked from Redis.",
        "facts": [
          "fact-00000000000000000000000000000002"
        ]
      },
      "answer": [
        {
          "sentence": "Valkey was forked from Redis.",
          "facts": [
            "fact-00000000000000000000000000000002"
          ]
        }
      ],
      "facts": [
        "fact-00000000000000000000000000000002"
      ],
      "assessment": {
        "by": "checker-invocation-02",
        "at": "2026-10-16T02:05:00Z"
      }
    },
    {
      "id": "support-lifecycle",
      "section": "support",
      "subject": null,
      "kind": "open",
      "round": 1,
      "question": "What support lifecycle is established by the supplied sources?",
      "coverage": "not answered",
      "gaps": [
        "gap-support"
      ],
      "headline": {
        "kind": "gap",
        "gaps": [
          "gap-support"
        ]
      },
      "answer": [],
      "facts": [],
      "assessment": {
        "by": "checker-invocation-02",
        "at": "2026-10-16T02:05:00Z"
      }
    }
  ],
  "sources": [
    {
      "id": "s01",
      "title": "Synthetic valkey-license reference",
      "origin": "supplied: fixtures/valkey-license.txt",
      "publisher": "Fixture publisher",
      "standing": "primary",
      "provenance": "given",
      "saved_at": "2026-10-16T02:00:00Z",
      "source_date": "2026-10-15",
      "original_file": "fixtures/valkey-license.txt",
      "original_sha256": "e23f8af34cf93c760ca684f84280ff4471fdedfaa181473c7f971b045b60c03d",
      "file": "research/sources/valkey-license.md",
      "pinned": "research/sources/revisions/e23f8af34cf93c760ca684f84280ff4471fdedfaa181473c7f971b045b60c03d.txt",
      "sha256": "e23f8af34cf93c760ca684f84280ff4471fdedfaa181473c7f971b045b60c03d",
      "capture": {
        "kind": "partial",
        "reason": "A one-sentence synthetic fixture; the whole source is this short."
      },
      "limits": "none"
    },
    {
      "id": "s02",
      "title": "Synthetic fork-origin reference",
      "origin": "supplied: fixtures/fork-origin.txt",
      "publisher": "Fixture publisher",
      "standing": "primary",
      "provenance": "given",
      "saved_at": "2026-10-16T02:00:00Z",
      "source_date": "2026-10-15",
      "original_file": "fixtures/fork-origin.txt",
      "original_sha256": "8e21024acf4c842093e3b71c0b358ba68e5a37856a1ed1367e0bed17ff260220",
      "file": "research/sources/fork-origin.md",
      "pinned": "research/sources/revisions/8e21024acf4c842093e3b71c0b358ba68e5a37856a1ed1367e0bed17ff260220.txt",
      "sha256": "8e21024acf4c842093e3b71c0b358ba68e5a37856a1ed1367e0bed17ff260220",
      "capture": {
        "kind": "partial",
        "reason": "A one-sentence synthetic fixture; the whole source is this short."
      },
      "limits": "none"
    }
  ],
  "facts": [
    {
      "key": "fact-00000000000000000000000000000001",
      "statement": "Valkey is licensed under the BSD 3-Clause licence.",
      "section": "licensing",
      "subject": null,
      "questions": [
        "valkey-licensing"
      ],
      "as_of": "2026-10-15",
      "check": {
        "result": "confirmed",
        "by": "checker-invocation-02",
        "at": "2026-10-16T02:05:00Z",
        "change": null
      },
      "original_statement": null,
      "sources_count": 1,
      "best_standing": "primary",
      "conflicts_with": [],
      "superseded_by": null,
      "citations": [
        {
          "source": "s01",
          "source_sha256": "e23f8af34cf93c760ca684f84280ff4471fdedfaa181473c7f971b045b60c03d",
          "quote": "Valkey is licensed under the BSD 3-Clause licence.",
          "quote_sha256": "3a3f0e02bdbea8b65a114e5ac6d694302ab0caf99ee886d83ab20bca5b02ca04",
          "start": 0,
          "locator": "Line 1"
        }
      ],
      "authored_by": "researcher-invocation-01",
      "status": "confirmed"
    },
    {
      "key": "fact-00000000000000000000000000000002",
      "statement": "Valkey was forked from Redis.",
      "section": "origin",
      "subject": null,
      "questions": [
        "fork-origin"
      ],
      "as_of": "2026-10-15",
      "check": {
        "result": "confirmed",
        "by": "checker-invocation-02",
        "at": "2026-10-16T02:05:00Z",
        "change": "narrowed"
      },
      "original_statement": "Valkey was forked from Redis and preserves all Redis behavior.",
      "sources_count": 1,
      "best_standing": "primary",
      "conflicts_with": [],
      "superseded_by": null,
      "citations": [
        {
          "source": "s02",
          "source_sha256": "8e21024acf4c842093e3b71c0b358ba68e5a37856a1ed1367e0bed17ff260220",
          "quote": "Valkey was forked from Redis.",
          "quote_sha256": "793db2185c21cd8f963a9ee075dee8ef07e0279731a2da7da2d7a2b05a3258ee",
          "start": 0,
          "locator": "Line 1"
        }
      ],
      "authored_by": "researcher-invocation-01",
      "status": "confirmed"
    }
  ],
  "aliases": [
    {
      "key": "fact-00000000000000000000000000000003",
      "canonical": "fact-00000000000000000000000000000001",
      "reason": "An independently recorded duplicate was merged; the assertion is unchanged.",
      "original": {
        "key": "fact-00000000000000000000000000000003",
        "statement": "Valkey is licensed under the BSD 3-Clause licence.",
        "section": "licensing",
        "subject": null,
        "questions": [
          "valkey-licensing"
        ],
        "as_of": "2026-10-15",
        "check": {
          "result": "confirmed",
          "by": "checker-invocation-02",
          "at": "2026-10-16T02:05:00Z",
          "change": null
        },
        "original_statement": null,
        "sources_count": 1,
        "best_standing": "primary",
        "conflicts_with": [],
        "superseded_by": null,
        "citations": [
          {
            "source": "s01",
            "source_sha256": "e23f8af34cf93c760ca684f84280ff4471fdedfaa181473c7f971b045b60c03d",
            "quote": "Valkey is licensed under the BSD 3-Clause licence.",
            "quote_sha256": "3a3f0e02bdbea8b65a114e5ac6d694302ab0caf99ee886d83ab20bca5b02ca04",
            "start": 0,
            "locator": "Line 1"
          }
        ],
        "authored_by": "researcher-invocation-01",
        "status": "confirmed"
      },
      "by": "cross-invocation-03"
    }
  ],
  "revisions": [
    {
      "previous": {
        "key": "fact-00000000000000000000000000000004",
        "statement": "Valkey was forked from Redis and preserves all Redis behavior.",
        "section": "origin",
        "subject": null,
        "questions": [
          "fork-origin"
        ],
        "as_of": "2026-10-15",
        "check": null,
        "original_statement": null,
        "sources_count": 1,
        "best_standing": "primary",
        "conflicts_with": [],
        "superseded_by": null,
        "citations": [
          {
            "source": "s02",
            "source_sha256": "8e21024acf4c842093e3b71c0b358ba68e5a37856a1ed1367e0bed17ff260220",
            "quote": "Valkey was forked from Redis.",
            "quote_sha256": "793db2185c21cd8f963a9ee075dee8ef07e0279731a2da7da2d7a2b05a3258ee",
            "start": 0,
            "locator": "Line 1"
          }
        ],
        "authored_by": "researcher-invocation-01",
        "status": "candidate"
      },
      "current": "fact-00000000000000000000000000000002",
      "kind": "narrowed",
      "reason": "The source establishes fork origin but does not establish behavioral compatibility."
    }
  ],
  "gaps": [
    {
      "id": "gap-support",
      "question": "support-lifecycle",
      "kind": "insufficient",
      "sources": [
        "s01",
        "s02"
      ],
      "reason": "The two selected sources do not establish a support lifecycle.",
      "assessed_by": "researcher-invocation-01",
      "check": {
        "by": "checker-invocation-02",
        "result": "confirmed"
      }
    }
  ],
  "conflicts": [],
  "superseded": [],
  "missing": [],
  "rejected": [],
  "failed": [],
  "runtime_version": "0.9.0",
  "guidance_version": "0.9.0",
  "guidance_revision": "0000000000000000000000000000000000000009",
  "updated_at": "2026-10-16T02:06:00Z"
}
```

### `research/sources/valkey-license.md`

The original `fixtures/valkey-license.txt` has the same bytes.

```text
Valkey is licensed under the BSD 3-Clause licence.
```

### `research/sources/fork-origin.md`

The original `fixtures/fork-origin.txt` has the same bytes.

```text
Valkey was forked from Redis.
```

- **Keys identify immutable assertions.** Reuse preserves a key; aliases resolve merged
  duplicates. A narrowing relationship preserves the previous key and statement rather
  than silently changing what an old citation means.
- **Headlines and body sentences cite facts.** A zero-fact question uses a structured gap
  headline, an empty answer and recorded gap IDs. The renderer writes its gap message.
- **A narrowed replacement is confirmed on its own terms.** `original_statement` and
  `revisions` retain the earlier, broader assertion for auditing and citation verification.
- **Partial captures are labelled.** Both fixture sources carry `capture`, and the report
  marks their quotes "(partial capture)".
- **`sources_count` counts distinct publishers**, not quotations or mirrored copies.
  Unknown publisher identity is reported as unknown rather than inferred as independence.
- **Question/fact links are reciprocal** for the current canonical facts; aliases remain
  resolvable when a duplicate previously belonged to another question.
- **`rejected` and `failed`** are audit records, not current reference material. A failed
  required task would make this run `blocked`, rather than `complete-with-gaps`.
