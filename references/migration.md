# Continue older Tanzu Brand research

New projects use `.harness-research/`. An existing `.tanzu-research/` record is
detected, but never silently forked or overwritten. Copy it explicitly:

```sh
node scripts/harness-research.mjs migrate --project /absolute/project
node scripts/harness-research.mjs status --project /absolute/project
```

Migration preserves question/run IDs, evidence, scope, input hashes and history.
The old directory stays intact. Changed sources remain stale; migration does not
certify them. It refuses unowned records, busy locks, symlinks and an existing
new research record. Do not remove a lock belonging to an active save.

The standalone installer creates `harness-research` discovery links. It also
repoints existing research/agent links that match the former Brand installer's
exact owned paths to the retained upstream bundle. Independent skills, agents
and custom configurations remain unchanged. New users get one skill by default.
Run it before upgrading Brand if those old aliases are still in use. Inspect the
installer's `--dry-run`; no real user installation is changed by extraction tests.
