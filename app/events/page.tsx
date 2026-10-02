import Link from "next/link";
import type { Metadata } from "next";
import { Search, SlidersHorizontal } from "lucide-react";
import EventCard from "@/components/EventCard";
import EmptyState from "@/components/EmptyState";
import { CATEGORIES, categoryLabel, isCategory } from "@/lib/categories";
import { listPublishedEvents, type DateFilter, type EventRow } from "@/lib/events";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: { absolute: "Upcoming Events to Attend and Register | Evently" },
  description:
    "Browse upcoming events by category and date, then register with your name, email and phone. Technology, Business, Music and more.",
};

const WHEN: { value: DateFilter; label: string }[] = [
  { value: "any", label: "Any date" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v) ?? "";
}

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}): Promise<JSX.Element> {
  const q = one(searchParams.q).trim().slice(0, 100);
  const rawCategory = one(searchParams.category);
  const category = isCategory(rawCategory) ? rawCategory : "";
  const rawWhen = one(searchParams.when);
  const when: DateFilter = WHEN.some((w) => w.value === rawWhen) ? (rawWhen as DateFilter) : "any";

  let events: EventRow[] = [];
  let failed = false;
  try {
    events = await listPublishedEvents({ q, category, when });
  } catch (e) {
    failed = true;
    console.error("[events] list failed", (e as { code?: string })?.code ?? "unknown");
  }
  const filtered = Boolean(q || category || when !== "any");

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="animate-fade-in-up">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          {category ? `${categoryLabel(category)} events` : "Explore events"}
        </h1>
        <p className="mt-2 max-w-prose text-textMuted">Search upcoming events and filter by category or date.</p>
      </div>

      <form action="/events" className="mt-8 grid gap-3 rounded-2xl border border-border bg-surface p-3 shadow-card md:grid-cols-[1fr_200px_180px_auto]">
        <label className="flex min-w-0 items-center gap-2 rounded-xl border border-border bg-bg px-3">
          <Search className="h-4 w-4 shrink-0 text-textMuted" aria-hidden />
          <span className="sr-only">Search</span>
          <input name="q" defaultValue={q} placeholder="Search events, cities, venues" className="h-11 min-w-0 flex-1 bg-transparent outline-none placeholder:text-textMuted" />
        </label>
        <label className="min-w-0">
          <span className="sr-only">Category</span>
          <select name="category" defaultValue={category} className="h-11 w-full rounded-xl border border-border bg-bg px-3 outline-none">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>{c.label}</option>
            ))}
          </select>
        </label>
        <label className="min-w-0">
          <span className="sr-only">Date</span>
          <select name="when" defaultValue={when} className="h-11 w-full rounded-xl border border-border bg-bg px-3 outline-none">
            {WHEN.map((w) => (
              <option key={w.value} value={w.value}>{w.label}</option>
            ))}
          </select>
        </label>
        <button className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accentFg transition hover:brightness-110">
          <SlidersHorizontal className="h-4 w-4" aria-hidden /> Apply
        </button>
      </form>

      <div className="mt-5 flex flex-wrap items-center gap-2">
        <CategoryPill href={buildHref(q, "", when)} active={!category} label="All" />
        {CATEGORIES.map((c) => (
          <CategoryPill key={c.slug} href={buildHref(q, c.slug, when)} active={category === c.slug} label={c.label} />
        ))}
      </div>

      <div className="mt-8">
        {failed ? (
          <EmptyState title="Events are unavailable right now" body="We could not load events. Please try again in a moment." />
        ) : events.length === 0 ? (
          <EmptyState
            title="No events match your filters"
            body="Try a different search, another category, or a wider date range."
            action={filtered ? <Link href="/events" className="inline-flex h-10 items-center rounded-xl border border-border bg-surface px-4 text-sm font-semibold hover:bg-surface2">Clear filters</Link> : undefined}
          />
        ) : (
          <>
            <p className="mb-4 text-sm text-textMuted">{events.length} {events.length === 1 ? "event" : "events"}</p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function buildHref(q: string, category: string, when: string): string {
  const p = new URLSearchParams();
  if (q) p.set("q", q);
  if (category) p.set("category", category);
  if (when && when !== "any") p.set("when", when);
  const s = p.toString();
  return s ? `/events?${s}` : "/events";
}

function CategoryPill({ href, active, label }: { href: string; active: boolean; label: string }): JSX.Element {
  return (
    <Link
      href={href}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
        active ? "bg-text text-bg" : "border border-border bg-surface text-textMuted hover:text-text"
      }`}
    >
      {label}
    </Link>
  );
}
