# Research a topic with several agents: vetted, cited facts

Date: 2026-10-15. Status: draft 3, after the owner's review of draft 1 and two additions.
Issue: [harness-research-skill#9](https://github.com/dbbaskette/harness-research-skill/issues/9).

## What it is for

A topic and, optionally, some starting sources go in: links, and documents such as PDFs.
What comes out is a report of facts about that topic with their citations, for people and
studios to use as references:

- Each fact is one sentence that stands on its own.
- Each fact quotes, exactly, a source the person gave or a page the run fetched.
- Each fact has been checked by a second agent that did not write it.
- Nothing is concluded from the facts. There is no answer, summary or recommendation: the
  caller decides what the facts mean.

"Vetted" here means traceable and checked for support. It does not mean true: a fact quoted
correctly from a wrong or out-of-date source is still wrong. Each fact therefore shows where
it came from, what kind of source that is, and the date it holds for, so the reader can judge.

## Why

harness-research today is a ledger. It saves a plan of questions, checks that each recorded
quote is in its source, and rewrites a report. The research itself is done by whoever calls
it, and three studios each do it with their own copy of the code:

| | Training | Presentation | Blog |
| --- | --- | --- | --- |
| Orchestration | `runner/engine.py` | `runner/research_steps.py` | `scripts/studio_research/steps.py` (not committed) |
| Worker tools | copy of Presentation's | `runner/worker_tools.py` | `scripts/studio_research/tools.py` (not committed) |
| Workers at once | 3 | 3 | 1 |
| After 3 failed tries | question stays pending | question stays pending | records a made-up `unavailable` |
| Plan file | `.training-studio/research-plan.json` | `research/plan.json` | `research/plan.json` |

The copies have drifted, and Marketing Studio will need the same thing next.

The output is also weaker than it looks. The one standalone report I could find on this
computer (Valkey vs Redis, 8 October) marked all nine of its questions "supported", each by a
single quote. The first summary claims caches, sessions, counters and rankings; its only
quote is "Valkey is a data structure server." The caller had written that snapshot itself.
The checks passed.

Measured so far (Training Studio milestone 2): Claude answered 8 of 8 questions for $2.31 in
about five minutes; Codex answered 9 of 9 in about six.

## The run

```sh
node scripts/harness-research.mjs research --project DIR --agent claude|codex \
  [--topic TEXT] [--source PATH_OR_URL ...] [--sources LIST_FILE] [--about FILE] \
  [--allow-web] [--plan-only] [--checker claude|codex] [--parallel N] [--again ID,...] \
  [--budget-usd N] [--model NAME] [--effort LEVEL] [--minutes-per-try N]
```

With `--topic`, it plans and then researches. Without it, it researches the plan already
saved, which is how a studio that drafts and approves its own plan uses it.

| Stage | Workers | Produces |
| --- | --- | --- |
| 0. Take in sources | none | a readable copy of each source the person gave |
| 1. Plan | one | the questions |
| 2. Research | one per question, several at once | facts with quotes |
| 3. Check | one per question, several at once | each fact confirmed, narrowed or rejected |
| 4. Cross-check | one | duplicates merged; conflicts, superseded facts and missing angles listed |
| 5. Write | none | `research/report.md`, `research/facts.json`, `research/brief.md` |

Every stage records as it goes, so a stopped run resumes where it stopped.

### 0. Take in the starting sources

The person can give sources with `--source` (repeated) or `--sources FILE`, a list with one
path or link per line and an optional title after a tab.

- **Documents**, by type:

  | Type | Becomes text by |
  | --- | --- |
  | PDF | `pdftotext`, when installed (`brew install poppler`) |
  | Word (`.docx`) and PowerPoint (`.pptx`) | the runtime's own reader, which unzips the file and reads its text; no dependency |
  | HTML, Markdown, plain text | as they are, with HTML reduced to text as for fetched pages |
  | Anything else, or a scanned PDF with no text layer | not read; listed as a gap with the reason |

- **Links** are fetched once, at the start, by the run itself, with the same limits as any
  fetch (section 2). Because the person chose them, a link to a private address, such as an
  intranet page, is allowed; a page that needs signing in comes back as a gap, and the
  person can save it as a PDF and pass that instead. Workers can never fetch private
  addresses.
- The original is kept and its text is saved as `research/sources/<key>.md`, where `key` is
  a short hash of the origin and the text, so the same document has the same name on any
  computer. Each becomes a selected source in the plan, with its title, origin and any
  extraction limit, exactly as supplied documents are registered today.
- A source that cannot be read stays in the plan with its reason, so the report shows it as
  a gap rather than dropping it.
- Without `--allow-web`, the research uses only these sources (`supplied-only`). With it,
  workers may also search and fetch (`public-web`).
- Workers are told to read the supplied sources first. A supplied source does not outrank
  a fetched one; when they disagree, both facts stay and the cross-check shows the
  conflict.

A calling agent that can already read a format the runtime cannot (a scanned PDF, a Google
Doc) extracts the text itself and passes the text file, keeping the original as before.

### 1. Plan from the topic

- One worker drafts 8 to 20 questions from the topic, the `--about` text and the supplied
  sources: their titles, headings and opening text. The `--about` text says who the research
  is for and why; Training found workers missed the angles that mattered until they were
  told.
- The brief gives it the angles to cover: what the subject is, how it works, its history and
  dates, its current state and versions, numbers (size, speed, price), how it compares with
  alternatives, its limits, risks and known problems, and who is involved. It drops angles
  the topic does not need, and adds questions the supplied sources clearly raise.
- Each question is `open` (most) or a `claim` to test. With `--allow-web`, each also gets a
  public search query.
- The plan is saved with `plan`, as today, and also written as `research/plan.json` and a
  readable `research/plan.md`.
- `--plan-only` stops here, so a caller can show the plan for approval and run `research`
  again to continue. Without it, the run carries on.

### 2. Research each question

One worker per question, at most `--parallel` at once (default 3, at most 8). A worker is the
person's own Claude Code or Codex, run without a terminal and confined to these tools:

| Tool | Offered | Does |
| --- | --- | --- |
| `list_inputs`, `read_input(name, part)` | always | The question, the topic, the `--about` text, the plan's input files |
| `list_sources` | always | The supplied sources and the pages saved so far in this run |
| `read_source(source_id, offset, length)` | always | A window of up to 12,000 characters of a source |
| `search_source(source_id, query)` | always | Where words occur in a source, at most 8 places |
| `save_source(url, standing)` | with `--allow-web` | Fetches a public page, saves it as text, returns its `source_id` |
| `submit_facts(...)` | always | Checks the facts and hands them to the coordinator |

Plus the agent's own web search, with `--allow-web` only.

**`submit_facts(question, coverage, facts, gaps)`**:

- `coverage` is `answered`, `partly answered` or `not answered` for an open question. A
  claim question also gives `verdict`: `supported`, `contradicted` or `insufficient`.
- Each fact is `{statement, as_of, quotes: [{source_id, quote}]}`:
  - `statement`: one sentence of at most 40 words that names its subject (no "it" or
    "this"), with numbers, dates and versions as the source gives them.
  - `as_of`: the date the fact holds for, when the source says.
  - `quotes`: 1 to 5 passages. Each is found exactly, then allowing for differences in
    spacing, quote marks and dashes, and is stored in the source's own wording. 20 to 900
    characters each.
- **Every number in a statement must appear in one of its quotes.** Numbers, years and
  version strings are compared after normalising separators. This catches the most common
  invented detail before any agent looks at it.
- 1 to 25 facts per question. `gaps` says in plain words what the question still lacks.
- A refused submission gets a reason the worker can act on, up to 6 times in one try.

**Fetching by workers** follows Presentation's rules, ported to Node with no dependencies:

- Only `http` and `https`, no user names in the URL, at most 2,000 characters.
- Every address the name resolves to must be public: private, loopback, link-local,
  shared-address, multicast and reserved ranges are refused, including IPv4 inside IPv6.
- The connection goes to the address that was checked; each redirect is checked again, at
  most 5 hops. 40 seconds and 8 MB per request, 30 pages per question.
- Behind a proxy, the proxy connects and the address cannot be pinned; the tool says so.
- HTML becomes text with scripts, styles and navigation dropped and block elements as line
  breaks. A linked PDF becomes text through `pdftotext` when it is installed; otherwise the
  page is refused with that reason.
- Pages are saved as `research/web/<sha256>.md`, named by their text, with a first line
  giving the URL and the time fetched. A page saved by one worker is listed for the others.
- `standing` is the worker's label for the source: `primary` (the subject's own
  documentation, specifications, announcements, standards or filings), `secondary` (press,
  analysts) or `community` (forums, personal blogs).

