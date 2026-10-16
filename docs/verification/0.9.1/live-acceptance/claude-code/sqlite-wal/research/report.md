# SQLite WAL mode for application teams

Request: How SQLite write-ahead logging (WAL) mode works for an application team deciding whether to enable it: reader/writer interaction, checkpoints, durability and limitations

Run: 430fd4b5583c409fb2dab837; output revision: 51.
Status: complete-with-gaps. Depth: light. Started 2026-10-16; updated 2026-10-16.
Runtime: 0.9.1; guidance: 0.9.1 (local runtime guidance).

How SQLite's write-ahead logging (WAL) journal mode works, for an application team deciding whether to enable it: reader/writer concurrency, checkpoints, durability and crash recovery, and limitations. Public sources, sqlite.org documentation first; current documentation as of October 2026.

Sources given: none; further public sources were permitted.
Counts: 10 questions (10 answered, 0 partly, 0 not answered or not yet assessed); 123 current checked facts from 17 sources; 0 rejected, 15 narrowed; 4 gaps; 1 conflicts.
How facts were checked: each fact by a separate invocation from the one that researched it, against the original source (checkers: cc-8556e61a on claude-code, cc-af3fa518 on claude-code, cc-01608e4e on claude-code, cc-0f8dbcd5 on claude-code, cc-7b95f79c on claude-code, cc-dc1cf796 on claude-code).
Prose: citation and number validation, but no independent semantic writing review at light depth.
Facts are checked for source support, not certified as true or live-current.

Approval: Trial Reviewer approved output revision 35 on 2026-10-16; it no longer applies. The research changed since it was approved.

Plan notes: light depth usually plans 15 to 25 questions; this plan has 9. That suits a narrow request; otherwise add questions. light depth usually covers 6 to 10 sections; this plan has 4.

Researched again on request: round 1 (1 question; Focus on what happens when a single read transaction stays open for a long time (effect on checkpoint progress, WAL growth and reset, read performance), and how an application can detect checkpoint starvation (for example wal\_checkpoint/sqlite3\_wal\_checkpoint\_v2 return values and log/checkpointed frame counts, SQLITE\_BUSY, WAL file size) and avoid it (reader gaps, short read transactions, RESTART/TRUNCATE checkpoints and busy handlers, journal\_size\_limit, related compile-time or run-time options).).

Sources re-read: round 2 on 2026-10-16 (16 unchanged, 1 changed, 0 could not be opened; 0 questions researched again).

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

- Readers and writers: 24 current checked facts; 2/2 questions answered with current evidence.
- Checkpoints: 36 current checked facts; 2/2 questions answered with current evidence.
- Durability and recovery: 22 current checked facts; 2/2 questions answered with current evidence.
- Limitations and enabling: 43 current checked facts; 4/4 questions answered with current evidence.

## Readers and writers

### In WAL mode, do readers and writers block each other, and what does a reader see while a write is in progress?

In WAL mode readers and writers ordinarily do not block each other, and each read transaction sees a fixed snapshot of the database as of the last commit before it started. [1] [4]

In WAL mode, changes are appended to a separate WAL file and a transaction commits when a commit record is appended there, so committing need not write the original database file and readers can keep using it unaltered. [1] [13] As a result, readers ordinarily do not block writers and a writer does not block readers, so reading and writing can generally proceed concurrently. [1] [4] By contrast, rollback mode must temporarily expel all readers before a writer changes the database file on disk. [4]

When a read transaction starts, it fixes an "end mark" at the last valid commit record, so it sees the database as of a single point in time. [1] For each page, the reader uses the last copy in the WAL before its end mark, or otherwise the page in the database file, and it locates WAL pages through a shared-memory wal-index. [1] That shared-memory wal-index is why all readers must be on the same machine. [1] The result is snapshot isolation: write transactions that commit while a read transaction is open stay invisible to that reader. [4] To see changes another connection committed meanwhile, the reading connection must end its read transaction and begin a new one, for example with COMMIT then BEGIN. [4] [5] A reader on a separate connection never sees a writer's uncommitted changes, unless both connections share a cache and the reader enables PRAGMA read\_uncommitted. [4]

The non-blocking behaviour has exceptions: queries can return SQLITE\_BUSY when another connection uses exclusive locking mode, while the last connection cleans up, or during crash recovery. [1] During WAL recovery after a crash, exclusive locks stop other connections from writing or reading WAL transactions until recovery completes, so a concurrent query may get SQLITE\_BUSY. [1] [14] An operation that cannot continue because another process is recovering the database gets the extended code SQLITE\_BUSY\_RECOVERY, which SQLite returns only on WAL databases. [6]

Readers also affect checkpoints: a checkpoint runs alongside readers but stops at pages past any current reader's end mark, so a long-running read transaction can stall checkpoint progress. [1] If many overlapping readers keep at least one read transaction always active, no checkpoint can complete or reset the WAL, and the WAL file grows without bound. [1] The WAL documentation says manual SQLITE\_CHECKPOINT\_RESTART and SQLITE\_CHECKPOINT\_TRUNCATE checkpoints run to completion, but that readers might block while such a checkpoint runs. [1] SQLite's checkpoint API documentation qualifies that completion claim: if the busy handler returns 0 before a FULL, RESTART or TRUNCATE checkpoint gets the writer lock or while it waits for readers, the checkpoint continues like PASSIVE and returns SQLITE\_BUSY. [9] Read together, these sources say a RESTART or TRUNCATE checkpoint might block readers while it runs but is not guaranteed to complete. [1] [9]

Facts behind this answer:

- fact-f4fe5c7a2acd4f9e9cfbcaff1b8172dc [confirmed]: Each SQLite WAL-mode read transaction fixes an "end mark" at the last valid commit record when it starts, so it sees the database as of a single point in time. [1]; as of unknown; one publisher.
  > When a read operation begins on a WAL-mode database, it first remembers the location of the last valid commit record in the WAL. Call this point the "end mark". Because the WAL can be growing and adding new commit records while various readers connect to the database, each reader can potentially have its own end mark. But for any particular reader, the end mark is unchanged for the duration of the transaction, thus ensuring that a single read transaction only sees the database content as it existed at a single point in time. [1], 2.2. Concurrency

- fact-a8321c3cd55d44209ff83ce94da13b6e [confirmed]: A SQLite WAL-mode reader takes each page from the last WAL copy before its end mark, otherwise from the database file, using a shared-memory wal-index to locate pages. [1]; as of unknown; one publisher.
  > When a reader needs a page of content, it first checks the WAL to see if that page appears there, and if so it pulls in the last copy of the page that occurs in the WAL prior to the reader's end mark. If no copy of the page exists in the WAL prior to the reader's end mark, then the page is read from the original database file. [1], 2.2. Concurrency
  > a data structure called the "wal-index" is maintained in shared memory which helps readers locate pages in the WAL quickly and with a minimum of I/O. [1], 2.2. Concurrency

- fact-ba2a04b7678f4e00bbc014eaac922c21 [confirmed]: SQLite WAL mode gives snapshot isolation: write transactions that commit while a read transaction is open stay invisible to that reader. [4]; as of unknown; one publisher.
  > In WAL mode, SQLite exhibits "snapshot isolation". When a read transaction starts, that reader continues to see an unchanging "snapshot" of the database file as it existed at the moment in time when the read transaction started. Any write transactions that commit while the read transaction is active are still invisible to the read transaction, because the reader is seeing a snapshot of database file from a prior moment in time. [4], Isolation And Concurrency

- fact-da3881dfc0324191b88d3b20506f52de [confirmed]: A SQLite connection holding a read transaction must end it and begin a new one, such as COMMIT then BEGIN, to see changes another connection committed meanwhile. [4] [5]; as of unknown; one publisher.
  > X can subsequently do a SELECT against the records that Y modified but X will see the older unmodified entries because Y's changes are all invisible to X while X is holding a read transaction. If X wants to see the changes that Y made, then X must end its read transaction and start a new one (by running COMMIT followed by another BEGIN.) [4], Isolation And Concurrency
  > While its read transaction is active, X will continue to see an historic snapshot of the database prior to the changes implemented by Y. [5], 2.1. Read transactions versus write transactions

- fact-05834bb864de48a795bd4c2cb55ec51e [confirmed]: SQLite readers on a separate connection never see a writer's uncommitted changes, unless both connections share a cache and the reader enables PRAGMA read\_uncommitted. [4]; as of unknown; one publisher.
  > then the reader is only able to see complete committed transactions from the writer. Partial changes by the writer that have not been committed are invisible to the reader. [4], Isolation Between Database Connections
  > The combined use of shared cache mode and the read\_uncommitted pragma is the only way that one database connection can see uncommitted changes on a different database connection. [4], Isolation Between Database Connections

- fact-145e388d3dc849dfa8a546c6bb37d23f [confirmed]: SQLite WAL mode's non-blocking behaviour has exceptions: queries can return SQLITE\_BUSY when another connection uses exclusive locking mode, while the last connection cleans up, or during crash recovery. [1]; as of unknown; one publisher.
  > The second advantage of WAL-mode is that writers do not block readers and readers do not block writers. This is mostly true. But there are some obscure cases where a query against a WAL-mode database can return SQLITE\_BUSY, so applications should be prepared for that happenstance. [1], 9. Sometimes Queries Return SQLITE\_BUSY In WAL Mode
  > If another database connection has the database mode open in exclusive locking mode then all queries against the database will return SQLITE\_BUSY. [1], 9. Sometimes Queries Return SQLITE\_BUSY In WAL Mode
  > When the last connection to a particular database is closing, that connection will acquire an exclusive lock for a short time while it cleans up the WAL and shared-memory files. [1], 9. Sometimes Queries Return SQLITE\_BUSY In WAL Mode
  > If the last connection to a database crashed, then the first new connection to open the database will start a recovery process. An exclusive lock is held during recovery. [1], 9. Sometimes Queries Return SQLITE\_BUSY In WAL Mode

- fact-e456c66d205a48bd982efa682ac6267c [confirmed]: SQLite returns the extended code SQLITE\_BUSY\_RECOVERY, only on WAL databases, when an operation cannot continue because another process is recovering the database after a crash. [6]; as of unknown; one publisher.
  > The SQLITE\_BUSY\_RECOVERY error code is an extended error code for SQLITE\_BUSY that indicates that an operation could not continue because another process is busy recovering a WAL mode database file following a crash. The SQLITE\_BUSY\_RECOVERY error code only occurs on WAL mode databases. [6], (261) SQLITE\_BUSY\_RECOVERY

- fact-e348785753264d28a7793cfa0c07097a [confirmed]: In SQLite WAL mode a checkpoint runs alongside readers but stops at pages past any current reader's end mark, so a long-running read transaction can stall checkpoint progress. [1]; as of unknown; one publisher.
  > A checkpoint can run concurrently with readers, however the checkpoint must stop when it reaches a page in the WAL that is past the end mark of any current reader. [1], 2.2. Concurrency
  > Thus a long-running read transaction can prevent a checkpointer from making progress. [1], 2.2. Concurrency

- fact-c2ba83a076a84227b8e08fa3577bbe99 [confirmed]: SQLite's manual SQLITE\_CHECKPOINT\_RESTART and SQLITE\_CHECKPOINT\_TRUNCATE checkpoints run to completion, but readers might block while such a checkpoint runs. [1]; as of unknown; one publisher.
  > In applications with many concurrent readers, one might also consider running manual checkpoints with the SQLITE\_CHECKPOINT\_RESTART or SQLITE\_CHECKPOINT\_TRUNCATE option which will ensure that the checkpoint runs to completion before returning. The disadvantage of using SQLITE\_CHECKPOINT\_RESTART and SQLITE\_CHECKPOINT\_TRUNCATE is that readers might block while the checkpoint is running. [1], 6. Avoiding Excessively Large WAL Files

- fact-f4b51352d2e142a1bd02c1f38cebebac [confirmed]: By contrast with WAL mode, SQLite rollback mode must temporarily expel all readers before a writer changes the database file on disk. [4]; as of unknown; one publisher.
  > In rollback mode, SQLite implements isolation by locking the database file and preventing any reads by other database connections while each write transaction is underway. [4], Isolation And Concurrency
  > But before any changes are made to the database file on disk, all readers must be (temporarily) expelled in order to give the writer exclusive access to the database file. [4], Isolation And Concurrency

- fact-3e16e2e7d44042008ae960ac9e806713 [confirmed]: In SQLite WAL mode, readers ordinarily do not block writers and a writer does not block readers, so reading and writing can generally proceed concurrently. [1] [4]; as of unknown; one publisher.
  > WAL provides more concurrency as readers do not block writers and a writer does not block readers. Reading and writing can proceed concurrently. [1], 1. Overview
  > WAL mode permits simultaneous readers and writers. It can do this because changes do not overwrite the original database file, but rather go into the separate write-ahead log file. [4], Isolation And Concurrency

- fact-ead45266be2241a280bb8c4c69ba7738 [confirmed]: In SQLite WAL mode, changes are appended to a separate WAL file and a COMMIT occurs when a commit record is appended there, so committing need not write the original database and readers can keep using it unaltered. [1]; as of unknown; one publisher.
  > The original content is preserved in the database file and the changes are appended into a separate WAL file. A COMMIT occurs when a special record indicating a commit is appended to the WAL. Thus a COMMIT can happen without ever writing to the original database, which allows readers to continue operating from the original unaltered database while changes are simultaneously being committed into the WAL. [1], 2. How WAL Works

### How many writers can be active at once in WAL mode, and what happens when another connection tries to write?

WAL mode allows only one writer at a time alongside any readers, and another connection that tries to start a write meanwhile gets SQLITE\_BUSY and must wait for the first transaction to finish. [1] [6]

WAL mode allows only one writer at a time because there is only one WAL file, although that writer runs alongside readers. [1] SQLite supports multiple simultaneous read transactions from separate connections, threads or processes, but only one simultaneous write transaction. [5] Many open connections may write to the database, but they take turns, with SQLite applying the locks automatically rather than the application. [4]

When a second connection tries to start a write transaction while another write is underway, it gets SQLITE\_BUSY and must wait for the first transaction to finish. [6] SQLite's default busy callback is NULL, so unless a handler or timeout is set, a connection gets SQLITE\_BUSY immediately when it meets a lock. [8] SQLite offers sqlite3\_busy\_timeout(), sqlite3\_busy\_handler() and PRAGMA busy\_timeout so that a connection blocked by another writer can handle SQLITE\_BUSY by waiting and retrying. [6] [8] The sqlite3\_busy\_timeout() handler sleeps repeatedly until at least the given number of milliseconds have accumulated, and then lets sqlite3\_step() return SQLITE\_BUSY. [7] A busy handler is not guaranteed to run: if invoking it could cause a deadlock, SQLite returns SQLITE\_BUSY to the application instead. [8]

