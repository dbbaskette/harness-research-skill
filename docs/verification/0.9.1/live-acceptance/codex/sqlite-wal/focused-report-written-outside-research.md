# SQLite WAL: an application team's enablement decision

Researched 2026-10-16; checkpoint question reassessed and web sources refreshed on the same date. Scope: ordinary SQLite connections, public SQLite primary sources; no application-specific benchmark.

**Decision frame — inference from the documentation:** WAL is a strong candidate for a single-host application that benefits from overlapping reads and writes and can manage checkpointing and sidecar files. It still permits only one writer at a time. [Write-Ahead Logging](https://sqlite.org/wal.html)

Use `synchronous=FULL` when committed writes must survive power loss, subject to reliable storage flushes. Choose `NORMAL` only when losing recent commits after power or OS failure is acceptable. [PRAGMA Statements](https://sqlite.org/pragma.html) [Atomic Commit In SQLite](https://sqlite.org/atomiccommit.html)

## Readers, writers, and commits

A writer appends changed pages to a separate WAL file and commits by appending a commit record; the main database file need not be updated at commit. Each read transaction fixes an end mark at the latest valid commit and keeps that snapshot until the transaction ends. For each page, the reader takes the latest applicable WAL version before its end mark, or reads the main database when no such version exists. [Write-Ahead Logging](https://sqlite.org/wal.html)

This permits concurrent reading and writing, but only one writer can operate at a time. [Write-Ahead Logging](https://sqlite.org/wal.html)

## Contention still needs handling

SQLITE_BUSY remains possible during exclusive locking, final-connection cleanup, or recovery after a crash. If another connection has committed since a read snapshot began, attempting to upgrade that outdated snapshot to a writer can fail with SQLITE_BUSY_SNAPSHOT; release the snapshot and restart the transaction. [Write-Ahead Logging](https://sqlite.org/wal.html) [Isolation In SQLite](https://sqlite.org/isolation.html)

For a transaction known to read and then write, successful BEGIN IMMEDIATE acquires the write transaction first and blocks other writers, avoiding the later stale-snapshot upgrade. BEGIN IMMEDIATE can itself return SQLITE_BUSY when another writer is already active. [Isolation In SQLite](https://sqlite.org/isolation.html) [Transaction](https://sqlite.org/lang_transaction.html)

## Checkpoints and WAL growth

A checkpoint copies committed WAL content back into the database. SQLite normally starts automatic PASSIVE checkpoints when commits leave at least 1000 WAL pages; the threshold is configurable. A long-lived read snapshot can limit backfill at its fixed end mark, while writers continue adding changes. Long or overlapping reads can prevent reset and allow WAL growth. [WAL documentation](https://sqlite.org/wal.html#concurrency).

For detection, `PRAGMA main.wal_checkpoint(PASSIVE)` returns a busy indicator, WAL-page count, and checkpointed-page count. With valid nonnegative counts, their difference is remaining backfill. PASSIVE success alone does not prove completion; equal totals do not guarantee readiness to reset the WAL. Physical file size alone is also insufficient because SQLite normally recycles the allocation. [PRAGMA results](https://sqlite.org/pragma.html#pragma_wal_checkpoint), [checkpoint API](https://sqlite.org/c3ref/wal_checkpoint_v2.html).

SQLite recommends reader gaps for checkpointing. Finish statements and explicitly end explicit transactions; RESTART additionally waits for WAL readers to finish, and TRUNCATE additionally shrinks the file on success. Manual modes can return busy after partial progress. See the [focused starvation follow-up](checkpoint-starvation.md) for an application monitoring and avoidance recipe. [Reader gaps](https://sqlite.org/wal.html#avoiding_excessively_large_wal_files), [transaction lifetime](https://sqlite.org/lang_transaction.html#implicit_versus_explicit_transactions).

## Durability choices

With synchronous=FULL, SQLite adds a WAL sync for every transaction commit, providing durability across power loss. With synchronous=NORMAL, the database remains consistent and committed transactions survive an application crash, but a power loss or operating-system crash may roll back committed transactions. These durability properties depend on the operating system and storage honoring sync requests; broken flush behavior can undermine protection against power loss. [PRAGMA Statements](https://sqlite.org/pragma.html) [Atomic Commit In SQLite](https://sqlite.org/atomiccommit.html)

## Deployment and file-handling limits

All processes accessing the database must run on the same host; WAL does not work over a network filesystem. Transactions spanning ATTACHed databases are atomic within each database, but not across the set; changing page size requires leaving WAL for a rollback journal mode. [Write-Ahead Logging](https://sqlite.org/wal.html)

The -wal file is persistent database state: separating it from the database during a copy or move can lose committed transactions or corrupt the database. The -shm file supplies shared-memory coordination and contains no persistent database content. [Write-Ahead Logging](https://sqlite.org/wal.html) [Temporary Files Used By SQLite](https://sqlite.org/tempfiles.html)

Since SQLite 3.22.0, read-only WAL access is possible when readable sidecars already exist, the directory permits their creation, or the connection uses immutable. Immutable skips locking and change detection; using it for a database that changes can cause incorrect results or SQLITE_CORRUPT errors. [Write-Ahead Logging](https://sqlite.org/wal.html) [Uniform Resource Identifiers in SQLite](https://sqlite.org/uri.html)

The documented WAL-reset corruption bug concerns concurrent writing or checkpointing connections and is fixed in SQLite 3.51.3 and later, with backports 3.44.6 and 3.50.7. [Write-Ahead Logging](https://sqlite.org/wal.html)

## Enabling WAL and assessing fit

Enable with PRAGMA journal_mode=WAL and check that the returned mode is wal; an unsuccessful conversion returns the previous mode. The WAL choice persists across closing and reopening and applies to all connections to the database file. Journal mode cannot change inside an active transaction, and in-memory databases support only MEMORY or OFF modes. [Write-Ahead Logging](https://sqlite.org/wal.html) [PRAGMA Statements](https://sqlite.org/pragma.html)

The synchronous setting is local to the connection rather than saved in the database; reopening restores the default. Automatic checkpointing is also configured per connection, with new connections normally defaulting to 1000 pages unless the compile-time default differs. [SQLite source: src/pragma.c](https://sqlite.org/src/raw/src/pragma.c?ci=trunk) [Configure an auto-checkpoint](https://sqlite.org/c3ref/wal_autocheckpoint.html)

WAL can be slightly slower for workloads dominated by reads with infrequent writes, and introduces checkpoint work and sidecar files. [Write-Ahead Logging](https://sqlite.org/wal.html)

## Coverage and limits

All requested areas are covered: reader/writer interaction, checkpoints, durability, and deployment limitations. Six questions and 44 findings were checked against original sources by separate checker invocations; no evidence gaps or conflicts remain within this focused scope. Performance and platform durability still require validation in the team's environment. Light depth includes citation and number validation, without independent prose review.

[Source refresh results](source-refresh.md) · [Detailed report and supporting passages](research/report.md) · [Evidence ledger](research/facts.json) · [Run manifest](research/output.json) · [Local guidance provenance](README.md)

Evidence basis: run `4448974aa66e4d969fb9d588`, output revision 36 (complete; web sources refreshed). The decision frame and application monitoring suggestions are editorial inferences from checked findings. The earlier Trial Reviewer approval applies to revision 23 and is no longer current for the revised report.
