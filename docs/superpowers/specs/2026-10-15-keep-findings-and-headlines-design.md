# Keep findings across a plan change, and a headline per finding

Date: 2026-10-15. Status: agreed design, not built.

## Why

Presentation Studio, which drives harness-research for its decks, is changing its research
stops so a person reviews findings one by one: they can research one question again, leave
a finding out, or add a question after the research has run. Two things it needs belong in
harness-research rather than in Presentation Studio:

1. **Adding a question must not lose the other findings.** Today any change to a plan
   archives the record to `history/` and starts a new run with `results: {}`
   (`planUnlocked`), so adding one question to a 16-question plan throws away 16 findings.
   The caller would have to re-record every old finding itself, re-checking each quote, and
   that fails whenever a quoted snapshot is not on the computer doing it.
2. **A finding needs a one-sentence answer.** A finding holds `status`, `summary` (up to
   12,000 characters), `limits` and `evidence`. A reviewer judging sixteen of them needs the
   answer in a line. Keeping that line outside the research record splits the research in
   two, and other callers (Training Studio, standalone research) would not get it.

## What changes

### Unchanged questions keep their findings when a plan changes

When `plan` is given a plan whose run differs from the saved one, the new record starts with
the saved results of every question that is unchanged, instead of with none.

- A question is unchanged when its whole definition is the same (`id`, `question`,
  `public_query`, `claim`, compared with `stable`), **and** the plan around it is the same:
  `topic`, `purpose`, `scope`, `sources` and the pinned `inputs`. If any of those differ, no
  finding is kept, as today. This keeps the existing rule that a changed topic starts over.
- A kept result is copied as it is, with its `checked_at`. Its evidence is still checked by
  `inspect` on every save, so a quote whose snapshot changed is reported stale as before.
- The earlier record is still archived to `history/` first, as today.
- `plan` returns, besides the status it returns now, `carried`: the IDs whose findings were
  kept, in plan order (empty when none were).
- A plan identical to the saved one still resumes its run unchanged (`old.run === run`).

### A finding may carry a headline

- `record` accepts an optional `headline`: the finding's answer in one line of at most 300
  characters. One with a line break, or empty when given, is refused:
  "Headline requires one nonempty line (maximum 300 characters)."
- It is kept in the result (`results[id].headline`) and shown in the report as `Answer:`
  before the summary.
- Findings without one are valid and render as today.

### Guidance

`references/evidence.md` lists `headline` among a finding's fields, as optional, and says
that a changed plan keeps the findings of unchanged questions when its topic, scope and
sources are unchanged.

## Not changing

- The run ID and how it is computed.
- Evidence checks, staleness, locking, history and migration.
- The CLI's commands and flags.

## Testing

`tests/research.test.mjs`:

- Adding a question keeps the findings of the others: `completed` stays, the new run
  differs, the new question is pending, `carried` lists the kept IDs, and the report still
  cites the kept evidence.
- Removing a question and rewording another keeps only the untouched one's finding.
- A changed topic, scope, selected sources or input file keeps nothing (the existing topic
  test stays as it is).
- A kept finding whose snapshot changed is reported stale.
- A headline is kept and rendered as `Answer:`; a missing one is fine; a multi-line, empty or
  over-long one is refused and the record is unchanged.

Then `npm test` and `npm run context:check`.

## Release

A runtime change: package, lockfile, `guidance/manifest.json` (`version`,
`minimumRuntime`), the release label in `SKILL.md` and the install examples move together,
as `docs/releases.md` describes. Whether this ships alone as 0.8.1 or with the next
coordinated release is the maintainer's call.
