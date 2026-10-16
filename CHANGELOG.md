# Changelog

## 0.9.1 — unreleased

Verification and reuse, the 0.9.x items of the
[direction](docs/superpowers/specs/2026-10-15-harness-research-direction.md#roadmap).
Not released until native tests, installed checks and the live acceptance matrix
pass (or the owner approves a narrower scope). The guidance still accepts runtime
0.8.1; the new commands need runtime 0.9.1.

- `research verify` reports what became of each cited fact key: confirmed,
  narrowed, superseded, rejected, stale, unchecked or gone, with the replacement
  assertion and source revisions. It reads keys from a JSON list or any file
  citing them, writes nothing, and says live sources were not re-read.
- `research reassess --again ID,... [--reason TEXT]` researches, checks and
  rewrites chosen questions again; their checked facts stay current.
- `research start --from PATH` (repeatable) begins a run from earlier research,
  reading only its `research/` folder. Checked work keeps its keys; missing saved
  text, unchecked candidates and public sources in a supplied-only run are
  researched again; edited research is refused. A new topic, context, sources or
  several origins ask the planner to extend the plan, and new questions are
  cross-checked. Colliding IDs are renamed. Origin approvals are history.
- `research find --in DIR [--query TEXT]` lists research folders with status,
  depth, counts, approval and source age.
- `research approve --by NAME [--revision N]` records an approval of exactly the
  content shown; status, the report, `facts.json`, `verify` and `find` say
  whether it still applies.
- `research refresh` re-reads the cited web sources of a finished run. Facts whose
  quoted passages are gone become stale and only their questions are researched
  again; changed text becomes a new source revision.
- Rounds after the first pass record their kind (`reassess`, `again`, `refresh`,
  `import`), shown in the report and `facts.json`.
- New guidance tasks that fall back to an older release because a newer one needs
  a newer runtime report `freshness: older-compatible-release` with a notice.

## 0.9.0 — 2026-10-16

Release validation: 88 native tests passed; 13 eligible live report cases completed.
The owner accepted ongoing-use refinement instead of formal human sample scoring;
no 90% support result is claimed. [Evidence and release decision](docs/verification/0.9.0/live-acceptance/README.md).

Live acceptance follow-up (2026-10-16):

- Permit honest original-access failures in independent checking: an unread
  original can only support rejection plus explicit access gaps. Confirmation
  and narrowing still require inspected originals and exact revision hashes.
  Preserve the failed trial and repeat its checks rather than invent attestations.
- Keep agent dispatch within the host's active-agent capacity.


- Clarify reuse of selected evidence by registered source ID, identify missing
  quote source IDs with an actionable error, require cited answer-body sentences
  explicitly, and ask checkers to verify page/line locators against originals.

Review follow-up (2026-10-16):

- Speed: stages are pipelined per section instead of whole-stage waves; light research takes
  a section per task; light skips the gap-round cross-check so writing overlaps it; results
  can register their sources inline and cite them by file; commands answer compactly and
  `next` writes the full task to a file; worker payloads carry only what the task needs. The
  guidance gives a coordinator recipe for parallel subagents in Claude Code and Codex.
- The store lock waits up to 30 seconds for a busy save instead of failing, and recovers a
  lock left by an exited process.
- Registered source text is pinned under `research/sources/revisions/` and quotes are checked
  against that copy. A changed original makes only the facts, questions and answers resting
  on it stale; `research reassess` redoes just that work.
- Sentence checks accept abbreviations and initials ("vs.", "U.S.", "J. Smith"); the number
  rule reads spelled-out and scaled numbers ("five", "twenty-five", "1.5 million").
- Plans outside the usual size for their depth, or uneven across comparison subjects, are
  accepted with warnings. Reports add counts, dates, the given sources, who checked facts,
  contents, open questions per section, a Gaps section and side-by-side conflicts.
- Gaps a checker or cross-checker writes itself are labelled as its own assessment.
- New tasks take guidance from the newest release tag the installed helper supports, not
  from `main`; a repository without release tags is still served from `main`.
- First Claude Code trial (Redis vs Valkey, light): 13 min 50 s against 4 min 59 s for the
  0.8.1 skill on the same request, with 20 questions and 113 independently checked facts
  (31 narrowed) against 8 unchecked findings. Fixes from it: gaps may name inline-registered
  files, coverage accepts "partial", answer sentences may state a cited fact's date, and
  cross-cutting sections no longer show an empty subject breakdown.

- Keep plain-language skill invocation as the product interface; the agent researches
  with its harness tools and uses the Node-only helper for bookkeeping and validation.
- Add durable leased research tasks, separate evidence checks, one bounded gap round,
  cited headlines and answers, and independent prose review at standard/deep depth.
- Save partial and final reports under `research/`, alongside checked facts, a brief,
  plan and revision/hash manifest. Preserve a legacy report/record projection.
- Track immutable fact keys, narrowed assertion history, duplicate aliases, conflicts,
  source revisions, exact quote offsets and honest unanswered gaps.
- Fence stale leases, reject self-checking and unleased managed-run writes, repair
  interrupted exports, and exclude changed evidence from the current facts brief.
- Guidance keeps accepting runtime 0.8.1 and sends older runtimes to the manual
  workflow, so publishing it does not break pinned callers such as Tanzu Brand 0.13.6.
  The queued workflow needs runtime 0.9.0. Runtime installation remains explicit;
  reuse/refresh/approval commands and consumer migrations remain later milestones.
- Saved source text must be the full page or relevant section: text under 280
  characters, or a quote that is most of its source, is refused unless registered
  as a partial capture with its reason. Partial captures are labelled.
- A refused submission keeps its lease for correction; ten refusals end the attempt.
  Leases last 30 minutes, and a lapsed lease may still submit until the task is
  taken by someone else. A failed task holds up only later stages.
- `research peek` shows the next task without taking it; `research release` gives a
  task back without counting a failed attempt and retains researcher/checker separation.
- Partial-capture corrections receive a new source revision automatically while old
  metadata and citations remain immutable. Comparison tables retain facts shared by
  questions in different sections after duplicate merging.
- Reports take a short title; comparisons show each section's facts side by side;
  `facts.json` leaves out worker bookkeeping; `--sources` also reads one path or
  link per line.

## 0.8.1

- A changed plan keeps the findings of questions whose definition is unchanged, when the topic, purpose, scope, selected sources and input files are unchanged. `plan` reports them in `carried`.
- A finding may carry an optional one-line `headline`, kept in the record and shown as `Answer:` in the report.
- Guidance names both; its minimum runtime is now 0.8.1. Tanzu Brand and Harness Slides remain at 0.8.0.

## 0.8.0

- Align the runtime, guidance release, compatibility floor, and installation examples with Tanzu Brand and Harness Slides 0.8.0.
- Retain saved tasks on their original guidance/runtime; new tasks use the aligned release.
- Refresh progressive-disclosure measurements for the current package.

## 0.3.0

First tagged GitHub release.

- Standalone research produces a saved cited report by default. Instructions require saving findings and inspecting the actual report before declaring completion; explicit chat-only requests can omit saved artifacts.
- The skill announces the installed runtime version, guidance release, exact revision and freshness when starting or resuming work. These identities remain separate, including when newer instructions run with an older compatible helper.
- `node scripts/harness-research.mjs --version` checks the installed runtime without a project or network access. Installer results also include `runtimeVersion`.
- Saved tasks retain their original runtime and guidance. Earlier pins without a guidance release report it as unknown and retain their exact revision.
- Git refresh failures identify the failing operation and sanitized network/access diagnostics, with instructions to retry through the host's permitted network-access flow.

Install or update from tag `v0.3.0` using `scripts/Install-Harness-Research.sh`.
Guidance continues to refresh from `main` for new tasks; helper updates require
the installer. Guidance from this release remains compatible with runtime 0.2.0,
whose version can be read from its installed `package.json`.
