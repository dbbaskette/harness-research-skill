# harness-research: one research component, three ways in

Date: 2026-10-15. Status: draft 4, revised after the design review; the owner confirmed the aim and wants research kept with the work. Builds on
[the run design](2026-10-15-research-with-agents-design.md).

## What this is for

The longer-term aim, as confirmed by the owner:

- **Content made with Claude Code or Codex, in an organisation's brand.** Tanzu Brand and
  Harness Slides make decks today. The studios (Training, Presentation, Blog, and Marketing
  next) turn a topic into finished content with a person approving each step, and will move
  into one repository.
- **Every piece of content rests on research that can be checked.** A slide, a training
  module or a blog paragraph cites facts; each fact cites a quoted source; and a citation can
  be checked again later, when a source changes or before publishing.
- **Research is done once per piece of work and reused** by everything downstream: the outline,
  the slides and speaker notes, the learner guide, the blog draft, the fact-check.
- **Research is kept with the work,** in the project's folder, locally or in a repository, and
  any later piece of work can start from it instead of researching from scratch.
- **One implementation.** A person asking for research directly, Brand, and every studio use
  the same component, not three copies of it.
- **The agents do the work at full strength,** and the code keeps them honest.

harness-research should be that component.

It remains a skill: the person's interface is a plain-language request. The skill's
instructions guide the harness through the research; the helper is supporting bookkeeping
and validation. A successful standalone acceptance run must demonstrate this skill flow,
not merely a developer driving commands by hand.

## Principles

1. **The harness researches; the helper keeps the books.** Claude Code or Codex plans,
   searches, reads and writes. The helper runs the queue, checks every quote, number and
   citation, keeps the record and assembles the output.
2. **One contract for every caller.** The same `research/` folder, the same `facts.json`, the
   same fact keys, whoever asked for the research.
3. **Callers own their rules; research owns how research is done.** Who may allow web
   research, when a person approves, how a topic is worded and what the facts feed belong to
   the caller. Planning, sourcing, checking and writing the report belong to harness-research.
4. **Citations last.** Fact keys are stable, and any caller can ask whether a cited fact still
   holds. Narrowing and merging retain resolvable history instead of silently changing a
   cited assertion.
5. **Light by default.** More than today's skill on every run; `standard` and `deep` on request.
6. **Nothing requires a studio.** A person with Claude Code or Codex and the skill installed
   gets the whole thing.

## Three ways in

| | Standalone | Inside Tanzu Brand | Inside a studio |
| --- | --- | --- | --- |
| **Who starts it** | A person: "research Redis vs Valkey for our architects, here are two PDFs" | Brand's intake, when the person chooses research for new content | The studio, at its research step |
| **What goes in** | Topic, selected references, separate claim targets, depth and scope | The deck's topic, audience, selected references, claim targets and source mode | The item's topic and audience, selected references, claim targets and the studio's web policy |
| **Who approves the plan** | Offered for broad topics; otherwise the run goes straight through | Shown with Brand's own approval step | The studio's plan gate, using `--plan-only` |
| **Who does the work** | The person's own session, with its subagents | The same session Brand is running in | A harness session the studio starts, with one instruction |
| **Where the output lives** | `research/` in the project folder | `research/` in the deck's content project | `research/` in the item's folder |
| **What reads it** | The person | Harness Slides' draft and build | The studio's next steps |

### Standalone

- **Ask:** `/harness-research` or `$harness-research` with a topic and any sources, or "research
  this" in plain words.
- **Run:** the skill's guidance runs `research start`, offers the plan for approval when the
  topic is broad, then works the queue with actual invocation identities. Separate
  researcher/checker invocations may run in parallel or sequentially. Without independent
  checking, the run is blocked; changing the worker name is not a substitute.
- **Hand back:** the report's path, the coverage by section, the main gaps, and an offer to go
  deeper. `complete` and `complete-with-gaps` both have finished assessments; `blocked` has a
  saved partial report and an explicit execution problem. Open the actual report and check
  its output revision before handing it back. No conclusion beyond what the report says.
- **Later:** "continue the research" resumes; "research these two questions again" uses
  `--again`; "use this research for a deck" hands the folder to Brand or a studio.

### Inside Tanzu Brand, today

What Brand already does stays: it offers research for new substantive content, honours the
person's choice, and keeps identity and the deliverable. What changes:

- **One handoff instead of a second research procedure.** Brand hands the topic, audience,
  source mode, selected references, separate claim targets and `light` depth to Research's
  guidance. `research start` creates the queue; the harness must then work it through that
  guidance. The CLI does not independently fetch, research or start agents. Brand waits for
  the explicit terminal status and verified report before using the findings.
- **The plan is shown with the deck.** For a broad topic, Brand shows the research plan in its
  own approval step, before research runs.
- **The deck cites facts.** The Slides draft (`outline.json`) lists `research/report.md` in its
  `material`, and each content slide's `sources` lists the fact keys it rests on. Speaker notes
  name the sources behind the claim. Slides' `outline check` warns when a content slide in a
  researched deck cites no fact.
