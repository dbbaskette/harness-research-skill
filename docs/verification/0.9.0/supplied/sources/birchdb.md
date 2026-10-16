# BirchDB vendor notes (synthetic test document)

Publisher: BirchDB project. Revision: 2026-10-15.

BirchDB runs as a separate server that applications connect to over a network.
BirchDB allows concurrent writers to different rows, with row locks controlling conflicts.
BirchDB backups require a separately operated backup job.
The supplied BirchDB notes do not specify a backup retention period.
