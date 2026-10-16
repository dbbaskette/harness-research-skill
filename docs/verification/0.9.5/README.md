# Harness Research 0.9.5 verification

**Status (2026-10-16): released after the owner asked for it.** 0.9.5 adds the
README's progressive disclosure map and brings documentation up to 0.9.4. It
changes no runtime behaviour, so no live trial was run.

![Progressive disclosure map](../../images/context-loading.svg)

- **Native:** `npm test` gives 125 tests: 124 passed, 1 skipped (the Python-gated
  validator, no PyYAML). The new test checks that the committed map matches what
  `npm run context:update` renders from the current measurements, and that it shows
  each measured total. Dependency audit: 0 vulnerabilities. The context check
  passes ([logs](native/)).
- **Installed (disposable `--home`/`--shared`):** all three links report
  `harness-research 0.9.5`. The 0.9.1 command checks pass 45/45 and the 0.9.2 fix
  checks pass 9/9 ([checks](installed/checks.json),
  [fix checks](installed/fixes-checks.json)).