### 3. Check every fact

One checker per question, in a new session that never sees the researcher's reasoning.

- It is given each fact's statement and quotes, with about 600 characters around each quote
  read from the saved source.
- For each fact it returns:
  - `confirmed`: the quotes say this.
  - `narrowed`: the statement says more than the quotes. It gives the narrower statement the
    quotes do support, which replaces the original; the original is kept for the record. The
    narrower statement must pass the number rule too.
  - `rejected`: the quotes do not support it, or the statement misreads them, with a reason.
- Rejected facts are moved to a rejected list, shown at the end of the report, never deleted.
- `--checker` can name the other agent, so Codex checks Claude's facts or the other way
  round. When both are installed, that is the default: one model is more likely to miss its
  own kind of mistake.

### 4. Cross-check the set

One worker reads every checked fact: statements, keys, sources, dates and standing, not the
quotes. It returns only references to existing facts:

- **Duplicates:** facts that state the same thing are merged into one, keeping every quote,
  so the merged fact shows how many independent sources back it.
- **Conflicts:** facts that disagree, with one line on how (different dates, versions,
  scope). Both stay; the report shows them side by side.
- **Superseded:** an older fact that a newer one in the set replaces, such as a licence that
  has since changed.
- **Missing angles:** what the set does not cover that the topic needs.

