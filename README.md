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
git clone https://github.com/dbbaskette/harness-research-skill.git
cd harness-research-skill
bash scripts/Install-Harness-Research.sh
```

The installer creates one shared local package and registers the skill with
Codex, Claude Code and Cursor. Successful installation prints JSON with
`"status": "installed"`.

To preview the installation before making changes, run
`bash scripts/Install-Harness-Research.sh --dry-run` first.

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

The standard research workflow saves a report automatically and includes citations
as findings are recorded. The agent returns a synthesis and a link to the report,
which is saved at:

```text
your-project/.harness-research/research-report.md
```

It includes findings, citations, contradictions, document coverage gaps and
pending or unresolved questions. The agent updates it as findings are saved.
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
Measured with `cl100k_base`; cumulative whole-file instruction counts.

| Reading path | Tokens |
| --- | ---: |
| Discovery metadata | 39 |
| Installed bootstrap | 383 |
| Bootstrap + current guidance entry | 845 |
| Focused research / fact-check with saved report | 2,411 |
| Comparative workflow routing | 1,359 |
| Legacy migration | 1,085 |

One source strategy, selected comparative resources and evidence add conditional
context. The complete upstream bundle is never a default loading path.
<!-- CONTEXT-USAGE:END -->

Run `npm run context:update` after guidance changes; `npm run context:check`
catches drift.
