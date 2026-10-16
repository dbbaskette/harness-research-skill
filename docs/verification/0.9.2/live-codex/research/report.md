# SQLite WAL: an application team's enablement decision

Request: SQLite WAL mode for an application team deciding whether to enable it: reader/writer interaction, checkpoints, durability, limitations and practical decision guidance; focused, sqlite.org documentation first

Run: 76c693a80fa045c6a7e090cf; output revision: 29.
Status: complete. Depth: light. Started 2026-10-16; updated 2026-10-16.
Runtime: 0.9.2; guidance: 0.9.2 (local runtime guidance).

Focused public-documentation research for an application team: explain WAL mechanics and reader/writer interaction, checkpoint policy and operations, durability settings, deployment limitations, safe enablement and version caveats. Prefer sqlite.org primary documentation; no workload benchmark or application-specific validation. Assumed local-host file-backed database. Eight questions across four sections keep this narrow request focused.

Sources given: none; further public sources were permitted.
Counts: 8 questions (8 answered, 0 partly, 0 not answered or not yet assessed); 38 current checked facts from 13 sources; 0 rejected, 2 narrowed; 0 gaps; 0 conflicts.
How facts were checked: each fact by a separate invocation from the one that researched it, against the original source (checkers: /root/checker\_a on codex, /root/checker\_b on codex, /root/checker\_c on codex, /root/checker\_d on codex).
Prose: citation and number validation, but no independent semantic writing review at light depth.
Facts are checked for source support, not certified as true or live-current.

Plan notes: light depth usually plans 15 to 25 questions; this plan has 8. That suits a narrow request; otherwise add questions. light depth usually covers 6 to 10 sections; this plan has 4.

## Contents

