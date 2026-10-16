# Live public-web skill example — usability notes

## Identity and scope

Runtime `harness-research 0.9.0`; guidance release `0.9.0`, read from `/private/tmp/harness-research-pr10-f9720cb8/SKILL.md` and `references/research-run.md` in full. This is the explicitly supplied local, unreleased development candidate, not a public-main refresh. Runtime report labels it “local runtime guidance”. Researcher invocation: `/root/skill_example_public`. Run: `4da5c841fb274fbcb5781e2c`.

Plain-language brief: compare PostgreSQL and SQLite for a small internal app; deployment architecture and write concurrency only; two questions per database; light depth; public primary documentation. The helper started with zero sources, accepted the four-question plan, and registered found public sources under active research leases. Actual searching, original source reading, factual synthesis and independent checking are agent work using native web tools; the helper only records state and validates results.

## Evidence retained

Six primary originals were opened, including surrounding context, rather than relying on search snippets. The PostgreSQL current pages identified PostgreSQL 18 on inspection; these URLs are moving references, not immutable version archives. SQLite isolation shows a last-updated timestamp of 2022-04-18, recorded honestly. Other document publication dates remain unknown.

Saved files contain short exact excerpts, explicitly marked partial in source titles and limits. No entire original document is retained; every original_file/original_sha256 remains null. No full extraction or complete-document hash is invented. Source byte hashes cover only the local excerpt revisions. Original URLs are retained.

Local excerpt word counts: {"pg-architecture.txt": 18, "pg-locks.txt": 17, "pg-mvcc.txt": 17, "sqlite-isolation.txt": 21, "sqlite-serverless.txt": 21, "sqlite-wal.txt": 20}.

The first registration's limits text says “22 words”; its actual whitespace word count is 18, so the preserved excerpt is shorter than the advertised bound. This human-entered metadata imprecision does not affect exact quote support or source-byte hashes and is documented here rather than silently mutating registered evidence.

## Progress and behavior

- No permission pause, installation, publication, credentials, paid service or runtime modification was needed.
- Helper start/next/source/submit commands accepted the plan and research results on their first attempts. One exploratory help lookup failed outside any task submission; exact evidence follows below.
- Early report correctly displayed candidate facts and unanswered assessments while independent checking was pending, rather than pretending research submissions were already checked.
- Source limits appear under “Coverage gap” in the report even when question gap counts are zero; the report distinguishes source-retention limits from unanswered research questions. Final status correctly became complete-with-gaps because the source limits remain, despite zero question gaps.
- Candidate facts and prose still need independent semantic judgement: mechanical exact-quote validation alone does not establish entailment.

## Completion verification

Completed: actual report opened after final status refresh; report, facts, brief, plan.json and plan.md hashes match output.json; status/manifest/facts share run 4da5c841fb274fbcb5781e2c and revision 27. All source hashes, exact quote offsets and quote hashes verified. Eight current facts checked by the independent invocation; all four questions assessed answered. One compound SQLite fact was narrowed independently and rekeyed, preserving revision history. Both light writing submissions accepted on first attempt; no independent prose reviewer is claimed. Final status is complete-with-gaps because retained source excerpts have explicit limits; question gap count is zero. No extra research round was needed. See final-verification.json and manifest-verification.json.

## Recoverable orchestration and help observations

The checker inspected `research next` after its second check and thereby claimed the cross task under its own actual invocation identity. There is no release operation documented in the selected workflow. Rather than impersonating the checker, changing durable state, or inventing a failure, the parent gave the same checker the actual cross-check work. Future callers should avoid `next` just to inspect the upcoming stage when they intend a different owner.

Exploratory command: `node /private/tmp/harness-research-pr10-f9720cb8/scripts/harness-research.mjs research help`.
Result: exit code 1; exact output: `Choose a research action and --project DIR.`
Recovery: read only the relevant runtime command-routing lines to determine supported recovery behavior; did not modify runtime or fabricate evidence. This was not a research-task failure, and no research task retry was needed.
