# Current studio caller audit

Read-only inspection on 2026-10-17. No studio source or installed skill was edited.

| Studio | Observed caller | Migration boundary |
| --- | --- | --- |
| Presentation | presentation-studio/runner/research_steps.py:353 receives title, audience, goal and duration; research.py:120 calls plan/record/status | Context reaches the old planning agent, not a schema-2 dossier. |
| Training | training-studio/skills/training-studio/scripts/checks.py:52 requires purpose=planning; workspace.py:703 reads legacy research.json schema 1 | Its question-ID evidence reader needs deliberate adaptation. |
| Blog | Installed blog-deep-research.md describes its own helper; source scripts/deep_research.py:95 restricts old plan fields and purpose; studio_research/runtime.py:176 calls legacy commands | Installed/source behavior differs; neither is an automatic schema-2 task handoff. |

New research receives the actual studio task in free-text purpose, alongside
audience, topic, scope and separately authorized source_mode. Never send that task
into the old fixed-purpose plan field. A migrated caller reads output.json state,
digest and artifact hashes; uses the brief/report; resolves evidence refs; retains
qualifications and source captures; distinguishes its new interpretation from
research's reviewed content. See the maintained
[handoff reference](../../../../references/studio-handoff.md).
