# Harness Research 0.9.2 verification

**Status (2026-10-16):** 0.9.2 fixes the five helper and guidance findings from
the [0.9.1 live trials](../0.9.1/live-acceptance/README.md#findings). The owner
asked for it to be implemented, merged and released. Its scope is the checks
below; the full live matrix was not rerun.

| Check | Result | Evidence |
| --- | --- | --- |
| Native tests (`npm test`, clean tree at `b6156d8`) | 117 tests: 116 passed, 0 failed, 1 skipped (the Python-gated validator; no PyYAML) | [native/](native/verification.json) |
| Dependency audit, context check | 0 vulnerabilities; context measurements regenerated and matching | [audit](native/audit.log), [context](native/context.log) |
| Installer, disposable `--home`/`--shared` | Installed; all three discovery links report `harness-research 0.9.2` | [installer](installed/installer.log), [version](installed/installed-version.log) |
| 0.9.1 command checks, rerun on the 0.9.2 install | 45 of 45 | [checks](installed/checks.json) |
| Fix checks through the installed CLI | 9 of 9 | [fix checks](installed/fixes-checks.json), [script](installed/fixes-check.mjs) |
| Guidance fallback | `v0.9.2` pinned with `freshness: older-compatible-release` and a notice when a newer `v0.10.0` needs runtime 0.10.0; `current-at-start` without it | [guidance-fallback/](guidance-fallback/start-with-newer-release.json) |
| Live: one fresh Codex run of the 0.9.1 request | `complete`: 8 questions, 38 checked facts, 4 checker invocations, 6 min 29 s. Codex returned `research/report.md` and wrote nothing outside `research/`. Its first `start` met the new plain missing-folder message | [live-codex/](live-codex/summary.json) |

## What each fix check covers

- **Number rule:** a fact naming `sqlite3_wal_checkpoint_v2()` is accepted
  although its quote has no 3 or 2. The same fact claiming "1000 frames" is
  still refused.
- **Relative `--from`:** a miss names the folder it looked in and says the path
  is read relative to `--project`. An absolute miss carries no such hint, and a
  correct relative path works.
- **Missing project folder:** reported as "does not exist", with no `ENOENT`.
- **`peek --harness`:** accepted, as with `next`.
- **Guidance:** observed live. In 0.9.1, Codex linked a project-root summary of
  its own. In this run it linked `research/report.md`, and the project root holds
  only `.harness-research/` and `research/`.

## Limits

One Codex run is a single observation of the guidance change, not a measured
rate. Claude Code was not rerun; its 0.9.1 behaviour already returned
`research/report.md`. The Tart VM gate was not run, so the Python-gated test was
skipped. The remaining 0.9.1 findings are a trial-tooling limit (the
strikethrough extractor), the scope text of extended runs, and report length.
They are not changed here.
