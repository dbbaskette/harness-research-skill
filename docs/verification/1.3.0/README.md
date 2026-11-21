# Harness Research 1.3.0 verification

The 1.3.0 working tree passed the local checks on a macOS 27 development host:
238 Node tests with zero failures and one skip (the Python-gated comparative
validator), and context-map validation after regenerating the measurements for the
changed bootstrap and references.

The new and changed tests check that:

- a task pin saves no installed folder, path or runtime file hash, and records the
  guidance floor and the starting runtime version;
- a pin in the format earlier releases wrote resumes after its version folder is
  gone, on a changed runtime, with a `notice` only when the version differs;
- saved guidance that needs a newer runtime is refused on `resume` and `cached`, for
  new pins, for earlier pins read from the cached revision, and when that revision is
  unavailable;
- an update leaves exactly one folder in `versions/`, removes an abandoned staging
  folder, unlinks a link there without following it, and repoints this tool's own
  alias-skill and agent links to `current`, while a link elsewhere and a real folder
  are left and reported;
- a failed installation removes nothing, and a folder that cannot be removed is
  reported without failing the update;
- the helpers, the guidance helper and the installer run through the `current` link
  and a skill link, and return `current` as the runtime;
- reviewed unchanged-save work stays complete when runtime bytes change, including a
  receipt that carries a runtime digest, while a changed host context still makes it
  stale.

One cross-version exercise was run by hand in a disposable home: the released 1.2.0
tree installed with its own installer, a task started and a synthesis saved with
`--reuse-unchanged` and independently reviewed by its helpers, then this tree
installed over it. The 1.2.0 folder was removed, the alias link was repointed, the
task resumed on 1.3.0 with its notice, the reviewed synthesis verified complete and
an identical save returned `no-change`. The installed-topic smoke script passed
against the `current` address.

Not run: the disposable macOS virtual machine gate, `npm audit`, and a live research
trial. No dependency changed. All content was synthetic, and no model or provider
jobs were used. Marketing Studio and other callers were not changed or tested; the
release notes state what they must change.
