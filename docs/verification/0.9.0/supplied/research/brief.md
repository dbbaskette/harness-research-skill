# Compare AsterDB and BirchDB for a small internal application: deployment, concurrent writes and backup retention; use only the two supplied synthetic references.
Run: 15fd7b055f744d61b0eb14ae; output revision: 38; status: complete-with-gaps.

fact-74bc22e1b40d49469dc45e487229cb93: AsterDB runs inside the application process and stores its database in one file.
fact-a94b2941faff4b339722a1d491fa7a64: BirchDB runs as a separate server that applications connect to over a network.
fact-f6758e02506f41a483d4c3c368b6ef1b: AsterDB permits one writer transaction at a time for each database.
fact-6cb09e5bdc234a48b8ddd423998b90cb: BirchDB allows concurrent writers to different rows, with row locks controlling conflicts.
Gap gap-2296fe980c1d4931a1b7b6f7e98ba391: The complete supplied AsterDB document explicitly says that it does not specify a backup retention period. Its backup operation requirement supplies no duration.
Gap gap-72a317fb16b14db3bbc8dbf51927ac6d: The complete supplied BirchDB document explicitly says that it does not specify a backup retention period. Its backup operation requirement supplies no duration.
