"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { bff, RequestError } from "@/lib/client";
import type { User } from "@/lib/types";

const schema = z.object({
  identifier: z.string().trim().min(3, "Enter the email or phone number on your account."),
  password: z.string().min(1, "Enter your password."),
});
type Values = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setServerError(null);
    try {
      const res = await bff.session<{ data: { user: User } }>("login", { ...values, device_name: "web" });
      const user = res.data.user;
      const next = params.get("next");
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      if (user.status === "pending_verification") router.push("/verify");
      else router.push(safeNext ?? (user.is_staff ? "/admin" : "/app"));
      router.refresh();
    } catch (e) {
      setServerError(e instanceof RequestError ? e.message : "Sign-in failed. Check your connection and try again.");
    }
  }

  return (
    <div className="glass rounded-[26px] px-7 py-9 sm:px-9">
      <h1 className="text-[2.3rem]">Sign in</h1>
      <p className="mt-2 text-muted">Welcome back. Use the email or phone number you registered with.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
        {serverError && <Notice tone="error">{serverError}</Notice>}
        <Field label="Email or phone" autoComplete="username" placeholder="you@example.com or +237…" error={errors.identifier?.message} {...register("identifier")} />
        <Field label="Password" type="password" autoComplete="current-password" error={errors.password?.message} {...register("password")} />
        <Button type="submit" loading={isSubmitting} className="w-full py-3">
          {isSubmitting ? "Signing in" : "Sign in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-muted">
        New to NovaPay? <Link href="/register" className="text-gold-text underline-offset-4 hover:underline">Open a wallet</Link>
      </p>
      <details className="mt-6 border-t border-line pt-5 text-[0.95rem] text-muted">
        <summary className="cursor-pointer">Using a local demo?</summary>
        <p className="mt-2">
          With demo mode on, sign in as <span className="text-fg">demo.customer@novapay.local</span> or{" "}
          <span className="text-fg">demo.admin@novapay.local</span> with the password <span className="text-fg">Demo-Passw0rd!</span>. Demo balances are simulated.
        </p>
      </details>
    </div>
  );
}
