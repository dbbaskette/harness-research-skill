# Claude Code trial: Redis vs Valkey, 0.9.0 against 0.8.1

Date: 2026-10-16. Harness: Claude Code (Claude Opus 5.5), in one desktop session.
Both runs started within three seconds of each other and used public web sources only.
No documents were supplied: this trial covers the public-source comparison, not the
spec's "two PDFs and two links" variant.

The request, given verbatim to both:

> Research Redis vs Valkey for a platform team choosing an in-memory data store:
> licensing, governance, architecture, persistence, clustering, performance,
> compatibility and migration, as of late 2026. Use public sources, primary
> documentation first. Save a cited report.

## How each ran

- **0.8.1 baseline.** The `v0.8.1` tag, extracted and used as an explicitly supplied
  local runtime and guidance. One agent, no subagents, following its guidance
  (`plan`, then a `record` per question). [Report](baseline-0.8.1/research-report.md),
  [the agent's notes](baseline-0.8.1/trial-notes.md).
- **0.9.0 (this branch).** The queued workflow at `light` depth, coordinated as the
  revised `references/research-run.md` describes. The coordinator wrote the plan and
  the cross-check itself. Eight section researchers ran in parallel. Each section's
  checker started as soon as that section's research was accepted. Three gap
  questions ran alongside the first five section writers. Every worker had its own
  minted `cc-` identity. [Report](new/research/report.md), [facts](new/research/facts.json),
  [plan as submitted](new/plan-submitted.json).

## Results

| | 0.8.1 baseline | 0.9.0 light |
| --- | --- | --- |
| Wall-clock time | 4 min 59 s | 13 min 50 s (2.8×) |
| Questions | 8 | 20 (17 planned + 3 gap) |
| Outcome per question | 8 "supported" | 11 answered, 9 partly answered, 18 recorded gaps |
| Facts or findings | 8 findings | 113 atomic facts |
| Independently checked | none | all 113, by 11 checker invocations |
| Changed by checking | — | 31 narrowed, 0 rejected |
| Quotes | 65 | 197 |
| Sources cited | 25 | 45 |
| Cited prose sentences | none (findings only) | 158 headlines and answer sentences |
| Agent invocations | 1 | 31 (coordinator, 11 researchers, 11 checkers, 8 writers) |

Timeline of the 0.9.0 run, in minutes from start: plan accepted at 1. Section
research was accepted between 2 and 4, and each check started as its section
arrived. All checks were in by 7.5. The cross-check was accepted at 8. Gap
research and five section writes ran together until about 10. The gap checks and
the last three writes finished at 13.8.

### Speed

The new workflow took 2.8 times as long as the old one, well short of an order of
magnitude, for about 2.5 times the questions and 14 times the checked atomic facts.
Most of the extra time is the independent check (about 3.5 minutes) and the extra
dependent waves (cross-check, gap round). Measured per-agent times: researchers 1 to 3
minutes, checkers 0.5 to 2.7 minutes, writers under 1.5 minutes. Coordinator overhead,
mainly reacting to each completion notification, made up much of the rest.

Run one after another, the same 30 worker invocations add up to about 45 minutes of agent time. The parallel
coordinator recipe is what keeps the multiple small.

### What the checking caught

Checkers opened the original pages and narrowed 31 facts. Examples:

- A Valkey slot-migration fact said the new method "replaced" legacy migration; the
  spec says Valkey Cluster "also supports" it.
- A benchmark figure was quoted as "729.4K RPS" while the live page says "729.4 RPS".
- A Valkey 8 throughput gain was attributed to I/O threading alone; the source says
  it also includes a prefetch change.
- Several facts carried details, such as command names, "must" for "use" or a
  causal "so", that their quotes did not state.

The 0.8.1 run marked all eight questions "supported" with one-paragraph summaries and
no second reader. It recorded no gaps as such; it folded them into each finding's limits.

### Friction seen in the 0.9.0 run, and what changed

- Three researchers named gap sources by file path or left them empty. Gaps can now
  name files registered in the same result, and the guidance says so.
- Two workers sent coverage `"partial"`; the helper now accepts it as "partly answered".
- A writer could not state a fact's own as-of date, because the number check looked only
  at fact statements. Dates of cited facts now count.
- Spelled-out counts ("four options") were refused when the quotes listed items without
  the number. That is the rule working as intended, and it is now named in the brief.
- A cross-cutting section's coverage line showed "(Redis 0, Valkey 0)". It now shows a
  subject breakdown only when the section has subject facts.

### Not covered by this trial

- No person has yet sampled 30 assertions and 30 answer sentences against their
  sources, so the spec's 9-in-10 quality bar is unmeasured. That needs a human reader.
- No Codex trial, no `deep` run, no broad-topic ("a report on LLMs") or deck fact-check
  run, and no run with supplied PDFs and links.
- Cost was not recorded. Token counts per agent are in the session, not here.
- Fetched page text (46 sources) is not committed here. Only the reports, facts, brief,
  plan and manifest are kept, and the manifest still verifies them.