Transactions default to DEFERRED, so a transaction that starts with SELECT is a read transaction, and a later write upgrades it only if no other connection has modified or is modifying the database; otherwise the write gets SQLITE\_BUSY. [5] In WAL mode, a read transaction that tries to write after another connection has written fails with SQLITE\_BUSY\_SNAPSHOT and must release its snapshot and start a new transaction. [4] [6] BEGIN IMMEDIATE instead starts a write transaction at once and blocks other writers; it may itself fail with SQLITE\_BUSY, but once it succeeds, later statements in that transaction never fail with SQLITE\_BUSY. [4] [5] In WAL mode, BEGIN EXCLUSIVE behaves the same as BEGIN IMMEDIATE; only in other journal modes does EXCLUSIVE also stop other connections from reading. [5]

This concurrency is limited to one host: all processes using a WAL database must be on the same host, so WAL does not work over a network filesystem. [1] For clients on several machines needing simultaneous reads and writes, SQLite suggests WAL only if all reads and writes run on the database machine, with a proxy relaying remote requests. [2]

Facts behind this answer:

- fact-008171a4fd584daeaa0c8535266e4fd1 [confirmed]: SQLite WAL mode allows only one writer at a time, because there is only one WAL file, although that writer runs alongside readers. [1]; as of unknown; one publisher.
  > Writers merely append new content to the end of the WAL file. Because writers do nothing that would interfere with the actions of readers, writers and readers can run at the same time. However, since there is only one WAL file, there can only be one writer at a time. [1], 2.2. Concurrency

- fact-66c9ccd91c80417fb8ebd83a875b56f4 [confirmed]: SQLite supports multiple simultaneous read transactions from separate connections, threads or processes, but only one simultaneous write transaction. [5]; as of unknown; one publisher.
  > SQLite supports multiple simultaneous read transactions coming from separate database connections, possibly in separate threads or processes, but only one simultaneous write transaction. [5], 2.1. Read transactions versus write transactions

- fact-e5471f35e33b42549f7335b5d5a6f8ba [confirmed]: SQLite serializes writes: many open connections may write to the database, but they take turns, with locks applied automatically rather than by the application. [4]; as of unknown; one publisher.
  > SQLite implements serializable transactions by actually serializing the writes. There can only be a single writer at a time to an SQLite database. There can be multiple database connections open at the same time, and all of those database connections can write to the database file, but they have to take turns. SQLite uses locks to serialize the writes automatically; this is not something that the applications using SQLite need to worry about. [4], Isolation Between Database Connections

- fact-5c5eeb33e71d499bb8b67a8893abb504 [confirmed]: When a second SQLite connection tries to start a write transaction while another write is underway, it gets SQLITE\_BUSY and must wait for the first transaction to finish. [6]; as of unknown; one publisher.
  > For example, if process A is in the middle of a large write transaction and at the same time process B attempts to start a new write transaction, process B will get back an SQLITE\_BUSY result because SQLite only supports one writer at a time. Process B will need to wait for process A to finish its transaction before starting a new transaction. [6], (5) SQLITE\_BUSY

- fact-dffa5e2aa61145bd8afa8b80bb63e739 [confirmed]: SQLite offers sqlite3\_busy\_timeout(), sqlite3\_busy\_handler() and PRAGMA busy\_timeout so a connection blocked by another writer can handle SQLITE\_BUSY by waiting and retrying. [6] [8]; as of unknown; one publisher.
  > The sqlite3\_busy\_timeout() and sqlite3\_busy\_handler() interfaces and the busy\_timeout pragma are available to process B to help it deal with SQLITE\_BUSY errors. [6], (5) SQLITE\_BUSY
  > If the callback returns non-zero, then another attempt is made to access the database and the cycle repeats. [8], Register A Callback To Handle SQLITE\_BUSY Errors

- fact-2295e7b81fa741ceb1ea3cad4d7a7c4d [confirmed]: SQLite's sqlite3\_busy\_timeout() handler sleeps repeatedly until at least the given number of milliseconds have accumulated, then lets sqlite3\_step() return SQLITE\_BUSY. [7]; as of unknown; one publisher.
  > This routine sets a busy handler that sleeps for a specified amount of time when a table is locked. The handler will sleep multiple times until at least "ms" milliseconds of sleeping have accumulated. After at least "ms" milliseconds of sleeping, the handler returns 0 which causes sqlite3\_step() to return SQLITE\_BUSY. [7], Set A Busy Timeout

- fact-9cc4966dfdaf47178f683e1539f1d3be [confirmed]: SQLite's default busy callback is NULL, so unless a handler or timeout is set, a connection gets SQLITE\_BUSY immediately when it meets a lock. [8]; as of unknown; one publisher.
  > If the busy callback is NULL, then SQLITE\_BUSY is returned immediately upon encountering the lock. [8], Register A Callback To Handle SQLITE\_BUSY Errors
  > The default busy callback is NULL. [8], Register A Callback To Handle SQLITE\_BUSY Errors

- fact-eaddb86712794aa9abf49464bbbca6d3 [confirmed]: SQLite does not guarantee a busy handler runs: if invoking it could cause a deadlock, SQLite returns SQLITE\_BUSY to the application instead. [8]; as of unknown; one publisher.
  > The presence of a busy handler does not guarantee that it will be invoked when there is lock contention. If SQLite determines that invoking the busy handler could result in a deadlock, it will go ahead and return SQLITE\_BUSY to the application instead of invoking the busy handler. [8], Register A Callback To Handle SQLITE\_BUSY Errors

- fact-dd7aea979eee4d03b8c9720e50a1ac34 [confirmed]: In SQLite WAL mode, a read transaction that tries to write after another connection has written fails with SQLITE\_BUSY\_SNAPSHOT and must release its snapshot and start a new transaction. [4] [6]; as of unknown; one publisher.
  > The attempt by X to escalate its transaction from a read transaction to a write transaction fails with an SQLITE\_BUSY\_SNAPSHOT error because the snapshot of the database being viewed by X is no longer the latest version of the database. If X were allowed to write, it would fork the history of the database file, which is something SQLite does not support. In order for X to write to the database, it must first release its snapshot (using ROLLBACK for example) then start a new transaction with a subsequent BEGIN. [4], Isolation And Concurrency
  > The SQLITE\_BUSY\_SNAPSHOT error code is an extended error code for SQLITE\_BUSY that occurs on WAL mode databases when a database connection tries to promote a read transaction into a write transaction but finds that another database connection has already written to the database and thus invalidated prior reads. [6], (517) SQLITE\_BUSY\_SNAPSHOT

- fact-41d50184b70643c2bcabd50bf65f2883 [confirmed]: SQLite transactions default to DEFERRED, so one starting with SELECT is a read transaction whose later write upgrades it only if no other connection has modified or is modifying the database, otherwise SQLITE\_BUSY. [5]; as of unknown; one publisher.
  > Transactions can be DEFERRED, IMMEDIATE, or EXCLUSIVE. The default transaction behavior is DEFERRED. [5], 2.2. DEFERRED, IMMEDIATE, and EXCLUSIVE transactions
  > If a write statement occurs while a read transaction is active, then the read transaction is upgraded to a write transaction if possible. If some other database connection has already modified the database or is already in the process of modifying the database, then upgrading to a write transaction is not possible and the write statement will fail with SQLITE\_BUSY. [5], 2.1. Read transactions versus write transactions

- fact-e9cbb0f38dc24879aa66e4769fde34b5 [confirmed]: In SQLite WAL mode BEGIN EXCLUSIVE behaves the same as BEGIN IMMEDIATE; only in other journal modes does EXCLUSIVE also stop other connections reading. [5]; as of unknown; one publisher.
  > EXCLUSIVE is similar to IMMEDIATE in that a write transaction is started immediately. EXCLUSIVE and IMMEDIATE are the same in WAL mode, but in other journaling modes, EXCLUSIVE prevents other database connections from reading the database while the transaction is underway. [5], 2.2. DEFERRED, IMMEDIATE, and EXCLUSIVE transactions

- fact-b7d12ae195d542f59b00ad2949f475f5 [confirmed]: In SQLite WAL mode, BEGIN IMMEDIATE starts a write transaction at once, blocking other writers; it may fail with SQLITE\_BUSY, but once it succeeds later statements in that transaction never fail with SQLITE\_BUSY. [4] [5]; as of unknown; one publisher.
  > IMMEDIATE causes the database connection to start a new write immediately, without waiting for a write statement. The BEGIN IMMEDIATE might fail with SQLITE\_BUSY if another write transaction is already active on another database connection. [5], 2.2. DEFERRED, IMMEDIATE, and EXCLUSIVE transactions
  > The BEGIN IMMEDIATE command goes ahead and starts a write transaction, and thus blocks all other writers. If the BEGIN IMMEDIATE operation succeeds, then no subsequent operations in that transaction will ever fail with an SQLITE\_BUSY error. [4], Isolation And Concurrency


## Checkpoints

### What is a WAL checkpoint and when does SQLite run one automatically?

A checkpoint moves WAL transactions back into the database file, and by default SQLite runs one when a COMMIT brings the WAL to 1000 pages or more, or when the last connection closes. [1]

A WAL checkpoint is the operation that moves transactions appended in the WAL file back into the original database file. [1] In WAL mode, changes are appended to the separate WAL file and a COMMIT occurs when a commit record is appended there, so committing need not write the original database. [1] Checkpoints sync the WAL before moving content into the database and sync the database before the WAL is reset, to avoid corruption after power loss or a hard reboot. [1] With synchronous=NORMAL in WAL mode, syncs happen around checkpoints and WAL reuse, but no sync operations occur during most transactions. [1] [11]

By default, SQLite runs a checkpoint automatically whenever a COMMIT makes the WAL file 1000 pages or more, or when the last connection on the database file closes. [1] That last connection normally runs a final checkpoint and deletes the -wal and -shm files, although the WAL may remain after an unclean exit or with SQLITE\_FCNTL\_PERSIST\_WAL. [1] Once the WAL reaches about 1000 pages, the default strategy runs a checkpoint for each subsequent COMMIT until the WAL is reset to fewer than 1000 pages. [1] Normally the WAL is checkpointed at about 1000 pages, about 4MB, and then recycled by overwriting it from the beginning rather than truncated, unless journal\_size\_limit is set. [1] The default automatic checkpoint runs on the same thread as the COMMIT that pushes the WAL over its size limit, so occasional checkpoint-triggering COMMITs are much slower than most. [1] Automatic checkpoints are always PASSIVE: they do as much work as possible without interfering with other connections and might not run to completion when readers or writers are active. [1] [9]

Every new database connection starts with auto-checkpointing enabled at a threshold of 1000 pages, or at the value of the compile-time SQLITE\_DEFAULT\_WAL\_AUTOCHECKPOINT option. [1] [10] At run time, PRAGMA wal\_autocheckpoint=N makes SQLite checkpoint automatically whenever the WAL equals or exceeds N pages, and a zero or negative value turns auto-checkpointing off. [11] Because sqlite3\_wal\_autocheckpoint() is a wrapper around sqlite3\_wal\_hook(), registering a separate sqlite3\_wal\_hook() callback also disables the automatic checkpoint mechanism. [10] Applications can instead force checkpoints with PRAGMA wal\_checkpoint or sqlite3\_wal\_checkpoint(), or disable automatic checkpoints and run them during idle moments or in a separate thread or process. [1] SQLite says that with synchronous=NORMAL and checkpoints run in a separate thread or process, the main thread never blocks on sync, but transactions are no longer durable across power failure. [1]

Unlike the automatic checkpoints, which are always PASSIVE, a FULL checkpoint blocks via the busy handler until no writer is running and all readers use the latest snapshot, then checkpoints all frames. [1] [9] A RESTART checkpoint additionally waits for readers to leave the log, and a TRUNCATE checkpoint additionally truncates the log to zero bytes on success. [9] SQLite pages disagree on whether RESTART and TRUNCATE checkpoints are guaranteed to complete, as set out in the answer on checkpoint starvation. [1] [9]

Facts behind this answer:

- fact-bdff4cf39f1345dd9022d9e5084a17dd [confirmed]: A SQLite WAL checkpoint is the operation that moves transactions appended in the WAL file back into the original database file. [1]; as of unknown; one publisher.
  > Of course, one wants to eventually transfer all the transactions that are appended in the WAL file back into the original database. Moving the WAL file transactions back into the database is called a "checkpoint". [1], 2.1. Checkpointing

- fact-3ea0de63aa924a0da12b3dd894883171 [confirmed]: By default, SQLite runs a checkpoint automatically whenever a COMMIT makes the WAL file 1000 pages or more, or when the last connection on the database file closes. [1]; as of unknown; one publisher.
  > By default, SQLite will automatically checkpoint whenever a COMMIT occurs that causes the WAL file to be 1000 pages or more in size, or when the last database connection on a database file closes. [1], 3.1. Automatic Checkpoint

- fact-3c85c85f99214550abf7dfad70281752 [confirmed]: SQLite's default automatic checkpoint runs on the same thread as the COMMIT that pushes the WAL over its size limit, so occasional checkpoint-triggering COMMITs are much slower than most. [1]; as of unknown; one publisher.
  > By default, the checkpoint will be run automatically by the same thread that does the COMMIT that pushes the WAL over its size limit. This has the effect of causing most COMMIT operations to be very fast but an occasional COMMIT (those that trigger a checkpoint) to be much slower. [1], 2.3. Performance Considerations

- fact-f148049096ed466b84716b3ae102d42d [confirmed]: Once the SQLite WAL reaches about 1000 pages, the default strategy runs a checkpoint for each subsequent COMMIT until the WAL is reset to fewer than 1000 pages. [1]; as of unknown; one publisher.
  > The default strategy is to allow successive write transactions to grow the WAL until the WAL becomes about 1000 pages in size, then to run a checkpoint operation for each subsequent COMMIT until the WAL is reset to be smaller than 1000 pages. [1], 2.3. Performance Considerations

- fact-8325e184fb454e648435d87f15fb28d5 [confirmed]: SQLite's default automatic checkpoint threshold of 1000 pages can be changed at compile time with the SQLITE\_DEFAULT\_WAL\_AUTOCHECKPOINT option. [1]; as of unknown; one publisher.
  > By default, SQLite does a checkpoint automatically when the WAL file reaches a threshold size of 1000 pages. (The SQLITE\_DEFAULT\_WAL\_AUTOCHECKPOINT compile-time option can be used to specify a different default.) [1], 2.1. Checkpointing

- fact-c5b4921ca3874eb38fd384806cef14c4 [confirmed]: PRAGMA wal\_autocheckpoint=N makes SQLite checkpoint automatically whenever the WAL equals or exceeds N pages, and setting it to zero or a negative value turns auto-checkpointing off. [11]; as of unknown; one publisher.
  > This pragma queries or sets the write-ahead log auto-checkpoint interval. When the write-ahead log is enabled (via the journal\_mode pragma) a checkpoint will be run automatically whenever the write-ahead log equals or exceeds N pages in length. Setting the auto-checkpoint size to zero or a negative value turns auto-checkpointing off. [11], PRAGMA wal\_autocheckpoint

