# ERD — milestone 1

Tables implemented in `backend/database/migrations`. Later phases (deposits, withdrawals, cards,
fees, subscriptions, disputes) follow README §9 and attach to `ledger_transactions` via
`source_type` / `source_id`.

```mermaid
erDiagram
  users ||--|| user_profiles : has
  users ||--o{ user_roles : has
  roles ||--o{ user_roles : grants
  roles ||--o{ role_permissions : has
  permissions ||--o{ role_permissions : in
  businesses ||--o{ user_roles : scopes
  users ||--o{ verification_codes : receives
  users ||--o{ personal_access_tokens : "signs in with"
  users ||--o| wallets : owns
  businesses ||--o| wallets : owns
  wallets ||--o{ wallet_accounts : "one per currency"
  wallet_accounts }o--|| ledger_accounts : "available"
  wallet_accounts }o--|| ledger_accounts : "held"
  ledger_transactions ||--|{ ledger_entries : contains
  ledger_accounts ||--o{ ledger_entries : records
  ledger_transactions |o--o| ledger_transactions : reverses
  users ||--o{ audit_logs : acts
```

Key constraints (Postgres):
- `ledger_entries.amount_minor > 0`, `direction IN ('debit','credit')`
- `wallets`: exactly one of `user_id` / `business_id`
- `ledger_transactions.idempotency_key` unique; `reverses_transaction_id` unique
- Triggers: `ledger_entries_immutable`, `audit_logs_immutable`, deferred `ledger_entries_balanced`
- Money: `bigint` minor units + `char(3)` currency. XAF exponent 0, USD exponent 2.
