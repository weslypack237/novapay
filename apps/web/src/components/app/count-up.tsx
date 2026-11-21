"use client";
import { useEffect, useRef, useState } from "react";
import { formatMoney } from "@/lib/money";

/** Counts up once when a confirmed balance first loads; later changes snap. */
export function CountUp({ value, currency }: { value: number; currency: string }) {
  const [shown, setShown] = useState(value);
  const played = useRef(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (played.current || reduce || value <= 0) { setShown(value); return; }
    played.current = true;
    const start = performance.now();
    const duration = 700;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setShown(Math.round(value * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return (
    <>
      <span aria-hidden>{formatMoney(shown, currency)}</span>
      <span className="sr-only">{formatMoney(value, currency)}</span>
    </>
  );
}
