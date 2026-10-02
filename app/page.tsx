import Link from "next/link";
import { ArrowRight, CalendarCheck, LogIn, MapPin, Plus, Search, Ticket, Users } from "lucide-react";
import EventCard from "@/components/EventCard";
import EventBanner from "@/components/EventBanner";
import CategoryIcon from "@/components/CategoryIcon";
import CategoryBadge from "@/components/CategoryBadge";
import EmptyState from "@/components/EmptyState";
import { CATEGORIES } from "@/lib/categories";
import { categoryCounts, listFeaturedEvents, listPublishedEvents, type EventRow } from "@/lib/events";
import { formatDate, formatPrice, formatTime } from "@/lib/format";
import { viewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

async function loadHome(): Promise<{ featured: EventRow[]; upcoming: EventRow[]; counts: Record<string, number> }> {
  try {
    const [featured, upcoming, counts] = await Promise.all([listFeaturedEvents(3), listPublishedEvents({}, 6), categoryCounts()]);
    return { featured, upcoming, counts };
  } catch (e) {
    console.error("[home] load failed", (e as { code?: string })?.code ?? "unknown");
    return { featured: [], upcoming: [], counts: {} };
  }
}

export default async function Home(): Promise<JSX.Element> {
  const [{ featured, upcoming, counts }, user] = await Promise.all([loadHome(), viewer()]);
  const spotlight = featured[0];
  return (
    <main>
      <section className="relative overflow-hidden border-b border-border">
        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/10 blur-3xl" aria-hidden />
        <div className="pointer-events-none absolute -bottom-40 -left-24 h-80 w-80 rounded-full bg-amber-300/20 blur-3xl" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 md:py-24 lg:grid-cols-[1.1fr_1fr]">
          <div className="animate-fade-in-up min-w-0">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-semibold text-textMuted">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" /> New events added every week
            </span>
            <h1 className="mt-5 text-4xl font-bold tracking-tight md:text-6xl md:leading-[1.05]">
              Find the events worth <span className="text-accent">showing up</span> for.
            </h1>
            <p className="mt-5 max-w-prose text-[17px] text-textMuted">
              Conferences, concerts, workshops and meetups, all in one place. Register in seconds, keep every ticket together, and host your own events when you are ready.
            </p>
            <form action="/events" className="mt-8 flex max-w-lg items-center gap-2 rounded-2xl border border-border bg-surface p-1.5 shadow-card">
              <Search className="ml-2.5 h-5 w-5 shrink-0 text-textMuted" aria-hidden />
              <label htmlFor="hero-q" className="sr-only">Search events</label>
              <input
                id="hero-q"
                name="q"
                placeholder="Search by event, city or venue"
                className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-textMuted"
              />
              <button className="h-10 shrink-0 rounded-xl bg-accent px-4 text-sm font-semibold text-accentFg transition hover:brightness-110">
                Search
              </button>
            </form>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/events" className="inline-flex h-12 items-center gap-2 rounded-xl bg-text px-6 text-[15px] font-semibold text-bg transition hover:opacity-90">
                Explore events <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link href="/events/new" className="inline-flex h-12 items-center gap-2 rounded-xl border border-border bg-surface px-6 text-[15px] font-semibold transition hover:bg-surface2">
                <Plus className="h-4 w-4" aria-hidden /> Create event
              </Link>
              {user ? null : (
                <Link href="/login" className="inline-flex h-12 items-center gap-2 rounded-xl px-5 text-[15px] font-semibold text-textMuted transition hover:bg-surface2 hover:text-text">
                  <LogIn className="h-4 w-4" aria-hidden /> Log in
                </Link>
              )}
            </div>
          </div>

          {spotlight ? (
            <div className="animate-fade-in-up-delay relative min-w-0">
              <Link href={`/events/${spotlight.id}`} className="group block overflow-hidden rounded-3xl border border-border bg-surface shadow-lift">
                <div className="relative">
                  <EventBanner bannerUrl={spotlight.banner_url} category={spotlight.category} title={spotlight.title} className="aspect-[16/10] w-full" large />
                  <CategoryBadge category={spotlight.category} className="absolute left-4 top-4" />
                  <span className="absolute right-4 top-4 rounded-full bg-surface px-3 py-1 text-xs font-bold text-accent shadow-sm">Featured</span>
                </div>
                <div className="p-5">
                  <h2 className="line-clamp-2 break-words text-xl font-bold tracking-tight group-hover:text-accent">{spotlight.title}</h2>
                  <div className="mt-3 grid gap-1.5 text-sm text-textMuted">
                    <span className="flex min-w-0 items-center gap-2"><CalendarCheck className="h-4 w-4 shrink-0" /> <span className="truncate">{formatDate(spotlight.starts_at)} · {formatTime(spotlight.starts_at)}</span></span>
                    <span className="flex min-w-0 items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> <span className="truncate">{spotlight.location}</span></span>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                    <span className="flex items-center gap-2 text-sm text-textMuted">
                      <Users className="h-4 w-4" /> {Math.max(0, spotlight.capacity - spotlight.seats_taken)} of {spotlight.capacity} seats left
                    </span>
                    <span className="font-display text-lg font-bold">{formatPrice(spotlight.price_cents)}</span>
                  </div>
                </div>
              </Link>
              <div className="absolute -bottom-5 -left-3 hidden items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3 shadow-lift sm:flex">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-accent"><Ticket className="h-4 w-4" /></span>
                <div className="text-xs">
                  <p className="font-semibold text-text">Registered in seconds</p>
                  <p className="text-textMuted">Your ID arrives instantly</p>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <SectionHead title="Browse by category" subtitle="Pick a scene and see what is coming up." />
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {CATEGORIES.map((c) => (
            <Link
              key={c.slug}
              href={`/events?category=${c.slug}`}
              className="group flex min-w-0 flex-col rounded-2xl border border-border bg-surface p-4 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lift"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition group-hover:bg-accent group-hover:text-accentFg">
                <CategoryIcon category={c.slug} className="h-5 w-5" />
              </span>
              <span className="mt-4 font-display font-semibold tracking-tight">{c.label}</span>
              <span className="mt-0.5 line-clamp-2 text-xs text-textMuted">{c.blurb}</span>
              <span className="mt-3 text-xs font-semibold text-accent">{counts[c.slug] ?? 0} upcoming</span>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
          <SectionHead title="Featured events" subtitle="Hand-picked highlights you will not want to miss." href="/events" />
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <SectionHead title="Upcoming events" subtitle="The next things happening on Evently." href="/events" />
        <div className="mt-6">
          {upcoming.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No upcoming events yet"
              body="Be the first to put something on the calendar."
              action={<Link href="/events/new" className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accentFg">Create event</Link>}
            />
          )}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
        <div className="relative overflow-hidden rounded-3xl bg-text px-6 py-12 text-bg sm:px-12">
          <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent/40 blur-3xl" aria-hidden />
          <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Hosting something? Put it on Evently.</h2>
              <p className="mt-2 max-w-prose text-bg/70">Create a page in minutes, save it as a draft until it is ready, then publish and watch the seats fill up.</p>
            </div>
            <Link href="/events/new" className="inline-flex h-12 items-center gap-2 rounded-xl bg-accent px-6 text-[15px] font-semibold text-accentFg transition hover:brightness-110">
              <Plus className="h-4 w-4" /> Create your event
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function SectionHead({ title, subtitle, href }: { title: string; subtitle: string; href?: string }): JSX.Element {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h2>
        <p className="mt-1 text-textMuted">{subtitle}</p>
      </div>
      {href ? (
        <Link href={href} className="hidden shrink-0 items-center gap-1 text-sm font-semibold text-accent hover:underline sm:inline-flex">
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      ) : null}
    </div>
  );
}
