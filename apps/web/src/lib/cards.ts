"use client";
import { useQuery } from "@tanstack/react-query";
import { RequestError, bff } from "./client";

export type Card = {
  id: string;
  last4: string;
  status: "active" | "frozen" | "terminated";
  type: "virtual";
  holder: string;
  currency: string;
  is_simulated: boolean;
};

/** Cards come from the issuer integration (Phase 6). Until then the API has no cards: show none. */
export const useCards = () =>
  useQuery({
    queryKey: ["cards"],
    queryFn: async () => {
      try {
        return (await bff.get<{ data: Card[] }>("cards")).data;
      } catch (e) {
        if (e instanceof RequestError && e.status === 404) return [] as Card[];
        throw e;
      }
    },
  });

/**
 * The card network mark (e.g. VISA) is shown only once a programme agreement allows it.
 * Set NEXT_PUBLIC_CARD_NETWORK=visa (or mastercard) at that point.
 */
export const CARD_NETWORK = (process.env.NEXT_PUBLIC_CARD_NETWORK ?? "").toLowerCase();
