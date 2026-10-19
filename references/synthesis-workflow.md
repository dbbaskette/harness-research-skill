# Document-first research workflow

Read this as coordinator for new research. The skill investigates and writes;
the helper persists a dossier, checks references and emits a reviewed artifact
bundle. Stage guides load only when the corresponding work begins.

## Start with the user’s intent

Honor the supplied topic, reader, intended use and source permissions. Infer
ordinary details and note the assumption. A migration focus is a hypothesis to
test, not a conclusion to prove. Preserve a brief working `research/plan.md`; its
notes are outside the checked output manifest. For broad unresolved scope, settle
the consequential boundary before deep investigation. Do not add a new approval
gate to already authorized scope.

Accept purpose naturally, such as “help us choose,” “background for a blog,” or
“teach engineers new to the topic,” and save it in `purpose`. A studio can pass
its actual task here, including the intended reader and what the content should
help them do. Preserve multiple uses and any primary task; otherwise write one
useful general brief. When no intended use or studio task is supplied, use
`General-purpose topic research`. The helper normalizes omitted, null or blank
`purpose` to that value; explicit nonempty purposes are preserved. No purpose
intake is required. Purpose guides investigation, explanation and the report/brief
shape. It does not authorize
creating the downstream presentation, article or course. When coordinating with
a studio, read [studio handoff](studio-handoff.md) for the request and return
contract; ordinary standalone research does not need that reference.

Use the installed runtime returned by bootstrap. Report its actual version and
guidance revision/freshness, including when using a local development build. Do not
execute downloaded guidance as a substitute runtime. This development workflow requires runtime
1.0.1-alpha.1 or newer; continue old runs with their saved guidance rather than changing
formats silently. Keep one active output bundle per project; use a separate case
directory for a comparison experiment or when preserving another report.

Save a draft early, continue through investigation and writing, and finish by
checking the saved revision. These commands use files relative to `--project`:

```sh
node "<runtime>/scripts/harness-research.mjs" synthesis save --project DIR --file research/dossier.json --worker AUTHOR
node "<runtime>/scripts/harness-research.mjs" synthesis status --project DIR --compact
node "<runtime>/scripts/harness-research.mjs" synthesis template --project DIR --out research/review.json
node "<runtime>/scripts/harness-research.mjs" synthesis review --project DIR --file research/review.json --worker CHECKER
node "<runtime>/scripts/harness-research.mjs" synthesis verify --project DIR --compact
```

`AUTHOR` and `CHECKER` identify actual invocations. Use a stable lowercase label
with digits/hyphens, at most 64 characters, for each invocation. If the host gives
a path-like ID, map it to a valid label and record that mapping in the working note.
Changing the ID does not make the same context an independent checker. The
helper does not launch agents. Delegate only with authorization; an independent
invocation may run sequentially. If none is available, keep the draft and explain
that review is incomplete.

## Coordinate the work, not a question queue

1. Read [investigate](investigate.md), or give it to the investigator. Collect
   inspectable evidence, counterevidence and useful leads within the chosen budget.
2. Read [synthesize](synthesize.md), or give it to the author. Produce findings and
   connected prose for the reader; internal questions need not appear in output.
3. Save the dossier. Its report is a draft until reviewed. Ask a separate invocation
   to read [review synthesis](review-synthesis.md), the generated review template,
   source captures, facts, findings and actual report. One independent invocation
   can perform both factual and semantic review; they remain distinct judgments.
4. Address objections by revising evidence or prose and saving again. Saving a
   changed dossier invalidates the previous review. After two unsuccessful
   correction cycles, preserve the draft, name unresolved objections and stop
   expanding the task. Do not relabel unsupported work as complete.
5. Read status, verify the bundle and inspect `research/report.md`. Return that
   file with its actual state and important limitations before downstream authoring.

The report leads with the answer; metadata and evidence remain accessible.
`brief.md` presents an authored, prioritized handoff shaped to the intended use,
with useful evidence, counterarguments and must-retain qualifications. Dossiers
without authored brief sections retain the automatic findings view;
`evidence.md` exposes facts, quotes, sources, full finding implications/conditions/gaps and review. `facts.json` is schema 2;
`output.json` pins generated files to the saved digest. A matching manifest proves
file integrity, not factual truth. `plan.md`, input JSON and ancillary notes are
working material, not automatically checked bundle members.

## Dossier contract

Write JSON yourself; users should not have to prepare it. `synthesis help` lists
commands; [the schema](synthesis.schema.json) defines the dossier and review objects.
Source files must remain inside the project. IDs are unique,
lowercase identifiers with hyphens. Preserve IDs across revisions when meaning is
unchanged; change an ID when it would otherwise point to a different assertion.
Source, fact and finding IDs share one namespace; prefixes such as `src-`, `fact-`
and `finding-` avoid collisions. `status --compact` returns state, counts, digest and integrity problems without
repeating source records or the full template. `template` prints the pending
review object; `template --out research/review.json` creates it without overwriting
an existing file. Omit `--compact` for the compatible full response. Use
`validate --project DIR --file research/dossier.json --worker AUTHOR` to check
fields, references and quotes without creating state or changing a saved review.

Top-level fields:

