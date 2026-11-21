import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemePill, ThemeSwitch } from "@/components/theme-switch";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-glow min-h-dvh">
      <div className="border-b border-line px-4 py-2 text-center text-[0.86rem] text-muted">
        NovaPay is in development. Nothing on this site moves real money yet.
      </div>
      <header className="sticky top-3 z-40 px-4">
        <nav className="glass mx-auto flex max-w-6xl items-center justify-between rounded-full py-2 pl-5 pr-2">
          <Link href="/" aria-label="NovaPay home"><Logo size="sm" /></Link>
          <div className="hidden items-center gap-7 text-[0.98rem] text-muted md:flex">
            <a href="#how" className="hover:text-fg">How it works</a>
            <a href="#cards" className="hover:text-fg">Cards</a>
            <a href="#business" className="hover:text-fg">Business</a>
            <a href="#promises" className="hover:text-fg">Our limits</a>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden sm:block"><ThemePill /></span>
            <Link href="/login" className="rounded-full px-4 py-2 text-[0.98rem] hover:bg-elevated">Sign in</Link>
            <Link href="/register" className="btn-gold rounded-full px-4 py-2 text-[0.98rem]">Open a wallet</Link>
          </div>
        </nav>
      </header>
      {children}
      <footer className="mt-24 border-t border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <Logo />
            <p className="mt-4 max-w-sm text-muted">
              Built in Cameroon for people and teams who pay for the world online. Services launch market by market as partner and regulatory approvals are confirmed.
            </p>
          </div>
          <div className="space-y-2 text-muted">
            <p className="text-fg">Product</p>
            <a href="#how" className="block hover:text-fg">How money moves</a>
            <a href="#cards" className="block hover:text-fg">Virtual cards</a>
            <a href="#business" className="block hover:text-fg">Business</a>
          </div>
          <div className="space-y-2 text-muted">
            <p className="text-fg">Account</p>
            <Link href="/register" className="block hover:text-fg">Open a wallet</Link>
            <Link href="/login" className="block hover:text-fg">Sign in</Link>
            <span className="block sm:hidden pt-2"><ThemeSwitch /></span>
          </div>
        </div>
        <p className="mx-auto max-w-6xl px-6 pb-10 text-sm text-faint">
          © 2026 NovaPay. NovaPay is not yet a licensed payment service. Card availability, merchant acceptance, fees and limits depend on issuer and provider agreements.
        </p>
      </footer>
    </div>
  );
}
