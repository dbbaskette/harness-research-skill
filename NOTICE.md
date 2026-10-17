# Sources and adaptations

The question queue/report engine and its tests were extracted from Dan Baskette's
tanzu-brand project with the owner's authorization, at commit
`d5622c4a5207093c5026a57fe4dc8eaf5607868f`.

`upstream/` preserves the English Codex and Claude bundle previously distributed
by Tanzu Brand: [dbbaskette/Deep-Research-skills](https://github.com/dbbaskette/Deep-Research-skills),
forked from [Weizhena/Deep-Research-skills](https://github.com/Weizhena/Deep-Research-skills),
pinned at `6ce38f60e3f8b22502c29873f96503a4e0c5addb`. Its MIT license and recorded
adaptations remain in `upstream/LICENSE` and `upstream/source.json`.
This was a modified bundle, not an installation-time clone.

Harness Research adds one progressively disclosed entrypoint, a shared installer,
explicit migration from Brand's records, and cross-harness routing. No proprietary
brand assets or provider credentials are included. The retained upstream skill
names are compatibility resources; they are not installed for new users by default.

## Anthropic Knowledge Synthesis adaptation

The default synthesis workflow adapts Anthropic’s Knowledge Synthesis from
[anthropics/knowledge-work-plugins](https://github.com/anthropics/knowledge-work-plugins),
`enterprise-search/skills/knowledge-synthesis/SKILL.md`, pinned to commit
`33eeda1e8fd856455b05479d13a0f85b5f803744`. That component is licensed under
Apache License 2.0. Its unmodified source, complete license and hashes are retained
in `upstream/anthropic/`; the root MIT license does not replace that license.

Modified files `SKILL.md` and `references/synthesize.md` identify the adaptation.
Harness Research adds bounded investigation, public/supplied source scope, saved
evidence and narrative artifacts, independent review, revision invalidation and
reuse. It changes enterprise-specific source heuristics into context-sensitive
evidence judgments. This attribution does not imply Anthropic endorsement.
