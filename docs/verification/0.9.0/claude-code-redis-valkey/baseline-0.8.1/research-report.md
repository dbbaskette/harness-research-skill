# Research brief

Topic: Redis vs Valkey for a platform team choosing an in-memory data store (as of late 2026)
Purpose: planning; scope: Uploaded sources plus external research (public-web).
Status: complete. Completed: 8/8.
Pending: none.
Unresolved: none.
Stale evidence: none.

Research coverage; does not certify a factual or downstream review.

## licensing

What licenses govern current Redis (Redis Open Source 8.x) and Valkey releases, and what changed in 2024-2025?

Status: supported.

Answer: Redis 8+ is tri-licensed RSALv2/SSPLv1/AGPLv3 (7.2 and earlier stay BSD-3); Valkey remains BSD-3-Clause.

The Redis repository LICENSE states that from Redis 8, Redis Open Source is offered under the user's choice of RSALv2, SSPLv1 or AGPLv3, while Redis 7.2 and earlier remain BSD-3-Clause. Redis Ltd's own blog says it moved Redis to SSPL in March 2024 and added the OSI-approved AGPL as an option starting with Redis 8 (May 2025). Valkey's COPYING file is the BSD 3-Clause license, and the Linux Foundation launch release says Valkey continued from Redis 7.2.4 under BSD-3-Clause. A practical licensing wrinkle on the Redis side: the README says AGPLv3/SSPLv1 users cannot combine Redis with the proprietary Intel SVS vector optimizations. For a platform team, Valkey is permissive (no copyleft obligations); Redis 8 under AGPLv3 is OSI-approved but carries network copyleft obligations for modified versions offered as a service, and the other two options are source-available.

Limits/open questions: Not legal advice; license obligations for a specific deployment (e.g., offering a modified Redis as a service under AGPLv3) need legal review. The exact licensing of Redis 7.4-7.8 releases was taken from the Redis blog narrative (SSPL move in March 2024), not from per-release LICENSE files. Licenses of bundled Valkey modules (valkey-json, valkey-bloom, valkey-search) were not individually checked.
Checked: 2026-10-16T13:15:35.808Z

Source: Redis LICENSE.txt (unstable branch)
Origin: https://raw.githubusercontent.com/redis/redis/unstable/LICENSE.txt
Snapshot: sources/redis-LICENSE.txt; SHA256: 4a0e416b9537688f30dfe69ddaceb2ca64d96b7df02a0a6760d376890ddc4e40
Location: line 1; source date: not available

> Starting with Redis 8, Redis Open Source is moving to a tri-licensing model with all new Redis code

Source: Redis LICENSE.txt (unstable branch)
Origin: https://raw.githubusercontent.com/redis/redis/unstable/LICENSE.txt
Snapshot: sources/redis-LICENSE.txt; SHA256: 4a0e416b9537688f30dfe69ddaceb2ca64d96b7df02a0a6760d376890ddc4e40
Location: line 4; source date: not available

> (RSALv2);or (b) the Server Side Public License v1 (SSPLv1); or (c) the GNU Affero General Public License v3 (AGPLv3).

Source: Redis LICENSE.txt (unstable branch)
Origin: https://raw.githubusercontent.com/redis/redis/unstable/LICENSE.txt
Snapshot: sources/redis-LICENSE.txt; SHA256: 4a0e416b9537688f30dfe69ddaceb2ca64d96b7df02a0a6760d376890ddc4e40
Location: line 5; source date: not available

> Redis Open Source 7.2 and prior releases remain subject to the BSDv3 clause license

Source: Redis is now available under the AGPLv3 open source license (Redis blog)
Origin: https://redis.io/blog/agplv3/
Snapshot: sources/redis-blog-agplv3.txt; SHA256: a233410a295364c7583690e3ce3d4bb7bfd2821045d32efcab780f24c4165d1a
Location: line 22; source date: 2025-05-01

> in March 2024, we decided to move Redis to the SSPL license

Source: Redis is now available under the AGPLv3 open source license (Redis blog)
Origin: https://redis.io/blog/agplv3/
Snapshot: sources/redis-blog-agplv3.txt; SHA256: a233410a295364c7583690e3ce3d4bb7bfd2821045d32efcab780f24c4165d1a
Location: line 25; source date: 2025-05-01

> Adding the OSI-approved AGPL as an additional licensing option for Redis, starting with Redis 8 (available now);

Source: Redis README.md (unstable branch)
Origin: https://raw.githubusercontent.com/redis/redis/unstable/README.md
Snapshot: sources/redis-README.md; SHA256: 947c87732c7ec6382a64ac7c637bea474b6aa478f22dcf3d8091bb6ca8bb531d
Location: line 477; source date: not available

> If you are using Redis Open Source under AGPLv3 or SSPLv1, you cannot use it together with the Intel Optimizations (Leanvec and LVQ binaries).

Source: Valkey COPYING (unstable branch)
Origin: https://raw.githubusercontent.com/valkey-io/valkey/unstable/COPYING
Snapshot: sources/valkey-COPYING.txt; SHA256: 9a67d40ae9076cd60b9d228135a9c0ce5d60f84f0c54c472965d4e03fdeb8f8f
Location: line 1; source date: not available

> BSD 3-Clause License

