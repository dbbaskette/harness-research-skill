# harness-research: one research component, three ways in

Date: 2026-10-15. Status: draft 3; the owner confirmed the aim and wants research kept with the work. Builds on
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
   holds.
5. **Light by default.** More than today's skill on every run; `standard` and `deep` on request.
6. **Nothing requires a studio.** A person with Claude Code or Codex and the skill installed
   gets the whole thing.

## Three ways in

| | Standalone | Inside Tanzu Brand | Inside a studio |
| --- | --- | --- | --- |
| **Who starts it** | A person: "research Redis vs Valkey for our architects, here are two PDFs" | Brand's intake, when the person chooses research for new content | The studio, at its research step |
| **What goes in** | Topic, the person's links and documents, depth, scope | The deck's topic, audience, the person's documents and links, source mode | The item's topic and audience, the documents attached to it, the studio's web policy |
| **Who approves the plan** | Offered for broad topics; otherwise the run goes straight through | Shown with Brand's own approval step | The studio's plan gate, using `--plan-only` |
| **Who does the work** | The person's own session, with its subagents | The same session Brand is running in | A harness session the studio starts, with one instruction |
| **Where the output lives** | `research/` in the project folder | `research/` in the deck's content project | `research/` in the item's folder |
| **What reads it** | The person | Harness Slides' draft and build | The studio's next steps |

### Standalone

- **Ask:** `/harness-research` or `$harness-research` with a topic and any sources, or "research
  this" in plain words.
- **Run:** the skill's guidance runs `research start`, offers the plan for approval when the
  topic is broad, then works the queue with subagents and stops only when the helper says the
  run is complete.
- **Hand back:** the report's path, the coverage by section, the main gaps, and an offer to go
  deeper. No conclusion beyond what the report says.
- **Later:** "continue the research" resumes; "research these two questions again" uses
  `--again`; "use this research for a deck" hands the folder to Brand or a studio.

### Inside Tanzu Brand, today

What Brand already does stays: it offers research for new substantive content, honours the
person's choice, and keeps identity and the deliverable. What changes:

- **One call instead of a procedure.** Brand runs `research start` with the deck's topic, its
  audience as the `--about` text, the person's documents and links as `--source`, the source
  mode, and `light` depth. Its handoff page shrinks to that and to what it reads back.
- **The plan is shown with the deck.** For a broad topic, Brand shows the research plan in its
  own approval step, before research runs.
- **The deck cites facts.** The Slides draft (`outline.json`) lists `research/report.md` in its
  `material`, and each content slide's `sources` lists the fact keys it rests on. Speaker notes
  name the sources behind the claim. Slides' `outline check` warns when a content slide in a
  researched deck cites no fact.
- **Before delivery,** Brand runs `research verify` on the deck's cited keys and reports any
  fact that has since been rejected, superseded or gone stale.
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
  | `research/facts.json` | The same, for programs |
  | `research/brief.md` | Every fact with its key, one per line |
  | `research/sources/` | The saved text of every source |
  | `.harness-research/` | The record, its history, the queue and each task's folder |

- **`facts.json`** has a `schema` number. Fields are only ever added within a schema; a change
  that removes or renames one is a new schema, and the helper can still read the old one.
- **Fact keys** are the question ID and a short hash of the statement, in lowercase letters,
  digits and hyphens, so they fit in `[R:key]` markers, links and file names. The same fact
  found again keeps the same key.
- **`research verify --project DIR --keys FILE`** (new) says, for each cited key: still
  confirmed, narrowed (with the current statement), superseded, rejected, gone, or stale
  because its source changed. It is how a deck, a training or a blog checks its citations
  before publishing, and later.
- **Every command answers in JSON;** a long run reports progress as JSON lines.
- **Versions:** each release states the runtime its guidance needs. Brand and the studios pin
  a release. As Harness Slides now does, an older runtime falls back to the last guidance it
  supports instead of being refused.

## Keeping research and using it again

There is no separate library. Research is saved where the work is: the `research/` folder of
the project, which is a local folder or part of a repository. Committing the project commits
its research, and whoever can see the repository can use it.

- **Using it again:** `research start --from PATH` begins a new run from an existing research
  folder, in this project or any other, local or in the repository.
  - Its plan, facts, checks and sources come across with their keys unchanged, so citations
    made against it still work. The new run records where it came from.
  - A new topic or `--about` text adds questions where the earlier plan does not cover it; only
    those are researched. With no change, the run is complete as soon as it starts.
  - Several folders can be combined with `--from` more than once. The same fact found in two
    has the same key and is merged.
- **Finding it:** `research find --in DIR` lists the research folders under a directory, such
  as a repository or a studio's workspace, with each one's topic, date, depth, fact count,
  approval and the age of its sources. `--query` matches topics and questions.
- **Approval:** `research approve --project DIR --by NAME` records who approved the research and
  when. Studios call it at their research gate; `find` and the report show it.
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
| **0.9.0** | The run design: queue, sources, facts, checks, cross-check, the Q/A report, `facts.json`, the light default; guidance for a person's own Claude Code; the acceptance comparison with today's skill | Standalone |
| **0.9.x** | Codex trial and fixes; `research verify`; reuse: `start --from`, `find`, `approve`, `refresh`; the guidance fallback for older runtimes | Standalone, Brand |
| **Brand 0.14** | The research handoff as one call; plan shown with the deck; Slides draft citing fact keys; `verify` before delivery; the new pin | Tanzu Brand |
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
- **Order:** standalone first (0.9.0), then the library and Brand, then the studios.
