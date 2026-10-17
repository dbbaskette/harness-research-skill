# Editorial briefs and studio task handoff

Local development refinement of unpublished 1.0.0-alpha.1. The user requested
natural prose, a stronger prioritized brief and a research format adapted to the
actual studio task.

## What changed

Reader report/brief prose no longer receives repeated type labels. The dossier,
structured export and evidence audit retain summary/inference/recommendation/gap
types, and authors express conditions and uncertainty in ordinary language.
Draft, revision, stale and reviewed status remain visible.

Optional authored brief sections preserve the author's order and references
without automatically repeating the full finding inventory. Each authored block
is included in digest-bound independent review. Missing or unsupported brief
verdicts prevent completion; changed brief content invalidates old review.
Dossiers that omit the field retain the generated finding view.

The existing purpose/audience/scope/source-mode fields accept a studio task.
[Handoff contract](../../../../references/studio-handoff.md). Current studio
callers still use legacy adapters; their automatic migration and installation
were not performed. [Read-only caller audit](studio-adapters.md).

## Behavioral example

The [Valkey/Redis example](../valkey-redis-editorial/research/report.md) reuses
the same 38 facts, 21 sources and five findings as the earlier corrected case.
Its [authored brief](../valkey-redis-editorial/research/brief.md) supports a
20-minute presentation: a central message, explanation sequence, evidence for
speaker notes and essential caveats. The author counted about 470 prose words.
It is research input, not a finished deck. A separate invocation reviewed 21
source contexts, 38 facts, five findings, 22 report blocks and eight authored brief
blocks. All were accepted, with no blocking objections. Status is `complete`,
artifact integrity `verified`, digest
`8daa8a079f9ce343ab3e1b1a164ec5eb2f95272ce2480ce2d858c9095c39c794`.
[Reviewer notes](../valkey-redis-editorial/reviewer-notes.md). The reviewed bundle
was copied into the user's project and every manifest-listed artifact hash checked.

[Blog](purpose-examples/blog.md) and
[training](purpose-examples/introductory-training.md) probes use the same evidence
but choose an argument/objection and a concept sequence/worked example respectively.
The parent inspected the differences and links. These two probes are explicitly
unreviewed drafts, not separate accepted runtime bundles.

## Verification

The final disposable macOS gate passed **155 tests, zero failures, zero skips**,
plus audit (zero vulnerabilities), context checks, isolated installation and
installed synthesis smoke. macOS 27.0, Node 22.23.2, Python 3.9.6.
[Test log](native/tests.log); [tested files](native/source-files.sha256).
The source is base commit 16582ce plus pinned working-tree changes. Runtime, tests
and guidance were compared with the actual copied files after the run; subsequent
changes are documentation and acceptance artifacts. Skill metadata and local
links were checked. The task-owned VM directory is absent and the base remains.

This exercise does not establish cross-model accuracy, a speed improvement or
live source currency. No active studio/skill installation, publication, production
migration or workload benchmark was performed.
