# SQLite WAL mode for application teams

Request: How SQLite write-ahead logging (WAL) mode works for an application team deciding whether to enable it: reader/writer interaction, checkpoints, durability and limitations

Run: 3107f434abc44f3daead217d; output revision: 40.
Status: complete-with-gaps. Depth: light. Started 2026-10-16; updated 2026-10-16.
Runtime: 0.9.4; guidance: 0.9.4 (local runtime guidance).

How SQLite's write-ahead logging (WAL) journal mode works, for an application team deciding whether to enable it: reader/writer concurrency, checkpoints, durability and crash recovery, and limitations. Public sources, sqlite.org documentation first; current documentation as of October 2026.

Sources given: none; further public sources were permitted.
Counts: 10 questions (9 answered, 1 partly, 0 not answered or not yet assessed); 60 current checked facts from 10 sources; 0 rejected, 7 narrowed; 2 gaps; 0 conflicts.
How facts were checked: each fact by a separate invocation from the one that researched it, against the original source (checkers: cc-539cfb26 on claude-code, cc-d3f520fc on claude-code, cc-87e85e3d on claude-code, cc-3a156990 on claude-code, cc-6a2ffed7 on claude-code).
Prose: citation and number validation, but no independent semantic writing review at light depth.
Facts are checked for source support, not certified as true or live-current.

Plan notes: light depth usually plans 15 to 25 questions; this plan has 9. That suits a narrow request; otherwise add questions. light depth usually covers 6 to 10 sections; this plan has 4.

## Contents

