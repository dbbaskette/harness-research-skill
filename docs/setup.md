# Setup, updates, and troubleshooting

[← README](../README.md) · [Using the skill](using-harness-research.md) · [Developer guide](development.md)

Install the skill once, then use it inside your coding agent. Research outputs
belong in your content project; the skill installation is shared across projects.

## Choose your version

| Version | What you get | Install from |
| --- | --- | --- |
| **0.9.0 preview** | The current task workflow, independent evidence checks, and visible `research/` outputs. Broader live release acceptance is still pending. | This repository's `main` branch. |
| **0.8.1 release** | The earlier manual plan/finding workflow and a saved report in `.harness-research/`. | The immutable `v0.8.1` tag. |

This repository's README and user guide describe the 0.9.0 preview. The
[release page](https://github.com/dbbaskette/harness-research-skill/releases/tag/v0.8.1)
has the published 0.8.1 ZIP and checksum. Preview verification and outstanding
acceptance work are recorded in [development evidence](verification/0.9.0/README.md).

### Install the current preview

Requirements: Node.js 20 or newer, Git, Bash, and a configured Codex, Claude Code,
or Cursor environment. Your harness supplies document-reading and research tools,
model access, and permission to create a separate checker invocation. The helper
does not supply those capabilities or require another research account.

```sh
git clone --branch main https://github.com/dbbaskette/harness-research-skill.git
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

### Install the tagged release instead

Use this in place of the preview installation:

```sh
git clone --branch v0.8.1 https://github.com/dbbaskette/harness-research-skill.git
cd harness-research-skill
bash scripts/Install-Harness-Research.sh
```

The checkout is detached at the tag. Its manual workflow is documented in the
[legacy evidence contract](../references/evidence.md) and
[workflow reference](../references/workflow.md). It does not gain the 0.9.0
task commands or independent-checking stages merely by loading newer guidance.

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

The current preview reports `harness-research 0.9.0`; the tagged release reports
`harness-research 0.8.1`.

When work starts or resumes, the agent should also report the installed runtime,
guidance release, exact guidance revision, and freshness. These identities can
differ. A newly loaded instruction set is not proof of a newer executable.

## Update an existing installation

### Adopt the preview for new work

From your skill repository checkout, with your own changes committed or otherwise
preserved:

```sh
git fetch origin
git switch main
git pull --ff-only origin main
bash scripts/Install-Harness-Research.sh
```

Open a new agent session and check the installed version. Existing content runs
keep their saved runtime and guidance; an installation update does not silently
move them to a different workflow.

### Return to the tagged release for new work

```sh
git fetch origin tag v0.8.1
git switch --detach v0.8.1
bash scripts/Install-Harness-Research.sh
```

Older retained runtimes must remain available for the runs pinned to them.
Do not edit files in `versions/` or remove a saved run's runtime to update it.

## Instructions and executables update differently

The installed entrypoint calls the local guidance helper. New tasks fetch public
`main`, verify compatibility, and save an exact guidance snapshot in the content
project. The snapshot contains instructions and references, not executable
scripts. Resuming a saved task uses its pin without fetching again.

Executable updates happen only when you rerun the trusted installer. Current
guidance accepts runtime 0.8.1 and routes it to the manual workflow; the checked
task workflow needs runtime 0.9.0. An incompatible runtime or failed refresh is
reported instead of being described as current.

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
| Independent checking is unavailable | The 0.9.0 run remains blocked with a partial report. Use an authorized separate invocation, or keep the partial result with its limitation. |
| Research storage is busy | Let the active save finish. For a suspected abandoned lock, inspect its recorded process before recovery; do not remove another worker's live lock. |

For older `.tanzu-research` records, use the explicit
[migration procedure](../references/migration.md). Installation-link migration
and saved-record migration are separate operations.
