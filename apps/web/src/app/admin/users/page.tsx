"use client";
import { useQuery } from "@tanstack/react-query";
import { useDeferredValue, useState } from "react";
import { ErrorState, SkeletonRows } from "@/components/app/states";
import { bff } from "@/lib/client";
import type { Paginated } from "@/lib/types";

type Row = { id: string; name: string; email: string | null; phone: string | null; status: string; roles: string[]; created_at: string; last_login_at: string | null };

const date = (iso: string | null) => (iso ? new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" }).format(new Date(iso)) : "Never");

export default function AdminUsers() {
  const [q, setQ] = useState("");
  const term = useDeferredValue(q.trim());
  const users = useQuery({
    queryKey: ["admin-users", term],
    queryFn: () => bff.get<Paginated<Row>>(`admin/users${term ? `?q=${encodeURIComponent(term)}` : ""}`),
  });

  return (
    <div>
      <h1 className="text-[clamp(2rem,4vw,2.8rem)]">Users</h1>
      <div className="mt-6 max-w-md">
        <label htmlFor="user-search" className="sr-only">Search by email or phone</label>
        <input id="user-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by email or phone"
          className="tile w-full rounded-full px-5 py-3 outline-none focus:border-gold" />
      </div>
      <div className="mt-6 overflow-x-auto glass rounded-[26px]">
        {users.isPending ? <div className="p-6"><SkeletonRows /></div> : users.isError ? <div className="p-6"><ErrorState error={users.error} /></div> : (
          <table className="w-full min-w-[720px] text-left">
            <thead className="border-b border-line text-[0.92rem] text-faint">
              <tr>{["Name", "Contact", "Roles", "Status", "Joined", "Last sign-in"].map((h) => <th key={h} className="px-5 py-3 font-normal">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-line">
              {users.data.data.map((u) => (
                <tr key={u.id}>
                  <td className="px-5 py-3.5">{u.name || "Unnamed"}</td>
                  <td className="px-5 py-3.5 text-muted">{u.email ?? u.phone}</td>
                  <td className="px-5 py-3.5 text-muted">{u.roles.map((r) => r.replaceAll("_", " ")).join(", ")}</td>
                  <td className="px-5 py-3.5 capitalize">{u.status.replaceAll("_", " ")}</td>
                  <td className="figure px-5 py-3.5 text-muted">{date(u.created_at)}</td>
                  <td className="figure px-5 py-3.5 text-muted">{date(u.last_login_at)}</td>
                </tr>
              ))}
              {users.data.data.length === 0 && <tr><td colSpan={6} className="px-5 py-10 text-center text-muted">No users match that search.</td></tr>}
            </tbody>
          </table>
        )}
      </div>
      <p className="mt-4 text-[0.95rem] text-faint">Changing an account’s status requires a written reason and is recorded in the audit log.</p>
    </div>
  );
}
