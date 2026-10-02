import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, Eye, MapPin, Pencil, Plus, Trash2, Users } from "lucide-react";
import EventBanner from "@/components/EventBanner";
import EmptyState from "@/components/EmptyState";
import ConfirmSubmit from "@/components/ConfirmSubmit";
import { requireUserPage } from "@/lib/auth";
import { deleteEventAction } from "@/lib/event-actions";
import { listOrganizerEvents } from "@/lib/events";
import { formatDate, formatPrice, formatTime } from "@/lib/format";
import { categoryLabel } from "@/lib/categories";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My events" };

export default async function MyEventsPage({
  searchParams,
}: {
  searchParams: { saved?: string; deleted?: string };
}): Promise<JSX.Element> {
  const user = await requireUserPage("/my-events");
  const events = await listOrganizerEvents(user.id);
  const notice = searchParams.saved === "draft" ? "Draft saved. Publish it when you are ready." : searchParams.deleted ? "Event deleted." : null;

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="animate-fade-in-up flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">My events</h1>
          <p className="mt-2 text-textMuted">Events you are organizing, drafts included.</p>
        </div>
        <Link href="/events/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-accentFg shadow-sm transition hover:brightness-110">
          <Plus className="h-4 w-4" /> Create event
        </Link>
      </div>
      {notice ? <p className="mt-6 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900 ring-1 ring-emerald-200">{notice}</p> : null}

      <div className="mt-8 grid gap-4">
        {events.length === 0 ? (
          <EmptyState
            title="You have not created any events yet"
            body="Create your first event. Save it as a draft or publish it straight to the Events page."
            action={<Link href="/events/new" className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accentFg">Create event</Link>}
          />
        ) : (
          events.map((e) => (
            <article key={e.id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card sm:flex-row">
              <EventBanner bannerUrl={e.banner_url} category={e.category} title={e.title} className="aspect-[16/9] w-full shrink-0 sm:aspect-auto sm:w-52" />
              <div className="flex min-w-0 flex-1 flex-col gap-3 p-5 md:flex-row md:items-center">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${e.status === "published" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                      {e.status === "published" ? "Published" : "Draft"}
                    </span>
                    <span className="text-xs text-textMuted">{categoryLabel(e.category)} · {formatPrice(e.price_cents)}</span>
                  </div>
                  <h2 className="mt-2 truncate text-lg font-semibold tracking-tight">{e.title}</h2>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-textMuted">
                    <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(e.starts_at)} · {formatTime(e.starts_at)}</span>
                    <span className="flex min-w-0 items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{e.location}</span></span>
                    <span className="flex items-center gap-1.5"><Users className="h-3.5 w-3.5" /> {e.seats_taken} / {e.capacity} registered</span>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  <Link href={`/events/${e.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface2">
                    <Eye className="h-4 w-4" /> View
                  </Link>
                  <Link href={`/events/${e.id}/edit`} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-medium hover:bg-surface2">
                    <Pencil className="h-4 w-4" /> Edit
                  </Link>
                  <form action={deleteEventAction}>
                    <input type="hidden" name="event_id" value={e.id} />
                    <ConfirmSubmit
                      message="Delete this event? Its registrations will be removed too. This cannot be undone."
                      className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 px-3 text-sm font-medium text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" /> Delete
                    </ConfirmSubmit>
                  </form>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
