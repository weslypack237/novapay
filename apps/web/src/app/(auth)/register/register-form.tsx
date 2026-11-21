"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Notice } from "@/components/ui/notice";
import { bff, RequestError } from "@/lib/client";

// Mirrors the server rules; the API remains the authority.
const schema = z
  .object({
    first_name: z.string().trim().min(1, "Enter your first name.").max(100),
    last_name: z.string().trim().min(1, "Enter your last name.").max(100),
    email: z.string().trim().email("Enter a valid email address."),
    password: z
      .string()
      .min(10, "Use at least 10 characters.")
      .regex(/[a-z]/, "Add a lowercase letter.")
      .regex(/[A-Z]/, "Add an uppercase letter.")
      .regex(/\d/, "Add a number."),
    password_confirmation: z.string(),
    accept_terms: z.literal(true, { message: "You need to accept the terms to continue." }),
  })
  .refine((v) => v.password === v.password_confirmation, { path: ["password_confirmation"], message: "Passwords don't match." });
type Values = z.infer<typeof schema>;

export function RegisterForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setServerError(null);
    try {
      await bff.session("register", values);
      router.push("/verify");
    } catch (e) {
      if (e instanceof RequestError && e.body.errors) {
        for (const [field, messages] of Object.entries(e.body.errors)) {
          setError(field as keyof Values, { message: messages[0] });
        }
      } else {
        setServerError(e instanceof RequestError ? e.message : "We couldn't create your wallet. Try again.");
      }
    }
  }

  return (
    <div className="glass rounded-[26px] px-7 py-9 sm:px-9">
      <h1 className="text-[2.3rem]">Open a wallet</h1>
      <p className="mt-2 text-muted">It takes a minute. We’ll confirm your email with a 6-digit code.</p>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-8 space-y-5">
        {serverError && <Notice tone="error">{serverError}</Notice>}
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="First name" autoComplete="given-name" error={errors.first_name?.message} {...register("first_name")} />
          <Field label="Last name" autoComplete="family-name" error={errors.last_name?.message} {...register("last_name")} />
        </div>
        <Field label="Email" type="email" autoComplete="email" error={errors.email?.message} {...register("email")} />
        <Field label="Password" type="password" autoComplete="new-password" hint="At least 10 characters, with upper and lowercase letters and a number." error={errors.password?.message} {...register("password")} />
        <Field label="Confirm password" type="password" autoComplete="new-password" error={errors.password_confirmation?.message} {...register("password_confirmation")} />
        <label className="flex items-start gap-3 text-[0.98rem] text-muted">
          <input type="checkbox" className="mt-1.5 size-4 accent-[var(--brand-accent)]" {...register("accept_terms")} />
          <span>I accept the NovaPay terms and privacy policy, and understand identity checks are required before cards and withdrawals.</span>
        </label>
        {errors.accept_terms && <p className="-mt-3 text-[0.92rem] text-danger">{errors.accept_terms.message}</p>}
        <Button type="submit" loading={isSubmitting} className="w-full py-3">
          {isSubmitting ? "Creating your wallet" : "Create wallet"}
        </Button>
      </form>

      <p className="mt-6 text-center text-muted">
        Already have a wallet? <Link href="/login" className="text-gold-text underline-offset-4 hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
