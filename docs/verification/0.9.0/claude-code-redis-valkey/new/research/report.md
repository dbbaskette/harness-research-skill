# Redis vs Valkey for a platform team

Request: Research Redis vs Valkey for a platform team choosing an in-memory data store: licensing, governance, architecture, persistence, clustering, performance, compatibility and migration, as of late 2026. Use public sources, primary documentation first. Save a cited report.

Run: e0649dcf34db4d849bc76ffe; output revision: 96.
Status: complete-with-gaps. Depth: light. Started 2026-10-16; updated 2026-10-16.
Runtime: 0.9.0; guidance: 0.9.0 (local runtime guidance).

Redis (Redis Ltd.'s open-source Redis / Redis Open Source) and Valkey (the Linux Foundation fork) as in-memory data stores, as of late 2026, for a platform team choosing between them: licensing, governance and project history, architecture, persistence, clustering and replication, published performance claims, compatibility, and migration. Primary documentation, licence texts and project announcements first. Out of scope: managed-service pricing, client-library comparisons, and vendor enterprise editions beyond what bears on licensing.

Sources given: none; further public sources were permitted.
Counts: 20 questions (11 answered, 9 partly, 0 not answered or not yet assessed); 113 current checked facts from 45 sources; 0 rejected, 31 narrowed; 18 gaps; 0 conflicts.
How facts were checked: each fact by a separate invocation from the one that researched it, against the original source (checkers: cc-951acfc5 on claude-code, cc-959c7444 on claude-code, cc-435fdfd8 on claude-code, cc-ac4676f4 on claude-code, cc-10a079ee on claude-code, cc-38b7c8ec on claude-code, cc-972008d9 on claude-code, cc-7abbdd77 on claude-code, cc-223e8b8d on claude-code, cc-0512f016 on claude-code, cc-77561ff0 on claude-code).
Prose: citation and number validation, but no independent semantic writing review at light depth.
Facts are checked for source support, not certified as true or live-current.

## Contents

- [Coverage](#coverage)
- [Licensing](#licensing)
- [Governance and history](#governance-and-history)
- [Architecture](#architecture)
- [Persistence](#persistence)
- [Clustering and replication](#clustering-and-replication)
- [Performance](#performance)
- [Compatibility](#compatibility)
- [Migration](#migration)
- [Gaps](#gaps)
- [Conflicts and history](#conflicts-and-history)
- [Sources](#sources)
- [Rejected facts and failed tasks](#rejected-facts-and-failed-tasks)

## Coverage

- Licensing: 10 current checked facts (Redis 6, Valkey 4); 2/2 questions answered with current evidence.
- Governance and history: 16 current checked facts (Redis 5, Valkey 6, cross-cutting 5); 3/3 questions answered with current evidence.
- Architecture: 12 current checked facts (Redis 6, Valkey 6); 1/2 questions answered with current evidence. Open: How does Valkey use threads to process commands and network I/O? (partly answered).
- Persistence: 12 current checked facts (Redis 6, Valkey 6); 2/2 questions answered with current evidence.
- Clustering and replication: 12 current checked facts (Redis 6, Valkey 6); 2/2 questions answered with current evidence.
- Performance: 16 current checked facts (Redis 6, Valkey 6, cross-cutting 4); 0/3 questions answered with current evidence. Open: What performance improvements do recent Redis releases claim? (partly answered); What performance improvements do recent Valkey releases claim? (partly answered); What independent, third-party benchmarks compare recent Redis and Valkey releases? (partly answered).
- Compatibility: 16 current checked facts (Redis 6, Valkey 10); 0/3 questions answered with current evidence. Open: Which data types and features does Redis offer that Valkey does not document? (partly answered); How compatible is Valkey with Redis commands, protocol and data files? (partly answered); Which commands added in Redis 7.4 and 8.x does Valkey implement or lack? (partly answered).
- Migration: 19 current checked facts; 1/3 questions answered with current evidence. Open: Which Redis versions or features limit a straightforward migration to Valkey? (partly answered); Which tools or managed services support migrating data from Redis 7.4 or later to Valkey? (partly answered).

## Licensing

| Redis | Valkey |
| --- | --- |
| Redis Open Source 8 and later versions let users choose among three licences: RSALv2, SSPLv1 and AGPLv3. [7] [10] | Valkey is released under the BSD 3-Clause licence, per its repository COPYING file. [11] [13] |
| Redis 7.2.x and earlier remain under the BSD3 licence, while Redis Community Edition 7.4.x to 7.8.x remain under the dual RSALv2/SSPLv1 licence. [7] | Valkey was forked from open source Redis 7.2.4, just before Redis moved to source-available licences, according to the Valkey README and Linux Foundation launch announcement. [12] [13] |
| In March 2024 Redis Ltd. announced that, starting with Redis 7.4, Redis would be dual-licensed under RSALv2 and SSPLv1 and no longer distributed under the three-clause BSD licence. [7] [9] | The Linux Foundation's CTO said foundation stewardship means Valkey will be community-driven without surprise licence changes. [13] |
| Redis Ltd. states that RSALv2 and SSPLv1 are not open source licences, whereas AGPLv3, added with Redis 8, is OSI-approved. [7] [8] | Valkey's COPYING file carries both a 2024-present copyright notice for Valkey contributors and a 2006-2020 copyright notice for Redis Ltd. [11] |
| Under the RSALv2/SSPLv1 terms introduced in 2024, Redis Ltd. said organizations providing competitive offerings may not use new Redis versions free of charge, while non-competing users are unaffected. [7] [9] |  |
| Redis 8 folds RediSearch, RedisJSON, RedisTimeSeries and RedisBloom into Redis Open Source under the same tri-licence as core Redis. [7] |  |

### Under which licences is current Redis released, and how have they changed since 2024?

Redis Open Source 8 and later is offered under a choice of RSALv2, SSPLv1 or AGPLv3, following a March 2024 change that moved Redis from the BSD licence to dual RSALv2/SSPLv1 starting with Redis 7.4. [7] [9] [10]

In March 2024 Redis Ltd. announced that, starting with Redis 7.4, Redis would be dual-licensed under RSALv2 and SSPLv1 and no longer distributed under the three-clause BSD licence. [7] [9] Redis Ltd. said at the time that organizations providing competitive offerings could not use new Redis versions free of charge under those terms, while non-competing users were unaffected. [7] [9]

Redis Open Source 8 and later versions let users choose among RSALv2, SSPLv1 and AGPLv3. [7] [10] Redis Ltd. states that RSALv2 and SSPLv1 are not open source licences, whereas AGPLv3, added with Redis 8, is OSI-approved. [7] [8] Redis 8 also folds RediSearch, RedisJSON, RedisTimeSeries and RedisBloom into Redis Open Source under the same tri-licence as core Redis. [7]

Earlier releases keep their original terms: Redis 7.2.x and earlier remain under the BSD3 licence, and Redis Community Edition 7.4.x to 7.8.x remain under the dual RSALv2/SSPLv1 licence. [7]

Facts behind this answer:

- fact-21aa1985858b43569993c0b7311dc63f [confirmed]: Redis Open Source 8 and later versions let users choose among three licences: RSALv2, SSPLv1 and AGPLv3. [7] [10]; as of 2026-10-16; 2 publishers.
  > A user may select one of the following three license options to use Redis Open Source (starting with Redis 8) and subsequent versions: the Redis Source Available License v2 (RSALv2), the Server Side Public License v1 (SSPLv1), and the GNU Affero General Public License v3 (AGPLv3). [7], Redis Licensing Overview
  > After this release, contributions are subject to your choice of: (a) the Redis Source Available License v2 [10], LICENSE.txt preamble

- fact-83f3be4266c04bb4bd7f36784f64924b [confirmed]: Redis 7.2.x and earlier remain under the BSD3 licence, while Redis Community Edition 7.4.x to 7.8.x remain under the dual RSALv2/SSPLv1 licence. [7]; as of 2026-10-16; one publisher.
  > Redis 7.2.x of Redis Open Source and earlier versions remain subject to the BSD3 license. Redis Community Edition 7.4.x to 7.8.x remain subject to the dual RSALv2/SSPLv1 license. [7], About past licenses

- fact-0bafbd38991a47c498d92ab975d7f523 [confirmed]: In March 2024 Redis Ltd. announced that, starting with Redis 7.4, Redis would be dual-licensed under RSALv2 and SSPLv1 and no longer distributed under the three-clause BSD licence. [7] [9]; as of 2024-03-20; one publisher.
  > Starting with Redis 7.4, Redis will be dual-licensed under the Redis Source Available License (RSALv2) and Server Side Public License (SSPLv1). Consequently, Redis will no longer be distributed under the three-clause Berkeley Software Distribution (BSD). [9], Redis Adopts Dual Source-Available Licensing (March 20, 2024)
  > Some community members were frustrated by our March 2024 license change to the dual-license RSALv2 and SSPLv1, neither of which are OSI-approved licenses. [7], Why did Redis add AGPLv3?

- fact-145a715daa4345b9b4b3017a651e050b [confirmed]: Redis Ltd. states that RSALv2 and SSPLv1 are not open source licences, whereas AGPLv3, added with Redis 8, is OSI-approved. [7] [8]; as of 2026-10-16; one publisher.
  > RSALv2 is not an open source license. [7], About RSALv2
  > SSPLv1 is not an open source license. [7], About SSPLv1
  > Adding the OSI-approved AGPL as an additional licensing option for Redis, starting with Redis 8 (available now); [8], Redis is now available under the AGPLv3 open source license (May 01, 2025)
  > AGPLv3 is an OSI-approved open source license. [7], About AGPLv3

- fact-1b6639005d4b42dbb797387ca8a5fa27 [confirmed]: Under the RSALv2/SSPLv1 terms introduced in 2024, Redis Ltd. said organizations providing competitive offerings may not use new Redis versions free of charge, while non-competing users are unaffected. [7] [9]; as of 2024-03-20; one publisher.
  > Organizations providing competitive offerings to Redis will no longer be permitted to use new versions of the source code of Redis free of charge under either of the dual licenses. Commercial licensing terms are available and can enable use cases beyond the RSALv2 or SSPLv1 license limitations. If you are building a solution that leverages Redis, but does not specifically compete with Redis itself, there is no impact. [9], FAQ
  > Some community members were frustrated by our March 2024 license change to the dual-license RSALv2 and SSPLv1, neither of which are OSI-approved licenses. [7], Why did Redis add AGPLv3?

- fact-283039ff34ac4315ac8f8ec6d56a358e [confirmed]: Redis 8 folds RediSearch, RedisJSON, RedisTimeSeries and RedisBloom into Redis Open Source under the same tri-licence as core Redis. [7]; as of 2026-10-16; one publisher.
  > RediSearch, RedisJSON, RedisTimeSeries, and RedisBloom are now included as integral components of Redis Open Source and subject to the same tri-license. Starting with Redis 8, the version numbers of all included modules are identical to the version number of Redis Open Source they are included in. [7], About our tri-license

### Under which licence is Valkey released?

Valkey is released under the BSD 3-Clause licence, per its repository COPYING file. [11] [13]

Valkey's repository COPYING file gives the BSD 3-Clause licence. [11] [13] That file carries both a 2024-present copyright notice for Valkey contributors and a 2006-2020 copyright notice for Redis Ltd. [11]

According to the Valkey README and the Linux Foundation launch announcement, Valkey was forked from open source Redis 7.2.4, just before Redis moved to source-available licences. [12] [13] Redis 7.2.x and earlier remain under the BSD3 licence, so Valkey continues the licence of the Redis line it was forked from, while Redis Open Source 8 and later instead offers a choice of RSALv2, SSPLv1 and AGPLv3. [7] [10] [11] [12] [13]

At Valkey's launch, the Linux Foundation's CTO said foundation stewardship means Valkey will be community-driven without surprise licence changes, a commitment made by the project's own steward. [13]

Facts behind this answer:

- fact-47ee39c9287441d8a044e1f8c3d9741f [confirmed]: Valkey is released under the BSD 3-Clause licence, per its repository COPYING file. [11] [13]; as of 2026-10-16; 2 publishers.
  > Copyright (c) 2024-present, Valkey contributors [11], COPYING header
  > Valkey will continue development on Redis 7.2.4 and will keep the project available for use and distribution under the open source Berkeley Software Distribution (BSD) 3-clause license. [13], Press release, 28 March 2024

- fact-231c4fbab8c143a2aa08a34aae754b02 [confirmed]: Valkey was forked from open source Redis 7.2.4, just before Redis moved to source-available licences, according to the Valkey README and Linux Foundation launch announcement. [12] [13]; as of 2024-03-28; 2 publishers.
  > This project was forked from the open source Redis project right before the transition to their new source available licenses. [12], README introduction
  > Today, the Linux Foundation announced its intent to form Valkey, an open source alternative to the Redis in-memory, NoSQL data store. Project contributors quickly gathered maintainer, community, and corporate support to regroup in response to the recent license change announced by Redis Inc. Valkey will continue development on Redis 7.2.4 [13], Press release, 28 March 2024

- fact-32fb33e2a759427782f994a88222a591 [confirmed]: The Linux Foundation's CTO said foundation stewardship means Valkey will be community-driven without surprise licence changes. [13]; as of 2024-03-28; one publisher.
  > having this project in the hands of a foundation, rather than a single company, means Valkey will be community-driven without surprise license changes that break trust and disrupt a level open source playing field [13], Press release quote, Chris Aniszczyk

- fact-730a420302014e8b8a13ac4a218873d4 [confirmed]: Valkey's COPYING file carries both a 2024-present copyright notice for Valkey contributors and a 2006-2020 copyright notice for Redis Ltd. [11]; as of 2026-10-16; one publisher.
  > Copyright (c) 2024-present, Valkey contributors [11], COPYING header
  > Copyright (c) 2006-2020, Redis Ltd. [11], COPYING header


## Governance and history

| Redis | Valkey |
| --- | --- |
| Redis accepts code contributions only under the Redis Software Grant and Contributor License Agreement required by the company Redis Ltd. [26] | The Linux Foundation announced on March 28, 2024 its intent to form Valkey as an open source alternative to Redis. [13] |
| Redis the company is the registered owner of the Redis name and logo and sets requirements for use of those trademarks. [24] | Valkey is governed by a Technical Steering Committee composed of the maintainers of the Valkey repository, which oversees all technical, project, approval and policy matters. [22] |
| Redis Inc. described itself as the maintainers of the Redis code and said it sponsored the bulk of Redis development alongside a community of contributors. [9] | Valkey governance limits any single organization to no more than one third of Valkey TSC members. [22] |
| Redis Inc. framed its license change as its own, made despite efforts to support a community-led governance model and its desire to maintain the BSD license. [9] | Valkey governance major decisions, including changing the governance document or adding TSC members, require a two-thirds supermajority of the entire TSC. [22] |
| Redis CEO Rowan Trollope announced adding AGPL as a licensing option starting with Redis 8, with guidance from Salvatore, CTO Benjamin Renaud and core developers. [8] [25] | Valkey's TSC chair is Madelyn Olson, and its maintainers come from several companies including Amazon, Google, Oracle, Ericsson, Tencent, Apple, Alibaba and Percona. [23] |
|  | At launch, Valkey was backed by AWS, Google Cloud, Oracle, Ericsson and Snap Inc. and committed to open governance at the Linux Foundation. [13] |

### Who owns and governs the Redis project?

Redis is owned and steered by the company Redis Ltd., which holds the Redis trademarks, requires a contributor licence agreement for code contributions and describes itself as the code's maintainer. [9] [24] [26]

Redis the company is the registered owner of the Redis name and logo and sets the requirements for using those trademarks. [24] Redis accepts code contributions only under the Redis Software Grant and Contributor License Agreement that Redis Ltd. requires. [26]

When announcing its licence change, Redis Inc. described itself as the maintainer of the Redis code and said it sponsored the bulk of Redis development alongside a community of contributors. [9] Redis Inc. framed that licence change as its own decision, made despite efforts to support a community-led governance model and a desire to keep the BSD license. [9]

Later licensing direction also came from the company: Redis CEO Rowan Trollope announced AGPL as an added licensing option starting with Redis 8, with guidance from Salvatore, CTO Benjamin Renaud and core developers. [8] [25] These descriptions of Redis's governance come from Redis's own announcements and pages rather than independent sources. [8] [9] [25]

By contrast, Valkey is governed by a Technical Steering Committee of its repository maintainers and committed to open governance at the Linux Foundation. [13] [22]

Facts behind this answer:

- fact-42acae95bbe44fec8a60b71e435487f1 [confirmed]: Redis accepts code contributions only under the Redis Software Grant and Contributor License Agreement required by the company Redis Ltd. [26]; as of unknown; one publisher.
  > Only contributions made under the Redis Software Grant
  > and Contributor License Agreement may be accepted by Redis [26], Opening paragraph
  > To specify the intellectual property license granted in any Contribution, Redis Ltd., ("\*\*Redis\*\*")
  > requires a Software Grant and Contributor License Agreement [26], REDIS SOFTWARE GRANT AND CONTRIBUTOR LICENSE AGREEMENT

- fact-fd1bee3f80b84a1fb19be7d7e397e777 [confirmed]: Redis the company is the registered owner of the Redis name and logo and sets requirements for use of those trademarks. [24]; as of unknown; one publisher.
  > As the registered owner of its name and logo, Redis accepts certain limited uses of its trademarks, but it has requirements that must be followed as described in its Trademark Guidelines [24], Redis Trademarks

- fact-442d4bfd9410425ebf7d412aa2f81a8b [confirmed]: Redis Inc. described itself as the maintainers of the Redis code and said it sponsored the bulk of Redis development alongside a community of contributors. [9]; as of 2024-03-20; one publisher.
  > cloud service providers will be able to deliver Redis 7.4 only after agreeing to licensing terms with Redis, the maintainers of the Redis code [9], Announcement body
  > Redis has been sponsoring the bulk of development alongside a dynamic community of developers eager to contribute. [9], Announcement body

- fact-01f6f66abc584117bee0e58956f88194 [confirmed]: Redis Inc. framed its license change as its own, made despite efforts to support a community-led governance model and its desire to maintain the BSD license. [9]; as of 2024-03-20; one publisher.
  > Despite efforts to support a community-led governance model, and our desire to maintain the BSD license, delivering multiple software distributions simultaneously [9], Announcement body
  > Why is Redis Inc. making this change? [9], FAQ 2

- fact-daff8ec4716f4e93a968dd3a05e00b59 [confirmed]: Redis CEO Rowan Trollope announced adding AGPL as a licensing option starting with Redis 8, with guidance from Salvatore, CTO Benjamin Renaud and core developers. [8] [25]; as of 2025-05-01; 2 publishers.
  > With guidance from Salvatore, our CTO, Benjamin Renaud, and our core developers, we have made some key decisions to improve Redis going forward: [8], Blog body
  > Adding the OSI-approved AGPL as an additional licensing option for Redis, starting with Redis 8 (available now); [8], Blog body
  > 2 minute read
  > 
  > Rowan Trollope [8], Byline
  > You can also find the Redis CEO blog post here: https://redis.io/blog/agplv3/ [25], Postscript

### Who governs Valkey, and under which foundation?

Valkey is governed by a Technical Steering Committee of its maintainers, chaired by Madelyn Olson, under open governance at the Linux Foundation. [13] [22] [23]

The Linux Foundation announced on March 28, 2024 its intent to form Valkey as an open source alternative to Redis. [13] At launch, Valkey was backed by AWS, Google Cloud, Oracle, Ericsson and Snap Inc. and committed to open governance at the Linux Foundation. [13] The Linux Foundation's CTO said foundation stewardship means Valkey will be community-driven without surprise licence changes. [13]

A Technical Steering Committee made up of the maintainers of the Valkey repository oversees all technical, project, approval and policy matters. [22] No single organization may hold more than one third of TSC seats, and major decisions, such as changing the governance document or adding TSC members, need a two-thirds supermajority of the entire TSC. [22]

Madelyn Olson chairs the TSC, and its maintainers come from several companies including Amazon, Google, Oracle, Ericsson, Tencent, Apple, Alibaba and Percona. [23] This differs from Redis, where the company Redis Ltd. owns the trademarks and requires its own contributor licence agreement for code contributions. [24] [26]

Facts behind this answer:

- fact-21f02684d85049c3bb19c694ff0b8c0d [confirmed]: The Linux Foundation announced on March 28, 2024 its intent to form Valkey as an open source alternative to Redis. [13]; as of 2024-03-28; one publisher.
  > SAN FRANCISCO – MARCH 28, 2024 – Today, the Linux Foundation announced its intent to form Valkey, an open source alternative to the Redis in-memory, NoSQL data store. [13], Press release, first paragraph

- fact-fcd4643730b448f79e4b547bcf9a2c71 [confirmed]: Valkey is governed by a Technical Steering Committee composed of the maintainers of the Valkey repository, which oversees all technical, project, approval and policy matters. [22]; as of unknown; one publisher.
  > The Valkey project is managed by a Technical Steering Committee (TSC) composed of the maintainers of the Valkey repository. [22], Project Governance
  > The TSC is responsible for oversight of all technical, project, approval, and policy matters for Valkey. [22], Technical Steering Committee

- fact-94ff2fa061c54d8488a3d0c994622fd5 [confirmed]: Valkey governance limits any single organization to no more than one third of Valkey TSC members. [22]; as of unknown; one publisher.
  > At any time, no more than one third (1/3) of the TSC members may be employees, contractors, or representatives of the same organization or affiliated organizations. [22], Technical Steering Committee

- fact-7f1a4cf9b4e346b3ad1cbe9044010937 [confirmed]: Valkey governance major decisions, including changing the governance document or adding TSC members, require a two-thirds supermajority of the entire TSC. [22]; as of unknown; one publisher.
  > Governance major decisions shall require approval by a super-majority vote of at least two thirds (2/3) of the entire TSC. [22], Governance Major Decisions
  > Adding TSC members or involuntary removal of TSC members [22], Governance Major Decisions

- fact-96399fee3876471d86f205af8a4241e8 [confirmed]: Valkey's TSC chair is Madelyn Olson, and its maintainers come from several companies including Amazon, Google, Oracle, Ericsson, Tencent, Apple, Alibaba and Percona. [23]; as of unknown; one publisher.
  > \*\*Madelyn Olson\*\*
  >   Term: March 28, 2024 – Present [23], Committee Chair
  > \| Binbin Zhu          \| @enjoy-binbin \| Tencent     \|
  > \| Harkrishn Patro     \| @hpatro       \| Apple       \|
  > \| Lucas Yang          \| @lucasyonge   \| Percona     \|
  > \| Madelyn Olson       \| @madolson     \| Amazon      \| [23], Current Maintainers
  > \| Jacob Murphy        \| @murphyjacob4 \| Google      \|
  > \| Ping Xie            \| @pingxie      \| Oracle      \|
  > \| Ran Shidlansik      \| @ranshid      \| Amazon      \|
  > \| Zhao Zhao           \| @soloestoy    \| Alibaba     \|
  > \| Viktor Söderqvist   \| @zuiderkwast  \| Ericsson    \| [23], Current Maintainers

- fact-431eb9ead37940d1b2f993e25c3962e5 [confirmed]: At launch, Valkey was backed by AWS, Google Cloud, Oracle, Ericsson and Snap Inc. and committed to open governance at the Linux Foundation. [13]; as of 2024-03-28; one publisher.
  > Industry participants, including Amazon Web Services (AWS), Google Cloud, Oracle, Ericsson, and Snap Inc. are supporting Valkey. [13], Press release body
  > At the Linux Foundation, Valkey will follow an open governance model, remaining community-driven and welcoming of all users and contributors. [13], Press release body

### Why and from which Redis version was Valkey forked?

Valkey was forked from open source Redis 7.2.4 in response to Redis's move away from the BSD licence starting with Redis 7.4. [9] [12] [13]

Redis announced that, starting with Redis 7.4, it would be dual-licensed under RSALv2 and SSPLv1 and no longer distributed under the BSD 3-clause license. [9] Redis Ltd. states that RSALv2 and SSPLv1 are not open source licences, while Redis 7.2.x and earlier remain under the BSD3 licence. [7] [8]

According to the Linux Foundation's March 28, 2024 launch announcement, Valkey was formed in response to that licence change and continued development from Redis 7.2.4 under the BSD 3-clause license. [13] The Valkey README likewise states that Valkey was forked from open source Redis right before Redis moved to source-available licenses. [12] Valkey co-creator Madelyn Olson, a Redis core team member until Redis 7.2, said Valkey lets contributors continue where they left off in open source. [13]

Redis's own later account agrees on the cause: Redis CEO Rowan Trollope wrote that the March 2024 move to SSPL led AWS and Google to maintain their own fork but hurt Redis's community relationship. [8] [25] In the same announcement, Redis added AGPL as a licensing option starting with Redis 8. [8] [25] These accounts come from the parties involved, the Linux Foundation and Valkey on one side and Redis's CEO on the other, rather than from independent sources. [8] [12] [13] [25]

Facts behind this answer:

- fact-6aa804ace6a440bc84e698e0f7faba47 [confirmed]: Valkey was formed in response to the Redis license change and continued development from Redis 7.2.4 under the BSD 3-clause license. [13]; as of 2024-03-28; one publisher.
  > Project contributors quickly gathered maintainer, community, and corporate support to regroup in response to the recent license change announced by Redis Inc. Valkey will continue development on Redis 7.2.4 and will keep the project available for use and distribution under the open source Berkeley Software Distribution (BSD) 3-clause license. [13], Press release, first paragraph

- fact-eaed99852c574cb9b2eaf1e0692e61d2 [confirmed]: The Valkey README states Valkey was forked from open source Redis right before Redis moved to source-available licenses. [12]; as of unknown; one publisher.
  > This project was forked from the open source Redis project right before the transition to their new source available licenses. [12], README introduction

- fact-ad5ec30a11dc468ab61555f26b97f16d [confirmed]: Redis announced that starting with Redis 7.4 it would be dual-licensed under RSALv2 and SSPLv1 and no longer distributed under the BSD 3-clause license. [9]; as of 2024-03-20; one publisher.
  > Starting with Redis 7.4, Redis will be dual-licensed under the Redis Source Available License (RSALv2) and Server Side Public License (SSPLv1). Consequently, Redis will no longer be distributed under the three-clause Berkeley Software Distribution (BSD). [9], Announcement lead

- fact-00064e7a1d604df6a42052aa28b50e90 [confirmed]: Redis CEO Rowan Trollope wrote that the March 2024 move to SSPL led AWS and Google to maintain their own fork but hurt Redis's community relationship. [8] [25]; as of 2025-05-01; 2 publishers.
  > You can also find the Redis CEO blog post here: https://redis.io/blog/agplv3/ [25], Postscript
  > Rowan Trollope
  > 
  > Summarize with AI [8], Byline
  > in March 2024, we decided to move Redis to the SSPL license. This achieved our goal—AWS and Google now maintain their own fork—but the change hurt our relationship with the Redis community. [8], Blog body

- fact-4b2f1b814cec488aa7e43ddbc1ccd625 [confirmed]: Valkey co-creator Madelyn Olson, a former Redis core team member until Redis 7.2, said Valkey lets contributors continue where they left off in open source. [13]; as of 2024-03-28; one publisher.
  > I worked on open source Redis for six years, including four years as one of the core team members that drove Redis open source until 7.2. [13], Madelyn Olson quote
  > By forming Valkey, contributors can pick up where we left off and continue to contribute to a vibrant open source community,” said Madelyn Olson, former Redis maintainer, co-creator of Valkey [13], Madelyn Olson quote


## Architecture

| Redis | Valkey |
| --- | --- |
| Redis uses a mostly single-threaded design in which one thread serves all client requests via multiplexing, with background threads since Redis 2.4 mainly for slow disk I/O. [14] | Valkey keeps command execution single-threaded; its Valkey 8 I/O threads are worker threads taking jobs from the main thread such as reading, parsing, writing, polling and memory deallocation. [19] |
| Redis runs certain operations such as UNLINK and slow I/O on side threads, and can optionally move client socket reads, writes and protocol parsing to I/O threads via io-threads. [15] | In the I/O threading design described on the Valkey blog, the main thread orchestrates I/O thread jobs, adjusts the number of active I/O threads to current load, and keeps client-to-thread affinity for memory locality. [19] |
| Redis disables I/O threading by default and recommends enabling it only on machines with at least 4 cores, leaving a spare core, e.g. 3 I/O threads on four cores. [15] | In Valkey's blog-described I/O threading design, epoll\_wait, which consumed more than 20 percent of the time when run solely by the main thread, is offloaded to I/O threads, one thread at a time. [19] |
| Redis 8.0 introduced a new I/O threading implementation that always uses threads for both reads and writes, making io-threads-do-reads no longer effective. [16] | In the I/O threading design described on the Valkey blog, the main thread runs a new prefetch-commands-keys procedure before executing commands to reduce external memory accesses on the main dictionary. [19] |
| Redis's asynchronous I/O threads design keeps all command execution on the main thread while each I/O thread runs its own event loop handling client reads and writes. [17] | Valkey's configuration disables I/O threading by default and suggests enabling it only with at least 3 cores; enabled I/O threads handle reads and writes, and io-threads-do-reads is deprecated with no effect. [18] |
| Redis introduced I/O threads in 6.0, and in that implementation the main thread was blocked during I/O thread reads and writes, waiting for all I/O threads to complete their current tasks. [17] | Valkey's configuration describes the server as mostly single-threaded, with certain operations such as UNLINK and slow I/O accesses performed on side threads. [18] |

### How does Redis use threads to process commands and network I/O?

Redis runs all command execution on a single main thread, uses side threads for slow I/O and operations such as UNLINK, and can optionally move client socket reads, writes and parsing to I/O threads, which are disabled by default. [14] [15] [17]

Redis describes its design as mostly single-threaded: one thread serves all client requests through multiplexing, and since Redis 2.4 background threads have handled mainly slow disk I/O. [14] Certain operations such as UNLINK and slow I/O also run on side threads. [15]

Redis introduced I/O threads in 6.0, and in that implementation the main thread was blocked while I/O threads read and wrote, waiting for all of them to complete their current tasks. [17] Redis 8.0 introduced a new I/O threading implementation that always uses threads for both reads and writes, so the io-threads-do-reads setting is no longer effective. [16] In Redis's asynchronous I/O threads design, all command execution stays on the main thread, while each I/O thread runs its own event loop handling client reads and writes. [17]

I/O threading is off by default (io-threads 1), and Redis recommends enabling it only on machines with at least 4 cores while leaving a spare core, for example 3 I/O threads on four cores. [15] [28] Throughput figures for the Redis 8 threading come from Redis Ltd.'s own measurements and are covered in the Performance section. [28]

Facts behind this answer:

- fact-0190463fcf3449de8cd4789461d98415 [confirmed]: Redis uses a mostly single-threaded design in which one thread serves all client requests via multiplexing, with background threads since Redis 2.4 mainly for slow disk I/O. [14]; as of unknown; one publisher.
  > Redis uses a mostly single threaded design. This means that a single process
  > serves all the client requests, using a technique called multiplexing. [14], Single threaded nature of Redis
  > I said that Redis is mostly single threaded since actually from Redis 2.4
  > we use threads in Redis in order to perform some slow I/O operations in the
  > background, mainly related to disk I/O, but this does not change the fact
  > that Redis serves all the requests using a single thread. [14], Single threaded nature of Redis

- fact-7499f85b752f43a78a3c359069d03da0 [confirmed]: Redis runs certain operations such as UNLINK and slow I/O on side threads, and can optionally move client socket reads, writes and protocol parsing to I/O threads via io-threads. [15]; as of unknown; one publisher.
  > Redis is mostly single threaded, however there are certain threaded
  > \# operations such as UNLINK, slow I/O accesses and other things that are
  > \# performed on side threads. [15], THREADED I/O
  > When I/O threads are enabled, we not only use threads for writes, that
  > \# is to thread the write(2) syscall and transfer the client buffers to the
  > \# socket, but also use threads for reads and protocol parsing. [15], THREADED I/O

- fact-62b0e318990248569ab743541579e41f [confirmed]: Redis disables I/O threading by default and recommends enabling it only on machines with at least 4 cores, leaving a spare core, e.g. 3 I/O threads on four cores. [15]; as of unknown; one publisher.
  > By default threading is disabled, we suggest enabling it only in machines
  > \# that have at least 4 or more cores, leaving at least one spare core. [15], THREADED I/O
  > So for instance if you have a four cores boxes, try to use 3 I/O
  > \# threads, if you have a 8 cores, try to use 7 threads. [15], THREADED I/O

- fact-5b2773f408d64678b6d4ae9fc33f63d0 [confirmed]: Redis 8.0 introduced a new I/O threading implementation that always uses threads for both reads and writes, making io-threads-do-reads no longer effective. [16]; as of unknown; one publisher.
  > 8.0-M03 introduces an improved replication mechanism which is more performant and robust, a new I/O threading implementation which enables throughput increase on multi-core environments [16], Redis Community Edition 8.0-M03 Headlines
  > \`io-threads-do-reads\` is no longer effective. The new I/O threading implementation always use threads for both reads and writes [16], 8.0-M03 Configuration parameters

- fact-c5d64ae87bdf4e62bdb11f434f248916 [confirmed]: Redis's asynchronous I/O threads design keeps all command execution on the main thread while each I/O thread runs its own event loop handling client reads and writes. [17]; as of unknown; one publisher.
  > As before, we did not change the fact that all client commands must be executed on the main thread, because Redis was originally designed to be single-threaded, and processing commands in a multi-threaded manner would inevitably introduce numerous race and synchronization issues. But now each IO thread has independent event loop, therefore, IO threads can use a multiplexing approach to handle client read and write operations, eliminating the CPU overhead caused by busy-waiting. [17], Implementation \> Overall
  > the main thread assigns clients to IO threads after accepting connections, IO threads will notify the main thread when clients finish reading and parsing queries, then the main thread processes queries from IO threads and generates replies [17], Implementation \> Overall

- fact-00c1e88c52fe45e6b4f08088afdfe758 [confirmed]: Redis introduced I/O threads in 6.0, and in that implementation the main thread was blocked during I/O thread reads and writes, waiting for all I/O threads to complete their current tasks. [17]; as of unknown; one publisher.
  > Redis introduced IO Thread in 6.0, allowing IO threads to handle client request reading, command parsing and reply writing, thereby improving performance. [17], Introduction
  > The main thread is blocked during IO thread read/write operations and must wait for all IO threads to complete their current tasks before it can continue execution. In other words, the entire process is synchronous. [17], Introduction

### How does Valkey use threads to process commands and network I/O?

Valkey keeps command execution single-threaded, runs some operations on side threads, and can optionally hand reading, parsing, writing, polling and memory deallocation to I/O threads, which are disabled by default. [18] [19]

Valkey's configuration describes the server as mostly single-threaded, with certain operations such as UNLINK and slow I/O accesses performed on side threads. [18] Command execution stays single-threaded, and the Valkey 8 I/O threads are worker threads that take jobs from the main thread such as reading, parsing, writing, polling and memory deallocation. [19]

The design described on the Valkey blog has the main thread orchestrate I/O thread jobs, adjust the number of active I/O threads to current load, and keep client-to-thread affinity for memory locality. [19] In that design, epoll\_wait, which consumed more than 20 percent of the time when run solely by the main thread, is offloaded to I/O threads one thread at a time. [19] Before executing commands, the main thread also runs a prefetch-commands-keys procedure to reduce external memory accesses on the main dictionary. [19] These details are the Valkey project's own description of its Valkey 8 I/O threading, not an independent account. [19]

The Valkey project reports that Valkey 8.1 offloads TLS negotiation and other TLS-handling calls to I/O threads, and says Valkey 9.1.0 has a new IO threading model that adds up to 17% throughput. [35] [37]

Valkey's current configuration disables I/O threading by default and suggests enabling it only with at least 3 cores; when enabled, I/O threads handle reads and writes, and io-threads-do-reads is deprecated with no effect. [18] Both projects keep command execution on the main thread and disable I/O threading by default, with Redis recommending at least 4 cores and Valkey suggesting at least 3, and both have made io-threads-do-reads ineffective. [15] [16] [17] [18] [19]

Gap (gap-a6af562d19904d61a97677aca279b675, checker assessment): The detailed Valkey threading design (job dispatch, dynamic thread count, epoll offload, key prefetch) comes only from the August 2024 Valkey 8 blog; whether Valkey 8.1 or 9.x changed this design as of late 2026 is not established. The current valkey.conf confirms only defaults, read/write threading and io-threads-do-reads deprecation. [19] [18]

Facts behind this answer:

- fact-171eec76e36f49698e597f18b036fe7e [confirmed]: Valkey keeps command execution single-threaded; its Valkey 8 I/O threads are worker threads taking jobs from the main thread such as reading, parsing, writing, polling and memory deallocation. [19]; as of unknown; one publisher.
  > It utilizes a minimal number of synchronization mechanisms and keeps Valkey command execution single-threaded, simple, and primed for future enhancements. [19], Performance Without Compromising Simplicity
  > The above diagram depicts the high-level design of I/O threading in Valkey 8.
  > I/O threads are worker threads that receive jobs to execute from the main thread.
  > A job can involve reading and parsing a command from a client, writing responses back to the client, polling for I/O events on TCP connections, or deallocating memory. [19], High Level Design

- fact-d5a5b236b6a24c18b08ae7f593e57e57 [confirmed]: In the I/O threading design described on the Valkey blog, the main thread orchestrates I/O thread jobs, adjusts the number of active I/O threads to current load, and keeps client-to-thread affinity for memory locality. [19]; as of unknown; one publisher.
  > The main thread orchestrates all the jobs spawned to the I/O threads, ensuring that no race conditions occur.
  > The number of active I/O threads can be adjusted by the main thread based on the current load to ensure efficient utilization of the underlying hardware.
  > Despite the dynamic nature of I/O threads, the main thread maintains thread affinity, ensuring that, when possible the same I/O thread will handle I/O for the same client to improve memory access locality. [19], High Level Design

- fact-92f7f5d487064ef294ba138b2a422c78 [confirmed]: In Valkey's blog-described I/O threading design, epoll\_wait, which consumed more than 20 percent of the time when run solely by the main thread, is offloaded to I/O threads, one thread at a time. [19]; as of unknown; one publisher.
  > When executed solely by the main thread, epoll\_wait consumes more than 20 percent of the time.
  > Therefore, we decided to offload epoll\_wait execution to the I/O threads in the following way: to avoid race conditions, at any given time, at most one thread, either an io\_thread or the main thread, executes epoll\_wait. [19], High Level Design

- fact-6335fc2754354257b9cf911c8f042a1f [confirmed]: In the I/O threading design described on the Valkey blog, the main thread runs a new prefetch-commands-keys procedure before executing commands to reduce external memory accesses on the main dictionary. [19]; as of unknown; one publisher.
  > In addition, before executing commands, the main thread performs a new procedure, prefetch-commands-keys, which aims to reduce the number of external memory accesses needed when executing the commands on the main dictionary. [19], High Level Design

- fact-b67f664a4666405a8f66248774b016ce [confirmed]: Valkey's configuration disables I/O threading by default and suggests enabling it only with at least 3 cores; enabled I/O threads handle reads and writes, and io-threads-do-reads is deprecated with no effect. [18]; as of unknown; one publisher.
  > By default threading is disabled, we suggest enabling it only in machines
  > \# that have at least 3 or more cores, leaving at least one spare core. [18], THREADED I/O
  > When I/O threads are enabled, we use threads for reads and writes, that is
  > \# to thread the write and read syscall and transfer the client buffers to the
  > \# socket and to enable threading of reads and protocol parsing. [18], THREADED I/O
  > The 'io-threads-do-reads' config is deprecated and has no effect. Please
  > \# avoid using this config if possible. [18], THREADED I/O

- fact-470cb228bc97486dba1543b65abeca05 [confirmed]: Valkey's configuration describes the server as mostly single-threaded, with certain operations such as UNLINK and slow I/O accesses performed on side threads. [18]; as of unknown; one publisher.
  > The server is mostly single threaded, however there are certain threaded
  > \# operations such as UNLINK, slow I/O accesses and other things that are
  > \# performed on side threads. [18], THREADED I/O


## Persistence

| Redis | Valkey |
| --- | --- |
| Redis documents these persistence options: RDB point-in-time snapshots, AOF logging of every write, no persistence, and combined RDB plus AOF in the same instance. [5] | Valkey documents these persistence options: RDB point-in-time snapshots, AOF logging of every write, no persistence, and combined RDB plus AOF in the same instance. [6] |
| Redis saves RDB snapshots to dump.rdb by default and can be configured, for example with save 60 1000, to snapshot every 60 seconds if at least 1000 keys changed. [5] | Valkey saves RDB snapshots to dump.rdb by default, configurable for example as save 60 1000 to snapshot every 60 seconds if at least 1000 keys changed. [6] |
| Redis AOF offers fsync policies (always, everysec, no); with everysec, Redis may lose 1 second of data in a disaster. [5] | Valkey enables RDB snapshotting by default and documents disabling persistence, for example for cache-only use, by setting the save parameter to an empty string. [6] |
| Since Redis 7.0.0, Redis uses a multi-part AOF split into at most one base file and incremental files, tracked by a manifest in a separate directory. [5] | Valkey AOF offers fsync policies (always, everysec, no); with everysec, Valkey may lose 1 second of data in a disaster. [6] |
| Redis documents a BACKUP command family, since Redis 8.10.0, that produces a restorable backup without stopping writes, reusing the multi-part AOF format. [5] | Valkey uses a multi-part AOF split into at most one base file and incremental files, tracked by a manifest file in a separate directory. [6] |
| When both AOF and RDB persistence are enabled, Redis rebuilds the dataset from the AOF on restart because it is the most complete. [5] | When both AOF and RDB persistence are enabled, Valkey rebuilds the dataset from the AOF on restart because it is the most complete. [6] |

### Which persistence options does Redis document?

Redis documents these persistence options: RDB point-in-time snapshots, AOF logging of every write, no persistence, and RDB plus AOF combined in the same instance. [5]

According to its own documentation, Redis offers RDB point-in-time snapshots, AOF logging of every write, no persistence, or both RDB and AOF together in one instance. [5] RDB snapshots are saved to dump.rdb by default, and a setting such as save 60 1000 snapshots every 60 seconds if at least 1000 keys changed. [5]

AOF offers the fsync policies always, everysec and no, and the documentation says that with everysec Redis may lose 1 second of data in a disaster. [5] Since Redis 7.0.0, the AOF is multi-part: at most one base file plus incremental files, tracked by a manifest in a separate directory. [5] When both AOF and RDB are enabled, Redis rebuilds the dataset from the AOF on restart because it is the most complete. [5]

Redis also documents a BACKUP command family, available since Redis 8.10.0, that produces a restorable backup without stopping writes by reusing the multi-part AOF format. [5] The Valkey persistence facts in this report record no equivalent BACKUP command family. [5] [6]

Facts behind this answer:

- fact-681662cc593047c8bffa6f425fd9a183 [confirmed]: Redis documents these persistence options: RDB point-in-time snapshots, AOF logging of every write, no persistence, and combined RDB plus AOF in the same instance. [5]; as of unknown; one publisher.
  > Redis provides a range of persistence options. These include:
  > 
  > \* \*\*RDB\*\* (Redis Database): RDB persistence performs point-in-time snapshots of your dataset at specified intervals.
  > \* \*\*AOF\*\* (Append Only File): AOF persistence logs every write operation received by the server. These operations can then be replayed again at server startup, reconstructing the original dataset. Commands are logged using the same format as the Redis protocol itself.
  > \* \*\*No persistence\*\*: You can disable persistence completely. This is sometimes used when caching.
  > \* \*\*RDB + AOF\*\*: You can also combine both AOF and RDB in the same instance. [5], Introduction

- fact-b8b04b50f5954eeab48045ee28f85c04 [confirmed]: Redis saves RDB snapshots to dump.rdb by default and can be configured, for example with save 60 1000, to snapshot every 60 seconds if at least 1000 keys changed. [5]; as of unknown; one publisher.
  > By default Redis saves snapshots of the dataset on disk, in a binary
  > file called \`dump.rdb\`. You can configure Redis to have it save the
  > dataset every N seconds if there are at least M changes in the dataset,
  > or you can manually call the \[\`SAVE\`\](/content/commands/save.md) or \[\`BGSAVE\`\](/content/commands/bgsave.md) commands.
  > 
  > For example, this configuration will make Redis automatically dump the
  > dataset to disk every 60 seconds if at least 1000 keys changed:
  > 
  >     save 60 1000 [5], Snapshotting

- fact-b1cc8070c44b46299afcae9bb8238657 [confirmed]: Redis AOF offers fsync policies (always, everysec, no); with everysec, Redis may lose 1 second of data in a disaster. [5]; as of unknown; one publisher.
  > \* \`appendfsync always\`: \`fsync\` every time new commands are appended to the AOF. Very very slow, very safe. Note that the commands are appended to the AOF after a batch of commands from multiple clients or a pipeline are executed, so it means a single write and a single fsync (before sending the replies).
  > \* \`appendfsync everysec\`: \`fsync\` every second. Fast enough (since version 2.4 likely to be as fast as snapshotting), and you may lose 1 second of data if there is a disaster.
  > \* \`appendfsync no\`: Never \`fsync\`, just put your data in the hands of the Operating System. The faster and less safe method. Normally Linux will flush data every 30 seconds with this configuration, but it's up to the kernel's exact tuning. [5], Append-only file \> How durable is the append only file?

- fact-c2c70a53649f48ae8de90a6ea72c770a [confirmed]: Since Redis 7.0.0, Redis uses a multi-part AOF split into at most one base file and incremental files, tracked by a manifest in a separate directory. [5]; as of unknown; one publisher.
  > Since Redis 7.0.0, Redis uses a multi part AOF mechanism.
  > That is, the original single AOF file is split into base file (at most one) and incremental files (there may be more than one).
  > The base file represents an initial (RDB or AOF format) snapshot of the data present when the AOF is \[rewritten\](\#log-rewriting).
  > The incremental files contains incremental changes since the last base AOF file was created. All these files are put in a separate directory and are tracked by a manifest file. [5], Append-only file

- fact-f523cd88062e416bab945bd43118c33e [confirmed]: Redis documents a BACKUP command family, since Redis 8.10.0, that produces a restorable backup without stopping writes, reusing the multi-part AOF format. [5]; as of 2026-10-16; one publisher.
  > Since Redis 8.10.0, the \[\`BACKUP\`\](/content/commands/backup.md) command family produces a self-contained, restorable backup without stopping writes or manually managing AOF rewrites. A backup reuses the \[multi-part AOF\](\#append-only-file) format, so it is an MP-AOF–compatible artifact set consisting of three files: [5], Backing up Redis data \> Online backups with the BACKUP command family

- fact-c3a63e9131ea4120928472a9cdec0414 [confirmed]: When both AOF and RDB persistence are enabled, Redis rebuilds the dataset from the AOF on restart because it is the most complete. [5]; as of unknown; one publisher.
  > In the case both AOF and RDB persistence are enabled and Redis restarts the
  > AOF file will be used to reconstruct the original dataset since it is
  > guaranteed to be the most complete. [5], Interactions between AOF and RDB persistence

### Which persistence options does Valkey document?

Valkey documents the same persistence options as Redis: RDB snapshots, AOF logging, no persistence, and RDB plus AOF combined. [5] [6]

Valkey's own documentation lists RDB point-in-time snapshots, AOF logging of every write, no persistence, and combined RDB plus AOF in the same instance, matching the options Redis documents. [5] [6] RDB snapshotting is enabled by default, snapshots go to dump.rdb, and a setting such as save 60 1000 snapshots every 60 seconds if at least 1000 keys changed. [6] For uses such as a pure cache, Valkey documents disabling persistence by setting the save parameter to an empty string. [6]

Valkey's AOF offers the same fsync policies as Redis (always, everysec and no), and with everysec Valkey may lose 1 second of data in a disaster. [5] [6] Valkey also uses a multi-part AOF of at most one base file plus incremental files tracked by a manifest file in a separate directory, and rebuilds from the AOF on restart when both AOF and RDB are enabled. [6]

The documented options look alike, but Valkey cannot use data files produced by Redis Community Edition 7.4 and later, including RDB files. [31] Redis Community Edition 7.4 release notes record RDB file format changes for per-field hash expiration. [21]

Facts behind this answer:

- fact-75bb93c9dbae413099707c6c0e92e1cd [confirmed]: Valkey documents these persistence options: RDB point-in-time snapshots, AOF logging of every write, no persistence, and combined RDB plus AOF in the same instance. [6]; as of unknown; one publisher.
  > Valkey provides a range of persistence options. These include:
  > 
  > \* \*\*RDB\*\* (Valkey Database): RDB persistence performs point-in-time snapshots of your dataset at specified intervals.
  > \* \*\*AOF\*\* (Append Only File): AOF persistence logs every write operation received by the server. These operations can then be replayed again at server startup, reconstructing the original dataset. Commands are logged using the same format as the Valkey protocol itself.
  > \* \*\*No persistence\*\*: You can disable persistence completely. This is sometimes used when caching.
  > \* \*\*RDB + AOF\*\*: You can also combine both AOF and RDB in the same instance. [6], Introduction

- fact-be2e57e0bd9744ae805771b75fa24ce8 [confirmed]: Valkey saves RDB snapshots to dump.rdb by default, configurable for example as save 60 1000 to snapshot every 60 seconds if at least 1000 keys changed. [6]; as of unknown; one publisher.
  > By default Valkey saves snapshots of the dataset on disk, in a binary
  > file called \`dump.rdb\`. You can configure Valkey to have it save the
  > dataset every N seconds if there are at least M changes in the dataset,
  > or you can manually call the \`SAVE\` or \`BGSAVE\` commands.
  > 
  > For example, this configuration will make Valkey automatically dump the
  > dataset to disk every 60 seconds if at least 1000 keys changed:
  > 
  >     save 60 1000 [6], Snapshotting

- fact-775fed1275a24a9b82d1d8a24b5c37c9 [confirmed]: Valkey enables RDB snapshotting by default and documents disabling persistence, for example for cache-only use, by setting the save parameter to an empty string. [6]; as of unknown; one publisher.
  > If you prefer \*\*not\*\* to have persistence (for example when using a Valkey instance solely as a cache) that is also a possibility.
  > 
  > RDB snapshotting is enabled by default. To disable it, set the \`save\` configuration parameter to the empty string \`""\` and remove any excess \`save\` lines that are present in the current configuration file.
  > 
  >     save ""
  > 
  > Alternatively, you can also use the \`--save ""\` argument on the \`valkey-server\` binary. [6], No persistence

- fact-82b26ad6a0cc4367985d1dee09a83847 [confirmed]: Valkey AOF offers fsync policies (always, everysec, no); with everysec, Valkey may lose 1 second of data in a disaster. [6]; as of unknown; one publisher.
  > \* \`appendfsync always\`: \`fsync\` every time new commands are appended to the AOF. Very very slow, very safe. Note that the commands are appended to the AOF after a batch of commands from multiple clients or a pipeline are executed, so it means a single write and a single fsync (before sending the replies).
  > \* \`appendfsync everysec\`: \`fsync\` every second. Fast enough and you may lose 1 second of data if there is a disaster.
  > \* \`appendfsync no\`: Never \`fsync\`, just put your data in the hands of the Operating System. The faster and less safe method. Normally Linux will flush data every 30 seconds with this configuration, but it's up to the kernel's exact tuning. [6], Append-only file \> How durable is the append only file?

- fact-63913fa91dc547f686d27ae5ab581e3b [confirmed]: Valkey uses a multi-part AOF split into at most one base file and incremental files, tracked by a manifest file in a separate directory. [6]; as of unknown; one publisher.
  > Valkey uses a multi part AOF mechanism.
  > That is, the original single AOF file is split into base file (at most one) and incremental files (there may be more than one).
  > The base file represents an initial (RDB or AOF format) snapshot of the data present when the AOF is \[rewritten\](\#log-rewriting).
  > The incremental files contains incremental changes since the last base AOF file was created. All these files are put in a separate directory and are tracked by a manifest file. [6], Append-only file

- fact-18590fec57cd40a7a16c18136f9c1c6e [confirmed]: When both AOF and RDB persistence are enabled, Valkey rebuilds the dataset from the AOF on restart because it is the most complete. [6]; as of unknown; one publisher.
  > In the case both AOF and RDB persistence are enabled and Valkey restarts the
  > AOF file will be used to reconstruct the original dataset since it is
  > guaranteed to be the most complete. [6], Interactions between AOF and RDB persistence


## Clustering and replication

| Redis | Valkey |
| --- | --- |
| Redis Cluster shards keys across 16384 hash slots, computing each key's slot as the CRC16 of the key modulo 16384, with every node responsible for a subset of slots. [2] | Valkey Cluster splits its key space into 16384 hash slots, assigning slots by CRC16(key) mod 16384, with each primary handling a subset. [4] |
| Redis Cluster targets linear scalability up to 1000 nodes without proxies, using asynchronous replication. [1] | Valkey Cluster's stated design goal is linear scalability up to 2000 nodes, with no proxies and asynchronous replication. [4] |
| Redis 8.4.0 added the CLUSTER MIGRATION command, providing atomic slot migration for Redis Cluster. [3] | Valkey Cluster uses asynchronous replication with a last-failover-wins merge, so writes can be lost during partitions. [4] |
| Redis Cluster replicates asynchronously with a last-failover-wins merge, so writes can be lost during partitions, and nodes do not wait for write acknowledgments unless explicitly requested with WAIT. [1] | Valkey cluster supports multiple databases from version 9.0 via the cluster-databases setting, which defaults to 1. [4] |
| In Redis Cluster, FAIL means a majority of masters confirmed a node is failing, and the majority side recovers after NODE\_TIMEOUT plus a few seconds, with failovers usually taking 1 or 2 seconds. [1] | In Valkey Cluster, a replica wins the election once it receives ACKs from the majority of primaries, and the majority side recovers after NODE\_TIMEOUT plus a few seconds, with failovers usually taking 1 or 2 seconds. [4] |
| In Redis Cluster, a replica wins the election once it receives ACKs from the majority of masters, then obtains a new configEpoch higher than that of any other existing master. [1] | Valkey 9.0 introduced atomic slot migration, started with CLUSTER MIGRATESLOTS, as the recommended live-resharding method, described as faster and more reliable than legacy slot migration. [4] |

### How does Redis Cluster shard data and handle replication and failover?

Redis Cluster shards keys across 16384 hash slots, replicates asynchronously, and fails over by electing a replica with ACKs from a majority of masters. [1] [2]

Redis Cluster computes each key's slot as the CRC16 of the key modulo 16384, and every node is responsible for a subset of those slots. [2] Its stated target is linear scalability up to 1000 nodes without proxies, which is lower than the 2000-node design goal Valkey states for its cluster. [1] [4] Redis 8.4.0 added the CLUSTER MIGRATION command, which provides atomic slot migration; Valkey added a comparable atomic slot migration in 9.0 under a different command name, CLUSTER MIGRATESLOTS. [3] [4]

Replication in Redis Cluster is asynchronous with a last-failover-wins merge, so writes can be lost during partitions, and nodes do not wait for write acknowledgments unless a client explicitly requests them with WAIT. [1]

A node is marked FAIL when a majority of masters confirm it is failing, and the majority side of a partition recovers after NODE\_TIMEOUT plus a few seconds, with failovers usually taking 1 or 2 seconds. [1] A replica wins the failover election once it receives ACKs from a majority of masters, then obtains a new configEpoch higher than that of any other existing master. [1] Valkey documents the same majority-ACK election and the same recovery timing, which matches the shared design of the two cluster implementations described in these facts. [1] [4]

Facts behind this answer:

- fact-ab5bbfd6b5034f29b2c63ffe2293915c [confirmed]: Redis Cluster shards keys across 16384 hash slots, computing each key's slot as the CRC16 of the key modulo 16384, with every node responsible for a subset of slots. [2]; as of unknown; one publisher.
  > There are 16384 hash slots in Redis Cluster, and to compute the hash
  > slot for a given key, we simply take the CRC16 of the key modulo
  > 16384. [2], Redis Cluster data sharding
  > Every node in a Redis Cluster is responsible for a subset of the hash slots [2], Redis Cluster data sharding

- fact-c85752d4b75f4af68d6163b096580fd7 [confirmed]: Redis Cluster targets linear scalability up to 1000 nodes without proxies, using asynchronous replication. [1]; as of unknown; one publisher.
  > High performance and linear scalability up to 1000 nodes. There are no proxies, asynchronous replication is used, and no merge operations are performed on values. [1], Redis Cluster goals

- fact-85d7d6fb6b684ccaa1f622a516f91458 [confirmed]: Redis 8.4.0 added the CLUSTER MIGRATION command, providing atomic slot migration for Redis Cluster. [3]; as of unknown; one publisher.
  > since: 8.4.0
  > summary: Start, monitor, and cancel atomic slot migration tasks. [3], Command metadata
  > The \`CLUSTER MIGRATION\` command provides atomic slot migration functionality for Redis Cluster. [3], Introduction

- fact-450f1619ccc14fbe84d9d8a63aea926d [confirmed]: Redis Cluster replicates asynchronously with a last-failover-wins merge, so writes can be lost during partitions, and nodes do not wait for write acknowledgments unless explicitly requested with WAIT. [1]; as of unknown; one publisher.
  > Redis Cluster uses asynchronous replication between nodes, and \*\*last failover wins\*\* implicit merge function. This means that the last elected master dataset eventually replaces all the other replicas. There is always a window of time when it is possible to lose writes during partitions. [1], Write safety
  > Because of the use of asynchronous replication, nodes do not wait for other nodes' acknowledgment of writes (if not explicitly requested using the \[\`WAIT\`\](/content/commands/wait.md) command). [1], Write safety

- fact-97bfee561c584d668931df7be30f97b9 [confirmed]: In Redis Cluster, FAIL means a majority of masters confirmed a node is failing, and the majority side recovers after NODE\_TIMEOUT plus a few seconds, with failovers usually taking 1 or 2 seconds. [1]; as of unknown; one publisher.
  > \`FAIL\` means that a node is failing and that this condition was confirmed by a majority of masters within a fixed amount of time. [1], Failure detection
  > the cluster becomes available again after \`NODE\_TIMEOUT\` time plus a few more seconds required for a replica to get elected and failover its master (failovers are usually executed in a matter of 1 or 2 seconds). [1], Availability

- fact-ec8ceb7b92344833897675dab66ac1b3 [confirmed]: In Redis Cluster, a replica wins the election once it receives ACKs from the majority of masters, then obtains a new configEpoch higher than that of any other existing master. [1]; as of unknown; one publisher.
  > Once the replica receives ACKs from the majority of masters, it wins the election. [1], Replica election and promotion
  > Once a replica wins the election, it obtains a new unique and incremental \`configEpoch\` which is higher than that of any other existing master. [1], Replica election and promotion

### How does Valkey cluster mode shard data and handle replication and failover?

Valkey cluster mode shards keys across 16384 hash slots, replicates asynchronously, and fails over by electing a replica with ACKs from a majority of primaries. [4]

Valkey Cluster assigns each key to one of 16384 hash slots by CRC16(key) mod 16384, with each primary handling a subset, the same slot scheme Redis Cluster uses. [2] [4] Its stated design goal is linear scalability up to 2000 nodes with no proxies, against the 1000-node target stated for Redis Cluster; these are the projects' own stated goals rather than measured results. [1] [4] The Valkey project also claims that Valkey 9.0 scales clusters to 2,000 nodes. [36]

Replication is asynchronous with a last-failover-wins merge, so writes can be lost during partitions, the same limitation documented for Redis Cluster. [1] [4] A replica wins the failover election once it receives ACKs from the majority of primaries, and the majority side recovers after NODE\_TIMEOUT plus a few seconds, with failovers usually taking 1 or 2 seconds. [4]

Valkey 9.0 introduced atomic slot migration, started with CLUSTER MIGRATESLOTS, as the recommended live-resharding method, which the project describes as faster and more reliable than legacy slot migration. [4] From version 9.0, Valkey cluster mode also supports multiple databases through the cluster-databases setting, which defaults to 1. [4]

Facts behind this answer:

- fact-9e85a0464aa34c6682bf92ba0f750b25 [confirmed]: Valkey Cluster splits its key space into 16384 hash slots, assigning slots by CRC16(key) mod 16384, with each primary handling a subset. [4]; as of unknown; one publisher.
  > The cluster's key space is split into 16384 slots, effectively setting an upper limit
  > for the cluster size of 16384 primary nodes [4], Key distribution model
  > Each primary node in a cluster handles a subset of the 16384 hash slots. [4], Key distribution model
  > HASH\_SLOT = CRC16(key) mod 16384 [4], Key distribution model

- fact-28a8c4b5b78c4c4e86e474ab99faf565 [confirmed]: Valkey Cluster's stated design goal is linear scalability up to 2000 nodes, with no proxies and asynchronous replication. [4]; as of unknown; one publisher.
  > High performance and linear scalability up to 2000 nodes. There are no proxies, asynchronous replication is used, and no merge operations are performed on values. [4], Valkey Cluster goals

- fact-2a7bd04fb7344465841480196ce03a03 [confirmed]: Valkey Cluster uses asynchronous replication with a last-failover-wins merge, so writes can be lost during partitions. [4]; as of unknown; one publisher.
  > Valkey Cluster uses asynchronous replication between nodes, and \*\*last failover wins\*\* implicit merge function. This means that the last elected primary dataset eventually replaces all the other replicas. There is always a window of time when it is possible to lose writes during partitions. [4], Write safety

- fact-691aa58c0eb64964836bcc26e8da2a36 [confirmed]: Valkey cluster supports multiple databases from version 9.0 via the cluster-databases setting, which defaults to 1. [4]; as of unknown; one publisher.
  > Starting with version 9.0, Valkey cluster supports multiple databases, similar to standalone mode but with some additional restrictions.
  > You can enable multi-database support using the \`cluster-databases\` setting (default value is \`1\`). [4], Overview

- fact-88a77781b0ba4487ad970a7c5333e818 [confirmed]: In Valkey Cluster, a replica wins the election once it receives ACKs from the majority of primaries, and the majority side recovers after NODE\_TIMEOUT plus a few seconds, with failovers usually taking 1 or 2 seconds. [4]; as of unknown; one publisher.
  > Once the replica receives ACKs from the majority of primaries, it wins the election. [4], Replica election and promotion
  > the cluster becomes available again after \`NODE\_TIMEOUT\` time plus a few more seconds required for a replica to get elected and failover its primary (failovers are usually executed in a matter of 1 or 2 seconds). [4], Availability

- fact-b64cfde520604e58a01d43c49e9b0538 [confirmed]: Valkey 9.0 introduced atomic slot migration, started with CLUSTER MIGRATESLOTS, as the recommended live-resharding method, described as faster and more reliable than legacy slot migration. [4]; as of unknown; one publisher.
  > Valkey 9.0 introduced a server-side mechanism for live resharding called
  > \[atomic slot migration\](atomic-slot-migration.md), which is the recommended method. [4], Live resharding / Atomic slot migration
  > When compared to legacy slot migration, atomic slot migration allows you to
  > perform live resharding faster, with higher reliability, and less client-side
  > impact. Atomic slot migration is started using the \`CLUSTER MIGRATESLOTS\` command. [4], Live resharding / Atomic slot migration


## Performance

| Redis | Valkey |
| --- | --- |
| Redis Ltd. claims Redis 8 has over 30 performance improvements, including up to 87% faster commands, up to 2x more operations per second throughput and up to 18% faster replication. [28] | The Valkey project says Valkey 8.1's rewritten hashtable saves roughly 20 bytes per key (up to 30 with TTL) and improves throughput about 10% over 8.0 for pipelined workloads without I/O threading. [35] |
| Redis Ltd. reports that in its own benchmark of 149 tests against Redis 7.2.5, 90 commands ran faster in Redis 8, with p50 latency reductions from 5.4% to 87.4%. [28] | The Valkey project claims Valkey 8.1 makes ZRANK up to 45% faster, HyperLogLog PFMERGE/PFCOUNT 12x faster with x86 AVX, and BITCOUNT up to 514% faster using AVX2. [35] |
| Redis 8 introduces a new I/O threading implementation, off by default (io-threads 1); Redis Ltd. measured up to 112% higher throughput with 8 threads on a multi-core Intel CPU, varying by command. [28] | The Valkey project says Valkey 9.1.0 reaches 2.1 million requests per second on a single server (512-byte payloads, 9 IO threads, pipeline depth 10), and its new IO threading model adds up to 17% throughput. [37] |
| Redis Ltd. reports Redis 8's new replication mechanism, in a 10 GB full-sync test, cut replication time 18%, lowered peak primary replication buffer 35%, and allowed 7.5% higher write rate. [28] | Valkey project blog authors from AWS report Valkey 8's new I/O threading, together with a prefetch change, raised SET throughput about 230%, from 360K to 1.19M requests per second versus Valkey 7.2, with 8 I/O threads on C7g.16xlarge. [19] |
| Redis Ltd. claims Redis 8.2, with 8 I/O threads, achieves up to 49% more throughput than Redis 8.0 on a 20% write, 80% read caching workload, exceeding 1 million operations per second per instance. [32] | The Valkey project reports Valkey 8.1 offloads TLS negotiation to I/O threads, raising new-connection accept rate around 300%; offloading other TLS-handling calls gave observed 10% SET and 22% GET throughput gains. [35] |
| Redis 8.4 GA release notes claim I/O threading throughput gains above 30% for caching use cases (10% SET, 90% GET) on 4 cores, and up to 91% JSON memory reduction for homogeneous arrays. [33] | The Valkey project claims Valkey 9.0 scales clusters to 2,000 nodes and over 1 billion requests per second, with pipeline memory prefetch giving up to 40%, and zero-copy for large requests up to 20%, higher throughput. [36] |

### What performance improvements do recent Redis releases claim?

Redis Ltd. claims Redis 8 brings over 30 performance improvements and makes further throughput and memory claims for Redis 8.2 and 8.4, all from its own benchmarks against earlier Redis releases. [28] [32] [33]

Redis Ltd. claims Redis 8 has over 30 performance improvements, including up to 87% faster commands, up to 2x more operations per second throughput and up to 18% faster replication. [28] In its own benchmark of 149 tests against Redis 7.2.5, Redis Ltd. reports that 90 commands ran faster in Redis 8, with p50 latency reductions from 5.4% to 87.4%. [28]

Redis 8 introduces a new I/O threading implementation that is off by default (io-threads 1), and Redis Ltd. measured up to 112% higher throughput with 8 threads on a multi-core Intel CPU, varying by command. [28] Redis Ltd. reports that Redis 8's new replication mechanism, in a 10 GB full-sync test, cut replication time 18%, lowered the peak primary replication buffer 35% and allowed a 7.5% higher write rate. [28]

For Redis 8.2, Redis Ltd. claims up to 49% more throughput than Redis 8.0 with 8 I/O threads on a 20% write, 80% read caching workload, exceeding 1 million operations per second per instance. [32] The Redis 8.4 GA release notes claim I/O threading throughput gains above 30% for caching use cases (10% SET, 90% GET) on 4 cores, and up to 91% JSON memory reduction for homogeneous arrays. [33]

Every figure here is Redis Ltd.'s own claim, measured by Redis Ltd. against its own earlier Redis releases under conditions it chose. [28] [32] [33]

Gap (gap-635f0c1c1a86416ba91dfe26e2b8fbf9, checker assessment): Quantified claims are covered only for Redis 8.0, 8.2 and 8.4 (latest dated 18 Nov 2025). The Redis 8.6 GA notes give only 'Substantial performance improvements' in the summary; their detailed 'Performance and resource utilization improvements' sections were not turned into facts, and any release after 8.6 up to late 2026 was not checked. All figures are Redis Ltd.'s own benchmarks under its chosen conditions. [28] [32] [33] [34]

Facts behind this answer:

- fact-2f214bae007941b8a4552a5b69143664 [confirmed]: Redis Ltd. claims Redis 8 has over 30 performance improvements, including up to 87% faster commands, up to 2x more operations per second throughput and up to 18% faster replication. [28]; as of 2025-05-01; one publisher.
  > Redis 8 is the most performant and scalable version of Redis yet. It has over 30 performance improvements, including up to 87% faster commands, up to 2x more operations per second throughput, up to 18% faster replication [28], Introduction

- fact-fdcdb1f4991741a8b10fcc31748efa8b [confirmed]: Redis Ltd. reports that in its own benchmark of 149 tests against Redis 7.2.5, 90 commands ran faster in Redis 8, with p50 latency reductions from 5.4% to 87.4%. [28]; as of 2025-05-01; one publisher.
  > We have reduced the latency per command in Redis 8 for a large set of commands compared to Redis 7.2.5. In our benchmark of 149 tests, 90 commands run faster with less latency. The p50 latency reduction ranges from 5.4% to 87.4%. [28], Significant performance improvements: Up to 87% reduction in command latency

- fact-1da3dce1b7e14bb6b8dcbe169f217d4b [confirmed]: Redis 8 introduces a new I/O threading implementation, off by default (io-threads 1); Redis Ltd. measured up to 112% higher throughput with 8 threads on a multi-core Intel CPU, varying by command. [28]; as of 2025-05-01; one publisher.
  > In Redis 8, we introduce our new I/O threading implementation. You can enable it by setting the io-threads configuration parameter. The default value is 1. When the parameter is set to 8 on a multi-core Intel CPU, we’ve measured up to 112% improvement in throughput. Exact throughput improvements will vary, contingent on the commands being executed. [28], 2x more ops per second throughput by enabling multithreading

- fact-efab2247913a47139d9ac74c01b6eed6 [confirmed]: Redis Ltd. reports Redis 8's new replication mechanism, in a 10 GB full-sync test, cut replication time 18%, lowered peak primary replication buffer 35%, and allowed 7.5% higher write rate. [28]; as of 2025-05-01; one publisher.
  > In Redis 8, we are introducing a new replication mechanism. During replication, we initiate two replication streams simultaneously: one stream for transferring the primary node and the other for the stream of changes that happen in the interim. The second phase is no longer blocked waiting for the first phase to complete.
  > 
  > In our tests, we conducted a full synchronization of a 10 GB dataset with an additional stream of 26.84 million write operations that yields 25 GB of changes during the replication. With the new replication mechanism, the primary can handle write operations at a 7.5% higher average rate during replication. Replication also takes 18% less time and the peak replication buffer size on the primary node is 35% lower. [28], Up to 35% less memory used for replication

- fact-baca6fa25be44e37b3c1c0e077453f33 [confirmed]: Redis Ltd. claims Redis 8.2, with 8 I/O threads, achieves up to 49% more throughput than Redis 8.0 on a 20% write, 80% read caching workload, exceeding 1 million operations per second per instance. [32]; as of 2025-08-08; one publisher.
  > With 8 I/O threads enabled, Redis 8.2 achieves up to 49% throughput improvement compared to Redis 8.0 for a typical caching workload ratio of 20% writes and 80% reads.
  > 
  > We're exceeding 1 million operations per second on a single Redis 8.2 instance for mixed write and read workloads—a milestone that showcases how far we've pushed the boundaries of in-memory performance. [32], Up to 49% more throughput to exceed 1M ops/sec

- fact-0948003fbb564928bc0ec67da4e2746d [confirmed]: Redis 8.4 GA release notes claim I/O threading throughput gains above 30% for caching use cases (10% SET, 90% GET) on 4 cores, and up to 91% JSON memory reduction for homogeneous arrays. [33]; as of unknown; one publisher.
  > This is the General Availability release of Redis 8.4 in Redis Open Source.
  > 
  > \#\#\# Major changes compared to 8.2
  > 
  > - \`DIGEST\`, \`DELEX\`; \`SET\` extensions - atomic compare-and-set and compare-and-delete for string keys
  > - \`MSETEX\` - atomically set multiple string keys and update their expiration
  > - \`XREADGROUP\` - new \`CLAIM\` option for reading both idle pending and incoming stream entries
  > - \`CLUSTER MIGRATION\` - atomic slot migration
  > - \`CLUSTER SLOT-STATS\` - per-slot usage metrics: key count, CPU time, and network I/O
  > - Redis query engine: \`FT.HYBRID\` - hybrid search and fused scoring
  > - Redis query engine: I/O threading with performance boost for search and query commands (FT.\*) 
  > - I/O threading: substantial throughput increase (e.g. \>30% for caching use cases (10% \`SET\`, 90% \`GET\`), 4 cores)
  > - JSON: substantial memory reduction for homogeneous arrays (up to 91%) [33], Redis 8.4 GA: Major changes compared to 8.2

### What performance improvements do recent Valkey releases claim?

The Valkey project and its contributors claim throughput, memory and command-speed gains across Valkey 8, 8.1, 9.0 and 9.1.0, measured against earlier Valkey releases or under their own test conditions. [19] [35] [36] [37]

Valkey project blog authors from AWS report that Valkey 8's new I/O threading, together with a prefetch change, raised SET throughput about 230%, from 360K to 1.19M requests per second versus Valkey 7.2, with 8 I/O threads on C7g.16xlarge. [19]

The Valkey project says Valkey 8.1's rewritten hashtable saves roughly 20 bytes per key (up to 30 with TTL) and improves throughput about 10% over 8.0 for pipelined workloads without I/O threading. [35] The project also claims Valkey 8.1 makes ZRANK up to 45% faster, HyperLogLog PFMERGE/PFCOUNT 12x faster with x86 AVX, and BITCOUNT up to 514% faster using AVX2. [35] It reports that Valkey 8.1 offloads TLS negotiation to I/O threads, raising the new-connection accept rate around 300%, and that offloading other TLS-handling calls gave observed 10% SET and 22% GET throughput gains. [35]

For Valkey 9.0, the project claims clusters scale to 2,000 nodes and over 1 billion requests per second, with pipeline memory prefetch giving up to 40%, and zero-copy for large requests up to 20%, higher throughput. [36] The project says Valkey 9.1.0 reaches 2.1 million requests per second on a single server (512-byte payloads, 9 IO threads, pipeline depth 10), and that its new IO threading model adds up to 17% throughput. [37]

Every figure here is a claim by the Valkey project or its blog authors, measured against earlier Valkey releases or on hardware and settings they chose. [19] [35] [36] [37]

Gap (gap-2b494e22d60a4db4aa5fda2d9e6aeee6, checker assessment): Claims are covered for Valkey 8.0 (pre-release AWS-authored post), 8.1, 9.0 and 9.1.0 (May 2026); whether a later release (e.g. 9.2) exists by late 2026 and what it claims was not established. All figures are project or contributor claims under their own test conditions, with no independent measurement. [19] [35] [36] [37]

Facts behind this answer:

- fact-e6d49e93377c4022b61a5db17c3c6a79 [confirmed]: The Valkey project says Valkey 8.1's rewritten hashtable saves roughly 20 bytes per key (up to 30 with TTL) and improves throughput about 10% over 8.0 for pipelined workloads without I/O threading. [35]; as of 2025-04-02; one publisher.
  > Valkey 8.1 introduces several performance improvements that reduce latency, increase throughput, and lower memory usage. [35], Performance
  > The result is we observed a roughly 20 byte reduction per key-value pair for keys without a TTL, and up to a 30 byte reduction for key-value pairs with a TTL. The new implementation also helps improve the Valkey server throughput by roughly 10% compared to 8.0 version for pipeline workloads when I/O threading is not used. [35], Performance: The New Hashtable

- fact-d63931bd32a44d1ab759fdf7dfb84d82 [confirmed]: The Valkey project claims Valkey 8.1 makes ZRANK up to 45% faster, HyperLogLog PFMERGE/PFCOUNT 12x faster with x86 AVX, and BITCOUNT up to 514% faster using AVX2. [35]; as of 2025-04-02; one publisher.
  > ZRANK command, which serves a popular usecase in operating Leaderboards, was optimized to perform up to 45% faster, depending on the sorted set size. [35], Performance: Sorted set and hyperloglog and bitcount optimizations
  > By using the modern CPUs Advanced Vector Extensions of x86, Valkey 8.1 can achieve a 12x speed for the operations like PFMERGE and PFCOUNT on hyperloglog data types.
  > 
  > Similarly, the BITCOUNT operation has been improved up to 514% using AVX2 on x86. [35], Performance: Sorted set and hyperloglog and bitcount optimizations

- fact-75c75002963e47aa93ba3c61d799c16d [confirmed]: The Valkey project says Valkey 9.1.0 reaches 2.1 million requests per second on a single server (512-byte payloads, 9 IO threads, pipeline depth 10), and its new IO threading model adds up to 17% throughput. [37]; as of 2026-05-19; one publisher.
  > Valkey 9.1.0 pushes single server throughput to 2.1 million requests per second using 512-byte payloads, 9 IO threads, and a pipeline depth of 10 commands. You can explore the full results and compare across versions on the Valkey Performance Dashboards.
  > 
  > Notable performance enhancements in 9.1.0 include:
  > 
  > New IO threading model: A redesign of the IO threading communication model improves throughput by up to 17% for a variety of workload types. [37], Performance

- fact-05ae9d26ba0e4be9934efd23020d7c5e [confirmed]: Valkey project blog authors from AWS report Valkey 8's new I/O threading, together with a prefetch change, raised SET throughput about 230%, from 360K to 1.19M requests per second versus Valkey 7.2, with 8 I/O threads on C7g.16xlarge. [19]; as of 2024-08-05; one publisher.
  > Starting with version 8, Valkey users will benefit from an increase in multi-threaded performance, thanks to a new multi-threading architecture that can boost throughput and reduce latency on a wide range of hardware types. [19], Major Upgrade to Valkey Performance
  > Throughput increased by approximately 230%, rising from 360K to 1.19M requests per second compared to Valkey 7.2
  > Latency metrics improved across all percentiles, with average latency decreasing by 69.8% from 1.792 ms to 0.542 ms.
  > 
  > Tested with 8 I/O threads, 3M keys DB size, 512 bytes value size, and 650 clients running sequential SET commands using AWS EC2 C7g.16xlarge instance.
  > Please note that these numbers include the Prefetch change that will be described in the next blog post [19], Major Upgrade to Valkey Performance

- fact-2e1910882a5842d2a25df584fc8086bb [confirmed]: The Valkey project reports Valkey 8.1 offloads TLS negotiation to I/O threads, raising new-connection accept rate around 300%; offloading other TLS-handling calls gave observed 10% SET and 22% GET throughput gains. [35]; as of 2025-04-02; one publisher.
  > Following up the I/O threads improvements added in 8.0, more operations have been offloaded to the I/O thread pool in the 8.1 release, improving the throughput and latency of some operations.
  > 
  > In the new release, TLS connections are now able to offload the TLS negotiation to I/O threads. This change improves the rate of accepting new connections by around 300%.
  > 
  > Other sources of overhead in the TLS connection handling were identified, namely in the calls to SSL\_pending() and ERR\_clear\_error() functions, which were being called in the main event thread. By offloading these functions to the I/O threads pool, a throughput improvement was achieved in some operations. For instance, it was observed a 10% improvement in SET operations throughput, and a 22% improvement in GET operations throughput. [35], Performance: I/O Threads Improvements

- fact-fba6bbd4c53f42a8b1ba9ea74d32c3bf [confirmed]: The Valkey project claims Valkey 9.0 scales clusters to 2,000 nodes and over 1 billion requests per second, with pipeline memory prefetch giving up to 40%, and zero-copy for large requests up to 20%, higher throughput. [36]; as of 2025-10-21; one publisher.
  > Valkey 9.0 brings numerous small changes and improvements:
  > 
  > - 1 Billion Requests/Second with Large Clusters: Improvements in the resilience of large clusters, enabling scaling to 2,000 nodes and achieving over 1 billion requests per second,
  > 
  > - Pipeline Memory Prefetch: Memory prefetching when pipelining, yielding up to 40% higher throughput, [36], Much, much, more
  > Zero copy Responses: Large requests avoid internal memory copying, yielding up to 20% higher throughput,
  > 
  > - Multipath TCP: Adds Multipath TCP support which can reduce latency by 25%. [36], Much, much, more

### What independent, third-party benchmarks compare recent Redis and Valkey releases?

The cross-project benchmarks cited come from Momento, a cache vendor, which reported Valkey ahead of Redis on throughput, latency and memory in its own tests. [38] [39]

Momento, a cache vendor, reported Valkey 8.1.1 at 999.8K SET RPS with .8ms p99 and Redis 8.0 at a printed 729.4 RPS, with no K suffix, and .99ms p99, on a tuned 8-vCPU c8g.2xl with 1KB items. [38] In that Momento test, Valkey 8.1 had 37% higher SET and 16% higher GET throughput than Redis 8.0, with 30% faster SET p99 and 60%+ faster GET p99. [38]

Momento also reported that I/O threading lifted Valkey SET throughput from 239K to 678K RPS and Redis from 235K to 563K RPS, moving from no I/O threads to 6 threads. [38]

Momento separately measured Valkey 8.1.1 using 3.77 GB versus Redis 8.2 using 4.83 GB (28% less) after 50 million sorted-set inserts on an 8-vCPU c8g.2xl, with Valkey finishing at about 570k inserts per second versus about 530k. [39]

These figures are Momento's own measurements on an 8-vCPU c8g.2xl that it tuned, not claims made by either project. [38] [39]

Gap (gap-70a4174ca20f45338417447c4bbddb3d, checker assessment): Checker's assessment: the only benchmarks cited are from Momento, which is not part of either project. It is not neutral, though: its memory post says Valkey is one of the primary storage engines in its Cache service, and its posts are openly pro-Valkey. No benchmark from an analyst, academic, the press or another vendor is cited. [38] [39]

Gap (gap-e6849a434b7c4de994fd20bbb92a46f1, checker assessment): Checker's assessment: neither cited benchmark covers the late-2026 releases (Redis 8.2+ throughput or latency, Valkey 9.x). The pinned Momento page links a newer post, '50 Million Sorted Sets, Round Three: Redis Still Chasing Valkey' (September 27, 2026), which was not captured or checked. [38] [39]

Gap (gap-90c098de953f43029c5f6fa4bbd0c1cf, checker assessment): Checker's assessment: both cited benchmarks are synthetic single-node tests on one AWS Graviton4 instance type (c8g.2xl), run with Momento's own tuning and harness. Nothing covers cluster mode, persistence enabled, mixed GET/SET ratios or other hardware, and the throughput post itself warns that its results do not apply generally. [38] [39]

Facts behind this answer:

- fact-1d911e8fd6724a62ab8e7b291b0a813c [confirmed]: In that Momento test, Valkey 8.1 had 37% higher SET and 16% higher GET throughput than Redis 8.0, with 30% faster SET p99 and 60%+ faster GET p99. [38]; as of 2025-05-07; one publisher.
  > But how do these and other contributions compare to Redis 8? Can we hit 1M RPS out of an 8 VCPU instance (c8g.2xl) on either Valkey 8.1 or Redis 8.0 (with 1KB items, 3M items in the key space, and ~500 connections)? It’s time for a bake off\! [38], Valkey 8.1 vs Redis 8.0: Can the Fork Outrun the Source?
  > Valkey achieved higher throughput and lower latency across both reads and writes (37% higher on SET and 16% higher on GET), alongside 30% faster p99 latencies for SET and 60%+ faster on GET. [38], Valkey 8.1 vs Redis 8.0: Can the Fork Outrun the Source?

- fact-944e85f10e9048409a059eff301a54b3 [confirmed]: Momento reported I/O threading lifted Valkey SET throughput from 239K to 678K RPS and Redis from 235K to 563K RPS, moving from no I/O threads to 6 threads. [38]; as of 2025-05-07; one publisher.
  > On Valkey, we see SET throughput going from 239K RPS without I/O threads to 678K with 6 threads. Meanwhile, p99 latencies dropped from 1.68ms to 0.93ms despite doing nearly 3x the throughput\! Similarly, Redis went from 235K RPS without I/O threads to 563K RPS with 6 I/O threads. P99s for Redis also dropped around 40% from 1.35ms to 0.84ms. [38], Valkey 8.1 vs Redis 8.0: Can the Fork Outrun the Source?

- fact-ea6c546e59404d13afe5195890eccfc7 [confirmed]: Momento measured Valkey 8.1.1 using 3.77 GB versus Redis 8.2 using 4.83 GB (28% less) after 50 million sorted-set inserts on an 8-vCPU c8g.2xl, with Valkey finishing at ~570k inserts/s versus ~530k. [39]; as of 2025-10-01; one publisher.
  > We spun up an AWS c8g.2xl (Graviton4) instance with 8 vCPUs and 16 GB RAM. We ran Valkey 8.1.1 and Redis 8.2 on the same node. Using an in-house benchmarking harness written in Rust, we inserted 50 million items into a sorted set, 250k at a time, and recorded used memory (INFO MEMORY), throughput, and ZSET size after each million inserts. [39], Benchmark setup
  > From the start, Valkey was more frugal. At 1 M inserts, Valkey used ~80 MB of memory while Redis used ~100 MB. By the time we reached 50 M entries, Valkey consumed 3.77 GB whereas Redis consumed 4.83 GB, a difference of 1.06 GB (28 %). That reduction aligns with Valkey’s per‑key overhead savings and the Linux Foundation’s claim that upgrading to Valkey 8.1 can reduce memory footprints by up to 20 % for most workloads. Throughput told a similar story: Redis initially led, but Valkey held steady and finished the run at ~570 k inserts/s while Redis dropped to ~530 k/s, a ~7 % difference. [39], Results

- fact-cf694859fbaa440aada76bcf9fe9a0d2 [confirmed]: Momento, a cache vendor, reported Valkey 8.1.1 at 999.8K SET RPS with .8ms p99 and Redis 8.0 at a printed 729.4 RPS (no K suffix) with .99ms p99, on a tuned 8-vCPU c8g.2xl with 1KB items. [38]; as of 2025-05-07; one publisher.
  > But how do these and other contributions compare to Redis 8? Can we hit 1M RPS out of an 8 VCPU instance (c8g.2xl) on either Valkey 8.1 or Redis 8.0 (with 1KB items, 3M items in the key space, and ~500 connections)? It’s time for a bake off\! [38], Valkey 8.1 vs Redis 8.0: Can the Fork Outrun the Source?
  > On a full-tuned c8g.2xl (8 VCPU), Valkey 8.1.1 pushed to 999.8K RPS on SETs with .8ms p99 latency. Redis 8.0 got as high as 729.4 RPS on SETs with .99ms p99 latencies. On each iteration, we tested 50M SETs followed by 50M GETs. We varied connection counts to optimize the maximum throughput for each system. [38], Valkey 8.1 vs Redis 8.0: Can the Fork Outrun the Source?


## Compatibility

| Redis | Valkey |
| --- | --- |
| Redis 8 adds 8 more data structures to Redis Open Source, including vector set (beta), JSON, time series, and five probabilistic structures such as cuckoo filter, count-min sketch, top-k and t-digest. [28] | Valkey is compatible with Redis OSS 7.2 and all earlier open-source Redis versions because Valkey 7.2.4 is a fork of Redis OSS 7.2.4. [31] |
| Redis Ltd. merged Redis Stack into a single Redis Open Source distribution that includes all the former modules. [28] | Valkey cannot use data files produced by Redis Community Edition 7.4 and later, including RDB files. [31] |
| Redis Open Source documents vector sets, an HNSW-based data type for vector similarity search using cosine similarity, which Redis launched in beta with a possibly changing API. [27] [28] | Valkey accepts Redis-style configuration files and supports existing Redis OSS 7.2 configuration directives. [31] |
| Valkey's data types page documents HyperLogLog and Bloom filters, the latter via the valkey-bloom module, but not Redis's count-min sketch, cuckoo filter, t-digest or Top-K types. [29] | Valkey reports redis\_version:7.2.4 in INFO for backward compatibility and keeps Lua scripts using the redis namespace working. [31] |
| Redis Open Source's data types page documents time series, arrays, count-min sketch and t-digest types. [27] | Valkey runs modules written for Redis OSS against the RedisModule\_ API, and adds its own ValkeyModule\_ API for new modules. [31] |
| JSON storage with JSONPath and index-based similarity search are not Redis-only: Valkey Bundle documents a Valkey JSON module and a Valkey Search module for them. [30] | Valkey's migration guide states that Valkey uses the RESP wire protocol with RESP2 and RESP3 support, that existing Redis client libraries can connect to Valkey without code changes, and that redis-cli works with Valkey servers. [31] |
|  | Valkey 9.0 introduced hash field expiration, covering commands such as HPERSIST, HTTL and HEXPIRETIME that Redis 7.4 added among nine per-field expiration commands. [44] [46] |
|  | Valkey 9.0 includes the HSETEX and HGETEX hash commands that Redis 8.0 added, as Valkey 9.0 patch notes fix HSETEX notifications and HGETEX permissions. [16] [44] |
|  | Valkey 9.1 added the HGETDEL command, which Redis 8.0 introduced to get and delete the value of one or more hash fields. [16] [45] |
|  | Valkey 9.1 added an MSETEX command that sets multiple keys with a shared expiration. [45] |

### Which data types and features does Redis offer that Valkey does not document?

Redis documents time series, vector sets, arrays and probabilistic types such as count-min sketch, cuckoo filter, t-digest and Top-K that Valkey's data types page does not list, while JSON and similarity search have Valkey module counterparts. [27] [28] [29] [30]

As of May 2025, Redis 8 added 8 more data structures to Redis Open Source, including vector set in beta, JSON, time series, and five probabilistic structures such as cuckoo filter, count-min sketch, top-k and t-digest. [28] Redis Ltd. also merged Redis Stack into a single Redis Open Source distribution that includes all the former modules. [28] Redis Open Source's data types page documents time series, arrays, count-min sketch and t-digest types. [27] It also documents vector sets, an HNSW-based type for vector similarity search using cosine similarity, launched in beta with an API that may change. [27] [28]

Valkey's data types page documents HyperLogLog and Bloom filters, the latter through the valkey-bloom module, but not count-min sketch, cuckoo filter, t-digest or Top-K. [29] JSON storage with JSONPath and index-based similarity search are not Redis-only, because Valkey Bundle documents a Valkey JSON module and a Valkey Search module for them. [30]

Not every recent Redis feature is missing from Valkey: Valkey 9.0 introduced hash field expiration, which Redis 7.4 had added. [44] [46] The absences on the Valkey side come from what its data types page lists, not from a Valkey statement of which Redis types it lacks. [29]

Gap (gap-30c8784f65b54a96b5ebd53c13e9db34, checker assessment): Absence in Valkey is inferred from Valkey's data types overview and Valkey Bundle page only; no Valkey page states which Redis types it lacks, and the valkey-bloom command reference was not checked for cuckoo filter, count-min sketch, Top-K or t-digest support. [29] [30]

Gap (gap-7487e6d41d944b36909fb30571e54975, checker assessment): Redis time series, vector sets and arrays are documented for Redis, but no Valkey source was checked for a time-series module or a vector-set equivalent, and when Redis arrays were introduced (version) is not established. [27] [29]

Gap (gap-5cc70be38f5e477db7720d59bca82409, checker assessment): Non-data-type features are not compared: e.g. Redis 7.4+/8 hash field expiration commands (HGETDEL, HGETEX, HSETEX), Redis Query Engine capabilities versus Valkey Search, and features added in recent Valkey releases that may close gaps. [28] [30]

Facts behind this answer:

- fact-0433cdc3f1e848a2b15c77c5aaefda05 [confirmed]: Redis 8 adds 8 more data structures to Redis Open Source, including vector set (beta), JSON, time series, and five probabilistic structures such as cuckoo filter, count-min sketch, top-k and t-digest. [28]; as of 2025-05-01; one publisher.
  > This release adds 8 more data structures, including vector set (beta), JSON, time series, and five probabilistic structures, including Bloom filter, cuckoo filter, count-min sketch, top-k, and t-digest (some previously available as separate Redis modules). [28], Introduction

- fact-f74ca038f29f4ba7b7f21c5199157770 [confirmed]: Redis Ltd. merged Redis Stack into a single Redis Open Source distribution that includes all the former modules. [28]; as of 2025-05-01; one publisher.
  > Today, we’re combining our Redis Stack and community offerings into a single Redis Open Source distribution. All the modules are already included in this package. [28], One Redis

- fact-328cf5dbb2274fc2b448a9ae577c7d6c [confirmed]: Redis Open Source documents vector sets, an HNSW-based data type for vector similarity search using cosine similarity, which Redis launched in beta with a possibly changing API. [27] [28]; as of unknown; one publisher.
  > Vector sets supports the HNSW (hierarchical navigable small world) algorithm, allowing you to store, index, and query vectors based on the cosine similarity metric. [27], Vector sets
  > The vector set data type is available in beta. We may change, or even break, the features and the API in future versions. [28], Vector set data structure \[beta\]

- fact-693ec37bf1794f139009a81ba965f26b [confirmed]: Valkey's data types page documents HyperLogLog and Bloom filters, the latter via the valkey-bloom module, but not Redis's count-min sketch, cuckoo filter, t-digest or Top-K types. [29]; as of unknown; one publisher.
  > The Bloom filter data type / command support is provided by the valkey-bloom module. [29], Bloom Filter
  > The HyperLogLog data structures provide probabilistic estimates of the cardinality (i.e., number of elements) of large sets. [29], HyperLogLog

- fact-28e7a0408a4f4c449a4d6e2baa8d06e8 [confirmed]: Redis Open Source's data types page documents time series, arrays, count-min sketch and t-digest types. [27]; as of unknown; one publisher.
  > structures let you store and query timestamped data points. [27], Time series
  > Redis arrays are sparse, index-addressable sequences of strings. [27], Arrays
  > structures estimate percentiles from a stream of data values. [27], t-digest
  > estimate the frequency of a data point within a stream of values. [27], Count-min sketch

- fact-5e4a749f749643d68a5ce68ff682303c [confirmed]: JSON storage with JSONPath and index-based similarity search are not Redis-only: Valkey Bundle documents a Valkey JSON module and a Valkey Search module for them. [30]; as of unknown; one publisher.
  > Valkey JSON - Allows users to natively store, query, and modify JSON data structures using the JSONPath query language. [30], What is Valkey Bundle
  > Valkey Search - Enables the creation of indexes and similarity searches through the use of complex filters. [30], What is Valkey Bundle

### How compatible is Valkey with Redis commands, protocol and data files?

Valkey is compatible with Redis OSS 7.2 and earlier in commands, configuration, protocol and modules, but cannot use data files from Redis Community Edition 7.4 and later. [31]

Valkey 7.2.4 is a fork of Redis OSS 7.2.4, which makes Valkey compatible with Redis OSS 7.2 and all earlier open-source Redis versions. [31] Valkey's migration guide states that Valkey uses the RESP wire protocol with RESP2 and RESP3 support, that existing Redis client libraries connect to Valkey without code changes, and that redis-cli works with Valkey servers. [31]

Valkey accepts Redis-style configuration files and supports existing Redis OSS 7.2 configuration directives. [31] It reports redis\_version:7.2.4 in INFO for backward compatibility and keeps Lua scripts using the redis namespace working, and the guide says to use server\_name and valkey\_version to detect the actual Valkey server and version. [20] [31] Modules written for Redis OSS run on Valkey against the RedisModule\_ API, and Valkey adds its own ValkeyModule\_ API for new modules. [31]

Data files are the break point: Valkey cannot use data files produced by Redis Community Edition 7.4 and later, including RDB files. [31] Redis Community Edition 7.4 release notes record RDB file format changes for per-field hash expiration. [21]

These compatibility statements come from Valkey's own migration guide. [20] [31]

Gap (gap-76d845c770f244438f9bbfa84e62c368, checker assessment): Command compatibility is established only for Redis OSS 7.2 and earlier; whether Valkey implements commands added in Redis CE 7.4 and Redis 8.x (e.g. HGETDEL, HGETEX, HSETEX, new data-type commands) is not covered, and all compatibility evidence comes from a single Valkey-authored migration guide. [31] [28]

Facts behind this answer:

- fact-5386774b04874db1997841f9658d90b9 [confirmed]: Valkey is compatible with Redis OSS 7.2 and all earlier open-source Redis versions because Valkey 7.2.4 is a fork of Redis OSS 7.2.4. [31]; as of unknown; one publisher.
  > Valkey is compatible with Redis OSS 7.2 and all earlier open-source Redis versions, as Valkey 7.2.4 is a fork of Redis OSS 7.2.4. [31], Redis compatibility and migration options

- fact-11bb523a952d4066815b1fcc9a9d21cb [confirmed]: Valkey cannot use data files produced by Redis Community Edition 7.4 and later, including RDB files. [31]; as of unknown; one publisher.
  > Redis Community Edition (CE) version 7.4 and later produce data files that are not compatible with Valkey. [31], Redis compatibility and migration options
  > Persistence: Valkey reads and writes RDB and AOF files compatible with Redis OSS 7.2. RDB files produced by Redis CE 7.4 and later are not compatible. [31], Compatibility details

- fact-3792ee5e3e0a45c1a6ceb18a97f8394f [confirmed]: Valkey accepts Redis-style configuration files and supports existing Redis OSS 7.2 configuration directives. [31]; as of unknown; one publisher.
  > Configuration: Valkey accepts Redis-style configuration files. Existing Redis OSS 7.2 configuration directives are supported, with additional Valkey-specific options for new features. [31], Compatibility details

- fact-80b1ff2d3f194e358f2180bf431a3aae [confirmed]: Valkey reports redis\_version:7.2.4 in INFO for backward compatibility and keeps Lua scripts using the redis namespace working. [31]; as of unknown; one publisher.
  > INFO: Valkey reports redis\_version:7.2.4 in the INFO output for backward compatibility. Use server\_name and valkey\_version to detect the actual Valkey server and version. [31], Compatibility details
  > Lua scripting: Existing scripts that use the redis namespace continue to work. [31], Compatibility details

- fact-76cf4e109376429d97d1d94bb05f01b3 [confirmed]: Valkey runs modules written for Redis OSS against the RedisModule\_ API, and adds its own ValkeyModule\_ API for new modules. [31]; as of unknown; one publisher.
  > Modules: Modules written for Redis OSS using the RedisModule\_ API work in Valkey. Valkey also provides the ValkeyModule\_ API and valkeymodule.h header for new modules. [31], Compatibility details

- fact-87825a7c04b44f97b8740caae7f4da19 [confirmed]: Valkey's migration guide states that Valkey uses the RESP wire protocol with RESP2 and RESP3 support, that existing Redis client libraries can connect to Valkey without code changes, and that redis-cli works with Valkey servers. [31]; as of unknown; one publisher.
  > Protocol: Valkey uses the RESP wire protocol and supports both RESP2 and RESP3. Existing Redis client libraries can connect to Valkey without code changes. [31], Compatibility details
  > CLI: redis-cli works with Valkey servers, and valkey-cli works with Redis OSS servers. [31], Compatibility details

### Which commands added in Redis 7.4 and 8.x does Valkey implement or lack?

Valkey implements Redis 7.4's hash field expiration from Valkey 9.0, Redis 8.0's HSETEX and HGETEX in Valkey 9.0, and Redis 8.0's HGETDEL in Valkey 9.1. [16] [44] [45] [46]

Valkey 9.0 introduced hash field expiration, covering commands such as HPERSIST, HTTL and HEXPIRETIME that Redis 7.4 added among nine per-field expiration commands. [44] [46] RedisShake's compatibility page lists hash field expiration as unsupported on Valkey 8.x. [41]

Valkey 9.0 includes the HSETEX and HGETEX hash commands that Redis 8.0 added, as Valkey 9.0 patch notes fix HSETEX notifications and HGETEX permissions. [16] [44] Valkey 9.1 added HGETDEL, which Redis 8.0 introduced to get and delete the value of one or more hash fields. [16] [45] Valkey 9.1 also added an MSETEX command that sets multiple keys with a shared expiration. [45]

Redis 8 brought vector set in beta, JSON, time series and probabilistic structures into Redis Open Source, while Valkey Bundle documents separate Valkey JSON and Valkey Search modules. [28] [30]

Gap (gap-ca55d2309b524e1684ec67b4ea09961c, checker assessment): Redis 8.0 added a beta vector set data type and folded JSON, time series, probabilistic structures and the Query Engine into the core; the Valkey 9.0 and 9.1 release notes do not mention equivalents, which does not establish whether Valkey lacks them or offers them through separate modules. [16] [44] [45]

Gap (gap-aeeb74b743ab4e9c801d9fdcf54ed6c2, checker assessment): Commands added in Redis 8.2 and 8.4 were not checked against their own release notes, so Valkey parity for those releases is unknown beyond MSETEX existing in Valkey 9.1 (no confirmed fact ties MSETEX to a Redis release). [16] [45]

Gap (gap-d10debb136904ddc9a0ed3ea46bd47b0, checker assessment): Redis 7.4 additions other than hash field expiration (for example the XREAD '+' id and HSCAN NOVALUES flag) were not checked against Valkey, so 7.4 parity is established only for hash field expiration. [46] [44]

Facts behind this answer:

- fact-e1b754e941834686ac7c7e1d3fa2c401 [confirmed]: Valkey 9.0 introduced hash field expiration, covering commands such as HPERSIST, HTTL and HEXPIRETIME that Redis 7.4 added among nine per-field expiration commands. [44] [46]; as of unknown; 2 publishers.
  > Upgrade urgency LOW: This is the first Release Candidate for Redis Community Edition 7.4. [46], Redis Community Edition 7.4 RC1
  > \* \#13303 Hash - expiration of individual fields. 9 commands were introduced: [46], 7.4 RC1, New Features
  > Valkey 9.0 release notes [44], Title
  > \* Introduce HASH items expiration by @ranshid (\#2089) [44], Valkey 9.0.0-rc1, New Features
  > \* HPERSIST, HTTL, HPTTL, HEXPIRETIME, and HPEXPIRETIME now return a syntax error when the FIELDS keyword is missing by @cjx-zar (\#4300) [44], Valkey 9.0.6, Bug Fixes

- fact-99b9451f1ada43c398c2b76f8772fa88 [confirmed]: Valkey 9.0 includes the HSETEX and HGETEX hash commands that Redis 8.0 added, as Valkey 9.0 patch notes fix HSETEX notifications and HGETEX permissions. [16] [44]; as of unknown; 2 publishers.
  > Redis Open Source 8.0 release notes [16], Title
  > - New hash commands - \`HGETDEL\`, \`HGETEX\`, \`HSETEX\` [16], 8.0 GA summary
  > Valkey 9.0 release notes [44], Title
  > \* HSETEX - Always issue keyspace notifications after validation (\#3001) [44], Valkey 9.0.2, Bug fixes
  > \* HGETEX now requires write permission on the key, so read-only ACL users can no longer change field TTLs or delete fields by @ranshid (\#4576) [44], Valkey 9.0.6, Bug Fixes

- fact-2b8a545de5554fba9567c5f70e7f668a [confirmed]: Valkey 9.1 added the HGETDEL command, which Redis 8.0 introduced to get and delete the value of one or more hash fields. [16] [45]; as of unknown; 2 publishers.
  > Valkey 9.1 release notes [45], Title
  > \* Adds HGETDEL command by @roshkhatri (\#2851) [45], Valkey 9.1.0-rc1, Command and API updates
  > Redis Open Source 8.0 release notes [16], Title
  > \`HGETDEL\` Get and delete the value of one or more fields of a given hash key [16], 8.0-RC1, New Features

- fact-cebb48b8e7864d54b8d80bf5a2b14947 [confirmed]: Valkey 9.1 added an MSETEX command that sets multiple keys with a shared expiration. [45]; as of unknown; one publisher.
  > Valkey 9.1 release notes [45], Title
  > \* New \`MSETEX\` command to set multiple keys with a shared expiration by @enjoy-binbin (\#3121) [45], Valkey 9.1.0-rc1, Command and API updates


## Migration

### What migration path from Redis to Valkey does the Valkey project document?

Valkey's migration guide documents physical migration of a Redis RDB snapshot, a replication-based cutover for standalone servers, and a replica-promotion procedure for Redis Cluster, treating migration from Redis OSS 7.2 and earlier as effectively an upgrade. [20]

The guide states that Valkey is compatible with Redis OSS 7.2 and earlier because Valkey 7.2.4 forked Redis OSS 7.2.4, so such migrations are effectively an upgrade. [20]

For a standalone Redis server, the guide lists physical migration, which copies the most recent on-disk snapshot from Redis to Valkey, among its options. [20] It calls physical migration the easiest and fastest method, at the cost of downtime while Valkey loads the data. [20] To minimise downtime, the guide instead configures Valkey as a replica of Redis and later stops replication on Valkey with REPLICAOF NO ONE. [20]

For Redis Cluster, the guide adds Valkey nodes as replicas, promotes one Valkey replica to primary for each Redis primary, and then removes the Redis nodes. [20]

The guide also covers migrating only a specific set of critical keys, and it names RIOT, RedisShake and Redis-Migrate-Tool as data migration tools that are beyond its scope. [20]

Facts behind this answer:

- fact-00a39efe48a24bce9c55adb7b4b70989 [confirmed]: Valkey's migration guide states Valkey is compatible with Redis OSS 7.2 and earlier because Valkey 7.2.4 forked Redis OSS 7.2.4, making such migrations effectively an upgrade. [20]; as of unknown; one publisher.
  > Valkey is compatible with Redis OSS 7.2 and all earlier open-source Redis versions, as Valkey 7.2.4 is a fork of Redis OSS 7.2.4. [20], Redis compatibility and migration options
  > Migrating from one of these Redis versions to Valkey is effectively an upgrade. [20], Redis compatibility and migration options

- fact-4dcdf55c67bf4c529afedc0e387406e9 [confirmed]: The Valkey guide calls physical migration (copying a fresh Redis RDB snapshot to Valkey) the easiest and fastest method, at the cost of downtime while Valkey loads the data. [20]; as of unknown; one publisher.
  > This is the easiest and fastest migration method. You make a fresh snapshot of your Redis instance and copy it over to Valkey. Valkey reads the data from the snapshot on startup and restores its contents into memory. [20], Physical migration
  > The downtime to shutdown Redis and wait for Valkey to load the data. [20], Physical migration

- fact-93242dc282204beeaf3ff24739cdd8de [confirmed]: For a standalone Redis server, the Valkey guide lists physical migration, copying the most recent on-disk snapshot from Redis to Valkey, among its migration options. [20]; as of unknown; one publisher.
  > To migrate a standalone Redis server to Valkey, you have the following options: [20], Migrate a standalone instance
  > by copying the most recent on-disk snapshot from the Redis server to Valkey and starting Valkey server with it [20], Migrate a standalone instance

- fact-a472fbe45bd243e6808b06fbdca36ce3 [confirmed]: To minimise downtime, the Valkey guide configures Valkey as a replica of Redis and later stops replication on Valkey with REPLICAOF NO ONE. [20]; as of unknown; one publisher.
  > To minimize the downtime during migration, you can use replication. Both Redis and Valkey allow replaying data on another server to handle the workload. [20], Replication
  > In this scenario we will configure Valkey to be the replica of Redis. [20], Replication
  > In your Valkey container, stop the Valkey replication using the \`REPLICAOF\` command with \`NO ONE\` as the options: [20], Replication, step 9

- fact-8357e8a87c82402a9a9f77f14e8d8253 [confirmed]: For Redis Cluster, the Valkey guide adds Valkey nodes as replicas, promotes one Valkey replica to primary for each Redis primary, then removes the Redis nodes. [20]; as of unknown; one publisher.
  > The first step is to add the required number of Valkey nodes to the existing cluster as replicas. Once the new Valkey nodes replicate the data, one Valkey replica is promoted to be a new primary for each Redis primary. After the migration, the Redis nodes are removed from the cluster. [20], Migrate a Cluster
  > Start the \`valkey-cli\` in your new Valkey container and enter the following command to promote it to be primary. [20], Migrate a Cluster, step 8

- fact-f527b5f9971442a19cb70092cd609ad5 [confirmed]: The Valkey guide covers migrating only a specific set of critical keys and names RIOT, RedisShake and Redis-Migrate-Tool as data migration tools beyond its scope. [20]; as of unknown; one publisher.
  > There may be cases when you need to migrate only a specific set of critical keys. [20], Migrate specific keys
  > You can also use data migration tools such as \[RIOT\](https://redis.github.io/riot/\#\_introduction), \[RedisShake\](https://github.com/tair-opensource/RedisShake), and \[Redis-Migrate-Tool\](https://github.com/vipshop/redis-migrate-tool) but that is beyond the scope of this document. [20], Migrate a Cluster, note

### Which Redis versions or features limit a straightforward migration to Valkey?

Valkey's guide says data files from Redis Community Edition 7.4 and later are not compatible with Valkey, and that proprietary Redis versions need a method it does not cover; which later features cause this is only partly documented. [20]

The Valkey migration guide states that Redis Community Edition 7.4 and later produce data files that are not compatible with Valkey. [20] The Redis Community Edition 7.4 release notes record RDB file format changes for per-field hash expiration and also note a licence change. [21] The guide says migrating from proprietary Redis versions and other Redis-like software may be possible but needs another method that it does not cover. [20]

For physical migration, the guide warns that having AOF enabled on Valkey's first start prevents the copied Redis RDB file from being imported. [20] It also warns of possible data loss with physical migration on write-heavy instances, and with replication cutover if writes continue while Redis syncs to the Valkey replica. [20]

Valkey reports redis\_version:7.2.4 in INFO for backward compatibility, and the guide says to use server\_name and valkey\_version to detect the actual Valkey server and version. [20]

The guide does not say which features of Redis Community Edition 7.4 and later cause the incompatibility, and it documents no method for migrating from those versions. [20]

Gap (gap-8d40e3891449454891c3bbee5abe86aa, checker assessment): Checker assessment: the Valkey guide states only that Redis CE 7.4 and later data files are incompatible; it does not name Redis 8.x releases, does not say which 7.4+ features (e.g. the hash per-field expiration RDB format change recorded in the 7.4.0 release notes) cause the incompatibility, and documents no method for migrating from CE 7.4+ (replication or key-level MIGRATE from 7.4+ is not addressed). Whether newer Valkey releases (8.x/9.x) read any 7.4+ RDB is also not covered. [20] [21]

Facts behind this answer:

- fact-998b41de0b7a4d8eb4a3338ab4a0b6f6 [confirmed]: The Valkey migration guide states Redis Community Edition 7.4 and later produce data files that are not compatible with Valkey. [20]; as of unknown; one publisher.
  > Redis Community Edition (CE) version 7.4 and later produce data files that are not compatible with Valkey. [20], Redis compatibility and migration options
  > Persistence: Valkey reads and writes RDB and AOF files compatible with Redis OSS 7.2. RDB files produced by Redis CE 7.4 and later are not compatible. [20], Compatibility details

- fact-9d7e2e061e134dcd8f4f84719aa94d47 [confirmed]: The Valkey guide says migrating from proprietary Redis versions and other Redis-like software may be possible but needs another method it does not cover. [20]; as of unknown; one publisher.
  > It may be possible to migrate the data to Valkey from proprietary Redis versions and other Redis-like software, but it requires another method and is not covered by this document. [20], Redis compatibility and migration options

- fact-ddec463e61d94903be03e5007d8baa3a [confirmed]: Redis Community Edition 7.4 release notes record RDB file format changes for per-field hash expiration and note a licence change. [21]; as of unknown; one publisher.
  > This is the General Availability release of Redis Community Edition 7.4. [21], Redis Community Edition 7.4.0 GA
  > Hash - expiration of individual fields: RDB file format changes [21], Redis Community Edition 7.4.0 GA, Changes to new 7.4 features
  > Note: License changed - see LICENSE.txt [21], Redis Community Edition 7.4 RC1

- fact-86801bd1e1bd4a85aee31ab1de4d5908 [confirmed]: For physical migration, the Valkey guide warns that AOF enabled on Valkey's first start prevents the copied Redis RDB file from being imported. [20]; as of unknown; one publisher.
  > If you enabled AOF in your Valkey configuration, disable it on the first start. Otherwise, the copied RDB file will not be imported into Valkey. [20], Physical migration, step 9

- fact-1c9254930e0243ad8bc6c2f2b3839ed0 [confirmed]: The Valkey guide warns of possible data loss: physical migration on write-heavy instances, and replication cutover if writes continue while Redis syncs to the Valkey replica. [20]; as of unknown; one publisher.
  > Potential risk of data loss on instances with heavy writes. To prevent it, you must disconnect all active connections before starting the migration. [20], Physical migration
  > There may be potential data loss in the case where there are writes active on the Redis primary while it is syncing with the replica. [20], Replication, step 5 note

- fact-30e531f4197c4ad7abe4f164f8281fa2 [confirmed]: Valkey reports redis\_version:7.2.4 in INFO for backward compatibility, and the guide says to use server\_name and valkey\_version to detect the actual Valkey server and version. [20]; as of unknown; one publisher.
  > Valkey reports \`redis\_version:7.2.4\` in the \[INFO\](../commands/info.md) output for backward compatibility. Use \`server\_name\` and \`valkey\_version\` to detect the actual Valkey server and version. [20], Compatibility details

### Which tools or managed services support migrating data from Redis 7.4 or later to Valkey?

RedisShake supports Redis up to 8.4.x and Valkey 8.x to 9.x, and ElastiCache documents a managed Redis OSS to Valkey upgrade, but Valkey's guide says Redis Community Edition 7.4 and later data files are incompatible. [20] [40] [43]

Valkey's migration guide says Redis Community Edition 7.4 and later produce data files that are not compatible with Valkey, and it names RIOT, RedisShake and Redis-Migrate-Tool as data migration tools while treating them as beyond its scope. [20]

The RedisShake README says it supports Redis 2.8 to 8.4.x and Valkey 8.x to 9.x, with PSync, RDB and Scan data fetch methods. [40] Its compatibility page lists Vector Sets and Redis Stack modules as not supported for Redis 8.x, and hash field expiration as unsupported on Valkey 8.x. [41] The README also says RedisShake 4.x does not support resumable transfer and that RedisShake is best suited for one-time data migration rather than long-term continuous synchronization. [40]

RIOT's README says RIOT, which supports Redis with live and/or snapshot replication, has been superseded by RIOT-X, an enterprise-grade version actively supported by Redis, Inc.. [42]

Amazon ElastiCache documents upgrading from Redis OSS to Valkey through the Console, API or CLI by specifying the new engine and major engine version, and describes Valkey as designed as a drop-in replacement for Redis OSS 7. [43] None of these sources explicitly documents migrating data from Redis Community Edition 7.4 or later into Valkey. [20] [43]

Gap (gap-0cc0f10d54c54dc4a4572b42f611a156, checker assessment): RedisShake documents support for Redis up to 8.4.x and Valkey 8.x to 9.x, but no inspected source explicitly documents or tests migrating Redis 7.4+ data into Valkey; its matrix shows hash field expiration unsupported on Valkey 8.x, so feature-level fidelity for such migrations is unconfirmed. [40] [41]

Gap (gap-c4c43af833c44f6dac9863731ee30ffe, checker assessment): The Amazon ElastiCache cross-engine upgrade page covers ElastiCache's managed Redis OSS engine and does not say whether self-managed Redis 7.4 or later can be migrated to Valkey through it. [43]

Gap (gap-269f2262d5dd4b8cb8eb49f81181854b, checker assessment): The RIOT README points to RIOT-X, but the RIOT-X documentation landing page (version 1.15.1) does not mention Valkey, so RIOT-X support for Redis 7.4+ to Valkey migration is unconfirmed. [42]

Gap (gap-d957d03806ab4496bc98d6f49f329391, checker assessment): Google Cloud Memorystore for Valkey migration documentation was not located, so managed-service migration paths beyond ElastiCache are not covered. 

Facts behind this answer:

- fact-4bb0df9f9f524a1d9e9b5283dbeb0e59 [confirmed]: Valkey's migration guide names RIOT, RedisShake and Redis-Migrate-Tool as data migration tools, but treats them as beyond its scope. [20]; as of unknown; one publisher.
  > You can also use data migration tools such as \[RIOT\](https://redis.github.io/riot/\#\_introduction), \[RedisShake\](https://github.com/tair-opensource/RedisShake), and \[Redis-Migrate-Tool\](https://github.com/vipshop/redis-migrate-tool) but that is beyond the scope of this document. [20], Migration from Redis to Valkey, replication section note

- fact-02848bad80d04a9e9b5ed24084dffe8c [confirmed]: RedisShake's compatibility page lists Vector Sets and Redis Stack modules as not supported for Redis 8.x, and hash field expiration as unsupported on Valkey 8.x. [41]; as of unknown; one publisher.
  > Not Supported:
  > 
  > - Vector Sets
  > 
  > - Redis Stack modules (RedisJSON, RediSearch, RedisTimeSeries, RedisBloom) [41], Redis Version Support Details, Redis 8.x
  > FeatureRedis 2.8-7.xRedis 8.xRedis 8.4.xValkey 8.xValkey 9.x
  > 
  > Basic Data Types✓✓✓✓✓
  > 
  > Stream✓ (5.0+)✓✓✓✓
  > 
  > Module✓ (4.0+)✓✓✓✓
  > 
  > Function✓ (7.0+)✓✓✓✓
  > 
  > Hash Field Expiration✗✓✓✗✓ [41], Feature Support Matrix

- fact-373212d21fa34114b9b5f11ae5c20370 [confirmed]: Valkey's migration guide says Redis Community Edition 7.4 and later produce data files that are not compatible with Valkey. [20]; as of unknown; one publisher.
  > Redis Community Edition (CE) version 7.4 and later produce data files that are not compatible with Valkey. [20], Migration from Redis to Valkey, introduction

- fact-fa2a639eb2e34ae48e98d6981c597fa8 [confirmed]: The RedisShake README says it supports Redis 2.8 to 8.4.x and Valkey 8.x to 9.x, and supports PSync, RDB and Scan data fetch methods. [40]; as of unknown; one publisher.
  > Supports Redis (2.8 to 8.4.x) and Valkey (8.x to 9.x) across standalone, master–slave, sentinel, and cluster deployments. [40], Overview, item 2
  > Supports \[PSync\](https://tair-opensource.github.io/RedisShake/zh/reader/sync\_reader.html), \[RDB\](https://tair-opensource.github.io/RedisShake/zh/reader/rdb\_reader.html), and \[Scan\](https://tair-opensource.github.io/RedisShake/zh/reader/scan\_reader.html) data fetch methods. [40], Overview, item 5

- fact-9434f2f094e34614ad47e7ff696e4c2b [confirmed]: The RedisShake README says RedisShake 4.x does not support resumable transfer and that RedisShake is best suited for one-time data migration, not long-term continuous synchronization. [40]; as of unknown; one publisher.
  > \*\*Resumable Transfer (Checkpoint) is NOT Supported\*\*: RedisShake 4.x does not support resumable transfer. [40], Limitations
  > Combined with the lack of checkpoint support, RedisShake is best suited for \*\*one-time data migration scenarios\*\*, not for long-term continuous synchronization. [40], Limitations

- fact-ccfca15462734138b1b3f4880dc6e6f0 [confirmed]: RIOT's README says RIOT, which supports Redis itself with live and/or snapshot replication, has been superseded by RIOT-X, an enterprise-grade version with active support from Redis, Inc. [42]; as of unknown; one publisher.
  > RIOT has been superseded by https://github.com/redis/riotx-dist\[\*RIOT-X\*\], an enterprise-grade version with enhanced features and active support from Redis, Inc. [42], Important notice
  > \* and Redis itself with live and/or snapshot replication. [42], Introduction

- fact-a94c536403bc47e7ae7d66ab93e48222 [confirmed]: Amazon ElastiCache documents upgrading from Redis OSS to Valkey via the Console, API or CLI by specifying the new engine and major engine version, describing Valkey as designed as a drop-in replacement for Redis OSS 7. [43]; as of unknown; one publisher.
  > Valkey is designed as a drop-in replacement for Redis OSS 7. You can upgrade from Redis OSS to Valkey using the Console, API, or CLI, by specifying the new engine and major engine version. [43], How to upgrade from Redis OSS to Valkey


## Gaps

- How does Valkey use threads to process commands and network I/O? (partly answered): The detailed Valkey threading design (job dispatch, dynamic thread count, epoll offload, key prefetch) comes only from the August 2024 Valkey 8 blog; whether Valkey 8.1 or 9.x changed this design as of late 2026 is not established. The current valkey.conf confirms only defaults, read/write threading and io-threads-do-reads deprecation. [19] [18]
- What performance improvements do recent Redis releases claim? (partly answered): Quantified claims are covered only for Redis 8.0, 8.2 and 8.4 (latest dated 18 Nov 2025). The Redis 8.6 GA notes give only 'Substantial performance improvements' in the summary; their detailed 'Performance and resource utilization improvements' sections were not turned into facts, and any release after 8.6 up to late 2026 was not checked. All figures are Redis Ltd.'s own benchmarks under its chosen conditions. [28] [32] [33] [34]
- What performance improvements do recent Valkey releases claim? (partly answered): Claims are covered for Valkey 8.0 (pre-release AWS-authored post), 8.1, 9.0 and 9.1.0 (May 2026); whether a later release (e.g. 9.2) exists by late 2026 and what it claims was not established. All figures are project or contributor claims under their own test conditions, with no independent measurement. [19] [35] [36] [37]
- Which data types and features does Redis offer that Valkey does not document? (partly answered): Absence in Valkey is inferred from Valkey's data types overview and Valkey Bundle page only; no Valkey page states which Redis types it lacks, and the valkey-bloom command reference was not checked for cuckoo filter, count-min sketch, Top-K or t-digest support. [29] [30] Redis time series, vector sets and arrays are documented for Redis, but no Valkey source was checked for a time-series module or a vector-set equivalent, and when Redis arrays were introduced (version) is not established. [27] [29] Non-data-type features are not compared: e.g. Redis 7.4+/8 hash field expiration commands (HGETDEL, HGETEX, HSETEX), Redis Query Engine capabilities versus Valkey Search, and features added in recent Valkey releases that may close gaps. [28] [30]
- How compatible is Valkey with Redis commands, protocol and data files? (partly answered): Command compatibility is established only for Redis OSS 7.2 and earlier; whether Valkey implements commands added in Redis CE 7.4 and Redis 8.x (e.g. HGETDEL, HGETEX, HSETEX, new data-type commands) is not covered, and all compatibility evidence comes from a single Valkey-authored migration guide. [31] [28]
- Which Redis versions or features limit a straightforward migration to Valkey? (partly answered): Checker assessment: the Valkey guide states only that Redis CE 7.4 and later data files are incompatible; it does not name Redis 8.x releases, does not say which 7.4+ features (e.g. the hash per-field expiration RDB format change recorded in the 7.4.0 release notes) cause the incompatibility, and documents no method for migrating from CE 7.4+ (replication or key-level MIGRATE from 7.4+ is not addressed). Whether newer Valkey releases (8.x/9.x) read any 7.4+ RDB is also not covered. [20] [21]
- Which commands added in Redis 7.4 and 8.x does Valkey implement or lack? (partly answered): Redis 8.0 added a beta vector set data type and folded JSON, time series, probabilistic structures and the Query Engine into the core; the Valkey 9.0 and 9.1 release notes do not mention equivalents, which does not establish whether Valkey lacks them or offers them through separate modules. [16] [44] [45] Commands added in Redis 8.2 and 8.4 were not checked against their own release notes, so Valkey parity for those releases is unknown beyond MSETEX existing in Valkey 9.1 (no confirmed fact ties MSETEX to a Redis release). [16] [45] Redis 7.4 additions other than hash field expiration (for example the XREAD '+' id and HSCAN NOVALUES flag) were not checked against Valkey, so 7.4 parity is established only for hash field expiration. [46] [44]
- What independent, third-party benchmarks compare recent Redis and Valkey releases? (partly answered): Checker's assessment: the only benchmarks cited are from Momento, which is not part of either project. It is not neutral, though: its memory post says Valkey is one of the primary storage engines in its Cache service, and its posts are openly pro-Valkey. No benchmark from an analyst, academic, the press or another vendor is cited. [38] [39] Checker's assessment: neither cited benchmark covers the late-2026 releases (Redis 8.2+ throughput or latency, Valkey 9.x). The pinned Momento page links a newer post, '50 Million Sorted Sets, Round Three: Redis Still Chasing Valkey' (September 27, 2026), which was not captured or checked. [38] [39] Checker's assessment: both cited benchmarks are synthetic single-node tests on one AWS Graviton4 instance type (c8g.2xl), run with Momento's own tuning and harness. Nothing covers cluster mode, persistence enabled, mixed GET/SET ratios or other hardware, and the throughput post itself warns that its results do not apply generally. [38] [39]
- Which tools or managed services support migrating data from Redis 7.4 or later to Valkey? (partly answered): RedisShake documents support for Redis up to 8.4.x and Valkey 8.x to 9.x, but no inspected source explicitly documents or tests migrating Redis 7.4+ data into Valkey; its matrix shows hash field expiration unsupported on Valkey 8.x, so feature-level fidelity for such migrations is unconfirmed. [40] [41] The Amazon ElastiCache cross-engine upgrade page covers ElastiCache's managed Redis OSS engine and does not say whether self-managed Redis 7.4 or later can be migrated to Valkey through it. [43] The RIOT README points to RIOT-X, but the RIOT-X documentation landing page (version 1.15.1) does not mention Valkey, so RIOT-X support for Redis 7.4+ to Valkey migration is unconfirmed. [42] Google Cloud Memorystore for Valkey migration documentation was not located, so managed-service migration paths beyond ElastiCache are not covered.
- Follow-up question (valkey-new-commands): Which commands added in Redis 7.4 and 8.x does Valkey implement or lack?
- Follow-up question (independent-benchmarks): What independent, third-party benchmarks compare recent Redis and Valkey releases?
- Follow-up question (migration-tools): Which tools or managed services support migrating data from Redis 7.4 or later to Valkey?

## Conflicts and history

- fact-d9e48a0a44ed4a17bbb79767a6818139 → fact-450f1619ccc14fbe84d9d8a63aea926d (narrowed): The quotes do not say that WAIT prevents write loss during partitions; they only say nodes do not wait for acknowledgments unless WAIT is used. The phrase 'unless WAIT is explicitly used' implied a guarantee the source does not give.
- fact-f509551834774bceb37ba4a06a9c4dd0 → fact-97bfee561c584d668931df7be30f97b9 (narrowed): The quotes do not say a master is flagged FAIL 'after NODE\_TIMEOUT' or that FAIL by itself triggers failover. NODE\_TIMEOUT appears only in the availability recovery time. Reworded to match the quoted text.
- fact-1d66c3fa847c46dda1e6fe00c420e489 → fact-ec8ceb7b92344833897675dab66ac1b3 (narrowed): The quoted text says the replica obtains a higher configEpoch. Advertising served slots with it is only in the next, unquoted sentence.
- fact-5daf1e7d0edb471889a99e953841102f → fact-88a77781b0ba4487ad970a7c5333e818 (narrowed): No cited Valkey quote covers the FAIL-confirmation step, so 'after primaries confirm FAIL' is unsupported by the citations. Reworded to the quoted election and availability text.
- fact-9ce4077735814b3fb6f0daa223c86162 → fact-b64cfde520604e58a01d43c49e9b0538 (narrowed): Atomic slot migration does not replace the legacy method. The same spec has a 'Legacy slot migration' section and says Valkey Cluster 'also supports' the legacy client-driven mechanism. It is only the recommended method.
- fact-b280ee4c46144c70bfb951bd8364b7f7 → fact-93242dc282204beeaf3ff24739cdd8de (narrowed): The cited quotes include only the options intro and the physical-snapshot bullet; replication and specific-key options are in the source but not in this fact's quotes (they are covered by other facts).
- fact-3354d861181d4c0ba002a255a8e5d016 → fact-a472fbe45bd243e6808b06fbdca36ce3 (narrowed): Quotes support replica configuration and REPLICAOF NO ONE; the application switch-over step is not in the cited quotes.
- fact-2b5ce16abbd74885ae57834d89b14ccb → fact-8357e8a87c82402a9a9f77f14e8d8253 (narrowed): The CLUSTER FAILOVER command name appears in the source context but not in the cited quotes.
- fact-09cf5c88013245e7b9323aae8b3428d0 → fact-f527b5f9971442a19cb70092cd609ad5 (narrowed): The MIGRATE command name is in the source but not in the cited quotes.
- fact-7a9a238d3c2e4af79543745ead34dc02 → fact-30e531f4197c4ad7abe4f164f8281fa2 (narrowed): The source advises using these fields; it does not say tooling must read them.
- fact-a70a75a5597f4215ba1a910f4f29162d → fact-730a420302014e8b8a13ac4a218873d4 (narrowed): The quotes show the two copyright notices; the interpretation that they 'reflect its BSD-licensed Redis origin' is the researcher's inference, not stated in the cited text.
- fact-a9915edd45764980a78b7f45c8768077 → fact-00c1e88c52fe45e6b4f08088afdfe758 (narrowed): The cited quotes support the 6.0 introduction and the synchronous blocking drawback, but do not themselves say the asynchronous design 'replaced' it; that clause is dropped (the replacement is covered by other facts).
- fact-a47624280e44424c9e3bee163c6de0ba → fact-d5a5b236b6a24c18b08ae7f593e57e57 (narrowed): Quote is verbatim but the source is an August 2024 blog describing the Valkey 8 design; statement scoped (without restating the version number, absent from this quote) to Valkey 8 since later releases were not checked.
- fact-163231b36d194b3a95ef13922ba9f95a → fact-92f7f5d487064ef294ba138b2a422c78 (narrowed): Source says 'more than 20 percent of the time' when executed solely by the main thread, not explicitly of main-thread time; also scoped (without restating the version number, absent from this quote) to the Valkey 8 design described in the August 2024 blog. Verbatim in original (markup spacing only).
- fact-4ec50a6c89184e90bb4c9b708124fb7e → fact-6335fc2754354257b9cf911c8f042a1f (narrowed): Quote is verbatim; the blog describes this as new in Valkey 8, so the statement is scoped (without restating the version number, absent from this quote) to that version.
- fact-14a22563d3824e1b9d4f7444f9be9d2c → fact-b67f664a4666405a8f66248774b016ce (narrowed): All quotes verbatim in valkey.conf (unstable), but the file does not state that the deprecation is 'because' threads handle both reads and writes; the causal link is removed.
- fact-28bd0dcc0a4945ef947240af7ca19ef6 → fact-470cb228bc97486dba1543b65abeca05 (narrowed): The cited valkey.conf quote supports the Valkey claim only; the comparison 'like Redis' is not in this citation and is dropped.
- fact-74b264d6fccf42ce8f65be36dabbf3aa → fact-01f6f66abc584117bee0e58956f88194 (narrowed): The quotes do not say the change was made 'unilaterally'; that characterisation is the researcher's inference. The source only shows Redis Inc. framing the change as its own, despite efforts to support community-led governance and a desire to keep BSD.
- fact-51428ea14d994a5c9a0fd8619416f599 → fact-daff8ec4716f4e93a968dd3a05e00b59 (narrowed): The quotes support the specific AGPL announcement by the CEO with that guidance, but not the general claim that 'Redis licensing direction is set by company leadership'. The CEO title comes from antirez's link to the post as 'the Redis CEO blog post'.
- fact-91c4491fdb044082a5330d2ab7704f89 → fact-28e7a0408a4f4c449a4d6e2baa8d06e8 (narrowed): The cited quotes cover time series, arrays, t-digest and count-min sketch only; cuckoo filter and Top-K appear on the page but are not in the cited quotes, and the 'beyond Bloom and HyperLogLog' framing is not quoted.
- fact-7e948f5280024d55bdf4176f9928f3ef → fact-5e4a749f749643d68a5ce68ff682303c (narrowed): Quotes cover only the Valkey JSON and Valkey Search modules; Bloom and LDAP modules are not quoted, and 'vector-capable' rests on an example command (VECTOR HNSW) outside the cited quotes, so the statement is limited to JSON and similarity search.
- fact-1e64cd6b429f43a0bc320d36429e38ff → fact-87825a7c04b44f97b8740caae7f4da19 (narrowed): The source lists these as separate compatibility points; it does not say client compatibility follows from RESP support, so the causal 'so' is removed and the claim is attributed to the guide.
- fact-284d1357daa34379820084360b3577de → fact-05ae9d26ba0e4be9934efd23020d7c5e (narrowed): The source says the figures 'include the Prefetch change' described in a follow-up post, so the gain cannot be attributed to I/O threading alone. Note also the post (2024-08-05) predates the Valkey 8.0 release it describes as 'set for release in September 2024'.
- fact-dac1ddbf66d949ce861b46c256807f16 → fact-2e1910882a5842d2a25df584fc8086bb (narrowed): The 10% SET and 22% GET gains come from offloading SSL\_pending() and ERR\_clear\_error() calls on TLS connections, not from offloading TLS negotiation; the original statement implied a single cause.
- fact-ba49e2b2ed2e4644801a5ad4a68af3db → fact-fba6bbd4c53f42a8b1ba9ea74d32c3bf (narrowed): The source scopes the zero-copy gain to large requests ('Large requests avoid internal memory copying'); the original statement presented it as a general response-path gain.
- fact-140ac8bc98d14bb3a986f2e16615db6b → fact-cf694859fbaa440aada76bcf9fe9a0d2 (narrowed): The source text and the live page both say 'Redis 8.0 got as high as 729.4 RPS', with no K suffix. The candidate's '729.4K' is a reasonable reading (it fits the post's 37% figure), but it is an inference, not the source's words. Everything else checks out against the original page (Momento blog by Khawaja Shams, published 2025-05-07): the subjects, versions, instance, item size and p99 values.
- fact-e9b76894abfd4b1c98d420297ff88e29 → fact-373212d21fa34114b9b5f11ae5c20370 (narrowed): The quote states data-file incompatibility; the added conclusion that RDB file copy does not work from those versions is an inference beyond the quoted text.
- fact-4b01bdb32ea0443396883aa45c7993b0 → fact-fa2a639eb2e34ae48e98d6981c597fa8 (narrowed): The quotes do not say Redis is supported only as a source or Valkey only as a target; 'as source' and 'readers' framing removed to match the README's wording.
- fact-5fab2a29e07c423e9587a9ee71bbe430 → fact-9434f2f094e34614ad47e7ff696e4c2b (narrowed): The cited quotes do not include the README's sentence on cluster topology changes, so that part is not supported by the quotes.
- fact-c90466e9dcf448b4b7cf5b5804b9b621 → fact-ccfca15462734138b1b3f4880dc6e6f0 (narrowed): 'No longer maintained' and Redis Inc. ownership are not in the cited quotes, and the source says 'live and/or snapshot', not both.
- fact-e390d9f137164d37a21392fb69ba1913 → fact-a94c536403bc47e7ae7d66ab93e48222 (narrowed): 'In-place' is not in the quote; the page covers ElastiCache's managed Redis OSS engine, not self-managed Redis 7.4 or later.

## Sources

1. [Redis cluster specification](https://raw.githubusercontent.com/redis/docs/main/content/operate/oss_and_stack/reference/cluster-spec.md); Redis Ltd. (redis/docs); primary; found; saved 2026-10-16T13:13:47.110Z; source date unknown.
2. [Scale with Redis Cluster](https://raw.githubusercontent.com/redis/docs/main/content/operate/oss_and_stack/management/scaling.md); Redis Ltd. (redis/docs); primary; found; saved 2026-10-16T13:13:47.112Z; source date unknown.
3. [CLUSTER MIGRATION command](https://raw.githubusercontent.com/redis/docs/main/content/commands/cluster-migration.md); Redis Ltd. (redis/docs); primary; found; saved 2026-10-16T13:13:47.112Z; source date unknown.
4. [Valkey cluster specification](https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/cluster-spec.md); Valkey project (valkey-io/valkey-doc); primary; found; saved 2026-10-16T13:13:47.113Z; source date unknown.
5. [Redis persistence](https://raw.githubusercontent.com/redis/docs/main/content/operate/oss_and_stack/management/persistence.md); Redis Ltd. (redis/docs repository; published at redis.io/docs/latest/operate/oss\_and\_stack/management/persistence/); primary; found; saved 2026-10-16T13:14:05.026Z; source date unknown.
6. [Persistence](https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/persistence.md); Valkey project (valkey-io/valkey-doc repository; published at valkey.io/topics/persistence/); primary; found; saved 2026-10-16T13:14:05.028Z; source date unknown.
7. [Licenses](https://redis.io/legal/licenses/); Redis Ltd.; primary; found; saved 2026-10-16T13:14:18.395Z; source date unknown.
8. [Redis is now available under the AGPLv3 open source license](https://redis.io/blog/agplv3/); Redis Ltd.; primary; found; saved 2026-10-16T13:14:18.397Z; source date 2025-05-01.
9. [Redis Adopts Dual Source-Available Licensing](https://redis.io/blog/redis-adopts-dual-source-available-licensing/); Redis Ltd.; primary; found; saved 2026-10-16T13:14:18.397Z; source date 2024-03-20.
10. [redis/redis LICENSE.txt (unstable branch)](https://raw.githubusercontent.com/redis/redis/unstable/LICENSE.txt); Redis Ltd. (GitHub redis/redis); primary; found; saved 2026-10-16T13:14:18.398Z; source date unknown.
11. [valkey-io/valkey COPYING (unstable branch)](https://raw.githubusercontent.com/valkey-io/valkey/unstable/COPYING); Valkey project (GitHub valkey-io/valkey); primary; found; saved 2026-10-16T13:14:18.399Z; source date unknown.
12. [valkey-io/valkey README.md (unstable branch)](https://raw.githubusercontent.com/valkey-io/valkey/unstable/README.md); Valkey project (GitHub valkey-io/valkey); primary; found; saved 2026-10-16T13:14:18.400Z; source date unknown.
13. [Linux Foundation Launches Open Source Valkey Community](https://www.linuxfoundation.org/press/linux-foundation-launches-open-source-valkey-community); The Linux Foundation; primary; found; saved 2026-10-16T13:14:18.400Z; source date 2024-03-28.
14. [Diagnosing latency issues](https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/); Redis Ltd.; primary; found; saved 2026-10-16T13:14:21.599Z; source date unknown.
15. [redis.conf (unstable branch)](https://raw.githubusercontent.com/redis/redis/unstable/redis.conf); Redis Ltd. (redis/redis GitHub); primary; found; saved 2026-10-16T13:14:21.602Z; source date unknown.
16. [Redis 8.0 release notes](https://raw.githubusercontent.com/redis/redis/8.0/00-RELEASENOTES); Redis Ltd. (redis/redis GitHub); primary; found; saved 2026-10-16T13:14:21.604Z; source date unknown.
17. [Async IO Threads (redis/redis PR \#13695)](https://github.com/redis/redis/pull/13695); Redis Ltd. (redis/redis GitHub); primary; found; saved 2026-10-16T13:14:21.605Z; source date 2024-12-23.
18. [valkey.conf (unstable branch)](https://raw.githubusercontent.com/valkey-io/valkey/unstable/valkey.conf); Valkey project (valkey-io/valkey GitHub); primary; found; saved 2026-10-16T13:14:21.608Z; source date unknown.
19. [Unlock 1 Million RPS: Experience Triple the Speed with Valkey](https://valkey.io/blog/unlock-one-million-rps/); Valkey project; primary; found; saved 2026-10-16T13:14:21.609Z; source date 2024-08-05.
20. [Migration from Redis to Valkey](https://raw.githubusercontent.com/valkey-io/valkey-doc/main/topics/migration.md); Valkey project; primary; found; saved 2026-10-16T13:14:28.118Z; source date unknown.
21. [Redis Community Edition 7.4 release notes (00-RELEASENOTES)](https://raw.githubusercontent.com/redis/redis/7.4/00-RELEASENOTES); Redis Ltd.; primary; found; saved 2026-10-16T13:14:28.119Z; source date unknown.
22. [Valkey Project Governance (GOVERNANCE.md)](https://raw.githubusercontent.com/valkey-io/valkey/unstable/GOVERNANCE.md); Valkey project; primary; found; saved 2026-10-16T13:14:30.652Z; source date unknown.
23. [Valkey MAINTAINERS.md](https://raw.githubusercontent.com/valkey-io/valkey/unstable/MAINTAINERS.md); Valkey project; primary; found; saved 2026-10-16T13:14:30.653Z; source date unknown.
24. [Redis README](https://raw.githubusercontent.com/redis/redis/unstable/README.md); Redis Ltd.; primary; found; saved 2026-10-16T13:14:30.655Z; source date unknown.
25. [Redis is open source again](https://antirez.com/news/151); antirez (Salvatore Sanfilippo); primary; found; saved 2026-10-16T13:14:30.656Z; source date 2025-05-01.
26. [Redis CONTRIBUTING.md (Software Grant and Contributor License Agreement)](https://raw.githubusercontent.com/redis/redis/unstable/CONTRIBUTING.md); Redis Ltd.; primary; found; saved 2026-10-16T13:14:30.656Z; source date unknown.
27. [Redis data types](https://redis.io/docs/latest/develop/data-types/); Redis Ltd.; primary; found; saved 2026-10-16T13:14:48.751Z; source date unknown.
28. [Redis 8 is now GA, loaded with new features and more than 30 performance improvements](https://redis.io/blog/redis-8-ga/); Redis Ltd.; primary; found; saved 2026-10-16T13:14:48.752Z; source date 2025-05-01.
29. [Valkey Documentation: Data types](https://valkey.io/topics/data-types/); Valkey project; primary; found; saved 2026-10-16T13:14:48.753Z; source date unknown.
30. [Valkey Bundle Getting Started Guide](https://valkey.io/topics/valkey-bundle/); Valkey project; primary; found; saved 2026-10-16T13:14:48.753Z; source date unknown.
31. [Migration from Redis to Valkey](https://valkey.io/topics/migration/); Valkey project; primary; found; saved 2026-10-16T13:14:48.754Z; source date unknown.
32. [Redis 8.2 in Redis Open Source is GA and brings more performance, efficiency, and new commands](https://redis.io/blog/redis-82-ga/); Redis Ltd.; primary; found; saved 2026-10-16T13:15:42.616Z; source date 2025-08-08.
33. [Redis 8.4 release notes (00-RELEASENOTES, 8.4 branch)](https://raw.githubusercontent.com/redis/redis/8.4/00-RELEASENOTES); Redis Ltd. (redis/redis GitHub repository); primary; found; saved 2026-10-16T13:15:42.617Z; source date unknown.
34. [Redis 8.6 release notes (00-RELEASENOTES, 8.6 branch)](https://raw.githubusercontent.com/redis/redis/8.6/00-RELEASENOTES); Redis Ltd. (redis/redis GitHub repository); primary; found; saved 2026-10-16T13:15:42.617Z; source date 2026-02-10.
35. [Valkey 8.1: Continuing to Deliver Enhanced Performance and Reliability](https://valkey.io/blog/valkey-8-1-0-ga/); Valkey project; primary; found; saved 2026-10-16T13:15:42.618Z; source date 2025-04-02.
36. [Valkey 9.0: innovation, features, and improvements.](https://valkey.io/blog/introducing-valkey-9/); Valkey project; primary; found; saved 2026-10-16T13:15:42.619Z; source date 2025-10-21.
37. [Valkey 9.1 delivers improvements in security, performance, and more](https://valkey.io/blog/valkey-9-1-delivers-improvements-in-security-performance-and-more/); Valkey project; primary; found; saved 2026-10-16T13:15:42.619Z; source date 2026-05-19.
38. [Valkey Turns One: How the Community Fork Left Redis in the Dust](https://www.gomomento.com/blog/valkey-turns-one-how-the-community-fork-left-redis-in-the-dust/); Momento (cache vendor, third party to both projects); secondary; found; saved 2026-10-16T13:21:03.199Z; source date 2025-05-07.
39. [Valkey 8.1 vs Redis 8.2: Memory Efficiency at Hyperscale](https://www.gomomento.com/blog/valkey-vs-redis-memory-efficiency-at-hyperscale/); Momento (cache vendor, third party to both projects); secondary; found; saved 2026-10-16T13:21:03.200Z; source date 2025-10-01.
40. [RedisShake README (v4 branch)](https://raw.githubusercontent.com/tair-opensource/RedisShake/v4/README.md); Alibaba Cloud Tair team (tair-opensource/RedisShake); primary; found; saved 2026-10-16T13:21:03.983Z; source date unknown.
41. [Version Compatibility \| RedisShake](https://tair-opensource.github.io/RedisShake/en/others/compatibility.html); Alibaba Cloud Tair team (tair-opensource/RedisShake); primary; found; saved 2026-10-16T13:21:03.985Z; source date unknown.
42. [RIOT README (main branch)](https://raw.githubusercontent.com/redis/riot/main/README.adoc); Redis, Inc. (redis/riot); primary; found; saved 2026-10-16T13:21:03.985Z; source date unknown.
43. [Upgrading engine versions including cross engine upgrades - Amazon ElastiCache](https://docs.aws.amazon.com/AmazonElastiCache/latest/dg/VersionManagement.HowTo.cross-engine-upgrade.html); Amazon Web Services; primary; found; saved 2026-10-16T13:21:03.986Z; source date unknown.
44. [Valkey 9.0 release notes](https://raw.githubusercontent.com/valkey-io/valkey/9.0/00-RELEASENOTES); Valkey project (valkey-io/valkey); primary; found; saved 2026-10-16T13:21:20.687Z; source date 2026-09-01.
45. [Valkey 9.1 release notes](https://raw.githubusercontent.com/valkey-io/valkey/9.1/00-RELEASENOTES); Valkey project (valkey-io/valkey); primary; found; saved 2026-10-16T13:21:20.688Z; source date 2026-08-31.
46. [Redis Community Edition 7.4 release notes](https://raw.githubusercontent.com/redis/redis/7.4/00-RELEASENOTES); Redis Ltd. (redis/redis); primary; found; saved 2026-10-16T13:21:20.689Z; source date 2026-08-17.

## Rejected facts and failed tasks

