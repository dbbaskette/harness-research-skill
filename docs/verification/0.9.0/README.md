# Harness Research 0.9.0 development verification

These are actual skill-guided examples using an explicitly selected local development
runtime and guidance, not a published 0.9.0 release or a public-main refresh. The agent
read the skill, used its harness tools, arranged a fresh independent checker, wrote the
report, and opened the saved result. No global skill installation was changed.

| Example | Deliverable | Result |
| --- | --- | --- |
| Two supplied synthetic database notes; deployment, writers, retention | [Report](supplied/research/report.md) | 6 questions, 4 checked facts, 2 assessed retention gaps |
| PostgreSQL/SQLite public primary docs; deployment and concurrency | [Report](public/research/report.md) | 4 questions, 8 checked facts, 1 narrowed assertion; explicit excerpt limits |

Both used separate Codex checker invocations. Light depth intentionally omits a separate
semantic prose review; the reports disclose that. Public excerpts are short, traceable
verbatim passages; retained excerpts are not full originals and their original-document
hashes are unavailable. Current-document URLs do not establish a fixed product release.

Each example retains source text, the report/facts/brief/plan and output manifest, the
accepted run record, and concise usability/checker observations in `results/`. Original
live runs completed at revisions 37 (supplied) and 27 (public). Regenerating derived output
after CLI/schema/presentation fixes produced revisions 38 and 28; no evidence/checking was
replaced. Automated tests revalidate the retained manifests, schema, exact quote positions,
hashes and researcher/checker separation.

The live trials found and drove fixes for absolute in-project source paths, result-file
paths resolving relative to `--project`, the documented question-kind enum, `research help`,
gap citations and clickable local-source links. Original observations remain as evidence.

An isolated Claude Code 2.1.287 trial was attempted with the same synthetic sources and
restricted tools. It returned `Not logged in · Please run /login` before any model/tool
work (zero API tokens/cost). It did not establish Claude acceptance. No account setup or
configuration change was attempted.

The public example's saved sources are 17 to 21-word excerpts of the pages it quotes. The
runtime now refuses saved text that short, or a quote that is most of its source, unless the
source is registered as a partial capture with its reason; the example predates that rule
and is kept as it was recorded.

A [Claude Code trial](claude-code-redis-valkey/README.md) (2026-10-16) ran Redis vs
Valkey at light depth side by side with the 0.8.1 skill: 13 min 50 s against 4 min 59 s,
for 20 questions and 113 independently checked facts against 8 unchecked findings.
Before release, a person's 30-assertion quality sample, the Codex trials, the deep and
broad-topic runs, supplied PDF/link trials and the fact-check comparison remain required. These narrow live examples and deterministic
tests establish implementation evidence, not the entire release acceptance matrix.

Full native CI passed on commit `d0a865b1fbe15922b42aa87ea0bc4070b76ee023` (clean tree), using the existing
Tart wrapper: macOS 27.0, Node 22.23.2, Python 3.9.6; **67 tests passed, zero failed or
skipped**. Dependency audit reported zero vulnerabilities, context measurements matched,
and installation plus installed CLI checks passed at version 0.9.0. The disposable clone
was deleted and its VM directory is absent. [Machine-readable evidence](ci/verification.json)
and [test log](ci/tests.log) are retained. No GitHub CI workflow is present in this source
checkout; no remote CI result is claimed. Later documentation-only evidence updates do not
change the tested implementation or example artifacts.

The [follow-up review fixes](review-fixes.md) subsequently passed a fresh native gate
with **77 tests, zero failures or skips**, on clean implementation commit
`65071d3094e12a7250bbd5dd18f9b210f4b3d7e6`. See its separate evidence record for current coverage.

Shared run archives redact all 26 expired task-lease tokens. Facts, sources, checks,
quote hashes and output manifests are unchanged; the archives document completed
work and cannot resume those disposable runs.

The integrated runtime improvements and new user guides passed a fresh native
gate on `e2465f765a124dd4799c40437fe62cce6a72e155`: **86 tests, zero failures or skips**, audit,
context, installation and installed version 0.9.0. The disposable VM was deleted
and its directory absence verified. [Release-candidate native evidence](ci-release-candidate/verification.json)
records the tested tree, logs and a transient cleanup diagnostic. The broader
live acceptance and human sampling remain separate release gates.

Live acceptance subsequently exposed an original-access contract bug: a checker
could not reject inaccessible evidence honestly without attesting an original
read. The fix permits `read_original:false` only with rejected dependent facts,
concrete access errors and source-linked access gaps; confirmed and narrowed
facts still require original reads. The compromised Codex example is retained as
failed evidence, and its authored research is checked again in a new run.

The consolidated fixes passed the full native gate on `f6c15c9ef3e7ce6498d004188e23f7219826a30c`: **88 tests, zero failures or skips**, plus audit, context,
installation and installed version checks. Cleanup was independently verified.
[Current native evidence](ci-acceptance-fixes/verification.json) retains exact
source identity and logs; human semantic acceptance is still pending.
