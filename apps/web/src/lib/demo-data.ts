import type { LedgerLine, User } from "./types";

/**
 * Fixture data for local/demo mode ONLY. Every value here is fictional and every
 * transaction is flagged is_simulated so the UI labels it. Never real money.
 */
export const DEMO_TOKEN = "demo-session";
export const DEMO_PASSWORD = "Demo-Passw0rd!";

const base: Omit<User, "id" | "email" | "first_name" | "roles" | "is_staff"> = {
  phone: null, status: "active", last_name: "Demo", email_verified: true, phone_verified: false, theme: "system",
};

export const DEMO_USERS: Record<string, User> = {
  "demo.customer@novapay.local": { ...base, id: "d-cust", email: "demo.customer@novapay.local", first_name: "Amara", roles: ["customer"], is_staff: false },
  "demo.admin@novapay.local": { ...base, id: "d-admin", email: "demo.admin@novapay.local", first_name: "Super", roles: ["super_admin"], is_staff: true },
};

const tx = (i: number, type: string, description: string, direction: "in" | "out", amount: number, daysAgo: number, extra: Partial<LedgerLine> = {}): LedgerLine => ({
  id: `demo-${i}`,
  reference: `NP2611${String(10 - i).padStart(2, "0")}-DEMO${String(i).padStart(5, "0")}`,
  type, description, direction, amount_minor: amount, currency: "XAF", status: "posted",
  is_simulated: true, is_reversal: false,
  posted_at: new Date(Date.UTC(2026, 10, 2, 9, 30) - daysAgo * 86_400_000).toISOString(),
  ...extra,
});
// Sorted newest first. Card payment (tx 5) is simulated card spend for the demo card.

export const DEMO_LINES: LedgerLine[] = [
  tx(5, "card_payment", "Card payment", "out", 6_500, 0, { description: "Lumen Academy", posted_at: new Date(Date.UTC(2026, 10, 2, 15, 24)).toISOString() }),
  tx(1, "demo_credit", "Top-up", "in", 75_500, 0, { description: "MTN Mobile Money" }),
  tx(2, "reversal", "Duplicate top-up reversed", "out", 20_000, 1, { is_reversal: true }),
  tx(3, "demo_credit", "Top-up", "in", 20_000, 1, { description: "MTN Mobile Money" }),
  tx(4, "demo_credit", "Top-up", "in", 250_000, 3, { description: "Orange Money" }),
];

export function demoResponse(path: string, user: User): unknown {
  const available = DEMO_LINES.reduce((s, l) => s + (l.direction === "in" ? l.amount_minor : -l.amount_minor), 0);
  switch (path) {
    case "me":
      return { data: user };
    case "wallets":
      return {
        demo_mode: true,
        data: [{ id: "00000000-0000-4000-8000-000000000001", status: "active", accounts: [
          { id: "wa-xaf", status: "active", currency: "XAF", exponent: 0, available_minor: available, held_minor: 0, pending_minor: 0, ledger_minor: available },
        ] }],
      };
    case "wallets/00000000-0000-4000-8000-000000000001/transactions":
      return { data: DEMO_LINES, meta: { current_page: 1, last_page: 1, total: DEMO_LINES.length } };
    case "cards":
      // Simulated card so the card screens can be reviewed. Not issued by any issuer.
      return { data: [{ id: "demo-card-1", last4: "4587", status: "active", type: "virtual", holder: `${user.first_name} ${user.last_name}`, currency: "XAF", is_simulated: true }] };
    case "admin/overview":
      return { data: {
        users: { total: 3, by_status: { active: 3 } },
        ledger: { transactions_24h: 2, trial_balance: { XAF: { debits: 372_000, credits: 372_000, balanced: true } } },
        audit_events_24h: 9, providers: [],
      } };
    case "admin/users":
      return { data: Object.values(DEMO_USERS).map((u) => ({
        id: u.id, name: `${u.first_name} ${u.last_name}`, email: u.email, phone: null, status: u.status,
        roles: u.roles, created_at: "2026-10-28T08:00:00Z", last_login_at: "2026-11-02T08:12:00Z",
      })), meta: { current_page: 1, last_page: 1, total: 2 } };
    case "admin/audit-logs":
      return { data: [
        { id: "a1", action: "admin.ledger.reversal", actor: "demo.ops@novapay.local", resource: "ledger_transaction:demo-3", reason: "Provider confirmed duplicate callback", ip_address: "127.0.0.1", request_id: "req-demo-0003", metadata: { reason_code: "duplicate_credit" }, created_at: "2026-11-01T10:04:00Z" },
        { id: "a2", action: "auth.login", actor: "demo.customer@novapay.local", resource: "user:d-cust", reason: null, ip_address: "127.0.0.1", request_id: "req-demo-0002", metadata: null, created_at: "2026-11-02T08:12:00Z" },
        { id: "a3", action: "user.registered", actor: "demo.customer@novapay.local", resource: "user:d-cust", reason: null, ip_address: "127.0.0.1", request_id: "req-demo-0001", metadata: null, created_at: "2026-10-28T08:00:00Z" },
      ], meta: { current_page: 1, last_page: 1, total: 3 } };
    default:
      return null;
  }
}
