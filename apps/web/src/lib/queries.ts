"use client";
import { useQuery } from "@tanstack/react-query";
import { bff } from "./client";
import type { LedgerLine, Paginated, User, Wallet } from "./types";

export const useMe = () => useQuery({ queryKey: ["me"], queryFn: () => bff.get<{ data: User }>("me").then((r) => r.data) });

export const useWallets = () =>
  useQuery({ queryKey: ["wallets"], queryFn: () => bff.get<{ data: Wallet[]; demo_mode: boolean }>("wallets") });

export const useTransactions = (walletId: string | undefined, type?: string) =>
  useQuery({
    queryKey: ["transactions", walletId, type ?? "all"],
    enabled: !!walletId,
    queryFn: () => bff.get<Paginated<LedgerLine>>(`wallets/${walletId}/transactions${type ? `?type=${encodeURIComponent(type)}` : ""}`),
  });
