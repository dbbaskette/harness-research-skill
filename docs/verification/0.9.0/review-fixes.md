# Follow-up review fixes

The review of `0afa3d3` found three reproducible gaps against draft 8. All three
are corrected without changing the plain-language skill interface:

- Releasing a research task retains that invocation's participation and checker
  exclusion, even after a refused submission. Released attempts remain in history.
- Re-registering a source as a partial capture generates a different default
  revision ID. Existing metadata/citations stay immutable; corrected findings use
  the returned ID and their existing lease. Explicit old IDs still refuse mutation.
- Comparison tables and coverage select facts through section-question links, so
  a fact merged across sections remains visible in every relevant section.

The expanded research-run suite passed **35/35**, including the release/refusal
case, idempotent partial-capture recovery with immutable prior metadata, and an
end-to-end cross-section merge with both subjects in the final report. Skill
validation, refreshed context measurements and whitespace checks also passed.

The full native gate passed on clean commit `65071d3094e12a7250bbd5dd18f9b210f4b3d7e6`: **77/77 tests,
zero failures or skips**, on macOS 27.0, Node 22.23.2 and Python 3.9.6. Dependency
audit reported zero vulnerabilities; context, installer and installed CLI checks
passed. The disposable VM was deleted and its directory is absent.
[Machine-readable evidence](ci-review-fixes/verification.json) and the
[full test log](ci-review-fixes/tests.log) are retained. Subsequent evidence-only
edits do not change the tested runtime, instructions, tests or example artifacts.
The broader live release-acceptance matrix remains open as documented in
[development verification](README.md); this work does not tag or publish 0.9.0.


The initial implementation PR's GitGuardian check flagged sixteen lease values in
archived live test runs. All 26 temporary task-lease tokens in those archives are
now redacted; facts and output hashes are unchanged. The original pushed branch
is retained. A fresh implementation commit above the unchanged design history
publishes the sanitized tree without a force push or scanner suppression. The
preserved-live-example check passed after these artifact-only edits; the tested
runtime, instructions and tests remain unchanged.
