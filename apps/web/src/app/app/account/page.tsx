"use client";
import { useMutation } from "@tanstack/react-query";
import { BadgeCheck, Bell, LogOut, Moon, Shield, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/app/avatar";
import { ListRow, RowGroup } from "@/components/app/rows";
import { Sheet } from "@/components/app/sheet";
import { ThemeSwitch, useThemeChoice } from "@/components/theme-switch";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { bff } from "@/lib/client";
import { useMe } from "@/lib/queries";

const STATUS: Record<string, string> = {
  pending_verification: "Waiting for email confirmation",
  active: "Active",
  restricted: "Restricted. Contact support for details.",
  suspended: "Suspended",
  closed: "Closed",
};

export default function AccountPage() {
  const me = useMe();
  const router = useRouter();
  const theme = useThemeChoice();
  const [sheet, setSheet] = useState<"profile" | "security" | "theme" | null>(null);
  const [msg, setMsg] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const u = me.data;

  const others = useMutation({
    mutationFn: () => bff.post<{ data: { revoked: number } }>("auth/logout-others"),
    onSuccess: (r) => setMsg({ tone: "success", text: r.data.revoked ? `Signed out of ${r.data.revoked} other session${r.data.revoked > 1 ? "s" : ""}.` : "No other sessions were signed in." }),
    onError: (e) => setMsg({ tone: "error", text: e.message }),
  });

  async function signOut() {
    await bff.session("logout").catch(() => null);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="flex items-center gap-4 py-2">
        <Avatar first={u?.first_name} last={u?.last_name} size={64} />
        <div className="min-w-0">
          <p className="display truncate text-[1.6rem] font-bold">{u ? `${u.first_name} ${u.last_name}` : <span className="skeleton inline-block h-7 w-40" />}</p>
          <p className="flex items-center gap-1.5 truncate text-muted">
            {u?.email}
            {u?.email_verified && <BadgeCheck size={18} className="shrink-0 text-[#3b82f6]" aria-label="Email verified" />}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <RowGroup>
          <ListRow plainIcon Icon={User} title="Profile" onClick={() => setSheet("profile")} />
          <ListRow plainIcon Icon={Shield} title="Security" onClick={() => setSheet("security")} />
          <ListRow plainIcon Icon={Bell} title="Notifications" href="/app/notifications" />
          <ListRow plainIcon Icon={Moon} title="Theme" value={{ dark: "Dark", light: "Light", system: "System" }[theme]} onClick={() => setSheet("theme")} />
        </RowGroup>
      </div>

      <button onClick={signOut} className="tile mt-4 flex w-full items-center justify-center gap-2 rounded-[18px] py-3.5 font-medium text-danger">
        <LogOut size={18} aria-hidden /> Sign out
      </button>

      <Sheet open={sheet === "profile"} onClose={() => setSheet(null)} title="Profile">
        <dl className="divide-y divide-line">
          {[
            ["Name", u ? `${u.first_name} ${u.last_name}` : ""],
            ["Email", u?.email ?? "Not set"],
            ["Phone", u?.phone ?? "Not set"],
            ["Account", u ? STATUS[u.status] : ""],
            ["Identity check", "Not started. Opens when our verification partner is connected."],
          ].map(([k, v]) => (
            <div key={k} className="grid grid-cols-[110px_1fr] gap-3 py-3"><dt className="text-muted">{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
      </Sheet>

      <Sheet open={sheet === "security"} onClose={() => { setSheet(null); setMsg(null); }} title="Security">
        <p className="text-muted">Signed in on a shared or lost device? End every session except this one.</p>
        <div className="mt-4 space-y-3">
          {msg && <Notice tone={msg.tone}>{msg.text}</Notice>}
          <Button variant="quiet" loading={others.isPending} onClick={() => others.mutate()} className="w-full">Sign out other sessions</Button>
        </div>
        <p className="mt-4 text-[0.88rem] text-faint">Two-step verification and device management arrive in the next release.</p>
      </Sheet>

      <Sheet open={sheet === "theme"} onClose={() => setSheet(null)} title="Theme">
        <p className="mb-4 text-muted">System follows your phone or computer setting.</p>
        <ThemeSwitch onChange={(t) => bff.patch("me/theme", { theme: t }).catch(() => null)} />
      </Sheet>
    </div>
  );
}
