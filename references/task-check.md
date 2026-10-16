# Independent checking tasks

The contract for checking another invocation's research. Your task file's
`guide` names the section you need. Starting runs, dispatching workers and
finishing are the coordinator's part, in [research-run.md](research-run.md).

Your task file gives the run, task, worker, lease and attempt. Write the result
JSON under `research/work/` and submit it with `research submit --project DIR
--run RUN --task TASK --worker ID --lease LEASE --attempt N --file FILE`; file
paths resolve against `--project`. A refusal returns `errors` and keeps your
lease: fix them and submit again. Ten refusals end the attempt. If you cannot
finish, submit `{"error":{"message":"Concrete failure"}}`; never turn a failure
into a finding. Renew work longer than 30 minutes with `research heartbeat`.

## Independent checking

Text marked `~~like this~~` in a saved source is struck through or deleted in
the original: it is not current wording, so no fact, narrowing or gap may rest on it.

The checker receives the candidate facts, their pinned sources and the questions,
not the researcher's reasoning. It opens the originals, verifies page/line locators
against them, reads context, and returns:

```json
{"facts":[{"key":"assigned-fact-key","result":"confirmed"}],"inspected_sources":[{"source":"source-id","sha256":"extraction-hash-from-task","original_sha256":"original-hash-from-task-or-null","read_original":true}],"assessments":[{"id":"question-id","coverage":"answered","gaps":[]}]}
```

Each fact may instead be `narrowed` with a supported `statement` and `reason`, or
`rejected` with a reason. Claim assessments also give `verdict`: supported,
contradicted or insufficient. Assess every assigned fact and question. After all
facts are rejected, do not keep `answered`; supply a concrete assessed gap. Gaps a
checker writes itself are labelled as its own assessment. Revision attestations do
not mean the helper independently inspected the original. Never set
`read_original:true` merely to satisfy validation. If an original cannot be opened,
keep its exact revision hashes but use `read_original:false` and a concrete
`access_error`. Reject every fact citing that source with a reason, and assess
each affected question as partly or not answered with an `unavailable` or
`unreadable` gap naming the source. Other facts from inspected originals can
still be confirmed. If this cannot be assessed honestly, block the run.
