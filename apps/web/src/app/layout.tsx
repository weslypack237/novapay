import type { Metadata, Viewport } from "next";
import { Providers } from "@/components/providers";
import "@fontsource-variable/inter";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "NovaPay — Global payments made simple", template: "%s · NovaPay" },
  description:
    "A wallet you fund with Mobile Money, virtual cards for eligible online payments, and every fee shown before you confirm. Built in Cameroon.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
    { media: "(prefers-color-scheme: light)", color: "#f2f2f4" },
  ],
};

// Runs before first paint: applies the saved choice (system | light | dark). Dark when nothing is saved.
const themeScript = `(function(){try{var c=localStorage.getItem("np-theme")||"dark";var t=c==="system"?(matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"):c;document.documentElement.setAttribute("data-theme",t);document.documentElement.setAttribute("data-theme-choice",c)}catch(e){}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
