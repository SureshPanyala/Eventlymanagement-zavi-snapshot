import Link from "next/link";

export default function NotFound(): JSX.Element {
  return (
    <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <p className="font-display text-6xl font-bold text-accent">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">We could not find that page</h1>
      <p className="mt-2 text-textMuted">The event may have been removed or is not published yet.</p>
      <Link href="/events" className="mt-6 inline-flex h-11 items-center rounded-xl bg-accent px-5 text-sm font-semibold text-accentFg">Browse events</Link>
    </main>
  );
}
