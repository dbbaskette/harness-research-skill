# Harness Research 1.2.0 verification

The 1.2.0 tree passed the local checks on a macOS 27 development host: 235 Node
tests with zero failures and one platform skip, and context-map validation after
regenerating the measurements for the changed topic-asset reference.

The new tests check that `references/intake-limits.json` states exactly the limits
the runtime enforces, that a 1,600-address list is registered whole and that a list
one past the 2,000-entry limit is refused.

This release changes four numbers and adds one stated-limits file. It was not run
through the disposable macOS virtual machine gate, the isolated installer acceptance
or a live research trial; none of those paths changed. All content was synthetic,
and no model or provider jobs were used.
