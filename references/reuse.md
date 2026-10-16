# Verify, research again, reuse and refresh

These commands need runtime 0.9.1. With an older runtime, say they are
unavailable and offer what the [skill research workflow](research-run.md) can do.
Every command answers in JSON; you run them, not the person.

## Check cited facts before delivery

```sh
node scripts/harness-research.mjs research verify --project DIR --keys FILE
```

`--keys` reads a JSON array of keys or any file citing them (an outline, a draft
with `[R:key]` markers); `--key KEY` adds one. Each key is `confirmed`,
`narrowed`, `superseded`, `rejected`, `stale`, `unchecked` or `gone`, with the
replacement assertion where there is one. A replacement does not confirm the
old wording: report every non-confirmed key and let the person decide. Verify
reads saved evidence only; it does not show that live sources still agree.

## Research questions again

When the person asks for specific questions again, run
`research reassess --project DIR --run RUN --again ID,ID --reason "what to look for"`
on a finished run. Their checked facts stay current; the questions are researched,
checked and rewritten as a round. Work its tasks as usual: research tasks carry
`again` with the reason.

## Start from earlier research

`research start --project DIR --from PATH` (repeatable) begins a new run from the
`research/` folder of this or another project, keeping fact keys. Use
`research find --in DIR [--query WORDS]` to list candidates with their status,
approval and source age, and let the person choose. Pass `--topic`, `--about` or
`--source` when the new work differs; the planner then gets an extension task:
return only new sections and questions (`[]` when covered). Work that cannot be
carried (missing saved text, changed originals, unchecked facts, public sources
in a supplied-only run) is researched again in an import round. Read `warnings`
and tell the person. An origin's approval is history, not approval of the new run.

## Approve at a gate

When the person (or a caller's gate) approves the finished report they saw, run
`research approve --project DIR --by "Name" --revision N` with that report's
output revision. Status, the report and `facts.json` show whether the approval
still applies; any later change to the research means it does not.

## Refresh old research

Before relying on research that is months old, run
`research refresh --project DIR --run RUN`. Refresh tasks list each cited web
source with its quoted passages: open the original, save its current full text
as a new file and submit
`{"sources":[{"source":"ID","read_original":true,"file":"research/sources/NAME-current.md"}]}`,
or `"read_original":false` with an `access_error`. Facts whose passages are gone
become stale and their questions are researched, checked and rewritten. Local
files are checked by hash on every status; a change there is `research reassess`.
