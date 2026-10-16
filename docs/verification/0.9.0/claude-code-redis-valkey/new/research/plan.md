# Research plan: Redis vs Valkey for a platform team

Redis (Redis Ltd.'s open-source Redis / Redis Open Source) and Valkey (the Linux Foundation fork) as in-memory data stores, as of late 2026, for a platform team choosing between them: licensing, governance and project history, architecture, persistence, clustering and replication, published performance claims, compatibility, and migration. Primary documentation, licence texts and project announcements first. Out of scope: managed-service pricing, client-library comparisons, and vendor enterprise editions beyond what bears on licensing.

## Licensing
- Under which licences is current Redis released, and how have they changed since 2024?
- Under which licence is Valkey released?

## Governance and history
- Who owns and governs the Redis project?
- Who governs Valkey, and under which foundation?
- Why and from which Redis version was Valkey forked?

## Architecture
- How does Redis use threads to process commands and network I/O?
- How does Valkey use threads to process commands and network I/O?

## Persistence
- Which persistence options does Redis document?
- Which persistence options does Valkey document?

## Clustering and replication
- How does Redis Cluster shard data and handle replication and failover?
- How does Valkey cluster mode shard data and handle replication and failover?

## Performance
- What performance improvements do recent Redis releases claim?
- What performance improvements do recent Valkey releases claim?
- What independent, third-party benchmarks compare recent Redis and Valkey releases?

## Compatibility
- Which data types and features does Redis offer that Valkey does not document?
- How compatible is Valkey with Redis commands, protocol and data files?
- Which commands added in Redis 7.4 and 8.x does Valkey implement or lack?

## Migration
- What migration path from Redis to Valkey does the Valkey project document?
- Which Redis versions or features limit a straightforward migration to Valkey?
- Which tools or managed services support migrating data from Redis 7.4 or later to Valkey?
