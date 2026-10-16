# Setup, updates, and troubleshooting

[← README](../README.md) · [Using the skill](using-harness-research.md) · [Developer guide](development.md)

Install the skill once, then use it inside your coding agent. Research outputs
belong in your content project; the skill installation is shared across projects.

## Choose your version

| Version | What you get | Install from |
| --- | --- | --- |
| **0.9.1 release** | The task workflow, independent evidence checks and visible `research/` outputs, plus checking cited facts, researching questions again, reusing, approving and refreshing research. | The immutable `v0.9.1` tag. |
| **0.9.0 previous release** | The task workflow without the 0.9.1 verification and reuse commands. | The immutable `v0.9.0` tag. |
| **0.8.1 earlier release** | The earlier manual plan/finding workflow and a saved report in `.harness-research/`. | The immutable `v0.8.1` tag. |
| **Development** | Unreleased work; guidance must be selected explicitly for testing. | `main` or a development branch; see the [developer guide](development.md). |

The README and user guide describe 0.9.1. The
[release page](https://github.com/dbbaskette/harness-research-skill/releases/tag/v0.9.1)
has its ZIP and checksum. The [verification record](verification/0.9.1/README.md)
separates native results, installed-helper checks and live trials. The
[0.9.0 record](verification/0.9.0/README.md) keeps the owner's decision to refine
quality through ongoing use rather than complete formal human sampling.

### Install the release

Requirements: Node.js 20 or newer, Git, Bash, and a configured Codex, Claude Code,
or Cursor environment. Your harness supplies document-reading and research tools,
model access, and permission to create a separate checker invocation. The helper
does not supply those capabilities or require another research account.

```sh
git clone --branch v0.9.1 https://github.com/dbbaskette/harness-research-skill.git
cd harness-research-skill
bash scripts/Install-Harness-Research.sh
```

There is no runtime `npm install` step. If you want to inspect the destinations
before installation, run this from the checkout first:

```sh
bash scripts/Install-Harness-Research.sh --dry-run
```

An actual installation returns JSON with `"status": "installed"`,
`runtimeVersion`, installation locations, and the content digest. Start a new
agent session, open the project where you want research saved, and invoke the
skill using the [first-session prompts](../README.md#get-started).

**Preview users:** reinstall from `v0.9.1` even if `--version` already reports
0.9.1. Preview and final helpers can have the same version label with different
contents; a guidance refresh does not replace executable helpers.

### Use a previous release

Replace `v0.9.1` with `v0.9.0` or `v0.8.1` in the clone command to install an
older release. 0.9.0 lacks the verification and reuse commands. 0.8.1's
manual workflow is documented in the [legacy evidence contract](../references/evidence.md)
and [workflow reference](../references/workflow.md). It does not gain task commands
or independent-checking stages merely by loading newer guidance.

## Where installation puts things

The installer copies an immutable runtime into a shared directory and registers
three links to its current version:

| Agent | Default skill discovery link |
| --- | --- |
| Codex | `~/.agents/skills/harness-research` |
| Claude Code | `~/.claude/skills/harness-research` |
| Cursor | `~/.cursor/skills/harness-research` |

The default shared package directory is
`~/Library/Application Support/Harness Research` on macOS, and
`~/.local/share/harness-research` on other platforms. It contains `versions/`
and a `current` link. Native verification currently covers macOS; the path choice
alone does not establish acceptance on another operating system.

The installer preserves unrelated existing skills and only migrates links it
recognizes as owned by the earlier Tanzu Brand research bundle. It does not add
a global terminal command to `PATH`. Use the skill in your agent; the helper
remains available through its Node.js script.

For custom installations, these options are supported by the shell wrapper:

```sh
bash scripts/Install-Harness-Research.sh --help
```

| Option | Meaning |
| --- | --- |
| `--dry-run` | Report the proposed installation without writing it. |
| `--home DIR` | Use a different home directory for discovery links. |
| `--shared DIR` | Use a different shared runtime directory. |
| `--claude-config DIR` | Use a different Claude configuration directory. |

Without a custom `--home`, the installer also honors `CLAUDE_CONFIG_DIR` when no
explicit `--claude-config` is supplied. Read the returned `targets` and `runtime`
paths when using custom locations.

## Check what you are running

With the default discovery link, this works offline and needs no content project:

```sh
node "$HOME/.agents/skills/harness-research/scripts/harness-research.mjs" --version
```

The current release reports `harness-research 0.9.1`. Previous releases report
`harness-research 0.9.0` or `0.8.1`; a preview can also report 0.9.1, so reinstall it from the tag.

When work starts or resumes, the agent should also report the installed runtime,
guidance release, exact guidance revision, and freshness. These identities can
differ. A newly loaded instruction set is not proof of a newer executable.

## Update an existing installation

### Update to 0.9.1 for new work

From your skill repository checkout, with your own changes committed or otherwise
preserved:

```sh
git fetch origin tag v0.9.1
git switch --detach v0.9.1
bash scripts/Install-Harness-Research.sh
```

Open a new agent session and check the installed version. Reinstall previews even
if the version label already matches. Existing content runs keep their saved
runtime and guidance; an installation update does not silently move them to a
different workflow.

### Roll back new work to 0.8.1

```sh
git fetch origin tag v0.8.1
git switch --detach v0.8.1
bash scripts/Install-Harness-Research.sh
```

Older retained runtimes must remain available for the runs pinned to them.
Do not edit files in `versions/` or remove a saved run's runtime to update it.

## Instructions and executables update differently

The installed entrypoint calls the local guidance helper. From runtime 0.9.0,
new tasks fetch the newest numeric release tag whose guidance supports the
installed runtime, falling back to `main` only when no release tags exist.
Unreleased instructions on `main` are therefore not normally selected. Helpers
through 0.8.1 still fetch `main` directly. Each task saves an exact guidance
snapshot in the content project containing instructions and references, not
executable scripts. Resuming uses its pin without fetching again.

Executable updates happen only when you rerun the trusted installer. Current
guidance accepts runtime 0.8.1 and routes it to the manual workflow; the checked
task workflow needs runtime 0.9.0, and its verification and reuse commands need
0.9.1. An incompatible runtime or failed refresh is reported instead of being
described as current. From runtime 0.9.1, a task that uses an older release
because a newer one needs a newer runtime reports
`freshness: older-compatible-release` with a notice naming that release; rerun
the installer from the newer tag to use it.

To explicitly adopt newer guidance for existing work, ask the agent to do so.
That creates a new guidance task and requires rechecking affected conclusions;
it is not ordinary resume. [Task and evidence recovery →](using-harness-research.md#continue-or-recover-a-run)

## Troubleshooting

| Symptom | What to do |
| --- | --- |
| `node` is missing, or its version is below 20 | Install a supported Node.js version and rerun the installer. Check with `node --version`. |
| The agent cannot find the skill | Start a new session after installation. Inspect the returned discovery `targets`; confirm that the installation says `installed`. |
| `harness-research: command not found` in a terminal | Invoke the skill inside your agent. The shell installer does not add a terminal command to `PATH`; use the Node helper path for diagnostics. |
| New commands fail with an older runtime | Check `--version` and reinstall from the desired checkout. New guidance does not upgrade helper code. |
| Git refresh fails with DNS, connection, or sandbox access errors | Have the agent retry the same operation through the host's network-permission flow, or use a terminal with network access. Switching skill entrypoints uses the same helper and does not provide another network environment. |
| A saved task reports changed guidance or runtime files | Preserve its state and restore the intact runtime/snapshot with the trusted installer or backup. Do not edit a pin to make the check pass. |
| The installer finds an unrelated existing skill | Inspect and preserve that location before choosing where to install. It will not replace an unrelated skill automatically. |
| A PDF, slide deck, or page cannot be read | Supply a readable source if possible. The agent can preserve an access/extraction gap; the helper itself does not extract documents or browse pages. |
| Independent checking is unavailable | The run remains blocked with a partial report. Use an authorized separate invocation, or keep the partial result with its limitation. |
| Research storage is busy | Let the active save finish. For a suspected abandoned lock, inspect its recorded process before recovery; do not remove another worker's live lock. |

For older `.tanzu-research` records, use the explicit
[migration procedure](../references/migration.md). Installation-link migration
and saved-record migration are separate operations.