Source: Linux Foundation Launches Open Source Valkey Community
Origin: https://www.linuxfoundation.org/press/linux-foundation-launches-open-source-valkey-community
Snapshot: sources/lf-valkey-launch.txt; SHA256: 4506c837ae6fe3b9b60080c818b6bd225d13abc97f901cfd1b57c3ca823b4f41
Location: line 21; source date: 2024-03-28

> Valkey will continue development on Redis 7.2.4 and will keep the project available for use and distribution under the open source Berkeley Software Distribution (BSD) 3-clause license.

## governance

Who governs and maintains Redis and Valkey (foundation, company, contributors, decision process)?

Status: supported.

Answer: Valkey is a Linux Foundation project run by a multi-vendor TSC with a one-third employer cap; Redis is controlled by Redis Ltd. with a contributor license agreement.

Valkey was formed by the Linux Foundation in March 2024 with backing from AWS, Google Cloud, Oracle, Ericsson and Snap. Its GOVERNANCE.md vests oversight in a Technical Steering Committee of the main repository's maintainers, caps any one organization at one third of TSC seats, and requires votes for major technical decisions and a two-thirds super-majority for governance changes. The current MAINTAINERS.md lists nine maintainers affiliated with Tencent, Apple, Percona, Amazon (two), Google, Oracle, Alibaba and Ericsson, with Madelyn Olson (Amazon) as chair. Redis is owned and steered by Redis Ltd.: contributions must be made under the Redis Software Grant and Contributor License Agreement, and Redis Ltd's CEO describes licensing and roadmap decisions as company decisions made with its CTO, core developers and Salvatore Sanfilippo. For platform teams this means Valkey's direction is set by a vendor-neutral foundation process, while Redis's direction (including licensing, as the 2024 and 2025 changes show) is set by a single company.

Limits/open questions: No formal Redis governance document was found beyond CONTRIBUTING.md and the CLA; Redis's internal decision process is described only by the company's blog. Valkey maintainer affiliations are as listed in MAINTAINERS.md on the unstable branch on 2026-10-16 and can change.
Checked: 2026-10-16T13:15:35.841Z

Source: Linux Foundation Launches Open Source Valkey Community
Origin: https://www.linuxfoundation.org/press/linux-foundation-launches-open-source-valkey-community
Snapshot: sources/lf-valkey-launch.txt; SHA256: 4506c837ae6fe3b9b60080c818b6bd225d13abc97f901cfd1b57c3ca823b4f41
Location: line 21; source date: 2024-03-28

> Today, the Linux Foundation announced its intent to form Valkey, an open source alternative to the Redis in-memory, NoSQL data store.

Source: Linux Foundation Launches Open Source Valkey Community
Origin: https://www.linuxfoundation.org/press/linux-foundation-launches-open-source-valkey-community
Snapshot: sources/lf-valkey-launch.txt; SHA256: 4506c837ae6fe3b9b60080c818b6bd225d13abc97f901cfd1b57c3ca823b4f41
Location: line 27; source date: 2024-03-28

> Industry participants, including Amazon Web Services (AWS), Google Cloud, Oracle, Ericsson, and Snap Inc. are supporting Valkey.

Source: Valkey GOVERNANCE.md (unstable branch)
Origin: https://raw.githubusercontent.com/valkey-io/valkey/unstable/GOVERNANCE.md
Snapshot: sources/valkey-GOVERNANCE.md; SHA256: 2e314116c14fafafe718c55668b849a5f0cf3081305d6e342583c2f5649267a3
Location: line 3; source date: not available

> The Valkey project is managed by a Technical Steering Committee (TSC) composed of the maintainers of the Valkey repository.

Source: Valkey GOVERNANCE.md (unstable branch)
Origin: https://raw.githubusercontent.com/valkey-io/valkey/unstable/GOVERNANCE.md
Snapshot: sources/valkey-GOVERNANCE.md; SHA256: 2e314116c14fafafe718c55668b849a5f0cf3081305d6e342583c2f5649267a3
Location: line 16; source date: not available

> At any time, no more than one third (1/3) of the TSC members may be employees, contractors, or representatives of the same organization or affiliated organizations.

Source: Valkey GOVERNANCE.md (unstable branch)
Origin: https://raw.githubusercontent.com/valkey-io/valkey/unstable/GOVERNANCE.md
Snapshot: sources/valkey-GOVERNANCE.md; SHA256: 2e314116c14fafafe718c55668b849a5f0cf3081305d6e342583c2f5649267a3
Location: line 63; source date: not available

> Governance major decisions shall require approval by a super-majority vote of at least two thirds (2/3) of the entire TSC.

Source: Valkey MAINTAINERS.md (unstable branch)
Origin: https://raw.githubusercontent.com/valkey-io/valkey/unstable/MAINTAINERS.md
Snapshot: sources/valkey-MAINTAINERS.md; SHA256: 770a3e7b3e06545e7d419d12ee5975f7a1e0c6ed45bb578ffd63422ec0e49169
Location: line 20; source date: not available

> \| Madelyn Olson       \| @madolson     \| Amazon      \|

Source: Redis CONTRIBUTING.md (unstable branch)
Origin: https://raw.githubusercontent.com/redis/redis/unstable/CONTRIBUTING.md
Snapshot: sources/redis-CONTRIBUTING.md; SHA256: 101809ca2da8d44262c9be184d3f66c4841af6f8983ee886443ddce38db87013
Location: line 1; source date: not available

