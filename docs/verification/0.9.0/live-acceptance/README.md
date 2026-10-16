# 0.9.0 live acceptance

**The owner accepted 0.9.0 for release and ongoing-use refinement. Formal human
sampling is incomplete; no measured semantic acceptance pass is claimed.** The native
implementation gate passed: [88 tests, zero failures or skips](../ci-acceptance-fixes/verification.json),
plus dependency audit, context, installer and installed-version checks.

These trials exercise the skill with actual Claude Code and Codex researchers,
separate actual checker contexts, saved reports and reopening of the outputs.
All 13 eligible report cases are saved and complete; the two excluded LLM
attempts are preserved separately. They do not turn model judgments into human
review. The
[release criteria](../../../superpowers/specs/2026-10-15-research-with-agents-design.md#acceptance-better-than-today-measured)
require a person to inspect sampled evidence and compare report usefulness.

## Requests and results

The [machine-readable matrix](matrix.json) records run IDs, exact output hashes,
question/fact/gap counts, available measurements and fixed sample denominators.
Baseline findings were split into atomic assertions before sampling: a new fact
is not compared with an entire old summary.

- **Broad LLM report:** the same approved eight sections and 22 starting questions
  in the 0.8.1 Claude baseline and both new harnesses. Public primary sources only.
  Corrected candidates disclose reuse of authored primary candidate notes and
  captures; checking, bounded follow-up and writing were fresh. Their timings
  are not cold-start comparisons with the baseline.
- **Redis vs Valkey:** the same two PDFs and two selected links in the old Claude
  baseline, new Claude light/deep, and new Codex light/deep. The PDFs are faithful
  official-page conversions with provenance, not publisher-issued PDFs. Extracted
  text companions were supplied: this is not independent proof of each harness's
  native PDF extraction or visual interpretation.
- **Fact-check a deck:** a frozen synthetic four-slide PDF with eight claims. All
  three reports record five supported, two contradicted and one insufficient.
  The same verdict counts do not establish semantic correctness by themselves.
- **Narrow supplied-only topic:** synthetic AsterDB/BirchDB notes, six questions,
  no public web. Both harnesses saved checked findings and two retention gaps.

Most new trials used frozen commit `db98116c3bc6d356ed8cd6c4de28c3d42e56fc10`.
Corrected LLM trials use `f6c15c9ef3e7ce6498d004188e23f7219826a30c`, whose code,
instructions and tests match merged main at
`39b6f243c5b24fa787aa074005ee5a359878ce08`. The native 88-test gate owns
implementation verification for that corrected state.

## Failures retained and corrected

Two original LLM candidates are excluded from acceptance:

1. A Codex checker received a 403 for an original and used the researcher's
   partial capture while claiming `read_original:true`. The old helper refused
   an honest rejection with `read_original:false`. The helper now permits false
   only with a concrete access error, rejected dependent candidates and assessed,
   source-linked access gaps. Confirmations and narrower assertions still require
   original reads. Regression tests and an
   [actual fresh Claude checker smoke](honest-access-smoke.json) exercise this.
2. The Claude report used a Future of Life Institute mirror for three governance
   facts despite the approved primary-only scope. Its completed exports are kept
   as historical evidence; the run is blocked. The replacement uses fresh native
   research/checking contexts and official primary governance material.

Selected-source registration friction also drove clearer guidance and error
messages. An [actual researcher smoke](source-reuse-smoke.json) reused an already
registered selected source on its first submission. These two smokes are task-level
checks, separate from full report cases; scripted reproductions are not live trials.

## Measurements and limits

Claude's USD figures are CLI API-equivalent/list estimates from existing
subscription access, not invoices. Codex telemetry is unavailable where marked;
partial Claude-checker measurements are not labeled as whole-run costs. Models,
cache state, source captures, corrected-run reuse and question counts differ.
Single observations establish no general speed or cost advantage.

The Claude Redis/Valkey deep report took about 34.6 minutes, with an $85.24
list estimate, and contains about 91,552 words including inline evidence and
comparison duplication. Its size is a material issue for the human usefulness
comparison. The light Claude comparison has about 32,187 words. Native Codex
light/deep reports have about 12,033/16,251 words. More facts alone do not establish
a more useful reference.

Mechanical verification checks export hashes/revisions, pinned source hashes and retained
original hashes where recorded, exact quote offsets, current fact references, recorded
researcher/checker separation, written questions and outline coverage. Available
Claude traces were also inspected for actual original fetch/read operations;
PDF parser failures with successful retained-official-PDF reads are distinguished
from failed access. Processed fetch text and first-publication versus paper-revision
dates retain their limits. Some web/PDF sources record only extraction hashes,
so those cannot establish a hash binding to the fetched original bytes. Full native Codex child-tool traces are unavailable in
some ephemeral runs, so a saved boolean attestation alone is not claimed as proof
of the actual read.

Light depth omits independent prose review. A narrow Claude report unnecessarily
labels complete short notes as partial and gives six numeric line locators one
line early; exact quote offsets remain correct. The sample packets retain these
observations for review.

## Human gate

The local review bundle is ignored by Git at
`.codex-build/release-0.9.0/human-review/README.md`. It contains the matched reports,
original captures, deterministic fixed samples and blank decisions. Raw transcripts,
source documents and disposable expired task leases stay local; they are excluded
from the release archive. The public matrix preserves identities and denominators:
292 sampled assertions and 316 factual prose sentences across the 13 cases. The
forms remain unscored.

The owner was asked explicitly whether the evidence/support/coverage/usefulness
checks were complete, including the last corrected Claude report, and replied:
“looks good for now... ongoing use will let me tweak more than a specific test”.
This is retained as the release decision to accept ongoing-use refinement rather
than a claim that all quotes were manually found or a 90% threshold was measured.
Native tests and model/mechanical evidence remain valid within their stated scope.

The original human acceptance target remains available for later evaluation:

A person must find every sampled quote in its original, assess 30 assertions per
run or all if fewer, and assess 30 factual headlines/body sentences or all if fewer.
At least 90% must be supported, with the actual denominators recorded. Generated
gap messages are audited against gap records separately, every outline section
needs facts or a stated gap, and the person must judge the new matched report more
useful as a reference. Baseline prose is mapped to its atomic decomposition and
original evidence; it does not acquire a checked-fact layer retroactively.

No human grades or usefulness verdicts have been inferred from automated checks,
model reviews, completed run status or approval of the research plan.
