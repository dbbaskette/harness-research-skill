# Using Harness Research

[README](../README.md) · [Setup](setup.md) · [Architecture](architecture.md)

This guide covers **Harness Research 1.1.0**: local topic assets, source-directory
and URL-list intake, and optional bounded parallel investigation. Existing saved
cases retain their original layout, pinned runtime and guidance. For 0.9, use the
[legacy guide](legacy-using-harness-research.md).

## Begin with what you need to understand

Tell your agent the topic, audience and purpose, plus any source restrictions.
The skill accepts purpose in ordinary language: “help us choose,” “background for
a blog,” or “teach this to new engineers.” It infers reasonable framing from your
request and asks only when missing information would materially change the
investigation. With no intended use or studio task, the default is **general-purpose topic
research**: key concepts, findings, perspectives, practical implications and
uncertainties, organized for understanding rather than a specific content format.

```text
Use Harness Research to research Valkey versus Redis for engineers considering Redis
replacement. Use public primary sources. Cover where migration is practical,
which dependencies make it harder, and what to test before switching.
```

You can specify a concise brief or a deeper investigation. Depth changes the
amount of useful investigation, not a compulsory source or question count.
Purpose also changes the explanation: a decision needs concrete constraints and
the strongest case for alternatives; a blog needs mechanisms and counterarguments;
training may need a worked example and common misconceptions. Examples derived
for teaching are labeled illustrative rather than presented as tested results.
The report and brief can change shape as well: a presentation task can emphasize
key messages and evidence worth visualizing; a training task can sequence concepts.
These are flexible emphases, not mandatory templates. An agreed brief from another
content skill can supply the audience and purpose. If you name multiple uses,
specify a primary one when it matters; otherwise research produces one useful
general brief rather than a separate deliverable for each use.
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

## Supply one input directory

```text
inputs/my-topic/
  documents/
    background.pdf
    requirements.md
  urls.txt
```

Point the agent at the directory and give the topic in ordinary language. The
optional `urls.txt` contains one HTTP(S) URL per nonblank line; comment lines start
with `#`. A separate URL-list path and individual file/URL inputs also work.

Intake preserves originals and records every supplied reference, including
unsupported documents, invalid URLs and inaccessible or unused sources. PDF/Office
reading still depends on the agent’s actual tools. Retained original bytes are not
a completed text extraction. The selected source boundary continues to govern:
passing a directory does not authorize wider public research.

## Local topic assets

New standalone work defaults to `research/<topic>/` in the current working directory.
Inside it, `topic.json` carries the stable identity, title, description and tags;
`sources.json` is the supplied/discovered source inventory. `documents/` retains
originals and `sources/` contains readable captures and evidence snapshots.
`asset-manifest.json` hashes the complete portable handoff, including metadata and
unused retained inputs. `output.json` remains the reviewed research manifest;
a valid asset hash does not semantically approve tags or unused source entries.
No studio, Git repository or central library is needed.

A studio may provide a different local destination. Harness Research writes and
verifies the local asset; the studio controls its shared repository and sync.
Local research status and sync status are distinct. Reusing a shared asset means
referencing its identity and reviewed digest; consumers adopt later revisions
explicitly rather than having their evidence change underneath them. Tags and
metadata titles are discovery labels. For a different topic, audience, purpose or
source permission, the agent creates an explicit asset variant with a distinct
destination rather than changing the recorded request underneath consumers.

## Read the result

Open the returned `report.md` inside the topic asset. Existing cases keep
`research/report.md`. A useful report leads with its answer and important
findings, then explains the evidence, implications, counter-evidence and limits.
When useful, comparison tables use named criteria and explicitly identify missing
information. Comparisons examine the strongest supported case for alternatives,
including staying with the current option, without forcing equal source counts.
The shape varies with the request; an explanatory article need not mimic a
product comparison or a checklist of research questions.

`brief.md` is the short editorial handoff, ordered for the stated task.
It leads with the most consequential takeaways and selects useful evidence,
material counterarguments, qualifications to retain when shortening the message,
and unresolved gaps. There is no compulsory number of takeaways. The full fact
inventory stays in the evidence appendix. Older dossiers without authored brief
sections keep their automatic findings view. `evidence.md` contains the
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

## Optional parallel investigation

For a broad topic with independent themes, the agent can coordinate at most three
native investigators within the host’s capacity and your limits. Workers collect
bounded evidence packets; one coordinator assembles them and writes a coherent
report. Questions do not become a compulsory Q&A outline. Actual investigator
authors, source permissions, original documents and contradictions survive assembly.

The helper does not launch models or manage provider accounts. The host controls
worker execution, supported budget accounting and cancellation. Small topics or
restricted hosts can investigate sequentially. Independent review still needs a
separate invocation; unavailable review produces a saved draft. Pausing can retain
checkpoints; retries target affected workstreams rather than repeating sound work.
The [coordination contract](../references/parallel-research.md) explains details.

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

A studio can send its actual task in natural language instead of asking research
to guess how its output will be used. For example:

```text
Research Valkey versus Redis for a 20-minute technical presentation to application
architects considering Redis replacement. Help the audience distinguish practical
migration candidates from workloads that need a deeper compatibility assessment.
Prioritize the key messages and evidence we could explain visually, keeping
version and workload qualifications beside each takeaway. Use public primary
sources. Return the saved research report and brief for presentation authoring.
```

Research records that task in `purpose`, with the audience, scope and source
permissions in their existing fields. It adapts the report and brief through
editorial judgment; no format code, keyword parser or mandatory intake form is
needed. A blog or training studio can pass its own task in the same way.

Give the next skill paths to the report and brief, access to the evidence, the
actual status and the saved digest from its returned `output.json`. A presentation
can use the key messages; a blog can develop the mechanism; training can build
on the concept sequence. The content skill remains responsible for its structure,
voice and learning outcomes. The [studio handoff reference](../references/studio-handoff.md)
describes the request and artifact return contract.

Keep hypothetical examples labeled. Do not turn an inference into an asserted
fact, or cite the generated report as a second independent source. This request
contract does not automatically wire installed studios to the new runtime.
Existing adapters using legacy planning/recording commands must be migrated
explicitly; consumers using structured data need a deliberate
[schema-2 integration](migration-v1.md).

## Existing research and recovery

A 0.9 queue retains its original commands, evidence rules and saved guidance. Do
not start the new engine over the same `research/` output. Resume the old run with
its runtime, or create a separate project for new research. The new helper refuses
conflicting output ownership rather than silently converting it.

For a new-format project, ask the agent to inspect synthesis status, correct any
reported source or review problems, and continue from the saved dossier. An
interrupted export can be regenerated from saved state; a changed source needs
reassessment. In the development runtime, repair preserves replaced files under
`.harness-research/output-backups/` and returns their paths. Ask the agent to bring
useful editorial changes into the dossier and save/review them; directly editing
a generated report does not update its reviewed source of truth. [Developer commands and contract](development.md)
