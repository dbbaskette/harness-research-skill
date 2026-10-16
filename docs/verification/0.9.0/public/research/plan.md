# Research plan

Compare PostgreSQL and SQLite for a small internal application using public primary documentation; deployment architecture and write concurrency only; four questions; light depth. No performance benchmark, cost comparison, or specific workload sizing.

## PostgreSQL
- What deployment architecture does PostgreSQL require?
- How does PostgreSQL coordinate concurrent reads and writes, including writes to the same row?

## SQLite
- What deployment architecture does SQLite use?
- What write concurrency does SQLite permit, and how does WAL affect readers?
