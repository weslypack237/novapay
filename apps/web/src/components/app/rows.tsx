import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

type RowProps = { Icon: LucideIcon; title: string; subtitle?: string; value?: string; href?: string; onClick?: () => void; plainIcon?: boolean };

/** List row from the mockup: icon tile, title + subtitle, chevron (or a value like "Dark"). */
export function ListRow({ Icon, title, subtitle, value, href, onClick, plainIcon = false }: RowProps) {
  const inner = (
    <>
      <span className={`grid size-10 shrink-0 place-items-center rounded-[12px] ${plainIcon ? "text-fg" : "tile-icon"}`}>
        <Icon size={19} strokeWidth={1.8} aria-hidden />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className="block font-semibold">{title}</span>
        {subtitle && <span className="block text-[0.86rem] text-muted">{subtitle}</span>}
      </span>
      {value && <span className="text-[0.95rem] text-muted">{value}</span>}
      <ChevronRight size={18} className="text-muted" aria-hidden />
    </>
  );
  const cls = "tile flex w-full items-center gap-3.5 rounded-[18px] px-4 py-3.5 transition-colors hover:border-line-strong";
  return href ? <Link href={href} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

/** Grouped rows inside one panel (Account screen style). */
export function RowGroup({ children }: { children: React.ReactNode }) {
  return <div className="tile divide-y divide-line overflow-hidden rounded-[20px] [&>*]:rounded-none [&>*]:border-0 [&>*]:bg-transparent">{children}</div>;
}

export function SectionHeader({ title, href, linkLabel = "See All" }: { title: string; href?: string; linkLabel?: string }) {
  return (
    <div className="mb-2.5 flex items-baseline justify-between">
      <h2 className="text-[1.3rem]">{title}</h2>
      {href && <Link href={href} className="text-[0.95rem] font-medium text-gold-text hover:underline">{linkLabel}</Link>}
    </div>
  );
}
