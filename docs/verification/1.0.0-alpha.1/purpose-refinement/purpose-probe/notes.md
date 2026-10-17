# Purpose probe notes

Read only the supplied `references/synthesize.md`, `references/investigate.md`, and the two saved source documents for substantive guidance and evidence. The source captures identify Valkey as publisher, were accessed on 2026-10-17, and describe a migration boundary of Redis OSS through 7.2 (examples: Redis 7.2.5 / Valkey 7.2.6); replication is captured from documentation `main` at access. No web calls or additional reports/fixtures were used.

Applied guidance:

- Purpose determines selection and ordering. A leads with a conditional funding recommendation, preserves compatibility exceptions and conversion requirements, compares migration paths, and identifies reasons to defer. B builds from snapshots to replication, explains unfamiliar concepts, and uses a clearly marked illustrative sequence to address the misconception that successful writes must already exist on a replica.
- Evidence is grouped by mechanism or decision, not by source title. Paragraph citations resolve to the supplied saved files. Recommendations and interpretations are explicitly signaled; neither draft presents invented measurements.
- Source scope remains visible. Redis CE 7.4+ incompatibility is not softened into generic compatibility advice. No performance advantage or guaranteed zero-loss cutover is inferred from protocol compatibility.

Limitations: two documents from the same publisher, not independent corroboration; no live version verification, workload inventory, performance/cost measurements, migration execution or rollback validation. The migration guide calls `master_link_status:up` synchronized, while the replication explanation establishes asynchronous processing. The drafts therefore avoid treating link status alone as proof that every write is present. A's acceptance criteria and interim status-quo choice are recommendations rather than observed outcomes. B's write/failure sequence illustrates the documented mechanism and was not tested.

This is a focused draft-writing exercise. No dossier/helper execution, independent review, or full runtime acceptance is claimed. Verification was limited to rereading the two drafts against the supplied passages, checking their local citation destinations, and checking draft length.
