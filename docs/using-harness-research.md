# Using Harness Research

[← README](../README.md) · [Setup & updates](setup.md) · [Developer guide](development.md)

This guide describes the **0.9.0 preview**. Version 0.8.1 retains the earlier
manual workflow; see [version choices](setup.md#choose-your-version).

## Start with the question and the boundary

Open the project where the report should live. Tell the agent what you want to
learn, who will use the result, and which sources it may use. A useful request
might be:

```text
$harness-research Compare PostgreSQL and SQLite for a small internal application
maintained by a two-person team. Use public primary documentation. Cover deployment,
write concurrency, backups, and maintenance. Keep unresolved questions visible.
```

Use `/harness-research` in Claude Code. In Cursor, start with “Use the
harness-research skill…” and give the same brief. The skill uses your agent's
configured model, document tools, search tools, and permissions.

The agent owns intake, planning, source reading, task coordination, JSON, and
helper commands. You should not need to prepare a queue file to ask a question.
Research normally ends with the saved report and a link to it. It does not
automatically proceed to making slides, publishing, or another deliverable.

## Choose the sources

| Source boundary | How to ask | What it permits |
| --- | --- | --- |
| Selected documents only | “Use only `sources/brief.pdf` and `sources/notes.md`.” | Reading those references and reporting their limits. No additional public research. |
| Selected links only | Name the URLs and say “Use only these pages.” | Reading those selected pages without expanding to other web sources. |
| Public research | “Use public primary sources.” | Finding and inspecting public sources through the harness's tools. |
| Documents plus public research | Name the files and explicitly allow public sources. | Using selected material first, then permitted public evidence. |

Put selected files in your project, or attach them if the harness can access the
attachments. The agent may copy selected originals into the project so later
checks can refer to the same revision. PDFs, Word documents, slide decks, and
web pages depend on the harness's ability to read them; the Node helper itself
does not extract these formats.

The agent saves the source's own readable wording and records where it came
from. Short, incomplete, or tool-limited captures are labelled as partial, with
a reason. Chart or scan transcriptions are identified. Unreadable material stays
a gap rather than becoming invented evidence. A search snippet or generated
summary alone is not an inspected original.

“Supplied only” is a source-selection rule. The helper stores research locally;
your harness and model provider still govern how document content is processed.
It is not an offline or air-gapped execution promise.

## Prompts to start from

### Compare options

```text
$harness-research Compare Redis and Valkey for our application team.
Start with sources/requirements.md and sources/vendor-notes.pdf, then use public
primary sources. Focus on licensing, compatibility, persistence, and operations.
Separate version-specific evidence from broader claims.
```

### Research a topic

```text
$harness-research Explain how database connection pooling works for backend
developers new to the topic. Use public primary documentation. Cover the problem,
pool sizing considerations, transaction behavior, and common failure modes.
```

### Check claims in your files

```text
$harness-research Check the claims in drafts/launch-deck.pptx against
sources/product-brief.pdf and sources/release-notes.md. Use only those references.
For each claim, show whether it is supported, contradicted, or insufficient.
```

The deck is the claim target. It does not become its own supporting evidence.
The agent keeps the exact claim text and target revision separate from the
selected evidence. Changes to the target invalidate the old assessment.

### See the plan before research proceeds

```text
$harness-research Plan research on software supply-chain security for our
engineering managers. Use public primary sources. Show me the proposed scope
and questions, then stop before researching them.
```

After reviewing the saved plan, ask the agent to continue with it or revise it.
This is an optional boundary you choose; it is not an extra approval step added
to every research request.

### Ask for deeper checking

```text
$harness-research Research PostgreSQL backup and restore approaches in depth.
Use public primary sources and deep depth. Include operational tradeoffs and
an independent review of the written answers.
```

### Continue the work

```text
$harness-research Continue the saved research in this project.
Check for changed inputs, explain the remaining gaps, and complete the open tasks.
```

For an explicitly chat-only answer, say so. Otherwise saving the cited report is
the default, even when you are using Research on its own without Brand or a studio.

## Choose the depth

Depth changes how much evidence can be retained and how review is organized. It
does not establish a fixed runtime, cost, or guaranteed level of factual accuracy.

| Depth | Fact checking | Written-answer review | Useful when |
| --- | --- | --- | --- |
| **Light** — default | A separate checker assesses each section's questions. | Citation/number validation; no separate semantic prose review. | A focused research request or first pass. |
| **Standard** | Separate question-level checks, with a higher candidate-fact allowance. | An independent reviewer checks answers and headlines against the facts. | You want prose review as well as fact checking. |
| **Deep** | Question-level checks with the largest candidate-fact allowance. | Independent prose review. | The brief calls for a more extensive evidence set. |

The plan fits the request. Light guidance suggests around twenty questions for a
broad topic; a narrow question or fixed claim list should stay smaller. Every run
has at most eighty questions, including its single bounded gap-filling round.

Checking requires a separate invocation that did not research the assigned
questions. It may use the same model and can run sequentially. Follow your host's
permission rules for starting agents. If this cannot happen, the workflow saves
a blocked partial report rather than labelling the research independently checked.

## What happens during a run

1. **Read and plan.** Inspect selected references, establish the scope, and turn
   the brief into sections and answerable questions. Comparisons name subjects.
2. **Research.** Gather candidate statements with source quotes, locations,
   dates, and concrete coverage gaps.
3. **Check independently.** Read original context, confirm support, narrow
   overbroad claims, or reject unsupported statements. Assess unanswered questions.
4. **Cross-check.** Merge duplicate assertions while preserving identities,
   retain conflicts, mark superseded facts, and identify missing angles.
5. **Fill gaps once.** Research and check the selected follow-up questions.
6. **Write.** Produce cited headlines and answers from confirmed facts, with
   explicit gap answers where the evidence is insufficient.
7. **Review prose when required.** Standard and deep use a separate writing
   reviewer. Light discloses that this stage was omitted.

The helper checks exact source revisions, quote placement, numeric presence, and
valid citation references. Semantic support still depends on the agents reading
the evidence well. An independently checked fact is not a certificate that a
publisher is truthful or a live page remains current.

## Read the result

Start with **`research/report.md`**. It follows the plan's questions and includes
the facts and source quotes behind the answers. Comparisons show subjects' facts
side by side. It records gaps, conflicts, rejected facts, and failed tasks.

| File | What it is for |
| --- | --- |
| `research/report.md` | The readable deliverable and its evidence. |
| `research/facts.json` | Structured sources, assertions, citations, checks, coverage, aliases, revisions, and gaps. |
| `research/brief.md` | Current checked facts with keys, plus gaps, conflicts, and run status, for downstream context. |
| `research/plan.md` and `research/plan.json` | The scope, sections, subjects, and questions. |
| `research/output.json` | The shared run/output revision and hashes of the five exported files. |
| `.harness-research/research-run.json` | Internal task state for the checked workflow. |
| `.harness-research/research.json` and `research-report.md` | Compatibility record/report used by older callers. |

Source files are retained in the project at their registered paths. The
`.harness-research/` directory also holds guidance pins and history. Keep this
state and the referenced sources if you want to resume and inspect the research.
The visible report alone is useful to read, but is not the whole resumable run.

### Understand the status

| Status | Meaning |
| --- | --- |
| `in-progress` | Required work is still open. The saved report is partial. |
| `complete` | The required stages finished without recorded coverage limitations. |
| `complete-with-gaps` | Required stages finished; unanswered questions or source limits remain visible. This is an honest completed assessment, not a promise that every question was answered. |
| `blocked` | An execution problem prevents remaining work, such as an unavailable checker or exhausted task attempts. |
| `stale` | Registered sources or pinned inputs changed. Current use needs reassessment. |

Question coverage is separately recorded as `answered`, `partly answered`, or
`not answered`. Claim checks also record `supported`, `contradicted`, or
`insufficient`. A missing answer and a crashed worker are different conditions.

Recorded development examples show both outcomes:

- [Public PostgreSQL/SQLite comparison](verification/0.9.0/public/research/report.md):
  eight checked facts, with explicit excerpt and source-date limitations.
- [Synthetic AsterDB/BirchDB comparison](verification/0.9.0/supplied/research/report.md):
  four checked facts and two assessed gaps about retention periods.

These archives preserve the original trials. The public example predates the
current explicit partial-capture registration rule; it is not a new acceptance
run of every current feature. See [verification notes](verification/0.9.0/README.md).

## Continue or recover a run

Resume in the same project. The agent uses the saved run, runtime, and guidance
task, checks its status, and continues eligible work. You do not need to remember
lease tokens or supply a new plan merely to inspect progress.

- **Interrupted chat or save:** durable state is kept. Status regenerates derived
  exports from that state and restores a consistent manifest.
- **Changed source or target:** status becomes stale. Current checked facts are
  excluded from the brief. In 0.9.0, start a new run to reassess the changed inputs;
  there is no automatic `research refresh` command.
- **Failed task:** other independent tasks at that stage can continue. The agent
  addresses the cause and explicitly retries exhausted work.
- **No independent checker:** keep the partial report and the execution block,
  or continue using an authorized separate invocation.
- **Different runtime or instructions wanted:** explicitly adopt a new guidance
  task; old work keeps its pins until that decision is made.

The helper retains previous records in `.harness-research/history/` when starting
another run. Keep the same registered source files unchanged while finishing one.

Cross-project reuse, approval, automated refresh, and standalone verification
commands are later milestones. You can read or share the saved report today;
that does not imply those library-management commands already exist.

For mechanics, see the [task/evidence contract](../references/research-run.md).
For setup failures, use [troubleshooting](setup.md#troubleshooting).
