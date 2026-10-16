# Should we turn on WAL? (draft slides)

- SQLite WAL appends changes to a separate log and commits by appending a commit record, without requiring the main database file to be updated at commit. [R:fact-0b54369f718a442d8c38d5c9f4086ee3]
- WAL queries can still return SQLITE_BUSY during exclusive locking, final-connection cleanup, or crash recovery. [R:fact-4cc5cc9ccad34367827bfb0a4febbdd2]
- A WAL checkpoint copies committed transactions from the WAL file back into the main database file. [R:fact-ccbbb694ead84c40bb9d5463fe764b0b]
- WAL with synchronous=FULL adds a WAL sync after each transaction commit and provides ACID durability across power loss. [R:fact-c497e597c461487d982eddb3271e6513]
- WAL requires all database processes to run on the same host and does not work over a network filesystem. [R:fact-f7730d9001c4456fbbd042f9830c5dd1]
