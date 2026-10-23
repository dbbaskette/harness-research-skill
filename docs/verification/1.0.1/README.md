# Harness Research 1.0.1 release verification

## Authorization

The owner asked, as the final step of a studio review, to "cut new releases of
the studios and the harness skills and pin the latest versions". Asked directly,
the owner then approved publishing "Harness Research 1.0.1" as an immutable
public tag and release on 2026-10-23. That is the publication authorization
required by [releases](../../releases.md).

## Release content

1.0.1 publishes the changes merged after 1.0.0 (PR #26, closing issue #25, and
PR #27) and sets the release version:

- Synthesis status/verify exit 1 for stale evidence or failed artifact integrity,
  and a submitted review with objections exits 1 while saving them.
- Supplied originals outside the project are copied into the project and pinned.
- The evidence appendix keeps full finding qualifications; every overwritten
  output is preserved under `.harness-research/output-backups/`.
- Abandoned installer and guidance locks are recovered when their owner has
  exited; guidance selection searches up to 100 stable releases.
- Opt-in `--compact` replies, `synthesis template` and nonmutating
  `synthesis validate`, a runnable schema-2 example, and a simplified README.
- Package, guidance manifest and skill entry are `1.0.1`; the guidance floor is
  runtime `1.0.1`, so 1.0.0 installations keep 1.0.0 guidance until updated.

## Tested tree

The native gate ran on release-branch commit
`63542837ea9e1f4b686f59e14971d1276699112f` with a clean working tree
([run](native/run.txt)). [Source hashes](native/source-files.sha256) list all 622
files of that commit; each matched the copy tested in the VM. The VM copy also
held git-ignored local directories (`.claude/worktrees`, `.codex-build`) that are
not part of the repository or the release archive. Only this verification record
was added after the gate.

## Checks and results

| Check | Result |
| --- | --- |
| Native gate (`npm run ci:local`): disposable Tart VM, macOS 27.0, Node 22.23.2, Python 3.9.6 with PyYAML 6.0.3 in a venv | **PASS**: 169 passed, 0 failed, 0 skipped ([tests](native/tests.log)) |
| Package audit in the VM | 0 vulnerabilities ([audit](native/audit.log)) |
| Generated context check in the VM | PASS, input digest `3d850dc2…19bd9` ([context](native/context.log)) |
| Isolated installation in the VM: installer, `--help`, `--version`, legacy plan, synthesis help/save/status | PASS; version `harness-research 1.0.1`; empty synthesis draft is schema 2, draft, no reviewer ([status](native/installed-synthesis-status.json)) |
| Host suite in the agent sandbox (no HOME writes allowed) | 168 passed, 0 failed, 1 skipped (the PyYAML-gated comparative validator test; it ran in the VM) |
| Host isolated install of a `git archive` of the tested commit into a disposable HOME and runtime directory | PASS: three discovery links, version 1.0.1; the schema-2 example validated without creating state, then saved, reported compact status, wrote a review template and verified as an intact draft |
| `git diff --check` | PASS |

The test VM was deleted by the runner after the run; the base VM was left
stopped and unrelated VMs were not touched. Publication attaches an archive of
the exact release commit, `SHA256SUMS`, and release and post-publish verification
files. The post-publish file records the download checksum and a clean install of
the downloaded archive into a disposable HOME.

## Acceptance scope and live trial

No live model research trial was run for 1.0.1. The code changes are in the local
helper (exit codes, original pinning, rendering, backups, locks, release search
and new commands) and are covered by deterministic regression tests and the
installed-command checks above. The guidance changes tell agents to use the new
compact, template and validate commands and how to read exit codes; they do not
change investigation, writing or review standards. Like 0.9.3 and 0.9.5, this
patch was released on mechanical checks.

Consequently, no agent has yet been observed following the 1.0.1 guidance. Whether
agents use `--compact`, `template` and `validate` as intended, and the effect on
context use in real runs, is unmeasured. The 146-versus-4,941-token compact
status figure from PR #26 measures one response, not a research run. The
[1.0.0-alpha.1 acceptance](../1.0.0-alpha.1/README.md) remains the latest live
evidence and is scoped to the Codex host. No cross-model or cross-harness
equivalence is claimed; structured studio adapters still need schema-2 integration.
