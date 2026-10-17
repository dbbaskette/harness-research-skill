# Implement synthesis-first Harness Research

Direction authorized by the user on 2026-10-17. Base commit: `c7c406eb8d1d97f72748909b68020882f10544dd`. Worktree: `/private/tmp/harness-research-synthesis`, branch `codex/synthesis-first`.

Contract: [synthesis-first specification](../specs/2026-10-17-synthesis-first.md). The earlier design to extend the question queue is replaced by this document-first implementation. Keep legacy commands for resuming existing work.

## Work and ownership

1. **Skill and provenance.** Skill author owns `SKILL.md`, stage references and the preserved Anthropic source/license. Deliver concise progressive routing, real investigation/synthesis/review instructions, default saved output and honest failure behavior. Validate local links and instruction loading. Coordinate exact JSON with runtime owner.
2. **Document-first helper.** Runtime owner owns `scripts/lib/synthesis*.mjs`, schema and focused tests. Implement save/review/status/verify, pinned evidence, exact quote/reference validation, digest-bound independent review, reader report/brief/evidence exports, criterion comparisons, staleness and overwrite protection. No task scheduler or model service. Run focused behavioral tests.
3. **Packaging.** Integration owner wires CLI, prerelease version and minimum runtime, installer compatibility, context measurements and packaging tests. Keep old `research` command behavior and source ownership boundaries. Verify isolated installation; do not touch the active installation.
4. **Documentation and graphic.** Main owns README, user/setup/developer/architecture/migration documentation, changelog and new image. Describe preview status accurately, preserve historical release evidence, and link first-use readers to deeper material.
5. **Live acceptance.** After instructions and CLI are usable, a fresh researcher uses the new skill in an isolated project for the requested Valkey/Redis replacement comparison. A different invocation inspects original evidence and the actual report. Main resolves demonstrated failures and records the result. Do not supply the desired conclusion to the researcher.
6. **Integration verification.** Main owns final full-suite/local CI evidence and final review. Test actual packaged commands, generated context measurements, local documentation links, source notices and the saved live output. Reuse successful evidence for unchanged code; rerun affected checks after fixes.

## Review focus

The source must support the assertion, and the assertions must support the synthesis. Byte checks alone establish neither. Scope authorization must survive reuse. A source or dossier change invalidates its review. Comparisons cannot pair unrelated array elements. User-owned files and legacy research are never overwritten. Unsupported runtime/guidance combinations must fail plainly. Examples and recommendations are not new primary evidence.

## Completion record

- Implemented the skill, helper, provenance, packaging and documentation on the isolated branch.
- Independent code review found three correctness issues; all were fixed and the reviewer verified the fixes.
- Full disposable macOS gate passed: 148 tests, no failures/skips; installer, installed synthesis flow, audit and context checks passed. Task-owned clones were removed.
- Fresh Valkey/Redis research completed with 14 primary sources, 28 facts and five findings. A different invocation read all originals and accepted 18 prose blocks plus facts/findings.
- Preserved bundle verifies complete with matching source/artifact hashes. [Acceptance record](../../verification/1.0.0-alpha.1/README.md).
- This is a local development preview; publication and active installation were not performed.