- fact-0bda9cde9a864781aee8f122ab84e840 [confirmed]: SQLite's sqlite3\_wal\_autocheckpoint() is a wrapper around sqlite3\_wal\_hook(), so registering a separate sqlite3\_wal\_hook() callback disables the automatic checkpoint mechanism. [10]; as of unknown; one publisher.
  > The sqlite3\_wal\_autocheckpoint(D,N) is a wrapper around sqlite3\_wal\_hook() that causes any database on database connection D to automatically checkpoint after committing a transaction if there are N or more frames in the write-ahead log file. [10], Configure an auto-checkpoint
  > The callback registered by this function replaces any existing callback registered using sqlite3\_wal\_hook(). Likewise, registering a callback using sqlite3\_wal\_hook() disables the automatic checkpoint mechanism configured by this function. [10], Configure an auto-checkpoint

- fact-1baa931fa973484bb7f8ebea7f9f1f6e [confirmed]: In SQLite, every new database connection starts with auto-checkpointing enabled at a threshold of 1000 pages, or the SQLITE\_DEFAULT\_WAL\_AUTOCHECKPOINT value. [10]; as of unknown; one publisher.
  > Every new database connection defaults to having the auto-checkpoint enabled with a threshold of 1000 or SQLITE\_DEFAULT\_WAL\_AUTOCHECKPOINT pages. [10], Configure an auto-checkpoint

- fact-389c469f04ce4303891df54b59a25a37 [confirmed]: SQLite's automatic checkpoints are always PASSIVE: they do as much work as possible without interfering with other connections and might not run to completion when readers or writers are active. [1] [9]; as of unknown; one publisher.
  > The default checkpoint style is PASSIVE, which does as much work as it can without interfering with other database connections, and which might not run to completion if there are concurrent readers or writers. All checkpoints initiated by sqlite3\_wal\_checkpoint() and by the automatic checkpoint mechanism are PASSIVE. [1], 3.2. Application-Initiated Checkpoints
  > The busy-handler callback is never invoked in the SQLITE\_CHECKPOINT\_PASSIVE mode. On the other hand, passive mode might leave the checkpoint unfinished if there are concurrent readers or writers. [9], SQLITE\_CHECKPOINT\_PASSIVE

- fact-95487b9f34cc4bca80de9dc5073889d0 [confirmed]: Normally the SQLite WAL is checkpointed at about 1000 pages, about 4MB, and then recycled by overwriting it from the beginning rather than truncated, unless journal\_size\_limit is set. [1]; as of unknown; one publisher.
  > In normal cases, new content is appended to the WAL file until the WAL file accumulates about 1000 pages (and is thus about 4MB in size) at which point a checkpoint is automatically run and the WAL file is recycled. The checkpoint does not normally truncate the WAL file (unless the journal\_size\_limit pragma is set). Instead, it merely causes SQLite to start overwriting the WAL file from the beginning. [1], 6. Avoiding Excessively Large WAL Files

- fact-bfb33e18e2bf4581bb8efc87d41c7f87 [confirmed]: SQLite applications can force checkpoints with PRAGMA wal\_checkpoint or sqlite3\_wal\_checkpoint(), or disable automatic checkpoints and run them during idle moments or in a separate thread or process. [1]; as of unknown; one publisher.
  > Applications using WAL do not have to do anything in order for these checkpoints to occur. But if they want to, applications can adjust the automatic checkpoint threshold. Or they can turn off the automatic checkpoints and run checkpoints during idle moments or in a separate thread or process. [1], 2.1. Checkpointing
  > But programs that want more control can force a checkpoint using the wal\_checkpoint pragma or by calling the sqlite3\_wal\_checkpoint() C interface. [1], 3.1. Automatic Checkpoint

- fact-d8fcc9a8d5d240a191f76654076ae595 [confirmed]: SQLite FULL checkpoints block via the busy handler until no writer runs and all readers use the latest snapshot, then checkpoint all frames; RESTART also awaits readers leaving the log; TRUNCATE also truncates it to zero bytes on success. [9]; as of unknown; one publisher.
  > This mode blocks (it invokes the busy-handler callback) until there is no database writer and all readers are reading from the most recent database snapshot. It then checkpoints all frames in the log file and syncs the database file. This mode blocks new database writers while it is pending, but new database readers are allowed to continue unimpeded. [9], SQLITE\_CHECKPOINT\_FULL
  > This mode works the same way as SQLITE\_CHECKPOINT\_FULL with the addition that after checkpointing the log file it blocks (calls the busy-handler callback) until all readers are reading from the database file only. This ensures that the next writer will restart the log file from the beginning. [9], SQLITE\_CHECKPOINT\_RESTART
  > This mode works the same way as SQLITE\_CHECKPOINT\_RESTART with the addition that it also truncates the log file to zero bytes just prior to a successful return. [9], SQLITE\_CHECKPOINT\_TRUNCATE

### What can prevent a checkpoint from completing or the WAL file from being reset, and what are the consequences?

A long-running SQLite read transaction stops a checkpoint from completing or resetting the WAL, and constantly overlapping readers can make the WAL grow without bound, using excess disk space and slowing queries. [1]

A SQLite checkpoint can run alongside readers but must stop at any WAL page past a current reader's end mark, because continuing might overwrite database content that reader is using. [1] A checkpoint records its progress in the wal-index and resumes from there next time, so a long-running read transaction can stop the checkpointer from making progress. [1] While another connection holds a read transaction open, a checkpoint does what it can but cannot run to completion or reset the WAL, and it restarts where it left off after the next write transaction. [1] When a write occurs, the writer rewinds the WAL to its beginning if the entire WAL has been transferred into the database and synced and no readers are using the WAL, which is what prevents unbounded WAL growth. [1] In checkpoint starvation, many overlapping readers keep at least one read transaction always active, so no checkpoint can complete or reset the WAL and the WAL file grows without bound. [1] An unboundedly growing WAL causes excess disk space usage and slow queries, because each reader must check the WAL and that time is proportional to the WAL file's size. [1] The wal-index speeds finding pages in the WAL, but read performance still falls off as the WAL grows. [1]

Writers can also keep the WAL from being reset: it cannot be reset in the middle of a write transaction, so a very large write transaction can make the WAL grow very big until it completes. [1] Compile-time and run-time options can disable or defer the automatic checkpoint, and if an application disables it, nothing prevents the WAL file from growing excessively. [1] sqlite3\_wal\_autocheckpoint(D,N) checkpoints after a commit once the WAL has N or more frames, and passing zero or a negative N disables automatic checkpoints entirely. [10] The compile-time option SQLITE\_DEFAULT\_WAL\_AUTOCHECKPOINT sets the default auto-checkpoint page count, otherwise 1000, and SQLITE\_DEFAULT\_JOURNAL\_SIZE\_LIMIT sets the WAL size limit, otherwise unbounded. [12] Automatic checkpoints are always PASSIVE, a mode that never invokes the busy handler and might leave the checkpoint unfinished when there are concurrent readers or writers. [9] [10] [11] Every checkpoint call needs an exclusive checkpoint lock, so a checkpoint attempted while another process is checkpointing returns SQLITE\_BUSY without invoking the busy handler. [9] A checkpoint normally only overwrites the WAL from the beginning rather than truncating it, and journal\_size\_limit, whose default of -1 means no limit, truncates a larger leftover WAL at each commit or WAL reset. [1] [11]

For detection, PRAGMA wal\_checkpoint returns 1 in its first column when a FULL, RESTART or TRUNCATE checkpoint was blocked from completing, for example by another thread or process using the database. [11] Its second column reports modified pages written to the WAL and its third column the WAL pages moved back into the database by the checkpoint, and both are -1 without a WAL. [11] sqlite3\_wal\_checkpoint\_v2() sets \*pnLog to the total frames in the WAL and \*pnCkpt to all checkpointed frames, including ones checkpointed before the call, or both to -1 on error or outside WAL mode. [9] The SQLITE\_CHECKPOINT\_NOOP mode always checkpoints zero frames and exists only to read those \*pnLog and \*pnCkpt values. [9] A sqlite3\_wal\_hook callback receives the number of pages currently in the WAL, including those just committed, and an application that sets one should periodically checkpoint to keep the WAL from growing without bound. [17]

SQLite documentation says checkpoint starvation can be avoided by ensuring reader gaps, times when no process is reading the database, and attempting checkpoints during those gaps. [1] The documentation also says to keep the WAL small by running checkpoints at regular intervals. [1] For applications with many concurrent readers, the WAL documentation suggests considering manual RESTART or TRUNCATE checkpoints, which it presents as running to completion before returning, with the disadvantage that readers might block meanwhile. [1] A RESTART checkpoint works like FULL but also waits, via the busy handler, until all readers read only from the database file, so the next writer restarts the WAL; TRUNCATE also truncates it to zero bytes. [9] The sources disagree on whether that completion is guaranteed: the C checkpoint interface documentation says a FULL, RESTART or TRUNCATE checkpoint whose busy handler returns 0 continues like PASSIVE and returns SQLITE\_BUSY. [1] [9] sqlite3\_busy\_timeout installs a busy handler that sleeps until at least the given milliseconds accumulate and then returns 0, the value that makes a blocking checkpoint fall back to PASSIVE behaviour. [7] [9] Read together, these pages mean a RESTART or TRUNCATE checkpoint waiting on an open reader can return SQLITE\_BUSY without completing once its busy handler gives up, a block that PRAGMA wal\_checkpoint reports as 1 in its first column. [7] [9] [11]

Gap (gap-face1b445b544c309a0fc40de1497afa, assessed): The sqlite.org pages inspected describe no dedicated starvation alarm, threshold or interface identifying which reader blocks a checkpoint; detection has to rely on checkpoint return codes, log and checkpointed frame counts, and WAL size. [1] [9] [11] [17]

Facts behind this answer:

- fact-0cef43bce5ee4a16a91721f90d054632 [confirmed]: A SQLite checkpoint can run alongside readers but must stop at any WAL page past a current reader's end mark, because continuing might overwrite database content that reader is using. [1]; as of unknown; one publisher.
  > A checkpoint can run concurrently with readers, however the checkpoint must stop when it reaches a page in the WAL that is past the end mark of any current reader. The checkpoint has to stop at that point because otherwise it might overwrite part of the database file that the reader is actively using. [1], 2.2. Concurrency

- fact-76f050cc90ad4ff7bb1df93b98f784cd [confirmed]: A SQLite checkpoint records its progress in the wal-index and resumes from there next time, so a long-running read transaction can stop the checkpointer from making progress. [1]; as of unknown; one publisher.
  > The checkpoint remembers (in the wal-index) how far it got and will resume transferring content from the WAL to the database from where it left off on the next invocation. [1], 2.2. Concurrency
  > Thus a long-running read transaction can prevent a checkpointer from making progress. But presumably every read transaction will eventually end and the checkpointer will be able to continue. [1], 2.2. Concurrency

- fact-3f2268e01bd14a36828b21ba6ff146ff [confirmed]: In SQLite checkpoint starvation, many overlapping readers keep at least one read transaction always active, so no checkpoint can complete or reset the WAL and the WAL file grows without bound. [1]; as of unknown; one publisher.
  > Checkpoint starvation. A checkpoint is only able to run to completion, and reset the WAL file, if there are no other database connections using the WAL file. If another connection has a read transaction open, then the checkpoint cannot reset the WAL file because doing so might delete content out from under the reader. [1], 6. Avoiding Excessively Large WAL Files
  > However, if a database has many concurrent overlapping readers and there is always at least one active reader, then no checkpoints will be able to complete and hence the WAL file will grow without bound. [1], 6. Avoiding Excessively Large WAL Files

- fact-e85488f48f1d4572a6979def4383d932 [confirmed]: An unboundedly growing SQLite WAL file causes excess disk space usage and slow queries, because each reader must check the WAL and that time is proportional to the WAL file's size. [1]; as of unknown; one publisher.
  > But it is possible to get SQLite into a state where the WAL file will grow without bound, causing excess disk space usage and slow query speeds. [1], 6. Avoiding Excessively Large WAL Files
  > On the other hand, read performance deteriorates as the WAL file grows in size since each reader must check the WAL file for the content and the time needed to check the WAL file is proportional to the size of the WAL file. [1], 2.3. Performance Considerations

- fact-22bb8287076b4eef8f08c84b1776a645 [confirmed]: A SQLite WAL file cannot be reset in the middle of a write transaction, so a very large write transaction can make the WAL grow very big until it completes. [1]; as of unknown; one publisher.
  > Very large write transactions. A checkpoint can only complete when no other transactions are running, which means the WAL file cannot be reset in the middle of a write transaction. So a large change to a large database might result in a large WAL file. The WAL file will be checkpointed once the write transaction completes (assuming there are no other readers blocking it) but in the meantime, the file can grow very big. [1], 6. Avoiding Excessively Large WAL Files

- fact-03a63ed44a454afebffc5da4868f6ba8 [confirmed]: SQLite documentation says checkpoint starvation can be avoided by ensuring reader gaps, times when no process is reading the database, and attempting checkpoints during those gaps. [1]; as of unknown; one publisher.
  > This scenario can be avoided by ensuring that there are "reader gaps": times when no processes are reading from the database and that checkpoints are attempted during those times. [1], 6. Avoiding Excessively Large WAL Files

- fact-9beebfaa7ef64cad807d22ed224914e4 [confirmed]: Every SQLite checkpoint call needs an exclusive checkpoint lock, so a checkpoint attempted while another process is checkpointing returns SQLITE\_BUSY without invoking the busy handler. [9]; as of unknown; one publisher.
  > All calls obtain an exclusive "checkpoint" lock on the database file. If any other process is running a checkpoint operation at the same time, the lock cannot be obtained and SQLITE\_BUSY is returned. Even if there is a busy-handler configured, it will not be invoked in this case. [9], Checkpoint a database

- fact-16168e517ec04b0194d831e0949ff592 [confirmed]: If the busy handler returns 0 before a SQLite FULL, RESTART or TRUNCATE checkpoint gets the writer lock or while it waits for readers, it continues like PASSIVE and returns SQLITE\_BUSY. [9]; as of unknown; one publisher.
  > The SQLITE\_CHECKPOINT\_FULL, RESTART and TRUNCATE modes also obtain the exclusive "writer" lock on the database file. [9], Checkpoint a database
  > If the busy-handler returns 0 before the writer lock is obtained or while waiting for database readers, the checkpoint operation proceeds from that point in the same way as SQLITE\_CHECKPOINT\_PASSIVE - checkpointing as many frames as possible without blocking any further. SQLITE\_BUSY is returned in this case. [9], Checkpoint a database

- fact-57ce5c965f8f4cd586d0b752ad5c58f5 [confirmed]: SQLite's PRAGMA wal\_checkpoint returns 1 in its first column when a FULL, RESTART or TRUNCATE checkpoint was blocked from completing, for example by another thread or process using the database. [11]; as of unknown; one publisher.
  > The wal\_checkpoint pragma returns a single row with three integer columns. The first column is usually 0 but will be 1 if a RESTART or FULL or TRUNCATE checkpoint was blocked from completing, for example because another thread or process was actively using the database. [11], PRAGMA wal\_checkpoint

