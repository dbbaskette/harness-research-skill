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

Verification pending: evidence/resume contracts, legacy record/alias migration,
shared installation, comparative validator, Brand packaging, context counts and
full local macOS suites. No live service access is needed or established.
