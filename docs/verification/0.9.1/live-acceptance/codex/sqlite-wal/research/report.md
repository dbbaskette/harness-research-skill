# SQLite WAL: an application team's enablement decision

Request: SQLite WAL mode for an application team deciding whether to enable it: reader/writer interaction, checkpoints, durability, and practical limitations. Focused report using sqlite.org primary documentation first.

Run: 4448974aa66e4d969fb9d588; output revision: 36.
Status: complete. Depth: light. Started 2026-10-16; updated 2026-10-16.
Runtime: 0.9.1; guidance: 0.9.1 (local runtime guidance).

Focused, public-source research with sqlite.org documentation first. Explain WAL mechanics and reader/writer interaction, checkpoint behavior, durability choices, and deployment/operational limits. Assume ordinary SQLite connections on one host; distinguish documented behavior from workload-dependent performance. No application-specific benchmarks or deployment changes.

Sources given: none; further public sources were permitted.
Counts: 6 questions (6 answered, 0 partly, 0 not answered or not yet assessed); 44 current checked facts from 14 sources; 0 rejected, 3 narrowed; 0 gaps; 0 conflicts.
How facts were checked: each fact by a separate invocation from the one that researched it, against the original source (checkers: /root/check\_concurrency on codex, /root/check\_checkpoint on codex, /root/check\_limits on codex, /root/starvation\_check on codex).
Prose: citation and number validation, but no independent semantic writing review at light depth.
Facts are checked for source support, not certified as true or live-current.

Approval: Trial Reviewer approved output revision 23 on 2026-10-16; it no longer applies. The research changed since it was approved.

Plan notes: light depth usually plans 15 to 25 questions; this plan has 6. That suits a narrow request; otherwise add questions. light depth usually covers 6 to 10 sections; this plan has 3.

Researched again on request: round 1 (1 question; Research the checkpoint question again: explain precisely how a long-lived read transaction constrains checkpoint progress and WAL reset, how an application detects checkpoint starvation using checkpoint results and transaction lifetimes, and how it can avoid or resolve starvation without misreading WAL file size or PASSIVE success.).

Sources re-read: round 2 on 2026-10-16 (1 unchanged, 13 changed, 0 could not be opened; 0 questions researched again).

## Contents

