# Research a plan with several agents, and give callers output they can use

Date: 2026-10-15. Status: draft for review. Issue:
[harness-research-skill#9](https://github.com/dbbaskette/harness-research-skill/issues/9).

## Why

harness-research today is a ledger. It saves a plan of questions, checks and stores each
finding a caller records, and rewrites a report. The research itself, reading, searching,
fetching and judging, is done by whoever calls it.

Three studios now do that work the same way, each with its own copy of the code:

| | Training | Presentation | Blog |
| --- | --- | --- | --- |
| Orchestration | `runner/engine.py` | `runner/research_steps.py` | `scripts/studio_research/steps.py` (not committed) |
| Worker tools | copy of Presentation's | `runner/worker_tools.py` | `scripts/studio_research/tools.py` (not committed) |
| Workers at once | 3 | 3 | 1 |
| After 3 failed tries | question stays pending | question stays pending | records a made-up `unavailable` |
| Plan file | `.training-studio/research-plan.json` | `research/plan.json` | `research/plan.json` |
| Report shown | copy of harness-research's | its own, written from the record | copy of harness-research's |

The copies have already drifted: headlines, plan checks, retries and agent flags differ, and
Blog's port has regressions. Marketing Studio will need the same thing next. This design
moves the shared part into harness-research, so a caller makes one call and reads back
files it can use directly.

Measured so far (Training Studio milestone 2): Claude answered 8 of 8 questions for $2.31
in about five minutes; Codex answered 9 of 9 in about six. Presentation's research has never
been run live end to end.

## What changes

### 1. `research`: research a saved plan with several agents

```sh
node scripts/harness-research.mjs research --project DIR --agent claude|codex \
  [--parallel N] [--allow-web] [--again ID,...] [--about FILE] \
  [--budget-usd N] [--model NAME] [--effort LEVEL] [--minutes-per-try N]
```

- **Needs a saved plan.** `plan` stays the way a plan is saved. `research` works on the
  saved run and refuses when there is none.
- **One worker per pending question,** at most `--parallel` at once (default 3, at most 8).
- **`--again ID,...`** researches named questions again even though they have findings,
  after a change was asked for. Their old findings stay until a new one is accepted.
- **`--about FILE`** is a short text the caller writes about who the research is for and
  why. Every worker reads it. Training found that workers missed the angles that mattered
  until they were told what the training was about.
- **`--allow-web`** is required for workers to search and fetch, and only works when the
  plan's scope is `public-web`. A supplied-only plan never gets web tools.
- **Budget.** `--budget-usd` is checked before each worker starts, from the cost Claude
  reports. Each Claude worker also gets the remainder as its own `--max-budget-usd`. Codex
  reports tokens, not dollars, so for Codex the budget is a count of tries.
- **Time.** Each try is stopped after `--minutes-per-try` (default 15).

### 2. Workers

A worker is the person's own Claude Code or Codex, run without a terminal and confined to
the research tools in section 3.

- **Claude Code**, as Presentation runs it today: print mode with `stream-json` events, a
  strict MCP config naming only the research tools, `--tools WebSearch` only when web
  research is allowed, no saved session, no permission prompts, and the brief appended to
  the system prompt. Variables starting `CLAUDE` or `ANTHROPIC` are left out of its
  environment.
- **Codex**, as Presentation runs it today: `exec --json`, the user's config and rules
  ignored, the shell and the other built-in tools disabled, `web_search` live or disabled,
  and the research tools as its one MCP server.
- **Flags are checked, not assumed.** Both CLIs change often. Before the first worker,
  `research` reads `claude --help` or `codex exec --help` and refuses with a clear sentence
  if a flag it relies on is missing, instead of starting workers that will not be confined.
- **A job folder per try:** `.harness-research/jobs/<run>/<question>/<try>/`, holding the
  brief, the MCP config, the event stream, stderr and the tool log. A failed try can be read
  afterwards.
- **The brief** is one file in the runtime, `briefs/question.md`: the question, the topic,
  the purpose, the scope, the `--about` text, the evidence rules, and "never ask the person
  anything". It replaces each studio's own wording.
- **Processes** run in their own process group. Timeout and stop kill the whole group.

### 3. The research tools

`node scripts/harness-research.mjs serve-tools --job DIR` is an MCP server over stdio,
written in Node with no dependencies. It is started by the worker, not by people.

| Tool | Offered | Does |
| --- | --- | --- |
| `list_inputs`, `read_input(name, part)` | always | The question, the `--about` text and the plan's input files |
| `read_source(source_id, offset, length)` | always | A window of up to 12,000 characters of a supplied snapshot or a saved page |
| `search_source(source_id, query)` | always | Where words occur in a source, with offsets, at most 8 |
| `save_source(url)` | with `--allow-web` | Fetches a public page, saves it as text, returns its `source_id` and the first window |
| `submit_finding(...)` | always | Checks a finding and hands it back to the coordinator |

**Fetching** follows Presentation's rules, ported to Node:

- Only `http` and `https`, no user names in the URL, at most 2,000 characters.
- Every address the name resolves to must be public. Private, loopback, link-local,
  shared-address, multicast and reserved ranges are refused, including IPv4 addresses inside
  IPv6.
- The connection goes to the address that was checked. Each redirect is checked again, at
  most 5 hops.
- 40 seconds and 8 MB per request, 30 saved pages per question.
- Behind a proxy (`HTTPS_PROXY`), the proxy connects and the address cannot be pinned; the
  tool says so in its result.
- HTML becomes text: scripts, styles and navigation are dropped, block elements become line
  breaks, and entities are decoded. A PDF becomes text through `pdftotext` when it is
  installed; otherwise the page is refused with that reason.
- Pages are saved as `research/web/<sha256>.md`, named by their text, with a first line
  giving the URL and the time fetched. The same text is saved once.

**`submit_finding(question, status, headline, summary, limits, evidence)`** checks a finding
before the coordinator sees it:

- `status` is supported, contradicted, insufficient or unavailable. Supported and
  contradicted need at least one passage.
- Each passage is `{source_id, quote}`. The quote is found exactly first, then allowing for
  differences in spacing, quote marks and dashes. The stored quote is always the source's
  own wording, with its offset.
- One set of limits, used by the tool, the brief and `record` alike: each quote 20 to 900
  characters; 1 to 20 passages; a headline of at most 25 words and 300 characters on one
  line; a summary of at most 1,500 characters.
- A refused finding gets a reason the worker can act on. A worker may hand back up to 6
  times in one try.

### 4. Coordinating

- **Recording** happens in the coordinator's own process, through the existing lock, as soon
  as a finding is accepted. A finding is never left only in a worker's folder.
- **Tries.** Three per question. The reason the last try failed is added to the next try's
  brief. A try stopped by the person does not count.
- **A question that fails three times stays pending,** with its last reason shown in
  `status` and the report as `failed`. It is not recorded as `unavailable`: that verdict
  means the evidence could not be found, not that the tool broke.
- **An agent that cannot start** (not signed in, not installed, out of quota) stops the whole
  run with that reason, after the workers already running finish.
- **Stop and resume.** SIGINT or SIGTERM stops new workers, kills running ones and exits.
  Running `research` again resumes at the next pending question.
- **Progress** is JSON lines on stdout, one event per line: `started`, `question-started`,
  `tool`, `page-saved`, `finding-recorded`, `question-failed`, `stopped`, `done`. The last
  line is the same summary `status` returns, plus the cost spent. A caller can show progress
  and stop the run.
- **A query log.** Every web search query a worker makes, read from the Claude and Codex
  event streams, is written to `.harness-research/queries.jsonl` with its question. The
  person can see what was sent out.

### 5. Output callers can read directly

Written on every save, next to the record and the report:

- **`.harness-research/findings.json`**, schema 1:
  - Run: `schema`, `run`, `topic`, `purpose`, `scope`, `status`, `counts` by verdict,
    `pending`, `failed`, `source_gaps`, `carried`.
  - Each question: `id`, `question`, `status`, `headline`, `summary`, `limits`, `stale`, and
    `citations: [{key, quote_sha256, title, origin, quote, locator, source_date, file}]`.
  - `key` is `<question>#<n>`. `quote_sha256` lets a caller check later that the passage a
    key named is still the same, because `n` can point at a different passage after a
    question is researched again.
- **`.harness-research/brief.md`**: one line per question with its verdict and headline, then
  the open questions. Short enough to hand to the next worker as context.
- **`research/plan.json` and `research/plan.md`** become harness-research's files. `plan`
  writes them, so the studios stop writing their own.

The report keeps its place and gains:

- Plain URLs that can be clicked, instead of escaped text.
- A numbered list of sources at the end, with each citation pointing to it.
- When research finishes, a copy at `research/report.md`, which is what Training and Blog
  already copy by hand.

### 6. Guidance

- `SKILL.md` and `workflow.md`: when the host can run a supported agent CLI and the person
  has agreed to the cost, use `research`; otherwise research sequentially as today. Running
  workers spends the person's own Claude or Codex allowance, so it needs their go-ahead.
- `evidence.md`: the new files, the one set of limits, `failed`, and the query log.
- `resume.md`: resuming is running `research` again.

## Decisions to make before building

These are not in the issue. Each one affects how good the result is as "a topic in, a
report out". The review below explains why.

1. **A cited synthesis at the top of the report.** After every question is answered, one
   more worker reads `findings.json` and writes the overall answer: the main points, where
   findings disagree, and what is still unknown. Every sentence cites finding keys, and
   `record-synthesis` refuses a key that does not exist. Recommended.
2. **A support check.** An independent worker reads each finding's passages and says whether
   they support its headline and summary. A finding that fails is marked `needs-review` in
   the report and in `findings.json`; it is not removed. About one more worker per question.
   Recommended, behind `--check`, on by default for fact-checks.
3. **Question kinds.** Supported and contradicted fit claims. An open question ("What are the
   migration routes?") is always "supported", which tells the reader nothing. A plan item
   could take `kind: claim | open`, and an open question would be shown as answered, partly
   answered or not answered. Recommended, as a display change that keeps the stored verdicts.
4. **Drafting the plan from a topic.** `plan --draft --topic TEXT --agent ...` would have one
   worker propose the questions, with kinds and public queries, for the caller to approve.
   Every studio drafts its own plan today. Recommended only if standalone use matters as much
   as studio use.
5. **Private words in searches.** A worker that reads supplied documents and searches the web
   can put private words in a query. The brief forbids it and the query log shows it, but
   nothing stops it. A stronger option is a supplied-only first pass and a separate web pass
   whose worker never sees the private documents. Decide whether the log is enough.
6. **Where each passage came from.** `record` accepts a quote from any file in the project,
   including one the caller wrote itself. Each citation could carry `provenance`: `fetched`
   (saved by `save_source`), `supplied` (a registered document) or `caller` (anything
   else), shown in the report and in `findings.json`. Recommended.

## Review: how well this will work

### As a way to run a plan: well

- **Evidence gets more trustworthy.** Today a caller can write a snapshot file itself and
  quote it, and the quote check passes. With `research`, pages are fetched and saved by the
  tool, so a quote has to come from a page that was really fetched. That closes the biggest
  hole in the current design.
- **It is fast enough and affordable.** Eight to ten questions took five to six minutes and
  about $2.30 with Claude in Training's trial; three at once should keep a 20-question plan
  near ten minutes and $5 to $6.
- **One copy instead of three.** The drift between the studios stops, and the fixes Blog's
  port lost come back.
- **The fetching rules are good.** Public addresses only, pinned connections and checked
  redirects are stronger than most research tools manage.

### As "a topic in, a research report out": not yet

The issue automates the middle step. The two ends, which decide how good the report is,
stay as they are.

1. **The questions decide the report, and nobody checks them.** `research` starts from a
   saved plan. A plan of broad questions gives broad answers. The one standalone report I
   could find on this computer (Valkey vs Redis, 8 October) had nine questions such as "What are in-memory
   data structures and their customer use cases?"
2. **The report is a ledger, not a report.** It lists each question with its verdict,
   summary, limits and quotes. There is no overall answer, no reading across questions, no
   recommendation, and it lives in a hidden folder. `brief.md` is shorter, not more useful.
   Someone who asked "Should we move from Redis to Valkey?" has to assemble the answer
   themselves.
3. **A quote that exists is not a quote that supports.** The checks prove the passage is in
   the source, not that it says what the summary says. In the Valkey report every question
   was "supported" by one passage. The first summary claims caches, sessions, counters and
   rankings; its only passage is "Valkey is a data structure server." Parallel workers
   produce more of this faster unless something checks support (decision 2).
4. **The verdicts suit claims, not questions.** All nine Valkey questions were open
   questions, not claims, so "supported" said nothing about how well each was answered
   (decision 3).
5. **Workers do not see each other.** Each question is researched alone. The same pages are
   fetched several times, terms drift between findings, and a contradiction between two
   questions is never noticed. Only a synthesis step sees across them (decision 1).
6. **The web is harder than the tools assume.** Pages built by JavaScript come back nearly
   empty, some sites refuse automated requests, PDFs need `pdftotext`, and a plain HTML to
   text conversion keeps menus and loses tables. Expect some findings to be `insufficient`
   for reasons that are about fetching, not evidence.
7. **Private words can leave in searches.** A worker reads the supplied documents and then
   writes its own search queries. The plan's reviewed `public_query` is only a suggestion
   to it (decision 5).
8. **Running agents from inside an agent has costs.** It spends the person's own Claude or
   Codex allowance. It may not work inside a sandboxed session, needs both CLIs signed in,
   and breaks when either CLI changes its flags, which happens often. Codex has no dollar
   limit.

### What it would take

With decisions 1, 2, 3 and 6, the same run produces a report that answers the topic, shows
how strong each answer is, and marks passages that do not hold up. Decision 4 matters only
for standalone use; the studios already draft their plans. The rest of the plan does not
depend on these choices, so building can start while they are settled.

## Not changing

- `plan`, `record`, `status` and `migrate`, the record format, staleness, locking and
  history. `research` uses them; sequential callers keep working.
- The rule that only quoted, inspected passages count as evidence.
- No new runtime dependencies. Node 20 or newer remains the only requirement; `pdftotext`
  is used when present.

## Testing

- **A stand-in agent:** test executables named `claude` and `codex` that start
  `serve-tools`, call its tools from a script and hand back findings, including refused
  ones, slow ones and failures. The coordinator is tested against them end to end: parallel
  recording through the lock, three tries with the reason carried over, stop and resume,
  `--again`, budget, the agent-cannot-start stop, and progress events.
- **The tools:** each limit and refusal; quote placing with spacing, quote-mark and dash
  differences, and the stored wording; fetch rules against a resolver that returns private
  addresses, redirects into private ranges, oversize and slow responses. Tests use a local
  server through an injected resolver, never a switch that loosens the real checks.
- **The flag check:** refusing when a needed flag is missing from `--help`.
- **Output:** `findings.json` against its schema, keys and `quote_sha256`, `brief.md`, and
  the report's links and source list.
- **A live trial** before release, recorded in `docs/verification/`: one public-web plan of
  about ten questions with each agent, timed and costed, with the report read by a person.

## Release and adoption

- harness-research 0.9.0. A runtime change, so the manifest's `minimumRuntime` moves to 0.9.0
  and Brand's pin follows.
- Then the studios, in the issue's order: Blog, Presentation, Training. Each replaces its
  orchestration with `research` and keeps only its own rules: who may allow web research,
  how questions are worded, its gates, and what the findings feed.
- Blog's uncommitted `studio_research/tools.py` and `steps.py` should stop at the runtime
  wrapper, the folder layout and plan building, so the tools are not ported a fourth time.

## Build order

1. `serve-tools` with fetching, reading, searching and `submit_finding`, and their tests.
2. The coordinator for one agent (Claude), with the stand-in, tries, recording, stop and
   resume, progress and the job folders.
3. Codex, the flag check, the budget and the query log.
4. `findings.json`, `brief.md`, `research/plan.*` and the report changes.
5. Guidance, the live trial and the 0.9.0 release.
6. Whichever of the six decisions are accepted, as 0.9.x.
