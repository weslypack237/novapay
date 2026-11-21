"use client";
import { useState } from "react";
import { PaymentCard } from "@/components/app/payment-card";

function Row({ label, hint, on, set, disabled }: { label: string; hint: string; on: boolean; set: (v: boolean) => void; disabled?: boolean }) {
  return (
    <label className={`flex items-center justify-between gap-6 border-b border-line py-4 last:border-0 ${disabled ? "opacity-45" : ""}`}>
      <span>
        <span className="block font-semibold">{label}</span>
        <span className="block text-[0.95rem] text-muted">{hint}</span>
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={disabled}
        onClick={() => set(!on)}
        className={`relative h-7 w-12 shrink-0 rounded-full border transition-colors ${on ? "border-transparent nav-active" : "border-line-strong bg-sunken"}`}
      >
        <span className={`absolute left-0 top-[2px] size-[22px] rounded-full bg-white shadow transition-transform ${on ? "translate-x-[22px]" : "translate-x-[2px]"}`} />
      </button>
    </label>
  );
}

/** The landing page's one interactive moment: controls do what they say, instantly. */
export function FreezeDemo() {
  const [frozen, setFrozen] = useState(false);
  const [online, setOnline] = useState(true);
  const [intl, setIntl] = useState(true);

  return (
    <div className="grid items-center gap-10 md:grid-cols-[1fr_1.05fr] md:gap-16">
      <div className="mx-auto w-full max-w-[420px]">
        <PaymentCard frozen={frozen} last4="4587" tag="Preview" />
        <p className="mt-4 text-center text-[0.95rem] text-muted" aria-live="polite">
          {frozen ? "Card frozen. New payments will be declined until you unfreeze it." : !online ? "Online payments paused." : "Card active."}
        </p>
      </div>
      <div className="glass rounded-[26px] px-6 py-2">
        <Row label="Freeze card" hint="Stop new payments in one tap. Undo any time." on={frozen} set={setFrozen} />
        <Row label="Online payments" hint="Allow subscriptions and checkout on the web." on={online} set={setOnline} disabled={frozen} />
        <Row label="International merchants" hint="Allow merchants outside Cameroon." on={intl} set={setIntl} disabled={frozen || !online} />
        <p className="pb-4 pt-1 text-sm text-faint">Preview only. Live controls depend on what the card issuer supports.</p>
      </div>
    </div>
  );
}
