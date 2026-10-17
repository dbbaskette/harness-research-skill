# Resume, reuse and refresh synthesis

Read this for an existing document-first report. Keep its original scope and source
permissions unless the user changes them. For a 0.9 question-queue run, use
[legacy reuse](reuse.md) and its saved guidance instead; schema 1 and schema 2 are
different contracts. Do not silently reinterpret one as the other.

## Resume the saved work

Resume the bootstrap task to recover its pinned runtime/guidance, then run:

```sh
node "<runtime>/scripts/harness-research.mjs" synthesis status --project DIR
node "<runtime>/scripts/harness-research.mjs" synthesis verify --project DIR
```

Read `research/report.md`, the dossier input and the returned status. Draft work
continues from its actual open evidence/review tasks. A verified bundle has matching
files; only its recorded independent review establishes its reviewed state.
Missing or modified artifacts need repair from the authoritative dossier and a
new save/review where the digest changes. Never edit a generated report and keep
claiming the previous bundle is verified.

If new guidance is explicitly adopted, disclose the change and recheck conclusions
affected by changed review rules. A newer installed release does not retroactively
alter a pinned task’s instructions or evidence.

## Use the report as source material

Start with the report and brief; inspect `facts.json` schema 2 and `evidence.md`
when traceability matters. Findings preserve supporting facts, counterevidence,
implications, conditions and gaps. Carry these qualifications into downstream
presentations, blogs and training. A downstream author’s new interpretation is
not covered by the research report’s old review.

Preserve IDs when meaning is unchanged and reference the dossier digest when
recording an external handoff. A source hash proves saved bytes are unchanged;
it does not establish that an upstream website or product is unchanged. A
previously supported claim may be unsuitable for a different audience, workload,
version or purpose. Reassess those assumptions before reusing a recommendation.

## Refresh selected evidence

When the user requests current information, inspect the relevant live sources
using authorized tools. Save new captures with access dates and versions. Compare
meaning as well as bytes. Keep historical copies when they explain a change;
do not silently replace a quotation while preserving its old approval.

Update affected facts, findings, prose and comparison cells. Resolve a gap only
to the extent the new evidence supports; a compound gap may remain partly open.
Save the revised dossier. A new save invalidates the previous review; arrange an
independent review of the saved revision using [review synthesis](review-synthesis.md).
The current runtime reviews the complete dossier rather than promising selective
carry-forward of semantic approvals.

A report marked `stale` must not be handed off as current reviewed research.
When refresh is blocked, retain the older artifact with its date and explicit
limitation. Do not infer currency from an unchanged local file or cached manifest.
