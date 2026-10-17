# Using Harness Research

[README](../README.md) · [Setup](setup.md) · [Architecture](architecture.md)

This guide covers the **1.0 development preview**. For a published 0.9 installation,
use the [legacy guide](legacy-using-harness-research.md). A preview checkout must
be selected explicitly; the installed bootstrap continues to select stable releases.

## Begin with what you need to understand

Tell your agent the topic, audience and purpose, plus any source restrictions.
The skill infers reasonable framing when these are clear and asks only when
missing information would materially change the investigation.

```text
Use the skill at /absolute/path/to/harness-research-skill/SKILL.md with its
local runtime. Research Valkey versus Redis for engineers considering Redis
replacement. Use public primary sources. Cover where migration is practical,
which dependencies make it harder, and what to test before switching.
```

You can specify a concise brief or a deeper investigation. Depth changes the
amount of useful investigation, not a compulsory source or question count.
An agreed brief from another content skill can supply the audience and purpose.
The research request does not authorize publication, migration or deployment.

## Choose the source boundary

| Ask for | The agent may do |
| --- | --- |
| Public primary sources | Search and read public original documentation, code, standards or other primary material |
| Only named files or links | Read those selected references and report limitations without expanding the source set |
| Named documents plus public sources | Read selected material and supplement it with permitted public research |

The agent saves readable source context with its origin, publisher, dates and
limitations where available. Search snippets and model summaries are leads, not
original evidence. Partial captures, inaccessible sources, transcriptions and
uncertain versions must remain visible. Source selection does not promise offline
execution: your host and model provider determine how documents are processed.

## Read the result

Open `research/report.md`. A useful report leads with its answer and important
findings, then explains the evidence, implications, counter-evidence and limits.
Comparison tables use named criteria and explicitly identify missing information.
The shape varies with the request; an explanatory article need not mimic a
product comparison or a checklist of research questions.

`research/brief.md` is the short handoff. `research/evidence.md` contains the
inspectable facts and source passages. `facts.json` and `output.json` serve
compatible structured consumers; their schema and hashes matter when moving or
reusing the work. Saved files are the deliverable, not a promise to write later.

Read the displayed status and review information before relying on the result.
An unreviewed draft, a review requiring revision, and stale evidence are not a
completed checked result. Known, clearly assessed gaps may remain in a completed
report; completion does not mean every real-world question has an answer.

## Evidence and review

The researcher collects source-supported assertions. The writer connects those
assertions into findings and an explanation. A different invocation checks the
originals, the assertions and the report's reasoning.

Three judgments remain separate:

- Does the source support the assertion in context?
- Is there independent corroboration, or repeated reporting of the same evidence?
- Do those assertions justify the report's interpretation or recommendation?

The helper checks exact quotations, references, saved revisions and review
identity. It cannot determine truth or prove that an agent honestly read a source.
A review is an explicit assessment, not a numerical confidence guarantee.
Unsupported findings must be removed or revised and reviewed again.

If independent review is unavailable, the agent saves a clearly labeled draft and
explains the limitation. It cannot change its name to count as another invocation.
A missing source becomes a named limitation, not an invented fact.

## Useful follow-ups

```text
Make the central explanation easier for developers new to this topic.
Keep the same evidence boundary and preserve the important caveats.
```

```text
Which conclusions depend on assumptions about our workload? Separate the
questions we must answer internally from those public research can resolve.
```

```text
Revisit the evidence for this report before we use it in a presentation.
Check versions and changed sources, and review any changed conclusions.
```

Editing evidence or synthesis invalidates the old review. The agent saves a new
draft and obtains a review bound to that exact content. A local integrity check
does not contact websites or establish that an intact snapshot is still current.
Live refresh requires the agent to read permitted originals again.

## Feed presentations, blogs and training

Give the next skill the report and brief, preserving access to the evidence.
A finding can suggest a slide message; a mechanism can anchor a blog explanation;
a distinction can inform a lesson. The content skill remains responsible for its
own structure, voice, examples and learning outcomes.

Keep hypothetical examples labeled. Do not turn an inference into an asserted
fact, or cite the generated report as a second independent source. Consumers
using structured data need a deliberate [schema-2 integration](migration-v1.md).

## Existing research and recovery

A 0.9 queue retains its original commands, evidence rules and saved guidance. Do
not start the new engine over the same `research/` output. Resume the old run with
its runtime, or create a separate project for new research. The new helper refuses
conflicting output ownership rather than silently converting it.

For a new-format project, ask the agent to inspect synthesis status, correct any
reported source or review problems, and continue from the saved dossier. An
interrupted export can be regenerated from saved state; a changed source needs
reassessment. [Developer commands and contract](development.md)
