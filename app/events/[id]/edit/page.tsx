import type { Metadata } from "next";
import { notFound } from "next/navigation";
import EventForm, { EVENT_FORM_ERRORS } from "@/components/EventForm";
import { requireUserPage } from "@/lib/auth";
import { getEvent } from "@/lib/events";
import { toDateTimeParts } from "@/lib/format";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Edit event" };

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { error?: string };
}): Promise<JSX.Element> {
  const user = await requireUserPage(`/events/${Number(params.id)}/edit`);
  const event = await getEvent(Number(params.id), user.id);
  if (!event || event.organizer_id !== user.id) notFound();
  const { date, time } = toDateTimeParts(event.starts_at);
  const error = typeof searchParams.error === "string" ? EVENT_FORM_ERRORS[searchParams.error] ?? null : null;
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="animate-fade-in-up">
        <h1 className="text-4xl font-bold tracking-tight">Edit event</h1>
        <p className="mt-2 break-words text-textMuted">{event.title}</p>
      </div>
      <div className="mt-8">
        <EventForm
          error={error}
          values={{
            id: event.id,
            title: event.title,
            banner_url: event.banner_url ?? "",
            category: event.category,
            date,
            time,
            location: event.location,
            description: event.description,
            capacity: String(event.capacity),
            price: (event.price_cents / 100).toString(),
            status: event.status,
          }}
        />
      </div>
    </main>
  );
}
