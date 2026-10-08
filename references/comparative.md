# Comparative research and existing outlines

Use this path for many objects assessed against shared fields or to continue an
existing `outline.yaml` / `fields.yaml` project. A bounded question queue usually
needs only the Node evidence helper; do not introduce a matrix unnecessarily.

Retain the existing items, field definitions, output directory and requested
depth. Add requested objects or fields without duplicates. Treat missing scope,
time constraints or decision criteria as material intake; honor answers already
given. The AI owns the outline and results. Existing approval covers execution
within scope; fixed upstream prompt wording and repeated confirmations are not
requirements of Harness Research. Do not change models or feature settings.

For new comparison projects, write `outline.yaml` (topic, items and execution
paths) and `fields.yaml` (categories, descriptions and brief/moderate/detailed
depth). Capture each object's JSON with every selected field; mark uncertainties
explicitly. Resume only validated results with current evidence. Honor the user's
language. Sequential work works in every harness; parallel work needs permission.

The preserved platform resources document these optional operations. Select one
matching the current harness and task; do not load the complete bundle:

- Codex: [outline](../upstream/codex/skills/research/SKILL.md),
  [items](../upstream/codex/skills/research-add-items/SKILL.md),
  [fields](../upstream/codex/skills/research-add-fields/SKILL.md),
  [deep results](../upstream/codex/skills/research-deep/SKILL.md).
- Claude Code: corresponding files under `upstream/claude/skills/`.
- Cursor/other harnesses: use the same data contract and your available tools;
  no named upstream agent is necessary.

Optional field-coverage validation uses the retained
`upstream/codex/skills/research/validate_json.py`. It requires Python/PyYAML;
prepare a project-local `.research-venv` with `PyYAML==6.0.3` when needed.
Never alter system Python. Validation checks coverage, not truth.

For the final comparison, include every item, citations, contradictory evidence,
and named missing/uncertain fields. The retained legacy `research-report` skill
omits uncertain values; Harness Research keeps gaps visible in its synthesis.
For tracked factual questions, also save evidence through the Node helper. Do
not turn item/field JSON into factual claims without inspected source passages.

Save the final cited comparison as a readable report in the retained project
output location, open it, and verify coverage of the agreed items and fields
before returning or using it for dependent content. JSON results and source
collection alone are not the handoff. Apply the
[completion checks](evidence.md#before-handoff) to tracked factual questions;
retain explicit uncertainty rather than requiring every finding to be supported.