- [Coverage](#coverage)
- [WAL mechanics and concurrency](#wal-mechanics-and-concurrency)
- [Checkpoints and durability](#checkpoints-and-durability)
- [Deployment limits and enablement decision](#deployment-limits-and-enablement-decision)
- [Gaps](#gaps)
- [Conflicts and history](#conflicts-and-history)
- [Sources](#sources)
- [Rejected facts and failed tasks](#rejected-facts-and-failed-tasks)

## Coverage

- WAL mechanics and concurrency: 8 current checked facts; 2/2 questions answered with current evidence.
- Checkpoints and durability: 22 current checked facts; 2/2 questions answered with current evidence.
- Deployment limits and enablement decision: 14 current checked facts; 2/2 questions answered with current evidence.

## WAL mechanics and concurrency

### How do WAL commits and reader snapshots work, and what concurrency does WAL permit?

WAL allows readers and a writer to proceed concurrently, while writes remain serialized. [1]

A writer appends changed pages to a separate WAL file and commits by appending a commit record; the main database file need not be updated at commit. [1] Each read transaction fixes an end mark at the latest valid commit and keeps that snapshot until the transaction ends. [1] For each page, the reader takes the latest applicable WAL version before its end mark, or reads the main database when no such version exists. [1]

This permits concurrent reading and writing, but only one writer can operate at a time. [1]

Facts behind this answer:

- fact-0b54369f718a442d8c38d5c9f4086ee3 [confirmed]: SQLite WAL appends changes to a separate log and commits by appending a commit record, without requiring the main database file to be updated at commit. [1]; as of unknown; one publisher.
  > The WAL approach inverts this. The original content is preserved
  > in the database file and the changes are appended into a separate
  > WAL file. A COMMIT occurs when a special record indicating a commit
  > is appended to the WAL. Thus a COMMIT can happen without ever writing
  > to the original database, which allows readers to continue operating
  > from the original unaltered database while changes are simultaneously being
  > committed into the WAL. Multiple transactions can be appended to the
  > end of a single WAL file. [1], 2. How WAL Works

- fact-0bd3611839fe4d1ea00656cea4c2d92f [confirmed]: A WAL reader fixes an end mark at the latest valid commit when its read transaction begins, preserving a stable snapshot until that transaction ends. [1]; as of unknown; one publisher.
  > When a read operation begins on a WAL-mode database, it first
  > remembers the location of the last valid commit record in the WAL.
  > Call this point the "end mark". Because the WAL can be growing and
  > adding new commit records while various readers connect to the database,
  > each reader can potentially have its own end mark. But for any
  > particular reader, the end mark is unchanged for the duration of the
  > transaction, thus ensuring that a single read transaction only sees
  > the database content as it existed at a single point in time. [1], 2.2. Concurrency

- fact-ec877bbcd141411ba81416103cf63f28 [confirmed]: A reader uses the latest WAL copy of a page preceding its end mark, falling back to the main database file when that WAL contains no applicable copy. [1]; as of unknown; one publisher.
  > When a reader needs a page of content, it first checks the WAL to
  > see if that page appears there, and if so it pulls in the last copy
  > of the page that occurs in the WAL prior to the reader's end mark.
  > If no copy of the page exists in the WAL prior to the reader's end mark,
  > then the page is read from the original database file. [1], 2.2. Concurrency

- fact-2bc9c1cadcf041838765b908f0752b29 [confirmed]: WAL permits readers and a writer to run concurrently, but only one writer can operate at a time. [1]; as of unknown; one publisher.
  > Writers merely append new content to the end of the WAL file.
  > Because writers do nothing that would interfere with the actions of
  > readers, writers and readers can run at the same time. However,
  > since there is only one WAL file, there can only be one writer at
  > a time. [1], 2.2. Concurrency

### What contention and stale-snapshot failures remain, and how should transaction design account for them?

WAL still requires handling busy connections and stale read-to-write upgrades. [1] [2]

SQLITE\_BUSY remains possible during exclusive locking, final-connection cleanup, or recovery after a crash. [1] If another connection has committed since a read snapshot began, attempting to upgrade that outdated snapshot to a writer can fail with SQLITE\_BUSY\_SNAPSHOT; release the snapshot and restart the transaction. [2]

For a transaction known to read and then write, successful BEGIN IMMEDIATE acquires the write transaction first and blocks other writers, avoiding the later stale-snapshot upgrade. [2] BEGIN IMMEDIATE can itself return SQLITE\_BUSY when another writer is already active. [3]

Facts behind this answer:

- fact-4cc5cc9ccad34367827bfb0a4febbdd2 [confirmed]: WAL queries can still return SQLITE\_BUSY during exclusive locking, final-connection cleanup, or crash recovery. [1]; as of unknown; one publisher.
  > If another database connection has the database mode open
  > in exclusive locking mode then all queries against the
  > database will return SQLITE\_BUSY. [1], 9. Sometimes Queries Return SQLITE\_BUSY In WAL Mode
  > When the last connection to a particular database is closing,
  > that connection will acquire an exclusive lock for a short time while
  > it cleans up the WAL and shared-memory files. If a separate attempt
  > is made to open and query the database while the first connection is
  > still in the middle of its cleanup process, the second connection
  > might get an SQLITE\_BUSY error. [1], 9. Sometimes Queries Return SQLITE\_BUSY In WAL Mode
  > If the last connection to a database crashed, then the first new
  > connection to open the database will start a recovery process. An
  > exclusive lock is held during recovery. So if a third database connection
  > tries to jump in and query while the second connection is running recovery,
  > the third connection will get an SQLITE\_BUSY error. [1], 9. Sometimes Queries Return SQLITE\_BUSY In WAL Mode

- fact-7198e538599c46dd946a67e41de74702 [confirmed]: Upgrading an outdated read snapshot to a writer fails with SQLITE\_BUSY\_SNAPSHOT; the application must release that snapshot and start a new transaction. [2]; as of unknown; one publisher.
  > Another example: X starts a read transaction using BEGIN and SELECT, then
  > Y makes a changes to the database using UPDATE. Then X tries to make a
  > change to the database using UPDATE. The attempt by X to escalate its
  > transaction from a read transaction to a write transaction fails with an
  > SQLITE\_BUSY\_SNAPSHOT error because the snapshot of the database being
  > viewed by X is no longer the latest version of the database. If X were
  > allowed to write, it would fork the history of the database file, which is
  > something SQLite does not support. In order for X to write to the database,
  > it must first release its snapshot (using ROLLBACK for example) then
  > start a new transaction with a subsequent BEGIN. [2], Isolation And Concurrency

- fact-66d2c3ae938a46a9a758d1c1ef6f0cda [confirmed]: BEGIN IMMEDIATE can itself fail with SQLITE\_BUSY when another connection already has an active write transaction. [3]; as of unknown; one publisher.
  > IMMEDIATE causes the database connection to start a new write
  > immediately, without waiting for a write statement. The
  > BEGIN IMMEDIATE might fail with SQLITE\_BUSY if another write
  > transaction is already active on another database connection. [3], 2.2. DEFERRED, IMMEDIATE, and EXCLUSIVE transactions

- fact-3981d552ffcb4a61af9e1bddad26e048 [confirmed]: For a transaction that will read then write, successful BEGIN IMMEDIATE starts a write transaction and blocks other writers, avoiding a later stale-snapshot upgrade. [2]; as of unknown; one publisher.
  > If X starts a transaction that will initially only read but X knows it
  > will eventually want to write and does not want to be troubled with
  > possible SQLITE\_BUSY\_SNAPSHOT errors that arise because another connection
  > jumped ahead of it in line, then X can issue BEGIN IMMEDIATE to start
  > its transaction instead of just an ordinary BEGIN. The BEGIN IMMEDIATE
  > command goes ahead and starts a write transaction, and thus blocks all
  > other writers. If the BEGIN IMMEDIATE operation succeeds, then no
  > subsequent operations in that transaction will ever fail with an
  > SQLITE\_BUSY error. [2], Isolation And Concurrency


## Checkpoints and durability

### How do automatic and manual checkpoints work, and how do long-lived readers affect WAL growth and latency?

A long-lived read snapshot can hold back checkpoint progress; completed backfill does not guarantee that the WAL is ready for reuse. [4] [13]

A read transaction keeps its original snapshot while other connections can continue writing. [1] A long-running reader can limit checkpoint progress at its fixed WAL end mark; SQLite remembers progress for later checkpoint calls. [4] Long or continuously overlapping reads can therefore prevent WAL reset while continued writes grow the WAL, increasing disk usage and slowing queries. [4]

PRAGMA main.wal\_checkpoint(PASSIVE) attempts nonwaiting checkpoint work and returns a busy indicator, WAL-page count, and checkpointed-page count. [4] [5] For valid nonnegative counts on a named WAL database, subtracting checkpointed pages from WAL pages gives the remaining backfill; the checkpoint API's checkpointed total includes prior calls, not only the current call's work. [5] [13] A successful PASSIVE call can still leave backfill incomplete, so its success indicator alone does not establish that checkpointing caught up. [5] [13] Equal nonnegative WAL and checkpointed totals establish completed backfill, not readiness for reuse: RESTART additionally waits for readers to stop using the WAL. [13] Current SQLite documentation also provides NOOP mode for status retrieval without checkpointing frames. [5] Physical WAL size alone is misleading because SQLite normally reuses a checkpointed file by overwriting it rather than shrinking it. [4]

An implicit transaction commits after its last active statement finishes; resetting or finalizing prepared statements guarantees cursor closure, and an open incremental BLOB also counts as unfinished. [3] For an explicit BEGIN DEFERRED transaction, finishing statements does not restore automatic commit: the transaction persists until COMMIT, ROLLBACK, or a rollback-provoking error. [3] Where exposed by the binding, sqlite3\_txn\_state reports no transaction, a read transaction, or a write transaction for the specified connection and schema. [14] SQLite recommends arranging reader gaps and attempting checkpoints during those gaps to avoid starvation. [4]

FULL waits for the writer and readers on older snapshots before completing backfill; RESTART additionally waits for WAL readers to finish, and TRUNCATE additionally shrinks the file on successful completion. [5] These manual modes can stop waiting when the busy handler declines, make only partial progress, and return SQLITE\_BUSY; a competing checkpoint can also return SQLITE\_BUSY without invoking the busy handler. [13] Automatic checkpoints remain PASSIVE, and their configurable size threshold does not change PASSIVE's nonwaiting behavior. [4] [5]

Facts behind this answer:

- fact-ccbbb694ead84c40bb9d5463fe764b0b [confirmed]: A WAL checkpoint copies committed transactions from the WAL file back into the main database file. [4]; as of unknown; one publisher.
  > Moving the WAL file transactions back into the database is called a "checkpoint". [4], 2.1 Checkpointing

- fact-5ca9da43aa8e4964b2dfd83d61ea5165 [confirmed]: SQLite defaults to automatic checkpoints when commits reach 1000 WAL pages, with a configurable threshold and an additional checkpoint when the last connection closes. [4]; as of unknown; one publisher.
  > By default, SQLite will automatically checkpoint whenever a COMMIT occurs that causes the WAL file to be 1000 pages or more in size, or when the last database connection on a database file closes. [4], 3.1 Automatic Checkpoint
  > The automatic checkpoint threshold can be changed or automatic checkpointing can be completely disabled using the wal\_autocheckpoint pragma [4], 3.1 Automatic Checkpoint

- fact-1a7cc728bdb14116a7e88815b63e72c9 [confirmed]: The committing thread normally performs automatic checkpoints, so checkpoint-triggering commits can have higher latency; applications can schedule checkpoints separately. [4]; as of unknown; one publisher.
  > By default, the checkpoint will be run automatically by the same thread that does the COMMIT that pushes the WAL over its size limit. This has the effect of causing most COMMIT operations to be very fast but an occasional COMMIT (those that trigger a checkpoint) to be much slower. If that effect is undesirable, then the application can disable automatic checkpointing and run the periodic checkpoints in a separate thread, or separate process. [4], 2.3 Performance Considerations

- fact-ecb4027650604e6b84e2eeaf039571c9 [confirmed]: Long or continuously overlapping read transactions can prevent WAL reset, causing unbounded WAL growth, excess disk usage and slower queries. [4]; as of unknown; one publisher.
  > However, if a database has many concurrent overlapping readers and there is always at least one active reader, then no checkpoints will be able to complete and hence the WAL file will grow without bound. [4], 6 Avoiding Excessively Large WAL Files
  > But it is possible to get SQLite into a state where the WAL file will grow without bound, causing excess disk space usage and slow query speeds. [4], 6 Avoiding Excessively Large WAL Files

- fact-b348064691664525b29ad185d2d2e54b [confirmed]: PASSIVE checkpoints, including automatic checkpoints, copy what they can without waiting for readers or writers, and may remain incomplete. [4] [5]; as of unknown; one publisher.
  > Checkpoint as many frames as possible without waiting for any database readers or writers to finish. [5], PRAGMA wal\_checkpoint, PASSIVE
  > All automatic checkpoints are PASSIVE. [5], PRAGMA wal\_autocheckpoint
  > The default checkpoint style is PASSIVE, which does as much work as it can without interfering with other database connections, and which might not run to completion if there are concurrent readers or writers. [4], 3.2 Application-Initiated Checkpoints

- fact-7d8bf1a3781b49f787a4fa771a24ad3c [confirmed]: FULL checkpoints wait for the writer and readers on older snapshots, then copy all frames and sync the database, blocking concurrent writers while allowing readers. [5]; as of unknown; one publisher.
  > This mode blocks (invokes the busy-handler callback) until there is no database writer and all readers are reading from the most recent database snapshot. It then checkpoints all frames in the log file and syncs the database file. FULL blocks concurrent writers while it is running, but readers can proceed. [5], PRAGMA wal\_checkpoint, FULL

- fact-c263437018994e3481709f2cf9fc6d5c [confirmed]: RESTART additionally waits for readers to finish with the WAL before reuse; TRUNCATE additionally shrinks it to zero bytes on successful completion, while busy conditions can prevent completion. [5]; as of unknown; one publisher.
  > This mode works the same way as FULL with the addition that after checkpointing the log file it blocks (calls the busy-handler callback) until all readers are finished with the log file. This ensures that the next client to write to the database file restarts the log file from the beginning. [5], PRAGMA wal\_checkpoint, RESTART
  > This mode works the same way as RESTART with the addition that the WAL file is truncated to zero bytes upon successful completion. [5], PRAGMA wal\_checkpoint, TRUNCATE
  > The first column is usually 0 but will be 1 if a RESTART or FULL or TRUNCATE checkpoint was blocked from completing, for example because another thread or process was actively using the database. [5], PRAGMA wal\_checkpoint, result row

- fact-bb3f95d9b3824e359a3196085ce84ed7 [confirmed]: Completing WAL backfill does not establish readiness for WAL reuse: RESTART additionally waits until all readers are reading from the database file only. [13]; as of unknown; one publisher.
  > SQLITE\_CHECKPOINT\_RESTART 
  > This mode works the same way as SQLITE\_CHECKPOINT\_FULL with the addition
  > that after checkpointing the log file it blocks (calls the
  >  busy-handler callback )
  > until all readers are reading from the database file only. This ensures
  > that the next writer will restart the log file from the beginning. [13], SQLITE\_CHECKPOINT\_RESTART

- fact-55dc7a8eb2d54a24b208e5c222ad389b [confirmed]: SQLite recommends arranging reader gaps and attempting checkpoints during those gaps to avoid checkpoint starvation. [4]; as of unknown; one publisher.
  > This scenario can be avoided by ensuring that there are "reader gaps": times when no processes are reading from the database and that checkpoints are attempted during those times. [4], §6 Avoiding Excessively Large WAL Files

- fact-6878006e882a418face7fd7a23c98bb3 [confirmed]: PRAGMA wal\_checkpoint returns a row containing a busy indicator, WAL-page count and checkpointed-page count; absent WAL yields negative sentinel counts. [5]; as of unknown; one publisher.
  > The wal\_checkpoint pragma returns a single row with three integer columns. The first column is usually 0 but will be 1 if a RESTART or FULL or TRUNCATE checkpoint was blocked from completing, for example because another thread or process was actively using the database. In other words, the first column is 0 if the equivalent call to sqlite3\_wal\_checkpoint\_v2() would have returned SQLITE\_OK or 1 if the equivalent call would have returned SQLITE\_BUSY. The second column is the number of modified pages that have been written to the write-ahead log file. The third column is the number of pages in the write-ahead log file that have been successfully moved back into the database file at the conclusion of the checkpoint. [5], PRAGMA wal\_checkpoint result columns
  > The second and third column are -1 if there is no write-ahead log, for example if this pragma is invoked on a database connection that is not in WAL mode. [5], PRAGMA wal\_checkpoint result columns

- fact-7e2ade16144b4d10b60c1c3703cc4ae8 [confirmed]: A successful PASSIVE checkpoint call need not have completed backfilling, so its success indicator alone cannot establish that checkpointing caught up. [5] [13]; as of unknown; one publisher.
  > On the other hand, passive mode might leave the checkpoint unfinished
  > if there are concurrent readers or writers. [13], SQLITE\_CHECKPOINT\_PASSIVE
  > In other words, the first column is 0 if the equivalent call to sqlite3\_wal\_checkpoint\_v2() would have returned SQLITE\_OK or 1 if the equivalent call would have returned SQLITE\_BUSY. [5], PRAGMA wal\_checkpoint result columns

- fact-09820c948a03441cb0b00a82721debef [confirmed]: SQLite documents NOOP checkpoint mode for obtaining checkpoint status values without checkpointing frames. [5]; as of unknown; one publisher.
  > NOOP This mode does not checkpoint any frames. It is used to obtain the returned values only. [5], PRAGMA wal\_checkpoint NOOP

- fact-0ee2bc4d6a614f1db2beb8a78a0ee806 [confirmed]: SQLite normally recycles a checkpointed WAL by overwriting it from the beginning rather than truncating it, so allocated file size need not shrink after successful checkpointing. [4]; as of unknown; one publisher.
  > The checkpoint does not normally truncate the WAL file (unless the journal\_size\_limit pragma is set). Instead, it merely causes SQLite to start overwriting the WAL file from the beginning. [4], §6 Avoiding Excessively Large WAL Files

- fact-1ece3cbec4e942fd94f16a8ae57e3a06 [confirmed]: An implicit transaction commits when its last active statement finishes; resetting or finalizing prepared statements guarantees cursor closure, while an open incremental BLOB also counts as unfinished. [3]; as of unknown; one publisher.
  > An implicit transaction (a transaction that is started automatically,
  > not a transaction started by BEGIN) is committed automatically when
  > the last active statement finishes. A statement finishes when its
  > last cursor closes, which is guaranteed to happen when the
  > prepared statement is reset or
  > finalized. Some statements might "finish"
  > for the purpose of transaction control prior to being reset or finalized,
  > but there is no guarantee of this. The only way to ensure that a
  > statement has "finished" is to invoke sqlite3\_reset() or
  > sqlite3\_finalize() on that statement. An open sqlite3\_blob used for
  > incremental BLOB I/O also counts as an unfinished statement.
  > The sqlite3\_blob finishes when it is closed. [3], §2.3 Implicit versus explicit transactions

- fact-f64c72cac83046f2bddf2812a301fc46 [confirmed]: BEGIN DEFERRED suppresses automatic commit after statements finish, preserving the subsequently started transaction until explicit COMMIT, ROLLBACK, or a rollback-provoking error. [3]; as of unknown; one publisher.
  > the BEGIN DEFERRED statement merely sets a flag on the database
  > connection that turns off the automatic commit that would normally
  > occur when the last statement finishes. This causes the transaction
  > that is automatically started to persist until an explicit
  > COMMIT or ROLLBACK or until a rollback is provoked by an error
  > or an ON CONFLICT ROLLBACK clause. [3], §2.2 DEFERRED, IMMEDIATE, and EXCLUSIVE transactions

- fact-9819eb11e74c49f9afdfcf4ec6743913 [confirmed]: sqlite3\_txn\_state reports the current transaction state of a schema on the specified connection, distinguishing no transaction, read transaction and write transaction. [14]; as of unknown; one publisher.
  > The sqlite3\_txn\_state(D,S) interface returns the current
  >  transaction state of schema S in database connection D. If S is NULL,
  > then the highest transaction state of any schema on database connection D
  > is returned. Transaction states are (in order of lowest to highest):
  > 
  >  SQLITE\_TXN\_NONE
  >  SQLITE\_TXN\_READ
  >  SQLITE\_TXN\_WRITE [14], sqlite3\_txn\_state interface and transaction states

- fact-a45e5ee6d9f047a38ae507d0c43511ee [confirmed]: For FULL, RESTART and TRUNCATE, a declining busy handler permits partial progress and SQLITE\_BUSY; competing checkpoints return SQLITE\_BUSY without invoking that handler. [13]; as of unknown; one publisher.
  > All calls obtain an exclusive "checkpoint" lock on the database file. If
  > any other process is running a checkpoint operation at the same time, the
  > lock cannot be obtained and SQLITE\_BUSY is returned. Even if there is a
  > busy-handler configured, it will not be invoked in this case. [13], Checkpoint lock contention
  > If the busy-handler returns 0 before
  > the writer lock is obtained or while waiting for database readers, the
  > checkpoint operation proceeds from that point in the same way as
  > SQLITE\_CHECKPOINT\_PASSIVE - checkpointing as many frames as possible
  > without blocking any further. SQLITE\_BUSY is returned in this case. [13], Writer lock and reader wait cancellation

- fact-42f5e1f70dcd45a0a4c8f0705cb11523 [confirmed]: A long-running read transaction can limit checkpoint progress at its fixed WAL end mark; SQLite remembers checkpoint progress for later invocations. [4]; as of unknown; one publisher.
  > But for any particular reader, the end mark is unchanged for the duration of the transaction, thus ensuring that a single read transaction only sees the database content as it existed at a single point in time. [4], §2.2 Concurrency
  > A checkpoint can run concurrently with readers, however the checkpoint must stop when it reaches a page in the WAL that is past the end mark of any current reader. The checkpoint has to stop at that point because otherwise it might overwrite part of the database file that the reader is actively using. The checkpoint remembers (in the wal-index) how far it got and will resume transferring content from the WAL to the database from where it left off on the next invocation. [4], §2.2 Concurrency

- fact-bdd6926e34e34334af33044f610e7e2b [confirmed]: For a named WAL database with valid output counts, the checkpoint API reports total WAL frames and cumulative checkpointed frames, including earlier calls, rather than only work performed by the current call. [13]; as of unknown; one publisher.
  > If pnLog is not NULL, then \*pnLog is set to the total number of frames in
  > the log file or to -1 if the checkpoint could not run because
  > of an error or because the database is not in WAL mode . If pnCkpt is not
  > NULL,then \*pnCkpt is set to the total number of checkpointed frames in the
  > log file (including any that were already checkpointed before the function
  > was called) [13], sqlite3\_wal\_checkpoint\_v2 output parameters

### What crash and power-loss durability do synchronous FULL and NORMAL provide in WAL mode?

In WAL mode, synchronous=FULL provides power-loss durability subject to working storage flushes; NORMAL accepts possible loss of committed transactions after power or OS failure. [5] [6]

With synchronous=FULL, SQLite adds a WAL sync for every transaction commit, providing durability across power loss. [5] With synchronous=NORMAL, the database remains consistent and committed transactions survive an application crash, but a power loss or operating-system crash may roll back committed transactions. [5] These durability properties depend on the operating system and storage honoring sync requests; broken flush behavior can undermine protection against power loss. [6]

Facts behind this answer:

- fact-c497e597c461487d982eddb3271e6513 [confirmed]: WAL with synchronous=FULL adds a WAL sync after each transaction commit and provides ACID durability across power loss. [5]; as of unknown; one publisher.
  > With synchronous=FULL in WAL mode, an additional sync operation of the WAL file happens after each transaction commit. The extra WAL sync following each transaction helps ensure that transactions are durable across a power loss. [5], PRAGMA synchronous
  > FULL is atomic, consistent, isolated, and durable (ACID) in WAL mode [5], PRAGMA synchronous, FULL

- fact-ced98114b9854f02a1734cb6fe37a556 [confirmed]: WAL with synchronous=NORMAL preserves consistency and survives application crashes, but committed transactions can roll back after power loss or an operating-system crash. [5]; as of unknown; one publisher.
  > WAL mode is always consistent with synchronous=NORMAL, but WAL mode does lose durability. A transaction committed in WAL mode with synchronous=NORMAL might roll back following a power loss or system crash. Transactions are durable across application crashes regardless of the synchronous setting or journal mode. [5], PRAGMA synchronous, NORMAL

- fact-84462dcb4bce462fa6c2b518c82e92a5 [confirmed]: SQLite durability depends on working storage flush behavior; operating-system or disk-controller failures to honor sync requests can undermine protection against power loss. [6]; as of unknown; one publisher.
  > SQLite assumes that the flush or fsync will not return until all pending write operations for the file that is being flushed have completed. [6], 2 Hardware Assumptions
  > We are told that the flush and fsync primitives are broken on some versions of Windows and Linux. This is unfortunate. It opens SQLite up to the possibility of database corruption following a power loss in the middle of a commit. [6], 2 Hardware Assumptions
  > Even on systems where FlushFileBuffers() and fsync() are said to be working, often the IDE disk control lies and says that data has reached oxide while it is still held only in the volatile control cache. [6], 9.2 Incomplete Disk Flushes


## Deployment limits and enablement decision

### Which deployment, file-handling, read-only, attached-database and compatibility limits matter before enabling WAL, including current relevant version caveats?

WAL requires a same-host deployment, careful file handling, and a SQLite build containing the WAL-reset fix. [7]

All processes accessing the database must run on the same host; WAL does not work over a network filesystem. [7] Transactions spanning ATTACHed databases are atomic within each database, but not across the set; changing page size requires leaving WAL for a rollback journal mode. [7]

The -wal file is persistent database state: separating it from the database during a copy or move can lose committed transactions or corrupt the database. [7] The -shm file supplies shared-memory coordination and contains no persistent database content. [12]

Since SQLite 3.22.0, read-only WAL access is possible when readable sidecars already exist, the directory permits their creation, or the connection uses immutable. [7] Immutable skips locking and change detection; using it for a database that changes can cause incorrect results or SQLITE\_CORRUPT errors. [10]

The documented WAL-reset corruption bug concerns concurrent writing or checkpointing connections and is fixed in SQLite 3.51.3 and later, with backports 3.44.6 and 3.50.7. [7]

Facts behind this answer:

- fact-f7730d9001c4456fbbd042f9830c5dd1 [confirmed]: WAL requires all database processes to run on the same host and does not work over a network filesystem. [7]; as of unknown; one publisher.
  > All processes using a database must be on the same host computer;
  >     WAL does not work over a network filesystem.  This is because WAL requires
  >     all processes to share a small amount of memory and processes on
  >     separate host machines obviously cannot share memory with each other. [7], §1 Overview, disadvantages

- fact-e650805cac374f5da598cac8d6f85cd4 [confirmed]: WAL transactions updating ATTACHed databases are atomic per database, but not across the attached databases as a set. [7]; as of unknown; one publisher.
  > Transactions that involve changes against multiple ATTACHed
  >     databases are atomic for each individual database, but are not
  >     atomic across all databases as a set. [7], §1 Overview, disadvantages

- fact-f6e7c645821d469ba9ddc8ef515ae770 [confirmed]: The database page size cannot change in WAL mode; changing it requires a rollback journal mode. [7]; as of unknown; one publisher.
  > It is not possible to change the page\_size after entering WAL
  >     mode, either on an empty database or by using VACUUM or by restoring
  >     from a backup using the backup API.  You must be in a rollback journal
  >     mode to change the page size. [7], §1 Overview, disadvantages

- fact-2fc4d64c701648afad2e650687051c85 [confirmed]: The WAL is persistent database state: separating it from a copied or moved database can lose committed transactions or corrupt the database. [7]; as of unknown; one publisher.
  > The WAL file is part of the persistent state of the
  > database and should be kept with the database if the database is copied
  > or moved.  If a database file is separated from its WAL file, then
  > transactions that were previously committed to the database might be lost,
  > or the database file might become corrupted. [7], §4 The WAL File

- fact-fd100a7cd203460c9a27a253fd455932 [confirmed]: The -shm shared-memory file contains no persistent content and serves processes accessing the same WAL database. [12]; as of unknown; one publisher.
  > The shared-memory file contains no persistent content.  The only purpose
  > of the shared-memory file is to provide a block of shared memory for use
  > by multiple processes all accessing the same database in WAL mode. [12], §2.3 Shared-Memory Files

- fact-c3b14a7c434c4e8ea734bfe46de445e4 [confirmed]: Since SQLite 3.22.0, read-only WAL databases can open when readable sidecars exist, their directory permits sidecar creation, or the connection uses immutable. [7]; as of unknown; one publisher.
  > This constraint was relaxed beginning with
  > SQLite version 3.22.0 (2018-01-22). [7], §5 Read-Only Databases
  > On newer versions of SQLite,
  > a WAL-mode database on read-only media, or a WAL-mode database that lacks
  > write permission, can still be read as long as one or more of the following
  > conditions are met:
  > 
  > 
  > The -shm and -wal files already exist and are readable.
  > 
  > There is write permission on the directory containing the database so
  >     that the -shm and -wal files can be created.
  > 
  > The database connection is opened using the
  >     immutable query parameter. [7], §5 Read-Only Databases

- fact-951cb2bc2a6649dca4f2d4870b709e5a [confirmed]: The immutable parameter skips locking and change detection; falsely declaring a changing database immutable can produce incorrect results or SQLITE\_CORRUPT errors. [10]; as of unknown; one publisher.
  > The immutable query parameter is a boolean that signals to
  > SQLite that the underlying database file is held on read-only media
  > and cannot be modified, even by another process with elevated
  > privileges.  SQLite always opens immutable database files
  > read-only and it skips all file locking and change detection
  > on immutable database files.  If this query parameter (or
  > the SQLITE\_IOCAP\_IMMUTABLE bit in xDeviceCharacteristics)
  > asserts that a database file is immutable and that file
  > changes anyhow, then SQLite might return incorrect query
  > results and/or SQLITE\_CORRUPT errors. [10], URI Query Parameters, immutable

- fact-c96fa4fe48f646b38992b592dc54b9fe [confirmed]: The WAL-reset corruption bug is fixed in SQLite 3.51.3 and later, with backports 3.44.6 and 3.50.7; it concerns concurrent writing or checkpointing connections. [7]; as of unknown; one publisher.
  > The bug is likely present in all version of SQLite from
  > 3.7.0 (2010-07-21) through 3.51.2 (2026-01-09).  It is
  > fixed in version 3.51.3 (2026-03-13) and later.  Backports of the fix
  > are available for some earlier releases:
  > 3.44.6 and
  > 3.50.7. [7], §11 The WAL-Reset Bug
  > The bug only affects databases in WAL mode when there are two or more
  > database connections open on the same file, in separate threads or processes,
  > and when those two connections attempt to write or checkpoint at the
  > same instant. [7], §11 The WAL-Reset Bug

### How is WAL enabled and verified, which settings persist or are per connection, and what documented tradeoffs inform the decision?

The documented benefit is overlapping reads and writes; costs include checkpoint work and sidecar files, with no increase in concurrent writers. [1] [7]

Enable with PRAGMA journal\_mode=WAL and check that the returned mode is wal; an unsuccessful conversion returns the previous mode. [7] The WAL choice persists across closing and reopening and applies to all connections to the database file. [7] Journal mode cannot change inside an active transaction, and in-memory databases support only MEMORY or OFF modes. [8]

The synchronous setting is local to the connection rather than saved in the database; reopening restores the default. [11] Automatic checkpointing is also configured per connection, with new connections normally defaulting to 1000 pages unless the compile-time default differs. [9]

WAL can be slightly slower for workloads dominated by reads with infrequent writes, and introduces checkpoint work and sidecar files. [7]

Facts behind this answer:

- fact-f9ecd6a1cb034139a32b6caaa1e55ea9 [confirmed]: Enable WAL using PRAGMA journal\_mode=WAL and verify the returned mode is wal; an unsuccessful conversion returns the unchanged prior mode. [7]; as of unknown; one publisher.
  > PRAGMA journal\_mode=WAL;
  > 
  > 
  > 
  > The journal\_mode pragma returns a string which is the new journal mode.
  > On success, the pragma will return the string "wal".  If 
  > the conversion to WAL could not be completed (for example, if the VFS
  > does not support the necessary shared-memory primitives) then the
  > journaling mode will be unchanged and the string returned from the
  > primitive will be the prior journaling mode (for example "delete"). [7], §3 Activating And Configuring WAL Mode

- fact-90f33461800b40d5af4b0f1eeaaf0b8e [confirmed]: WAL journal mode persists across closing and reopening the database and applies to all connections to that file. [7]; as of unknown; one publisher.
  > Unlike the other journaling modes, 
  > PRAGMA journal\_mode=WAL is
  > persistent.  If a process sets WAL mode, then closes and reopens the
  > database, the database will come back in WAL mode. [7], §3.3 Persistence of WAL mode
  > The WAL journal mode will be set on all
  > connections to the same database file if it is set on any one connection. [7], §3.3 Persistence of WAL mode

- fact-f1d73c2423154ecc9d0422f3fd284614 [confirmed]: The synchronous setting is local rather than stored in the database file, and reopening restores its default. [11]; as of unknown; one publisher.
  > \*\* Return or set the local value of the synchronous flag.  Changing
  >   \*\* the local value does not make changes to the disk file and the
  >   \*\* default value will be restored the next time the database is
  >   \*\* opened. [11], src/pragma.c, PRAGMA synchronous comment

- fact-a2f604fe0690428fbff275e51c45facb [confirmed]: Automatic checkpointing is configured per connection; new connections default to 1000 pages unless the compile-time default changes. [9]; as of unknown; one publisher.
  > Every new database connection defaults to having the auto-checkpoint
  > enabled with a threshold of 1000 or SQLITE\_DEFAULT\_WAL\_AUTOCHECKPOINT
  > pages. [9], sqlite3\_wal\_autocheckpoint(), default

- fact-a02f5d170d724e349bda94ca2d1310c2 [confirmed]: WAL can be slightly slower for applications dominated by reads with infrequent writes, and it introduces checkpoint work and sidecar files. [7]; as of unknown; one publisher.
  > WAL might be very slightly slower (perhaps 1% or 2% slower)
  >     than the traditional rollback-journal approach
  >     in applications that do mostly reads and seldom write. [7], §1 Overview, disadvantages
  > There is an additional quasi-persistent "-wal" file and
  >     "-shm" shared memory file associated with each
  >     database, which can make SQLite less appealing for use as an 
  >     application file-format.
  > 
  > There is the extra operation of checkpointing which, though automatic
  >     by default, is still something that application developers need to
  >     be mindful of. [7], §1 Overview, disadvantages

- fact-7e08dcec19f74d009173205cc4aac523 [confirmed]: Journal mode cannot change during an active transaction; an in-memory database supports only MEMORY or OFF journal modes. [8]; as of unknown; one publisher.
  > Note that the journal\_mode for an in-memory database
  >     is either MEMORY or OFF and can not be changed to a different value.
  >     An attempt to change the journal\_mode of an in-memory database to
  >     any setting other than MEMORY or OFF is ignored.  Note also that
  >     the journal\_mode cannot be changed while a transaction is active. [8], PRAGMA journal\_mode


## Gaps

None recorded.

## Conflicts and history

- fact-9fc87a0b2b85495886705d712dd278bf → fact-3981d552ffcb4a61af9e1bddad26e048 (narrowed): The source conditions the guarantee on BEGIN IMMEDIATE succeeding; it can itself return SQLITE\_BUSY when another writer is active.
- fact-26077cbe62e34b86804808715e9d12f2 → fact-42f5e1f70dcd45a0a4c8f0705cb11523 (narrowed): WAL section 2.2 describes the end-mark constraint but says a long-running reader can prevent progress; retain that qualification rather than imply every open reader necessarily blocks backfill.
- fact-448f73ca89ac4b068cffa528b8a9eb17 → fact-bdd6926e34e34334af33044f610e7e2b (narrowed): The API context says counts are undefined when zDb is NULL or empty and gives negative sentinel values on errors or non-WAL databases; constrain the assertion to valid per-database output counts.

## Sources

1. [Write-Ahead Logging](https://sqlite.org/wal.html); SQLite; primary; found; saved 2026-10-16T16:44:27.162Z; source date unknown; superseded by a newer revision; re-read 2026-10-16: changed.
2. [Isolation In SQLite](https://sqlite.org/isolation.html); SQLite; primary; found; saved 2026-10-16T16:44:27.163Z; source date unknown; superseded by a newer revision; re-read 2026-10-16: changed.
3. [Transaction](https://sqlite.org/lang_transaction.html); SQLite; primary; found; saved 2026-10-16T16:44:27.164Z; source date 2026-02-18; superseded by a newer revision; re-read 2026-10-16: changed.
4. [Write-Ahead Logging](https://www.sqlite.org/wal.html); SQLite; primary; found; saved 2026-10-16T16:45:22.635Z; source date 2026-08-25; superseded by a newer revision; re-read 2026-10-16: changed.
5. [PRAGMA Statements](https://www.sqlite.org/pragma.html); SQLite; primary; found; saved 2026-10-16T16:45:22.637Z; source date 2026-10-04; superseded by a newer revision; re-read 2026-10-16: changed.
6. [Atomic Commit In SQLite](https://www.sqlite.org/atomiccommit.html); SQLite; primary; found; saved 2026-10-16T16:45:22.638Z; source date unknown; superseded by a newer revision; re-read 2026-10-16: changed.
7. [Write-Ahead Logging](https://sqlite.org/wal.html); SQLite project; primary; found; saved 2026-10-16T16:45:28.566Z; source date 2026-08-25; superseded by a newer revision; re-read 2026-10-16: changed.
8. [PRAGMA Statements](https://sqlite.org/pragma.html); SQLite project; primary; found; saved 2026-10-16T16:45:28.567Z; source date unknown; superseded by a newer revision; re-read 2026-10-16: changed.
9. [Configure an auto-checkpoint](https://sqlite.org/c3ref/wal_autocheckpoint.html); SQLite project; primary; found; saved 2026-10-16T16:45:28.568Z; source date unknown; superseded by a newer revision; re-read 2026-10-16: changed.
10. [Uniform Resource Identifiers in SQLite](https://sqlite.org/uri.html); SQLite project; primary; found; saved 2026-10-16T16:45:28.569Z; source date unknown; superseded by a newer revision; re-read 2026-10-16: changed.
11. [SQLite source: src/pragma.c](https://sqlite.org/src/raw/src/pragma.c?ci=trunk); SQLite project; primary; found; saved 2026-10-16T16:45:28.570Z; source date unknown; re-read 2026-10-16: unchanged.
12. [Temporary Files Used By SQLite](https://sqlite.org/tempfiles.html); SQLite project; primary; found; saved 2026-10-16T16:45:28.571Z; source date unknown; superseded by a newer revision; re-read 2026-10-16: changed.
13. [Checkpoint a database](https://sqlite.org/c3ref/wal_checkpoint_v2.html); SQLite; primary; found; saved 2026-10-16T16:53:58.226Z; source date unknown; superseded by a newer revision; re-read 2026-10-16: changed.
14. [Determine the transaction state of a database](https://sqlite.org/c3ref/txn_state.html); SQLite; primary; found; saved 2026-10-16T16:53:58.228Z; source date unknown; superseded by a newer revision; re-read 2026-10-16: changed.
15. [Write-Ahead Logging](https://sqlite.org/wal.html); SQLite; primary; found; saved 2026-10-16T16:59:11.942Z; source date unknown.
16. [Isolation In SQLite](https://sqlite.org/isolation.html); SQLite; primary; found; saved 2026-10-16T16:59:11.999Z; source date unknown.
17. [Transaction](https://sqlite.org/lang_transaction.html); SQLite; primary; found; saved 2026-10-16T16:59:12.005Z; source date unknown.
18. [Write-Ahead Logging](https://www.sqlite.org/wal.html); SQLite; primary; found; saved 2026-10-16T16:59:12.011Z; source date unknown.
19. [PRAGMA Statements](https://www.sqlite.org/pragma.html); SQLite; primary; found; saved 2026-10-16T16:59:12.118Z; source date unknown.
20. [Atomic Commit In SQLite](https://www.sqlite.org/atomiccommit.html); SQLite; primary; found; saved 2026-10-16T16:59:12.543Z; source date unknown.
21. [Write-Ahead Logging](https://sqlite.org/wal.html); SQLite project; primary; found; saved 2026-10-16T16:59:12.619Z; source date unknown.
22. [Temporary Files Used By SQLite](https://sqlite.org/tempfiles.html); SQLite project; primary; found; saved 2026-10-16T16:59:12.645Z; source date unknown.
23. [Uniform Resource Identifiers in SQLite](https://sqlite.org/uri.html); SQLite project; primary; found; saved 2026-10-16T16:59:12.647Z; source date unknown.
24. [Configure an auto-checkpoint](https://sqlite.org/c3ref/wal_autocheckpoint.html); SQLite project; primary; found; saved 2026-10-16T16:59:12.755Z; source date unknown.
25. [PRAGMA Statements](https://sqlite.org/pragma.html); SQLite project; primary; found; saved 2026-10-16T16:59:12.758Z; source date unknown.
26. [Checkpoint a database](https://sqlite.org/c3ref/wal_checkpoint_v2.html); SQLite; primary; found; saved 2026-10-16T16:59:12.806Z; source date unknown.
27. [Determine the transaction state of a database](https://sqlite.org/c3ref/txn_state.html); SQLite; primary; found; saved 2026-10-16T16:59:12.808Z; source date unknown.

## Rejected facts and failed tasks

