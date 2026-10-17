# Changelog

## 1.0.0-alpha.1 — unreleased

- Rebuild the default skill around Anthropic Knowledge Synthesis with progressive investigation, synthesis, review and reuse guidance.
- Add a document-first evidence helper with digest-bound independent factual/semantic review and saved report, findings brief and evidence view.
- Align comparisons by explicit criterion; preserve source snapshots, draft/revision/stale states and output ownership.
- Keep the 0.9 queue/manual commands as legacy compatibility paths; introduce an explicit schema-2 consumer boundary.
- Rewrite first-use docs and architecture; add a colorful README illustration and upstream attribution.
- Acceptance and live Valkey/Redis results are recorded separately under docs/verification/1.0.0-alpha.1.

## 0.9.5 — 2026-10-16

The README now shows a progressive disclosure map. No runtime behaviour changes.
[Checks](docs/verification/0.9.5/README.md).

- **Progressive disclosure map:** `docs/images/context-loading.svg` shows what
  loads at each step. Discovery leads to the bootstrap and then the guidance entry,
  which branches into one path: a checked run, follow-ups, status or a chat-only
  answer. Worker subagents read only their own task contract, and the legacy paths
  are drawn apart. `npm run context:update` generates it from the same measurements
  as the README table, and the tests check that it is current.
- The skill review and the README's cost figures are brought up to 0.9.4. A
  checker reads 541 tokens; some 0.9.4 notes said 542.

## 0.9.4 — 2026-10-16

Recommendations 1 and 2 of the [0.9.3 skill review](https://github.com/dbbaskette/harness-research-skill/pull/20):
a lighter light depth and per-role guidance.
[Checks](docs/verification/0.9.4/README.md).

- **Light depth is lighter.** A research submission records at most 8 facts per
  question at light (was 12), and an answer has at most 10 cited body sentences
  (was 40). Standard keeps 20 facts and deep 30, both with 40 sentences. Tasks
  carry `facts_per_question` and `sentences_per_answer`, and the briefs say these
  are limits, not quotas. In the 0.9.1 Claude Code trial, researchers hit the old
  12-fact limit on 8 of 10 questions.
- **Workers read only their own contract.** The task contract moved out of
  `references/research-run.md` into three role files: `task-research.md`
  (sources, plan and research), `task-check.md` (independent checking) and
  `task-write.md` (cross-check, writing and review). Every task carries a `guide`
  naming its worker's file and sections. A pinned task points into its own saved
  guidance snapshot and falls back to `research-run.md` in older snapshots. The
  coordinator still reads the run guidance plus the research and writing files.
  Checkers carry the rule that text marked `~~struck~~` is not current wording.
- [Live trials](docs/verification/0.9.4/live/README.md): in Claude Code, subagent
  tokens fell 28% (checkers 34%), wall time 61% and report length 50% against the
  0.9.1 run of the same plan, with similar narrowing and one question only partly
  answered. Those trials ran with a light limit of 6; it was then raised to 8 to
  recover coverage, which has not been measured live.

## 0.9.3 — 2026-10-16

The remaining minor findings from the 0.9.1 live trials
([findings](docs/verification/0.9.1/live-acceptance/README.md#findings)).
[Checks](docs/verification/0.9.3/README.md).

- Each answer's "Facts behind this answer" list is folded into a collapsed
  `<details>` block after the cited prose. The evidence lists were 49–69% of
  the trial reports; every quote stays in the report and in `facts.json`.
- Reusing research for a new topic or audience lets the planner restate the
  report's `scope` and `title`, so the scope paragraph no longer describes only
  the origin. Without them the origin's scope is kept.
- The guidance says to keep struck-through or deleted text as `~~text~~` when
  saving sources and never cite it as current. The trial extractor in
  `docs/verification/0.9.3/tools/` now keeps that markup.

## 0.9.2 — 2026-10-16

Fixes for the helper and guidance findings from the 0.9.1 live trials
([findings](docs/verification/0.9.1/live-acceptance/README.md#findings)).
[Evidence](docs/verification/0.9.2/README.md).

- The number rule treats digits written straight after a letter or underscore
  as part of a name (`sqlite3_wal_checkpoint_v2`, `SHA256`, `IPv6`), so naming
  a function no longer needs its digits in the quotes. Counts, units such as
  `4MB`, versions and names such as `COVID-19` are still checked.
- A relative `--from` that finds nothing says where it looked and that it is
  read relative to `--project`.
- A project folder that does not exist is reported plainly instead of as `ENOENT`.
- `research peek` accepts `--harness`, as `research next` does.
- The guidance says to return `research/report.md` itself, not a summary of the
  agent's own; anything written outside `research/` is unchecked.

## 0.9.1 — 2026-10-16

Verification and reuse, the 0.9.x items of the
[direction](docs/superpowers/specs/2026-10-15-harness-research-direction.md#roadmap).
The guidance still accepts runtime 0.8.1; the new commands need runtime 0.9.1.

Release validation: 113 of 114 native tests passed (one Python-gated test
skipped); the installed helper drove every new command through 45 checks; the
guidance fallback was shown against a disposable repository. Under the
owner-approved acceptance scope, a fresh narrow run in each of Claude Code and
Codex was followed by plain-language requests to verify, research again,
approve, refresh, find and reuse it. The design's full live matrix was not
rerun. [Evidence and findings](docs/verification/0.9.1/README.md).

- `research verify` reports what became of each cited fact key: confirmed,
  narrowed, superseded, rejected, stale, unchecked or gone, with the replacement
  assertion and source revisions. It reads keys from a JSON list or any file
  citing them, writes nothing, and says live sources were not re-read.
- `research reassess --again ID,... [--reason TEXT]` researches, checks and
  rewrites chosen questions again; their checked facts stay current.
- `research start --from PATH` (repeatable) begins a run from earlier research,
  reading only its `research/` folder. Checked work keeps its keys; missing saved
  text, unchecked candidates and public sources in a supplied-only run are
  researched again. Saved text or quotes that no longer match, or a confirmed fact
  without a separate checker, refuse the import; this catches edits, not a
  consistent forgery of the whole record. A new topic, context, sources or
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
