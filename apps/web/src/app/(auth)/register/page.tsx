import type { Metadata } from "next";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Open a wallet" };

export default function RegisterPage() {
  return <RegisterForm />;
}