- [Coverage](#coverage)
- [Readers and writers](#readers-and-writers)
- [Checkpoints](#checkpoints)
- [Durability and recovery](#durability-and-recovery)
- [Limitations and enabling](#limitations-and-enabling)
- [Gaps](#gaps)
- [Conflicts and history](#conflicts-and-history)
- [Sources](#sources)
- [Rejected facts and failed tasks](#rejected-facts-and-failed-tasks)

## Coverage

- Readers and writers: 12 current checked facts; 2/2 questions answered with current evidence.
- Checkpoints: 12 current checked facts; 2/2 questions answered with current evidence.
- Durability and recovery: 12 current checked facts; 1/2 questions answered with current evidence. Open: What happens to committed and uncommitted transactions in the WAL after a crash or power loss? (partly answered).
- Limitations and enabling: 24 current checked facts; 4/4 questions answered with current evidence.

## Readers and writers

### In WAL mode, do readers and writers block each other, and what does a reader see while a write is in progress?

In WAL mode readers and writers do not block each other, and each read transaction sees the database as of a single point in time. [1]

Writers only append new content to the WAL file, so readers do not block writers and a writer does not block readers. [1] Changes made by a writing connection are invisible to other connections until its transaction commits, so their SELECTs show none of those changes before then. [4]

When a read begins, the reader records an end mark at the last valid commit, so the whole read transaction sees the database as of that single point in time. [1] This is snapshot isolation: write transactions that commit while a read transaction is active stay invisible to that reader. [4] To see changes another connection committed meanwhile, a connection must end its read transaction and start a new one. [4]

Queries can still return SQLITE\_BUSY in obscure cases, such as when another connection holds exclusive locking mode. [1] After the last connection crashes, the first new connection runs recovery under an exclusive lock, and another connection that tries to query meanwhile gets SQLITE\_BUSY. [1] A long-running read transaction can also prevent the checkpointer from making progress, because a checkpoint must stop at any WAL page past an active reader's end mark. [1]

<details>
<summary>Facts behind this answer (6)</summary>

- fact-38212d5010bc4c23b9e20f6e613bb2bc [confirmed]: In SQLite WAL mode, readers do not block writers and a writer does not block readers, because writers only append new content to the WAL file. [1]; as of unknown; one publisher.
  > WAL provides more concurrency as readers do not block writers and a writer does not block readers. Reading and writing can proceed concurrently. [1], 1. Overview
  > Writers merely append new content to the end of the WAL file. Because writers do nothing that would interfere with the actions of readers, writers and readers can run at the same time. [1], 2.2. Concurrency

- fact-704ddd95c3b841238b428279db5c1be0 [confirmed]: An SQLite WAL-mode reader records an end mark at the last valid commit when its read begins, so each read transaction sees the database as of a single point in time. [1]; as of unknown; one publisher.
  > When a read operation begins on a WAL-mode database, it first remembers the location of the last valid commit record in the WAL. Call this point the "end mark". [1], 2.2. Concurrency
  > But for any particular reader, the end mark is unchanged for the duration of the transaction, thus ensuring that a single read transaction only sees the database content as it existed at a single point in time. [1], 2.2. Concurrency

- fact-a9f1f7912d7c4edabfa9f2e90d3f2adf [confirmed]: SQLite WAL mode provides snapshot isolation: write transactions that commit while a read transaction is active stay invisible to that reader. [4]; as of unknown; one publisher.
  > In WAL mode, SQLite exhibits "snapshot isolation". When a read transaction starts, that reader continues to see an unchanging "snapshot" of the database file as it existed at the moment in time when the read transaction started. Any write transactions that commit while the read transaction is active are still invisible to the read transaction, because the reader is seeing a snapshot of database file from a prior moment in time. [4], Isolation And Concurrency

- fact-01269e43f9ed4da5b48d0cf712530f3d [confirmed]: In SQLite WAL mode, a connection holding a read transaction must end it and start a new one to see changes another connection committed meanwhile. [4]; as of unknown; one publisher.
  > X can subsequently do a SELECT against the records that Y modified but X will see the older unmodified entries because Y's changes are all invisible to X while X is holding a read transaction. If X wants to see the changes that Y made, then X must end its read transaction and start a new one (by running COMMIT followed by another BEGIN.) [4], Isolation And Concurrency

- fact-be52d5dd86704a5eab533e9d62c6376c [confirmed]: SQLite documents that changes made in one database connection are invisible to other connections before commit, so SELECTs on another connection show no changes until the writing transaction commits. [4]; as of unknown; one publisher.
  > Changes made in one database connection are invisible to all other database connections prior to commit. [4], Summary
  > SELECT statements on a different database connection Y will show no changes until the X transaction commits. [4], No Isolation Between Operations On The Same Database Connection

- fact-70f8b6c8f875474291a2a5561a861e23 [confirmed]: SQLite WAL-mode queries can still return SQLITE\_BUSY in obscure cases, such as another connection holding exclusive locking mode or a new connection running crash recovery under an exclusive lock. [1]; as of unknown; one publisher.
  > The second advantage of WAL-mode is that writers do not block readers and readers do not block writers. This is mostly true. But there are some obscure cases where a query against a WAL-mode database can return SQLITE\_BUSY, so applications should be prepared for that happenstance. [1], 9. Sometimes Queries Return SQLITE\_BUSY In WAL Mode
  > If another database connection has the database mode open in exclusive locking mode then all queries against the database will return SQLITE\_BUSY. [1], 9. Sometimes Queries Return SQLITE\_BUSY In WAL Mode
  > If the last connection to a database crashed, then the first new connection to open the database will start a recovery process. An exclusive lock is held during recovery. [1], 9. Sometimes Queries Return SQLITE\_BUSY In WAL Mode

</details>

### How many writers can be active at once in WAL mode, and what happens when another connection tries to write?

WAL mode allows only one writer at a time, and a connection that tries to start a write while another is active gets SQLITE\_BUSY. [1] [5] [6]

Because there is a single WAL file, only one writer can be active at a time, while multiple simultaneous read transactions are supported. [1] [5] A connection that tries to start a write while another write transaction is active gets SQLITE\_BUSY and must wait, optionally using sqlite3\_busy\_timeout(), sqlite3\_busy\_handler() or the busy\_timeout pragma. [6]

BEGIN IMMEDIATE starts a write transaction at once and may return SQLITE\_BUSY, but if it succeeds no later operation through COMMIT returns SQLITE\_BUSY. [5] [6] A DEFERRED transaction that began with a SELECT upgrades to a write transaction only if possible; otherwise its write statement fails with SQLITE\_BUSY. [5] If another connection has written since the read began, that upgrade fails with SQLITE\_BUSY\_SNAPSHOT, and the connection must release its snapshot and begin a new transaction. [4] [6]

In WAL mode BEGIN EXCLUSIVE behaves the same as BEGIN IMMEDIATE, so it blocks other writers but does not stop other connections from reading. [4] [5]

<details>
<summary>Facts behind this answer (6)</summary>

- fact-116c2379add64657ba0c02781f8b00f1 [confirmed]: SQLite WAL mode allows only one writer at a time because there is a single WAL file, while multiple simultaneous read transactions are supported. [1] [5]; as of unknown; one publisher.
  > However, since there is only one WAL file, there can only be one writer at a time. [1], 2.2. Concurrency
  > SQLite supports multiple simultaneous read transactions coming from separate database connections, possibly in separate threads or processes, but only one simultaneous write transaction. [5], 2.1. Read transactions versus write transactions

- fact-726b4a71891c43758919350144129f0c [confirmed]: In SQLite, a connection that tries to start a write while another write transaction is active gets SQLITE\_BUSY and must wait, optionally using sqlite3\_busy\_timeout(), sqlite3\_busy\_handler() or the busy\_timeout pragma. [6]; as of unknown; one publisher.
  > For example, if process A is in the middle of a large write transaction and at the same time process B attempts to start a new write transaction, process B will get back an SQLITE\_BUSY result because SQLite only supports one writer at a time. Process B will need to wait for process A to finish its transaction before starting a new transaction. The sqlite3\_busy\_timeout() and sqlite3\_busy\_handler() interfaces and the busy\_timeout pragma are available to process B to help it deal with SQLITE\_BUSY errors. [6], (5) SQLITE\_BUSY

- fact-0e0fa34f14e041748e1edfc1aaf06d6e [confirmed]: In SQLite, BEGIN IMMEDIATE starts a write transaction at once and may return SQLITE\_BUSY, but if it succeeds no later operation through COMMIT returns SQLITE\_BUSY. [5] [6]; as of unknown; one publisher.
  > To avoid encountering SQLITE\_BUSY errors in the middle of a transaction, the application can use BEGIN IMMEDIATE instead of just BEGIN to start a transaction. The BEGIN IMMEDIATE command might itself return SQLITE\_BUSY, but if it succeeds, then SQLite guarantees that no subsequent operations on the same database through the next COMMIT will return SQLITE\_BUSY. [6], (5) SQLITE\_BUSY
  > IMMEDIATE causes the database connection to start a new write immediately, without waiting for a write statement. The BEGIN IMMEDIATE might fail with SQLITE\_BUSY if another write transaction is already active on another database connection. [5], 2.2. DEFERRED, IMMEDIATE, and EXCLUSIVE transactions

- fact-f446e722e1d6482d8d263b1848ecb364 [confirmed]: In SQLite WAL mode, upgrading a read transaction to a write after another connection has written fails with SQLITE\_BUSY\_SNAPSHOT; the connection must release its snapshot and begin a new transaction. [4] [6]; as of unknown; one publisher.
  > The SQLITE\_BUSY\_SNAPSHOT error code is an extended error code for SQLITE\_BUSY that occurs on WAL mode databases when a database connection tries to promote a read transaction into a write transaction but finds that another database connection has already written to the database and thus invalidated prior reads. [6], (517) SQLITE\_BUSY\_SNAPSHOT
  > If X were allowed to write, it would fork the history of the database file, which is something SQLite does not support. In order for X to write to the database, it must first release its snapshot (using ROLLBACK for example) then start a new transaction with a subsequent BEGIN. [4], Isolation And Concurrency

- fact-455906897c3d46bbbbba26b08bf6b46b [confirmed]: In SQLite, a DEFERRED transaction that began with a SELECT upgrades to a write transaction only if possible; otherwise its write statement fails with SQLITE\_BUSY. [5]; as of unknown; one publisher.
  > If a write statement occurs while a read transaction is active, then the read transaction is upgraded to a write transaction if possible. If some other database connection has already modified the database or is already in the process of modifying the database, then upgrading to a write transaction is not possible and the write statement will fail with SQLITE\_BUSY. [5], 2.1. Read transactions versus write transactions

- fact-2c30d1a37e534d51a6fbd74a510ac655 [confirmed]: In SQLite WAL mode, BEGIN EXCLUSIVE behaves the same as BEGIN IMMEDIATE, so it blocks other writers but does not stop other connections from reading. [4] [5]; as of unknown; one publisher.
  > EXCLUSIVE is similar to IMMEDIATE in that a write transaction is started immediately. EXCLUSIVE and IMMEDIATE are the same in WAL mode, but in other journaling modes, EXCLUSIVE prevents other database connections from reading the database while the transaction is underway. [5], 2.2. DEFERRED, IMMEDIATE, and EXCLUSIVE transactions
  > The BEGIN IMMEDIATE command goes ahead and starts a write transaction, and thus blocks all other writers. [4], Isolation And Concurrency

</details>


## Checkpoints

### What is a WAL checkpoint and when does SQLite run one automatically?

A checkpoint copies transactions from the WAL file back into the database file, and by default SQLite runs one when a COMMIT brings the WAL to 1000 pages or more, or when the last connection closes. [1]

In WAL mode a commit appends a frame carrying a commit marker to the WAL without writing to the original database file, and a checkpoint is the operation that transfers those appended transactions back into that file. [1] [10] By default SQLite checkpoints automatically whenever a COMMIT makes the WAL file 1000 pages or more, and also when the last database connection on the file closes. [1]

The automatic checkpoint runs in the thread whose COMMIT pushes the WAL over the limit, so most commits are fast but the occasional commit that triggers a checkpoint is much slower. [1] Automatic checkpoints are PASSIVE: they checkpoint as many frames as possible without waiting for readers or writers, and may leave the checkpoint unfinished. [1] [2] With synchronous=NORMAL the checkpoint is the only operation that syncs, so running checkpoints on a separate thread keeps writers from blocking on sync, at the cost of durability. [1]

The threshold is set per connection with sqlite3\_wal\_autocheckpoint() or the wal\_autocheckpoint pragma, and a zero or negative value disables automatic checkpoints entirely. [3] After a normal checkpoint the WAL file is not truncated but recycled by overwriting from the beginning, unless the journal\_size\_limit pragma is set. [1]

<details>
<summary>Facts behind this answer (6)</summary>

- fact-39fe8f14acf74f1985b6fe813a7b33c7 [confirmed]: An SQLite WAL checkpoint is the operation that transfers transactions appended in the WAL file back into the original database file. [1]; as of unknown; one publisher.
  > Of course, one wants to eventually transfer all the transactions that are appended in the WAL file back into the original database. Moving the WAL file transactions back into the database is called a "checkpoint". [1], 2.1. Checkpointing

- fact-da2e3fee1d0e4e349bd67c02b5a85fd0 [confirmed]: By default SQLite checkpoints automatically whenever a COMMIT makes the WAL file 1000 pages or more, or when the last database connection on the file closes. [1]; as of unknown; one publisher.
  > By default, SQLite will automatically checkpoint whenever a COMMIT occurs that causes the WAL file to be 1000 pages or more in size, or when the last database connection on a database file closes. [1], 3.1. Automatic Checkpoint

- fact-faf91da9c9bc458494d4b022e223bfa4 [confirmed]: SQLite's automatic checkpoint runs in the thread whose COMMIT pushes the WAL over the limit, so most commits are fast but occasional checkpoint-triggering commits are much slower. [1]; as of unknown; one publisher.
  > By default, the checkpoint will be run automatically by the same thread that does the COMMIT that pushes the WAL over its size limit. This has the effect of causing most COMMIT operations to be very fast but an occasional COMMIT (those that trigger a checkpoint) to be much slower. [1], 2.3. Performance Considerations

- fact-0c7a49407e5540738ce34389aa57f209 [confirmed]: SQLite automatic checkpoints are PASSIVE: they checkpoint as many frames as possible without waiting for readers or writers, and may leave the checkpoint unfinished. [1] [2]; as of unknown; one publisher.
  > All checkpoints initiated by sqlite3\_wal\_checkpoint() and by the automatic checkpoint mechanism are PASSIVE. [1], 3.2. Application-Initiated Checkpoints
  > Checkpoint as many frames as possible without waiting for any database readers or writers to finish, then sync the database file if all frames in the log were checkpointed. The busy-handler callback is never invoked in the SQLITE\_CHECKPOINT\_PASSIVE mode. On the other hand, passive mode might leave the checkpoint unfinished if there are concurrent readers or writers. [2], SQLITE\_CHECKPOINT\_PASSIVE

- fact-638784a97cd142ceb0f9b993b5087ea6 [confirmed]: The SQLite auto-checkpoint threshold is set per connection with sqlite3\_wal\_autocheckpoint() or the wal\_autocheckpoint pragma, and a zero or negative value disables automatic checkpoints entirely. [3]; as of unknown; one publisher.
  > The sqlite3\_wal\_autocheckpoint(D,N) is a wrapper around sqlite3\_wal\_hook() that causes any database on database connection D to automatically checkpoint after committing a transaction if there are N or more frames in the write-ahead log file. Passing zero or a negative value as the N parameter disables automatic checkpoints entirely. [3], sqlite3\_wal\_autocheckpoint
  > The wal\_autocheckpoint pragma can be used to invoke this interface from SQL. [3], sqlite3\_wal\_autocheckpoint

- fact-2a5299f4242e45c3843693da23cefe88 [confirmed]: After a normal SQLite checkpoint the WAL file is recycled by overwriting from the beginning rather than truncated, unless the journal\_size\_limit pragma is set. [1]; as of unknown; one publisher.
  > In normal cases, new content is appended to the WAL file until the WAL file accumulates about 1000 pages (and is thus about 4MB in size) at which point a checkpoint is automatically run and the WAL file is recycled. The checkpoint does not normally truncate the WAL file (unless the journal\_size\_limit pragma is set). Instead, it merely causes SQLite to start overwriting the WAL file from the beginning. [1], 6. Avoiding Excessively Large WAL Files

</details>

### What can prevent a checkpoint from completing or the WAL file from being reset, and what are the consequences?

Continuously overlapping readers, very large write transactions or a disabled auto-checkpoint can keep checkpoints from finishing or the WAL from being reset, so the WAL file grows, using excess disk space and slowing queries. [1]

A checkpoint must stop at any WAL page past an active reader's end mark, so a long-running read transaction can prevent the checkpointer from making progress. [1] When overlapping readers leave at least one active reader at all times, no checkpoint completes and the WAL file grows without bound, a condition SQLite calls checkpoint starvation. [1]

A very large write transaction can also make the WAL file very big, because the WAL cannot be reset in the middle of a write transaction. [1] SQLite's WAL page says WAL has worked as efficiently as rollback mode with large transactions since 3.11.0, yet a large write can still grow the WAL file very big until it completes. [1] Compile-time and run-time options can disable or defer the automatic checkpoint, and if an application disables it, nothing prevents the WAL file from growing excessively. [1]

An unbounded WAL file causes excess disk space usage and slower queries, because each reader's WAL lookup time grows with the WAL file size. [1]

Against starvation, SQLite's WAL page advises leaving gaps between readers or running manual RESTART or TRUNCATE checkpoints, and warns that readers might block. [1] [2] The checkpoint API reference describes RESTART differently, saying it blocks new writers but does not impede readers, so these sqlite.org pages disagree on whether RESTART affects readers. [1] [2]

<details>
<summary>Facts behind this answer (6)</summary>

- fact-af834349e3da4baf96c0cd8071741bd8 [confirmed]: An SQLite checkpoint must stop at any WAL page past an active reader's end mark, so a long-running read transaction can prevent the checkpointer from making progress. [1]; as of unknown; one publisher.
  > A checkpoint can run concurrently with readers, however the checkpoint must stop when it reaches a page in the WAL that is past the end mark of any current reader. The checkpoint has to stop at that point because otherwise it might overwrite part of the database file that the reader is actively using. [1], 2.2. Concurrency
  > Thus a long-running read transaction can prevent a checkpointer from making progress. [1], 2.2. Concurrency

- fact-eb8dae38032a4697b8cb3b7b1c3e0803 [confirmed]: SQLite checkpoint starvation occurs when overlapping readers leave at least one active reader at all times, so no checkpoint completes and the WAL file grows without bound. [1]; as of unknown; one publisher.
  > Checkpoint starvation. A checkpoint is only able to run to completion, and reset the WAL file, if there are no other database connections using the WAL file. If another connection has a read transaction open, then the checkpoint cannot reset the WAL file because doing so might delete content out from under the reader. [1], 6. Avoiding Excessively Large WAL Files
  > However, if a database has many concurrent overlapping readers and there is always at least one active reader, then no checkpoints will be able to complete and hence the WAL file will grow without bound. [1], 6. Avoiding Excessively Large WAL Files

- fact-b1c16af6bda34d7387b10c2bc0a310b8 [confirmed]: An unbounded SQLite WAL file causes excess disk space usage and slower queries, because each reader's WAL lookup time grows with the WAL file size. [1]; as of unknown; one publisher.
  > But it is possible to get SQLite into a state where the WAL file will grow without bound, causing excess disk space usage and slow query speeds. [1], 6. Avoiding Excessively Large WAL Files
  > On the other hand, read performance deteriorates as the WAL file grows in size since each reader must check the WAL file for the content and the time needed to check the WAL file is proportional to the size of the WAL file. [1], 2.3. Performance Considerations

- fact-6fd48a00bcad4e9790ef646bd0c96de7 [confirmed]: A very large SQLite write transaction can make the WAL file very big, because the WAL cannot be reset in the middle of a write transaction. [1]; as of unknown; one publisher.
  > Very large write transactions. A checkpoint can only complete when no other transactions are running, which means the WAL file cannot be reset in the middle of a write transaction. So a large change to a large database might result in a large WAL file. [1], 6. Avoiding Excessively Large WAL Files

- fact-63253385d11747f1867e405194c34f5e [confirmed]: Compile-time and run-time options can disable or defer SQLite's automatic checkpoint, and if an application disables it, nothing prevents the WAL file from growing excessively. [1]; as of unknown; one publisher.
  > However, compile-time and run-time options exist that can disable or defer this automatic checkpoint. If an application disables the automatic checkpoint, then there is nothing to prevent the WAL file from growing excessively. [1], 6. Avoiding Excessively Large WAL Files

- fact-140601ea397f46bba39266636af8ae82 [confirmed]: SQLite's WAL page advises reader gaps or manual RESTART or TRUNCATE checkpoints against starvation, warning readers might block, while the wal\_checkpoint\_v2 reference says RESTART blocks new writers but does not impede readers. [1] [2]; as of unknown; one publisher.
  > This scenario can be avoided by ensuring that there are "reader gaps": times when no processes are reading from the database and that checkpoints are attempted during those times. In applications with many concurrent readers, one might also consider running manual checkpoints with the SQLITE\_CHECKPOINT\_RESTART or SQLITE\_CHECKPOINT\_TRUNCATE option which will ensure that the checkpoint runs to completion before returning. The disadvantage of using SQLITE\_CHECKPOINT\_RESTART and SQLITE\_CHECKPOINT\_TRUNCATE is that readers might block while the checkpoint is running. [1], 6. Avoiding Excessively Large WAL Files
  > Like SQLITE\_CHECKPOINT\_FULL, this mode blocks new database writer attempts while it is pending, but does not impede readers. [2], SQLITE\_CHECKPOINT\_RESTART

</details>


## Durability and recovery

### How durable is a committed transaction in WAL mode under synchronous=NORMAL compared with synchronous=FULL?

In WAL mode, synchronous=FULL makes committed transactions durable across power loss, while synchronous=NORMAL stays consistent and corruption-free but may roll back a committed transaction after a power loss or system crash. [9]

The settings differ in when they sync: FULL adds a WAL sync after every transaction commit, while NORMAL syncs only around checkpoints and WAL reuse, not during most transactions. [1] [9] Under FULL, WAL mode gives full ACID guarantees including durability, which the documentation contrasts with rollback-journal mode, where FULL is only guaranteed atomic, consistent and isolated. [9] Under NORMAL, the database is safe from corruption and always consistent, but a committed transaction might roll back after a power loss or system crash. [9]

An application crash alone does not lose committed transactions under either setting, because SQLite transactions are durable across application crashes under any synchronous setting or journal mode. [9] A failed sync during COMMIT can lose durability but not corrupt the database; only a failed sync during a checkpoint can cause corruption. [11]

With NORMAL the checkpoint is the only operation that syncs, and by default checkpoints run automatically when a COMMIT makes the WAL 1000 pages or more or when the last connection closes. [1] Running checkpoints in a separate thread under NORMAL keeps writers from blocking on sync, at the cost of durability. [1] The SQLite documentation recommends NORMAL as the best performance-safety balance for most WAL applications, saying lost power-loss durability is unimportant for most applications. [9]

<details>
<summary>Facts behind this answer (6)</summary>

- fact-eebf8e3730f14f2891f9aa199cbea5af [confirmed]: In SQLite WAL mode, synchronous=FULL gives full ACID guarantees, including durability, whereas with a rollback journal FULL is only guaranteed atomic, consistent and isolated. [9]; as of unknown; one publisher.
  > FULL is atomic, consistent, isolated, and durable (ACID) in WAL mode and is atomic, consistent, and isolated with a rollback journal. [9], PRAGMA synchronous

- fact-b1dc92114b2a45128c30f9bbac3cb525 [confirmed]: In SQLite WAL mode, synchronous=NORMAL is safe from corruption and always consistent, but a committed transaction might roll back after a power loss or system crash. [9]; as of unknown; one publisher.
  > WAL mode is safe from corruption with synchronous=NORMAL, and probably DELETE mode is safe too on modern filesystems. WAL mode is always consistent with synchronous=NORMAL, but WAL mode does lose durability. A transaction committed in WAL mode with synchronous=NORMAL might roll back following a power loss or system crash. [9], PRAGMA synchronous

- fact-46a944f8552f442eb4a8fa2953654050 [confirmed]: In SQLite WAL mode, synchronous=FULL adds a WAL sync after every transaction commit, while NORMAL syncs only around checkpoints and WAL reuse, not during most transactions. [1] [9]; as of unknown; one publisher.
  > In WAL mode when synchronous is NORMAL (1), the WAL file is synchronized before each checkpoint and the database file is synchronized after each completed checkpoint and the WAL file header is synchronized when a WAL file begins to be reused after a checkpoint, but no sync operations occur during most transactions. With synchronous=FULL in WAL mode, an additional sync operation of the WAL file happens after each transaction commit. [9], PRAGMA synchronous
  > (Writers sync the WAL on every transaction commit if PRAGMA synchronous is set to FULL but omit this sync if PRAGMA synchronous is set to NORMAL.) [1], 2.3. Performance Considerations

- fact-ea7e975660284a7da2f4db210ed1083f [confirmed]: With SQLite WAL and synchronous=NORMAL, the checkpoint is the only operation that syncs, so a separate checkpoint thread keeps writers from blocking on sync, at the cost of durability. [1]; as of unknown; one publisher.
  > Note that with PRAGMA synchronous set to NORMAL, the checkpoint is the only operation to issue an I/O barrier or sync operation (fsync() on unix or FlushFileBuffers() on windows). If an application therefore runs checkpoint in a separate thread or process, the main thread or process that is doing database queries and updates will never block on a sync operation. This helps to prevent "latch-up" in applications running on a busy disk drive. The downside to this configuration is that transactions are no longer durable and might rollback following a power failure or hard reset. [1], 2.3. Performance Considerations

- fact-1581b5df47b74245b7fa0812288f5580 [confirmed]: The SQLite documentation recommends synchronous=NORMAL as the best performance-safety balance for most WAL applications, saying lost power-loss durability is unimportant for most applications. [9]; as of unknown; one publisher.
  > The synchronous=NORMAL setting provides the best balance between performance and safety for most applications running in WAL mode. You lose durability across power lose with synchronous NORMAL in WAL mode, but that is not important for most applications. Transactions are still atomic, consistent, and isolated, which are the most important characteristics in most use cases. [9], PRAGMA synchronous

- fact-8ccab712a9884628acc8019fe77819af [confirmed]: SQLite transactions are durable across application crashes under any synchronous setting or journal mode, and the extra WAL sync that synchronous=FULL adds after each transaction helps make them durable across a power loss. [9]; as of unknown; one publisher.
  > Transactions are durable across application crashes regardless of the synchronous setting or journal mode. [9], PRAGMA synchronous
  > The extra WAL sync following each transaction helps ensure that transactions are durable across a power loss. [9], PRAGMA synchronous

</details>

### What happens to committed and uncommitted transactions in the WAL after a crash or power loss?

A transaction whose commit frame reached the WAL is kept as long as the WAL file stays with the database, while frames of a transaction lacking a commit frame are not read. [1] [10] [11]

In WAL mode a transaction commits when a frame carrying a commit marker is appended to the WAL, without writing to the original database file. [1] [10] SQLite treats a WAL frame as valid only if its salt values match the WAL header and its cumulative checksum matches, which separates valid frames from leftovers. [10] It uses a WAL page only from a valid frame that is a commit frame or followed by one, so frames of a transaction lacking a commit frame are not read. [10]

Committed transactions survive an application crash under any synchronous setting, but under synchronous=NORMAL a committed transaction might roll back after a power loss or system crash. [9] A failed sync during COMMIT can lose durability but not corrupt the database, whereas a failed sync during a checkpoint can cause corruption. [11]

After an unclean exit the WAL file may remain on disk and must stay with the database, because separating them can lose committed transactions or corrupt the database. [1] [11] After the last connection crashes, the first new connection runs a recovery process under an exclusive lock, and another connection that tries to query meanwhile gets SQLITE\_BUSY. [1]

The sources state the reader rules and that recovery runs but do not describe the recovery procedure, so discarding uncommitted frames after a crash is inferred from the reader rules. [1] [10]

Gap (gap-f13d42c29127471bac7f3216b9b5f5c5, checker assessment): Checker's assessment: wal.html and fileformat2.html confirm that commits are marked by commit frames, that only valid frames that are or precede a commit frame are read, and that a recovery process runs under an exclusive lock, but neither page describes the recovery procedure itself (rebuilding the wal-index, handling a torn or partially written final frame). That uncommitted WAL frames are discarded after a crash is therefore inferred from the reader algorithm and frame-validity rules rather than stated as recovery behaviour. [1] [10]

<details>
<summary>Facts behind this answer (6)</summary>

- fact-536883e819b940439d9e9155d7d0d33f [confirmed]: In SQLite WAL mode, a transaction commits when a frame carrying a commit marker is appended to the WAL, without writing to the original database file. [1] [10]; as of unknown; one publisher.
  > A COMMIT occurs when a special record indicating a commit is appended to the WAL. Thus a COMMIT can happen without ever writing to the original database [1], 2. How WAL Works
  > Transactions commit when a frame is written that contains a commit marker. [10], 4.1. WAL File Format

- fact-495b944729ac427b9a0d320883895ad7 [confirmed]: SQLite treats a WAL frame as valid only if its salt values match the WAL header and its cumulative checksum matches, which separates valid frames from leftovers. [10]; as of unknown; one publisher.
  > Checksums and counters attached to each frame are used to determine which frames within the WAL are valid and which are leftovers from prior checkpoints. [10], 4.1. WAL File Format
  > The salt-1 and salt-2 values in the frame-header match salt values in the wal-header [10], 4.1. WAL File Format
  > The checksum values in the final 8 bytes of the frame-header exactly match the checksum computed consecutively on the first 24 bytes of the WAL header and the first 8 bytes and the content of all frames up to and including the current frame. [10], 4.1. WAL File Format

- fact-0f15441439c349c6a99fbe78a7b36639 [confirmed]: SQLite uses a WAL page only from a valid frame that is a commit frame or followed by one, so frames of a transaction lacking a commit frame are not read. [10]; as of unknown; one publisher.
  > If so, then the last valid instance of page P that is followed by a commit frame or is a commit frame itself becomes the value read. If the WAL contains no copies of page P that are valid and which are a commit frame or are followed by a commit frame, then page P is read from the database file. [10], 4.5. Reader Algorithm

- fact-6149e38485ef4560b6b62132554bba7e [confirmed]: After an unclean exit the SQLite WAL file may remain on disk and must stay with the database; separating them can lose committed transactions or corrupt the database. [1] [11]; as of unknown; one publisher.
  > However, if the last process to have the database open exits without cleanly shutting down the database connection, or if the SQLITE\_FCNTL\_PERSIST\_WAL file control is used, then the WAL file might be retained on disk after all connections to the database have been closed. The WAL file is part of the persistent state of the database and should be kept with the database if the database is copied or moved. If a database file is separated from its WAL file, then transactions that were previously committed to the database might be lost, or the database file might become corrupted. [1], 4. The WAL File
  > If the hot journal files are moved, deleted, or renamed after a crash or power failure, then automatic recovery will not work and the database may go corrupt. [11], 1.3. Deleting a hot journal

- fact-10a3b9f0a2e44c319f867940604b9b3f [confirmed]: In SQLite WAL mode, a failed sync during COMMIT can lose durability but not corrupt the database; only a failed sync during a checkpoint can cause corruption. [11]; as of unknown; one publisher.
  > In WAL mode, the only time that a failed sync operation can cause database corruption is during a checkpoint operation. A sync failure during a COMMIT might result in loss of durability but not in a corrupt database file. [11], 3.1. Disk drives that do not honor sync requests

- fact-2e666c2d0d2c4b7abd27cdb8270a6e37 [confirmed]: After the last SQLite connection crashes, the first new connection runs a recovery process under an exclusive lock, and another connection that tries to query meanwhile gets SQLITE\_BUSY. [1]; as of unknown; one publisher.
  > If the last connection to a database crashed, then the first new connection to open the database will start a recovery process. An exclusive lock is held during recovery. So if a third database connection tries to jump in and query while the second connection is running recovery, the third connection will get an SQLITE\_BUSY error. [1], 2.2. Concurrency

</details>


## Limitations and enabling

### Can WAL mode be used when the database is on a network filesystem or accessed from several machines, and why?

No: WAL mode requires every process using the database to be on the same host, so it does not work over a network filesystem. [1]

The reason is shared memory: WAL readers rely on a wal-index kept in shared memory, so all readers must exist on the same machine. [1] SQLite implements that shared memory by mmapping an ordinary file in the same directory as the database, the only way it found to guarantee that all processes use the same shared memory. [1]

One narrow exception exists since SQLite 3.7.4: a single process can use a WAL database without shared memory if locking\_mode is set to EXCLUSIVE before the first access. [1]

For clients on several machines, the SQLite project instead suggests hosting a WAL-mode database with all reads and writes done on the database machine through a proxy, or using a client/server database. [8] It also says rollback mode can mitigate network-filesystem unreliability, but SQLite is not tested across a network, so remote database use is at the user's risk. [8]

<details>
<summary>Facts behind this answer (6)</summary>

- fact-5615a65aa23145469225ac1eba50ddb0 [confirmed]: SQLite WAL mode requires all processes using a database to be on the same host and does not work over a network filesystem, because processes must share memory. [1]; as of unknown; one publisher.
  > All processes using a database must be on the same host computer; WAL does not work over a network filesystem. This is because WAL requires all processes to share a small amount of memory and processes on separate host machines obviously cannot share memory with each other. [1], 1. Overview

- fact-2ec2344e0290477bb0ef38a269e1f24c [confirmed]: SQLite WAL readers rely on a wal-index kept in shared memory, so all readers must exist on the same machine, which is why WAL will not work on a network filesystem. [1]; as of unknown; one publisher.
  > The wal-index greatly improves the performance of readers, but the use of shared memory means that all readers must exist on the same machine. This is why the write-ahead log implementation will not work on a network filesystem. [1], 2.2. Concurrency

- fact-0ba141e737ac4f01abee4de372d70733 [confirmed]: SQLite implements the WAL shared memory by mmapping an ordinary file in the same directory as the database, the only way found to guarantee all processes use the same shared memory. [1]; as of unknown; one publisher.
  > The wal-index is implemented using an ordinary file that is mmapped for robustness. [1], 7. Implementation Of Shared-Memory For The WAL-Index
  > The only way we have found to guarantee that all processes accessing the same database file use the same shared memory is to create the shared memory by mmapping a file in the same directory as the database itself. [1], 7. Implementation Of Shared-Memory For The WAL-Index

- fact-9e2db4ee5f764e249b2dc8026bd8dff1 [confirmed]: For clients on several machines, the SQLite project suggests hosting a WAL-mode SQLite database with all reads and writes done on the database machine through a proxy, or using a client/server database. [8]; as of unknown; one publisher.
  > 1. Use a client/server database engine. PostgreSQL is an excellent choice. A variation of this is: [8], Recommendations
  > 2. Host an SQLite database in WAL mode, but do all reads and writes from processes on the same machine that stores the database file. Implement a proxy that runs on the database machine that relays read/write requests from remote machines. [8], Recommendations

- fact-7cca7df0a5a94cf991a30510c51f350f [confirmed]: The SQLite project says network-filesystem unreliability can be mitigated by using SQLite in rollback mode, but SQLite is not tested across a network, so remote database use is at the user's risk. [8]; as of unknown; one publisher.
  > These network unreliability issues can be mitigated, completely or to an acceptable degree, by using SQLite in rollback mode. However, the SQLite library is not tested in across-a-network scenarios, nor is that reasonably possible. Hence, use of a remote database is done at the user's risk. [8], Performance and Reliability Issues
  > 3. Use SQLite in rollback mode. This means you can have multiple simultaneous readers or one writer, but not simultaneous readers and writers. [8], Recommendations

- fact-27f2aba5f212458ab8281a6523450f1e [confirmed]: Since SQLite 3.7.4, a single process can use a WAL database without shared memory if locking\_mode is set to EXCLUSIVE before the first access. [1]; as of unknown; one publisher.
  > Beginning in SQLite version 3.7.4 (2010-12-07), WAL databases can be created, read, and written even if shared memory is unavailable as long as the locking\_mode is set to EXCLUSIVE before the first attempted access. In other words, a process can interact with a WAL database without using shared memory if that process is guaranteed to be the only process accessing the database. [1], 8. Use of WAL Without Shared-Memory

</details>

### What other limitations does WAL mode have compared with rollback-journal mode (for example read-only access, very large transactions or ATTACHed databases)?

WAL mode loses atomicity across ATTACHed databases, blocks page\_size changes, and adds -wal and -shm files that must travel with the database. [1]

A transaction that changes several ATTACHed databases is atomic for each database individually but not across all of them as a set. [1] A database's page\_size cannot be changed while it is in WAL mode, even via VACUUM or the backup API; it must be switched to a rollback journal mode first. [1]

WAL adds quasi-persistent -wal and -shm files per database, and the WAL file must be kept with the database when it is copied or moved, or committed transactions may be lost. [1] Read-only access has conditions: since SQLite 3.22.0 a read-only WAL database can be read if the -shm and -wal files exist and are readable, the directory is writable, or the connection uses the immutable parameter. [1]

For applications that mostly read and seldom write, WAL might be very slightly slower than rollback-journal mode, perhaps 1% or 2%. [1] On very large transactions, the WAL page says WAL has worked as efficiently as rollback mode since 3.11.0, yet a large write can still grow the WAL file very big until it completes. [1] The earlier large-transaction warning is struck from current documentation, so older guidance on this point no longer reflects the current page. [1]

Gap (gap-d2fadad2c1774e00b2365fd2f4237186, checker assessment): Checker's own assessment: the very-large-transaction guidance in the wal.html Overview (rollback modes likely faster above about 100 MB, possible I/O or disk-full failure above 1 GB, rollback recommended above a few dozen MB) is not cited. It sits next to the 3.11.0 'works as efficiently' sentence and conflicts with it, and the page does not explain how the two fit together. [1]

<details>
<summary>Facts behind this answer (6)</summary>

- fact-641d77ea00a84b21a620046240a3e9c4 [confirmed]: In SQLite WAL mode, transactions changing multiple ATTACHed databases are atomic for each database individually but not atomic across all the databases as a set. [1]; as of unknown; one publisher.
  > Transactions that involve changes against multiple ATTACHed databases are atomic for each individual database, but are not atomic across all databases as a set. [1], 1. Overview

- fact-a19c4c1288054b6b880e467c76e26043 [confirmed]: SQLite cannot change a database's page\_size while it is in WAL mode, including via VACUUM or the backup API; a rollback journal mode is required to change it. [1]; as of unknown; one publisher.
  > It is not possible to change the page\_size after entering WAL mode, either on an empty database or by using VACUUM or by restoring from a backup using the backup API. You must be in a rollback journal mode to change the page size. [1], 1. Overview

- fact-4b296d463f844c32b0443f56f6d5ad04 [confirmed]: Since SQLite 3.22.0, a read-only WAL database can be read if the -shm and -wal files exist and are readable, the directory is writable, or the connection uses the immutable parameter. [1]; as of unknown; one publisher.
  > This constraint was relaxed beginning with SQLite version 3.22.0 (2018-01-22). [1], 5. Read-Only Databases
  > On newer versions of SQLite, a WAL-mode database on read-only media, or a WAL-mode database that lacks write permission, can still be read as long as one or more of the following conditions are met: [1], 5. Read-Only Databases
  > The -shm and -wal files already exist and are readable. [1], 5. Read-Only Databases
  > There is write permission on the directory containing the database so that the -shm and -wal files can be created. [1], 5. Read-Only Databases
  > The database connection is opened using the immutable query parameter. [1], 5. Read-Only Databases

- fact-e0e1c677bd8c46af9c007dd5bb5d9e67 [confirmed]: SQLite WAL mode might be very slightly slower, perhaps 1% or 2%, than rollback-journal mode for applications that mostly read and seldom write. [1]; as of unknown; one publisher.
  > WAL might be very slightly slower (perhaps 1% or 2% slower) than the traditional rollback-journal approach in applications that do mostly reads and seldom write. [1], 1. Overview

- fact-675d07f587ee418998cb21a516d4e845 [confirmed]: SQLite WAL mode adds quasi-persistent -wal and -shm files per database; the WAL file must be kept with the database when copied or moved, or committed transactions may be lost. [1]; as of unknown; one publisher.
  > There is an additional quasi-persistent "-wal" file and "-shm" shared memory file associated with each database, which can make SQLite less appealing for use as an application file-format. [1], 1. Overview
  > The WAL file is part of the persistent state of the database and should be kept with the database if the database is copied or moved. If a database file is separated from its WAL file, then transactions that were previously committed to the database might be lost, or the database file might become corrupted. [1], 4. The WAL File

- fact-0f15aa2769c54a799b8a9bc6c081fee8 [confirmed]: SQLite's WAL page says WAL works as efficiently as rollback mode with large transactions since 3.11.0, yet a large write can still grow the WAL file very big until it completes. [1]; as of unknown; one publisher.
  > Beginning with version 3.11.0 (2016-02-15), WAL mode works as efficiently with large transactions as does rollback mode. [1], 1. Overview
  > So a large change to a large database might result in a large WAL file. The WAL file will be checkpointed once the write transaction completes (assuming there are no other readers blocking it) but in the meantime, the file can grow very big. [1], 6. Avoiding Excessively Large WAL Files

</details>

### How is WAL mode enabled, and does the setting persist across connections and database closes?

WAL is enabled with PRAGMA journal\_mode=WAL and, unlike other journal modes, stays in effect across connections and after the database is closed and reopened. [1] [9]

SQLite connections default to journal\_mode=DELETE, so WAL must be requested explicitly. [1] The pragma returns "wal" when conversion succeeds; if conversion fails, for example because the VFS lacks shared-memory primitives, the mode is unchanged and the prior mode is returned. [1]

Setting WAL mode on any one connection sets it on all connections to the same database file. [1] Because the mode is persistent, applications can be converted to WAL without code changes. [1] [9]

The journal mode cannot be changed while a transaction is active, and an in-memory database is limited to MEMORY or OFF, so it cannot use WAL. [9] A WAL-mode database is accessible only by SQLite 3.7.0 or later; switching back with PRAGMA journal\_mode=DELETE resets the file format version numbers to 1 for older versions. [1] [9]

<details>
<summary>Facts behind this answer (6)</summary>

- fact-c866bae91db842c896d1916b13854ade [confirmed]: SQLite connections default to journal\_mode=DELETE, and WAL mode is enabled by running the statement PRAGMA journal\_mode=WAL. [1]; as of unknown; one publisher.
  > An SQLite database connection defaults to journal\_mode=DELETE. To convert to WAL mode, use the following pragma:
  > 
  > PRAGMA journal\_mode=WAL; [1], 3. Activating And Configuring WAL Mode

- fact-30a591426dea4307be436270e9883bcc [confirmed]: SQLite's journal\_mode pragma returns "wal" when conversion succeeds; if conversion fails, for example because the VFS lacks shared-memory primitives, the mode is unchanged and the prior mode is returned. [1]; as of unknown; one publisher.
  > The journal\_mode pragma returns a string which is the new journal mode. On success, the pragma will return the string "wal". If the conversion to WAL could not be completed (for example, if the VFS does not support the necessary shared-memory primitives) then the journaling mode will be unchanged and the string returned from the primitive will be the prior journaling mode (for example "delete"). [1], 3. Activating And Configuring WAL Mode

- fact-422254d347da4231b71bda5f1592ce00 [confirmed]: Unlike other SQLite journal modes, WAL mode is persistent: it stays in effect across connections and after closing and reopening the database, so applications can be converted without code changes. [1] [9]; as of unknown; one publisher.
  > The WAL journaling mode is persistent; after being set it stays in effect across multiple database connections and after closing and reopening the database. [9], PRAGMA journal\_mode
  > Unlike the other journaling modes, PRAGMA journal\_mode=WAL is persistent. If a process sets WAL mode, then closes and reopens the database, the database will come back in WAL mode. [1], 3.3. Persistence of WAL mode
  > The persistence of WAL mode means that applications can be converted to using SQLite in WAL mode without making any changes to the application itself. [1], 3.3. Persistence of WAL mode

- fact-d0710fd273e94b9593d70853d0d3131e [confirmed]: Setting SQLite WAL journal mode on any one connection sets it on all connections to the same database file. [1]; as of unknown; one publisher.
  > The WAL journal mode will be set on all connections to the same database file if it is set on any one connection. [1], 3.3. Persistence of WAL mode

- fact-0a569967885f411b9412049336cc16e7 [confirmed]: SQLite cannot change journal\_mode while a transaction is active, and an in-memory database's journal mode is limited to MEMORY or OFF, so it cannot use WAL. [9]; as of unknown; one publisher.
  > Note that the journal\_mode for an in-memory database is either MEMORY or OFF and can not be changed to a different value. An attempt to change the journal\_mode of an in-memory database to any setting other than MEMORY or OFF is ignored. Note also that the journal\_mode cannot be changed while a transaction is active. [9], PRAGMA journal\_mode

- fact-b3b5fd12beb3437fa34c9bad13c188bb [confirmed]: A WAL-mode SQLite database is accessible only by SQLite 3.7.0 or later; switching back with PRAGMA journal\_mode=DELETE resets the file format version numbers to 1 for older versions. [1] [9]; as of unknown; one publisher.
  > A database in WAL journaling mode can only be accessed by SQLite version 3.7.0 (2010-07-21) or later. [9], PRAGMA journal\_mode
  > Deliberately changing out of WAL mode changes the database file format version numbers back to 1 so that older versions of SQLite can once again access the database file. [1], 10. Backwards Compatibility

</details>

### What performance advantages and disadvantages does SQLite's documentation give for WAL compared with rollback-journal mode, and for which workloads?

SQLite's documentation says WAL is significantly faster than a rollback journal in most scenarios, the main exception being read-mostly workloads, where it might be perhaps 1% or 2% slower. [1]

Write transactions gain most, because WAL writes content once rather than twice as rollback-journal transactions do, and the writes are sequential. [1] The documentation also credits WAL with more sequential disk I/O and many fewer fsync() operations. [1]

Read performance falls as the WAL file grows, so SQLite advises regular checkpoints: frequent checkpoints favour reads, while infrequent ones favour write throughput. [1] Under the default auto-checkpoint at about 1000 pages, most COMMITs are very fast, but a COMMIT that triggers a checkpoint is much slower unless checkpoints run in a separate thread or process. [1]

The durability setting also affects cost: with synchronous=FULL, WAL adds a sync after every transaction commit, while NORMAL syncs only around checkpoints and WAL reuse. [1] [9]

For large-transaction workloads, SQLite states that WAL has worked as efficiently as rollback mode since version 3.11.0, and the earlier large-transaction warning is struck from current documentation. [1] Even so, a large write can still grow the WAL file very big until it completes. [1]

<details>
<summary>Facts behind this answer (6)</summary>

- fact-5462afa5594c44048e3681de42db1839 [confirmed]: SQLite's WAL documentation says WAL is significantly faster than a rollback journal in most scenarios, with more sequential disk I/O and many fewer fsync() operations. [1]; as of unknown; one publisher.
  > WAL is significantly faster in most scenarios. [1], 1. Overview
  > Disk I/O operations tends to be more sequential using WAL. [1], 1. Overview
  > WAL uses many fewer fsync() operations and is thus less vulnerable to problems on systems where the fsync() system call is broken. [1], 1. Overview

- fact-a1691433d5a042e69188b4d778bc6bda [confirmed]: For read-mostly workloads that seldom write, SQLite says WAL might be very slightly slower than rollback-journal mode, perhaps 1% or 2%. [1]; as of unknown; one publisher.
  > WAL might be very slightly slower (perhaps 1% or 2% slower) than the traditional rollback-journal approach in applications that do mostly reads and seldom write. [1], 1. Overview

- fact-9e7e6911521f46caae8c708adfcbc8de [confirmed]: WAL write transactions are very fast because content is written once rather than twice as with rollback-journal transactions, and the writes are sequential. [1]; as of unknown; one publisher.
  > Write transactions are very fast since they only involve writing the content once (versus twice for rollback-journal transactions) and because the writes are all sequential. [1], 2.3. Performance Considerations

- fact-121c9dbe3bdd41ea98f2658d7ae9d588 [confirmed]: In WAL mode, read performance falls as the WAL file grows, so SQLite advises regular checkpoints; frequent checkpoints favour reads while infrequent ones favour write throughput. [1]; as of unknown; one publisher.
  > Hence, to maintain good read performance it is important to keep the WAL file size down by running checkpoints at regular intervals. [1], 2.3. Performance Considerations
  > To maximize the read performance, one wants to keep the WAL as small as possible and hence run checkpoints frequently, perhaps as often as every COMMIT. To maximize write performance, one wants to amortize the cost of each checkpoint over as many writes as possible [1], 2.3. Performance Considerations

- fact-cccb87d467bf4d84b2eec07d06e3e72e [confirmed]: Under WAL's default auto-checkpoint at about 1000 pages, most COMMITs are very fast but a COMMIT that triggers a checkpoint is much slower, unless checkpoints run in a separate thread or process. [1]; as of unknown; one publisher.
  > The default strategy is to allow successive write transactions to grow the WAL until the WAL becomes about 1000 pages in size, then to run a checkpoint operation for each subsequent COMMIT until the WAL is reset to be smaller than 1000 pages. [1], 2.3. Performance Considerations
  > This has the effect of causing most COMMIT operations to be very fast but an occasional COMMIT (those that trigger a checkpoint) to be much slower. If that effect is undesirable, then the application can disable automatic checkpointing and run the periodic checkpoints in a separate thread, or separate process. [1], 2.3. Performance Considerations

- fact-3b778e66dcaf4b9b80f63d4bdf7b67bb [confirmed]: For large-transaction workloads, SQLite states that since version 3.11.0 WAL mode works as efficiently as rollback mode; the earlier large-transaction warning is struck from current documentation. [1]; as of unknown; one publisher.
  > Beginning with version 3.11.0 (2016-02-15), WAL mode works as efficiently with large transactions as does rollback mode. [1], 1. Overview

</details>


## Gaps

- What happens to committed and uncommitted transactions in the WAL after a crash or power loss? (partly answered): Checker's assessment: wal.html and fileformat2.html confirm that commits are marked by commit frames, that only valid frames that are or precede a commit frame are read, and that a recovery process runs under an exclusive lock, but neither page describes the recovery procedure itself (rebuilding the wal-index, handling a torn or partially written final frame). That uncommitted WAL frames are discarded after a crash is therefore inferred from the reader algorithm and frame-validity rules rather than stated as recovery behaviour. [1] [10]
- Follow-up question (gap-question-1): What performance advantages and disadvantages does SQLite's documentation give for WAL compared with rollback-journal mode, and for which workloads?

## Conflicts and history

- fact-565e8c8c68534a6585433269fd182503 → fact-63253385d11747f1867e405194c34f5e (narrowed): The source says only that disabling the automatic checkpoint leaves nothing to stop excessive WAL growth. It mentions deferring only as something the options can do, not as having the same consequence.
- fact-224113b2486141c8bb9e4fd3e2fd9fec → fact-140601ea397f46bba39266636af8ae82 (narrowed): The two cited pages disagree: wal.html says readers might block, while the wal\_checkpoint\_v2 page says RESTART blocks new writers but not readers. Saying 'readers or writers' hides that conflict. The 'runs to completion' wording is also wal.html's own; the v2 page says the checkpoint falls back to PASSIVE and returns SQLITE\_BUSY if the busy-handler gives up.
- fact-21d443c027da4e5d8ef7b837663e888c → fact-be52d5dd86704a5eab533e9d62c6376c (narrowed): The unqualified 'readers never see another connection's uncommitted changes' overstates the source: the same page (Isolation Between Database Connections, and the Summary's own context) states the exception that shared-cache connections with PRAGMA read\_uncommitted turned on can see uncommitted changes. The narrowed statement keeps to what the cited sentences say.
- fact-366c77d7c5a24fb197aef04badba7f78 → fact-70f8b6c8f875474291a2a5561a861e23 (narrowed): The last-connection cleanup case does appear in section 9 of the original, but none of the cited quotes contains it, so the statement goes beyond its citations. The narrowed statement keeps the two cases the quotes support.
- fact-f9fd5e4ace994ef586358c5b17c4db75 → fact-0f15aa2769c54a799b8a9bc6c081fee8 (narrowed): Both quotes occur and support the claims, but only as the page's own statements. In the same Overview list, just before the 3.11.0 sentence, wal.html also says WAL does not work well for very large transactions, that rollback modes will likely be faster above about 100 MB, that WAL may fail with an I/O or disk-full error above a gigabyte, and that rollback modes are recommended for transactions over a few dozen megabytes. The unqualified 'handles large transactions as efficiently' wording drops that nearby guidance, so the statement is narrowed to what the page says.
- fact-1fd3e83de0c046b0a815e028697cd3ba → fact-8ccab712a9884628acc8019fe77819af (narrowed): Both quotes occur in the PRAGMA synchronous section of pragma.html, but neither cited quote mentions operating-system crashes; they support application-crash durability in every mode and FULL's extra sync for power-loss durability, not a general claim that the whole NORMAL-versus-FULL difference concerns OS crashes.
- fact-67c6c606df334881a485dc470732db94 → fact-2e666c2d0d2c4b7abd27cdb8270a6e37 (narrowed): The quote occurs verbatim on wal.html and supports the statement, but its locator is wrong: the passage is in section 9, 'Sometimes Queries Return SQLITE\_BUSY In WAL Mode', not 2.2 Concurrency. Wording aligned to the source's 'recovery process'.

## Sources

1. [Write-Ahead Logging](https://www.sqlite.org/wal.html); SQLite project; primary; found; saved 2026-10-16T18:38:57.550Z; source date unknown.
2. [Checkpoint a database (sqlite3\_wal\_checkpoint\_v2)](https://www.sqlite.org/c3ref/wal_checkpoint_v2.html); SQLite project; primary; found; saved 2026-10-16T18:38:57.552Z; source date unknown.
3. [Configure an auto-checkpoint (sqlite3\_wal\_autocheckpoint)](https://www.sqlite.org/c3ref/wal_autocheckpoint.html); SQLite project; primary; found; saved 2026-10-16T18:38:57.552Z; source date unknown.
4. [Isolation In SQLite](https://www.sqlite.org/isolation.html); SQLite project; primary; found; saved 2026-10-16T18:39:16.293Z; source date unknown.
5. [Transaction](https://www.sqlite.org/lang_transaction.html); SQLite project; primary; found; saved 2026-10-16T18:39:16.295Z; source date unknown.
6. [Result and Error Codes](https://www.sqlite.org/rescode.html); SQLite project; primary; found; saved 2026-10-16T18:39:16.296Z; source date unknown.
7. [File Locking And Concurrency In SQLite Version 3](https://www.sqlite.org/lockingv3.html); SQLite project; primary; found; saved 2026-10-16T18:39:16.296Z; source date unknown.
8. [SQLite Over a Network, Caveats and Considerations](https://www.sqlite.org/useovernet.html); SQLite project; primary; found; saved 2026-10-16T18:39:16.586Z; source date 2022-06-22.
9. [Pragma statements supported by SQLite](https://www.sqlite.org/pragma.html); SQLite project; primary; found; saved 2026-10-16T18:39:16.587Z; source date 2026-10-04.
10. [Database File Format](https://www.sqlite.org/fileformat2.html); SQLite project; primary; found; saved 2026-10-16T18:39:50.666Z; source date 2025-12-25.
11. [How To Corrupt An SQLite Database File](https://www.sqlite.org/howtocorrupt.html); SQLite project; primary; found; saved 2026-10-16T18:39:50.667Z; source date 2026-04-13.

## Rejected facts and failed tasks

