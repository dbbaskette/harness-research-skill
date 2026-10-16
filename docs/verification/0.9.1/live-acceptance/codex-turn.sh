#!/bin/bash
# codex-turn.sh LIVE N PROMPT_FILE [SESSION_ID]: one Codex turn of the live trial, with timing.
set -uo pipefail
L="$1" n="$2" prompt="$3" session="${4:-}"
cd "$L/codex"
start=$(date +%s)
cfg=(-c 'sandbox_mode="workspace-write"' -c 'sandbox_workspace_write.network_access=true' -c "sandbox_workspace_write.writable_roots=[\"$L/codex\"]")
if [[ -z "$session" ]]; then codex exec --skip-git-repo-check -C "$L/codex" --add-dir "$L/codex" -s workspace-write "${cfg[@]}" --json -o "$L/codex/logs/turn$n.last.md" - < "$prompt" > "$L/codex/logs/turn$n.jsonl" 2> "$L/codex/logs/turn$n.err"
else codex exec resume --skip-git-repo-check "${cfg[@]}" --json -o "$L/codex/logs/turn$n.last.md" "$session" - < "$prompt" > "$L/codex/logs/turn$n.jsonl" 2> "$L/codex/logs/turn$n.err"; fi
code=$?
echo "turn $n start $start end $(date +%s) exit $code" >> "$L/codex/logs/timing.txt"
