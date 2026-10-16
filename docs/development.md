# Developer guide

[← README](../README.md) · [User guide](using-harness-research.md) · [Setup & updates](setup.md)

Normal use is a skill invocation in the user's agent. These details are for
maintainers and callers integrating the local helper.

## Where behavior lives

| Area | Entry point |
| --- | --- |
| Skill routing and completion expectations | [SKILL.md](../SKILL.md) |
| Installed guidance bootstrap | [bootstrap/SKILL.md](../bootstrap/SKILL.md) and [sync-guidance.mjs](../scripts/sync-guidance.mjs) |
| CLI routing | [harness-research.mjs](../scripts/harness-research.mjs) and [run-cli.mjs](../scripts/lib/run-cli.mjs) |
| Queue, stages, leases, independence, and recovery | [research-run.mjs](../scripts/lib/research-run.mjs) |
| Sources, quotes, numbers, facts, gaps, and answer validation | [run-evidence.mjs](../scripts/lib/run-evidence.mjs) |
| Reports, export manifests, and legacy projections | [run-output.mjs](../scripts/lib/run-output.mjs) |
| Project paths, shared locking, atomic writes, and parsing | [run-storage.mjs](../scripts/lib/run-storage.mjs) |
| Bundled facts contract | [JSON Schema](../references/facts.schema.json) and [validator](../scripts/lib/run-schema.mjs) |
| Shared installation and discovery links | [install.mjs](../scripts/install.mjs) |

The helper does not browse, extract documents, start agents, or buy access to
services. The harness performs research and supplies actual invocation identities.
Identity checks enforce recorded participation; changing a worker string is not
proof that another agent ran.

## Inspect the CLI

From a checkout or the installed runtime:

```sh
node scripts/harness-research.mjs --version
node scripts/harness-research.mjs --help
node scripts/harness-research.mjs research help
```

For a content project, these status reads refresh derived outputs from saved state:

```sh
node scripts/harness-research.mjs research status --project /absolute/content-project
node scripts/harness-research.mjs status --project /absolute/content-project
```

The second command is the compatibility status interface; it projects a managed
run into the legacy status vocabulary. It does not establish an independent
fact check for a legacy manual run.

### Checked task workflow

| Actions | Purpose |
| --- | --- |
| `research start` | Create a run with a topic, selected sources, source permissions, depth, optional context/claims, and optional plan-only hold. `--from PATH` (repeatable) starts from earlier research instead. |
| `research next`, `peek` | Lease eligible work, or inspect what would be next without taking it. |
| `research source`, `submit` | Register inspected source text or submit results under the run/task/worker/attempt/lease tuple. |
| `research heartbeat`, `release` | Renew a lease or return a task. Releasing research retains checker exclusion. |
| `research retry`, `continue`, `block` | Reopen exhausted attempts, release a plan hold/block, or record an execution block. |
| `research reassess` | Reopen only the questions affected by changed evidence; retain old facts as stale history. `--again ID,... [--reason TEXT]` researches chosen questions again and keeps their checked facts. |
| `research status` | Inspect progress, expire leases, and repair derived exports. |
| `research verify` | Report what became of cited fact keys (`--keys FILE` or `--key KEY`): confirmed, narrowed, superseded, rejected, stale, unchecked or gone. Read-only. |
| `research approve` | Record who approved the finished research (`--by NAME`, optional `--revision N`) and whether that approval still applies. |
| `research refresh` | Re-read the cited web sources of a finished run; facts whose quoted passages are gone are researched again. |
| `research find` | List the research folders under `--in DIR`, optionally matching `--query`. |

Rounds after the first pass (`reassess`, `again`, `refresh`, and `import` for
work a reused run must redo) research and check only their questions, rewrite
only their answers, and are listed in `facts.json` under `reassessments`.

Read the [run guidance](../references/research-run.md) for starting, dispatching
and finishing a run, and the task contracts ([source, plan and research](../references/task-research.md),
[checking](../references/task-check.md), [cross-check, writing and review](../references/task-write.md))
for input shapes, source registration, partial-capture corrections, independent
checker attestations and writing results. Each task's `guide` names the one file
and the sections its worker needs. Result-file paths resolve against `--project`.
Found sources require explicit public-web permission; a claim target cannot be
its own sole evidence.

`next` returns a compact summary and writes the full task to the file it names;
use `--verbose` for diagnostics. At light depth research tasks cover sections;
standard and deep use question-level research. Results can register source text
inline and cite it by file. Independent sections are pipelined, and busy saves
wait up to thirty seconds for the shared store lock.

