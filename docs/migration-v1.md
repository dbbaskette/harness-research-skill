# Moving from 0.9 research to synthesis-first research

[README](../README.md) · [Setup](setup.md) · [Architecture](architecture.md)

The 1.0 preview changes the default workflow and structured output. It does not
silently upgrade existing projects or rewrite installed skills. Keep 0.9 projects
and their pinned runtime/guidance intact while evaluating the preview in a fresh
content folder.

| Concern | 0.9 queue | 1.0 synthesis |
| --- | --- | --- |
| Organization | Sections, questions and answers | Reader purpose, findings and narrative sections |
| Execution | Leased research/check/write tasks | Agent-led investigation and a saved dossier |
| Helper | `research …` | `synthesis …` |
| Structured export | `facts.json` schema 1 | `facts.json` schema 2 |
| Review | Independent fact checks; prose review varies by depth | Independent evidence and semantic review before completion |
| Comparison | Section fact columns | Explicit criteria with a cell for each named subject |
| Main outputs | Report, facts, fact brief and plan | Report, findings brief, evidence view and structured dossier export |

## Existing projects

Resume them with the original runtime and saved guidance. The old CLI remains
available in this checkout for compatibility tests, but adopting new instructions
is not ordinary resume. The new helper refuses an old engine's project and
existing unowned outputs rather than overwriting them.

To research the same subject in the new format, use a new case folder. You may
select the original sources as inputs, preserving their source boundary and
capture limitations. Do not count an old generated report as independent primary
evidence. Reused material needs an honest review of its applicability and currency.

## Consumer integrations

Markdown consumers can start with `report.md` and `brief.md`, following evidence
links for material assertions. Preserve the distinction between facts and
interpretations through natural qualifications and the typed evidence trail;
conditions and unknowns must survive each transformation.

Structured readers must inspect the owner and schema. Schema 2 is not a renamed
schema 1, and legacy question IDs are not automatically finding IDs. The old
`.harness-research/research.json` projection is not generated for a new dossier.
Training Studio's legacy-record adapter therefore needs deliberate migration;
existing old-format runs continue to work as before. Blog and presentation
workflows must likewise explicitly choose the new input contract rather than
assuming every installed consumer already supports it.

Pass the actual studio task in the new dossier's free-text `purpose`, with
`audience`, `scope` and `source_mode` preserved separately. Do not put this task in
a legacy plan's `purpose`: callers may restrict that field to `planning` or
`fact-check`. See the [task handoff](../references/studio-handoff.md). Current
studio adapters still use that legacy contract and require migration.

Dossiers may include authored `brief` sections. Their prose is independently
reviewed with IDs `brief:SECTION_ID:INDEX`; old dossiers without that field keep
the generated finding view. Structured exports use `brief: null` for that absence.
Do not copy that null into an authored dossier: omit `brief` or provide nonempty
sections. A consumer must not treat the brief as a complete evidence inventory.

A schema-2 adapter should:

1. Match `facts.json` to `output.json` by digest and artifact hashes.
2. Check status, review and source limitations rather than treating any readable
   report as checked.
3. Resolve finding references to the underlying facts and source passages.
4. Keep direct facts distinct from inferences and conditional recommendations.
5. Preserve the source captures when copying the research folder, and preserve
   the full project state if it must later be continued with the helper.

## Deliberate differences

The new helper has save/review/status/verify commands. It does not pretend to
support every old queue operation under a new name: automatic web refresh,
question reassessment, approval history and old fact-key lookup stay part of the
legacy interface. The new skill performs source refresh through the host's tools,
revises the dossier and obtains a new content-bound review. Local verify establishes
saved integrity, not live currency.

Narrowing an assertion requires a new assertion identity in the authored dossier;
a stable key must not silently change meaning. The new workflow's digest identifies
the whole reviewed result. Consumers should pin that digest as well as the IDs.
