# Valkey versus Redis: when Redis takeout is practical

> Reviewed synthesis. Source hashes establish capture integrity; they do not establish truth.

Audience: Application and platform engineers. Purpose: Decision input for presentations, blogs and training.

## Redis takeout is strongest at the OSS 7.2 compatibility baseline

**Interpretation:** Core workloads originating on Redis OSS 7.2 or earlier are practical Valkey migration candidates, subject to application and operations validation. Later Redis data formats make the migration a different engineering problem. ([compatible-base](evidence.md#compatible-base), [protocol-client](evidence.md#protocol-client), [newer-data-boundary](evidence.md#newer-data-boundary))

**Conditions**

- **Conditional recommendation:** Pin the exact server, client, module and hosting versions before selecting a migration method. ([migration-example](evidence.md#migration-example), [module-api](evidence.md#module-api))

Counterevidence: [transaction-difference](evidence.md#transaction-difference).

## Feature labels do not establish interchangeability

**Interpretation:** Redis 8 includes richer data capabilities and Valkey has JSON/search modules; neither the shared names nor module API compatibility establish parity for a particular query, persistence image or framework. ([redis-integrated-types](evidence.md#redis-integrated-types), [valkey-search-capability](evidence.md#valkey-search-capability), [valkey-json-capability](evidence.md#valkey-json-capability), [module-api](evidence.md#module-api))

**Implications**

- **Conditional recommendation:** Keep a dependent workload on its existing service until its required behavior is proven on a pinned target. ([active-active-semantics](evidence.md#active-active-semantics), [newer-data-boundary](evidence.md#newer-data-boundary))

**Gaps**

- **Open question:** No specific Redis Stack module, ORM, query dialect, module binary or production dataset was supplied.

## License choice remains material without predetermining the engine

**Interpretation:** Valkey BSD and Redis 8 AGPL/RSAL/SSPL options are materially different choices. Calling all current Redis closed source would misstate its available licensing. ([valkey-license](evidence.md#valkey-license), [redis-license-options](evidence.md#redis-license-options), [redis-old-licenses](evidence.md#redis-old-licenses))

## Capacity and resilience need workload evidence

**Interpretation:** Valkey performance claims are configuration-specific, and its asynchronous replication and persistence trade-offs still require explicit latency, recovery and durability targets. ([valkey-performance-claim](evidence.md#valkey-performance-claim), [async-replication](evidence.md#async-replication), [wait-not-strong](evidence.md#wait-not-strong), [persistence-cost](evidence.md#persistence-cost), [aof-durability](evidence.md#aof-durability))

**Gaps**

- **Open question:** No workload measurement or total-cost model was run; a universal performance or cost ranking is unsupported.

## Rollback is a data-path design, not just an endpoint change

**Interpretation:** A supported forward migration does not prove reverse compatibility or recovery of writes accepted after cutover. Managed services can impose especially narrow rollback versions. ([newer-data-boundary](evidence.md#newer-data-boundary), [async-replication](evidence.md#async-replication), [aws-rollback](evidence.md#aws-rollback), [replica-cutover](evidence.md#replica-cutover))

**Implications**

- **Conditional recommendation:** Rehearse recovery of post-cutover writes and define the rollback boundary before moving durable state. ([aws-rollback](evidence.md#aws-rollback), [wait-not-strong](evidence.md#wait-not-strong))

