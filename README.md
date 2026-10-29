![Colorful source notes become a clear, connected research report.](docs/assets/harness-research-synthesis-banner.png)

# Harness Research

### Bring the questions. Keep the understanding.

Turn a topic, a folder of documents, or a list of links into a **saved, cited
research report**. Get the explanation, a reusable brief, and the source material
behind the conclusions—all together in a local topic folder.

Harness Research is a skill for your agent. Use it on its own in Codex, Claude
Code, or Cursor, or let a content studio supply the task and local destination.
Your agent does the research; the skill gives it a consistent method for gathering
evidence, writing, checking, and keeping the result.

**[Start here](#your-first-report)** · **[Bring your sources](#bring-your-own-sources)** ·
**[Explore the options](#make-the-research-fit-your-task)** · **[User guide](docs/using-harness-research.md)**

> **This checkout: `1.1.0-alpha.1`, a local development preview.** This README
> covers the new topic folders, directory/URL-list intake, and parallel investigation.
> They are not included in the published `1.0.1` release. Follow the checkout
> instructions below to try them, or [install the stable release](#install-the-published-release).

## Your first report

You need **Node.js 20+** and an agent with tools to search and read your permitted
sources. A fully reviewed result also needs a separate agent invocation to check
it. The skill uses your existing agent and tools; no research service or additional
API subscription is required. A studio and Git repository are optional.

### 1. Open a folder for your work

Choose the content or code folder where you want to keep the research. New topics
will go under `research/` there. It can be an ordinary local folder.

### 2. Point your agent at this checkout

For this development preview, replace the first path below with the absolute path
to this checkout's `SKILL.md`. This selects its new instructions and helper together.

```text
Use /absolute/path/to/harness-research-skill/SKILL.md with that checkout's
local runtime and guidance.

Research Valkey versus Redis for application engineers considering a move
away from Redis. Use public primary sources. Explain where replacement is
practical, where it is risky, and which requirements would change the choice.
```

The agent handles searching, source captures, citations, report files, and review.
You do not need to run npm commands, prepare JSON, or separately ask for the report
to be written. If your host asks permission for independent review, allow the
separate invocation to complete the checked workflow.

### 3. Open the saved result

The agent links your report, normally at a path such as:

```text
research/valkey-vs-redis/report.md
```

Read `report.md` for the explanation and `brief.md` for the takeaways. The topic
folder also keeps tags, originals, source captures, and evidence so the work can
be reused later.

No intended use specified? The default is **general-purpose topic research**:
key concepts, findings, perspectives, practical implications, and open questions.
A cited report is saved by default.

[More first-use examples →](docs/using-harness-research.md)

## Bring your own sources

Start with public research, your own material, or a permitted combination.

| Input | How to give it to the agent |
| --- | --- |
| A topic | Describe what you want to understand and which public sources to use |
| Individual documents | Name the files or provide accessible attachments |
| Individual URLs | Include the links in your request |
| A source folder | Point to the directory containing your documents |
| A URL-list file | Point to a plain-text file with one URL per line |
| Documents and URLs together | Put them in one input folder with an optional `urls.txt` |

For several inputs, a folder is the simplest starting point:

```text
inputs/my-topic/
  documents/
    background.pdf
    requirements.md
    release-notes.txt
  urls.txt
```

The `documents/` subfolder is a convention; supported files can also be directly
inside the selected input directory. Keep inputs separate from the output folder.

An example `urls.txt`:

```text
# References to read
https://valkey.io/
https://redis.io/

# Blank lines and comment lines are allowed.
```

Then ask:

```text
Research Valkey versus Redis using inputs/my-topic/.
Use only the supplied documents and the URLs in urls.txt.
The audience is our application engineering team.
```

The skill recognizes `urls.txt` in the selected folder. You can instead name a
URL-list file elsewhere, or provide just documents or just a URL list. There is no
need to turn each input into a command parameter.

**Want broader research? Say so:**

```text
Start with inputs/my-topic/ and supplement it with public primary sources.
Explain where the supplied material and public documentation disagree.
```

“Use only these files and links” keeps investigation within that set. Supplying a
URL permits reading that reference; it does not itself permit wider searching.
PDF and Office-document reading depends on the agent's available tools. Originals
are retained, and unreadable or unsupported inputs are reported explicitly.

Every supplied reference stays in the source inventory, including invalid,
inaccessible, unused, or uncited URLs. A listed URL is not necessarily a source
the agent successfully read. Observed searches and access outcomes can be recorded;
the skill does not invent an exhaustive browsing history.

[Source intake details →](references/topic-assets.md#take-a-directory-and-an-optional-url-list) ·
[Source permissions →](docs/using-harness-research.md#choose-the-source-boundary)

## Make the research fit your task

Give options in ordinary language. The agent handles the files and helper commands.

| Option | Example request |
| --- | --- |
| Audience | “Explain this for platform engineers new to the topic.” |
| Intended use | “This will inform a technical blog.” |
| Scope | “Focus on deployment, concurrency, and maintenance.” |
| Source restrictions | “Use only the supplied documents and links.” |
| Extra public research | “Supplement our documents with public primary sources.” |
| Depth | “Give me a concise overview” or “Investigate the trade-offs in depth.” |
| Local destination | “Save the topic asset in `research/platform-cache/`.” |
| Topic tags | “Tag it with `caching`, `migration`, and `operations`.” |
| Parallel collection | “Use up to two investigators if independent workstreams would help.” |
| Sequential collection | “Investigate sequentially, then use a separate reviewer.” |

Purpose changes both the investigation and the shape of the report and brief:

- **Decision:** compare consequential criteria, alternatives, constraints, and what would change the recommendation.
- **Presentation:** emphasize key messages, the storyline, and evidence worth explaining visually.
- **Blog:** develop the central argument, mechanisms, and credible objections.
- **Training:** explain concepts in sequence, misconceptions, and grounded examples.
- **General research:** build a balanced understanding of the topic without assuming a downstream format.

You can name several uses and identify the primary one. Research supplies the
understanding and evidence; a writing, presentation, or training skill can then
create the finished content.

[Purpose and follow-ups →](docs/using-harness-research.md)

## A topic folder you can keep and reuse

Each new topic has its own local asset folder:

```text
research/my-topic/
  report.md             # main cited research report
  brief.md              # prioritized takeaways for the intended use
  evidence.md           # quotations, qualifications, and review
  topic.json            # stable identity, title, description, and tags
  sources.json          # supplied/discovered sources and their outcomes
  documents/            # retained supplied originals
  sources/              # readable captures and pinned evidence
  facts.json            # structured evidence and synthesis
  output.json           # reviewed revision and output hashes
  asset-manifest.json   # metadata, documents, and output handoff inventory
  .harness-research/     # local working state and revision history
```

Start with the Markdown files. The JSON records help agents and studios find,
verify, and reuse the work; you do not have to author them. Tags can be refined
without changing the research conclusions or claiming a new evidence review.

`output.json` identifies the reviewed research. `asset-manifest.json` inventories
the portable files, including metadata and retained inputs that were not cited.
File hashes establish integrity; they do not approve every input or establish
that a source is still current. Private working state is excluded from that
handoff inventory.

Existing cases retain their earlier `research/report.md` layout and saved workflow.
The new skill does not silently reorganize them.

[Asset and handoff details →](references/topic-assets.md) ·
[Existing projects and migration →](docs/migration-v1.md)

## Parallel research when it helps

A broad topic can be split into independent themes, with **up to three concurrent
investigators** when the host permits it. One coordinator combines their evidence
into a coherent report. Questions guide the work; they do not force the result
into a Q&A template.

Small requests can stay sequential. Your configured capacity and limits take
precedence; the host supplies worker tools, permissions, budget accounting, and
cancellation. Parallel collection may reduce elapsed time while using more total
tokens, and no fixed speedup or dollar cost is promised.

Valid checkpoints can be reused after an interruption. Retries target affected
workstreams, while changed evidence or scope is revalidated. Independent review
remains a separate step in either execution mode. If that reviewer is unavailable,
the agent saves an honest draft.

[Coordination and recovery →](references/parallel-research.md) ·
[Codex adapter](references/harnesses/codex.md) ·
[Claude Code adapter](references/harnesses/claude-code.md)

## Know what was checked

A separate invocation reviews the source context, assertions, conclusions, and
report/brief prose. It must be distinct from the author and investigators.

| Status | Meaning |
| --- | --- |
| **Draft** | Saved work awaiting independent review |
| **Needs revision** | Review found unresolved problems |
| **Stale** | Saved evidence or inputs no longer match the research revision |
| **Complete** | The independent review accepted the saved revision; clearly identified gaps may remain |

Changing the evidence or report invalidates its old review. A local integrity
check verifies saved files; a live refresh requires reading permitted sources
again. Source hashes and exact quote matching help preserve the evidence, while
the reviewer judges its meaning and whether it supports the claims.

[How evidence and review work →](docs/using-harness-research.md#evidence-and-review)

## Continue the work later

Ask the agent to resume the existing asset rather than starting over:

```text
Resume the research in research/my-topic/. Explain which conclusions depend
on assumptions about our workload, and preserve the source restrictions.
```

Other useful follow-ups:

- “Refresh this research before we use it; check versions and changed sources.”
- “Make the explanation easier for beginners while retaining the qualifications.”
- “Update the topic tags so our team can find this research.”
- “Create a presentation-focused variant using sound evidence from this topic.”

Same-task evidence and prose can be revised and reviewed again. A different topic,
audience, purpose, or source permission currently uses an explicitly named asset
variant, preserving the original request and downstream references. Existing
consumers can stay pinned to a reviewed revision until they choose an update.

[Resume, reuse, and refresh →](references/synthesis-reuse.md)

## Use it with a studio

A studio can supply the topic, audience, purpose, source folder/URL list, limits,
and a **local output destination**. Harness Research returns the local asset,
report, brief, review status, and revision identity.

The studio owns its shared repository, synchronization, remote conflicts, and
sharing policy. Research never chooses a repository or runs Git. A failed studio
sync can be retried without rerunning completed research.

The local handoff contract is ready in this preview. Installed studio execution
adapters are enabled separately; this checkout does not automatically update them
or change running jobs.

[Studio integration contract →](references/studio-handoff.md)

## Install the published release

For the published `1.0.1` synthesis workflow, you need Node.js 20+, Git, Bash,
and a configured agent:

```sh
git clone --branch v1.0.1 https://github.com/dbbaskette/harness-research-skill.git
cd harness-research-skill
bash scripts/Install-Harness-Research.sh
```

Return to your **content project** afterward—the commands leave you inside the
skill checkout. Start a new agent session and invoke:

| Agent | Invocation |
| --- | --- |
| Codex | `$harness-research` |
| Claude Code | `/harness-research` |
| Cursor | Ask the agent to use Harness Research |

The published release writes the earlier report layout. To try the new options
in this checkout, use the explicit skill path from [Your first report](#your-first-report).
Installing a preview helper alone does not opt into preview guidance; automatic
guidance refresh selects compatible stable releases. Existing tasks keep their
pinned runtime and guidance.

[Install, update, and troubleshoot →](docs/setup.md)

## See the output and go deeper

- [Valkey/Redis report](docs/verification/1.0.0-alpha.1/valkey-redis-editorial/research/report.md) and [presentation brief](docs/verification/1.0.0-alpha.1/valkey-redis-editorial/research/brief.md) — real-topic research from the earlier workflow.
- [Current topic-asset example](docs/verification/1.1.0-alpha.1/example/report.md) — a controlled comparison using fictional supplied documents, with tags, source inventory, and independent review.
- [User guide](docs/using-harness-research.md) — more examples, source choices, and reuse.
- [Developer guide](docs/development.md) — helper interfaces, testing, and progressive context loading.
- [Architecture](docs/architecture.md) — the boundary between the skill, host, and local helper.
- [Verification record](docs/verification/1.1.0-alpha.1/README.md) and [release history](docs/releases.md) — tested behavior, versions, and coverage limits.

Harness Research adapts Anthropic's Knowledge Synthesis. The original source,
license, and adaptation notice are retained. [Attribution and licenses →](NOTICE.md)
