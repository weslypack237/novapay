"use client";
import { CreditCard, Gauge, Info, Settings2, Snowflake, Upload } from "lucide-react";
import { useState } from "react";
import { useFeature } from "@/components/app/features";
import { PaymentCard } from "@/components/app/payment-card";
import { ListRow } from "@/components/app/rows";
import { useCards } from "@/lib/cards";

function Btn({ label, Icon, onClick, disabled, pressed }: { label: string; Icon: typeof Upload; onClick: () => void; disabled?: boolean; pressed?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-pressed={pressed}
      className={`flex flex-col items-center gap-1.5 rounded-[20px] py-3.5 text-[0.86rem] font-medium disabled:opacity-45 ${pressed ? "nav-active" : "tile"}`}>
      <Icon size={21} strokeWidth={1.8} aria-hidden /> {label}
    </button>
  );
}

export default function CardsPage() {
  const cards = useCards();
  const open = useFeature();
  const card = cards.data?.[0];
  // Demo cards freeze locally. Real freezes call the issuer API (Phase 6).
  const [frozen, setFrozen] = useState(false);
  const isFrozen = frozen || card?.status === "frozen";

  return (
    <div className="mx-auto max-w-xl space-y-5">
      {cards.isPending ? (
        <div className="skeleton aspect-[1.75] rounded-[24px]" />
      ) : card ? (
        <PaymentCard last4={card.last4} frozen={isFrozen} tag={card.is_simulated ? "Demo card" : undefined} />
      ) : (
        <div className="opacity-60"><PaymentCard tag="Not issued yet" /></div>
      )}

      {!card && !cards.isPending && (
        <p className="flex items-start gap-2 text-[0.92rem] text-muted">
          <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
          Virtual cards open after identity verification, once our card issuer is confirmed.
        </p>
      )}
      {card?.is_simulated && isFrozen && <p className="text-center text-[0.9rem] text-muted" aria-live="polite">Card frozen. New payments would be declined until you unfreeze it.</p>}

      <div className="grid grid-cols-3 gap-2.5">
        <Btn label="Top Up" Icon={Upload} onClick={() => open("add-money")} />
        <Btn label={isFrozen ? "Unfreeze" : "Freeze"} Icon={Snowflake} disabled={!card} pressed={isFrozen} onClick={() => setFrozen((f) => !f)} />
        <Btn label="Details" Icon={Info} disabled={!card} onClick={() => open("card-details")} />
      </div>

      <div className="space-y-2.5">
        <ListRow Icon={CreditCard} title="Virtual Card" subtitle="Instant global card" onClick={() => open("virtual-card")} />
        <ListRow Icon={Gauge} title="Card Limits" subtitle="Set spending limits" onClick={() => open("card-limits")} />
        <ListRow Icon={Settings2} title="Card Settings" subtitle="Manage your card" onClick={() => open("card-settings")} />
      </div>
    </div>
  );
}
