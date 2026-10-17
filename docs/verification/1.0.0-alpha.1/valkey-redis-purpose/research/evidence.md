# Valkey versus Redis: when Redis takeout is practical

> Reviewed synthesis. Source hashes establish capture integrity; they do not establish truth.

Content digest: `a581995344103ace82f05066bd22de1457d4645df35480d8ed3cb2cacaed6ef1`. Author: report-revision.

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

Reviewer: revised-report-checker. Independent review of this exact saved digest found all 38 facts, five findings and 22 prose blocks supported for the recorded decision-input and introductory-training purpose. Report and brief explain compatibility boundaries, substantive counterarguments, consequences and reversal conditions. Original-read attestations cover inspected saved source material and surrounding context, including both original Markdown files, original Redis persistence HTML, readable extracts and retained browser contexts. This is dated-capture review, not live-source freshness verification. Three Redis sources have documented HTTP 403/partial-capture limitations; their cited prose and context remain available in retained browser captures. Charts were not inspected or used as independent evidence. No workload benchmark, migration/restore execution, legal analysis or total-cost validation is established.

- compatible-base — supported: Migration introduction and version table explicitly bound compatibility to Redis OSS 7.2 and earlier; attribution avoids claiming tested application equivalence.
- ce74-files-incompatible — supported: Exact statement appears before the migration table; surrounding text says alternate migration is outside this guide, matching the narrowed file-format claim.
- protocol-client — supported: RESP2/RESP3 and existing-client connection statement appears in compatibility details; report separately warns that connection success is insufficient.
- module-api — supported: Compatibility details explicitly name Redis OSS modules and RedisModule\_ API; neither fact nor synthesis promises arbitrary Redis Stack binary parity.
- info-version — supported: INFO paragraph supplies 7.2.4 and both actual-engine/version fields.
- migration-example — supported: Standalone section explicitly supplies Redis 7.2.5 and Valkey 7.2.6; report keeps these distinct from current captured release anchors.
- snapshot-quiesce — supported: Physical-migration tradeoffs and first procedure step require disconnecting active connections and describe shutdown/load downtime.
- replica-cutover — supported: Cluster migration introduction states add replicas, promote one for each Redis primary, and remove old nodes; no universal version claim added.
- transaction-difference — supported: Valkey 8.0 Behavior Changes - Core contains the quoted nested MULTI/WATCH abort change.
- lua-packaging — supported: The 9.1 release-note history records static linking by default in rc2; later captured notes do not reverse it and describe the built-in engine.
- lua-module — supported: The 9.1 release-note history records the module extraction in rc1; report correctly pairs it with the static-default packaging qualifier.
- valkey-version — supported: Saved download capture lists 9.1.2 under Version 9.x.x. Supported as the dated capture, not a live refresh.
- redis-version — supported: Saved GitHub API JSON contains tag 8.10.2 and published\_at 2026-09-17T15:06:56Z; draft and prerelease are false. Dated capture only.
- valkey-license — supported: Tagged 9.1.2 COPYING capture declares BSD-3-Clause and includes the terms. Fact does not offer a legal conclusion about a deployment.
- redis-license-options — supported: About our tri-license and FAQ identify all three choices for Redis 8\+. Commercial products remain separately identified in surrounding material.
- redis-old-licenses — supported: About past licenses explicitly supplies BSD for &lt;=7.2.x and RSAL/SSPL for CE 7.4.x-7.8.x.
- redis-integrated-types — supported: Tri-license section names all four integrated components and identical versioning starting at Redis 8.
- valkey-search-capability — supported: README introduction explicitly names ANN/KNN, Numeric, Tag, Full-text, hashes and JSON; fact preserves main-branch status rather than release availability.
- valkey-json-capability — supported: Unstable README introduction describes native JSON support; branch limitation is retained.
- active-active-semantics — supported: Redis Software planning section names CRDT technology and additional replication/networking complexity. Synthesis keeps this edition-specific.
- async-replication — supported: Replication introduction and important-facts list establish asynchronous operation; adjacent optional WAIT semantics are retained elsewhere.
- wait-not-strong — supported: Replication context expressly states WAIT acknowledgments do not create strong consistency and failover loss depends on persistence.
- persistence-cost — supported: RDB disadvantages contain the quoted dataset/CPU-dependent fork pause and AOF rewrite distinction; fact does not turn worst-case pause into universal latency.
- aof-durability — supported: Append-only durability section lists everysec and possible one-second loss, alongside always/no alternatives.
- aws-rollback — supported: Rollback requirements explicitly restrict the pair to Valkey 7.2 -&gt; Redis OSS 7.1 even for earlier source versions; surrounding snapshot alternative does not expand versions.
- aws-parameters — supported: Custom replication-group upgrade paragraph requires matching Redis OSS static parameters in the new Valkey custom group.
- valkey-performance-claim — supported: Announcement performance section supplies 2.1M requests/s, 512 bytes, nine IO threads and pipeline ten; publisher attribution preserved.
- aws-rollback-identity — supported: Rollback requirements name associated users and user groups and REDIS engine type.
- search-dialect-boundary — supported: Original compatibility Markdown and extraction bound the expected contract to implemented Dialect 2 features, directing readers to release-specific documentation.
- search-rebuild — supported: Original compatibility Markdown persistence subsection explicitly rejects direct Redisearch RDB loads in either direction and requires rebuilding from hashes/JSON.
- valkey-governance — supported: Governance opening defines TSC management and repository-maintainer composition; later provisions allow membership changes, without contradicting this attributed governance description.
- valkey-affiliation-cap — supported: TSC section explicitly caps employees, contractors or representatives of same/affiliated organizations at one third and provides remediation procedure.
- redis-direction — supported: FAQ and retained browser capture place the statement in Redis Ltd. first-person self-description. No formal governance selection policy is inferred.
- redis-performance-claim — supported: Saved performance section and retained browser capture explicitly report &gt;5x Redis 8.6 vs 7.2. This is not a measurement against Valkey.
- redis-performance-config — supported: Caption in both saved section and retained browser capture supplies every listed setting for the &gt;5x caching comparison, distinct from the following pipeline-16 result.
- matched-benchmark-method — supported: Benchmark context explicitly calls for matching operations, workload behavior, connections and pipelining; recommendation uses that comparability principle.
- redis-wait-limit — supported: Original WAIT Markdown and extraction identify best-effort Sentinel/Cluster safety improvement and continued possibility of lost acknowledged writes.
- redis-aof-window — supported: Inspected original HTML durability list and adjacent paragraphs as well as extraction; everysec possible one-second disaster loss is explicit.
- bounded-takeout — supported: Support chain establishes shared baseline and connection support, while counterevidence and preserved conditions explain semantic differences and later-file incompatibility. The pilot is conditional, not a completed migration claim.
- feature-dependencies — supported: Summary and brief preserve feature presence, implemented Dialect 2 and index rebuild boundaries, rolling-source scope, and commercial CRDT counterexample. No product parity or absence-of-capability inference is asserted.
- license-choice — supported: Version-specific facts support licensing distinction; formal Valkey governance is distinguished from Redis company self-description. Brief preserves the AGPL counterargument and does not promise lower costs.
- operational-fit — supported: Both publisher benchmarks retain conditions and attribution; Redis upgrade is a real alternative. Both durability limitations are represented, and no matched benchmark or cost model is claimed.
- rollback-design — supported: Clearly labeled inference distinguishes forward migration from reverse compatibility and post-cutover write recovery. Provider-specific pair and unresolved replay method remain visible.
- answer:0 — supported: Useful conditional answer supported by baseline, dependency and licensing findings; no universal winner asserted.
- answer:1 — supported: Captured release values and older worked example pair are accurate, explicitly dated and not recommended as a target pair.
- boundaries:0 — supported: Risk-sensitive cache/state recommendation is a reasonable inference from asynchronous replication and durability limits; no workload testing is implied.
- boundaries:1 — supported: File compatibility is appropriately narrower than migration feasibility; alternative transfer is conditional and explicitly unvalidated.
- boundaries:2 — supported: Integrates existence, implemented Dialect 2, index rebuild and rolling-version limitations without promising parity. Appropriate high-level Search treatment for recorded introductory purpose.
- boundaries:3 — supported: Commercial CRDT capability and ordinary asynchronous replication are not conflated; staying or redesigning remains conditional.
- dependencies:0 — supported: Inventory is a recommendation, with a concrete release-note semantic difference explaining why it matters.
- dependencies:1 — supported: Example is explicitly illustrative and not executed. Nested MULTI scenario follows the cited abort change and makes no unsupported universal transaction claim.
- dependencies:2 — supported: INFO fields match source; Lua extraction is qualified by static linking, avoiding a false dynamic-library requirement.
- operations:0 — supported: Publisher-specific settings and versions retained. Explicitly rejects head-to-head ranking and identifies Redis upgrade as an alternative.
- operations:1 — supported: Matched-workload testing recommendation is justified and explicitly not a benchmark result.
- operations:2 — supported: Both stores receive equivalent treatment for WAIT/AOF limitations; recovery-testing implication is justified.
- operations:3 — supported: Cost components are proposed decision inputs; AWS static-parameter example is supported and savings are expressly unestablished.
- migration:0 — supported: Application/state acceptance checks are recommendations justified by compatibility limits, not claims of performed validation.
- migration:1 — supported: Snapshot and cluster paths are bounded to verified versions; added writer fencing and state checks are conditional recovery recommendations.
- migration:2 — supported: Preserved source cannot contain isolated target writes; rollback recommendation correctly distinguishes pre/post-write stages and makes no reverse-file guarantee.
- migration:3 — supported: Explicit hypothetical illustrates missing writes by construction; no observed incident or successful replay tool is claimed.
- migration:4 — supported: AWS version pair and identity requirements match dated capture; upstream and provider capability remain distinct.
- license:0 — supported: Version-specific licensing claims match captured terms. No application-specific legal suitability is asserted.
- license:1 — supported: Governance contrast follows sources and expressly marks Redis self-description limits; no operational superiority is inferred.
- unknowns:0 — supported: Open inputs and absence of workload execution are honestly reported for this generic decision input.
- unknowns:1 — supported: Conditional conclusion preserves staying/upgrading alternatives and reversal criteria; instructional reuse correctly treats examples as illustrative.
