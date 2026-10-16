# Harness Research 0.9.1 verification

**Status (2026-10-16):** the 0.9.1 candidate, commit
`55d1695147f5d18dabc7ba0318073e0e92d138b3`, passed every check in the
owner-approved acceptance scope. The release itself (merge, `v0.9.1` tag and
assets) waits for the owner's confirmation.

| Check | Result | Evidence |
| --- | --- | --- |
| Native tests (`npm test`, clean tree) | 114 tests: 113 passed, 0 failed, 1 skipped (the Python-gated validator; no PyYAML) | [native/](native/verification.json) |
| Dependency audit, context check | 0 vulnerabilities; context measurements match | [audit](native/audit.log), [context](native/context.log) |
| Installer, disposable `--home`/`--shared` | Installed; all three discovery links report `harness-research 0.9.1` | [installer](installed/installer.log), [version](installed/installed-version.log) |
| New commands through the installed CLI | 45 of 45 checks over 130 calls on synthetic projects | [checks](installed/checks.json), [transcript](installed/transcript.jsonl), [driver](installed/drive.mjs) |
| Guidance fallback | With a newer `v0.10.0` needing runtime 0.10.0, `sync-guidance start` pins `v0.9.1` and reports `freshness: older-compatible-release` with a notice. Without that tag it reports `current-at-start` | [guidance-fallback/](guidance-fallback/start-with-newer-release.json) |
| Live acceptance (Claude Code and Codex) | Every new command reached from plain-language follow-ups; 8 non-blocking findings | [live-acceptance/](live-acceptance/README.md) |

## Native gate

`npm test` ran on the host in a clean worktree at the candidate commit (macOS
27.0.1, Node 22.23.1). The one skipped test needs `HARNESS_RESEARCH_PYTHON` with
PyYAML. That package could not be installed inside the session sandbox, so the
test was skipped rather than run. The Tart VM gate (`npm run ci:local`), which
pins PyYAML, was not run for 0.9.1. Later commits on this branch change only
documentation and evidence. The installer packages none of them, so the
installed content digest `282e147e…` is unchanged.

## Installed commands

[drive.mjs](installed/drive.mjs) installs nothing itself. It runs only the
installed CLI on four synthetic projects and checks:

- `verify`: `[R:key]` markers read from a draft, with gone keys and read-only behaviour;
- `approve`: a stale-revision refusal, current approval, and a lapse after each later round;
- `reassess --again`: a round on one chosen question, its refusals, and the round shown
  in the report and `facts.json`;
- `refresh`: only the cited web source is listed, a changed passage makes its fact
  stale, and only that question is researched again;
- `start --from`: reuse from another project, a supplied-only import round with its
  warning, a new-topic extension, and reuse from the same project;
- `find`: listing, skipping `node_modules`, case-insensitive `--query`, and the
  `--in` refusal.

All disposable state was removed ([cleanup](installed/cleanup.log)).

## Guidance fallback

[sync-check.sh](guidance-fallback/sync-check.sh) clones this repository into
disposable state. It tags the candidate `v0.9.1` there, adds a synthetic
`v0.10.0` whose manifest needs runtime 0.10.0, and calls the installed runtime's
`sync-guidance` `start` against that clone. The pinned `SKILL.md` matched the
candidate byte for byte. No tag was created in the real repository.
