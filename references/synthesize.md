# Synthesize for the reader

**Modified from Anthropic’s Knowledge Synthesis** at commit
`33eeda1e8fd856455b05479d13a0f85b5f803744`. This adaptation adds explicit evidence
relationships, conditional implications, reusable artifacts and independent
semantic review. The [unmodified source](../upstream/anthropic/knowledge-synthesis/SKILL.md)
and [Apache 2.0 license](../upstream/anthropic/LICENSE) are retained.

Use this stage after evidence is collected or when revising a report. Work from
the actual dossier and reader’s purpose, not a prescribed series of answers.

## From evidence to explanation

1. **Deduplicate meaning.** Merge accounts of the same fact while retaining useful
   details and source lineage. Similar text, author, timing, entity or explicit
   cross-reference can identify copies. Prefer the fullest relevant context for
   exposition. Preserve different conclusions, viewpoints, versions and periods.
   Repetition across channels does not create independent corroboration.
2. **Cluster by theme.** Group related facts from different sources into findings.
   Useful themes may explain a mechanism, consequential tradeoff, changing state
   or decision boundary. A source title or research question is not automatically
   a useful section. Keep a short factual answer short when synthesis adds nothing.
3. **Rank for relevance.** Lead with what changes the reader’s understanding or
   action. Omit irrelevant discoveries from the narrative while keeping their
   evidence record where useful. Match detail to complexity and purpose, rather
   than source counts or forced section quotas.
4. **Assess confidence in context.** Consider authority for this claim, relevant
   date/version, methodological quality, independence and disagreement. Freshness
   matters strongly for changing product behavior; age alone does not invalidate
   stable explanations. Avoid uncalibrated numeric confidence or a mechanical
   majority vote. Explain important uncertainty in ordinary language.
5. **Write a connected narrative.** Lead with the answer, then the explanation and
   evidence needed to assess it. Group by topic rather than by source. Preserve
   qualifiers next to the conclusion they constrain. Include concrete mechanisms
   or examples when supported; label an invented teaching example as illustrative.
6. **Make detail available.** The report serves the reader; the evidence appendix
   serves inspection. Use the brief to preserve useful findings, implications,
   conditions and gaps for later authors. Do not bury the answer under process
   metadata or repeat the entire evidence inventory in prose.

## Evidence relationships

Each finding has a title, a supported summary, supporting fact IDs, counterevidence
IDs and relevant implications, conditions and gaps. Separate three kinds of text:

- `summary`: what the cited evidence directly establishes.
- `inference`: a reasoned interpretation beyond direct statements. Explain the
  link and preserve alternatives. Correlation alone does not establish causation.
- `recommendation`: conditional advice grounded in evidence and the reader’s
  needs. State when it applies and when it does not.

Use `gap` for unresolved questions. Do not disguise missing evidence as a negative
fact, or imply that a gap was exhaustively investigated when it was not. Findings
can include both strong support and unresolved boundaries. Preserve counterevidence
in the report when it materially limits its recommendation.

Every substantive paragraph needs a traceable fact or finding reference. A citation
at the end must support the whole claim, including causal language and qualifiers.
A citation to a finding must still resolve to its underlying evidence. Do not
force prose into tiny answers: coherent multi-sentence blocks are welcome when
their references support all their material claims.

## Useful downstream input

The report and brief should supply the ingredients presentations, blogs and
training need: a clear takeaway, explanation, important comparison dimensions,
concrete supported examples and implications with limits. Include these where
the topic supports them; avoid manufacturing a compulsory set of each. Slides,
articles and curricula remain the responsibility of the downstream author.

For comparisons, align every table row to one criterion. Distinguish known absence,
unverified availability and a version-specific difference. For recommendations,
include the conditions that could reverse the decision. Preserve unattractive
findings even when the user favors a particular outcome.

Save the prose through [the dossier contract](synthesis-workflow.md), then arrange
[independent evidence and synthesis review](review-synthesis.md). A fluent report
is a draft until its actual saved revision is reviewed.
