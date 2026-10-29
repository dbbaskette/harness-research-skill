# Setup and versions

[README](../README.md) · [User guide](using-harness-research.md)

## Install or update to 1.1.0

Requirements: Node.js 20+, Git, Bash and a configured agent with source-reading
and search tools. No runtime npm install is required.

```sh
git clone --branch v1.1.0 https://github.com/dbbaskette/harness-research-skill.git
cd harness-research-skill
bash scripts/Install-Harness-Research.sh
```

Use a fresh checkout directory when updating, then run that release's installer.
It retains old immutable runtimes and switches the discovery links to 1.1.0.
Existing projects retain their pinned runtime and guidance; do not convert an
in-progress 0.9 project by starting a new synthesis task over its files.

After installation, return to the **content project** where `research/` should be
saved; the shell commands above leave you in the skill checkout.

Start a new agent session and invoke `$harness-research` in Codex,
`/harness-research` in Claude Code, or ask Cursor to use the skill. New tasks select
stable 1.1.0 guidance automatically. The agent reports runtime version, guidance
revision and freshness on start/resume.

Check the installed version on macOS:

```sh
node "$HOME/.agents/skills/harness-research/scripts/harness-research.mjs" --version
```

The [0.9.5 release](https://github.com/dbbaskette/harness-research-skill/releases/tag/v0.9.5)
and [legacy guide](legacy-using-harness-research.md) remain available for older runs.
For development work, an explicit checkout's `SKILL.md` and runtime may still be
used together; automatic refresh selects stable release tags.

## Installation locations

The installer creates immutable shared runtimes and discovery links:

| Host | Skill link |
| --- | --- |
| Codex | `~/.agents/skills/harness-research` |
| Claude Code | `~/.claude/skills/harness-research` |
| Cursor | `~/.cursor/skills/harness-research` |

Shared runtimes live in `~/Library/Application Support/Harness Research` on macOS
or `~/.local/share/harness-research` elsewhere. These paths do not by themselves
establish tested behavior on every OS. The installer preserves unrelated skills;
it does not create a global terminal command.

Run `bash scripts/Install-Harness-Research.sh --dry-run` to inspect destinations.
`--home`, `--shared`, and `--claude-config` support custom or disposable installs.
See `--help` and the [legacy setup details](legacy-setup.md) for location rules.
Do not modify immutable installed versions by hand.

## Guidance and runtime

Published installations resolve compatible stable guidance, pin it for a task and
report its identity. Resume uses that pin; it does not silently change workflows.
The new guidance requires the new runtime. Older installations retain compatible
older guidance rather than attempting to execute unsupported commands.

A failed DNS/network lookup is a source-access failure, not a second runtime.
Use the host's permitted network-retry mechanism, or report the limitation.
Changing entrypoints cannot repair unavailable network access. A source/hash check
is local and does not prove live website access.

## Runtime 1.1.0 and topic assets

Topic folders, directory/URL-list intake and bounded collection require runtime
1.1.0 and its guidance. Older runtimes keep compatible stable guidance until
upgraded. Fresh standalone topics default to `research/<topic>/`; a studio may
supply another local destination and handles repository sync separately. Existing
cases retain their previous paths and pinned execution protocol.

## Runtime 1.0.1 and recovery

The 1.0.1 compact, template and validate commands require runtime 1.0.1 or newer,
and 1.0.1 guidance declares that floor. A 1.0.0 installation keeps selecting
compatible 1.0.0 guidance and reports `older-compatible-release` until you install
1.0.1 with the instructions above.

Status/verify preserves overwritten outputs in
`.harness-research/output-backups/` and reports `preserved_files`. Recover useful
edits into the dossier before saving and obtaining a new review. Generated files
remain projections of the saved dossier.

Installer and guidance refresh locks contain the owning process ID. Retry after an
interruption: a lock at least 60 seconds old is recovered only when its recorded
process has exited. An old live owner remains protected. Unknown/malformed locks
are preserved for inspection; do not delete a lock while another operation runs.

New guidance selection searches up to 100 stable releases. A search-budget error
means older compatible guidance may exist; it differs from checking every listed
release and finding none compatible. Resume an existing pinned task, explicitly
pin an approved compatible revision, or update the runtime using the trusted
installer. No failed lookup silently switches guidance.

## Troubleshooting

| Symptom | Next step |
| --- | --- |
| New task still writes the old Q&A format | Check runtime and guidance versions; install 1.1.0 and start a new task in a fresh content folder |
| New helper refuses existing `research/` files | Preserve the old project; use a fresh folder or resume its legacy runtime |
| Independent review unavailable | Keep the saved draft; enable a permitted separate invocation before claiming completion |
| Source changed or review no longer matches | Re-read affected evidence, save a revised dossier and obtain a new review |
| Skill not discovered after install | Start a new agent session and inspect the returned discovery links |
| Installer refuses a destination | Preserve the unrelated files; inspect `--dry-run` rather than overwriting them |

[Migration and consumers](migration-v1.md) · [Developer verification](development.md)
