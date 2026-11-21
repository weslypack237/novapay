/** Money arrives as integer minor units + currency. Formatting only — never arithmetic on floats. */
const EXPONENT: Record<string, number> = { XAF: 0, USD: 2 };

export function formatMoney(amountMinor: number, currency: string, opts: { sign?: boolean } = {}) {
  const exp = EXPONENT[currency] ?? 2;
  const negative = amountMinor < 0;
  const digits = String(Math.abs(Math.trunc(amountMinor))).padStart(exp + 1, "0");
  const major = exp ? digits.slice(0, -exp) : digits;
  const minor = exp ? digits.slice(-exp) : "";
  const grouped = major.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  const sign = negative ? "−" : opts.sign ? "+" : "";
  return `${sign}${grouped}${minor ? "." + minor : ""}`;
}

export const CURRENCY_LABEL: Record<string, string> = { XAF: "FCFA", USD: "USD" };
