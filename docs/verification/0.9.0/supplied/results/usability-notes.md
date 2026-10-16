# Supplied-source live test notes

Runtime and guidance: 0.9.0 from explicitly supplied local development runtime `/private/tmp/harness-research-pr10-f9720cb8`; production freshness was not checked and no installation was changed.

Research invocation: `/root/skill_example_supplied`.
Independent checker invocation: `/root/skill_example_supplied/independent_checker`.
Run: `15fd7b055f744d61b0eb14ae`.

## Recoverable command failures

1. `research start --project /private/tmp/harness-research-live-supplied ... --source /private/tmp/harness-research-live-supplied/sources/asterdb.md --source /private/tmp/harness-research-live-supplied/sources/birchdb.md --depth light` failed with `Research files must be project-relative paths without traversal.` Retried successfully using `--source sources/asterdb.md --source sources/birchdb.md`.
2. `research submit --project /private/tmp/harness-research-live-supplied ... --file results/source-aster.json` from runtime cwd failed `ENOENT: no such file or directory, open 'results/source-aster.json'`. Running from project cwd succeeded. Contrast: `research source --file sources/asterdb.md` from runtime cwd had resolved against project successfully. Selected guidance said project-local results, but did not state this cwd distinction.
3. Plan question shape lists `kind` without allowed enum. I used `"kind":"research"`; submission was refused with `Question kind must be open or claim.` A new lease at attempt 2 with `"kind":"open"` succeeded. Refusal was actionable, retained no partial plan, and did not prevent continuation.

## Research decisions

Kept the fixed scope to six questions (each product, three requested angles). Original Markdown is already readable verbatim UTF-8, so registered the originals directly, preserving their hashes and source dates. Did not fetch web sources. Candidate factual statements quote originals verbatim; retention periods are `not answered` with assessed insufficiency candidates. Backup mechanics were not treated as retention evidence.

## Final saved result

The run completed with `complete-with-gaps`, output revision 37: six questions independently assessed, four confirmed facts, two retention gaps, no blocked or failed tasks. Fresh independent checker `/root/skill_example_supplied/independent_checker` read complete originals, verified both extraction/original SHA256 hashes, and submitted all three section checks without errors. The checker supplied its own gap wording, so final gap IDs were obtained from the current writing task rather than reusing candidate IDs.

After final status refresh I opened the actual `research/report.md` and `research/output.json`. Run and output revision matched, and all five exported file hashes matched the manifest. The report preserves source-date limits, exact source quotes, subject-specific findings, and the disclosure that light depth has no independent semantic prose review. Retention remains explicitly unestablished; no unsupported recommendation or retention duration was added.

Minor presentation observations: the report repeats each short answer as headline, body, fact and source quote. Numeric citations resolve through a numbered sources section, but source file paths are plain text rather than clickable relative links. Gap prose includes assessed source-based reasons without inline numeric citations; source IDs remain in durable gap data. These do not prevent tracing this two-source fixture, but are less convenient for readers.
