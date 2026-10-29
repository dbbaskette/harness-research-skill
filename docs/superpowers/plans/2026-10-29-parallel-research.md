# Bounded parallel investigation: implementation plan

Status: implementation approved by the user on 2026-10-29, together with the
[specification](../specs/2026-10-29-parallel-research.md).

The skill remains the coordinator's research method. Implement portable evidence
operations in Harness Research, native execution through the host, and downstream
studio integration against that contract. Do not implement a provider scheduler
inside the helper or migrate running research.

## 0. Establish standalone local topic assets and caller destinations

Owner: Harness Research implementer. Contract: the specification's shared topic
assets refinement. This is independently useful with serial research and should
not require parallel collection to create or reuse an asset.

Add an explicit asset/destination mode writing a topic-root bundle under
`research/<topic-slug>/` in the standalone user's current working directory, or
at an explicit local destination supplied by the person or calling studio. Require
no studio, Git, shared repository, central library or sync service. Do not discover
a parent repository or choose a studio's storage location. Keep per-topic owned
state and preserve the current
`<project>/research/` output/resume path for existing cases. Inspect hard-coded
output/source protection paths in `scripts/lib/synthesis-cli.mjs`,
`synthesis-model.mjs` and `synthesis-output.mjs`; do not relocate generated bundles
after saving. Finalize the additive CLI/API destination contract in task 1.

Implement `topic.json` with stable identity/tags and `sources.json` with
supplied/discovered provenance and access/use outcomes. Retain supplied originals
under `documents/` and readable captures under `sources/`. Preserve every supplied
URL, including inaccessible or unused inputs, without treating the input inventory
as a reviewed citation list. Retain only search observations exposed by the host.
Keep discovery metadata separate from reviewed factual assertions.

Add batch intake from an explicitly selected source directory and optional UTF-8
URL-list file. Recognize `urls.txt` in the selected directory; accept one HTTP(S)
URL per nonblank line and `#` comment lines. Preserve ordinary individual file/URL
inputs. Enumerate supported files within the selected root with bounded recursion,
safe paths and explicit unsupported/unreadable outcomes; exclude owned output,
Git and runtime state. Snapshot the file inventory and URL-list bytes before
dispatch and include their identities/hashes in the request fingerprint. Keep
the original list and supplied-entry outcomes in intake provenance/source inventory.
Do not add one required parameter per source or require users to author JSON.

Bind report revisions and consumer references to exact digests; preserve history
and explicit downstream adoption. Tags can change without claiming evidence review.
Return asset identity/path, actual status, digest and relative artifact paths.
Do not implement automatic library selection, Git operations, synchronization,
remote conflict resolution, a crawler or a second central document store. Studios
own shared-repository policy and sync. Local completion must remain usable when
the studio's separate sync step fails.

Verification owner: implementer. Use disposable workspace fixtures for
two isolated topics, default/explicit destinations, title/slug collisions, tags,
failed/redirected supplied URLs, original/extraction hashes, missing access,
confined paths, revision-pinned reuse and existing layout compatibility. Creating
an asset must not invoke Git/sync or broaden source/sharing permission. Include a
non-Git standalone directory with no studio configuration, an explicit studio
destination and failed downstream sync after successful local completion.
Test directory/list combinations, comments/blank lines, repeated and malformed
URLs, credential-bearing URLs, nested files, escaping symlinks, output/input
overlap and changed directory membership/list bytes. Unsupported documents and
failed URLs stay visible, and batch intake cannot broaden source permissions.

## 1. Freeze the portable collection contract

Owner: Harness Research implementer. Inspect `scripts/lib/synthesis-model.mjs`,
`synthesis-cli.mjs`, `run-storage.mjs`, `references/synthesis-workflow.md`,
`studio-handoff.md` and Marketing Studio's
`core/studio_core/research_contract.py` before introducing the boundary.

Resolve task 0's destination interface together with collection state placement,
so serial and parallel work share the same topic asset without another migration.

Define versioned execution/packet records, fingerprint inputs, protocol/generation
and attempt transitions, registered host identities, permission/capture receipts,
registry-to-dossier binding and the helper's local operations. Finalize command
names/flags alongside the JSON schema; these are additive interfaces, not a
replacement for `synthesis save|review|validate|status|verify|template`.

Distinguish reserved, running, accepted, refused, invalidated and cancelled attempts.
Specify which actor can register each transition. A model-returned identity is not
host registration. Preserve the 64-character identifier contract and existing
serial paths. Use isolated work when another process references a checkout.

Deliverables: collection schema, interface notes and disposable representative
fixtures. No new model call or fixed question quota is introduced.

