import type { Metadata } from "next";
import Link from "next/link";
import { KeyRound } from "lucide-react";

export const metadata: Metadata = { title: "Forgot password" };

export default function Page(): JSX.Element {
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl" aria-hidden />
      <div className="relative mx-auto flex max-w-md flex-col px-4 py-16">
        <div className="animate-fade-in-up rounded-3xl border border-border bg-surface p-8 shadow-lift">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accentFg">
            <KeyRound className="h-5 w-5" />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">Forgot your password?</h1>
          <p className="mt-1 text-textMuted">
            Password reset by email isn&apos;t available yet. Until it is, here are a few things to try.
          </p>
          <ul className="mt-6 grid gap-3 text-sm">
            <li className="rounded-xl bg-bg px-4 py-3 ring-1 ring-border">
              Use the same email address you signed up with.
            </li>
            <li className="rounded-xl bg-bg px-4 py-3 ring-1 ring-border">
              Passwords are case-sensitive, so check that Caps Lock is off.
            </li>
            <li className="rounded-xl bg-bg px-4 py-3 ring-1 ring-border">
              Check your browser&apos;s saved passwords for this site.
            </li>
          </ul>
          <Link
            href="/login"
            className="mt-6 flex h-12 items-center justify-center rounded-xl bg-accent text-[15px] font-semibold text-accentFg shadow-sm transition hover:brightness-110"
          >
            Back to log in
          </Link>
          <p className="mt-6 text-center text-sm text-textMuted">
            New to Evently?{" "}
            <Link href="/signup" className="font-semibold text-accent hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
