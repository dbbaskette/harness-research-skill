# ExampleStore migration constraints

> Needs revision — independent review identified issues. Source hashes establish capture integrity; they do not establish truth.

Audience: Platform engineers. Purpose: Understand documented migration boundaries before selecting a path.

## A path for newer editions

Community Edition 4 requires an adapter instead of snapshot loading. ([file-boundary](evidence.md#file-boundary), [transfer-method](evidence.md#transfer-method))

**Supporting evidence**

- Community Edition 4 and later snapshot files cannot be read by Loader. ([file-boundary](evidence.md#file-boundary))
- The guide says Community Edition 4 datasets may be transferred using a custom adapter. ([transfer-method](evidence.md#transfer-method))