It cannot add facts or conclusions. The coordinator refuses any key that does not exist.

### 5. Output

All in `research/`, where a person will look:

- **`research/report.md`**, a reference document:
  - A header: topic, date, scope, the sources given, how many facts and sources, and how the
    facts were checked.
  - For each question, its facts as a list. Each shows its citation numbers, its as-of date,
    whether it was narrowed, and "one source" when only one publisher backs it.
  - Conflicts, superseded facts and missing angles, from the cross-check.
  - Gaps: questions partly or not answered, and sources that could not be read, with why.
  - Sources, numbered: title, a clickable URL or the file name, publisher, standing, and
    "given" or the date fetched.
  - Rejected facts, with the checker's reasons, for anyone auditing the run.
- **`research/facts.json`**, schema 1, the same content for programs:
  - `sources: [{id, title, origin, publisher, standing, provenance, fetched_at, source_date,
    file, limits}]`, where `provenance` is `supplied` (a file or link the person gave),
    `fetched` (saved by a worker) or `caller` (any other project file a caller quoted
    through `record`).
  - `questions: [{id, question, kind, coverage, verdict, gaps, facts}]`.
  - `facts: [{key, statement, as_of, questions, check, original_statement, sources_count,
    best_standing, conflicts_with, superseded_by, citations: [{source, quote, quote_sha256,
    start, locator}]}]`.
  - `rejected`, `conflicts`, `missing`, and run counts.
  - A fact's `key` is the question ID and a short hash of its statement, such as
    `licensing.3fa9c2`. It stays the same when the run is repeated and the fact is found
    again, so a deck, a training or a blog can cite it and later check it.
- **`research/brief.md`**: every fact with its key, one per line, no quotes. The shortest
  context to hand a downstream worker.

The record (`.harness-research/research.json`), its history and the current report keep
their places, so status and resume work as today.

### Coordinating

- **Recording** happens in the coordinator's own process, through the existing lock, as soon
  as a stage's result is accepted.
- **Tries.** Three per worker. The reason the last try failed is added to the next try's
  brief. A try stopped by the person does not count.
- **A question that fails three times stays pending** and is shown as `failed`, with its last
  reason. It is never recorded as a finding.
- **An agent that cannot start** (not installed, not signed in, out of quota) stops the run
  with that reason, after running workers finish.
