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

Before release, the spec's broader Claude/Codex topics, supplied PDF/link trials and
matched 0.8.1 comparisons remain required. These narrow live examples and deterministic
tests establish implementation evidence, not the entire release acceptance matrix.

Full native CI passed on commit `d0a865b1fbe15922b42aa87ea0bc4070b76ee023` (clean tree), using the existing
Tart wrapper: macOS 27.0, Node 22.23.2, Python 3.9.6; **67 tests passed, zero failed or
skipped**. Dependency audit reported zero vulnerabilities, context measurements matched,
and installation plus installed CLI checks passed at version 0.9.0. The disposable clone
was deleted and its VM directory is absent. [Machine-readable evidence](ci/verification.json)
and [test log](ci/tests.log) are retained. No GitHub CI workflow is present in this source
checkout; no remote CI result is claimed. Later documentation-only evidence updates do not
change the tested implementation or example artifacts.
