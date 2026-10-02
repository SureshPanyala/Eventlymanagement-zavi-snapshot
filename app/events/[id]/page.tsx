import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, MapPin, Pencil, Ticket, Users } from "lucide-react";
import EventBanner from "@/components/EventBanner";
import EventCard from "@/components/EventCard";
import CategoryBadge from "@/components/CategoryBadge";
import { getEvent, getUserRegistration, relatedEvents } from "@/lib/events";
import { eventMetaDescription, formatDate, formatPrice, formatTime } from "@/lib/format";
import { viewer } from "@/lib/viewer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const event = await getEvent(Number(params.id), null).catch(() => null);
  if (!event) return { title: "Event" };
  return { title: event.title, description: eventMetaDescription(event) };
}

export default async function EventDetailPage({ params }: { params: { id: string } }): Promise<JSX.Element> {
  const user = await viewer();
  const event = await getEvent(Number(params.id), user?.id ?? null);
  if (!event) notFound();

  const [related, registration] = await Promise.all([
    relatedEvents(event, 3),
    user ? getUserRegistration(event.id, user.id) : Promise.resolve(null),
  ]);
  const seatsLeft = Math.max(0, event.capacity - event.seats_taken);
  const isPast = new Date(event.starts_at).getTime() < Date.now();
  const isOwner = user?.id === event.organizer_id;
  const isDraft = event.status === "draft";
  const pct = Math.min(100, Math.round((event.seats_taken / event.capacity) * 100));

  let blockReason: string | null = null;
  if (isDraft) blockReason = "This event is a draft. Publish it to open registration.";
  else if (registration) blockReason = null;
  else if (isPast) blockReason = "This event has already taken place.";
  else if (seatsLeft === 0) blockReason = "This event is fully booked.";

  return (
    <main>
      <div className="relative">
        <EventBanner bannerUrl={event.banner_url} category={event.category} title={event.title} className="h-64 w-full sm:h-80 md:h-[420px]" large />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/50 to-transparent" aria-hidden />
        <div className="absolute left-0 right-0 top-4 mx-auto max-w-6xl px-4 sm:px-6">
          <Link href="/events" className="inline-flex items-center gap-1.5 rounded-full bg-surface/90 px-3 py-1.5 text-sm font-semibold shadow-sm backdrop-blur transition hover:bg-surface">
            <ArrowLeft className="h-4 w-4" /> All events
          </Link>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-[1fr_360px]">
        <div className="animate-fade-in-up min-w-0 pt-8">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryBadge category={event.category} />
            {isDraft ? <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">Draft</span> : null}
            {event.is_featured ? <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">Featured</span> : null}
          </div>
          <h1 className="mt-4 break-words text-3xl font-bold tracking-tight [overflow-wrap:anywhere] md:text-5xl md:leading-[1.08]">{event.title}</h1>
          <p className="mt-3 text-textMuted">
            Organized by <span className="font-semibold text-text">{event.organizer_name}</span>
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <Fact icon={<CalendarDays className="h-5 w-5" />} label="Date" value={formatDate(event.starts_at)} />
            <Fact icon={<Clock className="h-5 w-5" />} label="Time" value={formatTime(event.starts_at)} />
            <Fact icon={<MapPin className="h-5 w-5" />} label="Location" value={event.location} />
          </div>

          <h2 className="mt-10 text-2xl font-semibold tracking-tight">About this event</h2>
          <div className="mt-3 max-w-prose whitespace-pre-line break-words text-[16px] leading-[1.7] text-text/90 [overflow-wrap:anywhere]">
            {event.description || "The organizer has not added a description yet."}
          </div>
        </div>

        <aside className="lg:pt-0">
          <div className="rounded-3xl border border-border bg-surface p-6 shadow-lift lg:sticky lg:top-24 lg:-mt-24">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-textMuted">Price</span>
              <span className="font-display text-3xl font-bold">{formatPrice(event.price_cents)}</span>
            </div>
            <div className="mt-5">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium"><Users className="h-4 w-4 text-accent" /> {seatsLeft} of {event.capacity} seats left</span>
                <span className="text-textMuted">{pct}% full</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface2">
                <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>

            <div className="mt-6">
              {registration ? (
                <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900 ring-1 ring-emerald-200">
                  <p className="flex items-center gap-2 font-semibold"><CheckCircle2 className="h-4 w-4" /> You are registered</p>
                  <p className="mt-1">Registration ID <span className="font-mono font-semibold">{registration.registration_code}</span></p>
                  <Link href="/my-registrations" className="mt-2 inline-block font-semibold underline">View my registrations</Link>
                </div>
              ) : blockReason ? (
                <>
                  <button disabled className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-surface2 text-[15px] font-semibold text-textMuted">
                    <Ticket className="h-4 w-4" /> Register now
                  </button>
                  <p className="mt-2 text-center text-sm text-textMuted">{blockReason}</p>
                </>
              ) : (
                <Link
                  href={`/events/${event.id}/register`}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-accent text-[15px] font-semibold text-accentFg shadow-sm transition hover:brightness-110 hover:shadow-md"
                >
                  <Ticket className="h-4 w-4" /> Register now
                </Link>
              )}
            </div>
            {isOwner ? (
              <Link href={`/events/${event.id}/edit`} className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border text-sm font-semibold transition hover:bg-surface2">
                <Pencil className="h-4 w-4" /> Edit event
              </Link>
            ) : null}
            <p className="mt-4 text-center text-xs text-textMuted">No payment is taken on Evently. Prices are set by the organizer.</p>
          </div>
        </aside>
      </div>

      {related.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">You might also like</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((e) => (
              <EventCard key={e.id} event={e} />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function Fact({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }): JSX.Element {
  return (
    <div className="flex min-w-0 items-start gap-3 rounded-2xl border border-border bg-surface p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-medium uppercase tracking-wide text-textMuted">{label}</p>
        <p className="mt-0.5 break-words font-semibold leading-snug">{value}</p>
      </div>
    </div>
  );
}
