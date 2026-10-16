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

The full native gate and its exact tested commit will be recorded after it runs.
The broader live release-acceptance matrix remains open as documented in
[development verification](README.md); this work does not tag or publish 0.9.0.
