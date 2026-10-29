# Bounded parallel investigation

Read this only as coordinator when substantial research divides into independent
workstreams. Small requests can keep combined investigation/writing. The helper
records evidence and identities; the host launches workers and owns cancellation,
capacity and provider accounting.

## Dispatch useful work, within one allowance

Reuse the settled brief or approved studio planning questions. Choose a few
independent themes; do not launch a job for every question or add a planning call.
Default to at most three simultaneous investigators, capped by host capacity and
caller limits. Reserve time and supported budget for synthesis and independent
review. Unknown dollar cost remains unknown; each worker cannot claim the entire
remaining allowance. Delegate only through permitted native tools.

Read one adapter for the host: [Codex](harnesses/codex.md) or
[Claude Code](harnesses/claude-code.md). With no delegation capability, investigate
sequentially and record that mode. Independent review still needs another invocation.
Do not shell-launch a different provider or install agents to obtain capability.

## Record the collection

Author request JSON with the existing topic/audience/purpose/scope/source_mode,
workstreams, allowed selected-source identities and any domain restrictions:

```json
{
  "schema": 1,
  "topic": "Valkey and Redis",
  "audience": "Application engineers",
  "scope": "Workload fit and operational consequences",
  "source_mode": "public",
  "workstreams": [
    {"id": "compatibility", "questions": ["Which dependencies change migration fit?"]},
    {"id": "operations", "questions": ["Which operational limits matter?"]}
  ],
  "supplied_sources": [],
  "max_investigators": 3,
  "execution_mode": "parallel"
}
```

Purpose defaults to general-purpose research. For a topic asset, include its
returned `inputFingerprint` as request `input_fingerprint` (or omit it to let
the helper bind the asset's current intake); `supplied_sources` identifies the selected origins
and available file/hash pins. Omit `supplied_sources` to derive the asset's
selected inventory; never use an empty list to erase an existing selection.
`allowed_domains`, when present, is a hostname list.
Do not convert supplied private material into public permission.

```sh
node "<runtime>/scripts/harness-research.mjs" collection init --project CASE --file request.json
```

For each native invocation, register host-issued identity with JSON
`{workstream, investigator, invocation}`. The helper returns current request digest,
generation and attempt. Map host IDs to helper labels of at most 64 lowercase
letters/digits/hyphens; a new label is not a new independent invocation. Tell each
worker the exact returned values, assignment, purpose, source policy and isolated
working directory. Give it only [investigation](investigate.md) and the
[packet contract](investigation-packet.md), plus any relevant search strategy.

## Accept and combine evidence

The coordinator is the sole shared-state writer. Native capture information is
first recorded with `asset source` when working in a topic asset, then
registered with `collection capture` using
`{workstream, investigator, source: <source record>}` before accepting its packet.
The helper computes hashes and validates selected membership/domain restrictions.
It does not fetch the URL or prove that a worker ran. Do not register arbitrary
model assertions as host capture facts.

```sh
node "<runtime>/scripts/harness-research.mjs" collection register --project CASE --file invocation.json
node "<runtime>/scripts/harness-research.mjs" collection capture --project CASE --file capture.json
node "<runtime>/scripts/harness-research.mjs" collection accept --project CASE --file packet.json
node "<runtime>/scripts/harness-research.mjs" collection assemble --project CASE
```

Use returned source/fact IDs and registry digest. Namespacing rewrites declared
references only. Keep distinct logical captures, even at the same URL, and preserve
contradictory facts. The author copies assembled sources/facts unchanged and writes
findings, report and brief around them. New/changed facts go through a registered
investigation, not a fabricated synthesis author. Save with normal synthesis
commands, then give a separate checker the exact dossier, source context and review
template. Packet acceptance never replaces that final review.

## Checkpoint, repair and stop honestly

`collection status` reports collection state, workstreams and observed timing.
`pause` stops new registrations; active workers can reach accepted checkpoints.
`resume` permits dispatch again. Observe actual host invocation termination with
`finish --file` using `{workstream, investigator, attempt, outcome, note}`.
Outcomes are `completed`, `failed`, `refused` or `cancelled`; this attests the host's
observation and does not terminate a process. An investigator still in flight can
consume capacity even after its evidence attempt was invalidated. `retry --file` takes `{workstream, reason}` and
starts a new attempt; retain valid unaffected packets. `stop` rejects outstanding
late completions; request real cancellation through the host separately. If a
worker cannot be cancelled, disclose it rather than claiming it stopped.

Changed input or permission requires `invalidate --file NEW_REQUEST.json`, a new
generation and explicit revalidation. First observe every current invocation's
terminal state with the host and `finish`; invalidation refuses to discard running
or cancellation-unconfirmed occupancy. Existing packet files alone are not valid
recovery. Recheck fingerprints, receipt hashes and current attempts before reuse.
Do not repeatedly retry inaccessible sources or broaden source permissions.

Expose meaningful phases: investigating, combining findings, independent check,
ready for review. Active wall time is the union of observed worker intervals;
assistant time is their sum. Without a confirmed terminal observation, stop/retry
cannot claim an exact stopped interval: timing may remain unknown with known
observed lower bounds shown separately. Do not infer user pauses from historical gaps or
promise a fixed percentage, finish time or provider speedup.

Fix final review objections in the affected packet or synthesis prose. A changed
final dossier invalidates its review and requires complete independent checking
again. Preserve the normal two-correction-cycle bound; unresolved work stays draft.
