import { Snowflake } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { CARD_NETWORK } from "@/lib/cards";

type Props = {
  last4?: string;
  holder?: string;
  frozen?: boolean;
  tag?: string; // e.g. "Demo card" / "Not issued"
  wide?: boolean; // slim home-screen variant
  className?: string;
};

function Contactless() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden className="opacity-80">
      <path d="M8.5 8.5a5 5 0 0 1 0 7" /><path d="M12 6a8.5 8.5 0 0 1 0 12" /><path d="M15.5 3.5a12 12 0 0 1 0 17" />
    </svg>
  );
}

function NetworkMark() {
  if (CARD_NETWORK === "visa") return <span className="text-[1.6rem] font-black italic tracking-tight">VISA</span>;
  if (CARD_NETWORK === "mastercard") return <span className="text-sm font-semibold">mastercard</span>;
  return null; // no network branding until authorised (README §4.5, §14)
}

/** Card face matching the mockup: dark smoked glass in dark theme, gold metal in light. */
export function PaymentCard({ last4 = "0000", holder, frozen = false, tag, wide = false, className = "" }: Props) {
  return (
    <div data-frozen={frozen} className={`card-face relative w-full overflow-hidden rounded-[24px] px-[6%] py-[5%] transition-[filter] duration-300 ${wide ? "aspect-[2.45]" : "aspect-[1.75]"} ${className}`}>
      <div aria-hidden className="card-sheen pointer-events-none absolute inset-0" />
      <div className="relative flex items-start justify-between">
        <span className="inline-flex items-center gap-1.5">
          <LogoMark size={wide ? 28 : 32} />
          <span className="wordmark text-[1.15rem]">
            <span>Nova</span><span style={{ color: "var(--card-accent)" }}>Pay</span>
          </span>
        </span>
        <span className="flex items-center gap-2">
          {tag && <span className="rounded-full border border-current/25 px-2 py-0.5 text-[0.66rem] opacity-75">{tag}</span>}
          <Contactless />
        </span>
      </div>
      <div className={`absolute inset-x-[6%] flex items-end justify-between gap-3 ${wide ? "bottom-[16%]" : "bottom-[11%]"}`}>
        <div className="min-w-0">
          <p className="figure text-[1.15rem] font-medium tracking-[0.06em]">
            <span className="tracking-[0.25em]">••••</span> {last4}
          </p>
          {holder && <p className="mt-1 truncate text-[0.72rem] uppercase tracking-[0.12em] opacity-70">{holder}</p>}
        </div>
        <NetworkMark />
      </div>
      {frozen && (
        <div className="absolute inset-0 grid place-items-center bg-black/25">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/65 px-3 py-1 text-sm text-white"><Snowflake size={14} aria-hidden /> Frozen</span>
        </div>
      )}
    </div>
  );
}