The current queue uses thirty-minute renewable leases, monotonically increasing
attempt generations, and idempotent accepted submission replays. A refusal keeps
its lease until corrected, with ten refusals ending that attempt; reported worker
failure ends an attempt immediately. Three failed attempts require explicit retry.
An expired worker may finish before reassignment, but cannot submit through a
replaced lease. Do not bypass these rules by editing the run JSON.

### Existing manual integrations

The original `plan`, `record`, `status`, and `migrate` commands remain supported.
Manual `plan`/`record` cannot mutate a run managed by the checked queue.

- [Manual evidence and JSON formats](../references/evidence.md)
- [Manual workflow](../references/workflow.md)
- [Status/resume](../references/resume.md)
- [Older Brand records](../references/migration.md)
- [Retained item/field comparisons](../references/comparative.md)

The item/field comparison resources are compatibility workflows with their own
configured outputs. They are not the new default standalone report path.

## Consume saved results

Read `research/output.json` as the commit marker for the output set. Match its
run, output revision, and hashes before consuming `facts.json` or `brief.md`.
Canonical state is committed before derived files; a status refresh repairs an
interrupted export. A readable `report.md` alone does not prove the other files
belong to the same revision.

`facts.json` separates source permission (`source_mode`) from the narrative
`scope`. Assertion keys are immutable. Duplicate aliases preserve identity;
narrowing creates a new key and revision history. Check top-level status and
source limits as well as fact status before treating data as current support.
The brief excludes candidate, rejected, superseded, and stale facts from its
current-reference list.

Before publishing content that cites fact keys, run `research verify` on them.
A narrowed or superseded key reports its replacement but is never reported as
confirmed. `facts.json` also carries `approval` (whether the latest approval
still applies), `approvals`, and `origins` for research started with `--from`;
an origin's approval is history, not approval of the new run. Reuse reads only
an origin's `research/` folder, so commit `research/sources/revisions/` with
it: facts whose saved text is missing come across stale and are researched
again. The [direction](superpowers/specs/2026-10-15-harness-research-direction.md)
and the [0.9.1 plan](superpowers/plans/2026-10-16-research-0.9.1.md) record the
decisions behind these commands; consumer migrations remain separate.

## Run verification

Development tools use npm; installed runtime use does not need npm dependencies.

```sh
npm ci --ignore-scripts
npm test
npm run context:check
```

One retained comparative-validator test needs a Python interpreter with PyYAML.
Set `HARNESS_RESEARCH_PYTHON` to that interpreter for this optional check; otherwise
that test is skipped. The project does not require modifying system Python.
The native gate prepares a disposable environment with pinned PyYAML and runs
the complete suite, audit, installation, and installed-helper checks:

```sh
npm run ci:local
```

It uses the existing Tart/macOS test-suite wrapper and a disposable clone. Read
[the wrapper](../scripts/ci/tart-macos.sh), [guest script](../scripts/ci/guest-test.sh),
and your host's local-CI instructions before running it. Preserve logs and confirm
cleanup; never stop an unrelated VM. The 0.9.0
[native evidence](verification/0.9.0/ci-acceptance-fixes/verification.json) covers
88 tests with zero failures or skips under that gate. The 0.9.2
[native evidence](verification/0.9.2/native/verification.json) is a host `npm test`
run: 117 tests, 116 passed and the Python-gated test skipped. Live model
acceptance is a separate outcome; see [the 0.9.1 record](verification/0.9.1/README.md), [the 0.9.2 checks](verification/0.9.2/README.md)
and [the 0.9.0 live results and release decision](verification/0.9.0/README.md).

Instruction-context measurements are generated from current files by
[context-usage.mjs](../tools/context-usage.mjs). After changing agent instructions:

```sh
npm run context:update
npm run context:check
```

The generated table is collapsed at the bottom of the README, and the same
measurements draw the progressive disclosure map in
[docs/images/context-loading.svg](images/context-loading.svg). Source text,
research-task responses, images, and conversation add to the measured instruction
loading; the table is not a complete per-run token or cost estimate.

## Provenance and releases

[NOTICE.md](../NOTICE.md) records the Brand extraction and the preserved,
modified upstream bundle. [Extraction notes](extraction.md) retain earlier
verification history. The current release workflow is in
[Versioned releases](releases.md); do not interpret a merged preview as a release
tag or completion of the broader live acceptance matrix.

The README banner was generated with the built-in image-generation tool. Its
[saved prompt](assets/banner-prompt.txt) and [PNG](assets/harness-research-banner.png)
are kept in the repository; they are documentation assets, not runtime inputs.
