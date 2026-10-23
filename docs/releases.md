# Versioned releases

**1.0.1** (2026-10-23) is a patch release of the 1.0 synthesis workflow. It
fixes synthesis integrity exits, external-original pinning and evidence
qualifications; preserves overwritten outputs; recovers abandoned locks; and adds
opt-in compact, template and validate commands. Its guidance floor is runtime
1.0.1, so 1.0.0 installations keep 1.0.0 guidance until updated. The owner asked
for new releases of the studios and harness skills and then explicitly approved
publishing "Harness Research 1.0.1" as an immutable public tag and release.

The [1.0.1 release record](verification/1.0.1/README.md) pins the tested tree.
Its checks are the native gate (full suite, audit, generated context and isolated
installation) and an isolated install of the downloaded release archive. No new
live research trial was run; the record explains why and what remains unmeasured.

## Historical releases

**1.0.0 (2026-10-18)** promotes the synthesis-first implementation to stable,
following the owner's explicit stable-release approval. New 1.0 tasks select stable
synthesis guidance automatically; the guidance floor is runtime 1.0.0. Existing
0.9 runs retain their own pinned runtime and instructions.

The [specification](superpowers/specs/2026-10-17-synthesis-first.md),
[development acceptance](verification/1.0.0-alpha.1/README.md) and
[stable release record](verification/1.0.0/README.md) record the tested scope.
Native checks, isolated installation/context checks, source/license verification
and the requested Valkey/Redis research with independent review are required.
Live acceptance is scoped to the available Codex host; it does not establish
cross-model or cross-harness quality. Structured studio adapters still need
schema-2 integration. Markdown report and brief handoffs are available now.

**0.9.5 acceptance scope (2026-10-16).** 0.9.5 adds the README's progressive
disclosure map and documentation updates, with no runtime behaviour change. The
owner asked for it to be merged and released. Its checks are the native gate and
the installed command and fix checks; no live trial was needed. The
[0.9.5 record](verification/0.9.5/README.md) keeps them.

**0.9.4 acceptance scope (2026-10-16).** 0.9.4 lightens light depth and gives each
worker only its own guidance. Its checks are the native gate, the installed
command and fix checks, and one fresh Claude Code and one Codex trial compared
with the 0.9.1-limit baselines. Those trials ran with a light limit of 6. The
owner then had it raised to 8 and confirmed the release; 8 has not been measured
live. The [0.9.4 record](verification/0.9.4/README.md) keeps the evidence.

**0.9.3 acceptance scope (2026-10-16).** 0.9.3 addresses the three minor 0.9.1
findings: folded report evidence, restated scope for reused runs, and marked
struck-through text. The owner confirmed its release after reviewing the PR. Its
checks are the native gate and the installed command and fix checks; no live
trial was run for it. The [0.9.3 record](verification/0.9.3/README.md) keeps them.

**0.9.2 acceptance scope (2026-10-16).** 0.9.2 fixes five findings from the
0.9.1 trials. The owner asked for it to be implemented, merged and released
("implement the 92 followup push pr merge and cut that release"). Its checks are
the native gate, the installed command and fix checks, the guidance fallback,
and one fresh Codex run of the 0.9.1 request to observe the changed
report-return guidance. The [0.9.2 record](verification/0.9.2/README.md) keeps them.

**0.9.1 acceptance scope (2026-10-16).** Native verification passed 113 of 114
tests with the one Python-gated test skipped; the installed helper drove every
new command through 45 checks; and a disposable repository showed the disclosed
older-compatible-release fallback. Before live trials the owner chose the
acceptance scope: one fresh narrow light run per harness, followed by plain-language
follow-up requests that verify, research again, approve, refresh, find and reuse
it, in Claude Code and Codex. The design's full matrix (broad, deep, fact-check
and supplied-only reports) and its human sample scoring were not rerun for 0.9.1;
the 0.9.0 record still holds those results and limits. The
[0.9.1 record](verification/0.9.1/README.md) keeps the evidence and findings.

**0.9.0 release decision (2026-10-16).** Native verification passed 88 tests;
13 eligible report cases finished across the two harnesses. The owner accepted
the candidate for ongoing-use refinement rather than completing the design's
formal human sample scoring. Those checks are recorded as incomplete, not passed.
The [live record](verification/0.9.0/live-acceptance/README.md) retains the decision,
measurements and limitations. This is a scoped release exception, not removal of
future acceptance criteria or evidence-validation requirements.

## Preparing a future release

Release only after explicit publication authorization. Record the chosen version,
exact tested tree, acceptance scope and any remaining platform or live-model gaps.
A development preview passing one live research case is not a claim of broad
cross-harness acceptance.

1. Run the applicable integrated native gate and isolated installer/CLI checks.
   Reuse valid evidence for unchanged code; rerun affected checks after corrections.
2. Verify progressive-disclosure measurements, attribution/license packaging and
   the saved research manifest. Record independent live review separately from
   mechanical tests.
3. When authorized, merge the reviewed change and verify the merged source matches
   the tested source. Keep required remote gates; local success does not bypass them.
4. Archive the exact release commit, publish an unused immutable version tag and
   checksum, then download the assets and verify their contents and installation.
   Do not overwrite an existing release tag.

Automatic guidance refresh enumerates stable `vMAJOR.MINOR.PATCH` tags and selects
the newest one compatible with the installed runtime. A development prerelease
requires explicit checkout guidance or an approved pinned commit. Guidance cannot
upgrade executable helpers. After a stable 1.0 release, users must install its
runtime before its synthesis guidance becomes eligible.

Retain immutable runtimes and guidance for existing tasks. New research can use a
new release while old projects resume their own contract. Rollback changes the
entrypoint used for new tasks; it does not convert existing research formats.
