# General-purpose default verification

When no purpose or studio task is supplied, research defaults to **General-purpose topic research**. Explicit uses remain intact and guide the authored format. The skill describes a useful general topic overview without requiring a content-specific structure or a purpose intake question.

The helper normalizes omitted, null, empty and whitespace-only purpose values before saving and hashing. Tests verify equivalent default digests, persisted report/brief/facts output, explicit studio-task preservation, and invalid-type rejection.

Full native verification: **156 passed, 0 failed, 0 skipped** on macOS 27.0, Node 22.23.2 and Python 3.9.6. Audit found zero vulnerabilities; context and installed CLI checks passed. The task-owned disposable VM was removed and the base preserved. The tested working tree is pinned by [native/source-files.sha256](native/source-files.sha256); runtime, tests and guidance match these hashes. See [verification.json](verification.json) and retained native logs.

This verifies the local preview; the active installation and published release were not updated.
