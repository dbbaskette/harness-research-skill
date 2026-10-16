# Research plan: SQLite WAL production checkpoint operations: reuse earlier checked WAL research and add...

Focused, public-source research with sqlite.org documentation first. Explain WAL mechanics and reader/writer interaction, checkpoint behavior, durability choices, and deployment/operational limits. Assume ordinary SQLite connections on one host; distinguish documented behavior from workload-dependent performance. No application-specific benchmarks or deployment changes.

## WAL mechanics and concurrency
- How do WAL commits and reader snapshots work, and what concurrency does WAL permit?
- What contention and stale-snapshot failures remain, and how should transaction design account for them?

## Checkpoints and durability
- How do automatic and manual checkpoints work, and how do long-lived readers affect WAL growth and latency?
- What crash and power-loss durability do synchronous FULL and NORMAL provide in WAL mode?

## Deployment limits and enablement decision
- Which deployment, file-handling, read-only, attached-database and compatibility limits matter before enabling WAL, including current relevant version caveats?
- How is WAL enabled and verified, which settings persist or are per connection, and what documented tradeoffs inform the decision?

## Production automatic-checkpoint policy
- Beyond the inherited defaults and mode descriptions, how does wal_autocheckpoint interact with commit-time thresholds, wal hooks, large transactions, and the read/write performance tradeoff when choosing a production checkpoint policy?

## WAL allocation and journal_size_limit
- What exactly does journal_size_limit control in WAL mode: units, default and special values, connection/database scope, readback, when shrinking happens, and why it cannot cap an active WAL or resolve starvation?
