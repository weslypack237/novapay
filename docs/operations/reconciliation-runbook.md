# Reconciliation runbook (milestone 1 scope)

- `php artisan ledger:check` — prints debits/credits per currency; exits 1 if any currency is
  unbalanced. Run after every deploy and nightly (schedule in Phase 4).
- If unbalanced: freeze outgoing payouts, page on-call, export the offending transactions
  (`ledger_transactions` posted in the window), do **not** edit rows — post reason-coded reversals
  through the admin API once the cause is understood.
- Provider statement reconciliation lands with the first provider adapter (Phase 5).
