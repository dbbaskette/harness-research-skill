# SQLite WAL: an application team's enablement decision
Run: 4448974aa66e4d969fb9d588; output revision: 36; status: complete.

fact-0b54369f718a442d8c38d5c9f4086ee3: SQLite WAL appends changes to a separate log and commits by appending a commit record, without requiring the main database file to be updated at commit.
fact-0bd3611839fe4d1ea00656cea4c2d92f: A WAL reader fixes an end mark at the latest valid commit when its read transaction begins, preserving a stable snapshot until that transaction ends.
fact-ec877bbcd141411ba81416103cf63f28: A reader uses the latest WAL copy of a page preceding its end mark, falling back to the main database file when that WAL contains no applicable copy.
fact-2bc9c1cadcf041838765b908f0752b29: WAL permits readers and a writer to run concurrently, but only one writer can operate at a time.
fact-4cc5cc9ccad34367827bfb0a4febbdd2: WAL queries can still return SQLITE_BUSY during exclusive locking, final-connection cleanup, or crash recovery.
fact-7198e538599c46dd946a67e41de74702: Upgrading an outdated read snapshot to a writer fails with SQLITE_BUSY_SNAPSHOT; the application must release that snapshot and start a new transaction.
fact-66d2c3ae938a46a9a758d1c1ef6f0cda: BEGIN IMMEDIATE can itself fail with SQLITE_BUSY when another connection already has an active write transaction.
fact-3981d552ffcb4a61af9e1bddad26e048: For a transaction that will read then write, successful BEGIN IMMEDIATE starts a write transaction and blocks other writers, avoiding a later stale-snapshot upgrade.
fact-ccbbb694ead84c40bb9d5463fe764b0b: A WAL checkpoint copies committed transactions from the WAL file back into the main database file.
fact-5ca9da43aa8e4964b2dfd83d61ea5165: SQLite defaults to automatic checkpoints when commits reach 1000 WAL pages, with a configurable threshold and an additional checkpoint when the last connection closes.
fact-1a7cc728bdb14116a7e88815b63e72c9: The committing thread normally performs automatic checkpoints, so checkpoint-triggering commits can have higher latency; applications can schedule checkpoints separately.
fact-ecb4027650604e6b84e2eeaf039571c9: Long or continuously overlapping read transactions can prevent WAL reset, causing unbounded WAL growth, excess disk usage and slower queries.
fact-b348064691664525b29ad185d2d2e54b: PASSIVE checkpoints, including automatic checkpoints, copy what they can without waiting for readers or writers, and may remain incomplete.
fact-7d8bf1a3781b49f787a4fa771a24ad3c: FULL checkpoints wait for the writer and readers on older snapshots, then copy all frames and sync the database, blocking concurrent writers while allowing readers.
fact-c263437018994e3481709f2cf9fc6d5c: RESTART additionally waits for readers to finish with the WAL before reuse; TRUNCATE additionally shrinks it to zero bytes on successful completion, while busy conditions can prevent completion.
fact-c497e597c461487d982eddb3271e6513: WAL with synchronous=FULL adds a WAL sync after each transaction commit and provides ACID durability across power loss.
fact-ced98114b9854f02a1734cb6fe37a556: WAL with synchronous=NORMAL preserves consistency and survives application crashes, but committed transactions can roll back after power loss or an operating-system crash.
fact-84462dcb4bce462fa6c2b518c82e92a5: SQLite durability depends on working storage flush behavior; operating-system or disk-controller failures to honor sync requests can undermine protection against power loss.
fact-f7730d9001c4456fbbd042f9830c5dd1: WAL requires all database processes to run on the same host and does not work over a network filesystem.
fact-e650805cac374f5da598cac8d6f85cd4: WAL transactions updating ATTACHed databases are atomic per database, but not across the attached databases as a set.
fact-f6e7c645821d469ba9ddc8ef515ae770: The database page size cannot change in WAL mode; changing it requires a rollback journal mode.
fact-2fc4d64c701648afad2e650687051c85: The WAL is persistent database state: separating it from a copied or moved database can lose committed transactions or corrupt the database.
fact-fd100a7cd203460c9a27a253fd455932: The -shm shared-memory file contains no persistent content and serves processes accessing the same WAL database.
fact-c3b14a7c434c4e8ea734bfe46de445e4: Since SQLite 3.22.0, read-only WAL databases can open when readable sidecars exist, their directory permits sidecar creation, or the connection uses immutable.
fact-951cb2bc2a6649dca4f2d4870b709e5a: The immutable parameter skips locking and change detection; falsely declaring a changing database immutable can produce incorrect results or SQLITE_CORRUPT errors.
fact-c96fa4fe48f646b38992b592dc54b9fe: The WAL-reset corruption bug is fixed in SQLite 3.51.3 and later, with backports 3.44.6 and 3.50.7; it concerns concurrent writing or checkpointing connections.
fact-f9ecd6a1cb034139a32b6caaa1e55ea9: Enable WAL using PRAGMA journal_mode=WAL and verify the returned mode is wal; an unsuccessful conversion returns the unchanged prior mode.
fact-90f33461800b40d5af4b0f1eeaaf0b8e: WAL journal mode persists across closing and reopening the database and applies to all connections to that file.
fact-f1d73c2423154ecc9d0422f3fd284614: The synchronous setting is local rather than stored in the database file, and reopening restores its default.
fact-a2f604fe0690428fbff275e51c45facb: Automatic checkpointing is configured per connection; new connections default to 1000 pages unless the compile-time default changes.
fact-a02f5d170d724e349bda94ca2d1310c2: WAL can be slightly slower for applications dominated by reads with infrequent writes, and it introduces checkpoint work and sidecar files.
fact-7e08dcec19f74d009173205cc4aac523: Journal mode cannot change during an active transaction; an in-memory database supports only MEMORY or OFF journal modes.
fact-bb3f95d9b3824e359a3196085ce84ed7: Completing WAL backfill does not establish readiness for WAL reuse: RESTART additionally waits until all readers are reading from the database file only.
fact-55dc7a8eb2d54a24b208e5c222ad389b: SQLite recommends arranging reader gaps and attempting checkpoints during those gaps to avoid checkpoint starvation.
fact-6878006e882a418face7fd7a23c98bb3: PRAGMA wal_checkpoint returns a row containing a busy indicator, WAL-page count and checkpointed-page count; absent WAL yields negative sentinel counts.
fact-7e2ade16144b4d10b60c1c3703cc4ae8: A successful PASSIVE checkpoint call need not have completed backfilling, so its success indicator alone cannot establish that checkpointing caught up.
fact-09820c948a03441cb0b00a82721debef: SQLite documents NOOP checkpoint mode for obtaining checkpoint status values without checkpointing frames.
fact-0ee2bc4d6a614f1db2beb8a78a0ee806: SQLite normally recycles a checkpointed WAL by overwriting it from the beginning rather than truncating it, so allocated file size need not shrink after successful checkpointing.
fact-1ece3cbec4e942fd94f16a8ae57e3a06: An implicit transaction commits when its last active statement finishes; resetting or finalizing prepared statements guarantees cursor closure, while an open incremental BLOB also counts as unfinished.
fact-f64c72cac83046f2bddf2812a301fc46: BEGIN DEFERRED suppresses automatic commit after statements finish, preserving the subsequently started transaction until explicit COMMIT, ROLLBACK, or a rollback-provoking error.
fact-9819eb11e74c49f9afdfcf4ec6743913: sqlite3_txn_state reports the current transaction state of a schema on the specified connection, distinguishing no transaction, read transaction and write transaction.
fact-a45e5ee6d9f047a38ae507d0c43511ee: For FULL, RESTART and TRUNCATE, a declining busy handler permits partial progress and SQLITE_BUSY; competing checkpoints return SQLITE_BUSY without invoking that handler.
fact-42f5e1f70dcd45a0a4c8f0705cb11523: A long-running read transaction can limit checkpoint progress at its fixed WAL end mark; SQLite remembers checkpoint progress for later invocations.
fact-bdd6926e34e34334af33044f610e7e2b: For a named WAL database with valid output counts, the checkpoint API reports total WAL frames and cumulative checkpointed frames, including earlier calls, rather than only work performed by the current call.
