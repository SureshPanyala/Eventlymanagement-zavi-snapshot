import Link from "next/link";
import type { Metadata } from "next";
import { CalendarDays, MapPin } from "lucide-react";
import EventBanner from "@/components/EventBanner";
import EmptyState from "@/components/EmptyState";
import { requireUserPage } from "@/lib/auth";
import { listUserRegistrations } from "@/lib/events";
import { formatDate, formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My registrations" };

export default async function MyRegistrationsPage(): Promise<JSX.Element> {
  const user = await requireUserPage("/my-registrations");
  const regs = await listUserRegistrations(user.id);
  const now = Date.now();

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="animate-fade-in-up">
        <h1 className="text-4xl font-bold tracking-tight">My registrations</h1>
        <p className="mt-2 text-textMuted">Every event you have signed up for, with your registration IDs.</p>
      </div>
      <div className="mt-8 grid gap-4">
        {regs.length === 0 ? (
          <EmptyState
            title="No registrations yet"
            body="Find something you love and save your seat. It will show up here."
            action={<Link href="/events" className="inline-flex h-10 items-center rounded-xl bg-accent px-4 text-sm font-semibold text-accentFg">Explore events</Link>}
          />
        ) : (
          regs.map((r) => {
            const past = new Date(r.starts_at).getTime() < now;
            const label = r.status === "cancelled" ? "Cancelled" : past ? "Attended" : "Confirmed";
            const tone = r.status === "cancelled" ? "bg-red-100 text-red-800" : past ? "bg-surface2 text-textMuted" : "bg-emerald-100 text-emerald-800";
            return (
              <Link
                key={r.id}
                href={`/events/${r.event_id}`}
                className="group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-card transition hover:shadow-lift sm:flex-row"
              >
                <EventBanner bannerUrl={r.banner_url} category={r.category} title={r.title} className="aspect-[16/9] w-full shrink-0 sm:aspect-auto sm:w-48" />
                <div className="flex min-w-0 flex-1 flex-col gap-4 p-5 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>{label}</span>
                    <h2 className="mt-2 truncate text-lg font-semibold tracking-tight group-hover:text-accent">{r.title}</h2>
                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-textMuted">
                      <span className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" /> {formatDate(r.starts_at)} · {formatTime(r.starts_at)}</span>
                      <span className="flex min-w-0 items-center gap-1.5"><MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{r.location}</span></span>
                    </div>
                  </div>
                  <div className="shrink-0 rounded-xl border border-dashed border-accent/50 bg-accent/5 px-4 py-2 text-center">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-textMuted">Registration ID</p>
                    <p className="font-mono text-base font-bold text-accent">{r.registration_code}</p>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </main>
  );
}