- fact-6115957253f7407fb9cb6d4c23bd7450 [confirmed]: When a write occurs, a SQLite writer rewinds the WAL to its beginning if the entire WAL has been transferred into the database and synced and no readers are using the WAL, which prevents unbounded WAL growth. [1]; as of unknown; one publisher.
  > Whenever a write operation occurs, the writer checks how much progress the checkpointer has made, and if the entire WAL has been transferred into the database and synced and if no readers are making use of the WAL, then the writer will rewind the WAL back to the beginning and start putting new transactions at the beginning of the WAL. This mechanism prevents a WAL file from growing without bound. [1], 2.2. Concurrency

- fact-0babe2c4601143a2b39701bf7953f8fb [confirmed]: Compile-time and run-time options can disable or defer SQLite's automatic checkpoint, and if an application disables it, nothing prevents the WAL file from growing excessively. [1]; as of unknown; one publisher.
  > However, compile-time and run-time options exist that can disable or defer this automatic checkpoint. If an application disables the automatic checkpoint, then there is nothing to prevent the WAL file from growing excessively. [1], 6. Avoiding Excessively Large WAL Files

- fact-7d390604ac56459b9bd94cc3569eae7c [confirmed]: For applications with many concurrent readers, SQLite's WAL documentation suggests considering manual RESTART or TRUNCATE checkpoints, which it says ensure the checkpoint runs to completion before returning, with the disadvantage that readers might block meanwhile. [1]; as of unknown; one publisher.
  > In applications with many concurrent readers, one might also consider running manual checkpoints with the SQLITE\_CHECKPOINT\_RESTART or SQLITE\_CHECKPOINT\_TRUNCATE option which will ensure that the checkpoint runs to completion before returning. The disadvantage of using SQLITE\_CHECKPOINT\_RESTART and SQLITE\_CHECKPOINT\_TRUNCATE is that readers might block while the checkpoint is running. [1], 6. Avoiding Excessively Large WAL Files

- fact-bdf218440cfa49d3af190cbb52634b60 [confirmed]: While another connection holds a SQLite read transaction open, a checkpoint does what it can but cannot run to completion or reset the WAL, and restarts where it left off after the next write transaction. [1]; as of unknown; one publisher.
  > A checkpoint is only able to run to completion, and reset the WAL file, if there are no other database connections using the WAL file. If another connection has a read transaction open, then the checkpoint cannot reset the WAL file because doing so might delete content out from under the reader. [1], 6. Avoiding Excessively Large WAL Files
  > The checkpoint will do as much work as it can without upsetting the reader, but it cannot run to completion. The checkpoint will start up again where it left off after the next write transaction. This repeats until some checkpoint is able to complete. [1], 6. Avoiding Excessively Large WAL Files

- fact-c55e9b71e3a545768d607089adfe8e49 [confirmed]: SQLite's wal-index speeds finding pages in the WAL, but read performance still falls off as the WAL grows, so the documentation says to keep the WAL small by running checkpoints at regular intervals. [1]; as of unknown; one publisher.
  > The wal-index helps find content in the WAL file much faster, but performance still falls off with increasing WAL file size. Hence, to maintain good read performance it is important to keep the WAL file size down by running checkpoints at regular intervals. [1], 2.3. Performance Considerations

- fact-acee3ed68ac8457380225a88e4fed716 [confirmed]: SQLite's automatic checkpoints are always PASSIVE, a mode that never invokes the busy handler and might leave the checkpoint unfinished when there are concurrent readers or writers. [9] [10] [11]; as of unknown; one publisher.
  > Checkpoints initiated by this mechanism are PASSIVE. [10], sqlite3\_wal\_autocheckpoint
  > This pragma is a wrapper around the sqlite3\_wal\_autocheckpoint() C interface. All automatic checkpoints are PASSIVE. [11], PRAGMA wal\_autocheckpoint
  > The busy-handler callback is never invoked in the SQLITE\_CHECKPOINT\_PASSIVE mode. On the other hand, passive mode might leave the checkpoint unfinished if there are concurrent readers or writers. [9], SQLITE\_CHECKPOINT\_PASSIVE

- fact-e471a278a0ad4e80931bf88ca8c0b813 [confirmed]: PRAGMA wal\_checkpoint's second column reports modified pages written to the WAL and its third column the WAL pages moved back into the database by the checkpoint; both are -1 without a WAL. [11]; as of unknown; one publisher.
  > The second column is the number of modified pages that have been written to the write-ahead log file. The third column is the number of pages in the write-ahead log file that have been successfully moved back into the database file at the conclusion of the checkpoint. The second and third column are -1 if there is no write-ahead log [11], PRAGMA wal\_checkpoint

- fact-b4fac68dd31342d79741299a2a3aede7 [confirmed]: sqlite3\_wal\_checkpoint\_v2() sets \*pnLog to the total frames in the WAL and \*pnCkpt to all checkpointed frames, including ones checkpointed before the call, or both to -1 on error or outside WAL mode. [9]; as of unknown; one publisher.
  > The sqlite3\_wal\_checkpoint\_v2(D,X,M,L,C) interface runs a checkpoint operation on database X of database connection D in mode M. Status information is written back into integers pointed to by L and C. [9], sqlite3\_wal\_checkpoint\_v2
  > If pnLog is not NULL, then \*pnLog is set to the total number of frames in the log file or to -1 if the checkpoint could not run because of an error or because the database is not in WAL mode. If pnCkpt is not NULL,then \*pnCkpt is set to the total number of checkpointed frames in the log file (including any that were already checkpointed before the function was called) or to -1 if the checkpoint could not run due to an error or because the database is not in WAL mode. [9], sqlite3\_wal\_checkpoint\_v2 output parameters

- fact-d7cfc6ee376c4795ad6c241e5227f36a [confirmed]: SQLite's SQLITE\_CHECKPOINT\_NOOP mode always checkpoints zero frames and exists only to read the \*pnLog and \*pnCkpt values that sqlite3\_wal\_checkpoint\_v2() returns. [9]; as of unknown; one publisher.
  > This mode always checkpoints zero frames. The only reason to invoke a NOOP checkpoint is to access the values returned by sqlite3\_wal\_checkpoint\_v2() via output parameters \*pnLog and \*pnCkpt. [9], SQLITE\_CHECKPOINT\_NOOP

- fact-ac3c1c33abef48e19869aee3947fdd5a [confirmed]: A SQLite RESTART checkpoint works like FULL but also waits, via the busy handler, until all readers read only from the database file, so the next writer restarts the WAL from the beginning; TRUNCATE also truncates it to zero bytes. [9]; as of unknown; one publisher.
  > This mode works the same way as SQLITE\_CHECKPOINT\_FULL with the addition that after checkpointing the log file it blocks (calls the busy-handler callback) until all readers are reading from the database file only. This ensures that the next writer will restart the log file from the beginning. [9], SQLITE\_CHECKPOINT\_RESTART
  > This mode works the same way as SQLITE\_CHECKPOINT\_RESTART with the addition that it also truncates the log file to zero bytes just prior to a successful return. [9], SQLITE\_CHECKPOINT\_TRUNCATE

- fact-f81c7c5577d148c9b6e864074bf91b70 [confirmed]: sqlite3\_busy\_timeout installs a busy handler that sleeps until at least the given milliseconds accumulate and then returns 0, the value that makes a blocking SQLite checkpoint fall back to PASSIVE behaviour. [7] [9]; as of unknown; one publisher.
  > This routine sets a busy handler that sleeps for a specified amount of time when a table is locked. The handler will sleep multiple times until at least "ms" milliseconds of sleeping have accumulated. After at least "ms" milliseconds of sleeping, the handler returns 0 which causes sqlite3\_step() to return SQLITE\_BUSY. [7], sqlite3\_busy\_timeout
  > If the busy-handler returns 0 before the writer lock is obtained or while waiting for database readers, the checkpoint operation proceeds from that point in the same way as SQLITE\_CHECKPOINT\_PASSIVE - checkpointing as many frames as possible without blocking any further. [9], sqlite3\_wal\_checkpoint\_v2

- fact-f92552d5fb3b44bcb4ad4abe6777a7fe [confirmed]: A SQLite checkpoint normally only overwrites the WAL from the beginning rather than truncating it; journal\_size\_limit truncates a larger leftover WAL at each commit or WAL reset, default -1 meaning no limit. [1] [11]; as of unknown; one publisher.
  > The checkpoint does not normally truncate the WAL file (unless the journal\_size\_limit pragma is set). Instead, it merely causes SQLite to start overwriting the WAL file from the beginning. [1], 6. Avoiding Excessively Large WAL Files
  > Each time a transaction is committed or a WAL file resets, SQLite compares the size of the rollback journal file or WAL file left in the file-system to the size limit set by this pragma and if the journal or WAL file is larger it is truncated to the limit. [11], PRAGMA journal\_size\_limit
  > The default journal size limit is -1 (no limit). [11], PRAGMA journal\_size\_limit

- fact-c1e6c293e2b341c18afecb24c4e46e84 [confirmed]: SQLite compile-time option SQLITE\_DEFAULT\_WAL\_AUTOCHECKPOINT sets the default auto-checkpoint page count, otherwise 1000, and SQLITE\_DEFAULT\_JOURNAL\_SIZE\_LIMIT sets the WAL size limit, otherwise unbounded. [12]; as of unknown; one publisher.
  > This macro sets the default page count for the WAL automatic checkpointing feature. If unspecified, the default page count is 1000. [12], SQLITE\_DEFAULT\_WAL\_AUTOCHECKPOINT
  > This option sets the size limit on rollback journal files in persistent journal mode and exclusive locking mode or sets the size of the write-ahead log file in WAL mode. When this compile-time option is omitted there is no upper bound on the size of the rollback journals or write-ahead logs. [12], SQLITE\_DEFAULT\_JOURNAL\_SIZE\_LIMIT

- fact-de5105a84c834aaba669441688d11bd9 [confirmed]: SQLite's sqlite3\_wal\_autocheckpoint(D,N) checkpoints after a commit once the WAL has N or more frames, and passing zero or a negative N disables automatic checkpoints entirely. [10]; as of unknown; one publisher.
  > The sqlite3\_wal\_autocheckpoint(D,N) is a wrapper around sqlite3\_wal\_hook() that causes any database on database connection D to automatically checkpoint after committing a transaction if there are N or more frames in the write-ahead log file. Passing zero or a negative value as the N parameter disables automatic checkpoints entirely. [10], sqlite3\_wal\_autocheckpoint

- fact-eafd2704f6604f158c22c8a86e8985c9 [confirmed]: A sqlite3\_wal\_hook callback receives the number of pages currently in the WAL, including those just committed, and an application that sets one should periodically checkpoint to keep the WAL from growing without bound. [17]; as of unknown; one publisher.
  > The fourth parameter is the number of pages currently in the write-ahead log file, including those that were just committed. [17], sqlite3\_wal\_hook
  > If a write-ahead log callback is set using this function then sqlite3\_wal\_checkpoint\_v2() or PRAGMA wal\_checkpoint should be invoked periodically to keep the write-ahead log file from growing without bound. [17], sqlite3\_wal\_hook


## Durability and recovery

### How durable is a committed transaction in WAL mode under synchronous=NORMAL compared with synchronous=FULL?

In WAL mode, synchronous=FULL syncs the WAL on every commit and is documented as ACID, while under NORMAL, which skips that sync, a committed transaction might roll back after power loss or a system crash. [1] [11]

With synchronous=FULL, SQLite syncs the WAL after every transaction commit, whereas synchronous=NORMAL omits that per-commit sync. [1] [11] Under NORMAL, syncs still happen around checkpoints and WAL reuse, but no sync operations occur during most transactions. [1] [11] SQLite documents FULL as atomic, consistent, isolated and durable (ACID) in WAL mode, unlike rollback-journal mode, where FULL is not necessarily durable across power loss. [11] The EXTRA level adds nothing over FULL in WAL mode, because its extra directory sync applies only to rollback journals in DELETE mode. [11]

Under NORMAL, a committed transaction might roll back after a power loss or system crash, although the database stays consistent and safe from corruption. [11] SQLite's pragma documentation describes NORMAL as losing only durability across power loss, while keeping atomicity, consistency and isolation. [11] This loss does not cover application crashes, since SQLite documents transactions as durable across application crashes regardless of the synchronous setting or journal mode. [11] SQLite says that with NORMAL and checkpoints run in a separate thread or process, the main thread never blocks on sync, but transactions are no longer durable across power failure. [1]

SQLite's pragma documentation calls NORMAL the best performance-safety balance for most WAL-mode applications. [11] SQLite's compile-options guide says transaction commit is much faster in WAL mode with NORMAL than with FULL, and recommends switching from FULL to NORMAL when moving to WAL. [12] Unless overridden at compile time, SQLite's default synchronous setting is 2 (FULL), and databases that open in WAL mode use that same default unless SQLITE\_DEFAULT\_WAL\_SYNCHRONOUS is overridden. [12]

SQLite cannot detect storage that lies about sync requests, and in WAL mode a failed sync during COMMIT can lose durability, while only a failed sync during a checkpoint can corrupt the database. [15]

Gap (gap-59a7a7495d154b36acf46ae5d99e44d2, assessed): The sqlite.org pages inspected say only that recent commits might roll back under synchronous=NORMAL after power loss; they do not quantify how many transactions or how much time can be lost. [11] [1] [12]

Facts behind this answer:

- fact-887018efe20e4d699e6e0f4163ded954 [confirmed]: In SQLite WAL mode, synchronous=FULL syncs the WAL after every transaction commit, whereas synchronous=NORMAL omits that per-commit sync. [1] [11]; as of unknown; one publisher.
  > (Writers sync the WAL on every transaction commit if PRAGMA synchronous is set to FULL but omit this sync if PRAGMA synchronous is set to NORMAL.) [1], 2.3. Performance Considerations
  > With synchronous=FULL in WAL mode, an additional sync operation of the WAL file happens after each transaction commit. The extra WAL sync following each transaction helps ensure that transactions are durable across a power loss. [11], PRAGMA synchronous

- fact-6a38e23b9c5a4e819acecac843aa325d [confirmed]: SQLite documents synchronous=FULL as atomic, consistent, isolated and durable (ACID) in WAL mode, unlike rollback-journal mode where FULL is not necessarily durable across power loss. [11]; as of unknown; one publisher.
  > FULL is atomic, consistent, isolated, and durable (ACID) in WAL mode and is atomic, consistent, and isolated with a rollback journal. FULL might also be durable using a rollback journal, depending on the underlying filesystem. FULL is not necessarily durable across a power loss in rollback mode [11], PRAGMA synchronous: FULL

