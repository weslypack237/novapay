# Delivery plan — what README §17 asks for before implementation

## Unconfirmed decisions (not invented in code)
| Decision | Placeholder in code | Who decides |
|---|---|---|
| Card issuer / programme manager | none — card screens show "not issued" | Founders + legal |
| Card network (Visa/Mastercard) | no logo anywhere | Issuer agreement |
| MTN / Orange aggregator vs direct | `MTN_*`, `ORANGE_*` env placeholders | Commercial |
| Licensing route in Cameroon / CEMAC (BEAC/COBAC) | site says "in development, not a licensed payment service" | Legal counsel |
| KYC provider | `KYC_*` placeholders; settings show "not started" | Compliance |
| Fee schedule & limits | none hard-coded; quote UI shows structure only | Finance + partners |
| USD wallets | `NOVAPAY_USD_ENABLED=false` | Issuer settlement currency |
| Phone-first vs email-first signup | email-first UI, API accepts either | Product |

## Prioritised MVP backlog
**Now — milestone 1 (this delivery)**
1. Monorepo, Docker, CI ✅
2. Schema + migrations: identity, RBAC, wallets, ledger, audit ✅
3. LedgerService with idempotency, reversal, row locks + DB guards ✅
4. Register / login / OTP / logout / logout-others API ✅
5. Landing, sign-in, register, verify, customer shell, admin shell, light/dark/system ✅

**Next — Phase 3–4**
6. Password reset (email OTP), MFA for staff
7. Device/session list UI
8. Maker/checker approval for reversals and adjustments
9. Fee rules + FX quote service with expiring quotes (`fee_rules`, `fx_quotes`)
10. Receipts (PDF) for posted transactions
11. Daily reconciliation report + exception queue

**Later — Phase 5–7** provider adapters (sandbox), deposits/withdrawals with holds, webhook
inbox, issuer adapter + card lifecycle, Business mode, notifications, Subscription Guardian.

## Sprint plan (2-week sprints)
| Sprint | Goal | Demo |
|---|---|---|
| S1 (done) | Foundation + ledger core | Register, verify, see derived balance; admin trial balance |
| S2 | Password reset, staff MFA, sessions UI, maker/checker | Ops reverses a posting with second approver |
| S3 | Fee & FX quote service, receipts, reconciliation job | Quote → confirm → receipt; daily rec report |
| S4 | Provider adapter interface + MTN sandbox collection | Sandbox top-up credits only on verified callback |
| S5 | Orange sandbox + withdrawals with holds/reversals | Failed payout releases hold |
| S6 | Issuer sandbox (once chosen) + card lifecycle | Create, freeze, limit a sandbox card |

## Top security risks to watch
1. Provider callbacks trusted without signature/status re-query → must re-query before crediting.
2. Admin over-privilege → maker/checker + staff MFA in S2.
3. Reconciliation gaps between provider reports and ledger → daily job + exception queue in S3.
4. Regulatory: operating before licence/partner approval → keep `demo_mode` and the site banner until counsel signs off.
