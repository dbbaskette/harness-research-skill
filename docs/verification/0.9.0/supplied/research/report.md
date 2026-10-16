# Compare AsterDB and BirchDB for a small internal application: deployment, concurrent writes and backup retention; use only the two supplied synthetic references.

Run: 15fd7b055f744d61b0eb14ae; output revision: 38.
Status: complete-with-gaps. Depth: light.
Runtime: 0.9.0; guidance: 0.9.0 (local runtime guidance).

Compare AsterDB and BirchDB for a small internal application using only the two supplied synthetic notes, revised 2026-10-15. Cover deployment, concurrent writes and backup retention. Do not infer performance, production suitability or retention periods from backup mechanics.

Facts are checked for source support, not certified as true or live-current. Prose has citation/number validation but no independent semantic writing review at light depth.

## Coverage

- Deployment: 2 current checked facts; 2/2 questions answered with current evidence.
- Concurrent writes: 2 current checked facts; 2/2 questions answered with current evidence.
- Backup retention: 0 current checked facts; 0/2 questions answered with current evidence.

## Deployment

### How is AsterDB deployed?

AsterDB uses an in-process deployment with one database file. [1]

AsterDB runs inside the application process and stores its database in one file. [1]

Facts behind this answer:

- fact-74bc22e1b40d49469dc45e487229cb93 [confirmed]: AsterDB runs inside the application process and stores its database in one file. [1]; as of 2026-10-15; one publisher.
  > AsterDB runs inside the application process and stores its database in one file. [1], Body, first paragraph

### How is BirchDB deployed?

BirchDB uses a separate server accessed over a network. [2]

BirchDB runs as a separate server that applications connect to over a network. [2]

Facts behind this answer:

- fact-a94b2941faff4b339722a1d491fa7a64 [confirmed]: BirchDB runs as a separate server that applications connect to over a network. [2]; as of 2026-10-15; one publisher.
  > BirchDB runs as a separate server that applications connect to over a network. [2], Body, first paragraph


## Concurrent writes

### What concurrent-write behavior is specified for AsterDB?

AsterDB permits one writer transaction per database at a time. [1]

AsterDB permits one writer transaction at a time for each database. [1]

Facts behind this answer:

- fact-f6758e02506f41a483d4c3c368b6ef1b [confirmed]: AsterDB permits one writer transaction at a time for each database. [1]; as of 2026-10-15; one publisher.
  > AsterDB permits one writer transaction at a time for each database. [1], Body, second paragraph

### What concurrent-write behavior is specified for BirchDB?

BirchDB allows concurrent writers to different rows. [2]

BirchDB allows concurrent writers to different rows, with row locks controlling conflicts. [2]

Facts behind this answer:

- fact-6cb09e5bdc234a48b8ddd423998b90cb [confirmed]: BirchDB allows concurrent writers to different rows, with row locks controlling conflicts. [2]; as of 2026-10-15; one publisher.
  > BirchDB allows concurrent writers to different rows, with row locks controlling conflicts. [2], Body, second paragraph


## Backup retention

### What backup retention period is specified for AsterDB?

Not established by the sources checked in this run.

Gap (gap-2296fe980c1d4931a1b7b6f7e98ba391, assessed): The complete supplied AsterDB document explicitly says that it does not specify a backup retention period. Its backup operation requirement supplies no duration. [1]

### What backup retention period is specified for BirchDB?

Not established by the sources checked in this run.

Gap (gap-72a317fb16b14db3bbc8dbf51927ac6d, assessed): The complete supplied BirchDB document explicitly says that it does not specify a backup retention period. Its backup operation requirement supplies no duration. [2]


## Conflicts and history


## Sources

1. [AsterDB vendor notes (synthetic test document)](../sources/asterdb.md); AsterDB project; primary; given; saved 2026-10-16T04:09:01.500Z; source date 2026-10-15.
2. [BirchDB vendor notes (synthetic test document)](../sources/birchdb.md); BirchDB project; primary; given; saved 2026-10-16T04:09:16.144Z; source date 2026-10-15.

## Rejected facts and failed tasks