- fact-7abfe81095be4e52aa174cb8b306942f [confirmed]: In SQLite WAL mode with synchronous=NORMAL, a committed transaction might roll back after a power loss or system crash, although the database stays consistent and safe from corruption. [11]; as of unknown; one publisher.
  > WAL mode is safe from corruption with synchronous=NORMAL, and probably DELETE mode is safe too on modern filesystems. WAL mode is always consistent with synchronous=NORMAL, but WAL mode does lose durability. A transaction committed in WAL mode with synchronous=NORMAL might roll back following a power loss or system crash. [11], PRAGMA synchronous: NORMAL

- fact-b0910e1023c646ddac76e9caabcd7c05 [confirmed]: SQLite's pragma documentation calls synchronous=NORMAL the best performance-safety balance for most WAL-mode applications, losing only durability across power loss while keeping atomicity, consistency and isolation. [11]; as of unknown; one publisher.
  > The synchronous=NORMAL setting provides the best balance between performance and safety for most applications running in WAL mode. You lose durability across power lose with synchronous NORMAL in WAL mode, but that is not important for most applications. Transactions are still atomic, consistent, and isolated, which are the most important characteristics in most use cases. [11], PRAGMA synchronous: NORMAL

- fact-6722a3f824a44fa996fbaf478fdc295e [confirmed]: In SQLite WAL mode with synchronous=NORMAL, syncs happen around checkpoints and WAL reuse, but no sync operations occur during most transactions. [1] [11]; as of unknown; one publisher.
  > In WAL mode when synchronous is NORMAL (1), the WAL file is synchronized before each checkpoint and the database file is synchronized after each completed checkpoint and the WAL file header is synchronized when a WAL file begins to be reused after a checkpoint, but no sync operations occur during most transactions. [11], PRAGMA synchronous
  > Note that with PRAGMA synchronous set to NORMAL, the checkpoint is the only operation to issue an I/O barrier or sync operation (fsync() on unix or FlushFileBuffers() on windows). [1], 2.3. Performance Considerations

- fact-ae1cf9c2b06942599e654dbf86ce30c4 [confirmed]: SQLite says that with synchronous=NORMAL and checkpoints run in a separate thread or process, the main thread never blocks on sync, but transactions are no longer durable across power failure. [1]; as of unknown; one publisher.
  > If an application therefore runs checkpoint in a separate thread or process, the main thread or process that is doing database queries and updates will never block on a sync operation. This helps to prevent "latch-up" in applications running on a busy disk drive. The downside to this configuration is that transactions are no longer durable and might rollback following a power failure or hard reset. [1], 2.3. Performance Considerations

- fact-3a740df9cb56420a89a3eab143f0b9b9 [confirmed]: SQLite's compile-options guide says transaction commit is much faster in WAL mode with synchronous=NORMAL than FULL, and recommends switching from FULL to NORMAL when moving to WAL. [12]; as of unknown; one publisher.
  > With PRAGMA synchronous=NORMAL in WAL mode, recent changes to the database might be rolled back by a power loss, but the database will not be corrupted. Furthermore, transaction commit is much faster in WAL mode using synchronous=NORMAL than with the default synchronous=FULL. For these reasons, it is recommended that the synchronous setting be changed from FULL to NORMAL when switching to WAL mode. [12], 2. Recommended Compile-time Options: SQLITE\_DEFAULT\_WAL\_SYNCHRONOUS

- fact-df4c21f0544049dea7135157e5be7235 [confirmed]: SQLite's EXTRA synchronous level adds nothing over FULL in WAL mode; its extra directory sync applies only to rollback journals in DELETE mode. [11]; as of unknown; one publisher.
  > EXTRA synchronous is like FULL with the addition that the directory containing a rollback journal is synced after that journal is unlinked to commit a transaction in DELETE mode. [11], PRAGMA synchronous: EXTRA
  > EXTRA is no different from FULL in WAL mode. [11], PRAGMA synchronous: EXTRA

- fact-cfcd77eac82c4bb2bde4931a8e6e8841 [confirmed]: SQLite cannot detect storage that lies about sync requests; in WAL mode a failed sync during COMMIT can lose durability, while only a failed sync during a checkpoint can corrupt the database. [15]; as of unknown; one publisher.
  > Note that SQLite must believe whatever the operating system and hardware tell it about the status of sync requests. There is no way for SQLite to detect that either is lying and that writes might be occurring out-of-order. However, SQLite in WAL mode is far more forgiving of out-of-order writes than in the default rollback journal modes. In WAL mode, the only time that a failed sync operation can cause database corruption is during a checkpoint operation. A sync failure during a COMMIT might result in loss of durability but not in a corrupt database file. [15], 3.1. Disk drives that do not honor sync requests

- fact-4900940a58fe4c678d5013cd7dc9f8db [confirmed]: Unless overridden at compile time, SQLite's default PRAGMA synchronous setting is 2 (FULL), and the default for databases that open in WAL mode equals SQLITE\_DEFAULT\_SYNCHRONOUS unless SQLITE\_DEFAULT\_WAL\_SYNCHRONOUS is overridden. [12]; as of unknown; one publisher.
  > This macro determines the default value of the PRAGMA synchronous setting. If not overridden at compile-time, the default setting is 2 (FULL). [12], SQLITE\_DEFAULT\_SYNCHRONOUS
  > This macro determines the default value of the PRAGMA synchronous setting for database files that open in WAL mode. If not overridden at compile-time, this value is the same as SQLITE\_DEFAULT\_SYNCHRONOUS. [12], SQLITE\_DEFAULT\_WAL\_SYNCHRONOUS

### What happens to committed and uncommitted transactions in the WAL after a crash or power loss?

After a crash, the first connection runs WAL recovery, which sets the valid end of the WAL at the last valid commit frame so uncommitted frames are not read, provided the -wal file stays with the database. [1] [13] [14] [15]

In WAL mode a transaction commits when a commit record is appended to the WAL, while the original content stays unmodified in the database file. [1] [13] SQLite describes the -wal file as a roll-forward journal of committed but not-yet-applied transactions. [1] [14] Checkpoints sync the WAL before moving content into the database and sync the database before resetting the WAL, to avoid corruption after power loss or a hard reboot. [1]

After a crash, the first connection to the database runs recovery, a single pass over the WAL that verifies frame checksums and stops at the end of file or the first invalid checksum. [14] A frame is valid only if its salt values match the WAL header and its cumulative checksum matches, which lets SQLite separate valid frames from leftovers of earlier checkpoints. [13] Recovery sets the valid end of the WAL at the last valid commit frame, and readers use only page frames that are, or are followed by, a commit frame, so uncommitted frames are not read. [13] [14] Because recovery cannot tell how many frames were already copied into the database, it initializes the nBackfill value to zero. [14] The -shm wal-index file holds no database content, is never fsynced, and is not required to recover the database after a crash. [14]

SQLite documents committed transactions as durable across application crashes regardless of the synchronous setting or journal mode. [11] After a power loss or system crash, a committed transaction might roll back under synchronous=NORMAL, although the database stays consistent and safe from corruption. [11] Under synchronous=FULL, SQLite documents WAL mode as durable as well as atomic, consistent and isolated. [11] SQLite cannot detect storage that lies about sync requests, and in WAL mode a failed sync during COMMIT can lose durability, while only a failed sync during a checkpoint can corrupt the database. [15]

When the last connection closes, it normally runs a final checkpoint and deletes the -wal and -shm files, but the WAL may remain after an unclean exit. [1] Moving, deleting or renaming such a hot WAL after a crash defeats automatic recovery and may corrupt the database. [1] [15] SQLite says the WAL file is part of the database's persistent state and should be kept with it when copied or moved, since separating them might lose committed transactions or corrupt the database. [1] [14] According to SQLite, the only safe way to remove a WAL file is to open the database with an sqlite3\_open() interface and immediately close it with sqlite3\_close(). [1] While recovery runs, exclusive locks stop other connections from writing or reading WAL transactions, so a concurrent query may get SQLITE\_BUSY, and SQLite returns the extended code SQLITE\_BUSY\_RECOVERY in that situation on WAL databases. [1] [6] [14]

Facts behind this answer:

- fact-223493b2a75e4c52912757f465d2bfa7 [confirmed]: In SQLite WAL mode, a transaction commits when a commit record is appended to the WAL, while the original content stays unmodified in the database file. [1] [13]; as of unknown; one publisher.
  > The WAL approach inverts this. The original content is preserved in the database file and the changes are appended into a separate WAL file. A COMMIT occurs when a special record indicating a commit is appended to the WAL. Thus a COMMIT can happen without ever writing to the original database [1], 2. How WAL Works
  > Each frame records the revised content of a single page from the database file. All changes to the database are recorded by writing frames into the WAL. Transactions commit when a frame is written that contains a commit marker. [13], 4.1. WAL File Format

- fact-839bc392fdc24ead9bccafe117b1665f [confirmed]: SQLite documents that transactions are durable across application crashes regardless of the synchronous setting or journal mode; the WAL-mode durability loss under NORMAL concerns power loss or system crashes. [11]; as of unknown; one publisher.
  > A transaction committed in WAL mode with synchronous=NORMAL might roll back following a power loss or system crash. Transactions are durable across application crashes regardless of the synchronous setting or journal mode. [11], PRAGMA synchronous: NORMAL

- fact-10d6080a53034d09af63e73c16564bf0 [confirmed]: After a crash, the first connection to an SQLite WAL database runs recovery, a single pass over the WAL that verifies frame checksums and stops at the end of file or first invalid checksum. [14]; as of unknown; one publisher.
  > Recovery is run by the first thread to connect to a WAL-mode database. Recovery restores the WAL-index so that it accurately describes the WAL file. [14], 3. Recovery
  > Recovery works by doing a single pass over the WAL, from beginning to end. The checksums are verified on each frame of the WAL as it is read. The scan stops at the end of the file or at the first invalid checksum. [14], 3. Recovery

- fact-c49ab05c2899409291bdaa2b0ed806cb [confirmed]: SQLite WAL recovery sets the valid end of the WAL at the last valid commit frame, and readers use only page frames that are, or are followed by, a commit frame, so uncommitted frames are not read. [13] [14]; as of unknown; one publisher.
  > The mxFrame field is set to the index of the last valid commit frame in WAL. Since WAL frame numbers are indexed starting with 1, mxFrame is also the number of valid frames in the WAL. [14], 3. Recovery
  > To read a page from the database (call it page number P), a reader first checks the WAL to see if it contains page P. If so, then the last valid instance of page P that is followed by a commit frame or is a commit frame itself becomes the value read. [13], 4.5. Reader Algorithm

- fact-44c6e0b01ca64a21adbb572c96da7135 [confirmed]: An SQLite WAL frame is valid only if its salt values match the WAL header and its cumulative checksum matches, letting SQLite separate valid frames from leftovers of earlier checkpoints. [13]; as of unknown; one publisher.
  > Checksums and counters attached to each frame are used to determine which frames within the WAL are valid and which are leftovers from prior checkpoints. [13], 4.1. WAL File Format
  > The salt-1 and salt-2 values in the frame-header match salt values in the wal-header [13], 4.1. WAL File Format
  > The checksum values in the final 8 bytes of the frame-header exactly match the checksum computed consecutively on the first 24 bytes of the WAL header and the first 8 bytes and the content of all frames up to and including the current frame. [13], 4.1. WAL File Format

- fact-dcdabdf53286491db678bb65d270e477 [confirmed]: Because SQLite's WAL recovery cannot tell how many frames were already copied into the database, it initializes the nBackfill value to zero. [14]; as of unknown; one publisher.
  > Since the recovery procedure has no way of knowing how many frames of the WAL might have previously been copied back into the database, it initializes the nBackfill value to zero. [14], 3. Recovery

- fact-b225523999e2478abe3edc6c8dd69c97 [confirmed]: SQLite describes the -wal file as a roll-forward journal of committed but not-yet-applied transactions; separating a database from its WAL can lose committed transactions or corrupt the database. [1] [14]; as of unknown; one publisher.
  > The write-ahead log or "wal" file is a roll-forward journal that records transactions that have been committed but not yet applied to the main database. [14], 1.2. The Write-Ahead-Log or "-wal" File
  > The WAL file is part of the persistent state of the database and should be kept with the database if the database is copied or moved. If a database file is separated from its WAL file, then transactions that were previously committed to the database might be lost, or the database file might become corrupted. [1], 4. The WAL File

- fact-a03b38885a0840139320b86fdc3b3363 [confirmed]: SQLite may leave the WAL file on disk after an unclean shutdown, and moving, deleting or renaming such a hot WAL after a crash defeats automatic recovery and may corrupt the database. [1] [15]; as of unknown; one publisher.
  > However, if the last process to have the database open exits without cleanly shutting down the database connection, or if the SQLITE\_FCNTL\_PERSIST\_WAL file control is used, then the WAL file might be retained on disk after all connections to the database have been closed. [1], 4. The WAL File
  > SQLite must see the journal files in order to recover from a crash or power failure. If the hot journal files are moved, deleted, or renamed after a crash or power failure, then automatic recovery will not work and the database may go corrupt. [15], 1.3. Deleting a hot journal

- fact-53041ebbc678401f965aab7fe4671265 [confirmed]: SQLite says the only safe way to remove a WAL file is to open the database with an sqlite3\_open() interface and immediately close it with sqlite3\_close(). [1]; as of unknown; one publisher.
  > The only safe way to remove a WAL file is to open the database file using one of the sqlite3\_open() interfaces then immediately close the database using sqlite3\_close(). [1], 4. The WAL File

- fact-2e36175d1ee147d287962faa201c8e01 [confirmed]: The SQLite -shm wal-index file holds no database content, is never fsynced, and is not required to recover a WAL database after a crash. [14]; as of unknown; one publisher.
  > The shm file does not contain any database content and is not required to recover the database following a crash. For that reason, the first client to connect to a quiescent database will normally truncate the shm file if it exists. Since the content of the shm file does not need to be preserved across a crash, the shm file is never fsync()-ed to disk. [14], 1.3. The Wal-Index or "-shm" file

- fact-d0b5d612933648fcad02f8c573680cef [confirmed]: During SQLite WAL recovery, exclusive locks stop other connections from writing or reading WAL transactions until it completes, so a concurrent query may get SQLITE\_BUSY. [1] [14]; as of unknown; one publisher.
  > In other words, all locks associated with the WAL-index except for WAL\_READ\_LOCK(0) are held exclusively. This prevents any other thread from writing the database and from reading any transactions that are held in the WAL, until the recovery is complete. [14], 3. Recovery
  > If the last connection to a database crashed, then the first new connection to open the database will start a recovery process. An exclusive lock is held during recovery. So if a third database connection tries to jump in and query while the second connection is running recovery, the third connection will get an SQLITE\_BUSY error. [1], 9. Sometimes Queries Return SQLITE\_BUSY In WAL Mode

