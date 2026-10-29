# Independently review evidence and synthesis

Read this only when checking a saved dossier or addressing review findings. Review
the actual saved digest, not a remembered draft. You must be a separate invocation
that authored none of this dossier’s evidence or writing. The runtime also rejects
a reviewer matching the save worker or any fact author. Reusing another name in
the same context does not qualify.

## Establish what you reviewed

Run `synthesis status --project DIR --compact` for the state and digest, then
`synthesis template --project DIR --out research/review.json` to create the pending
review object with every required fact, finding and prose ID. Without `--out`,
template prints that object. Never overwrite an existing review input. The full
status response (without `--compact`) remains available with source hashes and
`review_template`. Use the generated template rather than guessing review IDs. The full status source records provide both the pinned capture
and its original working file. Read the actual source material, surrounding
qualifications, facts and report; inspect originals for supplied documents where
extraction could lose meaning. A saved web capture establishes what was read at
capture time, not what the live page says now.

When a source has `original_file`, the template also includes `original_sha256`.
Inspect the original document as well as its readable extraction, retain both
hashes exactly, and do not attest to the original by reading only the extraction.

`read_original: true` attests that you actually inspected the corresponding source
material. A matching hash or the researcher’s quoted fragment alone cannot justify
that attestation. If access is impossible, set that source’s `read_original` to `false` and provide
a concrete `access_error`; record objections for dependent claims and leave the
report incomplete. If context is inadequate, explain that limit in the relevant
verdicts. Do not manufacture a passing review.

## Factual review

For every fact, check that exact quotations exist and the assertion follows from
the surrounding source, including numbers, releases, editions, dates and conditions.
Identify circular support, marketing presented as demonstrated behavior, omitted
qualifiers and conflated products. Resolve the subject and scope of each supporting
clause: an exact quote in an adjacent sentence may concern another edition or
condition. Do not join them into a broader claim. Distinguish explicit statements
from reasonable but additional inferences. Search for contradictions when a
material claim requires it, within the authorized source scope. A fresh relevant source may
require a revised dossier and new digest before it can support completion.

Use `supported` only when the full claim is supported. Use `narrow` when support
exists for a smaller statement and explain the restriction; use `unsupported`
otherwise. These are objections for the author to resolve, not permission to
silently rewrite the report while asserting you reviewed the old digest.

## Semantic review

For each finding and prose block, inspect its entire reference chain. Is the text
a fair synthesis rather than a larger claim than its facts support? Are causal
claims established, interpretations distinguishable in natural language and
recommendations conditional? Are contradictions and consequential unknowns
visible beside the conclusions they limit? Are repeated sources mistaken for independent confirmations?

Review every comparison cell against its named criterion, compatible versions and
matching units/conditions. Verify that “no evidence” has not become “no capability.”
Read the report as a whole as well: does it answer the user’s actual request, explain
what matters and support downstream authors? Is its coverage honest? Repetition,
question-by-question dumping, a missing central explanation or a misleading
headline can justify `needs-revision` even when each isolated fact is accurate.

Check the saved brief as well as the report. Does its ordering make the most
consequential takeaway easy to find, and does its shape serve the actual task?
Can a downstream author understand the supporting evidence, why a counterargument
matters and which qualifications must survive shortening? Has synthesis discarded a consequential detail already
present in the evidence in favor of generic advice to verify it? Does the depth
serve the recorded purpose, with illustrative examples clearly separated from
observations? Are procedural labels and repeated evidence inventories obscuring
the explanation? A brief should prioritize without removing qualifications or
forcing an arbitrary number of takeaways. Assess the strongest supported case for
relevant alternatives and the status quo where applicable; one-sided evidence needs an explicit limit, not
an artificial balance of sources or prose. Record overall handoff shortcomings in
`assessment.usefulness`, and objections to specific content against its finding
or prose ID.

Support checks and usefulness are separate. Do not claim a benchmark, exhaustive
coverage or successful migration because a report recommends one. A factual
paragraph can still be irrelevant, confusing or insufficient for the task.

## Submit the review

The review object is:

```json
{
  "schema": 2,
  "digest": "DIGEST_FROM_STATUS",
  "originals": [{"source": "source-id", "sha256": "HASH_FROM_STATUS", "read_original": true}],
  "facts": [{"id": "fact-id", "verdict": "supported", "note": "What was checked"}],
  "findings": [{"id": "finding-id", "verdict": "supported", "note": "What was checked"}],
  "prose": [{"id": "section-id:0", "verdict": "supported", "note": "What was checked"}],
  "assessment": {"coverage": "accurate", "usefulness": "adequate", "note": "Overall assessment and limits"}
}
```

This illustrates fields, not a passing default. Populate every entry returned by
`review_template`; finding/prose verdicts also allow `narrow` and `unsupported`.
Assessment alternatives are `needs-revision`. Authored brief prose IDs are
`brief:SECTION_ID:BLOCK_INDEX`. Comparison prose IDs are
`comparison:COMPARISON_INDEX:ROW_INDEX:CELL_INDEX`; all indexes are zero-based.
Review each brief block's references and qualifications just as report prose;
a review that omits authored brief blocks is incomplete. Use the runtime’s IDs
and source hashes exactly.

Save `research/review.json`, then run:

```sh
node "<runtime>/scripts/harness-research.mjs" synthesis review --project DIR --file research/review.json --worker CHECKER
```

If anything needs changing, return specific objections. The author revises and
saves a new dossier; old review approval cannot be transferred to that digest.
Conclude with the actual status, not an unsupported “looks good.” If your ability
to inspect evidence is limited, state that limitation plainly.

## Topic assets and collected evidence

Use the actual paths returned by the helper: a topic asset holds `report.md`,
`brief.md` and `evidence.md` directly, while existing cases keep their `research/`
layout. Inspect the final saved dossier, not merely investigator summaries or
packet acceptance status. Your invocation must differ from the final save author
and every fact investigator. Collection receipts and structural acceptance are
not prior semantic approval. Verify preserved source context, permissions and
contradictions across workstreams before assessing final coverage/usefulness.
`topic.json` tags and the full supplied-source inventory aid discovery; they do
not certify unused or inaccessible material as evidence.
