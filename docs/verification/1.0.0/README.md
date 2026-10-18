# Harness Research 1.0.0 release verification

The owner explicitly selected stable 1.0.0 on 2026-10-18. This promotes the merged
synthesis-first implementation from PR #23, updates version metadata and the
guidance runtime floor, and replaces preview setup instructions with stable setup.

The [development acceptance](../1.0.0-alpha.1/README.md) preserves the reviewed
Valkey/Redis case, editorial refinements, general-purpose default and independent
review. Stable release validation and immutable artifact identity are recorded
below when verified. This is not a new live research or cross-harness trial.

## Stable candidate gate

**156 passed, 0 failed, 0 skipped**, macOS 27.0 / Node 22.23.2 / Python 3.9.6.
Isolated installation, installed synthesis save/status, generated context checks
and package audit passed (zero vulnerabilities). The disposable VM was removed;
the base remains. [Native logs](native/) and [source hashes](native/source-files.sha256)
pin the tested working tree based on merged commit
`fb14ea1cb6c517f8a3c25c7270cd52dea74f1402`. All runtime, tests and guidance match
the tested hashes; only this verification record was added afterward.

The initial stable gate passed 155/156: one assertion still expected the alpha
runtime floor. It was updated to the approved stable floor 1.0.0; the complete
gate then passed. The failed run's logs remain at
`/private/tmp/harness-research-stable-ci/harness-research-test-20261018142837-38492-e18c6c7c`.
Both task-owned test VMs were removed.

Upstream source/license hashes and the corrected Valkey/Redis output manifest
were verified unchanged. Publication attaches an archive of the exact release
commit and SHA256SUMS; the downloaded artifact is verified before local installation.
Old immutable runtimes are retained for pinned tasks and rollback.
