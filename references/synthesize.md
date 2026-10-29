# Synthesize for the reader

**Modified from Anthropic’s Knowledge Synthesis** at commit
`33eeda1e8fd856455b05479d13a0f85b5f803744`. This adaptation adds explicit evidence
relationships, conditional implications, reusable artifacts and independent
semantic review. The [unmodified source](../upstream/anthropic/knowledge-synthesis/SKILL.md)
and [Apache 2.0 license](../upstream/anthropic/LICENSE) are retained.

Use this stage after evidence is collected or when revising a report. Work from
the actual dossier and reader’s purpose, not a prescribed series of answers.
For collected workstreams, use the assembled registry's sources/facts unchanged;
preserve their real investigator authors. Deduplicate exposition, not immutable
source identity or contradictory evidence. Ask for registered follow-up evidence
when a new factual premise is needed. You may be the coordinator; the final
reviewer must still be a separate invocation.

With no intended use supplied, default to general-purpose topic research. Explain
what the topic is, its key concepts and findings, important perspectives or
tradeoffs, evidence limitations and open questions as relevant. The brief is a
prioritized general overview. Use headings suited to the topic; do not assume a
slide storyline, article argument or teaching sequence. This is a default framing,
not a compulsory section template.

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
   than source counts or forced section quotas. Preserve details that change an
   action or conclusion: a compatibility boundary, required conversion or exception
   is more useful than replacing it with “verify compatibility.” Cut repetition
   first; move supporting detail to the brief or evidence rather than erase it.
4. **Assess confidence in context.** Consider authority for this claim, relevant
   date/version, methodological quality, independence and disagreement. Freshness
   matters strongly for changing product behavior; age alone does not invalidate
   stable explanations. Avoid uncalibrated numeric confidence or a mechanical
   majority vote. Explain important uncertainty in ordinary language.
5. **Write a connected narrative.** Lead with the answer, then the explanation and
   evidence needed to assess it. Group by topic rather than by source. Preserve
   qualifiers next to the conclusion they constrain. Include concrete mechanisms
   or examples when they serve the purpose. For decisions, explain the conditions
   that change the choice; for blogs, explain the mechanism and strongest objection;
   for training, unpack unfamiliar concepts and a consequential misconception with
   a worked example when useful. These are choices, not required section templates.
   Label invented examples illustrative and keep their factual premises traceable;
   do not imply that an example was observed, benchmarked or tested.
6. **Shape the handoff.** Write a short editorial brief in the optional `brief`
   sections, led by the most consequential takeaway for the actual task. Select
   useful supporting evidence and preserve qualifications; leave the full fact
   inventory in the evidence appendix. Choose headings and order that help the
   next author, rather than repeating every finding or imposing a takeaway quota.
   A presentation may need key messages, a plausible storyline and evidence worth
   visualizing; a blog may need an argument, mechanisms and objections; training
   may need a concept sequence, misconceptions and grounded examples; a decision
   may need tradeoffs and conditions that reverse the choice. These are flexible
   research shapes, not finished slides, articles or lessons. For mixed uses,
   prioritize the primary task when supplied; otherwise make one useful general
   brief, not a separate deliverable for every possible use.

## Evidence relationships

Each finding has a title, a supported summary, supporting fact IDs, counterevidence
IDs and relevant implications, conditions and gaps. Separate three kinds of text:

- `summary`: what the cited evidence directly establishes.
- `inference`: a reasoned interpretation beyond direct statements. Explain the
  link and preserve alternatives. Correlation alone does not establish causation.
- `recommendation`: conditional advice grounded in evidence and the reader’s
  needs. State when it applies and when it does not.

Keep these types in the dossier and evidence trail. In the public report and
brief, make the distinction through natural wording: “the measurements suggest,”
“for workloads with this constraint,” or “this remains untested,” as appropriate.
The renderer does not add “Interpretation” or “Conditional recommendation” prefixes.
Avoid procedural labels on each paragraph, while keeping advice conditional and
uncertainty visible. Topic headings should tell the reader something useful.

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

The report and brief should supply the ingredients the stated purpose needs:
a clear takeaway, explanation, important comparison dimensions, concrete examples
where useful and implications with limits. Slides, articles and curricula remain
the responsibility of the downstream author.

Make each reusable finding understandable without reconstructing its evidence
chain. Select the strongest relevant supporting facts in `support`; include
material counterfacts in `counter` and explain in a referenced `conditions` or
`implications` block how they limit or could reverse the takeaway. A counterfact ID
alone is not an explanation. Keep release, workload, edition, measurement and
other qualifications that must survive compression next to the finding in its
`summary` or `conditions`. Include material unresolved questions in `gaps`.
Downstream authors should be able to tell what they can safely say and what they
must retain when shortening it. Do not manufacture a counterargument when none
is supported.

For comparisons, align every table row to one criterion. Distinguish known absence,
unverified availability and a version-specific difference. For recommendations,
include the conditions that could reverse the decision and the strongest supported
case for another path, including staying with the current option. Apply comparable
criteria to material alternatives; disclose uneven evidence rather than treating
one side's absent measurement as inferior performance. Preserve unattractive
findings even when the user favors a particular outcome. Equal space, source
quotas and artificial equivalence do not establish fairness.

Save the prose through [the dossier contract](synthesis-workflow.md), then arrange
[independent evidence and synthesis review](review-synthesis.md). A fluent report
is a draft until its actual saved revision is reviewed.
