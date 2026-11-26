# Versioned releases

Everything comes from `main`. A version number and its entry here label a point
in `main`'s history; installing, updating and new guidance all read `main`, and
nothing selects or waits for a tag.

## 1.6.0

Lets a host have the independent review of a saved dossier done as bounded units
that run at the same time (Marketing Studio issue 378), and keeps folders of the
computer out of supplied documents' origins (Marketing Studio issue 550).

- **Review units.** `review-units plan` gives every source original, fact, finding
  and prose block to exactly one unit, following the collection's workstreams or,
  without a collection, each source; findings and prose follow the unit owning most
  of what they cite; prose citing nothing and the coverage and usefulness
  assessment go to a final unit. Each unit is also given what its items cite, to
  read and not to attest. The same saved state and options give the same plan.
- **Real, independent reviewers.** A host registers one reviewer invocation per
  unit, independent of the save author, every fact author and every investigator,
  and at most `max_reviewers` (1 to 3) at once. A unit answer carries the same
  per-item fields and hash checks as the single review, for what the unit owns.
- **Durable receipts.** Each accepted answer leaves an immutable receipt bound to
  its attempt, its basis (owned and given content and their pins) and the exact
  capture and original hashes. `finish`, `retry` and `stop` work as they do for
  collection; other units' receipts are never touched.
- **Strict assembly.** `assemble` refuses a missing, duplicate, stale, foreign or
  non-independent receipt or a changed pinned file, and records the ordinary review
  with the same `accepted` rule, its `reviewers` and its receipts. `status` and
  `verify` recheck the receipts. After a correction, a new plan keeps each unit
  whose basis is unchanged; only the changed units and the final unit run again.
- **Compatibility.** An assembled review lives in synthesis state schema 4, which
  1.5.1 and earlier refuse rather than misread; its results report `reviewer: null`
  with `reviewers`. `synthesis template` and `synthesis review` are unchanged, and
  a state reviewed the single way stays valid. Hosts discover the capability from
  `references/review-units-capability.json`.
- **Path-free origins.** A supplied document taken in by 1.6.0 records its origin
  as `supplied:` followed by its name inside the supplied folder. Its retained copy
  and hash still prove the bytes. Inventories, cases and bundles made earlier keep
  their stored absolute origins and verify unchanged; a host that echoes inventory
  origins shows the new label for new intakes only.

The guidance floor is runtime 1.6.0. See
[the verification record](verification/1.6.0/README.md).

## 1.5.1

Indexes evidence once per saved revision: saving or reviewing synthesis in a topic
asset matches inventory entries to saved sources through one index instead of a
search per entry. The recorded `evidence_ids` and `used_in_digest` are unchanged.
The guidance floor is runtime 1.5.1.

## 1.5.0

Batches collection capture receipts: `collection capture` takes `sources`, an
array, in place of `source`, registers them together or not at all, and returns
`receipts`; collection results report `batch_capture: true`. Collection commands
verify supplied inputs once per command. The guidance floor is runtime 1.5.0.

## 1.3.1

Takes everything from `main`. The owner's decision: "we could just have everything
go to main. that would fix our versioning issues."

- **New work reads `main`.** `start` always takes the guidance on
  `refs/heads/main` of the trusted repository. It no longer lists release tags,
  picks the newest compatible one or falls back to an older compatible release; the
  `older-compatible-release` freshness, its `newerRelease` and notice, and the
  library-only `releaseLimit` option are gone. New pins record `channel` `main` and
  `ref` `refs/heads/main`.
- **Update rather than fall back.** When `main`'s guidance needs a newer runtime
  than the one installed, `start` is refused with the existing update message; the
  fix is to update the installation from `main`.
- **Saved work is unchanged.** `resume` and `cached` behave as in 1.3.0, and tasks
  saved from a release tag (`channel` `release`) resume as they are.
  `pin --revision` still accepts only a commit on `main`.
- **Install from `main`.** The README and setup guide clone `main` instead of a tag.

The guidance floor is runtime 1.3.1, following the rule that it equals the
package version, so a 1.3.0 installation is asked to update from `main` before it
starts new work from this guidance.

## 1.3.0

Stops pinning to one installed version. The owner's decision: "we need to change
things so that we don't pin to a specific version of skills. We should have a link
that points to the most recent, or just not name things with a version, so we
always get the new code."

