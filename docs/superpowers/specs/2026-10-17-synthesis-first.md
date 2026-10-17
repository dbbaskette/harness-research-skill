# Synthesis-first Harness Research

Approved direction: the user requested implementation on 2026-10-17. Development version: 1.0.0-alpha.1; this is not a published release.

## Product

Harness Research remains a skill. The agent investigates with its available tools, identifies what matters, synthesizes an explanation for the intended audience, and saves an inspectable result. Adapt Anthropic's Knowledge Synthesis instructions: deduplicate related evidence without erasing disagreement, group by theme, prioritize by reader purpose, assess applicability, and write a coherent attributed answer. Preserve the upstream source, revision, Apache license and modification notice.

Questions organize inquiry and coverage when useful; they do not determine the report's shape or its completion. A narrow factual check may need a few paragraphs. A comparison needs aligned criteria. An explanatory report needs concepts, mechanisms and implications. None needs a compulsory question count or source quota.

## Architecture

The default path is an agent-led investigation and synthesis with a document-first local ledger. A schema-2 dossier describes sources, facts, findings, report sections and optional criterion-based comparisons. The helper validates relationships and exact quotes, pins evidence, records independent review, and exports artifacts. It does not browse, call models, spawn workers or decide that a claim is true.

`synthesis save` accepts an entire dossier and an actual author identity. It writes a draft with source snapshots and a content/evidence digest. `synthesis review` binds a separate invocation's factual and semantic assessments to that exact digest. `status` and `verify` inspect integrity and staleness; completion requires supported material, accurate coverage and adequate usefulness, with known gaps still permitted. Changed evidence or dossier content invalidates the review.

The former `research` queue and manual commands remain available for existing projects. They are compatibility paths, not the new workflow's execution engine. Schema-2 output must not masquerade as the old schema-1 facts export or overwrite an existing legacy project. Consumers must explicitly support the new contract; report/brief Markdown remains the simplest integration.

## Evidence and synthesis

Sources retain origin, publisher, source/version dates when known, selected/public permission and capture limitations. Save sufficient surrounding text to inspect meaning; label partial captures honestly. Facts cite exact quotations and name their actual authors. Findings distinguish direct summaries, inferences and conditional recommendations, with supporting and contrary evidence, conditions and gaps. Avoid publisher-count or recency heuristics presented as calibrated confidence.

The independent reviewer reads original sources and their context, checks facts, then checks findings and prose for unsupported relationships, omitted counter-evidence and applicability. A changed role label in the same invocation is not independence. If independent review is unavailable, save the draft and explain the limitation. Do not fabricate attestation to pass a validator.

Comparisons align by named criterion, with explicit subject cells and unknowns. A completed follow-up must not remain an active gap; a resolved technical detail does not resolve a missing application requirement. Evidence traces remain accessible without dominating the narrative.

## Progressive disclosure

Discovery contains only a concise capability description. The installed bootstrap resolves and reports a compatible runtime/guidance identity. The skill entry contains shared invariants and routes by task. Investigation guidance loads when gathering evidence; synthesis guidance when organizing it; the data contract only when saving; review guidance only for a checker; reuse guidance only for later work. Legacy instructions load only for an existing legacy run. Do not read every reference as a startup ritual.

## Outputs and first use

Save `research/report.md` by default, plus a concise `brief.md`, an `evidence.md` audit view, schema-2 `facts.json`, and `output.json` identifying the committed artifact set. The reader sees conclusions, explanations and actionable limitations before detailed methodology. The helper refuses unowned files and conflicting output owners.

The README begins with a colorful project illustration, describes the result in plain language, gives truthful preview setup and a first prompt, shows the artifacts and links deeper guides. Developer JSON is absent from the first-use path. Users do not have to request citations or saving explicitly.

## Acceptance

- Run meaningful validator, review, staleness, output ownership, path and installer tests; retain legacy compatibility checks.
- Verify stage-specific instruction loading and installed package links.
- Run the appropriate complete local CI suite on the integrated tree, recording environment and cleanup.
- Conduct a fresh Valkey/Redis investigation through the new skill, focused on Redis replacement where warranted; distinguish versions, licenses, modules, managed offerings, compatibility, operations, migration and rollback. Do not presume a universal winner or equate self-managed engine migration with managed-service parity.
- Independently inspect original evidence and review the actual saved synthesis. Preserve limitations and remediation history. The example is research, not a migration, performance benchmark, legal opinion or production deployment.

No installation into the user's active skill directories, publication, PR, merge or release is included in this implementation request.
