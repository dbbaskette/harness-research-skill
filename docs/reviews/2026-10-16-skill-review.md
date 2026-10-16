# Harness Research at 0.9.3: what to simplify, speed up and make more useful

Date: 2026-10-16. Reviewed against the
[direction](../superpowers/specs/2026-10-15-harness-research-direction.md) (research the
harness does, bookkeeping the helper keeps, citations that last, light by default) and the
[0.9.1 live trials](../verification/0.9.1/live-acceptance/README.md). Measurements are from
this checkout at `b1939a2` and the saved trial evidence; nothing here is a benchmark.

## What the numbers say

| Measure | Value | Where |
| --- | --- | --- |
| Instructions loaded for a full checked run | 4,617 tokens (bootstrap 490, entry 623, `research-run.md` 3,395, start reply 109) | [README, measured instruction context](../../README.md) |
| Of `research-run.md`, the part a worker needs | Sources 559, research 349, checking 317, writing 358; the rest (1,630) is coordinator-only | measured per section |
| Brief the helper already puts in every task file | 59–258 tokens by task kind | `BRIEFS` in `research-run.mjs` |
| Helper reply per call | 150–800 tokens; mean 393 over 130 calls (`next` 644, `status` 322) | [installed transcript](../verification/0.9.1/installed/transcript.jsonl) |
| Helper time per call | 50 ms startup, 90 ms `status`, 130 calls in 12.2 s | timed on this checkout |
| One subagent, Claude Code trial | researchers 105–130k tokens, checkers 115–155k, writers 80–115k | this session's subagent accounting |
| Initial 10-question run, Claude Code | 25 min 17 s, 14 subagents, about 1.7M subagent tokens | [matrix](../verification/0.9.1/live-acceptance/matrix.json) |
| Same request, Codex | 6 min 37 s, 6 questions, 32 facts | matrix |
| Facts per question at light | cap 12; hit on 8 of 10 questions | `facts.json` of the trial |
| Report | 19.6k words for 10 questions; 65% evidence lists (now folded) | trial report |
| Legacy and comparative surface | `research.mjs` 22 KB; `upstream/` 140 KB, 26 files; 4 references, 2.7k tokens; 15 of 22 context rows | this checkout |

The helper is cheap. The cost is in what the agents read and write, and the helper's
limits shape that: the fact cap reads as a target, the writing brief allows 40 sentences,
and every worker who opens the reference reads the coordinator's half too.

## Recommendations, in order

### 1. Make light actually light (usefulness and cost)

`DEPTHS.light.facts` is 12 and researchers filled it on 8 of 10 questions. Writers then
wrote 12–26 sentences per question because the brief allows 1–40. Codex's run, with about
5 facts per question, read better and cost a quarter of the time. The direction says
"light by default: more than today's skill on every run", which 5–6 checked facts per
question already is.

- Set light to at most 6 facts per question and 2–10 answer sentences; keep standard at 20
  and deep at 30 facts. Word the brief as "up to", not a count to reach.
- Expected effect: checkers and writers read and produce about half as much; reports
  halve; nothing in the contract changes.

### 2. Give each worker only its own guidance (context)

A worker that follows "read `references/research-run.md`" loads 3,395 tokens, of which
about 1,600 are for the coordinator. The task file already carries a 60–260-token brief.
In the trial the coordinator pointed each worker at two sections by hand.

- Split the reference: `research-run.md` keeps start, coordinator, leases and return;
  a new `research-work.md` holds Sources, Plan and research, Independent checking,
  Cross-check and writing. The task file's `brief` names the section to read.
- Expected effect: each worker reads about 600 tokens of guidance instead of 3,400;
  the full-run row in the README drops for workers, and the coordinator's row is unchanged.

### 3. Compact replies and lease several tasks at once (performance)

`next` returns the whole status view plus the task (644 tokens), and every reply repeats
five absolute paths. The coordinator calls `next` once per task and waits for one
notification at a time; Codex ran its children together and finished in a quarter of
the time.

- `next --count N` leases up to N eligible tasks for N fresh worker IDs the coordinator
  supplies, so a section's researchers start in one call.
- Default replies for `next`, `peek` and `submit` carry run, status, counts, warnings and
  the task; paths only on `start` and `status` (or with `--verbose`).
- `submit --dry-run` validates a result without taking a refusal, so a worker can fix
  the 40-word or number-rule errors before its attempt counts.

### 4. Retire the legacy and comparative paths at 0.10 (simplification)

Brand's main already routes research to this skill; the only remaining use of the manual
commands is Brand's CI smoke of `plan`. No caller invokes the preserved upstream
`research-add-items`/`research-deep` bundles or the source-strategy modules. Yet every
save writes `.harness-research/research.json` and `research-report.md` for them,
`research.mjs` and the legacy projections are 26 KB of code, four references cost
2.7k tokens, and 15 of the 22 context rows describe these paths. The routing table in
`SKILL.md` spends 3 of its 5 rows on them, at a word budget that is already full (428 of 430).

- When Brand 0.14 pins 0.9.x and its smoke uses `research start`, stop writing the legacy
  projection for queued runs, remove `plan`/`record` from the entrypoint (keep `migrate`
  for old records), and move `upstream/` and the comparative and strategy references to
  a `legacy-0.8` tag with a NOTICE pointer.
- Expected effect: about 190 KB less in the package, 4 fewer references, the context table
  down to 7 rows, and room in `SKILL.md` for what users ask about.

### 5. Answers at a glance (usefulness)

The report opens with counts and contents, then 8–26 cited sentences per question. A
reader deciding whether to open a section has nothing between the count and the full
answer.

- After Coverage, list each section's questions with their one-line headlines. The
  headlines already exist and are cited; this is a render change in `renderReport`.

### Smaller points

- `research-run.mjs` is 87 KB in 899 lines, with lines up to 1,200 columns;
  `importOrigins` is 138 lines and `renderReport` 118. Nothing wrong with it, but the
  0.9.1 review took two passes to cover it. Breaking the two long functions into named
  steps would make the next review cheaper. No behaviour change.
- `peek` and `next` return a task's `questions` as IDs only in compact mode; a coordinator
  dispatching by section would use the section name. Minor.
- The checker contract requires opening every original, which is most of a checker's
  115–155k tokens. That is the price of the trust claim and should stay.

## What works and should stay

- Independent checking earns its cost: 14 of 111 first-pass facts narrowed, a wrong
  locator rejected, and a struck-through passage caught on the live page.
- Every helper limit that fired gave an actionable message; workers fixed and resubmitted
  on the same lease, never silently.
- Fact keys survived reuse, approval lapsed correctly after every change, and refresh
  reported the one changed source without touching the other 16.

## The instruction-context table

The README's measured table is accurate for what it counts: instruction files and one
start reply, by reading path. It leaves out the costs that dominate a run, which are now
stated beside it: helper replies, task files, the brief, and the agents' own reading. The
22 rows are mostly legacy and comparative routes; after recommendation 4 the table would
show the seven paths users take.
