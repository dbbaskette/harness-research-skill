# Should we turn on WAL? (draft slides)

- Each SQLite WAL-mode read transaction fixes an "end mark" at the last valid commit record when it starts, so it sees the database as of a single point in time. [R:fact-f4fe5c7a2acd4f9e9cfbcaff1b8172dc]
- SQLite WAL mode allows only one writer at a time, because there is only one WAL file, although that writer runs alongside readers. [R:fact-008171a4fd584daeaa0c8535266e4fd1]
- SQLite's FULL checkpoint waits for no writer and all readers on the latest snapshot, then checkpoints every frame; RESTART also waits until readers leave the log, and TRUNCATE also truncates it to zero bytes. [R:fact-d5281e03204e40a093032c6a7b85a332]
- In SQLite WAL mode, synchronous=FULL syncs the WAL after every transaction commit, whereas synchronous=NORMAL omits that per-commit sync. [R:fact-887018efe20e4d699e6e0f4163ded954]
- SQLite's WAL documentation says all processes using a WAL database must be on the same host, so WAL does not work over a network filesystem, because processes must share memory. [R:fact-a9f09603c2ac48f28e39b81f0d1ed098]
