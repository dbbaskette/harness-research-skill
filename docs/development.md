# Developing Harness Research

[README](../README.md) · [Architecture](architecture.md) · [Migration](migration-v1.md)

The public interface is a skill invocation. These commands are for maintainers
and agents; first-time users do not need to drive them.

## Code and instruction map

| Area | Files |
| --- | --- |
| Discovery and stage routing | [SKILL.md](../SKILL.md) |
| Coordinator and dossier contract | [synthesis-workflow.md](../references/synthesis-workflow.md) |
| Investigation / writing / review | [investigate.md](../references/investigate.md), [synthesize.md](../references/synthesize.md), [review-synthesis.md](../references/review-synthesis.md) |
| CLI, state, snapshots and repairs | [synthesis-cli.mjs](../scripts/lib/synthesis-cli.mjs) |
| Validation and review binding | [synthesis-model.mjs](../scripts/lib/synthesis-model.mjs) |
| Report, brief, evidence and exports | [synthesis-output.mjs](../scripts/lib/synthesis-output.mjs) |
| JSON contracts | [synthesis.schema.json](../references/synthesis.schema.json) |
| Packaging and compatibility | [install.mjs](../scripts/install.mjs), [sync-guidance.mjs](../scripts/sync-guidance.mjs) |
| Prior queue and manual interface | [legacy developer guide](legacy-development.md) |

## Work with a dossier

Use a fresh content project. Copy/read source material into it through the host's
authorized tools, then author a dossier using the [contract](../references/synthesis-workflow.md).
Paths passed through `--file` are relative to `--project`.

```sh
node scripts/harness-research.mjs synthesis help
node scripts/harness-research.mjs synthesis save --project /absolute/content-project --file research/dossier.json --worker researcher
node scripts/harness-research.mjs synthesis status --project /absolute/content-project --compact
```

Validate a dossier without writing or clearing an existing review:

```sh
node scripts/harness-research.mjs synthesis validate --project /absolute/content-project --file research/dossier.json --worker researcher
node scripts/harness-research.mjs synthesis template --project /absolute/content-project --out research/review.json
```

`--compact` returns status, digest, counts, integrity checks, problems and repair
paths. Full responses remain the default for existing consumers and include
source records and `review_template`; `--verbose` pretty-prints the full result.
`template` prints only pending review JSON, or creates a new project-relative
`--out` file under an existing directory. It refuses overwrites and managed paths.
A different invocation reads the source context and saved report, fills the
template, and submits its real judgments:

```sh
node scripts/harness-research.mjs synthesis review --project /absolute/content-project --file research/review.json --worker reviewer
node scripts/harness-research.mjs synthesis verify --project /absolute/content-project
```

Worker strings identify actual invocations; they are not role-switching switches.
Read the [review guide](../references/review-synthesis.md) before checking. A review
cannot approve a different digest. Invalid references, source changes and missing
review items are actionable errors, not reasons to weaken the contract.

`status` and `verify` inspect local integrity and repair derived exports when
needed; their results identify repaired files and `preserved_files` backup paths.
Every overwritten output, including normal status transitions, is preserved
byte-for-byte under `.harness-research/output-backups/`, deduplicated by content.
Backups are working history outside the portable artifact manifest. Bring useful
edits back into the dossier and save/review them. Integrity checks deduplicate
source paths within each command and report `integrity_checks` with files checked
and bytes hashed; the next command reads the bytes again. Neither browses or revalidates
current websites. Saving revised content clears the old review. Preserve source
and dossier history and obtain a new review after material changes.

CLI exits are intentionally separate from completion:

| Result | Exit |
| --- | ---: |
| Intact draft or intact needs-revision on status/verify | 0 |
| Completed output or accepted review | 0 |
| Stale evidence or failed artifact integrity | 1 |
| Submitted review with objections | 1 (objections are saved) |
| Invalid command/input or storage failure | 1 |

For completion gates, check `status === "complete"` as well as the exit code.
See the [executable schema-2 example](../examples/synthesis/README.md) for a small
source, dossier, authored brief and unfilled review template. It uses no network
or automatic passing review.

## Development and installation

The published stable version is `1.0.1`. Its guidance requires runtime 1.0.1 or
newer because it uses the template, validate and compact interfaces; 1.0.0
runtimes keep selecting 1.0.0 guidance. New installed tasks choose compatible stable
release guidance. For unpublished development, select the checkout's `SKILL.md`
and runtime explicitly. The guidance floor prevents older helpers from loading
an unsupported workflow.

Test an installation only in disposable destinations:

```sh
bash scripts/Install-Harness-Research.sh --home /absolute/disposable-home --shared /absolute/disposable-runtime
```

