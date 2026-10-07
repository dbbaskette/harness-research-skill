# Extraction contract

Approved by the user's October 7 request. Move Brand's research functionality
into `~/Projects/harness-research-skill`, create a public repo, and make Brand
invoke the independent skill. Keep private brand assets out of the public repo.

The original implementation has two layers: a modified pinned English fork
bundle (five skills, Codex/Claude agents and search modules) and Brand's custom
Node question/evidence/report engine. Both are retained here. One generic skill
is installed by default; existing Brand-owned aliases migrate without replacing
independent skills. Existing record migration is explicit and retains originals.

Brand retains research intake and report handoff only. Its installer checks the
independent dependency without downloading or reconfiguring it. Legacy installer
options remain accepted for compatibility; Brand updates preserve opt-outs.

## Research verification

October 7, 2026: **PASS** on runtime commit
`0dec21ceac5856559c3ad41df45a36c55f785a96`.

- Clean macOS 27.0, Node 22.23.2, Python 3.9.6; disposable Tart clone.
- 22/22 tests passed, no skips: evidence/resume, privacy boundaries, stale sources,
  explicit record migration, exact alias migration, shared installation and the
  retained comparative field validator.
- Installed helpers ran from Codex and Claude discovery links without runtime
  npm dependencies. Context counts and dependency audit passed.
- Logs: `~/Library/Logs/MacOS Test Suite/harness-research/`
  `harness-research-test-20261007125000-88072-f5040d3d/`.
- The owned VM directory was confirmed absent after cleanup; base and signed-in
  VMs were untouched. One prior transient virtualization startup failure was
  retried after its owned clone was removed.

An earlier clean-machine run caught macOS's `/var` root alias; it is normalized
before destination planning, with a regression check. User-controlled symlinked
skill parents remain rejected. Tests use local synthetic documents and an
isolated Python validator environment; no live provider, model or web research
account was used. Documentation-only changes reuse this runtime evidence.

## Brand integration verification

Brand's full local suite **PASS** on commit
`59b41c6f377db4ed58a323a6a716005b0d95b47d`, with this engine pinned at `0dec21c`.

- macOS 27.0 / Node 22.23.2; 266 active tests passed, four optional skips,
  plus 15/15 real-browser checks.
- The guest cloned this public repo at the exact pin and explicitly installed
  research. Brand found it available in Codex and Claude; the installed research
  CLI created a supplied-only report without any Brand research commands.
- Source/Mac installers, release smoke, portable/Mac archive checksums and
  installed engine inspection passed. Brand packages include no research bundle.
- Logs: `~/Library/Logs/Tanzu Brand/Tart Tests/`
  `tanzu-brand-test-20261007125147-89575-2b9a1c50/`.
- The owned clone was removed and its directory confirmed absent. No live Google,
  model or research service account was used. Brand changes are committed locally;
  its publication is separate from this public skill repository.
