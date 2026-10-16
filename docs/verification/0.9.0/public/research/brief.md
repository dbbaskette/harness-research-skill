# Compare PostgreSQL and SQLite for a small internal app, narrowly covering deployment and write concurrency. Exactly four focused questions, two per database; public primary documentation only; light depth; no extra gap round unless necessary.
Run: 4da5c841fb274fbcb5781e2c; output revision: 28; status: complete-with-gaps.

fact-91a5c0a22ff840aa87a745a0c75de008: PostgreSQL uses a client/server deployment model, with clients and the server optionally on different hosts.
fact-0ee80ddd8ee74f8b954108ed9fd3cae2: PostgreSQL MVCC query locks do not conflict with write locks.
fact-80cc052b00ec44a7b04f914b98b0eeb3: PostgreSQL row-level locks block competing writers and lockers on the same row without blocking ordinary data queries.
fact-469ff01539bb48c7bb52ea39823b2f9c: SQLite has no intermediary server process.
fact-05c3180a1cab418d859780aa17d39532: SQLite permits only a single writer at a time per database.
fact-56144cd0878b41b7ae203d9ffd23d635: SQLite WAL mode allows simultaneous readers and writers.
fact-b38d5613137c4af8a1e43c21f142ca75: SQLite WAL requires all processes accessing a database to share a host and does not work over a network filesystem.
fact-67565f7bc4e64b29a3cf4884eb160102: SQLite runs its database engine inside the application process.
