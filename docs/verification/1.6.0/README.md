# Harness Research 1.6.0 verification

The 1.6.0 working tree passed the local checks on a macOS 27 development host with
Node.js 22: 256 Node tests with zero failures and one skip (the Python-gated
comparative validator), and context-map validation after regenerating the
measurements for the changed entry and the two new references. Every test that
existed in 1.5.1 is unchanged and passes; 16 tests are new.

The new tests check that:

- a review plan gives every source original, fact, finding and prose block to
  exactly one unit and the assessment to the final unit, gives each unit what its
  items cite to read, is the same plan byte for byte for the same saved state and
  options (in the case and in a copy of it), stays within a host's `max_units`, and
  above that cap keeps an area's unit when other areas are added;
- a claim citing sources owned by two units belongs to one and is given the other's
  source; a collection's units follow its workstreams, the same URL captured by two
  workstreams stays two owned sources, and a finding across workstreams is owned by
  one unit and given the other's facts and source;
- a unit answer is refused for a wrong capture or original hash, a missing original
  hash, `read_original: false` without an `access_error`, a missing, extra or
  foreign item, a pending verdict, an empty note, an assessment outside the final
  unit, a stale plan or digest, an unregistered reviewer and an unknown field; an
  inaccessible original is recorded and keeps the review from completing;
- a reviewer who is the save author, a fact author or an investigator is refused,
  one invocation or label cannot claim two units, registration is idempotent, and
  `max_reviewers` is enforced at registration;
- an accepted answer leaves an immutable receipt bound by hash to its attempt, a
  repeated answer is idempotent and a different one refused, a tampered receipt is
  reported by `status`, refused by `assemble` and makes `synthesis verify` stale
  after assembly, a changed pinned file refuses acceptance, and a final receipt
  from another plan is refused;
- units assemble into the same per-item review and acceptance a single reviewer
  records for the same verdicts, with `reviewer: null`, the sorted `reviewers` and
  state schema 4, and a later single review returns the state to schema 3;
- after a correction, the units whose basis did not change keep their receipts,
  only the changed unit and the final unit are reviewed again with new reviewers,
  and the assembled review verifies complete;
- a failed unit is retried alone; `stop` cancels the outstanding unit, refuses its
  late answer, registration and assembly, writes no receipt for it, and resumes
  through `finish` and `plan` with the accepted unit's receipt byte for byte intact;
- the capability file matches the runtime's protocol and limits and the schema
  file's answer and receipt fields; the unit reviewer's reading path stays under
  the 3,000-token stage budget;
- a new intake records `supplied:` origins that flow through collection, synthesis
  and review units on a topic asset, and no file listed by `asset-manifest.json` or
  `output.json`, nor `sources.json`, holds an absolute path;
- a topic-asset case saved by the 1.5.1 runtime with absolute origins
  (`tests/fixtures/case-1.5.1`, built by `tests/fixtures/make-1.5.1-case.mjs` from
  the 1.5.1 tree with a synthetic origin folder) verifies complete with its digest,
  its collection and its asset status, and none of its saved files is rewritten;
  a re-intake, unchanged or with files added and changed, keeps the origin of
  every document already in the inventory.

The synthetic timing test (`tests/review-units-concurrency.test.mjs`) runs three
content units of 150 ms simulated work plus the final unit, through the real
commands, once one at a time and once three at a time:

| Measure | One at a time | Three at a time |
| --- | ---: | ---: |
| Content units, elapsed | 481 ms | 235 ms |
| All units, elapsed | 643 ms | 395 ms |
| Active wall time recorded | 0.631 s | 0.388 s |
| Assistant time recorded | 0.631 s | 0.739 s |

Both runs assemble the same review. Of three sources, one is given to two content
units (a claim cites it from another unit), and all three are read again by the
final unit: seven source reads for three sources. The numbers measure the local
contract and lock, not native reviewers or provider speed.

Not run: the disposable macOS virtual machine gate, `npm audit`, an installation
test and a live research trial. No dependency changed. All content was synthetic,
and no model or provider jobs were used. Marketing Studio and other callers were
not changed or tested.
