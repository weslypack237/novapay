import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; variant?: "gold" | "quiet" | "danger" };

export function Button({ loading, variant = "gold", children, className = "", disabled, ...rest }: Props) {
  const look = {
    gold: "btn-gold",
    quiet: "border border-line-strong hover:bg-elevated",
    danger: "border border-danger text-danger hover:bg-danger/10",
  }[variant];
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-[1.02rem] transition disabled:cursor-not-allowed disabled:opacity-60 ${look} ${className}`}
      {...rest}
    >
      {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
      {children}
    </button>
  );
}
