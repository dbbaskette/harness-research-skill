# 0.9.4 live trials: lighter light depth and per-role guidance

Date: 2026-10-16. One fresh run of the 0.9.1 SQLite WAL request in each harness,
on the 0.9.4 candidate (`0b6377a`, installed into disposable `--home`/`--shared`,
guidance supplied explicitly from the checkout). Initial runs only; no follow-ups.
Single observations, not benchmarks. Figures are in [comparison.json](comparison.json),
computed by [compare.py](compare.py).

## Claude Code

Same topic, same coordinator recipe, and the **exact plan the 0.9.1 trial
submitted**: 9 questions in 4 sections, plus the same gap-round question. Worker
prompts matched 0.9.1's, except that they point at the task's `guide` instead of
sections of the run guidance. Baseline: the 0.9.1 initial run
([record](../../0.9.1/live-acceptance/README.md)).

| | 0.9.1 | 0.9.4 | Change |
| --- | ---: | ---: | ---: |
| Wall time, initial run | 25 min 17 s | 9 min 52 s | −61% |
| Subagents | 14 | 14 | — |
| Subagent tokens, total | 1,716,769 | 1,230,707 | −28% |
| Researcher, mean | 117,993 | 88,872 | −25% |
| Checker, mean | 138,470 | 91,837 | −34% |
| Writer, mean | 108,614 | 81,790 | −25% |
| Checked facts (first pass with gap round) | 111 | 60 | −46% |
| Most facts on one question | 12 | 6 | at the new limit |
| Narrowed by checkers | 14 (13%) | 7 (12%) | similar rate |
| Rejected | 0 | 0 | — |
| Answer sentences, 9 questions not later researched again | 128 | 62 | −52% |
| Answer prose words, same 9 questions | 3,509 | 1,805 | −49% |
| Report words outside folded evidence | 6,660* | 3,512 | −47% |
| Report words, total | 19,577* | 9,751 | −50% |
| Questions answered / partly | 10 / 0 | 9 / 1 | crash recovery partly answered |

\* The saved 0.9.1 report is the final one, after a research-again round
(+12 facts) and a refresh. Its first-pass report was not kept, so these two rows
overstate the 0.9.1 baseline a little. The sentence and prose rows compare only the
nine questions that round did not touch.

## Codex

Same prompt as the 0.9.2 Codex run apart from version and paths. That run is the
baseline because it is an initial-only run of this request under the 0.9.1 light
limits ([record](../../0.9.2/live-codex/summary.json)).

| | 0.9.2 (0.9.1 limits) | 0.9.4 |
| --- | ---: | ---: |
| Wall time | 6 min 29 s | 4 min 53 s |
| Questions (Codex's own plan) | 8 | 7 |
| Checked facts / most on one question | 39 / 7 | 35 / 6 |
| Answer sentences / prose words | 32 / 818 | 23 / 558 |
| Report words outside folded evidence | 1,673 | 1,224 |
| Checker invocations | 4 separate children | 1 (the coordinator) |
| Coordinator tokens, input / output | 2.76M / 16.2k | 2.87M / 12.9k |

Codex's worker children read `task-research.md`, `task-check.md` and
`task-write.md` through their guides. Codex already stayed near 5 facts per question,
so the new limit changed little for it. Its coordinator checked all three sections
itself this time. The rules allow that, because it researched none of the questions,
but the 0.9.2 run started four checker children. Part of the time saved comes from
that choice, not from 0.9.4. Codex reports usage for the coordinator only, so child
tokens are not compared.

## What this shows

- **Cost and time fell.** Light depth produced about half the facts and half the
  prose in Claude Code. Every role used fewer tokens, checkers most of all (−34%),
  and the run took less than half the time.
- **Accuracy held.** Checkers narrowed a similar share of facts (12% against 13%),
  and none were rejected in either run.
- **Coverage gave a little.** One question, crash recovery, came back partly
  answered: with 6 facts the researcher left out the recovery procedure. 0.9.1
  answered every question.
- **Per-role guidance had one regression.** The rule against citing struck-through
  text lived only in the Sources section, which checkers no longer read. A checker
  recorded a gap from struck 1 GB guidance in the saved copy. 0.9.1's checker made
  the same mistake before struck text was marked at all. `task-check.md` now carries
  the rule, with a test, on this branch.

## Confounds

The 0.9.1 baseline coordinator was running the Codex trial at the same time and
recovered from a leasing script error. This run's coordinator knew the plan in
advance. Subagent models were not recorded. No person read either report for
usefulness.
