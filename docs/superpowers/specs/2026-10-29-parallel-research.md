# Bounded parallel investigation in Harness Research

Status: approved for implementation by the user on 2026-10-29.
Local implementation and disposable verification are authorized; publication and
active installation are separate. Studio integration retains its own delivery milestone.

Plan: [implementation plan](../plans/2026-10-29-parallel-research.md).
Origin: Marketing Studio's proposal at
`docs/superpowers/specs/2026-10-29-parallel-research.md`.

## Outcome and ownership

Make substantial research faster to collect without weakening source permissions,
quotation checks, truthful investigator attribution or independent review. The same
skill should work directly in a supported agent and when called by a content studio.
It must still deliver a coherent saved report and brief, rather than turning
workstream questions into the public report structure.

Harness Research owns the research method and portable evidence contract. The
agent or calling studio supplies execution capabilities. The helper validates and
preserves local records; it does not become a model service, process supervisor or
cross-harness execution bridge.

| Responsibility | Owner |
| --- | --- |
| Scope decomposition, investigation instructions, evidence packets, merge rules, synthesis and review | Harness Research |
| Native subagent creation, actual invocation identities, available tools and concurrency | Host harness, or the studio's configured execution adapter |
| Packet validation, identity registry, source hashes and deterministic assembly | Harness Research helper |
| Provider access, monetary accounting, process cancellation and application scheduling | Host or calling studio |
| Studio task, approved questions, audience and source restrictions | Calling studio, passed to research without another intake |
| Local research asset creation and verified relative-path handoff | Harness Research, standalone or called by a studio |
| Shared repository selection, synchronization, conflicts and sharing policy | Calling studio; not required for standalone research |
| Training progress UI, interval accounting and pause/stop/retry controls | Marketing Studio shared core and Training Studio |

This replaces the earlier proposal to implement research packet semantics in
Marketing Studio's Python shared core. Studios consume this contract rather than
maintaining another implementation of source merging and investigator validation.
The existing schema-2 report/brief return contract remains the studio handoff.

## Current evidence

The current `references/synthesis-workflow.md` describes investigation, synthesis
and independent review, with optional delegation. It does not prescribe a portable
parallel collection protocol. `scripts/lib/synthesis-model.mjs` already accepts
distinct fact authors and rejects a reviewer matching the save worker or any fact
author. It validates exact quotations but trusts the host's claimed identities;
those checks cannot prove that an invocation actually ran.

Marketing Studio's `core/studio_core/research_contract.py:Workflow.run` currently
alternates a complete author job with a reviewer job. It issues the identities and
requires every fact to name that single author. Training Studio's legacy executor
has `AT_ONCE = 3`, but the schema-2 path does not use it. Merely increasing studio
capacity would not implement parallel investigation within one report.

## Select execution proportionately

The coordinator uses bounded parallel collection when the scope contains useful,
independent workstreams and the host permits separate investigators. Default to
at most three concurrent investigators, further limited by available capacity and
the caller's configured limits. Use fewer when appropriate. Reserve capacity or
budget for synthesis and review; never increase configured limits automatically.

Reuse approved studio planning questions and purpose. Standalone research uses its
settled brief and ordinary working plan; it does not require a question form, a
new planning model call or approval of routine decomposition. With no purpose,
retain the existing general-purpose topic research default. Workstreams are
bounded themes, not one job for each question.

A narrow request may use the existing combined investigator/author path. If
parallel capabilities are absent or restricted, investigate sequentially and
record the actual mode. Sequential investigation does not satisfy independent
review: a different invocation must still review the final saved dossier. Without
one, save a clearly labeled draft and explain the limitation.

## Skill-led coordination

1. The coordinator records the task, permissions, limits, execution protocol,
   generation and workstream assignments. Each investigator receives the overall
   purpose, its bounded assignment, relevant supplied material and the investigation
   reference. It does not load unrelated stages or the whole skill library.
2. The host launches distinct invocations with isolated working directories. The
   coordinator binds the actual invocation to a registered lowercase worker label
   within the helper's 64-character limit. Registration records host provenance;
   arbitrary labels returned by a worker cannot register themselves.
3. Investigators return evidence packets with captured bytes, exact quotes,
   limitations, contrary evidence and unresolved leads. Packets are intermediate
   evidence, never approved reports. Workers do not write shared case state.
4. One coordinator accepts valid packets and checkpoints them as they arrive. It
   assembles one immutable evidence registry and gives it to the synthesis author.
   The coordinator may also author the synthesis; a dedicated extra author job is
   optional. Authoring does not confer reviewer independence.
