# Valkey versus Redis: when Redis takeout is practical

> Reviewed synthesis. Source hashes establish capture integrity; they do not establish truth.

Content digest: `558c5b0e7701a43ccc333a5dc056022f4087e0a18dc6ec32f082e915ca3ace70`. Author: valkey-research.

<a id="compatible-base"></a>
## compatible-base

Valkey documents Redis OSS 7.2 and earlier as its compatibility baseline; Valkey 7.2.4 forked Redis OSS 7.2.4.

Author: valkey-research

> Valkey is compatible with Redis OSS 7.2 and all earlier open-source Redis versions, as Valkey 7.2.4 is a fork of Redis OSS 7.2.4.

Source: [src-migration](#src-migration).

<a id="newer-data-boundary"></a>
## newer-data-boundary

The Valkey migration guide says Redis CE 7.4 and later data files are incompatible and require another migration method outside that guide.

Author: valkey-research

> Redis Community Edition \(CE\) version 7.4 and later produce data files that are not compatible with Valkey. It may be possible to migrate the data to Valkey from proprietary Redis versions and other Redis-like software, but it requires another method and is not covered by this document.

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

<a id="bounded-takeout"></a>
## Redis takeout is strongest at the OSS 7.2 compatibility baseline

**Interpretation:** Core workloads originating on Redis OSS 7.2 or earlier are practical Valkey migration candidates, subject to application and operations validation. Later Redis data formats make the migration a different engineering problem. ([compatible-base](evidence.md#compatible-base), [protocol-client](evidence.md#protocol-client), [newer-data-boundary](evidence.md#newer-data-boundary))

Supporting facts: [compatible-base](evidence.md#compatible-base), [protocol-client](evidence.md#protocol-client), [newer-data-boundary](evidence.md#newer-data-boundary). Counterevidence: [transaction-difference](evidence.md#transaction-difference).

<a id="feature-dependencies"></a>
## Feature labels do not establish interchangeability

**Interpretation:** Redis 8 includes richer data capabilities and Valkey has JSON/search modules; neither the shared names nor module API compatibility establish parity for a particular query, persistence image or framework. ([redis-integrated-types](evidence.md#redis-integrated-types), [valkey-search-capability](evidence.md#valkey-search-capability), [valkey-json-capability](evidence.md#valkey-json-capability), [module-api](evidence.md#module-api))

Supporting facts: [redis-integrated-types](evidence.md#redis-integrated-types), [valkey-search-capability](evidence.md#valkey-search-capability), [valkey-json-capability](evidence.md#valkey-json-capability), [module-api](evidence.md#module-api). Counterevidence: none recorded.

<a id="license-choice"></a>
## License choice remains material without predetermining the engine

**Interpretation:** Valkey BSD and Redis 8 AGPL/RSAL/SSPL options are materially different choices. Calling all current Redis closed source would misstate its available licensing. ([valkey-license](evidence.md#valkey-license), [redis-license-options](evidence.md#redis-license-options), [redis-old-licenses](evidence.md#redis-old-licenses))

Supporting facts: [valkey-license](evidence.md#valkey-license), [redis-license-options](evidence.md#redis-license-options), [redis-old-licenses](evidence.md#redis-old-licenses). Counterevidence: none recorded.

<a id="operational-fit"></a>
## Capacity and resilience need workload evidence

**Interpretation:** Valkey performance claims are configuration-specific, and its asynchronous replication and persistence trade-offs still require explicit latency, recovery and durability targets. ([valkey-performance-claim](evidence.md#valkey-performance-claim), [async-replication](evidence.md#async-replication), [wait-not-strong](evidence.md#wait-not-strong), [persistence-cost](evidence.md#persistence-cost), [aof-durability](evidence.md#aof-durability))

Supporting facts: [valkey-performance-claim](evidence.md#valkey-performance-claim), [async-replication](evidence.md#async-replication), [wait-not-strong](evidence.md#wait-not-strong), [persistence-cost](evidence.md#persistence-cost), [aof-durability](evidence.md#aof-durability). Counterevidence: none recorded.

<a id="rollback-design"></a>
## Rollback is a data-path design, not just an endpoint change

**Interpretation:** A supported forward migration does not prove reverse compatibility or recovery of writes accepted after cutover. Managed services can impose especially narrow rollback versions. ([newer-data-boundary](evidence.md#newer-data-boundary), [async-replication](evidence.md#async-replication), [aws-rollback](evidence.md#aws-rollback), [replica-cutover](evidence.md#replica-cutover))

Supporting facts: [newer-data-boundary](evidence.md#newer-data-boundary), [async-replication](evidence.md#async-replication), [aws-rollback](evidence.md#aws-rollback), [replica-cutover](evidence.md#replica-cutover). Counterevidence: none recorded.

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

## Independent review

Reviewer: valkey-checker. Independent reviewer /root/valkey\_evidence\_review, mapped worker valkey-checker, authored none of the dossier. Reviewed all 28 facts, five findings including conditions/gaps/implications, and 18 report blocks plus original source contexts. The report answers when Redis takeout is appropriate, preserves version/edition and workload boundaries, and provides useful primary input for later content. All 14 originals inspected via web or direct public fetch; transient access errors and formatting-only checks are documented in review-notes.md. This is documentary verification, not an application migration, performance benchmark, exhaustive feature inventory or legal opinion.

- compatible-base — supported: Original migration introduction and version matrix explicitly establish the OSS &lt;=7.2 baseline and 7.2.4 fork; not extrapolated to later Redis.
- newer-data-boundary — supported: Original migration warning and matrix exclude CE 7.4\+ data files while leaving other methods possible; the assertion preserves that limit.
- protocol-client — supported: Original compatibility list states RESP2/RESP3 and existing client connectivity; report correctly separates connectivity from application semantics.
- module-api — supported: Original compatibility list supports Redis OSS RedisModule\_ modules. Surrounding report correctly requires specific component validation rather than inferring Stack parity.
- info-version — supported: Original INFO guidance names redis\_version 7.2.4, server\_name and valkey\_version; fact accurately distinguishes compatibility identity.
- migration-example — supported: Original standalone introduction pins Redis 7.2.5 and Valkey 7.2.6. Report preserves example scope.
- snapshot-quiesce — supported: Original physical-migration tradeoffs and numbered steps include disconnection, snapshot, Redis stop and Valkey load; fact remains scoped to documented procedure.
- replica-cutover — supported: Original cluster section describes replicas, promotion per primary and removal. Context requires compatible networked nodes; report retains compatible-cluster condition.
- transaction-difference — supported: Original 8.0 release history, Behavior Changes - Core, records nested MULTI/WATCH abort. Suitable counterexample to blanket semantic compatibility.
- lua-packaging — supported: Original 9.1 release history records default static linkage in 9.1.0-rc2; no later reversal found in GA/patch context.
- lua-module — supported: Original 9.1.0-rc1 feature section records Lua extraction; later static-link change is complementary and included in report.
- valkey-version — supported: Original download page 9.x listing and fresh HTTP fetch show 9.1.2. Past supported branches are separately listed.
- redis-version — supported: Fresh HTTP 200 latest-release API parsed as JSON: tag\_name 8.10.2; published\_at 2026-09-17T15:06:56Z; draft/prerelease false. Formatting differences do not change values.
- valkey-license — supported: Original tag-pinned COPYING contains BSD-3-Clause identifier and both Valkey/Redis BSD notices. Narrow declaration claim is accurate.
- redis-license-options — supported: Original Redis licensing page overview, tri-license paragraph and product table support choice for Redis Open Source 8\+. Commercial products remain separately identified.
- redis-old-licenses — supported: Original About past licenses explicitly retains BSD3 through 7.2.x and dual terms for CE 7.4.x-7.8.x. Report repeats documented boundary.
- redis-integrated-types — supported: Original tri-license paragraph lists all four integral components starting Redis 8; claim makes no workload parity inference.
- valkey-search-capability — supported: Original main README introduction, supported commands and JSON loading instructions substantiate search types and Hash/JSON indexing. Main-branch qualification prevents release guarantee.
- valkey-json-capability — supported: Direct HTTP 200 original unstable README inspected including introduction, loading, configuration and command list. Native JSON module existence is supported; release status not inferred.
- active-active-semantics — supported: Original Redis Software planning page introduction establishes CRDT basis and complexity; surrounding sections discuss participating clusters and metadata. Product qualifier is retained.
- async-replication — supported: Original replication introduction and facts list support asynchronous underlying replication; optional WAIT acknowledgments are described and separately qualified in dossier.
- wait-not-strong — supported: Original replication introduction explicitly rejects CP/strong-consistency implication and conditions failover loss on persistence. Fact preserves qualification.
- persistence-cost — supported: Original persistence RDB disadvantages and rewrite sections describe fork stalls and AOF fork/rewrite behavior. Fact does not generalize stall magnitude to all workloads.
- aof-durability — supported: Original fsync-policy section states everysec possible one-second loss; other policies and persistence modes are distinct. Report uses roughly, not a strict universal recovery bound.
- aws-rollback — supported: Original AWS downgrade section restricts rollback to Valkey 7.2 -&gt; Redis OSS 7.1 regardless of older initial source, alongside snapshot option. Report limits inference to provider.
- aws-parameters — supported: Original AWS custom replication-group paragraph requires matching static values; report frames as a managed-service example.
- valkey-performance-claim — supported: Original dated announcement performance section gives 2.1M, 512-byte payloads, nine IO threads and depth ten. Attribution remains project-reported; no independent speedup established.
- aws-rollback-identity — supported: Original AWS rollback requirements apply REDIS engine type to both users and groups associated with replication group/serverless cache. Inline HTML spacing explains mechanical mismatch.
- bounded-takeout — supported: The chain supports a practical candidate, not guaranteed substitution. Exact-version condition and transaction counterevidence constrain the conclusion.
- feature-dependencies — supported: Full chain establishes capability existence without parity. Branch caveat and missing application inputs are visible; recommendation to prove required behavior is justified.
- license-choice — supported: Versioned license facts support materially different choices and rejection of blanket closed-source claims; no legal outcome or migration ease is inferred.
- operational-fit — supported: Benchmark attribution plus replication/persistence limitations justify workload-specific criteria. Missing measurement/TCO is explicit; no unearned ranking.
- rollback-design — supported: Forward compatibility does not logically establish reverse support. AWS restriction and replication context justify testing post-cutover recovery; no universal incompatibility claim is asserted.
- answer:0 — supported: Fair conditional synthesis of compatibility, feature and licensing chains; no universal winner or unqualified drop-in promise.
- answer:1 — supported: Release anchors independently checked against originals/API; worked migration versions preserved and not promoted to a recommended target pair.
- boundaries:0 — supported: Recommendation correctly distinguishes reconstructible data from correctness-sensitive state; loss windows support higher validation burden, not a claim every workload fails.
- boundaries:1 — supported: File-format boundary matches guide. Logical methods remain hypothetical and explicitly unvalidated; retention option is conditional on costs/downtime.
- boundaries:2 — supported: Redis component presence and Valkey module existence are supported. Development branch/release caveat and no-parity conclusion prevent overstating substitute capability.
- boundaries:3 — supported: CRDT commercial service semantics are distinguished from ordinary primary/replica behavior. Redesign/proof requirement is a conditional engineering recommendation.
- dependencies:0 — supported: Application inventory is a useful proposed validation scope. Concrete nested transaction behavior is source-supported and illustrates semantic testing.
- dependencies:1 — supported: INFO identity and both Lua changes are verified; avoids incorrectly requiring separate shared library in every package.
- operations:0 — supported: Performance result is attributed and conditions are acknowledged; proposed controlled comparisons do not masquerade as completed benchmark.
- operations:1 — supported: Replication, WAIT, everysec and fork/rewrite chains support recovery testing. Approximate loss statement remains scoped to specified policy.
- operations:2 — supported: Ownership/cost factors are recommendations; AWS static-parameter example is correct; explicit missing costs prevents savings claim.
- migration:0 — supported: Validation checklist is appropriate downstream input and explicitly future work. Key counts alone cannot establish application contract; no test success is asserted.
- migration:1 — supported: Compatible-path condition, fencing and catch-up recommendation address documented active-write risks. Link status is not treated as all final writes applied.
- migration:2 — supported: Post-cutover write ownership/reconciliation reasoning is sound and labeled recommendation. Reverse support is an unknown to test, not an asserted absolute incompatibility.
- migration:3 — supported: AWS-specific version and identity limits match original downgrade context. Does not infer upstream limits or general rollback from newer versions.
- license:0 — supported: Matches versioned licensing originals and avoids blanket current Redis characterization. Choice guidance does not claim particular legal compliance.
- unknowns:0 — supported: Accurately identifies absent workload inputs and absence of measured application benchmark/migration proof in this dossier.
- unknowns:1 — supported: Conditional pilot/retain decision follows reviewed findings; preserves unresolved workload and version limits for downstream authors.
