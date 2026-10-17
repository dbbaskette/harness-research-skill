# Pass a studio task to research

Read this when a content studio requests or consumes synthesis research. The
research-side contract uses existing dossier fields; it does not migrate an
installed studio or its legacy adapter automatically. A caller using schema 1
must deliberately adopt the [schema-2 contract](../docs/migration-v1.md).

## Send the actual task

Pass the intended audience, the content task and what it should help that audience
understand or do. Preserve source permissions and any exclusions. Use ordinary
language in `purpose`; keep audience, scope and permission in their existing fields.
This fragment illustrates those fields, not a complete dossier:

```json
{
  "audience": "Application architects considering Redis replacement",
  "purpose": "Inform a 20-minute technical presentation that helps architects identify practical migration candidates and compatibility risks. Prioritize key messages and evidence worth explaining visually.",
  "scope": "Workload suitability, version and feature boundaries, migration risks and the case for staying with Redis",
  "source_mode": "public"
}
```

A blog task can ask for the central argument, mechanism and strongest objections;
a training task can ask for a concept sequence, misconceptions and grounded
examples. These are flexible research shapes, not required format enums or finished
content. If several uses matter, preserve any stated priority; without one, make
one useful general handoff. Do not produce multiple downstream deliverables by
default. If no use or task is supplied, research defaults to `General-purpose topic
research`: a balanced topic explanation and prioritized general overview. The
helper also normalizes omitted, null or blank purpose values to that default.

The author writes ordered `brief` sections for the task, choosing their headings
and supporting references. The short brief prioritizes material; the report gives
its connected explanation and the evidence appendix keeps the full trace. Any
illustrative examples retain that label and grounded premises. Both report and
authored brief prose receive independent review against the saved digest.

## Return the saved bundle

After saving, reviewing and verifying, return the report and brief paths together
with their actual state. Use `research/output.json` as the existing machine-readable
return contract: `owner`, `schema`, `digest`, `status` and `artifacts` containing
relative file paths and SHA-256 hashes. Artifact paths resolve from the manifest's
directory. Do not invent a second callback format or read legacy `facts.json`
as schema 2.

For a human or agent handoff, this concise description is sufficient:

```text
Report: <project>/research/report.md
Brief: <project>/research/brief.md
Bundle: <project>/research/output.json
Status: <actual saved status>
Digest: <exact digest from output.json>
Limits: <material gaps or review/source limitations>
```

A draft remains a draft; a matching hash establishes integrity, not source truth
or current website contents. Preserve the evidence and pinned sources when copying
the bundle so relative citations continue to work. The studio should retain
qualifications while compressing, and distinguish its own new interpretation
from what research reviewed. Changed purpose or authored research prose needs a
new save and review, as described in [reuse](synthesis-reuse.md).

The studio still owns slide design, article writing or lesson development. This
handoff supplies research suited to that work and grants no publication authority.