- **One address.** `start`, `resume`, `cached`, `pin` and the installer return the
  stable `current` link as the runtime, never a folder under `versions/`.
- **No runtime pin.** A task saves its guidance and, for information, the runtime
  version it started with. `resume` and `cached` return the installed runtime and a
  one-line `notice` when its version differs. Tasks saved by earlier releases resume
  without a migration. The one refusal that remains is saved or fetched guidance
  that needs a newer runtime than the one installed.
- **Guidance stays with the task.** Resume keeps the saved instructions, needs no
  network and does not change a workflow under work in progress; starting a new
  task is still the way to adopt newer guidance. The resume result's `freshness` is
  now `saved-guidance` (was `pinned`).
- **Reviews survive updates.** An unchanged-save receipt no longer includes a hash
  of the installed runtime, and such a hash in an older receipt is ignored, so
  reviewed work stays reviewed. `status` and `verify` recheck it with the installed
  runtime; nothing has to be rerun by hand.
- **One installed version.** After the pointer moves, the installer removes every
  other entry in `versions/`, and points this tool's own alias-skill and agent links
  at `current`. Links and folders that belong to someone else are left and reported.

Callers that stored a folder under `versions/`, read the installer's `runtime` as a
version folder, or compared a hash of the installed files must change; the
[setup guide](setup.md) and [developer guide](development.md) state the contract.
The guidance floor is runtime 1.3.0. See
[the verification record](verification/1.3.0/README.md).

## 1.2.0

Raises the intake limits so a studio can register a long source list in one run:
2,000 entries per intake or source update (was 200), a 5,000-entry inventory (was
1,000) and 512 MiB of supplied input (was 128 MiB). One input is still at most
64 MiB. `references/intake-limits.json` states the limits for hosts. Nothing else
changes; existing cases keep their runtime and layout. The owner asked for the
limits to be raised, merged and released.

See [the verification record](verification/1.2.0/README.md).

## 1.1.1

Adds explicit `synthesis save --reuse-unchanged --context FILE`. Matching validated
content and source/protocol/guidance/runtime/independence identities preserve eligible
review evidence and return a no-change receipt. Old saves keep revision semantics.
Opted-in internal state uses schema 3; portable outputs remain schema 2. Missing or
changed identities and damaged captures cannot retain a complete reviewed status.

See [the verification record](verification/1.1.1/README.md). This additive opt-in
capability is the canonical companion portion of Marketing Studio audit Week 5.

**1.1.0** (2026-10-29) adds standalone local topic assets, source-directory and
URL-list intake, retained originals, source inventories/tags and a portable asset
handoff. Bounded native investigation preserves host identities, source receipts,
checkpoint recovery and full final independent review. The helper remains local;
studios own execution integration and repository synchronization.

The owner requested a new release after merging PR #29. This stable promotion
updates the guidance/runtime floor to 1.1.0 so new tasks on the updated runtime
select the new workflow. Existing cases and tasks keep their layouts and pins.
See [release verification](verification/1.1.0/README.md) and the preserved
[development acceptance](verification/1.1.0-alpha.1/README.md). Live acceptance is a
controlled supplied-document exercise on this host, not a public-source/provider
benchmark or a live Claude Code comparison. Studio adapters are enabled separately.

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
4. The merged change carries the version bump in `package.json`,
   `package-lock.json` and `guidance/manifest.json` (its `minimumRuntime` equals the package version)
   and its CHANGELOG and release-history entries. A version tag, if one is made, is
   only a label; nothing installs from it or waits for it.

Installing, updating and automatic guidance refresh all read `main`: `start`
takes the guidance on `refs/heads/main`, and refuses it with the update message
when it needs a newer runtime than the one installed. Merge guidance together with
the runtime it needs. Guidance cannot upgrade executable helpers; users update by
installing from `main`. An approved earlier commit on `main` can still be pinned
explicitly with `pin --revision`.

Keep each release's guidance and old commands usable: existing tasks resume their
saved guidance on whatever runtime is installed, so a release must not remove a
command or state format that saved work depends on. Only one runtime is installed
at a time. Rollback means installing an earlier commit of `main`; a task whose saved
guidance needs a newer runtime is then refused until the runtime is updated again.
Neither direction converts existing research formats.
