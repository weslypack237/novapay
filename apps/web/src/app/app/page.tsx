"use client";
import Link from "next/link";
import { BalancePanel } from "@/components/app/balance-panel";
import { PaymentCard } from "@/components/app/payment-card";
import { SectionHeader } from "@/components/app/rows";
import { ErrorState } from "@/components/app/states";
import { ThemePill } from "@/components/theme-switch";
import { TxRow } from "@/components/app/tx-row";
import { Notice } from "@/components/ui/notice";
import { bff } from "@/lib/client";
import { useCards } from "@/lib/cards";
import { useMe, useTransactions, useWallets } from "@/lib/queries";

export default function HomePage() {
  const me = useMe();
  const wallets = useWallets();
  const wallet = wallets.data?.data[0];
  const account = wallet?.accounts[0];
  const tx = useTransactions(wallet?.id);
  const cards = useCards();
  const card = cards.data?.[0];

  return (
    <div className="lg:grid lg:grid-cols-[1.1fr_1fr] lg:gap-8">
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-[1.6rem] leading-[1.2]">
            Welcome back,<br />
            {me.data?.first_name ?? <span className="skeleton inline-block h-7 w-28 align-middle" />} <span aria-hidden>👋</span>
          </h1>
          <ThemePill onChange={(t) => bff.patch("me/theme", { theme: t }).catch(() => null)} />
        </div>

        {me.data?.status === "pending_verification" && (
          <Notice tone="info">
            Confirm your email to activate your wallet. <Link href="/verify" className="font-medium text-gold-text underline underline-offset-4">Enter your code</Link>
          </Notice>
        )}

        {wallets.isError ? (
          <ErrorState error={wallets.error} onRetry={() => wallets.refetch()} />
        ) : (
          <BalancePanel account={account} lines={tx.data?.data} loading={wallets.isPending} />
        )}

        <section>
          <SectionHeader title="My Card" href="/app/cards" />
          {cards.isPending ? (
            <div className="skeleton aspect-[2.45] w-full rounded-[24px]" />
          ) : card ? (
            <Link href="/app/cards" aria-label={`Card ending ${card.last4}`} className="block">
              <PaymentCard wide last4={card.last4} frozen={card.status === "frozen"} tag={card.is_simulated ? "Demo" : undefined} />
            </Link>
          ) : (
            <Link href="/app/cards" className="block opacity-60">
              <PaymentCard wide tag="Not issued yet" />
            </Link>
          )}
        </section>
      </div>

      <section className="mt-6 lg:mt-[4.6rem]">
        <SectionHeader title="Recent Transactions" href="/app/history" />
        {tx.isPending ? (
          <div className="space-y-2.5">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-[72px] rounded-[20px]" />)}</div>
        ) : tx.isError ? (
          <ErrorState error={tx.error} onRetry={() => tx.refetch()} />
        ) : tx.data?.data.length ? (
          <ul className="space-y-2.5">{tx.data.data.slice(0, 5).map((l) => <TxRow key={l.id} line={l} />)}</ul>
        ) : (
          <p className="tile rounded-[20px] px-5 py-10 text-center text-muted">No transactions yet. Your first top-up will show here.</p>
        )}
      </section>
    </div>
  );
}
