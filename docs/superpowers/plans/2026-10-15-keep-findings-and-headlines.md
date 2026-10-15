# Keep Findings and Headlines Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A changed plan keeps the findings of its unchanged questions, and a finding may carry a one-line headline shown as its answer.

**Architecture:** Two small changes in `scripts/lib/research.mjs`. `planUnlocked` copies the saved results of unchanged questions into the new run when the plan around them is the same, and reports which in `carried`. `recordUnlocked` accepts an optional `headline`, keeps it in the result, and `render` shows it as `Answer:`. The guidance names both.

**Tech Stack:** Node 20+ ES modules, `node:test`.

**Spec:** `docs/superpowers/specs/2026-10-15-keep-findings-and-headlines-design.md`.

**Branch:** `claude/keep-findings-and-headlines`.

**Run the tests:** `npm test` (all), or `node --test --test-name-pattern='keeps' tests/research.test.mjs` for some.

---

### Task 1: A changed plan keeps unchanged questions' findings

**Files:**
- Modify: `scripts/lib/research.mjs` (`planUnlocked`; new `keptResults` above it)
- Test: `tests/research.test.mjs`

- [ ] **Step 1: Write the failing tests**

Add after the test `'matching plans resume findings and changes retain history with a new run'`:

```js
const pricing = () => ({ id: 'pricing', question: 'Check published pricing', public_query: 'public pricing page', claim: null });

test('a changed plan keeps the findings of questions that did not change', async t => {
  const root = await fixture(t);
  const first = await planResearch(root, plan());
  assert.deepEqual(first.carried, []);
  await recordResearch(root, first.run, 'availability', finding());
  const added = plan(); added.items.push(pricing());
  const next = await planResearch(root, added);
  assert.notEqual(next.run, first.run);
  assert.equal(next.completed, 1); assert.equal(next.total, 3);
  assert.deepEqual(next.carried, ['availability']);
  assert.deepEqual(next.pending, ['performance', 'pricing']);
  assert.match(await report(root), /https:\/\/example.invalid\/release/);
  assert.ok((await readdir(join(root, '.harness-research', 'history'))).some(name => name.endsWith('.json')));
  const recorded = await recordResearch(root, next.run, 'pricing', { status: 'insufficient', summary: 'No public price.', limits: 'Pricing is quoted privately.', evidence: [] });
  assert.equal(recorded.completed, 2);
});

test('a reworded or removed question loses its finding and the rest keep theirs', async t => {
  const root = await fixture(t);
  const first = await planResearch(root, plan());
  await recordResearch(root, first.run, 'availability', finding());
  await recordResearch(root, first.run, 'performance', { status: 'insufficient', summary: 'No benchmark.', limits: 'Open.', evidence: [] });
  const reworded = plan(); reworded.items[1].question = 'Check published benchmark methods';
  const next = await planResearch(root, reworded);
  assert.deepEqual(next.carried, ['availability']); assert.deepEqual(next.pending, ['performance']);
  const fewer = plan(); fewer.items = fewer.items.slice(0, 1);
  const last = await planResearch(root, fewer);
  assert.deepEqual(last.carried, ['availability']);
  assert.equal(last.total, 1); assert.equal(last.completed, 1);
});

test('a changed topic, input or scope keeps no finding', async t => {
  const changes = [
    changed => { changed.topic = 'Another topic'; },
    changed => { changed.input_files = []; },
    changed => { changed.scope = 'supplied-only'; changed.items.forEach(item => { item.public_query = null; }); },
  ];
  for (const change of changes) {
    const root = await fixture(t);
    const first = await planResearch(root, plan());
    await recordResearch(root, first.run, 'availability', finding());
    const changed = plan(); change(changed);
    const next = await planResearch(root, changed);
    assert.equal(next.completed, 0); assert.deepEqual(next.carried, []);
  }
});

test('a kept finding whose snapshot changed is reported stale', async t => {
  const root = await fixture(t);
  const first = await planResearch(root, plan());
  await recordResearch(root, first.run, 'availability', finding());
  await writeFile(join(root, 'sources', 'release.md'), 'Feature A was removed in version 3.');
  const added = plan(); added.items.push(pricing());
  const next = await planResearch(root, added);
  assert.deepEqual(next.carried, ['availability']);
  assert.equal(next.status, 'stale'); assert.deepEqual(next.staleItems, ['availability']);
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `node --test --test-name-pattern='keeps|kept finding' tests/research.test.mjs`
Expected: FAIL: `next.completed` is 0 and `carried` is undefined.

- [ ] **Step 3: Keep unchanged findings**

In `scripts/lib/research.mjs`, add above `async function planUnlocked`:

```js
// The saved findings a changed plan keeps: those of questions defined exactly as before,
// when the topic, purpose, scope, selected sources and pinned inputs are all unchanged.
function keptResults(old, plan, pin) {
  const same = ['topic', 'purpose', 'scope'].every(key => old[key] === plan[key])
    && stable(old.sources ?? null) === stable(plan.sources ?? null)
    && stable(old.inputs) === stable(pin);
  if (!same) return {};
  const before = new Map(old.items.map(item => [item.id, stable(item)]));
  const kept = {};
  for (const item of plan.items) {
    if (before.get(item.id) === stable(item) && Object.hasOwn(old.results, item.id)) kept[item.id] = old.results[item.id];
  }
  return kept;
}
```

Replace the end of `planUnlocked`, from `if (await exists(locations.file)) {` to its last line, with:

```js
  let kept = {};
  if (await exists(locations.file)) {
    const old = await readState(locations.file);
    if (old.scope === 'supplied-only' && plan.scope === 'public-web' && !allowWeb) throw new Error('Supplied-only research requires explicit permission before changing to public-web scope.');
    if (old.run === run) return { ...(await statusUnlocked(project)), carried: [] };
    kept = keptResults(old, plan, pin);
  }
  await paths(project, true);
  const status = await save(locations, { schema: 1, owner: 'harness-research', run, ...plan, inputs: pin, results: kept, created_at: new Date().toISOString() });
  return { ...status, carried: plan.items.map(item => item.id).filter(id => Object.hasOwn(kept, id)) };
```

- [ ] **Step 4: Run all the tests**

Run: `npm test`
Expected: all pass, including the existing `'matching plans resume findings and changes retain history with a new run'` (its topic change still keeps nothing).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/research.mjs tests/research.test.mjs
git commit -m "Keep unchanged questions' findings when a plan changes"
```

---

### Task 2: A headline per finding

**Files:**
- Modify: `scripts/lib/research.mjs` (`recordUnlocked`, `render`)
- Test: `tests/research.test.mjs`

- [ ] **Step 1: Write the failing test**

```js
test('a finding may carry a one-line headline, shown as its answer', async t => {
  const root = await fixture(t);
  const first = await planResearch(root, plan());
  const saved = async () => JSON.parse(await readFile(join(root, '.harness-research', 'research.json'), 'utf8'));
  await recordResearch(root, first.run, 'availability', { ...finding(), headline: '  Feature A ships in version 2. ' });
  assert.equal((await saved()).results.availability.headline, 'Feature A ships in version 2.');
  assert.match(await report(root), /Answer: Feature A ships in version 2\.\n\nThe feature is available in version 2\./);
  const open = { status: 'insufficient', summary: 'No benchmark.', limits: 'Open.', evidence: [] };
  await recordResearch(root, first.run, 'performance', open);
  assert.equal(Object.hasOwn((await saved()).results.performance, 'headline'), false);
  for (const headline of ['', '   ', 'Two\nlines', 'x'.repeat(301), 7]) {
    await assert.rejects(recordResearch(root, first.run, 'performance', { ...open, summary: 'Changed.', headline }), /Headline requires one nonempty line/);
  }
  assert.equal((await saved()).results.performance.summary, 'No benchmark.');
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `node --test --test-name-pattern='headline' tests/research.test.mjs`
Expected: FAIL: the headline is not kept.

- [ ] **Step 3: Accept, keep and show it**

In `recordUnlocked`, after `text(supplied.summary, 'Summary', 12000); text(supplied.limits, 'Coverage limits');` add:

```js
  if (supplied.headline !== undefined && (typeof supplied.headline !== 'string' || !supplied.headline.trim() || supplied.headline.length > 300 || /[\r\n]/.test(supplied.headline))) throw new Error('Headline requires one nonempty line (maximum 300 characters).');
```

and replace the line that stores the result with:

```js
  value.results[id] = { status: supplied.status, ...(supplied.headline !== undefined ? { headline: supplied.headline.trim() } : {}), summary: supplied.summary, limits: supplied.limits, evidence, checked_at: new Date().toISOString() };
```

In `render`, replace:

```js
    lines.push(literal(finding.summary), '', `Limits/open questions: ${literal(finding.limits)}`, `Checked: ${finding.checked_at}`, '');
```

with:

```js
    if (finding.headline) lines.push(`Answer: ${literal(finding.headline)}`, '');
    lines.push(literal(finding.summary), '', `Limits/open questions: ${literal(finding.limits)}`, `Checked: ${finding.checked_at}`, '');
```

- [ ] **Step 4: Run all the tests**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/research.mjs tests/research.test.mjs
git commit -m "Keep an optional one-line headline with a finding"
```

---

### Task 3: Say so in the guidance

**Files:**
- Modify: `references/evidence.md`

- [ ] **Step 1: Name the headline and what a changed plan keeps**

In `references/evidence.md`, replace:

```markdown
A finding contains `status` (supported, contradicted,
insufficient, unavailable), `summary`, `limits`, and `evidence`.
```

with:

```markdown
A finding contains `status` (supported, contradicted,
insufficient, unavailable), an optional one-line `headline` giving the answer,
`summary`, `limits`, and `evidence`.
```

and after the paragraph that ends "represented by the helper's `--allow-web` flag." add:

```markdown
Changing a saved plan starts a new run. Questions whose definition is unchanged keep
their findings when the topic, purpose, scope, selected sources and input files are
unchanged; `plan` lists them in `carried`. Anything else starts with no findings.
```

- [ ] **Step 2: Check the guidance budgets and the tests**

Run: `npm run context:check && npm test`
Expected: both pass. If `context:check` reports a budget exceeded, shorten the new sentences rather than raising the budget, then run `npm run context:update` only if the project's practice is to commit refreshed measurements with guidance edits (see `tools/context-usage.mjs`).

- [ ] **Step 3: Commit**

```bash
git add references/evidence.md
git commit -m "Name the headline and what a changed plan keeps"
```

---

### Task 4: Prepare the release

Skip this task if the maintainer ships these changes with the next coordinated release instead of alone.

**Files:**
- Modify: `package.json`, `package-lock.json`, `guidance/manifest.json`, `SKILL.md`, `README.md`, `docs/releases.md`, `CHANGELOG.md`

- [ ] **Step 1: Move every release label to 0.8.1**

- `package.json` and `package-lock.json` (both `version` fields at the top of the lockfile): `0.8.0` → `0.8.1`.
- `guidance/manifest.json`: `"version": "0.8.1"`, `"minimumRuntime": "0.8.1"` (the guidance now names `headline` and `carried`).
- `SKILL.md`: `Guidance release: **0.8.1**`.
- `README.md` and `docs/releases.md`: every `v0.8.0` / `0.8.0` that names the current release.

- [ ] **Step 2: Changelog**

Add at the top of `CHANGELOG.md`:

```markdown
## 0.8.1

- A changed plan keeps the findings of questions whose definition is unchanged, when the topic, purpose, scope, selected sources and input files are unchanged. `plan` reports them in `carried`.
- A finding may carry an optional one-line `headline`, kept in the record and shown as `Answer:` in the report.
```

- [ ] **Step 3: Run everything**

Run: `npm test && npm run context:check && node scripts/harness-research.mjs --version`
Expected: tests pass, budgets pass, and the version prints `0.8.1`.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json guidance/manifest.json SKILL.md README.md docs/releases.md CHANGELOG.md
git commit -m "Release harness-research 0.8.1"
```

Then follow `docs/releases.md` (full native gate, archive the merged commit, tag `v0.8.1`).

---

## After the release

Presentation Studio pins the new revision with `sh installer/install.sh pin harness-research --revision v0.8.1` and uses `carried` and `headline` (its plan `docs/superpowers/plans/2026-10-15-reviewing-stops.md`, Task 0).