5. The author writes connected findings, report sections and a purpose-shaped
   brief. Save through the existing synthesis helper. A separate reviewer inspects
   the final dossier, source context, facts and authored prose and submits a review
   for the exact final digest.
6. Route objections to affected investigation or synthesis work. Reuse unchanged,
   valid evidence. Every changed final dossier needs a complete independent review
   again; partial packet acceptance cannot carry forward final approval. Preserve
   the current bounded correction policy and return a draft with unresolved limits
   when it is exhausted.

Optional progressive references will describe coordination, worker packets and
Codex/Claude Code adapters. Adapters use capabilities actually exposed by the host;
they must not invent tool names, enable disabled delegation, shell-launch another
provider or require new credentials. Initial portability means running the skill
inside either harness, not coordinating both harnesses simultaneously.

## Evidence packet and registry boundary

Use a versioned collection sidecar separate from the existing schema-2 dossier.
Its execution record contains the normalized request fingerprint, generation,
workstreams, registered invocations and accepted packet hashes. The fingerprint
covers topic, audience, normalized purpose, scope/exclusions, source policy,
relevant supplied-source identities/hashes and the workstream assignments.

A packet contains its format version, request fingerprint, generation, workstream,
attempt, registered investigator, sources, facts, limitations and gaps. Source and
fact records retain the existing dossier meanings. Findings and final report prose
belong to synthesis. Each source includes captured bytes or confined local paths
and hashes; original documents and readable extractions remain distinct objects.
Selected-source membership and site/domain restrictions come from the coordinator's
policy and capture receipts, not from a worker's permission label.

Local helper operations support collection initialization, invocation registration,
packet validation/acceptance, registry assembly and status. They do not dispatch
agents. Validation and atomic writes reuse the existing storage protections and
source/fact checks. A failed acceptance leaves the previous valid registry intact.

- Accept only the current assigned workstream/attempt and registered investigator.
  Every fact must name that actual author; the synthesis author cannot relabel it.
- Namespace source/fact IDs deterministically from workstream and local ID using
  bounded identifiers. Record the mapping, check collisions, and rewrite only
  declared identifier/reference fields such as `citations[].source`. Never replace
  words in quotations, claims or prose to fix a collision.
- Preserve distinct source records by default, including two captures of one URL.
  Equal URLs or equal text alone cannot justify merging permissions, provenance,
  versions or originals. Physical content-addressed snapshot reuse is allowed when
  the existing storage checks pass; it does not merge logical source identity.
- Preserve conflicting facts. Assembly validates structure and provenance; it
  cannot decide which contradictory assertion is true. Synthesis explains material
  disagreement and independent review checks that explanation.
- The synthesis input pins the accepted registry. Before final save, verify its
  sources and facts remain unchanged except for declared ID/path normalization.
  New or corrected facts must go through a registered investigation acceptance,
  including a genuine follow-up performed by the coordinator if permitted.
- Bind assembly provenance to the final dossier digest in the sidecar and preserve
  it with resumable state. Existing final facts and review retain their actual
  authors. A copied output bundle without collection state remains inspectable;
  it is not sufficient to resume packet collection.

Source permissions, confined regular paths, original hashes and exact quotations
remain hard validation boundaries. Neither a packet nor the registry can turn
source matching into factual certification or prove invocation independence.

## Limits, recovery and progress

Retain successful immutable packet checkpoints. Retry missing, refused or invalid
workstreams with a new attempt identity; accept completions only for the current
generation and attempt. An invalidated generation cannot publish through a late
completion. Crash recovery rechecks request, permissions, invocation record and
captured hashes before reuse. Files alone do not establish an accepted checkpoint.

Changed task or permission inputs create an explicit generation change. Prior
packets are not silently adopted under a new fingerprint. Reuse requires explicit
revalidation against the new assignment/policy and unchanged bytes, recorded as a
new acceptance. Scope reduction must not leak now-disallowed evidence into output.

Pause stops new dispatch and allows safe checkpoints. Stop requests cancellation
through the host's supported execution control. The helper invalidates outstanding
attempts so late results cannot be adopted. Where cancellation is unavailable,
disclose that workers may remain in flight and refuse their late results; do not
claim that they stopped or kill unrelated processes.

