import { ArrowDownLeft, RotateCcw } from "lucide-react";
import { CURRENCY_LABEL, formatMoney } from "@/lib/money";
import type { LedgerLine } from "@/lib/types";

const TYPE_LABEL: Record<string, string> = {
  demo_credit: "Top-up",
  deposit: "Top-up",
  withdrawal: "Withdrawal",
  reversal: "Reversal",
  fee: "Fee",
  card_payment: "Payment",
};

// Stable colour per merchant name for the initial avatar (no third-party logos).
const HUES = ["#1fb5a3", "#6d7cff", "#e2695a", "#d79a2b", "#3fae5a", "#b46ad8"];
const hue = (s: string) => HUES[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length];

export function when(iso: string | null) {
  if (!iso) return "Pending";
  const d = new Date(iso);
  const now = new Date();
  const time = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" }).format(d);
  const sameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const yesterday = new Date(now.getTime() - 86_400_000);
  if (sameDay(d, now)) return `Today, ${time}`;
  if (sameDay(d, yesterday)) return `Yesterday, ${time}`;
  return `${new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short" }).format(d)}, ${time}`;
}

function Mark({ line }: { line: LedgerLine }) {
  if (line.is_reversal) return <span className="tile-icon grid size-11 place-items-center rounded-full"><RotateCcw size={19} aria-hidden /></span>;
  if (line.direction === "in") return <span className="grid size-11 place-items-center rounded-full bg-success/15 text-success"><ArrowDownLeft size={20} aria-hidden /></span>;
  const name = line.description ?? "?";
  return <span className="grid size-11 place-items-center rounded-full text-lg font-semibold text-white" style={{ background: hue(name) }} aria-hidden>{name[0]}</span>;
}

/** Transaction tile from the mockup: avatar, title + type, signed amount + time. */
export function TxRow({ line }: { line: LedgerLine }) {
  const title = line.description ?? TYPE_LABEL[line.type] ?? line.type;
  const signed = line.direction === "in" ? line.amount_minor : -line.amount_minor;
  return (
    <li className="tile flex items-center gap-3 rounded-[20px] px-4 py-3">
      <Mark line={line} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{title}</p>
        <p className="flex items-center gap-2 text-[0.88rem] text-muted">
          {TYPE_LABEL[line.type] ?? line.type}
          {line.is_simulated && <span className="rounded-full border border-warning/40 px-1.5 text-[0.7rem] text-warning">Simulated</span>}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className={`figure font-semibold ${line.direction === "in" ? "text-success" : ""}`}>
          {formatMoney(signed, line.currency, { sign: true })} <span className="text-[0.8rem] font-normal text-muted">{CURRENCY_LABEL[line.currency] ?? line.currency}</span>
        </p>
        <p className="text-[0.82rem] text-muted" suppressHydrationWarning>{when(line.posted_at)}</p>
      </div>
    </li>
  );
}