- **Stop and resume.** SIGINT or SIGTERM stops new workers, kills running ones and exits.
  Running `research` again resumes. `--again ID,...` researches named questions again; their
  facts stay until new ones are checked. A source added later needs the plan saved again, as
  today.
- **Progress** is JSON lines on stdout: `stage`, `source-read`, `worker-started`, `tool`,
  `page-saved`, `facts-recorded`, `facts-checked`, `worker-failed`, `stopped`, `done`. The
  last line is the final status with the cost spent.
- **Budget.** `--budget-usd` is checked before each worker, from the cost Claude reports, and
  each Claude worker gets the remainder as its own limit. Codex reports tokens, not dollars,
  so for Codex the budget counts workers.
- **Time.** Each try is stopped after `--minutes-per-try` (default 15).

### Running the agents

- **Claude Code**, as Presentation runs it today: print mode with `stream-json` events, a
  strict MCP config naming only the research tools, web search only with `--allow-web`, no
  saved session, no permission prompts, the brief appended to the system prompt, and no
  `CLAUDE` or `ANTHROPIC` variables in its environment.
- **Codex**, as Presentation runs it today: `exec --json`, the user's config and rules
  ignored, the shell and other built-in tools disabled, web search live or disabled, and the
  research tools as its one MCP server.
- **Flags are checked, not assumed.** Both CLIs change often. Before the first worker,
  `research` reads their help and refuses with a clear sentence if a flag it relies on is
  missing, rather than start workers that are not confined.
- **One folder per try**, `.harness-research/jobs/<run>/<stage>/<question>/<try>/`, with the
  brief, MCP config, event stream, stderr and tool log.
- **Briefs** live in the runtime, one per stage, and replace each studio's own wording.
- Each worker runs in its own process group; timeout and stop kill the whole group.

## Changes to the existing commands

- `record` accepts findings with `facts`, `coverage` and `verdict`, alongside today's
  `status`, `summary` and `evidence`, so sequential callers keep working. A result recorded
  the old way is shown as today, and its citations are marked `caller` unless the quoted file
  is a fetched page or a supplied source.
- For readers that only know `status`: an open question's coverage maps to `supported` when
  answered and `insufficient` otherwise.
- `headline` and `summary` stay accepted but are not produced by `research`. A studio gate
  that shows headlines (Presentation) shows the question's facts instead.
- `plan` keeps accepting `sources` as today; `research --source` fills them in for the caller.

## Guidance

- `SKILL.md` and `workflow.md`: research a topic with `research --topic`, passing the
  person's links and documents as `--source`, when the host can run a supported agent and
  the person has agreed to the cost; otherwise research sequentially as today. Workers spend
  the person's own Claude or Codex allowance.
- `evidence.md`: facts, the checks, provenance, the new files and the limits.
- `resume.md`: resuming is running `research` again.

## Not changing

- `plan`, `status` and `migrate`, staleness, locking and history.
- The rule that only exact, inspected quotes count as evidence.
- No new runtime dependencies. Node 20 or newer remains the only requirement; `pdftotext`
  is used when present.

## Testing

- **Stand-in agents:** test executables named `claude` and `codex` that start the tool
  server and play scripted parts: a drafter, researchers that submit good, padded and
  refused facts, a checker that confirms, narrows and rejects, and a cross-checker that
  merges and flags. The coordinator is tested end to end against them: stages, parallel
  recording through the lock, tries with the reason carried over, failures, stop and resume,
  `--again`, `--plan-only`, budget, and the agent-cannot-start stop.
- **Taking in sources:** a PDF with and without a text layer, `pdftotext` missing, Word and
  PowerPoint files, HTML and Markdown, an unreadable type, a link to a private address given
  by the person, a link that needs signing in, a list file with titles, and keys that are
  the same on two computers.
- **The tools:** each limit and refusal; quote placing; the number rule; fetch rules against
  a resolver that returns private addresses, redirects into private ranges, oversize and
  slow responses, through an injected resolver and a local server, never a switch that
  loosens the real checks.