The host/studio owns atomic budget reservations and reliable provider accounting.
Allocate collection from one shared allowance while reserving synthesis/review.
Unknown dollar cost stays unknown; do not promise a hard monetary ceiling without
an enforceable host mechanism. Parallel work may increase total tokens while
reducing collection wall time.

Expose phases and workstream states: investigating, combining findings, independent
check and ready for review, plus failed/stopped/retry details. Record execution mode
and meaningful timestamps; never invent a percentage or ETA. For consumers that
display timing, active wall time is the union of actual worker intervals; assistant
time is their sum. Waiting or stopped time requires supporting records rather than
assuming every gap was a pause. UI implementation stays with the studios.

## Compatibility and rollout

Keep schema-2 report outputs and existing serial runs readable. Record execution
protocol separately from pinned guidance/runtime and output schema. Existing runs
continue their saved protocol; no active work is migrated or restarted.

Deliver the Harness Research skill, helper contract and native adapters first.
Marketing Studio can then integrate the contract into shared core and enable it
explicitly for new Training Studio runs. Presentation Studio and Blog Studio stay
on their current mode until separately enabled and verified. No automatic companion
installation, provider change, budget increase or application restart is included.

## Acceptance and scope limits

- Controlled workers/barriers prove actual overlap and the concurrency bound;
  matched serial/parallel fixtures report collection and end-to-end time separately.
- Real helper tests cover multi-investigator authors, quote mismatches, source
  permissions, original/extraction hashes, bounded IDs and reference remapping.
  Reviewer identity must differ from the final author and every investigator.
- Exercise conflicting captures, identical URLs with different permissions,
  fabricated identities, path traversal/symlinks, duplicate and stale completions,
  retries, hash changes, crash recovery and interruption during registry writes.
- Test serial fallback, independent-review refusal, unchanged legacy resume and
  installation/guidance compatibility. Progressive loading must remain measurable.
- Studio acceptance separately covers budget reservations, process cancellation,
  generation guards, overlapping interval accounting and usable pause/stop/retry UI.
- One integration owner runs the applicable full native suite in the existing
  disposable Tart infrastructure. No personal state, provider jobs or credentials
  are used by scripted tests. Retain source hashes/logs and remove owned VMs.

A separately authorized live comparison may establish provider behavior and output
quality. Synthetic fixtures cannot establish cross-harness quality or a threefold
speedup. Synthesis, independent review and unequal workstreams remain on the
critical path. Publishing, release, installation and studio deployment remain
separate from approval to implement this design.

## Shared topic assets — 2026-10-29 refinement

Research is a reusable project asset, including when it begins inside a studio.
The skill must work on its own without a studio, shared repository, library,
synchronization service or Git. For standalone use, default to
`research/<topic-slug>/` under the current working directory, unless the person
specifies another local destination. A studio supplies its chosen local asset
destination; the skill honors that path without discovering or selecting the
studio's shared repository. Use a short descriptive folder name and a stable
asset ID in metadata. Do not adopt an unrelated parent directory or overwrite an
existing topic. This layout is useful with serial research as well as parallel
collection. Being inside a Git checkout does not change the skill's local-only
storage contract.

```text
research/
  valkey-vs-redis/
    topic.json          # identity, title, description, tags and revision links
    report.md           # the skill's main cited research output
    brief.md            # prioritized, purpose-shaped handoff
    evidence.md         # quotations, provenance and independent review
    facts.json          # existing schema-2 structured research
    output.json         # artifact manifest and actual review status/digest
    sources.json        # supplied/discovered sources and access/use outcomes
    documents/          # retained supplied originals
    sources/            # readable captures and immutable evidence snapshots
    .harness-research/  # owned resume, collection and revision state
```

`topic.json` contains the stable ID, title, short topic description, searchable
tags, creation/update dates and current output revision. The report is the
substantive research summary; a second independently authored summary is not
required. Tags are editable discovery metadata, not evidence. Read review state,
scope, permissions and evidence dates from the pinned output revision rather than
maintaining conflicting manual copies. A tag edit does not claim a new review.

`sources.json` records supplied documents and URLs before investigation, then adds
discovered sources and observed search/retrieval outcomes. Entries retain original
origin, supplied/discovered role, permission, known title/type, access outcome,
local original/capture paths and hashes where available, and final evidence source
IDs if used. Keep supplied URLs even when inaccessible, excluded, redundant or not
cited. Preserve the original and redirected URL where known. Inventory membership
does not mean a page was read or supported a claim. Record search queries/results
only where the host exposes them; do not invent an exhaustive search history.