| Field | Contents |
| --- | --- |
| `schema` | `2` |
| `topic`, `audience`, `scope` | Plain-language strings describing this investigation |
| `purpose` | Optional intended use; defaults to `General-purpose topic research` |
| `source_mode` | `public`, `selected`, or `mixed`, matching actual permission |
| `sources` | Source records described below |
| `facts` | Small factual assertions with exact supporting quotes |
| `findings` | Meaningful themes or conclusions built on those facts |
| `sections` | Ordered report sections with connected prose blocks |
| `brief` | Optional nonempty array of authored brief sections, using the same section shape |
| `comparisons` | Optional explicitly aligned comparison tables |

A source: `{id, file, origin, title, publisher, permission, context}`. `permission`
is `public` or `selected`; `context` is `full` or `partial`. Partial context needs
`context_note`. Retain `source_date`, `accessed_at` and `version` when known.
`file` is a faithful readable capture under the project; `origin` identifies the
public URL or supplied document. Save originals/extractions as described in
[investigation](investigate.md). The helper computes hashes; never fabricate them.
For an extraction of a supplied PDF, Office document or other local original,
include `original_file` with its project-relative path. The helper pins its bytes
separately and invalidates review if either original or readable capture changes.
An existing local `origin` distinct from `file` requires that explicit original pin.
For an original outside the project, copy its exact bytes into the project and
set `original_file` to that copy, preserving `origin`. When the external original
is available, save/validate checks that the copy matches; subsequent integrity
checks monitor the project-local original and snapshot, not the external path.

A fact: `{id, statement, author, citations: [{source, quote}]}`. `source` references
a source ID; `quote` is exact captured text. `author` is the actual investigator
invocation. Multiple citations can support one assertion. Quotations must carry
all material qualifications, not merely share its keywords.

A finding: `{id, title, summary, support, counter, implications, conditions, gaps}`.
`support` and `counter` are fact-ID arrays. `summary` is a typed block; implications,
conditions and gaps are arrays of typed blocks. Empty arrays are valid when
appropriate. Every material finding must be supported; preserve counterfacts when
they limit its conclusion. Explain material counterfacts in a referenced condition
or implication block, and retain concrete constraints needed to reuse the finding
accurately. Authored brief sections can cite these reviewed findings; an omitted
`brief` uses the automatic findings view.

A typed block: `{text, refs, kind}`. `refs` cites fact IDs (and in report or brief
sections, finding IDs). `kind` is `summary`, `inference`, `recommendation` or `gap`. Finding
summaries use the first three. A genuine gap may have no references. Classifying
text as inference does not exempt it from evidential support.

A section: `{id, title, blocks: [typedBlock]}`. Blocks may contain coherent
multi-sentence prose. There is no required number of sections or questions.
Optional `brief` sections use this same shape and must contain substantive
blocks; an empty array is invalid. Use their titles and order for editorial
prioritization. The author, not a keyword parser, adapts the format to `purpose`.
Report and brief prose express inference, advice and limits naturally; `kind`
remains explicit in structured data and the evidence trail.

A comparison: `{title, subjects, rows: [{criterion, cells: [{subject, text, refs}]}]}`.
Give each row a named criterion and each subject an explicit cell. Reference fact
IDs supporting each cell. Do not zip unrelated findings into matching positions.
Missing evidence must remain visible rather than inferred capability absence.
Because comparison cells require factual references, use a separate `gap` block
for an unresearched criterion instead of fabricating support to fill its table.

## Minimal initial draft

This saves scope while investigation is pending. It is intentionally incomplete;
it cannot become a useful reviewed report merely by passing file-integrity checks.
Replace it with substantive evidence and writing as work proceeds.

```json
{
  "schema": 2,
  "topic": "Valkey and Redis",
  "audience": "Application and platform engineers",
  "purpose": "Assess where replacing Redis with Valkey is appropriate",
  "scope": "Workload suitability, compatibility, migration and operational tradeoffs",
  "source_mode": "public",
  "sources": [],
  "facts": [],
  "findings": [],
  "sections": [{
    "id": "pending",
    "title": "Research in progress",
    "blocks": [{"text": "Evidence collection and independent review are pending.", "refs": [], "kind": "gap"}]
  }]
}
```

## Completion and limitations

`draft` awaits review; `needs-revision` has unresolved review objections; `stale`
means source bytes no longer match. `complete` means the independent saved review
accepted this digest’s evidence, synthesis, coverage and usefulness. It does not
mean every question is answered: accurately bounded gaps and partial source
context remain visible. A helper can validate review records but cannot prove a
reviewer’s honesty or the truth of a source.

`verify` also reports artifact integrity separately. `failed` means a pinned
capture or original is missing/altered; regenerating Markdown cannot fix it.
`repaired` identifies regenerated derived files; `verified` means the saved files
match, not that websites were fetched again. Every replaced output's previous bytes are preserved under
`.harness-research/output-backups/`; `preserved_files` maps outputs to backups.
This also preserves normal render transitions. Recover editorial changes into the
dossier and save/review them; copying a backup over a generated report does not
make those changes reviewed. Previous dossier and review states remain in
`.harness-research/synthesis-history/`.

CLI exit 0 means the command succeeded, not that independent review is complete.
An intact draft and an intact `needs-revision` result exit 0 on status/verify.
Stale evidence or failed artifact integrity exits 1. Submitting a rejected review
also exits 1 while saving its objections. Accepted review and completed verified
output exit 0. Invalid input/command failures exit 1. Read JSON `status` alongside
the exit code when completion is required.

When network access, source access or review is blocked, save what is known with
explicit limits. Do not claim live currency from a cached source hash. For later
resume, changed sources or reuse, read [synthesis reuse](synthesis-reuse.md).
