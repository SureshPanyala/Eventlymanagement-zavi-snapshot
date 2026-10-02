import Link from "next/link";
import { CalendarDays } from "lucide-react";

export default function AuthForm({
  mode,
  error,
  next,
  invite,
}: {
  mode: "login" | "signup";
  error: string | null;
  next: string;
  invite: string;
}): JSX.Element {
  const isSignup = mode === "signup";
  const qs = new URLSearchParams();
  if (next) qs.set("next", next);
  if (invite) qs.set("invite", invite);
  const other = `${isSignup ? "/login" : "/signup"}${qs.toString() ? `?${qs}` : ""}`;
  return (
    <main className="relative overflow-hidden">
      <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent/10 blur-3xl" aria-hidden />
      <div className="relative mx-auto flex max-w-md flex-col px-4 py-16">
        <div className="animate-fade-in-up rounded-3xl border border-border bg-surface p-8 shadow-lift">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent text-accentFg">
            <CalendarDays className="h-5 w-5" />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">{isSignup ? "Create your account" : "Welcome back"}</h1>
          <p className="mt-1 text-textMuted">
            {isSignup ? "Register for events and host your own in minutes." : "Log in to manage your events and registrations."}
          </p>
          {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{error}</p> : null}
          <form action={isSignup ? "/api/signup" : "/api/login"} method="post" className="mt-6 grid gap-4">
            {next ? <input type="hidden" name="next" value={next} /> : null}
            {invite ? <input type="hidden" name="invite" value={invite} /> : null}
            {isSignup ? <Input label="Full name" name="name" autoComplete="name" /> : null}
            <Input label="Email" name="email" type="email" autoComplete="email" />
            <Input
              label="Password"
              name="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={isSignup ? 8 : undefined}
              hint={isSignup ? "At least 8 characters." : undefined}
            />
            {isSignup ? null : (
              <Link href="/forgot-password" className="-mt-2 justify-self-end text-sm font-medium text-accent hover:underline">
                Forgot password?
              </Link>
            )}
            <button className="mt-2 h-12 rounded-xl bg-accent text-[15px] font-semibold text-accentFg shadow-sm transition hover:brightness-110">
              {isSignup ? "Create account" : "Log in"}
            </button>
          </form>
          <p className="mt-6 text-center text-sm text-textMuted">
            {isSignup ? "Already have an account? " : "New to Evently? "}
            <Link href={other} className="font-semibold text-accent hover:underline">
              {isSignup ? "Log in" : "Create an account"}
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}

function Input({
  label,
  name,
  type = "text",
  autoComplete,
  minLength,
  hint,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  minLength?: number;
  hint?: string;
}): JSX.Element {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        required
        autoComplete={autoComplete}
        minLength={minLength}
        className="h-11 rounded-xl border border-border bg-bg px-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
      {hint ? <span className="text-xs text-textMuted">{hint}</span> : null}
    </label>
  );
}