- fact-000e94b4c273457788316feee186b8c9 [confirmed]: SQLite checkpoints sync the WAL before moving content into the database and sync the database before resetting the WAL, to avoid corruption after power loss or hard reboot. [1]; as of unknown; one publisher.
  > Checkpointing does require sync operations in order to avoid the possibility of database corruption following a power loss or hard reboot. The WAL must be synced to persistent storage prior to moving content from the WAL into the database and the database file must be synced prior to resetting the WAL. [1], 2.3. Performance Considerations


## Limitations and enabling

### Can WAL mode be used when the database is on a network filesystem or accessed from several machines, and why?

Not over a network filesystem: SQLite says every process using a WAL database must be on the same host, because the processes must share memory. [1]

SQLite's WAL documentation says all processes using a WAL database must be on the same host, so WAL does not work over a network filesystem. [1] The shared memory in question is the wal-index, which WAL readers use to locate pages in the WAL, and it is why all readers must be on the same machine. [1] SQLite implements this wal-index shared memory by memory-mapping an ordinary file in the same directory as the database file. [1]

For clients on several machines that need simultaneous reads and writes, SQLite's network guidance suggests WAL only if all reads and writes run on the database machine, with a proxy relaying the remote requests. [2] The same guidance also lists a client/server engine such as PostgreSQL, or SQLite in rollback mode, which allows simultaneous readers or one writer but not both. [2]

SQLite says rollback mode can mitigate network unreliability, but SQLite is not tested across networks, so using a remote database file is at the user's risk. [2] It also warns that exclusive file locks on some network filesystems have operated incorrectly and led to database corruption, and that sync and locking reliability vary across networks. [2]

Facts behind this answer:

- fact-a9f09603c2ac48f28e39b81f0d1ed098 [confirmed]: SQLite's WAL documentation says all processes using a WAL database must be on the same host, so WAL does not work over a network filesystem, because processes must share memory. [1]; as of unknown; one publisher.
  > All processes using a database must be on the same host computer; WAL does not work over a network filesystem. This is because WAL requires all processes to share a small amount of memory and processes on separate host machines obviously cannot share memory with each other. [1], 1. Overview

- fact-4f4eacde06d84125b172706cac8c45df [confirmed]: WAL readers use a shared-memory wal-index to locate pages in the WAL, and that shared memory is why all readers must be on the same machine. [1]; as of unknown; one publisher.
  > a data structure called the "wal-index" is maintained in shared memory which helps readers locate pages in the WAL quickly and with a minimum of I/O. The wal-index greatly improves the performance of readers, but the use of shared memory means that all readers must exist on the same machine. This is why the write-ahead log implementation will not work on a network filesystem. [1], 2.2. Concurrency

- fact-62c1b4f5ebfb46a4a778b0f0b01b05f4 [confirmed]: SQLite implements the WAL wal-index shared memory by memory-mapping an ordinary file in the same directory as the database file. [1]; as of unknown; one publisher.
  > The wal-index is implemented using an ordinary file that is mmapped for robustness. [1], 7. Implementation Of Shared-Memory For The WAL-Index
  > The only way we have found to guarantee that all processes accessing the same database file use the same shared memory is to create the shared memory by mmapping a file in the same directory as the database itself. [1], 7. Implementation Of Shared-Memory For The WAL-Index

- fact-b07fa833005d4f818c46a8e783b00a78 [confirmed]: For clients on several machines needing simultaneous reads and writes, SQLite suggests WAL only if all reads and writes run on the database machine, with a proxy relaying remote requests. [2]; as of unknown; one publisher.
  > Network filesystems do not support the ability to do simultaneous reads and writes while at the same time keeping the database consistent. So if you have multiple clients on multiple different machines which need to do simultaneous database reads and writes, you have these choices: [2], Recommendations
  > Host an SQLite database in WAL mode, but do all reads and writes from processes on the same machine that stores the database file. Implement a proxy that runs on the database machine that relays read/write requests from remote machines. [2], Recommendations

- fact-fba866934c6645d385b3bfd39d41631c [confirmed]: SQLite says rollback mode can mitigate network unreliability, but SQLite is not tested across networks, so using a remote database file is at the user's risk. [2]; as of unknown; one publisher.
  > These network unreliability issues can be mitigated, completely or to an acceptable degree, by using SQLite in rollback mode. However, the SQLite library is not tested in across-a-network scenarios, nor is that reasonably possible. Hence, use of a remote database is done at the user's risk. [2], Performance and Reliability Issues

- fact-b503e9f3c4634edf934da8ed95904fa5 [confirmed]: SQLite warns that exclusive file locks on some network filesystems have operated incorrectly and led to database corruption, and that network sync and locking reliability vary. [2]; as of unknown; one publisher.
  > A similar hazard arises with file locking in network filesystems. SQLite relies on exclusive locks for write operations, and those have been known to operate incorrectly for some network filesystems. This has led to database corruption. [2], Channel Reliability
  > The bottom line is that network filesystem sync and locking reliability vary among implementations and installations. [2], Channel Reliability

- fact-80b87648aebd473c96f56e37988d2a1b [confirmed]: For multiple clients on different machines needing simultaneous reads and writes, SQLite's network guidance also lists a client/server engine such as PostgreSQL, or SQLite in rollback mode, which allows simultaneous readers or one writer but not both. [2]; as of unknown; one publisher.
  > Use a client/server database engine. PostgreSQL is an excellent choice. A variation of this is: [2], Recommendations
  > Use SQLite in rollback mode. This means you can have multiple simultaneous readers or one writer, but not simultaneous readers and writers. [2], Recommendations

### What other limitations does WAL mode have compared with rollback-journal mode (for example read-only access, very large transactions or ATTACHed databases)?

Besides the same-host rule, SQLite documents WAL limits on cross-database atomicity with ATTACH, page-size changes, read-only access, extra -wal and -shm files, and reading by SQLite versions before 3.7.0. [1] [3]

In WAL mode, a transaction that changes several ATTACHed databases is atomic for each database but not atomic across all the databases as a set. [1] A WAL-mode database's page\_size cannot be changed, including by VACUUM or by restoring a backup; changing the page size requires a rollback journal mode. [1] SQLite versions before 3.7.0 cannot read a WAL-mode database, because WAL mode raises the file format version numbers in the header from 1 to 2. [1] [3] Running PRAGMA journal\_mode=DELETE leaves WAL mode and changes those version numbers back to 1 so older SQLite versions can open the database. [1]

Read-only access depends on the release: before SQLite 3.22.0, opening a WAL-mode database required write access to the -shm file or, if that file was absent, to the database's directory. [1] Since 3.22.0, a read-only WAL database can be read if the -shm and -wal files exist and are readable, if the directory is writable, or if the immutable parameter is used. [1] Even so, SQLite recommends converting a database to journal\_mode=DELETE before putting it on read-only media. [1]

WAL adds quasi-persistent -wal and -shm files beside each database, which SQLite says can make WAL less appealing as an application file format. [1] The WAL file is part of the database's persistent state and should be kept with the database when it is copied or moved, because separating them might lose committed transactions or corrupt the database. [1] WAL without shared memory works only if locking\_mode is EXCLUSIVE before first access, and that connection then stays EXCLUSIVE until it leaves WAL mode. [1] In-memory databases can only use the MEMORY or OFF journal modes, so they cannot use WAL. [3]

A WAL file cannot be reset in the middle of a write transaction, so a very large write transaction can make the WAL grow very big until it completes. [1] The WAL page's large-transaction guidance is mixed: it says rollback modes are likely faster above about 100-megabyte transactions and recommended above a few dozen megabytes, yet says WAL works as efficiently with large transactions beginning with 3.11.0. [1] The page dates that 3.11.0 change to 2016-02-15. [1] Separately, WAL may be very slightly slower than rollback-journal mode, perhaps 1% or 2%, in applications that mostly read and seldom write. [1]

Gap (gap-ac03eb685c0d4a02b8e0df059799945a, checker assessment): Checker assessment: the WAL page's large-transaction limits (rollback likely faster above about 100 MB, recommended above a few dozen MB, possible I/O or disk-full failure above a gigabyte) sit beside its statement that WAL has handled large transactions as efficiently as rollback mode since 3.11.0 (2016-02-15); no inspected source says which of these limits still apply to current releases. [1]

Facts behind this answer:

- fact-c3bcc511138346e29f0539f85ff27b6c [confirmed]: In WAL mode, a transaction changing multiple ATTACHed databases is atomic for each database but not atomic across all the databases as a set. [1]; as of unknown; one publisher.
  > Transactions that involve changes against multiple ATTACHed databases are atomic for each individual database, but are not atomic across all databases as a set. [1], 1. Overview

- fact-3db906da5dbc4d79afdaf1dc9b0fd556 [confirmed]: A WAL-mode database's page\_size cannot be changed, including by VACUUM or backup restore; changing page size requires a rollback journal mode. [1]; as of unknown; one publisher.
  > It is not possible to change the page\_size after entering WAL mode, either on an empty database or by using VACUUM or by restoring from a backup using the backup API. You must be in a rollback journal mode to change the page size. [1], 1. Overview

- fact-aa2d46760b3b40c3825ce4eb24ad81bc [confirmed]: Before SQLite 3.22.0, opening a WAL-mode database required write access to the -shm file or, if absent, to the database's directory. [1]; as of unknown; one publisher.
  > It is not possible to open read-only WAL databases. The opening process must have write privileges for "-shm" wal-index shared memory file associated with the database, if that file exists, or else write access on the directory containing the database file if the "-shm" file does not exist. Beginning with version 3.22.0 (2018-01-22), a read-only WAL-mode database file can be opened if the -shm and -wal files already exist or those files can be created or the database is immutable. [1], 1. Overview

- fact-ccb3b57288f5423c8466aa3fd6c4e163 [confirmed]: Since SQLite 3.22.0, a read-only WAL database can be read if the -shm and -wal files exist and are readable, the directory is writable, or the immutable parameter is used. [1]; as of unknown; one publisher.
  > This constraint was relaxed beginning with SQLite version 3.22.0 (2018-01-22). [1], 5. Read-Only Databases
  > On newer versions of SQLite, a WAL-mode database on read-only media, or a WAL-mode database that lacks write permission, can still be read as long as one or more of the following conditions are met: [1], 5. Read-Only Databases
  > The -shm and -wal files already exist and are readable. [1], 5. Read-Only Databases
  > There is write permission on the directory containing the database so that the -shm and -wal files can be created. [1], 5. Read-Only Databases
  > The database connection is opened using the immutable query parameter. [1], 5. Read-Only Databases

- fact-c82a829a827d41a2a58778734419bb81 [confirmed]: SQLite recommends converting a database to journal\_mode=DELETE before putting it on read-only media, even though read-only WAL databases can be opened. [1]; as of unknown; one publisher.
  > Even though it is possible to open a read-only WAL-mode database, it is good practice to convert the database to PRAGMA journal\_mode=DELETE prior to burning an SQLite database image onto read-only media. [1], 5. Read-Only Databases

- fact-4e3bac31bc244dabbfcf57efd58d09be [confirmed]: WAL may be very slightly slower than rollback-journal mode, perhaps 1% or 2%, in applications that mostly read and seldom write. [1]; as of unknown; one publisher.
  > WAL might be very slightly slower (perhaps 1% or 2% slower) than the traditional rollback-journal approach in applications that do mostly reads and seldom write. [1], 1. Overview

- fact-5cb541a936fa4229b5c11d61bc3a1d62 [confirmed]: WAL adds quasi-persistent -wal and -shm files beside each database, which SQLite says can make it less appealing as an application file format. [1]; as of unknown; one publisher.
  > There is an additional quasi-persistent "-wal" file and "-shm" shared memory file associated with each database, which can make SQLite less appealing for use as an application file-format. [1], 1. Overview

- fact-8621685149234a80aefd1164a0cc15fe [confirmed]: A WAL-mode database cannot be read by SQLite versions before 3.7.0, because WAL mode raises the file format version numbers in the header from 1 to 2. [1] [3]; as of unknown; one publisher.
  > To prevent older versions of SQLite (prior to version 3.7.0, 2010-07-22) from trying to recover a WAL-mode database (and making matters worse) the database file format version numbers (bytes 18 and 19 in the database header) are increased from 1 to 2 in WAL mode. [1], 10. Backwards Compatibility
  > A database in WAL journaling mode can only be accessed by SQLite version 3.7.0 (2010-07-21) or later. [3], PRAGMA journal\_mode (partial capture)

- fact-c26e512d1a124a6f99c2d0bfdba35a58 [confirmed]: WAL without shared memory works only if locking\_mode is EXCLUSIVE before first access, and that connection then stays EXCLUSIVE until it leaves WAL mode. [1]; as of unknown; one publisher.
  > In other words, a process can interact with a WAL database without using shared memory if that process is guaranteed to be the only process accessing the database. [1], 8. Use of WAL Without Shared-Memory
  > In that case, the database connection remains in EXCLUSIVE mode as long as the journal mode is WAL; attempts to change the locking mode using "PRAGMA locking\_mode=NORMAL;" are no-ops. The only way to change out of EXCLUSIVE locking mode is to first change out of WAL journal mode. [1], 8. Use of WAL Without Shared-Memory

- fact-22bb8287076b4eef8f08c84b1776a645 [confirmed]: A SQLite WAL file cannot be reset in the middle of a write transaction, so a very large write transaction can make the WAL grow very big until it completes. [1]; as of unknown; one publisher.
  > Very large write transactions. A checkpoint can only complete when no other transactions are running, which means the WAL file cannot be reset in the middle of a write transaction. So a large change to a large database might result in a large WAL file. The WAL file will be checkpointed once the write transaction completes (assuming there are no other readers blocking it) but in the meantime, the file can grow very big. [1], 6. Avoiding Excessively Large WAL Files

- fact-383df08e8fde437587143a9ab337e1c7 [confirmed]: The WAL page says rollback modes are likely faster above about 100-megabyte transactions and recommended above a few dozen megabytes, yet says that beginning with 3.11.0 WAL works as efficiently with large transactions as rollback mode. [1]; as of unknown; one publisher.
  > WAL works best with smaller transactions. WAL does not work well for very large transactions. For transactions larger than about 100 megabytes, traditional rollback journal modes will likely be faster. For transactions in excess of a gigabyte, WAL mode may fail with an I/O or disk-full error. It is recommended that one of the rollback journal modes be used for transactions larger than a few dozen megabytes. Beginning with version 3.11.0 (2016-02-15), WAL mode works as efficiently with large transactions as does rollback mode. [1], 1. Overview

- fact-ce60258dea684d2487f17a8bce41975c [confirmed]: The WAL file is part of the database's persistent state and should be kept with the database when it is copied or moved; separating them might lose committed transactions or corrupt the database. [1]; as of unknown; one publisher.
  > The WAL file is part of the persistent state of the database and should be kept with the database if the database is copied or moved. If a database file is separated from its WAL file, then transactions that were previously committed to the database might be lost, or the database file might become corrupted. [1], 4. The WAL File

### How is WAL mode enabled, and does the setting persist across connections and database closes?

WAL is enabled by running PRAGMA journal\_mode=WAL and, unlike other journal modes, it persists across connections and after the database is closed and reopened. [1] [3]

