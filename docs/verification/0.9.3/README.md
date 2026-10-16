# Harness Research 0.9.3 development checks

**Status (2026-10-16): in development, not released.** 0.9.3 addresses the three
minor findings left from the [0.9.1 live trials](../0.9.1/live-acceptance/README.md#findings).

| Finding | Change | Check |
| --- | --- | --- |
| Report length: evidence lists were 49–69% of the trial reports | Each answer's "Facts behind this answer" list is folded into a collapsed `<details>` block after the cited prose. Nothing is removed | Regression test; the installed command checks still pass on folded reports |
| A reused run extended with a new topic kept the origin's scope paragraph | The extension brief asks for `scope` (and optional `title`) when the topic or audience changes; the helper accepts both | Regression test (restated and kept scope) |
| The trial extractor dropped strikethrough | The run contract says to keep struck or deleted text as `~~text~~` and never cite it as current. [tools/page-text.py](tools/page-text.py) keeps that markup | Run on the live `wal.html`, it marks both struck passages |

- **Native:** `npm test` gives 119 tests: 118 passed, 1 skipped (the Python-gated
  validator, no PyYAML). The context check passes ([log](native/tests.log)).
- **Installed (disposable `--home`/`--shared`):** all three links report
  `harness-research 0.9.3`. The 0.9.1 command checks pass 45/45 and the 0.9.2
  fix checks pass 9/9 ([checks](installed/checks.json),
  [fix checks](installed/fixes-checks.json)).

Release verification (the merged-tree archive, tag and assets) follows
[the release procedure](../../releases.md) when `v0.9.3` is cut.