> By contributing code to the Redis project in any form you agree to the Redis Software Grant and

Source: Redis is now available under the AGPLv3 open source license (Redis blog)
Origin: https://redis.io/blog/agplv3/
Snapshot: sources/redis-blog-agplv3.txt; SHA256: a233410a295364c7583690e3ce3d4bb7bfd2821045d32efcab780f24c4165d1a
Location: line 24; source date: 2025-05-01

> With guidance from Salvatore, our CTO, Benjamin Renaud, and our core developers, we have made some key decisions to improve Redis going forward:

## architecture

How do Redis and Valkey differ architecturally (threading/I/O model, modules, data types bundled in core)?

Status: supported.

Answer: Both remain single-threaded command execution with optional I/O threads; Redis 8 bundles Query Engine/JSON/time series/probabilistic types in one distribution, while Valkey keeps a lean core plus separately versioned modules (valkey-bundle).

Versions compared: the latest stable releases on GitHub as of 2026-10-16 were Redis 8.10.2 (2026-09-17) and Valkey 9.1.2 (2026-09-01), with Valkey 9.2.0-rc1 in pre-release. Both projects' shipped configuration files describe the server as mostly single threaded with optional io-threads for socket reads, writes and protocol parsing. Valkey 8.0 introduced a new multi-threaded I/O architecture (contributed from AWS's ElastiCache work), and Redis 8 introduced its own new I/O threading implementation; the two were developed separately after the fork. The major structural difference is packaging: Redis 8 merged Redis Stack into Redis Open Source, so JSON, time series, probabilistic structures, the Redis Query Engine (search and vector) and the new vector set type ship in the main distribution. Valkey keeps these out of the core and offers them as separate modules (valkey-json, valkey-bloom, valkey-search, valkey-ldap) packaged together in valkey-bundle; Valkey 9.1 went further and moved Lua scripting into its own module. Valkey's documentation states that modules written against the Redis RedisModule\_ API work in Valkey.

Limits/open questions: Based on project documentation and announcements, not source-code review. Feature parity of Valkey modules versus Redis's built-in Query Engine and JSON (command coverage, query language, performance) was not checked.
Checked: 2026-10-16T13:15:35.876Z

Source: Redis redis.conf (unstable branch)
Origin: https://raw.githubusercontent.com/redis/redis/unstable/redis.conf
Snapshot: sources/redis-conf.txt; SHA256: d4a4a7521e896a016b58f465db5229ea96cfd632b3309a29a9e41df280dc78ba
Location: line 1410; source date: not available

> Redis is mostly single threaded, however there are certain threaded

Source: Valkey valkey.conf (unstable branch)
Origin: https://raw.githubusercontent.com/valkey-io/valkey/unstable/valkey.conf
Snapshot: sources/valkey-conf.txt; SHA256: db6213ef13f209a9cd878329e9c543f09c65e8dee38ad69cea3f675879fdb48b
Location: line 1578; source date: not available

> The server is mostly single threaded, however there are certain threaded

