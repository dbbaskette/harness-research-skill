# ExampleStore migration constraints

> Needs revision — independent review identified issues. Source hashes establish capture integrity; they do not establish truth.

Content digest: `e8a133e144f994f7da0c4584dc41d38fa71f2aab857aeac25f31180d3cdbe42d`. Author: fixture-author.

<a id="file-boundary"></a>
## file-boundary

Community Edition 4 and later snapshot files cannot be read by Loader.

Author: fixture-author

> Community Edition 4 and later produce snapshot files that Loader cannot read.

Source: [src-guide](#src-guide).

<a id="transfer-method"></a>
## transfer-method

The guide says Community Edition 4 datasets may be transferred using a custom adapter.

Author: fixture-author

> Community Edition 4 and later produce snapshot files that Loader cannot read. Enterprise Edition datasets may be transferred using a custom adapter; that process is outside this guide.

Source: [src-guide](#src-guide).

<a id="client-boundary"></a>
## client-boundary

Wire-protocol connection support does not guarantee identical transaction semantics.

Author: fixture-author

> Existing wire-protocol clients can connect to Loader 2. This does not guarantee identical transaction semantics.

Source: [src-guide](#src-guide).

<a id="migration-path"></a>
## A path for newer editions

Community Edition 4 requires an adapter instead of snapshot loading. ([file-boundary](evidence.md#file-boundary), [transfer-method](evidence.md#transfer-method))

Supporting facts: [file-boundary](evidence.md#file-boundary), [transfer-method](evidence.md#transfer-method). Counterevidence: none recorded.

<a id="src-guide"></a>
## ExampleStore migration guide

source.md · Synthetic test fixture · selected · full context

Capture: [saved context](sources/revisions/ecd172544e456cb267f47644f484672a80a014056b0ef12102d738efc959a300.txt); SHA-256: `ecd172544e456cb267f47644f484672a80a014056b0ef12102d738efc959a300`.

## Independent review

Reviewer: scope-checker. The report and brief cannot support path selection because their central conclusion conflates Community and Enterprise editions. The source explicitly offers Community Edition 3 snapshot loading with Loader 2, but that usable path is absent from both synthesis outputs and the fact set. The report should explain the Community Edition 4-and-later snapshot boundary, the absence of a specified alternative path for those datasets in this guide, and the separate Enterprise adapter possibility with its process outside scope. Preserve the supported Loader 2 transaction-semantics qualification in the brief as well as the report. These are meaningful documented boundaries already available in the selected source, not a request for outside research. Review inspected the complete original source.md, pinned capture, dossier, report, brief and evidence; conclusions are limited to the supplied synthetic guide. No real product or live currency claim is made.

- file-boundary — supported: The complete source explicitly states that Community Edition 4 and later snapshot files cannot be read by Loader. The exact quotation and edition boundary match.
- transfer-method — unsupported: The quote exists, but its second sentence concerns Enterprise Edition datasets, not Community Edition 4. The adjacent Community Edition sentence only establishes snapshot incompatibility. The source supplies no adapter transfer path for Community Edition 4 and says the Enterprise adapter process is outside the guide.
- client-boundary — supported: The source explicitly distinguishes existing wire-protocol clients connecting to Loader 2 from a guarantee of identical transaction semantics. This fact fairly preserves that limitation in the supplied guide's context.
- migration-path — unsupported: The claimed requirement for a Community Edition 4 adapter does not follow from snapshot incompatibility. The only adapter statement concerns Enterprise Edition and says datasets may be transferred, not that an adapter is required. The finding and brief must distinguish editions, preserve the outside-this-guide qualification, and identify a Community Edition 4 transfer path as unspecified by this source.
- decision:0 — unsupported: The guide does not document a custom adapter path for Community Edition 4. The supporting fact misattributes Enterprise Edition's qualified possibility to Community Edition 4; additionally, the guide explicitly excludes the adapter process from its coverage.
- decision:1 — supported: This accurately summarizes the source's explicit warning that connecting existing wire-protocol clients to Loader 2 does not guarantee identical transaction semantics.
