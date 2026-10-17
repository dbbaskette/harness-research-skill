# 1.0.0-alpha.1 development acceptance

## Latest verified state

The final integration candidate passes **156 tests, zero failures and zero skips**
in the disposable native gate. [Default-purpose verification](default-purpose/README.md)
pins the tested source tree and confirms the general-purpose fallback. The
[editorial refinement record](editorial-refinement/README.md) covers authored briefs,
readable public prose, independent review and the studio adapter boundary.

Use the [latest Valkey/Redis report](valkey-redis-editorial/research/report.md),
[brief](valkey-redis-editorial/research/brief.md) and
[evidence](valkey-redis-editorial/research/evidence.md) for the corrected example.
The earlier results below are preserved as historical acceptance records.
This remains a prerelease development version; merging does not install it or
create a release tag.

## Initial implementation record

**Initial local acceptance passed.** This is an unpublished development preview,
not a release tag or an active installation update. A later comparative review
found an overbroad fact in the original live case despite its recorded approval:
`newer-data-boundary` joined neighboring sentences with different edition scope.
The [purpose/evidence refinement record](purpose-refinement/README.md) tracks the
correction, stronger handoff behavior and subsequent verification. Original
artifacts below remain a historical record, not evidence that the objection was absent.

[Read the Valkey/Redis report](valkey-redis/research/report.md) ·
[Reusable findings](valkey-redis/research/brief.md) ·
[Evidence and review](valkey-redis/research/evidence.md) ·
[Machine-readable verification](verification.json)

## Implementation and native verification

Base commit: `c7c406eb8d1d97f72748909b68020882f10544dd`; branch
`codex/synthesis-first`. The final native test ran the modified working tree;
[native/source-files.sha256](native/source-files.sha256) records exact copied
files, and [run.txt](native/run.txt) identifies the base and dirty state.
Subsequent changes are documentation and preserved acceptance artifacts.

The disposable Tart gate passed **148 tests, zero failures, zero skips** on
macOS 27.0 / Node 22.23.2 / Python 3.9.6. It also completed package audit (zero
vulnerabilities), instruction-context checks, isolated installation, installed
version/help, legacy manual smoke and the new installed synthesis draft save/status.

- [Test results](native/tests.log)
- [Environment](native/environment.txt)
- [Generated context check](native/context.log)
- [Installed synthesis result](native/installed-synthesis-status.json)
- [Audit](native/audit.log)

Two native gates ran: the final gate followed the trial's help/error-message
improvements. Both task-owned VM directories were independently confirmed absent;
original stopped bases remained present. The retained [cleanup log](native/cleanup.log)
contains transient disk-info warnings during cleanup; the runner exited zero and
actual removal was checked separately. No unrelated VM was stopped.

## Independent code review

The reviewer reproduced three issues and verified their corrections:

1. Missing source snapshots now keep artifact integrity failed, including after
   repeated verification; regenerating Markdown cannot hide missing evidence.
2. Legacy manual planning/recording/migration refuse synthesis-owned projects.
   Shared locking prevents racing old/new starts from creating mixed state.
3. Supplied original documents are separately pinned and hashed; modifying an
   original invalidates review even when its extraction is unchanged.

Focused regression tests cover these failures, along with quotation/reference
validation, comparison alignment, review identity/digest checks, inaccessible
originals, empty drafts, path protection, portable snapshots and preserved history.
The full native suite includes those regressions.

## Fresh research trial

The investigator received the new skill, the local runtime and the user's
Valkey-versus-Redis request with a conditional Redis takeout focus. It did not
reuse the earlier report or receive a desired conclusion. Its
[execution notes](valkey-redis/execution-notes.md) record stage loading, real tool
failures/retries, output characteristics and unresolved usability observations.

The saved result contains **14 primary sources, 28 facts, five findings and 18
prose blocks**. It distinguishes the shared Redis OSS baseline, newer formats,
modules/feature dependencies, commercial Active-Active, license options,
operational validation and provider-specific rollback.

A separate invocation opened all 14 originals, checked their context, and reviewed
facts, findings, prose, coverage and usefulness. It submitted no blocking
objections. Direct-fetch/web-reader failures were resolved through other permitted
reading routes and are preserved in the [review notes](valkey-redis/review-notes.md).
The [submitted review](valkey-redis/research/review.json) binds to digest:

`558c5b0e7701a43ccc333a5dc056022f4087e0a18dc6ec32f082e915ca3ace70`

The copied acceptance project was verified with the actual helper:

```sh
node scripts/harness-research.mjs synthesis verify --project docs/verification/1.0.0-alpha.1/valkey-redis
```

Result: `complete`, `artifact_integrity: verified`, no integrity problems. The
preserved project includes authored dossier, independent review, working captures,
portable pinned captures and current canonical state. Plan and execution notes are
working records; only manifest-listed files are committed output artifacts.

## Scope and remaining limits

This is one live example on the available Codex host, not a controlled comparison
of models or harnesses. Claude Code/Cursor live acceptance and additional topic
classes were not run for this preview. The trial is documentation-backed research,
not a Redis/Valkey application compatibility test, migration or performance study.

Schema-2 structured consumers need explicit integration. Existing schema-1
consumers and old research runs retain their old contracts. The report and brief
are available as Markdown handoffs today.

The trial observed verbose status templates and repetitive interpretation labels;
these remain usability opportunities. Top-level `help` discovery and unnamed ID
collision errors were corrected and included in the final native gate. The new
architecture is a practical tested starting point for ongoing use, not a claim
that every research shape or consumer has been validated.
