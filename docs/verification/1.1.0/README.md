# Harness Research 1.1.0 release verification

The owner requested a release after PR #29 was merged on 2026-10-29. Stable 1.1.0
promotes that implementation, updates package/guidance identity and runtime floor,
and replaces preview setup with published-release instructions.

[Development acceptance](../1.1.0-alpha.1/README.md) preserves the implementation,
independent review, controlled supplied-document example and benchmark limits.
No new public-source or live cross-harness research trial is claimed by this
version promotion. Native candidate results and immutable release identity are
recorded below after verification.

## Stable candidate native gate

**209 passed, 0 failed, 0 skipped**, macOS 27.0 / Node 22.23.2 / Python 3.9.6.
Legacy and topic/collection isolated installation checks, generated context and
package audit passed; zero vulnerabilities. The owned disposable VM was removed
and its stopped base preserved. [Native logs](native/),
[installed topic smoke](native/installed-topic-smoke.json),
[source hashes](native/source-files.sha256) and
[controlled benchmark](native/collection-benchmark.json) preserve exact evidence.

The tested tree is based on merged implementation commit
`3a999281b6b6d2c20631167b3ed306f6c4ac99ef`, with the stable version/guidance/docs
updates pinned by the source manifest. All implementation, tests and guidance
match those bytes. Later edits only preserve this verification record.

Upstream attribution/license hashes and all preserved example manifest hashes
were verified. The release attaches the exact tagged source archive and SHA256SUMS.
Post-publication verification downloads and checks the archive, installs it in a
disposable home, exercises local topic/collection behavior and verifies automatic
stable guidance selection. A separate post-publication asset records those results.

The user also requested installation of the published version locally. The trusted
installer retains previous immutable runtimes for existing pins and rollback;
local installation does not restart studios or migrate running research.
