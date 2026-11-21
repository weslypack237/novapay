"use client";
import { ArrowLeft, ArrowLeftRight, Bell, CreditCard, History, Home, LogOut, Menu, ShieldCheck, User, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/logo";
import { bff } from "@/lib/client";
import { useMe, useWallets } from "@/lib/queries";
import { Avatar } from "./avatar";
import { FeatureProvider } from "./features";

export const NAV = [
  { href: "/app", label: "Home", Icon: Home },
  { href: "/app/cards", label: "Cards", Icon: CreditCard },
  { href: "/app/transfer", label: "Transfer", Icon: ArrowLeftRight },
  { href: "/app/history", label: "History", Icon: History },
  { href: "/app/account", label: "Account", Icon: User },
];

const TITLES: Record<string, string> = {
  "/app/cards": "Cards",
  "/app/transfer": "Transfer",
  "/app/history": "History",
  "/app/account": "Account",
  "/app/notifications": "Notifications",
};

function useSignOut() {
  const router = useRouter();
  return async () => {
    await bff.session("logout").catch(() => null);
    router.push("/login");
    router.refresh();
  };
}

function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const me = useMe();
  const signOut = useSignOut();
  const pathname = usePathname();
  useEffect(() => { onClose(); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu">
      <button className="fade-in absolute inset-0 bg-black/55" aria-label="Close menu" onClick={onClose} />
      <nav className="glass sheet-in absolute inset-y-3 left-3 flex w-[min(320px,85vw)] flex-col rounded-[28px] p-5">
        <div className="flex items-center justify-between">
          <Logo size="sm" />
          <button onClick={onClose} aria-label="Close menu" className="tile grid size-9 place-items-center rounded-full"><X size={17} /></button>
        </div>
        <div className="mt-6 flex items-center gap-3">
          <Avatar first={me.data?.first_name} last={me.data?.last_name} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{me.data ? `${me.data.first_name} ${me.data.last_name}` : " "}</p>
            <p className="truncate text-sm text-muted">{me.data?.email}</p>
          </div>
        </div>
        <ul className="mt-6 space-y-1">
          {NAV.map(({ href, label, Icon }) => (
            <li key={href}>
              <Link href={href} className="flex items-center gap-3 rounded-[14px] px-3 py-2.5 hover:bg-elevated"><Icon size={19} aria-hidden /> {label}</Link>
            </li>
          ))}
          <li><Link href="/app/notifications" className="flex items-center gap-3 rounded-[14px] px-3 py-2.5 hover:bg-elevated"><Bell size={19} aria-hidden /> Notifications</Link></li>
          {me.data?.is_staff && (
            <li><Link href="/admin" className="flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-gold-text hover:bg-elevated"><ShieldCheck size={19} aria-hidden /> Operations console</Link></li>
          )}
        </ul>
        <button onClick={signOut} className="mt-auto flex items-center gap-3 rounded-[14px] px-3 py-2.5 text-muted hover:bg-elevated hover:text-fg">
          <LogOut size={19} aria-hidden /> Sign out
        </button>
      </nav>
    </div>
  );
}

export function BottomNav() {
  const pathname = usePathname();
  const active = (href: string) => (href === "/app" ? pathname === "/app" : pathname.startsWith(href));
  return (
    <nav aria-label="Main" className="glass fixed inset-x-0 bottom-4 z-40 mx-auto grid w-[min(520px,calc(100%-24px))] grid-cols-5 gap-1 rounded-[30px] p-1.5">
      {NAV.map(({ href, label, Icon }) => {
        const on = active(href);
        return (
          <Link key={href} href={href} aria-current={on ? "page" : undefined}
            className={`flex flex-col items-center gap-0.5 rounded-[24px] py-2 text-[0.74rem] font-medium transition-colors ${on ? "nav-active" : "text-muted hover:text-fg"}`}>
            <Icon size={21} strokeWidth={on ? 2.2 : 1.8} aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const me = useMe();
  const wallets = useWallets();
  const [menu, setMenu] = useState(false);
  const title = TITLES[pathname];

  return (
    <FeatureProvider>
    <div className="page-glow min-h-dvh pb-32">
      <header className="sticky top-0 z-30 backdrop-blur-xl [background:color-mix(in_oklab,var(--page)_70%,transparent)]">
        <div className="mx-auto grid max-w-5xl grid-cols-[48px_1fr_auto] items-center gap-2 px-4 py-3">
          {title ? (
            <button onClick={() => router.back()} aria-label="Back" className="grid size-11 place-items-center rounded-full hover:bg-elevated"><ArrowLeft size={22} /></button>
          ) : (
            <button onClick={() => setMenu(true)} aria-label="Open menu" className="grid size-11 place-items-center rounded-full hover:bg-elevated"><Menu size={24} /></button>
          )}
          <div className="flex justify-center">
            {title ? <h1 className="text-[1.35rem]">{title}</h1> : <Link href="/app" aria-label="NovaPay home"><Logo orbit /></Link>}
          </div>
          <div className={`flex items-center gap-1.5 ${title ? "invisible" : ""}`} aria-hidden={title ? true : undefined}>
            <Link href="/app/notifications" aria-label="Notifications" className="grid size-11 place-items-center rounded-full hover:bg-elevated">
              <Bell size={22} aria-hidden />
            </Link>
            <Link href="/app/account" aria-label="Account" className="rounded-full">
              <Avatar first={me.data?.first_name} last={me.data?.last_name} size={42} />
            </Link>
          </div>
        </div>
      </header>
      {wallets.data?.demo_mode && (
        <p className="mx-auto w-fit rounded-full border border-warning/40 bg-warning/10 px-2.5 py-0.5 text-[0.74rem] text-fg">
          <span className="font-semibold text-warning">Demo</span> Simulated money, not real funds
        </p>
      )}
      <main className="mx-auto max-w-5xl px-4 pt-3">{children}</main>
      <BottomNav />
      <Drawer open={menu} onClose={() => setMenu(false)} />
    </div>
    </FeatureProvider>
  );
}
