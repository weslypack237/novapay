"use client";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";
import { bff, RequestError } from "@/lib/client";

const post = (path: string, body: unknown) => bff.post(path, body);

export function VerifyForm() {
  const router = useRouter();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [state, setState] = useState<{ tone: "error" | "success" | "info"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const code = digits.join("");

  function setAt(i: number, v: string) {
    const clean = v.replace(/\D/g, "");
    if (clean.length > 1) {
      const next = clean.slice(0, 6).split("");
      setDigits([...next, ...Array(6 - next.length).fill("")]);
      refs.current[Math.min(next.length, 5)]?.focus();
      return;
    }
    const copy = [...digits];
    copy[i] = clean;
    setDigits(copy);
    if (clean && i < 5) refs.current[i + 1]?.focus();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return setState({ tone: "error", text: "Enter all 6 digits." });
    setBusy(true);
    try {
      await post("auth/verify-otp", { code, purpose: "verify_email" });
      setState({ tone: "success", text: "Email verified. Opening your wallet." });
      router.push("/app");
    } catch (err) {
      setState({ tone: "error", text: err instanceof RequestError ? err.message : "Verification failed. Try again." });
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    try {
      await post("auth/resend-otp", {});
      setState({ tone: "info", text: "A new code is on its way. Older codes no longer work." });
    } catch (err) {
      setState({ tone: "error", text: err instanceof RequestError ? err.message : "Couldn't send a new code." });
    }
  }

  return (
    <div className="glass rounded-[26px] px-7 py-9 sm:px-9">
      <h1 className="text-[2.3rem]">Check your email</h1>
      <p className="mt-2 text-muted">Enter the 6-digit code we sent you. It expires in 10 minutes.</p>
      <form onSubmit={submit} className="mt-8 space-y-6">
        {state && <Notice tone={state.tone}>{state.text}</Notice>}
        <fieldset>
          <legend className="sr-only">Verification code</legend>
          <div className="flex justify-between gap-2">
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { refs.current[i] = el; }}
                value={d}
                onChange={(e) => setAt(i, e.target.value)}
                onKeyDown={(e) => e.key === "Backspace" && !d && i > 0 && refs.current[i - 1]?.focus()}
                inputMode="numeric"
                autoComplete={i === 0 ? "one-time-code" : "off"}
                aria-label={`Digit ${i + 1}`}
                className="figure h-14 w-full rounded-[12px] border border-line-strong bg-surface text-center text-2xl outline-none focus:border-gold"
              />
            ))}
          </div>
        </fieldset>
        <Button type="submit" loading={busy} className="w-full py-3">Verify email</Button>
      </form>
      <button onClick={resend} className="mt-5 w-full text-center text-gold-text underline-offset-4 hover:underline">Send a new code</button>
    </div>
  );
}