Source: Unlock 1 Million RPS: Experience Triple the Speed with Valkey (valkey.io blog source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-io.github.io/main/content/blog/2024-07-07-unlock-one-million-rps.md
Snapshot: sources/valkey-blog-1m-rps.md; SHA256: 0c1d8434bd71655af66d5adf4ae3fc05194acedcdd43bca4e8aa39803ca1ee33
Location: line 51; source date: 2024-08-05

> Starting with version 8, Valkey users will benefit from an increase in multi-threaded performance, thanks to a new multi-threading architecture that can boost throughput and reduce latency on a wide range of hardware types.

Source: Redis 8 GA (Redis blog)
Origin: https://redis.io/blog/redis-8-ga/
Snapshot: sources/redis-blog-redis-8-ga.txt; SHA256: a263c2d42b59e1c5b94f961b0d979a3310b4de96a20601d124ac1e31952d0ab0
Location: line 71; source date: not available

> In Redis 8, we introduce our new I/O threading implementation.

Source: What's new in Redis 8.0 (Redis docs source)
Origin: https://raw.githubusercontent.com/redis/docs/main/content/develop/whats-new/8-0.md
Snapshot: sources/redis-whats-new-8-0.md; SHA256: 766ffbc6ee365ebaf1aaf2a3f506d8a0e6b3193f33cd6149dd9ba760cd64b2e8
Location: line 80; source date: not available

> Redis 8 merges Redis Stack and Redis Community Edition into a single unified distribution: Redis Open Source.

Source: valkey-bundle announcement (valkey.io blog source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-io.github.io/main/content/blog/2025-06-23-valkey-bundle-one-stop-shop-for-low-latency-modern-applications/index.md
Snapshot: sources/valkey-blog-bundle.md; SHA256: ceb2d5c3f3d822fc2c3e9b04c93e29a37c3e4d304f34a26db3b37e6d2238d714
Location: line 30; source date: 2025-06-23

> \*valkey-bundle\* is generally available as version 8.1 includes Valkey 8.1, valkey-json 1.0, valkey-bloom 1.0, valkey-search 1.0 and valkey-ldap 1.0 out of the box in a single container

Source: Valkey 9.1 delivers improvements in security, performance, and more (valkey.io blog source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-io.github.io/main/content/blog/2026-05-19-valkey-9-1-delivers-improvements-in-security-performance-and-more/index.md
Snapshot: sources/valkey-blog-9-1.md; SHA256: 1fdd8ac1980e76ce1bbbf39737acf8d8888f43258d5f9603633a3fa0d117ae93
Location: line 42; source date: 2026-05-19

> Valkey 9.1 moves the Lua scripting engine into its own module, decoupling it from the core server.

Source: Migration from Redis to Valkey (valkey-doc source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/migration.md
Snapshot: sources/valkey-doc-migration.md; SHA256: b3863055cfe481920094b15cd088daab448df037d9264999f495dad7b733a3a0
Location: line 43; source date: not available

> Modules written for Redis OSS using the \`RedisModule\_\` API work in Valkey.

Source: GitHub Releases API listing for redis/redis and valkey-io/valkey
Origin: https://api.github.com/repos/valkey-io/valkey/releases and https://api.github.com/repos/redis/redis/releases
Snapshot: sources/github-releases.txt; SHA256: faaa175e5c30c3b6e2cb1d275cd15d7fe58731fac832e156b8eef8beb267527c
Location: line 14; source date: 2026-10-16

> redis/redis release 8.10.2 published 2026-09-17T15:06:56Z stable

Source: GitHub Releases API listing for redis/redis and valkey-io/valkey
Origin: https://api.github.com/repos/valkey-io/valkey/releases and https://api.github.com/repos/redis/redis/releases
Snapshot: sources/github-releases.txt; SHA256: faaa175e5c30c3b6e2cb1d275cd15d7fe58731fac832e156b8eef8beb267527c
Location: line 6; source date: 2026-10-16

> valkey-io/valkey release 9.1.2 published 2026-09-01T00:01:31Z stable

Source: GitHub Releases API listing for redis/redis and valkey-io/valkey
Origin: https://api.github.com/repos/valkey-io/valkey/releases and https://api.github.com/repos/redis/redis/releases
Snapshot: sources/github-releases.txt; SHA256: faaa175e5c30c3b6e2cb1d275cd15d7fe58731fac832e156b8eef8beb267527c
Location: line 4; source date: 2026-10-16

> valkey-io/valkey release 9.2.0-rc1 published 2026-09-16T22:49:16Z prerelease

## persistence

How do RDB/AOF persistence and durability options compare between Redis and Valkey?

Status: supported.

Answer: Persistence models are the same lineage (RDB snapshots, multi-part AOF, appendfsync always/everysec/no), but on-disk formats have diverged after Redis 7.2.

Redis and Valkey documentation describe the same persistence options inherited from Redis 7: no persistence, RDB snapshots, AOF, or RDB plus AOF; the same three appendfsync policies (with everysec risking about one second of writes); and the multi-part AOF design (base file plus incremental files tracked by a manifest) that Redis introduced in 7.0 and Valkey inherited. Divergence is in newer additions and file compatibility: Redis 8.10 adds a BACKUP command for node-side backup and restore built on multi-part AOF, and Valkey's migration guide states that RDB files from Redis CE 7.4 and later are not compatible with Valkey. Durability semantics should therefore be considered equivalent for planning, but backups are not portable from Redis 7.4+ to Valkey.

Limits/open questions: No durability or recovery-time testing was performed. Newer Valkey-specific replication/persistence features (for example, changes to full sync) were not reviewed. Compatibility of Valkey 8/9 RDB files back into Redis was not checked.
Checked: 2026-10-16T13:15:35.911Z

Source: Redis persistence (Redis docs source)
Origin: https://raw.githubusercontent.com/redis/docs/main/content/operate/oss\_and\_stack/management/persistence.md
Snapshot: sources/redis-doc-persistence.md; SHA256: 1be4fedb62d29ccb848c6c2a6cc0a2fbc7fa4ee5b04d9f483fb6d7a9e2005874
Location: line 21; source date: not available

> \* \*\*RDB + AOF\*\*: You can also combine both AOF and RDB in the same instance.

Source: Valkey persistence topic (valkey-doc source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/persistence.md
Snapshot: sources/valkey-doc-persistence.md; SHA256: 46d6c4842950d19506321e3ce744bc1ea018d92a201f89b7a1b9dbec8ed000d0
Location: line 11; source date: not available

> \* \*\*RDB + AOF\*\*: You can also combine both AOF and RDB in the same instance.

Source: Redis persistence (Redis docs source)
Origin: https://raw.githubusercontent.com/redis/docs/main/content/operate/oss\_and\_stack/management/persistence.md
Snapshot: sources/redis-doc-persistence.md; SHA256: 1be4fedb62d29ccb848c6c2a6cc0a2fbc7fa4ee5b04d9f483fb6d7a9e2005874
Location: line 120; source date: not available

> Since Redis 7.0.0, Redis uses a multi part AOF mechanism.

Source: Valkey persistence topic (valkey-doc source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/persistence.md
Snapshot: sources/valkey-doc-persistence.md; SHA256: 46d6c4842950d19506321e3ce744bc1ea018d92a201f89b7a1b9dbec8ed000d0
Location: line 113; source date: not available

> Valkey uses a multi part AOF mechanism.

Source: Redis persistence (Redis docs source)
Origin: https://raw.githubusercontent.com/redis/docs/main/content/operate/oss\_and\_stack/management/persistence.md
Snapshot: sources/redis-doc-persistence.md; SHA256: 1be4fedb62d29ccb848c6c2a6cc0a2fbc7fa4ee5b04d9f483fb6d7a9e2005874
Location: line 160; source date: not available

> you may lose 1 second of data if there is a disaster.

Source: Valkey persistence topic (valkey-doc source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/persistence.md
Snapshot: sources/valkey-doc-persistence.md; SHA256: 46d6c4842950d19506321e3ce744bc1ea018d92a201f89b7a1b9dbec8ed000d0
Location: line 149; source date: not available

> \* \`appendfsync everysec\`: \`fsync\` every second. Fast enough and you may lose 1 second of data if there is a disaster.

Source: What's new in Redis 8.10 (Redis docs source)
Origin: https://raw.githubusercontent.com/redis/docs/main/content/develop/whats-new/8-10.md
Snapshot: sources/redis-whats-new-8-10.md; SHA256: cffed8811d82812935701a5c732be91110f4d3be7ced7d1ef9811fd4bbeac8dd
Location: line 57; source date: not available

> command (\#15441) adds a node-side implementation for backup and restore based on multi-part AOF (MP-AOF).

Source: Migration from Redis to Valkey (valkey-doc source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/migration.md
Snapshot: sources/valkey-doc-migration.md; SHA256: b3863055cfe481920094b15cd088daab448df037d9264999f495dad7b733a3a0
Location: line 38; source date: not available

> RDB files produced by Redis CE 7.4 and later are not compatible.

## clustering

How do clustering, replication and high availability compare (Cluster, Sentinel, recent cluster changes such as Valkey atomic slot migration or multiple databases in cluster mode)?

Status: supported.

Answer: Both use the 16,384-slot cluster model and both now offer atomic slot migration (Valkey 9.0, Redis 8.4); Valkey 9.0 additionally supports numbered databases in cluster mode, which Redis Cluster does not.

Clustering stems from the same Redis Cluster design (16,384 hash slots). Since the fork, both projects independently replaced key-by-key resharding with atomic slot migration: Valkey 9.0 migrates whole slots using the AOF format, and Redis 8.4 added the CLUSTER MIGRATION command, with redis-cli --cluster reshard/rebalance using server-side atomic migration from 8.10. Redis notes that Search and time series queries may return partial results or duplicates during atomic slot migration. Valkey 9.0 also added numbered databases in cluster mode, whereas the Redis cluster specification still allows only database 0. Valkey's 9.0 announcement claims large-cluster resilience improvements up to 2,000 nodes and over 1 billion requests per second. Because the slot-migration commands differ, cluster tooling and operators are no longer interchangeable for these newer operations.

Limits/open questions: Sentinel-based HA and replication behavior were not compared in detail. The 2,000-node/1B RPS figure is a project claim, not independently verified. Operator/Kubernetes tooling support for each project's atomic migration was not checked.
Checked: 2026-10-16T13:15:35.948Z

Source: Redis cluster specification (Redis docs source)
Origin: https://raw.githubusercontent.com/redis/docs/main/content/operate/oss\_and\_stack/reference/cluster-spec.md
Snapshot: sources/redis-doc-cluster-spec.md; SHA256: c2630e8a57a52d451f780afaaaee45f2a5018f15f18555d163e1c5aa0dbc84c2
Location: line 146; source date: not available

> The cluster's key space is split into 16384 slots

Source: Valkey 9.0: innovation, features, and improvements (valkey.io blog source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-io.github.io/main/content/blog/2025-10-21-introducing-valkey-9/index.md
Snapshot: sources/valkey-blog-valkey-9.md; SHA256: 75758d34864610644dd23e35e78ab6d9df999df9d198187ad1a2350e3c8ac355
Location: line 32; source date: 2025-10-21

> In Valkey 9.0 instead of being key-by-key, Valkey migrates entire slots at a time, atomically moving the slot from one node to another using the AOF format.

Source: What's new in Redis 8.4 (Redis docs source)
Origin: https://raw.githubusercontent.com/redis/docs/main/content/develop/whats-new/8-4.md
Snapshot: sources/redis-whats-new-8-4.md; SHA256: df61f1621b734d735f44376f4db30d75358f8300fc02905f5471c50b46e85d1d
Location: line 30; source date: not available

> Redis 8.4 introduces the \[\`CLUSTER MIGRATION\`\](/content/commands/cluster-migration.md) command, which enables atomic slot migration between cluster nodes.

Source: What's new in Redis 8.10 (Redis docs source)
Origin: https://raw.githubusercontent.com/redis/docs/main/content/develop/whats-new/8-10.md
Snapshot: sources/redis-whats-new-8-10.md; SHA256: cffed8811d82812935701a5c732be91110f4d3be7ced7d1ef9811fd4bbeac8dd
Location: line 248; source date: not available

> \`redis-cli --cluster reshard\` and \`rebalance\` now move slots with server-side atomic slot migration (\#15338).

Source: What's new in Redis 8.4 (Redis docs source)
Origin: https://raw.githubusercontent.com/redis/docs/main/content/develop/whats-new/8-4.md
Snapshot: sources/redis-whats-new-8-4.md; SHA256: df61f1621b734d735f44376f4db30d75358f8300fc02905f5471c50b46e85d1d
Location: line 102; source date: not available

> may return partial results or duplicates during atomic slot migration.

Source: Valkey cluster specification (valkey-doc source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/cluster-spec.md
Snapshot: sources/valkey-doc-cluster-spec.md; SHA256: 29658f0b303b8d353a7dd75d3e94962bac11dd8a2539d57ea93e7f98c01f531c
Location: line 32; source date: not available

> Starting with version 9.0, Valkey cluster supports multiple databases, similar to standalone mode but with some additional restrictions.

Source: Redis cluster specification (Redis docs source)
Origin: https://raw.githubusercontent.com/redis/docs/main/content/operate/oss\_and\_stack/reference/cluster-spec.md
Snapshot: sources/redis-doc-cluster-spec.md; SHA256: c2630e8a57a52d451f780afaaaee45f2a5018f15f18555d163e1c5aa0dbc84c2
Location: line 48; source date: not available

> We only support database \`0\`; the \[\`SELECT\`\](/content/commands/select.md) command is not allowed.

Source: Valkey 9.0: innovation, features, and improvements (valkey.io blog source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-io.github.io/main/content/blog/2025-10-21-introducing-valkey-9/index.md
Snapshot: sources/valkey-blog-valkey-9.md; SHA256: 75758d34864610644dd23e35e78ab6d9df999df9d198187ad1a2350e3c8ac355
Location: line 73; source date: 2025-10-21

> Improvements in the resilience of large clusters, enabling scaling to 2,000 nodes and achieving over 1 billion requests per second

## performance

What do primary sources state about performance of current Redis and Valkey releases, and how comparable are those claims?

Status: supported.

Answer: Both projects publish large self-benchmarked gains from new I/O threading, but against their own older versions on different hardware; no primary source gives a like-for-like Redis 8 vs Valkey 9 comparison.

Redis says Redis 8 reduced per-command p50 latency by 5.4% to 87.4% versus Redis 7.2.5 across its benchmark suite and measured up to 112% higher throughput with io-threads set to 8 on a multi-core Intel CPU. Valkey reported that its 8.0 I/O threading raised throughput by about 230% (360K to 1.19M requests per second) versus Valkey 7.2 on an AWS Graviton c7g.16xlarge with 8 I/O threads, and that Valkey 9.1.0 reached 2.1 million requests per second on a single server with 9 I/O threads and pipeline depth 10. These figures use different baselines, hardware, workloads and pipelining, so they cannot be compared directly. The answer to 'which is faster' is that both are now multi-threaded for I/O and both are in the same performance class; a platform team should benchmark its own workload on its target instance types.

Limits/open questions: All performance numbers are vendor or project self-benchmarks. A web search for independent head-to-head benchmarks of current versions returned only secondary articles of mixed reliability, which were not inspected or cited. No benchmark was run as part of this research.
Checked: 2026-10-16T13:15:35.985Z

Source: Redis 8 GA (Redis blog)
Origin: https://redis.io/blog/redis-8-ga/
Snapshot: sources/redis-blog-redis-8-ga.txt; SHA256: a263c2d42b59e1c5b94f961b0d979a3310b4de96a20601d124ac1e31952d0ab0
Location: line 66; source date: not available

> We have reduced the latency per command in Redis 8 for a large set of commands compared to Redis 7.2.5.

Source: Redis 8 GA (Redis blog)
Origin: https://redis.io/blog/redis-8-ga/
Snapshot: sources/redis-blog-redis-8-ga.txt; SHA256: a263c2d42b59e1c5b94f961b0d979a3310b4de96a20601d124ac1e31952d0ab0
Location: line 66; source date: not available

> The p50 latency reduction ranges from 5.4% to 87.4%.

Source: Redis 8 GA (Redis blog)
Origin: https://redis.io/blog/redis-8-ga/
Snapshot: sources/redis-blog-redis-8-ga.txt; SHA256: a263c2d42b59e1c5b94f961b0d979a3310b4de96a20601d124ac1e31952d0ab0
Location: line 71; source date: not available

> measured up to 112% improvement in throughput. Exact throughput improvements will vary, contingent on the commands being executed.

Source: Unlock 1 Million RPS: Experience Triple the Speed with Valkey (valkey.io blog source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-io.github.io/main/content/blog/2024-07-07-unlock-one-million-rps.md
Snapshot: sources/valkey-blog-1m-rps.md; SHA256: 0c1d8434bd71655af66d5adf4ae3fc05194acedcdd43bca4e8aa39803ca1ee33
Location: line 55; source date: 2024-08-05

> Throughput increased by approximately 230%, rising from 360K to 1.19M requests per second compared to Valkey 7.2

Source: Unlock 1 Million RPS: Experience Triple the Speed with Valkey (valkey.io blog source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-io.github.io/main/content/blog/2024-07-07-unlock-one-million-rps.md
Snapshot: sources/valkey-blog-1m-rps.md; SHA256: 0c1d8434bd71655af66d5adf4ae3fc05194acedcdd43bca4e8aa39803ca1ee33
Location: line 58; source date: 2024-08-05

> Tested with 8 I/O threads, 3M keys DB size, 512 bytes value size, and 650 clients running sequential SET commands using AWS EC2 C7g.16xlarge instance.

Source: Valkey 9.1 delivers improvements in security, performance, and more (valkey.io blog source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-io.github.io/main/content/blog/2026-05-19-valkey-9-1-delivers-improvements-in-security-performance-and-more/index.md
Snapshot: sources/valkey-blog-9-1.md; SHA256: 1fdd8ac1980e76ce1bbbf39737acf8d8888f43258d5f9603633a3fa0d117ae93
Location: line 96; source date: 2026-05-19

> Valkey 9.1.0 pushes single server throughput to 2.1 million requests per second using 512-byte payloads, 9 IO threads, and a pipeline depth of 10 commands.

## compatibility

How compatible are Valkey and Redis at the protocol, command and data-file level, and where have they diverged since Redis 7.2.4?

Status: supported.

Answer: Valkey is wire-, config- and data-compatible with Redis OSS 7.2 and earlier; since then the command sets and data files have diverged.

Valkey documents compatibility with Redis OSS 7.2 and all earlier open-source versions because Valkey 7.2.4 forked from Redis 7.2.4: it speaks RESP2/RESP3 so existing Redis clients connect unchanged, accepts Redis-style configuration, reports redis\_version:7.2.4 in INFO for backward compatibility, and runs RedisModule\_ API modules. Divergence since the fork: data files from Redis CE 7.4+ are not compatible with Valkey; Redis 8 adds Redis-only types and commands such as vector sets and the bundled Query Engine/JSON/time series commands; Valkey 9.0 deliberately departs from Redis by supporting numbered databases in cluster mode. Some features have converged at the command level, for example hash field expiration (Redis 7.4+, extended in 8.0; Valkey 9.0 added HEXPIRE, HGETEX, HSETEX and related commands). Applications using only the Redis 7.2-era command set are portable; applications that rely on Redis 7.4+/8 features need per-command verification.

Limits/open questions: No command-by-command parity matrix was built and no client libraries were tested. Behavior differences for identically named commands added independently after the fork (e.g., hash-field-expiration options) were not verified.
Checked: 2026-10-16T13:15:36.022Z

Source: Migration from Redis to Valkey (valkey-doc source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/migration.md
Snapshot: sources/valkey-doc-migration.md; SHA256: b3863055cfe481920094b15cd088daab448df037d9264999f495dad7b733a3a0
Location: line 20; source date: not available

> Valkey is compatible with Redis OSS 7.2 and all earlier open-source Redis versions, as Valkey 7.2.4 is a fork of Redis OSS 7.2.4.

Source: Migration from Redis to Valkey (valkey-doc source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/migration.md
Snapshot: sources/valkey-doc-migration.md; SHA256: b3863055cfe481920094b15cd088daab448df037d9264999f495dad7b733a3a0
Location: line 37; source date: not available

> Valkey uses the RESP wire protocol and supports both RESP2 and RESP3. Existing Redis client libraries can connect to Valkey without code changes.

Source: Migration from Redis to Valkey (valkey-doc source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/migration.md
Snapshot: sources/valkey-doc-migration.md; SHA256: b3863055cfe481920094b15cd088daab448df037d9264999f495dad7b733a3a0
Location: line 41; source date: not available

> Valkey reports \`redis\_version:7.2.4\` in the \[INFO\](../commands/info.md) output for backward compatibility.

Source: Migration from Redis to Valkey (valkey-doc source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/migration.md
Snapshot: sources/valkey-doc-migration.md; SHA256: b3863055cfe481920094b15cd088daab448df037d9264999f495dad7b733a3a0
Location: line 25; source date: not available

> Redis Community Edition (CE) version 7.4 and later produce data files that are not compatible with Valkey.

Source: What's new in Redis 8.0 (Redis docs source)
Origin: https://raw.githubusercontent.com/redis/docs/main/content/develop/whats-new/8-0.md
Snapshot: sources/redis-whats-new-8-0.md; SHA256: 766ffbc6ee365ebaf1aaf2a3f506d8a0e6b3193f33cd6149dd9ba760cd64b2e8
Location: line 28; source date: not available

> The new \`Vector set\` data structure supports high-dimensional vector similarity search

Source: Valkey 9.0: innovation, features, and improvements (valkey.io blog source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-io.github.io/main/content/blog/2025-10-21-introducing-valkey-9/index.md
Snapshot: sources/valkey-blog-valkey-9.md; SHA256: 75758d34864610644dd23e35e78ab6d9df999df9d198187ad1a2350e3c8ac355
Location: line 66; source date: 2025-10-21

> Based on user feedback and reconsideration by the team, Valkey 9.0 breaks from the preceding project and adds full support for numbered databases in cluster mode.

Source: What's new in Redis 8.0 (Redis docs source)
Origin: https://raw.githubusercontent.com/redis/docs/main/content/develop/whats-new/8-0.md
Snapshot: sources/redis-whats-new-8-0.md; SHA256: 766ffbc6ee365ebaf1aaf2a3f506d8a0e6b3193f33cd6149dd9ba760cd64b2e8
Location: line 31; source date: not available

> introduction of field-level expiration in hashes and adds three new commands for working with hashes

Source: Valkey 9.0: innovation, features, and improvements (valkey.io blog source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-io.github.io/main/content/blog/2025-10-21-introducing-valkey-9/index.md
Snapshot: sources/valkey-blog-valkey-9.md; SHA256: 75758d34864610644dd23e35e78ab6d9df999df9d198187ad1a2350e3c8ac355
Location: line 43; source date: 2025-10-21

> Valkey 9.0 now address this gap by adding the following commands:

## migration

What documented migration paths exist from Redis to Valkey (self-managed and managed cloud services), and what are the caveats?

Status: supported.

Answer: From Redis OSS 7.2 or earlier, migration is effectively an in-place upgrade (snapshot copy, replication, or managed cross-engine upgrade); from Redis 7.4+/8 it needs logical data migration tools.

Valkey's migration guide treats moving from Redis OSS 2.x-7.2.x as an upgrade and documents three standalone paths (copy an RDB snapshot, replicate from Redis with REPLICAOF and then promote, or MIGRATE specific keys) plus a cluster procedure. Caveats it calls out: disable AOF on Valkey's first start or the copied RDB will not load, snapshot copies need downtime and write quiescence, and Redis CE 7.4+ data files are not supported, so those sources require other methods (it points to third-party tools such as RIOT and RedisShake as out of scope). On AWS, ElastiCache supports a cross-engine upgrade from Redis OSS to Valkey via console/CLI/API with the same endpoint DNS name, minimal downtime from Redis OSS 5.0.6+, and a few seconds of write unavailability at failover, though node IPs change for node-based clusters.

Limits/open questions: Only the Valkey project guide and Amazon ElastiCache documentation were inspected; Google Cloud Memorystore, Azure and other providers' migration paths were not checked. Migration from Redis 8 (including data in Redis-only types such as JSON, time series or vector sets) to Valkey modules was not researched and has no primary-source procedure here. No migration was tested.
Checked: 2026-10-16T13:15:36.062Z

Source: Migration from Redis to Valkey (valkey-doc source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/migration.md
Snapshot: sources/valkey-doc-migration.md; SHA256: b3863055cfe481920094b15cd088daab448df037d9264999f495dad7b733a3a0
Location: line 21; source date: not available

> Migrating from one of these Redis versions to Valkey is effectively an upgrade.

Source: Migration from Redis to Valkey (valkey-doc source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/migration.md
Snapshot: sources/valkey-doc-migration.md; SHA256: b3863055cfe481920094b15cd088daab448df037d9264999f495dad7b733a3a0
Location: line 49; source date: not available

> \[Physical migration\](\#physical-migration) by copying the most recent on-disk snapshot from the Redis server to Valkey and starting Valkey server with it

Source: Migration from Redis to Valkey (valkey-doc source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/migration.md
Snapshot: sources/valkey-doc-migration.md; SHA256: b3863055cfe481920094b15cd088daab448df037d9264999f495dad7b733a3a0
Location: line 50; source date: not available

> \[Setting up replication\](\#replication) between Redis and Valkey

Source: Migration from Redis to Valkey (valkey-doc source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/migration.md
Snapshot: sources/valkey-doc-migration.md; SHA256: b3863055cfe481920094b15cd088daab448df037d9264999f495dad7b733a3a0
Location: line 116; source date: not available

> If you enabled AOF in your Valkey configuration, disable it on the first start. Otherwise, the copied RDB file will not be imported into Valkey.

Source: Migration from Redis to Valkey (valkey-doc source)
Origin: https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/migration.md
Snapshot: sources/valkey-doc-migration.md; SHA256: b3863055cfe481920094b15cd088daab448df037d9264999f495dad7b733a3a0
Location: line 26; source date: not available

> It may be possible to migrate the data to Valkey from proprietary Redis versions and other Redis-like software, but it requires another method and is not covered by this document.

Source: Upgrading engine versions including cross engine upgrades (Amazon ElastiCache User Guide)
Origin: https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/VersionManagement.HowTo.cross-engine-upgrade.html
Snapshot: sources/aws-elasticache-valkey-upgrade.txt; SHA256: 960f919801fd312f7ce74d9f6d7f78a9e6199326d1dacd863dc5d50d611ea89a
Location: line 54; source date: not available

> Valkey is designed as a drop-in replacement for Redis OSS 7.

Source: Upgrading engine versions including cross engine upgrades (Amazon ElastiCache User Guide)
Origin: https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/VersionManagement.HowTo.cross-engine-upgrade.html
Snapshot: sources/aws-elasticache-valkey-upgrade.txt; SHA256: 960f919801fd312f7ce74d9f6d7f78a9e6199326d1dacd863dc5d50d611ea89a
Location: line 54; source date: not available

> You will experience minimal downtime when upgrading from Redis OSS 5.0.6 or higher.

Source: Upgrading engine versions including cross engine upgrades (Amazon ElastiCache User Guide)
Origin: https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/VersionManagement.HowTo.cross-engine-upgrade.html
Snapshot: sources/aws-elasticache-valkey-upgrade.txt; SHA256: 960f919801fd312f7ce74d9f6d7f78a9e6199326d1dacd863dc5d50d611ea89a
Location: line 54; source date: not available

> except that for node-based clusters, the underlying node IP addresses will change during the upgrade.

