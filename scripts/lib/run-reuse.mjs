import { hash, stable } from './run-storage.mjs';

// What a person approves: the plan, the answers, the facts and the exact source revisions they rest
// on. Bookkeeping (workers, tasks, refresh notes) is left out, so it does not undo an approval.
export function contentDigest(state) {
  return hash(stable({
    run: state.run, title: state.title ?? null, scope: state.scope ?? null, sections: state.sections, subjects: state.subjects,
    questions: state.questions.map(({ id, question, section, subject, kind, claim, coverage, verdict, gaps, headline, answer }) => ({ id, question, section, subject, kind, claim: claim ?? null, coverage, verdict: verdict ?? null, gaps, headline: headline ?? null, answer: answer ?? null })),
    facts: state.facts.map(({ key, statement, status, superseded_by, citations }) => ({ key, statement, status, superseded_by, citations: citations.map(citation => [citation.source, citation.quote_sha256]) })),
    sources: state.sources.map(({ id, sha256, original_sha256, stale_since, limits }) => ({ id, sha256, original_sha256, stale_since: stale_since ?? null, limits })),
    gaps: state.gaps.map(({ id, question, kind, reason, sources }) => ({ id, question, kind, reason, sources })),
    conflicts: state.conflicts, superseded: state.superseded, aliases: state.aliases.map(({ key, canonical }) => ({ key, canonical })),
  }));
}
// The latest approval, and whether it still applies to the research as it is now.
export function approvalView(state, status) {
  const last = state.approvals?.at(-1);
  if (!last) return null;
  const stale = status === 'stale', changed = last.content !== contentDigest(state);
  const current = !stale && !changed && status.startsWith('complete');
  return { by: last.by, at: last.at, output_revision: last.output_revision, current, ...(current ? {} : { reason: stale ? 'Sources changed since it was approved.' : changed ? 'The research changed since it was approved.' : `The research is ${status}.` }) };
}