SQLite connections default to journal\_mode=DELETE, and a database is converted to WAL by running PRAGMA journal\_mode=WAL. [1] The pragma returns "wal" on success; if conversion fails, for example because the VFS lacks shared-memory support, the mode is unchanged and the prior mode is returned. [1] Without a schema name, PRAGMA journal\_mode changes the journal mode for all attached databases. [3] The journal mode cannot be changed while a transaction is active, and in-memory databases cannot use WAL because they can only use MEMORY or OFF. [3]

Unlike other journal modes, WAL mode is persistent: it stays in effect across connections and after the database is closed and reopened. [1] [3] By contrast, non-WAL modes such as TRUNCATE do not persist, and after closing and reopening the database returns to the default DELETE rollback mode. [1] Setting WAL journal mode on any one connection sets it on all connections to the same database file. [1] Because the setting persists, an application can be switched to WAL without code changes by running PRAGMA journal\_mode=WAL with a utility and then restarting the application. [1]

WAL mode is left explicitly by running PRAGMA journal\_mode=DELETE, which changes the file format version numbers back to 1 so older SQLite versions can open the database. [1] When the last connection closes, it normally runs a final checkpoint and deletes the -wal and -shm files, though the WAL may remain after an unclean exit or with SQLITE\_FCNTL\_PERSIST\_WAL. [1] SQLite says the only safe way to remove a WAL file is to open the database with an sqlite3\_open() interface and immediately close it with sqlite3\_close(). [1]

If a connection is in EXCLUSIVE locking mode when it first enters WAL mode, it cannot switch to NORMAL locking until it exits WAL mode, whereas entering under NORMAL allows switching freely. [3]

Facts behind this answer:

- fact-c31e319e74ff47cb92fbc96e9555c826 [confirmed]: SQLite connections default to journal\_mode=DELETE, and a database is converted to WAL by running PRAGMA journal\_mode=WAL. [1]; as of unknown; one publisher.
  > An SQLite database connection defaults to journal\_mode=DELETE. To convert to WAL mode, use the following pragma: [1], 3. Activating And Configuring WAL Mode
  > PRAGMA journal\_mode=WAL;
  > 
  > The journal\_mode pragma returns a string which is the new journal mode. [1], 3. Activating And Configuring WAL Mode

- fact-9f8caeab30c24945bef36bd5c5d219fe [confirmed]: PRAGMA journal\_mode=WAL returns "wal" on success; if conversion fails, for example because the VFS lacks shared-memory support, the mode is unchanged and the prior mode is returned. [1]; as of unknown; one publisher.
  > On success, the pragma will return the string "wal". If the conversion to WAL could not be completed (for example, if the VFS does not support the necessary shared-memory primitives) then the journaling mode will be unchanged and the string returned from the primitive will be the prior journaling mode (for example "delete"). [1], 3. Activating And Configuring WAL Mode

- fact-1d8de527499c4786be49e727f9717c24 [confirmed]: Unlike other journal modes, WAL mode is persistent: it stays in effect across connections and after the database is closed and reopened. [1] [3]; as of unknown; one publisher.
  > Unlike the other journaling modes, PRAGMA journal\_mode=WAL is persistent. If a process sets WAL mode, then closes and reopens the database, the database will come back in WAL mode. [1], 3.3. Persistence of WAL mode
  > The WAL journaling mode is persistent; after being set it stays in effect across multiple database connections and after closing and reopening the database. [3], PRAGMA journal\_mode (partial capture)

- fact-5991d3a97bc843fe92b7e8c755b74d70 [confirmed]: Non-WAL journal modes such as TRUNCATE do not persist; after closing and reopening, the database returns to the default DELETE rollback mode. [1]; as of unknown; one publisher.
  > In contrast, if a process sets (for example) PRAGMA journal\_mode=TRUNCATE and then closes and reopens the database will come back up in the default rollback mode of DELETE rather than the previous TRUNCATE setting. [1], 3.3. Persistence of WAL mode

- fact-6f761cfda9b240d3a7eecc3dc859fe08 [confirmed]: Setting WAL journal mode on any one connection sets it on all connections to the same database file. [1]; as of unknown; one publisher.
  > The WAL journal mode will be set on all connections to the same database file if it is set on any one connection. [1], 3.3. Persistence of WAL mode

- fact-7d7c2f3a194b4e94a61af38198fe947b [confirmed]: Because WAL mode persists, an application can be switched to WAL without code changes by running PRAGMA journal\_mode=WAL with a utility, then restarting the application. [1]; as of unknown; one publisher.
  > The persistence of WAL mode means that applications can be converted to using SQLite in WAL mode without making any changes to the application itself. One has merely to run "PRAGMA journal\_mode=WAL;" on the database file(s) using the command-line shell or other utility, then restart the application. [1], 3.3. Persistence of WAL mode

- fact-e5bdae8e5905418f83b6c8f474619c29 [confirmed]: PRAGMA journal\_mode without a schema name changes the journal mode for all attached databases, and returns the original mode if the change could not be made. [3]; as of unknown; one publisher.
  > The second form changes the journaling mode for "database" or for all attached databases if "database" is omitted. The new journal mode is returned. If the journal mode could not be changed, the original journal mode is returned. [3], PRAGMA journal\_mode (partial capture)

- fact-d55342632f8b40e68dd70b029ddaf40e [confirmed]: The journal mode cannot be changed while a transaction is active, and in-memory databases can only use MEMORY or OFF, so they cannot use WAL. [3]; as of unknown; one publisher.
  > Note that the journal\_mode for an in-memory database is either MEMORY or OFF and can not be changed to a different value. An attempt to change the journal\_mode of an in-memory database to any setting other than MEMORY or OFF is ignored. Note also that the journal\_mode cannot be changed while a transaction is active. [3], PRAGMA journal\_mode (partial capture)

- fact-b7aff5b07530477da2005e3d2b825b44 [confirmed]: Running PRAGMA journal\_mode=DELETE leaves WAL mode explicitly and changes the file format version numbers back to 1 so older SQLite versions can open the database. [1]; as of unknown; one publisher.
  > One can explicitly change out of WAL mode using a pragma such as this:
  > 
  > PRAGMA journal\_mode=DELETE; [1], 10. Backwards Compatibility
  > Deliberately changing out of WAL mode changes the database file format version numbers back to 1 so that older versions of SQLite can once again access the database file. [1], 10. Backwards Compatibility

- fact-08bf8c4d8e8f4b1c85229dccd3512080 [confirmed]: When the last connection closes, it normally runs a final checkpoint and deletes the -wal and -shm files, though the WAL may remain after an unclean exit or with SQLITE\_FCNTL\_PERSIST\_WAL. [1]; as of unknown; one publisher.
  > When the last connection to a database closes, that connection does one last checkpoint and then deletes the WAL and its associated shared-memory file, to clean up the disk. [1], 6. Avoiding Excessively Large WAL Files
  > Usually, the WAL file is deleted automatically when the last connection to the database closes. However, if the last process to have the database open exits without cleanly shutting down the database connection, or if the SQLITE\_FCNTL\_PERSIST\_WAL file control is used, then the WAL file might be retained on disk after all connections to the database have been closed. [1], 4. The WAL File

- fact-b6042348bc60457fbe3f160299a064f3 [confirmed]: If a connection is in EXCLUSIVE locking mode when first entering WAL mode, it cannot switch to NORMAL locking until it exits WAL mode; entering under NORMAL allows switching freely. [3]; as of unknown; one publisher.
  > If the locking mode is EXCLUSIVE when first entering WAL journal mode, then the locking mode cannot be changed to NORMAL until after exiting WAL journal mode. If the locking mode is NORMAL when first entering WAL journal mode, then the locking mode can be changed between NORMAL and EXCLUSIVE and back again at any time and without needing to exit WAL journal mode. [3], PRAGMA locking\_mode (partial capture)

- fact-53041ebbc678401f965aab7fe4671265 [confirmed]: SQLite says the only safe way to remove a WAL file is to open the database with an sqlite3\_open() interface and immediately close it with sqlite3\_close(). [1]; as of unknown; one publisher.
  > The only safe way to remove a WAL file is to open the database file using one of the sqlite3\_open() interfaces then immediately close the database using sqlite3\_close(). [1], 4. The WAL File

### What performance advantages and disadvantages does SQLite's documentation give for WAL compared with rollback-journal mode, and for which workloads?

SQLite's documentation calls WAL significantly faster than a rollback journal in most scenarios, though perhaps 1% or 2% slower for applications that mostly read and seldom write. [1]

SQLite's WAL documentation says WAL is significantly faster than a rollback journal in most scenarios. [1] WAL write transactions are very fast because they write content once, versus twice for rollback-journal transactions, and all their writes are sequential. [1] SQLite also says disk I/O tends to be more sequential with WAL, and that WAL uses many fewer fsync() operations than a rollback journal, so it is less vulnerable where fsync() is broken. [1] For workloads mixing reads and writes, WAL gives more concurrency: readers and a writer proceed concurrently, whereas rollback mode temporarily expels readers before a writer changes the database file. [1] [4] SQLite's compile-options guide says transaction commit is much faster in WAL mode with synchronous=NORMAL than with FULL. [12]

For applications that mostly read and seldom write, SQLite says WAL might be very slightly slower than rollback-journal mode, perhaps 1% or 2%. [1] WAL read performance falls off as the WAL file grows, even with the wal-index, so SQLite advises checkpointing at regular intervals to keep the WAL small for good read performance. [1] Checkpoints are slower than write transactions because they require sync operations and more seeking, with many seeks typically interspersed among the page writes. [1] The default automatic checkpoint runs on the same thread as the COMMIT that pushes the WAL over its size limit, so occasional checkpoint-triggering COMMITs are much slower than most. [1]

Checkpoint frequency trades reads against writes: frequent checkpoints, perhaps every COMMIT, maximize read performance, while infrequent checkpoints that let the WAL grow maximize write performance by amortizing checkpoint cost. [1] SQLite says its default checkpoint at 1000 pages seems to work well in test applications on workstations, but that checkpoint frequency may vary with each application's read and write needs, platform and workload. [1] Under synchronous=NORMAL the checkpoint is the only operation that issues a sync, so running it in a separate thread or process helps prevent latch-up on a busy disk drive. [1] SQLite adds that with synchronous=NORMAL and checkpoints in a separate thread or process, the main thread never blocks on sync, but transactions are no longer durable across power failure. [1] EXCLUSIVE locking mode reduces filesystem system calls, possibly giving a small performance increase, and with it WAL shared memory can come from heap rather than a -shm file. [3] [16]

On large transactions, the WAL page says that beginning with version 3.11.0 (2016-02-15), WAL mode works as efficiently with large transactions as does rollback mode. [1] The same page also says rollback modes are likely faster above about 100-megabyte transactions, a statement that sits beside the 3.11.0 note. [1]

Gap (gap-af7e8805fcfd439f89989637e41ef412, checker assessment): Checker's assessment: the checked facts omit two performance caveats documented in wal.html section 2.3. The default automatic checkpoint makes most COMMITs very fast but an occasional COMMIT (one that triggers a checkpoint) much slower. Running checkpoints in a separate thread under synchronous=NORMAL means transactions are no longer durable and might roll back after a power failure or hard reset. The old large-transaction warning is struck through on the current page, so no current large-transaction disadvantage is documented. [1]

Facts behind this answer:

- fact-3dd074994e034313818a9ddbf89c4506 [confirmed]: SQLite's WAL documentation says WAL is significantly faster than a rollback journal in most scenarios. [1]; as of unknown; one publisher.
  > There are advantages and disadvantages to using WAL instead of a rollback journal. Advantages include: [1], 1. Overview
  > WAL is significantly faster in most scenarios. [1], 1. Overview

- fact-14005ef97cd34d0386a45133bc4742e7 [confirmed]: SQLite WAL write transactions are very fast because they write content once, versus twice for rollback-journal transactions, and all their writes are sequential. [1]; as of unknown; one publisher.
  > Write transactions are very fast since they only involve writing the content once (versus twice for rollback-journal transactions) and because the writes are all sequential. [1], 2.3. Performance Considerations

- fact-8cde8f13fe7c4a78b7fd02ec6da202ad [confirmed]: For SQLite workloads mixing reads and writes, WAL gives more concurrency than rollback mode: readers and a writer proceed concurrently, whereas rollback mode temporarily expels readers before a writer changes the database file. [1] [4]; as of unknown; one publisher.
  > WAL provides more concurrency as readers do not block writers and a writer does not block readers. Reading and writing can proceed concurrently. [1], 1. Overview
  > But before any changes are made to the database file on disk, all readers must be (temporarily) expelled in order to give the writer exclusive access to the database file. [4], Isolation And Concurrency

- fact-53372471035e4fe6a2c4cf4e2e78af93 [confirmed]: For applications that mostly read and seldom write, SQLite says WAL might be very slightly slower than rollback-journal mode, perhaps 1% or 2%. [1]; as of unknown; one publisher.
  > WAL might be very slightly slower (perhaps 1% or 2% slower) than the traditional rollback-journal approach in applications that do mostly reads and seldom write. [1], 1. Overview

- fact-9a0272ae252549a1b65afeab7d56415f [confirmed]: SQLite WAL read performance falls off as the WAL file grows, even with the wal-index, so SQLite advises checkpointing at regular intervals to keep the WAL small for good read performance. [1]; as of unknown; one publisher.
  > On the other hand, read performance deteriorates as the WAL file grows in size since each reader must check the WAL file for the content and the time needed to check the WAL file is proportional to the size of the WAL file. The wal-index helps find content in the WAL file much faster, but performance still falls off with increasing WAL file size. Hence, to maintain good read performance it is important to keep the WAL file size down by running checkpoints at regular intervals. [1], 2.3. Performance Considerations

- fact-e2e6679f158f40fdac136e15583f41e7 [confirmed]: SQLite WAL checkpoints are slower than write transactions because they require sync operations and more seeking, with many seeks typically interspersed among the page writes. [1]; as of unknown; one publisher.
  > Checkpointing does require sync operations in order to avoid the possibility of database corruption following a power loss or hard reboot. [1], 2.3. Performance Considerations
  > Checkpoint also requires more seeking. The checkpointer makes an effort to do as many sequential page writes to the database as it can (the pages are transferred from WAL to database in ascending order) but even then there will typically be many seek operations interspersed among the page writes. These factors combine to make checkpoints slower than write transactions. [1], 2.3. Performance Considerations

- fact-5257f8979e5a4802aac01c5f7b50fc6a [confirmed]: In SQLite WAL mode, frequent checkpoints, perhaps every COMMIT, maximize read performance, while infrequent checkpoints that let the WAL grow maximize write performance by amortizing checkpoint cost. [1]; as of unknown; one publisher.
  > Notice too that there is a tradeoff between average read performance and average write performance. To maximize the read performance, one wants to keep the WAL as small as possible and hence run checkpoints frequently, perhaps as often as every COMMIT. To maximize write performance, one wants to amortize the cost of each checkpoint over as many writes as possible, meaning that one wants to run checkpoints infrequently and let the WAL grow as large as possible before each checkpoint. [1], 2.3. Performance Considerations

