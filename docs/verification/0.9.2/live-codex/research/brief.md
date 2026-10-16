# SQLite WAL: an application team's enablement decision
Run: 76c693a80fa045c6a7e090cf; output revision: 29; status: complete.

fact-4aa91348147e499694c7c71eba6d0839: Each SQLite WAL reader retains its last-valid-commit end mark throughout the transaction, yielding a stable snapshot.
fact-1139b327046b48c2a32dc776a5a1397b: A SQLite WAL reader uses the latest page copy before its end mark, falling back to the original database when no eligible WAL copy exists.
fact-1006ab1b3eb046bd82312efb19c5f732: SQLite WAL allows readers and a writer to operate concurrently but permits only one writer at a time.
fact-fe3aeb5b61b440ba86a8e63def835b0c: SQLite WAL queries can still return SQLITE_BUSY during exclusive locking, last-connection cleanup, or crash recovery.
fact-43180b3e4ea04b738edb40756af9d65b: A SQLite WAL read-to-write upgrade from an outdated snapshot fails with SQLITE_BUSY_SNAPSHOT and requires releasing the snapshot and starting a new transaction.
fact-9a663a901c1748e19b1d9640459ef4fc: SQLite BEGIN IMMEDIATE avoids later stale-snapshot upgrades by starting a write transaction immediately and blocking competing writers.
fact-17b74af582864435adaabe05e9586ff8: SQLite BEGIN IMMEDIATE can itself fail with SQLITE_BUSY when another connection already has an active write transaction.
fact-682d75b73c164687a076ad0d89200200: SQLite implicit transactions commit when the last active statement finishes; resetting or finalizing prepared statements guarantees statement completion.
fact-3f360a95ceec4bbf81148cde65602f74: A SQLite checkpoint transfers committed WAL transactions back into the database file.
fact-ae5e37a33e1a4aa6b423f7a130b8e3b4: SQLite automatically checkpoints at commits reaching 1000 WAL pages by default; applications can adjust or disable this threshold.
fact-44a1beaee67144f99d7bec6350bb3f79: SQLite automatic checkpoints use PASSIVE mode, which makes available progress without waiting for readers or writers and may finish incompletely.
fact-198269c968114d8f9a5278b878cca881: SQLite FULL checkpoints wait for the writer and sufficiently current reader snapshots, then checkpoint and sync; they block new writers while allowing readers.
fact-5fc64c6e26f64d838fe1e5bf5196a3bf: SQLite RESTART additionally waits for readers to finish using the WAL, and TRUNCATE also shrinks it to zero bytes; busy-handler refusal can instead leave either incomplete with SQLITE_BUSY.
fact-a9ce58a0a1884809befd0a266a5e020d: SQLite WAL growth can persist when overlapping readers prevent reset, automatic checkpoints are disabled, or a large write transaction prevents resetting the WAL until it finishes.
fact-090c20c597474a288320158beec89c87: SQLite normally recycles the WAL by overwriting from its beginning rather than truncating it, so checkpoint completion does not ordinarily reduce its physical file size.
fact-150e23e2d388496bb704f3799a1f61e5: SQLite runs automatic checkpoints in the committing thread by default, making some commits much slower; applications can move periodic checkpoints to another thread or process.
fact-545fd5cefbeb4ee7b4378e98aba888e2: In WAL mode, synchronous=FULL syncs the WAL after each transaction commit and provides atomicity, consistency, isolation and durability.
fact-7576abaf8c9f4334a83f275d37fdef66: WAL with synchronous=NORMAL remains consistent, but committed transactions may roll back after power loss or a system crash; transactions survive application crashes.
fact-f7901e77e59e4b9aa5536951d3837237: With synchronous=OFF, SQLite skips syncing; an application crash leaves data safe, but operating-system failure or power loss can corrupt the database.
fact-0d5f1e4cfb024f98ac22849c0db7cd9c: With synchronous=NORMAL in WAL mode, synchronization occurs around checkpoints and WAL reuse rather than during most transactions.
fact-826a960988084e4ca75fb2224950ed07: SQLite durability relies on the operating system and storage honoring synchronization requests; SQLite assumes flush or fsync waits for pending file writes to finish.
fact-93be901d07774c279c03c857d5066170: The WAL file is persistent database state; separating it from the database during copying or moving can lose committed transactions or corrupt the database.
fact-374bba01b2534a569a03beff81fffbe4: After the last connection crashes, the first new connection performs recovery while holding an exclusive lock, and concurrent queries can receive SQLITE_BUSY.
fact-e3a042ff1d034c289671215482448e4d: SQLite documents the Online Backup API and VACUUM INTO as methods for backing up a live database.
fact-4c960a3bcf414775841354e9e8b945e6: SQLite WAL permits concurrent readers and a writer, but can be slightly slower for applications that mostly read and seldom write.
fact-f4d85a48f2b449658b29daaf812d23f0: PRAGMA journal_mode=WAL enables WAL only if the returned journal mode is wal; conversion can fail when the VFS lacks shared-memory support.
fact-f5cee22a58cc4ac4b39328a943a7c50d: WAL mode persists across database reopenings and applies to all connections accessing the same database file.
fact-b89ed03c8319488f91a27461e673eb77: Every new SQLite connection starts with automatic checkpointing enabled at the default threshold, so checkpoint configuration is connection-specific.
fact-cf8da9b4736744b9afa01b88f182c503: A SQLite busy timeout installs a connection's busy handler to wait before returning SQLITE_BUSY and replaces any existing handler.
fact-c5497525bf21424681e54515a3beb457: SQLite fixed the rare WAL-reset corruption race in 3.51.3 and later, with backports in 3.44.6 and 3.50.7.
fact-ddfa4513a46444db94368c77f2f91809: The WAL-reset bug affects concurrent connections in separate threads or processes that attempt writing or checkpointing simultaneously.
fact-013a4cb7c0c248cc9daab75bbdffc497: SQLite WAL requires database users on the same host and does not work over a network filesystem.
fact-7e0dc73bf47c43a1a053d466581fc2e6: Transactions updating multiple ATTACHed SQLite databases are atomic per database in WAL mode, but not atomic across the database set.
fact-628f1e6e75b641c092c249492aca168b: SQLite cannot change page_size while in WAL mode; changing it requires a rollback journal mode.
fact-96e617b4c6f24ea59e804e696aea4311: Read-only WAL access requires readable existing sidecars, permission to create them, or an immutable connection; this support began in SQLite 3.22.0.
fact-c6df07cffe894ed7a461fd5013c2ed84: SQLite WAL's old large-transaction efficiency limitation was removed in 3.11.0, but large write transactions can still produce large WAL files before checkpointing.
fact-de3643a0e3cb42cf8ff03dbb6f25a654: SQLite WAL writes changes and a commit record to the WAL, allowing a commit without writing to the original database file.
fact-0415e9580e9e46978877c9c56c586a68: SQLite PRAGMA wal_checkpoint returns a busy indicator, WAL page count and checkpointed page count for assessing checkpoint progress.
