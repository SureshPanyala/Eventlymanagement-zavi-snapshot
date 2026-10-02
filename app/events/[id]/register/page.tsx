import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, MapPin, Ticket } from "lucide-react";
import EventBanner from "@/components/EventBanner";
import CategoryBadge from "@/components/CategoryBadge";
import { SIGNUP_PAGE, currentUser, requireUserPage } from "@/lib/auth";
import { getEvent, getUserRegistration, registerForEvent } from "@/lib/events";
import { formatDate, formatPrice, formatTime } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Register" };

const ERRORS: Record<string, string> = {
  input: "Please enter your name, a valid email and a phone number.",
  full: "Sorry, this event just filled up.",
  past: "This event has already taken place.",
  not_found: "This event is not open for registration.",
  server: "Something went wrong. Please try again.",
};

async function register(formData: FormData): Promise<void> {
  "use server";
  const eventId = Number(formData.get("event_id"));
  const user = await currentUser();
  if (!user) redirect(`${SIGNUP_PAGE}?next=${encodeURIComponent(`/events/${eventId}/register`)}`);
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const email = String(formData.get("email") ?? "").trim().toLowerCase().slice(0, 254);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 30);
  const base = `/events/${eventId}/register`;
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^[+()\d\s.-]{7,30}$/.test(phone)) {
    redirect(`${base}?error=input`);
  }
  let outcome: string;
  try {
    const result = await registerForEvent(eventId, user.id, { name, email, phone });
    outcome = result.ok || result.reason === "already" ? "done" : result.reason;
  } catch (e) {
    console.error("[register] failed", (e as { code?: string })?.code ?? "unknown");
    outcome = (e as { code?: string })?.code === "23505" ? "done" : "server";
  }
  redirect(outcome === "done" ? base : `${base}?error=${outcome}`);
}

export default async function RegisterPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}): Promise<JSX.Element> {
  const user = await requireUserPage(`/events/${Number(params.id)}/register`, SIGNUP_PAGE);
  const event = await getEvent(Number(params.id), user.id);
  if (!event || event.status !== "published") notFound();
  const registration = await getUserRegistration(event.id, user.id);
  const error = typeof searchParams.error === "string" ? ERRORS[searchParams.error] ?? null : null;
  const seatsLeft = Math.max(0, event.capacity - event.seats_taken);

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <Link href={`/events/${event.id}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-textMuted hover:text-text">
        <ArrowLeft className="h-4 w-4" /> Back to event
      </Link>

      {registration ? (
        <section className="animate-fade-in-up mx-auto mt-8 max-w-xl rounded-3xl border border-border bg-surface p-8 text-center shadow-lift">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-8 w-8" />
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight">You are registered!</h1>
          <p className="mt-2 text-textMuted">
            See you at <span className="font-semibold text-text">{event.title}</span>. Keep your registration ID handy.
          </p>
          <div className="mt-6 rounded-2xl border border-dashed border-accent/50 bg-accent/5 p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-textMuted">Registration ID</p>
            <p className="mt-1 font-mono text-3xl font-bold tracking-wider text-accent">{registration.registration_code}</p>
          </div>
          <div className="mt-6 grid gap-2 text-left text-sm text-textMuted">
            <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0" /> {formatDate(event.starts_at)} · {formatTime(event.starts_at)}</span>
            <span className="flex min-w-0 items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> <span className="truncate">{event.location}</span></span>
            <span className="flex min-w-0 items-center gap-2"><Ticket className="h-4 w-4 shrink-0" /> <span className="truncate">{registration.attendee_name} · {registration.attendee_email}</span></span>
          </div>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link href="/my-registrations" className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-5 text-sm font-semibold text-accentFg">
              View my registrations
            </Link>
            <Link href="/events" className="inline-flex h-11 items-center justify-center rounded-xl border border-border px-5 text-sm font-semibold hover:bg-surface2">
              Explore more events
            </Link>
          </div>
        </section>
      ) : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_380px]">
          <section className="animate-fade-in-up min-w-0 rounded-3xl border border-border bg-surface p-6 shadow-card sm:p-8">
            <h1 className="text-3xl font-bold tracking-tight">Register for this event</h1>
            <p className="mt-1 text-textMuted">Check the details, then confirm your spot.</p>
            {error ? <p className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-200">{error}</p> : null}
            <form action={register} className="mt-6 grid gap-4">
              <input type="hidden" name="event_id" value={event.id} />
              <Field label="Full name" name="name" defaultValue={user.name} autoComplete="name" />
              <Field label="Email" name="email" type="email" defaultValue={user.email} autoComplete="email" />
              <Field label="Phone number" name="phone" type="tel" placeholder="+1 555 010 2030" autoComplete="tel" />
              <button
                disabled={seatsLeft === 0}
                className="mt-2 flex h-12 items-center justify-center gap-2 rounded-xl bg-accent text-[15px] font-semibold text-accentFg shadow-sm transition hover:brightness-110 disabled:opacity-50"
              >
                <Ticket className="h-4 w-4" /> Confirm registration
              </button>
              <p className="text-center text-xs text-textMuted">No payment is taken here. You will get a registration ID right away.</p>
            </form>
          </section>

          <aside className="min-w-0">
            <div className="overflow-hidden rounded-3xl border border-border bg-surface shadow-card">
              <div className="relative">
                <EventBanner bannerUrl={event.banner_url} category={event.category} title={event.title} className="aspect-[16/9] w-full" />
                <CategoryBadge category={event.category} className="absolute left-3 top-3" />
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-textMuted">Event summary</p>
                <h2 className="mt-1 line-clamp-2 break-words text-lg font-bold tracking-tight">{event.title}</h2>
                <div className="mt-4 grid gap-2 text-sm text-textMuted">
                  <span className="flex items-center gap-2"><CalendarDays className="h-4 w-4 shrink-0" /> {formatDate(event.starts_at)}</span>
                  <span className="flex items-center gap-2"><Clock className="h-4 w-4 shrink-0" /> {formatTime(event.starts_at)}</span>
                  <span className="flex min-w-0 items-center gap-2"><MapPin className="h-4 w-4 shrink-0" /> <span className="truncate">{event.location}</span></span>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-border pt-4 text-sm">
                  <span className="text-textMuted">{seatsLeft} seats left</span>
                  <span className="font-display text-lg font-bold">{formatPrice(event.price_cents)}</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}

function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  defaultValue?: string;
  placeholder?: string;
  autoComplete?: string;
}): JSX.Element {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        required
        defaultValue={defaultValue}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="h-11 rounded-xl border border-border bg-bg px-3 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
      />
    </label>
  );
}
