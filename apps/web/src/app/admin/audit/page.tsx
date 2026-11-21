"use client";
import { useQuery } from "@tanstack/react-query";
import { ErrorState, SkeletonRows } from "@/components/app/states";
import { bff } from "@/lib/client";
import type { Paginated } from "@/lib/types";

type Log = { id: string; action: string; actor: string; resource: string | null; reason: string | null; ip_address: string | null; request_id: string | null; created_at: string };

const fmt = (iso: string) => new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short" }).format(new Date(iso));

export default function AuditPage() {
  const logs = useQuery({ queryKey: ["audit"], queryFn: () => bff.get<Paginated<Log>>("admin/audit-logs") });

  return (
    <div>
      <h1 className="text-[clamp(2rem,4vw,2.8rem)]">Audit log</h1>
      <p className="mt-2 max-w-[60ch] text-muted">Append-only. Entries can’t be edited or deleted, including by administrators.</p>
      <div className="mt-8">
        {logs.isPending ? <SkeletonRows rows={5} /> : logs.isError ? <ErrorState error={logs.error} /> : (
          <ol className="relative border-l border-line pl-7">
            {logs.data.data.map((l) => (
              <li key={l.id} className="relative pb-8 last:pb-0">
                <span aria-hidden className={`absolute -left-[33px] top-2 size-2.5 rounded-full ${l.action.startsWith("admin.") ? "bg-gold" : "bg-line-strong"}`} />
                <p className="text-[0.92rem] text-faint">{fmt(l.created_at)}</p>
                <p className="mt-0.5 font-semibold">{l.action}</p>
                <p className="text-muted">{l.actor}{l.resource ? ` on ${l.resource}` : ""}</p>
                {l.reason && <p className="mt-1 border-l-2 border-gold/60 pl-3 text-muted">“{l.reason}”</p>}
                <p className="mt-1 text-[0.85rem] text-faint">Request {l.request_id ?? "n/a"} from {l.ip_address ?? "unknown"}</p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
