"use client";
import { useState } from "react";
import { ErrorState } from "@/components/app/states";
import { TxRow } from "@/components/app/tx-row";
import { useTransactions, useWallets } from "@/lib/queries";

const FILTERS = [
  { value: "", label: "All" },
  { value: "deposit", label: "Top-ups" },
  { value: "card_payment", label: "Payments" },
  { value: "withdrawal", label: "Withdrawals" },
  { value: "reversal", label: "Reversals" },
];

export default function HistoryPage() {
  const [type, setType] = useState("");
  const wallets = useWallets();
  const wallet = wallets.data?.data[0];
  const tx = useTransactions(wallet?.id, type || undefined);
  const demo = wallets.data?.demo_mode;
  const lines = (tx.data?.data ?? []).filter((l) => !demo || !type || l.type === type || (type === "deposit" && l.type === "demo_credit"));

  return (
    <div className="mx-auto max-w-xl">
      <div role="tablist" aria-label="Filter" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {FILTERS.map((f) => (
          <button key={f.label} role="tab" aria-selected={type === f.value} onClick={() => setType(f.value)}
            className={`shrink-0 rounded-full px-4 py-2 text-[0.92rem] font-medium ${type === f.value ? "nav-active" : "tile text-muted"}`}>
            {f.label}
          </button>
        ))}
      </div>
      <div className="mt-5">
        {tx.isPending ? (
          <div className="space-y-2.5">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-[72px] rounded-[20px]" />)}</div>
        ) : tx.isError ? (
          <ErrorState error={tx.error} onRetry={() => tx.refetch()} />
        ) : lines.length ? (
          <ul className="space-y-2.5">{lines.map((l) => <TxRow key={l.id} line={l} />)}</ul>
        ) : (
          <p className="tile rounded-[20px] px-5 py-10 text-center text-muted">Nothing here yet.</p>
        )}
      </div>
      <p className="mt-6 text-center text-[0.85rem] text-faint">Every entry comes from the NovaPay ledger. Corrections appear as separate reversals.</p>
    </div>
  );
}
