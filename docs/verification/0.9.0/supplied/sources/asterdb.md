# AsterDB vendor notes (synthetic test document)

Publisher: AsterDB project. Revision: 2026-10-15.

AsterDB runs inside the application process and stores its database in one file.
AsterDB permits one writer transaction at a time for each database.
AsterDB backups must use its snapshot operation while the application is running.
The supplied AsterDB notes do not specify a backup retention period.
