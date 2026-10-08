# Harness Research

Give your coding agent a research question and get a cited report saved in your
project. Harness Research works with Codex, Claude Code and Cursor to research
topics, compare options and fact-check claims. It keeps findings, conflicting
evidence and unanswered questions so you can pick up the work later.

You describe what you need in plain language. The agent plans the research,
reads sources and automatically saves a cited report in your project.

## 1. Install once

You need **Node.js 20 or newer**, **Git**, and one of the supported coding agents.
Use your existing agent setup; the skill needs no separate research account.
You do not need to run `npm install`.

In your terminal:

```sh
git clone --branch v0.3.0 https://github.com/dbbaskette/harness-research-skill.git
cd harness-research-skill
bash scripts/Install-Harness-Research.sh
```

The installer creates one shared local package and registers the skill with
Codex, Claude Code and Cursor. Successful installation prints JSON with
`"status": "installed"`.

To preview the installation before making changes, run
`bash scripts/Install-Harness-Research.sh --dry-run` first.

### Check or update your version

The current release is [v0.3.0](https://github.com/dbbaskette/harness-research-skill/releases/tag/v0.3.0).
Check the installed helper without network access or a project:

```sh
node "$HOME/.agents/skills/harness-research/scripts/harness-research.mjs" --version
# harness-research 0.3.0
```

To update an existing clone, run from its directory:

```sh
git fetch origin tag v0.3.0
git switch --detach v0.3.0
bash scripts/Install-Harness-Research.sh
```

On start or resume, the agent reports the installed runtime version and the
guidance release, revision and freshness. These can differ: new tasks fetch
instructions from `main`, while executable updates require the installer.
Resumed tasks report their saved guidance and runtime, even after an installation
update. Older guidance without a release label is reported as unknown, with its
exact revision. An older helper without `--version` can be identified from its
installed `package.json`; reinstall to get the new version reporting.

## 2. Start your first research session

Open **the project where you want the report saved** in your coding agent and
start a new session after installation. This can be any content or code project;
you do not need to work inside this repository.

Choose the prompt for your agent:

**Codex**

```text
$harness-research Compare PostgreSQL and SQLite for a small internal application.
Use public primary sources. Cover deployment, concurrency and maintenance.
```

**Claude Code**

```text
/harness-research Compare PostgreSQL and SQLite for a small internal application.
Use public primary sources. Cover deployment, concurrency and maintenance.
```

**Cursor**

```text
Use the harness-research skill to compare PostgreSQL and SQLite for a small
internal application. Use public primary sources. Cover deployment, concurrency
and maintenance.
```

Replace the example with your question. Specify whether the agent should use
**only your documents** or may also use **public web sources**. Web research uses
your agent's available browsing tools.

### Research your own documents

Put the selected documents in your project, or attach them if your agent supports
attachments. Name the files and the source boundary in your prompt:

```text
$harness-research Read sources/product-brief.pdf and sources/release-notes.md.
Using only these documents, determine which launch claims are supported.
Show contradictions or missing evidence.
```

Use `/harness-research` in Claude Code, or ask Cursor to use the skill.
Selected private documents stay local. Unreadable or partially extracted documents
are recorded as coverage gaps.

## 3. Read the report and continue later

Using Harness Research on its own produces a saved cited report; no Brand skill
or follow-up request to write it is needed. The agent returns a synthesis and a link to the report,
which is saved at:

```text
your-project/.harness-research/research-report.md
```

It includes findings, citations, contradictions, document coverage gaps and
pending or unresolved questions. The agent updates it as findings are saved.
Before returning the research result or starting dependent content, the agent
opens the report and checks that the agreed findings, citations and gaps
are saved. A partial handoff requires your explicit direction. Only an explicitly
requested chat-only answer omits the saved report.
If your file browser hides dot folders, open the report using the agent's link
or its full path.

To continue, open the same project and ask:

```text
$harness-research Continue the saved research in this project.
Check for changed source files and work through the remaining questions.
```

Matching plans reuse saved findings. Changes to selected local sources mark
affected findings stale so they can be reassessed. Saved snapshots do not prove
that a live web page is still current.

## Setup help

| What you see | What to do |
| --- | --- |
| Node.js is missing or too old | Install Node.js 20+ and rerun the installer. Check your version with `node --version`. |
| The agent cannot find the skill | Start a new session. Confirm installation returned `"status": "installed"`. |
| `harness-research: command not found` in your terminal | Use the skill inside your agent as shown above. The current installer registers agent skills but does not add a terminal command to `PATH`. |
| The installer reports an unrelated existing skill | Review the named location before moving anything. The installer preserves independent skills. |
| The agent cannot browse or read a document | Supply readable local text, or continue with available sources and retain the gap in the report. |

If you previously used Tanzu Brand research, see the
[migration guide](references/migration.md). Installation updates only links
owned by the former Brand research bundle; copying older saved research records
is a separate, explicit step.

## Advanced: helper commands

Normal use happens through your agent. These helpers save and inspect research
records; the agent handles source reading, searches and evidence assessment.
The agent also prepares the JSON input files.

Run these from this checkout or the installed skill directory. Replace
`/absolute/project` with the directory containing your research:

```sh
node scripts/harness-research.mjs --help
node scripts/harness-research.mjs status --project /absolute/project
```

| Action | Purpose | Required options |
| --- | --- | --- |
| `plan` | Save or resume questions and write the report | `--project DIR --file plan.json` |
| `record` | Save an inspected finding and refresh the report | `--project DIR --run ID --item ID --file finding.json` |
| `status` | Refresh the report and show pending, unresolved and stale evidence | `--project DIR` |
| `migrate` | Copy older `.tanzu-research` records while retaining originals | `--project DIR` |

See the [evidence contract](references/evidence.md) for input formats and
[comparative workflow](references/comparative.md) for item/field outlines.
Existing item/field projects retain their configured output directory; the
automatic report path above applies to the Node evidence workflow.
Optional comparative field validation uses project-local Python/PyYAML, prepared
only when needed. The core workflow requires only Node.js.

## Guidance updates

The installer registers a small local entrypoint. For new work, it quietly checks
this public repository’s `main`, saves an exact guidance revision, and returns
only paths and status. The agent reads the entry and relevant references, not
the whole library. Git and network access are needed for first/new-task refreshes;
no GitHub account is required.

If a refresh reports a DNS/network failure inside an agent sandbox, retry the same
command through the host's network-permission flow, or from a terminal with
network access. Changing skill entrypoints uses the same helper and runtime.
The helper reports the failing Git operation and a safe diagnostic; it does not
print credentials, proxy settings or private Git URLs.

Existing decks or research reports keep their saved task and runtime. Resuming
uses that pin without fetching. Explicitly adopting newer guidance starts a new
task and requires rechecking affected reviews. A failed fetch or incompatible
runtime is reported; it is never described as current.

**Instructions update automatically; executable helpers do not.** Rerun the trusted
shell installer from a current repository copy to update helpers or the entrypoint.
Guidance snapshots contain no executable scripts. The installed helper supports
`start`, `resume`, `cached`, and `pin` through `scripts/sync-guidance.mjs --help`.


## Development and provenance

This project extracts Tanzu Brand's custom research engine and its pinned modified
[Deep-Research-skills](https://github.com/dbbaskette/Deep-Research-skills) bundle.
[NOTICE](NOTICE.md) records origin, license and adaptations. No private brand
assets are included. Tanzu Brand invokes this independent skill and consumes its
report.

`npm test` checks evidence, resume, privacy boundaries, migration and installation.
`npm run ci:local` uses the existing Tart/macOS test suite in a disposable clone.
Tests use local synthetic documents. See
[extraction and verification](docs/extraction.md) for recorded results.

### Instruction context usage

The skill loads focused guidance for the selected workflow. Counts below cover
instruction loading, excluding documents, images and tool responses.

<!-- CONTEXT-USAGE:START -->
Measured with `cl100k_base`; cumulative instruction counts, including a normalized
representative guidance-start response. Bootstrap activation is shown separately.

| Reading path | Tokens |
| --- | ---: |
| Discovery metadata | 38 |
| Installed bootstrap | 448 |
| Bootstrap + current guidance entry | 1,059 |
| Explicit chat-only cited answer | 2,013 |
| Focused research with saved report | 3,134 |
| Status / resume without new findings | 1,476 |
| Comparative routing only | 1,766 |
| Codex comparative outline | 2,726 |
| Codex add items | 1,931 |
| Codex add fields | 1,951 |
| Codex deep results | 2,614 |
| Codex deep results + saved evidence | 3,735 |
| Claude comparative outline | 2,743 |
| Claude deep results | 2,636 |
| Saved research + general web strategy | 3,631 |
| Saved research + academic strategy | 3,723 |
| Saved research + GitHub strategy | 3,518 |
| Saved research + technical Q&A strategy | 3,423 |
| Saved research + Chinese sources strategy | 3,648 |
| Legacy migration | 1,408 |

Comparative rows include the selected platform resource, not the complete bundle.
Each strategy row includes one router and one strategy. Status/resume skips plan
and finding schemas until a new save is needed. Only explicitly requested chat-only
answers omit the saved queue; default research uses the evidence contract. Source
content, images, research helper results and conversation add separately. The JSON
report also exposes direct-handoff paths without the bootstrap/start response.
<!-- CONTEXT-USAGE:END -->

Run `npm run context:update` after guidance changes; `npm run context:check`
catches drift.
