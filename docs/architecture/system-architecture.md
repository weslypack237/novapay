# System architecture

```
Browser (customer / business / admin)
   │  HTTPS — httpOnly, SameSite=Strict session cookie. No API token in JS.
   ▼
Next.js app (apps/web)
   ├─ Pages: public site, customer app, admin console (RBAC enforced by API)
   ├─ proxy.ts — optimistic gate: no session cookie → /login
   └─ Route handlers = backend-for-frontend (BFF)
        /api/session/{login,register,logout}  → sets/clears the cookie
        /api/bff/*                            → forwards with Bearer token
   │  server-to-server
   ▼
Laravel API (backend)  /api/v1
   ├─ Auth & RBAC (Sanctum tokens, permission middleware)
   ├─ Ledger (LedgerService — the only writer of ledger rows)
   ├─ Wallets (balances derived from ledger)
   ├─ Audit (AuditLogger — append-only)
   └─ [Phase 5+] Provider adapters: issuer, MTN, Orange, KYC, FX, SMS
   ▼
PostgreSQL (constraints + triggers)   Redis (queues, rate limits, locks)
```

## Why a BFF
Keeping the Sanctum token in an httpOnly cookie on the Next.js origin means an XSS bug cannot read
it. The browser never calls Laravel directly, so CORS can stay locked to the web origin. See
`decisions/ADR-001-bff-session.md`.

## Money flow invariants
1. Every value movement is a `ledger_transactions` row with ≥ 2 `ledger_entries`.
2. Debits = credits per currency — checked in `LedgerService` and by a deferred Postgres
   constraint trigger at COMMIT.
3. Entries and audit logs are append-only — Eloquent guards + Postgres triggers.
4. Customer accounts (`allow_negative = false`) are locked `FOR UPDATE` in a stable order and
   re-checked after posting, so concurrent debits cannot overspend.
5. Idempotency key + payload hash: the same request replays the original result; the same key with
   a different payload is a 409.
6. Corrections are reversal transactions (`reverses_transaction_id`, unique — at most one).

## Account model
| Account type          | Normal side | Can go negative | Owner |
|-----------------------|-------------|-----------------|-------|
| customer_available    | credit      | no              | user / business |
| customer_held         | credit      | no              | user / business |
| provider_settlement.* | debit       | yes             | system |
| fee_revenue           | credit      | no              | system |
| fx_clearing           | debit       | yes             | system |
| demo_funding          | debit       | yes             | system — demo mode only |

Deposit (Phase 5): debit `provider_settlement.mtn.XAF`, credit `customer_available`.
Withdrawal hold: debit `customer_available`, credit `customer_held`; on success debit `customer_held`,
credit `provider_settlement`; on failure reverse the hold.
