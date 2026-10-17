# Setup and versions

[README](../README.md) · [User guide](using-harness-research.md)

## Try the new implementation

This checkout is **1.0.0-alpha.1**, an unpublished development preview. Use an
agent with source-reading tools and Node.js 20 or later. No runtime npm install
is required. Start a new content folder and tell the agent to read this checkout's
absolute `SKILL.md` path and use its local runtime.

```text
Use /absolute/path/to/harness-research-skill/SKILL.md and the local runtime
in that checkout. Research <topic> for <audience> using <source boundary>.
```

This is the supported preview path. Installing an alpha helper does not cause
stable-tag guidance refresh to select unreleased instructions. Do not confuse a
new executable version with the guidance actually loaded for a task.

Check the checkout version:

```sh
node scripts/harness-research.mjs --version
```

The agent should name the runtime version and local guidance on first use. After
publication, the normal skill installation and stable-tag refresh path will apply.
Do not run a clone command for a future tag that does not yet exist.

## Install the published 0.9.5 release

This installs the previous question-oriented workflow, useful for existing runs.
Requirements are Node.js 20+, Git, Bash and a configured agent.

```sh
git clone --branch v0.9.5 https://github.com/dbbaskette/harness-research-skill.git
cd harness-research-skill
bash scripts/Install-Harness-Research.sh
```

Start a new agent session and invoke `$harness-research` in Codex,
`/harness-research` in Claude Code, or ask Cursor to use the skill. See the
[0.9 user guide](legacy-using-harness-research.md) for that version's behavior.

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

## Troubleshooting

| Symptom | Next step |
| --- | --- |
| Preview still writes the old Q&A format | Check the selected guidance path, not only `--version`; use the checkout entry explicitly |
| New helper refuses existing `research/` files | Preserve the old project; use a fresh folder or resume its legacy runtime |
| Independent review unavailable | Keep the saved draft; enable a permitted separate invocation before claiming completion |
| Source changed or review no longer matches | Re-read affected evidence, save a revised dossier and obtain a new review |
| Skill not discovered after install | Start a new agent session and inspect the returned discovery links |
| Installer refuses a destination | Preserve the unrelated files; inspect `--dry-run` rather than overwriting them |

[Migration and consumers](migration-v1.md) · [Developer verification](development.md)
