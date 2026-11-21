"use client";
import { FileClock, LogOut, Scale, ShieldCheck, Users, Wallet } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { ThemePill } from "@/components/theme-switch";
import { bff } from "@/lib/client";
import { useMe, useWallets } from "@/lib/queries";
import { Avatar } from "./avatar";

const NAV = [
  { href: "/admin", label: "Overview", Icon: Scale },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/audit", label: "Audit log", Icon: FileClock },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const me = useMe();
  const wallets = useWallets();
  const active = (href: string) => (href === "/admin" ? pathname === href : pathname.startsWith(href));

  async function signOut() {
    await bff.session("logout").catch(() => null);
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="page-glow min-h-dvh md:grid md:grid-cols-[264px_1fr]">
      <aside className="sticky top-0 hidden h-dvh p-4 md:block">
        <div className="glass flex h-full flex-col rounded-[28px] p-5">
          <Logo size="sm" />
          <p className="mt-3 flex items-center gap-1.5 text-sm text-gold-text"><ShieldCheck size={15} aria-hidden /> Operations console</p>
          <nav className="mt-8 space-y-1.5" aria-label="Admin">
            {NAV.map(({ href, label, Icon }) => (
              <Link key={href} href={href} aria-current={active(href) ? "page" : undefined}
                className={`flex items-center gap-3 rounded-[16px] px-3.5 py-2.5 font-medium ${active(href) ? "nav-active" : "text-muted hover:text-fg"}`}>
                <Icon size={19} aria-hidden /> {label}
              </Link>
            ))}
          </nav>
          <div className="mt-auto space-y-3 border-t border-line pt-4">
            <Link href="/app" className="flex items-center gap-3 px-3.5 text-muted hover:text-fg"><Wallet size={18} aria-hidden /> My wallet</Link>
            <div className="flex items-center gap-3 px-1">
              <Avatar first={me.data?.first_name} last={me.data?.last_name} size={36} />
              <div className="min-w-0"><p className="truncate text-sm font-semibold">{me.data?.first_name} {me.data?.last_name}</p><p className="truncate text-xs text-muted">{me.data?.email}</p></div>
            </div>
            <button onClick={signOut} className="flex items-center gap-3 px-3.5 text-muted hover:text-fg"><LogOut size={18} aria-hidden /> Sign out</button>
          </div>
        </div>
      </aside>

      <div className="min-w-0 pb-24 md:pb-0">
        <header className="flex items-center justify-between px-5 pb-2 pt-5 md:px-8">
          <span className="md:hidden"><Logo size="sm" /></span>
          {wallets.data?.demo_mode ? (
            <p className="hidden rounded-full border border-warning/40 bg-warning/10 px-3 py-1 text-[0.8rem] md:block"><span className="font-semibold text-warning">Demo</span> Simulated data</p>
          ) : <span />}
          <ThemePill />
        </header>
        <main className="mx-auto max-w-6xl px-5 py-6 md:px-8">{children}</main>
      </div>

      <nav aria-label="Admin" className="glass fixed inset-x-3 bottom-3 z-40 grid grid-cols-3 gap-1 rounded-[26px] p-1.5 md:hidden">
        {NAV.map(({ href, label, Icon }) => (
          <Link key={href} href={href} className={`flex flex-col items-center gap-0.5 rounded-[20px] py-2 text-[0.74rem] font-medium ${active(href) ? "nav-active" : "text-muted"}`}>
            <Icon size={20} aria-hidden /> {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
