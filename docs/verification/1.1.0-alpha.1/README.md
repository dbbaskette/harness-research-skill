# Local topic assets and parallel research verification

Status: local development implementation verified, 2026-10-29. Version
`1.1.0-alpha.1`, branch `codex/topic-assets-parallel`. No release, active skill
installation, studio execution enablement or application restart was performed.

## Delivered

- Standalone local topic folders, or a caller-specified local destination, without
  Git or a studio dependency. Studios own all repository synchronization.
- Directory/UTF-8 URL-list intake, retained originals/captures, tags and a source
  inventory preserving supplied URLs and failed/unused entries.
- Root-level cited report, brief and schema-2 evidence/review output. Existing
  unmarked cases retain their original paths and resume behavior.
- A separate `asset-manifest.json` handoff includes metadata, inventories, unused
  retained documents and reviewed output files. It does not turn metadata or
  uncited sources into reviewed evidence and excludes private working state.
- Host-registered investigator contexts, bounded capacity, host capture receipts,
  immutable evidence packets, safe ID/reference assembly and checkpoint recovery.
- Pause/stop/retry/generation guards retain unresolved host capacity until terminal
  observation. The helper does not cancel processes or launch providers.
- Skill-led native coordination with progressively loaded Codex/Claude references;
  independent review excludes every registered investigator, including zero-fact
  packets. Complete report/prose review still binds the final saved digest.

## Native gate

**209 passed, 0 failed, 0 skipped**, using the project's existing disposable Tart
wrapper. [Environment](native/environment.txt), [tests](native/tests.log),
[installed-runtime smoke](native/installed-topic-smoke.json),
[audit](native/audit.log), [context](native/context.log) and
[source hashes](native/source-files.sha256) retain the evidence. Package audit
reported zero vulnerabilities. Installed smoke used a synthetic local directory
and URL list, saved and verified an honest topic draft, then initialized a separate
collection. It required neither network source access nor a real account.

The final gate's 68 runtime/reference/test files match the current tree. After the
gate snapshot, the bootstrap's preview runtime notice was corrected and context
measurements regenerated; [all three affected context checks passed](post-bootstrap-context-tests.log).
This was a documentation-only change. Subsequent changes preserve these records,
update plan status and copy the controlled example.

The initial native run passed 208/209. Its old link checker scanned a JSON-schema
regex as a Markdown link and did not support nested reference directories. The
checker now visits Markdown recursively; focused routing checks and the complete
native gate passed. The original failed run remains under
`/private/tmp/harness-assets-native-ci/harness-research-test-20261029204305-10342-1f86232e`.
Both owned VM directories were independently confirmed absent; the base remains.

## Controlled supplied-document exercise

[Report](example/report.md) · [brief](example/brief.md) ·
[source inventory](example/sources.json) · [topic metadata](example/topic.json) ·
[evidence](example/evidence.md) · [reviewer notes](example/reviewer-notes.md)

Two actual separate investigator invocations read the complete supplied fictional
Meridian/Boreal documents and produced packets for deployment/concurrency and
maintenance/evidence limits. The coordinator registered real invocation mappings,
validated source receipts, accepted the packets and assembled 17 facts with their
original investigators. Four logical source records retain the two investigators'
contexts without coalescing same-URL or same-byte provenance.

A separate reviewer assessed all 17 facts, three findings and 13 report/brief blocks.
The first review rejected an exclusivity overclaim: report prose said **only when**
where the source established **when**. The coordinator corrected it and saved a
new digest; the prior approval was not carried forward. The full new revision was
then independently accepted and verifies **complete / artifact integrity verified**:

`8813e2092de19b1d3371ce08c6d94f3ea0ccbeec8f3fce487ba5036585da26c0`

The optional supplied URL is retained as unused and was deliberately not contacted;
the malformed URL remains rejected. No public research, product recommendation,
workload benchmark, migration or additional provider CLI was used. This exercises
real skill coordination/review with fixed synthetic inputs, not cross-harness live
acceptance. The copied case includes local working state for repeatable verification;
normal public asset handoffs intentionally exclude that private state.

## Timing and remaining delivery boundary

The [matched controlled callback benchmark](native/collection-benchmark.json)
records genuine callback overlap within the helper's registration bound, and
separates collection, synthesis/review and end-to-end wall time. It also records
summed versus overlapping assistant intervals, failures/retries and unknown token/
cost fields. The tiny synthetic fixture is not a provider speed forecast; no
threefold end-to-end claim is made.

Independent runtime review found and verified fixes for zero-fact investigators
passing the old fact-author-only reviewer guard, and generation invalidation
losing occupancy from still-running contexts. Regression tests cover both.

Marketing Studio integration is the separate consumer milestone in the
[approved plan](../../superpowers/plans/2026-10-29-parallel-research.md). The skill and
helper handoff are available locally; studio-specific scheduling, budget accounting,
UI, sync and deployment were not changed. Explicit request/audience/permission
changes currently create a separately named topic variant; metadata changes do
not mutate the research request. No live Claude Code/Codex performance comparison
was run for this implementation.