Verification owner: implementer. Review state transitions against late completion,
changed permissions, missing history and non-cancellable hosts before building on
them. Contract review owns these decisions; later tasks implement them.

## 2. Implement packet validation and deterministic assembly

Owner: Harness Research implementer; depends on 1.

Extend `scripts/lib/synthesis-cli.mjs` with the approved additive operations; use
new focused collection/packet modules under `scripts/lib/`. Extract reusable
source/fact validation from `synthesis-model.mjs` only where necessary. Preserve
its current dossier validation, independent reviewer and digest guarantees.

Single-writer acceptance validates fingerprint, active attempt, actual investigator,
permissions, capture/original bytes and quotations before checkpointing. Preserve
accepted packets immutably. Build bounded stable ID mappings, rewrite only declared
reference/path fields and reject collisions or unknown references. Retain distinct
logical sources and contradictory facts. Verify unchanged registry content before
final synthesis save and bind assembly provenance to the resulting digest.

Verification owner: implementer, in focused tests under `tests/`. Cover actual
helper save/review with two investigator identities and a third independent
reviewer, unregistered/relabeled authors, quote mismatch, selected/public/site
boundaries, originals, conflicting captures, bounded IDs, malicious IDs/paths,
permission-distinct copies and prose/quote preservation. These fixtures establish
validation behavior, not real invocation independence.

## 3. Add checkpoint recovery and host-neutral progress

Owner: Harness Research implementer; depends on 2.

Reuse `run-storage.mjs` locking, confined paths and atomic writes. Add generation
and attempt guards, acceptance idempotency, interrupted-write recovery, invalidation
and status for collection records. A corrupt checkpoint is a refusal to reuse,
not permission to erase the previous valid dossier. Keep accepted packet hashes
and registry provenance available for audit/resume.

Expose phase/workstream activity and observed timestamps. Dispatch, budget
reservation and cancellation remain host operations; define the caller callbacks
or event data they need without inventing provider prices or process controls.

Verification owner: implementer. Test duplicate results, late stopped completions,
stale fingerprints, changed captured bytes, concurrent acceptance, process loss,
policy reduction and restart. A retry must reuse only validated unchanged work.

## 4. Teach the skill and native harness adapters

Owner: skill implementer; depends on 1, with executable examples after 2–3.

Update `SKILL.md` and `references/synthesis-workflow.md` with a short optional
coordination route. Add focused parallel-coordinator, investigator-packet and
Codex/Claude Code references. Keep ordinary investigation and serial startup
small. Update `references/investigate.md`, `review-synthesis.md`, `synthesis-reuse.md`
and `studio-handoff.md` only for the changed contracts.

Use native capabilities advertised by the current host. Where delegation requires
authorization, honor it. Standalone investigation can fall back sequentially;
unavailable independent review leaves an honest saved draft. Preserve ordinary
purpose input, general-purpose default, audience and source restrictions.

Verify the actual harness documentation/tool surfaces when writing native adapter
instructions; do not assume a shared tool name or start external CLI agents.
Document that same-skill portability does not provide simultaneous cross-harness
orchestration. Update architecture, user/developer guidance and README with concise
usage and deeper links; refresh `tools/context-usage.mjs` measurements and generated
context documentation after final guidance edits. Installer payload already includes
references and scripts; verify the new resources are present in an isolated install.

Verification owner: skill implementer. Run controlled coordinator exercises for a
small serial request, broad parallel request, refused delegation, unavailable
review and one failed workstream. Confirm only stage-specific references load and
the saved report remains synthesized prose. Do not describe simulated workers as
live harness acceptance. Live provider runs need separate authorization.

## 5. Adapt Marketing Studio and enable Training Studio separately

Owner: Marketing Studio implementer; depends on the released/capability-pinned
contract from 1–4. This is a consumer integration milestone, not a prerequisite
for using parallel Harness Research directly in a supported agent.

Relevant existing files in that repository:

- `core/studio_core/research_contract.py`, `research_view.py`, `step_times.py`
- `core/studio_core/shared_runner/worker_tools.py`
- `studios/training/runner/engine.py`, `pipeline.py` and `page.py`
- `tests/test_research_contract.py`, `test_research_capture_check.py`
- `studios/training/tests/test_synthesis_integration.py`, `test_runner_engine.py`
- `studios/training/skills/training-studio/scripts/desk/app.js`

