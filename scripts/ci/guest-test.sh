#!/bin/bash
set -euo pipefail
source_dir='/Volumes/My Shared Files/source'
results_dir='/Volumes/My Shared Files/results'
export PATH="/opt/homebrew/opt/node@22/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
work="$(mktemp -d "${TMPDIR:-/tmp}/harness-research-guest.XXXXXX")"
trap 'rm -rf "$work"' EXIT
rm -f "$results_dir/result.txt"
rsync -a --exclude=.git --exclude=node_modules --exclude=.DS_Store "$source_dir/" "$work/repo/"
cd "$work/repo"
# The shared runner records the host commit/status before starting this disposable VM.
# A linked worktree's .git file points outside the mount, so do not copy or resolve it here.
source_commit="$(sed -n 's/^Source commit: //p' "$results_dir/run.txt")"
[[ "$source_commit" =~ ^[[:xdigit:]]{40,64}$ ]] || { printf 'Missing host source revision in run.txt\n' >&2; exit 1; }
printf 'OS: %s\nNode: %s\nPython: %s\nSource: %s\n' "$(sw_vers -productVersion)" "$(node --version)" "$(python3 --version)" "$source_commit" | tee "$results_dir/environment.txt"
python3 - "$results_dir/source-files.sha256" <<'PY_HASH'
import hashlib
from pathlib import Path
import sys
with open(sys.argv[1], 'w') as record:
    for path in sorted(Path('.').rglob('*')):
        if path.is_file():
            record.write(f"{hashlib.sha256(path.read_bytes()).hexdigest()}  {path}\n")
PY_HASH
npm ci --ignore-scripts 2>&1 | tee "$results_dir/npm-ci.log"
npm audit --audit-level=high 2>&1 | tee "$results_dir/audit.log"
python3 -m venv "$work/validator"
"$work/validator/bin/pip" install 'PyYAML==6.0.3' 2>&1 | tee "$results_dir/validator-install.log"
HARNESS_RESEARCH_PYTHON="$work/validator/bin/python" npm test 2>&1 | tee "$results_dir/tests.log"
npm run context:check 2>&1 | tee "$results_dir/context.log"
bash scripts/Install-Harness-Research.sh --home "$work/home" --shared "$work/shared" 2>&1 | tee "$results_dir/installer.log"
node "$work/home/.agents/skills/harness-research/scripts/harness-research.mjs" --help 2>&1 | tee "$results_dir/installed-help.log"
node "$work/home/.agents/skills/harness-research/scripts/harness-research.mjs" --version 2>&1 | tee "$results_dir/installed-version.log"
mkdir "$work/content"
cp examples/plan.json "$work/content/plan.json"
node "$work/home/.claude/skills/harness-research/scripts/harness-research.mjs" plan --project "$work/content" --file "$work/content/plan.json" 2>&1 | tee "$results_dir/installed-plan.log"
cp -R "$work/content/.harness-research" "$results_dir/example-research"
node "$work/home/.agents/skills/harness-research/scripts/harness-research.mjs" synthesis help 2>&1 | tee "$results_dir/installed-synthesis-help.log"
mkdir "$work/synthesis-content"
cat > "$work/synthesis-content/dossier.json" <<'JSON'
{
  "schema": 2,
  "topic": "Installer smoke test",
  "audience": "Maintainers",
  "purpose": "Verify a new installation saves an honest draft",
  "scope": "Synthetic empty draft; no research or evidence review performed",
  "source_mode": "selected",
  "sources": [],
  "facts": [],
  "findings": [],
  "sections": [{"id": "pending", "title": "Research pending", "blocks": [{"kind": "gap", "text": "No evidence has been collected. Independent review is pending.", "refs": []}]}]
}
JSON
node "$work/home/.agents/skills/harness-research/scripts/harness-research.mjs" synthesis save --project "$work/synthesis-content" --file dossier.json --worker installer-smoke 2>&1 | tee "$results_dir/installed-synthesis-save.log"
node "$work/home/.agents/skills/harness-research/scripts/harness-research.mjs" synthesis status --project "$work/synthesis-content" | tee "$results_dir/installed-synthesis-status.json"
node --input-type=module - "$results_dir/installed-synthesis-status.json" "$work/synthesis-content/research/report.md" <<'JS'
import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const status = JSON.parse(await readFile(process.argv[2], 'utf8'));
assert.equal(status.schema, 2);
assert.equal(status.status, 'draft');
assert.equal(status.reviewer, null);
assert.match(await readFile(process.argv[3], 'utf8'), /Draft.*independent review is pending/);
JS
cp -R "$work/synthesis-content/research" "$results_dir/installed-synthesis-artifacts"
printf 'PASS\n' > "$results_dir/result.txt"
