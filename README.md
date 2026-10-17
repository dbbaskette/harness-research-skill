![Colorful source notes become a clear, connected research report.](docs/assets/harness-research-synthesis-banner.png)

# Harness Research

### Find the evidence. Connect the ideas. Keep the understanding.

A research **skill for your coding agent**. Ask about a topic, compare options, or
bring documents to examine. Get a saved, cited report that explains what matters,
why it matters, and where the evidence stops—ready to inform a presentation,
a blog, training, or a decision.

**[Start here](#your-first-research-report)** · **[What you get](#what-you-get)** ·
**[User guide](docs/using-harness-research.md)** · **[Setup](docs/setup.md)**

> **1.0 development preview.** This checkout contains the new synthesis-first
> implementation (`1.0.0-alpha.1`). It has not been published as a release.
> The published [0.9.5 release](https://github.com/dbbaskette/harness-research-skill/releases/tag/v0.9.5)
> uses the earlier question-oriented workflow. Use the preview instructions below
> to try this code; installing 0.9.5 will not give you the new behavior.

## Your first research report

You need **Node.js 20+** and an agent with source-reading/search tools, such as
Codex or Claude Code. The agent uses its existing tools and model access; there
is no separate research service or API subscription to configure. A checked report
also needs a separate agent invocation to review the evidence and synthesis.

### 1. Open a project for the output

Choose the content or code project where you want `research/report.md` saved.
For a first preview, use a new folder so existing research stays intact.

### 2. Point your agent at this checkout's skill

In Codex or Claude Code, use a prompt like this, replacing the first path with
your checkout's absolute path:

```text
Use the skill at /absolute/path/to/harness-research-skill/SKILL.md.
Use that checkout's local runtime and guidance for this preview.

Compare Valkey and Redis for an application engineering team considering
replacing Redis. Use public primary sources. Explain where replacement is
practical, where it is risky, and what we should verify before a migration.
```

The agent handles source collection, helper commands, writing and saving. You do
not need to prepare JSON, run npm commands, request citations, or ask it to write
the report afterward. If your host requests permission for an independent review,
allow it to complete the checked workflow.

**Already have a published installation?** Keep it for existing work. The preview
uses its explicit local path. [Install, update and version details →](docs/setup.md)

### 3. Open the result

The agent links **`research/report.md`**. Read the central answer, findings,
explanation, comparisons and limitations. Follow the evidence links when you want
to inspect the underlying source passages.

If source access or independent checking is incomplete, the saved output says so.
A draft is useful progress; it is not presented as a completed checked report.

## What you get

Research organized for understanding, with the audit trail close at hand.

| File | Use it for |
| --- | --- |
| `research/report.md` | The main answer, themes, findings, explanations and comparisons |
| `research/brief.md` | A concise starting point for the next writing or content task |
| `research/evidence.md` | Source passages and the factual support behind the report |
| `research/facts.json` | Structured evidence and synthesis for compatible tools (schema 2) |
| `research/output.json` | The saved revision, review status and artifact hashes |
| `research/sources/` | Pinned source text used for this result |

Questions guide the investigation. They do not force every report into Q&A.
A short factual check can stay short; a broad topic can become a coherent
explanation. A comparison uses named criteria rather than unrelated fact lists.

Read the [Valkey/Redis replacement report](docs/verification/1.0.0-alpha.1/valkey-redis/research/report.md):
a fresh trial with 14 primary sources, 28 facts and five synthesized findings,
independently checked against the original sources. The
[acceptance record](docs/verification/1.0.0-alpha.1/README.md) documents the results and limits.
Earlier [0.9 examples](docs/verification/0.9.0/README.md) document the previous
implementation and are not examples of this output contract.

## Start with your purpose

**Understand a topic**

```text
Research how retrieval-augmented generation works for software architects.
Explain the mechanisms, trade-offs, failure modes and evaluation choices.
Use public primary sources. This will inform a technical blog and training.
```

**Compare alternatives**

```text
Compare PostgreSQL and SQLite for a small internal application.
Cover deployment, concurrency and maintenance. Explain which constraints
change the decision, and leave unknown workload requirements visible.
```

**Work only from your documents**

```text
Use sources/product-brief.pdf and sources/release-notes.md only.
Check which launch claims they support, explain contradictions, and identify
what remains unknown. The audience is our technical enablement team.
```

After installing a published version, invoke **`$harness-research`** in Codex,
**`/harness-research`** in Claude Code, or ask your agent to use the named skill.
For this development preview, use the explicit checkout path above.

[More on scope, source choices and follow-ups →](docs/using-harness-research.md)

## Useful input for the work that comes next

- **Presentations:** prioritized findings, aligned comparisons and the caveats
  that belong with each message.
- **Blogs:** explanations, mechanisms, supporting evidence and counterarguments.
- **Training:** concepts, distinctions, limitations and material that can inform
  examples and exercises.

The next skill still owns the slides, prose or lesson design. A research report
is a derived artifact, not a new independent primary source. Structured consumers
must support schema 2 explicitly; [migration notes](docs/migration-v1.md) explain
what changes and what remains available.

## How it works

**Investigate → connect the evidence → write → independently review → save.**

The synthesis approach adapts Anthropic's
[Knowledge Synthesis](https://github.com/anthropics/knowledge-work-plugins/tree/33eeda1e8fd856455b05479d13a0f85b5f803744/enterprise-search/skills/knowledge-synthesis):
group related evidence, prioritize what the reader needs, preserve disagreement,
and lead with a useful answer. Harness adds scoped investigation, saved evidence,
independent review and durable output. [Attribution and licenses →](NOTICE.md)

The agent does the thinking. A local helper checks quotations and references,
pins source text, and ties review to the exact saved evidence. A different
invocation checks both the factual support and the conclusions drawn from it.
Source support is not a guarantee of truth or live currency.

The skill loads guidance **only when that stage needs it**. Investigation,
synthesis, checking and reuse have focused references; old queue instructions
are loaded only to resume old work.

![Progressive disclosure: load the entry and the relevant stage, not the entire instruction library.](docs/images/context-loading.svg)

[Architecture](docs/architecture.md) · [Evidence and limitations](docs/using-harness-research.md#evidence-and-review) ·
[Developer guide](docs/development.md) · [Release history](docs/releases.md)

<details>
<summary>For maintainers: measured instruction context</summary>

<!-- CONTEXT-USAGE:START -->
Measured with `cl100k_base`; cumulative instruction counts include a normalized
representative guidance-start response. Stage-only rows count their own reference.

| Reading path | Tokens |
| --- | ---: |
| Discovery metadata | 36 |
| Installed bootstrap | 574 |
| Bootstrap + current guidance entry | 1,225 |
| Investigator stage | 822 |
| Synthesis writer stage | 939 |
| Independent reviewer stage | 1,051 |
| New synthesis: coordinator entry and workflow | 3,375 |
| New synthesis: all stages in one context | 6,187 |
| Synthesis resume, verify or refresh | 1,953 |
| Legacy 0.9 queued coordinator | 4,956 |
| Legacy 0.9 reuse or refresh | 2,008 |
| Legacy explicit chat-only answer | 2,185 |
| Legacy manual saved research | 3,376 |
| Legacy manual status or resume | 1,786 |
| Legacy comparative routing only | 1,938 |
| Legacy Codex comparative outline | 2,898 |
| Legacy Codex add items | 2,103 |
| Legacy Codex add fields | 2,123 |
| Legacy Codex deep results | 2,786 |
| Legacy Codex deep results + saved evidence | 3,977 |
| Legacy Claude comparative outline | 2,915 |
| Legacy Claude deep results | 2,808 |
| Investigation + general web strategy | 4,694 |
| Investigation + academic strategy | 4,786 |
| Investigation + GitHub strategy | 4,581 |
| Investigation + technical Q&A strategy | 4,486 |
| Investigation + Chinese sources strategy | 4,711 |
| Legacy migration | 1,580 |

The new default starts with the entry and synthesis workflow. Investigation, writing
and independent review each load their own reference when needed. The all-stages
row shows their cumulative cost if read in one context; delegated stage rows are
separate contexts. Synthesis reuse does not load investigation or writing contracts
until new work is needed. Strategy rows add exactly one source strategy. Legacy
queue, manual and comparative paths remain available only for existing callers.
Source documents, evidence payloads, tool responses and conversation add separately.
The JSON output also exposes direct-checkout paths without bootstrap/start overhead.
<!-- CONTEXT-USAGE:END -->

Measurements describe instruction loading, not total model usage or cost.
Run `npm run context:update` after guidance changes and `npm run context:check`
to verify the generated table and map.
</details>