- fact-a5d1d3f4939f4085b5fba30bcb19ee33 [confirmed]: SQLite says its default WAL checkpoint at 1000 pages seems to work well in test applications on workstations, but checkpoint frequency may vary with each application's read and write needs, platform and workload. [1]; as of unknown; one publisher.
  > The decision of how often to run checkpoints may therefore vary from one application to another depending on the relative read and write performance requirements of the application. The default strategy is to run a checkpoint once the WAL reaches 1000 pages and this strategy seems to work well in test applications on workstations, but other strategies might work better on different platforms or for different workloads. [1], 2.3. Performance Considerations

- fact-33879422455847c49b575bbe698f3f70 [confirmed]: SQLite says that under synchronous=NORMAL the WAL checkpoint is the only operation issuing a sync, so running it in a separate thread or process helps prevent latch-up on a busy disk drive. [1]; as of unknown; one publisher.
  > Note that with PRAGMA synchronous set to NORMAL, the checkpoint is the only operation to issue an I/O barrier or sync operation (fsync() on unix or FlushFileBuffers() on windows). If an application therefore runs checkpoint in a separate thread or process, the main thread or process that is doing database queries and updates will never block on a sync operation. This helps to prevent "latch-up" in applications running on a busy disk drive. [1], 2.3. Performance Considerations

- fact-36edf05ed43a4aeca55a264cbe3935b4 [confirmed]: SQLite says disk I/O tends to be more sequential with WAL, and WAL uses many fewer fsync() operations than a rollback journal, so it is less vulnerable where fsync() is broken. [1]; as of unknown; one publisher.
  > Disk I/O operations tends to be more sequential using WAL. [1], 1. Overview
  > WAL uses many fewer fsync() operations and is thus less vulnerable to problems on systems where the fsync() system call is broken. [1], 1. Overview

- fact-3ed6d0470add4267b6c29a76c2591248 [confirmed]: SQLite's WAL page says that beginning with version 3.11.0 (2016-02-15), WAL mode works as efficiently with large transactions as does rollback mode. [1]; as of unknown; one publisher.
  > For transactions in excess of a gigabyte, WAL mode may fail with an I/O or disk-full error. It is recommended that one of the rollback journal modes be used for transactions larger than a few dozen megabytes. Beginning with version 3.11.0 (2016-02-15), WAL mode works as efficiently with large transactions as does rollback mode. [1], 1. Overview

- fact-449ea2dcd9bf4be991caff0671fcf3b8 [confirmed]: SQLite says EXCLUSIVE locking mode reduces filesystem system calls, possibly giving a small performance increase, and that with EXCLUSIVE locking WAL shared memory can come from heap rather than a -shm file. [3] [16]; as of unknown; one publisher.
  > The number of system calls for filesystem operations is reduced, possibly resulting in a small performance increase. [3], PRAGMA locking\_mode (partial capture)
  > For example, if PRAGMA locking\_mode is set to EXCLUSIVE (meaning that only one process is able to access the database file) then the shared memory will be allocated from heap rather than out of the shared-memory file, and the shared-memory file will never be created. [16], 2.3. Shared-Memory Files


## Gaps

- Follow-up question (gap-question-1): What performance advantages and disadvantages does SQLite's documentation give for WAL compared with rollback-journal mode, and for which workloads?

## Conflicts and history

Conflict: wal.html presents RESTART and TRUNCATE checkpoints as running to completion, while the sqlite3\_wal\_checkpoint\_v2() page says FULL, RESTART and TRUNCATE continue like PASSIVE and return SQLITE\_BUSY if the busy handler gives up, so completion is not guaranteed.

| fact-c2ba83a076a84227b8e08fa3577bbe99 | fact-16168e517ec04b0194d831e0949ff592 |
| --- | --- |
| SQLite's manual SQLITE\_CHECKPOINT\_RESTART and SQLITE\_CHECKPOINT\_TRUNCATE checkpoints run to completion, but readers might block while such a checkpoint runs. [1]; as of unknown | If the busy handler returns 0 before a SQLite FULL, RESTART or TRUNCATE checkpoint gets the writer lock or while it waits for readers, it continues like PASSIVE and returns SQLITE\_BUSY. [9]; as of unknown |

- fact-c9fa784f4a59430b93a40f42e2f65a26 → fact-80b87648aebd473c96f56e37988d2a1b (narrowed): The useovernet.html Recommendations list applies to multiple clients on different machines that need simultaneous reads and writes, not to any multi-machine access, and the quoted rollback-mode option itself says it allows multiple simultaneous readers or one writer but not simultaneous readers and writers; the statement is narrowed to that context and caveat.
- fact-0c5d131b6434419a9da0ccfae2582c17 → fact-383df08e8fde437587143a9ab337e1c7 (narrowed): In the original Overview paragraph about 100 megabytes is where rollback modes 'will likely be faster', while the recommendation threshold is 'a few dozen megabytes'; the statement conflated the two. The page also presents this advice in the present tense, not as something it 'once' said, alongside the 3.11.0 sentence, without reconciling them.
- fact-fe8d91c7e152466e9996e530036346a8 → fact-ce60258dea684d2487f17a8bce41975c (narrowed): Section 4 says the WAL file 'should be kept with the database' if copied or moved, and that separation 'might' lose committed transactions or corrupt the file; 'must' and 'can' overstated the modality.
- fact-a1f7b1370a2f41188b7667faf9c60e14 → fact-3e16e2e7d44042008ae960ac9e806713 (narrowed): Both quotes occur in the originals under the cited headings and state the general property, but section 9 of the same wal.html page says this is only 'mostly true' and lists obscure cases returning SQLITE\_BUSY, and section 6 says readers might block during RESTART/TRUNCATE checkpoints, so the unqualified wording overstates the source.
- fact-21c5fa2b61ca4f2a83f7581c2493f696 → fact-ead45266be2241a280bb8c4c69ba7738 (narrowed): The quote (wal.html, 2. How WAL Works) says the changes themselves are appended to the WAL and a COMMIT occurs when a commit record is appended, so a COMMIT 'can happen without ever writing' the database; 'a COMMIT only appends a commit record' understates what is written to the WAL, and section 2.3 notes an automatic checkpoint can run in the committing thread, so the wording follows the source's 'can happen without'.
- fact-5a6949255db1471eade26b8933b1ef87 → fact-b7d12ae195d542f59b00ad2949f475f5 (narrowed): Both quotes occur as cited, but the no-later-SQLITE\_BUSY guarantee is quoted from the WAL-mode discussion in isolation.html, while lang\_transaction.html section 2.3 says COMMIT can return SQLITE\_BUSY if another thread or process has an open read connection; the documentation is not consistent on this outside WAL mode, so the claim is restricted to WAL mode, which the cited context supports.
- fact-d5281e03204e40a093032c6a7b85a332 → fact-d8fcc9a8d5d240a191f76654076ae595 (narrowed): The C API page says the waiting is done through the busy-handler callback and that TRUNCATE truncates the log 'just prior to a successful return'; the original wording made the wait and the truncation sound unconditional, while the same page says a busy handler returning 0 makes these modes fall back to PASSIVE behaviour.
- fact-b142a9063f1d40399a344f3750b0da66 → fact-6115957253f7407fb9cb6d4c23bd7450 (narrowed): The cited passage in section 2.2 states these as the conditions under which the writer rewinds ('if ... then the writer will rewind'), not as the only conditions; 'only when' is stronger than the quoted text.
- fact-cffe7165993f4597abfabd0a5c3108e0 → fact-0babe2c4601143a2b39701bf7953f8fb (narrowed): Section 6 says nothing prevents excessive WAL growth only for an application that disables the automatic checkpoint; it does not say this of options that merely defer it.
- fact-774e43b2f4b6465bace5fd103148100a → fact-7d390604ac56459b9bd94cc3569eae7c (narrowed): The WAL page offers this as something 'one might also consider'; it is attributed rather than asserted because the sqlite3\_wal\_checkpoint\_v2 page says these modes fall back to PASSIVE and return SQLITE\_BUSY if the busy handler returns 0, and describes RESTART as not impeding readers, so completion and reader blocking are the WAL page's own characterisation.
- fact-2f03e3ff453340f1800546206dd51be5 → fact-4900940a58fe4c678d5013cd7dc9f8db (narrowed): compile.html section 4 ties the WAL-mode default to SQLITE\_DEFAULT\_SYNCHRONOUS, which can itself be overridden; the source does not say WAL databases stay at FULL whenever only SQLITE\_DEFAULT\_WAL\_SYNCHRONOUS is left alone.
- fact-f08d73ca8b7d4a6f93e79f1fc741315c → fact-36edf05ed43a4aeca55a264cbe3935b4 (narrowed): wal.html section 1 hedges that disk I/O 'tends to be' more sequential using WAL; the original statement said WAL 'makes' disk I/O more sequential, which is stronger than the source.
- fact-07a7e529f4734fea88a626920a74b674 → fact-3ed6d0470add4267b6c29a76c2591248 (narrowed): On the live wal.html (last updated 2026-08-25), the text from 'WAL works best with smaller transactions' through 'transactions larger than a few dozen megabytes', including the gigabyte I/O or disk-full warning, is wrapped in \<s\> strikethrough markup as superseded; only the version 3.11.0 sentence is current. The pinned extraction drops the strikethrough, so presenting the gigabyte failure as a current warning is not supported.
- fact-1965146697ee42cc9717b8755493a4f8 → fact-449ea2dcd9bf4be991caff0671fcf3b8 (narrowed): Both quotes occur (pragma.html PRAGMA locking\_mode; tempfiles.html 2.3 Shared-Memory Files), but wal.html section 8 says the heap wal-index is used only when EXCLUSIVE is set before the first WAL-mode database access, so the unconditional claim is attributed and softened. The system-call reduction is a general EXCLUSIVE-mode benefit, not a WAL-versus-rollback comparison.
- fact-c1467a23d2324f61989a65c15492360a → fact-eafd2704f6604f158c22c8a86e8985c9 (narrowed): The cited quotes do not state that the callback runs after each commit; that wording comes from uncited text on the page, so the statement is limited to what the quoted passages say.
- fact-ea465c9a315a49e2bb6d97e0a8ad274d aliases fact-53041ebbc678401f965aab7fe4671265.
- fact-2ed9afff68d94309aae73df482389196 aliases fact-22bb8287076b4eef8f08c84b1776a645.

## Sources

1. [Write-Ahead Logging](https://www.sqlite.org/wal.html); SQLite project; primary; found; saved 2026-10-16T16:47:24.082Z; source date 2026-08-25; re-read 2026-10-16: unchanged.
2. [SQLite Over a Network, Caveats and Considerations](https://www.sqlite.org/useovernet.html); SQLite project; primary; found; saved 2026-10-16T16:47:24.084Z; source date 2022-06-22; re-read 2026-10-16: unchanged.
3. [Pragma statements supported by SQLite (journal\_mode through locking\_mode)](https://www.sqlite.org/pragma.html); SQLite project; primary; found; saved 2026-10-16T16:47:24.084Z; source date 2026-10-04; superseded by a newer revision; re-read 2026-10-16: changed.
   Partial capture: Saved only the contiguous PRAGMA journal\_mode through PRAGMA locking\_mode sections of the very long pragma page; the rest of the page is unrelated to these questions.
4. [Isolation In SQLite](https://www.sqlite.org/isolation.html); SQLite project; primary; found; saved 2026-10-16T16:47:29.624Z; source date 2022-04-18; re-read 2026-10-16: unchanged.
5. [Transaction](https://www.sqlite.org/lang_transaction.html); SQLite project; primary; found; saved 2026-10-16T16:47:29.625Z; source date 2026-02-18; re-read 2026-10-16: unchanged.
6. [Result and Error Codes](https://www.sqlite.org/rescode.html); SQLite project; primary; found; saved 2026-10-16T16:47:29.626Z; source date 2026-02-18; re-read 2026-10-16: unchanged.
7. [Set A Busy Timeout](https://www.sqlite.org/c3ref/busy_timeout.html); SQLite project; primary; found; saved 2026-10-16T16:47:29.627Z; source date unknown; re-read 2026-10-16: unchanged.
8. [Register A Callback To Handle SQLITE\_BUSY Errors](https://www.sqlite.org/c3ref/busy_handler.html); SQLite project; primary; found; saved 2026-10-16T16:47:29.627Z; source date unknown; re-read 2026-10-16: unchanged.
9. [Checkpoint a database (sqlite3\_wal\_checkpoint\_v2)](https://www.sqlite.org/c3ref/wal_checkpoint_v2.html); SQLite project; primary; found; saved 2026-10-16T16:47:32.794Z; source date unknown; re-read 2026-10-16: unchanged.
10. [Configure an auto-checkpoint (sqlite3\_wal\_autocheckpoint)](https://www.sqlite.org/c3ref/wal_autocheckpoint.html); SQLite project; primary; found; saved 2026-10-16T16:47:32.795Z; source date unknown; re-read 2026-10-16: unchanged.
11. [Pragma statements supported by SQLite](https://www.sqlite.org/pragma.html); SQLite project; primary; found; saved 2026-10-16T16:47:32.796Z; source date 2026-10-04; re-read 2026-10-16: unchanged.
12. [Compile-time Options](https://www.sqlite.org/compile.html); SQLite project; primary; found; saved 2026-10-16T16:48:18.522Z; source date 2026-10-01; re-read 2026-10-16: unchanged.
13. [Database File Format](https://www.sqlite.org/fileformat2.html); SQLite project; primary; found; saved 2026-10-16T16:48:18.524Z; source date 2025-12-25; re-read 2026-10-16: unchanged.
14. [WAL-mode File Format](https://www.sqlite.org/walformat.html); SQLite project; primary; found; saved 2026-10-16T16:48:18.524Z; source date 2025-05-10; re-read 2026-10-16: unchanged.
15. [How To Corrupt An SQLite Database File](https://www.sqlite.org/howtocorrupt.html); SQLite project; primary; found; saved 2026-10-16T16:48:18.525Z; source date 2026-04-13; re-read 2026-10-16: unchanged.
16. [Temporary Files Used By SQLite](https://www.sqlite.org/tempfiles.html); SQLite project; primary; found; saved 2026-10-16T17:00:13.854Z; source date 2025-06-12; re-read 2026-10-16: unchanged.
17. [Write-Ahead Log Commit Hook](https://www.sqlite.org/c3ref/wal_hook.html); SQLite project; primary; found; saved 2026-10-16T17:17:30.639Z; source date unknown; re-read 2026-10-16: unchanged.
18. [Pragma statements supported by SQLite (journal\_mode through locking\_mode)](https://www.sqlite.org/pragma.html); SQLite project; primary; found; saved 2026-10-16T17:25:09.240Z; source date unknown.

## Rejected facts and failed tasks

