# Versioned releases

The current coordinated release is **0.8.0**, aligned with Tanzu Brand and Harness
Slides. Package/lockfile versions, `guidance/manifest.json`, the guidance release
label in `SKILL.md`, and current install examples identify this software release.
Earlier changelog entries and saved tasks retain their recorded versions.

After the relevant full native gate passes, merge the PR and verify its merged
tree matches the tested tree. Brand's combined macOS gate can own shared
verification when it runs the exact pinned Research commit's complete suite,
installer, installed helper and saved-report flow. Reuse that evidence; do not
repeat an unchanged suite merely because the merge SHA differs.

Archive the exact verified merge commit, never a mutable working directory:

```sh
git archive --format=zip --prefix=harness-research-v0.8.0/ --output /private/tmp/harness-research-v0.8.0.zip COMMIT
shasum -a 256 /private/tmp/harness-research-v0.8.0.zip
```

Extract into disposable state, compare every file with the tagged tree, run its
installer with disposable `--home`/`--shared` paths, and verify the installed
`--version` reports 0.8.0. Publish the ZIP and checksum at an unused immutable
`v0.8.0` tag, then download and verify both assets. Keep logs, exact commits,
artifact hashes and cleanup results. No model or real-account access is needed.

Installing updates the entrypoint for new tasks. Existing tasks keep their saved
runtime/guidance; retain those immutable directories. Guidance refresh never
executes downloaded code. To roll back new work, rerun a prior release's installer.
