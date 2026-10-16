# SQLite WAL: an application team's enablement guide

Request: How SQLite write-ahead logging (WAL) works for an application team deciding whether to enable it: reader/writer interaction, checkpoints, durability, and limitations. Focused decision report; public sources, sqlite.org documentation first; assume a single-host deployment.

Run: 84c16de8f7574291b49a6495; output revision: 23.
Status: complete. Depth: light. Started 2026-10-16; updated 2026-10-16.
Runtime: 0.9.4; guidance: 0.9.4 (local runtime guidance).

Focused decision support for a typical single-host application: reader/writer interaction, checkpoints, durability and operational limits. Public primary documentation first; no workload benchmarking or deployment changes. Seven questions in three sections keep this narrow request focused.

Sources given: none; further public sources were permitted.
Counts: 7 questions (7 answered, 0 partly, 0 not answered or not yet assessed); 35 current checked facts from 12 sources; 0 rejected, 2 narrowed; 0 gaps; 0 conflicts.
How facts were checked: each fact by a separate invocation from the one that researched it, against the original source (checkers: /root on codex).
Prose: citation and number validation, but no independent semantic writing review at light depth.
Facts are checked for source support, not certified as true or live-current.

Plan notes: light depth usually plans 15 to 25 questions; this plan has 7. That suits a narrow request; otherwise add questions. light depth usually covers 6 to 10 sections; this plan has 3.

## Contents

