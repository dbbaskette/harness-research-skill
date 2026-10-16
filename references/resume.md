# Status and resume

Use the saved guidance task/runtime from the installed bootstrap. Do not refresh
guidance or create another plan merely to inspect status or continue the same work.

For queued runs (a saved `.harness-research/research-run.json`), use `research
status --project DIR`, resume its `guidanceTask` through the bootstrap when present,
and follow [the skill research workflow](research-run.md). Keep its current run ID,
task leases, source restrictions and independent-checking requirements. A null
next task can mean waiting or an ineligible checker. `blocked` and `stale` are not
finished research; retain and link the partial report while resolving the cause.
Status repairs derived exports from durable state. Its report is `research/report.md`.

The remaining instructions apply to existing manual `plan`/`record` runs:

```sh
node scripts/harness-research.mjs status --project DIR
```

This refreshes the local report and returns pending, unresolved and stale question
IDs, saved source mode and document coverage gaps. Read the report and selected
questions; reuse completed findings only when their inputs and source snapshots
are unchanged. Local hashes do not establish live-source currency.

Before resuming dependent content work, verify the report contains the agreed
findings, citations and gaps, with no pending questions or stale evidence in the
handoff scope. Guidance/task records alone are insufficient. If research is
`not-started`, incomplete or stale, load the workflow/evidence path and finish
the saved work first. A partial handoff requires explicit user direction;
insufficient/unavailable findings remain visible without blocking completed coverage.

Retain saved source restrictions, selected documents and completion boundary.
A supplied-only run does not authorize web searches. Reassess stale findings;
load [workflow](workflow.md) and [evidence](evidence.md) only when researching,
replanning or saving new findings. Keep earlier records in
`.harness-research/history/`. Return the report link and remaining gaps.

After an interrupted save, inspect the recorded process and lock before recovery;
never remove an active lock. Wait for a live save to finish before retrying.
