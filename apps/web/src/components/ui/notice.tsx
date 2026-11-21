import { AlertCircle, CheckCircle2, FlaskConical, Info } from "lucide-react";

const TONES = {
  error: { Icon: AlertCircle, cls: "border-danger/40 text-danger" },
  success: { Icon: CheckCircle2, cls: "border-success/40 text-success" },
  info: { Icon: Info, cls: "border-line-strong text-muted" },
  demo: { Icon: FlaskConical, cls: "border-warning/50 text-warning" },
};

/** Status is always icon + text, never colour alone. */
export function Notice({ tone = "info", children }: { tone?: keyof typeof TONES; children: React.ReactNode }) {
  const { Icon, cls } = TONES[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-2.5 rounded-[12px] border bg-surface px-4 py-3 text-[0.98rem] ${cls}`}>
      <Icon size={18} className="mt-[3px] shrink-0" aria-hidden />
      <div className="text-fg">{children}</div>
    </div>
  );
}
