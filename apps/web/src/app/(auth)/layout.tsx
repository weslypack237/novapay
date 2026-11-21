import Link from "next/link";
import { Logo } from "@/components/logo";
import { ThemePill } from "@/components/theme-switch";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="page-glow relative min-h-dvh overflow-hidden">
      <header className="relative mx-auto flex max-w-5xl items-center justify-end px-5 py-5">
        <ThemePill />
      </header>
      <main className="relative mx-auto w-full max-w-[460px] px-5 pb-16">
        <Link href="/" aria-label="NovaPay home" className="mx-auto mb-7 flex w-fit flex-col items-center">
          <Logo size="lg" orbit className="flex-col !gap-3" />
          <span className="mt-3 text-[0.78rem] tracking-[0.22em] text-muted">GLOBAL PAYMENTS MADE SIMPLE</span>
        </Link>
        {children}
      </main>
    </div>
  );
}
