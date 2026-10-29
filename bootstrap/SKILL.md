---
name: harness-research
description: Research topics and compare options using selected documents and permitted public sources, then save a cited synthesis, reusable brief and checked evidence.
---

# Harness Research

This small entrypoint uses current guidance from the public
[harness-research-skill](https://github.com/dbbaskette/harness-research-skill) repository.
Run only the locally installed helpers.

## Start or continue

Resolve this installed directory once. For new work, run:

```sh
node "<installed-skill>/scripts/sync-guidance.mjs" start --project "<content-project>"
```

The compact result returns runtime/guidance versions, the guidance entry, exact
revision, task ID and installed runtime. Briefly tell the user the versions,
revision and freshness on start/resume. Read that entry, then only this task's references.
References are relative to the fetched guidance directory; every executable
command uses the returned **runtime**, never the fetched directory. The AI owns
helper JSON and commands; do not require users to run them or repeat settled intake.

Record the returned task ID and runtime with the work. Continue with
`sync-guidance.mjs resume --project "<content-project>" --task <saved-id>`; do not
start a new task merely to resume, inspect status, or revise the same work.
Existing work retains its instructions and runtime. Explicitly adopting new
guidance starts a new task and requires rechecking affected review conclusions.

New tasks use the newest stable release this runtime supports (main only when the
repository has no release tags). When a newer release needs a newer runtime,
`freshness` is `older-compatible-release`: tell the user its `notice`. A failed
fetch or incompatible runtime is reported, not described as current. An existing task can resume without fetching. For an
agent sandbox DNS/network failure, retry the same command through the host's
available network-permission flow. Report a denied or unavailable retry; do not
switch entrypoints expecting a separate runtime or silently bypass the refresh.
For an explicitly chosen older task, use `cached` with its saved ID and disclose that
choice. Update executable helpers with the trusted shell installer; guidance
refresh never installs or executes repository scripts.

Honor the user’s scope, sources, editing freedom, and completion boundary.
Research output requirements live in the selected guidance. Topic-asset and parallel
collection guidance requires runtime 1.1.0-alpha.1 or newer; refresh cannot upgrade
helpers. For this local preview, use the trusted checkout’s guidance and runtime
together or explicitly pin an approved commit. Automatic refresh selects compatible
stable releases.
