# Valkey versus Redis: when Redis takeout is practical

> Reviewed synthesis.

Audience: Application and platform engineers. Purpose: Support a 20-minute technical presentation for platform engineers deciding where Redis takeout is appropriate; supply a prioritized storyline, evidence for speaker notes and caveats.

## Lead with the boundary, not the brand

The central takeaway for platform engineers: Valkey deserves a bounded pilot for workloads on the shared Redis OSS 7.2-or-earlier surface, but Redis takeout is a compatibility and recovery decision, not an endpoint rename. Lead with that distinction; a permissive license can motivate evaluation without proving technical fit. The audience should leave able to identify the dependency that could reverse its choice. ([bounded-takeout](evidence.md#bounded-takeout), [license-choice](evidence.md#license-choice), [rollback-design](evidence.md#rollback-design))

## Build the argument in three steps

Start with where the case is strongest: a reconstructible cache using the shared core command surface. Then contrast two decision-changing dependencies: Redis CE 7.4\+ persistence files are outside the documented compatibility path, and Redis Software Active-Active uses CRDT semantics that ordinary asynchronous replication does not replace. This progression explains why the same migration answer cannot apply to every Redis deployment. ([compatible-base](evidence.md#compatible-base), [ce74-files-incompatible](evidence.md#ce74-files-incompatible), [active-active-semantics](evidence.md#active-active-semantics), [async-replication](evidence.md#async-replication))

Next, make “compatible” concrete. Existing clients can connect, yet Valkey 8.0 records changed nested MULTI/WATCH transaction behavior. Search is another useful boundary: Valkey Search exists, but its captured contract covers only implemented Redisearch Dialect 2 features and requires index rebuilding from hashes or JSON documents. These examples support testing failure paths and query results, not merely PING and key counts; the rolling module documents still require release-specific confirmation. ([protocol-client](evidence.md#protocol-client), [transaction-difference](evidence.md#transaction-difference), [search-dialect-boundary](evidence.md#search-dialect-boundary), [search-rebuild](evidence.md#search-rebuild))

Close with the decision that survives cutover. In an illustrative scenario—not an observed incident—the new target accepts a write while the preserved old source stays unchanged. Switching back omits that write unless it is replayed or reconciled. Use this mechanism to connect compatibility testing to a rehearsed recovery path, then ask which validation would most likely stop this particular migration. ([replica-cutover](evidence.md#replica-cutover), [snapshot-quiesce](evidence.md#snapshot-quiesce), [async-replication](evidence.md#async-replication), [rollback-design](evidence.md#rollback-design))

## Keep the strongest evidence in speaker notes

A source/target/write-flow sketch can explain the rollback problem more clearly than a throughput race. If showing performance claims, retain the publishers and configurations: Valkey’s 9.1 headline uses 512-byte payloads, nine I/O threads and pipeline depth ten; Redis’s 8.6 claim compares against Redis 7.2 with 1K values, eleven I/O threads and pipeline depth one. These are different tests, not a head-to-head ranking. Redis’s own upgrade is a legitimate alternative to evaluate when capacity is the motive. ([valkey-performance-claim](evidence.md#valkey-performance-claim), [redis-performance-claim](evidence.md#redis-performance-claim), [redis-performance-config](evidence.md#redis-performance-config), [matched-benchmark-method](evidence.md#matched-benchmark-method))

Give the strongest case for staying with Redis: required integrated features or commercial Active-Active semantics may outweigh a license preference and replacement effort. Both stores document limits to WAIT and possible AOF-everysec data loss, so resilience should be tested on both sides. Valkey’s governance and BSD license are distinct benefits to assess, not proof of lower operating cost. ([redis-integrated-types](evidence.md#redis-integrated-types), [active-active-semantics](evidence.md#active-active-semantics), [wait-not-strong](evidence.md#wait-not-strong), [redis-wait-limit](evidence.md#redis-wait-limit), [aof-durability](evidence.md#aof-durability), [redis-aof-window](evidence.md#redis-aof-window), [license-choice](evidence.md#license-choice))

## Preserve these limits when shortening

The evidence was captured on 2026-10-17; release listings are date anchors, not recommended targets. The migration walkthrough uses Redis 7.2.5 and Valkey 7.2.6. ElastiCache’s documented rollback pair is specifically Valkey 7.2 to Redis OSS 7.1, not a promise for newer upstream releases. Keep edition, version and provider labels beside these claims. ([valkey-version](evidence.md#valkey-version), [redis-version](evidence.md#redis-version), [migration-example](evidence.md#migration-example), [aws-rollback](evidence.md#aws-rollback))

No application benchmark, production migration, cost model or recovery drill was run. The actual workload, modules, topology, downtime budget and recovery objectives remain unknown; the presentation can justify a validation plan, not promise savings or migration success.

