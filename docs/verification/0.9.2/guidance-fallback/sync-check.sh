#!/bin/bash
# Checks the installed runtime's guidance selection against a disposable copy of this repository:
# released v0.9.0, a disposable v0.9.2 tag on the candidate, and a newer v0.10.0 that needs runtime 0.10.0.
# Usage: sync-check.sh REPO CANDIDATE_COMMIT INSTALLED_RUNTIME WORK OUT
set -euo pipefail
repo="$1" candidate="$2" runtime="$3" work="$4" out="$5"
rm -rf "$work"; mkdir -p "$work" "$out"
src="$work/source" project="$work/content"
git clone --quiet --no-hardlinks "$repo" "$src"
mkdir -p "$project"
cd "$src"
git -c advice.detachedHead=false checkout --quiet "$candidate"
git tag v0.9.2 "$candidate"
node -e 'const fs=require("fs");const m=JSON.parse(fs.readFileSync("guidance/manifest.json"));m.version="0.10.0";m.minimumRuntime="0.10.0";fs.writeFileSync("guidance/manifest.json",JSON.stringify(m,null,2)+"\n")'
printf '\nSynthetic newer guidance that needs runtime 0.10.0.\n' >> SKILL.md
git -c user.name=Fixture -c user.email=fixture@example.invalid -c commit.gpgsign=false commit --quiet -am 'Synthetic v0.10.0 guidance needing runtime 0.10.0'
git tag v0.10.0
{ echo "candidate: $candidate"; echo "tags:"; git for-each-ref --format='  %(refname:short) %(objectname) ' 'refs/tags/v*' | sort -V; } > "$out/repository.txt"
call() {
  HR_MODULE="$runtime/scripts/sync-guidance.mjs" HR_PROJECT="$project" HR_RUNTIME="$runtime" HR_SOURCE="$src" node --input-type=module --eval \
    "const { start } = await import(process.env.HR_MODULE); console.log(JSON.stringify(await start({ project: process.env.HR_PROJECT, runtime: process.env.HR_RUNTIME, source: process.env.HR_SOURCE }), null, 2));"
}
call > "$out/start-with-newer-release.json"
git tag -d v0.10.0 > /dev/null
call > "$out/start-without-newer-release.json"
# The pinned guidance must be the candidate's SKILL.md.
pinned="$(node -e 'console.log(JSON.parse(require("fs").readFileSync(process.argv[1])).guidance)' "$out/start-with-newer-release.json")"
git show "$candidate:SKILL.md" | cmp - "$pinned" && echo "pinned SKILL.md matches candidate $candidate" > "$out/pinned-guidance.txt"
sed -i '' "s#$work#<work>#g; s#$runtime#<runtime>#g" "$out"/*.json "$out/repository.txt"