- [Coverage](#coverage)
- [How readers and writers interact](#how-readers-and-writers-interact)
- [Checkpoints and WAL growth](#checkpoints-and-wal-growth)
- [Durability, limitations and enablement](#durability-limitations-and-enablement)
- [Gaps](#gaps)
- [Conflicts and history](#conflicts-and-history)
- [Sources](#sources)
- [Rejected facts and failed tasks](#rejected-facts-and-failed-tasks)

## Coverage

- How readers and writers interact: 8 current checked facts; 2/2 questions answered with current evidence.
- Checkpoints and WAL growth: 12 current checked facts; 2/2 questions answered with current evidence.
- Durability, limitations and enablement: 15 current checked facts; 3/3 questions answered with current evidence.

## How readers and writers interact

### How do WAL commits and reader snapshots work, and how many writers can proceed?

WAL lets readers overlap with a writer, while writes still serialize. [1]

Changes append to the WAL, and a commit record commits them before they reach the main database. [1] Each read transaction keeps a fixed snapshot: it selects the newest eligible WAL page before its end mark, otherwise reading the main database. [1]

<details>
<summary>Facts behind this answer (4)</summary>

- fact-463148af11134eb999da6952acde86d0 [confirmed]: WAL preserves the main database while appending changes to a separate log; appending a commit record commits the transaction before its changes reach the main database. [1]; as of unknown; one publisher.
  > The WAL approach inverts this. The original content is preserved in the database file and the changes are appended into a separate WAL file. A COMMIT occurs when a special record indicating a commit is appended to the WAL. [1], 2. How WAL Works

- fact-1be289cae0e749189e77c8ec580eea8b [confirmed]: A WAL reader records an end mark at transaction start and keeps the same committed snapshot throughout that read transaction. [1]; as of unknown; one publisher.
  > When a read operation begins on a WAL-mode database, it first remembers the location of the last valid commit record in the WAL. Call this point the "end mark". Because the WAL can be growing and adding new commit records while various readers connect to the database, each reader can potentially have its own end mark. But for any particular reader, the end mark is unchanged for the duration of the transaction, thus ensuring that a single read transaction only sees the database content as it existed at a single point in time. [1], 2.2. Concurrency

- fact-7064c1dce0a749d08f0c68454d082e4f [confirmed]: A reader uses the latest page version before its end mark from the WAL, falling back to the main database when the WAL has no eligible copy. [1]; as of unknown; one publisher.
  > When a reader needs a page of content, it first checks the WAL to see if that page appears there, and if so it pulls in the last copy of the page that occurs in the WAL prior to the reader's end mark. If no copy of the page exists in the WAL prior to the reader's end mark, then the page is read from the original database file. [1], 2.2. Concurrency

- fact-7f1d8a5f7e9c4c499637342916b8bac9 [confirmed]: Readers and a writer can run concurrently in WAL mode, but only one writer can operate at a time. [1]; as of unknown; one publisher.
  > Writers merely append new content to the end of the WAL file. Because writers do nothing that would interfere with the actions of readers, writers and readers can run at the same time. However, since there is only one WAL file, there can only be one writer at a time. [1], 2.2. Concurrency

</details>

### What contention and read-to-write transaction behavior must an application handle?

Applications still need busy handling and transaction retries. [1] [2]

If another connection commits after a read snapshot starts, upgrading that snapshot to writing can fail with SQLITE\_BUSY\_SNAPSHOT; roll back and restart the transaction rather than retrying its write against the old snapshot. [2] BEGIN IMMEDIATE acquires write access before reading and avoids that upgrade problem, but can initially return SQLITE\_BUSY and holds other writers out. [2] [3] A busy timeout can wait for transient locks; recovery, exclusive locking and final-close cleanup can still make WAL queries busy. [1] [4]

<details>
<summary>Facts behind this answer (4)</summary>

- fact-9c714d223ab64d60a28281243f54719d [confirmed]: A read transaction whose snapshot became stale cannot upgrade to writing: SQLITE\_BUSY\_SNAPSHOT requires releasing that snapshot and starting a new transaction. [2]; as of unknown; one publisher.
  > Another example: X starts a read transaction using BEGIN and SELECT, then Y makes a changes to the database using UPDATE. Then X tries to make a change to the database using UPDATE. The attempt by X to escalate its transaction from a read transaction to a write transaction fails with an SQLITE\_BUSY\_SNAPSHOT error because the snapshot of the database being viewed by X is no longer the latest version of the database. If X were allowed to write, it would fork the history of the database file, which is something SQLite does not support. In order for X to write to the database, it must first release its snapshot (using ROLLBACK for example) then start a new transaction with a subsequent BEGIN. [2], Isolation And Concurrency

- fact-d5486e45e5ce40e0ac6560c8e96375a5 [confirmed]: BEGIN IMMEDIATE reserves the write transaction before reading and blocks other writers, avoiding stale-snapshot upgrades, but it can itself return SQLITE\_BUSY when another writer is active. [2] [3]; as of unknown; one publisher.
  > If X starts a transaction that will initially only read but X knows it will eventually want to write and does not want to be troubled with possible SQLITE\_BUSY\_SNAPSHOT errors that arise because another connection jumped ahead of it in line, then X can issue BEGIN IMMEDIATE to start its transaction instead of just an ordinary BEGIN. The BEGIN IMMEDIATE command goes ahead and starts a write transaction, and thus blocks all other writers. [2], Isolation And Concurrency
  > IMMEDIATE causes the database connection to start a new write immediately, without waiting for a write statement. The BEGIN IMMEDIATE might fail with SQLITE\_BUSY if another write transaction is already active on another database connection. [3], 2.2. DEFERRED, IMMEDIATE, and EXCLUSIVE transactions

- fact-937da299f3dd459584bc5533e54a8e10 [confirmed]: Even WAL queries can return SQLITE\_BUSY during exclusive locking, final-connection cleanup or crash recovery, so applications must handle busy results. [1]; as of unknown; one publisher.
  > If another database connection has the database mode open in exclusive locking mode then all queries against the database will return SQLITE\_BUSY. [1], 9. Sometimes Queries Return SQLITE\_BUSY In WAL Mode
  > When the last connection to a particular database is closing, that connection will acquire an exclusive lock for a short time while it cleans up the WAL and shared-memory files. If a separate attempt is made to open and query the database while the first connection is still in the middle of its cleanup process, the second connection might get an SQLITE\_BUSY error. [1], 9. Sometimes Queries Return SQLITE\_BUSY In WAL Mode
  > If the last connection to a database crashed, then the first new connection to open the database will start a recovery process. An exclusive lock is held during recovery. So if a third database connection tries to jump in and query while the second connection is running recovery, the third connection will get an SQLITE\_BUSY error. [1], 9. Sometimes Queries Return SQLITE\_BUSY In WAL Mode

- fact-e0317b006dce4276962d2fb5fa546607 [confirmed]: sqlite3\_busy\_timeout installs a handler that sleeps while locks persist, then returns SQLITE\_BUSY after the configured accumulated waiting time. [4]; as of unknown; one publisher.
  > This routine sets a busy handler that sleeps for a specified amount of time when a table is locked. The handler will sleep multiple times until at least "ms" milliseconds of sleeping have accumulated. After at least "ms" milliseconds of sleeping, the handler returns 0 which causes sqlite3\_step() to return SQLITE\_BUSY. [4], Set A Busy Timeout

</details>


## Checkpoints and WAL growth

### What does a checkpoint do, when does automatic checkpointing run, and how do checkpoint modes differ?

A checkpoint copies committed WAL changes into the main database. [5]

Automatic checkpoints default to PASSIVE after commits leave WAL at least 1000 pages long; the threshold is configurable, and SQLite also checkpoints at final connection close. [5] [7] PASSIVE copies what it can without waiting; FULL waits for the writer and older reader snapshots, blocking new writers while readers proceed. [6] RESTART also waits until readers release the WAL so it can be reused; TRUNCATE additionally shrinks it on success. [6] These waiting modes can return SQLITE\_BUSY with partial progress, so inspect the result rather than assuming completion. [6]

<details>
<summary>Facts behind this answer (6)</summary>

- fact-32162a7bae7543028b239dbd705b2f4b [confirmed]: A checkpoint transfers transactions from the WAL back into the original database file. [5]; as of unknown; one publisher.
  > Of course, one wants to eventually transfer all the transactions that
  > are appended in the WAL file back into the original database. Moving
  > the WAL file transactions back into the database is called a
  > "checkpoint". [5], 2.1 Checkpointing

- fact-669816523ce248e89d4a6a84d759c134 [confirmed]: PASSIVE checkpoints copy as many frames as possible without waiting for readers or writers, never call the busy handler, and may remain incomplete. [6]; as of unknown; one publisher.
  > Checkpoint as many frames as possible without waiting for any database
  > readers or writers to finish, then sync the database file if all frames
  > in the log were checkpointed. The busy-handler callback
  > is never invoked in the SQLITE\_CHECKPOINT\_PASSIVE mode.
  > On the other hand, passive mode might leave the checkpoint unfinished
  > if there are concurrent readers or writers. [6], SQLITE\_CHECKPOINT\_PASSIVE

- fact-32c3669f717841aabe03395561445cff [confirmed]: FULL checkpoints wait for the writer and older reader snapshots, then checkpoint and sync all frames; new writers block while new readers can proceed. [6]; as of unknown; one publisher.
  > This mode blocks (it invokes the
  > busy-handler callback) until there is no
  > database writer and all readers are reading from the most recent database
  > snapshot. It then checkpoints all frames in the log file and syncs the
  > database file. This mode blocks new database writers while it is pending,
  > but new database readers are allowed to continue unimpeded. [6], SQLITE\_CHECKPOINT\_FULL

- fact-e4d5524f34144cb69880830ccf34c7d0 [confirmed]: RESTART adds waiting until readers use only the database file so the next writer can reuse WAL; TRUNCATE additionally shrinks WAL to zero bytes on success. [6]; as of unknown; one publisher.
  > This mode works the same way as SQLITE\_CHECKPOINT\_FULL with the addition
  > that after checkpointing the log file it blocks (calls the
  > busy-handler callback)
  > until all readers are reading from the database file only. This ensures
  > that the next writer will restart the log file from the beginning.
  > Like SQLITE\_CHECKPOINT\_FULL, this mode blocks new
  > database writer attempts while it is pending, but does not impede readers. [6], SQLITE\_CHECKPOINT\_RESTART
  > This mode works the same way as SQLITE\_CHECKPOINT\_RESTART with the
  > addition that it also truncates the log file to zero bytes just prior
  > to a successful return. [6], SQLITE\_CHECKPOINT\_TRUNCATE

- fact-215cc15872d340ea8d2a298711f31203 [confirmed]: PRAGMA wal\_checkpoint returns three columns: busy status, WAL pages and checkpointed pages; status 1 means the equivalent API call would return SQLITE\_BUSY. [7]; as of unknown; one publisher.
  > The wal\_checkpoint pragma returns a single row with three
  >  integer columns. The first column is usually 0 but will be
  >  1 if a RESTART or FULL or TRUNCATE checkpoint was blocked from completing,
  >  for example because another thread or process was actively
  >  using the database. In other words, the first column is 0 if the
  >  equivalent call to sqlite3\_wal\_checkpoint\_v2() would have returned
  >  SQLITE\_OK or 1 if the equivalent call would have returned SQLITE\_BUSY. [7], PRAGMA wal\_checkpoint result
  > The second column is the number of modified pages that have been
  >  written to the write-ahead log file.
  >  The third column is the number of pages in the write-ahead log file
  >  that have been successfully moved back into the database file at
  >  the conclusion of the checkpoint. [7], PRAGMA wal\_checkpoint result

- fact-6eb7df9ae9724f199a72d79041d7f724 [confirmed]: SQLite defaults to automatic PASSIVE checkpoints after commits leave WAL at least 1000 pages long, with the threshold configurable; SQLite also checkpoints when the last connection closes. [5] [7]; as of unknown; one publisher.
  > By default, SQLite will automatically checkpoint whenever a COMMIT
  > occurs that causes the WAL file to be 1000 pages or more in size, or when the 
  > last database connection on a database file closes. The default 
  > configuration is intended to work well for most applications. [5], 3.1 Automatic Checkpoint
  > This pragma is a wrapper around the
  >  sqlite3\_wal\_autocheckpoint() C interface.
  >  All automatic checkpoints are PASSIVE. [7], PRAGMA wal\_autocheckpoint

</details>

### How do long readers, WAL growth and checkpoint scheduling affect operational performance?

Long readers can prevent checkpoint progress and WAL reuse. [5]

Continuously overlapping readers can cause unbounded WAL growth; checkpoints need opportunities when readers release it. [5] Larger WALs hurt reads, while automatic checkpoint work can slow triggering commits; separate checkpoint scheduling is available if latency warrants it. [5] Normal reuse does not shrink the file, so monitor checkpoint progress rather than file size alone: PRAGMA wal\_checkpoint(PASSIVE) returns busy status, WAL pages and checkpointed pages. [5] [6] [7]

<details>
<summary>Facts behind this answer (6)</summary>

- fact-2073a444dbe14d5d86c8d6e347f9bd7b [confirmed]: Overlapping readers that never release WAL can prevent its reset and cause unbounded growth; scheduling checkpoints during reader gaps avoids this starvation. [5]; as of unknown; one publisher.
  > However, if a database has many concurrent overlapping readers
  > and there is always at least one active reader, then
  > no checkpoints will be able to complete
  > and hence the WAL file will grow without bound.
  > 
  > This scenario can be avoided by ensuring that there are "reader gaps":
  > times when no processes are reading from the 
  > database and that checkpoints are attempted during those times. [5], 6 Avoiding Excessively Large WAL Files

- fact-a6e235a9ed7241fcba5e748dade72f0d [confirmed]: Ordinary checkpoints recycle WAL for overwriting rather than truncate its file, so a large file alone does not prove checkpoint failure. [5]; as of unknown; one publisher.
  > In normal cases, new content is appended to the WAL file until the
  > WAL file accumulates about 1000 pages (and is thus about 4MB 
  > in size) at which point a checkpoint is automatically run and the WAL file
  > is recycled. The checkpoint does not normally truncate the WAL file
  > (unless the journal\_size\_limit pragma is set). Instead, it merely
  > causes SQLite to start overwriting the WAL file from the beginning.
  > This is done because it is normally faster to overwrite an existing file
  > than to append. [5], 6 Avoiding Excessively Large WAL Files

- fact-de9c558e76524318aff47bdcd2afe233 [confirmed]: Automatic checkpoint work runs in the COMMIT thread and can slow occasional commits; applications can move periodic checkpoints to a separate thread or process. [5]; as of unknown; one publisher.
  > By default, the checkpoint will be
  > run automatically by the same thread that does the COMMIT that pushes
  > the WAL over its size limit. This has the effect of causing most
  > COMMIT operations to be very fast but an occasional COMMIT (those that trigger
  > a checkpoint) to be much slower. If that effect is undesirable, then
  > the application can disable automatic checkpointing and run the
  > periodic checkpoints in a separate thread, or separate process. [5], 2.3 Performance Considerations

- fact-1357ac6cdc48482aaa6b70087bff2084 [confirmed]: Larger WAL files reduce read performance, making checkpoint frequency a tradeoff between read speed and amortized write cost. [5]; as of unknown; one publisher.
  > On the other hand, read performance deteriorates as the WAL file
  > grows in size since each reader must check the WAL file for the content
  > and the time needed to check the WAL file is proportional
  > to the size of the WAL file. The wal-index helps find content
  > in the WAL file much faster, but performance still falls off with
  > increasing WAL file size. Hence, to maintain good read performance 
  > it is important to keep the WAL file size down by
  > running checkpoints at regular intervals. [5], 2.3 Performance Considerations
  > Notice too that there is a tradeoff between average read performance
  > and average write performance. To maximize the read performance,
  > one wants to keep the WAL as small as possible and hence run checkpoints
  > frequently, perhaps as often as every COMMIT. To maximize
  > write performance, one wants to amortize the cost of each checkpoint
  > over as many writes as possible, meaning that one wants to run checkpoints
  > infrequently and let the WAL grow as large as possible before each 
  > checkpoint. [5], 2.3 Performance Considerations

- fact-23b331d29a614e87a3a92b30343c6290 [confirmed]: FULL, RESTART and TRUNCATE may return SQLITE\_BUSY after partial progress if the busy handler stops waiting; a concurrent checkpoint can also return SQLITE\_BUSY immediately. [6]; as of unknown; one publisher.
  > All calls obtain an exclusive "checkpoint" lock on the database file. If
  > any other process is running a checkpoint operation at the same time, the
  > lock cannot be obtained and SQLITE\_BUSY is returned. Even if there is a
  > busy-handler configured, it will not be invoked in this case. [6], Checkpoint lock
  > If the busy-handler returns 0 before
  > the writer lock is obtained or while waiting for database readers, the
  > checkpoint operation proceeds from that point in the same way as
  > SQLITE\_CHECKPOINT\_PASSIVE - checkpointing as many frames as possible
  > without blocking any further. SQLITE\_BUSY is returned in this case. [6], Busy-handler fallback

- fact-b6973dd1a1f3448c9476ae9d6cff735b [confirmed]: A checkpoint cannot copy WAL pages past an active reader’s end mark, so long read transactions can prevent checkpoint progress. [5]; as of unknown; one publisher.
  > A checkpoint operation takes content from the WAL file
  > and transfers it back into the original database file.
  > A checkpoint can run concurrently with readers, however the checkpoint
  > must stop when it reaches a page in the WAL that is past the end mark
  > of any current reader. The checkpoint has to stop at that point because
  > otherwise it might overwrite part of the database file that the reader
  > is actively using. The checkpoint remembers (in the wal-index) how far
  > it got and will resume transferring content from the WAL to the database
  > from where it left off on the next invocation. [5], 2.2 Concurrency

</details>


## Durability, limitations and enablement

### How do FULL, NORMAL and OFF synchronous settings affect WAL durability and crash safety?

Choose synchronous=FULL when acknowledged commits must survive power loss. [9]

Under SQLite's documented durability model, FULL syncs the WAL at each commit; a checkpoint is not required for that commit's durability. [1] [9] NORMAL avoids most transaction syncs, syncing around checkpoints and WAL reuse instead: database consistency is preserved, but recent committed transactions may be lost after power loss or an operating-system crash. [9] An application-only crash does not have that NORMAL durability loss; OFF also omits syncs but risks corruption after power loss or an operating-system crash. [9]

<details>
<summary>Facts behind this answer (4)</summary>

- fact-711058c0ca2f4a70b3ed8c105b9cca34 [confirmed]: In WAL mode, synchronous=FULL provides ACID durability and adds a WAL sync after each committed transaction. [9]; as of unknown; one publisher.
  > FULL is atomic, consistent, isolated, and durable (ACID) in WAL mode and is atomic, consistent, and isolated with a rollback journal. [9], PRAGMA synchronous: FULL
  > With synchronous=FULL in WAL mode, an additional sync operation of the WAL file happens after each transaction commit. The extra WAL sync following each transaction helps ensure that transactions are durable across a power loss. [9], PRAGMA synchronous: WAL sync operations

- fact-754f8c8c35cf41d584f6ec9aaa0bac4c [confirmed]: WAL with synchronous=NORMAL remains consistent and safe from corruption, but committed transactions can roll back after power loss or an operating-system crash; application crashes retain committed transactions. [9]; as of unknown; one publisher.
  > WAL mode is safe from corruption with synchronous=NORMAL, and probably DELETE mode is safe too on modern filesystems. WAL mode is always consistent with synchronous=NORMAL, but WAL mode does lose durability. A transaction committed in WAL mode with synchronous=NORMAL might roll back following a power loss or system crash. Transactions are durable across application crashes regardless of the synchronous setting or journal mode. [9], PRAGMA synchronous: NORMAL

- fact-a6dca70e03a34cb3b9db92748e227ea1 [confirmed]: With synchronous=NORMAL, SQLite syncs the WAL before checkpoints, the database after completed checkpoints, and the WAL header before reuse; most transactions perform no sync. [9]; as of unknown; one publisher.
  > In WAL mode when synchronous is NORMAL (1), the WAL file is synchronized before each checkpoint and the database file is synchronized after each completed checkpoint and the WAL file header is synchronized when a WAL file begins to be reused after a checkpoint, but no sync operations occur during most transactions. [9], PRAGMA synchronous: WAL sync operations

- fact-e5b1bc06595c448ab14df9c84faf852c [confirmed]: With synchronous=OFF, SQLite omits syncing, so an application crash leaves data safe but an operating-system crash or power loss can corrupt the database. [9]; as of unknown; one publisher.
  > With synchronous OFF (0), SQLite continues without syncing as soon as it has handed data off to the operating system. If the application running SQLite crashes, the data will be safe, but the database might become corrupted if the operating system crashes or the computer loses power before that data has been written to non-volatile storage. On the other hand, commits can be much faster with synchronous OFF. [9], PRAGMA synchronous: OFF

</details>

### Which filesystem, multi-database, read-only, file-handling and version limitations matter before enabling WAL?

WAL requires local storage and compatible operational procedures. [8]

All accessing processes must share a host; network filesystems are unsupported. [8] ATTACH transactions are atomic per database, not across the set, and changing page\_size requires leaving WAL mode. [8]

The database and its -wal file contain persistent state together; copying only the database or manually deleting the WAL risks loss or corruption. [8] Read-only access needs readable -wal/-shm files, permission to create them, or a genuinely immutable database opened accordingly. [8]

Use a SQLite version containing the rare concurrent WAL-reset corruption fix: 3.51.3 or later, or the 3.44.6/3.50.7 backports. [8]

<details>
<summary>Facts behind this answer (6)</summary>

- fact-41f7a4b9cfd3455ebf84226d1e42487e [confirmed]: SQLite WAL requires all database processes to run on the same host and does not work over a network filesystem. [8]; as of unknown; one publisher.
  > All processes using a database must be on the same host computer; WAL does not work over a network filesystem. This is because WAL requires all processes to share a small amount of memory and processes on separate host machines obviously cannot share memory with each other. [8], 1. Overview: disadvantages

- fact-38231d3b5c864ad6ab0a6bb7b71c4f34 [confirmed]: Transactions modifying multiple ATTACHed databases are atomic within each database, but not across the database set. [8]; as of unknown; one publisher.
  > Transactions that involve changes against multiple ATTACHed databases are atomic for each individual database, but are not atomic across all databases as a set. [8], 1. Overview: disadvantages

- fact-9c681b38e2984f94b4fc1f426de617a0 [confirmed]: SQLite cannot change page\_size in WAL mode, including through VACUUM or backup restoration; changing it requires rollback journal mode. [8]; as of unknown; one publisher.
  > It is not possible to change the page\_size after entering WAL mode, either on an empty database or by using VACUUM or by restoring from a backup using the backup API. You must be in a rollback journal mode to change the page size. [8], 1. Overview: disadvantages

- fact-9ac7ccbcad6a4ffc81bb62320e4d71d3 [confirmed]: The WAL contains persistent database state: separating it from a copied or moved database can lose committed transactions or cause corruption; SQLite, rather than manual deletion, must remove it safely. [8]; as of unknown; one publisher.
  > The WAL file is part of the persistent state of the database and should be kept with the database if the database is copied or moved. If a database file is separated from its WAL file, then transactions that were previously committed to the database might be lost, or the database file might become corrupted. The only safe way to remove a WAL file is to open the database file using one of the sqlite3\_open() interfaces then immediately close the database using sqlite3\_close(). [8], 4. The WAL File

- fact-ed027e90bec04362a4f2f3c2b333f219 [confirmed]: Since SQLite 3.22.0, read-only WAL databases can open when their sidecars exist and are readable, their directory permits creating sidecars, or the connection declares the database immutable. [8]; as of unknown; one publisher.
  > This constraint was relaxed beginning with SQLite version 3.22.0 (2018-01-22). On newer versions of SQLite, a WAL-mode database on read-only media, or a WAL-mode database that lacks write permission, can still be read as long as one or more of the following conditions are met: The -shm and -wal files already exist and are readable. There is write permission on the directory containing the database so that the -shm and -wal files can be created. The database connection is opened using the immutable query parameter. [8], 5. Read-Only Databases

- fact-06c93e8165ed405f8ff013acb1426c23 [confirmed]: The rare WAL-reset corruption race affects concurrent writes or checkpoints; SQLite fixes it in 3.51.3 and later, with 3.44.6 and 3.50.7 backports. [8]; as of unknown; one publisher.
  > The bug is likely present in all version of SQLite from 3.7.0 (2010-07-21) through 3.51.2 (2026-01-09). It is fixed in version 3.51.3 (2026-03-13) and later. Backports of the fix are available for some earlier releases: 3.44.6 and 3.50.7. The bug only affects databases in WAL mode when there are two or more database connections open on the same file, in separate threads or processes, and when those two connections attempt to write or checkpoint at the same instant. [8], 11. The WAL-Reset Bug

</details>

### How is WAL enabled and verified, which settings need connection initialization, and what practical decision criteria follow?

Decision inference: WAL suits single-host teams seeking reader/writer overlap that can accept serialized writes and manage checkpoints. [1] [5] [8]

Run PRAGMA journal\_mode=WAL and require a returned wal; the mode persists across reconnects and applies to all connections to that file. [8] Explicitly set and verify the desired synchronous policy when opening connections because build defaults vary; automatic checkpoint configuration is per connection, normally starting at 1000 pages. [9] [11] [12] For live backups, use SQLite's Online Backup API or VACUUM INTO to create a separate database copy. [10]

<details>
<summary>Facts behind this answer (5)</summary>

- fact-d79d75559d1143d5a2c0f01a2abb8d76 [confirmed]: Enable WAL using PRAGMA journal\_mode=WAL and verify that the returned mode is wal; a failed conversion returns the previous mode. [8]; as of unknown; one publisher.
  > PRAGMA journal\_mode=WAL; The journal\_mode pragma returns a string which is the new journal mode. On success, the pragma will return the string "wal". If the conversion to WAL could not be completed (for example, if the VFS does not support the necessary shared-memory primitives) then the journaling mode will be unchanged and the string returned from the primitive will be the prior journaling mode (for example "delete"). [8], 3. Activating And Configuring WAL Mode

- fact-2b0a419790034a628c1ca883f43b49a7 [confirmed]: WAL journal mode persists after closing and reopening a database and applies to all connections to that database file. [8]; as of unknown; one publisher.
  > PRAGMA journal\_mode=WAL is persistent. If a process sets WAL mode, then closes and reopens the database, the database will come back in WAL mode. [8], 3.3. Persistence of WAL mode
  > The WAL journal mode will be set on all connections to the same database file if it is set on any one connection. [8], 3.3. Persistence of WAL mode

- fact-fc6e2262c7b3431a9ac4c83276bb6b2f [confirmed]: Automatic checkpoint configuration belongs to a connection; every new connection starts with automatic checkpoints enabled at 1000 pages unless the compile-time default differs. [12]; as of unknown; one publisher.
  > The sqlite3\_wal\_autocheckpoint(D,N) is a wrapper around sqlite3\_wal\_hook() that causes any database on database connection D to automatically checkpoint after committing a transaction if there are N or more frames in the write-ahead log file. Passing zero or a negative value as the N parameter disables automatic checkpoints entirely. [12], sqlite3\_wal\_autocheckpoint
  > Every new database connection defaults to having the auto-checkpoint enabled with a threshold of 1000 or SQLITE\_DEFAULT\_WAL\_AUTOCHECKPOINT pages. [12], sqlite3\_wal\_autocheckpoint

- fact-54a527d2d6804f0099e20d523bfeb248 [confirmed]: WAL synchronous defaults depend on SQLite compile-time options, so applications should explicitly set and verify their required durability policy when opening connections. [9] [11]; as of unknown; one publisher.
  > SQLITE\_DEFAULT\_SYNCHRONOUS=\<0-3\> This macro determines the default value of the PRAGMA synchronous setting. If not overridden at compile-time, the default setting is 2 (FULL). SQLITE\_DEFAULT\_WAL\_SYNCHRONOUS=\<0-3\> This macro determines the default value of the PRAGMA synchronous setting for database files that open in WAL mode. If not overridden at compile-time, this value is the same as SQLITE\_DEFAULT\_SYNCHRONOUS. If SQLITE\_DEFAULT\_WAL\_SYNCHRONOUS differs from SQLITE\_DEFAULT\_SYNCHRONOUS, and if the application has not modified the synchronous setting for the database file using the PRAGMA synchronous statement, then the synchronous setting is changed to the value defined by SQLITE\_DEFAULT\_WAL\_SYNCHRONOUS when the database connection switches into WAL mode for the first time. [11], 4. Options To Set Default Parameter Values
  > Query or change the setting of the "synchronous" flag. The first (query) form will return the synchronous setting as an integer. The second form changes the synchronous setting. [9], PRAGMA synchronous

- fact-823cee443ba64a66a15297c200e96d55 [confirmed]: For live database backups, SQLite offers the Online Backup API and VACUUM INTO; the latter creates a separate vacuumed copy. [10]; as of unknown; one publisher.
  > The online backup API allows the contents of one database to be copied into another database file, replacing any original contents of the target database. The copy operation may be done incrementally, in which case the source database does not need to be locked for the duration of the copy, only for the brief periods of time when it is actually being read from. This allows other database users to continue without excessive delays while a backup of an online database is made. [10], 1. Using the SQLite Online Backup API
  > The VACUUM INTO command will make a vacuumed copy of a live SQLite database into a separate file. [10], 1.1. Other Backup Techniques

</details>


## Gaps

None recorded.

## Conflicts and history

- fact-6967714e231d41a59ac3f53924e89541 → fact-6eb7df9ae9724f199a72d79041d7f724 (narrowed): The trigger also applies to subsequent commits while WAL is already above threshold.
- fact-1eab701f7906475383d99bea96ef80aa → fact-b6973dd1a1f3448c9476ae9d6cff735b (narrowed): The source specifies past the end mark, rather than stopping at the end mark itself.

## Sources

1. [Write-Ahead Logging](https://sqlite.org/wal.html); SQLite project; primary; found; saved 2026-10-16T18:38:58.605Z; source date unknown.
2. [Isolation In SQLite](https://sqlite.org/isolation.html); SQLite project; primary; found; saved 2026-10-16T18:38:58.607Z; source date unknown.
3. [Transaction](https://sqlite.org/lang_transaction.html); SQLite project; primary; found; saved 2026-10-16T18:38:58.607Z; source date unknown.
4. [Set A Busy Timeout](https://sqlite.org/c3ref/busy_timeout.html); SQLite project; primary; found; saved 2026-10-16T18:38:58.608Z; source date unknown.
5. [SQLite Write-Ahead Logging](https://sqlite.org/wal.html); SQLite project; primary; found; saved 2026-10-16T18:39:26.658Z; source date unknown.
6. [SQLite checkpoint a database API](https://sqlite.org/c3ref/wal_checkpoint_v2.html); SQLite project; primary; found; saved 2026-10-16T18:39:26.660Z; source date unknown.
7. [SQLite PRAGMA statements](https://sqlite.org/pragma.html); SQLite project; primary; found; saved 2026-10-16T18:39:26.661Z; source date unknown.
8. [Write-Ahead Logging](https://sqlite.org/wal.html); SQLite project; primary; found; saved 2026-10-16T18:39:39.422Z; source date unknown.
9. [PRAGMA Statements](https://sqlite.org/pragma.html); SQLite project; primary; found; saved 2026-10-16T18:39:39.424Z; source date unknown.
10. [SQLite Backup API](https://sqlite.org/backup.html); SQLite project; primary; found; saved 2026-10-16T18:39:39.424Z; source date unknown.
11. [Compile-time Options](https://sqlite.org/compile.html); SQLite project; primary; found; saved 2026-10-16T18:39:39.425Z; source date unknown.
12. [Configure an auto-checkpoint](https://sqlite.org/c3ref/wal_autocheckpoint.html); SQLite project; primary; found; saved 2026-10-16T18:39:39.426Z; source date unknown.

## Rejected facts and failed tasks

