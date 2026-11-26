# Independent review in units

Read this as the coordinator only when the host runs the independent review of a
saved dossier as units that run at the same time. The single review in
[review synthesis](review-synthesis.md) is unchanged. The capability is
`references/review-units-capability.json` (protocol `harness-review-units-v1`).
The helper records, checks and assembles; the host launches and cancels reviewers
and owns the allowance.

## Plan

```sh
node "<runtime>/scripts/harness-research.mjs" review-units plan --project CASE [--file options.json]
```

Options are `{"schema": 1, "max_units": 8, "max_reviewers": 3}`: at most 64
content units (default 8) and 1 to 3 reviewers at once (default 3). The saved
dossier must not be stale; the same state and options give the same plan. Units
follow the collection's workstreams, or each source when there is no
collection; above `max_units`, areas are grouped by a hash of their own key. A
fact goes with its workstream, or with its first cited source. A finding or prose
block goes to the unit owning most of what it cites. Units are ordered, and ties
broken, by a rank taken from their own areas only, so adding an area never moves
an item between units that did not change. Prose that cites nothing and the
coverage and usefulness assessment go to the final unit, which is given the whole
dossier. Every unit is also given, to read, what its owned items cite. Two limits are deliberate: prose ids are
positions, so inserting a block early in a section renumbers the blocks after it
and their units are reviewed again; and above the cap, hashing areas into buckets
can leave some of the `max_units` units unused.

## Run each unit

For every unit whose status is not `kept`, within `max_reviewers`:

1. Start a separate native reviewer invocation, independent of the save author,
   every fact author and every investigator. Register its actual identity:
   `register --file` with `{"unit", "reviewer", "invocation"}`. Each label and
   each invocation serves one unit only; capacity is checked here.
2. `assign --unit ID --out FILE` writes what the unit owns and is given, with
   source files and hashes, and its `template`; `template --unit ID --out FILE`
   writes only the answer. Give the reviewer the assignment, the
   [unit guide](review-unit.md) and the review guide, nothing else.
3. Record the returned answer with `accept --file ANSWER.json`. The helper checks
   it as the single review is checked, rereads every pinned file the unit owns or
   was given, and writes an immutable receipt bound by hash to the attempt.
4. Record what the host saw end with `finish --file` and
   `{"unit", "reviewer", "attempt", "outcome", "note"}` (`completed`, `failed`,
   `refused` or `cancelled`). For a failed or refused unit, `retry --file` with
   `{"unit", "reason"}`, then register a new invocation. Other units' receipts stay.

When every unit has a kept or accepted receipt and the final unit is accepted:

```sh
node "<runtime>/scripts/harness-research.mjs" review-units assemble --project CASE
```

Assembly rechecks every receipt, basis and pinned file, refuses a missing,
duplicate, stale or foreign receipt or a non-independent reviewer, and records the
review. Its result is the `synthesis review` result (with `reviewers` and a
`review_units` summary) plus `units_status`; it exits 1 when the review needs
revision. `synthesis status` and `verify` recheck the receipts and plan file.

## Corrections, stop and what a host sees

After the author saves a corrected dossier, `status` reports `needs-plan`; run
`plan` again. A unit's basis is the dossier's topic, audience, purpose, scope and
source mode, every owned and given item in full, the heading each prose item sits
under (for a comparison cell: its title, subjects, criterion and subject), and the
hashes of every owned and given source. A unit whose basis is unchanged is `kept`
with its earlier receipt; review the others and the final unit
with new invocations, then assemble. `stop` cancels outstanding units, running or
completed without an accepted answer, and refuses their late answers, also after
`plan` resumes; confirm each with `finish`, then `plan` resumes with accepted units
intact and `retry` dispatches a cancelled unit again. A kept or accepted unit can
be reviewed again with `retry`, which retires its receipt: a retired receipt is
used by nothing again, and an assembled review resting on it is no longer complete.

## What each unit attests

A content unit's reviewer is shown its owned items and what they cite, never the
neighbouring prose, and attests each owned item against its exact sources. The
final unit is given the whole saved dossier, every comparison row whole, and
attests coverage, usefulness, consistency between items and their order. Any change
to the dossier, its order included, means a new final review.

## When an assembled review stops checking out

If a receipt is missing, changed or retired, the plan file changed, or the stored
review is malformed, while the evidence is intact, `synthesis status` and `verify`
report it stale and `review-units status` reports phase `review-invalid` with
`assembled_review` problems and `next_step`. Do what `next_step` says: `finish` any
running invocation, then `plan` with the same options. It keeps a changed plan file
beside the one it rewrites, sets the review aside in synthesis history, returns
`set_aside`, and plans a new generation keeping every receipt that still holds.
Every command checks everything before writing; a refusal changes nothing. After
`retry` on an assembled review, run `plan` before registering: an answer given in
the old generation is not used.

These checks catch a missing or changed plan file, a missing or changed receipt, a
retired receipt and a malformed stored review. They hold for a case driven through
these commands; a case whose `.harness-research` files are edited by hand is outside
what Harness Research attests.

An assembled review sets `reviewer` to `null` and lists `reviewers`. Its state is
schema 4, which runtimes before 1.6.0 refuse. A later single review replaces it; a
case once assembled stays at schema 3 or 4, and 1.5.1 reads schema 3.

A supplied document new to an asset's inventory from 1.6.0 on has the origin
`supplied:` and its name inside the supplied folder, never a folder of the
computer, so a host that echoes inventory origins shows that label. A document
already in the inventory keeps its origin on every later intake, so assets taken in
earlier keep their absolute origins and still verify.