- **Before delivery,** Brand runs `research verify` on the deck's cited keys and reports any
  fact that has since been narrowed, rejected, superseded or gone stale. It does not treat a
  replacement statement as confirmation of the deck's old assertion. Whether to proceed
  with an incomplete research report remains an explicit caller/user decision.
- **The pin:** Brand pins the harness-research release that has these commands, as it pins
  Slides.

### Inside the studios

The studios keep what is theirs and hand over what is not:

| The studio keeps | harness-research takes over |
| --- | --- |
| Who may allow web research | Planning the questions |
| Its plan gate and research gate pages | Reading, fetching and saving sources |
| How the topic and `--about` text are written for its kind of item | Researching, checking and cross-checking |
| Which of the item's documents are given as sources | Writing the questions and answers |
| What the facts feed, and its own citation rules | The record, staleness, keys and the report |

- **Starting research** is one instruction to a harness session, started the way the studio
  already starts its workers. `--plan-only` serves the plan gate; `--again ID,...` serves
  "research this again" at the research gate.
- **Feeding the next steps:** `brief.md` goes to the studio's workers as context; `facts.json`
  is what its checks read.
- **Citations by fact key:**
  - **Presentation:** slides and notes cite keys; the research gate shows each question's
    one-line answer and its facts.
  - **Training:** `[R:key]` markers in the blueprint and guide are checked against
    `facts.json`. Key points must cite confirmed facts; a misconception may cite a conflict or
    a contradicted claim.
  - **Blog:** draft claims cite keys. A fact-check is a run whose questions are the draft's
    claims, as the record already supports.
  - **Marketing:** the same, from its first release.
- **The shared `studio_research` component** shrinks to: finding and pinning
  harness-research, starting the harness with the research instruction, mapping the gates to
  `--plan-only` and `--again`, reading `facts.json`, and running `research verify` before an
  item is published. Its tools and its question loop are not needed.

## The contract every caller can rely on

- **The folder:**

  | Path | Holds |
  | --- | --- |
  | `research/plan.json`, `plan.md` | The scope, outline and questions |
  | `research/report.md` | The questions and answers, coverage, gaps, sources, facts |
  | `research/facts.json` | The same, including status, aliases, revisions and gaps, for programs |
  | `research/brief.md` | Current checked facts with keys, plus gaps, conflicts and status |
  | `research/output.json` | Committed run/output revision and hashes of report, facts and brief |
  | `research/sources/` | Versioned source text and retained original identities/revisions |
  | `.harness-research/` | The record, its history, the queue and each task's folder |

- **`facts.json`** has a `schema` number. Fields are only ever added within a schema; a change
  that removes/renames a field or changes its meaning or required enum handling needs a new
  schema, and the helper can still read the old one. `source_mode` is the source-permission
  enum; `scope` is the topic's narrative coverage. They are never the same JSON property.
- **Output revisions:** report, facts and brief share a run ID and output revision and are
  refreshed after every accepted save, including partial and blocked runs. Consumers check
  the committed revision rather than accepting mixed files after an interrupted export;
  `status` repairs exports from the authoritative record before returning them.
- **Fact keys** are immutable `fact-` identifiers with 32 lowercase hexadecimal characters,
  independent of question IDs and valid in `[R:key]` markers. Reuse preserves them.
  Independent duplicates may start with different keys; merging retains permanent aliases
  to one canonical assertion. Narrowing changes the assertion, so it gets a new key with an
  explicit revision relationship and the original statement/check history retained. An old
  citation must remain resolvable, never silently rebound to a different claim.
- **`research verify --project DIR --keys FILE`** (new) says, for each cited key: still
  confirmed, narrowed (with the current statement), superseded, rejected, gone, or stale
  because its source changed. Results identify the requested/canonical keys, original
  assertion, applicable revision and replacement. Alias resolution alone does not establish
  that an edited claim is supported. It checks the saved evidence/revisions; live source
  currency requires `refresh`, not an assertion that a local hash proves the web is unchanged.
- **Completion:** honest zero-fact questions have checked gap assessments and generated gap
  answers, so they can finish as `complete-with-gaps`. Exhausted retries or an unavailable
  independent checker leave `blocked`, not made-up evidence gaps. Partial exports include
  failed tasks and unchecked candidates, but the current-facts brief excludes those candidates.
- **Claims and sources:** a file supplied to be fact-checked is pinned as a target with exact
  claim locations; it is not automatically an admissible reference. Sources explicitly
  selected as references retain the agreed `primary` standing. Original and extraction
  revisions are pinned separately and changes invalidate dependent checks and answers.
- **Prose checking:** factual headlines have fact references and the same validation as body
  sentences. At `light`, independently checked facts do not imply independently reviewed
  prose; the report discloses the skipped semantic writing review.
