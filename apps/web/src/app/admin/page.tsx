"use client";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { ErrorState } from "@/components/app/states";
import { bff } from "@/lib/client";
import { formatMoney } from "@/lib/money";

type Overview = {
  users: { total: number; by_status: Record<string, number> };
  ledger: { transactions_24h: number; trial_balance: Record<string, { debits: number; credits: number; balanced: boolean }> };
  audit_events_24h: number;
  providers: unknown[];
};

export default function AdminOverview() {
  const q = useQuery({ queryKey: ["admin-overview"], queryFn: () => bff.get<{ data: Overview }>("admin/overview").then((r) => r.data) });

  if (q.isError) return <ErrorState error={q.error} onRetry={() => q.refetch()} />;
  const d = q.data;
  const balances = d ? Object.entries(d.ledger.trial_balance) : [];
  const allBalanced = balances.every(([, b]) => b.balanced);

  return (
    <div className="space-y-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[clamp(2rem,4vw,2.8rem)]">Overview</h1>
        {d && (
          <p className={`flex items-center gap-2 ${allBalanced ? "text-success" : "text-danger"}`}>
            {allBalanced ? <CheckCircle2 size={18} aria-hidden /> : <XCircle size={18} aria-hidden />}
            {allBalanced ? "Ledger balanced in every currency" : "Ledger imbalance — investigate now"}
          </p>
        )}
      </div>

      {/* Figures in a single strip, separated by rules — not a row of identical cards. */}
      <dl className="glass grid divide-line rounded-[26px] px-6 sm:grid-cols-3 sm:divide-x">
        {[
          ["Registered users", d?.users.total],
          ["Ledger postings, last 24h", d?.ledger.transactions_24h],
          ["Audit events, last 24h", d?.audit_events_24h],
        ].map(([label, value]) => (
          <div key={label as string} className="py-6 sm:px-6 first:sm:pl-0">
            <dt className="text-muted">{label}</dt>
            <dd className="display figure mt-1 text-[2.6rem] font-bold leading-tight">{value ?? <span className="skeleton inline-block h-10 w-16" />}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section className="glass rounded-[26px] p-7">
          <h2 className="text-xl">Trial balance</h2>
          <p className="mt-1 text-[0.95rem] text-muted">Total debits must equal total credits in each currency. Postgres rejects any posting that breaks this.</p>
          <table className="figure mt-5 w-full text-left">
            <thead className="text-[0.92rem] text-faint">
              <tr><th className="py-2 font-normal">Currency</th><th className="py-2 text-right font-normal">Debits</th><th className="py-2 text-right font-normal">Credits</th><th className="py-2 text-right font-normal">State</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {balances.map(([ccy, b]) => (
                <tr key={ccy}>
                  <td className="py-3">{ccy}</td>
                  <td className="py-3 text-right">{formatMoney(b.debits, ccy)}</td>
                  <td className="py-3 text-right">{formatMoney(b.credits, ccy)}</td>
                  <td className={`py-3 text-right ${b.balanced ? "text-success" : "text-danger"}`}>{b.balanced ? "Balanced" : "Off"}</td>
                </tr>
              ))}
              {d && balances.length === 0 && <tr><td colSpan={4} className="py-6 text-center text-muted">No postings yet.</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="glass rounded-[26px] p-7">
          <h2 className="text-xl">Accounts by status</h2>
          <ul className="mt-4 divide-y divide-line">
            {d && Object.entries(d.users.by_status).map(([status, n]) => (
              <li key={status} className="flex justify-between py-2.5"><span className="capitalize">{status.replaceAll("_", " ")}</span><span className="figure">{n}</span></li>
            ))}
          </ul>
          <h2 className="mt-8 text-xl">Providers</h2>
          <p className="mt-1 text-muted">No payment, card or identity provider is connected yet. Health and webhook backlog will show here.</p>
        </section>
      </div>
    </div>
  );
}
