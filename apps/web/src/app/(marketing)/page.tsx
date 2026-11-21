import Link from "next/link";
import { ArrowLeftRight, CreditCard, Plus, Send } from "lucide-react";
import { LogoMark } from "@/components/logo";
import { PaymentCard } from "@/components/app/payment-card";
import { FreezeDemo } from "@/components/marketing/freeze-demo";

const STEPS = [
  { title: "Fund your wallet", body: "Top up in FCFA from MTN Mobile Money or Orange Money. Your balance only changes once the provider confirms the payment." },
  { title: "Create a virtual card", body: "Issue a card for one purpose — a course, a subscription, an ad account — and give it its own limit." },
  { title: "Pay online", body: "Use the card at eligible international merchants. Every payment and decline appears in your history with the reason." },
  { title: "Withdraw what's left", body: "Send eligible funds back to a verified Mobile Money number. Funds are held, not spent, until the payout is final." },
];

const QUOTE = [
  { label: "You send", value: "Your amount, in FCFA" },
  { label: "Provider fee", value: "Charged by MTN or Orange" },
  { label: "NovaPay fee", value: "Fixed or percentage, never both hidden" },
  { label: "Exchange rate", value: "Locked for the life of the quote" },
  { label: "You receive", value: "The exact final figure" },
];

const LIMITS = [
  {
    title: "Not every merchant will accept every card.",
    body: "Acceptance depends on the issuer, the merchant's country and category, and 3-D Secure. When a payment is declined, we show you why.",
  },
  {
    title: "We will ask who you are.",
    body: "Identity checks protect your money and are required by law. We collect only what's needed and use a verification partner rather than storing your documents.",
  },
  {
    title: "No crypto, for now.",
    body: "Crypto funding and withdrawals stay switched off until there is a clear, lawful way to offer them in Cameroon.",
  },
  {
    title: "No borrowed logos.",
    body: "We'll name the card network on your card when the agreement is signed — not before.",
  },
];

