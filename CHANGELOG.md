# Changelog

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
