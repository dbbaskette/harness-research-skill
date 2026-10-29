# Local topic assets and source intake

Read this to create a new topic asset or ingest a directory/URL list. Existing
cases retain their output layout; do not move generated reports by hand.

## Choose a local destination

Standalone research defaults to `research/<topic-slug>/` under the current working
directory. A person or studio may supply another local destination. No studio,
Git repository, library or sync service is required. Do not discover a parent
repository or choose the studio’s shared repository.

Create the asset through the installed runtime:

```sh
node "<runtime>/scripts/harness-research.mjs" asset init --project WORKSPACE --topic "Valkey vs Redis" --directory INPUTS --source-mode selected
```

Optional `--destination DIR` selects an explicit local asset directory. Omit
`--directory` for public-only research, or supply `--urls FILE` for a URL list at
another path. Audience and purpose can be supplied naturally and preserved with
`--audience` and `--purpose`; omitted purpose means general-purpose topic research.
Do not ask the person to drive helper commands or prepare JSON.

Use the returned **asset root** as `--project` for subsequent synthesis and
collection operations. The owned marker selects the topic layout automatically:

```text
research/valkey-vs-redis/
  topic.json       # identity, title, description, tags and revision links
  report.md        # main cited output
  brief.md         # purpose-shaped handoff
  evidence.md      # source passages and review
  facts.json       # schema-2 evidence and synthesis
  output.json      # exact reviewed digest and artifact hashes
  asset-manifest.json # local handoff inventory and byte hashes
  sources.json     # supplied/discovered inputs and observed outcomes
  documents/       # originals
  sources/         # readable captures and pinned snapshots
  .harness-research/  # owned working state and history
```

The helper refuses to adopt an unrelated existing destination. Reuse an existing
asset through its owned state; use a different destination for a separate topic.
Tags describe the topic and can change without claiming an evidence review.
A metadata title edit changes discovery text, not the research request. In this
implementation, a changed topic/audience/purpose/source permission uses an explicitly
initialized asset variant with its own destination. Do not edit private request
state to bypass that boundary. Same-request source refresh can re-intake inputs;
existing collection work then needs explicit invalidation.
`report.md` is the substantive research summary, not another metadata field.

## Take a directory and an optional URL list

Prefer this simple input layout for multiple supplied sources:

```text
inputs/valkey-vs-redis/
  documents/
    architecture.pdf
    requirements.md
  urls.txt
```

`urls.txt` is UTF-8 plain text: one HTTP(S) URL per nonblank line, with optional
`#` comment lines. It is recognized in the selected input directory. An explicit
URL-list path can live elsewhere. Individual documents or URLs in the request
remain valid; materialize them into the selected inputs as needed rather than
requiring a new intake form.

Intake snapshots original bytes and the observed input inventory. Readable plain
text can be retained directly; PDF/Office inputs still require the host’s actual
reading/extraction tools. Keep the original in `documents/` and save faithful
readable context in `sources/`. Never describe retained binary bytes as a completed
extraction. Record unsupported, oversized, malformed and unreadable inputs.

Every supplied URL remains in `sources.json`, including invalid, inaccessible,
unused or redundant entries. Record actual retrieval outcomes, redirects and local
capture paths when observed. Inventory membership does not prove a page was read
or cited. Do not invent a complete search history from a partial tool response.
Keep selected-input identity when adding a public capture; input provenance and
access permissions do not come from a model’s preferred classification.

The helper reads only the selected directory with bounded traversal. Keep inputs
apart from generated outputs; an ambiguous overlap is a refusal, not permission to
ingest the report being written. Do not follow symlinks or broaden the source root.
Changed inputs require fresh intake and revalidation of dependent collection work.

## Record source outcomes and metadata

After actually reading a selected URL and saving its context, use the existing
inventory entry ID in a source update JSON file:

```json
{
  "id": "<inventory entry ID>",
  "outcome": "captured",
  "capture_file": "sources/page.txt",
  "accessed_at": "2026-10-29"
}
```

```sh
node "<runtime>/scripts/harness-research.mjs" asset source --project ASSET --file source-update.json
```

A newly discovered public source also needs `role: "discovered"`, its `origin`,
`permission: "public"` and a unique local ID; the request must permit public research.
Preserve actual origins, permissions and retained original links. Metadata updates
use `asset metadata --file` with optional `title`, `description` and `tags` fields.
Neither source inventory status nor tags replace the independent dossier review.

## Save, verify and hand off

Author `dossier.json` inside the asset root and use the normal synthesis commands.
Paths inside a dossier are relative to that root. For example:

```sh
node "<runtime>/scripts/harness-research.mjs" synthesis save --project ASSET --file dossier.json --worker AUTHOR
node "<runtime>/scripts/harness-research.mjs" synthesis template --project ASSET --out review.json
node "<runtime>/scripts/harness-research.mjs" synthesis verify --project ASSET --compact
```

The current output revision supplies review status and evidence scope. Metadata
and source inventory are discovery/provenance records; they are not independent
factual approval. Preserve prior reviewed revisions and downstream digest pins.

After synthesis verify, use `asset-manifest.json` for the complete local handoff:
it hashes topic/source inventory, retained supplied originals/captures and the
reviewed output bundle. It excludes private helper/process state. `output.json`
still identifies reviewed schema-2 research; the asset manifest establishes file
integrity, not semantic approval of tags, unused inputs or unavailable URLs.
Metadata edits can update the handoff without claiming a new evidence review.

Return the local asset root, identity, report/brief paths, digest and actual state.
The studio owns repository selection, sync and remote conflicts. A sync failure
can retry independently of successful local research; it is not a reason to rerun
collection or change review status. Local file creation grants no sharing authority.
