export type User = {
  id: string;
  email: string | null;
  phone: string | null;
  status: "pending_verification" | "active" | "restricted" | "suspended" | "closed";
  first_name: string | null;
  last_name: string | null;
  email_verified: boolean;
  phone_verified: boolean;
  roles: string[];
  is_staff: boolean;
  theme: "system" | "light" | "dark";
};

export type WalletAccount = {
  id: string;
  status: string;
  currency: string;
  exponent: number;
  available_minor: number;
  held_minor: number;
  pending_minor: number;
  ledger_minor: number;
};

export type Wallet = { id: string; status: string; accounts: WalletAccount[] };

export type LedgerLine = {
  id: string;
  reference: string;
  type: string;
  status: string;
  description: string | null;
  direction: "in" | "out";
  amount_minor: number;
  currency: string;
  is_simulated: boolean;
  is_reversal: boolean;
  posted_at: string | null;
};

export type Paginated<T> = { data: T[]; meta: { current_page: number; last_page: number; total: number } };

export type ApiError = { error: { code: string; message: string }; errors?: Record<string, string[]> };
