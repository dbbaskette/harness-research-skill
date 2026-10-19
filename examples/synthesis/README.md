# Executable synthesis example

This fictional queue reference demonstrates the schema and helper commands. It
is not live research or an independently checked report. Run it in a disposable
project using the development runtime (`1.0.1-alpha.1` or newer). From the repository:

```sh
example_project=$(mktemp -d)
cp examples/synthesis/source.md examples/synthesis/dossier.json "$example_project/"
node scripts/harness-research.mjs synthesis validate --project "$example_project" --file dossier.json --worker example-author
node scripts/harness-research.mjs synthesis save --project "$example_project" --file dossier.json --worker example-author --compact
node scripts/harness-research.mjs synthesis status --project "$example_project" --compact
node scripts/harness-research.mjs synthesis template --project "$example_project" --out review.json
node scripts/harness-research.mjs synthesis verify --project "$example_project" --compact
```

Open `$example_project/research/report.md`, `brief.md`, and `evidence.md`.
The unfilled `review-template.json` beside this README matches the saved example;
the command creates its project-specific working copy without overwriting files.
All verdicts remain pending and reading attestations are false. A genuinely
independent invocation must inspect the material and author its own judgments
before submitting a review. Do not convert this example into an automatic passing
review. The output stays a draft until that review is accepted.

`validate` writes nothing. `save` creates the artifact bundle. `--compact` omits
the full source records and review template; omit it for the compatible full
response. `template` without `--out` prints only the review object.

For a supplied PDF or other binary source, copy the original into the content
project, extract faithful UTF-8 context, and specify both `file` (extraction) and
`original_file` (original). Keep `origin` pointing to the supplied original,
including when it was outside the project. Both saved evidence objects are pinned.
