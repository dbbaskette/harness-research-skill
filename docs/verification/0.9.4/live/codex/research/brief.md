# SQLite WAL: an application team's enablement guide
Run: 84c16de8f7574291b49a6495; output revision: 23; status: complete.

fact-463148af11134eb999da6952acde86d0: WAL preserves the main database while appending changes to a separate log; appending a commit record commits the transaction before its changes reach the main database.
fact-1be289cae0e749189e77c8ec580eea8b: A WAL reader records an end mark at transaction start and keeps the same committed snapshot throughout that read transaction.
fact-7064c1dce0a749d08f0c68454d082e4f: A reader uses the latest page version before its end mark from the WAL, falling back to the main database when the WAL has no eligible copy.
fact-7f1d8a5f7e9c4c499637342916b8bac9: Readers and a writer can run concurrently in WAL mode, but only one writer can operate at a time.
fact-9c714d223ab64d60a28281243f54719d: A read transaction whose snapshot became stale cannot upgrade to writing: SQLITE_BUSY_SNAPSHOT requires releasing that snapshot and starting a new transaction.
fact-d5486e45e5ce40e0ac6560c8e96375a5: BEGIN IMMEDIATE reserves the write transaction before reading and blocks other writers, avoiding stale-snapshot upgrades, but it can itself return SQLITE_BUSY when another writer is active.
fact-937da299f3dd459584bc5533e54a8e10: Even WAL queries can return SQLITE_BUSY during exclusive locking, final-connection cleanup or crash recovery, so applications must handle busy results.
fact-e0317b006dce4276962d2fb5fa546607: sqlite3_busy_timeout installs a handler that sleeps while locks persist, then returns SQLITE_BUSY after the configured accumulated waiting time.
fact-32162a7bae7543028b239dbd705b2f4b: A checkpoint transfers transactions from the WAL back into the original database file.
fact-669816523ce248e89d4a6a84d759c134: PASSIVE checkpoints copy as many frames as possible without waiting for readers or writers, never call the busy handler, and may remain incomplete.
fact-32c3669f717841aabe03395561445cff: FULL checkpoints wait for the writer and older reader snapshots, then checkpoint and sync all frames; new writers block while new readers can proceed.
fact-e4d5524f34144cb69880830ccf34c7d0: RESTART adds waiting until readers use only the database file so the next writer can reuse WAL; TRUNCATE additionally shrinks WAL to zero bytes on success.
fact-215cc15872d340ea8d2a298711f31203: PRAGMA wal_checkpoint returns three columns: busy status, WAL pages and checkpointed pages; status 1 means the equivalent API call would return SQLITE_BUSY.
fact-2073a444dbe14d5d86c8d6e347f9bd7b: Overlapping readers that never release WAL can prevent its reset and cause unbounded growth; scheduling checkpoints during reader gaps avoids this starvation.
fact-a6e235a9ed7241fcba5e748dade72f0d: Ordinary checkpoints recycle WAL for overwriting rather than truncate its file, so a large file alone does not prove checkpoint failure.
fact-de9c558e76524318aff47bdcd2afe233: Automatic checkpoint work runs in the COMMIT thread and can slow occasional commits; applications can move periodic checkpoints to a separate thread or process.
fact-1357ac6cdc48482aaa6b70087bff2084: Larger WAL files reduce read performance, making checkpoint frequency a tradeoff between read speed and amortized write cost.
fact-23b331d29a614e87a3a92b30343c6290: FULL, RESTART and TRUNCATE may return SQLITE_BUSY after partial progress if the busy handler stops waiting; a concurrent checkpoint can also return SQLITE_BUSY immediately.
fact-711058c0ca2f4a70b3ed8c105b9cca34: In WAL mode, synchronous=FULL provides ACID durability and adds a WAL sync after each committed transaction.
fact-754f8c8c35cf41d584f6ec9aaa0bac4c: WAL with synchronous=NORMAL remains consistent and safe from corruption, but committed transactions can roll back after power loss or an operating-system crash; application crashes retain committed transactions.
fact-a6dca70e03a34cb3b9db92748e227ea1: With synchronous=NORMAL, SQLite syncs the WAL before checkpoints, the database after completed checkpoints, and the WAL header before reuse; most transactions perform no sync.
fact-e5b1bc06595c448ab14df9c84faf852c: With synchronous=OFF, SQLite omits syncing, so an application crash leaves data safe but an operating-system crash or power loss can corrupt the database.
fact-41f7a4b9cfd3455ebf84226d1e42487e: SQLite WAL requires all database processes to run on the same host and does not work over a network filesystem.
fact-38231d3b5c864ad6ab0a6bb7b71c4f34: Transactions modifying multiple ATTACHed databases are atomic within each database, but not across the database set.
fact-9c681b38e2984f94b4fc1f426de617a0: SQLite cannot change page_size in WAL mode, including through VACUUM or backup restoration; changing it requires rollback journal mode.
fact-9ac7ccbcad6a4ffc81bb62320e4d71d3: The WAL contains persistent database state: separating it from a copied or moved database can lose committed transactions or cause corruption; SQLite, rather than manual deletion, must remove it safely.
fact-ed027e90bec04362a4f2f3c2b333f219: Since SQLite 3.22.0, read-only WAL databases can open when their sidecars exist and are readable, their directory permits creating sidecars, or the connection declares the database immutable.
fact-06c93e8165ed405f8ff013acb1426c23: The rare WAL-reset corruption race affects concurrent writes or checkpoints; SQLite fixes it in 3.51.3 and later, with 3.44.6 and 3.50.7 backports.
fact-d79d75559d1143d5a2c0f01a2abb8d76: Enable WAL using PRAGMA journal_mode=WAL and verify that the returned mode is wal; a failed conversion returns the previous mode.
fact-2b0a419790034a628c1ca883f43b49a7: WAL journal mode persists after closing and reopening a database and applies to all connections to that database file.
fact-fc6e2262c7b3431a9ac4c83276bb6b2f: Automatic checkpoint configuration belongs to a connection; every new connection starts with automatic checkpoints enabled at 1000 pages unless the compile-time default differs.
fact-54a527d2d6804f0099e20d523bfeb248: WAL synchronous defaults depend on SQLite compile-time options, so applications should explicitly set and verify their required durability policy when opening connections.
fact-823cee443ba64a66a15297c200e96d55: For live database backups, SQLite offers the Online Backup API and VACUUM INTO; the latter creates a separate vacuumed copy.
fact-6eb7df9ae9724f199a72d79041d7f724: SQLite defaults to automatic PASSIVE checkpoints after commits leave WAL at least 1000 pages long, with the threshold configurable; SQLite also checkpoints when the last connection closes.
fact-b6973dd1a1f3448c9476ae9d6cff735b: A checkpoint cannot copy WAL pages past an active reader’s end mark, so long read transactions can prevent checkpoint progress.