- **Output:** `facts.json` against its schema; keys that stay the same across runs; merging
  and conflict links; the report's sections, links and source numbering; provenance.
- **A live trial** before release, recorded in `docs/verification/`: two topics, one with
  supplied PDFs and links and one from the topic alone, each agent researching and the other
  checking, timed and costed, and the report read by a person.

## Release and adoption

- harness-research 0.9.0, a runtime change: the manifest's `minimumRuntime` moves to 0.9.0 and
  Brand's pin follows.
- Then the studios: Blog, Presentation, Training. Each calls `research` and keeps only its own
  rules: who may allow web research, how the topic and `--about` text are written, which of
  its documents it passes as sources, its gates (with `--plan-only`), and what the facts
  feed. Their citations move from finding IDs to fact keys.
- Blog's uncommitted `studio_research/tools.py` and `steps.py` should stop at the runtime
  wrapper and the folder layout, so the tools are not ported again.

## Build order

1. Taking in sources, and the tool server: fetching, reading, searching and `submit_facts`
   with its checks.
2. The coordinator with one agent (Claude): stages 2 and 5 from a saved plan, with tries,
   recording, stop and resume, progress and job folders.
3. Stage 3, the checker, and `facts.json` with keys and provenance.
4. Stage 1 (plan from a topic and sources) and stage 4 (cross-check).
5. Codex, the flag check, the budget, and `--checker` with the other agent.
6. The report, guidance, the live trial and the 0.9.0 release.

## Review: how well this will work

### What it does well

- **Every fact traces to a real passage** in a source the person gave or a page the run
  fetched, with provenance showing which.
- **Every fact is checked by an agent that did not write it,** ideally another model, and a
  statement that claims more than its quote is cut back to what the quote says.
- **Made-up numbers are refused mechanically,** before any agent judges anything.
- **Conflicts and dated facts are visible,** not resolved behind the reader's back.
- **The person's own sources come first,** and an unreadable one is reported, not dropped.
- **One component instead of three,** usable by every studio and on its own.

### What will still go wrong

1. **A quoted fact can still be false.** The checks prove the source says it, not that the
   source is right or current. Standing, as-of dates and the superseded list help the reader;
   they do not replace judgement.
2. **The checker is a model too.** It will sometimes confirm a misreading or reject a good
   fact. Using the other agent reduces shared blind spots; it does not remove them.
3. **Coverage is only as good as the questions.** The drafter can miss an angle. The angle
   list, the `--about` text, the supplied sources and the cross-check's missing angles reduce
   that; a person reading the plan (`--plan-only`) catches the rest.
4. **Text extraction loses things.** Tables, charts and slide layouts flatten into text, a
   scanned PDF has no text at all, and PDFs need `pdftotext` installed. A fact that lives
   only in a chart cannot be quoted. Gaps will say which sources were affected.
5. **The web fights back.** Pages built by JavaScript come back nearly empty, some sites refuse
   automated requests, and intranet links that need signing in cannot be read. Some
   questions will be partly answered for reasons about fetching, not evidence.
6. **It costs more than research alone.** Checking adds a worker per question, and planning
   and cross-checking add one each. Estimate, to be measured in the trial: a 15-question topic
   at about $6 to $9 and 15 to 20 minutes with three workers at once.
7. **The report is long.** Fifteen questions can give 150 facts. It is a reference, read by
   section; `brief.md` is the short form.
8. **Agents run inside agents.** It spends the person's allowance, may not work inside a
   sandboxed session, needs the CLIs signed in, and depends on CLI flags that change; the flag
   check turns that into a clear refusal rather than an unconfined worker.

## Settled in review

- **No answer or synthesis.** Research produces facts to use as references; the caller draws
  conclusions. Draft 1's synthesis became the cross-check, which only points at facts.
- **Support check:** yes, as stage 3, per fact.
- **Question kinds:** yes; open questions show coverage instead of a verdict.
- **Topic as input:** yes, as stage 1, with `--plan-only` for callers that approve plans.
- **Starting sources as input:** yes, as stage 0: links and documents such as PDFs.
- **Private words in searches:** not a concern; no query log or separate pass.
- **Provenance:** yes, on every source and citation.
