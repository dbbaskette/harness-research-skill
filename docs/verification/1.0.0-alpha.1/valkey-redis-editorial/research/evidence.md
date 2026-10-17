# Valkey versus Redis: when Redis takeout is practical

> Reviewed synthesis.

Source hashes establish capture integrity; they do not establish truth.

Content digest: `8daa8a079f9ce343ab3e1b1a164ec5eb2f95272ce2480ce2d858c9095c39c794`. Author: editorial-author.

<a id="compatible-base"></a>
## compatible-base

Valkey documents Redis OSS 7.2 and earlier as its compatibility baseline; Valkey 7.2.4 forked Redis OSS 7.2.4.

Author: valkey-research

> Valkey is compatible with Redis OSS 7.2 and all earlier open-source Redis versions, as Valkey 7.2.4 is a fork of Redis OSS 7.2.4.

Source: [src-migration](#src-migration).

<a id="ce74-files-incompatible"></a>
## ce74-files-incompatible

The Valkey migration guide states that Redis Community Edition 7.4 and later produce data files that are not compatible with Valkey.

Author: report-revision

> Redis Community Edition \(CE\) version 7.4 and later produce data files that are not compatible with Valkey.

Source: [src-migration](#src-migration).

<a id="protocol-client"></a>
## protocol-client

Valkey documents RESP2/RESP3 and connection support for existing Redis client libraries.

Author: valkey-research

> Protocol: Valkey uses the RESP wire protocol and supports both RESP2 and RESP3. Existing Redis client libraries can connect to Valkey without code changes.

Source: [src-migration](#src-migration).

<a id="module-api"></a>
## module-api

Valkey documents support for Redis OSS modules using the RedisModule\_ API.

Author: valkey-research

> Modules: Modules written for Redis OSS using the \`RedisModule\_\` API work in Valkey.

Source: [src-migration](#src-migration).

<a id="info-version"></a>
## info-version

Valkey reports redis\_version:7.2.4 for backward compatibility; its actual version is exposed separately.

Author: valkey-research

> INFO: Valkey reports \`redis\_version:7.2.4\` in the \[INFO\]\(../commands/info.md\) output for backward compatibility. Use \`server\_name\` and \`valkey\_version\` to detect the actual Valkey server and version.

Source: [src-migration](#src-migration).

<a id="migration-example"></a>
## migration-example

The standalone migration examples use Redis 7.2.5 and Valkey 7.2.6.

Author: valkey-research

> The example migration steps are provided for Redis 7.2.5 and Valkey version 7.2.6.

Source: [src-migration](#src-migration).

<a id="snapshot-quiesce"></a>
## snapshot-quiesce

The documented physical migration incurs shutdown/load downtime and requires disconnecting active connections to prevent write loss.

Author: valkey-research

> \* The downtime to shutdown Redis and wait for Valkey to load the data.  \* Potential risk of data loss on instances with heavy writes. To prevent it, you must disconnect all active connections before starting the migration.

Source: [src-migration](#src-migration).

<a id="replica-cutover"></a>
## replica-cutover

The migration guide describes adding Valkey cluster replicas, promoting one per Redis primary, and removing Redis nodes.

Author: valkey-research

> The first step is to add the required number of Valkey nodes to the existing cluster as replicas. Once the new Valkey nodes replicate the data, one Valkey replica is promoted to be a new primary for each Redis primary. After the migration, the Redis nodes are removed from the cluster.

Source: [src-migration](#src-migration).

<a id="transaction-difference"></a>
## transaction-difference

Valkey 8.0 release notes include aborting transactions on nested MULTI or WATCH commands.

Author: valkey-research

> Abort transactions on nested \`MULTI\` or \`WATCH\` commands.

Source: [src-valkey-8-release](#src-valkey-8-release).

<a id="lua-packaging"></a>
## lua-packaging

Valkey 9.1 release notes say the Lua scripting engine is statically linked by default.

Author: valkey-research

> Lua scripting engine is now statically linked by default instead of dynamically linked

Source: [src-valkey-9-release](#src-valkey-9-release).

<a id="lua-module"></a>
## lua-module

Valkey 9.1 release notes record extracting Lua scripting into a Valkey module.

Author: valkey-research

> Move Lua scripting engine into a Valkey module

Source: [src-valkey-9-release](#src-valkey-9-release).

<a id="valkey-version"></a>
## valkey-version

The live Valkey download page lists 9.1.2 as its 9.x release.

Author: valkey-research

> GitHub Release: 9.1.2

Source: [src-valkey-download](#src-valkey-download).

<a id="redis-version"></a>
## redis-version

The Redis GitHub latest-release API returns 8.10.2, published 2026-09-17.

Author: valkey-research

> "tag\_name": "8.10.2"

Source: [src-redis-release](#src-redis-release).

> "published\_at": "2026-09-17T15:06:56Z"

Source: [src-redis-release](#src-redis-release).

<a id="valkey-license"></a>
## valkey-license

Valkey 9.1.2 declares BSD-3-Clause licensing.

Author: valkey-research

> SPDX-License-Identifier: BSD-3-Clause

Source: [src-valkey-license](#src-valkey-license).

<a id="redis-license-options"></a>
## redis-license-options

Redis 8 and later offer a choice of RSALv2, SSPLv1 or AGPLv3; the earlier license boundary differs.

Author: valkey-research

> Redis 8 in Redis Open Source and later versions are available under our tri-license, allowing us to be both source-available and open source software. Our tri-license includes RSALv2, SSPLv1, and AGPLv3.

Source: [src-redis-license](#src-redis-license).

<a id="redis-old-licenses"></a>
## redis-old-licenses

Redis 7.2.x and earlier retain BSD3; Redis CE 7.4.x–7.8.x use RSALv2/SSPLv1.

Author: valkey-research

> Redis 7.2.x of Redis Open Source and earlier versions remain subject to the BSD3 license. Redis Community Edition 7.4.x to 7.8.x remain subject to the dual RSALv2/SSPLv1 license.

Source: [src-redis-license](#src-redis-license).

<a id="redis-integrated-types"></a>
## redis-integrated-types

Redis 8 includes RediSearch, RedisJSON, RedisTimeSeries and RedisBloom under the Redis tri-license.

Author: valkey-research

> RediSearch, RedisJSON, RedisTimeSeries, and RedisBloom are now included as integral components of Redis Open Source and subject to the same tri-license. Starting with Redis 8, the version numbers of all included modules are identical to the version number of Redis Open Source they are included in.

Source: [src-redis-license](#src-redis-license).

<a id="valkey-search-capability"></a>
## valkey-search-capability

The live Valkey Search README documents vector ANN/KNN and Numeric, Tag and Full-text search, indexing Hash or Valkey JSON data. This is a main-branch capability description.

Author: valkey-research

> It also provides support for hybrid / pure non vector workloads including Numeric, Tag, and Full-text searches. Valkey-Search allows users to create indexes and perform searches, incorporating complex filters. Users can index data using either \*\*\[Valkey Hash\]\(hashes.md\)\*\* or \*\*\[Valkey-JSON\]\(valkey-json.md\)\*\* data types. The vector queries support Approximate Nearest Neighbor \(ANN\) search with HNSW and exact matching using K-Nearest Neighbors \(KNN\).

Source: [src-valkey-search](#src-valkey-search).

<a id="valkey-json-capability"></a>
## valkey-json-capability

The live Valkey JSON README describes a module for native JSON support; its captured branch is unstable.

Author: valkey-research

> Valkey-json is a Valkey module written in C\+\+ that provides native JSON \(JavaScript Object Notation\) support for Valkey.

Source: [src-valkey-json](#src-valkey-json).

<a id="active-active-semantics"></a>
## active-active-semantics

Redis Software Active-Active uses CRDTs and entails different data types plus more complex replication/networking than a database without geo-distribution.

Author: valkey-research

> In Redis Software, Active-Active geo-distribution is based on conflict-free replicated data type \(CRDT\) technology. Compared to databases without geo-distribution, Active-Active databases have more complex replication and networking, as well as a different data type.

Source: [src-active-active](#src-active-active).

<a id="async-replication"></a>
## async-replication

Valkey replication is asynchronous.

Author: valkey-research

> Valkey uses asynchronous replication, with asynchronous replica-to-primary acknowledges of the amount of data processed.

Source: [src-replication](#src-replication).

<a id="wait-not-strong"></a>
## wait-not-strong

Valkey WAIT does not create strong consistency; acknowledged writes may still be lost on failover depending on persistence configuration.

Author: valkey-research

> the \`WAIT\` command. However \`WAIT\` is only able to ensure there are the specified number of acknowledged copies in the other Valkey instances, it does not turn a set of Valkey instances into a CP system with strong consistency: acknowledged writes can still be lost during a failover, depending on the exact configuration of the Valkey persistence.

Source: [src-replication](#src-replication).

<a id="persistence-cost"></a>
## persistence-cost

Valkey documents fork pauses for RDB persistence on large datasets; AOF also forks, with rewrite frequency configurable.

Author: valkey-research

> RDB needs to fork\(\) often in order to persist on disk using a child process. fork\(\) can be time consuming if the dataset is big, and may result in Valkey stopping serving clients for some milliseconds or even for one second if the dataset is very big and the CPU performance is not great. AOF also needs to fork\(\) but less frequently and you can tune how often you want to rewrite your logs without any trade-off on durability.

Source: [src-persistence](#src-persistence).

<a id="aof-durability"></a>
## aof-durability

Valkey documents appendfsync everysec as potentially losing one second of data during a disaster.

Author: valkey-research

> \`appendfsync everysec\`: \`fsync\` every second. Fast enough and you may lose 1 second of data if there is a disaster.

Source: [src-persistence](#src-persistence).

<a id="aws-rollback"></a>
## aws-rollback

ElastiCache only documents engine rollback from Valkey 7.2 to Redis OSS 7.1, even if the original source was older.

Author: valkey-research

> ElastiCache only supports rolling back from Valkey 7.2 to Redis OSS 7.1. This is true even if you upgraded to Valkey 7.2 from an earlier version than Redis OSS 7.1.

Source: [src-aws-upgrade](#src-aws-upgrade).

<a id="aws-parameters"></a>
## aws-parameters

ElastiCache cross-engine upgrades using custom parameter groups require a Valkey group with the same Redis OSS static parameter values.

Author: valkey-research

> If you have a custom cache parameter group applied to the existing Redis OSS replication group you wish to upgrade, you will need to pass a custom Valkey cache parameter group in the request as well. The input Valkey custom parameter group must have the same Redis OSS static parameter values as the existing Redis OSS custom parameter group.

Source: [src-aws-upgrade](#src-aws-upgrade).

<a id="valkey-performance-claim"></a>
## valkey-performance-claim

The Valkey 9.1 announcement reports 2.1 million requests/second with 512-byte payloads, nine IO threads and pipeline depth ten; this is a project-reported result.

Author: valkey-research

> Valkey 9.1.0 pushes single server throughput to 2.1 million requests per second using 512-byte payloads, 9 IO threads, and a pipeline depth of 10 commands.

Source: [src-valkey-performance](#src-valkey-performance).

<a id="aws-rollback-identity"></a>
## aws-rollback-identity

ElastiCache rollback requires associated users and user groups to use engine type REDIS.

Author: valkey-research

> Any user group and user associated with the replication group or serverless cache being rolled back must be configured with engine type REDIS.

Source: [src-aws-upgrade](#src-aws-upgrade).

<a id="search-dialect-boundary"></a>
## search-dialect-boundary

Valkey Search limits its compatibility contract to Redisearch Dialect 2 features it implements; it does not promise every Redisearch feature.

Author: report-revision

> The contract applies only to Redisearch Dialect 2 with features that Valkey Search actually implements. Valkey Search may not include every feature of Redisearch.

Source: [src-search-compatibility](#src-search-compatibility).

<a id="search-rebuild"></a>
## search-rebuild

Valkey Search documents rebuilding indexes from underlying hashes or JSON documents when migrating between it and Redisearch; persisted index state cannot be copied.

Author: report-revision

> Redisearch RDB files cannot be loaded directly by Valkey Search, and vice versa. Migrations between the two must rebuild indexes from the underlying data \(hashes or JSON documents\), not by copying persisted index state.

Source: [src-search-compatibility](#src-search-compatibility).

<a id="valkey-governance"></a>
## valkey-governance

Valkey governance assigns management to a Technical Steering Committee composed of repository maintainers.

Author: report-revision

> The Valkey project is managed by a Technical Steering Committee \(TSC\) composed of the maintainers of the Valkey repository.

Source: [src-governance](#src-governance).

<a id="valkey-affiliation-cap"></a>
## valkey-affiliation-cap

Valkey governance caps same-organization or affiliated-organization representation on its TSC at one third.

Author: report-revision

> At any time, no more than one third \(1/3\) of the TSC members may be employees, contractors, or representatives of the same organization or affiliated organizations.

Source: [src-governance](#src-governance).

<a id="redis-direction"></a>
## redis-direction

Redis Ltd. describes itself as setting and executing Redis’s vision; this is the vendor’s self-description.

Author: report-revision

> We set the vision for Redis and execute on it.

Source: [src-redis-governance](#src-redis-governance).

<a id="redis-performance-claim"></a>
## redis-performance-claim

Redis reports more than five times the throughput for Redis 8.6 versus Redis 7.2 in its published caching benchmark; this is a vendor claim comparing Redis releases.

Author: report-revision

> Redis 8.6 in Redis Open Source: More than 5x throughput compared to Redis 7.2

Source: [src-redis-performance](#src-redis-performance).

<a id="redis-performance-config"></a>
## redis-performance-config

The cited Redis 8.6 caching benchmark uses 16 cores on m8g.24xlarge, 11 I/O threads, pipeline depth 1, 2000 clients, a 1:10 SET:GET ratio, 1M keys and 1K string values.

Author: report-revision

> Single node; using only 16 cores on an m8g.24xlarge instance \(ARM, Graviton4\); 11 io-threads; Pipeline size: 1; 2000 clients Caching use case: 1:10 SET : GET ratio; 1M keys; 1K string values

Source: [src-redis-performance](#src-redis-performance).

<a id="matched-benchmark-method"></a>
## matched-benchmark-method

Redis benchmarking guidance requires comparable operations and benchmark behavior across data stores.

Author: report-revision

> Finally, the benchmark should apply the same operations, and work in the same way with the multiple data stores you want to compare. It is absolutely pointless to compare the result of redis-benchmark to the result of another benchmark program and extrapolate.

Source: [src-benchmark-method](#src-benchmark-method).

<a id="redis-wait-limit"></a>
## redis-wait-limit

Redis documents that WAIT improves real-world failover safety without making Redis strongly consistent.

Author: report-revision

> \`WAIT\` does not make Redis a strongly consistent store: while synchronous replication is part of a replicated state machine, it is not the only thing needed. However in the context of Sentinel or Redis Cluster failover, \`WAIT\` improves the real world data safety.

Source: [src-redis-wait](#src-redis-wait).

<a id="redis-aof-window"></a>
## redis-aof-window

Redis documents a possible one-second data-loss window with appendfsync everysec in a disaster.

Author: report-revision

> appendfsync everysec: fsync every second. Fast enough \(since version 2.4 likely to be as fast as snapshotting\), and you may lose 1 second of data if there is a disaster.

Source: [src-redis-persistence](#src-redis-persistence).

<a id="bounded-takeout"></a>
## Redis takeout is strongest at the OSS 7.2 compatibility baseline

**Interpretation:** Core workloads originating on Redis OSS 7.2 or earlier are practical Valkey migration candidates, subject to application and operations validation. Later Redis data formats make the migration a different engineering problem. ([compatible-base](evidence.md#compatible-base), [protocol-client](evidence.md#protocol-client), [ce74-files-incompatible](evidence.md#ce74-files-incompatible))

Supporting facts: [compatible-base](evidence.md#compatible-base), [protocol-client](evidence.md#protocol-client), [ce74-files-incompatible](evidence.md#ce74-files-incompatible). Counterevidence: [transaction-difference](evidence.md#transaction-difference).

<a id="feature-dependencies"></a>
## Feature labels do not establish interchangeability

**Interpretation:** Redis 8 includes richer data capabilities and Valkey has JSON/search modules; neither the shared names nor module API compatibility establish parity for a particular query, persistence image or framework. ([redis-integrated-types](evidence.md#redis-integrated-types), [valkey-search-capability](evidence.md#valkey-search-capability), [valkey-json-capability](evidence.md#valkey-json-capability), [module-api](evidence.md#module-api))

Supporting facts: [redis-integrated-types](evidence.md#redis-integrated-types), [valkey-search-capability](evidence.md#valkey-search-capability), [valkey-json-capability](evidence.md#valkey-json-capability), [module-api](evidence.md#module-api), [search-dialect-boundary](evidence.md#search-dialect-boundary), [search-rebuild](evidence.md#search-rebuild). Counterevidence: [active-active-semantics](evidence.md#active-active-semantics), [search-dialect-boundary](evidence.md#search-dialect-boundary), [search-rebuild](evidence.md#search-rebuild).

<a id="license-choice"></a>
## License and governance are decision inputs, not substitutes for fit

**Interpretation:** Valkey BSD and Redis 8 AGPL/RSAL/SSPL options are materially different choices. Calling all current Redis closed source would misstate its available licensing. ([valkey-license](evidence.md#valkey-license), [redis-license-options](evidence.md#redis-license-options), [redis-old-licenses](evidence.md#redis-old-licenses))

Supporting facts: [valkey-license](evidence.md#valkey-license), [redis-license-options](evidence.md#redis-license-options), [redis-old-licenses](evidence.md#redis-old-licenses), [valkey-governance](evidence.md#valkey-governance), [valkey-affiliation-cap](evidence.md#valkey-affiliation-cap), [redis-direction](evidence.md#redis-direction). Counterevidence: [redis-license-options](evidence.md#redis-license-options).

<a id="operational-fit"></a>
## Capacity and resilience need workload evidence

**Interpretation:** Both projects publish configuration-specific performance claims. Both document durability limits, so neither a benchmark headline nor retaining the current engine settles application performance or recovery objectives. ([valkey-performance-claim](evidence.md#valkey-performance-claim), [redis-performance-claim](evidence.md#redis-performance-claim), [redis-performance-config](evidence.md#redis-performance-config), [aof-durability](evidence.md#aof-durability), [redis-aof-window](evidence.md#redis-aof-window), [redis-wait-limit](evidence.md#redis-wait-limit))

Supporting facts: [valkey-performance-claim](evidence.md#valkey-performance-claim), [async-replication](evidence.md#async-replication), [wait-not-strong](evidence.md#wait-not-strong), [persistence-cost](evidence.md#persistence-cost), [aof-durability](evidence.md#aof-durability), [redis-performance-claim](evidence.md#redis-performance-claim), [redis-performance-config](evidence.md#redis-performance-config), [matched-benchmark-method](evidence.md#matched-benchmark-method), [redis-wait-limit](evidence.md#redis-wait-limit), [redis-aof-window](evidence.md#redis-aof-window). Counterevidence: [redis-performance-claim](evidence.md#redis-performance-claim), [redis-performance-config](evidence.md#redis-performance-config).

<a id="rollback-design"></a>
## Rollback is a data-path design, not just an endpoint change

**Interpretation:** A supported forward migration does not prove reverse compatibility or recovery of writes accepted after cutover. Managed services can impose especially narrow rollback versions. ([ce74-files-incompatible](evidence.md#ce74-files-incompatible), [async-replication](evidence.md#async-replication), [aws-rollback](evidence.md#aws-rollback), [replica-cutover](evidence.md#replica-cutover))

Supporting facts: [ce74-files-incompatible](evidence.md#ce74-files-incompatible), [async-replication](evidence.md#async-replication), [aws-rollback](evidence.md#aws-rollback), [replica-cutover](evidence.md#replica-cutover). Counterevidence: none recorded.

## Report prose

### Where replacement makes sense

**Interpretation:** Valkey is a credible replacement candidate for applications using the core Redis OSS 7.2-or-earlier surface, particularly when a permissive license is valuable. Treat replacement as a versioned compatibility project: the strongest evidence concerns that shared baseline, while newer Redis persistence, data capabilities and commercial service behavior need separate proof. There is no universal winner without the workload and operating requirements. ([bounded-takeout](evidence.md#bounded-takeout), [feature-dependencies](evidence.md#feature-dependencies), [license-choice](evidence.md#license-choice))

**Summary:** As of the 2026-10-17 source check, Valkey’s download page lists 9.1.2 and Redis’s latest-release API returns 8.10.2. These are currency anchors, not a recommended target pair. The migration guide’s worked standalone examples use Redis 7.2.5 and Valkey 7.2.6; do not apply their commands blindly to newer major versions or hosted products. ([valkey-version](evidence.md#valkey-version), [redis-version](evidence.md#redis-version), [migration-example](evidence.md#migration-example))

### Separate the engine, edition and dependency boundaries

**Conditional recommendation:** For a reconstructible cache using familiar core commands, a Valkey pilot is a reasonable first move. Sessions, queues, stream consumers, counters or locks deserve a higher validation bar when missing, duplicated or reordered operations affect correctness. This distinction follows from the documented asynchronous replication and persistence loss windows; the mere ability to connect a Redis client is insufficient. ([protocol-client](evidence.md#protocol-client), [async-replication](evidence.md#async-replication), [aof-durability](evidence.md#aof-durability))

**Conditional recommendation:** Redis 7.4\+ is outside the documented file-compatibility path. A logical export/import or application-mediated rebuild may be feasible, but it must account for the exact data types and changes made while copying. This research has not validated a specific tool or a universal live migration from Redis 8; retaining Redis can be the better decision when redesign or downtime exceeds the expected benefit. ([ce74-files-incompatible](evidence.md#ce74-files-incompatible))

**Interpretation:** Redis 8 integrates search, JSON, time series and probabilistic structures. Valkey Search and Valkey JSON also exist, so “Valkey has no JSON or search” is an unreliable comparison. More consequentially, the captured Valkey Search compatibility contract covers only implemented Redisearch Dialect 2 features, not every Redisearch feature. It requires rebuilding indexes from underlying hashes or JSON documents rather than copying persisted index state. Budget for rebuild time and validate query results, not just imported key counts. The captured READMEs/contract are rolling repository documents; confirm their applicability to the released module and hosting package selected. Module API compatibility alone does not prove a Redis Stack component can be swapped. ([redis-integrated-types](evidence.md#redis-integrated-types), [valkey-search-capability](evidence.md#valkey-search-capability), [valkey-json-capability](evidence.md#valkey-json-capability), [module-api](evidence.md#module-api), [search-dialect-boundary](evidence.md#search-dialect-boundary), [search-rebuild](evidence.md#search-rebuild))

**Conditional recommendation:** Redis Software Active-Active is a separate service capability based on CRDTs. A workload relying on its conflict resolution should not be mapped to ordinary Valkey asynchronous replication without a redesign and correctness proof. This is a concrete reason to stay with the existing product, or to assess another managed architecture separately from an engine swap. ([active-active-semantics](evidence.md#active-active-semantics), [async-replication](evidence.md#async-replication))

### Validate the application contract

**Conditional recommendation:** Inventory commands and options, scripts/functions, transactions, modules, serialization, client/framework versions, connection pooling, retries, TLS/ACL settings and topology discovery. Exercise representative success and error paths on the selected target. For example, Valkey 8.0 changes nested MULTI/WATCH behavior to abort a transaction; connection success would not catch that semantic difference. ([protocol-client](evidence.md#protocol-client), [module-api](evidence.md#module-api), [transaction-difference](evidence.md#transaction-difference))

**Interpretation:** Consider this illustrative example, which was not executed: a client passes PING and ordinary reads, then a faulty code path sends nested MULTI inside a transaction. The Valkey 8.0 release note records transaction abortion for nested MULTI/WATCH, so a connection-only test misses a behavior the application may depend on. The lesson is to compare complete success and failure paths against the exact source and target versions; this example does not claim every transaction changes. ([protocol-client](evidence.md#protocol-client), [transaction-difference](evidence.md#transaction-difference))

**Summary:** Include operational consumers of the protocol. Valkey’s compatibility INFO field reports redis\_version:7.2.4; identify the actual engine with server\_name and valkey\_version when checking versions or interpreting telemetry. Check packaging as well: Valkey 9.1 moved Lua into a module, but its release notes also say the engine is statically linked by default. Do not infer that every deployment requires a separate dynamically loaded Lua library. ([info-version](evidence.md#info-version), [lua-module](evidence.md#lua-module), [lua-packaging](evidence.md#lua-packaging))

### Compare operating outcomes, not headline throughput

**Interpretation:** Both projects report performance improvements, but their headline numbers answer different questions. Valkey’s 9.1 announcement reports 2.1 million requests/second with 512-byte payloads, nine I/O threads and pipeline depth ten. Redis reports more than five times Redis 7.2 throughput for Redis 8.6 using a single-node caching workload: 16 cores on m8g.24xlarge, 11 I/O threads, pipeline depth one, 2000 clients, 1:10 SET:GET, 1M keys and 1K string values. Both are publisher-reported results. Redis’s result is evidence to evaluate an in-family upgrade, not evidence that it beats Valkey; the differing settings prevent a defensible head-to-head ranking. ([valkey-performance-claim](evidence.md#valkey-performance-claim), [redis-performance-claim](evidence.md#redis-performance-claim), [redis-performance-config](evidence.md#redis-performance-config))

**Conditional recommendation:** Compare p95/p99 latency and throughput under the same command mix, key/value sizes, concurrency, TLS, persistence, replica topology and failure conditions. Include memory/RSS, evictions, saturation, restart and backup/rewrite behavior. Redis’s own benchmarking guidance calls for equivalent operations and benchmark behavior across stores. No workload benchmark was run here. ([matched-benchmark-method](evidence.md#matched-benchmark-method), [persistence-cost](evidence.md#persistence-cost))

**Interpretation:** Recovery objectives must survive the engine change. Valkey replication is asynchronous; WAIT can reduce exposure but does not guarantee strong consistency. AOF everysec can lose roughly one second of writes in a disaster, and snapshot/rewrite work can affect latency. These are not uniquely Valkey disadvantages: Redis also documents WAIT’s consistency limit and a possible one-second loss with AOF everysec. A team using either store as durable state needs recovery tests alongside throughput tests. ([async-replication](evidence.md#async-replication), [wait-not-strong](evidence.md#wait-not-strong), [aof-durability](evidence.md#aof-durability), [persistence-cost](evidence.md#persistence-cost), [redis-wait-limit](evidence.md#redis-wait-limit), [redis-aof-window](evidence.md#redis-aof-window))

**Conditional recommendation:** Compare the complete service bill and ownership: capacity, replicas, network, backups, patching, observability, support and migration effort. Managed-service parameters and rollback rules belong to that comparison; for example, ElastiCache requires matching static parameter values when moving custom groups to Valkey. No prices, contract terms or staffing costs were supplied, so this report cannot establish savings. ([aws-parameters](evidence.md#aws-parameters), [operational-fit](evidence.md#operational-fit))

### A migration should prove correctness and recoverability

**Conditional recommendation:** First define acceptance thresholds and test the exact source/target packages in an isolated environment. Restore a representative backup and replay representative application traffic. Check values and types, remaining TTLs, scripts, transaction outcomes, stream pending/consumer state where used, and index/query results where used. Key counts are a useful check but cannot establish semantic equivalence. Also test client reconnection, failover, shard routing and authentication. ([bounded-takeout](evidence.md#bounded-takeout), [feature-dependencies](evidence.md#feature-dependencies), [transaction-difference](evidence.md#transaction-difference))

**Conditional recommendation:** Select a path consistent with the verified versions. A quiesced snapshot restore trades downtime for simplicity. For a compatible cluster, the project describes adding Valkey replicas and promoting them per primary. Rehearse the full cutover: stop or fence writers, let replication catch up, verify offsets and application state, promote, redirect/reconnect clients, and watch correctness plus latency. A live replication link alone does not prove that every final write was applied. ([snapshot-quiesce](evidence.md#snapshot-quiesce), [replica-cutover](evidence.md#replica-cutover), [async-replication](evidence.md#async-replication))

**Conditional recommendation:** Define rollback before cutover. Keep a tested pre-cutover recovery point and specify who owns writes at each stage. Before new writes reach the target, returning to the preserved source may be straightforward; afterward, returning to an unchanged source discards those writes unless they can be reconciled or replayed. Test that recovery path explicitly. Do not assume newer Valkey files or features can be consumed by the old Redis source. ([rollback-design](evidence.md#rollback-design))

**Interpretation:** Consider a second illustrative example, rather than an observed incident: after a fenced cutover, the new target accepts an order-status update while the preserved old source receives no further writes. Switching the application back to that unchanged source omits the update by construction. A usable rollback design therefore needs a tested way to replay or reconcile those writes, or an explicit decision to lose them. Documented forward replication and a pre-cutover snapshot do not by themselves supply that recovery path. ([replica-cutover](evidence.md#replica-cutover), [snapshot-quiesce](evidence.md#snapshot-quiesce), [async-replication](evidence.md#async-replication))

**Interpretation:** For hosted services, use the provider’s exact version matrix and recovery procedure. ElastiCache currently documents rollback only from Valkey 7.2 to Redis OSS 7.1, with user/user-group engine requirements. That is not evidence for an in-place rollback from Valkey 8 or 9. Keep this provider-specific constraint separate from upstream Valkey capability. ([aws-rollback](evidence.md#aws-rollback), [aws-rollback-identity](evidence.md#aws-rollback-identity))

### Governance and license choice are distinct from technical fit

**Interpretation:** Valkey 9.1.2 declares BSD-3-Clause. Redis OSS through 7.2 remains BSD; Redis CE 7.4–7.8 uses RSAL/SSPL, and Redis 8\+ adds AGPLv3 as a choice alongside those licenses. Select the terms that fit the intended use and distribution model; the presence of an AGPL option means “Redis is no longer open source” is not an accurate blanket statement about current Redis. License preference can motivate evaluation, but it does not eliminate migration work. ([valkey-license](evidence.md#valkey-license), [redis-old-licenses](evidence.md#redis-old-licenses), [redis-license-options](evidence.md#redis-license-options))

**Interpretation:** Valkey’s formal governance assigns management to its maintainers’ Technical Steering Committee and limits any organization or affiliated organizations to one third of TSC membership. Redis Ltd. states that it sets and executes Redis’s vision. This is a meaningful distinction for teams weighing influence and stewardship, but the Redis source is a company self-description and does not establish its formal maintainer-selection process. Neither governance model alone proves better support, availability or operating cost. ([valkey-governance](evidence.md#valkey-governance), [valkey-affiliation-cap](evidence.md#valkey-affiliation-cap), [redis-direction](evidence.md#redis-direction))

### What would change the decision

**Open question:** The unresolved inputs are the current Redis product/version and host; actual commands, modules and clients; cache versus authoritative-state role; data size and growth; peak traffic and hot keys; latency, availability and recovery objectives; multi-region conflict semantics; acceptable downtime; support obligations; and available migration capacity. No application benchmark, restore drill or production compatibility test was run.

**Conditional recommendation:** Proceed to a bounded Valkey pilot when the shared command surface, licensing goals and recovery requirements fit. Keep or upgrade Redis when integrated features or commercial Active-Active behavior are required and a substitute is unproven, or when migration effort and operational risk outweigh the expected gain. Consider a Redis upgrade as a competing option when capacity is the motive; its published performance claim still needs workload validation. The practical next step is to identify the workload’s decisive dependency and prove it in an isolated pilot before committing to replacement. ([bounded-takeout](evidence.md#bounded-takeout), [feature-dependencies](evidence.md#feature-dependencies), [operational-fit](evidence.md#operational-fit), [rollback-design](evidence.md#rollback-design), [redis-performance-claim](evidence.md#redis-performance-claim), [active-active-semantics](evidence.md#active-active-semantics), [redis-integrated-types](evidence.md#redis-integrated-types))

## Authored brief prose

### Lead with the boundary, not the brand

**Conditional recommendation:** The central takeaway for platform engineers: Valkey deserves a bounded pilot for workloads on the shared Redis OSS 7.2-or-earlier surface, but Redis takeout is a compatibility and recovery decision, not an endpoint rename. Lead with that distinction; a permissive license can motivate evaluation without proving technical fit. The audience should leave able to identify the dependency that could reverse its choice. ([bounded-takeout](evidence.md#bounded-takeout), [license-choice](evidence.md#license-choice), [rollback-design](evidence.md#rollback-design))

### Build the argument in three steps

**Conditional recommendation:** Start with where the case is strongest: a reconstructible cache using the shared core command surface. Then contrast two decision-changing dependencies: Redis CE 7.4\+ persistence files are outside the documented compatibility path, and Redis Software Active-Active uses CRDT semantics that ordinary asynchronous replication does not replace. This progression explains why the same migration answer cannot apply to every Redis deployment. ([compatible-base](evidence.md#compatible-base), [ce74-files-incompatible](evidence.md#ce74-files-incompatible), [active-active-semantics](evidence.md#active-active-semantics), [async-replication](evidence.md#async-replication))

**Conditional recommendation:** Next, make “compatible” concrete. Existing clients can connect, yet Valkey 8.0 records changed nested MULTI/WATCH transaction behavior. Search is another useful boundary: Valkey Search exists, but its captured contract covers only implemented Redisearch Dialect 2 features and requires index rebuilding from hashes or JSON documents. These examples support testing failure paths and query results, not merely PING and key counts; the rolling module documents still require release-specific confirmation. ([protocol-client](evidence.md#protocol-client), [transaction-difference](evidence.md#transaction-difference), [search-dialect-boundary](evidence.md#search-dialect-boundary), [search-rebuild](evidence.md#search-rebuild))

**Conditional recommendation:** Close with the decision that survives cutover. In an illustrative scenario—not an observed incident—the new target accepts a write while the preserved old source stays unchanged. Switching back omits that write unless it is replayed or reconciled. Use this mechanism to connect compatibility testing to a rehearsed recovery path, then ask which validation would most likely stop this particular migration. ([replica-cutover](evidence.md#replica-cutover), [snapshot-quiesce](evidence.md#snapshot-quiesce), [async-replication](evidence.md#async-replication), [rollback-design](evidence.md#rollback-design))

### Keep the strongest evidence in speaker notes

**Conditional recommendation:** A source/target/write-flow sketch can explain the rollback problem more clearly than a throughput race. If showing performance claims, retain the publishers and configurations: Valkey’s 9.1 headline uses 512-byte payloads, nine I/O threads and pipeline depth ten; Redis’s 8.6 claim compares against Redis 7.2 with 1K values, eleven I/O threads and pipeline depth one. These are different tests, not a head-to-head ranking. Redis’s own upgrade is a legitimate alternative to evaluate when capacity is the motive. ([valkey-performance-claim](evidence.md#valkey-performance-claim), [redis-performance-claim](evidence.md#redis-performance-claim), [redis-performance-config](evidence.md#redis-performance-config), [matched-benchmark-method](evidence.md#matched-benchmark-method))

**Interpretation:** Give the strongest case for staying with Redis: required integrated features or commercial Active-Active semantics may outweigh a license preference and replacement effort. Both stores document limits to WAIT and possible AOF-everysec data loss, so resilience should be tested on both sides. Valkey’s governance and BSD license are distinct benefits to assess, not proof of lower operating cost. ([redis-integrated-types](evidence.md#redis-integrated-types), [active-active-semantics](evidence.md#active-active-semantics), [wait-not-strong](evidence.md#wait-not-strong), [redis-wait-limit](evidence.md#redis-wait-limit), [aof-durability](evidence.md#aof-durability), [redis-aof-window](evidence.md#redis-aof-window), [license-choice](evidence.md#license-choice))

### Preserve these limits when shortening

**Conditional recommendation:** The evidence was captured on 2026-10-17; release listings are date anchors, not recommended targets. The migration walkthrough uses Redis 7.2.5 and Valkey 7.2.6. ElastiCache’s documented rollback pair is specifically Valkey 7.2 to Redis OSS 7.1, not a promise for newer upstream releases. Keep edition, version and provider labels beside these claims. ([valkey-version](evidence.md#valkey-version), [redis-version](evidence.md#redis-version), [migration-example](evidence.md#migration-example), [aws-rollback](evidence.md#aws-rollback))

**Open question:** No application benchmark, production migration, cost model or recovery drill was run. The actual workload, modules, topology, downtime budget and recovery objectives remain unknown; the presentation can justify a validation plan, not promise savings or migration success.

<a id="src-migration"></a>
## Migration from Redis to Valkey

[Original source](https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/migration.md) · Valkey · public · full context

accessed_at: 2026-10-17T13:47:02.856335\+00:00

version: Redis OSS &lt;=7.2; example Redis 7.2.5/Valkey 7.2.6

Capture: [saved context](sources/revisions/eea9887f392bdc51d42bc211122451f71c23e05b3aaa9ff080a4427ccd4d19a4.txt); SHA-256: `eea9887f392bdc51d42bc211122451f71c23e05b3aaa9ff080a4427ccd4d19a4`.

<a id="src-valkey-download"></a>
## Valkey download

[Original source](https://valkey.io/download/) · Valkey · public · full context

accessed_at: 2026-10-17T13:47:03.004224\+00:00

version: Live release listing

Capture: [saved context](sources/revisions/86a6b1bee55fc3adcb8f6590ece4a05bada99864ffc2b11cf0b193462796d9ab.txt); SHA-256: `86a6b1bee55fc3adcb8f6590ece4a05bada99864ffc2b11cf0b193462796d9ab`.

<a id="src-valkey-8-release"></a>
## Valkey 8.0 release notes

[Original source](https://raw.githubusercontent.com/valkey-io/valkey/8.0.0/00-RELEASENOTES) · Valkey · public · full context

accessed_at: 2026-10-17T13:47:02.938541\+00:00

version: 8.0.0

Capture: [saved context](sources/revisions/cecf9155785c92408a78d4eea97ec42e3d0c1316d00d0293b5225b7826120eac.txt); SHA-256: `cecf9155785c92408a78d4eea97ec42e3d0c1316d00d0293b5225b7826120eac`.

<a id="src-valkey-9-release"></a>
## Valkey 9.1 release notes

[Original source](https://raw.githubusercontent.com/valkey-io/valkey/9.1.2/00-RELEASENOTES) · Valkey · public · full context

source_date: 2026-08-31

accessed_at: 2026-10-17T13:47:02.934031\+00:00

version: 9.1.2

Capture: [saved context](sources/revisions/50e9b70d6379f717001b8cc27dbd3abae9972b0c6ae377c327ae9933238f14e7.txt); SHA-256: `50e9b70d6379f717001b8cc27dbd3abae9972b0c6ae377c327ae9933238f14e7`.

<a id="src-valkey-search"></a>
## Valkey Search README

[Original source](https://raw.githubusercontent.com/valkey-io/valkey-search/main/README.md) · Valkey · public · full context

accessed_at: 2026-10-17T13:47:02.932905\+00:00

version: main at access

Capture: [saved context](sources/revisions/86273b00d0ca3646c29232841e1c975fa0c360fec068b16112a2c1d1a85b723a.txt); SHA-256: `86273b00d0ca3646c29232841e1c975fa0c360fec068b16112a2c1d1a85b723a`.

<a id="src-redis-license"></a>
## Redis licenses

[Original source](https://redis.io/legal/licenses/) · Redis · public · full context

accessed_at: 2026-10-17T13:47:03.397594\+00:00

version: Version-specific license table at access

Capture: [saved context](sources/revisions/b6b6f489c788357b858ad373cc071cf8f7ffd0196d30167e7e762efe5d053dea.txt); SHA-256: `b6b6f489c788357b858ad373cc071cf8f7ffd0196d30167e7e762efe5d053dea`.

<a id="src-redis-release"></a>
## Latest Redis GitHub release

[Original source](https://api.github.com/repos/redis/redis/releases/latest) · Redis · public · full context

source_date: 2026-09-17

accessed_at: 2026-10-17T13:47:03.165196\+00:00

version: 8.10.2

Capture: [saved context](sources/revisions/6c3ccdf27fcabf8ffd6491366571636d2f1ffe9f21c1f8d1aa5beaa19dc551bb.txt); SHA-256: `6c3ccdf27fcabf8ffd6491366571636d2f1ffe9f21c1f8d1aa5beaa19dc551bb`.

<a id="src-active-active"></a>
## Planning Active-Active databases

[Original source](https://redis.io/docs/latest/operate/rs/databases/active-active/planning/) · Redis · public · full context

accessed_at: 2026-10-17T13:47:03.336964\+00:00

version: Redis Software latest docs

Capture: [saved context](sources/revisions/b546139255fafab0ab1eb0f9972ddecf764c882f4df19c03942822519fbe64d6.txt); SHA-256: `b546139255fafab0ab1eb0f9972ddecf764c882f4df19c03942822519fbe64d6`.

<a id="src-replication"></a>
## Valkey replication

[Original source](https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/replication.md) · Valkey · public · full context

accessed_at: 2026-10-17T13:47:03.213502\+00:00

version: main at access

Capture: [saved context](sources/revisions/acf492a46ce29bc6af585812fac82b3581417c0aaed5c171f02ba354c3da00de.txt); SHA-256: `acf492a46ce29bc6af585812fac82b3581417c0aaed5c171f02ba354c3da00de`.

<a id="src-persistence"></a>
## Valkey persistence

[Original source](https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/persistence.md) · Valkey · public · full context

accessed_at: 2026-10-17T13:47:03.196507\+00:00

version: main at access

Capture: [saved context](sources/revisions/b354043de4b51b4fad46675cf74166d37ebae24f5c4d43b5f607de8b54331203.txt); SHA-256: `b354043de4b51b4fad46675cf74166d37ebae24f5c4d43b5f607de8b54331203`.

<a id="src-aws-upgrade"></a>
## ElastiCache cross-engine upgrades

[Original source](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/VersionManagement.HowTo.html) · AWS · public · full context

accessed_at: 2026-10-17T13:47:03.526050\+00:00

version: Live ElastiCache service docs

Capture: [saved context](sources/revisions/f629eaa719d0d0a1deaa499af028531d932ee076adaf244e385a4e0cbaae266b.txt); SHA-256: `f629eaa719d0d0a1deaa499af028531d932ee076adaf244e385a4e0cbaae266b`.

<a id="src-valkey-json"></a>
## Valkey JSON README

[Original source](https://raw.githubusercontent.com/valkey-io/valkey-json/unstable/README.md) · Valkey · public · full context

accessed_at: 2026-10-17T13:48:00.583522\+00:00

version: unstable at access; feature presence, not release guarantee

Capture: [saved context](sources/revisions/8a8ad9cbb37c4510f00964507e762f2845345b4f78166ce8a2d8134e0a35e01e.txt); SHA-256: `8a8ad9cbb37c4510f00964507e762f2845345b4f78166ce8a2d8134e0a35e01e`.

<a id="src-valkey-license"></a>
## Valkey license

[Original source](https://raw.githubusercontent.com/valkey-io/valkey/9.1.2/COPYING) · Valkey · public · full context

accessed_at: 2026-10-17T13:48:00.846249\+00:00

version: 9.1.2

Capture: [saved context](sources/revisions/bbb0919072f229f6146c50f9b39a156f3a6fc7eff7277865a3420f9bf046d75f.txt); SHA-256: `bbb0919072f229f6146c50f9b39a156f3a6fc7eff7277865a3420f9bf046d75f`.

<a id="src-valkey-performance"></a>
## Valkey 9.1 announcement

[Original source](https://valkey.io/blog/valkey-9-1-delivers-improvements-in-security-performance-and-more/) · Valkey · public · full context

source_date: 2026-05-19

accessed_at: 2026-10-17T13:48:00.970959\+00:00

version: 9.1.0; published 2026-05-19

Capture: [saved context](sources/revisions/fd012db1abea0568b5dd256934fbb1ddcb54e3bd7d7e32d8c8763638c9c5daea.txt); SHA-256: `fd012db1abea0568b5dd256934fbb1ddcb54e3bd7d7e32d8c8763638c9c5daea`.

<a id="src-governance"></a>
## Valkey project governance

[Original source](https://raw.githubusercontent.com/valkey-io/valkey/unstable/GOVERNANCE.md) · Valkey project · public · full context

source_date: Retrieved 2026-10-17

accessed_at: 2026-10-17T12:51:46.952Z

version: Rolling repository document as captured 2026-10-17; validate chosen release

Capture: [saved context](sources/revisions/2e314116c14fafafe718c55668b849a5f0cf3081305d6e342583c2f5649267a3.txt); SHA-256: `2e314116c14fafafe718c55668b849a5f0cf3081305d6e342583c2f5649267a3`.

<a id="src-redis-governance"></a>
## Redis licenses and licensing FAQ

[Original source](https://redis.io/legal/licenses/) · Redis Ltd. · public · partial context

Full substantive Licenses sections preserved from browser text extraction \(lines 188–313\); original HTML fetch returned HTTP 403. Browser capture retained as a-redis-license-web.txt; navigation and footer omitted. Reused saved capture; no fresh retrieval during this revision.

source_date: Retrieved 2026-10-17

accessed_at: 2026-10-17T12:51:46.955Z

Capture: [saved context](sources/revisions/11bf74f2bfc35b44befd0166ac3bf413c083b25deb866560170cc9b7933a4a77.txt); SHA-256: `11bf74f2bfc35b44befd0166ac3bf413c083b25deb866560170cc9b7933a4a77`.

<a id="src-search-compatibility"></a>
## Valkey Search compatibility contract

[Original source](https://raw.githubusercontent.com/valkey-io/valkey-search/main/COMPATIBILITY.md) · Valkey project · public · full context

source_date: Retrieved 2026-10-17; rolling documentation

accessed_at: 2026-10-17T12:51:54.797Z

version: Rolling repository document as captured 2026-10-17; validate chosen release

Original: [saved original](sources/revisions/20490eb6f84b0ba8feb328b58435920c999883b398f20d542e1234901e1467aa.md); SHA-256: `20490eb6f84b0ba8feb328b58435920c999883b398f20d542e1234901e1467aa`.

Capture: [saved context](sources/revisions/20490eb6f84b0ba8feb328b58435920c999883b398f20d542e1234901e1467aa.txt); SHA-256: `20490eb6f84b0ba8feb328b58435920c999883b398f20d542e1234901e1467aa`.

<a id="src-redis-performance"></a>
## Announcing Redis 8.6: Performance improvements

[Original source](https://redis.io/blog/announcing-redis-86-performance-improvements-streams/) · Redis · public · partial context

Complete performance section captured from browser extraction; original HTML request returned HTTP 403. Charts were not transcribed; only explicit surrounding prose is cited. Raw web capture retained in a-redis-perf-blog-web.txt. Reused saved capture; no fresh retrieval during this revision.

source_date: 2026-02-10

accessed_at: 2026-10-17T12:53:25.777Z

Capture: [saved context](sources/revisions/b808ffef0c39ea13efddccd15dd7bcbb0922ff4dd4c049a40e458a03edf6ee3c.txt); SHA-256: `b808ffef0c39ea13efddccd15dd7bcbb0922ff4dd4c049a40e458a03edf6ee3c`.

<a id="src-benchmark-method"></a>
## Redis benchmark documentation

[Original source](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/benchmarks/) · Redis · public · partial context

Browser extraction of full sections from How fast is Redis through Other things to consider; original HTML request returned HTTP 403. Older example-results section omitted. Raw web capture retained in a-redis-benchmarks-web.txt. Reused saved capture; no fresh retrieval during this revision.

source_date: Retrieved 2026-10-17

accessed_at: 2026-10-17T12:53:25.778Z

Capture: [saved context](sources/revisions/b8664ef8c9dd3ad8acdda68ef02b78e284bbb19465b3b99290328a1377e9b56c.txt); SHA-256: `b8664ef8c9dd3ad8acdda68ef02b78e284bbb19465b3b99290328a1377e9b56c`.

<a id="src-redis-wait"></a>
## Redis WAIT command \(official documentation source\)

[Original source](https://raw.githubusercontent.com/redis/docs/master/content/commands/wait.md) · Redis · public · full context

source_date: Retrieved 2026-10-17; rolling documentation

accessed_at: 2026-10-17T12:57:48.751Z

Original: [saved original](sources/revisions/00aac1fbeee6d4640775ae70dc56b1f793cab7be853526e6e712f20a813263a1.md); SHA-256: `00aac1fbeee6d4640775ae70dc56b1f793cab7be853526e6e712f20a813263a1`.

Capture: [saved context](sources/revisions/00aac1fbeee6d4640775ae70dc56b1f793cab7be853526e6e712f20a813263a1.txt); SHA-256: `00aac1fbeee6d4640775ae70dc56b1f793cab7be853526e6e712f20a813263a1`.

<a id="src-redis-persistence"></a>
## Redis persistence

[Original source](https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/) · Redis · public · full context

source_date: retrieved 2026-10-17

accessed_at: 2026-10-17T12:52:19.910Z

Original: [saved original](sources/revisions/4bfcca2befb867404c3dd0a804388dfc1cc2180a35ed4aa12ded55ecda03acad.html); SHA-256: `4bfcca2befb867404c3dd0a804388dfc1cc2180a35ed4aa12ded55ecda03acad`.

Capture: [saved context](sources/revisions/100d094718bc6485db2394355778363e626d8eb8c7cdd88e1bcfd09bb6cd41ea.txt); SHA-256: `100d094718bc6485db2394355778363e626d8eb8c7cdd88e1bcfd09bb6cd41ea`.

## Independent review

Reviewer: editorial-checker. Independent review of 21 source contexts, 38 facts, five findings, 22 report blocks and eight authored brief blocks. The authored brief provides a useful prioritized storyline for a 20-minute platform-engineering presentation, with concrete semantic and rollback examples, Redis retain/upgrade alternatives, and qualifications expressed in prose even without type labels. Original Search/WAIT Markdown, original Redis persistence HTML and retained browser contexts were inspected. Reused October 17 captures establish dated evidence only: no live refresh, chart-image validation, workload benchmark, cost model or migration drill. Three partial browser captures retain adequate context for their narrow claims; their documented HTTP 403 history is not treated as successful original-HTML access. No blocking objections.

- compatible-base — supported: Migration introduction and source/target table establish the OSS &lt;=7.2 baseline and 7.2.4 fork; not universal compatibility with every later behavior.
- ce74-files-incompatible — supported: Migration guide explicitly excludes CE 7.4\+ files and says alternate methods are outside its scope.
- protocol-client — supported: Protocol paragraph specifies RESP2/RESP3 and existing-client connection support; report distinguishes connection from semantic equivalence.
- module-api — supported: Migration module paragraph supports Redis OSS RedisModule\_ API compatibility; report does not generalize this to Redis Stack feature parity.
- info-version — supported: INFO paragraph explicitly gives redis\_version:7.2.4 plus server\_name and valkey\_version for actual identity.
- migration-example — supported: Standalone section explicitly states Redis 7.2.5 and Valkey 7.2.6; examples are not newer-version validation.
- snapshot-quiesce — supported: Physical migration section names shutdown/load downtime and disconnection of active clients to prevent write loss.
- replica-cutover — supported: Cluster section describes Valkey replicas, per-primary promotion and removing Redis nodes; no reverse-path guarantee is inferred.
- transaction-difference — supported: 8.0 release-note Behavior Changes - Core contains nested MULTI/WATCH abortion. Illustrative applications remain unexecuted.
- lua-packaging — supported: 9.1 release history records static linking by default in rc2, after the rc1 module extraction; later sections do not reverse this.
- lua-module — supported: 9.1 rc1 history explicitly moves Lua into a module; static-link default is retained alongside it in the report.
- valkey-version — supported: Dated download capture lists 9.1.2 under Version 9.x.x. Reviewed as capture-time evidence, not a fresh website check.
- redis-version — supported: Saved latest-release API response has tag 8.10.2, prerelease false and the cited September 17 publication timestamp.
- valkey-license — supported: Both copyright sections of the tagged COPYING file declare BSD 3-Clause; no legal conclusion about a user deployment is made.
- redis-license-options — supported: License page explicitly provides the Redis 8\+ tri-license choices; context identifies AGPLv3 as an open-source option.
- redis-old-licenses — supported: Past-license paragraph states BSD3 through 7.2 and RSAL/SSPL for 7.4 through 7.8; surrounding product table is consistent.
- redis-integrated-types — supported: Same Redis Open Source licensing paragraph names Search, JSON, TimeSeries and Bloom as integrated Redis 8 components.
- valkey-search-capability — supported: README opening and supported-command context describe the cited search capabilities; claim remains a main-branch description.
- valkey-json-capability — supported: Unstable README explicitly describes native JSON support through a module; no stable-release guarantee is asserted.
- active-active-semantics — supported: Redis Software planning page scopes CRDT behavior and added replication/network complexity to Active-Active.
- async-replication — supported: Replication introduction and important-facts list document asynchronous default operation; optional WAIT is discussed separately.
- wait-not-strong — supported: Replication context says WAIT acknowledges copies, reduces loss probability, but does not create CP/strong consistency.
- persistence-cost — supported: RDB disadvantages explain dataset/CPU-dependent fork pauses and AOF rewrite frequency; claim retains conditions.
- aof-durability — supported: Valkey AOF durability section names appendfsync everysec and possible one-second loss; other fsync modes are not conflated.
- aws-rollback — supported: Rollback requirements explicitly limit ElastiCache to Valkey 7.2 -&gt; Redis OSS 7.1, including older original Redis sources.
- aws-parameters — supported: Custom-group paragraph requires matching static parameter values for cross-engine replication-group upgrade.
- valkey-performance-claim — supported: Valkey 9.1 announcement performance paragraph contains 2.1M, 512 bytes, nine I/O threads and depth ten; publisher claim only.
- aws-rollback-identity — supported: AWS rollback requirements explicitly cover both users and user groups with REDIS engine type.
- search-dialect-boundary — supported: Original COMPATIBILITY.md scopes expected compatibility to implemented Dialect 2 features and explicitly excludes missing features.
- search-rebuild — supported: Original persistence and non-goals sections rule out copied index state and direct cross-module replication; rebuild from hashes/JSON is explicit.
- valkey-governance — supported: Governance opening assigns project management to the maintainers TSC; later text allows explicit additions.
- valkey-affiliation-cap — supported: Governance section caps same/affiliated organization membership at one third and describes remediation for breaches.
- redis-direction — supported: Retained browser context identifies the quoted statement as Redis Ltd marketing/self-description, not a formal governance rule.
- redis-performance-claim — supported: Retained performance browser context attributes &gt;5x to Redis 8.6 versus Redis 7.2 in caching; not a Valkey comparison.
- redis-performance-config — supported: Browser lines 214-221 align all cited settings with that same throughput chart; the separate depth-16 number is not mixed in.
- matched-benchmark-method — supported: Saved benchmark context calls for equal operations, pipeline behavior and similar connections across stores.
- redis-wait-limit — supported: Original WAIT Markdown explicitly says safety improves for Sentinel/Cluster failover while synchronous replicated writes can still be lost.
- redis-aof-window — supported: Original HTML AOF durability list and readable extraction agree on possible one-second loss with everysec.
- bounded-takeout — supported: Supported conditional inference from the versioned baseline. Transaction counterevidence is explained, and alternate CE 7.4\+ migration remains unvalidated.
- feature-dependencies — supported: Availability is separated from interchangeability. Implemented Dialect 2, index rebuilding, rolling documentation and the strongest case for retaining Redis are preserved.
- license-choice — supported: Version-specific license options and unequal governance evidence support this limited conclusion; no legal fit, cost or support superiority is claimed.
- operational-fit — supported: Distinct publisher benchmark configurations and durability limits support workload validation. A Redis upgrade is explicitly a competing option; no head-to-head ranking or savings is invented.
- rollback-design — supported: Forward compatibility does not establish reverse recovery. Source isolation plus new target writes supports the illustrative data-path reasoning; AWS limits remain provider-specific.
- answer:0 — supported: Accurately prioritizes the shared baseline, conditional replacement and separate feature/service proof; no universal winner.
- answer:1 — supported: Release numbers match dated captures and are explicitly not target recommendations; migration example versions stay visible.
- boundaries:0 — supported: Reasonable workload-risk recommendation from replication/persistence evidence; it does not claim any workload was tested.
- boundaries:1 — supported: Correctly distinguishes documented file incompatibility from possible but unvalidated alternative migration methods.
- boundaries:2 — supported: Feature availability and parity are separated; Dialect 2, index rebuild, query validation and rolling-module limits survive natural prose.
- boundaries:3 — supported: CRDT semantics and ordinary asynchronous replication are materially distinct; retaining the service is a conditional recommendation.
- dependencies:0 — supported: Inventory/testing advice is appropriate and the transaction counterexample is supported by the 8.0 behavior note.
- dependencies:1 — supported: The hypothetical transaction example is explicitly unexecuted and limited to a documented error-path change.
- dependencies:2 — supported: INFO identity fields and Lua module/static-linking history match the sources without assuming mandatory dynamic deployment.
- operations:0 — supported: Publisher attribution, Redis-to-Redis baseline and distinct numerical configurations prevent a false comparative ranking.
- operations:1 — supported: Matched-workload and recovery measurements are recommendations; explicit no-benchmark wording remains.
- operations:2 — supported: Both stores have documented WAIT/AOF limitations; recommendation does not imply tested equivalence or uniquely Valkey risk.
- operations:3 — supported: Ownership/cost dimensions are proposed comparisons, with AWS static parameters as a supported example and no established savings.
- migration:0 — supported: The validation checklist follows version and semantics boundaries; no test outcome is represented as observed.
- migration:1 — supported: Snapshot and cluster paths remain version-conditioned; writer fencing and state checks are advice based on asynchronous replication.
- migration:2 — supported: Post-cutover write recovery and reverse compatibility are appropriately separate from a documented forward path.
- migration:3 — supported: Illustrative order-status scenario is explicitly hypothetical and its unchanged-source premise entails the lost update.
- migration:4 — supported: AWS version pair and user requirements remain limited to ElastiCache; no upstream/newer-version guarantee is implied.
- license:0 — supported: License boundaries match the saved vendor/tagged sources and rebut the blanket closed-source claim without legal deployment advice.
- license:1 — supported: Formal Valkey policy is differentiated from Redis company self-description; no unsupported service/cost conclusions.
- unknowns:0 — supported: Open workload inputs and absence of benchmarking/restore/production compatibility tests are explicit scope limits.
- unknowns:1 — supported: Conditional pilot, retain and upgrade alternatives follow the findings; decisive dependency testing is a useful next step.
- brief:central-message:0 — supported: Prioritized thesis matches the presentation purpose and supported compatibility/recovery findings; licensing is motivation rather than proof.
- brief:presentation-sequence:0 — supported: Good progression from reconstructible cache to file and CRDT dependencies; edition, version and service identity remain visible.
- brief:presentation-sequence:1 — supported: Concrete application/search examples retain changed transaction behavior, implemented Dialect 2, rebuilding and rolling-release confirmation.
- brief:presentation-sequence:2 — supported: Rollback mechanism remains explicitly illustrative and correctly links post-cutover writes to recovery design.
- brief:speaker-evidence:0 — supported: Visual suggestion is editorial advice; numerical configurations, publisher attribution and non-comparability remain, with Redis upgrade as an alternative.
- brief:speaker-evidence:1 — supported: Strongest supported stay case is conditional; both stores durability caveats and cost uncertainty avoid one-sided promotion.
- brief:essential-caveats:0 — supported: Date anchoring, walkthrough versions and exact AWS pair are retained for shortening; no fresh currency claim is made.
- brief:essential-caveats:1 — supported: Explicit absence of benchmark, migration, recovery and cost evidence appropriately bounds what a presentation can promise.
