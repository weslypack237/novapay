"use client";
import { Landmark, Smartphone } from "lucide-react";
import { createContext, useContext, useState } from "react";
import { Sheet } from "./sheet";

/**
 * Money-movement actions open here. Until a provider is connected they say so plainly
 * instead of pretending to work (README §2, §14).
 */
const FEATURES = {
  "add-money": { title: "Add money", body: "Top up your wallet in FCFA from Mobile Money. Your balance changes only after the provider confirms the payment.", methods: true },
  send: { title: "Send money", body: "Send FCFA instantly to another NovaPay user by phone number or email." },
  exchange: { title: "Exchange", body: "Convert between currencies at a rate locked for the life of your quote, with every fee shown first." },
  withdraw: { title: "Withdraw", body: "Send eligible funds to a verified Mobile Money number or bank account. Funds are held, not spent, until the payout is final.", methods: true },
  request: { title: "Request money", body: "Share a link or QR code so anyone with NovaPay can pay you." },
  "card-details": { title: "Card details", body: "Full card number and security code are shown only inside our card issuer's secure window. NovaPay never stores them." },
  "card-limits": { title: "Card limits", body: "Set a spending limit per card for each day, month or payment." },
  "card-settings": { title: "Card settings", body: "Choose where each card works: online, international merchants, recurring payments." },
  "virtual-card": { title: "Virtual card", body: "Create a card for one purpose — a course, an ad account, a subscription — and give it its own limit." },
} as const;
export type FeatureKey = keyof typeof FEATURES;

const Ctx = createContext<(k: FeatureKey) => void>(() => {});
export const useFeature = () => useContext(Ctx);

export function FeatureProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState<FeatureKey | null>(null);
  const f = open ? FEATURES[open] : null;
  return (
    <Ctx value={setOpen}>
      {children}
      <Sheet open={!!f} onClose={() => setOpen(null)} title={f?.title ?? ""}>
        {f && (
          <div className="space-y-4">
            <p className="text-muted">{f.body}</p>
            {"methods" in f && (
              <ul className="space-y-2">
                {[{ Icon: Smartphone, name: "MTN Mobile Money" }, { Icon: Smartphone, name: "Orange Money" }, { Icon: Landmark, name: "Bank transfer" }].map(({ Icon, name }) => (
                  <li key={name} className="tile flex items-center gap-3 rounded-[16px] px-4 py-3 opacity-70">
                    <span className="tile-icon grid size-9 place-items-center rounded-[10px]"><Icon size={17} aria-hidden /></span>
                    <span className="flex-1 font-medium">{name}</span>
                    <span className="text-[0.82rem] text-muted">Not connected yet</span>
                  </li>
                ))}
              </ul>
            )}
            <p className="rounded-[14px] border border-line bg-sunken px-4 py-3 text-[0.9rem] text-muted">
              This opens once our payment partners are live. Nothing has been charged or moved.
            </p>
          </div>
        )}
      </Sheet>
    </Ctx>
  );
}
