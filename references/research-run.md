# Research through the skill

The person gives a topic, audience and starting sources. You conduct the research
with the harness's tools; the helper is your ledger and task checklist. Do not ask
the person to prepare JSON, drive a command loop or install a service. Respect
settled scope, existing authorization and the requested completion boundary.

## Start or resume

Commands use the installed runtime returned by the bootstrap. An explicitly
supplied development runtime is valid for isolated testing; disclose its local
guidance/version instead of claiming a public refresh.
For installed use, pass `--guidance-task TASK` from the bootstrap's saved task;
the helper verifies that pin offline and records its exact guidance identity.
Omit it only for an explicitly supplied local runtime/guidance, which is reported
as local runtime guidance. Resume the saved bootstrap task before continuing a run.

```sh
node scripts/harness-research.mjs research start --project DIR --topic "TOPIC" \
  --source sources/selected-reference.pdf --depth light
```

Repeat `--source` for more selected references or omit it when none were supplied.
`--sources FILE` accepts one path or link per line (optionally a tab and a title),
or a JSON array of paths/URLs or `{origin,file,title}` entries.
Copy selected local originals into the project first. `--allow-web` authorizes
additional public sources; otherwise use selected references only. Selected links
may be read as selected sources. `--about FILE` provides audience/context.
`--claims FILE` is an array of `{file,quote,start}` target objects; offsets count
Unicode characters. Targets are not automatically evidence references and cannot
establish their own assertions.

**Plan approval.** For a broad topic ("a report on LLMs"), or when the person asks
to see the plan, start with `--plan-only`, show `research/plan.md` (scope, outline,
any plan notes) and continue on their word with
`research continue --project DIR --run RUN [--file PLAN]`. A narrow or comparison
request goes straight through. Honor a caller's own gate instead of adding one.

`start` creates durable state and a partial report, not an agent. Keep its run ID.
Resume with `research status --project DIR` and take tasks from that same run.

## Run it as a coordinator

You are the coordinator: the session the person talks to. Work is fastest when
independent tasks run at the same time, so dispatch ready tasks together up to
your host's active-agent limit. Leave excess tasks ready until a slot opens.
Commands answer compactly; add `--verbose` only
to debug.

1. **Identities.** Each agent invocation needs its own worker ID, fixed for its
   life. Codex gives each agent a path such as `/root/worker`; use it. Claude Code
   does not expose one, so mint `cc-` plus eight random hex characters for yourself
   and for every subagent you start, and pass that ID in the subagent's prompt.
   Add `--harness claude-code` or `--harness codex` when taking a task. Changing a
   role name in the same context is not another agent.
2. **Do the small tasks yourself.** Source tasks for selected references, the plan
   and the cross-check are quick: take and submit them under your own ID. Never
   take a research task yourself if you may need to check it; you then stay
   eligible to check, which avoids starting extra agents.
3. **Fan out.** Call `research next --worker CHILD-ID --harness H` for a fresh
   child ID until it returns no task. Each task is written in full to the
   `file` the answer names. Start one subagent per task within available host capacity, each
   with a prompt like: *"You are worker CHILD-ID. Read FILE and follow its brief;
   read the guidance sections its `guide` names, and use your own search, fetch
   and reading tools. Write the result JSON to
   research/work/TASK.json and run `research submit` with this run, task, worker,
   lease and attempt. If it is refused, fix the reported errors and submit again
   with the same lease. Reply with the final accepted/errors line only."*
4. **Keep the pipeline full.** When subagents finish, call `next` again. Checks for
   a section appear as soon as its research is accepted, so start them while other
   sections are still being researched. A checker must be a fresh child that
   researched none of its questions; where both Claude Code and Codex are
   available, prefer the other harness as checker. Writers (one per section) start
   as soon as the cross-check is done and that section has no gap-round question
   pending.
5. **When `next` returns no task**, read `waiting_for`: `leased workers` means wait
   for running subagents; `a separate eligible invocation` means start a fresh
   checker or reviewer; `plan approval` means the plan-only hold; `reassess` means a
   source changed (below). It never means the research is finished; check `status`.

If the host cannot start a separate invocation at all, independent checking is
unavailable: run `research block --project DIR --run RUN --reason "Independent
checking is unavailable"`, keep the partial report and explain the block. Renaming
yourself or claiming an unavailable model ran is invalid. Delegate only with
host/user authorization; separate invocations may also run one after another.

## Leases, refusals and retries

Every task write carries the lease tuple `--run --task --worker --lease
--attempt`. File arguments resolve relative to `--project`; absolute paths inside
the project are accepted too. A lease lasts 30 minutes; renew longer work with
`research heartbeat`. A lapsed lease can still submit while nobody else has taken
the task. A refused submission returns actionable `errors` and keeps the lease:
correct the cause and submit again. Ten refusals in one attempt end it. A worker
crash is submitted as `{"error":{"message":"Concrete failure"}}` and ends the
attempt. After three attempts a task is `failed`, never an invented `unavailable`
finding; other work continues and only what depends on it waits. Address the cause,
then reopen it with `research retry --project DIR --run RUN --task TASK`.
`research peek` shows the next task without taking it; `research release` gives a
task back without a failed attempt, but a released research task still records
your participation, so you cannot check that question later.

The helper serialises saves and waits up to 30 seconds for a busy store, so many
subagents may call it at once. "Busy after waiting" means retry the same command.

## Worker tasks

Each task names the file and sections its worker needs in `guide`, so a worker
reads only its own contract: [source, plan and research](task-research.md),
[independent checking](task-check.md), or [cross-check, writing and
review](task-write.md). Read the matching file yourself before a source, plan or
cross-check task.

## Changed sources

When a selected original or a pinned copy changes, `status` becomes `stale` and
names only the facts and questions resting on it; everything else stays current.
Run `research reassess --project DIR --run RUN`: affected facts are kept as stale
history, their sources are read again, only those questions are researched and
checked again, and answers citing them are rewritten. A changed claim target
cannot be reassessed because its exact claim no longer matches; start a new run
with updated `--claims`.

## Return the saved report

Refresh `research status --project DIR`, open its actual report and verify the
saved run/revision. `complete` and `complete-with-gaps` have finished assessments.
Return `research/report.md` with the coverage by section, a short cited synthesis,
the important gaps, and an offer to go deeper (standard or deep depth) when the
topic deserves it. That saved report is the deliverable: link it, not a report
of your own. The helper checks nothing you write outside `research/`; label any
such summary or note as your own, unchecked, and still return `research/report.md`.
Facts, brief and plan live next to it. `research/output.json`
commits their shared run/revision and hashes; `status` repairs an interrupted
export from durable state. The [facts export schema](facts.schema.json) documents
the machine-readable contract.

`blocked` and `stale` are incomplete: name the cause and link the partial report.
Manual `plan`/`record` runs retain their own references and semantics but cannot
bypass a queued run's checking. To verify cited keys, research chosen questions
again, start from earlier research, approve or refresh, read
[reuse and verification](reuse.md).