Supplied originals belong in `documents/` with exact bytes, original names and
hashes recorded; use collision-safe confined local filenames. Readable extractions
go in `sources/` and remain bound to their originals. Preserve the person's input
files. Remote document reading/conversion depends on actual host capabilities;
missing access remains explicit. Existing source modes remain: selected references
only, public research, or permitted mixed use. Opening a supplied URL does not
authorize searching beyond the selected set.

The skill creates and validates ordinary local files and returns the asset path,
identity, reviewed digest, actual status and relative-path artifact manifest.
It does not initialize or choose a repository, stage/commit/push, pull, synchronize,
resolve remote conflicts or change sharing permissions/ignore rules. The studio
owns its shared repository and decides which permitted asset files to synchronize,
when to do so and how to handle sync failures. Local research completion and
successful synchronization are distinct states: a sync failure does not require
rerunning research or fabricating a different review status.

Standalone users receive the same local asset and can use their own storage or
version-control workflow separately. Keep credentials and private runtime/process
logs outside the public artifact manifest. Local file creation grants no authority
to share supplied documents. A central studio library may supply selected documents;
local evidence snapshots remain self-contained and portable.

### Simple source intake

Prefer one explicitly supplied input directory over one argument per document or
URL. Accept an optional explicitly supplied URL-list file, including one outside
that directory. Individual file and URL references in ordinary user requests remain
valid; batch intake is a convenience, not a required preparation step.

```text
inputs/valkey-vs-redis/
  documents/
    architecture.pdf
    requirements.md
  urls.txt
```

The caller supplies the directory path and may name another URL-list path. When
the directory contains `urls.txt`, recognize it as the URL list rather than as a
research document. Use UTF-8 plain text, one HTTP(S) URL per nonblank line, with
optional comment lines starting with `#`. Validate the list, report malformed
lines by location and keep the original list as intake provenance. Do not require
JSON or one CLI option for every source. Keep repeated/redirected URL provenance
without making duplicate retrieval mandatory. Never request URLs with embedded
credentials or treat list comments as executable instructions.

Enumerate supported source files within the explicitly selected directory using
bounded recursive intake. Do not follow escaping symlinks, scan unrelated parent
folders, or ingest Git/runtime state and generated research outputs as new inputs.
Use a separate input directory when possible. If input and output locations
overlap, exclude the owned output/state subtree before enumeration or refuse an
ambiguous layout; never recursively consume the report being generated. Report
unsupported, oversized or unreadable files rather than silently losing them.

Snapshot the selected file inventory and URL list before dispatch, including
project-relative names and byte hashes. Input changes invalidate dependent work
through the collection fingerprint. Populate `sources.json` with all supplied
entries, retaining rejected/inaccessible outcomes and only promoting actual
validated captures into evidence. Originals remain preserved separately from
extractions. Native attachment paths may be materialized by a studio into this
same local input layout; no central-library dependency is introduced.

Source permissions remain a separate brief/caller setting. Directory/list intake
does not grant public searching, convert selected material into public material,
or grant sharing authority. Read selected URLs as supplied references; supplement
them only when additional research is permitted. Topic, audience and purpose
remain ordinary-language inputs, with the existing general-purpose default.

Studios reference the asset ID, location and reviewed digest instead of maintaining
independent authoritative copies. Preserve scope and qualifications during reuse.
Reuse does not silently refresh sources or turn a purpose-specific recommendation
into a general conclusion. Preserve prior reviewed revisions on updates; consumers
stay pinned until explicitly adopting a new revision. Purpose-specific changes
needing evidence/prose review create a new reviewed revision or identified variant.

The current helper always places outputs under `<project>/research/` and maintains
one dossier per project. Add an explicit topic-asset destination mode supporting
the illustrated topic-root bundle and per-topic state. Do not move generated
outputs manually and break relative references or hashes. Existing project paths,
schema-2 outputs and resumes remain compatible. Metadata-based discovery is local
and on demand, without automatically consolidating unrelated research folders.

Acceptance adds standalone use in a non-Git temporary directory without studio
configuration, a caller-specified local destination with no Git/sync calls, and a
studio sync failure that preserves the completed local result. It also covers
two topics in one workspace with isolated state, metadata/source
inventory round trips, all supplied URLs retained (including failures/noncitations),
original/capture fidelity, folder collisions, digest-pinned reuse, revision
preservation, confined destinations and unchanged legacy resumes. Only captured,
validated and independently reviewed evidence can support a completed report.
