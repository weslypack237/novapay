# ADR-002: Double-entry ledger enforced in application and database

**Status:** accepted (milestone 1)

**Decision.** `LedgerService::post()` is the only code path that writes ledger rows. It validates
balance per currency, positive integer amounts, account currency/status, idempotency, and
non-negative balances under row locks. Postgres independently enforces the same invariants with
CHECK constraints, immutability triggers and a deferred balance trigger, so a bug or a manual SQL
session cannot silently corrupt the books. Balances are always derived by summing entries; a cached
balance may be added later for speed but must be reconciled against the ledger (`ledger:check`).

**Open.** Admin reversals currently need one permitted operator plus reason + idempotency key.
README §4.11 asks for approval workflows — a maker/checker step is in the Phase 4 backlog.
