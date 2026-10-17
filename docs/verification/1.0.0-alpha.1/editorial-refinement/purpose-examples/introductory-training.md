# Training research handoff: compatibility and recoverability

> Draft behavioral probe, not an independently reviewed bundle or finished lesson.

**Studio task:** Support introductory training for engineers who know basic key/value operations but are new to database migration. Help learners distinguish a working connection from preserved behavior and recovery.

## Concept sequence

Begin with the client/server boundary. RESP is the protocol through which clients communicate; Valkey documents RESP2/RESP3 and existing Redis-client connection support. Next separate that connection from transaction semantics: Valkey 8.0 records aborting transactions on nested MULTI/WATCH. Learners should be able to explain why a PING check cannot establish the outcome of a more complex failure path. [Connection support](../../valkey-redis-editorial/research/evidence.md#protocol-client) · [Transaction boundary](../../valkey-redis-editorial/research/evidence.md#transaction-difference)

Then introduce asynchronous replication: the copy does not become a universal guarantee against acknowledged-write loss. Both Valkey and Redis document that WAIT improves failover safety without establishing strong consistency. This prevents the misconception that adding a replica makes every recovery scenario lossless. [Valkey WAIT](../../valkey-redis-editorial/research/evidence.md#wait-not-strong) · [Redis WAIT](../../valkey-redis-editorial/research/evidence.md#redis-wait-limit)

## Worked-example ingredient

Use an explicitly hypothetical write: after cutover, the new target receives an updated value while the preserved old source receives nothing. Returning the application to that source returns the older value by construction. Ask learners to identify what evidence of replay or reconciliation would make rollback credible. This illustrates a recovery requirement; it is neither a tested migration procedure nor an observed incident. [Replication](../../valkey-redis-editorial/research/evidence.md#async-replication) · [Forward cutover](../../valkey-redis-editorial/research/evidence.md#replica-cutover)

## Boundaries for the course author

Keep the examples separate from executable exercises. The captured migration walkthrough uses Redis 7.2.5 and Valkey 7.2.6; it is not a universal recipe for newer releases. No lab, restore drill or application test was run. Evidence is reused from 2026-10-17, with original qualifications retained. [Example versions](../../valkey-redis-editorial/research/evidence.md#migration-example) · [Source dossier](../../valkey-redis-editorial/research/dossier.json)
