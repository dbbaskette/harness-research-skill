# Pass a studio task to research

Read this when a content studio requests or consumes synthesis research. The
research-side contract uses existing dossier fields; it does not migrate an
installed studio or its legacy adapter automatically. A caller using schema 1
must deliberately adopt the [schema-2 contract](../docs/migration-v1.md).

## Supply a local destination and inputs

The skill also works standalone. A studio supplies a local asset destination,
topic/audience/purpose, source permissions and any limits. It may supply a source
directory with `documents/` and `urls.txt`, or an explicit URL-list path; see
[local assets](topic-assets.md). Do not expand selected-library context silently.

Harness Research writes and verifies local files. The studio owns its shared
repository, synchronization, remote conflicts and sharing policy. A failed sync
is separate from research status and can be retried without recollecting evidence.
No Git operation or studio application is required by the research helper.
Topic assets retain their recorded request. A changed audience, purpose or source
permission needs an explicit new asset variant/destination; tags and metadata
text do not mutate that request. Existing same-request assets can refresh sources
through intake and revalidation.

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
with their actual state, asset identity and local root. Use the returned
`output.json` path as the machine-readable return contract: `owner`, `schema`, `digest`, `status` and `artifacts` containing
relative file paths and SHA-256 hashes. Artifact paths resolve from the manifest's
directory. Do not invent a second callback format or read legacy `facts.json`
as schema 2.

For a human or agent handoff, this concise description is sufficient:

```text
Asset: <local-asset-root> (<stable asset ID>)
Report: <local-asset-root>/report.md
Brief: <local-asset-root>/brief.md
Bundle: <local-asset-root>/output.json
Asset files: <local-asset-root>/asset-manifest.json
Status: <actual saved status>
Digest: <exact digest from output.json>
Limits: <material gaps or review/source limitations>
```

For topic assets, the studio synchronizes the relative files listed in
`asset-manifest.json` after synthesis verification, subject to its sharing policy.
That manifest covers metadata, full source inventory, retained inputs and the
reviewed bundle while excluding private helper state. A handoff hash does not
approve an unused source or replace the reviewed digest in `output.json`.

Existing cases keep their `<project>/research/` paths. Resolve artifact paths
from the actual manifest directory, not from an assumed fixed repository root.

A draft remains a draft; a matching hash establishes integrity, not source truth
or current website contents. Preserve the evidence and pinned sources when copying
the bundle so relative citations continue to work. The studio should retain
qualifications while compressing, and distinguish its own new interpretation
from what research reviewed. Changed purpose or authored research prose needs a
new save and review, as described in [reuse](synthesis-reuse.md).

The studio still owns slide design, article writing or lesson development. This
handoff supplies research suited to that work and grants no publication authority.

## Execution capability is a separate opt-in

A studio enabling bounded parallel collection uses the
[portable contract](parallel-research.md), host-issued invocation registration and
capture receipts. It supplies native execution, capacity, shared budget
reservation and cancellation; it does not reimplement packet merging. Retain the
execution protocol separately from pinned runtime/guidance. Existing serial jobs
stay serial, and no running job or installed companion is migrated automatically.
The report/brief/schema-2 output remains the final consumption boundary.
