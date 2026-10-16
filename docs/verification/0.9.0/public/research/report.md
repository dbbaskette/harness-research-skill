# Compare PostgreSQL and SQLite for a small internal app, narrowly covering deployment and write concurrency. Exactly four focused questions, two per database; public primary documentation only; light depth; no extra gap round unless necessary.

Run: 4da5c841fb274fbcb5781e2c; output revision: 28.
Status: complete-with-gaps. Depth: light.
Runtime: 0.9.0; guidance: 0.9.0 (local runtime guidance).

Compare PostgreSQL and SQLite for a small internal application using public primary documentation; deployment architecture and write concurrency only; four questions; light depth. No performance benchmark, cost comparison, or specific workload sizing.

Facts are checked for source support, not certified as true or live-current. Prose has citation/number validation but no independent semantic writing review at light depth.

## Coverage

- PostgreSQL: 3 current checked facts; 2/2 questions answered with current evidence.
- SQLite: 5 current checked facts; 2/2 questions answered with current evidence.

## PostgreSQL

### What deployment architecture does PostgreSQL require?

PostgreSQL uses a client/server deployment model. [1]

Clients and the database server may run on different hosts. [1]

Facts behind this answer:

- fact-91a5c0a22ff840aa87a745a0c75de008 [confirmed]: PostgreSQL uses a client/server deployment model, with clients and the server optionally on different hosts. [1]; as of unknown; one publisher.
  > In database jargon, PostgreSQL uses a client/server model. [1], Architectural Fundamentals, client/server model
  > the client and the server can be on different hosts. [1], Architectural Fundamentals, host placement

### How does PostgreSQL coordinate concurrent reads and writes, including writes to the same row?

PostgreSQL MVCC read/write locks do not conflict, while row locks coordinate competing writers. [2] [3]

Under MVCC, locks acquired for querying data do not conflict with write locks. [2] Row-level locks can block competing writers and lockers on the same row without blocking ordinary data queries. [3]

Facts behind this answer:

- fact-0ee80ddd8ee74f8b954108ed9fd3cae2 [confirmed]: PostgreSQL MVCC query locks do not conflict with write locks. [2]; as of unknown; one publisher.
  > in MVCC locks acquired for querying (reading) data do not conflict with locks acquired for writing data [2], Concurrency Control Introduction, MVCC read/write locks

- fact-80cc052b00ec44a7b04f914b98b0eeb3 [confirmed]: PostgreSQL row-level locks block competing writers and lockers on the same row without blocking ordinary data queries. [3]; as of unknown; one publisher.
  > Row-level locks do not affect data querying; they block only writers and lockers to the same row. [3], Explicit Locking, Row-Level Locks


## SQLite

### What deployment architecture does SQLite use?

SQLite runs its database engine inside the application process. [4]

SQLite has no intermediary server process. [4]

Facts behind this answer:

- fact-469ff01539bb48c7bb52ea39823b2f9c [confirmed]: SQLite has no intermediary server process. [4]; as of unknown; one publisher.
  > There is no intermediary server process. [4], SQLite Is Serverless, first paragraph

- fact-67565f7bc4e64b29a3cf4884eb160102 [confirmed]: SQLite runs its database engine inside the application process. [4]; as of unknown; one publisher.
  > The database engine runs within the same process, thread, and address space as the application. [4], SQLite Is Serverless, Classic Serverless definition

### What write concurrency does SQLite permit, and how does WAL affect readers?

SQLite allows a single writer per database, including when WAL permits concurrent reading and writing. [5]

WAL mode allows readers to operate concurrently with the writer, while the single-writer constraint remains. [5]

All processes accessing a WAL database must be on the same host; WAL does not work over a network filesystem. [6]

Facts behind this answer:

- fact-05c3180a1cab418d859780aa17d39532 [confirmed]: SQLite permits only a single writer at a time per database. [5]; as of unknown; one publisher.
  > There can only be a single writer at a time to an SQLite database. [5], Isolation Between Database Connections

- fact-56144cd0878b41b7ae203d9ffd23d635 [confirmed]: SQLite WAL mode allows simultaneous readers and writers. [5]; as of unknown; one publisher.
  > WAL mode permits simultaneous readers and writers. [5], Isolation And Concurrency

- fact-b38d5613137c4af8a1e43c21f142ca75 [confirmed]: SQLite WAL requires all processes accessing a database to share a host and does not work over a network filesystem. [6]; as of unknown; one publisher.
  > All processes using a database must be on the same host computer; WAL does not work over a network filesystem. [6], Write-Ahead Logging, Overview disadvantages


## Conflicts and history

- fact-bbe4964b399740b2a81375e8988d629a → fact-67565f7bc4e64b29a3cf4884eb160102 (narrowed): Keep the fact atomic and confined to its attached quote about engine location; the independently supported absence of an intermediary server is covered by the separate deployment fact.

## Sources

1. [PostgreSQL Architectural Fundamentals (short excerpts)](https://www.postgresql.org/docs/current/tutorial-arch.html); PostgreSQL Global Development Group; primary; found; saved 2026-10-16T04:15:29.530Z; source date unknown.
   Coverage gap: Short verbatim excerpts only, 22 words; not a full extraction. Public original inspected using native web tool on 2026-10-16; current page identifies PostgreSQL 18. Original complete-document hash unavailable.
2. [PostgreSQL Concurrency Control Introduction (short excerpts)](https://www.postgresql.org/docs/current/mvcc-intro.html); PostgreSQL Global Development Group; primary; found; saved 2026-10-16T04:16:02.231Z; source date unknown.
   Coverage gap: Short verbatim excerpts only; not a full extraction. Public original and surrounding context inspected with native web tool on 2026-10-16. Complete-document original hash unavailable.
3. [PostgreSQL Explicit Locking (short excerpts)](https://www.postgresql.org/docs/current/explicit-locking.html); PostgreSQL Global Development Group; primary; found; saved 2026-10-16T04:16:02.271Z; source date unknown.
   Coverage gap: Short verbatim excerpts only; not a full extraction. Public original and surrounding context inspected with native web tool on 2026-10-16. Complete-document original hash unavailable.
4. [SQLite Is Serverless (short excerpts)](https://www.sqlite.org/serverless.html); SQLite Project; primary; found; saved 2026-10-16T04:16:02.380Z; source date unknown.
   Coverage gap: Short verbatim excerpts only; not a full extraction. Public original and surrounding context inspected with native web tool on 2026-10-16. Complete-document original hash unavailable.
5. [Isolation In SQLite (short excerpts)](https://www.sqlite.org/isolation.html); SQLite Project; primary; found; saved 2026-10-16T04:16:02.485Z; source date 2022-04-18.
   Coverage gap: Short verbatim excerpts only; not a full extraction. Public original and surrounding context inspected with native web tool on 2026-10-16. Complete-document original hash unavailable.
6. [Write-Ahead Logging (short excerpts)](https://www.sqlite.org/wal.html); SQLite Project; primary; found; saved 2026-10-16T04:16:02.519Z; source date unknown.
   Coverage gap: Short verbatim excerpts only; not a full extraction. Public original and surrounding context inspected with native web tool on 2026-10-16. Complete-document original hash unavailable.

## Rejected facts and failed tasks