- **Every command answers in JSON;** a long run reports progress as JSON lines.
- **Versions:** each release states the runtime its guidance needs. Brand and the studios pin
  a release. 0.9.0 requires an explicit installed-runtime upgrade; older Research helpers
  currently refuse incompatible guidance before reading it. A later executable update may
  add a disclosed fallback to compatible guidance. That cannot retroactively change old
  helpers and is not a silent fallback after a network failure. Existing task pins stay intact.

## Keeping research and using it again

There is no separate library. Research is saved where the work is: the `research/` folder of
the project, which is a local folder or part of a repository. Committing the project commits
its research, and whoever can see the repository can use it.

- **Using it again:** `research start --from PATH` begins a new run from an existing research
  folder, in this project or any other, local or in the repository.
  - Its plan, facts, checks and sources come across with their keys unchanged, so citations
    made against it still work. The new run records where it came from.
  - A new topic or `--about` text adds questions where the earlier plan does not cover it; only
    those are researched. Before carrying checks, validate the schema, source/target hashes,
    claim context, fact revisions, aliases and permissions. Missing originals or changed
    inputs make affected work stale; unchecked candidates do not become confirmed by import.
    With no relevant change and all required assessments present, the imported run can finish
    immediately, preserving any assessed gaps. This does not establish live-web currency.
  - Several folders can be combined with `--from` more than once. The same fact found in two
    keeps its existing key when already shared; independent duplicates keep resolvable aliases
    after an explicit merge. Contextually different assertions are kept separate. Import
    cannot broaden supplied-only permissions or inherit approval of a different output.
- **Finding it:** `research find --in DIR` lists the research folders under a directory, such
  as a repository or a studio's workspace, with each one's topic, date, depth, fact count,
  approval and the age of its sources. `--query` matches topics and questions.
- **Approval:** `research approve --project DIR --by NAME` records who approved the research and
  when against the exact run/output revision and input/source identities. Studios call it at
  their research gate; `find` and the report show it. Changes invalidate that approval; a
  reused run retains the origin's approval as history, not approval of the new content.
- **Refreshing it:** `research refresh --project DIR` has the harness look at every source
  again. A source that changed makes its facts stale; their questions are researched and
  checked again, and everything else is kept. Use it before relying on research that is months
  old.
- **What is in the folder:** the saved text of every source, including documents the person
  gave, because their facts cannot be checked without it. Committing research to a shared
  repository shares that text.

### In the studios

- Each item's research stays in the item's folder in the studio's workspace, and goes wherever
  the item goes.
- The research step offers **Start from existing research,** listing the research folders in
  the workspace that match the item's topic, with their age and approval. Choosing one runs
  `start --from`, then only what the new item needs.
- The research gate records approval with `research approve`.
- Before publishing, `research verify` checks the item's citations, wherever their facts came
  from.

## Roadmap

| Release | What | For |
| --- | --- | --- |
| **0.9.0** | Queue and lease fencing, independent invocations, sources and exact claim targets, immutable fact identity/history, checks, cross-check, gap completion, partial/final output and the light default; acceptance trials in both Claude Code and Codex, including supplied-only work; explicit runtime upgrade | Standalone |
| **0.9.x** | `research verify`; reuse: `start --from`, `find`, `approve`, `refresh`; any compatible-guidance fallback requires an installed executable update and explicit freshness reporting | Standalone; prerequisite for Brand adoption |
| **Brand 0.14** | Research handoff to its guidance; plan shown with the deck; Slides fact-key citation checks available; `verify` before delivery; pin the tested 0.9.x release with all required commands | Tanzu Brand |
| **Slides** | `outline check` warns on uncited content slides in a researched deck | Tanzu Brand |
| **Studios** | Blog first, then Presentation, Training and Marketing move to the run, with Start from existing research and approval at their gates; `studio_research` shrinks | Studios |
| **Later** | Finding research by fact, not only by topic | Everyone |

## Settled

- **The aim** above, including citing fact keys and checking them before publishing.
- **Keeping research:** saved with the work, locally or in the repository, not in a separate
  library. Any later work can start from it with `start --from`.

## Defaults taken unless the owner says otherwise

- **Plan approval standalone:** a `light` run goes straight through; the plan is shown for
  approval first when the topic is broad or the person asks.
- **Uncited slides:** Slides' `outline check` warns, and does not refuse, when a content slide
  in a researched deck cites no fact.
- **Order:** standalone first (0.9.0), then reuse and Brand, then the studios.

Before each caller migrates, test its source permissions, gates, exact claim bindings,
gap/blocked handling and old citation resolution against the chosen release. Existing
orchestration stays until that adapter is verified. In 0.9.0, legacy commands retain their
source-mode `scope`. For a run using the new workflow, `complete-with-gaps` maps to legacy
`complete` plus unresolved IDs, `blocked` to `in-progress` plus a block reason, and `stale`
stays `stale`; no required stage can be bypassed. Legacy-only manual runs keep their current
assessment semantics without claiming independent confirmation.
