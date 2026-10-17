# Valkey versus Redis: when Redis takeout is practical

> Reviewed synthesis. Source hashes establish capture integrity; they do not establish truth.

Audience: Application and platform engineers. Purpose: Decision input and explanatory source material for presentations, blogs and introductory platform-engineer training; conditional Redis takeout focus.

## Redis takeout is strongest at the OSS 7.2 compatibility baseline

**Interpretation:** Core workloads originating on Redis OSS 7.2 or earlier are practical Valkey migration candidates, subject to application and operations validation. Later Redis data formats make the migration a different engineering problem. ([compatible-base](evidence.md#compatible-base), [protocol-client](evidence.md#protocol-client), [ce74-files-incompatible](evidence.md#ce74-files-incompatible))

**Supporting evidence**

- Valkey documents Redis OSS 7.2 and earlier as its compatibility baseline; Valkey 7.2.4 forked Redis OSS 7.2.4. ([compatible-base](evidence.md#compatible-base))
- Valkey documents RESP2/RESP3 and connection support for existing Redis client libraries. ([protocol-client](evidence.md#protocol-client))
- The Valkey migration guide states that Redis Community Edition 7.4 and later produce data files that are not compatible with Valkey. ([ce74-files-incompatible](evidence.md#ce74-files-incompatible))

**Counterevidence**

- Valkey 8.0 release notes include aborting transactions on nested MULTI or WATCH commands. ([transaction-difference](evidence.md#transaction-difference))

**Implications**

- **Conditional recommendation:** A pilot is a reasonable next step for shared-core workloads; a required semantic difference, unproven migration method or unacceptable recovery exposure can reverse that choice. ([transaction-difference](evidence.md#transaction-difference), [ce74-files-incompatible](evidence.md#ce74-files-incompatible), [wait-not-strong](evidence.md#wait-not-strong))

**Qualifications to preserve**

- **Conditional recommendation:** Pin the exact server, client, module and hosting versions before selecting a migration method. ([migration-example](evidence.md#migration-example), [module-api](evidence.md#module-api))
- Compatibility is bounded to the documented shared baseline. Redis CE 7.4\+ file incompatibility is established; the guide does not establish a validated alternate migration for those versions. Preserve that distinction in downstream claims. ([compatible-base](evidence.md#compatible-base), [ce74-files-incompatible](evidence.md#ce74-files-incompatible))
- **Interpretation:** The transaction-change counterevidence matters because a client can connect successfully while error-path semantics differ. Treat connection success as one test, never the compatibility verdict. ([transaction-difference](evidence.md#transaction-difference), [protocol-client](evidence.md#protocol-client))

## Feature labels do not establish interchangeability

**Interpretation:** Redis 8 includes richer data capabilities and Valkey has JSON/search modules; neither the shared names nor module API compatibility establish parity for a particular query, persistence image or framework. ([redis-integrated-types](evidence.md#redis-integrated-types), [valkey-search-capability](evidence.md#valkey-search-capability), [valkey-json-capability](evidence.md#valkey-json-capability), [module-api](evidence.md#module-api))

**Supporting evidence**

- Redis 8 includes RediSearch, RedisJSON, RedisTimeSeries and RedisBloom under the Redis tri-license. ([redis-integrated-types](evidence.md#redis-integrated-types))
- The live Valkey Search README documents vector ANN/KNN and Numeric, Tag and Full-text search, indexing Hash or Valkey JSON data. This is a main-branch capability description. ([valkey-search-capability](evidence.md#valkey-search-capability))
- The live Valkey JSON README describes a module for native JSON support; its captured branch is unstable. ([valkey-json-capability](evidence.md#valkey-json-capability))
- Valkey documents support for Redis OSS modules using the RedisModule\_ API. ([module-api](evidence.md#module-api))
- Valkey Search limits its compatibility contract to Redisearch Dialect 2 features it implements; it does not promise every Redisearch feature. ([search-dialect-boundary](evidence.md#search-dialect-boundary))
- Valkey Search documents rebuilding indexes from underlying hashes or JSON documents when migrating between it and Redisearch; persisted index state cannot be copied. ([search-rebuild](evidence.md#search-rebuild))

**Counterevidence**

- Redis Software Active-Active uses CRDTs and entails different data types plus more complex replication/networking than a database without geo-distribution. ([active-active-semantics](evidence.md#active-active-semantics))
- Valkey Search limits its compatibility contract to Redisearch Dialect 2 features it implements; it does not promise every Redisearch feature. ([search-dialect-boundary](evidence.md#search-dialect-boundary))
- Valkey Search documents rebuilding indexes from underlying hashes or JSON documents when migrating between it and Redisearch; persisted index state cannot be copied. ([search-rebuild](evidence.md#search-rebuild))

**Implications**

- **Conditional recommendation:** Keep a dependent workload on its existing service until its required behavior is proven on a pinned target. ([active-active-semantics](evidence.md#active-active-semantics), [ce74-files-incompatible](evidence.md#ce74-files-incompatible))

**Qualifications to preserve**

- **Conditional recommendation:** Preserve the implemented-Dialect-2 boundary and index rebuild requirement whenever discussing Search compatibility. These are concrete work items, not generic cautions, and the captured rolling document must be checked against the chosen module release. ([search-dialect-boundary](evidence.md#search-dialect-boundary), [search-rebuild](evidence.md#search-rebuild))
- **Interpretation:** The strongest case for staying is a required integrated data feature or commercial conflict-resolution behavior whose substitute remains unproven. JSON/search availability alone neither proves equivalence nor proves a migration impossible. ([redis-integrated-types](evidence.md#redis-integrated-types), [active-active-semantics](evidence.md#active-active-semantics), [valkey-search-capability](evidence.md#valkey-search-capability), [valkey-json-capability](evidence.md#valkey-json-capability))

**Gaps**

- **Open question:** No specific Redis Stack module, ORM, query dialect, module binary or production dataset was supplied.

## License and governance are decision inputs, not substitutes for fit

**Interpretation:** Valkey BSD and Redis 8 AGPL/RSAL/SSPL options are materially different choices. Calling all current Redis closed source would misstate its available licensing. ([valkey-license](evidence.md#valkey-license), [redis-license-options](evidence.md#redis-license-options), [redis-old-licenses](evidence.md#redis-old-licenses))

**Supporting evidence**

- Valkey 9.1.2 declares BSD-3-Clause licensing. ([valkey-license](evidence.md#valkey-license))
- Redis 8 and later offer a choice of RSALv2, SSPLv1 or AGPLv3; the earlier license boundary differs. ([redis-license-options](evidence.md#redis-license-options))
- Redis 7.2.x and earlier retain BSD3; Redis CE 7.4.x–7.8.x use RSALv2/SSPLv1. ([redis-old-licenses](evidence.md#redis-old-licenses))
- Valkey governance assigns management to a Technical Steering Committee composed of repository maintainers. ([valkey-governance](evidence.md#valkey-governance))
- Valkey governance caps same-organization or affiliated-organization representation on its TSC at one third. ([valkey-affiliation-cap](evidence.md#valkey-affiliation-cap))
- Redis Ltd. describes itself as setting and executing Redis’s vision; this is the vendor’s self-description. ([redis-direction](evidence.md#redis-direction))

**Counterevidence**

- Redis 8 and later offer a choice of RSALv2, SSPLv1 or AGPLv3; the earlier license boundary differs. ([redis-license-options](evidence.md#redis-license-options))

**Implications**

- **Conditional recommendation:** Evaluate governance influence, license requirements and available service support separately from application compatibility; permissive licensing can motivate a pilot without establishing lower total cost. ([valkey-affiliation-cap](evidence.md#valkey-affiliation-cap), [valkey-license](evidence.md#valkey-license), [redis-license-options](evidence.md#redis-license-options))

**Qualifications to preserve**

- **Interpretation:** Keep licenses version-specific. Redis 8’s AGPL option rebuts the blanket assertion that current Redis has no open-source option. Governance evidence differs: Valkey has a formal TSC policy; the Redis evidence here is a company self-description, not a formal maintainer-selection policy. ([redis-license-options](evidence.md#redis-license-options), [redis-old-licenses](evidence.md#redis-old-licenses), [valkey-governance](evidence.md#valkey-governance), [redis-direction](evidence.md#redis-direction))

**Gaps**

- **Open question:** No legal assessment of the intended distribution model, support contract comparison or formal Redis maintainer-selection policy was evaluated.

## Capacity and resilience need workload evidence

**Interpretation:** Both projects publish configuration-specific performance claims. Both document durability limits, so neither a benchmark headline nor retaining the current engine settles application performance or recovery objectives. ([valkey-performance-claim](evidence.md#valkey-performance-claim), [redis-performance-claim](evidence.md#redis-performance-claim), [redis-performance-config](evidence.md#redis-performance-config), [aof-durability](evidence.md#aof-durability), [redis-aof-window](evidence.md#redis-aof-window), [redis-wait-limit](evidence.md#redis-wait-limit))

**Supporting evidence**

- The Valkey 9.1 announcement reports 2.1 million requests/second with 512-byte payloads, nine IO threads and pipeline depth ten; this is a project-reported result. ([valkey-performance-claim](evidence.md#valkey-performance-claim))
- Valkey replication is asynchronous. ([async-replication](evidence.md#async-replication))
- Valkey WAIT does not create strong consistency; acknowledged writes may still be lost on failover depending on persistence configuration. ([wait-not-strong](evidence.md#wait-not-strong))
- Valkey documents fork pauses for RDB persistence on large datasets; AOF also forks, with rewrite frequency configurable. ([persistence-cost](evidence.md#persistence-cost))
- Valkey documents appendfsync everysec as potentially losing one second of data during a disaster. ([aof-durability](evidence.md#aof-durability))
- Redis reports more than five times the throughput for Redis 8.6 versus Redis 7.2 in its published caching benchmark; this is a vendor claim comparing Redis releases. ([redis-performance-claim](evidence.md#redis-performance-claim))
- The cited Redis 8.6 caching benchmark uses 16 cores on m8g.24xlarge, 11 I/O threads, pipeline depth 1, 2000 clients, a 1:10 SET:GET ratio, 1M keys and 1K string values. ([redis-performance-config](evidence.md#redis-performance-config))
- Redis benchmarking guidance requires comparable operations and benchmark behavior across data stores. ([matched-benchmark-method](evidence.md#matched-benchmark-method))
- Redis documents that WAIT improves real-world failover safety without making Redis strongly consistent. ([redis-wait-limit](evidence.md#redis-wait-limit))
- Redis documents a possible one-second data-loss window with appendfsync everysec in a disaster. ([redis-aof-window](evidence.md#redis-aof-window))

**Counterevidence**

- Redis reports more than five times the throughput for Redis 8.6 versus Redis 7.2 in its published caching benchmark; this is a vendor claim comparing Redis releases. ([redis-performance-claim](evidence.md#redis-performance-claim))
- The cited Redis 8.6 caching benchmark uses 16 cores on m8g.24xlarge, 11 I/O threads, pipeline depth 1, 2000 clients, a 1:10 SET:GET ratio, 1M keys and 1K string values. ([redis-performance-config](evidence.md#redis-performance-config))

**Implications**

- **Conditional recommendation:** Compare a supported Redis upgrade and a Valkey pilot under the same application workload and recovery targets before crediting migration with performance or cost savings. ([matched-benchmark-method](evidence.md#matched-benchmark-method), [redis-performance-claim](evidence.md#redis-performance-claim), [wait-not-strong](evidence.md#wait-not-strong), [redis-wait-limit](evidence.md#redis-wait-limit))

**Qualifications to preserve**

- **Interpretation:** Redis’s reported improvement is against Redis 7.2, not Valkey. Valkey’s reported result uses different settings. Neither provides a matched head-to-head ranking or application result. Preserve versions, workload/configuration and publisher attribution with either headline. ([valkey-performance-claim](evidence.md#valkey-performance-claim), [redis-performance-claim](evidence.md#redis-performance-claim), [redis-performance-config](evidence.md#redis-performance-config), [matched-benchmark-method](evidence.md#matched-benchmark-method))
- **Interpretation:** The Redis counterexample matters: an upgrade within Redis may offer capacity improvement, so replacement should compete against that option. This evidence does not establish the upgrade benefit for this application. ([redis-performance-claim](evidence.md#redis-performance-claim))

**Gaps**

- **Open question:** No workload measurement or total-cost model was run; a universal performance or cost ranking is unsupported.

## Rollback is a data-path design, not just an endpoint change

**Interpretation:** A supported forward migration does not prove reverse compatibility or recovery of writes accepted after cutover. Managed services can impose especially narrow rollback versions. ([ce74-files-incompatible](evidence.md#ce74-files-incompatible), [async-replication](evidence.md#async-replication), [aws-rollback](evidence.md#aws-rollback), [replica-cutover](evidence.md#replica-cutover))

**Supporting evidence**

- The Valkey migration guide states that Redis Community Edition 7.4 and later produce data files that are not compatible with Valkey. ([ce74-files-incompatible](evidence.md#ce74-files-incompatible))
- Valkey replication is asynchronous. ([async-replication](evidence.md#async-replication))
- ElastiCache only documents engine rollback from Valkey 7.2 to Redis OSS 7.1, even if the original source was older. ([aws-rollback](evidence.md#aws-rollback))
- The migration guide describes adding Valkey cluster replicas, promoting one per Redis primary, and removing Redis nodes. ([replica-cutover](evidence.md#replica-cutover))

**Implications**

- **Conditional recommendation:** Rehearse recovery of post-cutover writes and define the rollback boundary before moving durable state. ([aws-rollback](evidence.md#aws-rollback), [wait-not-strong](evidence.md#wait-not-strong))

**Qualifications to preserve**

- **Interpretation:** Preserve the provider-specific scope: ElastiCache documents the Valkey 7.2 to Redis OSS 7.1 rollback pair; this is not an upstream guarantee for Valkey 8 or 9. Returning endpoints to an old source also leaves post-cutover writes unresolved. ([aws-rollback](evidence.md#aws-rollback), [replica-cutover](evidence.md#replica-cutover))

**Gaps**

- **Open question:** No tested reverse-transfer tool or application-specific replay/reconciliation method was established.

