import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto grid min-h-dvh max-w-xl place-content-center px-6 text-center">
      <h1 className="text-5xl">This page doesn’t exist.</h1>
      <p className="mt-4 text-muted">Check the address, or head back to NovaPay.</p>
      <Link href="/" className="btn-gold mx-auto mt-8 rounded-full px-6 py-3">Go to NovaPay</Link>
    </main>
  );
}
