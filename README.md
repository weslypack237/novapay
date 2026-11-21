# NovaPay

Wallet, virtual-card and payments platform for Cameroon. This repository holds **milestone 1** from
the product README: foundation, identity, RBAC, the double-entry ledger, and the public site,
customer shell and admin shell. **No live payments or cards are connected.**

```
novapay/
├── apps/web/        Next.js 16 (React 19, TypeScript, Tailwind 4, TanStack Query, RHF + Zod)
├── backend/         Laravel 12 API (Sanctum, PostgreSQL, Redis)
├── docs/            architecture, ERD, ADRs, OpenAPI, threat model, delivery plan
├── infrastructure/  Dockerfiles
├── scripts/         container entrypoints
└── docker-compose.yml
```

## Quick look in VS Code (Live Server)
1. Open the `novapay` folder in VS Code.
2. Click **Go Live** (bottom right). It opens http://127.0.0.1:5500 — the `preview` folder.
3. Sign in with `demo.customer@novapay.local` or `demo.admin@novapay.local`, password `Demo-Passw0rd!`.

`preview/` is plain HTML/CSS/JS generated from `apps/web` with demo data built in. It has no
database or backend, so registering and moving money are disabled. Don't edit files in `preview/`;
edit `apps/web` and regenerate with `node scripts/build-preview.mjs`.

## Run it

### Everything in Docker
```bash
cp .env.example .env          # set DB_PASSWORD
docker compose up --build
```
- Web: http://localhost:3000 — API: http://localhost:8000/api/v1/health
- The API container installs Composer packages, migrates, seeds roles and demo accounts, and runs
  `ledger:check` before serving.

Demo accounts (local only, password `Demo-Passw0rd!`):
`demo.customer@novapay.local`, `demo.ops@novapay.local`, `demo.admin@novapay.local`.
Their balances are simulated, flagged `is_simulated`, and labelled in the UI.

### Without Docker
```bash
# API
cd backend && composer install && cp .env.example .env && php artisan key:generate
# set DB_* for your Postgres, then:
php artisan migrate --seed && php artisan serve

# Web
cd apps/web && npm install && cp .env.example .env.local && npm run dev
```

### Frontend only
With `NOVAPAY_DEMO_MODE=true` and no API running, the web app serves labelled fixture data so you
can review every screen. Sign in with a demo account above.

## Tests
```bash
cd backend && php artisan test                         # SQLite, fast
DB_CONNECTION=pgsql DB_DATABASE=novapay_test php artisan test   # adds Postgres trigger tests
cd apps/web && npm run lint && npm run build
```

What the backend tests prove: balanced postings only; per-currency balancing; positive amounts;
idempotent replays and key-reuse conflicts; no overspend; reversals are compensating and one-shot;
entries and transactions immutable; auth, OTP, rate limits, suspended accounts; RBAC per role;
status changes need a reason and are audited; no route edits a balance; wallets are owner-scoped.

## Where to start reading
- `backend/app/Services/Ledger/LedgerService.php` — the only code that moves value
- `backend/database/migrations/*_create_wallet_and_ledger_tables.php` — schema + Postgres guards
- `apps/web/src/app/api/` — the BFF that keeps tokens out of the browser
- `docs/delivery-plan.md` — open decisions, backlog, sprint plan, top risks
