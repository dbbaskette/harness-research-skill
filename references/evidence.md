# Evidence contract and automatic reports

Use `node scripts/harness-research.mjs ACTION` from the installed package.
Pass `--project` the content project's absolute directory. Node 20+ is the only
runtime requirement; helpers do not search or upload. The AI prepares inputs.

`node scripts/harness-research.mjs plan --project DIR --file plan.json` saves the queue and immediately
writes `.harness-research/research-report.md`. A matching plan resumes results;
a changed plan or changed content basis retains history and starts a new run.
Plans contain `topic`, `purpose` (planning/fact-check), `scope`
(public-web/supplied-only), optional `input_files`, selected `sources`, and stable question IDs:

```json
{"topic":"Public product capabilities","purpose":"planning","scope":"public-web",
 "input_files":["presentation-brief.md"],"sources":[
 {"id":"technical-brief","title":"Technical brief","origin":"supplied technical-brief.pdf",
  "original_file":"sources/technical-brief.pdf","file":"sources/technical-brief.txt",
  "limits":"none"}],"items":[
 {"id":"availability","question":"Verify feature availability",
  "public_query":"public product feature release notes","claim":null}]}
```

Each source has a unique `id`, `title`, `origin`, a readable UTF-8 `file`, and
optional `original_file`; paths are project-relative. `limits` is `none` for a
complete extraction, otherwise a concrete coverage limit. For an unreadable
upload, retain `original_file`, set `file` to null, and explain the gap in
`limits`. Plain text may use the same path as original and snapshot. List retained
linked sources too when selected for uploaded-only research. Older plans without
a source manifest remain readable; integrated runs always register the selected
reference set, including an empty array when no documents were supplied.

For a factual check, save a readable snapshot of the selected deck/content locally
and supply each item's exact claim as `{ "file":"deck-content.md", "quote":"...",
"start":0 }`. Offsets are Unicode character positions in that snapshot, not
Google UTF-16 indexes or slide coordinates. These claims remain local. Supplied-only
plans have null public queries. Changing a saved supplied-only plan to public-web
needs explicit user approval, represented by the helper's `--allow-web` flag.

Save each finding with `node scripts/harness-research.mjs record --project DIR --run RUN --item ID
--file finding.json`. A finding contains `status` (supported, contradicted,
insufficient, unavailable), `summary`, `limits`, and `evidence`. Each evidence
entry gives `file` (project-relative inspected snapshot), `title`, `origin`
(original URL or supplied-file identity), `quote`, `start`, `locator`, and
optional `source_date` and `source_id` for a selected reference. The helper binds
matching readable snapshots to their registered document identity and original
revision; use page/slide/heading locators from the extraction. In combined mode,
public evidence is also saved as inspected local text snapshots and cited by its
original URL. Supported/contradicted findings require exact inspected
source passages. The helper pins snapshot hashes and refreshes the readable report
on every save, including citations, contradictions, coverage counts, pending and
unresolved questions. No separate report command or report-format question is
needed. Semantic support is the researcher's assessment, not a helper guarantee.
The parent records completed findings serially; agents return findings to that
coordinator. A busy-save error should be retried after the current save finishes.
After an interrupted helper, inspect the recorded process and lock before recovery;
never remove a lock belonging to an active save.

`node scripts/harness-research.mjs status --project DIR` refreshes the report and returns pending,
unresolved and stale question IDs, the saved source mode, and document coverage
gaps. Content-basis or source-snapshot changes mark
results stale; replan/reassess before reusing them. Skip completed work only when
current. Keep earlier JSON/report revisions in `.harness-research/history/`.
A dated local snapshot is not proof that the live source is still current.

