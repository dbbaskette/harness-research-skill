# Trial notes: harness-research 0.8.1 baseline (single session, no subagents)

- START: 2026-10-16T13:10:44Z
- END: 2026-10-16T13:15:43Z (taken right after `status` returned complete and the report was opened and checked)
- Elapsed: about 5.0 minutes (4 min 59 s)

## Setup
- Runtime and guidance: the extracted directory /tmp/claude-501/trials/old-runtime, supplied explicitly as the local runtime and guidance. Runtime package.json version 0.8.1, guidance release 0.8.1. The bootstrap/sync-guidance step was skipped as instructed, so guidance freshness was not checked against any newer release.
- Content project: /tmp/claude-501/trials/old-project
- Read: SKILL.md, references/workflow.md, references/evidence.md, references/strategies.md (routing table only).
- Scope: public-web (`--allow-web` passed to `plan`), purpose: planning, no supplied documents (`sources: []`).

## Counts
- Questions planned: 8. The guidance gives a 1–30 range and no default count. I used one question per requested dimension, with "compatibility and migration" split in two: licensing, governance, architecture, persistence, clustering, performance, compatibility, migration.
- Findings by status: supported 8, contradicted 0, insufficient 0, unavailable 0. The gaps are recorded in each finding's limits instead (for example, no independent head-to-head benchmark, other clouds' migration paths not checked).
- Distinct sources cited in the report: 25 origins. 32 text snapshot files are saved under sources/; 7 were read but not cited.
- Quoted evidence items: 65 (licensing 8, governance 8, architecture 11, persistence 8, clustering 8, performance 6, compatibility 8, migration 8).
- Web searches: 1 (looking for an independent benchmark; only secondary articles came back, none cited). Pages were fetched with curl (raw GitHub markdown for project docs and blogs, plus HTML converted to text for redis.io, linuxfoundation.org and docs.aws.amazon.com).

## Helper commands
12 runs in total, 1 error:
- `--help` x1: ok
- `plan` x2: the first errored, the second was ok
  - Error text: `Public queries require public-web scope and cannot contain URLs, paths or emails.`
  - Cause: the query contained "I/O". The validator rejects any "/" character, so it treated "I/O" as a path. Scope was already public-web, so the first half of the message was misleading.
- `record` x8: all ok
- `status` x1: ok (complete, 8/8, no pending, unresolved or stale items)

Report: /tmp/claude-501/trials/old-project/.harness-research/research-report.md (about 41 KB). I opened it and checked that it has all 8 sections with status, answer, summary, limits and verbatim quotes with hashes.

## Friction with the guidance
1. The public-query validator rejects any "/" (so "I/O", "TCP/IP" and "RDB/AOF" all fail), and its error message blames scope too, which hides the real cause.
2. `sourceMode` prints "Uploaded sources plus external research" even though no documents were supplied, and the report header repeats it. That is misleading for public-web-only work.
3. There is no question-count guidance beyond "1–30", so planning for a multi-dimension comparison is left to judgment.
4. The guidance requires local text snapshots with exact quotes and character offsets but gives no help on getting them. I had to write my own HTML-to-text converter and quote-offset finder. Offsets are "Unicode character positions": my Python code-point offsets were accepted, but none of the snapshots had astral characters, so a code-point vs UTF-16 mismatch was never tested.
5. The automatic report is a list of findings, one per question. It has no cross-question synthesis, no comparison table and no consolidated source list. The "cited synthesis" the guidance asks for exists only in the chat reply, not in the saved report.
6. Every finding needs a full JSON file, and the status/headline/summary/limits fields are free text. That works, but it took a custom builder script to produce the 8 files reliably.
7. A minor shell issue, not the guidance: in zsh, `echo ====` fails ("= not found").
