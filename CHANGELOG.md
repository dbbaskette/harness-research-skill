# Changelog

## 0.9.0 (unreleased)

- Keep plain-language skill invocation as the product interface; the agent researches
  with its harness tools and uses the Node-only helper for bookkeeping and validation.
- Add durable leased research tasks, separate evidence checks, one bounded gap round,
  cited headlines and answers, and independent prose review at standard/deep depth.
- Save partial and final reports under `research/`, alongside checked facts, a brief,
  plan and revision/hash manifest. Preserve a legacy report/record projection.
- Track immutable fact keys, narrowed assertion history, duplicate aliases, conflicts,
  source revisions, exact quote offsets and honest unanswered gaps.
- Fence stale leases, reject self-checking and unleased managed-run writes, repair
  interrupted exports, and exclude changed evidence from the current facts brief.
- Require runtime 0.9.0 for this guidance. Runtime installation remains explicit;
  reuse/refresh/approval commands and consumer migrations remain later milestones.

## 0.8.1

- A changed plan keeps the findings of questions whose definition is unchanged, when the topic, purpose, scope, selected sources and input files are unchanged. `plan` reports them in `carried`.
- A finding may carry an optional one-line `headline`, kept in the record and shown as `Answer:` in the report.
- Guidance names both; its minimum runtime is now 0.8.1. Tanzu Brand and Harness Slides remain at 0.8.0.

## 0.8.0

- Align the runtime, guidance release, compatibility floor, and installation examples with Tanzu Brand and Harness Slides 0.8.0.
- Retain saved tasks on their original guidance/runtime; new tasks use the aligned release.
- Refresh progressive-disclosure measurements for the current package.

## 0.3.0

First tagged GitHub release.

- Standalone research produces a saved cited report by default. Instructions require saving findings and inspecting the actual report before declaring completion; explicit chat-only requests can omit saved artifacts.
- The skill announces the installed runtime version, guidance release, exact revision and freshness when starting or resuming work. These identities remain separate, including when newer instructions run with an older compatible helper.
- `node scripts/harness-research.mjs --version` checks the installed runtime without a project or network access. Installer results also include `runtimeVersion`.
- Saved tasks retain their original runtime and guidance. Earlier pins without a guidance release report it as unknown and retain their exact revision.
- Git refresh failures identify the failing operation and sanitized network/access diagnostics, with instructions to retry through the host's permitted network-access flow.

Install or update from tag `v0.3.0` using `scripts/Install-Harness-Research.sh`.
Guidance continues to refresh from `main` for new tasks; helper updates require
the installer. Guidance from this release remains compatible with runtime 0.2.0,
whose version can be read from its installed `package.json`.
