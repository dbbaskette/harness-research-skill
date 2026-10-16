# Harness Research 0.9.4 development checks

**Status (2026-10-16): released after the owner confirmed it.** 0.9.4 implements
recommendations 1 and 2 of the 0.9.3 skill review.

| Change | Before (0.9.3) | Now |
| --- | --- | --- |
| Facts per question at light | up to 12; researchers hit it on 8 of 10 trial questions | up to 8 (the live trials ran at 6); standard 20, deep 30 unchanged |
| Answer body sentences at light | 1–40 | 1–10; standard and deep keep 40 |
| Guidance a researcher subagent reads | `research-run.md`, 3,395 tokens | `task-research.md`, 1,133 tokens |
| Guidance a checker subagent reads | 3,395 tokens | `task-check.md`, 541 tokens |
| Guidance a writer or reviewer subagent reads | 3,395 tokens | `task-write.md`, 580 tokens |
| Coordinator's full checked run | 4,617 tokens | 4,838 tokens (run guidance plus the research and writing contracts) |

Token counts are from the generated table in the README (`cl100k_base`). Every
task now carries a `guide` naming its worker's file and sections. Pinned work
points into its saved guidance snapshot, and an older snapshot falls back to
`research-run.md`.

- **Native:** `npm test` gives 124 tests: 123 passed, 1 skipped (the
  Python-gated validator, no PyYAML). The context check passes
  ([log](native/tests.log)).
- **Installed (disposable `--home`/`--shared`):** all three links report
  `harness-research 0.9.4`. The 0.9.1 command checks pass 45/45, and the 0.9.2
  fix checks pass 9/9 ([checks](installed/checks.json),
  [fix checks](installed/fixes-checks.json)). All 24 tasks leased through the
  installed CLI carried a `guide` into the installed runtime: source, plan and
  research tasks named `task-research.md`, checks `task-check.md`, and
  cross-checks and writing `task-write.md`.

[Live trials](live/README.md) in Claude Code and Codex compare one fresh run each
with the 0.9.1-limit baselines. In Claude Code, subagent tokens fell 28%, wall time
61% and report length 50%, with one question only partly answered. The trials also
showed that checkers had lost the strikethrough rule in the split; `task-check.md`
now carries it.
