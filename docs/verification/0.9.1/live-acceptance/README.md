# 0.9.1 live acceptance

**Every new command was reached from a plain-language request in both Claude Code
and Codex, on a fresh narrow run and the follow-ups to it.** Each harness chose the
right command, reported non-confirmed and superseded results honestly, said when
an approval stopped applying, and kept fact keys and history across reuse. No
human sample scoring was done; this is model and mechanical evidence.

## Scope the owner chose

Before any live trial, the owner chose, from the options offered: one fresh
narrow light run per harness, followed by plain-language requests to verify,
research again, approve, refresh, find and reuse it, in Claude Code and Codex.
The design's [full matrix](../../../superpowers/specs/2026-10-15-research-with-agents-design.md#acceptance-better-than-today-measured)
(broad, deep, fact-check and supplied-only reports, and the human sample) was not
rerun for 0.9.1. The [0.9.0 record](../../0.9.0/live-acceptance/README.md) keeps
those results and limits.

Both harnesses used the candidate's helper (`harness-research 0.9.1`, installed
into disposable `--home`/`--shared`) and its guidance as an explicitly supplied
local checkout of `55d1695`. Neither ran the bootstrap or a public guidance refresh.

## The request and follow-ups

The same requests went to both harnesses ([Claude Code](claude-code/requests.md),
[Codex prompts](codex/turns/)):

1. Research SQLite WAL mode for an application team deciding whether to enable it
   (readers and writers, checkpoints, durability, limitations); public sources,
   sqlite.org first; focused; saved cited report.
2. "Before I publish [these slides], check that every fact they cite still holds."
3. "I've read the saved research report and I approve it as it stands", recorded
   under the synthetic name *Trial Reviewer*.
4. "Research the checkpoint question again", focusing on long-lived readers and
   detecting or avoiding checkpoint starvation.
5. "Refresh this research against the current versions of its web sources."
6. "Find my earlier SQLite research … and start [a runbook project] from it, adding
   how to monitor and tune WAL checkpoints in production."

## Results

| Request | Claude Code | Codex |
| --- | --- | --- |
| 1. Research | 25 min 17 s. 10 questions, 111 checked facts (14 narrowed), 3 gaps, 1 conflict, 5 checker invocations | 6 min 37 s. 6 questions, 32 checked facts, separate Codex checkers |
| 2. Verify | `verify --keys deck/draft.md`: 4 confirmed, 1 narrowed key reported with its checked replacement and not called confirmed | `verify --keys deck/draft.md`: 5 confirmed. It also re-fetched two pages before saying current docs agree |
| 3. Approve | `approve --by "Trial Reviewer" --revision 35`: current | `approve --by "Trial Reviewer" --revision 23`: current |
| 4. Research again | `reassess --again checkpoint-starvation --reason …`, 11 min 37 s. 12 new facts (1 narrowed); approval reported as no longer current | `reassess --again checkpoint --reason …`, 5 min 15 s. 12 new checked facts; approval reported as not covering the new revision |
| 5. Refresh | `refresh`, 3 min 14 s. 16 unchanged, 1 changed (a partial excerpt now saved whole; passages present), 0 researched again | `refresh`, 2 min 46 s. 14 sources re-read, all passages present, 0 researched again |
| 6. Find and reuse | `find --in … --query sqlite`, then `start --from ../sqlite-wal --topic …`, 11 min 51 s. All 123 facts carried with their keys, 6 new questions, 70 new facts researched and checked (1 rejected), `complete-with-gaps` | `find`, then `start --from` with a new topic, 6 min 47 s. 44 facts reused, 16 new checked facts, `complete-with-gaps` |

The saved outputs, with matching `output.json` hashes:

- **Claude Code:** [initial run after all rounds](claude-code/sqlite-wal/research/report.md)
  (123 facts, rounds `again` then `refresh`) and the
  [runbook started from it](claude-code/wal-runbook/research/report.md) (192 facts,
  `import` round, origin approval shown as history).
- **Codex:** [initial run after all rounds](codex/sqlite-wal/research/report.md) (44 facts)
  and the [runbook](codex/wal-runbook/research/report.md) (60 facts).

The [machine-readable matrix](matrix.json) has run IDs, revisions, counts, hashes,
timings, Codex token telemetry and the helper commands each step used. Follow-up
notes for Claude Code are in [claude-code/followups/](claude-code/followups/). The
original slide drafts are kept beside each run.

## Findings

None of these blocked a request. Each harness recovered within its turn.

1. **Codex wrote unvalidated side reports.** Codex saved its own summaries outside
   `research/` (a project-root `report.md`, citation and refresh notes) and linked
   those as the deliverable instead of `research/report.md`. Their prose is not
   checked by the helper. [One is kept](codex/sqlite-wal/focused-report-written-outside-research.md)
   for review. This is a guidance gap: the skill says to return `research/report.md`.
2. **The number rule reads identifier digits as numbers.** Statements naming
   `sqlite3_*` or `*_v2` functions were refused three times because those digits
   were not in the quotes. Workers reworded or added quotes; nothing unsupported
   was accepted.
3. **A relative `--from` path resolves against `--project`, and the refusal does not
   say so** ("No saved research at sqlite-wal/research."). Codex retried with an
   absolute path.
4. **`start` on a project folder that does not exist** fails with a raw
   `ENOENT … realpath` error instead of a plain message.
5. **`peek` rejects `--harness`**, which `next` accepts. Two Claude Code
   coordinators hit it once each.
6. **Trial tooling, not the helper:** the HTML-to-text extractor used for the
   Claude Code trial drops strikethrough, so one outdated warning read as current.
   The independent checker caught it on the live page and narrowed the fact.
7. **A reused run extended with a new topic keeps the origin's scope paragraph**;
   only the topic line changes.
8. **Report length:** the narrow Claude Code report is about 19.6k words for 10
   questions (Codex about 6.8k for 6). 0.9.0 raised the same usefulness concern.

## Limits of this evidence

- In Claude Code, the coordinator for the initial run, dispatch and cross-checks
  was the release-verification session, which had read the implementation. Each
  follow-up request went to a fresh subagent given only the request, the skill and
  the runtime. That subagent could not start agents, so it opened the work and the
  session dispatched the workers.
- *Trial Reviewer* approvals are trial records, not the owner's approval of these
  reports.
- Refresh ran on the same day, so no quoted passage had changed. The
  changed-passage path is exercised by the native and
  [installed checks](../installed/checks.json), not live.
- Claude Code cost was not measured. Codex token telemetry is cumulative across its
  resumed thread, and it is unclear whether child agents are included.
- Single observations; times include coordinator overhead and are not benchmarks.
- [page-text.py](page-text.py) and [codex-turn.sh](codex-turn.sh) are the trial
  helpers used. Raw transcripts, saved source pages and expired task files stay
  local and are not part of this record.
