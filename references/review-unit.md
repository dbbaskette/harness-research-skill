# Review one unit of a saved dossier

Read this with [the independent review guide](review-synthesis.md) when the host
gives you one review unit instead of the whole dossier. Every standard there
applies unchanged; only the scope of what you attest is smaller. You must be a
separate invocation that wrote none of the dossier's evidence or prose, and you
answer for one unit only.

## What you own and what you are given

Your assignment (from `review-units assign`) lists `owns` and `given`.

- **Owned** items are yours to judge: the original of each owned source, each
  owned fact, finding and prose block, and, for the final unit only, the
  whole-dossier assessment. Your answer covers each of them exactly once.
- **Given** items are there to read, not to attest: the sources an owned fact
  cites when another unit owns them, the facts and findings an owned finding or
  block refers to, and their sources with capture files and hashes. Read them as
  carefully as the chain of support requires. Never add them to your answer.

If an owned claim is weaker because given evidence is wrong or out of scope, say so
in the owned item's verdict and note. The unit that owns the given item judges it.

## Fill the template

Use the template the host gives you (`review-units template`). Keep `plan`,
`digest`, `unit`, `attempt` and `reviewer` exactly as given; they bind your answer
to the saved content and to your registration. For each owned source, keep both
hashes and set `read_original` to `true` only after inspecting that original;
otherwise set it to `false` with a concrete `access_error`. Verdicts are
`supported`, `narrow` or `unsupported`, each with a note on what you checked.

A content unit attests each owned item against its exact sources only. You are not
shown neighbouring prose and attest nothing about it, about the order of items, or
about a comparison row as a whole.

The final unit owns the assessment and any prose that cites nothing. Its assignment
carries the whole saved `dossier`, every comparison row whole: read the report and
brief as a whole and judge coverage, usefulness, consistency between items and their
order as the review guide describes. A content unit has no assessment.

Return the filled JSON to the host, which records it; do not register yourself or
change any saved file. A unit answer that omits an owned item, attests a different
hash, or answers for another unit is refused, as the single review would be.
