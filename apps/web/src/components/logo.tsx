import { useId } from "react";

/**
 * NovaPay N mark, redrawn from the brand logo as vector art:
 * a folded gold ribbon (left leg + diagonal), a card with a chip as the
 * right leg, and an orbit swoosh. `orbit={false}` gives the compact nav mark.
 */
export function LogoMark({ size = 40, orbit = true, className = "" }: { size?: number; orbit?: boolean; className?: string }) {
  const id = useId().replace(/:/g, "");
  const g = (n: string) => `${n}-${id}`;
  return (
    <svg width={size} height={size * (orbit ? 0.78 : 0.72)} viewBox={orbit ? "0 0 128 100" : "8 6 108 84"} className={className} aria-hidden>
      <defs>
        <linearGradient id={g("face")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FCE7A2" />
          <stop offset="0.45" stopColor="#E4BC55" />
          <stop offset="1" stopColor="#A67A1C" />
        </linearGradient>
        <linearGradient id={g("fold")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#7E5A12" />
          <stop offset="0.35" stopColor="#C0922E" />
          <stop offset="0.75" stopColor="#EBC765" />
          <stop offset="1" stopColor="#C89B34" />
        </linearGradient>
        <linearGradient id={g("card")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#F6D77E" />
          <stop offset="0.6" stopColor="#D6A93E" />
          <stop offset="1" stopColor="#9C7016" />
        </linearGradient>
        <linearGradient id={g("orbit")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#C99A33" stopOpacity="0.2" />
          <stop offset="0.35" stopColor="#F3D27A" />
          <stop offset="1" stopColor="#C99A33" />
        </linearGradient>
      </defs>

      {orbit && <path d="M116 50c2-6-14-10-36-8" fill="none" stroke={`url(#${g("orbit")})`} strokeWidth="2.2" strokeLinecap="round" opacity="0.7" />}

      {/* right leg: the card */}
      <path d="M80 10h21c3 0 5 2.4 4.3 5.3L90 84.7c-.6 2.6-3 4.3-5.6 4.3H63.5c-3 0-5-2.6-4.3-5.4L75.4 14.3C76 11.9 78 10 80 10Z" fill={`url(#${g("card")})`} />
      <g fill="#FFF3C4" opacity="0.92">
        <rect x="82.5" y="18" width="7" height="3.4" rx="1" transform="skewX(-13)" />
        <rect x="91" y="18" width="7" height="3.4" rx="1" transform="skewX(-13)" />
        <rect x="82.5" y="23" width="7" height="3.4" rx="1" transform="skewX(-13)" />
        <rect x="91" y="23" width="7" height="3.4" rx="1" transform="skewX(-13)" />
        <rect x="82.5" y="28" width="7" height="3.4" rx="1" transform="skewX(-13)" />
        <rect x="91" y="28" width="7" height="3.4" rx="1" transform="skewX(-13)" />
      </g>

      {/* diagonal: the fold, slightly darker so it reads as passing behind */}
      <path d="M36 12h18c3 0 5.4 1.8 6.2 4.4L84 89H62L39 22c-1-3 0-10-3-10Z" fill={`url(#${g("fold")})`} />
      {/* left leg with the rounded arch over the top */}
      <path d="M14.5 84.6 30.6 18.4C32 13 36 10 41 10h3c5.5 0 9.5 3.6 9.5 8.5 0 .9-.1 1.8-.4 2.7L37.6 84.7c-.6 2.6-3 4.3-5.6 4.3H18.8c-2.9 0-5-2.6-4.3-4.4Z" fill={`url(#${g("face")})`} />

      {orbit && (
        <path d="M6 70c-6 14 30 24 64 18 26-4.6 44-17 46-38-6 16-24 26-48 30-30 5-58-1-62-10Z" fill={`url(#${g("orbit")})`} />
      )}
    </svg>
  );
}

/** Full lock-up as used in the app header: mark + "Nova" (text colour) + "Pay" (gold). */
export function Logo({ className = "", size = "md", orbit = false }: { className?: string; size?: "sm" | "md" | "lg"; orbit?: boolean }) {
  const s = { sm: { mark: 26, text: "text-[1.15rem]" }, md: { mark: 34, text: "text-[1.45rem]" }, lg: { mark: 104, text: "text-[2.6rem]" } }[size];
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <LogoMark size={s.mark} orbit={orbit} />
      <span className={`wordmark ${s.text} leading-none`}>
        <span className="text-fg">Nova</span>
        <span className="text-gold-text">Pay</span>
      </span>
    </span>
  );
}
