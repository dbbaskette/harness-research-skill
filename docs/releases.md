# Versioned releases

The current release is **0.9.2**. Package/lockfile versions,
`guidance/manifest.json`, the guidance release label in `SKILL.md`, and current
install examples identify this software release. Earlier changelog entries and
saved tasks retain their recorded versions.

The checked standalone workflow needs runtime 0.9.0; its verification and reuse
commands (`verify`, `reassess --again`, `start --from`, `find`, `approve`,
`refresh`) need runtime 0.9.1. Guidance refresh cannot upgrade executable
helpers, so the guidance keeps a minimum runtime of 0.8.1 and routes older
runtimes to the manual workflow. Raise the minimum only when that manual path is
retired. Preview users must reinstall from `v0.9.2` even if their helper already
reports 0.9.2: the immutable content digest distinguishes the bits.

**0.9.3 in development.** The development branch labels its package and guidance
0.9.3 (see the [changelog](../CHANGELOG.md)). The current release stays 0.9.2
until `v0.9.3` is tagged after its own verification; keep the branch off `main`
until then.

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

For subsequent releases, complete native tests, installed CLI/skill checks and
the live acceptance matrix in the
[design](superpowers/specs/2026-10-15-research-with-agents-design.md), or record an
explicit owner-approved change to the acceptance scope.

**Where guidance is served from.** From runtime 0.9.0, new tasks take guidance
from the newest `vMAJOR.MINOR.PATCH` tag whose `minimumRuntime` the installed
helper meets, falling back to `main` only when the repository has no release tags.
Tagging a release is therefore what publishes its guidance. From runtime 0.9.1,
a task that skips a newer release because it needs a newer runtime reports
`freshness: older-compatible-release` and a notice naming that release. Installed helpers up
to 0.8.1 still read `main` directly: until they are updated, keep `main` at
released guidance and develop on branches, merging to `main` when the release is
tagged.
[Release verification](verification/0.9.2/README.md) records completed checks
and the scope of the recorded acceptance evidence. Do not cut the release from
narrow examples alone.

After the relevant full native gate passes, merge the PR and verify its merged
tree matches the tested tree. Brand's combined macOS gate can own shared
verification when it runs the exact pinned Research commit's complete suite,
installer, installed helper and saved-report flow. Reuse that evidence; do not
repeat an unchanged suite merely because the merge SHA differs.

Archive the exact verified merge commit, never a mutable working directory:

```sh
git archive --format=zip --prefix=harness-research-v0.9.2/ --output /private/tmp/harness-research-v0.9.2.zip COMMIT
shasum -a 256 /private/tmp/harness-research-v0.9.2.zip
```

Extract into disposable state, compare every file with the tagged tree, run its
installer with disposable `--home`/`--shared` paths, and verify the installed
`--version` reports 0.9.2. Publish the ZIP and checksum at an unused immutable
`v0.9.2` tag, then download and verify both assets. Keep logs, exact commits,
artifact hashes and cleanup results. No model or real-account access is needed.

Installing updates the entrypoint for new tasks. Existing tasks keep their saved
runtime/guidance; retain those immutable directories. Guidance refresh never
executes downloaded code. To roll back new work, rerun a prior release's installer.
