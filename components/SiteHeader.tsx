import Link from "next/link";
import { CalendarDays, ChevronDown, LogOut, Menu, Plus, Ticket, User } from "lucide-react";
import Avatar from "@/components/Avatar";
import { viewer } from "@/lib/viewer";

export function Logo(): JSX.Element {
  return (
    <Link href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent text-accentFg">
        <CalendarDays className="h-[18px] w-[18px]" aria-hidden />
      </span>
      Evently
    </Link>
  );
}

export default async function SiteHeader(): Promise<JSX.Element> {
  const user = await viewer();
  return (
    <header className="sticky top-0 z-30 border-b border-border bg-bg/80 backdrop-blur supports-[backdrop-filter]:bg-bg/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Logo />
          <nav className="hidden items-center gap-1 text-sm font-medium text-textMuted md:flex">
            <Link href="/events" className="rounded-lg px-3 py-2 transition hover:bg-surface2 hover:text-text">
              Explore events
            </Link>
            {user ? (
              <>
                <Link href="/my-events" className="rounded-lg px-3 py-2 transition hover:bg-surface2 hover:text-text">
                  My events
                </Link>
                <Link href="/my-registrations" className="rounded-lg px-3 py-2 transition hover:bg-surface2 hover:text-text">
                  My registrations
                </Link>
              </>
            ) : null}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/events/new"
            className="hidden h-10 items-center gap-1.5 rounded-xl bg-accent px-4 text-sm font-semibold text-accentFg shadow-sm transition hover:brightness-110 sm:inline-flex"
          >
            <Plus className="h-4 w-4" aria-hidden /> Create event
          </Link>
          {user ? (
            <details className="group relative">
              <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-full p-0.5 pr-2 transition hover:bg-surface2 [&::-webkit-details-marker]:hidden">
                <Avatar name={user.name || user.email} url={user.avatar_url} />
                <ChevronDown className="h-4 w-4 text-textMuted transition group-open:rotate-180" aria-hidden />
              </summary>
              <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-2xl border border-border bg-surface p-1.5 shadow-lift">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-semibold">{user.name || "Your account"}</p>
                  <p className="truncate text-xs text-textMuted">{user.email}</p>
                </div>
                <div className="my-1 h-px bg-border" />
                <MenuLink href="/profile" icon={<User className="h-4 w-4" />} label="Profile" />
                <MenuLink href="/my-events" icon={<CalendarDays className="h-4 w-4" />} label="My events" />
                <MenuLink href="/my-registrations" icon={<Ticket className="h-4 w-4" />} label="My registrations" />
                <MenuLink href="/events/new" icon={<Plus className="h-4 w-4" />} label="Create event" />
                <div className="my-1 h-px bg-border" />
                <form action="/api/logout" method="post">
                  <button className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-textMuted transition hover:bg-surface2 hover:text-text">
                    <LogOut className="h-4 w-4" aria-hidden /> Log out
                  </button>
                </form>
              </div>
            </details>
          ) : (
            <>
              <Link href="/login" className="hidden rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-surface2 sm:inline-flex">
                Log in
              </Link>
              <Link
                href="/signup"
                className="inline-flex h-10 items-center rounded-xl bg-text px-4 text-sm font-semibold text-bg transition hover:opacity-90"
              >
                Sign up
              </Link>
            </>
          )}
          <details className="group relative md:hidden">
            <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-xl transition hover:bg-surface2 [&::-webkit-details-marker]:hidden">
              <Menu className="h-5 w-5" aria-label="Menu" />
            </summary>
            <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-border bg-surface p-1.5 shadow-lift">
              <MenuLink href="/events" label="Explore events" />
              <MenuLink href="/events/new" label="Create event" />
              {user ? (
                <>
                  <MenuLink href="/my-events" label="My events" />
                  <MenuLink href="/my-registrations" label="My registrations" />
                </>
              ) : (
                <MenuLink href="/login" label="Log in" />
              )}
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}

function MenuLink({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }): JSX.Element {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-textMuted transition hover:bg-surface2 hover:text-text">
      {icon}
      {label}
    </Link>
  );
}
