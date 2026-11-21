import { AppShell } from "@/components/app/app-shell";

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
