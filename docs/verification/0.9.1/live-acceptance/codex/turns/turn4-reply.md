A long-lived read can retain an old snapshot while writers continue, limiting checkpoint progress and preventing WAL reuse. Continued writes can then make the WAL grow. [SQLite WAL documentation](https://sqlite.org/wal.html#concurrency).

To detect and avoid starvation:

- **Monitor progress:** `PRAGMA main.wal_checkpoint(PASSIVE)` returns busy status, WAL pages, and checkpointed pages. For valid nonnegative counts, their difference is remaining backfill. Track that backlog alongside read-transaction durations. PASSIVE success does not mean completion, and physical WAL size alone is misleading because SQLite reuses allocated space. [Checkpoint results](https://sqlite.org/pragma.html#pragma_wal_checkpoint).
- **Release snapshots promptly:** finish/reset/finalize statements and end explicit transactions with COMMIT or ROLLBACK. Closing a cursor alone does not end an explicit transaction. [Transaction lifetime](https://sqlite.org/lang_transaction.html#implicit_versus_explicit_transactions).
- **Arrange reader gaps:** let existing reads finish, then attempt RESTART—or TRUNCATE when shrinking the file is needed. These modes can block writers and return busy after partial progress. [Checkpoint API](https://sqlite.org/c3ref/wal_checkpoint_v2.html).

Saved the [focused follow-up](<live>/codex/sqlite-wal/checkpoint-starvation.md), with 12 new independently checked findings. The report is now revision **31**; your earlier approval remains recorded for revision 23 and does not cover this revision.