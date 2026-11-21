"use client";
import { ArrowDown, ArrowUp, CreditCard, Eye, EyeOff, Plus, Send, ArrowLeftRight } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { LogoMark } from "@/components/logo";
import { CURRENCY_LABEL, formatMoney } from "@/lib/money";
import type { LedgerLine, WalletAccount } from "@/lib/types";
import { CountUp } from "./count-up";
import { useFeature } from "./features";

const HIDE_KEY = "np-hide-balance";
const sub = (cb: () => void) => { window.addEventListener("np-hide", cb); return () => window.removeEventListener("np-hide", cb); };
const read = () => { try { return localStorage.getItem(HIDE_KEY) === "1"; } catch { return false; } };
function toggleHidden() {
  try { localStorage.setItem(HIDE_KEY, read() ? "0" : "1"); } catch {}
  window.dispatchEvent(new Event("np-hide"));
}

function todayNet(lines: LedgerLine[] | undefined) {
  if (!lines) return null;
  const today = new Date().toDateString();
  const todays = lines.filter((l) => l.posted_at && new Date(l.posted_at).toDateString() === today);
  if (!todays.length) return 0;
  return todays.reduce((s, l) => s + (l.direction === "in" ? l.amount_minor : -l.amount_minor), 0);
}

function Action({ label, Icon, gold, onClick, href }: { label: string; Icon: typeof Plus; gold?: boolean; onClick?: () => void; href?: string }) {
  const cls = `flex flex-col items-center justify-center gap-1 whitespace-nowrap h-[76px] rounded-[18px] px-1 text-[0.76rem] font-medium transition-transform active:scale-[0.97] ${gold ? "gold-tile" : "tile"}`;
  const inner = (<><Icon size={22} strokeWidth={gold ? 1.7 : 1.8} aria-hidden />{label}</>);
  return href ? <Link href={href} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

export function BalancePanel({ account, lines, loading }: { account?: WalletAccount; lines?: LedgerLine[]; loading: boolean }) {
  const hidden = useSyncExternalStore(sub, read, () => false);
  const open = useFeature();
  const net = todayNet(lines);
  const ccy = account?.currency ?? "XAF";

  return (
    <section aria-labelledby="bal" className="glass glass-rim relative overflow-hidden rounded-[28px] p-5">
      <div aria-hidden className="watermark pointer-events-none absolute -right-4 top-6">
        <LogoMark size={150} />
      </div>
      <div className="relative">
        <h2 id="bal" className="flex items-center gap-2 font-sans text-[0.95rem] font-medium">
          Total Balance
          <button onClick={toggleHidden} aria-label={hidden ? "Show balance" : "Hide balance"} aria-pressed={hidden} className="rounded-full p-1 hover:text-fg">
            {hidden ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        </h2>
        {loading ? (
          <div className="skeleton mt-3 h-12 w-56" />
        ) : (
          <p className="display figure mt-1 text-[clamp(2.2rem,9vw,2.9rem)] font-bold leading-[1.1]">
            {hidden ? "••••••" : account ? <CountUp value={account.available_minor} currency={ccy} /> : "0"}
            <span className="ml-2 font-sans text-[0.4em] font-medium text-muted">{CURRENCY_LABEL[ccy]}</span>
          </p>
        )}
        <p className="mt-2 flex items-center gap-1.5 text-[0.95rem]">
          {net === null ? (
            <span className="skeleton inline-block h-4 w-32" />
          ) : net === 0 ? (
            <span className="text-muted">No activity today</span>
          ) : (
            <>
              <span className={`inline-flex items-center gap-1 font-medium ${net > 0 ? "text-success" : "text-danger"}`}>
                {net > 0 ? <ArrowUp size={16} aria-hidden /> : <ArrowDown size={16} aria-hidden />}
                {hidden ? "••••" : formatMoney(net, ccy, { sign: true })}
              </span>
              <span className="text-muted">Today</span>
            </>
          )}
        </p>

        <div className="mt-5 grid grid-cols-4 gap-2">
          <Action label="Add Money" Icon={Plus} gold onClick={() => open("add-money")} />
          <Action label="Send" Icon={Send} onClick={() => open("send")} />
          <Action label="Exchange" Icon={ArrowLeftRight} onClick={() => open("exchange")} />
          <Action label="Cards" Icon={CreditCard} href="/app/cards" />
        </div>
      </div>
    </section>
  );
}