- [Coverage](#coverage)
- [How WAL changes reader and writer interaction](#how-wal-changes-reader-and-writer-interaction)
- [Checkpoints and WAL growth](#checkpoints-and-wal-growth)
- [Durability and recovery](#durability-and-recovery)
- [Enablement decision and limitations](#enablement-decision-and-limitations)
- [Gaps](#gaps)
- [Conflicts and history](#conflicts-and-history)
- [Sources](#sources)
- [Rejected facts and failed tasks](#rejected-facts-and-failed-tasks)

## Coverage

- How WAL changes reader and writer interaction: 9 current checked facts; 2/2 questions answered with current evidence.
- Checkpoints and WAL growth: 9 current checked facts; 2/2 questions answered with current evidence.
- Durability and recovery: 9 current checked facts; 2/2 questions answered with current evidence.
- Enablement decision and limitations: 12 current checked facts; 2/2 questions answered with current evidence.

## How WAL changes reader and writer interaction

### How does a WAL commit work, what snapshot do readers see, and how many writers can run?

WAL gives readers stable snapshots alongside a writer; writes still serialize. [1]

SQLite appends changed pages and a commit record to the WAL, allowing a commit without first copying those changes into the main database file. [1] [4] Each read transaction keeps its own commit end mark: it reads the latest eligible page from the WAL, or falls back to the main database, so later commits do not change its snapshot. [1] Readers and a writer can run together, but only one writer can hold the database's write transaction at a time. [1]

Facts behind this answer:

- fact-4aa91348147e499694c7c71eba6d0839 [confirmed]: Each SQLite WAL reader retains its last-valid-commit end mark throughout the transaction, yielding a stable snapshot. [1]; as of unknown; one publisher.
  > each reader can potentially have its own end mark. But for any
  > 
  > particular reader, the end mark is unchanged for the duration of the
  > 
  > transaction, thus ensuring that a single read transaction only sees
  > 
  > the database content as it existed at a single point in time. [1], 2.2. Concurrency

- fact-1139b327046b48c2a32dc776a5a1397b [confirmed]: A SQLite WAL reader uses the latest page copy before its end mark, falling back to the original database when no eligible WAL copy exists. [1]; as of unknown; one publisher.
  > When a reader needs a page of content, it first checks the WAL to
  > 
  > see if that page appears there, and if so it pulls in the last copy
  > 
  > of the page that occurs in the WAL prior to the reader's end mark.
  > 
  > If no copy of the page exists in the WAL prior to the reader's end mark,
  > 
  > then the page is read from the original database file. [1], 2.2. Concurrency

- fact-1006ab1b3eb046bd82312efb19c5f732 [confirmed]: SQLite WAL allows readers and a writer to operate concurrently but permits only one writer at a time. [1]; as of unknown; one publisher.
  > Writers merely append new content to the end of the WAL file.
  > 
  > Because writers do nothing that would interfere with the actions of
  > 
  > readers, writers and readers can run at the same time. However,
  > 
  > since there is only one WAL file, there can only be one writer at
  > 
  > a time. [1], 2.2. Concurrency

- fact-de3643a0e3cb42cf8ff03dbb6f25a654 [confirmed]: SQLite WAL writes changes and a commit record to the WAL, allowing a commit without writing to the original database file. [1] [4]; as of unknown; one publisher.
  > The original content is preserved
  > 
  > in the database file and the changes are appended into a separate
  > 
  > WAL file. A COMMIT occurs when a special record indicating a commit
  > 
  > is appended to the WAL. Thus a COMMIT can happen without ever writing
  > 
  > to the original database [1], 2. How WAL Works
  > A COMMIT occurs when a special record indicating a commit
  > is appended to the WAL. Thus a COMMIT can happen without ever writing
  > to the original database, [4], 2. How WAL Works
  > Moving
  > the WAL file transactions back into the database is called a
  > "checkpoint". [4], 2.1. Checkpointing

### Which contention and stale-snapshot cases remain, and what transaction practices follow?

Handle lock contention and restart stale read-to-write transactions. [1] [2]

A transaction that reads an old snapshot and later tries to write can receive SQLITE\_BUSY\_SNAPSHOT; it must release that snapshot and begin a new transaction. [2] BEGIN IMMEDIATE acquires the write transaction up front for read-then-write work, preventing competing writers from invalidating that transaction's snapshot; it can itself return SQLITE\_BUSY if another writer is active. [2] [3] Queries can also return SQLITE\_BUSY during exclusive locking, last-connection cleanup, or crash recovery. [1] Implicit transactions finish when their last active statement finishes; resetting or finalizing statements guarantees completion. [3]

Facts behind this answer:

- fact-fe3aeb5b61b440ba86a8e63def835b0c [confirmed]: SQLite WAL queries can still return SQLITE\_BUSY during exclusive locking, last-connection cleanup, or crash recovery. [1]; as of unknown; one publisher.
  > If another database connection has the database mode open
  > 
  > in exclusive locking mode then all queries against the
  > 
  > database will return SQLITE\_BUSY. [1], 9. Sometimes Queries Return SQLITE\_BUSY In WAL Mode
  > When the last connection to a particular database is closing,
  > 
  > that connection will acquire an exclusive lock for a short time while
  > 
  > it cleans up the WAL and shared-memory files. If a separate attempt
  > 
  > is made to open and query the database while the first connection is
  > 
  > still in the middle of its cleanup process, the second connection
  > 
  > might get an SQLITE\_BUSY error. [1], 9. Sometimes Queries Return SQLITE\_BUSY In WAL Mode
  > If the last connection to a database crashed, then the first new
  > 
  > connection to open the database will start a recovery process. An
  > 
  > exclusive lock is held during recovery. So if a third database connection
  > 
  > tries to jump in and query while the second connection is running recovery,
  > 
  > the third connection will get an SQLITE\_BUSY error. [1], 9. Sometimes Queries Return SQLITE\_BUSY In WAL Mode

- fact-43180b3e4ea04b738edb40756af9d65b [confirmed]: A SQLite WAL read-to-write upgrade from an outdated snapshot fails with SQLITE\_BUSY\_SNAPSHOT and requires releasing the snapshot and starting a new transaction. [2]; as of unknown; one publisher.
  > The attempt by X to escalate its
  > 
  > transaction from a read transaction to a write transaction fails with an
  > 
  > SQLITE\_BUSY\_SNAPSHOT error because the snapshot of the database being
  > 
  > viewed by X is no longer the latest version of the database. If X were
  > 
  > allowed to write, it would fork the history of the database file, which is
  > 
  > something SQLite does not support. In order for X to write to the database,
  > 
  > it must first release its snapshot (using ROLLBACK for example) then
  > 
  > start a new transaction with a subsequent BEGIN. [2], Isolation And Concurrency

- fact-9a663a901c1748e19b1d9640459ef4fc [confirmed]: SQLite BEGIN IMMEDIATE avoids later stale-snapshot upgrades by starting a write transaction immediately and blocking competing writers. [2]; as of unknown; one publisher.
  > If X starts a transaction that will initially only read but X knows it
  > 
  > will eventually want to write and does not want to be troubled with
  > 
  > possible SQLITE\_BUSY\_SNAPSHOT errors that arise because another connection
  > 
  > jumped ahead of it in line, then X can issue BEGIN IMMEDIATE to start
  > 
  > its transaction instead of just an ordinary BEGIN. The BEGIN IMMEDIATE
  > 
  > command goes ahead and starts a write transaction, and thus blocks all
  > 
  > other writers. [2], Isolation And Concurrency

- fact-17b74af582864435adaabe05e9586ff8 [confirmed]: SQLite BEGIN IMMEDIATE can itself fail with SQLITE\_BUSY when another connection already has an active write transaction. [3]; as of unknown; one publisher.
  > IMMEDIATE causes the database connection to start a new write
  > 
  > immediately, without waiting for a write statement. The
  > 
  > BEGIN IMMEDIATE might fail with SQLITE\_BUSY if another write
  > 
  > transaction is already active on another database connection. [3], 2.2. DEFERRED, IMMEDIATE, and EXCLUSIVE transactions

- fact-682d75b73c164687a076ad0d89200200 [confirmed]: SQLite implicit transactions commit when the last active statement finishes; resetting or finalizing prepared statements guarantees statement completion. [3]; as of unknown; one publisher.
  > An implicit transaction (a transaction that is started automatically,
  > 
  > not a transaction started by BEGIN) is committed automatically when
  > 
  > the last active statement finishes. A statement finishes when its
  > 
  > last cursor closes, which is guaranteed to happen when the
  > 
  > prepared statement is reset or
  > 
  > finalized. [3], 2.3. Implicit versus explicit transactions


## Checkpoints and WAL growth

### What does a checkpoint do, when do automatic checkpoints run, and how do PASSIVE, FULL, RESTART and TRUNCATE differ?

Checkpoints copy committed WAL content into the database; the default policy favors nonblocking progress. [4] [5] [6]

By default, commits reaching 1000 WAL pages trigger an automatic checkpoint; the threshold is adjustable or can be disabled. [4] PASSIVE, used automatically, copies what it can without waiting for readers or writers and may leave work unfinished. [5] [6] FULL waits for the writer and sufficiently current reader snapshots, then checkpoints and syncs on success; it blocks new writers while allowing readers. [5] RESTART additionally waits until readers no longer need WAL content so the next writer can reuse the beginning; TRUNCATE additionally shrinks the WAL to zero bytes on success. [5] If the busy handler stops waiting, these aggressive modes can return SQLITE\_BUSY with only partial progress. [5]

Facts behind this answer:

- fact-3f360a95ceec4bbf81148cde65602f74 [confirmed]: A SQLite checkpoint transfers committed WAL transactions back into the database file. [4]; as of unknown; one publisher.
  > Moving
  > the WAL file transactions back into the database is called a
  > "checkpoint". [4], §2.1 Checkpointing

- fact-ae5e37a33e1a4aa6b423f7a130b8e3b4 [confirmed]: SQLite automatically checkpoints at commits reaching 1000 WAL pages by default; applications can adjust or disable this threshold. [4]; as of unknown; one publisher.
  > By default, SQLite will automatically checkpoint whenever a COMMIT
  > occurs that causes the WAL file to be 1000 pages or more in size, or when the
  > last database connection on a database file closes. [4], §3.1 Automatic Checkpoint
  > The automatic checkpoint
  > threshold can be changed or automatic checkpointing can be completely
  > disabled using the wal\_autocheckpoint pragma or by calling the
  > sqlite3\_wal\_autocheckpoint() C interface. [4], §3.1 Automatic Checkpoint

- fact-44a1beaee67144f99d7bec6350bb3f79 [confirmed]: SQLite automatic checkpoints use PASSIVE mode, which makes available progress without waiting for readers or writers and may finish incompletely. [5] [6]; as of unknown; one publisher.
  > All automatic checkpoints are PASSIVE. [6], PRAGMA wal\_autocheckpoint
  > Checkpoint as many frames as possible without waiting for any database
  > readers or writers to finish, then sync the database file if all frames
  > in the log were checkpointed. [5], SQLITE\_CHECKPOINT\_PASSIVE
  > On the other hand, passive mode might leave the checkpoint unfinished
  > if there are concurrent readers or writers. [5], SQLITE\_CHECKPOINT\_PASSIVE

- fact-198269c968114d8f9a5278b878cca881 [confirmed]: SQLite FULL checkpoints wait for the writer and sufficiently current reader snapshots, then checkpoint and sync; they block new writers while allowing readers. [5]; as of unknown; one publisher.
  > This mode blocks (it invokes the
  > busy-handler callback) until there is no
  > database writer and all readers are reading from the most recent database
  > snapshot. It then checkpoints all frames in the log file and syncs the
  > database file. This mode blocks new database writers while it is pending,
  > but new database readers are allowed to continue unimpeded. [5], SQLITE\_CHECKPOINT\_FULL

- fact-5fc64c6e26f64d838fe1e5bf5196a3bf [confirmed]: SQLite RESTART additionally waits for readers to finish using the WAL, and TRUNCATE also shrinks it to zero bytes; busy-handler refusal can instead leave either incomplete with SQLITE\_BUSY. [5]; as of unknown; one publisher.
  > This mode works the same way as SQLITE\_CHECKPOINT\_FULL with the addition
  > that after checkpointing the log file it blocks (calls the
  > busy-handler callback)
  > until all readers are reading from the database file only. This ensures
  > that the next writer will restart the log file from the beginning. [5], SQLITE\_CHECKPOINT\_RESTART
  > This mode works the same way as SQLITE\_CHECKPOINT\_RESTART with the
  > addition that it also truncates the log file to zero bytes just prior
  > to a successful return. [5], SQLITE\_CHECKPOINT\_TRUNCATE
  > If the busy-handler returns 0 before
  > the writer lock is obtained or while waiting for database readers, the
  > checkpoint operation proceeds from that point in the same way as
  > SQLITE\_CHECKPOINT\_PASSIVE - checkpointing as many frames as possible
  > without blocking any further. SQLITE\_BUSY is returned in this case. [5], Writer lock and busy-handler behavior

### Why can WAL grow or commits stall, and what should a team monitor or tune?

Watch checkpoint progress and long transactions, not just the WAL's physical file size. [4] [6]

Overlapping read transactions can prevent WAL reset, disabled checkpoints permit continued growth, and a large write transaction cannot reset the WAL before it finishes. [4] A completed checkpoint normally enables recycling the existing WAL space rather than shrinking the file, so a large file alone does not prove checkpoint failure. [4] PRAGMA wal\_checkpoint reports a busy indicator, WAL page count, and checkpointed page count to assess progress. [6] Automatic checkpoints run in the committing thread by default and can make occasional commits much slower; periodic checkpoints can instead run in another thread or process. [4]

Facts behind this answer:

- fact-a9ce58a0a1884809befd0a266a5e020d [confirmed]: SQLite WAL growth can persist when overlapping readers prevent reset, automatic checkpoints are disabled, or a large write transaction prevents resetting the WAL until it finishes. [4]; as of unknown; one publisher.
  > However, if a database has many concurrent overlapping readers
  > and there is always at least one active reader, then
  > no checkpoints will be able to complete
  > and hence the WAL file will grow without bound. [4], §6 Checkpoint starvation
  > If an application disables the
  > automatic checkpoint, then there is nothing to prevent the WAL file
  > from growing excessively. [4], §6 Disabling the automatic checkpoint mechanism
  > the WAL file cannot be reset in the middle of a write
  > transaction. So a large change to a large database
  > might result in a large WAL file. [4], §6 Very large write transactions

- fact-090c20c597474a288320158beec89c87 [confirmed]: SQLite normally recycles the WAL by overwriting from its beginning rather than truncating it, so checkpoint completion does not ordinarily reduce its physical file size. [4]; as of unknown; one publisher.
  > The checkpoint does not normally truncate the WAL file
  > (unless the journal\_size\_limit pragma is set). Instead, it merely
  > causes SQLite to start overwriting the WAL file from the beginning. [4], §6 Avoiding Excessively Large WAL Files

- fact-150e23e2d388496bb704f3799a1f61e5 [confirmed]: SQLite runs automatic checkpoints in the committing thread by default, making some commits much slower; applications can move periodic checkpoints to another thread or process. [4]; as of unknown; one publisher.
  > By default, the checkpoint will be
  > run automatically by the same thread that does the COMMIT that pushes
  > the WAL over its size limit. This has the effect of causing most
  > COMMIT operations to be very fast but an occasional COMMIT (those that trigger
  > a checkpoint) to be much slower. If that effect is undesirable, then
  > the application can disable automatic checkpointing and run the
  > periodic checkpoints in a separate thread, or separate process. [4], §2.3 Performance Considerations

- fact-0415e9580e9e46978877c9c56c586a68 [confirmed]: SQLite PRAGMA wal\_checkpoint returns a busy indicator, WAL page count and checkpointed page count for assessing checkpoint progress. [6]; as of unknown; one publisher.
  > The wal\_checkpoint pragma returns a single row with three
  > integer columns. The first column is usually 0 but will be
  > 1 if a RESTART or FULL or TRUNCATE checkpoint was blocked from completing, [6], PRAGMA wal\_checkpoint return values
  > The second column is the number of modified pages that have been
  > written to the write-ahead log file.
  > The third column is the number of pages in the write-ahead log file
  > that have been successfully moved back into the database file at
  > the conclusion of the checkpoint. [6], PRAGMA wal\_checkpoint return values


## Durability and recovery

### How do synchronous FULL, NORMAL and OFF affect WAL durability and consistency after application crash versus power or operating-system failure?

Choose FULL when acknowledged commits must survive power loss; NORMAL trades that durability for fewer syncs. [7]

In WAL mode, synchronous=FULL adds a WAL sync after each transaction commit and provides atomicity, consistency, isolation, and durability. [7] With synchronous=NORMAL, syncs occur around checkpoints and WAL reuse rather than most transactions; the database stays consistent, but power loss or an OS crash can roll back committed transactions. [7] An application crash alone does not lose committed transactions under NORMAL; synchronous=OFF also survives an application crash, but power loss or OS failure can corrupt the database. [7] Durability assumes the operating system and storage actually honor SQLite's synchronization requests. [9]

Facts behind this answer:

- fact-545fd5cefbeb4ee7b4378e98aba888e2 [confirmed]: In WAL mode, synchronous=FULL syncs the WAL after each transaction commit and provides atomicity, consistency, isolation and durability. [7]; as of unknown; one publisher.
  > FULL is atomic, consistent, isolated, and durable (ACID) in WAL mode and
  > is atomic, consistent, and isolated with a rollback journal. [7], PRAGMA synchronous
  > With synchronous=FULL in WAL mode, an additional
  > sync operation of the WAL file happens after each transaction commit.
  > The extra WAL sync following each transaction helps ensure that
  > transactions are durable across a power loss. [7], PRAGMA synchronous

- fact-7576abaf8c9f4334a83f275d37fdef66 [confirmed]: WAL with synchronous=NORMAL remains consistent, but committed transactions may roll back after power loss or a system crash; transactions survive application crashes. [7]; as of unknown; one publisher.
  > WAL mode is always consistent
  > with synchronous=NORMAL, but WAL mode does lose durability. A transaction
  > committed in WAL mode with synchronous=NORMAL might roll back following
  > a power loss or system crash. Transactions are durable across application
  > crashes regardless of the synchronous setting or journal mode. [7], PRAGMA synchronous

- fact-f7901e77e59e4b9aa5536951d3837237 [confirmed]: With synchronous=OFF, SQLite skips syncing; an application crash leaves data safe, but operating-system failure or power loss can corrupt the database. [7]; as of unknown; one publisher.
  > With synchronous OFF (0), SQLite continues without syncing
  > as soon as it has handed data off to the operating system.
  > If the application running SQLite crashes, the data will be safe, but
  > the database might become corrupted if the operating system
  > crashes or the computer loses power before that data has been written
  > to non-volatile storage. [7], PRAGMA synchronous

- fact-0d5f1e4cfb024f98ac22849c0db7cd9c [confirmed]: With synchronous=NORMAL in WAL mode, synchronization occurs around checkpoints and WAL reuse rather than during most transactions. [7]; as of unknown; one publisher.
  > In WAL mode when synchronous is NORMAL (1), the WAL file is
  > synchronized before each checkpoint and the database file is
  > synchronized after each completed checkpoint and the WAL file
  > header is synchronized when a WAL file begins to be reused after
  > a checkpoint, but no sync operations occur during most transactions. [7], PRAGMA synchronous

- fact-826a960988084e4ca75fb2224950ed07 [confirmed]: SQLite durability relies on the operating system and storage honoring synchronization requests; SQLite assumes flush or fsync waits for pending file writes to finish. [9]; as of unknown; one publisher.
  > SQLite assumes that the flush or fsync will not return until
  > all pending write operations for the file that is being flushed have
  > completed. [9], 2. Hardware Assumptions

### What must the team know about recovery, sidecar files, backups and safe database copying?

Treat the WAL as database state and use SQLite's live backup facilities. [4] [8]

A commit does not require a checkpoint, so committed data can still reside in the WAL rather than the main database file. [1] [4] Separating the database from its WAL while copying or moving it can lose committed transactions or corrupt the database; copying the main file alone is unsafe when committed changes remain in the WAL. [4] SQLite documents the Online Backup API and VACUUM INTO for backing up a live database. [8] After the last connection crashes, the first new connection performs recovery under an exclusive lock, and concurrent queries can receive SQLITE\_BUSY. [4]

Facts behind this answer:

- fact-93be901d07774c279c03c857d5066170 [confirmed]: The WAL file is persistent database state; separating it from the database during copying or moving can lose committed transactions or corrupt the database. [4]; as of unknown; one publisher.
  > The WAL file is part of the persistent state of the
  > database and should be kept with the database if the database is copied
  > or moved. If a database file is separated from its WAL file, then
  > transactions that were previously committed to the database might be lost,
  > or the database file might become corrupted. [4], 4. The WAL File

- fact-374bba01b2534a569a03beff81fffbe4 [confirmed]: After the last connection crashes, the first new connection performs recovery while holding an exclusive lock, and concurrent queries can receive SQLITE\_BUSY. [4]; as of unknown; one publisher.
  > If the last connection to a database crashed, then the first new
  > connection to open the database will start a recovery process. An
  > exclusive lock is held during recovery. So if a third database connection
  > tries to jump in and query while the second connection is running recovery,
  > the third connection will get an SQLITE\_BUSY error. [4], 9. Sometimes Queries Return SQLITE\_BUSY In WAL Mode

- fact-e3a042ff1d034c289671215482448e4d [confirmed]: SQLite documents the Online Backup API and VACUUM INTO as methods for backing up a live database. [8]; as of unknown; one publisher.
  > The Online Backup API is the original method for making backups of a
  > live SQLite databases. Other more recent techniques for accomplishing
  > the same thing include:
  > The VACUUM INTO command will make a vacuumed copy of a live
  > SQLite database into a separate file. [8], 1.1. Other Backup Techniques

- fact-de3643a0e3cb42cf8ff03dbb6f25a654 [confirmed]: SQLite WAL writes changes and a commit record to the WAL, allowing a commit without writing to the original database file. [1] [4]; as of unknown; one publisher.
  > The original content is preserved
  > 
  > in the database file and the changes are appended into a separate
  > 
  > WAL file. A COMMIT occurs when a special record indicating a commit
  > 
  > is appended to the WAL. Thus a COMMIT can happen without ever writing
  > 
  > to the original database [1], 2. How WAL Works
  > A COMMIT occurs when a special record indicating a commit
  > is appended to the WAL. Thus a COMMIT can happen without ever writing
  > to the original database, [4], 2. How WAL Works
  > Moving
  > the WAL file transactions back into the database is called a
  > "checkpoint". [4], 2.1. Checkpointing


## Enablement decision and limitations

### When is WAL a good fit, how is it enabled and verified, which connection settings need care, and which current version caveat matters?

WAL is a candidate for local applications needing reader/writer overlap, with explicit durability and checkpoint policies. [7] [10] [12]

Decision implication (inference): WAL improves reader/writer overlap, but does not add parallel writers, and mostly-read applications that seldom write can be slightly slower. [1] [10] Enable with PRAGMA journal\_mode=WAL and check that the returned mode is wal; the mode persists across reopenings and applies to all connections to that database file. [10] Automatic checkpoint configuration belongs to each connection; a busy timeout likewise installs a connection's busy handler and replaces any previous handler. [12] [13] Version check: SQLite fixed the rare WAL-reset corruption race in 3.51.3 and later, with backports in 3.44.6 and 3.50.7; it affects concurrent connections attempting writes or checkpoints simultaneously. [10] [14]

Facts behind this answer:

- fact-4c960a3bcf414775841354e9e8b945e6 [confirmed]: SQLite WAL permits concurrent readers and a writer, but can be slightly slower for applications that mostly read and seldom write. [10]; as of unknown; one publisher.
  > WAL provides more concurrency as readers do not block writers and 
  >  a writer does not block readers. Reading and writing can proceed 
  >  concurrently. [10], §1 Overview, advantages
  > WAL might be very slightly slower (perhaps 1% or 2% slower)
  >  than the traditional rollback-journal approach
  >  in applications that do mostly reads and seldom write. [10], §1 Overview, disadvantages

- fact-f4d85a48f2b449658b29daaf812d23f0 [confirmed]: PRAGMA journal\_mode=WAL enables WAL only if the returned journal mode is wal; conversion can fail when the VFS lacks shared-memory support. [10]; as of unknown; one publisher.
  > PRAGMA journal\_mode=WAL;
  > 
  > The journal\_mode pragma returns a string which is the new journal mode.
  > On success, the pragma will return the string "wal". If 
  > the conversion to WAL could not be completed (for example, if the VFS
  > does not support the necessary shared-memory primitives) then the
  > journaling mode will be unchanged and the string returned from the
  > primitive will be the prior journaling mode (for example "delete"). [10], §3 Activating And Configuring WAL Mode

- fact-f5cee22a58cc4ac4b39328a943a7c50d [confirmed]: WAL mode persists across database reopenings and applies to all connections accessing the same database file. [10]; as of unknown; one publisher.
  > Unlike the other journaling modes, 
  > PRAGMA journal\_mode=WAL is
  > persistent. If a process sets WAL mode, then closes and reopens the
  > database, the database will come back in WAL mode. [10], §3.3 Persistence of WAL mode
  > The WAL journal mode will be set on all
  > connections to the same database file if it is set on any one connection. [10], §3.3 Persistence of WAL mode

- fact-b89ed03c8319488f91a27461e673eb77 [confirmed]: Every new SQLite connection starts with automatic checkpointing enabled at the default threshold, so checkpoint configuration is connection-specific. [12]; as of unknown; one publisher.
  > Every new database connection defaults to having the auto-checkpoint
  > enabled with a threshold of 1000 or SQLITE\_DEFAULT\_WAL\_AUTOCHECKPOINT
  > pages. [12], Configure an auto-checkpoint

- fact-cf8da9b4736744b9afa01b88f182c503 [confirmed]: A SQLite busy timeout installs a connection's busy handler to wait before returning SQLITE\_BUSY and replaces any existing handler. [13]; as of unknown; one publisher.
  > This routine sets a busy handler that sleeps
  > for a specified amount of time when a table is locked. The handler
  > will sleep multiple times until at least "ms" milliseconds of sleeping
  > have accumulated. After at least "ms" milliseconds of sleeping,
  > the handler returns 0 which causes sqlite3\_step() to return
  > SQLITE\_BUSY. [13], Set A Busy Timeout
  > There can only be a single busy handler for a particular
  > database connection at any given moment. If another busy handler
  > was defined (using sqlite3\_busy\_handler()) prior to calling
  > this routine, that other busy handler is cleared. [13], Set A Busy Timeout

- fact-c5497525bf21424681e54515a3beb457 [confirmed]: SQLite fixed the rare WAL-reset corruption race in 3.51.3 and later, with backports in 3.44.6 and 3.50.7. [10] [14]; as of unknown; one publisher.
  > The bug is likely present in all version of SQLite from
  > 3.7.0 (2010-07-21) through 3.51.2 (2026-01-09). It is
  > fixed in version 3.51.3 (2026-03-13) and later. Backports of the fix
  > are available for some earlier releases:
  > 3.44.6 and
  > 3.50.7. [10], §11 The WAL-Reset Bug
  > Changes in this specific patch release, version 3.51.3 (2026-03-13):
  > 
  >  Fix the WAL-reset database corruption bug. [14], Changes in this specific patch release

- fact-ddfa4513a46444db94368c77f2f91809 [confirmed]: The WAL-reset bug affects concurrent connections in separate threads or processes that attempt writing or checkpointing simultaneously. [10]; as of unknown; one publisher.
  > The bug only affects databases in WAL mode when there are two or more
  > database connections open on the same file, in separate threads or processes,
  > and when those two connections attempt to write or checkpoint at the
  > same instant. [10], §11 The WAL-Reset Bug

### What limitations affect network filesystems, multiple databases, page size, read-only use, transaction size and write-heavy workloads?

WAL requires local-host access and has operational limits beyond write serialization. [1] [10]

All database users must run on the same host; WAL does not work over network filesystems. [10] Updates spanning ATTACHed databases are atomic per database but not across the set, and page\_size changes require leaving WAL for a rollback journal mode. [10] Read-only WAL support began in SQLite 3.22.0 and requires readable existing sidecars, permission to create them, or an immutable connection. [10] The old large-transaction efficiency limitation was removed in 3.11.0; large write transactions can still create large WAL files, and write-heavy workloads remain constrained by the single writer. [1] [10]

Facts behind this answer:

- fact-013a4cb7c0c248cc9daab75bbdffc497 [confirmed]: SQLite WAL requires database users on the same host and does not work over a network filesystem. [10]; as of unknown; one publisher.
  > All processes using a database must be on the same host computer;
  >  WAL does not work over a network filesystem. This is because WAL requires
  >  all processes to share a small amount of memory and processes on
  >  separate host machines obviously cannot share memory with each other. [10], §1 Overview, disadvantages

- fact-7e0dc73bf47c43a1a053d466581fc2e6 [confirmed]: Transactions updating multiple ATTACHed SQLite databases are atomic per database in WAL mode, but not atomic across the database set. [10]; as of unknown; one publisher.
  > Transactions that involve changes against multiple ATTACHed
  >  databases are atomic for each individual database, but are not
  >  atomic across all databases as a set. [10], §1 Overview, disadvantages

- fact-628f1e6e75b641c092c249492aca168b [confirmed]: SQLite cannot change page\_size while in WAL mode; changing it requires a rollback journal mode. [10]; as of unknown; one publisher.
  > It is not possible to change the page\_size after entering WAL
  >  mode, either on an empty database or by using VACUUM or by restoring
  >  from a backup using the backup API. You must be in a rollback journal
  >  mode to change the page size. [10], §1 Overview, disadvantages

- fact-96e617b4c6f24ea59e804e696aea4311 [confirmed]: Read-only WAL access requires readable existing sidecars, permission to create them, or an immutable connection; this support began in SQLite 3.22.0. [10]; as of unknown; one publisher.
  > This constraint was relaxed beginning with
  > SQLite version 3.22.0 (2018-01-22).
  > 
  > On newer versions of SQLite,
  > a WAL-mode database on read-only media, or a WAL-mode database that lacks
  > write permission, can still be read as long as one or more of the following
  > conditions are met:
  > 
  > The -shm and -wal files already exist and are readable.
  > 
  > There is write permission on the directory containing the database so
  >  that the -shm and -wal files can be created.
  > 
  > The database connection is opened using the
  >  immutable query parameter. [10], §5 Read-Only Databases

- fact-c6df07cffe894ed7a461fd5013c2ed84 [confirmed]: SQLite WAL's old large-transaction efficiency limitation was removed in 3.11.0, but large write transactions can still produce large WAL files before checkpointing. [10]; as of unknown; one publisher.
  > Beginning with version 3.11.0 (2016-02-15), 
  >  WAL mode works as efficiently with
  >  large transactions as does rollback mode. [10], §1 Overview, updated large-transaction limitation
  > Very large write transactions.
  > A checkpoint can only complete when no other transactions are running, 
  > which means the WAL file cannot be reset in the middle of a write
  > transaction. So a large change to a large database
  > might result in a large WAL file. [10], §6 Avoiding Excessively Large WAL Files


## Gaps

None recorded.

## Conflicts and history

- fact-26b92339b1944431a3b897868aa202bb → fact-de3643a0e3cb42cf8ff03dbb6f25a654 (narrowed): The source says a commit can happen without writing the database; automatic checkpointing can write the database during the commit path, so the unconditional original wording is too strong.
- fact-a7df2a880f8a442bbee1c55840448d19 → fact-0415e9580e9e46978877c9c56c586a68 (narrowed): The pragma returns progress counts, not the physical WAL file size; removing the ambiguous alongside-file-size wording keeps the assertion within its cited return-value documentation.
- fact-b0d30ab5e38644c1b5589d99d8f45192 aliases fact-de3643a0e3cb42cf8ff03dbb6f25a654.

## Sources

1. [Write-Ahead Logging](https://www.sqlite.org/wal.html); SQLite project; primary; found; saved 2026-10-16T17:53:08.148Z; source date unknown.
2. [Isolation In SQLite](https://www.sqlite.org/isolation.html); SQLite project; primary; found; saved 2026-10-16T17:53:08.149Z; source date unknown.
3. [Transaction](https://www.sqlite.org/lang_transaction.html); SQLite project; primary; found; saved 2026-10-16T17:53:08.150Z; source date unknown.
4. [Write-Ahead Logging](https://sqlite.org/wal.html); SQLite project; primary; found; saved 2026-10-16T17:53:30.500Z; source date unknown.
5. [Checkpoint a database](https://sqlite.org/c3ref/wal_checkpoint_v2.html); SQLite project; primary; found; saved 2026-10-16T17:53:30.501Z; source date unknown.
6. [Pragma statements supported by SQLite](https://sqlite.org/pragma.html); SQLite project; primary; found; saved 2026-10-16T17:53:30.503Z; source date unknown.
7. [PRAGMA Statements — synchronous](https://sqlite.org/pragma.html#pragma_synchronous); SQLite project; primary; found; saved 2026-10-16T17:53:36.317Z; source date unknown.
8. [SQLite Backup API](https://sqlite.org/backup.html); SQLite project; primary; found; saved 2026-10-16T17:53:36.320Z; source date unknown.
9. [Atomic Commit In SQLite](https://sqlite.org/atomiccommit.html); SQLite project; primary; found; saved 2026-10-16T17:53:36.321Z; source date unknown.
10. [Write-Ahead Logging](https://sqlite.org/wal.html); SQLite project; primary; found; saved 2026-10-16T17:53:49.490Z; source date 2026-08-25.
11. [PRAGMA Statements](https://sqlite.org/pragma.html); SQLite project; primary; found; saved 2026-10-16T17:53:49.492Z; source date unknown.
12. [Configure an auto-checkpoint](https://sqlite.org/c3ref/wal_autocheckpoint.html); SQLite project; primary; found; saved 2026-10-16T17:53:49.493Z; source date unknown.
13. [Set A Busy Timeout](https://sqlite.org/c3ref/busy_timeout.html); SQLite project; primary; found; saved 2026-10-16T17:53:49.493Z; source date unknown.
14. [SQLite Release 3.51.3](https://sqlite.org/releaselog/3_51_3.html); SQLite project; primary; found; saved 2026-10-16T17:53:49.494Z; source date 2026-03-13.

## Rejected facts and failed tasks

