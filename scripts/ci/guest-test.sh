#!/bin/bash
set -euo pipefail
source_dir='/Volumes/My Shared Files/source'
results_dir='/Volumes/My Shared Files/results'
export PATH="/opt/homebrew/opt/node@22/bin:/opt/homebrew/bin:/usr/local/bin:$PATH"
work="$(mktemp -d "${TMPDIR:-/tmp}/harness-research-guest.XXXXXX")"
trap 'rm -rf "$work"' EXIT
rm -f "$results_dir/result.txt"
rsync -a --exclude=node_modules --exclude=.DS_Store "$source_dir/" "$work/repo/"
cd "$work/repo"
printf 'OS: %s\nNode: %s\nPython: %s\nSource: %s\n' "$(sw_vers -productVersion)" "$(node --version)" "$(python3 --version)" "$(git rev-parse HEAD)" | tee "$results_dir/environment.txt"
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
printf 'PASS\n' > "$results_dir/result.txt"