The installer bundles skill references, runtime and upstream attribution without
runtime npm dependencies. Fetched guidance contains instructions and licenses,
not executable repository code. [Setup](setup.md) explains the user-facing paths.

## Verification

Implement a coherent slice, then run affected tests. Main integration verification
owns the full suite; do not repeat it for every instruction or documentation edit.

```sh
npm ci --ignore-scripts
node --test tests/synthesis-runtime.test.mjs
npm run context:update
npm run context:check
npm test
```

The repository's native gate uses a disposable Tart VM and tests installation,
full suite, audit and generated context:

```sh
npm run ci:local
```

Read the host local-CI reference, [wrapper](../scripts/ci/tart-macos.sh), and
[guest script](../scripts/ci/guest-test.sh) before running it. Do not modify or
stop unrelated VMs. Retain logs and verify clone cleanup. Python/PyYAML compatibility
checks belong in the disposable test environment rather than system Python.

Instruction-token measurement is generated by [context-usage.mjs](../tools/context-usage.mjs).
It reports per-stage and cumulative context, not model cost. After guidance changes,
regenerate the table below and its context map, then check them.

The [1.0 acceptance record](verification/1.0.0-alpha.1/README.md) distinguishes code
checks, live research, independent evidence review and limitations. Each release's
record under [verification](verification/) pins its tested tree and scope. A synthetic
fixture is not a live research test, and local acceptance is not a release.

## Documentation and attribution

The [architecture spec](superpowers/specs/2026-10-17-synthesis-first.md) is the new
source of design intent. Older specs are marked historical. Preserve Anthropic's
original and Apache license under `upstream/anthropic/`; [NOTICE](../NOTICE.md)
records modifications and attribution. The project otherwise retains its existing
license and legacy notices.

The README illustration was generated with the built-in image tool and saved as
[the new banner](assets/harness-research-synthesis-banner.png); its
[prompt and tool provenance](assets/synthesis-banner-prompt.txt) are committed
alongside it. It is a documentation asset, not an instruction input.

## Instruction context

The skill loads the entrypoint and the references needed for the current stage.
These generated measurements describe instruction loading, not total model usage
or cost. Source documents, tool responses, and conversation add separately.

![Progressive disclosure: load the entry and the relevant stage, not the entire instruction library.](images/context-loading.svg)

<!-- CONTEXT-USAGE:START -->
Measured with `cl100k_base`; cumulative instruction counts include a normalized
representative guidance-start response. Stage-only rows count their own reference.

| Reading path | Tokens |
| --- | ---: |
| Discovery metadata | 36 |
| Installed bootstrap | 521 |
| Bootstrap + current guidance entry | 1,183 |
| Investigator stage | 1,017 |
| Synthesis writer stage | 1,547 |
| Independent reviewer stage | 1,390 |
| New synthesis: coordinator entry and workflow | 4,032 |
| New synthesis: all stages in one context | 7,986 |
| Synthesis resume, verify or refresh | 2,111 |
| Optional studio task handoff | 4,733 |
| Legacy 0.9 queued coordinator | 4,908 |
| Legacy 0.9 reuse or refresh | 1,960 |
| Legacy explicit chat-only answer | 2,137 |
| Legacy manual saved research | 3,328 |
| Legacy manual status or resume | 1,738 |
| Legacy comparative routing only | 1,890 |
| Legacy Codex comparative outline | 2,850 |
| Legacy Codex add items | 2,055 |
| Legacy Codex add fields | 2,075 |
| Legacy Codex deep results | 2,738 |
| Legacy Codex deep results + saved evidence | 3,929 |
| Legacy Claude comparative outline | 2,867 |
| Legacy Claude deep results | 2,760 |
| Investigation + general web strategy | 5,546 |
| Investigation + academic strategy | 5,638 |
| Investigation + GitHub strategy | 5,433 |
| Investigation + technical Q&A strategy | 5,338 |
| Investigation + Chinese sources strategy | 5,563 |
| Legacy migration | 1,532 |

The new default starts with the entry and synthesis workflow. Investigation, writing
and independent review each load their own reference when needed. The all-stages
row shows their cumulative cost if read in one context; delegated stage rows are
separate contexts. Synthesis reuse does not load investigation or writing contracts
until new work is needed. Strategy rows add exactly one source strategy. Legacy
queue, manual and comparative paths remain available only for existing callers.
Source documents, evidence payloads, tool responses and conversation add separately.
The JSON output also exposes direct-checkout paths without bootstrap/start overhead.
<!-- CONTEXT-USAGE:END -->

Run `npm run context:update` after guidance changes, then `npm run context:check`
to verify the generated table and map.