export default function LandingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-40 -top-32 size-[720px] rounded-full opacity-90 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--glow), transparent 62%)" }}
        />
        <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-6 pb-20 pt-16 md:grid-cols-[1.1fr_0.9fr] md:pt-24">
          <div>
            <h1 className="max-w-[13ch] text-[clamp(2.7rem,7vw,5.2rem)]">
              Pay the world from a Mobile Money wallet.
            </h1>
            <p className="mt-7 max-w-[46ch] text-[1.2rem] leading-[1.65] text-muted">
              Top up in FCFA, spend online with a virtual card, and see every fee and exchange rate before you say yes.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/register" className="btn-gold rounded-full px-6 py-3 text-lg">Open a wallet</Link>
              <a href="#how" className="rounded-full border border-line-strong px-6 py-3 text-lg hover:bg-elevated">See how it works</a>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[440px]">
            {/* App preview, drawn from the real components */}
            <div className="glass glass-rim relative overflow-hidden rounded-[30px] p-6">
              <div aria-hidden className="watermark pointer-events-none absolute -right-8 top-2"><LogoMark size={190} /></div>
              <p className="relative text-muted">Total Balance</p>
              <p className="display figure relative mt-1 text-[2.7rem] font-bold leading-none">325 500 <span className="font-sans text-base font-medium text-muted">FCFA</span></p>
              <div className="relative mt-6 grid grid-cols-4 gap-2">
                {[["Add Money", Plus, true], ["Send", Send, false], ["Exchange", ArrowLeftRight, false], ["Cards", CreditCard, false]].map(([label, Icon, gold]) => {
                  const I = Icon as typeof Plus;
                  return (
                    <span key={label as string} className={`flex flex-col items-center gap-1 rounded-[18px] py-3 text-[0.78rem] font-medium ${gold ? "gold-tile" : "tile"}`}>
                      <I size={20} aria-hidden /> {label as string}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="relative -mt-1 ml-8 mr-[-12px] rotate-[-4deg] sm:ml-14">
              <PaymentCard last4="4587" />
            </div>
            <p className="mt-3 text-right text-xs text-faint">Illustration</p>
          </div>
        </div>
      </section>

      {/* Sequence: this really is an ordered flow, so it is numbered. */}
      <section id="how" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-20">
        <h2 className="max-w-[20ch] text-[clamp(2rem,4.4vw,3.2rem)]">How money moves through NovaPay</h2>
        <ol className="relative mt-14 grid gap-12 md:grid-cols-4 md:gap-8">
          <span aria-hidden className="absolute left-[15px] top-2 h-[calc(100%-1rem)] w-px bg-gradient-to-b from-gold to-transparent md:left-0 md:top-[15px] md:h-px md:w-full md:bg-gradient-to-r" />
          {STEPS.map((step, i) => (
            <li key={step.title} className="relative pl-12 md:pl-0 md:pt-12">
              <span className="nav-active absolute left-0 top-0 grid size-[31px] place-items-center rounded-full text-[0.95rem] font-semibold">
                {i + 1}
              </span>
              <h3 className="text-[1.35rem]">{step.title}</h3>
              <p className="mt-3 text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Quote-first: a receipt, not a feature card. */}
      <section className="border-y border-line">
        <div className="mx-auto grid max-w-6xl gap-14 px-6 py-20 md:grid-cols-2 md:items-center">
          <div>
            <h2 className="max-w-[16ch] text-[clamp(2rem,4.4vw,3.2rem)]">You see the final number first.</h2>
            <p className="mt-6 max-w-[44ch] text-[1.12rem] text-muted">
              Before any top-up, card payment or withdrawal, NovaPay gives you a quote calculated on our servers. Confirm it and that’s exactly what posts to your wallet. Let it expire and nothing happens.
            </p>
          </div>
          <div className="glass rounded-[26px] p-7">
            <div className="flex items-baseline justify-between border-b border-dashed border-line-strong pb-4">
              <p className="text-lg">Withdrawal quote</p>
              <p className="text-sm text-faint">Valid for 2 minutes</p>
            </div>
            <dl className="divide-y divide-line">
              {QUOTE.map((row, i) => (
                <div key={row.label} className={`flex justify-between gap-6 py-3.5 ${i === QUOTE.length - 1 ? "text-fg" : ""}`}>
                  <dt className={i === QUOTE.length - 1 ? "text-lg" : "text-muted"}>{row.label}</dt>
                  <dd className={`text-right ${i === QUOTE.length - 1 ? "text-lg text-gold-text" : ""}`}>{row.value}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-sm text-faint">Fees and limits are published in the fee schedule once provider agreements are final.</p>
          </div>
        </div>
      </section>

      {/* Cards & controls */}
      <section id="cards" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
        <div className="mb-14 max-w-2xl">
          <h2 className="text-[clamp(2rem,4.4vw,3.2rem)]">A card for each thing you pay for.</h2>
          <p className="mt-5 text-[1.12rem] text-muted">
            Freeze a card the moment something looks wrong. Cap it at what the subscription costs. Try the controls.
          </p>
        </div>
        <FreezeDemo />
      </section>

      {/* Business */}
      <section id="business" className="scroll-mt-24 border-y border-line">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="grid gap-12 md:grid-cols-[0.9fr_1.1fr]">
            <h2 className="max-w-[14ch] text-[clamp(2rem,4.4vw,3.2rem)]">Give your team cards, keep the budget.</h2>
            <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
              <div>
                <h3 className="text-[1.25rem]">Cards per person</h3>
                <p className="mt-2 text-muted">Invite colleagues and issue each one a card with its own monthly limit.</p>
              </div>
              <div>
                <h3 className="text-[1.25rem]">Department budgets</h3>
                <p className="mt-2 text-muted">Set a budget for marketing or engineering and see spend against it as it happens.</p>
              </div>
              <div>
                <h3 className="text-[1.25rem]">Expense exports</h3>
                <p className="mt-2 text-muted">Export transactions with merchant, card holder and receipt reference for your accountant.</p>
              </div>
              <div>
                <h3 className="text-[1.25rem]">A full trail</h3>
                <p className="mt-2 text-muted">Every limit change, new card and invitation is recorded with who did it and when.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Honest limits */}
      <section id="promises" className="mx-auto max-w-6xl scroll-mt-24 px-6 py-24">
        <h2 className="max-w-[18ch] text-[clamp(2rem,4.4vw,3.2rem)]">What we won’t promise you</h2>
        <p className="mt-5 max-w-[52ch] text-[1.12rem] text-muted">
          Payment apps lose trust by overpromising. Here is where NovaPay draws the line today.
        </p>
        <div className="mt-14 grid gap-x-16 gap-y-10 md:grid-cols-2">
          {LIMITS.map((item) => (
            <div key={item.title} className="border-l-2 border-gold pl-6">
              <h3 className="text-[1.4rem]">{item.title}</h3>
              <p className="mt-2 text-muted">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6">
        <div className="glass relative overflow-hidden rounded-[30px] px-8 py-14 md:px-14">
          <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-20 size-[460px] rounded-full blur-3xl" style={{ background: "radial-gradient(circle, var(--glow), transparent 65%)" }} />
          <div className="relative flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
            <div>
              <h2 className="text-[clamp(1.9rem,4vw,2.8rem)]">Be first when NovaPay opens in Cameroon.</h2>
              <p className="mt-3 max-w-[48ch] text-muted">Create your wallet now. We’ll let you know when top-ups and cards go live in your area.</p>
            </div>
            <Link href="/register" className="btn-gold shrink-0 rounded-full px-7 py-3.5 text-lg">Open a wallet</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
