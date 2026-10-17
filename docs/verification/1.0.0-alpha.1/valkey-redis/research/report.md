# Valkey versus Redis: when Redis takeout is practical

> Reviewed synthesis. Source hashes establish capture integrity; they do not establish truth.

## Where replacement makes sense

**Interpretation:** Valkey is a credible replacement candidate for applications using the core Redis OSS 7.2-or-earlier surface, particularly when a permissive license is valuable. Treat replacement as a versioned compatibility project: the strongest evidence concerns that shared baseline, while newer Redis persistence, data capabilities and commercial service behavior need separate proof. There is no universal winner without the workload and operating requirements. ([bounded-takeout](evidence.md#bounded-takeout), [feature-dependencies](evidence.md#feature-dependencies), [license-choice](evidence.md#license-choice))

As of the 2026-10-17 source check, Valkey’s download page lists 9.1.2 and Redis’s latest-release API returns 8.10.2. These are currency anchors, not a recommended target pair. The migration guide’s worked standalone examples use Redis 7.2.5 and Valkey 7.2.6; do not apply their commands blindly to newer major versions or hosted products. ([valkey-version](evidence.md#valkey-version), [redis-version](evidence.md#redis-version), [migration-example](evidence.md#migration-example))

## Separate the engine, edition and dependency boundaries

**Conditional recommendation:** For a reconstructible cache using familiar core commands, a Valkey pilot is a reasonable first move. Sessions, queues, stream consumers, counters or locks deserve a higher validation bar when missing, duplicated or reordered operations affect correctness. This distinction follows from the documented asynchronous replication and persistence loss windows; the mere ability to connect a Redis client is insufficient. ([protocol-client](evidence.md#protocol-client), [async-replication](evidence.md#async-replication), [aof-durability](evidence.md#aof-durability))

**Conditional recommendation:** Redis 7.4\+ is outside the documented file-compatibility path. A logical export/import or application-mediated rebuild may be feasible, but it must account for the exact data types and changes made while copying. This research has not validated a specific tool or a universal live migration from Redis 8; retaining Redis can be the better decision when redesign or downtime exceeds the expected benefit. ([newer-data-boundary](evidence.md#newer-data-boundary))

**Interpretation:** Redis 8 integrates search, JSON, time series and probabilistic structures. Valkey Search and Valkey JSON also exist, so “Valkey has no JSON or search” is an unreliable comparison. Their captured READMEs describe main/unstable branches, however: confirm the released package, supported commands, query syntax, index lifecycle and persisted formats for the chosen deployment. Module API compatibility alone does not prove that a specific Redis Stack component or application abstraction can be swapped. ([redis-integrated-types](evidence.md#redis-integrated-types), [valkey-search-capability](evidence.md#valkey-search-capability), [valkey-json-capability](evidence.md#valkey-json-capability), [module-api](evidence.md#module-api))

**Conditional recommendation:** Redis Software Active-Active is a separate service capability based on CRDTs. A workload relying on its conflict resolution should not be mapped to ordinary Valkey asynchronous replication without a redesign and correctness proof. This is a concrete reason to stay with the existing product, or to assess another managed architecture separately from an engine swap. ([active-active-semantics](evidence.md#active-active-semantics), [async-replication](evidence.md#async-replication))

## Validate the application contract

**Conditional recommendation:** Inventory commands and options, scripts/functions, transactions, modules, serialization, client/framework versions, connection pooling, retries, TLS/ACL settings and topology discovery. Exercise representative success and error paths on the selected target. For example, Valkey 8.0 changes nested MULTI/WATCH behavior to abort a transaction; connection success would not catch that semantic difference. ([protocol-client](evidence.md#protocol-client), [module-api](evidence.md#module-api), [transaction-difference](evidence.md#transaction-difference))

Include operational consumers of the protocol. Valkey’s compatibility INFO field reports redis\_version:7.2.4; identify the actual engine with server\_name and valkey\_version when checking versions or interpreting telemetry. Check packaging as well: Valkey 9.1 moved Lua into a module, but its release notes also say the engine is statically linked by default. Do not infer that every deployment requires a separate dynamically loaded Lua library. ([info-version](evidence.md#info-version), [lua-module](evidence.md#lua-module), [lua-packaging](evidence.md#lua-packaging))

## Compare operating outcomes, not headline throughput

**Conditional recommendation:** Valkey’s 9.1 announcement reports 2.1 million requests per second with specified payload, IO-thread and pipeline settings. That is a project-reported result, not a measured advantage for this application or against an equivalent Redis deployment. Compare p95/p99 latency and throughput under the same command mix, key/value sizes, concurrency, TLS, persistence, replica topology and failure conditions. Include memory/RSS, evictions, saturation, restart and backup/rewrite behavior. ([valkey-performance-claim](evidence.md#valkey-performance-claim), [persistence-cost](evidence.md#persistence-cost))

**Interpretation:** Recovery objectives must survive the engine change. Valkey replication is asynchronous; WAIT can reduce exposure but does not guarantee strong consistency. AOF everysec can lose roughly one second of writes in a disaster, and snapshot/rewrite work can affect latency. A team using the store as durable state needs recovery tests, not only cache hit-rate tests. ([async-replication](evidence.md#async-replication), [wait-not-strong](evidence.md#wait-not-strong), [aof-durability](evidence.md#aof-durability), [persistence-cost](evidence.md#persistence-cost))

**Conditional recommendation:** Compare the complete service bill and ownership: capacity, replicas, network, backups, patching, observability, support and migration effort. Managed-service parameters and rollback rules belong to that comparison; for example, ElastiCache requires matching static parameter values when moving custom groups to Valkey. No prices, contract terms or staffing costs were supplied, so this report cannot establish savings. ([aws-parameters](evidence.md#aws-parameters), [operational-fit](evidence.md#operational-fit))

## A migration should prove correctness and recoverability

**Conditional recommendation:** First define acceptance thresholds and test the exact source/target packages in an isolated environment. Restore a representative backup and replay representative application traffic. Check values and types, remaining TTLs, scripts, transaction outcomes, stream pending/consumer state where used, and index/query results where used. Key counts are a useful check but cannot establish semantic equivalence. Also test client reconnection, failover, shard routing and authentication. ([bounded-takeout](evidence.md#bounded-takeout), [feature-dependencies](evidence.md#feature-dependencies), [transaction-difference](evidence.md#transaction-difference))

**Conditional recommendation:** Select a path consistent with the verified versions. A quiesced snapshot restore trades downtime for simplicity. For a compatible cluster, the project describes adding Valkey replicas and promoting them per primary. Rehearse the full cutover: stop or fence writers, let replication catch up, verify offsets and application state, promote, redirect/reconnect clients, and watch correctness plus latency. A live replication link alone does not prove that every final write was applied. ([snapshot-quiesce](evidence.md#snapshot-quiesce), [replica-cutover](evidence.md#replica-cutover), [async-replication](evidence.md#async-replication))

**Conditional recommendation:** Define rollback before cutover. Keep a tested pre-cutover recovery point and specify who owns writes at each stage. Before new writes reach the target, returning to the preserved source may be straightforward; afterward, returning to an unchanged source discards those writes unless they can be reconciled or replayed. Test that recovery path explicitly. Do not assume newer Valkey files or features can be consumed by the old Redis source. ([rollback-design](evidence.md#rollback-design))

**Interpretation:** For hosted services, use the provider’s exact version matrix and recovery procedure. ElastiCache currently documents rollback only from Valkey 7.2 to Redis OSS 7.1, with user/user-group engine requirements. That is not evidence for an in-place rollback from Valkey 8 or 9. Keep this provider-specific constraint separate from upstream Valkey capability. ([aws-rollback](evidence.md#aws-rollback), [aws-rollback-identity](evidence.md#aws-rollback-identity))

## License choice is distinct from technical fit

**Interpretation:** Valkey 9.1.2 declares BSD-3-Clause. Redis OSS through 7.2 remains BSD; Redis CE 7.4–7.8 uses RSAL/SSPL, and Redis 8\+ adds AGPLv3 as a choice alongside those licenses. Select the terms that fit the intended use and distribution model; the presence of an AGPL option means “Redis is no longer open source” is not an accurate blanket statement about current Redis. License preference can motivate evaluation, but it does not eliminate migration work. ([valkey-license](evidence.md#valkey-license), [redis-old-licenses](evidence.md#redis-old-licenses), [redis-license-options](evidence.md#redis-license-options))

## What would change the decision

**Open question:** The unresolved inputs are the current Redis product/version and host; actual commands, modules and clients; cache versus authoritative-state role; data size and growth; peak traffic and hot keys; latency, availability and recovery objectives; multi-region conflict semantics; acceptable downtime; support obligations; and available migration capacity. No application benchmark, restore drill or production compatibility test was run.

**Conditional recommendation:** Proceed to a bounded Valkey pilot when the shared command surface and recovery requirements fit. Keep or upgrade Redis when a required feature/service behavior remains unproven, or migration effort and risk outweigh the expected gain. Revisit the choice after measuring the real workload. These decision inputs can feed later slides, blogs and training, with the stated version boundaries and workload gaps preserved. ([bounded-takeout](evidence.md#bounded-takeout), [feature-dependencies](evidence.md#feature-dependencies), [operational-fit](evidence.md#operational-fit), [rollback-design](evidence.md#rollback-design))

## Research context

**Audience:** Application and platform engineers

**Purpose:** Decision input for presentations, blogs and training

**Scope:** Version and edition boundaries, workload dependencies, operations, migration validation and rollback as of 2026-10-17

[Reusable findings](brief.md) · [Evidence and review](evidence.md)
