# Meridian vs Boreal for an internal inventory application

> Reviewed synthesis.

Source hashes establish capture integrity; they do not establish truth.

Content digest: `8813e2092de19b1d3371ce08c6d94f3ea0ccbeec8f3fce487ba5036585da26c0`. Author: root-synthesis.

<a id="f-1bac23d9aac4a8ca1c1934ce8b9a8eae3694b29a495ec074"></a>
## f-1bac23d9aac4a8ca1c1934ce8b9a8eae3694b29a495ec074

Meridian embeds in the application process and stores its data in one local file.

Author: asset-investigator

> Meridian embeds in the application's process and stores data in one local file.

Source: [s-91b01fbd77a5cd94a00b1a24198ff36757cbff4f5e03ed53](#s-91b01fbd77a5cd94a00b1a24198ff36757cbff4f5e03ed53).

<a id="f-2b671e92b1f9c12e72ed23d5055c416159a1f3417e4a4e8b"></a>
## f-2b671e92b1f9c12e72ed23d5055c416159a1f3417e4a4e8b

Meridian permits one writer at a time per database.

Author: asset-investigator

> It permits one writer at a time per database.

Source: [s-91b01fbd77a5cd94a00b1a24198ff36757cbff4f5e03ed53](#s-91b01fbd77a5cd94a00b1a24198ff36757cbff4f5e03ed53).

<a id="f-609c7f001d477435a02859d84d669eaa3b7da07e2349cf9b"></a>
## f-609c7f001d477435a02859d84d669eaa3b7da07e2349cf9b

Meridian readers can continue during a write transaction when journal mode is enabled.

Author: asset-investigator

> Readers can continue during a write transaction when journal mode is enabled.

Source: [s-91b01fbd77a5cd94a00b1a24198ff36757cbff4f5e03ed53](#s-91b01fbd77a5cd94a00b1a24198ff36757cbff4f5e03ed53).

<a id="f-1e08dc0b3a70a953840b93c441f067844c282a92abc1d62b"></a>
## f-1e08dc0b3a70a953840b93c441f067844c282a92abc1d62b

Meridian requires validation of filesystem locking before use on a shared filesystem.

Author: asset-investigator

> The operator must validate filesystem locking before using a shared filesystem.

Source: [s-91b01fbd77a5cd94a00b1a24198ff36757cbff4f5e03ed53](#s-91b01fbd77a5cd94a00b1a24198ff36757cbff4f5e03ed53).

<a id="f-212228958e6e8643b8199cbcb0c6d84aa89c183c753f922a"></a>
## f-212228958e6e8643b8199cbcb0c6d84aa89c183c753f922a

The Meridian fixture describes suitability for a single application instance with modest write traffic.

Author: asset-investigator

> Meridian is suitable for a single application instance with modest write traffic.

Source: [s-91b01fbd77a5cd94a00b1a24198ff36757cbff4f5e03ed53](#s-91b01fbd77a5cd94a00b1a24198ff36757cbff4f5e03ed53).

<a id="f-877913d109b7b64c747c0165764dbb3327d781c7a11817ca"></a>
## f-877913d109b7b64c747c0165764dbb3327d781c7a11817ca

Boreal runs as a separate database service.

Author: asset-investigator

> Boreal runs as a separate database service.

Source: [s-1b40d381dc355411602ce8a2ff1e50a358541881a8ba3191](#s-1b40d381dc355411602ce8a2ff1e50a358541881a8ba3191).

<a id="f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe"></a>
## f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe

Boreal supports multiple concurrent writers, but conflicting updates can wait or retry.

Author: asset-investigator

> It supports multiple concurrent writers, but conflicting updates can wait or retry.

Source: [s-1b40d381dc355411602ce8a2ff1e50a358541881a8ba3191](#s-1b40d381dc355411602ce8a2ff1e50a358541881a8ba3191).

<a id="f-a120e72417922aee2093261e703aa38c5cffef1ad69eb927"></a>
## f-a120e72417922aee2093261e703aa38c5cffef1ad69eb927

Boreal connection limits and transaction behavior require workload-specific tuning.

Author: asset-investigator

> Its connection limit and transaction behavior require workload-specific tuning.

Source: [s-1b40d381dc355411602ce8a2ff1e50a358541881a8ba3191](#s-1b40d381dc355411602ce8a2ff1e50a358541881a8ba3191).

<a id="f-f5accb58347e9c81b3fe6f31134798b5404ca644c8970723"></a>
## f-f5accb58347e9c81b3fe6f31134798b5404ca644c8970723

Boreal can serve several application instances over the network.

Author: asset-investigator

> Boreal can serve several application instances over the network.

Source: [s-1b40d381dc355411602ce8a2ff1e50a358541881a8ba3191](#s-1b40d381dc355411602ce8a2ff1e50a358541881a8ba3191).

<a id="f-02dde3dbb82c3cd28e38115587480c8d124d309ab422e313"></a>
## f-02dde3dbb82c3cd28e38115587480c8d124d309ab422e313

Copying an open Meridian database file can yield an incomplete backup; the fixture directs the operator to use the backup interface or stop writes first.

Author: packet-investigator

> A backup taken by copying the open database file can be incomplete; use the backup interface or stop writes first.

Source: [s-8c0bf633d48d3bacf5e472ea1c0ad8c99b3d16d69202a0f3](#s-8c0bf633d48d3bacf5e472ea1c0ad8c99b3d16d69202a0f3), Backup/security paragraph.

<a id="f-03485d1e334bd2ead354ef53cf32afe2d4fe8401091ad66b"></a>
## f-03485d1e334bd2ead354ef53cf32afe2d4fe8401091ad66b

Meridian has no built-in network authentication because it exposes no database server; the application and operating system must restrict file access.

Author: packet-investigator

> There is no built-in network authentication because Meridian exposes no database server. The application and operating system must restrict file access.

Source: [s-8c0bf633d48d3bacf5e472ea1c0ad8c99b3d16d69202a0f3](#s-8c0bf633d48d3bacf5e472ea1c0ad8c99b3d16d69202a0f3), Backup/security paragraph.

<a id="f-4f07a22ea780bb44c1aa6d87d2aa9773bf1149b4decaa618"></a>
## f-4f07a22ea780bb44c1aa6d87d2aa9773bf1149b4decaa618

The Boreal operator must configure access control and install supported updates.

Author: packet-investigator

> The operator must configure access control, install supported updates, schedule backups and test restores.

Source: [s-cad497a627f8037787cd642aaea6f4c7e730a8841438ba25](#s-cad497a627f8037787cd642aaea6f4c7e730a8841438ba25), Operations paragraph.

<a id="f-d3e66b5ebd86176707efb16b3f772fec81f23f4351239997"></a>
## f-d3e66b5ebd86176707efb16b3f772fec81f23f4351239997

The Boreal operator must schedule backups and test restores, and the fixture provides a logical export.

Author: packet-investigator

> The operator must configure access control, install supported updates, schedule backups and test restores. A logical export is available; high-availability operation requires additional service configuration.

Source: [s-cad497a627f8037787cd642aaea6f4c7e730a8841438ba25](#s-cad497a627f8037787cd642aaea6f4c7e730a8841438ba25), Operations paragraph.

<a id="f-af55ed278fd8bc17e9cbfff6f95bf7429bb0ffd63045b107"></a>
## f-af55ed278fd8bc17e9cbfff6f95bf7429bb0ffd63045b107

Boreal high availability requires additional service configuration; the fixture does not promise uninterrupted failover.

Author: packet-investigator

> A logical export is available; high-availability operation requires additional service configuration. This fixture does not promise uninterrupted failover.

Source: [s-cad497a627f8037787cd642aaea6f4c7e730a8841438ba25](#s-cad497a627f8037787cd642aaea6f4c7e730a8841438ba25), Operations paragraph.

<a id="f-db5459e93dd8f6d73cfcb7b3b70099d4bfd5f2d6a934ebbf"></a>
## f-db5459e93dd8f6d73cfcb7b3b70099d4bfd5f2d6a934ebbf

Boreal requires service monitoring and someone responsible for recovery.

Author: packet-investigator

> It requires service monitoring and someone responsible for recovery.

Source: [s-cad497a627f8037787cd642aaea6f4c7e730a8841438ba25](#s-cad497a627f8037787cd642aaea6f4c7e730a8841438ba25), Final paragraph.

<a id="f-763534c5b1514b6d1e947ed7dc0c0d402c30fa6790b40f2e"></a>
## f-763534c5b1514b6d1e947ed7dc0c0d402c30fa6790b40f2e

The Boreal fixture supplies no comparative throughput measurements or operating cost figures.

Author: packet-investigator

> No comparative throughput measurements or operating cost figures are supplied by this fixture.

Source: [s-cad497a627f8037787cd642aaea6f4c7e730a8841438ba25](#s-cad497a627f8037787cd642aaea6f4c7e730a8841438ba25), Final paragraph.

<a id="f-7d4911a64fa83bc899ad32e470d240ac6e077492ecfe8d9f"></a>
## f-7d4911a64fa83bc899ad32e470d240ac6e077492ecfe8d9f

The Meridian fixture supplies no comparative throughput measurements.

Author: packet-investigator

> No comparative throughput measurements are provided by this fixture.

Source: [s-8c0bf633d48d3bacf5e472ea1c0ad8c99b3d16d69202a0f3](#s-8c0bf633d48d3bacf5e472ea1c0ad8c99b3d16d69202a0f3), Final paragraph.

<a id="topology"></a>
## Let instance topology and write contention drive the choice

**Conditional recommendation:** For a single application instance with modest writes, Meridian is a candidate. When several application instances need shared data or concurrent writers, Boreal is a candidate, subject to contention and tuning checks. ([f-1bac23d9aac4a8ca1c1934ce8b9a8eae3694b29a495ec074](evidence.md#f-1bac23d9aac4a8ca1c1934ce8b9a8eae3694b29a495ec074), [f-2b671e92b1f9c12e72ed23d5055c416159a1f3417e4a4e8b](evidence.md#f-2b671e92b1f9c12e72ed23d5055c416159a1f3417e4a4e8b), [f-212228958e6e8643b8199cbcb0c6d84aa89c183c753f922a](evidence.md#f-212228958e6e8643b8199cbcb0c6d84aa89c183c753f922a), [f-877913d109b7b64c747c0165764dbb3327d781c7a11817ca](evidence.md#f-877913d109b7b64c747c0165764dbb3327d781c7a11817ca), [f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe](evidence.md#f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe), [f-a120e72417922aee2093261e703aa38c5cffef1ad69eb927](evidence.md#f-a120e72417922aee2093261e703aa38c5cffef1ad69eb927), [f-f5accb58347e9c81b3fe6f31134798b5404ca644c8970723](evidence.md#f-f5accb58347e9c81b3fe6f31134798b5404ca644c8970723))

Supporting facts: [f-1bac23d9aac4a8ca1c1934ce8b9a8eae3694b29a495ec074](evidence.md#f-1bac23d9aac4a8ca1c1934ce8b9a8eae3694b29a495ec074), [f-2b671e92b1f9c12e72ed23d5055c416159a1f3417e4a4e8b](evidence.md#f-2b671e92b1f9c12e72ed23d5055c416159a1f3417e4a4e8b), [f-212228958e6e8643b8199cbcb0c6d84aa89c183c753f922a](evidence.md#f-212228958e6e8643b8199cbcb0c6d84aa89c183c753f922a), [f-877913d109b7b64c747c0165764dbb3327d781c7a11817ca](evidence.md#f-877913d109b7b64c747c0165764dbb3327d781c7a11817ca), [f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe](evidence.md#f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe), [f-f5accb58347e9c81b3fe6f31134798b5404ca644c8970723](evidence.md#f-f5accb58347e9c81b3fe6f31134798b5404ca644c8970723). Counterevidence: [f-1e08dc0b3a70a953840b93c441f067844c282a92abc1d62b](evidence.md#f-1e08dc0b3a70a953840b93c441f067844c282a92abc1d62b), [f-a120e72417922aee2093261e703aa38c5cffef1ad69eb927](evidence.md#f-a120e72417922aee2093261e703aa38c5cffef1ad69eb927).

### Implications

- **Conditional recommendation:** Check how many application instances must write shared data before choosing an embedded file or a network service. ([f-1bac23d9aac4a8ca1c1934ce8b9a8eae3694b29a495ec074](evidence.md#f-1bac23d9aac4a8ca1c1934ce8b9a8eae3694b29a495ec074), [f-2b671e92b1f9c12e72ed23d5055c416159a1f3417e4a4e8b](evidence.md#f-2b671e92b1f9c12e72ed23d5055c416159a1f3417e4a4e8b), [f-f5accb58347e9c81b3fe6f31134798b5404ca644c8970723](evidence.md#f-f5accb58347e9c81b3fe6f31134798b5404ca644c8970723))

### Qualifications to preserve

- **Summary:** Meridian shared-filesystem locking requires validation; Boreal concurrent writers can still wait or retry, and its connection and transaction settings need workload-specific tuning. ([f-1e08dc0b3a70a953840b93c441f067844c282a92abc1d62b](evidence.md#f-1e08dc0b3a70a953840b93c441f067844c282a92abc1d62b), [f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe](evidence.md#f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe), [f-a120e72417922aee2093261e703aa38c5cffef1ad69eb927](evidence.md#f-a120e72417922aee2093261e703aa38c5cffef1ad69eb927))

### Gaps

- **Open question:** The application topology, write rate and update-contention pattern were not supplied.

<a id="operations"></a>
## Both approaches need explicit recovery and access ownership

**Interpretation:** An embedded database removes the separate service in this comparison, but it does not remove backup or access responsibilities. A separate service adds explicit update, monitoring, access-control and recovery duties. ([f-1bac23d9aac4a8ca1c1934ce8b9a8eae3694b29a495ec074](evidence.md#f-1bac23d9aac4a8ca1c1934ce8b9a8eae3694b29a495ec074), [f-877913d109b7b64c747c0165764dbb3327d781c7a11817ca](evidence.md#f-877913d109b7b64c747c0165764dbb3327d781c7a11817ca), [f-02dde3dbb82c3cd28e38115587480c8d124d309ab422e313](evidence.md#f-02dde3dbb82c3cd28e38115587480c8d124d309ab422e313), [f-03485d1e334bd2ead354ef53cf32afe2d4fe8401091ad66b](evidence.md#f-03485d1e334bd2ead354ef53cf32afe2d4fe8401091ad66b), [f-4f07a22ea780bb44c1aa6d87d2aa9773bf1149b4decaa618](evidence.md#f-4f07a22ea780bb44c1aa6d87d2aa9773bf1149b4decaa618), [f-d3e66b5ebd86176707efb16b3f772fec81f23f4351239997](evidence.md#f-d3e66b5ebd86176707efb16b3f772fec81f23f4351239997), [f-db5459e93dd8f6d73cfcb7b3b70099d4bfd5f2d6a934ebbf](evidence.md#f-db5459e93dd8f6d73cfcb7b3b70099d4bfd5f2d6a934ebbf))

Supporting facts: [f-02dde3dbb82c3cd28e38115587480c8d124d309ab422e313](evidence.md#f-02dde3dbb82c3cd28e38115587480c8d124d309ab422e313), [f-03485d1e334bd2ead354ef53cf32afe2d4fe8401091ad66b](evidence.md#f-03485d1e334bd2ead354ef53cf32afe2d4fe8401091ad66b), [f-4f07a22ea780bb44c1aa6d87d2aa9773bf1149b4decaa618](evidence.md#f-4f07a22ea780bb44c1aa6d87d2aa9773bf1149b4decaa618), [f-d3e66b5ebd86176707efb16b3f772fec81f23f4351239997](evidence.md#f-d3e66b5ebd86176707efb16b3f772fec81f23f4351239997), [f-db5459e93dd8f6d73cfcb7b3b70099d4bfd5f2d6a934ebbf](evidence.md#f-db5459e93dd8f6d73cfcb7b3b70099d4bfd5f2d6a934ebbf). Counterevidence: [f-af55ed278fd8bc17e9cbfff6f95bf7429bb0ffd63045b107](evidence.md#f-af55ed278fd8bc17e9cbfff6f95bf7429bb0ffd63045b107).

### Implications

- **Conditional recommendation:** Assign an operator and test a recovery procedure for either option before relying on it. ([f-02dde3dbb82c3cd28e38115587480c8d124d309ab422e313](evidence.md#f-02dde3dbb82c3cd28e38115587480c8d124d309ab422e313), [f-d3e66b5ebd86176707efb16b3f772fec81f23f4351239997](evidence.md#f-d3e66b5ebd86176707efb16b3f772fec81f23f4351239997), [f-db5459e93dd8f6d73cfcb7b3b70099d4bfd5f2d6a934ebbf](evidence.md#f-db5459e93dd8f6d73cfcb7b3b70099d4bfd5f2d6a934ebbf))

### Qualifications to preserve

- **Summary:** Meridian open-file copies can be incomplete. Boreal high availability needs additional configuration and the fixture does not promise uninterrupted failover. ([f-02dde3dbb82c3cd28e38115587480c8d124d309ab422e313](evidence.md#f-02dde3dbb82c3cd28e38115587480c8d124d309ab422e313), [f-af55ed278fd8bc17e9cbfff6f95bf7429bb0ffd63045b107](evidence.md#f-af55ed278fd8bc17e9cbfff6f95bf7429bb0ffd63045b107))

### Gaps

- **Open question:** Recovery objectives, restore-drill results and maintenance ownership are unknown.

<a id="limits"></a>
## The supplied documents establish no throughput or cost winner

**Interpretation:** Neither fixture supplies comparative throughput measurements, and Boreal supplies no operating-cost figures. These materials do not establish a measured performance or cost winner. ([f-763534c5b1514b6d1e947ed7dc0c0d402c30fa6790b40f2e](evidence.md#f-763534c5b1514b6d1e947ed7dc0c0d402c30fa6790b40f2e), [f-7d4911a64fa83bc899ad32e470d240ac6e077492ecfe8d9f](evidence.md#f-7d4911a64fa83bc899ad32e470d240ac6e077492ecfe8d9f))

Supporting facts: [f-763534c5b1514b6d1e947ed7dc0c0d402c30fa6790b40f2e](evidence.md#f-763534c5b1514b6d1e947ed7dc0c0d402c30fa6790b40f2e), [f-7d4911a64fa83bc899ad32e470d240ac6e077492ecfe8d9f](evidence.md#f-7d4911a64fa83bc899ad32e470d240ac6e077492ecfe8d9f). Counterevidence: none recorded.

### Implications

- **Conditional recommendation:** Validate representative workload behavior before converting concurrency capability into a performance recommendation. ([f-2b671e92b1f9c12e72ed23d5055c416159a1f3417e4a4e8b](evidence.md#f-2b671e92b1f9c12e72ed23d5055c416159a1f3417e4a4e8b), [f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe](evidence.md#f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe), [f-763534c5b1514b6d1e947ed7dc0c0d402c30fa6790b40f2e](evidence.md#f-763534c5b1514b6d1e947ed7dc0c0d402c30fa6790b40f2e), [f-7d4911a64fa83bc899ad32e470d240ac6e077492ecfe8d9f](evidence.md#f-7d4911a64fa83bc899ad32e470d240ac6e077492ecfe8d9f))

### Gaps

- **Open question:** No runtime benchmark, migration, cost study or production validation was performed.

## Report prose

### Choose around deployment and contention

**Open question:** This is a controlled exercise using supplied fictional documentation; it is not guidance for a real database deployment. No network source or workload was tested.

**Conditional recommendation:** For a single application instance with modest writes, Meridian is a candidate. When several application instances need shared data or concurrent writers, Boreal is a candidate, subject to contention and tuning checks. ([f-1bac23d9aac4a8ca1c1934ce8b9a8eae3694b29a495ec074](evidence.md#f-1bac23d9aac4a8ca1c1934ce8b9a8eae3694b29a495ec074), [f-2b671e92b1f9c12e72ed23d5055c416159a1f3417e4a4e8b](evidence.md#f-2b671e92b1f9c12e72ed23d5055c416159a1f3417e4a4e8b), [f-212228958e6e8643b8199cbcb0c6d84aa89c183c753f922a](evidence.md#f-212228958e6e8643b8199cbcb0c6d84aa89c183c753f922a), [f-877913d109b7b64c747c0165764dbb3327d781c7a11817ca](evidence.md#f-877913d109b7b64c747c0165764dbb3327d781c7a11817ca), [f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe](evidence.md#f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe), [f-a120e72417922aee2093261e703aa38c5cffef1ad69eb927](evidence.md#f-a120e72417922aee2093261e703aa38c5cffef1ad69eb927), [f-f5accb58347e9c81b3fe6f31134798b5404ca644c8970723](evidence.md#f-f5accb58347e9c81b3fe6f31134798b5404ca644c8970723))

### What the concurrency statements actually allow

**Summary:** Meridian permits one writer per database; readers can continue during a write when journal mode is enabled. Its documented candidate workload is one application instance with modest writes, and a shared filesystem requires locking validation. ([f-2b671e92b1f9c12e72ed23d5055c416159a1f3417e4a4e8b](evidence.md#f-2b671e92b1f9c12e72ed23d5055c416159a1f3417e4a4e8b), [f-609c7f001d477435a02859d84d669eaa3b7da07e2349cf9b](evidence.md#f-609c7f001d477435a02859d84d669eaa3b7da07e2349cf9b), [f-1e08dc0b3a70a953840b93c441f067844c282a92abc1d62b](evidence.md#f-1e08dc0b3a70a953840b93c441f067844c282a92abc1d62b), [f-212228958e6e8643b8199cbcb0c6d84aa89c183c753f922a](evidence.md#f-212228958e6e8643b8199cbcb0c6d84aa89c183c753f922a))

**Interpretation:** Boreal serves several application instances over the network and supports concurrent writers. Conflicting updates may wait or retry, so this is a capability difference rather than evidence of better throughput for the inventory app. Connection limits and transaction behavior require workload-specific tuning. ([f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe](evidence.md#f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe), [f-a120e72417922aee2093261e703aa38c5cffef1ad69eb927](evidence.md#f-a120e72417922aee2093261e703aa38c5cffef1ad69eb927), [f-f5accb58347e9c81b3fe6f31134798b5404ca644c8970723](evidence.md#f-f5accb58347e9c81b3fe6f31134798b5404ca644c8970723), [f-763534c5b1514b6d1e947ed7dc0c0d402c30fa6790b40f2e](evidence.md#f-763534c5b1514b6d1e947ed7dc0c0d402c30fa6790b40f2e), [f-7d4911a64fa83bc899ad32e470d240ac6e077492ecfe8d9f](evidence.md#f-7d4911a64fa83bc899ad32e470d240ac6e077492ecfe8d9f))

### Recovery and access still need an owner

**Summary:** For Meridian, use its backup interface or stop writes before copying: an open-file copy may be incomplete. Access protection belongs to the application and operating system because no database server is exposed. ([f-02dde3dbb82c3cd28e38115587480c8d124d309ab422e313](evidence.md#f-02dde3dbb82c3cd28e38115587480c8d124d309ab422e313), [f-03485d1e334bd2ead354ef53cf32afe2d4fe8401091ad66b](evidence.md#f-03485d1e334bd2ead354ef53cf32afe2d4fe8401091ad66b))

**Summary:** For Boreal, configure access control, install supported updates, schedule backups, test restores and monitor the service. Someone must own recovery. A logical export is available; high availability requires extra configuration and does not promise uninterrupted failover in the supplied fixture. ([f-4f07a22ea780bb44c1aa6d87d2aa9773bf1149b4decaa618](evidence.md#f-4f07a22ea780bb44c1aa6d87d2aa9773bf1149b4decaa618), [f-d3e66b5ebd86176707efb16b3f772fec81f23f4351239997](evidence.md#f-d3e66b5ebd86176707efb16b3f772fec81f23f4351239997), [f-af55ed278fd8bc17e9cbfff6f95bf7429bb0ffd63045b107](evidence.md#f-af55ed278fd8bc17e9cbfff6f95bf7429bb0ffd63045b107), [f-db5459e93dd8f6d73cfcb7b3b70099d4bfd5f2d6a934ebbf](evidence.md#f-db5459e93dd8f6d73cfcb7b3b70099d4bfd5f2d6a934ebbf))

### What would change the decision

**Interpretation:** Neither fixture supplies comparative throughput measurements, and Boreal supplies no operating-cost figures. These materials do not establish a measured performance or cost winner. ([f-763534c5b1514b6d1e947ed7dc0c0d402c30fa6790b40f2e](evidence.md#f-763534c5b1514b6d1e947ed7dc0c0d402c30fa6790b40f2e), [f-7d4911a64fa83bc899ad32e470d240ac6e077492ecfe8d9f](evidence.md#f-7d4911a64fa83bc899ad32e470d240ac6e077492ecfe8d9f))

**Open question:** The missing inputs are actual instance count, conflicting-write behavior, filesystem topology, recovery objectives, restore evidence and operating ownership. Resolve these before making an unconditional recommendation.

## Authored brief prose

### Start with the deployment shape

**Conditional recommendation:** For a single application instance with modest writes, Meridian is a candidate. When several application instances need shared data or concurrent writers, Boreal is a candidate, subject to contention and tuning checks. ([f-1bac23d9aac4a8ca1c1934ce8b9a8eae3694b29a495ec074](evidence.md#f-1bac23d9aac4a8ca1c1934ce8b9a8eae3694b29a495ec074), [f-2b671e92b1f9c12e72ed23d5055c416159a1f3417e4a4e8b](evidence.md#f-2b671e92b1f9c12e72ed23d5055c416159a1f3417e4a4e8b), [f-212228958e6e8643b8199cbcb0c6d84aa89c183c753f922a](evidence.md#f-212228958e6e8643b8199cbcb0c6d84aa89c183c753f922a), [f-877913d109b7b64c747c0165764dbb3327d781c7a11817ca](evidence.md#f-877913d109b7b64c747c0165764dbb3327d781c7a11817ca), [f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe](evidence.md#f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe), [f-a120e72417922aee2093261e703aa38c5cffef1ad69eb927](evidence.md#f-a120e72417922aee2093261e703aa38c5cffef1ad69eb927), [f-f5accb58347e9c81b3fe6f31134798b5404ca644c8970723](evidence.md#f-f5accb58347e9c81b3fe6f31134798b5404ca644c8970723))

**Summary:** Meridian shared-filesystem locking requires validation; Boreal concurrent writers can still wait or retry, and its connection and transaction settings need workload-specific tuning. ([f-1e08dc0b3a70a953840b93c441f067844c282a92abc1d62b](evidence.md#f-1e08dc0b3a70a953840b93c441f067844c282a92abc1d62b), [f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe](evidence.md#f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe), [f-a120e72417922aee2093261e703aa38c5cffef1ad69eb927](evidence.md#f-a120e72417922aee2093261e703aa38c5cffef1ad69eb927))

### Keep these qualifications

**Interpretation:** An embedded database removes the separate service in this comparison, but it does not remove backup or access responsibilities. A separate service adds explicit update, monitoring, access-control and recovery duties. ([f-1bac23d9aac4a8ca1c1934ce8b9a8eae3694b29a495ec074](evidence.md#f-1bac23d9aac4a8ca1c1934ce8b9a8eae3694b29a495ec074), [f-877913d109b7b64c747c0165764dbb3327d781c7a11817ca](evidence.md#f-877913d109b7b64c747c0165764dbb3327d781c7a11817ca), [f-02dde3dbb82c3cd28e38115587480c8d124d309ab422e313](evidence.md#f-02dde3dbb82c3cd28e38115587480c8d124d309ab422e313), [f-03485d1e334bd2ead354ef53cf32afe2d4fe8401091ad66b](evidence.md#f-03485d1e334bd2ead354ef53cf32afe2d4fe8401091ad66b), [f-4f07a22ea780bb44c1aa6d87d2aa9773bf1149b4decaa618](evidence.md#f-4f07a22ea780bb44c1aa6d87d2aa9773bf1149b4decaa618), [f-d3e66b5ebd86176707efb16b3f772fec81f23f4351239997](evidence.md#f-d3e66b5ebd86176707efb16b3f772fec81f23f4351239997), [f-db5459e93dd8f6d73cfcb7b3b70099d4bfd5f2d6a934ebbf](evidence.md#f-db5459e93dd8f6d73cfcb7b3b70099d4bfd5f2d6a934ebbf))

**Summary:** Meridian open-file copies can be incomplete. Boreal high availability needs additional configuration and the fixture does not promise uninterrupted failover. ([f-02dde3dbb82c3cd28e38115587480c8d124d309ab422e313](evidence.md#f-02dde3dbb82c3cd28e38115587480c8d124d309ab422e313), [f-af55ed278fd8bc17e9cbfff6f95bf7429bb0ffd63045b107](evidence.md#f-af55ed278fd8bc17e9cbfff6f95bf7429bb0ffd63045b107))

**Interpretation:** Neither fixture supplies comparative throughput measurements, and Boreal supplies no operating-cost figures. These materials do not establish a measured performance or cost winner. ([f-763534c5b1514b6d1e947ed7dc0c0d402c30fa6790b40f2e](evidence.md#f-763534c5b1514b6d1e947ed7dc0c0d402c30fa6790b40f2e), [f-7d4911a64fa83bc899ad32e470d240ac6e077492ecfe8d9f](evidence.md#f-7d4911a64fa83bc899ad32e470d240ac6e077492ecfe8d9f))

<a id="s-91b01fbd77a5cd94a00b1a24198ff36757cbff4f5e03ed53"></a>
## Meridian DB — synthetic supplied fixture

/private/tmp/harness-local-acceptance-110/inputs/documents/meridian.md · Supplied synthetic test fixture · selected · full context

accessed_at: 2026-10-29

Original: [saved original](sources/revisions/b43bcd8e0123db19d7977f535807647a588aebd13686645a67e1bb509c9cce06.md); SHA-256: `b43bcd8e0123db19d7977f535807647a588aebd13686645a67e1bb509c9cce06`.

Capture: [saved context](sources/revisions/b43bcd8e0123db19d7977f535807647a588aebd13686645a67e1bb509c9cce06.txt); SHA-256: `b43bcd8e0123db19d7977f535807647a588aebd13686645a67e1bb509c9cce06`.

<a id="s-1b40d381dc355411602ce8a2ff1e50a358541881a8ba3191"></a>
## Boreal DB — synthetic supplied fixture

/private/tmp/harness-local-acceptance-110/inputs/documents/boreal.md · Supplied synthetic test fixture · selected · full context

accessed_at: 2026-10-29

Original: [saved original](sources/revisions/dc4575ce199c9b97d15d266dd429481b21c942b1930abc767d3f5a97adf99259.md); SHA-256: `dc4575ce199c9b97d15d266dd429481b21c942b1930abc767d3f5a97adf99259`.

Capture: [saved context](sources/revisions/dc4575ce199c9b97d15d266dd429481b21c942b1930abc767d3f5a97adf99259.txt); SHA-256: `dc4575ce199c9b97d15d266dd429481b21c942b1930abc767d3f5a97adf99259`.

<a id="s-8c0bf633d48d3bacf5e472ea1c0ad8c99b3d16d69202a0f3"></a>
## Meridian DB — synthetic supplied fixture

/private/tmp/harness-local-acceptance-110/inputs/documents/meridian.md · Synthetic supplied fixture; author unspecified · selected · full context

accessed_at: 2026-10-29

Original: [saved original](sources/revisions/b43bcd8e0123db19d7977f535807647a588aebd13686645a67e1bb509c9cce06.md); SHA-256: `b43bcd8e0123db19d7977f535807647a588aebd13686645a67e1bb509c9cce06`.

Capture: [saved context](sources/revisions/b43bcd8e0123db19d7977f535807647a588aebd13686645a67e1bb509c9cce06.txt); SHA-256: `b43bcd8e0123db19d7977f535807647a588aebd13686645a67e1bb509c9cce06`.

<a id="s-cad497a627f8037787cd642aaea6f4c7e730a8841438ba25"></a>
## Boreal DB — synthetic supplied fixture

/private/tmp/harness-local-acceptance-110/inputs/documents/boreal.md · Synthetic supplied fixture; author unspecified · selected · full context

accessed_at: 2026-10-29

Original: [saved original](sources/revisions/dc4575ce199c9b97d15d266dd429481b21c942b1930abc767d3f5a97adf99259.md); SHA-256: `dc4575ce199c9b97d15d266dd429481b21c942b1930abc767d3f5a97adf99259`.

Capture: [saved context](sources/revisions/dc4575ce199c9b97d15d266dd429481b21c942b1930abc767d3f5a97adf99259.txt); SHA-256: `dc4575ce199c9b97d15d266dd429481b21c942b1930abc767d3f5a97adf99259`.

## Independent review

Reviewer: guidance-checker. I re-read the full current dossier, all 17 assertions and their full original/capture context, all 3 findings including conditions/implications/gaps, and all 13 report/brief blocks. The necessity overclaim in concurrency:0 is corrected. The report gives conditional deployment/operating candidates, preserves contention, locking, backup and failover qualifications, and states missing workload/performance/cost evidence. The brief prioritizes those consequences without discarding caveats. Four logical source records remain two fictional originals, not independent corroborations. No further blocking objection. This is controlled supplied-fictional-material research only; no network source, real product, workload, migration, cost or cross-harness validation was performed.

- f-1bac23d9aac4a8ca1c1934ce8b9a8eae3694b29a495ec074 — supported: Re-read for this new saved digest. The complete Meridian original explicitly states embedded execution and one local file; the exact quotation preserves both clauses.
- f-2b671e92b1f9c12e72ed23d5055c416159a1f3417e4a4e8b — supported: Re-read for this new saved digest. The Meridian original states one writer at a time per database. The fact retains the per-database boundary.
- f-609c7f001d477435a02859d84d669eaa3b7da07e2349cf9b — supported: Re-read for this new saved digest. The Meridian original permits continuing readers when journal mode is enabled. The fact preserves that stated condition without claiming it is the only possible mode.
- f-1e08dc0b3a70a953840b93c441f067844c282a92abc1d62b — supported: Re-read for this new saved digest. The original explicitly places filesystem-locking validation before shared-filesystem use.
- f-212228958e6e8643b8199cbcb0c6d84aa89c183c753f922a — supported: Re-read for this new saved digest. The original limits its suitability statement to one application instance and modest write traffic; the fact correctly attributes that statement to this fictional fixture.
- f-877913d109b7b64c747c0165764dbb3327d781c7a11817ca — supported: Re-read for this new saved digest. The Boreal original explicitly describes a separate database service.
- f-b78fe11312529141fc9bb01de42aa6ec7c6efde2c991cafe — supported: Re-read for this new saved digest. The concurrent-writer statement includes conflicting updates waiting or retrying. Both the capability and qualification survive.
- f-a120e72417922aee2093261e703aa38c5cffef1ad69eb927 — supported: Re-read for this new saved digest. The original expressly requires workload-specific tuning for connection limit and transaction behavior.
- f-f5accb58347e9c81b3fe6f31134798b5404ca644c8970723 — supported: Re-read for this new saved digest. The original explicitly permits several application instances over the network; no numerical capacity is inferred.
- f-02dde3dbb82c3cd28e38115587480c8d124d309ab422e313 — supported: Re-read for this new saved digest. The Meridian original warns an open-file copy can be incomplete and prescribes backup interface or stopped writes. The fact preserves the alternatives and qualification.
- f-03485d1e334bd2ead354ef53cf32afe2d4fe8401091ad66b — supported: Re-read for this new saved digest. Both adjacent Meridian clauses concern this same embedded product: no server/network authentication and application/OS file-access responsibility. The conjunction is supported in context.
- f-4f07a22ea780bb44c1aa6d87d2aa9773bf1149b4decaa618 — supported: Re-read for this new saved digest. The Boreal original names access control and supported updates as operator responsibilities; the narrower fact is accurate.
- f-d3e66b5ebd86176707efb16b3f772fec81f23f4351239997 — supported: Re-read for this new saved digest. The complete Boreal original requires scheduled backups and tested restores and states logical export availability; the fact does not infer failover from the export.
- f-af55ed278fd8bc17e9cbfff6f95bf7429bb0ffd63045b107 — supported: Re-read for this new saved digest. The original requires additional high-availability configuration and explicitly disclaims uninterrupted failover; the fact preserves that boundary.
- f-db5459e93dd8f6d73cfcb7b3b70099d4bfd5f2d6a934ebbf — supported: Re-read for this new saved digest. The final Boreal paragraph expressly requires service monitoring and recovery ownership.
- f-763534c5b1514b6d1e947ed7dc0c0d402c30fa6790b40f2e — supported: Re-read for this new saved digest. The Boreal source explicitly says no comparative throughput measurements or operating cost figures are supplied.
- f-7d4911a64fa83bc899ad32e470d240ac6e077492ecfe8d9f — supported: Re-read for this new saved digest. The Meridian source explicitly supplies no comparative throughput measurements. This is a fixture evidence limit, not a real product claim.
- topology — supported: Re-read for this new saved digest. The recommendation is conditional, grounded in single-instance/modest-write Meridian suitability and networked/multiwriter Boreal capability, with contention, tuning and shared-filesystem caveats preserved. The implication asks for the missing topology rather than declaring a winner.
- operations — supported: Re-read for this new saved digest. The inference correctly separates removal of the separate service from backup/file-access duties. The Boreal duties, recovery recommendation and high-availability qualification are supported by the two complete fictional originals; actual recovery objectives remain unknown.
- limits — supported: Re-read for this new saved digest. The complete sources supply no comparative throughput data and Boreal supplies no cost figures. They cannot establish a measured comparative winner. The workload-validation recommendation and no-benchmark/no-migration limitations are proportionate.
- answer:0 — supported: Re-read for this new saved digest. Both originals explicitly identify invented products for a controlled test. The no-network/no-workload-test boundary is correctly presented as a limitation rather than evidence of capability.
- answer:1 — supported: Re-read for this new saved digest. Candidate recommendations retain the relevant topology, modest-write and contention/tuning conditions, without an unconditional product or performance winner.
- concurrency:0 — supported: Re-read complete Meridian original/capture, current fact and report paragraph. The revised wording says readers can continue during a write WHEN journal mode is enabled, matching the source without asserting exclusivity. One-writer/per-database, single-instance/modest-write and shared-filesystem validation clauses are also supported.
- concurrency:1 — supported: Re-read for this new saved digest. The networked/multiwriter capability, potential waits/retries and tuning requirement are documented. Calling this a capability difference rather than measured throughput superiority is a sound inference given absent benchmarks.
- maintenance:0 — supported: Re-read for this new saved digest. The backup alternatives, incomplete open-copy risk, lack of exposed server and application/OS access responsibility all follow from Meridian’s complete original.
- maintenance:1 — supported: Re-read for this new saved digest. Boreal’s update/access/backup/restore/monitoring/recovery duties, logical export, extra HA configuration and no uninterrupted-failover promise remain within the supplied fixture.
- validation:0 — supported: Re-read for this new saved digest. No measured performance/cost winner is supported by these fictional materials; the text accurately states the missing comparative data.
- validation:1 — supported: Re-read for this new saved digest. The full supplied documents provide no application-specific instance count, workload conflicts, filesystem topology, recovery targets or restore results. The conditional information request is useful and not a fabricated fact.
- brief:decision:0 — supported: Re-read for this new saved digest. The brief retains the report’s conditional candidate split, rather than an unsupported blanket recommendation.
- brief:decision:1 — supported: Re-read for this new saved digest. The shared-filesystem, conflict/retry and workload-tuning qualifications are explicit in the original sources and correctly preserved.
- brief:retain:0 — supported: Re-read for this new saved digest. The brief keeps the important inference: embedded does not eliminate backup/access work, while separate-service operational duties are specifically documented.
- brief:retain:1 — supported: Re-read for this new saved digest. The open-file backup and HA/failover qualifications remain exact in meaning and useful to a downstream author.
- brief:retain:2 — supported: Re-read for this new saved digest. The evidence-data limitation and resulting lack of a measured comparative winner are supported and preserved during shortening.
