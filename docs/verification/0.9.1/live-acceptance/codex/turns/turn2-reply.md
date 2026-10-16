All five cited facts remain confirmed, and current SQLite documentation still supports them. None are stale, superseded, or unsupported. [WAL documentation](https://sqlite.org/wal.html), [durability settings](https://sqlite.org/pragma.html#pragma_synchronous).

One qualification for line 6: `FULL` durability assumes the OS and storage correctly honor sync requests. I recommend stating that condition.

Saved the [citation-by-citation check](<live>/codex/sqlite-wal/deck/citation-check.md). The draft is unchanged.