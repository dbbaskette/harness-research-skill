# Requests given to the Claude Code coordinator (verbatim)

1. Research how SQLite's write-ahead logging (WAL) mode works for an application team deciding whether to enable it: how readers and writers interact, checkpoints, durability, and limitations. Use public sources, sqlite.org documentation first. Keep it focused. Save a cited report.
2. I've drafted slides that cite this research in deck/draft.md in that project. Before I publish them, check that every fact they cite still holds, and tell me about any that don't.
3. I've read the saved research report and I approve it as it stands. Record my approval under the name "Trial Reviewer".
4. Please research the checkpoint question again. I specifically want to know what happens when a read transaction stays open for a long time, and how an application can detect or avoid checkpoint starvation.
5. We won't ship for a few months. Refresh this research against the current versions of its web sources.
6. I'm starting an operations runbook in a new project, <live>/claude/wal-runbook. Find my earlier SQLite research somewhere under <live>/claude and start from it, adding how to monitor and tune WAL checkpoints in production (wal_autocheckpoint, checkpoint modes, journal_size_limit). Save the cited report there.