Replace the single-author restriction only in the enabled protocol with host-issued
investigator registration and packet acceptance. Do not copy the merger into
Python. Reuse confined capture tools and approved planning questions. Enforce
worker capacity, shared budget reservations, existing process-identity protection,
pause/stop and current-generation completion guards. Persist the execution protocol
separately from companion capability; old runs stay serial.

Pass a local asset destination to Harness Research and consume its verified local
handoff. Keep shared-repository selection, sync, conflict handling and sharing
policy in the studio's existing mechanisms. Record sync outcomes independently of
research status and retry sync without rerunning completed research.

Keep UI work in the studio: phases/workstreams, honest retries and elapsed/active/
assistant time. Use recorded interval union for active wall time and the existing
Golden Gate-inspired components. Presentation Studio and Blog Studio remain on
their current modes until enabled and verified in explicit follow-ups. Do not
update companions, deploy or restart active applications automatically.

Verification owner: Marketing Studio implementer. Use disposable settings,
processes and captured sources to test concurrency bounds, budget exhaustion and
unknown costs, stop/retry/resume, legacy runs and mobile progress controls. Run the
affected studio suite at this milestone; no real provider or account state.

## 6. Integration evidence and completion

Owner: primary integration implementer, the sole final full-suite verification
owner. Depends on 2–4 for the Harness Research deliverable; task 5 has its own
consumer delivery boundary.

Capture a matched serial/concurrent benchmark with barrier-controlled synthetic
workers. Report collection wall time, synthesis/review overhead, end-to-end time,
assistant time, failure/retry counts and unavailable token/cost fields. Test the
assembled result with the real helper and unchanged final review contract.

Run affected checks at coherent milestones, then the relevant full native suite
once using `scripts/ci/tart-macos.sh` and existing shared infrastructure. Include
installer, guidance compatibility, schema-2/legacy regression, context and license
packaging checks. Reuse valid evidence for unchanged source; rerun affected checks
after corrections. Retain exact tested tree hashes/environment/logs and remove
only owned disposable VMs.

Record controlled results separately from any authorized live Codex/Claude Code
comparison. Without both live trials, report the adapter coverage limit plainly.
Do not infer provider speedup from synthetic overlap. Publication, release, active
installation and studio deployment are separate actions from implementation.

## Review focus

- Research remains a portable skill with progressive references, not a new service.
- Host registration cannot be fabricated by investigator or synthesis output.
- Source permissions and original bytes survive assembly and recovery.
- Every factual author remains visible; independent review covers the final digest.
- A stopped, stale or partially validated response cannot publish through recovery.
- One shared allowance is not multiplied across parallel workers.
- Existing serial runs resume unchanged; UI and process ownership stay with studios.

## Completion record

- 2026-10-29: reviewed the Marketing Studio proposal and actual current call sites;
  prepared the Harness Research ownership split and this proposed plan.
- Implementation began after the user approved the combined design and plan.
  Live provider trials, publication and active installation are not part of this run.
- 2026-10-29: added repository-owned topic assets, tags, supplied/discovered source
  inventory and retained documents to the proposed scope; confirmed selected URLs
  and documents are already supported by the current skill.
- 2026-10-29: clarified standalone local operation as a requirement. Studios may
  supply a local destination and own all shared-repository synchronization; the
  skill requires neither a studio nor Git and returns the same portable asset.
- 2026-10-29: added directory plus optional `urls.txt` batch intake, preserving
  simple individual references and existing source-permission boundaries.

### Implemented interface decisions

- `asset init|intake|metadata|source|status` manages local topic assets. The topic
  marker selects root-level schema-2 outputs; old cases retain `research/`.
- `collection init|register|capture|accept|assemble|retry|pause|resume|stop|invalidate|status`
  manages local host-attested records. It never launches agents or invokes Git.
- Synthesis validates both source inventory and assembled registry before save;
  changed input/registry fingerprints make the saved result stale.
- Local development version is `1.1.0-alpha.1`; stable 1.0.1 remains published.

### Verified implementation outcome

Tasks 0–4 and the Harness Research boundary of task 6 are implemented locally.
The full disposable native gate passed 209/209 tests with no skips, installed
legacy/new asset/collection checks, audit and context verification. Independent
runtime review findings on reviewer identity and generation occupancy were fixed
and regression tested. The controlled two-investigator supplied-document example
received a genuine first-review objection, correction and complete new-digest
review; its final bundle verifies complete.

See [verification and coverage limits](../../verification/1.1.0-alpha.1/README.md).
Task 5 remains the separately gated Marketing Studio consumer integration after a
compatible companion is explicitly adopted. Existing studios, installed skills and
running jobs were not updated. Publication/release and live provider/harness
performance trials have not been performed.
